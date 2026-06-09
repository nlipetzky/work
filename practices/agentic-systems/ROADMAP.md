# Owned Execution Engine Roadmap

> *Last touched: 2026-06-09. Active focus: Phase 4 (Skill hierarchy / agent-driven driver) is next. Phases 0-3 done.*

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

### Phase 2 — Execution plan as data *(done)*
**Done when:** a run is defined by a stored/declared plan the engine reads (stages, order, entity); adding or removing a stage needs no code edit to `run-prep.mjs`. *(Required-inputs gating moved to Phase 3.)*
- Shipped: per-play `prep-recipe.json` (run-as-data) + `lib/stage-registry.mjs` (safety boundary, recipe can only name known stages) + `lib/recipe.mjs` (loader/validator, fail-fast); `run-prep.mjs` reads the recipe instead of a hardcoded array
  - → The five steps are no longer baked into a script. A play's funnel lives in a recipe file next to its config; reorder or drop a stage by editing the file, no code change.
- Binding folded in: new `systems/revops-engine/CLAUDE.md` + an `@import` in `accounts/clients/teknova/CLAUDE.md` so account-launched sessions load system context
  - → Fixes the "launch from an account, get no engine context" gap. Verified on `ngabs_2026_06_05`: 5/5 recipe-driven run; removing a stage yields a 4-stage run with no code change.

### Phase 3 — Input readiness check *(done)*
**Done when:** before a run, the engine reports in plain English which of the play's declared input documents are present vs missing (now vs later) and proceeds; `--strict` stops on a missing needed input. *(Took the "clearly flags" branch deliberately — a report, not a hard gate.)*
- Shipped: a visible per-play `inputs` list in `prep-recipe.json` (name + path + `now`/`later`) + `lib/readiness.mjs` (`checkReadiness`/`formatReadiness`); `run-prep.mjs` prints the readiness report before seeding, proceeds by default, `--strict` stops
  - → Before a run you see, in plain words, which strategic documents back the play and what's missing. It informs; it doesn't block unless you ask with `--strict`. Verified on `ngabs_2026_06_05`.
- Honors `feedback_no_blocker_overbuild`: zero new default hard-stops, plain-English output (no acronyms), the contract visible in the recipe
  - → Built to inform, not obstruct — the report reads like a human checklist, and nothing is hidden in code.

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
