# HANDOFF — Build the /operate surface (operating-sop, slice 1) — 2026-06-29

**To start the fresh session, paste:**
> Read and execute this handoff: `/Users/nplmini/code/work/systems/operating-sop/HANDOFF-build-operate-slice1-2026-06-29.md`

Launch root: `/Users/nplmini/code/work/systems/operating-sop` (this system) for the build; the
surface lands in `systems/projection-ui`. Nick ratified the spec (Define → Go), so operating-sop
advances `emerging → building`. Follow `practices/agentic-systems/reference/system-building-method.md`
(§3.4 Build, §3.5 Verify, §3.6 Register+surface). Deterministic spine; AI is a called function, never
the driver. projection-ui runs as launchd `com.nick.projection-ui` on :4180 (restart: `rm -rf .next`
then `launchctl kickstart -k gui/$(id -u)/com.nick.projection-ui`; NEVER kill -9).

## What you are building (slice 1)

The first real slice of `operating-sop`: a `/operate` route in projection-ui that renders the
control surface + one SOP, validated against the prototype Nick approved. NOT the full authoring
engine, NOT the full canon schema yet. Two views:

1. **Control surface (home)** — lists the SOPs you run the business by, each with rollup status +
   next action; click one to operate it. (Slice 1: the CIPO SOP is real; 1-2 others can be stubs.)
2. **SOP detail** — the SOP as a left→right step flow (L1), one step ("build the list") opened into
   its workflow drawn as connected nodes (L2), each node an activity (L3). A breadcrumb
   `⧉ control surface` links back up (the link above the SOP layer).

Click any node → an inspector with the REAL, code-grounded fields (below). The model is the
three-layer work model: `practices/agentic-systems/reference/three-layer-work-model.md`.

## The inspector (what a node click shows) — Nick's answers folded in

Per node: **status** · **what** · **data** (the real table) · **trigger** · **runner** ·
**ai model + FULL prompt inline** (Nick: show the full prompt text, not a peek) · **reads/writes** ·
**see it** (file + the projection-ui surface) · **change it** (exact file/line). Plus the two
buttons Nick specified:

- **"Open in Claude Code"** — opens the folder responsible for building/managing that node's system
  (its owning system folder) in a Claude Code session, to edit or build the workflow. **OPEN ITEM:**
  how a browser button launches a `claude` session in a folder (a small local helper endpoint, a
  URL scheme, or a copy-the-command fallback). Decide the mechanism.
- **"Run"** — triggers the activity/workflow manually. **This is the invocation layer** the spec
  flags as the hard part: a Next.js API route that spawns the runner (`.mjs`) on the local machine
  (projection-ui is local, has `.env` + the runners) and streams output to a run ledger the surface
  tails. Gate credit-spenders (enrich `--execute`) behind a PLAN/confirm step. Wire the safe,
  idempotent runners first (signal-watch, classify in plan mode).

"Full prompt inline" means: the route reads the actual prompt file server-side (e.g.
`<play>/classifier/classifier-prompt.md`) and renders its full text in the inspector.

## Slice-1 approach (smallest slice)

- **Hand-author the SOP definition as data first** (a JSON/TS in `systems/operating-sop/` — the CIPO
  "build the list" SOP: stages → workflow → activities, with each activity's binding). The route
  reads this. Do NOT build the full canon `sops/sop_stages/workflows/activities/contracts/drift`
  schema yet (that is the eventual model in SPEC §5; this slice proves the surface first).
- **Compute live status** incrementally from real sources: `canon.prospects` stage counts
  (mzzjvoiwughcnmmqzbxv), revops `prep_run_status` + `public.companies/contacts` (mrmnyscurmkfppicqqhk),
  `systemState` (is the node's system operational? → blocked-build), and a "runner wired?" check for
  the blocked node. Model the compute-on-read on `lib/queries/roadmap.ts` + `lib/queries/systemState.ts`.
- **Read prompt files server-side** for the full-prompt-inline (server component / API).
- Reuse the prototype's visual + interaction exactly (Nick approved it). Status colors: done teal
  `#1D9E75`, running = accent, blocked coral `#D85A30`, pending grey.

## The grounded node data (seed for the inspector — real, mined from code)

The CIPO "build the list" workflow, 7 nodes + branch (the temp mining output is gone; this is the
durable copy):

- **signal batch** (L3 trigger, done) — trigger: launchd daily 08:00 `com.nick.signal-watch`
  (RunAtLoad=false). runner: `systems/canon-engine/scripts/watch-signals.mjs`. data:
  `canon.prospects` (mzzjvoiwughcnmmqzbxv): stage, company_name, signal(jsonb), engagement_id.
  reads: ClinicalTrials.gov v2 + USPTO api.uspto.gov (A61). writes: `record_prospect` RPC, dedup
  (source, source_ref). change: the plist (`systems/canon-engine/launchd/com.nick.signal-watch.plist`)
  Hour/Minute + `--since-days`, then `launchctl unload+load`. surface: /prospects. owning system:
  signal-monitoring / canon-engine.
- **classify / segment screen** (L3, AI, done) — model `claude-sonnet-4-6`. FULL prompt: read
  `<play>/classifier/classifier-prompt.md` (C1-C3 in-scope, N1-N4 disqualifiers, F1 narrow) +
  doctrine `practices/revops/reference/targeting-enrichment-doctrine.md` + read-fields. runner:
  `systems/revops-engine/classify-runner.mjs`. data: `staging.companies_<batch>` (mrmnyscurmkfppicqqhk):
  prep_verdict, prep_confidence, prep_criteria(jsonb), prep_rationale. change: model at
  classify-runner.mjs **line 43** (`--model`), prompt classifier-prompt.md, fields read-fields.json.
  surface: /staging. owning system: revops-engine.
- **evidence gate (qualify companies)** (L3, AI, done) — model `claude-sonnet-4-6`. FULL prompt:
  `<play>/classifier/verify-prompt.md` (fetch website ~14 pages, classify NA sites by function
  rnd_wetlab/process_dev/gmp_mfg/qc, reconfirm program). runner: `systems/revops-engine/verify-runner.mjs`.
  data: staging.companies_<batch>: prep_verify(jsonb), prep_qualified(bool). change: model at
  verify-runner.mjs **line 32**. surface: /staging. revops-engine.
- **promote companies → Records** (L3, done) — runner: SQL `public.promote_staging_batch`
  (`systems/revops-engine/supabase/migrations/0004_promote_verdict_gate.sql`). trigger:
  `promote_staging_batch(<batch>,'companies')` or run-play.mjs --execute. data: `public.companies` +
  ledger `public.staging_promotions` (mrmnyscurmkfppicqqhk). surface: /records.
- **find ICP-title contacts** (L3, running) — runner: `systems/canon-engine/scripts/enrich-prospects.mjs`.
  trigger: `node enrich-prospects.mjs <type> <id> --limit N --execute`. data: `canon.prospects`
  (stage signal→resolved). change: enrich-prospects.mjs **line 64+** (wire deepline people_search;
  gated stub now). surface: /prospects. canon-engine.
- **verify work email** (L3, BLOCKED) — runner: `systems/canon-engine/scripts/enrich-prospects.mjs`
  (STUB). why blocked: `--execute` is a gated stub; the email waterfall is not built and Nick's BYO
  keys are not wired. change: wire findymail/prospeo → hunter → zerobounce with BYO keys in
  `.env` (HUNTER_API_KEY, ZEROBOUNCE_API_KEY); doctrine §7.7. data: canon.prospects: email,
  verified_email; stage→qualified. surface: /prospects. canon-engine. **This is the SOP's current
  block + the prototype's default-selected node.**
- **promote contacts → Records** (L3, pending) — `promote_staging_batch(<batch>,'contacts')` →
  `public.contacts` (mrmnyscurmkfppicqqhk). surface: /records.
- **unreachable → edge** (L3 branch, pending) — `systems/revops-engine/route-runner.mjs`,
  prep_routed='edge' (kept, not discarded).

## Open items / things to address going forward

1. **"Run" invocation layer** — the Next API route that spawns runners + streams to a run ledger +
   the PLAN/EXECUTE credit gate. The single biggest build item. Decide: which runners wire first
   (safe/idempotent), how to stream, where the ledger lives (generalize `prep_run_status`).
2. **"Open in Claude Code" mechanism** — how a browser button starts a `claude` session in a folder.
   Research options; ship a fallback (copy `cd <folder> && claude`) if no clean launch exists.
3. **Data model decision** — when to graduate from the hand-authored SOP definition to the real
   canon three-layer schema (SPEC §5: sops/sop_stages/workflows/activities + the 2 contract tables +
   the `layer_drift` reconciler + `executor_class` + L2 `control_flow`). Slice 1 hand-authors; the
   schema is its own build.
4. **Live status rollup** — implement it, don't inherit it (the research's key caveat). Define the
   L3→L2→L1 rollup rules explicitly.
5. **The two-system reality + the bridge** — CIPO's pipeline spans canon-engine + revops-engine, and
   the `canon.prospects → revops-engine` bridge is UNBUILT (already an Atlas-inbox item). The
   workflow drawing is a simplification; map each activity to its true owning system honestly.
6. **CIPO has no own play yet** — the classify/verify prompts shown are existing teknova examples.
   CIPO needs its own `classifier-prompt.md` / `verify-prompt.md`. Flag where the inspector reads
   the real CIPO prompt once it exists.
7. **The authoring half** — slice 1 is OPERATE/track only. The AUTHOR side (create SOP → workflow
   specs → activities, AI-assisted via govern-artifacts produce→gate→judge) is a later slice
   (SPEC: "Authoring + operating").
8. **The drift reconciler** — the highest-value object (flags layers disagreeing); later slice.
9. **Register + surface** — register operating-sop in `canon.systems` at `building`; render it on
   `/system` per system-anatomy. Add `/operate` to the projection-ui nav.
10. **Where definitions live** — activities + workflows per-system folder; SOPs per-output/venture
    (the CIPO SOP at `accounts/ventures/konstellation-cipo/artifacts/sop-launch-outreach.md`). Honor
    `system-folder-standard.md`.

## References (read these)

- `systems/operating-sop/SPEC.md` (the 10-part spec: execution model + 3-layer data model + the two
  jobs), `SYSTEM.md`, `CLAUDE.md`.
- `practices/agentic-systems/reference/three-layer-work-model.md` (the model + object design).
- `practices/agentic-systems/reference/system-folder-standard.md`, `system-building-method.md`,
  `system-anatomy.md`, `operating-doctrine.md`.
- `accounts/ventures/konstellation-cipo/artifacts/sop-launch-outreach.md` (the full CIPO SOP: 16
  steps, build gaps, open questions — the source for the SOP definition).
- projection-ui patterns: `lib/queries/roadmap.ts` + `lib/queries/systemState.ts` (compute-on-read),
  the existing /records /prospects /staging /system /work routes.
- Memories: `project_deterministic_systems_produce_work` ⭐, `feedback_every_system_interactive_surface` ⭐,
  `feedback_three_modes_run_iterate_build`, `feedback_operating_protocol`, `project_outreach_system_plan`,
  `projection_ui_launchd_service` (restart discipline), `feedback_boris_owns_architecture`.

## Status / discipline

operating-sop: `building`. This is the Build step (method §3.4). End with the Verify gate (§3.5):
the surface reads live state; "done" = a real query renders, never narrated. Then Register+surface
(§3.6). Keep the deterministic-spine rule: the surface composes existing canon data; AI is not in
the render path.
