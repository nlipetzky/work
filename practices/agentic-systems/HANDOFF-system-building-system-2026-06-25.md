# Handoff: System-building methodology + the /build console

Date: 2026-06-25. From: Boris (agentic-systems). For: the Atlas session working on how the operator
wants to organize projects and builds.

This is self-contained. The session that produced it built two things and surfaced one question
that is squarely in Atlas's lane (Part 4). Read Parts 1-3 for what exists, Part 4 for what to decide.

---

## TL;DR

1. We wrote ONE canonical methodology for how the operator and an AI build agent build systems
   together: a four-move loop (Brief, Sketch, Proof, Grow). It replaces a methodology that was
   scattered across seven files with three conflicting step-lists.
2. We used that methodology to build its own system, the "system-building system." Its surface is
   a new **/build** tab in projection-UI: a live table of every system being built and the one
   thing each one needs from the operator right now, over real canon data.

Why this matters to Atlas: **a "build" is the execution of a project whose outcome is a working
system.** The four moves are the build's stages. Atlas owns goals/projects/the spine; /build owns
build-state. They have to connect cleanly, and that connection is the open question in Part 4.

---

## Part 1: The problem we were solving

The operator's problem, in his words: building systems with an AI felt like "making it up as we
go." No procedure, no brief, no articulation of inputs or who the expert is or what artifacts are
involved. And no trustworthy surface. He used to work in Airtable and n8n where he could SEE the
data in a table, manipulate it, and watch it flow. Building with an AI, he lost that. He wanted a
repeatable process and a surface he can trust, and he wondered whether the right move is to start
from a UI mockup.

We did deep research (internal: his existing scattered docs; external: how expert teams design
systems before building). The verdict on mockup-first: his instinct was right in spirit, wrong in
form. Design the surface first, yes. But build it as a real thin slice over real data, never a
polished mockup (mockups cause sunk-cost lock-in and premature shipping; Amazon tried mockup-first
and rejected it). The trustworthy surface is earned by real rows moving, not a picture. That is
exactly why Airtable felt trustworthy: it was a live surface over real data from second one.

## Part 2: The methodology (the four moves)

Full doc: `/Users/nplmini/code/work/practices/agentic-systems/reference/system-building-methodology.md`
Research basis + citations: `.../reference/system-building-methodology-basis.md`

The one rule: design the contract and the surface first, then wire one thin slice to real data,
then grow. Not a full spec up front. Not a mockup.

The loop, each move producing one artifact and gating the next:

1. **Brief** (the input contract). A one-page brief: what the system is, who owns it, who the
   domain expert is, the inputs (each with who supplies it, blocking if a required one is missing),
   the outputs, the surface, and "done when X" as a stopping rule. The operator gives a two-line
   ask; the build agent drafts the brief; the operator ratifies. No brief, no build.
2. **Sketch** (the driving surface, low fidelity). A breadboard of what the operator needs to SEE
   and DO, and where every human ask lands. Not a Figma.
3. **Proof / the thin slice** (the first build). The surface wired to real data, end to end,
   smallest version. Real rows from minute one. Code owns the flow; the AI is a called function
   only at produce/judge. Verify on real data before exposing the surface.
4. **Grow** (iterate to autonomous, then register). Add one capability at a time; each round
   removes an operator confirmation; register the system in canon; tear down scratch.

Definition of done (the union of the old competing definitions): surfaced, verified on real data,
registered in canon, scratch torn down, stopping rule met.

Status: the methodology doc is v0 (pilot). It is the intended single entry point but does not yet
supersede the old docs until it has been run once end to end. This build IS that pilot run.

## Part 3: The system-building system + the /build console

We ran the four moves on the system-building system itself (the recursion is deliberate).

- **Brief** and **Sketch** were drafted and ratified. Artifacts:
  `/Users/nplmini/code/work/practices/agentic-systems/artifacts/system-brief-system-building.md`
  `/Users/nplmini/code/work/practices/agentic-systems/artifacts/surface-sketch-system-building.md`
- **Proof (the thin slice)** is built and verified: the **/build** tab in projection-UI, live at
  `http://localhost:4180/build`.

What /build is: a table of every system being built. Each row shows the system name, its current
stage (1 Brief, 2 Sketch, 3 Proof, 4 Grow), the one thing it needs from the operator, links to its
brief and sketch, and a button that approves the current stage and advances the build. The single
human ask per build lives here, on the surface, never in a chat. This is the same pattern already
used elsewhere in canon (the expert-liaison console keeps expert asks out of chat via
`expert_exchanges`; /work keeps protocol state in `protocol_runs`).

The data model. A new canon table holds build state:

```
public.system_builds (canon_engine, project mzzjvoiwughcnmmqzbxv)
  slug              text unique      -- stable id of the build
  name              text
  current_move      int 1..4          -- the stage (1 Brief, 2 Sketch, 3 Proof, 4 Grow)
  status            text              -- in_flight | blocked | done
  pending_ask_type  text              -- ratify_brief | react_sketch | trust_slice | confirm_capability
  pending_ask_text  text              -- the plain sentence shown to the operator
  brief_path        text
  sketch_path       text
  system_slug       text              -- set at Move 4 when the build registers into public.systems
  notes, created_at, updated_at
```

RLS is on (service-role only), matching canon posture. Two real rows are seeded:
- `system-building` at stage 3 (Proof), needing "confirm you trust it" (this row is the build
  watching itself).
- `offer-first-outreach` at stage 1 (Brief), needing the brief approved. This is the next real
  system queued to run through the loop.

How it was built and verified: a new top-level route following the existing /work pattern (server
component prefetches canon, a client surface mutates through one API route, the write goes through
a server-only validated function, never raw client writes). Verified on real data: the page renders
with both real rows; a throwaway build was driven through the full sequence 1 to 2 to 3 to 4 to done
via the same API the button calls, then deleted, leaving the two real rows untouched.

Vocabulary note (important for consistency): the SURFACE uses plain operator language (Stage, not
Move; "Approve the brief" / "Confirm it works", not "Ratify" / "Trust slice"; stage 3 shows as
"Proof"). The METHODOLOGY doc uses its own precise terms (the four "moves"; stage 3 is "the thin
slice / tracer bullet"). They map one to one. Keep the surface plain.

## Part 4: How this connects to projects and goals (the question for Atlas)

This is the part that is Atlas's to resolve. There are now several canon objects in play and they
need a clean relationship so /build and the spine do not duplicate or contradict.

The objects:
- `goals` (top of the spine).
- `projects` (multi-step outcomes; already has `goal_id` to align up and `system_slug` to link to
  a system; `area` as the allocation tag).
- `systems` (the registry of living, operated systems, the owned assets).
- `roadmap` ("what we intend to do TO a system", the change backlog, distinct from process state).
- `system_builds` (NEW: a system being built, its four-move stage, and the pending operator ask).

The model we recommend (for Atlas to ratify or rework):

- **A build is the execution view of a project whose outcome is a system.** One build corresponds
  to one project (the project "build/iterate system X"). `projects.system_slug` already ties a
  project to the system it produces; a build shares that slug.
- **The three modes map to surfaces.** Run = /work (run the system). Build = /build (build a new
  system through the four moves). Iterate = re-entering a build, or a roadmap item against an
  existing system.
- **Lifecycle:** a capture_item is triaged by Atlas into a project ("build system X", goal-aligned)
  -> that project surfaces as a build on /build -> it moves through the four stages -> Move 4
  "register" writes/updates a `systems` row (status operating) -> the project closes.
- **Division of surfaces:** /work answers "what should I work on" (Atlas's spine: goals, projects,
  priorities). /build answers "where is each active build and what does it need from me right now."
  They are complementary, not competing.

Open decisions for Atlas:

1. **Does a build carry a `project_id` (and through it a goal trace)?** Recommendation: yes, add
   `system_builds.project_id`, so the spine and build-state are joined and a build with no project
   is an orphan you can flag (like an orphan task). Without this, /build and the spine drift.
2. **Are the four moves operator "tasks", or a layer below tasks?** Recommendation: the four moves
   are the build's internal stages, NOT spine tasks. Do not duplicate them as tasks in the spine.
   The project stays coarse in the spine; the fine-grained stage + pending ask lives in
   system_builds and shows on /build. Otherwise you maintain the same state in two places.
3. **Iterate vs Build threshold.** Does changing an existing system go through `roadmap` (a change
   item) or spawn a new lightweight build (re-enter at Brief with a tiny brief)? Recommendation:
   small changes = roadmap; a substantial new capability = a build. Atlas sets the threshold.
4. **Where does Move 4 "register" write, and how does it reconcile with `systems`, `roadmap`, and
   `assets` so nothing is double-written?** This needs a definition before the /build "Grow" stage
   is built.

These four are exactly the "how do projects and builds relate" questions. Resolving them defines
how /build and Atlas's spine compose.

## Part 5: Current state and what is next

Live and verified:
- The methodology doc and its basis companion (Part 2 paths).
- The /build tab over real canon data, with plain operator language (Part 3).
- `public.system_builds` table, RLS-locked, seeded with two real builds.

Not yet built (the methodology's "Grow" stage, Move 4 of this build):
- A "start a build" box (operator types a two-line ask, a build is created at stage 1).
- A "done" view of finished builds.
- The "register" write that creates/updates a `systems` row at completion (depends on decision 4).

Other:
- The `offer-first-outreach` build is seeded at stage 1, queued as the next real system to run
  through the loop.
- A background task was spawned for a pre-existing security issue (two canon lookup tables,
  `canon_artifact_types` and `canon_artifact_manifest`, have RLS disabled). Unrelated to this work.
- Nothing here is committed to git yet.

## Part 6: Pointers

- Methodology: `/Users/nplmini/code/work/practices/agentic-systems/reference/system-building-methodology.md`
- Methodology basis: `/Users/nplmini/code/work/practices/agentic-systems/reference/system-building-methodology-basis.md`
- This system's brief: `/Users/nplmini/code/work/practices/agentic-systems/artifacts/system-brief-system-building.md`
- This system's surface sketch: `/Users/nplmini/code/work/practices/agentic-systems/artifacts/surface-sketch-system-building.md`
- /build surface: `/Users/nplmini/code/work/systems/projection-ui/app/build/` (page.tsx, BuildSurface.tsx)
- API: `/Users/nplmini/code/work/systems/projection-ui/app/api/build/resolve/route.ts`
- Read/write/shared libs: `/Users/nplmini/code/work/systems/projection-ui/lib/queries/builds.ts`,
  `.../lib/builds/index.ts`, `.../lib/builds/shared.ts`
- Nav: `/Users/nplmini/code/work/systems/projection-ui/components/Nav.tsx`
- Canon table SQL: `/Users/nplmini/code/work/systems/projection-ui/scripts/canon-system-builds.sql`
- Canon project: `mzzjvoiwughcnmmqzbxv`, table `public.system_builds`
