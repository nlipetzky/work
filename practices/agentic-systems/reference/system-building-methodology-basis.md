# System-Building Methodology: Basis and Consolidation

Companion to `system-building-methodology.md`. You do not need this to run the loop. Read it for
the evidence behind the procedure, and for the plan to fold the older scattered docs in once the
pilot proves the methodology.

## Why the loop looks the way it does

The procedure is the convergent answer across the expert methods for getting a system designed
right before building. They agree on three things: write a small brief first, design at low
fidelity, and prove one thin slice over real data before fleshing anything out.

- **Shape Up (Basecamp).** Shape work to "rough, solved, bounded" before building; the artifact
  is a one-page pitch. Pre-build design stays low fidelity (breadboards and fat-marker sketches,
  not wireframes), because high fidelity over-specifies, kills creative room, and makes work
  harder to estimate by hiding complexity. "Done" is a stopping rule plus a fixed appetite, not a
  feature checklist. https://basecamp.com/shapeup/1.1-chapter-02 ,
  https://basecamp.com/shapeup/1.3-chapter-04
- **Working Backwards (Amazon).** Write the brief (a PR plus FAQ) before building. The FAQ forces
  the team to answer which problems to solve, a data-based assessment, risks, and success and
  failure conditions. Amazon explicitly tried mockups and long product-description docs first and
  rejected them, because those tools did not force deep enough thinking about the customer.
- **Tracer bullet / walking skeleton (Pragmatic Programmer).** Build one thin functional line end
  to end, through every layer (surface to logic to data), before any feature is fleshed out, so
  the system is connected and verifiable from the start. It is the deliberate alternative to
  up-front full specification and the recommended response to vague requirements. The early lean
  codebase is when requirements are most volatile and change is cheapest. Tracer code is
  lean-but-complete production code that becomes the skeleton, not a throwaway prototype.
  https://www.artima.com/articles/tracer-bullets-and-prototypes
- **Spec Kit (GitHub).** Intent before stack: Specify (what and why, not the tech), then Plan
  (stack, architecture), then Tasks, then Implement. The spec is the source of truth the human
  steers from while the agent writes the bulk.
  https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
- **Counterweight (keep the brief small).** Heavy verbose up-front specs are themselves
  counterproductive; they amplify review overload and hallucination. Control comes from small
  iterative steps, not large up-front design.
  https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html

## The mockup-first verdict

The instinct "let me see the interface that drives the system first" is correct in spirit and
wrong in form, and the correction is the whole game.

- **Right:** design the surface first. The surface is a first-class part of the system.
- **Wrong:** build a polished mockup first. Build a real thin slice over real data instead.

Why a high-fidelity mockup is a trap, specifically:
- **Sunk cost.** People resist changing a design they invested in, even when it tests badly.
- **Premature shipping.** A finished-looking screen gets treated as ready before the backend exists.
- **It does not force real thinking.** Primary-source evidence: Amazon tried it and switched to
  the written brief.

For data-pipeline and internal-tool systems the trustworthy data surface (an admin or
observability view where you see and manipulate flowing data) is best treated as a first-class
functional slice. Building it first is sound when done as a tracer bullet, not a static mockup:
the tracer bullet IS an end-to-end data surface, satisfying observability-first and
walking-skeleton at once. Interface-first is correct only at low fidelity as a functional
breadboard, and a trap at high fidelity.

(All claims above were adversarially verified in a multi-source research pass, mostly at high
confidence.)

## Consolidation plan (post-pilot)

The methodology was previously written several times across this directory with conflicting
step-lists and no single entry point, which is why every build re-derived its own shape. After
the pilot proves the loop, do a full inventory of the methodology docs in
`practices/agentic-systems/reference/` and `practices/operator-os/reference/` (there are more
than first counted: at minimum `operating-protocol.md`, `methodology.md`, `system-building-method.md`,
`build-operating-system.md`, `architecture-notes.md`, and the operator-os
`system-building-methodology-draft.md`), then for each: fold its still-true content into the
methodology doc and delete it, or keep it as a clearly separate concern.

Known dispositions:
- `operating-protocol.md`: its 5-step SOP and five build rules become the loop. ABSORB.
- `system-building-methodology-draft.md` (operator-os): the "why," the reliability and automation
  dials, the architecture ladder, the done-invariants. ABSORB (the methodology doc is its
  promotion).
- `build-operating-system.md`: teardown and registration done-gates. ABSORB into Definition of done.
- `architecture-notes.md`: "lock artifact schemas first," "automate only what proved manually."
  ABSORB as rules.
- `skills/system-building/SKILL.md`: the executable walk-through. REPOINT it at the methodology
  doc as its single source of truth (currently it points at the operator-os draft). This is the
  first thing the pilot must correct.
- `HANDOFF-outreach-system-build-2026-06-25.md`: the worked instance of the input contract plus
  the deterministic produce-and-judge machine plus its own surface. The methodology generalizes
  it; the handoff stays as the pilot's build log.

Keep separate (orthogonal, do not merge):
- `operating-doctrine.md`: session-decision rules.
- `studio-architecture-conventions.md`: placement canon.
- `system-anatomy.md`: the standardized view of a built system (composes with the loop, not part of it).
