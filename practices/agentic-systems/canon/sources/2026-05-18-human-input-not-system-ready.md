# Source-of-record: human input is not system-ready — the expert liaison is its own system (2026-05-18)

## What happened

Asked whether we had a collection of the "liaison between the domain expert and the RevOps engine" described in an earlier session. What exists is three scattered pieces: the Domain Expert Review Loop protocol (memory, the most-articulated piece), the Priority Surface pattern (reference doc), and the ratification queue inside the criteria artifact (R/Q items). Nick confirmed it is an emerging system and stated the load-bearing realization: human input does not easily translate directly into system-ready components. What is needed is a system that can process intake, propose/draft messages, route them to the domain expert, take the judgment back, and iterate it into sourcing/enrichment/classification. He judged it a separate system that is part of the RevOps engine — possibly later under an account-management system — explicitly deferring that parent-boundary question.

## The reasoning

The realization is architectural, not operational. The Domain Expert Review Loop is the operational *how* (proof packaging, reaction lanes, staged delivery). The new primitive is *why it must be its own system*: there is an impedance mismatch between expert judgment and machine-consumable rules/config. An expert says "this one's wrong because it's not really their buyer" — that is not a rule, a filter, or a field. Something must do intake, draft the outgoing proof/messages, carry them to the human, and translate the returned judgment into ratified rule/priority changes the engine consumes. Treating that as ad-hoc glue rebuilt per engagement is the failure mode (it is why the loop existed only as scattered docs). It is a translation system with its own lifecycle.

Modeling: it is platform-level (the protocol itself says it generalizes beyond Teknova/Ellie), emerging, and tightly coupled to the RevOps engine in both directions — it operates on the engine's outputs and feeds ratified judgment back into the engine's config. The precise containment (its own platform system that the engine composes with, vs. a sub-system, vs. later under an account-management system) is an emerging boundary, deliberately not resolved (emergent-systems primitive applies). Minimal structure: register it as its own platform system, express the coupling with the existing Depends On link, capture the unresolved parent boundary as living context — do not invent nesting or an account-management system now.

## Refinement — standardized vs connected; named expert-liaison

Nick named the system `expert-liaison` and added vision: AI-first, understands each client differs, adapts output per client (email/spreadsheet/meeting), actively extracts expertise (not passive intake), and the resulting documents must be accessible to the RevOps engine — he asked whether that needs to be standardized or just connected, and noted it replaces a passive Drive-index table ("Teknova" table in RevOps Surface, barely incorporated).

Answer: two boundaries with opposite rules.
- **Human-facing boundary: deliberately NOT standardized.** Adaptive per client is the point. Forcing the expert into a standard form is exactly the impedance mismatch the system exists to remove. Capture artifacts in native form.
- **Engine-facing boundary: MUST be standardized** to what the engine consumes (ratified, typed rule/priority/criteria changes — the ratification queue is today's instance).
- **Connection ≠ standardization.** Connecting un-standardized human artifacts to the engine just relocates the mismatch. The raw artifacts are captured + made accessible (connected); the standardized engine-ready projection is *derived* at the engine boundary. Performing that translation is the system's whole job. Same capture-wide / derive-narrow shape, applied to human input.

This supersedes the passive Drive-index table: a dumb file list is "connected" with zero translation — the anti-pattern made concrete.

## Disposition

Register as a separate platform system, Definition Maturity = emerging, coupled to revops-engine. Identity slug held for Nick (immutable-key principle; do not autoname; keep the slug parent-neutral since the parent boundary is itself emerging — do not bake "revops" or "account-mgmt" into it). Captured, deliberately deferred on boundary; the human↔system translation layer is recognized as a first-class system, not glue.
