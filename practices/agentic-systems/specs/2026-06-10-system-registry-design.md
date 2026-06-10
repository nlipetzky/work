# System registry & evolving-state view — design

*2026-06-10. Brainstormed Nick + Boris. Supersedes the STATUS.md v0 front door (which becomes a consumer, then retires). Vocabulary per `reference/system-classification.md` (the locked five layers); "bridge" is banned as a term.*

## Problem and job

Nick builds many systems and re-orients from scratch each return because no surface holds the
Agentic System's evolving state. Prior attempt (STATUS.md flat list) tracked work items; Nick
rejected that altitude as noise. The job: **a view of the Agentic System in its evolving state** —
what exists, what makes each system work under the hood, how far along each one is, and where
judgment is needed — plus a per-system roadmap. Secondary audience: the same inventory is the
"what do we actually have" value-demonstration view (KAI sells this architecture).

## Decisions made (do not re-litigate without Nick)

1. **Source of truth: repo files**, agent-maintained, git-historied. Surfaces (HTML, Airtable) are
   projections, never sources.
2. **View delivery: projection-ui** (same read-files-via-API pattern as the Context reader). Static
   HTML generator rejected.
3. **No in-flight / inbox work-item lists.** Rejected as noise.
4. **Contract-first.** A system page IS its emit contract rendered live. Status = contract
   fulfillment (is each input wired, each output producing), never a hand-set chip.
5. **Two-kind decomposition** under every system: **assets** (built things with value — databases,
   n8n workflows, Inngest functions, scripts, surfaces; an empty-but-built database counts) and
   **agent context** (what the agent knows — prompts, skills, rubrics, knowledge bases).
6. **Inventory includes shared assets.** An asset owned elsewhere (e.g. Canon corpus) appears in
   every system that connects to it, tagged `shared · <owner>`, with the bespoke connection
   described on the row. Ownership stays singular (catalog rule); listing is per-connection.
7. **Home screen = review surface**, not dashboard: queue of items needing Nick's judgment + diff
   since last review. Constellation map demoted to navigation.
8. **UI protocol** (all future UI work): name the job of the screen → mock with real data in chat →
   approved mockup is the spec → only then code.

## Frontier-grade requirements (Boris additions, approved)

1. **Evals split by kind**: assets are verified by tests; agent context by evals (golden examples).
   Every inventory/context row carries `verified_by`; without it, the row cannot claim tested.
   Filled is not trusted.
2. **Runs-visibility gate**: a system cannot be marked Operating unless its runs are observable on
   a surface (records↔runs projection pattern).
3. **Autonomy level per system**: `manual → assisted → supervised → autonomous`. Climbed
   deliberately; automate only what proved itself manually.
4. **Failure behavior + escalation in the contract**: per-system declaration of missing-input /
   provider-error / low-confidence behavior; named escalation routes (spend → approval gate,
   expert boundary → Hermes, policy → Guard).
5. **Cost envelope in the contract**: what a run may spend; actual spend lands in run telemetry.
6. **Versioned agent context, output provenance**: context assets carry versions; consuming
   artifacts cite the skill version + evidence that produced them.

The common move: every claim becomes a checkable fact.

## Registry file schema

```
~/code/work/registry/
  _meta.yml                     # last_reviewed timestamp, registry version
  _review/                      # the review queue (see below)
    2026-06-10-demand-context-definition.md
  <constellation-slug>/         # canon/ compass/ signal/ forge/ voice/ pulse/ guard/ garden/
    <system-slug>/
      system.md                 # the registry record (schema below)
      design.md                 # lifecycle artifacts, created as stages are earned
      architecture.md
      roadmap.md
      operating.md
```

`system.md` — YAML frontmatter carries everything the UI renders; body is prose ("what it is").

```yaml
name: Demand context
slug: demand-context
home: signal                    # ONE home constellation (by shared substrate)
clusters: [revops]              # sales tags, many allowed
class: core                     # core | supporting | generic
lifecycle: defined              # defined | designed | architected | engineering | operating
flags: []                       # parked | retired
autonomy: manual                # manual | assisted | supervised | autonomous
outcome: >
  Outbound plays run on evidenced demand understanding, never a guessed ICP.
contract:
  inputs:
    - {name: Expert transcripts (CMO intake), status: manual}
    - {name: Expert email threads, status: unwired}
  outputs:
    - {name: Observations (graded, sourced), status: off}
    - {name: Consuming artifacts (ICP, segment, classifier), status: handmade}
  metrics:
    - {name: Artifact claims traceable to evidence, value: null}
  stopping: >
    Per capture event: all signal extracted to observations with provenance.
    Per play: consuming artifacts validated against play criteria, expert-approved.
  failure: >
    Missing input: proceed and report (no silent skip). Low-confidence extraction:
    grade it low, never drop the verbatim.
  escalation: [spend → approval gate, expert boundary → Hermes]
  cost_envelope: {per_run: "LLM extraction only; no paid providers"}
assets:
  - {name: Observation store, type: database, ownership: own,
     status: to-build, verified_by: null,
     note: Postgres schema — verbatim + provenance + evidence grade}
  - {name: Canon corpus, type: database, ownership: "shared:canon-ingestion",
     status: connected, verified_by: null,
     note: bespoke read — pulls capture events (transcripts, email_threads)}
context:
  - {name: Evidence-grading rubric, version: v1, status: defined,
     verified_by: null, note: part of methodology locked 2026-06-10}
  - {name: Extraction skill, version: null, status: to-write,
     verified_by: null, note: signal → graded observations}
```

Input/output status vocabulary: `live | manual | handmade | unwired | off`. Asset/context status:
`to-build | to-write | building | built | tested | connected | operating` (asset),
`to-write | drafted | defined | evaled` (context). `verified_by` points at a test file or eval set.

## Lifecycle (the methodology, enforced by artifacts)

| Stage | Earned by | Gate |
|---|---|---|
| Defined | emit contract locked in system.md | one-outcome test; context-isolation test (research doc) |
| Designed | design.md: full asset + context decomposition | every contract output maps to rows |
| Architected | architecture.md: substrate, schemas, where it runs | shared-asset connections named |
| Engineering | roadmap.md active; rows moving | rows can't claim tested without verified_by |
| Operating | operating.md (how to use / keep live) | runs visible on a surface; metrics measurable |

Autonomy is an orthogonal axis, raised only with evidence from the previous level. Parked/Retired
are flags at any stage, set only by Nick.

## Views (projection-ui)

- `/system` — **home, the review surface**: review queue (from `registry/_review/`) + diff since
  `last_reviewed` (derived from git log over `registry/`). v0 read-only; approvals happen in a
  Claude Code session (the agent applies the change and archives the queue item). Action buttons
  are v1.
- `/system/map` — constellation grid (the approved overview mock, minus in-flight/inbox). Coverage
  derived from each system.md, replacing hand-edits to constellation docs' tables over time.
- `/system/<constellation>/<slug>` — the system page (approved v3 mock): header + one outcome,
  contract strip (expandable), inventory, agent context, roadmap, history (git log of the system
  dir).

Review-queue item file: frontmatter `{type: artifact-approval | decision | spend-gate, system,
evidence, proposed}` + a short body. Created by agent sessions at exit instead of an inbox of
chores; resolved by Nick's call in-session.

## Seeding (v0)

1. Stub all 24 systems from the constellation docs' tables (name, class, coverage → rough status).
2. Full record for `demand-context` (the live example; content from the approved mocks).
3. Full record for one operating system (`revops-engine`'s prep funnel) to prove the Operating
   gate renders honestly.

## Out of scope (deliberate)

- SessionStart hook tuning — only after the registry proves itself in use.
- Airtable sync / retirement of the two Airtable roadmaps — registry must earn authority first.
- Editing/curation from the UI (v1).
- Work-item tracking of any kind.

## Resolved questions (2026-06-10, Nick)

- **Demand-context home**: Nick's call — it lives in the RevOps engine. Recorded per the locked
  taxonomy (RevOps is a Cluster, `home` takes a constellation) as `home: signal`,
  `clusters: [revops]`; the system page displays the RevOps engine association prominently.
  Demand context's example record above updates from `home: canon` accordingly.
- **Roadmaps are per-system** (`roadmap.md` in each system dir). Intertwined work is handled by
  dependency lines: a roadmap item may reference another system's slug. The existing build-level
  ROADMAP.md dissolves into per-system roadmaps gradually as systems get registered; until then it
  stays authoritative for the phases it covers.
