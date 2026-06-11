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
     verified_by: null, note: "context-bound 2026-06-11: loader requires the play folder, writes
     staging_batch_meta + play_dir (--no-play is the explicit escape; migration 0013); explorium
     pull needs industry filter before next real run; source column must name the provider, not
     the batch (fix in flight with flag-resolve v0)"}
  - {name: Canon corpus, type: database, ownership: "shared:canon-ingestion", status: connected,
     verified_by: null, note: "bespoke read — engagement context for play sessions"}
  - {name: Flag writer (flags-v0.sql), type: sql, ownership: own, status: built, verified_by: null,
     path: "accounts/clients/teknova/plays/mrna-therapeutics/classifier/flags-v0.sql",
     note: "writes prep_flags work items + prep_attention on staging rows; v0 from the mRNA pilot"}
  - {name: Flag resolver (rule-gated), type: skill, ownership: own, status: to-build, verified_by: null,
     note: "resolves decision flags ONLY with a rule_ref cited; no rule -> escalate; see flag-resolve context rows"}
context:
  - {name: play-prep skill (planner + executor), version: phase-4, status: drafted, verified_by: null,
     note: "agent drives the funnel via the status CLI; validated on two plays"}
  - {name: Per-play classifier prompts, version: null, status: drafted, verified_by: null,
     note: "hand-made today; demand context v2 generates these"}
  - {name: Play recipes (prep-recipe.json), version: phase-2, status: drafted, verified_by: null,
     note: "run-as-data; stage registry bounds what a recipe may name"}
  - {name: Flag-resolve design decisions, version: 2026-06-11, status: defined, verified_by: null,
     note: "handoff: practices/agentic-systems/HANDOFF-flag-resolve-system-2026-06-11.md. Boris
     decisions: confidence gate is RULE-EXISTENCE-GATED (decision flags resolve only with rule_ref
     cited, no rule -> escalate, first answer mints the rule; confidence recorded as telemetry,
     never gates); prep_flags = one JSONB array + prep_attention scalar, shape locks after Nick
     reacts to real rows; resolver = skill/sub-agent over runners, Inngest only after resolutions
     prove deterministic; escalation packet payload owned by engine, presentation owned by Hermes"}
  - {name: Deepline prior art (adopted into flag-resolve), version: 2026-06-11, status: defined,
     verified_by: null,
     note: "practices/agentic-systems/reference/deepline-tactical-execution-discipline.md — §8
     approval gate (strict section contract -> escalation packet format: Assumptions incl. active
     rule_refs / Evidence / Tentative read + options / Question; incomplete packet cannot escalate;
     alert the surface); §17 defaults disclosure (every resolution/packet lists load-bearing
     rule_refs); §10 over-provision-then-filter (stop-loss: data flags get ONE waterfall pass then
     the row drops; source ~1.4xN); §7 waterfall (two independent sources before ai_resolving
     anything that gates outreach); §6 one-flag pilot before working the batch"}
flow:
  - {node: Load, assets: ["Source loaders (Apollo, Explorium, CSV)"],
     impl: load-companies-csv-to-staging.mjs, kind: node script}
  - {node: Stage, assets: ["Staging schema + promote_staging_batch"],
     impl: "staging.* + staging_batch_meta", kind: Postgres schema}
  - {node: Screen, assets: ["Prep runners (stage1, classify, dedup, route, contacts-screen)", "run-prep orchestrator + --print-plan", "prep_run_status + run-status CLI"],
     impl: run-prep.mjs + 5 stage runners, kind: node scripts (recipe-driven)}
  - {node: Flag-resolve, assets: ["Flag writer (flags-v0.sql)", "Flag resolver (rule-gated)"],
     impl: flags-v0.sql + resolver (to build), kind: SQL + skill}
  - {node: Promote, assets: ["Staging schema + promote_staging_batch"],
     impl: promote_staging_batch(), kind: SQL RPC (SECURITY DEFINER)}
flow_outputs:
  - {name: Qualified rows -> Core (promotion ledger keeps lineage), status: live}
  - {name: Per-batch prep plan artifact (in the play folder), status: live}
  - {name: Run status -> /runs (PrepRunStrip), status: live}
now:
  - "flag-resolve v0 — flags + decision packets landing on the staging surface"
  - "source-column fix in the loader (source = provider, not batch)"
---

The prep/screen funnel of the owned execution engine (systems/revops-engine + projection-ui).
Build phases 0-4 done; Phase 5 (approval gate) and Phase 6 (full funnel) pending — see
practices/agentic-systems/ROADMAP.md until those phases migrate here.

Roadmap:
- **active** — flag-resolve layer v0 (building in the mrna-therapeutics session, 2026-06-11):
  prep_flags work items + field-coverage gate + the three known rules on the live pilot 10;
  then the resolver (rule-gated), then the escalation packet (payload here, presentation via
  Hermes). Design context: see the two agent-context rows above (decisions + Deepline prior art).
- **next** — approval gate ahead of paid stages (ROADMAP Phase 5); closes the ungated-spend hole.
  The flag-resolve escalation packet adopts its four-section contract — build them coherently.
- **later** — full funnel beyond prep (ROADMAP Phase 6).
- **later** — consume generated artifacts from demand-context v2 instead of hand-made criteria.
