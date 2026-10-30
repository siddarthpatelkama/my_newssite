-- Migration: Add historical timeline and story relationship tracking
-- Enables connecting current stories with historical incidents and stories across days/weeks/months

alter table public.stories
  add column if not exists related_story_ids uuid[] default '{}',
  add column if not exists timeline jsonb default '[]'::jsonb;

alter table public.story_updates
  add column if not exists related_story_id uuid references public.stories(id) on delete set null;

create index if not exists story_updates_story_id_idx
  on public.story_updates(story_id, created_at desc);

create index if not exists stories_last_updated_idx
  on public.stories(last_updated_at desc);

create index if not exists stories_first_seen_idx
  on public.stories(first_seen_at desc);
