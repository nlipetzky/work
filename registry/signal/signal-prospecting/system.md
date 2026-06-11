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
  - {name: Source loaders (Apollo, Explorium, CSV), type: script, ownership: own, status: operating,
     verified_by: "Apollo loader pulled 140 for mrna_2026_06_11 (2026-06-11)", note: "THREE dedicated
     staging loaders, all play-folder-bound + staging_batch_meta + --source PROVIDER stamped + full
     faithful capture + canonical screener columns ensured: load-companies-csv-to-staging.mjs (CSV),
     load-apollo-to-staging.mjs (search+bulk_enrich via APOLLO_API_KEY; VERIFIED), load-explorium-to-staging.mjs
     (POST /v1/businesses via EXPLORIUM_API_KEY; path-proven, has --naics industry filter + a pre-flight
     /v1/credits check; the Konstellation Explorium account is credit-depleted, so unrun in production).
     NAICS industry filter solved (Apollo organization_naics_codes / Explorium naics_category); source-column
     fix shipped (--source). Both new loaders dedupe by domain via --dedupe-against."}
  - {name: Canon corpus, type: database, ownership: "shared:canon-ingestion", status: connected,
     verified_by: null, note: "bespoke read — engagement context for play sessions"}
  - {name: Flag writer (flags-v0.sql), type: sql, ownership: own, status: built, verified_by: null,
     path: "accounts/clients/teknova/plays/mrna-therapeutics/classifier/flags-v0.sql",
     note: "writes prep_flags work items + prep_attention on staging rows; v0 from the mRNA pilot"}
  - {name: Flag resolver (rule-gated), type: skill, ownership: own, status: to-build, verified_by: null,
     note: "resolves decision flags ONLY with a rule_ref cited; no rule -> escalate; see flag-resolve context rows"}
  - {name: run-play.mjs (deterministic driver), type: script, ownership: own, status: built,
     verified_by: "walks mrna_2026_06_11 -> stops at Flag-resolve gate (2026-06-11)",
     path: "systems/revops-engine/run-play.mjs",
     note: "THE SPINE. Code-driven, not agent-driven. --status reads real DB state (cannot narrate a
     count); --execute runs auto-steps as subprocesses, re-verifies from the DB, stops at gates.
     Reports each verification gate WIRED/NOT WIRED — cannot claim a screen that has no code. Next
     layers: autonomy (Inngest schedule), AI-as-called-function for judgment steps."}
  - {name: CRM-suppression gate, type: script, ownership: own, status: built,
     verified_by: "ran on mrna_2026_06_11 -> 5 SF-matched, 3 open-opp (2026-06-11)",
     path: "systems/revops-engine/gate-crm-suppression.mjs",
     note: "deterministic SF join (staging->Core sf_* by normalized domain), no enrichment; stamps
     crm_status (dnc_suppress|open_opp_review|existing_customer|clear)."}
  - {name: Generic AI-research gate runner, type: script, ownership: own, status: built,
     verified_by: "wetlab gate piloted on 2 mRNA rows, web research real (2026-06-11)",
     path: "systems/revops-engine/gate-ai-research.mjs",
     note: "ONE harness, swap the prompt. Program selects rows, fills a prompt template per row,
     calls Claude (web-search) as a function, parses the structured verdict, writes it back. Every
     soft gate is a CONFIG in gates/ (prompt + io map + run condition). PAID -> --limit pilot,
     operator-run. Gates built: gates/wetlab (NA lab + wet-lab/process/GMP). Next swaps: LinkedIn,
     lab-location detail — each a config, not code. This is the AI-as-called-function layer."}
  - {name: Contact sourcing loader, type: script, ownership: own, status: to-build, verified_by: null,
     note: "people-at-company sourcing (Apollo people search) per the play's ICP-titles artifact, into
     staging.contacts_<batch>; play-folder-bound + --source stamped, same conventions as company loaders.
     PAID — pilot + approval before any scaled pull"}
  - {name: Airtable export payload, type: script, ownership: own, status: built, verified_by: null,
     path: "systems/revops-engine/export-airtable-payload.mjs",
     note: "delivery transport; runs ONLY after delivery-contract validation and Nick's export approval —
     only fully-qualified records cross"}
  - {name: Staging CSV exporter, type: script, ownership: own, status: built,
     verified_by: "ran on mrna_2026_06_11 -> 42-row review CSV (2026-06-11)",
     path: "systems/revops-engine/export-staging-csv.mjs",
     note: "staging -> reviewable CSV (client/expert review sheet, NOT the Airtable transport);
     read-only, --verdicts/--cols/--out flags, companies|contacts; output to <playDir>/output/"}
context:
  - {name: RUNBOOK (the authoritative step sequence), version: 2026-06-11, status: defined, verified_by: null,
     path: "systems/revops-engine/RUNBOOK.md",
     note: "per-node operating procedure: precondition -> registered action -> writes -> SURFACE
     VERIFY (the count you must read, with URL) -> gate. Iron rule: every count comes from the
     surface/query, never session prose; a step is done only when its surface check passes; done =
     the Deliver gate, not a screened batch. The flow on this record is the canonical step index;
     the runbook details each step and must not drift from it."}
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
     impl: "load-apollo-to-staging.mjs | load-explorium-to-staging.mjs | load-companies-csv-to-staging.mjs",
     kind: node scripts (provider-direct, full faithful capture)}
  - {node: Stage, assets: ["Staging schema + promote_staging_batch"],
     impl: "staging.* + staging_batch_meta", kind: Postgres schema}
  - {node: Screen, assets: ["Prep runners (stage1, classify, dedup, route, contacts-screen)", "run-prep orchestrator + --print-plan", "prep_run_status + run-status CLI"],
     impl: run-prep.mjs + 5 stage runners, kind: node scripts (recipe-driven)}
  - {node: Flag-resolve, assets: ["Flag writer (flags-v0.sql)", "Flag resolver (rule-gated)"],
     impl: flags-v0.sql + resolver (to build), kind: SQL + skill}
  - {node: Promote, assets: ["Staging schema + promote_staging_batch"],
     impl: promote_staging_batch(), kind: SQL RPC (SECURITY DEFINER)}
  - {node: Contacts, assets: ["Prep runners (stage1, classify, dedup, route, contacts-screen)", "Contact sourcing loader"],
     impl: "contact sourcing per ICP-titles artifact -> contacts staging -> contacts-screen runner",
     kind: loader (to build) + node script}
  - {node: Deliver, assets: ["Airtable export payload", "Staging CSV exporter"],
     impl: "validate vs play delivery-contract.md -> export-staging-csv.mjs (review sheet) | export-airtable-payload.mjs (transport) -> Nick approval",
     kind: node scripts + approval gate}
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
