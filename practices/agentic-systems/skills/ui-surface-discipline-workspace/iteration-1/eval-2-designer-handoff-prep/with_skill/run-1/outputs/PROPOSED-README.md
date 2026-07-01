# /operate wireframes ... canonical UI design

These wireframes are the **locked design** for `/operate` in projection-ui. They were converged on through the design session of 2026-06-29 and represent the three-mode cockpit (RUN / ITERATE / BUILD) that operating-sop slice 2 implements.

## Canonical files (open these in a browser)

- **`operate-run.html`** — RUN mode. The daily-driver cockpit. Read-only structure, fires activities, full Composition + Provenance + Runs history + Evals + More panels. Blue accent.
- **`operate-iterate.html`** — ITERATE mode. Single-activity edit-in-place. Skill swap panel shown mid-action. Amber accent.
- **`operate-build.html`** — BUILD mode. Structural edit unlocked. Drag handles, scaffold affordances, SOP-writer banner. Purple accent.

All three share the same shell: 4-tab top nav (Work / Operate / System / Records), header, mode toggle, SOP spine left, workflow grid right-top, activity detail panel right-bottom. The mode determines which affordances are live.

## Visual rendering note

Each HTML uses host CSS variables (`var(--surface-1)`, `var(--text-accent)`, etc.) that resolve cleanly inside Claude's chat widget but render as near-defaults in a plain browser. The visual STRUCTURE is correct; the color theme needs the surrounding chat host. For polished standalone visuals, the designer should re-skin with concrete colors per the accent palette documented below.

## Locked design rules

### Top nav (4 tabs only)

`Work · Operate · System · Records`. All other tabs (Outreach, Targeting, Prospects, Demand, Build, Runs, Duplicates, Gaps, Staging, Context, Expert-Liaison) get absorbed as embedded SystemView components inside the Activity detail panel. Old routes redirect.

### Mode toggle

3-segment pill. Writes `?mode=` to the URL via `router.replace` (no page reload). Active segment colors match the mode's accent. Hint line reads:

- RUN: "read-only on structure · fire activities · daily cockpit"
- ITERATE: "single-activity edit · swap skills / tweak prompts / change schemas · no structural change"
- BUILD: "structural edit · add/remove/reorder stages, nodes, skills · scaffold new files · publish a new version"

### Accent palette (rotates per mode)

| Mode | Hex | RGB | Use |
|---|---|---|---|
| RUN | — | `rgb(91,157,255)` | active toggle seg, selected stage/node, primary button |
| ITERATE | — | `rgb(180,110,0)` | active toggle seg, selected stage/node, skill-swap panel border, primary button |
| BUILD | — | `rgb(95,55,180)` | active toggle seg, selected stage/node, drag handles, primary button |

Mode-specific tints use the same hue at low alpha (0.08–0.15) for backgrounds, 0.40–0.50 for borders.

### Per-mode feature flag table (machine-readable encoding lives at `lib/operate/mode-features.ts`)

| Section | RUN | ITERATE | BUILD |
|---|---|---|---|
| SOP spine | read | locked (no add/remove) | drag handles + "+ Add stage" + per-stage "..." menu |
| Workflow grid | read | locked | drag + "+ Add activity" slot + per-node "..." menu |
| Composition rows | read | editable inputs + skill swap panel | editable + "+ Author new schema/adapter" + "+ Create new skill" (invokes skill-creator) |
| Provenance | read | read + note ("structural = BUILD") | editable contracts (consumes / writes) |
| Embedded System view | live | live read-only | HIDDEN ("no live data while in BUILD") |
| Runs history | full (last 5) | with per-row Diff/Learn affordances | HIDDEN ("no runs for a draft") |
| Evals | read (pass-rate + fixture count) | read + "+ Add fixture from a recent failure" | authoring + "+ Add fixture for new contract" |
| More expander | scripts / deps / concurrency / retry (read) | hidden | editable (concurrency + retry inputs) |
| SOP-writer banner | hidden | hidden | shown at top of detail panel |
| Action bar | Run (PLAN) / Open in Claude Code (RUN) / EXECUTE | Save iteration / Run after save / Discard | Validate / Save draft / Publish v+1 (gated) / Discard |

### Activity detail panel sections (vertical scroll, RUN mode shows all)

1. **Header** — activity name + pills (owner, status, node position, avg cost in RUN)
2. **Description** — one paragraph (editable in ITERATE / BUILD)
3. **Composition** — Function (file path + "View source"), Trigger (event + "Inspect event"), Schemas (in/out + "View"), Adapters (chips), Skills (list with one row expandable inline to show SKILL.md frontmatter + body)
4. **Provenance trail** — three-step flow: consumes → writes → downstream consumer
5. **Embedded System view** — dashed-border block tagged `systems/<owner>` containing the OWNING SYSTEM's UI component (e.g. revops-engine's pending-lookups table). This is the absorption point.
6. **Runs history** — last 5 runs (when / status / duration / cost / view link)
7. **Evals** — single horizontal row: pass-rate + bar + fixtures + last-run-at
8. **More expander** — tier-2 details: scripts, upstream deps, concurrency, retry policy
9. **Actions** — per-mode buttons per table above

### Skill chips on workflow node cards

Each node card carries a small "skills" line: 1-2 chips visible + "+N more" overflow when applicable. In ITERATE mode, each chip gets a swap indicator (⇄). Clicking a chip would open the SKILL.md (current implementation: expansion lives inside the detail panel's Skills section).

### Mode is in the URL

`?mode=run|iterate|build`. Default omitted = `run`. Survives back/forward navigation. The spawn dispatcher echoes mode back via the `Open in Claude Code (RUN|ITERATE|BUILD)` button label.

### Open in Claude Code is mode-aware

Button label tracks the toggle. POSTs `{mode, sopId, runId, stageId, nodeId, engagementId, activityId}` to `/api/operate/open-claude`. The spawn dispatcher composes the persona payload from the manifest at `systems/operating-sop/personas/<mode>/manifest.json` + a SessionStart hook auto-loads the persona CLAUDE.md into `additionalContext`. Each mode gets its own AI persona context.

## Implementation status (as of 2026-06-29 end-of-session)

Shipped + live:
- Mode toggle + URL `?mode=` + per-mode feature flag table (`lib/operate/mode-features.ts`)
- "Open in Claude Code (RUN|ITERATE|BUILD)" button with mode-aware payload
- SessionStart hook auto-loads persona spec + focus envelope into spawned Claude sessions
- Canon-backed Composition panel reading from `canon.sop_activities` + `public.skills` via `/api/operate/composition/<activityId>`
- All three personas scaffolded (`systems/operating-sop/personas/{run,iterate,build}/`)
- Migrations 017+018+019 applied to canon-engine; 8 SOP-spine tables live
- 16 skills synced into `canon.public.skills` (incl. 5 new ITERATE-mode skills)

Not yet shipped (next session ... see `practices/agentic-systems/scratchpad/handoff-2026-06-29.md`):
- Composition rows become editable in ITERATE mode (currently read-only)
- Inline skill swap panel (dropdown of candidates from `canon.skills`)
- `/api/operate/iterate` save-iteration route
- BUILD-mode affordances (drag/drop spine + workflow, "+ Add" buttons, Publish v+1)
- Embedded SystemView registry pattern + per-tab absorption (slice 2D)

## For the designer (handoff brief)

If you are a designer landing on this folder cold, read this section before anything else. Locked rules above are immutable for this engagement — the design has shipped and is in production. Your job is the polish.

### This engagement's scope

You are scoped to TWO work items:

1. **Typography refinement.** Audit the current type system (Anthropic Sans + ui-monospace; sizes 11/12/13/14/16/22) and propose a tighter scale. Deliverable: a `typography.md` spec listing token names, sizes, line-heights, weights, and intended usage, PLUS one redlined HTML showing the new scale applied to `operate-run.html`. Goal: hierarchy should be obvious without color cues.

2. **Empty / loading / error states.** Today the wireframes only show the populated happy path. Every surface needs a defined state for empty (no data yet), loading (data fetching), and error (fetch failed / not-permitted / not-found). Deliverable: per-surface state mocks (HTML or Figma frames, your call) for every entry in the "State inventory" appendix below. Use the existing accent palette for affordance, not new colors.

Anything not on this list is OUT OF SCOPE for this engagement. The "Future work (out of scope)" subsection below is for context only — do not work on those items without asking.

### Locked (do not change)

- Layout grid: 4-tab top nav, header, mode toggle, 300px left spine, right column with workflow-top + detail-bottom
- The per-mode feature flag table above
- The accent rotation (blue / amber / purple) and what each color means
- The 9 detail-panel sections in their vertical order
- The mode-in-URL pattern
- Operate as the universal cockpit (no separate Outreach/Targeting/etc. tabs)
- The two font families (Anthropic Sans for UI, ui-monospace for code/IDs). Within those families you can change anything.

### State inventory (for the empty / loading / error work item)

Every surface in the table below needs three states drawn: EMPTY, LOADING, ERROR. Cross-mode behavior is noted where it differs.

| Surface | Empty state trigger | Loading state trigger | Error state trigger |
|---|---|---|---|
| Engagement picker (top header) | No engagement selected yet | Loading engagements list | Engagement fetch failed |
| SOP spine (left, 15 stages) | SOP has no stages defined yet (BUILD mode only) | Stages loading | Stage fetch failed |
| Workflow grid (right-top, node cards) | Stage has no activities yet (BUILD: "+ Add activity" empty state; RUN/ITERATE: "no activities defined for this stage") | Activities loading | Activities fetch failed |
| Activity detail panel — Composition | Activity has no skills bound yet | Composition data loading | `/api/operate/composition/<id>` 4xx/5xx |
| Activity detail panel — Provenance | No upstream consumer wired | Provenance loading | Provenance fetch failed |
| Activity detail panel — Embedded System view | Owning system has no row for this activity yet | System view loading | System view component throw |
| Activity detail panel — Runs history (RUN/ITERATE only) | No runs recorded yet | Runs loading | Runs fetch failed |
| Activity detail panel — Evals | No fixtures bound yet | Evals loading | Eval run errored |
| Skill chips on node card | Node has 0 skills bound | (chips render synchronously; no loading needed) | (n/a unless SKILL.md fetch fails on click) |
| Skill swap panel (ITERATE only) | No candidate skills match the contract | Candidates loading | Candidate fetch failed |
| Action bar — Run / Validate / Save | (n/a — buttons always render) | Button disabled + spinner during async action | Toast / inline error after failure |
| SOP-writer banner (BUILD only) | (always present in BUILD) | (n/a) | (n/a) |

For each row × state, the mock should show: the placeholder copy, the iconography (if any), the affordance (CTA button if the empty state should drive an action like "+ Add stage"), and how the surrounding layout collapses (does the panel shrink, or hold its height with the placeholder centered?).

### Future work (out of scope for this engagement — for context only)

These are flagged for future engagements; do not work on them now:

- Whitespace + density tuning (RUN vs ITERATE comparison)
- Status badge / pill design refinement
- Workflow grid column count (4-col vs 3-col for BUILD)
- Skill swap panel interaction model (inline accordion vs slideout vs modal)
- Dark-surface tone audit
- Embedded SystemView visual signature (dashed border + tag pill alternatives)
- Mobile / narrow-viewport behavior

If a typography or state-design decision forces you into one of these, flag it back to Nick rather than freelancing the call.

### Reference points

- The machine-readable feature table at `/Users/nplmini/code/work/systems/projection-ui/lib/operate/mode-features.ts` is the **TypeScript source of truth**. If your design changes a feature flag (it shouldn't, given your scope), update that file. If it adds a feature, add a flag.
- The live shipping code at `/Users/nplmini/code/work/systems/projection-ui/components/operate/` (`ModeToggle.tsx`, `CompositionPanel.tsx`) and `components/operate-inspector.tsx` shows what's currently rendered. Diffing wireframe → live code reveals what's not yet wired.
- Full plan at `/Users/nplmini/.claude/plans/yes-lock-in-the-iridescent-book.md`.

### Deliverables checklist

When you hand the engagement back, the following should land in this folder (or `_designer-handoff-<date>/` if you prefer to namespace):

- [ ] `typography.md` — token names, scale, weights, line-heights, usage notes
- [ ] `operate-run.html` (redlined or replaced) showing the new type scale applied
- [ ] State mocks covering every cell in the State inventory table above (12 surfaces × 3 states minus the explicitly n/a cells)
- [ ] Short README addition or note describing any edge case or open question you ran into

## Historical / superseded

The `_historical/` subfolder holds earlier renderings kept for reference:

- `operate-run-v1.html` — first ship-quality RUN render from the design workflow. Pre-dates mode toggle, skill chips on nodes, composition panel, runs history, evals, more expander. Do NOT treat as canonical.
- `operate-run-variant-a.html` / `operate-run-variant-b.html` — density variants from the same workflow. The judge picked v1 over these; they sit here for visual diff.

## When to regenerate

Re-render the canonical files if:
- The feature flag table in `mode-features.ts` changes (the table here must match)
- The detail-panel section order changes
- The accent palette shifts
- A new mode is added (unlikely)

Use the chat session of 2026-06-29 as the reference render. Or have the designer produce a higher-fidelity set from this spec.
