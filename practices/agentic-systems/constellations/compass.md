---
constellation: Compass
slug: compass
bound_base: apppQjlZiktpbO4aX
bound_row: tblCCPj7Sm9md86y3 / recoXsrc9H3kPQ4GX
binding: bidirectional — this file is the authority on what Compass is; the Constellations row points here via Context Path, this points back. Change one, update the other in the same turn.
last_synced: 2026-06-05
---

# Compass — Constellation

Definitive artifact for the Compass constellation. If anything else disagrees with this file about
what Compass is, this file wins. Constellation #2 of the eight.

## What Compass is

Compass is how the business chooses its direction and keeps choosing it. It takes everything Canon
knows about the current state and everything Signal finds about outside opportunity, weighs it against
the business's intent, and commits to what to do next: the priorities, the allocation of time and
money and attention, the sequence of moves. It is the difference between a business that is busy and
one that is going somewhere.

In an AI-run company, direction cannot live only in the founder's head. The agents and operators doing
the work need to know not just what to do but why it is the right thing to do now, so they can act
coherently toward the same destination instead of optimizing locally. Compass makes the decision
explicit and current for the whole business. Without it, effort scatters: priorities are whatever was
loudest this morning, work happens that nobody can tie to a goal, and the business drifts on
yesterday's plan because no one noticed reality moved.

The capability is not a roadmap document. A plan written once and left to rot is the opposite of
Compass. Compass is two hard things: converging messy, conflicting inputs into a committed decision
(not a menu of options), and re-deciding as reality changes, so "what we do next" is always current
rather than a snapshot from when the plan was made.

Boundary: Compass decides. It does not gather the knowledge it decides on (Canon), find the
opportunities it weighs (Signal), or execute the decision (Forge, Voice, Pulse, Garden). It turns
"what is" and "what's possible" into "what we do."

## What good looks like

We know Compass is delivering value when:
- Anyone, agent or human, can see not just the current priorities but why they are the priorities,
  traced to intent.
- When a material thing changes (a deal dies, an opportunity lands, a bet fails), the plan visibly
  updates and the old direction is retired, fast.
- Work across the business traces back to a decided objective; little effort is happening that nobody
  can explain.
- A decision gets made once and stays made until reality changes it, rather than being re-litigated
  from scratch every week.
- "What are we doing next, and why" gets the same answer whether you ask Nick, an operator, or an
  agent.

You feel Compass's absence when priorities reshuffle based on whoever spoke last, when effort goes to
things nobody can tie to a goal, when the plan on paper and the work actually happening are different
things, or when the same decision keeps getting remade.

## Systems (operational — live status in the base)

Three systems sharing one substrate: the business's decision state — objectives, criteria, priorities,
the committed plan, and the tracking against it. Today that substrate is **scattered** (operator-os
Work base, the registry Roadmap table, ROADMAP.md files, the studio thesis), not one store. The
scattering is itself a weakness, unlike Canon's single corpus.

| System | Class | Coverage | Produces which "good" |
|---|---|---|---|
| Compass Intent | Supporting | Partial | priorities traceable to intent; the shared answer to "why" |
| Compass Planning | Core | Partial | a committed plan; work traces to objectives; decided once |
| Compass Course-Correction | Core | Missing | plan updates when reality changes; old direction retired |

Live coverage, emit contracts, and gap tracking live on the System rows. **Headline gap: Compass
Course-Correction (Missing, Core)** — Compass can decide once but does not keep the decision current,
so "what's next" silently goes stale. It is the present-tense in "decides," and Compass's analog of
Canon's Currency gap. Secondary: Planning is only Partial (largely Nick's head plus scattered roadmaps).

## Dependencies

- **Compass depends on Canon** (consumes `canon-context-service` for current reality) and **Signal**
  (external opportunity — dependency pending Signal's decomposition).
- **Consumed by** the executing constellations: Forge builds what Compass decides, Voice acts on it,
  Garden tends what it prioritizes.

## Open questions

1. **operator-os overlap.** operator-os holds Weekly Intent, Roadmap, and Projects/Tasks — Compass
   Intent + Planning material. Resolve whether operator-os decomposes into Compass systems or stays an
   operator-facing surface that *consumes* Compass.
2. **The scattered substrate.** Part of building Planning and Course-Correction is consolidating
   objectives/priorities/plan into one substrate, the way Canon has its corpus. Decide where it lives.
3. **Autonomy boundary.** How much does Compass *decide* versus *stage a decision for Nick to commit*?
   Set the line.
