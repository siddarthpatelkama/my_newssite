-- Migration: Make user_interactions, story_updates, story_embeddings, and processing_jobs fully operational

-- 1. Disentangle user_interactions from auth.users so password-gated visitors can record interactions
alter table public.user_interactions
  alter column user_id drop not null;

alter table public.user_interactions
  drop constraint if exists user_interactions_user_id_fkey;

-- 2. Add visitor_id and metadata columns if not present for rich interaction logging
alter table public.user_interactions
  add column if not exists visitor_id text,
  add column if not exists metadata jsonb default '{}'::jsonb;

-- 3. Ensure service_role has full read/write on all tables
grant select, insert, update, delete on table public.user_interactions to service_role;
grant select, insert, update, delete on table public.story_updates to service_role;
grant select, insert, update, delete on table public.story_embeddings to service_role;
grant select, insert, update, delete on table public.processing_jobs to service_role;
