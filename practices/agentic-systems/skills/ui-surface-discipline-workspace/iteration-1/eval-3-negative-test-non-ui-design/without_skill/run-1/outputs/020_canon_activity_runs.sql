-- Migration: 020_canon_activity_runs.sql
-- Purpose:   Create canon.activity_runs ... per-execution ledger for any system's activity.
-- Project:   canon-engine (mzzjvoiwughcnmmqzbxv)
-- Posture:   service-role only; RLS deferred to a follow-up migration.

begin;

-- ---------------------------------------------------------------------------
-- Schema + extensions
-- ---------------------------------------------------------------------------
create schema if not exists canon;
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums (declared as CHECK constraints, not pg enums, so we can evolve cheaply)
-- ---------------------------------------------------------------------------
-- status, triggered_by, error_class are validated via CHECK below.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table canon.activity_runs (
    -- identity + lineage
    run_id            uuid        primary key default gen_random_uuid(),
    activity_id       text        not null,
    system_id         text        not null,
    parent_run_id     uuid        null references canon.activity_runs(run_id) on delete set null,
    correlation_id    uuid        not null,
    triggered_by      text        not null,
    actor_id          text        null,

    -- lifecycle
    status            text        not null default 'queued',
    started_at        timestamptz not null default now(),
    finished_at       timestamptz null,
    duration_ms       int         generated always as (
                          case
                              when finished_at is null then null
                              else (extract(epoch from (finished_at - started_at)) * 1000)::int
                          end
                      ) stored,

    -- cost
    cost_usd          numeric(12,6) null,
    cost_breakdown    jsonb         null,
    tokens_input      int           null,
    tokens_output     int           null,

    -- retries
    attempt           int         not null default 1,
    max_attempts      int         not null default 1,
    retry_of_run_id   uuid        null references canon.activity_runs(run_id) on delete set null,
    next_retry_at     timestamptz null,
    retry_reason      text        null,

    -- error categorization
    error_class       text        null,
    error_code        text        null,
    error_message     text        null,
    error_payload     jsonb       null,
    is_retryable      boolean     null,

    -- inputs / outputs (pointers, not payloads)
    input_ref         text        null,
    output_ref        text        null,
    metadata          jsonb       not null default '{}'::jsonb,

    -- audit
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),

    -- ---- constraints ----
    constraint activity_runs_status_chk check (
        status in ('queued','running','succeeded','failed','cancelled','timed_out')
    ),
    constraint activity_runs_triggered_by_chk check (
        triggered_by in ('operator','schedule','event','system','retry')
    ),
    constraint activity_runs_error_class_chk check (
        error_class is null or error_class in (
            'none','validation','auth','rate_limit','provider_timeout',
            'provider_5xx','provider_4xx','quota_exhausted','dependency_missing',
            'data_quality','logic_bug','infra','cancelled','unknown'
        )
    ),
    constraint activity_runs_attempt_positive_chk check (attempt >= 1),
    constraint activity_runs_max_attempts_chk check (max_attempts >= attempt),
    constraint activity_runs_finished_after_started_chk check (
        finished_at is null or finished_at >= started_at
    ),
    constraint activity_runs_terminal_has_finish_chk check (
        (status in ('queued','running')) = (finished_at is null)
    ),
    constraint activity_runs_failed_has_error_chk check (
        status <> 'failed' or error_class is not null
    ),
    constraint activity_runs_cost_nonnegative_chk check (
        cost_usd is null or cost_usd >= 0
    )
);

comment on table  canon.activity_runs is 'Per-execution ledger for any system activity. One row per attempt; retries chain via retry_of_run_id.';
comment on column canon.activity_runs.correlation_id is 'Groups runs from one operator intent across systems. Defaults to run_id at root via trigger.';
comment on column canon.activity_runs.cost_breakdown is 'JSONB: { llm:{model,input_tokens,output_tokens,usd}, providers:[{name,units,usd}], infra_usd }';
comment on column canon.activity_runs.error_class  is 'Coarse failure bucket. Drives the reliability dashboard. Backfills are expensive ... add categories only when truly new.';

-- ---------------------------------------------------------------------------
-- Foreign keys to canon registry (deferred ... assumes tables exist)
-- ---------------------------------------------------------------------------
do $$
begin
    if exists (select 1 from information_schema.tables where table_schema='canon' and table_name='activities') then
        alter table canon.activity_runs
            add constraint activity_runs_activity_fk
            foreign key (activity_id) references canon.activities(activity_id)
            on update cascade on delete restrict;
    end if;

    if exists (select 1 from information_schema.tables where table_schema='public' and table_name='systems') then
        alter table canon.activity_runs
            add constraint activity_runs_system_fk
            foreign key (system_id) references public.systems(system_id)
            on update cascade on delete restrict;
    end if;
end$$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index activity_runs_system_started_idx
    on canon.activity_runs (system_id, started_at desc);

create index activity_runs_activity_started_idx
    on canon.activity_runs (activity_id, started_at desc);

create index activity_runs_active_status_idx
    on canon.activity_runs (status)
    where status in ('queued','running');

create index activity_runs_failed_class_idx
    on canon.activity_runs (error_class)
    where status = 'failed';

create index activity_runs_correlation_idx
    on canon.activity_runs (correlation_id);

create index activity_runs_parent_idx
    on canon.activity_runs (parent_run_id)
    where parent_run_id is not null;

create index activity_runs_next_retry_idx
    on canon.activity_runs (next_retry_at)
    where next_retry_at is not null;

create index activity_runs_cost_breakdown_gin
    on canon.activity_runs using gin (cost_breakdown jsonb_path_ops);

create index activity_runs_metadata_gin
    on canon.activity_runs using gin (metadata jsonb_path_ops);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function canon.activity_runs_touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end$$;

create trigger activity_runs_touch_updated_at
    before update on canon.activity_runs
    for each row execute function canon.activity_runs_touch_updated_at();

create or replace function canon.activity_runs_default_correlation()
returns trigger language plpgsql as $$
begin
    if new.correlation_id is null then
        new.correlation_id := new.run_id;
    end if;
    return new;
end$$;

create trigger activity_runs_default_correlation
    before insert on canon.activity_runs
    for each row execute function canon.activity_runs_default_correlation();

-- ---------------------------------------------------------------------------
-- Grants (service-role only; mirrors revops-engine posture)
-- ---------------------------------------------------------------------------
revoke all on canon.activity_runs from public;
revoke all on canon.activity_runs from anon, authenticated;
grant  all on canon.activity_runs to service_role;

commit;
