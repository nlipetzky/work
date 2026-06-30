-- Migration: sop_runs + activity_runs (the execution-record layer)
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   The runtime record for the three-layer work model. `sop_runs` is the parent
--   SopRun lifecycle (one invocation of an SOP against a target engagement),
--   pinned to the sop_version it started against so historical runs stay tied to
--   the version they executed. `activity_runs` is the per-activity execution log
--   inside (or outside) a SopRun — the rows the /operate inspector's Runs-history
--   panel reads via lib/queries/sopComposition.getActivityRuns.
--
--   Append-only event tables: no (id, version)/is_current versioning. Loose text
--   refs (no FK to sop_activities) to match the 018/019 versioning ergonomics.
--   duration_ms is generated from finished_at - started_at.

create extension if not exists pgcrypto;

-- ─── Parent SopRun lifecycle ────────────────────────────────────────────────

create table if not exists public.sop_runs (
  run_id             text not null primary key,
  sop_id             text not null,
  sop_version        int  not null,            -- pinned at start
  target_engagement  text,                     -- e.g. 'konstellation-cipo'
  status             text not null default 'running'
                       check (status in ('running','done','error','cancelled')),
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  created_at         timestamptz not null default now()
);

comment on table public.sop_runs is
  'Parent SopRun: one invocation of an SOP against a target. Pinned to sop_version at start so historical runs stay tied to their version.';

create index if not exists sop_runs_sop_idx on public.sop_runs (sop_id, sop_version);
create index if not exists sop_runs_engagement_idx on public.sop_runs (target_engagement);

alter table public.sop_runs enable row level security;
drop policy if exists sop_runs_service_all on public.sop_runs;
create policy sop_runs_service_all on public.sop_runs for all to service_role using (true) with check (true);
revoke all on public.sop_runs from public, anon, authenticated;
grant  all on public.sop_runs to service_role;

-- ─── Per-activity execution log ─────────────────────────────────────────────

create table if not exists public.activity_runs (
  run_id             text not null primary key,
  activity_id        text not null,            -- loose ref to sop_activities
  activity_version   int,                      -- which activity version ran (nullable)
  sop_run_id         text,                     -- nullable: ad-hoc runs outside a SopRun
  mode               text not null default 'plan'
                       check (mode in ('plan','execute')),
  status             text not null default 'running'
                       check (status in ('running','done','error','cancelled')),
  message            text,
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  duration_ms        int generated always as
                       ((extract(epoch from (finished_at - started_at)) * 1000)::int) stored,
  cost_usd           numeric(12,4) not null default 0,
  rows_in            int,
  rows_out           int,
  spawn_session_id   text,
  created_at         timestamptz not null default now()
);

comment on table public.activity_runs is
  'Per-activity execution log inside (or outside) a SopRun. sop_run_id nullable for ad-hoc invocations. duration_ms generated from finished_at - started_at. Read by /operate Runs-history.';

create index if not exists activity_runs_activity_idx
  on public.activity_runs (activity_id, started_at desc);
create index if not exists activity_runs_soprun_idx
  on public.activity_runs (sop_run_id);

alter table public.activity_runs enable row level security;
drop policy if exists activity_runs_service_all on public.activity_runs;
create policy activity_runs_service_all on public.activity_runs for all to service_role using (true) with check (true);
revoke all on public.activity_runs from public, anon, authenticated;
grant  all on public.activity_runs to service_role;
