-- Migration: sop_activities (L3 of the three-layer work model)
-- Date: 2026-06-29
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Canon-side table for L3 activities ... the leaf-level executable units that
--   workflows compose. Mirrors the TS Activity interface in
--   systems/operating-sop/sops/types.ts plus a set of slice-2B columns that
--   support the redesigned /operate inspector:
--     - route_component / function_path / trigger_event : wiring to the
--       in-app SystemView, the backing function, and the Inngest event id.
--     - schemas / adapters : the in/out contract names + which providers the
--       activity reaches into.
--     - skills : loose ref to public.skills.slug (no FK ... filesystem stays
--       source-of-truth; sync_skills.mjs lands the rows).
--     - provenance_consumes / provenance_writes : per-field provenance edges.
--     - concurrency / retry : runner posture.
--   Versioning mirrors public.sops/workflows: (activity_id, version) PK with
--   partial unique on activity_id WHERE is_current.

create extension if not exists pgcrypto;

create table if not exists public.sop_activities (
  activity_id           text not null,
  version               int  not null default 1,
  is_current            boolean not null default true,

  -- spine refs (loose text)
  sop_id                text,
  stage_id              text,
  workflow_id           text,

  -- identity
  name                  text not null,
  what                  text not null,
  description           text,

  -- execution shape
  executor_class        text not null
                          check (executor_class in ('automated-tool','agent-loop','human-in-the-loop')),
  owning_system_slug    text references public.systems(system_slug),
  owning_system_folder  text not null,

  -- bindings (mirrors TS interface shape)
  data_binding          jsonb not null default '{}'::jsonb,
  trigger               jsonb not null default '{}'::jsonb,
  runner                jsonb not null default '{}'::jsonb,
  ai                    jsonb,

  reads                 text[] not null default '{}',
  writes                text[] not null default '{}',

  see_it                jsonb not null default '{}'::jsonb,
  change_it             jsonb not null default '{}'::jsonb,

  -- slice-1 fallbacks
  static_status         text check (static_status in ('unset','ok','error','blocked')),
  block_reason          text,
  credit_spender        boolean not null default false,

  -- slice-2B redesign columns
  route_component       text,
  function_path         text,
  trigger_event         text,
  schemas               jsonb,
  adapters              text[],
  skills                text[],
  provenance_consumes   text[],
  provenance_writes     text[],
  concurrency           jsonb,
  retry                 jsonb,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  primary key (activity_id, version)
);

comment on table public.sop_activities is
  'L3: activity leaves. Mirrors systems/operating-sop/sops/types.ts Activity interface plus slice-2B inspector columns (route_component, function_path, trigger_event, schemas, adapters, skills, provenance_*, concurrency, retry). Partial unique on activity_id WHERE is_current.';

create unique index if not exists sop_activities_current_uq
  on public.sop_activities (activity_id) where is_current;
create index if not exists sop_activities_owner_idx
  on public.sop_activities (owning_system_slug);
create index if not exists sop_activities_workflow_idx
  on public.sop_activities (workflow_id, version);
create index if not exists sop_activities_stage_idx
  on public.sop_activities (stage_id);
create index if not exists sop_activities_executor_idx
  on public.sop_activities (executor_class);

drop trigger if exists sop_activities_set_updated_at on public.sop_activities;
create trigger sop_activities_set_updated_at
  before update on public.sop_activities
  for each row execute function public.fn_set_updated_at();

alter table public.sop_activities enable row level security;
drop policy if exists sop_activities_service_all on public.sop_activities;
create policy sop_activities_service_all
  on public.sop_activities for all to service_role using (true) with check (true);

revoke all on public.sop_activities from public, anon, authenticated;
grant  all on public.sop_activities to service_role;
