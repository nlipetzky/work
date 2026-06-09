# System: revops-engine

The RevOps execution engine: a Supabase Postgres (project `mrmnyscurmkfppicqqhk`, "revops-engine-dev")
plus a set of Node runner scripts (`.mjs`) that move per-engagement data through a prep funnel and into a
permanent, growing database. This is the runtime the account folders' plays execute on.

## Vocabulary (locked)

- **Staging** — in-flight batches live in the Postgres `staging` schema (`staging.<entity>_<batch_id>`),
  not in CSV files.
- **Promote** — `promote_staging_batch` moves a batch's qualifying rows into Core, idempotently.
- **Core / Records** — `public.companies` + `public.contacts`, the permanent database that keeps
  everything and grows over time. Dedup by identity (email/domain); never delete.
- **Export** — a contract-gated subset projected out for delivery. The contract gate is at Export, never
  at Core.

## The prep funnel (recipe-driven)

A prep run screens a staging batch through stages: `stage1` (deterministic SQL) → `classify` (semantic,
per-row Anthropic) → `dedup` → `route` → `contacts_screen`. The stages and order are **data**, declared in
the play's `prep-recipe.json`, not hardcoded.

- `run-prep.mjs <batch_id> [--play <playDir>]` — orchestrator: mints a `run_id`, reads the recipe, runs
  each stage. The recipe's `system` field binds the play to this engine.
- `lib/stage-registry.mjs` — maps a stage name to its runner + argv. A recipe can only name a known stage.
- `lib/recipe.mjs` — loads/validates `prep-recipe.json` (falls back to a default five-stage recipe).
- The five runners (`run-stage1`, `classify-runner`, `dedup-runner`, `route-runner`,
  `contacts-screen-runner`) write `prep_*` working columns in STAGING only. Promotion is the only Core write.

## Run observability

`prep_run_status` (one row per `run_id`, stage) records each stage flipping pending → running → done/error
with counts; `lib/run-status.mjs` is the write primitive (the owned `deepline session` equivalent).
projection-ui's Runs page tails it. See `practices/agentic-systems/ROADMAP.md`.

## How the runners reach the DB

Supabase Management API: `POST https://api.supabase.com/v1/projects/mrmnyscurmkfppicqqhk/database/query`,
bearer token from `~/code/work/.env` key `SupaBase_CLI_access_token`. No supabase-js, no OAuth. Migrations
live in `supabase/migrations/` (local numbering 0001+; apply via the same token path).

## Gotchas

- The DB is a Micro instance; heavy cron matview refreshes can saturate it and return HTTP 544. See memory
  `project_revops_db_micro_cron_saturation` (fixed in migration 0012) before assuming your code is broken.
- Migration 0010 (drop n8n triggers) is intentionally held — do not apply.
