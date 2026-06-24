# Operating Protocol (how we work, how systems get made)

The standing SOP for Nick + Boris. Aligned 2026-06-24. Keep it short; if it grows
past one page it has overengineered itself.

## Two surfaces, two modes

- **Projection UI = where you run the business.** Start work, watch it, confirm it,
  see the tangible asset. This is the default interface.
- **Claude Code chat = where we design a NEW system, or repair a broken one.** The
  exception, not the default. Not for doing routine work.

**The rule:** if a system already exists for the work, do it in the Projection UI.
Come to chat only to create a system that doesn't exist yet, or fix one that broke.
Today almost everything is chat because almost nothing is a system yet. Every system
we build moves a category of work out of chat and into the UI.

## What a business is

A collection of systems, and activities within those systems, that produce outputs
and value. We create a system, then evolve it toward fully autonomous (each
iteration needs less human confirmation). The Projection UI is the cockpit over all
of it.

## Creating a system (the SOP)

1. **Frame** — agree what it is and its smallest first slice. One exchange. The
   anti-balloon gate.
2. **Define + register** — its anatomy (see `system-anatomy.md`) and emit contract,
   into the registry (`canon_engine.public.systems`).
3. **Build the smallest deterministic slice** — the workflow plus how its inputs are
   sourced. Code owns the process; AI is a called function, not the driver.
4. **Surface it in the Projection UI** — so you can see and operate it. A system that
   isn't on the surface isn't done.
5. **Iterate toward autonomous** — each round removes a confirmation step.

(This is the existing `system-building-method.md`, run for real, with Frame as a
hard gate and UI-surfacing as a required step.)

## The five build rules

1. **Frame before build.** Before touching anything, Boris states in ~5 lines: what
   this actually is, its honest size (name the iceberg), where it lives, what's
   Boris's call vs Nick's, and the smallest first slice. Nick approves or corrects.
2. **Smallest slice first.** Build the thinnest thing that works and is verifiable.
   Ask for more after.
3. **Re-frame on growth.** If it grows mid-build, stop: "this got bigger: X.
   Continue, cut, or park?" Never silent expansion.
4. **Decision lanes.** Boris decides architecture + conventions (pattern-match what
   exists first; see `studio-architecture-conventions.md`). Nick decides business
   reality. No inversion.
5. **Verify, then report.** No "done" without evidence.

## Direction

Every system becomes operable from the Projection UI and evolves toward autonomous.
As that happens, chat shrinks to design and repair. That is the whole point.
