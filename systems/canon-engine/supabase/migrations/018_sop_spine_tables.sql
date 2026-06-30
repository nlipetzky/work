-- Migration: SOP spine tables (sops / sop_stages / workflows / nodes / edges)
-- Date: 2026-06-29
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Canon-side schema for the three-layer work model (SOP spine / workflow /
--   activity-binding). Mirrors the TS interfaces in
--   systems/operating-sop/sops/types.ts so the hand-authored TS bundles can be
--   loaded into rows. Each entity carries (slug, version, is_current) so BUILD
--   mode in /operate can iterate published versions without rewriting history.
--   sop_activities is split out into 019_sop_activities.sql because it carries
--   a much wider column shape.
--
--   Refs across entities are loose text (no FK between sops/stages/workflows)
--   because the (id, version) compound makes pinning awkward and we'd rather
--   trade referential integrity for versioning ergonomics in slice 2B. The
--   stage→workflow link lives in sop_stage_workflows.

create extension if not exists pgcrypto;

-- ─── L1: SOPs ──────────────────────────────────────────────────────────────

create table if not exists public.sops (
  sop_id              text not null,
  version             int  not null default 1,
  is_current          boolean not null default true,
  name                text not null,
  description         text,
  owning_system_slug  text references public.systems(system_slug),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  published_at        timestamptz,
  published_by        text,
  primary key (sop_id, version)
);

comment on table public.sops is
  'L1: SOP spine. One row per (sop_id, version). Partial unique on sop_id WHERE is_current enforces a single current version per SOP.';

create unique index if not exists sops_current_uq
  on public.sops (sop_id) where is_current;

drop trigger if exists sops_set_updated_at on public.sops;
create trigger sops_set_updated_at
  before update on public.sops
  for each row execute function public.fn_set_updated_at();

alter table public.sops enable row level security;
drop policy if exists sops_service_all on public.sops;
create policy sops_service_all on public.sops for all to service_role using (true) with check (true);
revoke all on public.sops from public, anon, authenticated;
grant  all on public.sops to service_role;

-- ─── L1: SOP stages ────────────────────────────────────────────────────────

create table if not exists public.sop_stages (
  stage_id            text not null,
  version             int  not null default 1,
  is_current          boolean not null default true,
  sop_id              text not null,
  order_index         int  not null,
  name                text not null,
  description         text,
  required_end_state  text,
  gate_type           text check (gate_type in ('decision','approval','automated')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  primary key (stage_id, version)
);

comment on table public.sop_stages is
  'L1: ordered stages within an SOP. sop_id is a loose text ref. Versioning mirrors public.sops; partial unique on stage_id WHERE is_current.';

create unique index if not exists sop_stages_current_uq
  on public.sop_stages (stage_id) where is_current;
create index if not exists sop_stages_sop_idx
  on public.sop_stages (sop_id, order_index);

drop trigger if exists sop_stages_set_updated_at on public.sop_stages;
create trigger sop_stages_set_updated_at
  before update on public.sop_stages
  for each row execute function public.fn_set_updated_at();

alter table public.sop_stages enable row level security;
drop policy if exists sop_stages_service_all on public.sop_stages;
create policy sop_stages_service_all on public.sop_stages for all to service_role using (true) with check (true);
revoke all on public.sop_stages from public, anon, authenticated;
grant  all on public.sop_stages to service_role;

-- ─── L1↔L2 binding: stage → workflows (many-to-many) ───────────────────────

create table if not exists public.sop_stage_workflows (
  sop_id       text not null,
  stage_id     text not null,
  workflow_id  text not null,
  version      int  not null default 1,
  ordinal      int  not null default 0,
  created_at   timestamptz not null default now(),
  primary key (sop_id, stage_id, workflow_id, version)
);

comment on table public.sop_stage_workflows is
  'Contract A (L1↔L2): which workflows produce a stages required end state. Loose text refs; version pins which workflow version this stage targets.';

create index if not exists sop_stage_workflows_stage_idx
  on public.sop_stage_workflows (stage_id);
create index if not exists sop_stage_workflows_workflow_idx
  on public.sop_stage_workflows (workflow_id, version);

alter table public.sop_stage_workflows enable row level security;
drop policy if exists sop_stage_workflows_service_all on public.sop_stage_workflows;
create policy sop_stage_workflows_service_all on public.sop_stage_workflows for all to service_role using (true) with check (true);
revoke all on public.sop_stage_workflows from public, anon, authenticated;
grant  all on public.sop_stage_workflows to service_role;

-- ─── L2: workflows ─────────────────────────────────────────────────────────

create table if not exists public.workflows (
  workflow_id   text not null,
  version       int  not null default 1,
  is_current    boolean not null default true,
  name          text not null,
  control_flow  text not null check (control_flow in ('fixed','agent-driven')),
  viewbox       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (workflow_id, version)
);

comment on table public.workflows is
  'L2: workflow heads. control_flow distinguishes pre-authored vs agent-chosen runtime ordering. viewbox holds the SVG dimensions for slice-2 fixed layouts.';

create unique index if not exists workflows_current_uq
  on public.workflows (workflow_id) where is_current;

drop trigger if exists workflows_set_updated_at on public.workflows;
create trigger workflows_set_updated_at
  before update on public.workflows
  for each row execute function public.fn_set_updated_at();

alter table public.workflows enable row level security;
drop policy if exists workflows_service_all on public.workflows;
create policy workflows_service_all on public.workflows for all to service_role using (true) with check (true);
revoke all on public.workflows from public, anon, authenticated;
grant  all on public.workflows to service_role;

-- ─── L2: workflow nodes ────────────────────────────────────────────────────

create table if not exists public.workflow_nodes (
  workflow_id  text not null,
  version      int  not null,
  node_id      text not null,
  activity_id  text not null,
  label        text not null,
  position     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  primary key (workflow_id, version, node_id)
);

comment on table public.workflow_nodes is
  'L2: nodes inside a workflow. activity_id is a loose text ref to sop_activities; position is {x,y} for fixed-layout SVGs.';

create index if not exists workflow_nodes_activity_idx
  on public.workflow_nodes (activity_id);

alter table public.workflow_nodes enable row level security;
drop policy if exists workflow_nodes_service_all on public.workflow_nodes;
create policy workflow_nodes_service_all on public.workflow_nodes for all to service_role using (true) with check (true);
revoke all on public.workflow_nodes from public, anon, authenticated;
grant  all on public.workflow_nodes to service_role;

-- ─── L2: workflow edges ────────────────────────────────────────────────────

create table if not exists public.workflow_edges (
  workflow_id  text not null,
  version      int  not null,
  from_node    text not null,
  to_node      text not null,
  branch       text,
  label        text,
  created_at   timestamptz not null default now()
);

comment on table public.workflow_edges is
  'L2: edges between workflow nodes. branch ∈ {default,edge,fail} when present; label is the optional human caption.';

create index if not exists workflow_edges_workflow_idx
  on public.workflow_edges (workflow_id, version);

alter table public.workflow_edges enable row level security;
drop policy if exists workflow_edges_service_all on public.workflow_edges;
create policy workflow_edges_service_all on public.workflow_edges for all to service_role using (true) with check (true);
revoke all on public.workflow_edges from public, anon, authenticated;
grant  all on public.workflow_edges to service_role;
