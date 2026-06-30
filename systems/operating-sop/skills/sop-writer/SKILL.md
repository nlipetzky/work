---
name: sop-writer
description: Use this skill in BUILD mode when authoring a NEW SOP definition from scratch ... the L1 stage spine (named, ordered stages, each with a declarative required_end_state / done-when verdict) plus the L1<->L2 contract naming which workflow(s) produce each stage. Triggers: "write a new SOP for X", "draft the stage spine for Y", "define the stages and gates for Z", clicking "+ Open SOP-writer" in /operate BUILD. It produces a "sop-definition" draft via propose_artifact; it does not run anything. Do NOT use for: composing the workflow graph behind a stage (use workflow-composer); binding activities to workflow nodes (use activity-binder); advancing or running an existing SOP (use sop-run-advancer); editing a live SopRun's state (that is a run operation, not authoring).
status: DRAFT
---

# sop-writer

## Purpose
Author the top layer of the three-layer work model for a new procedure: the SOP spine. That is the ordered list of named stages, each with a declarative end-state the stage is "done" against, plus the Contract-A mapping of which workflow(s) produce each stage. Declarative and loose on purpose ... it states WHAT must happen and in what order, not the mechanics.

## When to use
- The operator wants to define a brand-new SOP and has the procedure in their head or in source material.
- An existing process needs its conformance spine written down before workflows or activities are built.
- The /operate BUILD surface routes a "+ Open SOP-writer" action here.

## What it does
- Reads three-layer-work-model.md and holds the L1 discipline: stages are declarative, ordered, gated; each carries a required_end_state (the done-when conformance verdict), not step-by-step mechanics.
- Elicits/extracts the named stages and their order from the operator's source.
- For each stage, writes a one-line required_end_state and the Contract-A mapping (workflow id(s) that produce it, or "unbound" if no workflow exists yet ... many-to-many, left for workflow-composer to fill).
- Emits a single sop-definition artifact: sop name, ordered stages, per-stage end-state, per-stage workflow contract.
- If the source lacks enough substance to name real stages or end-states, emits INSUFFICIENT_SOURCE rather than inventing a generic spine.

## Reads
- practices/agentic-systems/reference/three-layer-work-model.md (L1 spine + Contract A semantics).
- The operator's procedure source (chat description, pasted SOP, engagement notes).
- Existing canon SOPs if naming/numbering needs to stay consistent (read-only).

## Writes
- A "sop-definition" draft artifact via systems/canon-engine/scripts/govern-artifacts.mjs propose_artifact (RULES-GATE -> JUDGE -> PROPOSE -> CONFIRM). Never writes sops/sop_stages rows or repo files directly ... it proposes the draft for governance and the operator confirms.

## Do NOT use for
- Composing the workflow graph that produces a stage (use workflow-composer).
- Binding activities to workflow nodes (use activity-binder).
- Advancing or running an existing SOP (use sop-run-advancer).
- Editing a live SopRun's state (that is a run operation, not authoring).
