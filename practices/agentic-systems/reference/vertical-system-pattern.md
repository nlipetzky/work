# Vertical-by-system pattern

## The pattern

Each system in `~/code/work/systems/<name>/` owns its own vertical: code, schemas, workflows, scripts, skills, adapters, evals. Cross-cutting infrastructure goes in `capabilities/` only when it passes the promotion rubric (used by 2+ systems, stable contract, no system-specific assumptions). The slogan: **systems are the unit of ownership; capabilities are the shared library.** The default move when you find new code is to put it in the system that owns the work it does, not in a global folder.

## System internal layout

Populate only the subfolders a system actually uses. Empty scaffolding is noise.

- `workflows/` ... durable functions (Inngest, n8n exports, cron-driven jobs) owned by this system.
- `scripts/` ... one-shot or operator-invoked scripts (ingest, backfills, repair).
- `schemas/` ... migrations, table definitions, view DDL, JSON schemas the system owns.
- `skills/` ... Claude skills scoped to this system's domain (not cross-cutting).
- `adapters/` ... thin wrappers around external APIs/providers this system consumes.
- `evals/` ... regression fixtures and harnesses for the system's deterministic outputs.
- `CLAUDE.md` ... persona/operator brief for sessions launched from this folder.
- `INDEX.md` (generated) ... auto-emitted by the index script; do not hand-edit.

No ceremony. A system with only `CLAUDE.md` and `schemas/` is fine. Add folders the moment they have a real occupant.

## Canonical example: the Inngest mount

The first proven case of vertical-by-system + capabilities split.

- `capabilities/inngest/` holds the shared Inngest client (one instance, one config, one auth surface).
- Each system that owns durable workflows puts them in its own `workflows/` folder and imports the client from `capabilities/inngest/`. Example: `systems/revops-engine/workflows/sync-on-promote.ts` (moved out of `systems/projection-ui/lib/inngest/` ... that file did not belong to projection-ui, it belonged to revops-engine).
- `systems/projection-ui/app/api/inngest/route.ts` unions functions from every owning system and serves the single Inngest endpoint.
- Dev command: `inngest dev -u http://localhost:4180/api/inngest`.

Why this passes the capabilities rubric: the client is used by 2+ systems, the contract (an Inngest `Client` instance + `serve` handler) is stable upstream, and there are no system-specific assumptions baked in. Functions stay with their owning system because they are not shared ... they are durable instances of that system's work.

## Cross-system workflows: primary durable owner

When a workflow spans systems (e.g. a promote event in revops triggers a projection refresh), one system is the **primary durable owner** ... the one whose state machine the workflow advances. Place the function in that system's `workflows/`. Other systems participate via events, not by co-locating code. If two systems each own legitimate halves, split the workflow into two functions, one per owner, chained by event.

The trap to avoid: dumping cross-system workflows into `projection-ui/` because that's where the HTTP endpoint lives. The endpoint serves; it does not own.

## Route group vs own UI

A system becomes a route group inside `projection-ui` (e.g. `/operate`, `/work`, `/system`) when:
- It needs a UI surface but the surface is read-mostly and shares the projection-ui shell (auth, nav, theme).
- Its data lives in canon or revops and projection-ui already reads those.

A system gets its **own** UI app when:
- It needs a different deploy target, auth model, or domain (e.g. KonstellationAI.com).
- It serves external users, not Nick-as-operator.
- It has long-running interactive sessions where the projection-ui shell would fight it.

Default to route-group. Promote to own-app only when one of the above fires.

## Lifecycle

System state lives in `canon.systems` (40 rows as of 2026-06-29). The filesystem reflects current state; canon is the truth.

States:
- **planned** ... folder exists, CLAUDE.md sketches intent, nothing runs. Allowed to be sparse.
- **active** ... has at least one ensured activity producing artifacts. The default state for any system Nick uses.
- **maintenance** ... still producing, no active feature work. Operator persona maintained; no new skills added.
- **deprecated** ... slated for removal but still referenced. New work blocked; reads still allowed.
- **archived** ... folder moved out of `systems/` (typically to `~/Archive/`). Canon row kept for history.

Transitions are operator decisions, not automatic. The index script does not enforce state ... it lists what's present on disk and tags missing/bare CLAUDE.md so drift is visible.
