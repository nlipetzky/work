-- 020_activity_runs.sql
-- canon.activity_runs: one row per execution of an activity.
-- Captures lifecycle, retry, cost, and error categorization for observability and replay.

begin;

create table if not exists canon.activity_runs (
  id                  uuid        primary key default gen_random_uuid(),

  -- lineage
  activity_id         uuid        not null references canon.activities(id) on delete restrict,
  workflow_id         uuid        null     references canon.workflows(id)  on delete set null,
  sop_run_id          uuid        null,
  parent_run_id       uuid        null     references canon.activity_runs(id) on delete set null,
  idempotency_key     text        null,

  -- lifecycle
  status              text        not null default 'queued'
    check (status in ('queued','running','succeeded','failed','cancelled','timed_out')),
  started_at          timestamptz null,
  finished_at         timestamptz null,
  duration_ms         integer     generated always as
    (case
       when started_at is not null and finished_at is not null
       then (extract(epoch from (finished_at - started_at)) * 1000)::int
       else null
     end) stored,

  -- retry
  attempt             integer     not null default 1 check (attempt >= 1),
  max_attempts        integer     not null default 1 check (max_attempts >= 1),
  retry_of_run_id     uuid        null references canon.activity_runs(id) on delete set null,
  next_retry_at       timestamptz null,

  -- cost
  cost_usd            numeric(12,6) null,
  cost_breakdown      jsonb         null,
  token_input         integer       null,
  token_output        integer       null,
  model               text          null,

  -- error
  error_class         text        null
    check (error_class is null or error_class in
      ('transient','rate_limit','timeout','auth','validation','dependency','permanent','unknown')),
  error_code          text        null,
  error_message       text        null,
  error_detail        jsonb       null,
  is_retriable        boolean     null,

  -- provenance
  input               jsonb       null,
  output              jsonb       null,
  output_artifact_ids uuid[]      null,

  -- attribution
  actor_id            uuid        null references canon.actors(id) on delete set null,
  session_id          text        null,
  trace_id            text        null,

  created_at          timestamptz not null default now(),

  -- sanity: terminal states must have finished_at
  constraint activity_runs_terminal_finished_at_chk
    check (
      status in ('queued','running')
      or finished_at is not null
    )
);

-- indexes
create index if not exists activity_runs_activity_started_idx
  on canon.activity_runs (activity_id, started_at desc);

create index if not exists activity_runs_workflow_idx
  on canon.activity_runs (workflow_id)
  where workflow_id is not null;

create index if not exists activity_runs_retry_scheduler_idx
  on canon.activity_runs (next_retry_at)
  where status = 'failed' and next_retry_at is not null;

create unique index if not exists activity_runs_idempotency_uq
  on canon.activity_runs (idempotency_key)
  where idempotency_key is not null;

create index if not exists activity_runs_error_class_idx
  on canon.activity_runs (error_class)
  where status = 'failed';

create index if not exists activity_runs_created_at_idx
  on canon.activity_runs (created_at desc);

-- comments (kept terse; doc lives in schema-design.md)
comment on table  canon.activity_runs                    is 'One row per activity execution. See schema-design.md.';
comment on column canon.activity_runs.cost_breakdown    is 'Structured per-provider cost detail; scalar cost_usd is the rollup.';
comment on column canon.activity_runs.error_class       is 'Coarse error bucket for routing/alerts. Provider-specific code in error_code.';
comment on column canon.activity_runs.retry_of_run_id   is 'Predecessor attempt. Distinct from parent_run_id (which is for sub-runs/fan-outs).';

commit;
