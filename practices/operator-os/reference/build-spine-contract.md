# Build ↔ Spine contract (Atlas's resolution of Boris's Part 4)

Answers `practices/agentic-systems/HANDOFF-system-building-system-2026-06-25.md` Part 4. Defines how
`system_builds` (the four-move build console, `/build`) composes with the operator spine (goals /
projects / tasks) and System State, so nothing is double-written. Ratified by Atlas 2026-06-25.

## The frame

A **build is the execution view of a project whose outcome is a system.** One build ↔ one project
(the "build/iterate system X" project). Two complementary surfaces, one truth:
- **/work (Projects tab = the roadmap)** — the MAP: all work by goal, ordered foundation-first, each
  system-build showing mode (build/iterate/run) + evidenced rung. Answers "what should I work on."
- **/build** — the WORKSHOP: each active build's four-move stage + the one thing it needs now.
  Answers "where is this build and what does it need from me."

## The four decisions

1. **Builds carry `project_id` — yes.** Add `system_builds.project_id` (FK → projects). The project
   is the precise spine join (a system can have several projects over its life; `system_slug` alone is
   ambiguous). A build with no `project_id` is an orphan Atlas flags, exactly like an orphan task. The
   build inherits its goal/vision trace through the project.

2. **The four moves are stages, not tasks — yes.** The project stays coarse in the spine; the
   fine-grained **stage (1–4) + pending ask is authoritative in `system_builds`** and shows on /build.
   Do NOT model the moves as spine tasks. A build project may still carry a granular task checklist,
   but "what's next" for an active build is `pending_ask_text`, not re-derived tasks — one source of
   truth for build progression.

3. **Iterate vs Build threshold (Atlas sets it):** keyed off the system's **evidenced state** +
   whether the change fits the existing contract.
   - System is operating/beta AND the change is bounded (fits the current brief/surface) → a
     **roadmap** change item (iterate). No new build.
   - System is stub/emerging, OR the change is a net-new capability needing its own brief/proof → a
     **build** (re-enter the four moves at Brief with a tiny brief).
   Atlas applies this in triage and in the Planner when a capture_item/intent becomes a project.

4. **Move 4 "register" writes EVIDENCE, never a self-reported status.** This is the load-bearing
   reconciliation with System State (status is computed from evidence, never a label —
   `system-building-method §5`). At Move 4 the build:
   - ensures the `systems` row exists (creates via the build's `system_slug` if new) and sets
     `system_builds.system_slug`;
   - writes/links the build's **activities** (what the system does) and **assets** (workflows,
     functions, scripts, etc. it produced) into canon — that's the evidence;
   - does **NOT** set `systems.status = 'operating'`. System State computes the rung from the
     evidence; a freshly-registered system honestly reads `building`/`beta` until activities are
     ensured+verified and assets reconciled.
   - `assets.reconciled_against_reality` is set by the reconciliation crawler (the System State
     follow-on), not hand-claimed at registration.
   - **roadmap** holds post-build changes (what we intend to do TO the system next); **assets** = the
     implementation; **systems** = the row + computed status. No field is written in two places.
   - The **project closes** when the build's stopping rule ("done when X") is met AND the system
     evidences at its target rung — not merely when "Move 4 ran."

## How Atlas incorporates it (the integration build, when greenlit)

- **Planner (`/work/plan`)**: a `build` move that creates a "build system X" project also **seeds a
  `system_builds` row at stage 1** (Brief) → the build appears on /build. (Boris's lifecycle:
  capture_item → triage → project → build → Move 4 register → systems → project closes.)
- **Roadmap card (`/work` Projects tab)**: for a build-mode project, read `system_builds` and show the
  **stage (1–4) + the pending ask + a link to /build** — so /work and /build reflect one truth.
- **Next-action (systems-first)**: for an active build, route Nick to **/build** (where the ask
  lives), never to manual labor.
- **Vocabulary**: keep surfaces in plain operator language (Stage / "Approve the brief" / "Confirm it
  works"), matching /build; the four "moves" stay in the methodology doc.

## Schema ask for Boris

`alter table system_builds add column project_id uuid references projects(id);` (decision 1). The rest
(Move 4 evidence-write per decision 4, the planner seeding a build row) is Atlas-side and waits on
Nick's go.
