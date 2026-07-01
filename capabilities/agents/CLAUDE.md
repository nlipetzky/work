# Capability: Agents

Reusable agent personas / system prompts that are not tied to one system. Agents that map to a specific operator role (Boris, Hermes, Atlas, Polaris) live in `practices/<role>/`. Agents that are runtime callable by ≥2 systems live here.

## Why this could pass the rubric

1. Used by ≥2 systems (only if true ... most agents start system-local).
2. Not encoding one system's business policy.
3. Versions independently of any single system's runtime.
4. Infrastructure (the persona/prompt itself), not runtime ownership.

## What belongs here

- A general-purpose code-reviewer agent multiple systems invoke.
- A schema-validator agent both projection-ui and revops-engine call.
- An artifact-critic agent the artifact-discipline workflow invokes from any system.

## What does NOT belong here

- Boris/Hermes/Atlas/Polaris ... those are folder-personas under `practices/` because they're operator roles, not runtime agents.
- System-specific agents (e.g. a RevOps-only signal classifier) ... lives in `systems/revops-engine/agents/`.
- Subagent definitions for Claude Code (those go in `.claude/agents/` at the workspace or system level per Claude Code's discovery rules).

## Current state

Empty. Promote here only when an agent definition is being copy-pasted across systems and the duplication is real.
