create extension if not exists vector;
create extension if not exists pgcrypto;

create table public.newsletters (
  id uuid primary key default gen_random_uuid(),
  sender_email text not null unique,
  sender_name text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.emails (
  id uuid primary key default gen_random_uuid(),
  gmail_message_id text not null unique,
  gmail_thread_id text,
  newsletter_id uuid references public.newsletters(id),
  subject text,
  received_at timestamptz,
  body_text text,
  body_html text,
  processing_status text not null default 'pending'
    check (processing_status in (
      'pending', 'processing', 'processed', 'failed', 'ignored'
    )),
  error_message text,
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  email_id uuid not null references public.emails(id)
    on delete cascade,
  title text not null,
  canonical_url text,
  source_name text,
  published_at timestamptz,
  content_text text,
  content_hash text,
  created_at timestamptz not null default now()
);

create unique index articles_email_url_unique
  on public.articles(email_id, canonical_url)
  where canonical_url is not null;

create unique index articles_content_hash_unique
  on public.articles(content_hash)
  where content_hash is not null;

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  canonical_title text not null,
  summary text,
  why_it_matters text,
  category text,
  key_points jsonb not null default '[]'::jsonb,
  entities jsonb not null default '[]'::jsonb,
  source_claims jsonb not null default '[]'::jsonb,
  novelty_score real,
  quality_score real,
  first_seen_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now()
);

create table public.story_sources (
  story_id uuid not null references public.stories(id)
    on delete cascade,
  article_id uuid not null references public.articles(id)
    on delete cascade,
  primary key (story_id, article_id)
);

create table public.story_updates (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id)
    on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.user_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id)
    on delete cascade,
  story_id uuid not null references public.stories(id)
    on delete cascade,
  action text not null check (action in (
    'view', 'save', 'like', 'dislike', 'skip'
  )),
  created_at timestamptz not null default now()
);

create table public.daily_briefings (
  id uuid primary key default gen_random_uuid(),
  edition_date date not null unique,
  title text not null,
  introduction text,
  sections jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'failed')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.dashboard_configs (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null unique references public.daily_briefings(id)
    on delete cascade,
  config jsonb not null,
  created_at timestamptz not null default now()
);

create table public.sync_state (
  id text primary key default 'gmail',
  history_id text,
  last_synced_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  attempts integer not null default 0,
  next_retry_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gmail_credentials (
  id text primary key default 'default',
  account_email text,
  encrypted_refresh_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_embeddings (
  story_id uuid primary key references public.stories(id) on delete cascade,
  embedding vector(768),
  model text not null,
  updated_at timestamptz not null default now()
);

insert into public.sync_state (id) values ('gmail')
on conflict (id) do nothing;

alter table public.newsletters enable row level security;
alter table public.emails enable row level security;
alter table public.articles enable row level security;
alter table public.stories enable row level security;
alter table public.story_sources enable row level security;
alter table public.story_updates enable row level security;
alter table public.user_interactions enable row level security;
alter table public.daily_briefings enable row level security;
alter table public.dashboard_configs enable row level security;
alter table public.sync_state enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.gmail_credentials enable row level security;
alter table public.story_embeddings enable row level security;

-- App reads go through the password-gated server. No browser role may read
-- mailbox-derived content directly from the Supabase Data API.

create policy "interactions_own"
  on public.user_interactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Raw mail, credentials, jobs, and sync state stay backend-only
-- (service role bypasses RLS).
