# Brief: redesigning the projection-ui surfaces with Claude Design

Date: 2026-06-23. Owner of the build: Boris (agentic-systems). Designer: Nick.
First target: the `/work` focus surface.

## What we're doing

Use **Claude Design** (Anthropic Labs, `claude.ai/design`) as the design layer for projection-ui,
instead of building surfaces from chat descriptions. Nick designs the surface visually on Claude
Design's canvas; the finished design hands off to Claude Code as a structured spec, and Claude Code
implements it against the real codebase.

This breaks the loop that has failed repeatedly: Nick describes a surface in chat, Boris builds
something that "lists things" and Nick shrugs. With Claude Design, Nick shapes the layout directly and
hands off an exact spec, so the build matches the intent.

## Why it fits projection-ui

- **Production-aware designs.** Claude Design reads our codebase and builds a design system from our
  real tokens and components (the `ink`/`accent` palette in `tailwind.config.ts`, the card patterns,
  the `Nav`, Tailwind utilities). Prototypes use our actual components, not generic templates.
- **Spec handoff, not pixels.** Export → "Hand off to Claude Code" produces a machine-readable bundle
  (component tree, design tokens used, layout hierarchy, assets) plus a paste-in prompt. Claude Code
  builds against our real component library ... no reinterpreting a screenshot.
- **In-plan, low-friction.** Included in Nick's Claude subscription; shares usage limits with chat and
  Claude Code. Browser only (`claude.ai/design` or the web app) ... not the Mac desktop app.

## The workflow (who does what)

1. **Connect the codebase.** Either Boris pushes the projection-ui component library up to a Claude
   Design project (the `/design-sync` capability, incremental, component by component), or Nick uses
   Claude Design's **Import** button to attach the GitHub repo or a local folder. Result: Nick's real
   components are available on the canvas.
2. **Design the surface ... Nick.** In `claude.ai/design`, describe the redesign and refine it
   visually ... layout, the run layer, the needs-you view, hierarchy, spacing, color. No code, no PRs.
   Iterate until it's right. Reference real components by name ("use the activity card pattern").
3. **Hand off ... Nick → Code.** Export → "Hand off to Claude Code." Copy the prompt it gives (it
   includes the bundle URL); download the zip as a backup.
4. **Implement ... Boris.** In a Claude Code session on projection-ui, paste the handoff prompt. Claude
   Code reads the bundle and builds it into `app/work/page.tsx` (and any new components) against the
   real tokens and components.

## Scope of the first run

The `/work` focus surface. The requirements already exist and do not need re-deriving:
`/Users/nplmini/code/work/practices/operator-os/reference/spec-work-focus-surface.md` ... the reasoned
one-next-action, the visible ladder, the run layer (needs-you vs runs-without-you), honest gaps, the
autonomy gradient. Bring those in as the design brief; the job in Claude Design is the *layout that
finally makes them legible*, which is exactly the part chat descriptions kept getting wrong.

## Access / setup notes

- `claude.ai/design`, browser only, in Nick's plan. Shares usage limits with chat / Code / Cowork.
- First time: onboarding reads a codebase / design files to build the design system. Point it at
  projection-ui.
- The method generalizes to any projection-ui surface later (Records, System, etc.); `/work` is the
  proving ground.

## To start, one decision

Does Boris push the projection-ui component library up via `/design-sync` first (so the canvas has the
real components from the start), or will Nick just Import the repo from Claude Design directly? Either
works; the sync gives a cleaner component match up front.
