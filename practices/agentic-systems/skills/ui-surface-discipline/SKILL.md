---
name: ui-surface-discipline
description: Use this skill whenever significant UI design work happens in a chat session — wireframes via show_widget, mockups, layout sketches, per-mode/per-state variants, dashboard mockups, screen designs, or visual-design iteration of any kind. Trigger PROACTIVELY at these moments — don't wait to be asked. (1) The user expresses concern about preserving design work ("don't lose this", "is this saved?", "make sure we capture this"). (2) show_widget has been called 3+ times in the session for the same surface. (3) The design has visibly converged on a canonical version after iteration. (4) The user mentions handing UI work to a design collaborator (Claude Design, Figma, human designer, "share with a designer"). (5) End-of-session signals after substantive UI work ("let's wrap", "create a handoff", "continuing tomorrow"). The skill walks the operator through inventorying visual artifacts in the conversation, persisting canonical visuals as HTML files to a stable repo location, quarantining historical/superseded versions, writing a design-intent spec README, establishing triangulation across visual + spec + machine-readable encoding, and producing a handoff brief for design collaborators. Do NOT use this skill for non-UI design work like data models, API contracts, or database schemas — those have their own discipline. Do NOT use for one-off diagrams that nobody will reference again. Do NOT use as a substitute for actual visual craft — this preserves and hands off design that already happened; it does not itself design. Do NOT skip the historical-quarantine step — ambiguity between canonical and superseded renders is the single failure mode this skill prevents.
status: Active
---

# ui-surface-discipline

## Purpose

UI design work done in chat is ephemeral by default. Visual renders from `show_widget` live only in the conversation transcript. Once context compresses, the session ends, or a collaborator opens the folder cold, the design is lost or — worse — replaced by a stale earlier version mistaken for canonical. This skill prevents that loss by persisting the final design across three independent sources (visual, spec, machine-readable encoding) so any future reader reconstructs the intent correctly.

This is preservation + handoff discipline, not the design itself. The design happened upstream. This skill makes it durable.

## When to use

Trigger PROACTIVELY when any of these conditions hold — do not wait for the user to ask:

- **Preservation concern surfaced.** The user said something like "don't lose this", "make sure this is saved", "is the design captured anywhere". Treat as an urgent signal that the existing persistence is inadequate.
- **3+ `show_widget` calls for the same surface.** Substantial visual work has accumulated. If the session ends without persistence, all of it goes away.
- **Convergence reached.** The design has been iterated to a canonical version (typically a v3+ or a "final" render). This is the moment to lock the artifacts before further drift.
- **Designer handoff is on the table.** User mentions sharing with Claude Design, a human designer, Figma, or any collaborator who needs the design as input.
- **End-of-session signals.** "Let's wrap", "continuing tomorrow", "handoff", "what should next session start with". The clock is running out.

These signals overlap. When two or more apply, the urgency is higher — start the persistence immediately rather than confirming first.

## What it does

The skill follows eight ordered steps. Each step has a WHY because the discipline only works if the operator understands the failure mode it prevents.

### 1. Inventory visual artifacts in the conversation

Walk the conversation transcript and identify every visual rendering related to the surface: `show_widget` calls, screenshots, sketches, attached images. For each, note whether it's CANONICAL (latest agreed version), INTERMEDIATE (a step in the iteration), or SUPERSEDED (an earlier approach the user moved past).

WHY: not every render deserves preservation. The intermediate and superseded versions clutter the folder and confuse future readers. Only canonical work belongs at the top level.

### 2. Choose a persistent location

Default: `systems/<owning-system>/reference/wireframes/`. The owning system is whichever system the UI surface belongs to (e.g., projection-ui's /operate surface lives under operating-sop because operating-sop owns the SOP cockpit concept).

If the surface spans multiple systems (rare), use `practices/agentic-systems/reference/wireframes/<surface-slug>/` and reference it from each consuming system.

WHY: the wireframes need a stable, discoverable location that future Boris sessions and design collaborators will check. Burying them in scratchpad or temp directories defeats the purpose.

### 3. Persist canonical visuals as HTML files

For each canonical render, write an HTML file to the chosen location. Include a header comment INSIDE the HTML documenting:

- What the file represents (mode, state, version)
- When it was rendered
- What's locked vs intermediate
- Any visual rendering caveats (e.g., "uses host CSS vars that resolve in chat but render as defaults in plain browser")

WHY: someone opening the file alone — without the README — needs to know what they're looking at and what to honor.

This step is TIME-SENSITIVE. Visuals that exist as `show_widget` parameters in the conversation context can be reconstructed by reading the widget_code argument from the transcript. Once context compresses or the session ends, that material is gone. Do this step EARLY, not late.

### 4. Quarantine historical/superseded renders into a `_historical/` subfolder

Move any earlier versions, density variants, or superseded approaches into `_historical/`. The top level of the wireframes folder should show ONLY the current canonical set.

WHY: the failure mode this skill exists to prevent is a future reader opening the folder, picking the wrong file, and treating it as the locked design. Ambiguity between canonical and superseded is fatal. The `_historical/` subfolder makes the canonical set unambiguous at a glance.

### 5. Write the design-intent spec as `README.md`

This is the most important artifact. The README captures the design's INTENT — what's locked, what's open for craft, the rules that govern the surface. The HTML files render one snapshot; the spec defines the system.

Required sections:

- **Canonical files index** — one line per file with its purpose
- **Visual rendering note** — any CSS var or browser caveats
- **Locked design rules** — top nav structure, layout grid, state model, anything immutable without re-discussion
- **Per-mode/per-state feature flag table** — the canonical matrix of what's available in each state
- **Accent palette / color tokens** — concrete RGB or hex values, what each color means
- **Section order / layout structure** — vertical or horizontal ordering of UI sections
- **URL or state patterns** — how state is encoded (URL params, client state, etc.)
- **Implementation status** — what's wired in code vs what's spec-only
- **"For [Designer] (handoff brief)"** — Locked vs Open for craft input
- **Reference points** — paths to machine-readable encoding, live shipping code, plans, related docs

The handoff brief section is the critical addition. It tells a design collaborator what they MUST honor (layout, feature flags, accent meaning) vs what they can refine (typography, density, badge design, color polish, mobile, empty/loading/error states). Without this section, a designer may inadvertently break locked rules trying to improve the surface.

WHY: visual files alone don't convey intent. A reader looking at one rendering can't tell which parts are locked and which are placeholders. The spec separates "the design" from "this rendering of the design".

### 6. Identify the machine-readable encoding

Find where the design's rules are encoded in code. This is typically a TypeScript types file, a CSS variables file, a feature flag table, or a state machine. Examples:

- A `mode-features.ts` exporting per-mode feature flags
- A `tokens.ts` exporting color/spacing values
- A state machine definition
- A schema file

Reference this file's PATH from the README. If no machine-readable encoding exists yet, flag that as a gap in the README's implementation-status section.

WHY: the third leg of the triangulation. When visual + spec + code all describe the same design, drift between any two becomes detectable. When only visual + spec exist, the code can drift without any signal.

### 7. Establish triangulation

Make each source reference the others:

- HTML files' header comments mention the README path
- README's "Reference points" section lists both the machine-readable encoding's path AND the live shipping code's path
- The machine-readable encoding (when authored or updated) gets a comment referencing the README

WHY: anyone landing on one source should be able to navigate to the others. The triangulation is what makes the design durable across sessions, collaborators, and code refactors.

### 8. Verify by listing the folder and reading the README's section headings

End by confirming:

- Top level shows only canonical files + README
- `_historical/` contains the superseded set
- README sections cover: canonical files index, locked rules, feature table, palette, section order, state pattern, implementation status, handoff brief, reference points

Report the final folder structure to the user. They should be able to see at a glance that the design is captured.

## Reads

- Conversation transcript (for `show_widget` arguments, screenshots, attached images)
- The user's existing repo structure (to find the right owning system)
- Existing files in the target wireframes folder (to detect what's already persisted vs what's new)
- The machine-readable encoding file (to verify it exists and reference its path)

## Writes

- HTML files in `systems/<owner>/reference/wireframes/` (one per canonical render)
- `_historical/` subfolder containing superseded renders
- `README.md` design-intent spec at the wireframes folder root
- Header comments inside each HTML
- Possibly a comment update in the machine-readable encoding file (when adding/updating cross-references)

## Time-sensitivity constraint (important)

The skill can only recover visuals that are STILL in the conversation context. `show_widget` renders the visual to the user but doesn't persist anything to disk. The HTML lives only as the `widget_code` parameter in the conversation history. Once that history compresses or the session ends, recovery becomes much harder (re-rendering from spec, asking the user for screenshots).

This is why the trigger conditions emphasize EARLY invocation. If 3+ widgets have rendered, don't wait for end-of-session — persist now. If the user expresses concern, don't confirm intent first — start the persistence and confirm details inline.

## Do NOT use for

- **Non-UI design work.** Data models, API contracts, database schemas, prompt designs — these have their own discipline. Different artifacts, different spec shape, different handoff audience.
- **One-off diagrams.** A single explanatory diagram that no one will reference again doesn't earn the overhead of the spec + triangulation. Save inline, move on.
- **Production-grade visual craft.** This skill PRESERVES and HANDS OFF design that already happened in chat. It does not ITSELF design. For visual polish, typography refinement, brand alignment — invoke Claude Design or a human designer using the handoff brief this skill produces.
- **Skipping the `_historical/` quarantine.** When a folder contains canonical and historical files mixed together, future readers WILL pick the wrong one. The quarantine isn't optional — it's the entire reason this skill exists.
- **Implementation details.** The code is the implementation. The spec captures INTENT. If you find yourself documenting button hover states or pixel-perfect spacing in the spec, you've drifted into the code's territory. Pull back.
