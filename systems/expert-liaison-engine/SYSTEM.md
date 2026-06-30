# SYSTEM: expert-liaison-engine

The contract. This system's reality, read by any operator working on it. It auto-loads
when you launch Claude Code into this folder.

## Output

A resolved expert judgment, **bound back to the system that asked** — produced by driving
a persistent motion from intake to closure, and never dropped. The unit of output is a
closed `expert_motion` whose verdict has been written back to its `concerning_system`.

## Activities (what it ensures)

- [ ] Record an inbound expert request — automated (a producing system emits) | human (operator captures in the Inbound lane)
- [ ] Triage a request → open a motion / attach to an open motion / dismiss — human (surface) + automated (`triage_expert_request`)
- [ ] Advance a motion (compose ask, follow up, escalate, resolve) — automated clock + human; the single writer is `advance_motion`
- [ ] Compose + send the outbound communication — reuses the existing exchange → packet machinery (produce/judge automated, send human)
- [ ] Bind the resolved verdict back to the asking system — automated (`apply_motion_binding`)

## Depends on

- canon-engine (Supabase `mzzjvoiwughcnmmqzbxv`) — the 4 objects + RPCs; co-located with the existing `experts` / `expert_exchanges` / `expert_review_packets` / `source_assessments`
- projection-ui — the `/expert-liaison` surface (Inbound lane + Motions board)
- capabilities/inngest — the autonomous follow-up clock (`expert-motion-follow-up-sweep`)
- revops-engine — first producer (Ellie's AAV-target verdict path) and first bind-back target

## Surface

projection-ui `/expert-liaison`. The Inbound queue, the Motions board, and every approval
live here, never in chat.

## Data contracts

Detail in `schemas/`. The four objects:

1. `expert_requests` — raw inbound ask from a producing agent/system (the intake atom). Emit via `record_expert_request`.
2. `expert_motions` — the durable, goal-owning thread. Goal tracked as `goal_predicate.line_items[]` that each *point* at the exchange resolving them. Sole state-writer: `advance_motion`.
3. `expert_exchanges.motion_id` (FK) — threads every existing ask/packet to its motion. Verdict stays the single source of truth on `expert_exchanges.metadata.verdict`.
4. Emit/consume contracts: `record_expert_request` (sole inbound writer), `advance_motion` (sole motion-state writer), `apply_motion_binding` (bind-back dispatcher), `expert_binding_for_system` / `open_motion_blocking` / `v_motion_resolved_answers` (the SOP-steward / future-folder read seam).

## Operator

Hermes (`practices/expert-liaison/`). Built by Boris (agentic-systems). Nick gatekeeps
business reality.

## Registry

Canon `systems.system_slug`: `expert-liaison-engine`. Maturity: `building` (no "operating"
without the end-to-end verification: a real revops route-review row → request → motion →
packet → answer → bind-back → the row promotes to Core).
