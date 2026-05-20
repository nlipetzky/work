# Source-of-record: orchestrator/builder topology and the spawn-safety boundary (2026-05-18)

## What happened

Nick defined the working model: he keeps working with the agentic-systems agent as the **orchestrator** (owns the plan, the gates, the registry, the review/go-no-go). Builder agents (e.g. Explorium-Direct) execute. For now Nick is the human message bus relaying between orchestrator and builders. He wants, eventually, the orchestrator to spawn builder subagents directly so he is not the liaison.

## The reasoning

The orchestrator/builder split is not new — it is the single-writer lane model already in the registry and orchestration map, with the human currently as the relay. Naming it changes nothing structurally; it works today.

The real architectural point is the spawn-safety boundary. "Can the orchestrator spawn a subagent" is mechanically trivial (the Agent tool exists). That is not the question. The question is **what a spawned agent may do without the human, and where the gate must remain.** The human-in-the-loop today is not merely liaison friction — it is the approval gate on irreversible action. A builder that touches the live classifier or the shared base performs hard-to-reverse work (n8n deploys, credential wipes on every MCP edit, schema changes, spend). The relay is doing double duty as the authorization checkpoint.

Therefore the spawn evolution is staged, not binary:

- **Spawnable now, autonomously:** the safe classes — research, reading source, producing and checking plans, dry analysis, anything with no irreversible side effect. The orchestrator should already use subagents here to protect its own context and parallelize.
- **Deferred, gated:** spawning a builder that executes irreversible writes (deploy, schema, spend). This stays human-gated until two conditions hold — the observable/reconciliation layer is trustworthy (the registry↔reality job exists, so an autonomous builder's claims can be verified against the surface, not believed), and per-run authorization is explicit (the no-autonomous-spend and build-asset-lifecycle rules are not waived by a topology change).

Collapsing "spawn a subagent" into "autonomously run irreversible builds" is the failure mode. The orchestrator removes the human from *relay* long before it removes the human from *authorization of irreversible action*.

## Disposition

Working model confirmed and active now (orchestrator + human relay + builders). Autonomous safe-class spawning is available now. Autonomous execute-builder spawning is a recognized, named, deliberately-deferred capability belonging to the AOS line, gated on the observable/reconciliation layer + explicit authorization. Captured, not designed.
