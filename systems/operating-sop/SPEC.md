# SPEC: operating-sop (run-tracker)   [provisional name — rename freely]

Status: Define artifact (`system-building-method.md` §3.1). At the Define gate, pending
Nick's Go / Kill / Hold / Recycle. Format: the 10-part anatomy (`system-anatomy.md`).
Owner: Boris builds; Atlas (operator-os) operates; Nick gatekeeps.

## Why this exists (the gap)

There are two kinds of tracking, and only one exists today.

- BUILD tracking ... the `/work` Projects tab. A project is a thing to construct; it
  ends when the system is built.
- RUN tracking ... MISSING. The recurring outputs you need to RUN the business, each as
  an ordered checklist of the system-activities that produce it. An SOP that repeats
  every time you run, not a project that ends.

Atlas / `/work` answers "what should I build." It does not answer "where am I on running
CIPO outreach, and what is the next move." That run-state is real and live but scattered
across `/targeting`, `/outreach`, `/prospects`, `/records`, `/expert-liaison`, and
handoff docs. There is no per-output operating view, and nothing shows that a step is
waiting on a system that is not built yet.

## Authoring + operating (the two jobs)

operating-sop is not only a tracker. It does two things:

1. AUTHOR the work definitions, top-down. Given an output/goal, it helps create the
   three-layer definitions (`three-layer-work-model.md`): the SOP (the spine), then the
   workflow spec(s) that produce each stage, then the activities (the bound steps).
   AI-assisted produce -> you approve (the govern-artifacts produce -> gate -> judge
   pattern). These are real artifacts, not rows invented on the fly.
2. OPERATE the known definitions. Because the definitions are KNOWN, running an SOP tracks
   progress through them, shows what is next, and each system is aware of its inherent
   activities.

### The definitions live as context (where each artifact sits)
- Activities + workflows are INHERENT to a system -> they live in that system's folder, as
  its context. Launch into the system and it knows its activities. (Research: L3 bindings
  are a registry owned by their system; workflows are that system's orchestrations.)
- An SOP COMPOSES activities across systems for one output -> it lives with its output/goal
  (e.g. the CIPO outreach SOP under the venture), referencing the systems' known
  activities. (Research: SOPs reference a shared activity registry, many-to-many.)
- operating-sop indexes these into canon so the operate-surface can read and track them.
  The artifacts are the source of truth; canon holds the index + the live run-state.

So every system folder carries its three-layer context (its activities and workflows); an
SOP is the cross-system spine that strings them into an output you run and watch; and the
operate-surface tracks progress because the definitions are already known.

## The law it obeys (method §0)

Deterministic spine; AI a called component (none needed for v1 — this is a join over
existing canon data, the lowest and best rung). Spec before build. Verification is a
gate read from live state, never narrated. Status is computed, never asserted.

---

## 1. Identity
- name: Operating SOP (run-tracker). slug: `operating-sop`.
- purpose (ensures): the work to run the business is DEFINED and OPERATED in three known
  layers ... it authors each output's SOP -> workflow spec(s) -> activities as artifacts,
  then renders the SOP as ONE live checklist (status + next action, build pauses lit) run
  against those known definitions.
- ladders to: goal "run the business without living in chat" -> vision "deterministic
  systems produce the work; Nick confirms" (`project_deterministic_systems_produce_work`).
- lifecycle: emerging (spec, pending ratify). owner: operator-os (Atlas).
- class: deterministic code + DB (rung 1).

## 2. Trigger
- manual: Nick opens `/operate`.
- event: a step's underlying activity completes, or a system's state changes ->
  recompute. v1 is compute-on-read (no cron) ... same pattern as the `/work` roadmap and
  `systemState`.

## 3. AI component
None for v1. The system composes existing canon data deterministically; per §2a a pure
deterministic system is the better outcome. (Future, earned: an AI step that drafts a
new SOP's steps from a stated output, or suggests the next SOP ... rung 2, gated, not v1.)

## 4. Logic (the driver)
Compute-on-read. Given an SOP definition (ordered steps; each names an activity + the
system it runs on + the output it yields + a gate type), join against:
- `canon.activities` ... is the step's activity done / at what automation level?
- `systemState` (the honest registry) ... is the step's system actually operational/beta?
Produce each step's status: done · doing · todo · needs-you (human gate) · blocked-build
(its system is not operational). Pure function over canon; the only writes are step
completion / approval. Code: a projection-ui lib query (model on `lib/queries/roadmap.ts`
+ `systemState.ts`) + the surface. Lives in `systems/operating-sop/src`.

## 5. Data (the three-layer object model)

Grounded in `practices/agentic-systems/reference/three-layer-work-model.md` (deep-research
validated). Three layers, two contracts, one reconciler. Rollup is IMPLEMENTED, not
inherited (a parent can read healthy over a failed child unless you propagate).

- **L1 SOP spine (declarative, loose):** `sops` (an output / procedure), `sop_stages`
  (ordered; required end-state + gate type), `sop_runs` (an instance, e.g. one CIPO
  campaign) with a per-stage conformance state (on-track / deviated / done). Monitored by
  conformance-checking, not hard enforcement.
- **L2 Workflow (orchestration):** `workflows` (the executable that produces a stage's
  output; attribute `control_flow` = fixed | agent-driven; may span engines),
  `workflow_runs` (execution / event history; state open / closed / failed).
- **L3 Activity binding (+ execution):** REUSE `canon.activities` as the shared binding
  registry (add `executor_class` = automated-tool | agent-loop | human-in-the-loop, +
  locator/schema) and `activity_executions` (per run; state unset / ok / error; names the
  node / env / trigger).
- **Contract A (L1|L2):** `sop_stage_workflows`, MANY-TO-MANY (one stage may need several
  workflows; one workflow may serve several SOPs). **Contract B (L2|L3):**
  `workflow_activities`, MANY-TO-MANY (one binding reused across workflows).
- **Reconciler:** a `layer_drift` view ... flags where the layers DISAGREE (a stage marked
  done with no L2 run that produced it; an L2 run reporting success while an L3 execution
  errored). The highest-value artifact; the observability-projection pattern across three
  layers.

Reuse over reinvent: L3 ~= existing `activities` + `system_triggers` / `trigger_routes`;
the L2 run ledger ~= generalize `prep_run_status`. Net-new: the L1 spine, the two
contract tables, the drift view, `executor_class`, the L2 control-flow attribute.

The surface renders L1 as the executable checklist (§ Execution model), with drill-down
to the L2 run and L3 executions behind each step, and drift flags surfaced inline.

## 6. Connections
- upstream `depends_on`: canon-engine, operator-os, and the systems each step runs on
  (revops-engine, signal-targeting / signal-monitoring, outreach-producer, ...).
- downstream: Nick (operator); Atlas (a blocked-build step drops/links a `capture_item`
  so the build lands on the spine).
- external: none new.

## 7. Activities (the run layer it ensures)
1. Maintain the SOP catalog (outputs + ordered steps) — semi (human-defined first).
2. Compute step status from canon (activity done? system operational?) — autonomous, deterministic.
3. Surface active SOP(s): next action + inline approve — autonomous render.
4. Build-gate: a step whose system is not operational -> "blocked: build", link a build item — autonomous.
5. Record completion / approval / output — human, via the surface.

## 8. Guarantee & observability
- guarantees: every recurring output has one live checklist; the next action is always
  visible; a step never silently waits on an unbuilt system (build-gaps are lit).
- verification: deterministic ... status read live from canon (activity verification +
  the `systemState` gate). Done = the activity's gate is green, read live. Never narrated.
- observability: the `/operate` surface; counts from a live query.
- failure: if a system regresses (`systemState` drops), its steps re-block. No silent done.

## 9. Human & authority
- owner: Atlas (operator-os). Built by Boris.
- authority: status computation autonomous; output-completion + approvals are Nick's, via
  the surface; a build-pause routes to Claude Code, then resume in the UI.
- channel: `/operate`. Every human-in-the-loop ask lives here, never in chat
  (`feedback_every_system_interactive_surface`).

## 10. Assets (to build — not built)
- canon migration: `sops` / `sop_steps` / `sop_runs` + RPCs.
- projection-ui surface: `/operate` page + components.
- lib query: compute-on-read status (model on `lib/queries/roadmap.ts`, `systemState.ts`).
- data: the first SOP definitions (below).

---

## Execution model (the core requirement: the surface EXECUTES, not just tracks)

`/operate` is where you RUN each step, not just watch it. Each SOP step is an activity,
and the surface renders the right control from the activity's declared execution
binding ... ONE generic surface, the per-system difference living in DATA, not bespoke UI:

- automatic + has a runner -> `[Run]` invokes the activity's runner via its trigger/route;
  then `[watching]` tails the run ledger; the output appears.
- approve-nick / approve-will -> `[Approve]` + the artifact to review (Will's route to the
  expert-liaison packets; Nick's land on him).
- AI-produced artifact -> `[Produce]` runs the govern-artifacts produce -> gate -> judge
  loop; you approve the result.
- needs-build -> `[Build]` routes to Claude Code (the step is greyed until its system is
  operational), linked to the build item.
- manual -> `[Mark done]` + note.

When a step's output is produced and its activity's verification gate is green (read
live), the step flips done and the next control lights up.

### Why this is not simple (the real engineering)
1. Most activities have no UI-invokable execution binding yet. The runners are CLI `.mjs`
   scripts (read `.env`, call Anthropic directly) ... not reachable from a web surface.
   Executing-from-the-UI needs each runner exposed behind a uniform trigger (Inngest
   function / n8n webhook / edge function / job), not a local CLI. **That invocation
   layer is the hard part, not the tab.**
2. A general run/output ledger to watch async runs (enrichment takes minutes, spends
   provider credits). `prep_run_status` exists for revops plays; this generalizes it.
3. Heterogeneity: script vs n8n vs approval vs AI-producer. The surface stays generic
   only if each activity carries an `execution` descriptor (gate + runner type + locator
   + run-ledger). That is a canon schema addition on `activities`.

### What it composes (not built from scratch)
- `canon.activities` (the steps) + a new `execution` descriptor per activity.
- `canon.system_triggers` + `trigger_routes` (the invocation binding ... partly built).
- a runs/output ledger (generalize `prep_run_status`).
- `govern-artifacts` produce -> gate -> judge (the AI-producer steps).
- `systemState` (operational? -> the build-gate).

So `/operate` is the composition layer over machinery that mostly exists; the missing
pieces are the per-activity execution binding and a uniform invocation endpoint.

## The first SOP (grounds the spec): "Launch CIPO outreach"

Hand-defined steps with their REAL status today ... this is what `/operate` would show:

1. Discover companies (signal) — DONE. 197 in `canon.prospects` via the signal-watch cron.
2. Land companies in the RevOps engine (where Records reads) — BLOCKED: BUILD. No wired
   flow `canon.prospects` -> `revops-engine.companies`. (This is the gap that hid the 197.)
3. Find contacts at each company — TODO (needs the engine's contact discovery).
4. Enrich each contact (verified email + info) — BLOCKED: BUILD. `enrich-prospects` is a
   gated stub; needs Deepline BYO keys + execution.
5. Qualify (list-qualification) — TODO, runs on revops-engine.
6. Surface in Records, displayable various ways — depends on 2-5.
7. Approve targeting artifacts — NEEDS YOU (Nick; not Will).
8. Approve offer + copy — DONE (Will approved; copy v0).
9. Send outreach (System M) — depends on 5-8.

Opening this SOP answers "what is next" instantly: you are stuck at step 2, a build gap.
That is the whole value.

## Build approach (smallest slice — method §3, operating-protocol)

Slice 1: one SOP ("Launch CIPO outreach"), steps hand-defined as data, status computed
live from `canon.activities` + `systemState`, rendered at `/operate` with the next action
+ inline approve + "blocked: build" markers linking to the build item. No SOP-authoring
UI yet. Prove it answers "where am I / what is next" for CIPO. Then generalize: more SOPs,
then (earned) an authoring step.

## The two trackers, stated (so they never merge)
- `/work` Projects = BUILD (systems under construction; ends).
- `/operate` SOPs = RUN (recurring outputs; repeats). A blocked-build step is the bridge:
  it links to a build item on the spine; you build in Claude Code, deploy, resume here.

## Non-goals (v1)
- Not an SOP-authoring UI (steps are data first).
- Not the daily-protocol-runner (that is Atlas's daily ritual; this is per-output).
- No AI driver (deterministic join; AI only later, earned).
