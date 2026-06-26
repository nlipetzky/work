# System-Building Methodology

> **STATUS: v0 (pilot).** The single procedure for building a system together, in any engagement
> folder, so we stop making it up as we go. It is the *intended* one entry point, but it is not
> wired as one yet: the `system-building` skill still routes through the old draft, and the other
> methodology docs in this directory stay live until this is proven. The pilot's first job is to
> repoint that skill here and fold the old docs in (see the basis companion). Run it once, end to
> end, on a real build, then it earns canonical status. Until then, this is the proposed replacement.

## Start here

When you sit down to build a system: give the build agent a two-line ask ("build a system that
does Y; I need to see Z"). The build agent runs the four moves below, starting by drafting your
brief. You ratify; you do not author.

- **operator** = the human who owns the outcome.
- **build agent** = the practice persona that owns the build (Boris in agentic-systems; the
  owning persona in another folder).

## The one rule

Design the contract and the surface first, then wire one thin slice to real data, then grow.
Not a full spec up front (heavy specs bury you and invite hallucination). Not a mockup (a
polished screen locks you in and gets shipped before the backend exists). Low-fidelity sketch
to think, real rows on a real surface to build.

## The loop: four moves

Each move produces one artifact and gates the next. You cannot start a move until the prior
artifact exists.

### Move 1: Brief (the input contract)

**Produces:** a one-page brief at `<engagement>/artifacts/system-brief-<slug>.md`.
**Rule:** no brief, no build. A required input that is missing or unapproved BLOCKS the build.
Name the gap, never fake it.
**Authoring:** operator gives the two-line ask, build agent drafts, operator ratifies or corrects.

```
SYSTEM BRIEF
System:    <name> (one line: what it is)
Why now:   <1-2 lines: the problem, the trigger>
Owner:     <role that owns it running>
Expert:    <which domain expert certifies what; route via the engagement liaison. Blank = none>
Inputs:    (each: who supplies it, required?)
  - <input>  (from <who/what>)  [required | optional]
Outputs:
  - <artifact>  (used by <whom>)
Surface:   <one line: who looks at it, what they do there; expanded in Move 2>
Done when: <observable condition>.
Appetite:  <default: one build slice / one session; widen only deliberately>
Architecture intent (build agent's call, not the operator's):
           lowest rung that holds = <code | one AI call | workflow | agent>
```

Worked example (role-based, so it reads cleanly from any folder):

```
SYSTEM BRIEF (example)
System:    Offer-first outreach (turns a segment + an offer doctrine into ready cold copy)
Why now:   Outreach is improvised per play; we want one machine that produces it.
Owner:     the outreach operator
Expert:    legal/IP expert certifies claims in the offer ladder; marketing expert certifies
           copy and positioning. Route both via the engagement liaison.
Inputs:
  - offer doctrine        (from the offer-construction doctrine source)   [required]
  - qualified contacts    (from the revops engine)                        [required]
  - offer ladder, ratified(from the experts)                             [required]
  - voice/proof limits    (from prior artifacts)                          [required]
Outputs:
  - cold copy + a line-by-line source map  (used by voice-delivery)
Surface:   the outreach console: operator sees each produced sequence, its source map, and the
           lines flagged for an expert call; approves or routes.
Done when: a produced sequence passes the judge against the doctrine and every flagged line is
           resolved.
Appetite:  first slice = one segment, one sequence.
Architecture intent: workflow (deterministic pipeline; AI called only at produce + judge).
```

### Move 2: Surface sketch (low fidelity)

**Produces:** a breadboard at `<engagement>/artifacts/surface-sketch-<slug>.md` (text and bullets,
no visual design).
**Rule:** low fidelity only. No Figma, no pixels. It is a thinking tool, cheap to change, not the
thing we build.

```
SURFACE SKETCH
Operator: <who sits in front of it>
Places (views / tabs):
  - <place>
      Shows: <the data and fields the operator needs to SEE>
      Does:  <the actions the operator can take here>
      Asks land here: <approvals / drafts / gaps / decisions the system needs from a human>
```

The "asks land here" line is load-bearing: every human-in-the-loop ask lives on this surface,
never buried in a chat. A system without its own interactive surface is not done.

### Move 3: Real thin slice (the first build)

**Produces:** the surface wired to real data, end to end, the smallest version. Exists once the
operator has seen real rows move end to end on the surface.
This is the tracer bullet: the narrowest path that proves the whole thing connects, with real
rows from minute one. It is exactly what a mockup cannot give you, and why working in a live
table felt trustworthy: real data moving, not a picture.
**Build style:** code owns the control flow; the AI is a called function, used only at produce
and judge steps (produce, a judge checks against the brief, then refine). Verify on real data,
against the brief, before exposing the surface. Filled is not trusted; verify, then report.

### Move 4: Grow and register

**Produces:** the system, recorded and approaching autonomous.
- Add one capability at a time, against the brief. If the shape genuinely changed, re-open the brief.
- Each iteration removes one operator confirmation. More autonomy is earned by a passing
  verification, lost automatically when verification fails.
- Register it where this engagement keeps its registry (see Local bindings).
- Tear down scratch. A build is not done while throwaway files survive.

## Definition of done

All five hold:

1. **Surfaced** ... the operator sees real data and can take every required action on the
   system's own surface.
2. **Verified** ... proven on real data, against the brief, not on filled-but-unchecked output.
3. **Registered** ... recorded in the engagement's registry, traced to a goal, with an owner.
4. **Torn down** ... scratch and throwaway artifacts are gone.
5. **Stopping rule met** ... the brief's "done when X" is observably true.

This is the union of the old competing definitions: surfaced (from operating-protocol), verified
and traced (from the methodology draft), registered and torn-down (from build-operating-system),
stopping rule (from Shape Up).

## How we run this when we sit down

1. Operator: two-line ask.
2. Build agent drafts the brief; operator ratifies. (Move 1)
3. Build agent drafts the surface sketch; operator reacts. (Move 2)
4. Build agent builds the real thin slice; shows the operator real rows. (Move 3)
5. Operator looks at real data; trusts it or flags what is wrong.
6. Grow one capability at a time, register, tear down. (Move 4)

The operator's whole job across this: ratify the brief, react to the surface, look at real data.
Not author specs, not write briefs, not read walls of documentation.

## Local bindings (per engagement)

The loop is engagement-agnostic. The specifics below are agentic-systems' local bindings; another
folder swaps in its own and the loop is unchanged:

- **Registry (Move 4 + Done #3):** in agentic-systems, canon. Write a `systems` row, set
  `goal_id` to the goal it ladders to, set `owner`, and write the `activity` rows it ensures
  (the `systems`, `goal_id`, `activities`, and `goals` schema is live today). A folder with no
  canon Postgres records the system as a one-line entry in its own index instead.
- **Expert routing (the brief's Expert line):** the engagement's liaison (Hermes in
  agentic-systems).
- **System anatomy:** `system-anatomy.md` (the standardized view of a *built* system) composes
  with this doc. It describes the shape of the thing Move 4 registers; it is not part of the
  build procedure.
- **Build persona / owner:** Boris (agentic-systems).

## Basis and consolidation

The research this rests on (Shape Up, Working Backwards, tracer bullet, Spec Kit, the
mockup-first verdict, with sources) and the plan to fold the older methodology docs in live in
the companion: `system-building-methodology-basis.md`. Read it once if you want the why or the
consolidation plan. You do not need it to run the loop.
