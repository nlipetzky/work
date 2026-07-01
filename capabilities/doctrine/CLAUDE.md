# Capability: Doctrine

Studio-wide doctrine, conventions, and operator standards that apply across systems. Doctrine is *what does not get re-decided per system*. If the rule is "always do X" or "never do Y" and it cuts across more than one system, it lives here.

## Why this passes the rubric

1. Used by all systems by definition (doctrine is universal).
2. Encodes studio-level policy, not any one system's domain rules.
3. Versions slowly and independently of system runtimes.
4. Is documentation infrastructure, not a runtime asset.

## What belongs here

- Operator standards (artifact discipline, system-building method, atlas-inbox contract).
- Naming conventions, file structure standards.
- Cross-cutting rules ("how systems get retired," "how engagement folders are structured").
- Decision frameworks the operator returns to repeatedly.

## What does NOT belong here

- Reference docs about a single system (live in that system's `docs/` or root).
- Operator persona definitions (live under `practices/<persona>/`).
- Specific play criteria, client briefs, engagement context (live under `accounts/`).

## Current state

Empty. Most existing doctrine lives at `practices/agentic-systems/reference/`:

- `artifact-discipline.md`
- `system-building-method.md`
- `atlas-inbox-spec.md`
- `architecture-notes.md`
- `system-folder-standard.md`
- `folder-architecture-decision.md`

Promotion criterion: when a reference doc is being used by multiple practices/systems independently of agentic-systems, promote it here.
