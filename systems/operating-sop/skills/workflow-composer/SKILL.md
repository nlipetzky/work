---
name: workflow-composer
description: Use this skill in BUILD mode when an SOP stage needs its L2 workflow DEFINITION authored ... the node set, the edges (a DAG), and the control_flow (fixed-orchestration vs agent-drives-the-loop), with each node pointing at an existing activity_id. Triggers: "compose the workflow for stage X", "define the node graph for this stage", "wire the activities into a DAG", "what's the orchestration for stage X". It produces a "workflow-definition" artifact and gates on nodes[] non-empty, every node.activity_id resolving in canon, and edges forming a DAG (no cycles). Do NOT use for: naming a stage or its done-when gate (use sop-writer); defining what a single node DOES ... its inputs/outputs/executor-class (use activity-binder); scaffolding the runnable function behind a node (use function-scaffolder).
status: DRAFT
---

# workflow-composer

## Purpose
Author the L2 orchestration for one SOP stage: the directed acyclic graph of nodes and edges plus its control-flow ownership, where every node references an already-defined L3 activity. This is the "how the stage's output gets produced" layer ... distinct from what the stage is (L1) and what each node does (L3 binding).

## When to use
- An L1 stage exists (named, with a done-when gate) and now needs its executable shape.
- The activities a stage will use are already bound and you need to wire them into a graph.
- Re-composing a stage's workflow after activities were added, removed, or re-ordered.

## What it does
- Reads the target stage and the candidate activity_ids the operator names.
- Lays out nodes[] (one per activity step) and edges[] as a DAG; sets control_flow to fixed-orchestration or agent-drives-the-loop per the three-layer model.
- Validates gates locally before proposing: nodes[] non-empty; every node.activity_id resolves to a canon activity row; edges form a DAG (no cycles, all endpoints exist).
- If the stage has no bound activities to reference, or the named activity_ids don't resolve, emits INSUFFICIENT_SOURCE rather than inventing nodes.

## Reads
- canon `sop_stages` (the target stage) and `public.activities` (to resolve each node.activity_id).
- practices/agentic-systems/reference/three-layer-work-model.md (L2 orchestration + control-flow ownership).
- practices/agentic-systems/reference/vertical-system-pattern.md (where the definition lives).

## Writes
- A draft `workflow-definition` artifact via systems/canon-engine/scripts/govern-artifacts.mjs `propose_artifact` (RULES-GATE -> JUDGE -> PROPOSE -> CONFIRM). Never writes canon rows or repo files directly; the operator confirms.

## Do NOT use for
- Naming a stage or its done-when gate (use sop-writer).
- Defining what a node DOES ... inputs, outputs, executor-class (use activity-binder).
- Scaffolding the runnable function behind a node (use function-scaffolder).
