# Owned Execution Engine Roadmap

> *Last touched: 2026-06-09. Active focus: Phase 7 (Context collection hub) — the keystone of the SME context loop. Phases 0-4 done. Phase 5 (approval gate) is newly live-relevant after tonight's ungated provider spend.*

**Scope & authority.** This is the authoritative, build-level roadmap for the owned execution engine — Nick's
Deepline-equivalent tactical layer (references input documents, works a GTM funnel through stages, shows the
work move on a trust surface). It spans `systems/revops-engine` + `systems/projection-ui` + the strategic layer.
The strategic end (Phases 7-9) now realizes the **SME context loop** — see
`practices/agentic-systems/reference/sme-context-loop.md`. **This file is the source of truth for build phases.**
The two Airtable roadmaps (system registry, work roadmap) are higher-altitude operator/registry surfaces and
should roll up from this, not compete with it — reconciling them is a tracked open thread below, deferred.

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

### Phase 4 — Agent-driven driver + play-agnostic funnel *(done)*
**Done when:** the play-prep skill can drive the funnel end-to-end (agent issuing the status-primitive CLI), not `run-prep.mjs`.
**Model hint:** Opus — the seam design (what the agent owns vs the script) and making the funnel genuinely play-agnostic is multi-system reasoning.
- Shipped: `run-prep.mjs --print-plan` emitter (`lib/recipe.mjs buildPlan`) + the `play-prep-planner` rewired to drive each stage via the `run-status.mjs` CLI (seed → set running → runner self-marks done). `run-prep.mjs` is now one driver, the agent the other, over the same recipe + status table
  - → An agent, not a fixed script, now runs a play — reading the recipe and reporting progress as it goes. The manual→autonomous step.
- Made the funnel play-agnostic (surfaced by running a second play): `lib/read-fields.mjs` (classifier read-fields per play) + `generate-prep-plan.mjs` optional `prep_verified` + `--play`
  - → The funnel no longer assumes the one original play. Two hardcodes that only broke on a new play were removed.
- Validated end-to-end on two plays: `ngabs_2026_06_05` and the CIPO `patent-portfolio-mgmt` motions batches (Apollo + Explorium), each driven recipe → readiness → seed → stages → artifact → approval stop
  - → Proven on a play it had never seen, which is the whole point of the recipe-driven design.

### Phase 5 — Approval gate + cost discipline *(sequenced after Phase 4; newly live-relevant)*
**Done when:** any paid-provider stage halts for an explicit pilot → approve → full-run confirmation before spending.
- Port Deepline's approval-gate state machine (pilot, 4-section approval, spend cap) ahead of paid stages
  - → Before the engine spends money on data providers, it stops and asks — the safety catch that separates a tool from a loaded gun.
- Newly concrete: tonight's CIPO sourcing spent Apollo + Explorium credits with no gate; the moment list-building touches paid providers in the loop, this matters
  - → We already proved the spend happens. This phase makes it deliberate instead of incidental.

### Phase 6 — Full funnel beyond prep *(sequenced after Phase 4; likely splits)*
**Done when:** the engine runs discovery → enrich → personalize → activate → capture → analyze for a play, not just prep/screen.
**Model hint:** Opus — system-spanning expansion; expect to split this into sub-phases (per funnel stage) when it becomes active.
- Extend past today's prep/screen stages to the rest of the GTM funnel
  - → Today the engine only sorts and screens existing rows. This is the big expansion: finding companies, enriching them, writing the outreach, pushing to activation, and reading results back.

### Phase 7 — Context collection hub *(open question — keystone of the SME loop; design next)*
**Done when:** a batch references one context-collection object the projection-ui surface renders — play, ICP criteria, data criteria, offer, sourcing definition, client/SME feedback, run history — replacing `staging_batch_meta`'s flat file-path pointers.
**Model hint:** Opus — data-model + trust-surface design, and it's the contract both Hermes and the engine attach to.
- New first-class context object the batch links to (`campaign`/`input-set`/TBD name); resolves play + recipe `inputs[]` + sourcing definition + feedback + runs; surfaced as a per-batch "Context" panel
  - → One place that shows everything guiding a list: the criteria, the offer, the expert's feedback, where the data came from. The batch points at it with a single link instead of scattered file paths.
- Replaces `staging_batch_meta` (flat pointers, populated only by the old pipeline — CSV-loaded batches are context-orphaned today, which is why the CIPO prep-plan header showed "?")
  - → Fixes the gap where a batch loaded any way but the original pipeline has no recorded context at all.

### Phase 8 — Feedback return path *(sequenced after Phase 7)*
**Done when:** list-building results (what qualified, gaps, where the ICP was wrong) are captured back into the context collection and routed to Hermes as expert questions / approval asks.
- Close the loop: engine results → context collection → Hermes → expert → iterated inputs
  - → Today list-building is one-way. This is the return leg — what the data taught us flows back to sharpen the expert's input. The long-missing "keep-live" layer.

### Phase 9 — Autonomous expert-fed synthesis *(open-ended; routes through Hermes)*
**Done when:** an autonomous loop ingests expert signal (emails, transcripts, documents) and drafts/iterates the strategic documents, with the human approval gate intact.
**Model hint:** Opus — authoring under the expert's name; the hardest, safety-sensitive leg.
- Ingest [A] expert signal → draft/iterate [C] the strategic documents; authoring is **Hermes craft**, orchestration is the meta-practice; expert signs off before anything is load-bearing
  - → The "decides who and why" brain, fed automatically from the expert's own emails and calls — but it never speaks for the expert without sign-off. (Was the old open-ended Phase 7; now sharpened by the SME-loop vision.)

---

## Open threads (not phased)

- **Roadmap & registry consolidation** *(deferred — explicitly not this session, per Nick 2026-06-09)*. Three roadmaps exist with no source-of-truth rule: this file (build phases), the **system-registry roadmap** (Airtable `apppQjlZiktpbO4aX/tblt6pQ3Snu7qkMGb`), and the **work roadmap** (Airtable `appz7I91uNxWBnly8/tblGOhsxLL0dKhAHZ`). They overlap and carry stale items. Future work: decide source-of-truth-by-altitude (file = build phases, Airtable = portfolio/registry rollup), define how they sync, and clean up old items in both bases.
- **DB infra hygiene** (from the 2026-06-09 cron fix). The four audit-matview *definitions* are still out-of-band (not in tracked migrations) — capture them. And `v_contact_field_completeness` (~7.4KB def) scans 26k rows in 12-19s — rework the query (per-row jsonb / self-join smell). Neither blocks; see migration 0012 + memory `project_revops_db_micro_cron_saturation`.
- **CIPO criteria are provisional.** The `patent-portfolio-mgmt` classifier-prompt + stage1 SQL were operator-authored as a motions cut; the real ICP comes from the 2026-06-10 CMO intake. The sourcing query (Explorium `website_keywords`) is a content match, not an industry filter — add a `linkedin_category`/`naics_category` filter for the real run.
