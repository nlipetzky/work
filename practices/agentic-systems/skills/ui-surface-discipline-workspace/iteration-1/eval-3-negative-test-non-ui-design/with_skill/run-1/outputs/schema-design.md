# canon.activity_runs — schema design

## Purpose

One row per execution of an activity (the L3 unit in the work model). Captures cost, retry, timing, error, and provenance so the system can be observed, re-run, billed, and learned from.

## Column choices

### Identity + lineage
- `id` (uuid, PK) — stable run id; generated server-side.
- `activity_id` (uuid, FK -> `canon.activities.id`, not null) — which activity definition was executed.
- `workflow_id` (uuid, FK -> `canon.workflows.id`, null) — parent workflow run, if invoked inside one. Null for direct activity calls.
- `sop_run_id` (uuid, null) — parent SOP execution, if any. Lets us roll runs up to SOP-level cost/reliability.
- `parent_run_id` (uuid, FK self, null) — when a run spawns sub-runs (retries, fan-outs). Enables tree-walk for audit.
- `idempotency_key` (text, unique nullable) — caller-supplied; prevents duplicate execution on retry storms.

### Status + lifecycle
- `status` (text, not null, check in `'queued','running','succeeded','failed','cancelled','timed_out'`) — coarse lifecycle state. Constrained enum so projections/queries are safe.
- `started_at` (timestamptz, null) — null until status leaves `queued`.
- `finished_at` (timestamptz, null) — set on terminal states.
- `duration_ms` (int, generated as `extract(epoch from finished_at - started_at) * 1000`) — denormalized for cheap analytics.

### Retry tracking
- `attempt` (int, not null, default 1) — 1-indexed attempt number within the logical operation.
- `max_attempts` (int, not null, default 1) — policy snapshot at run time; lets us tell "gave up" vs "still has budget".
- `retry_of_run_id` (uuid, FK self, null) — links this attempt to its predecessor. Forms a chain you can walk to count escalations.
- `next_retry_at` (timestamptz, null) — scheduler hint; null when no retry pending.

Rationale: split `attempt` + `retry_of_run_id` rather than overloading `parent_run_id`. Retries are a distinct relationship from sub-runs (fan-out children), and conflating them ruins reliability queries.

### Cost tracking
- `cost_usd` (numeric(12,6), null) — total realized cost in USD. Six decimals because LLM calls land in the millicent range.
- `cost_breakdown` (jsonb, null) — structured detail, e.g. `{"llm": {...per-model tokens + $}, "tools": [...], "infra": 0.0001}`. Keeps the hot column scalar while preserving auditability.
- `token_input` (int, null) / `token_output` (int, null) — denormalized from breakdown for fast aggregation. Nulls for non-LLM activities.
- `model` (text, null) — primary model used, if any. Pulled out for grouping; full per-call list stays in breakdown.

Rationale: scalar `cost_usd` + jsonb `cost_breakdown` is the standard split — cheap rollups, no schema churn when a new provider lands.

### Error categorization
- `error_class` (text, null, check in enum below) — coarse category for routing/alerts.
- `error_code` (text, null) — provider-specific code, e.g. `rate_limit_exceeded`, `invalid_api_key`. Free text but stable per provider.
- `error_message` (text, null) — human-readable message. Truncated to ~4KB at write time.
- `error_detail` (jsonb, null) — full structured payload (stack, provider response, request id).
- `is_retriable` (bool, null) — classifier decision at failure time; lets the retry scheduler key off a single column.

`error_class` enum: `'transient','rate_limit','timeout','auth','validation','dependency','permanent','unknown'`. Eight buckets cover the actionable cases without sliding into noise.

### Inputs/outputs (provenance)
- `input` (jsonb, null) — what the activity was called with. Required for replay.
- `output` (jsonb, null) — what it returned on success. Null on failure.
- `output_artifact_ids` (uuid[], null) — FKs to `canon.artifacts` for any persisted outputs.

### Observability / actor attribution
- `actor_id` (uuid, FK -> `canon.actors.id`, null) — who/what triggered the run (operator persona, scheduled job, webhook).
- `session_id` (text, null) — Claude Code session id when initiated from a session.
- `trace_id` (text, null) — distributed-trace correlation across systems.
- `created_at` (timestamptz, not null, default now()) — row insertion time.

## Indexes

- PK on `id`
- `(activity_id, started_at desc)` — "show recent runs of this activity"
- `(workflow_id) where workflow_id is not null` — workflow rollups
- `(status, next_retry_at) where status = 'failed' and next_retry_at is not null` — retry scheduler hot path
- `(idempotency_key) unique where idempotency_key is not null` — dedup
- `(error_class) where status = 'failed'` — error-rate dashboards
- `(created_at desc)` — recency feed

## What I deliberately did NOT add

- No `worker_id` / `hostname` — premature; add when we have >1 runner.
- No materialized cost-per-day rollup — start with a view; promote if it gets slow.
- No `tags` jsonb — overloaded escape hatches rot fast. Add named columns when a real query needs them.
- No `priority` — scheduler concern, not run-history concern.
