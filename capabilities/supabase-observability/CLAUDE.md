# Capability: Supabase observability

Shared observability hooks, readiness checks, and audit clients for the studio's Supabase projects (canon-engine = `mzzjvoiwughcnmmqzbxv`, revops-engine-dev = `mrmnyscurmkfppicqqhk`). The candidate consumers: canon-engine, revops-engine, projection-ui (for status dashboards), and any future system that wants to surface its own health.

## Why this could pass the rubric

1. Used by ≥2 systems (canon + revops, plus projection-ui's surfaced status).
2. No system-specific business policy ... it's the observability substrate.
3. Versions independently of any single project's schema.
4. Infrastructure, not runtime ownership.

## What belongs here

- A common readiness check helper (returns `{ healthy: boolean, lag_ms, last_pg_cron_run, slow_queries }` against any project).
- Audit-log query helpers used by multiple status panels.
- Standard pg_cron + matview lag heuristics.
- A shared client factory that respects the service-role-only RLS posture (per migration 0014 on revops, equivalent on canon).

## What does NOT belong here

- A specific system's status panel UI (lives in projection-ui).
- Project-specific migrations (live with the project).
- Business metrics (revenue, pipeline value, etc. ... those are domain concerns, not observability).

## Current state

Empty scaffolding. Honest read: this folder may turn out to be a system rather than a capability if it grows into a runtime stack with its own dashboard + alerting. Decide once the first real consumer arrives. Until then, keep it as a capability candidate; the bar is the rubric, not the name.
