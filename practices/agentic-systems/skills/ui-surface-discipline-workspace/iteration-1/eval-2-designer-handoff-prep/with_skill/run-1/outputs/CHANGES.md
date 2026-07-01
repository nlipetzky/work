# Audit + proposed augmentation: /operate wireframes handoff

Date: 2026-06-30
Source: `/Users/nplmini/code/work/systems/operating-sop/reference/wireframes/`
Target use: cold handoff to a freelance designer, scoped to typography refinement + empty/loading/error states.

## Audit findings (what the folder already does well)

Eight-step ui-surface-discipline checklist against the real folder:

1. **Inventory.** Three canonical HTMLs (run / iterate / build, dated 2026-06-29). Three superseded renders (v1, variant-a, variant-b) already segregated. CLEAN.
2. **Persistent location.** `systems/operating-sop/reference/wireframes/`. Correct owning system. CLEAN.
3. **HTML header comments.** Each canonical HTML carries a `<!-- ... -->` header block naming mode, render date, locked affordances per panel, and the chat-CSS-var rendering caveat. CLEAN.
4. **Historical quarantine.** `_historical/` subfolder is real, contains exactly the 3 superseded files, and is named in the README. CLEAN.
5. **README design-intent spec.** 144 lines, 10.4KB. Hits every required section: canonical files index, visual rendering note, locked rules (top nav, mode toggle, accent palette, feature flag table, detail panel sections, skill chips, URL pattern, Claude Code spawn), implementation status, handoff brief (Locked vs Open for craft), reference points. CLEAN.
6. **Machine-readable encoding.** `lib/operate/mode-features.ts` is referenced in THREE places in the README (line 41 inline, line 83 implementation-status, line 125 reference-points with absolute path). Canonical file lives at `/Users/nplmini/code/work/systems/projection-ui/lib/operate/mode-features.ts` (5916 bytes, comment header explains its role as single source of truth). VERIFIED PRESENT AND REFERENCED.
7. **Triangulation.** HTML header comments → README intent. README → mode-features.ts path + components path + plan path. CLEAN.
8. **Folder verification.** Top level: 3 HTMLs + README + (snapshot copy of mode-features.ts). `_historical/`: 3 superseded files. CLEAN.

**Skill verdict: the folder is already handoff-ready.** A cold designer opening it can navigate from any one of {HTML, README, mode-features.ts} to the other two.

## One real anomaly (not blocking, worth a note)

`wireframes/mode-features.ts` is a byte-identical duplicate of `projection-ui/lib/operate/mode-features.ts` (verified via `diff -q`, same 5916 bytes, same mtime 2026-06-29 21:13). The README treats projection-ui's copy as canonical. The local copy will drift the moment the canonical one is edited.

Two options, both fine:
- **(a)** Delete the local snapshot; README already points to the canonical path.
- **(b)** Keep it as a frozen snapshot, but rename it `mode-features.snapshot.ts` and add a header comment noting it's a snapshot of the canonical file at <date>.

I did NOT touch the real folder (constraint #3). Flagged here so Nick can decide.

## Why augment the README at all then?

The folder is generically handoff-ready, but the specific brief is narrow: **the designer is being scoped to typography + empty/loading/error states.** Today those two items are buried as bullets 1 and 9 (of 9) inside the "Open for craft input" list. A cold designer reading the README top-to-bottom will absorb the whole locked surface, hit the open-list, and have to infer their scope from "you are working on items 1 and 9."

The augmentation adds a tightly-scoped "**This engagement's scope**" section near the top of the handoff brief that:

- Names the two work items explicitly as in-scope for this engagement.
- Pulls everything else in "Open for craft input" into an "out-of-scope (future engagements)" subsection so the designer doesn't accidentally redesign the workflow grid or the embedded SystemView pattern.
- Adds a concrete deliverable list for each in-scope item (typography: scale spec + token names + one redlined HTML; empty/loading/error: state inventory + per-state mock per critical surface).
- Adds an "Inventory of surfaces that need empty/loading/error states" subsection — the designer needs this list to know what to design.

This is the kind of thing a designer would ask in the first 30-min call. Putting it in the README means they can start cold.

## What was NOT changed in the proposal

- Locked design rules — untouched. They are locked.
- Per-mode feature flag table — untouched.
- Accent palette — untouched.
- Detail panel section order — untouched.
- Implementation status block — untouched (it's a snapshot of code state, not a design spec).
- Reference points — untouched (still points at canonical mode-features.ts + components).
- Historical / superseded section — untouched.
- When to regenerate — untouched.

The augmentation is **additive** inside the "For Claude Design (handoff brief)" section, plus one new "State inventory" appendix. Locked rules stay locked.

## Files written to this outputs/ folder

- `PROPOSED-README.md` — the full augmented README, drop-in replacement candidate.
- `CHANGES.md` — this file.

## What the designer will receive when they open the folder cold (assuming the proposal lands)

1. Three canonical HTMLs they can open in a browser (with the caveat that CSS vars resolve to defaults outside chat — already documented).
2. A README that opens with the locked design, then in the handoff section tells them exactly what's in-scope for THEIR engagement, what's out, and what concrete deliverables look like.
3. A state inventory listing every surface that needs empty/loading/error coverage, so they can produce a complete set without guessing.
4. A reference to the canonical `mode-features.ts` so any feature flag change they propose has a code path to land in.
5. A `_historical/` they will ignore (correctly).
