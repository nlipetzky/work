# Capability: Skills

Shared SKILL.md packages reusable by ≥2 systems. Most skills start their lives in a single system's `skills/` folder. They get promoted here only when a second system independently needs the same skill and the duplication would otherwise drift.

## Why this could pass the rubric

1. Used by ≥2 systems (the bar: a real second consumer, not a hypothetical one).
2. The skill's reasoning pattern is not system-specific.
3. Versions independently (one update propagates to all consumers).
4. The skill is infrastructure ... a reusable cognition module, not a business asset.

## What belongs here

- A `validate-event-envelope` skill both canon-engine workflows and revops-engine workflows call.
- A `summarize-artifact` skill that any system can use against any artifact.
- A `propose-capture-item` skill every persona uses when discovering work for the spine.

## What does NOT belong here

- Skills that only one system uses (live in `systems/<name>/skills/`).
- Operator-only skills used in interactive Claude Code sessions (live as `.claude/skills/` ... at the workspace root or per-system per Claude Code's discovery rules).
- One-shot prompts that aren't packaged as SKILL.md (those aren't skills, they're scripts or prompts).

## Current state

Empty. Skills sit in their owning system today. Promotion criterion: when you find yourself about to copy a SKILL.md from one system to another, stop and promote it here first.
