---
name: Signal Prospecting
slug: signal-prospecting
home: signal
clusters: [revops]
class: core
lifecycle: engineering
flags: []
autonomy: supervised
outcome: >
  More qualified opportunities than we can pursue — sourced, screened, and promoted
  with the work visible while it moves.
runs_surface: "projection-ui PrepRunStrip (/runs) over public.prep_run_status"
contract:
  inputs:
    - {name: Play bundle (recipe, criteria, classifier config), status: live}
    - {name: Source batches (Apollo / Explorium / CSV loaders), status: live}
    - {name: Consuming artifacts from demand context, status: handmade}
  outputs:
    - {name: Qualified rows promoted to Core, status: live}
    - {name: Per-batch prep plan artifact, status: live}
    - {name: Per-stage run status, status: live}
  metrics:
    - {name: Stage pass-through counts per batch, value: "per-run, on /runs"}
    - {name: Plays proven end-to-end, value: 2}
  stopping: >
    Per batch: every stage in the play recipe ran, qualifying rows promoted idempotently,
    approval stop before anything leaves the system.
  failure: >
    Stage error -> run status marks error with counts, batch halts, nothing promotes silently.
  escalation: ["spend -> approval gate (Phase 5, not yet built)", "criteria conflict -> operator"]
  cost_envelope: {per_run: "LLM classify stage; paid sourcing currently UNGATED — Phase 5 closes this"}
assets:
  - {name: Staging schema + promote_staging_batch, type: database, ownership: own, status: operating,
     verified_by: null, note: "Postgres staging.* + SECURITY DEFINER RPC (migration 0008)"}
  - {name: Prep runners (stage1, classify, dedup, route, contacts-screen), type: script, ownership: own,
     status: tested, verified_by: "systems/revops-engine test suite (21/21, node --test)",
     note: "recipe-driven, play-agnostic since Phase 4"}
  - {name: run-prep orchestrator + --print-plan, type: script, ownership: own, status: tested,
     verified_by: "systems/revops-engine/run-prep.print-plan.test.mjs"}
  - {name: prep_run_status + run-status CLI, type: database, ownership: own, status: operating,
     verified_by: null, note: "the observability spine (migration 0011)"}
  - {name: PrepRunStrip + /api/runs/status, type: surface, ownership: own, status: operating,
     verified_by: null, note: "the live progress bar over a prep run"}
  - {name: Source loaders (Apollo, Explorium, CSV), type: script, ownership: own, status: built,
     verified_by: null, note: "explorium pull needs industry filter before next real run"}
  - {name: Canon corpus, type: database, ownership: "shared:canon-ingestion", status: connected,
     verified_by: null, note: "bespoke read — engagement context for play sessions"}
context:
  - {name: play-prep skill (planner + executor), version: phase-4, status: drafted, verified_by: null,
     note: "agent drives the funnel via the status CLI; validated on two plays"}
  - {name: Per-play classifier prompts, version: null, status: drafted, verified_by: null,
     note: "hand-made today; demand context v2 generates these"}
  - {name: Play recipes (prep-recipe.json), version: phase-2, status: drafted, verified_by: null,
     note: "run-as-data; stage registry bounds what a recipe may name"}
---

The prep/screen funnel of the owned execution engine (systems/revops-engine + projection-ui).
Build phases 0-4 done; Phase 5 (approval gate) and Phase 6 (full funnel) pending — see
practices/agentic-systems/ROADMAP.md until those phases migrate here.

Roadmap:
- **next** — approval gate ahead of paid stages (ROADMAP Phase 5); closes the ungated-spend hole.
- **later** — full funnel beyond prep (ROADMAP Phase 6).
- **later** — consume generated artifacts from demand-context v2 instead of hand-made criteria.
