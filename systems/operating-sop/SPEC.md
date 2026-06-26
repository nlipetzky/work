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

## The law it obeys (method §0)

Deterministic spine; AI a called component (none needed for v1 — this is a join over
existing canon data, the lowest and best rung). Spec before build. Verification is a
gate read from live state, never narrated. Status is computed, never asserted.

---

## 1. Identity
- name: Operating SOP (run-tracker). slug: `operating-sop`.
- purpose (ensures): every recurring business output has ONE live checklist of the
  system-activities that produce it, with status + the next action, and any step whose
  system is not operational is shown as a build pause rather than a silent wait.
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

## 5. Data
- reads: `canon.activities`, `canon.systems` + `systemState`, the SOP/step/run tables,
  and `capture_items` (build items linked to blocked steps).
- writes: SOP step status / output-produced / approval, per run.
- new schema (canon migration, service-role RPCs): `sops` (an output + its ordered
  step-list), `sop_steps` (step -> `activity_id`, `system_slug`, output, `gate_type`),
  `sop_runs` (an instance, e.g. one CIPO campaign) + per-step run status. Reuses
  activities; does not duplicate them.
- provenance: which run, who completed/approved, link to the build item if blocked.

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
