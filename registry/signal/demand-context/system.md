---
name: Demand context
slug: demand-context
home: signal
clusters: [revops]
class: core
lifecycle: defined
flags: []
autonomy: manual
outcome: >
  Outbound plays run on evidenced demand understanding, never a guessed ICP.
runs_surface: null
contract:
  inputs:
    - {name: Expert transcripts (CMO intake), status: manual}
    - {name: Expert email threads, status: unwired}
    - {name: Play documents (offer, brief), status: live}
    - {name: Run results (qualified / rejected), status: unwired}
  outputs:
    - {name: Observations (graded, sourced), status: off}
    - {name: Patterns (durable claims), status: off}
    - {name: Consuming artifacts (ICP, segment, classifier), status: handmade}
  metrics:
    - {name: Artifact claims traceable to evidence, value: null}
    - {name: Observation freshness, value: null}
    - {name: Patterns confirmed vs refuted by runs, value: null}
  stopping: >
    Per capture event: all signal extracted to observations with provenance.
    Per play: consuming artifacts validated against play criteria, expert-approved.
  failure: >
    Missing input: proceed and report, no silent skip. Low-confidence extraction:
    grade it low, never drop the verbatim.
  escalation: ["spend -> approval gate", "expert boundary -> Hermes"]
  cost_envelope: {per_run: "LLM extraction only; no paid providers"}
assets:
  - {name: Observation store, type: database, ownership: own, status: to-build, verified_by: null,
     note: "Postgres schema — verbatim + provenance + evidence grade"}
  - {name: Capture-event log, type: database, ownership: own, status: to-build, verified_by: null,
     note: "one row per signal capture; event #1 = CMO intake 2026-06-10"}
  - {name: Ingestion pipeline, type: inngest-function, ownership: own, status: to-build, verified_by: null,
     note: "transcript lands -> extraction runs -> observations written"}
  - {name: Context panel, type: surface, ownership: own, status: to-build, verified_by: null,
     note: "projection-ui per-batch view of the context behind a list"}
  - {name: Canon corpus, type: database, ownership: "shared:canon-ingestion", status: connected, verified_by: null,
     note: "bespoke read — pulls capture events (transcripts, email_threads)"}
  - {name: Play bundles, type: filesystem, ownership: "shared:signal-prospecting", status: building, verified_by: null,
     note: "bespoke write — consuming artifacts land in per-play folders, hand-made today"}
context:
  - {name: Evidence-grading rubric, version: v1, status: defined, verified_by: null,
     note: "part of the demand-context methodology locked 2026-06-10"}
  - {name: Extraction skill, version: null, status: to-write, verified_by: null,
     note: "signal -> graded observations, verbatim preserved, provenance attached"}
  - {name: Synthesis skill, version: null, status: to-write, verified_by: null,
     note: "observations -> patterns -> consuming artifacts (ICP, segment, classifier)"}
  - {name: Demand knowledge base, version: null, status: to-write, verified_by: null,
     note: "the accumulated observations + patterns; seeds with capture event #1"}
---

Extracts data, information, and insight from transcripts and other demand-side sources so
outbound plays truly understand the marketing target. Methodology: signal -> observation ->
pattern -> consuming artifact, verbatim + provenance + evidence grades, manual first.

Roadmap (closes the contract gaps):
- **v0 (active)** — capture CMO intake by hand; first graded observations. Proves the extraction.
- **v1** — observation schema + capture log become real; observations output turns on.
- **v2** — synthesis turns on; consuming artifacts generated, not hand-made; metrics measurable.
- **v3** — run-results input wired; the feedback leg closes (depends: signal-prospecting).
