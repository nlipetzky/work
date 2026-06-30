# Handoff 2026-06-30 → next session

Two arcs this session: (1) SHIPPED + verified the `/operate` cockpit rebuild + the BUILD authoring loop; (2) deep architecture alignment on the vision. **All architecture is captured in memory — read those first** (see "Locked architecture" below). This handoff is the orientation + the next-session design agenda.

## SHIPPED + verified (code)
- **`/operate/[sopId]` rebuilt** to the locked `Operate.dc.html` cockpit (RUN read / ITERATE editable / BUILD). Server-component page + client `OperateCockpit` island; 15 components under `components/operate/`. Retired `operate-inspector.tsx`, `CompositionPanel.tsx`, the inline `WorkflowSvg`.
- **Slice 2C data + publish**: migrations `020` (sop_runs + activity_runs), `021` (activity_evals + activity_eval_runs), `023` (publish_activity_version + publish_sop_version + v_current_sops) APPLIED to canon. `activity_runs` dual-write in `lib/operate-runs.ts`. `/api/operate/publish` wired to the BUILD Publish button. Publish loop verified (iterate draft → publish → current, demote/promote held).
- **6 BUILD authoring skills** authored + adversarially reviewed + synced: sop-writer, workflow-composer, activity-binder, function-scaffolder, schema-author, adapter-author.
- **BUILD spawn made real + PROVEN LIVE**: a spawned BUILD session authored `verify-work-email`'s composition into canon (v2 draft), CAUGHT A REAL BUG (function_path `enrich-prospects.mjs` → `verify-contacts.mjs`), wrote valid schema files, emitted INSUFFICIENT_SOURCE rather than inventing.
- **Skill auto-discovery**: `sync-skills.mjs` mirrors operating-sop skills → `systems/operating-sop/.claude/skills/` (real files, `status:` stripped, gitignored). CONFIRMED skills auto-load in spawned sessions (Claude Code cwd-walk discovery works).
- **persona-loader hook** registered at the GIT ROOT `~/code/work/.claude/settings.json` (a nested project `.claude/settings.json` does NOT load — Claude Code resolves the project to the git root). Guarded by `OPERATE_MODE`. Did NOT visibly fire on re-spawn (likely a settings-change re-trust gate) — NON-blocking, since the skills carry the authoring discipline themselves. **Polish item: confirm/finalize the hook (fold into the proven-firing root `session-start-context.mjs`).**
- **Nav reorg** (per Nick): primary {Work, Operate, System, Records} + a "Details · raw data" divider + the 11 raw-data views kept below (NOT cut).

## Canon state to know
- `verify-work-email`: **v1 is_current=true** (function_path STILL the wrong `enrich-prospects.mjs`), **v2 is_current=false** (the corrected BUILD draft, awaiting publish). Schemas at `systems/canon-engine/schemas/activities/verify-work-email.{in,out}.json`. NOT published — the 3 open questions (stage filter etc.) are Nick's calls.
- **Stage-filter lesson**: `prospect.stage` lifecycle is a LIVE convention the CIPO data session owns (signal→resolved→qualified; `'contacted'` is a transient queue marker, gone by query time). Do NOT pin stage contracts or "fix" runner filters from a point-in-time snapshot.

## Locked architecture (READ THESE memory files first)
- **`project_live_bound_iteration_loop.md`** — the north star. (a) The live-bound loop: open the AI from the surface, bound to canon, iterating updates canon + surface LIVE; no detached sessions, no drift. (b) The STEWARDSHIP MODEL: SOP = a standard shaped by EXPERTISE, run against ACCOUNT args (account ≠ co-author; "SOP is a function, expertise is the libraries, account is the call-time args"); the SOP steward COMPOSES not translates; the SME is a BOOTSTRAP not a battery; expertise ACCUMULATES into a living AI expert-folder; the human migrates to optimizer and contributes less on purpose; this is the autonomy gradient applied to domain judgment; Hermes is the membrane carrying the shrinking human signal.
- **`project_operating_sop.md`** — operate system state, slice history, deferred list, the SOP-reconciliation-next move.

## The convergence (THREE sessions building one system)
- **This thread**: the `/operate` surface + the SOP-craft steward + the AI-expert-composition vision.
- **The CIPO data session** (accounts/ventures/konstellation-cipo): RAN the outbound pipeline, built it richer than the SOP models (added deep-capture + an AI qualify-gate). 295 rows → 113 qualified. The canon SOP is now BEHIND reality → a future BUILD reconciliation pass (after CIPO's send stabilizes). Next there: offer-lock with Will via Hermes → send to the 113; tiers advisory (option C).
- **The Hermes session**: designing **`expert-liaison-engine`** as a shared-infra SYSTEM (tables `expert_requests`/`expert_motions` + existing `expert_exchanges`/`expert_review_packets`; `advance_motion` runtime + follow-up clock; Inbound + Motions surface on `/expert-liaison`; first producer = Ellie's revops verdict path). This IS the membrane (Hermes) made durable. **Cross-thread note: it routes the human's bootstrap/supervise signal to the AI-expert-folders and composes with the SOP steward — design its emit/consume contracts anticipating that.**

## NEXT SESSION: design the build (brainstorm FIRST, then plan)
Do NOT start coding. The architecture is aligned; the BUILD design is the work. Reconcile with the Hermes-engine design so the threads don't drift. Ordered design agenda:
1. **THE AI-EXPERT-AS-ACCUMULATING-FOLDER** (foundational — everything composes against it). What is the shape of a domain AI expert (folder/persona/agent) that accumulates operable judgment session-over-session, that the SOP steward can compose and the human can supervise/optimize? Must reconcile with the Hermes-engine's expertise/motion model.
2. **Live-bound surface** (realtime/polling + draft visibility) — how the cockpit reflects session edits live, shows in-flight drafts.
3. **Per-level + proper-folder session spawning** (SOP-steward session; owning-system session) + per-level context bundles.
4. **SOP → expertise INFLUENCE links** (not account) modeled in canon + surfaced (trace upstream).
5. **Expertise-composition + conflict protocol** (steward surfaces conflicts; Hermes routes; humans adjudicate).

## Open confirmations
- Hermes session waiting on Nick: (a) `expert-liaison-engine` is a shared-infra system in `systems/expert-liaison-engine/`, registered in `canon.systems`, surface on `/expert-liaison`, operated by the Hermes practice; (b) the name. **Boris's view: yes to both — consistent + parallel to revops-engine; stem-share is a feature.**
- SOP-steward ownership: ONE domain-agnostic SOP steward, expertise composed per-SOP (Nick confirmed "how SOPs work in general").

## Verify the cockpit works (quick-ref)
- `/operate` (list) → click SOP card → `/operate/launch-outbound-for-venture` (the cockpit). Mode toggle RUN/ITERATE/BUILD. 4180 launchd (`com.nick.projection-ui`) + 4181 `dev:preview` both healthy; `tsc --noEmit` clean.
- BUILD spawn: select an activity node → "Open in Claude Code (BUILD)" → spawned Terminal session auto-loads the 6 skills + the activity-authoring task.
- Publish loop: BUILD → Validate → Publish v+1 → `publish_activity_version`.

## Pointers
- Cockpit-rebuild plan (slices 2A-2D): `/Users/nplmini/.claude/plans/yes-lock-in-the-iridescent-book.md`
- Wireframes + design spec: `systems/operating-sop/reference/wireframes/`
- Key code: `systems/projection-ui/components/operate/*`, `app/operate/[sopId]/page.tsx`, `app/api/operate/{iterate,publish,available-skills,composition,open-claude}/`, `lib/operate/*` (mode-features, status-tokens, composition-draft, sop-types); `systems/operating-sop/{lib/spawn-claude.ts, .claude/hooks/persona-loader.mjs, personas/build/, .claude/skills/}`; `systems/canon-engine/scripts/sync-skills.mjs`; migrations `020/021/023`.
- Memory keys: `project_live_bound_iteration_loop`, `project_operating_sop`, `reference_serveronly_type_extraction`, `feedback_three_modes_run_iterate_build`, `project_expert_liaison_vision`, `project_core_offering_expert_productization`.
