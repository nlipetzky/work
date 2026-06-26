# System folder standard

How every system under `systems/<name>/` is organized, and where agents, skills,
and runtime state live. The goal: a system is a self-contained, buildable, runnable
unit, and the link between a system and the personas that operate it is enforced by
structure, not by memory.

## Per-system layout

```
systems/<name>/
  CLAUDE.md      operating context: what this is, who operates it, links to method + registry
  SYSTEM.md      the contract: activities -> output, dependencies (the system's reality)
  agents/        agents that serve ONLY this system
  skills/        procedures specific to this system
  schemas/       this system's data contracts
  src/ (or app/) the code
  runbooks/      how to operate + recover it
  runtime/       gitignored ephemeral execution state
```

Scaffold a new system from `systems/_template/`.

## Three layers, kept separate (never mixed)

- **Source** ... the code (`src/` / `app/`). What runs.
- **Doctrine** ... the `.md` contracts (`CLAUDE.md`, `SYSTEM.md`, `runbooks/`). What it
  is and how it behaves.
- **Runtime** ... ephemeral execution state (`runtime/`, logs, run status). Always
  gitignored, never committed.

## Where agents live

- Serves **one** system → `systems/<name>/agents/`. The system owns it.
- Reused **across** systems → `capabilities/agents/`.
- A persona you launch into (Boris, Hermes, Polaris, Atlas) → `practices/<name>/`.
- `.claude/agents/` is only where the harness loads runtime defs; the source of truth
  stays with the owner above.

## The link between a system and its operators

A system carries its own reality in `SYSTEM.md`, auto-loaded when you launch into the
folder. A shared persona reads it. The connection is enforced three ways, none of
which rely on an agent remembering to look:

1. **Directory-triggered context** ... launching in `systems/<name>/` auto-loads its
   `CLAUDE.md` / `SYSTEM.md`.
2. **The canon registry** ... systems, activities, and dependencies are queryable data,
   not links you hope got followed.
3. **Bidirectional links** ... a system names its operator and dependencies; a shared
   persona names the systems it operates.

A persona that operates exactly one system should live in that system's folder
(colocation). A cross-cutting persona stays shared in `practices/`.
