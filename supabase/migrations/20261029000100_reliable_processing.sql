-- Keep one article row per source email so repeated coverage retains provenance.
drop index if exists public.articles_content_hash_unique;
create unique index if not exists articles_email_content_hash_unique
  on public.articles(email_id, content_hash)
  where content_hash is not null;

alter table public.emails
  add column if not exists processing_attempts integer not null default 0,
  add column if not exists processing_started_at timestamptz,
  add column if not exists next_retry_at timestamptz;

create index if not exists emails_processing_queue_idx
  on public.emails(processing_status, next_retry_at, received_at desc);

-- Remove the earlier broad authenticated-read policies as a defense-in-depth
-- boundary for direct Data API access. The password-gated server uses service_role.
drop policy if exists "stories_read_authenticated" on public.stories;
drop policy if exists "story_sources_read_authenticated" on public.story_sources;
drop policy if exists "articles_read_authenticated" on public.articles;
drop policy if exists "newsletters_read_authenticated" on public.newsletters;
drop policy if exists "story_updates_read_authenticated" on public.story_updates;
drop policy if exists "briefings_read_published" on public.daily_briefings;
drop policy if exists "dashboard_configs_read_authenticated" on public.dashboard_configs;

-- Claim work atomically. The function is only executable by the backend worker.
create or replace function public.claim_pending_emails(p_limit integer default 10)
returns setof public.emails
language sql
security invoker
set search_path = ''
as $$
  with candidates as (
    select e.id
    from public.emails as e
    where e.processing_status = 'pending'
       or (
         e.processing_status = 'failed'
         and e.processing_attempts < 5
         and (e.next_retry_at is null or e.next_retry_at <= pg_catalog.now())
       )
       or (
         e.processing_status = 'processing'
         and e.processing_started_at < pg_catalog.now() - interval '15 minutes'
       )
    order by e.received_at desc nulls last, e.created_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 100))
  ), claimed as (
    update public.emails as e
    set processing_status = 'processing',
        processing_attempts = e.processing_attempts + 1,
        processing_started_at = pg_catalog.now(),
        next_retry_at = null,
        error_message = null
    from candidates as c
    where e.id = c.id
    returning e.*
  )
  select * from claimed;
$$;

revoke all on function public.claim_pending_emails(integer) from public;
revoke all on function public.claim_pending_emails(integer) from anon, authenticated;
grant execute on function public.claim_pending_emails(integer) to service_role;
