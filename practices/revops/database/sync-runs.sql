-- sync_runs: header table for every Supabase -> Airtable sync execution.
-- Purpose: visibility. One row per workflow run. Open at start, close at end.
-- Failures, partial completions, and silent ceilings all show up here.

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),

  -- identity
  workflow_id text not null,
  workflow_name text not null,
  play_name text,
  triggered_by text default 'manual',

  -- lifecycle
  status text not null default 'running'
    check (status in ('running', 'complete', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer generated always as (
    case when completed_at is null then null
    else (extract(epoch from (completed_at - started_at)) * 1000)::integer
    end
  ) stored,

  -- counts (nullable until phase runs)
  evaluations_matched integer,
  companies_fetched integer,
  companies_upserted integer,
  companies_failed integer,
  contacts_fetched integer,
  contacts_upserted integer,
  contacts_failed integer,

  -- error capture: array of {phase, batch_index, http_status, message, payload}
  errors jsonb not null default '[]'::jsonb,
  error_count integer generated always as (jsonb_array_length(errors)) stored,

  -- audit
  config jsonb,
  notes text
);

create index if not exists idx_sync_runs_status_started
  on public.sync_runs(status, started_at desc);

create index if not exists idx_sync_runs_play_started
  on public.sync_runs(play_name, started_at desc);

-- view: currently running syncs. n8n queries this for the in-progress guard.
create or replace view public.sync_runs_active as
  select id, workflow_id, workflow_name, play_name, started_at,
         extract(epoch from (now() - started_at))::integer as running_seconds
  from public.sync_runs
  where status = 'running';

comment on table public.sync_runs is
  'Run log for Supabase -> Airtable sync workflows. One row per execution.';
comment on column public.sync_runs.status is
  'running = open, complete = all phases succeeded, partial = some batches failed, failed = workflow halted';
comment on column public.sync_runs.errors is
  'JSONB array. Each error: { phase: "companies"|"contacts", batch_index: int, http_status: int, message: text, payload: jsonb }';
