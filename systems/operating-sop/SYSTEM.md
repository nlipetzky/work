# SYSTEM: operating-sop (run-tracker)   [provisional name]

The contract. This system's reality, read by any operator working on it.

## Output

A live, per-output operating checklist (SOP): for each recurring business output, the
ordered system-activities that produce it, each with status (todo / doing / done /
needs-you / blocked-build) and the single next action. The thing you open to know
"where am I on running X, and what is next."

## Activities (what it ensures)

- [ ] Maintain the catalog of business outputs and their SOP step-lists — human-defined first
- [ ] Compute each step's live status from canon (activity done? its system operational?) — automated
- [ ] Surface the active SOP(s) with the next action + inline approvals — automated
- [ ] Gate a step whose system is not operational into a build pause + link a build item — automated
- [ ] Record step completion / approval / output produced — human (via the surface)

## Depends on

- canon-engine (Supabase) — activities, systems, system-state, and the SOP / run tables
- operator-os — the work spine (build items linked to blocked steps) + Atlas
- the systems each step runs on (revops-engine, signal-targeting, outreach-producer, ...)

## Surface

projection-ui `/operate` (proposed). All approvals and the next action live here, never
in chat.

## Operator

Atlas (operator-os). Built by Boris (agentic-systems). Nick gatekeeps.

## Registry

Canon `systems.id`: unregistered. Maturity: emerging (spec written, pending ratify).
