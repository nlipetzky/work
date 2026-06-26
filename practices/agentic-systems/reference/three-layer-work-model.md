# The three-layer work model (how work moves from zero to done)

Date: 2026-06-26. Owner: Boris (agentic-systems). Status: validated via deep research
(process hierarchies, BPM, workflow orchestration, agentic work, observability). This is
the data foundation for the `operating-sop` system (`systems/operating-sop/SPEC.md`).

## The model (Nick's instinct, validated and sharpened)

Work moves through three layers. The instinct is sound ... it matches the field's three
recurring planes ... with two corrections that keep it consistent.

- **L1 — SOP spine (conformance contract).** The end-to-end procedure: the required
  stages, their order, and the gates. DECLARATIVE and LOOSE on purpose ... it states what
  must happen and in what order, not the mechanics. (ISO "Procedure/Policy" sense.)
- **L2 — Workflow (orchestration).** The executable that actually produces a stage's
  output by pushing inputs -> outputs. May be a GRAPH of runs across engines (n8n +
  Inngest + script + cron), not a single run.
- **L3 — Activity binding (+ execution).** The atomic step bound to where it runs: a
  typed, reusable executor (tool name + schema + host/trigger) plus a per-run execution
  record.

### Correction 1: the two seams are NOT the same kind of join

This is the category error to avoid (Nick's "all three run parallel" wording).

- **L1 <-> L2 is PARALLEL artifacts joined by a CONTRACT.** The SOP and the workflow are
  two separate representations of one process; the readable procedure is the
  REQUIREMENTS, the workflow is the executable. They never merge into one diagram (Bruce
  Silver; BPMN 2.0 decoupled semantics from execution; ISA-95 treats the workflow/MOM
  plane as distinct). The join is a mapping: "workflow W produces SOP stage S."
- **L2 <-> L3 is CONTAINMENT.** The binding lives INSIDE the workflow as its technical
  interior (Temporal Workflow/Activity; LangGraph node = a function; BPMN service/user
  tasks; MCP tool = name+schema+host). L3 is a refinement of L2, not a parallel plane.

So: L1|L2 = parallel-by-contract; L2|L3 = containment. Do not model all three as one
parallel stack.

### Correction 2: "SOP" here means the loose top, not the strict bottom

Vocabulary collision worth nailing down. In ISO/quality frameworks, "SOP / work
instruction" is the LOWEST, strictest layer (step-by-step how). We use "SOP" for the
LOOSEST top layer ... which is, word for word, the ISO "Procedure/Policy" tier. Both
usages are legitimate; pick ours and document it: L1 = the SOP-as-spine, declarative,
states required stages + order + gates. Its monitoring formalism is CONFORMANCE CHECKING
(compare actual events to the expected model, flag DEVIATION), not hard enforcement.

## Monitoring: object + state + rollup, per layer

Every multi-altitude monitoring approach uses the same triple: an OBJECT (an instance
with an id), a STATE (a status enum), and a ROLLUP RULE (how a parent's status derives
from its children). Rollup is a DESIGN CHOICE you implement, not a behavior you inherit
... an OpenTelemetry parent can read Ok over a failed child; a Temporal run can Complete
despite a caught activity error. So we make rollup explicit.

- **L1 object:** a SOP run (case / process-instance). State: per-stage conformance verdict
  (on-track / deviated / done). Monitored by conformance-checking + KPIs.
- **L2 object:** a workflow run (execution; may bundle several engine-runs). State:
  open / closed / failed. Source of truth: an append-only event history.
- **L3 object:** an activity execution (a span). State: unset / ok / error (ordered
  ok > error > unset). Attributes name the node/env; the trigger names how it fired.

Rollup (explicit): L3 ok/error -> L2 run (a workflow succeeds only if its activities are
ok or intentionally caught; propagate failures) -> L1 stage (a stage is done only when a
contracted workflow produced its required end-state; out-of-order events = deviated).

## The shape: two first-class contracts + a reconciler

- **Contract A (L1|L2):** `sop_stage <-> workflow`, MANY-TO-MANY. One stage can need
  several workflows (a graph across engines); one workflow can serve several SOPs.
- **Contract B (L2|L3):** `workflow <-> activity-binding`, MANY-TO-MANY. One binding
  (e.g. "enrich contact", "send approval") is a SHARED REGISTRY reused across workflows
  and SOPs. (Not a containment tree ... a naive SOP->workflow->node tree breaks on reuse.)
- **The reconciler (highest-value artifact):** a DRIFT object/view that flags when layers
  DISAGREE ... a stage marked done with no L2 run that produced it; an L2 run reporting
  success while its L3 node silently errored. Drift = layers disagree. This is the
  observability-projection pattern (records<->runs join, per-field provenance,
  gaps-as-views) applied across three layers joined by the two contracts.

## AI-first: it changes L3, not the layer count

An AI-first org does not add a layer. It changes what L3 IS and adds one L2 attribute:

- L3 = a typed reusable BINDING (tool name + schema + host) PLUS an EXECUTION RECORD per
  run (Temporal's Activity-Definition vs Activity-Execution).
- **Executor-class** types every binding: `automated-tool` / `agent-loop` /
  `human-in-the-loop`. The type defines what "done" and "healthy" mean, and resolves
  where human judgment lives (it is an L3 binding TYPE; L2 collapses for that step when
  there is no workflow).
- L2 records **control-flow ownership**: `fixed-orchestration` vs `agent-drives-the-loop`
  (Anthropic's workflow-vs-agent line). When an agent picks tools at RUNTIME, you cannot
  pre-author the L3 binding ... L3 becomes a recorded-after-the-fact log of which tool the
  agent chose. That is the one place the static three layers genuinely strain; model it
  honestly rather than pretend a design-time binding exists.

## Where the strict mapping breaks (and how the model absorbs it)

- One stage needs several workflows -> Contract A is one-to-many; the L2 "run" aggregates
  across engines before rolling up.
- One activity reused across SOPs -> Contract B is many-to-many; bindings are a shared
  registry, not leaves.
- A pure-human-judgment step with no workflow -> executor-class = human-in-the-loop at L3;
  L2 collapses for that step; the L1 stage maps straight to the L3 human-task.
- Trivial work -> depth is a per-stream COST decision; allow L1 == L2 == L3 to collapse;
  reserve full L3 tracking for streams where failure/compliance/automation justify it.
- Terminology collision -> fix one canonical meaning per layer ("trace" and "activity"
  mean different things at L1 vs L3) or the monitoring objects conflate records.

## Maps onto existing canon (reuse, do not reinvent)

- L3 binding ~= existing `public.activities` + `system_triggers` / `trigger_routes`. Add:
  executor-class, locator/schema, and an `activity_executions` run record.
- L2 run ledger ~= generalize `prep_run_status` into a `workflow_runs` event history.
- The reconciler ~= the observability-projection pattern already in canon.
- Net-new: the L1 SOP-spine objects (`sops`, `sop_stages`, `sop_runs`), the two contract
  tables, the drift reconciler, executor-class typing, the L2 control-flow attribute.

## Key sources

- APQC Process Classification Framework (Category/Process Group/Process/Activity/Task).
- ISO 9001 documentation tier: Process > Procedure > Work Instruction (the cleanest
  3-tier precedent; note "SOP/WI" = the strict bottom there).
- ISA-95 automation pyramid + MOM activity plane (the best precedent for "parallel plane").
- Bruce Silver / BPMN 2.0: readable (Method-and-Style) vs executable models stay separate.
- Temporal Workflow/Activity (the cleanest L2/L3 formalism: definition vs execution).
- LangGraph (node = a function), MCP (tool = name+schema+host) ... L3 binding shapes.
- OpenTelemetry spans (Unset/Ok/Error; rollup is not inherited).
- Anthropic, *Building Effective Agents* (workflow = fixed paths vs agent = runtime choice).
- Process mining / conformance checking + Business Activity Monitoring (L1 monitoring).
