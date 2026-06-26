# Automation build doctrine

Guiding rules for building automations (n8n workflows, scheduled jobs, agent-driven
pipelines). Absorbed from the retired `automation` practice. This is build-time
guidance, not a runtime-read contract.

## Manual-first

Only automate what has proven itself manually. If a workflow hasn't run end-to-end
with a human in the loop and produced consistent output, it is not ready to automate.
Automating an unvalidated workflow gives you a fast, confident, wrong pipeline. (Also
a top-level rule in `work/CLAUDE.md`.)

## Before building

1. Identify the manual workflow it replaces. Where does it live? Does it actually work?
2. Identify the failure modes. What breaks silently? What needs human review?
3. Propose the automation shape and get sign-off before building.

## Rules

- Prefer simple triggers over complex orchestration.
- Every automation needs an observable failure state. If it can fail silently, it will.
- Document the human-loop touchpoints you removed ... they existed for a reason.

## Boundaries

- Runtime code (n8n, functions, integrations) and operator/doctrine files stay
  separate (the source / doctrine / runtime split in `system-folder-standard.md`).
- Expert-facing interaction (criteria, ICP, approval asks) routes through Hermes
  (expert-liaison), never captured ad hoc.

The n8n building craft itself lives in the `n8n-practice` operator (and the
`n8n-mcp-skills` plugin skills).
