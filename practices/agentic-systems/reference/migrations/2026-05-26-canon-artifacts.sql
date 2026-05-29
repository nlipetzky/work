-- Migration: canon_artifacts + canon_artifact_bindings
-- Date: 2026-05-26
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   First-class artifact storage for the artifact-discipline canon.
--   Canon is the runtime source of truth for expert-approved artifacts.
--   Engines query this at execution time; filesystem path is informational mirror only.
--
-- Supersedes design doc:
--   ~/code/work/practices/agentic-systems/reference/canon-as-artifact-source-of-truth.md
--   (doc was design intent; this migration is the deployed schema)

create extension if not exists pgcrypto;

-- =====================================================================
-- canon_artifacts
-- =====================================================================
create table public.canon_artifacts (
  id                  uuid primary key default gen_random_uuid(),
  engagement_type     text not null check (engagement_type in ('venture','client','practice')),
  engagement_id       text not null,
  artifact_type       text not null,
  name                text not null,
  version             integer not null check (version > 0),
  path                text,                                  -- filesystem mirror location (informational)
  content_md          text not null,                         -- authoritative artifact body
  status              text not null check (status in ('draft','approved','superseded','archived')),
  approver            text,
  approval_date       timestamptz,
  approval_channel    text,                                  -- e.g. 'airtable', 'email', 'slack'
  approval_ref        text,                                  -- e.g. Airtable record id, email message id
  supersedes_id       uuid references public.canon_artifacts(id) on delete set null,
  superseded_by_id    uuid references public.canon_artifacts(id) on delete set null,
  metadata            jsonb not null default '{}'::jsonb,
  search_tsv          tsvector generated always as (
                        to_tsvector('english',
                          coalesce(name,'') || ' ' || coalesce(content_md,''))
                      ) stored,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint canon_artifacts_approved_requires_approver
    check (status != 'approved' or (approver is not null and approval_date is not null))
);

comment on table public.canon_artifacts is
  'First-class artifact storage. Authoritative source of truth for expert-approved artifacts; engines query this at runtime. Filesystem path is informational mirror only.';

create index canon_artifacts_lookup_idx
  on public.canon_artifacts (engagement_type, engagement_id, artifact_type, status);

create index canon_artifacts_supersedes_idx
  on public.canon_artifacts (supersedes_id);

create index canon_artifacts_superseded_by_idx
  on public.canon_artifacts (superseded_by_id);

create index canon_artifacts_status_idx
  on public.canon_artifacts (status);

create index canon_artifacts_search_idx
  on public.canon_artifacts using gin (search_tsv);

-- Invariant: exactly one row per declared version of an artifact.
-- Catches duplicate-version writes from workflow bugs or manual error.
create unique index canon_artifacts_version_uidx
  on public.canon_artifacts (engagement_type, engagement_id, artifact_type, name, version);

-- Invariant: at most one current-approved version per (engagement, artifact_type, name).
-- Superseding flips the old row's superseded_by_id, so it no longer matches this partial index.
-- Workflow MUST wrap (flip old row's superseded_by_id, insert new approved row) in a single
-- transaction so the invariant never sees an intermediate violating state.
create unique index canon_artifacts_current_approved_uidx
  on public.canon_artifacts (engagement_type, engagement_id, artifact_type, name)
  where status = 'approved' and superseded_by_id is null;

-- updated_at trigger: reuse the existing canon_engine convention (fn_set_updated_at,
-- already in use by canon_clusters and other canon_* tables).
create trigger canon_artifacts_set_updated_at
  before update on public.canon_artifacts
  for each row execute function public.fn_set_updated_at();

-- =====================================================================
-- canon_artifact_bindings
-- =====================================================================
create table public.canon_artifact_bindings (
  id                uuid primary key default gen_random_uuid(),
  artifact_id       uuid not null references public.canon_artifacts(id) on delete cascade,
  engine_system_id  text not null,                          -- matches System Registry id
  binding_type      text not null default 'active' check (binding_type in ('active','deprecated','historical')),
  bound_at          timestamptz not null default now(),
  unbound_at        timestamptz,
  created_at        timestamptz not null default now()
);

comment on table public.canon_artifact_bindings is
  'Lineage: which engine consumes which artifact version at what time. Enables traceback from engine output to artifact_id + version.';

create index canon_artifact_bindings_artifact_idx
  on public.canon_artifact_bindings (artifact_id);

create index canon_artifact_bindings_engine_idx
  on public.canon_artifact_bindings (engine_system_id, binding_type);

-- =====================================================================
-- RLS (match existing canon_engine pattern: enabled, service_role permissive)
-- =====================================================================
alter table public.canon_artifacts enable row level security;
alter table public.canon_artifact_bindings enable row level security;

-- Permissive for v0; tighten when multi-tenant access controls land.
create policy canon_artifacts_service_all
  on public.canon_artifacts
  for all to service_role using (true) with check (true);

create policy canon_artifact_bindings_service_all
  on public.canon_artifact_bindings
  for all to service_role using (true) with check (true);
