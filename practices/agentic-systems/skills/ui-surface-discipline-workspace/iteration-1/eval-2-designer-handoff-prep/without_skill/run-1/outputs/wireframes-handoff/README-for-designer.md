# /operate cockpit — designer handoff

Welcome. You're picking up the wireframes for an operator cockpit called **/operate**.
This README is written for someone who has not seen the project before. Read it
front-to-back once before opening the files.

## What this is

/operate is one tab in an internal operator console. The whole console has four
top-level tabs: `Work · Operate · System · Records`. /operate is where an
operator runs, refines, or extends an SOP (a standard operating procedure made
of stages, each containing a small workflow of activities).

The same screen has **three modes** controlled by a top toggle:

| Mode    | Accent | What an operator does here                                   |
|---------|--------|--------------------------------------------------------------|
| RUN     | blue   | Read-only. Execute the SOP. View runs, eval pass rates.      |
| ITERATE | amber  | Tune content inside the existing structure. No reshape.      |
| BUILD   | purple | Reshape the structure. Add/remove stages, activities, skills.|

Same layout in all three modes; sections gain/lose affordances per mode.
The mode-feature matrix is in `_originals/mode-features.ts` (TypeScript) and is
the single source of truth.

## Files you've been handed

```
wireframes-handoff/
├── README-for-designer.md          ← you are here
├── ENGAGEMENT-SCOPE.md             ← what we're paying you to do
├── GLOSSARY.md                     ← terms used in the wireframes
├── design-tokens.md                ← colors, type, spacing in plain values
├── rendered/                       ← open these in a browser
│   ├── _tokens.css                 ← color shim so files render standalone
│   ├── operate-run.html
│   ├── operate-iterate.html
│   └── operate-build.html
└── _originals/                     ← reference only, do not edit
    ├── operate-run.html            (depends on host CSS variables)
    ├── operate-iterate.html
    ├── operate-build.html
    ├── mode-features.ts            (TS source of truth for per-mode flags)
    └── _historical/                (earlier renderings, superseded)
```

### Why two copies of each wireframe

The originals were drafted inside a chat tool that injected its own CSS
variables (`var(--surface-1)` etc.). Open them in a browser cold and the colors
collapse to defaults. The `rendered/` copies wrap each original with a tiny
`<link>` to `_tokens.css` so they render correctly on disk. The structure and
markup are identical; only the color resolution differs. Use `rendered/` to
look at the design, use `_originals/` if you want to see the raw markup the
engineers will diff against your changes.

## Start here

1. Open `rendered/operate-run.html`, `operate-iterate.html`, `operate-build.html`
   in a browser. Look at all three before forming opinions; the differences
   between modes carry most of the design intent.
2. Read `ENGAGEMENT-SCOPE.md` for what's in scope (typography, empty/loading
   states) and what's explicitly out of scope.
3. Read `GLOSSARY.md` if any term in the wireframes feels opaque
   (activity / stage / skill / composition / SystemView etc.).
4. Read `design-tokens.md` for the current type and color decisions in concrete
   values you can paste into Figma.

## How to deliver

Hand back any of: updated HTML in `rendered/`, a Figma file, a written
specification, or a mix. Whatever shape, keep the per-mode parity intact: a
change in RUN that doesn't have an ITERATE and BUILD counterpart will get
bounced back. If you want to change a mode-feature flag, flag it in writing —
that's a code change in `mode-features.ts`, not just a visual change.

## What's locked, what's open

Locked (do not change without a written ask):
- The 4-tab top nav (Work / Operate / System / Records)
- The three modes and their accents (blue / amber / purple)
- The detail-panel section order (Header → Description → Composition →
  Provenance → Embedded SystemView → Runs history → Evals → More → Actions)
- The presence of skill chips on workflow nodes
- The fact that "Open in Claude Code" is mode-aware

Open for your craft:
- Typography scale and weights
- Spacing/density (RUN is lighter than ITERATE — is that the right gap?)
- Status badges and pills (functional, not polished)
- Empty, loading, and error states for every section (mostly missing today)
- Color palette refinement — accents work, surface tones haven't been audited
- Embedded SystemView visual signature (dashed border + tag pill today)
- Mobile/narrow-viewport behavior is undefined; treat as out of scope unless
  scoped in writing

## Questions

If anything in the wireframes is ambiguous, write the question down in your
deliverable rather than guessing. We'd rather answer five questions than
discover five reverse-engineered assumptions.
