# Handoff prep — notes for Nick

## What I did

Built a self-contained handoff package at:
`outputs/wireframes-handoff/`

The package is what you send to the designer. The source folder at
`/Users/nplmini/code/work/systems/operating-sop/reference/wireframes/` is
unchanged.

## Why I didn't just zip the source folder

Three problems would have shipped:

1. **The HTML doesn't render in a standalone browser.** Every wireframe uses
   `var(--surface-1)` etc. tokens that resolve to nothing outside the original
   chat-widget host. The README admits this ("renders as near-defaults in a
   plain browser") but the designer is going to open `operate-run.html`,
   see washed-out gray boxes, and email asking what they're looking at.
2. **The existing README leaks internal context.** It references
   `~/.claude/plans/yes-lock-in-the-iridescent-book.md`, the live shipping
   code at `systems/projection-ui/components/operate/`, and the Anthropic
   chat-widget rendering quirk. None of that is useful to a cold freelancer
   and some of it shouldn't be shared at all.
3. **There's no engagement scope.** The README's "Open for craft input" is a
   bullet list, not a brief. A freelance designer needs a primary deliverable,
   a secondary deliverable, an out-of-scope list, and a format-of-delivery
   note. Otherwise you get a Figma file that reshapes the section order.

## What's in the package

- `README-for-designer.md` — written cold for someone who's never seen the
  product. Explains what /operate is, the 3-mode model, and how to open the
  files.
- `ENGAGEMENT-SCOPE.md` — primary deliverable (typography refinement),
  secondary deliverable (empty/loading/error states), explicit out-of-scope
  list, format of delivery, async timeline with one mid-point check-in.
- `GLOSSARY.md` — every term in the wireframes (SOP, stage, activity, skill,
  composition, provenance, SystemView, etc.) in plain English.
- `design-tokens.md` — current color and type values lifted directly from
  markup, presented as concrete values the designer can paste into Figma.
- `rendered/_tokens.css` — shim that resolves the host CSS variables so the
  wireframes render correctly when opened in a browser. The original HTML is
  not edited; the shim is loaded via a `<link>` tag wrapper.
- `rendered/operate-run.html`, `operate-iterate.html`, `operate-build.html` —
  the canonical wireframes, wrapped to load `_tokens.css`. Markup identical
  to source.
- `_originals/` — verbatim copies of the source files (HTML, mode-features.ts,
  the _historical subfolder). Reference only.

## What the designer will NOT receive

- Path references to your local filesystem
- Reference to your `~/.claude/plans/` directory
- The "Visual rendering note" about the chat-widget host (resolved by the
  shim, no longer needs explaining)
- The `mode-features.ts` file is included in `_originals/` but the README
  frames it as TypeScript source-of-truth they can read, not a file they
  edit.

## Open questions for you before sending

1. **Designer name and contact** — neither is in the package. You'll add a
   cover email.
2. **Compensation / contract** — out of scope for this folder; assume you're
   handling separately.
3. **Tools / fonts they have access to** — the package assumes they own
   licensed Anthropic Sans or will substitute. If they don't, flag a fallback.
4. **Whether to share `_historical/`** — included as reference for the design
   evolution. If you'd rather they not see the variant-a/variant-b dead ends,
   delete `_originals/_historical/` before sending.
