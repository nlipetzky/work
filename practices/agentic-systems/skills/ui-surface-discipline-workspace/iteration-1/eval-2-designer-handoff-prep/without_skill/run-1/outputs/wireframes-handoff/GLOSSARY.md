# Glossary

Terms used in the wireframes, explained for someone new to the product.

**SOP** — Standard Operating Procedure. A named, versioned sequence of stages
the operator follows to get an outcome. Shown as the "spine" down the left
column of /operate.

**Stage** — One step in the SOP. A stage contains a small workflow of activities.

**Workflow** — The set of activities inside a stage, shown as a grid of cards
(4 columns in RUN/ITERATE, 3 columns in BUILD so the per-card "..." menus and
the "+ Add activity" slot fit).

**Activity** — The atomic unit of work. A single card in the workflow grid.
Clicking one opens the detail panel on the right.

**Composition** — The set of pieces that make an activity work: a Function (a
file path), a Trigger (an event), Schemas (input/output contracts), Adapters
(integration shims), Skills (instruction packages). Shown as labeled rows in
the detail panel.

**Skill** — A SKILL.md package that gives Claude reusable instructions for a
narrow task. Activities bind one or more skills. In ITERATE you can swap which
skill is bound; in BUILD you can author a brand-new one.

**Provenance** — The data-flow trail: what this activity consumes, what it
writes, and which downstream activity reads what it wrote. Shown as a 3-step
horizontal flow in the detail panel.

**Embedded SystemView** — A dashed-border block inside the detail panel that
renders another system's own UI inline (e.g. revops-engine's
pending-lookups table) instead of duplicating it. Tagged with `systems/<name>`
in the corner. Visible in RUN/ITERATE, hidden in BUILD.

**Runs history** — The last 5 executions of this activity, one per row, with
status / duration / cost / a link to inspect.

**Evals** — Test fixtures and a pass-rate bar for this activity. Read-only in
RUN, fixture-add in ITERATE, full authoring in BUILD.

**Open in Claude Code** — A button that hands the current
{mode, sop, stage, activity, engagement} context off to a developer agent
running locally. The button label changes with the mode (e.g. "Open in Claude
Code (ITERATE persona) ›").

**Engagement** — A client or venture context the SOP is being run for. Until
one is selected, the detail panel can't fill in.

**RUN / ITERATE / BUILD** — The three modes. Same layout, different
affordances. RUN executes; ITERATE tunes content; BUILD reshapes structure.
Accent color rotates blue / amber / purple in that order.

**More expander** — A collapsed section near the bottom of the detail panel
with tier-2 details (scripts, upstream deps, concurrency, retry policy).

**SOP-writer banner** — A top-of-panel notice that only appears in BUILD,
reminding the operator they're editing a draft version.
