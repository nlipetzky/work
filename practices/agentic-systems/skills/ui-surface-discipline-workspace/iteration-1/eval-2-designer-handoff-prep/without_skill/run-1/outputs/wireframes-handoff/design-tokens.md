# Design tokens (current state)

Lifted directly from the wireframes. These are the values to refine, not a
finished system.

## Color tokens

The wireframes reference CSS variables that resolve via `rendered/_tokens.css`.
Current values:

| Token              | Value                          | Used for                            |
|--------------------|--------------------------------|-------------------------------------|
| `--bg`             | `#faf9f7`                      | Page background                     |
| `--surface-1`      | `#ffffff`                      | Cards, pills, base surfaces         |
| `--surface-2`      | `#f4f2ee`                      | Mode-row bar, detail panel base     |
| `--border`         | `rgba(0,0,0,0.08)`             | Hairline dividers                   |
| `--border-strong`  | `rgba(0,0,0,0.16)`             | Emphasized borders                  |
| `--border-accent`  | `rgba(91,157,255,0.50)`        | Active/expanded states              |
| `--text-primary`   | `#1a1a1a`                      | Body text                           |
| `--text-secondary` | `#555555`                      | Subordinate copy                    |
| `--text-muted`     | `#8a8a8a`                      | Section labels, meta                |
| `--text-accent`    | `rgb(91,157,255)`              | Active tab, links                   |
| `--bg-accent`      | `rgba(91,157,255,0.12)`        | Active-tab background               |

Note: these are stand-ins. The "Color palette refinement — accents work but
the dark-on-dark surface tones haven't been audited" note in the original
brief is the open invitation to redo this.

## Per-mode accent palette (locked rotation)

| Mode    | Accent | Background fill              | Text                  | Border                       |
|---------|--------|------------------------------|-----------------------|------------------------------|
| RUN     | blue   | `rgba(91,157,255,0.15)`      | `rgb(91,157,255)`     | `rgba(91,157,255,0.50)`      |
| ITERATE | amber  | `rgba(220,150,0,0.15)`       | `rgb(180,110,0)`      | `rgba(220,150,0,0.50)`       |
| BUILD   | purple | `rgba(120,90,200,0.15)`      | `rgb(95,55,180)`      | `rgba(120,90,200,0.50)`      |

The accents drive the mode toggle, the active-mode badge, and the
"Open in Claude Code (MODE persona)" button. Don't shuffle which color maps
to which mode without asking — it's encoded in `_originals/mode-features.ts`
and downstream code.

## Status / semantic colors observed in markup

| Use            | Value     |
|----------------|-----------|
| Cost / success | `#2a9d5a` |
| Eval pass bar  | `#1f7d44` |

These two are isolated literals in the markup — open candidates for
consolidation into a semantic set (success / warning / error / info).

## Typography (current ad-hoc state)

- Body family: `"Anthropic Sans", system-ui, -apple-system, sans-serif`
- Mono family: `ui-monospace, SFMono-Regular, monospace`
- Base body: 16px / 1.7 / weight 400

Sizes in use across the three files (every size that appears):
`10px, 11px, 11.5px, 12px, 12.5px, 13px, 14px, 16px, 18px, 22px`

Weights in use: `400, 500` (no 600 or 700 anywhere).

This scale is the primary refactor target. We expect the refined ladder to be
5-6 sizes, 2-3 weights, with a clear rule for when mono is used (current rule:
"file paths, skill names, schema names" — but enforcement drifts).

## Spacing / radii observed

- Card radius: 12px
- Pill radius: 999px
- Inline code/path radius: 4-6px
- Hairline border: 0.5px (deliberate — feel free to flag if it renders
  unevenly on your displays)
- Padding rhythm inside cards: 1.5rem outer, 8-14px inner

## Layout

- Detail panel: vertical scroll, all sections always present (the per-mode
  feature flags govern which controls are interactive, not whether sections
  appear)
- Workflow grid: 4 columns in RUN/ITERATE, 3 columns in BUILD
- Top nav: 4 tabs only — Work, Operate, System, Records
- Assumed viewport: desktop, ~1280-1600px wide
