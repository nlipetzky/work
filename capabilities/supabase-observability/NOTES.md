# Supabase observability via NocoDB — working notes

**Goal:** an Airtable-like surface over Supabase Postgres so data is independently
inspectable and operable (filter/view/trigger via UI), without trusting AI
narration. This is the bridge that lets a future Inngest build keep Supabase as
the engine without losing the observability that drove the return to Airtable.
See memory `reference_inngest_observable_architecture.md`.

**Decision:** NocoDB, not Metabase.
- NocoDB = Airtable-style grid/operational surface over existing Postgres:
  views, filters, inline edits, forms, row-change webhooks. Matches the need.
- Metabase = BI/dashboards, read-only. Complement later for "show me the
  numbers"; NOT a control plane. Do not split background time across both.

## The connection (do this first, prove it before NocoDB)

Supabase IS Postgres. NocoDB connects to it as an EXTERNAL data source.

- Connection string: Supabase dashboard -> Project Settings -> Database ->
  Connection string. Prefer the **direct** connection (port 5432) for a
  long-lived tool; the pooler (6543, transaction mode) can break NocoDB
  metadata introspection. Use session pooler only if direct is unavailable.
- Project on file: `mrmnyscurmkfppicqqhk` (revops-engine-dev). The DB password
  is NOT the `SUPABASE_ACCESS_TOKEN` in `~/code/aos/.env` — get the DB
  password from the dashboard (or reset it there).
- Set it locally as an env var; never commit it. `connect-test.sh` reads
  `SUPABASE_DB_URL` and proves connectivity + lists public tables before you
  touch NocoDB. Run that first — if it fails, NocoDB will too, and you'll
  waste time debugging the wrong layer.

## The #1 dead-end (read before you start)

NocoDB connects fine but every table looks EMPTY. This is almost never a
connection failure. It is one of:
1. **Schema scope.** Supabase has `auth`/`storage`/`realtime`/`extensions`
   schemas plus `public`. Point NocoDB at `public` (or your specific
   schemas). Don't let it try to mount Supabase-internal tables.
2. **Row-Level Security.** Supabase enables RLS on tables. NocoDB connects
   with one Postgres role; under RLS that role sees nothing unless policies
   allow it. Connect with a role that BYPASSES RLS (e.g. the `postgres`
   superuser / service role for an internal observability tool on your own
   data) or grant explicit access. This is the cause ~90% of the time.

## Checklist (work this in the background, between L2 round-trips)

- [ ] Get Supabase direct connection string + DB password from dashboard.
- [ ] `export SUPABASE_DB_URL='postgresql://...'` (do not commit).
- [ ] Run `./connect-test.sh` — confirm it lists `public` tables with row
      counts. If empty/error, fix connection/role BEFORE NocoDB.
- [ ] Confirm NocoDB Docker container is running (`docker ps`); note the
      port/URL.
- [ ] In NocoDB: create a new base -> "Connect to external database" ->
      Postgres -> paste connection -> scope to schema `public` -> role that
      bypasses RLS.
- [ ] Verify a known table (e.g. the revops cohort table) shows real rows
      and counts that match what you expect.
- [ ] Build one filtered view that answers a real question you currently
      can't see (e.g. classification distribution, keystone verdicts).
- [ ] Test one row-change webhook (NocoDB -> n8n/Inngest) as a proof the
      operational-trigger path works, mirroring the Triggers-table pattern.

## Out of scope (don't rabbit-hole)

Not migrating any workflow. Not the L2 session. Not Metabase dashboards yet.
Just: prove Supabase data is viewable/operable through NocoDB the way
Airtable is. Stop when a real filtered view + one webhook work.
