# System Brief: System-building system

(Move 1 artifact. Drafted by the build agent, awaiting operator ratification.)

```
SYSTEM BRIEF
System:    System-building system. Runs the four-move methodology to build any system, and
           surfaces every in-flight build and its one pending human ask on the /build console.
Why now:   We just wrote the methodology. Without a system and a surface, the four moves stay a
           doc nobody runs and human asks keep getting lost in chat. Building itself is the
           methodology's first real test.
Owner:     the build agent (Boris in agentic-systems).
Expert:    none required. This is internal architecture, which is the build agent's call per
           studio-architecture-conventions.
Inputs:
  - a two-line build ask            (from the operator)                          [required]
  - the methodology (the four moves)(from system-building-methodology.md)        [required]
  - canon systems/activities/goals  (from canon_engine via canonDb)              [required]
Outputs:
  - per build: a brief, a surface sketch, and a registered system (canon systems row)
  - the /build console: the live surface of in-flight builds and their pending asks
Surface:   the /build console. The operator sees every system being built, which of the four
           moves it is in, and the one pending ask (ratify brief / react to sketch / trust the
           slice / confirm a capability), and acts right there.
Done when: the operator can see a real build move through the four moves on /build and act on
           its pending ask ON THE SURFACE, not in chat.
Appetite:  first slice = ONE real build visible end to end on /build with its pending ask
           actionable. Seed it with this system itself, then the offer-first outreach system.
Architecture intent (build agent's call): workflow. A deterministic driver runs the moves; the
           AI is a called function only at produce/judge (drafting a brief or sketch, judging a
           slice against its brief). The /build console is a Next.js surface over canon following
           the /work pattern (server prefetch + client mutation through a governed /api/build/*
           RPC). The first slice carries no async/Inngest; a build is a real row, advanced by a
           surface action.
```
