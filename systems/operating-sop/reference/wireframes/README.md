# /operate wireframes ... canonical UI design

These wireframes are the **locked design** for `/operate` in projection-ui. They were converged on through the design session of 2026-06-29 and represent the three-mode cockpit (RUN / ITERATE / BUILD) that operating-sop slice 2 implements.

## Canonical files (open these in a browser)

- **`operate-run.html`** — RUN mode. The daily-driver cockpit. Read-only structure, fires activities, full Composition + Provenance + Runs history + Evals + More panels. Blue accent.
- **`operate-iterate.html`** — ITERATE mode. Single-activity edit-in-place. Skill swap panel shown mid-action. Amber accent.
- **`operate-build.html`** — BUILD mode. Structural edit unlocked. Drag handles, scaffold affordances, SOP-writer banner. Purple accent.

All three share the same shell: 4-tab top nav (Work / Operate / System / Records), header, mode toggle, SOP spine left, workflow grid right-top, activity detail panel right-bottom. The mode determines which affordances are live.

## Visual rendering note

Each HTML uses host CSS variables (`var(--surface-1)`, `var(--text-accent)`, etc.) that resolve cleanly inside Claude's chat widget but render as near-defaults in a plain browser. The visual STRUCTURE is correct; the color theme needs the surrounding chat host. For polished standalone visuals, Claude Design should re-skin with concrete colors per the accent palette documented below.

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

✅ Shipped + live:
- Mode toggle + URL `?mode=` + per-mode feature flag table (`lib/operate/mode-features.ts`)
- "Open in Claude Code (RUN|ITERATE|BUILD)" button with mode-aware payload
- SessionStart hook auto-loads persona spec + focus envelope into spawned Claude sessions
- Canon-backed Composition panel reading from `canon.sop_activities` + `public.skills` via `/api/operate/composition/<activityId>`
- All three personas scaffolded (`systems/operating-sop/personas/{run,iterate,build}/`)
- Migrations 017+018+019 applied to canon-engine; 8 SOP-spine tables live
- 16 skills synced into `canon.public.skills` (incl. 5 new ITERATE-mode skills)

⏳ Not yet shipped (next session ... see `practices/agentic-systems/scratchpad/handoff-2026-06-29.md`):
- Composition rows become editable in ITERATE mode (currently read-only)
- Inline skill swap panel (dropdown of candidates from `canon.skills`)
- `/api/operate/iterate` save-iteration route
- BUILD-mode affordances (drag/drop spine + workflow, "+ Add" buttons, Publish v+1)
- Embedded SystemView registry pattern + per-tab absorption (slice 2D)

## For Claude Design (handoff brief)

If you're handing this folder to Claude Design (or any visual-craft collaborator), here's what's locked vs open:

### Locked (do not change without discussion)

- Layout grid: 4-tab top nav, header, mode toggle, 300px left spine, right column with workflow-top + detail-bottom
- The per-mode feature flag table above
- The accent rotation (blue / amber / purple) and what each color means
- The 9 detail-panel sections in their vertical order
- The mode-in-URL pattern
- Operate as the universal cockpit (no separate Outreach/Targeting/etc. tabs)

### Open for craft input

- Typography scale (currently using Anthropic Sans + ui-monospace; could explore a tighter type system)
- Whitespace + density tuning (compare RUN vs ITERATE — the latter feels heavier with editable inputs everywhere)
- Status badge / pill design (current implementation is functional, not polished)
- Workflow grid layout: 4-column for RUN/ITERATE, 3-column for BUILD (because BUILD nodes have "..." menus + add-activity slot) — open to revisiting if a single grid works better
- Skill swap panel interaction model (current: inline accordion; could become slideout / modal / right-rail replacement)
- Color palette refinement — accents work but the dark-on-dark surface tones haven't been audited
- Embedded SystemView visual signature — currently dashed border + tag pill. Could explore other ways to make "this is another system's UI composed in here" obvious at a glance
- Mobile / narrow-viewport behavior (current design assumes desktop; phone view is unaddressed)
- Empty/loading/error states (e.g. composition panel while fetching; activity with no skills bound; engagement not selected yet)

### Reference points

- The machine-readable feature table at `/Users/nplmini/code/work/systems/projection-ui/lib/operate/mode-features.ts` is the **TypeScript source of truth**. If your design changes a feature flag, update that file. If it adds a feature, add a flag.
- The live shipping code at `/Users/nplmini/code/work/systems/projection-ui/components/operate/` (`ModeToggle.tsx`, `CompositionPanel.tsx`) and `components/operate-inspector.tsx` shows what's currently rendered. Diffing wireframe → live code reveals what's not yet wired.
- Full plan at `/Users/nplmini/.claude/plans/yes-lock-in-the-iridescent-book.md`.

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

Use the chat session of 2026-06-29 as the reference render. Or have Claude Design produce a higher-fidelity set from this spec.
