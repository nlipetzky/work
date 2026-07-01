# HANDOFF — Wrap-up of operating-sop slice 1 + parallel-session state — 2026-06-29

**To start the wrap session, paste:**
> Read and pick up from: `/Users/nplmini/code/work/systems/operating-sop/HANDOFF-wrapup-2026-06-29.md`

Launch root: `/Users/nplmini/code/work/systems/operating-sop` (for any operating-sop
follow-ups) or `~/code/work/` (for cross-system / inbox work).

## What this session shipped

**Operating-sop slice 1 — `/operate` surface is live in projection-ui.**

- Hand-authored SOP definition in `systems/operating-sop/sops/`
  - `types.ts` — L1/L2/L3 + SopRun interfaces
  - `launch-outbound-for-venture.ts` — the one SOP (15 stages, 1 workflow with 8 nodes,
    8 activities, 1 SopRun for konstellation-cipo)
  - `index.ts` — SOPS registry + SOPS_BY_ID lookup
- projection-ui surface
  - `app/operate/page.tsx` — control surface card list
  - `app/operate/[sopId]/page.tsx` — SOP detail (stage strip + workflow SVG + inspector)
  - `components/operate-inspector.tsx` — grounded inspector
  - `lib/queries/operatingSop.ts` — compute-on-read with live reads (signal-batch
    returns 197 from revops)
  - `lib/operate-runs.ts` — allowlist + ledger + spawn dispatch
  - `lib/sops.ts` — bridge re-export from operating-sop/sops/
  - Four `/api/operate/*` routes: `list`, `[sopId]`, `prompt`, `open-folder`,
    `run`, `run/[runId]`
- Nav link `/operate` added in `components/Nav.tsx`
- `canon_engine.public.systems` row for `operating-sop` (Compass / Supporting /
  status=building)

## Two architectural refactors during the build

**1. SOP made venture-agnostic.** "CIPO Launch Outreach" became "Launch outbound for a
venture." Introduced `SopRun` model (one SOP : many runs). `konstellation-cipo` is
the first SopRun. Runner args templatized with `<engagement>` placeholder; substituted
at spawn time by `lib/operate-runs.ts`.

**2. canon.prospects collapsed into revops.** The "knowledge layer for outbound
signals" abstraction wasn't earning rent (bridge unbuilt for months). Created
`revops.public.prospects` (mirror schema + `record_prospect` RPC), migrated 197 CIPO
rows, swapped all 4 consumers (`watch-signals.mjs`, `enrich-prospects.mjs`,
projection-ui's `prospects.ts` query, the operatingSop live readers) to `REVOPS_*`
env + `db` (revops) client. Dropped `canon.public.prospects` CASCADE. The bridge
stage + node disappeared from the SOP.

## Memory updates (this session)

- `project_operating_sop.md` — rewritten: slice-1 SHIPPED, full inventory of files
- `project_cipo_pipeline_state.md` — rewritten: SEVERED framing dropped, prospects
  live in revops
- `feedback_canon_revops_prospects_collapse.md` — NEW: the decision + the why
- MEMORY.md index entries updated for all three

## Ambient state changes from PARALLEL sessions (not made by this session)

Picked up during the session via system-reminders. The wrap session should orient to
this state, not the pre-session state:

- **Folder-architecture decision SHIPPED** (separate Boris session). Per
  `project_folder_architecture_decision` memory: auto-INDEX.md per axis + cwd-aware
  SessionStart hook shipped. B (skill-ify references) and D (canon-MCP topology)
  deferred. Reference: `practices/agentic-systems/scratchpad/folder-architecture-research-verdict.md`.
- **Inngest mount pattern canonicalized** (separate Boris session). Per
  `project_inngest_mount_pattern` memory: client in `capabilities/inngest/`, functions
  per-owning-system in `workflows/`, projection-ui unions at `/api/inngest`. Vertical-by-system
  + capabilities split is the pattern.
- **`systems/canon-engine/CLAUDE.md` rewritten** — now describes canon-engine as
  primary infra (registry + assets + spine + capture_items). Spine writes go through
  Atlas's inbox.
- **`systems/projection-ui/CLAUDE.md` rewritten** — describes projection-ui as the
  studio operator console + Inngest endpoint host. New routes mount as route groups
  + system's own data layer. New workflows mount as a one-line import in
  `app/api/inngest/route.ts`.
- **`systems/projection-ui/components/operate-inspector.tsx`** — got mode-aware
  Open-in-Claude wiring (new `cockpit` prop with mode/sopId/runId/stageId/nodeId/
  engagementId; POSTs to a new `/api/operate/open-claude` endpoint when cockpit
  context is present). Slice-1 fallback to `/api/operate/open-folder` preserved.
- **`systems/projection-ui/app/operate/[sopId]/page.tsx`** — now imports
  `ModeToggle` from `@/components/operate/ModeToggle` and `parseMode` from
  `@/lib/operate/mode-features`. New files. The page now passes cockpit focus to
  the Inspector.
- **`systems/operating-sop/CLAUDE.md`** modified again (diff omitted in reminder).
  Re-read before acting.

The mode-aware Open-in-Claude work is genuinely complementary to slice 1 — extends
the inspector's Open-Claude mechanism rather than replacing it. The wrap session
should verify the new endpoint and the parallel files exist + work.

## Open items proposed but NOT yet acted on

The following were drafted, discussed with Nick, and awaiting a green-light. Do not
re-derive; pick them up from where we left off.

### 8 slice-2 capture items proposed for Atlas's inbox (NOT yet dropped)

Per the operator-os pattern (`practices/agentic-systems/reference/atlas-inbox-spec.md`),
every persona drops `capture_items` rather than writing spine tables directly. These
were drafted with provenance `created_by: "claude-code:operating-sop-slice1-build"`
and were waiting on Nick's go.

Proposed items (in priority order):

1. **Author CIPO's own classifier-prompt + verify-prompt** (`revops`). Today's SOP
   substitutes teknova's mrna-therapeutics prompts; the inspector flags this. Real
   ship blocker for CIPO outreach.
2. **EXECUTE confirm flow for credit-spender activities** (`agentic-systems`). Today
   the EXECUTE button renders a confirm panel but the API returns 501.
3. **Move signal-watch + enrich-prospects scripts from canon-engine to revops-engine**
   (`agentic-systems`). Post-collapse cleanup. The scripts write to revops but live
   in canon-engine/scripts/.
4. **Refine workflow-to-stage bindings** (`agentic-systems`). Slice-1 binds
   wf-build-the-list only to stage 9; it honestly contributes to stages 1/4/5/8 too.
5. **UX iteration on /operate** (`agentic-systems`). Auto-jump from empty stages
   to corresponding L3 node; collapse 15-stage strip to bound stages by default;
   give inspector more canvas; make "next action" header click-through. (Per Nick's
   screenshot review feedback.)
6. **Generalize prep_run_status into operating-sop-owned run_ledger**
   (`agentic-systems`). Today operating-sop runs land in a revops-engine-owned
   table. Conflation.
7. **Canon three-layer schema** (`agentic-systems`). SPEC §5: `sops`, `sop_stages`,
   `workflows`, `activities`, contract tables, `layer_drift` reconciler view.
   Replaces hand-authored TS.
8. **AUTHORING half of operating-sop** (`agentic-systems`). Slice 1 only OPERATES.
   No surface for create-SOP → workflow → activities.

### projection-ui awareness work (NOT yet acted on)

Per the folder-architecture verdict, the awareness gap is being solved by the
filesystem-INDEX.md + cwd-aware SessionStart hook (already shipped per the parallel
session). What's STILL missing for projection-ui specifically:

- `systems/projection-ui/SYSTEM.md` does not exist. Per Boris's anatomy spec, every
  system should have one declaring its Activities (the 15 tabs) and Assets (page
  files + API routes).
- The SYSTEM.md is the input the INDEX.md generator reads. Without it,
  projection-ui shows up in `systems/INDEX.md` with whatever first paragraph of
  its CLAUDE.md gets extracted — incomplete picture of the 15-tab surface area.

**Recommendation:** write `systems/projection-ui/SYSTEM.md` declaring the 15 tabs
as Activities (channel='surface'). Skip the canon.activities registration step (the
verdict argued against canon-topology approaches until canon stabilizes off Micro
and there's measured failure evidence; that became open-item #7 above).

## Discrepancy worth resolving

The folder-architecture verdict claimed (under "What broke"): *"there is no
canon.systems / canon.practices / canon.reference_docs table in the 16 migrations.
The MEMORY.md claim of 'canon_engine.public.systems (35) + assets (101)' does not
appear in migration files."*

That's WRONG as of today. This session queried `canon_engine.public.systems` (39
rows after we added operating-sop) and the schema has 33 columns. The table exists
and is live. Possible explanations:
- Schema was created out-of-band (not via the migrations folder), and the
  migrations folder doesn't reflect live DB
- The audit script the other session ran was looking in the wrong place

This matters because Option D in the verdict (canon-topology as MCP tool, deferred)
assumes the migration audit is accurate. If the table exists live but isn't
migration-defined, the path to Option D is shorter than the verdict thinks (no
schema build required — just the MCP tool wrapper).

Recommend: someone runs the migration audit again to confirm.

## What the wrap session should do

In order, by my recommendation (the wrap session may reorder):

1. **Re-read the three CLAUDE.md files that changed** (canon-engine, projection-ui,
   operating-sop) so you orient to current state, not pre-session state.
2. **Drop the 8 capture items** into Atlas's inbox (`canon_engine.public.capture_items`)
   with the provenance noted above. Mark `created_by` with a session-specific slug
   like `claude-code:operating-sop-wrap-2026-06-29`. Each item: status='open',
   item_type='action_item' or 'idea', owner_actor_id per the list. Use the rich
   bodies from above (don't compress).
3. **Write `systems/projection-ui/SYSTEM.md`** declaring the 15 tabs as Activities
   per Boris's anatomy spec. Source: `practices/agentic-systems/reference/system-anatomy.md`
   Part 7 (Activities) and Part 10 (Assets). Channel='surface' for read-only
   surfaces; honest verification clauses; flag the modeling debt that pure-read
   surfaces don't fit the Activity shape cleanly (Boris's note from the diagnosis).
4. **Verify the mode-aware Open-in-Claude wiring works.** The parallel session added
   `cockpit` props to the Inspector and a new `/api/operate/open-claude` endpoint.
   Confirm: open /operate/launch-outbound-for-venture, click a node, click Open in
   Claude Code, confirm Terminal launches in the right folder with the right context.
5. **Sanity-check the discrepancy above.** Either re-run the migration audit, or
   query `canon_engine` for any tables not in the migrations folder.

## References

- This session's plan file: `/Users/nplmini/.claude/plans/noble-percolating-adleman.md`
- The slice-1 build handoff this session read at start:
  `systems/operating-sop/HANDOFF-build-operate-slice1-2026-06-29.md`
- Folder-architecture verdict from parallel session:
  `practices/agentic-systems/scratchpad/folder-architecture-research-verdict.md`
- The atlas-inbox contract: `practices/agentic-systems/reference/atlas-inbox-spec.md`
- The system-anatomy spec: `practices/agentic-systems/reference/system-anatomy.md`
- The SOP source of truth (still says 16 stages — outdated post-collapse):
  `accounts/ventures/konstellation-cipo/artifacts/sop-launch-outreach.md`
