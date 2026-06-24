# Studio Architecture Conventions (canon)

Authoritative placement rules for the operator OS. Boris (agentic-systems) owns
and enforces this. It codifies what already exists ... it does not invent new
structure. When in doubt, this file wins. If something here is wrong, change it
here first, then act.

## The ownership line (read first)

- **Boris decides architecture and Claude Code mechanics.** Where agents, skills,
  capabilities, schemas, and app code live; how persona CLAUDE.mds load; what is
  and isn't this OS's pattern. These are not questions for Nick. Decide and commit.
- **Nick decides business reality.** Which venture something belongs to, whether a
  venture is separate or merged, what an expert sells, what the offer is, domain
  ownership, pricing. Boris asks about these and never assumes them.

The failure mode this exists to prevent: asking Nick architecture questions while
assuming business facts. That is exactly backwards.

## What an "agent" is

An agent is a **folder with a persona `CLAUDE.md` that you launch into and embody.**
Launching Claude Code from the folder loads its CLAUDE.md and that *becomes* the
operator. This is the engagement-loading pattern.

- **Reusable, engagement-agnostic agents** → `capabilities/agents/<name>/CLAUDE.md`
  (e.g. Vega, the creative director).
- **Practice personas** → `practices/<practice>/CLAUDE.md`
  (Boris = agentic-systems, Kepler = sales-and-gtm, Hermes = expert-liaison,
  Polaris = engagement-governance).
- **Never** `.claude/agents/`. That is the harness's ephemeral dispatch-and-die
  subagent mechanism (e.g. the unused gsd-* plugin files). It is not this OS's
  pattern. Do not register agents there. Do not copy plugin patterns.

## What a "skill" is

A skill is a **folder with a `SKILL.md`** that produces an artifact.

- **Reusable skills** → `capabilities/skills/<name>/SKILL.md`
  (e.g. website-conversion-design).
- **Practice-specific skills** → `practices/<practice>/skills/<name>/SKILL.md`
  (e.g. agentic-systems/skills/system-building).
- Skills execute; agents direct. An agent routes work to skills; it does not
  duplicate them.

## What a "system" is

A system is a **folder that holds a thing that produces value** — spec, schema,
runners, a canon registry row, a Projection UI surface. It is *what gets built*, not
*who builds it*. Systems are the default kind of folder; agents are the rare
exception (only the personas above).

- **System repositories** → `systems/<name>/` (top level).
  (e.g. `revops-engine`, `canon-engine`, `projection-ui`.)
- Each system folder gets a **thin scope-header `CLAUDE.md`** — see
  `systems/_template/CLAUDE.md`. It declares what the system is and which persona
  operates it. It is NOT a persona and never gives the folder a personality. The
  operator (Boris by default) stays the operator; the header just scopes the work to
  this system while the full canon registry stays in hand. This is how you "launch
  as Boris" while standing inside one system.
- A system is operated by a practice persona, registered in canon (`systems`
  table), and surfaced in the Projection UI. Chat is for building or repairing a
  system; running it happens in the UI.
- **Not** a system: a practice persona (that's an agent, `practices/<x>/`). Don't
  stamp a system header onto a persona folder, and don't give a system folder a
  persona personality. ("Expert Liaison" is the persona Hermes at
  `practices/expert-liaison/` — the expert→Canon loop it operates is a separate
  system that lives in `systems/`.)

## Where everything else lives

- **Schemas** (shared) → `capabilities/schemas/`.
- **Engagement context and artifacts** (brand, offer, briefs, deliverables) →
  `accounts/{ventures,clients,prospects}/<name>/` or `assets/<name>/`. Never bake
  engagement-specific content into a capability or practice.
- **Application / product code** (e.g. a website) → its own repo OUTSIDE
  `~/code/work/` (e.g. `~/code/<name>-site/`). The operator OS holds the brand
  context that feeds it; the app repo consumes it. Do not mix app code into the OS.
- **Reusable building blocks any engagement can use** → `capabilities/`.

## How Boris pattern-matches

Before creating anything, match against THIS file and the existing folders
(`capabilities/`, the practice personas) FIRST. Installed-but-unused plugins
(gsd, etc.) are noise unless Nick says otherwise. One concept gets one home ...
never create a second location for something that already has one.
