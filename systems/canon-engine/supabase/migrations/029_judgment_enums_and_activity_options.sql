-- Migration: judgment enums + activity_options (the option catalog)
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: operating-sop / AI-expert-folder (Boris)
-- Purpose:
--   Shared enums for the judgment layer (provenance + standing), and activity_options: the
--   first-class catalog that promotes sop_activities.adapters[] (a bare string array) to real
--   options carrying when-to-use + provenance + standing. An option is an alternative source/tactic
--   for one step (e.g. NIH-SBIR as a discover-companies source). adapters[] is retained as a
--   denormalized cache during transition; the catalog is authoritative. Grown by judgment_units (030);
--   ratification flips standing.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'judgment_provenance') then
    create type public.judgment_provenance as enum ('ai_originated','human_injected','human_corrected');
  end if;
  if not exists (select 1 from pg_type where typname = 'judgment_standing') then
    create type public.judgment_standing as enum ('proposed','active','locked');
  end if;
end $$;

create table public.activity_options (
  id            uuid primary key default gen_random_uuid(),
  activity_id   text not null,                            -- loose ref to sop_activities.activity_id
  option_slug   text not null,                            -- e.g. 'nih-sbir'
  folder_slug   text not null references public.expert_folders(folder_slug),
  kind          text not null default 'source' check (kind in ('source','tactic')),
  name          text not null,
  when_to_use   text,
  config        jsonb not null default '{}'::jsonb,       -- provider params (deepline tool id, etc.)
  priority      int not null default 0,
  provenance    public.judgment_provenance not null,
  standing      public.judgment_standing not null default 'proposed',
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (activity_id, option_slug)
);

comment on table public.activity_options is
  'Option catalog: alternative source/tactic entries for a sop_activities step (promotes the bare adapters[] array). when_to_use guides agent selection; only active|locked options are runner-selectable. Grown by judgment_units; ratification flips standing.';

create index activity_options_activity_idx on public.activity_options (activity_id, standing, priority desc);
create index activity_options_folder_idx on public.activity_options (folder_slug);

create trigger activity_options_set_updated_at
  before update on public.activity_options
  for each row execute function public.fn_set_updated_at();

alter table public.activity_options enable row level security;
create policy activity_options_service_all
  on public.activity_options for all to service_role using (true) with check (true);
