# System: expert-liaison-engine

Thin scope header. This folder is a **system repository**, not an agent. It holds what
the system is and how it's built — spec, schema, runners, registry id. It does NOT
impersonate a personality. Launching Claude Code here loads this context and points the
operator at THIS system.

## Operator

Hermes (`practices/expert-liaison/`). Built by Boris (agentic-systems). The operator
decides architecture; Nick decides business reality. The practice holds the *how*
(translation craft, the three pillars, approval discipline); this system is the durable
*engine* that practice runs.

## What this system does

The intake + persistent **motion** engine for expert liaison. It captures any expert ask
another agent or system hands off (`expert_requests`), drives it as a durable
`expert_motion` (open → active → achieved | parked | abandoned) — following up until the
thing the asking system needs actually comes back — feeds the already-built
`expert_exchanges → expert_review_packets` outbound machinery, and **binds the resolved
verdict back to the system that asked**. A sent message is not "done"; the motion is the
goal that persists until satisfied.

## The membrane framing (why this is more than a queue)

In the locked stewardship model (`scratchpad/handoff-2026-06-30.md`): an SOP =
function(expertise, account); the SOP steward composes expertise; expertise accumulates
into a living **AI expert-folder**; the human migrates to optimizer. This engine is the
**membrane** that carries the human's shrinking frontier-push + supervision signal to a
*maturing* AI expert. v1 routes to a **human channel**, but the emit/consume contracts are
built for that future: a motion's target is an abstraction (`target_type` / `target_ref`)
that flips from `human_expert` to `ai_expert_folder` with no schema change, and the SOP
steward can read an expert's current binding (`expert_binding_for_system`,
`open_motion_blocking`). The AI-expert-folder itself is out of scope here — only the seam.

## Where it lives

- Spec / design: this folder's `SYSTEM.md`; build plan `~/.claude/plans/yes-it-s-a-shared-infra-inherited-catmull.md`
- Data: canon-engine Postgres (`mzzjvoiwughcnmmqzbxv`) — migrations `024–027` (logically owned here, physically in `systems/canon-engine/supabase/migrations/` because one Postgres = one chain)
- Canon registry id: `systems.system_slug = 'expert-liaison-engine'`
- Surface: projection-ui `/expert-liaison` (Inbound lane + Motions board)

## Folder layout

Standard per-system layout (`practices/agentic-systems/reference/system-folder-standard.md`):

- `SYSTEM.md` — the contract: activities, output, dependencies, data models
- `schemas/` — the assembled data contracts (the 4 objects)
- `workflows/` — Inngest functions (the follow-up clock), unioned by projection-ui `/api/inngest`
- `agents/`, `skills/`, `src/`, `runbooks/` — standard
- `runtime/` — ephemeral execution state (gitignored)

## Two-surface rule

Operate this system on `/expert-liaison`. Come to chat (here) only to extend or repair it.
If routine liaison work is happening in chat, the system isn't finished — finish it.

## Status

`building` — see `system-building-method.md`. No "operating" without verification evidence
(the end-to-end loop: request → motion → packet → answer → bind-back → a real revops row
unblocked).
