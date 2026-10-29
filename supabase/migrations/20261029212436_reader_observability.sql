create table if not exists public.reader_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  session_id uuid not null,
  event_type text not null check (event_type in (
    'page_view', 'read_session', 'like', 'dislike', 'understood', 'needs_context'
  )),
  story_id uuid references public.stories(id) on delete set null,
  path text not null check (
    path in ('/', '/feed', '/search', '/saved', '/settings')
    or path ~ '^/stories/[0-9a-fA-F-]{36}$'
  ),
  active_seconds integer check (active_seconds between 0 and 86400),
  scroll_count integer check (scroll_count between 0 and 10000),
  max_scroll_percent integer check (max_scroll_percent between 0 and 100),
  created_at timestamptz not null default now(),
  check (
    (event_type = 'read_session' and active_seconds is not null)
    or (event_type <> 'read_session' and active_seconds is null and scroll_count is null and max_scroll_percent is null)
  ),
  check (event_type not in ('like', 'dislike', 'understood', 'needs_context') or story_id is not null)
);

create index if not exists reader_events_created_at_idx
  on public.reader_events (created_at desc);
create index if not exists reader_events_type_created_at_idx
  on public.reader_events (event_type, created_at desc);
create index if not exists reader_events_story_type_idx
  on public.reader_events (story_id, event_type, created_at desc);

create table if not exists public.otel_spans (
  trace_id text not null check (trace_id ~ '^[0-9a-f]{32}$'),
  span_id text not null check (span_id ~ '^[0-9a-f]{16}$'),
  parent_span_id text check (parent_span_id is null or parent_span_id ~ '^[0-9a-f]{16}$'),
  span_name text not null check (char_length(span_name) between 1 and 120),
  span_kind text not null default 'internal' check (span_kind in ('internal', 'server', 'client', 'producer', 'consumer')),
  status text not null check (status in ('unset', 'ok', 'error')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_ms bigint not null check (duration_ms >= 0),
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  service_name text not null check (char_length(service_name) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key (trace_id, span_id),
  check (end_time >= start_time)
);

create index if not exists otel_spans_created_at_idx on public.otel_spans (created_at desc);
create index if not exists otel_spans_service_name_created_at_idx on public.otel_spans (service_name, created_at desc);

alter table public.reader_events enable row level security;
alter table public.otel_spans enable row level security;

-- Only the password-gated server and worker use the service role for these tables.
revoke all on table public.reader_events from public, anon, authenticated;
revoke all on table public.otel_spans from public, anon, authenticated;
grant select, insert on table public.reader_events to service_role;
grant select, insert on table public.otel_spans to service_role;
