# Engagement scope

## What we want

Two deliverables in priority order.

### 1. Typography refinement (primary)

The wireframes use Anthropic Sans + `ui-monospace` with a font-size scale that
grew ad-hoc: `10px, 11px, 11.5px, 12px, 12.5px, 13px, 14px, 16px, 18px, 22px`,
weights `400` and `500` only. Audit the scale, propose a tighter ladder
(probably 5-6 sizes, 2-3 weights), and apply it consistently across all three
mode files. Pay particular attention to:

- The Composition rows (`.op-comp-row`): label / value / action sit on a single
  baseline. Their type relationship sets the rhythm for the whole detail panel.
- All-caps section labels (Composition, Provenance, Runs history). Letter
  spacing and weight need a once-over.
- The Header h1 vs the activity-detail h2. Today they're 22px / 18px both at
  weight 500. Decide if that's right.
- Monospace usage: file paths, skill names, schema names. Today everything
  switches to mono indiscriminately; we'd like a rule.

### 2. Empty / loading / error states (secondary)

Today the design assumes the happy path. We need states for at least:

- Activity selected but composition is still fetching (loading skeleton)
- Activity has no skills bound yet (RUN/ITERATE/BUILD all differ — RUN shows
  nothing, ITERATE prompts "+ Swap in a skill", BUILD prompts "+ Create new skill")
- Engagement not yet selected (the whole detail panel is unfillable)
- Runs history has zero runs (new activity, never executed)
- Evals: no fixtures yet
- Network error fetching composition

These can be drawn on top of any one mode (RUN is fine as the canvas); we'll
adapt to the other two ourselves.

## What is explicitly out of scope

- Adding or removing detail-panel sections
- Changing the 3-mode model or accent rotation
- Mobile / narrow-viewport responsive design (treat desktop, 1280-1600px wide)
- Backend or interaction-model changes (e.g. skill swap as modal vs accordion)
- New iconography (use whatever you find in the markup as-is or note where you'd
  want an icon and we'll source it)
- Changes to per-mode feature flags (those are encoded in `mode-features.ts`
  and require a code change we'd own)

If any of these become tempting while you work, write a one-liner in the
deliverable proposing it — but don't ship it.

## Format of deliverable

Acceptable in any combination:

- Edits to the HTML in `rendered/` (preferred for quick adoption — we can
  diff and lift into the live app)
- Figma file with the three modes, a type-scale page, and the empty-state set
- Written spec with concrete CSS values and screenshots

Whichever you choose, include:

- A type-scale reference (sizes, weights, line heights, intended usage)
- A list of every empty/loading/error state you designed, with a one-line
  description of when it shows
- Any open questions you couldn't resolve from the wireframes alone

## Timeline + check-ins

Async. One mid-point check-in once you've drafted the type scale and one
empty-state mock. Final review when all states are covered.
