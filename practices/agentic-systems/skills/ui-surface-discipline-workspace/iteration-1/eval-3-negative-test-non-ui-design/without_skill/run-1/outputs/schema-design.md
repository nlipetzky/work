# canon.activity_runs schema design

## Purpose

One row per execution attempt of an activity (any system's deterministic step or agent call). Tracks lifecycle, cost, retries, and error shape so we can: bill/budget, debug failures by category, and feed the work spine's reliability metrics.

## Column choices + justification

### Identity + lineage
- `run_id uuid PK default gen_random_uuid()` ... stable handle for joins (observability, artifacts, projection-ui links).
- `activity_id text not null` ... fk to `canon.activities.activity_id`. Text because activity ids are slugged (`revops.enrich.bettercontact`), not synthetic.
- `system_id text not null` ... fk to `public.systems.system_id`. Denormalized from activity for cheap filtering ("all runs by canon-engine today").
- `parent_run_id uuid null` ... self-fk for nested/composed activities (workflow calling activity calling sub-activity). Null = root call.
- `correlation_id uuid not null` ... groups all runs from one operator intent across systems. Survives across parent boundaries. Default = `run_id` if root, inherited otherwise.
- `triggered_by text not null` ... enum: `operator | schedule | event | system | retry`. Cheap to filter; explains the row's existence.
- `actor_id text null` ... operator/agent id when `triggered_by='operator'` or `'system'`. Null otherwise.

### Lifecycle
- `status text not null` ... enum: `queued | running | succeeded | failed | cancelled | timed_out`. Indexed.
- `started_at timestamptz not null default now()` ... wall-clock start.
- `finished_at timestamptz null` ... null while running. Filled on terminal status.
- `duration_ms int generated always as (extract(epoch from (finished_at - started_at)) * 1000)::int stored` ... computed; saves repeat math in projection-ui.

### Cost tracking
- `cost_usd numeric(12,6) null` ... total $ spent in this run. Nullable because not every activity has cost (pure logic). 6 decimals because LLM tokens land in micro-dollars.
- `cost_breakdown jsonb null` ... `{ "llm": {"model":"opus-4-7","input_tokens":..,"output_tokens":..,"usd":..}, "providers": [{"name":"bettercontact","units":1,"usd":..}], "infra_usd": .. }`. JSONB so we don't pin the schema to today's providers. Indexed via GIN on `cost_breakdown jsonb_path_ops` for cost-by-provider queries.
- `tokens_input int null` / `tokens_output int null` ... promoted out of jsonb because they're queried constantly (rate-limit forecasting, model picks). Sum across all LLM calls in the run.

### Retries
- `attempt int not null default 1` ... 1-indexed. Increments only on retry, not on cold start.
- `max_attempts int not null default 1` ... policy snapshot at submit time so we don't have to re-resolve later if policy changes.
- `retry_of_run_id uuid null` ... self-fk to the immediately previous failed attempt. Chain reconstructs full retry history; the root attempt's `run_id` becomes the chain's natural key when joined with `correlation_id`.
- `next_retry_at timestamptz null` ... scheduler reads this; null when no retry pending.
- `retry_reason text null` ... compact phrase ("provider 429", "transient db", "operator forced"). Free-text; not enum because reasons evolve.

### Error categorization
- `error_class text null` ... enum: `none | validation | auth | rate_limit | provider_timeout | provider_5xx | provider_4xx | quota_exhausted | dependency_missing | data_quality | logic_bug | infra | cancelled | unknown`. Indexed. This is the primary grouping for reliability dashboards ... decided up-front because adding categories later forces backfills.
- `error_code text null` ... provider/system specific code (`P0001`, `ETIMEDOUT`, `HTTP_429`). For drilldown.
- `error_message text null` ... human-readable; truncated at insert to 2000 chars (anything bigger goes to `error_payload`).
- `error_payload jsonb null` ... full provider response / stack trace / context. Big; not indexed.
- `is_retryable boolean null` ... computed by the runner at failure time based on `error_class`. Snapshotted so retry policy can change without re-classifying historic rows.

### Inputs / outputs (lightweight)
- `input_ref text null` ... pointer (storage path or canon artifact id) to the input payload. We do NOT store the payload here ... rows stay narrow.
- `output_ref text null` ... same shape; pointer to output artifact.
- `metadata jsonb not null default '{}'::jsonb` ... per-activity extra fields (model id, play slug, batch id, anything the activity wants surfaced without a schema migration).

### Audit
- `created_at timestamptz not null default now()` ... row insert time (≈ started_at but separated for clock skew).
- `updated_at timestamptz not null default now()` ... touched on every status change. Trigger maintains.

## Indexes

- `(system_id, started_at desc)` ... primary projection-ui query ("recent runs for system X").
- `(activity_id, started_at desc)` ... per-activity reliability.
- `(status) where status in ('queued','running')` ... partial index; the hot operational set.
- `(error_class) where status='failed'` ... partial; powers the failure-mix dashboard.
- `(correlation_id)` ... trace assembly.
- `(parent_run_id) where parent_run_id is not null` ... partial; child lookups.
- `(next_retry_at) where next_retry_at is not null` ... scheduler scan.
- GIN on `cost_breakdown jsonb_path_ops` and on `metadata jsonb_path_ops`.

## Things I deliberately did NOT add

- No `engagement_id` / `play_slug` column ... those live in `metadata`. Putting them top-level would tie this table to revops-engine's vocabulary, and canon.activity_runs is studio-wide.
- No `outcome_score` ... eval scoring belongs in a sibling table that joins on `run_id`. Keeps the hot-path insert cheap.
- No partitioning yet ... add native time partitioning when row count crosses ~5M; premature now.
- No RLS policies in this migration ... follows revops-engine posture (service-role-only); RLS gets a separate, deliberate migration.
