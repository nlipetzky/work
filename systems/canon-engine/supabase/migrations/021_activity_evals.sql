-- Migration: activity_evals + activity_eval_runs (the fixture-based eval layer)
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Fixture-based pass/fail evals for L3 activities. `activity_evals` holds the
--   fixtures (one per named test case), `activity_eval_runs` holds each
--   execution of a fixture against an activity output. The /operate inspector's
--   Evals panel reads these via lib/queries/sopComposition.getActivityEvals
--   (counts fixtures + the most-recent run per fixture for a pass rate).
--
--   kind ∈ {exact, contains, schema, llm-judge} — how the fixture is scored.
--   is_stale marks a fixture whose activity changed since the fixture was
--   authored (re-run needed). Loose text refs to sop_activities.

create extension if not exists pgcrypto;

-- ─── Fixtures ───────────────────────────────────────────────────────────────

create table if not exists public.activity_evals (
  eval_id        text not null primary key default gen_random_uuid()::text,
  activity_id    text not null,            -- loose ref to sop_activities
  name           text not null,
  kind           text not null
                   check (kind in ('exact','contains','schema','llm-judge')),
  input          jsonb not null default '{}'::jsonb,
  expected       jsonb not null default '{}'::jsonb,
  is_stale       boolean not null default false,
  created_by     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.activity_evals is
  'Fixture-based eval cases for an L3 activity. kind picks the scorer; is_stale flags a fixture whose activity changed since authoring. Read by /operate Evals panel.';

create index if not exists activity_evals_activity_idx on public.activity_evals (activity_id);

drop trigger if exists activity_evals_set_updated_at on public.activity_evals;
create trigger activity_evals_set_updated_at
  before update on public.activity_evals
  for each row execute function public.fn_set_updated_at();

alter table public.activity_evals enable row level security;
drop policy if exists activity_evals_service_all on public.activity_evals;
create policy activity_evals_service_all on public.activity_evals for all to service_role using (true) with check (true);
revoke all on public.activity_evals from public, anon, authenticated;
grant  all on public.activity_evals to service_role;

-- ─── Eval runs (one row per fixture execution) ──────────────────────────────

create table if not exists public.activity_eval_runs (
  eval_run_id    text not null primary key default gen_random_uuid()::text,
  eval_id        text not null,            -- loose ref to activity_evals
  activity_run_id text,                    -- nullable: which activity_run produced the output
  passed         boolean not null,
  score          numeric(6,4),             -- for llm-judge / fuzzy scorers
  detail         text,
  ran_at         timestamptz not null default now()
);

comment on table public.activity_eval_runs is
  'One row per fixture execution. passed drives the /operate Evals pass-rate; the most-recent run per fixture wins.';

create index if not exists activity_eval_runs_eval_idx
  on public.activity_eval_runs (eval_id, ran_at desc);

alter table public.activity_eval_runs enable row level security;
drop policy if exists activity_eval_runs_service_all on public.activity_eval_runs;
create policy activity_eval_runs_service_all on public.activity_eval_runs for all to service_role using (true) with check (true);
revoke all on public.activity_eval_runs from public, anon, authenticated;
grant  all on public.activity_eval_runs to service_role;
