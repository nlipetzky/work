-- Migration: skills registry (canon mirror of filesystem SKILL.md files)
-- Date: 2026-06-29
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Canon-side index of the SKILL.md packages scattered across the operator OS
--   (practices/<p>/skills/, capabilities/skills/, systems/<s>/skills/, and
--   operating-sop persona skills). The filesystem stays the source-of-truth for
--   skill bodies; this table is the queryable mirror used by /operate (slice 2B)
--   and any agent that needs to discover skills by trigger or owner.
--   Sync is driven by `systems/canon-engine/scripts/sync-skills.mjs` which walks
--   the work tree and upserts one row per SKILL.md (slug = parent directory).

create extension if not exists pgcrypto;

create table if not exists public.skills (
  slug              text primary key,
  title             text not null,
  description       text,
  path              text not null,
  owner_system_slug text references public.systems(system_slug),
  status            text not null default 'active'
                      check (status in ('active','draft','deprecated')),
  last_scanned_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.skills is
  'Canon mirror of filesystem SKILL.md files. Slug = parent directory name; path = absolute path. Owner_system_slug is null for capabilities/skills/*. Populated by scripts/sync-skills.mjs.';

create index if not exists skills_owner_idx  on public.skills (owner_system_slug);
create index if not exists skills_status_idx on public.skills (status);

drop trigger if exists skills_set_updated_at on public.skills;
create trigger skills_set_updated_at
  before update on public.skills
  for each row execute function public.fn_set_updated_at();

alter table public.skills enable row level security;
drop policy if exists skills_service_all on public.skills;
create policy skills_service_all
  on public.skills for all to service_role using (true) with check (true);

revoke all on public.skills from public, anon, authenticated;
grant  all on public.skills to service_role;
