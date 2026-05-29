# STATE.md Pattern — Session Bootstrapping for Active Engagements

## Why this exists

Multiple sessions touch each active engagement. A session launched from a client folder pulls the client's CLAUDE.md but historically has had no way to know:

- What the active Trajectory commits to
- What sprint is currently in flight
- What artifacts are the operative read-list before drafting anything client-facing
- What hard rules govern client communication right now
- What strategic decisions have shifted the plan in the last few days

Without that surface, a fresh session defaults to "be helpful," drafts an email with time-bound commitments that contradict the active Trajectory, and reproduces the failure mode the methodology was supposed to prevent.

STATE.md is the session-bootstrapping file. Pinned at the root of every active engagement folder. Loaded before any client-facing artifact gets drafted.

## What STATE.md is

A single markdown file at the root of each active engagement folder (`accounts/clients/<name>/STATE.md`, `accounts/ventures/<name>/STATE.md`, `accounts/prospects/<name>/STATE.md`).

Contents:
- Engagement status (active / in-wind-down / paused / archived)
- The read-list (specific artifacts to load before drafting)
- Hard rules (the discipline boundaries that get violated when sessions are unaware)
- Sponsor and expert names
- Current sprint state
- Recent strategic decisions
- Out-of-scope items
- Update protocol

Template: `/Users/nplmini/code/work/accounts/clients/_template/STATE.md`.

## What STATE.md is NOT

- Not a Trajectory. The Trajectory is a separate artifact that STATE.md points to.
- Not a Slot Report. STATE.md updates when decisions or state shift, not weekly.
- Not a substitute for the engagement's CLAUDE.md. CLAUDE.md describes the engagement's standing shape; STATE.md describes the current operating state.
- Not a place for long discussion. Keep it scannable. A new session should be able to orient in 60 seconds of reading.

## When to update STATE.md

Update on these events:

- **New artifact produced** that should be in the read-list. Add the path.
- **Strategic decision shifts the plan.** Add to "Recent strategic decisions" with date.
- **Sprint starts or ships.** Update sprint state.
- **Scope-change event occurs.** Note in decisions.
- **Engagement status transitions** (active → wind-down → archived). Update status header; lock and timestamp if archived.

Updating STATE.md is part of the same edit cycle as producing the artifact that triggered the change. Do not defer.

## Governance

The Polaris operator (engagement-governance practice) owns STATE.md for each engagement. Other practices touching the engagement (revops, expert-liaison, agentic-systems) read STATE.md before drafting client-facing artifacts and surface any inconsistency they notice back to Polaris.

If a session discovers STATE.md is stale (sprint state from two weeks ago, missing recent decisions, etc.), the immediate next move is to update it before producing anything new. Stale STATE.md is the failure mode this pattern is designed to prevent.

## Rollout requirements

Every active engagement folder must have a STATE.md. Engagements without one are running blind across sessions. Adding STATE.md is the cheapest discipline move available.

- Active client engagements: STATE.md at `accounts/clients/<name>/STATE.md`
- Active venture engagements: STATE.md at `accounts/ventures/<name>/STATE.md`
- Active prospects in serious conversation: STATE.md at `accounts/prospects/<name>/STATE.md`

The client / venture / prospect template (`accounts/clients/_template/`) includes STATE.md scaffolding. New engagements inherit the pattern from day one.

## Related references

- `/Users/nplmini/code/work/practices/engagement-governance/reference/methodology.md` — the broader engagement-governance methodology
- `/Users/nplmini/code/work/practices/engagement-governance/reference/weekly-delivery-shape.md` — the underlying weekly operating protocol STATE.md references
- `/Users/nplmini/code/work/practices/engagement-governance/reference/client-onboarding-playbook.md` — the onboarding sequence that includes STATE.md creation
