# Owned Execution Engine Roadmap

> *Last touched: 2026-06-09. Active focus: none active — Phase 2 (Execution plan as data) is next. Phases 0-1 done.*

**Scope & authority.** This is the authoritative, build-level roadmap for the owned execution engine — Nick's
Deepline-equivalent tactical layer (references input documents, works a GTM funnel through stages, shows the
work move on a trust surface). It spans `systems/revops-engine` + `systems/projection-ui` + a future strategic
layer. **This file is the source of truth for build phases.** The two Airtable roadmaps (system registry, work
roadmap) are higher-altitude operator/registry surfaces and should roll up from this, not compete with it —
reconciling them is a tracked open thread below, deferred.

---

### Phase 0 — Staging → Promote → Core + trust surface *(done)*
**Done when:** in-flight batches live in a Postgres `staging` schema, `promote_staging_batch` moves a batch's qualifying rows into Core idempotently, and projection-ui renders the Records/Staging views over it.
- `staging.<entity>_<batch_id>` tables; `promote_staging_batch` RPC (SECURITY DEFINER, migration 0008); five prep runners (`run-stage1`, `classify`, `dedup`, `route`, `contacts-screen`)
  - → The plumbing that already existed coming in: a holding area for incoming data, a one-way gate that moves the good rows into the permanent database, and the screens that show it.

### Phase 1 — Run-observability spine (`prep_run_status`) *(done)*
**Done when:** a prep run writes per-stage status and the projection-ui Runs strip shows stages advance pending → running → done/error with counts on a real batch.
- `public.prep_run_status` (migration 0011); `lib/run-status.mjs` status primitive + CLI; `run-prep.mjs` orchestrator; projection-ui `PrepRunStrip` + `/api/runs/status`
  - → The live progress bar for a prep run — your owned version of Deepline's session view. Verified end-to-end on `ngabs_2026_06_05`.
- The status primitive mirrors `deepline session` (`seed/set/msg`) so a skill can drive it agent-side later
  - → The progress-writing tool was built so a future autonomous agent can use it without any rewrite.

### Phase 2 — Execution plan as data *(deferred — next up)*
**Done when:** a run is defined by a stored/declared plan the engine reads (stages, order, entity, required inputs); adding or removing a stage needs no code edit to `run-prep.mjs`.
**Model hint:** Opus — this is the data-model design that the autonomous driver and the input contract both build on; getting the abstraction right matters more than speed.
- Replace the hardcoded `stages` array in `run-prep.mjs` with a plan the engine consumes
  - → Right now the five steps are baked into a script. To "work through plans," the plan has to become data the engine reads, so plans can vary per play without editing code.
- Decide the plan's home (per-play file vs a `plays`/`execution_plan` row) and its shape
  - → Pick where a play's recipe lives and what it looks like, so both humans and agents author runs the same way.

### Phase 3 — Input-document contract + pre-flight gate *(sequenced after Phase 2)*
**Done when:** a run refuses to start (or clearly flags) when the play's required input documents are missing, checked against a declared input contract.
**Model hint:** Opus — the contract is the seam between the strategic and execution layers; it has to anticipate inputs that don't exist yet.
- A declared contract of the upstream inputs a run needs (offer, segment, ICP-titles, disqualifiers, ...) per the deepline upstream-inputs doc (§8 pre-flight)
  - → A checklist of "what must be defined before we can run this play," so the engine never improvises strategy it was supposed to be handed.
- Presence/validity check wired ahead of the funnel
  - → A gate that stops a run early if the play isn't actually ready, instead of producing confident garbage.

### Phase 4 — Skill hierarchy / agent-driven driver *(sequenced after Phase 3)*
**Done when:** the play-prep skill can drive the funnel end-to-end (agent issuing the status-primitive CLI), not `run-prep.mjs`.
**Model hint:** Opus — designing the meta-skill + phase-doc + recipe hierarchy is the core "borrow from Deepline" architecture work.
- Owned meta-skill + phase docs + recipes that operate the funnel, mirroring Deepline's skill bundle
  - → Your own version of Deepline's instruction set, so an agent (not a fixed script) decides how to run a play.
- The agent drives the same status primitive the CLI exposes; `run-prep.mjs` becomes one driver, not the only one
  - → The manual script and the autonomous agent share the same machinery — the manual→autonomous step you described.

### Phase 5 — Approval gate + cost discipline *(sequenced after Phase 4)*
**Done when:** any paid-provider stage halts for an explicit pilot → approve → full-run confirmation before spending.
- Port Deepline's approval-gate state machine (pilot, 4-section approval, spend cap) ahead of paid stages
  - → Before the engine spends money on data providers, it stops and asks — the safety catch that separates a tool from a loaded gun.

### Phase 6 — Full funnel beyond prep *(sequenced after Phase 4; likely splits)*
**Done when:** the engine runs discovery → enrich → personalize → activate → capture → analyze for a play, not just prep/screen.
**Model hint:** Opus — system-spanning expansion; expect to split this into sub-phases (per funnel stage) when it becomes active.
- Extend past today's prep/screen stages to the rest of the GTM funnel
  - → Today the engine only sorts and screens existing rows. This is the big expansion: finding companies, enriching them, writing the outreach, pushing to activation, and reading results back.

### Phase 7 — Strategic layer *(open-ended; separate build, on the radar)*
- A separate system that authors and iterates the input documents Phase 3 consumes (offer, segment, ICP, copy, ...)
  - → The "decides who and why" brain you said you'd build separately. It lives on this map because the execution engine is useless without the inputs it produces, but it is its own project.

---

## Open threads (not phased)

- **Roadmap & registry consolidation** *(deferred — explicitly not this session, per Nick 2026-06-09)*. Three roadmaps exist with no source-of-truth rule: this file (build phases), the **system-registry roadmap** (Airtable `apppQjlZiktpbO4aX/tblt6pQ3Snu7qkMGb`), and the **work roadmap** (Airtable `appz7I91uNxWBnly8/tblGOhsxLL0dKhAHZ`). They overlap and carry stale items. Future work: decide source-of-truth-by-altitude (file = build phases, Airtable = portfolio/registry rollup), define how they sync, and clean up old items in both bases.
- **DB infra hygiene** (from the 2026-06-09 cron fix). The four audit-matview *definitions* are still out-of-band (not in tracked migrations) — capture them. And `v_contact_field_completeness` (~7.4KB def) scans 26k rows in 12-19s — rework the query (per-row jsonb / self-join smell). Neither blocks; see migration 0012 + memory `project_revops_db_micro_cron_saturation`.
