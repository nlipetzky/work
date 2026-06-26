# HANDOFF: faithfully implement the /work surface from the Claude Design export

Date: 2026-06-23. For: a fresh Boris (agentic-systems) session. Status: BLOCKED on a faithful build.

## The one job

Make `/work` look **exactly** like the Claude Design export, wired to real canon data. Nothing more.

- **The design (source of truth for layout + styling):** `/Users/nplmini/Downloads/Work Focus.dc.html`
  (also copied to `public/work-focus-design.html`, served live at
  `http://localhost:4180/work-focus-design.html` so you can render the original and compare).
- **The target file:** `/Users/nplmini/code/work/systems/projection-ui/app/work/page.tsx`.

## What went wrong (do NOT repeat this)

The prior build was told to "interpret the design using existing components, faithful not pixel-perfect."
That produced a *divergent translation*, not Nick's design. Nick's words: "This is not what we
designed." He is right.

**Correct approach: reproduce the export faithfully.** Treat `Work Focus.dc.html` as the visual spec.
Port its actual layout, structure, spacing, and CSS into the React page. Do not re-invent it with
existing card patterns. The export already uses the real projection-ui palette (the exact
`#0b0e14 / #151a23 / #5b9dff / #3fb950 / #d29922 / #7d8590` tokens) and the mono font, so its colors map
1:1 to `tailwind.config.ts` (ink-900/850/800/700/600, accent, ok, warn, bad, muted, font-mono). Match
its spacing/gradients/grid precisely; verify side-by-side against the rendered original.

## Crucial distinction: faithful to the DESIGN, real DATA

The export's *content* (Meridian retainer, $15k MRR, Harbor, the calendar events, four systems) is
Claude Design placeholder. Reproduce the **look**, but fill the slots with **real canon data**. Do not
hardcode the placeholder content, and do not re-interpret the look. Both are failure modes.

## Good news: the data layer is already correct — keep it

`page.tsx` currently renders a divergent *look*, but its data wiring is right and worth keeping:
- Imports + helpers already in the file: `listProjects`, `listOpenTasks`/`isDoFirst`,
  `latestWeeklyIntent`, `listActivities`/`autonomyGradient`, and `rankTasks`, `runsWithoutYou`,
  `automationLabel`, `architectureLabel`, `channelLabel`, `VISION`, `fiveMinuteSteps`.
- The data → design-slot mapping (this part was correct):
  - hero "Do this next" = top-ranked Do-First task (`rankTasks` → first `isDoFirst`); title + due.
  - ladder chips = task → `project.name` → `project.goal.title` → `VISION`.
  - "first 5 minutes" = `task.first_5_minutes` (real; multi-line → steps via `fiveMinuteSteps`).
  - "this week" = `latestWeeklyIntent` (theme + six area bars).
  - "autonomy" = `autonomyGradient` (real pct + "N of M run without you").
  - "systems / what's running for you" = `listActivities` grouped by system, needs-you vs
    runs-without-you, "all green" only if every activity `ensured=true`.
  - "then, in order" = remaining Do-First, then important+not-urgent.

So the task is narrower than a rebuild: **swap the presentation (JSX + classes) to match the export
exactly, keeping the data fetch + the mapping above.**

## Honest gaps (render as stubs — never fabricate)

These design elements have no real data source. Keep them honest:
- **"Why this is the lever"** — no reasoning field on tasks. Muted placeholder ("Atlas hasn't written
  why yet"). The real fix later is a `tasks.rationale` field Atlas writes during triage.
- **Calendar** — no source. Stub: "Calendar — not wired yet." Do not invent events.
- **Autonomy "▲ this month" trend** — no history. Omit the trend; show real pct only.
- **Triage inbox count** — not wired. Show "—".

## Environment facts (so you don't churn like I did)

- **Server: `localhost:4180` is always-on**, run by a launchd agent `com.nick.projection-ui` (KeepAlive).
  It serves the working tree. Do NOT `kill` it — launchd respawns it; that wasted this whole session.
  Nick views the surface there; that is his on-demand window. To force a fresh compile after edits:
  `rm -rf .next && launchctl kickstart -k gui/$(id -u)/com.nick.projection-ui`.
- **Verification:** the preview MCP cannot drive the launchd 4180 (it didn't start it). Spin a
  throwaway preview server (`preview_start projection-ui` → lands on 4181), screenshot, compare to
  `localhost:4180/work-focus-design.html`, then `preview_stop` it. Iterate until they match.
  `tsc --noEmit` passing is NOT proof it renders (the Tailwind cwd trap rendered unstyled while
  tsc was clean — see below). Always screenshot.
- **Tailwind:** the cwd trap is fixed (`postcss.config.mjs` pins the config path). Utilities emit from
  any launch cwd. If the page ever renders as unstyled raw text, that regressed — see
  the memory `projection_ui_tailwind_cwd_trap`.
- **Cleanup:** `public/work-focus-design.html` is the copied export, kept intentionally so Nick can
  view the original. Remove it once `/work` matches, or leave it as a reference.

## Definition of done

Open `localhost:4180/work` and `localhost:4180/work-focus-design.html` side by side. They look the same
(layout, spacing, hierarchy, the hero gradient, the chips, the systems cards), and `/work` shows Nick's
real data in the slots with the honest stubs above. Nick confirms it matches what he designed.

## Reference

- Spec of what /work is for: `practices/operator-os/reference/spec-work-focus-surface.md`
- System anatomy / data model: `practices/agentic-systems/reference/system-anatomy.md`
- Methodology: `practices/operator-os/reference/methodology.md`
