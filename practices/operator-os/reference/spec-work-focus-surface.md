# Spec: Work Focus Surface (for Boris / agentic-systems)

Status: spec, 2026-06-22. Author: Atlas (operator-os), at Nick's direction. Build owner: Boris.
The `/work` Focus surface (projection-ui). Implements methodology §5 (task initiation, one next
action), §3a (leverage axis), §3b (systems and the activities they repeat), §9 (trust via admitting
gaps), §10 (subtract-not-add).

## The problem (Nick's critique, 2026-06-22)

The current Focus surface "adds very little value... it's not representing everything. The active
projects are just listed. I don't know what activities need to be there. I need this thing to tell
me what to do next, and how everything is going toward the vision of autonomous systems that
accomplish the tasks."

Diagnosis: the surface is a **database mirror, not an executive function**. It lists projects by
name, surfaces the *due-date-soonest* task as "your one next action" (today it picked "Send Will's
daily email" — a recurring chore that by §3b should be a system, not a task), shows no reasoning, no
ladder to the goal/vision, no leverage, no drill-down, and no signal of what it is missing. So Nick
correctly distrusts it.

## What it must do

- **R1 — Reasoned one next action.** Rank by Importance × Urgency × **leverage** (§3a), not by due
  date. Show *why* this is the lever and its rate-verdict. A recurring activity (e.g. "send Will's
  daily email") must NOT surface as the top action — it is an Activity that should be run by a
  System; flag it for automation instead of presenting it as Nick's #1.
- **R2 — The ladder is visible.** For the current action, render the line up: Activity ->
  System/Project -> Goal -> Vision. "Why am I doing this" is answered on the glass, not inferred.
- **R3 — Drill down to activities.** Projects/systems expand to their live activities (the §3b run
  layer), not a flat list of names. Build Projects show their tasks; running Systems show the
  activities they repeat and whether those run automatically or need Nick.
- **R4 — Admit what's missing.** Show the un-triaged inbox count (from the triage system) and any
  obligations/systems not yet captured. Trust comes from the surface saying "here is what I have NOT
  yet processed," not from pretending to be complete (§9). This is what fixes "I know it's not
  representing everything."
- **R5 — Show movement toward the vision.** The vision is autonomous systems that accomplish the
  tasks. Surface the autonomy metric: how many repeating activities now run inside systems vs. still
  sit on Nick's plate (the wealth test, visualized). This is the progress that matters — it should
  sit where the static Area-allocation bar is today, or beside it.
- **R6 — Actions actually work.** Start opens the first-5-minutes / the relevant surface; rows drill
  down. (The dead-button gap from the 2026-06-22 observation.)

## Coupling / sequencing

This is not a cosmetic fix. The surface can only get this smart once: (a) the **triage system** feeds
it the full obligation set (R1, R4); (b) the **systems/activities run layer** exists so activities
can be modeled and shown (R2, R3, R5); and (c) Atlas's reasoning is **renderable** into the card,
not recomputed by the UI (R1, R2). Co-build with the inbox-triage system and the run layer; this
surface is their front door.

## Non-goals

- Not a denser dashboard. Subtract, not add (§10): one action, its why, its ladder, and an honest
  gap count. Resist feature-creep into a wall of widgets — the dense "everything" view is the enemy
  of initiation.
- Not a passive table. If it cannot say *why* the top action is the top action, it is not done.
