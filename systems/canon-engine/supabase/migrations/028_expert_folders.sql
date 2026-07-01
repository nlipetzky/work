-- Migration: expert_folders (the AI-expert-folder registry)
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: operating-sop / capabilities/agents/<domain>-expert (Boris)
-- Purpose:
--   The registry of AI-expert-folders: the domain-scoped libraries of accumulated, operable
--   judgment (recipes/options/rulings) that the SOP steward composes and the human supervises.
--   folder_slug is the stable, IMMUTABLE key that expert_motions.target_ref points at when
--   target_type='ai_expert_folder' (the membrane seam Hermes left in 024). Overlays compose via
--   parent_folder_slug (e.g. revops-biotech.parent = revops). First tenant: revops.

create extension if not exists pgcrypto;

create table public.expert_folders (
  folder_slug         text primary key,                  -- immutable; the value expert_motions.target_ref points at
  name                text not null,
  domain              text not null,                      -- 'revops'
  parent_folder_slug  text references public.expert_folders(folder_slug) on delete set null,
  owning_system_slug  text,                               -- loose ref to public.systems.system_slug
  status              text not null default 'active' check (status in ('active','draft','deprecated')),
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.expert_folders is
  'AI-expert-folder registry: domain-scoped libraries of accumulated judgment (recipes/options/rulings). folder_slug is the immutable key expert_motions.target_ref points at for target_type=ai_expert_folder. Overlays compose via parent_folder_slug.';

create index expert_folders_domain_idx on public.expert_folders (domain);
create index expert_folders_parent_idx on public.expert_folders (parent_folder_slug);

create trigger expert_folders_set_updated_at
  before update on public.expert_folders
  for each row execute function public.fn_set_updated_at();

alter table public.expert_folders enable row level security;
create policy expert_folders_service_all
  on public.expert_folders for all to service_role using (true) with check (true);
