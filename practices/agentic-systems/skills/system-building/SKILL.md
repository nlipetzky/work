---
name: system-building
description: Use this skill when building or defining a NEW system in the operator OS, deciding what activities a system must ensure, or making the shape calls that come with that. Triggers include "build a system for X," "define the X system," "is this a system or just a task," "where does this work ladder up," "what activities does this system need," "should this be code or a workflow or an agent," "what's AI's role here vs the database's role," "how should we automate X," or any request that starts a new durable capability rather than running an existing one. Walks the locked system-building methodology's build lifecycle so every system comes out the same shape and registers correctly into canon: trace up to a goal + repeating activity, produce a complete activity card per activity (automation level, architecture rung, AI's role, context role, channel, verification, owner), assign the owner, prove it manually, register into the `systems`/`activities` tables, then surface + feedback. Do NOT use for: running an existing system's activity (that's the system, not this); building a one-off Project or a chore Task (no repeating-activity guarantee = not a system); deciding how an expert is contacted or how their input is captured (route to Hermes / expert-liaison); writing the actual migration DDL or surface code (this produces the spec + cards; Boris builds from them).
---

# System Building

Status: DRAFT (refine after first real decomposition)

Walks an operator through the build lifecycle from the locked methodology so every new system comes out the same shape and registers into canon the same way. The source of truth is the methodology, not this skill:

`/Users/nplmini/code/work/practices/operator-os/reference/system-building-methodology-draft.md`

Read it when you need the *why* in depth. This skill is the *walk-through*: it forces the steps in order, in the right hands, and produces a complete activity card per activity instead of a vague task list. It does not restate the methodology; it points to it.

The architecture canon the shape-calls rest on is indexed in ctx under these source labels (methodology §8). Pull from them, do not duplicate them:
- `anthropic-building-effective-agents` ... workflows vs agents, simplest-first.
- `anthropic-context-engineering` ... the database/context role; write / select / compress / isolate; context rot.
- `12-factor-agents` ... own your control flow, tools as structured outputs, contact humans with tool calls.
- `cognition-dont-build-multi-agents` ... single-agent default, writes single-threaded.

Query them with `ctx_search` when an architecture or context-role call is non-obvious.

## The one idea that makes this not-busywork

A system does not necessarily *do* the work. It *guarantees* the work happens. Reliability (the guarantee) and automation (the leverage) are two separate dials. You ship the guarantee first, with every activity still manual if need be, then automate inward without rebuilding. So the unit of output here is not "a tool that runs" ... it is, per activity, a complete **activity card** that names how the guarantee is held today and where it is headed. A vague task ("send the daily email") is the failure mode. An activity card is the fix.

## When this skill runs

Use it the moment the work is a *new durable capability*, not a one-off. Three gates decide that (methodology §1). Fail any one and stop ... it is not a system:

- It **ladders to a goal.** If you can't name the goal, it's a flag ("why is this running"), not a system.
- It **ensures repeating activities.** One-time = a Project. A chore = a Task. Neither is a system.
- It **passes the wealth test.** Over time it moves work off Nick's plate toward asset.

If it fails a gate, say so and route it (Project, Task, or flag). Do not force it into systemhood.

## The lifecycle ... force these in order

Each step says why it matters and who owns it. Do not skip steps 1, 3, or 4 ... those are the ones that get skipped, and skipping them is how the OS drifts.

### 1. Trace up (Atlas's call; you facilitate)

Name two things: **which goal** does this ensure, and **which repeating activity**. If it can't ladder to both, stop. This is the cheapest place to kill a non-system. Vision -> Goal -> System -> Activity is the spine (§3); a system with no goal is surfaced as a flag, never defaulted into existence.

Output: a one-line trace. `Goal: <id/name> -> System: <name> -> ensures: <repeating activity/activities>`.

### 2. Name the activities and their shape (the core of the skill)

List the activities the system must ensure. For EACH one, fill the activity card below ... completely. An activity with blank fields is not specified; do not let it through.

Run the architecture call (§2a) through the **two gates first**, then the **ladder**:

- **Gate A ... is this even an AI problem?** Optimization, scheduling, arithmetic, exact values, anything with a checkable right answer -> deterministic code wins on reliability and cost. Reserve models for intent, language, judgment, open-ended steps. AI is a *called function* inside deterministic control flow, not the driver.
- **Gate B ... single before multi.** If it reaches the agent rung, default to one agent. Keep *writes* single-threaded. Parallel agents only for read-heavy work (research, search) whose outputs need no reconciliation.

Then place the automated part on the ladder, lowest rung that holds the guarantee:

1. **`code`** ... deterministic code + the database. No model. The *target* for most activities, not a lesser outcome.
2. **`single_call`** ... one augmented LLM call (model + retrieval / tools / memory). Often enough.
3. **`workflow`** ... predefined code paths orchestrating model calls (prompt-chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer).
4. **`agent`** ... model directs its own steps in a loop with environment feedback. Only for open-ended work where steps can't be predicted.

Autonomous is not the same as agentic. The top of the automation spectrum is *the human off the loop*, most often best reached as boring `code` (rung 1), not an agent. A cron + SQL that climbs to autonomous is the best outcome, not a downgrade.

#### Activity card template (copy one per activity)

```
Activity: <verb-phrase, the actual thing that must happen>
  Ensures (for system):     <which guarantee this activity is part of>
  Current automation level: manual | semi | fully | autonomous
  Target automation level:  manual | semi | fully | autonomous
  Architecture rung:        code | single_call | workflow | agent   (§2a; lowest that holds)
    Gate A (AI problem?):   yes -> model needed for <named judgment> | no -> deterministic, rung = code
    Gate B (single?):       single | parallel-reads-only (writes single-threaded)
  AI's role:                <the specific judgment the model provides, stated narrowly>
                            <if you cannot name it -> "none (deterministic)" and rung = code>
  Database / context role:  <what the model sees + who curates it: write / select / compress / isolate>
                            <canon is not storage; it is the context window. Name what context, kept lean how.>
  Channel:                  surface | email | queue | ping   (REQUIRED unless current level = autonomous)
                            <how the human part is PRESENTED. The human acts on what's presented, never "remembers."> 
  Verification:             <how "ensured" is checked. Deterministic check (schema validator, SQL count,
                            math) beats an LLM-eval wherever the output is checkable. For judgment parts:
                            a binary pass/fail eval with a written reason, run continuously on real input.>
  Owner:                    <which practice builds/owns it>   (see step 3)
```

Rules for the card:
- If **AI's role** is blank or you wrote a vague verb, the activity is deterministic. Set rung to `code`.
- **Channel is null iff `current_automation_level = autonomous`.** Anything not-yet-autonomous is a presented activity and MUST carry a channel. A manual activity with no channel is a "remember to," which is banned.
- **Verification is not a build-time checkmark.** For any activity with a model in it, "ensured" is a monitored property ... non-deterministic systems "work Monday, fail Wednesday." Name the check and it runs continuously.
- **Database/context role is mandatory even when there's no AI.** Deterministic activities still read and write canon; name what they touch.

### 3. Assign the owner (UNSKIPPABLE)

Which practice builds it: Boris (agentic-systems) / revops / Kepler (sales-and-gtm) / Atlas (operator-os, surfaces only). **This step is the one the methodology exists to make impossible to skip.** The 2026-06-22 failure was Atlas building a revops skill instead of routing it. Do not build another practice's system. If the activity crosses an expert boundary (approval ask, channel choice for an expert, projecting expert input into an artifact), the owner conversation routes through **Hermes** ... that is not your call to make.

If the owner is not the practice you're sitting in, your output is a routed spec, not a build.

### 4. Prove it manually

Run each activity by hand first. Automate only what has proven itself manually (studio rule). This is the discipline against building tools for their own sake. An activity card can ship with `current = manual` and a channel; that is a working guarantee, not a failure. The automation gets *earned*.

### 5. Register (Boris builds; this skill produces the rows)

Registration makes the system agent-readable. Concretely (methodology §7):
- The system becomes a row in `public.systems`, carrying `goal_id` (the step-1 trace) and `owner`.
- Each activity becomes a row in `public.activities`. The card maps field-for-field to the schema in **methodology §7.1** ... `current_automation_level`, `target_automation_level`, `channel`, `architecture`, `ai_role`, `context_contract`, `ensured`, `last_ensured_at`, `verification`, `owner`. Do not invent a parallel schema; use §7.1's columns and enums.

The autonomy gradient (the vision metric) becomes computable from these rows: `autonomous / ensured`. No longer a hardcoded 0.

Note: the `activities` table + `systems.goal_id` are a **destructive DDL change to canon that has NOT been applied yet** (§7, "Not yet applied"). Until Nick gives the go, "register" means producing the rows as a spec artifact, not running the migration. Do not run the migration from this skill.

### 6. Surface + feedback (Boris wires; Atlas defines what each channel presents)

- **Surface** = for each not-yet-autonomous activity, render its `channel` ... a row on /work, an email, a triage-queue entry, a ping. "Surface" is the rendering of `channel`.
- **Feedback + promotion** = each activity emits an event when it runs (did it happen, did verification pass). That log is both the guarantee ledger and the promotion signal. **Promotion is earned, not declared:** an activity climbs toward its target only after running reliably at its current level. **Demotion fires automatically when verification starts failing.** The human-in-loop mechanic is *own your control flow* (§8): a not-yet-autonomous activity is a control-flow break ... pause at the decision point, route to the human via the channel, resume on approval.

## Done check (a system is not done unless ... §6)

- It **ensures** its activities (reliability), not merely "can run."
- The guarantee is **verified, not assumed** ... every model-bearing activity carries how it's checked and when it was last confirmed.
- Every activity has a known automation level + architecture rung, and ... if not autonomous ... a channel.
- It traces to a goal and states how that goal serves the vision.
- It **declares its gaps** honestly (unbuilt legs, still-manual activities).
- It was proven manually before it was automated.
- The human only ever receives *presented* activities. Never "remember to."

## What this skill outputs

A spec artifact: the step-1 trace, one filled activity card per activity, the owner assignment, and (when canon's migration has landed) the `systems` + `activities` rows. That artifact is what Boris builds from and what registers into canon. A session that ends with vague tasks instead of filled cards did not run this skill correctly.
