# System-Building Methodology (first cut)

> SUPERSEDED 2026-06-23 by `practices/agentic-systems/reference/system-building-method.md` (v1), which
> folds in the maturity ladder + stage-gates and the software-engineering grounding. This draft is kept
> for its §2a (architecture ladder) and §7 (run-layer schema) detail, which v1 references.

Status: DRAFT, 2026-06-22. Atlas's first cut of the operator-os half + the shared framing.
Boris filled his half (architecture selection §2a, the schema and wiring in §7) the same day and
folded in current agent-architecture research (§8 references). Still a draft to work with Nick.
Co-owners: **Nick** (sets the bar, judges, approves), **Atlas / operator-os** (the why, the trace, the
spec, what each channel must present), **Boris / agentic-systems** (build, register, surface,
feedback).

## Why this exists

Every system we have built so far reinvented its own shape. This is the shared definition of what a
system *is* and how the three of us build one, so we mean the same thing every time. It is the bridge
between the operator-os spine (Vision -> Goals -> Systems -> Activities, methodology §3b) and the
agentic-systems registry. It is itself a system, and it should obey its own lifecycle.

## 1. What a system is

A system is a **durable capability that ensures a set of activities happen** ... routing each activity
to its executor by automation level, and migrating it up that level over time.

The load-bearing idea: **a system does not necessarily *do* the work. It *guarantees* the work
happens.** The guarantee (reliability) and the automation (leverage) are two separate dials. A system
can be fully reliable while every one of its activities is still manual. You ship the guarantee first,
then automate inward, without rebuilding.

Three gates. Fail any one and it is not a system:
- It **ladders to a goal** (else it is a flag ... "why is this running").
- It **ensures repeating activities** (else it is a one-off Project, or a Task).
- It **passes the wealth test** ... over time it moves activities off Nick's plate toward asset.

Not a system: a one-off build (Project), a chore (Task), or a tool with no guarantee.

## 2. Activities and the automation spectrum

An **activity** is the leaf ... the actual thing that must happen. Every activity carries:
- A **current automation level**: manual -> semi-automated -> fully-automated -> autonomous.
- A **target level** (where it is headed).
- A **channel**, required whenever it is not yet autonomous: how the system presents the human part
  ... a surface, an email, the triage queue, a ping. A manual activity inside a system is a
  *presented* activity: the system ensures it by routing it to a human through a channel and
  confirming it happened. The human is never asked to *remember*, only to *act on what is presented*.

The system holds the guarantee at every level. Its *improvement* is migrating activities up the
spectrum. **The vision is a gradient, not a switch:** "autonomous systems that accomplish the tasks"
= the share of ensured activities that have reached autonomous, with the rest cleanly presented until
they climb. Manual is not failure; it is a starting automation level under a working guarantee.

## 2a. Architecture: what shape the automated part takes

The automation spectrum (§2) says *how much* of an activity is off Nick's plate. It is silent on *what
shape* the automated part is, and that is a separate choice. Getting it wrong is the most common
failure mode in the field: production post-mortems converge on "most agent failures are architecture
failures, not model failures" (§8). So before automating any activity, place it on this ladder,
cheapest-and-most-reliable first, and pick the lowest rung that holds the guarantee:

1. **Deterministic code + the database** ... no model. Rules, cron, SQL, a solver. Zero variance,
   cheapest, most reliable. The *target* for most activities, not a lesser outcome.
2. **A single augmented LLM call** ... model plus retrieval / tools / memory. Often enough.
3. **A workflow** ... predefined code paths orchestrating model calls: prompt-chaining, routing,
   parallelization, orchestrator-workers, evaluator-optimizer.
4. **An agent** ... the model directs its own steps in a loop with environment feedback. Only for
   open-ended work where the steps cannot be predicted.

**Autonomous is not the same as agentic.** The top of the automation spectrum is *the human off the
loop*, which is most often best reached as boring deterministic code (rung 1), not an AI agent. An
activity that climbs to autonomous as a cron + SQL is the *best* outcome, not a downgrade.

Two gates before you climb a rung:

- **Is this even an AI problem?** If the activity is optimization, scheduling, arithmetic, exact
  values, or anything with a checkable right answer, deterministic code beats a model on reliability
  and cost. Reserve models for intent, language, judgment, and open-ended steps. This is Nick's
  deterministic-engine doctrine generalized: AI is a *called function* inside deterministic control
  flow, not the driver.
- **Single before multi.** When an activity does reach the agent rung, default to one agent. Keep
  *writes* single-threaded; add parallel agents only for read-heavy work (research, search) where
  their outputs need no reconciliation. Parallel writers make conflicting implicit decisions and
  produce fragile output (§8).

The architecture choice decomposes every activity into three roles, which the system spec must name:

- **Code's / the database's role** ... the deterministic legs, *plus* the context substrate. canon is
  not storage; it is the context the model sees. The discipline is write / select / compress / isolate
  (§8): what to persist, what to pull into the window at each step, how to keep it lean. More context
  is not better ... context rot, distraction, and clash degrade reliability. Name what context the
  activity's model receives and who curates it.
- **AI's role** ... the specific judgment the model provides, stated narrowly. If you cannot name it,
  the activity is deterministic, and belongs on rung 1.
- **The human's role** ... what is still presented through a channel until the activity climbs.

## 3. Placement (the ladder)

Vision -> Goal -> System -> Activity. Every system traces to a goal; every activity belongs to a
system. A system that cannot trace up is surfaced as a flag, not defaulted. Areas cross-cut the tree
for allocation; they are not a rung in the branch. (From methodology §3b.)

## 4. The build lifecycle

The repeatable steps, in order:

1. **Trace up.** Which goal, and which repeating activity, does this ensure? If it cannot ladder to
   both, stop ... it is not a system.
2. **Name the activities and their shape.** List the activities the system must ensure. For each:
   current automation level, target level, the channel (if not autonomous), the architecture rung
   (§2a), AI's role / the database's context role, and how the guarantee is verified.
3. **Contract.** What the system consumes and emits (the registry's emit contract). **[BORIS]** owns
   the registry schema for this.
4. **Assign the owner.** Which practice builds it (Boris / revops / Kepler / Atlas-surfaces-only).
   **This step is unskippable.** Skipping it is the failure of 2026-06-22 (Atlas built a revops skill
   instead of routing it). The methodology exists partly to make this step impossible to skip.
5. **Prove it manually.** Run the activity by hand first. Automate only what has proven itself
   manually (studio rule). This is the discipline against building tools for their own sake.
6. **Build.** **[BORIS]** Build the ensuring/orchestration plus the automation that has been earned.
7. **Validate on real data.** Output against the contract, on real input, before any live surface.
8. **Register.** It becomes a System in the registry, carrying its `goal_id`, owner, lifecycle state,
   and its activities + their automation levels + channels. **[BORIS]**
9. **Surface + feedback.** Wire the channel(s) for the manual activities and the feedback that lets it
   self-correct and climb the spectrum. **[BORIS]** builds it; **Atlas** defines what each channel
   must present.

## 5. The three roles

- **Nick** declares the goal, sets the wealth-test bar, judges, approves.
- **Atlas (operator-os)** traces the system to its goal and activity, writes the spec, defines what
  each surface/channel must present, and routes to the owner. Does NOT build other practices' systems.
- **Boris (agentic-systems)** builds, schemas, registers, and wires surfaces + feedback. Owns the
  *how* and the keep-live layer.

## 6. Invariants (a system is not done unless)

- It **ensures** its activities (reliability), not merely "can run."
- The guarantee is **verified, not assumed.** For any activity with a model in it, "ensured" is a
  monitored property, not a build-time checkmark ... non-deterministic systems "work Monday, fail
  Wednesday." Verify with a deterministic check wherever the output is checkable (a schema validator,
  a SQL count, a math check beats an LLM-eval); for the judgment parts, a binary pass/fail eval with a
  written reason, run continuously on real input. An activity carries how it is verified and when it
  was last confirmed.
- Every activity has a known automation level and architecture rung, and ... if not autonomous ... a
  channel.
- It traces to a goal and states how that goal serves the vision.
- It **declares its gaps** honestly ... the unbuilt legs, the still-manual activities.
- It was proven manually before it was automated.
- The human only ever receives *presented* activities. Never "remember to."

## 7. The schema and wiring (Boris's half, filled 2026-06-22)

Grounded in the *live* canon schema (`public`), not the registry's claims. What exists today:
`goals`, `projects` (already carry `goal_id` and `system_slug`), `tasks` (have a `recurring` boolean),
`systems` (rich: `system_type`, `loop_pattern`, `guardrails`, `contract`/`flow` jsonb), `assets`. What
is missing: any **activities** table, and a **goal link on systems**. That gap is why the work surface
is useless and the autonomy metric is a hardcoded 0 ... there is no run-layer to render.

### 7.1 Schema additions (two changes)

1. **`systems.goal_id uuid references goals(id)`** ... close the system→goal ladder. Today systems do
   not trace to a goal; §3 makes that an invariant, so enforce it in the schema.

2. **New `public.activities` table** ... the run-layer leaf:

   ```
   activities
     id                        uuid pk
     system_id                 uuid → systems.id      -- every activity belongs to a system
     name                      text
     description               text
     current_automation_level  text   -- manual | semi | fully | autonomous
     target_automation_level   text   -- where it is headed
     channel                   text   -- surface | email | queue | ping  (null iff autonomous)
     architecture              text   -- code | single_call | workflow | agent  (§2a)
     ai_role                   text   -- the judgment the model provides; null = deterministic
     context_contract          text   -- what context its model sees + who curates it (write/select/compress/isolate)
     ensured                   boolean        -- is the guarantee currently held
     last_ensured_at           timestamptz
     verification              text   -- how "ensured" is checked (deterministic check / eval)
     owner                     text   -- which practice builds/owns it
     created_at, updated_at    timestamptz
   ```

   Reconcile, do not duplicate: `system_type`, `loop_pattern`, `guardrails`, `contract`/`flow` already
   live at the *system* level; `architecture` is per-*activity*. Vocabulary gets aligned when the
   migration is written. `tasks.recurring = true` is the migration signal ... a recurring task is a
   candidate activity and should move under a system, not sit on Nick's list (this is the "send the
   daily email" case from the work-surface critique).

   The **autonomy gradient** (the vision metric, §2) becomes real and computable:
   `count(activities where current_automation_level = 'autonomous') / count(activities where ensured)`.
   No longer hardcoded.

### 7.2 What "register" and "surface" concretely do

- **Register** = the system gets a `systems` row (with `goal_id`, owner, lifecycle state) and each
  activity it ensures gets an `activities` row. Registration is the act of making the system
  *agent-readable*: any agent or surface can now query "what does this system ensure, at what
  automation level, on what channel, verified how."
- **Surface** = for each not-yet-autonomous activity, render its `channel` so the human receives a
  *presented* item ... a row on /work, an email, a triage-queue entry, a ping. "Surface" is the
  rendering of `channel`. The work surface reads `activities` joined `systems` → `goals` to show the
  ladder and the autonomy gradient. Atlas defines what each channel must present; Boris wires it.

### 7.3 Feedback and promotion up the spectrum

- Each activity emits an event when it runs ... did it happen, did verification pass. That event log is
  both the guarantee ledger and the feedback signal.
- **Promotion** (raising `current_automation_level` toward `target`) is *earned, not declared*: an
  activity climbs only after it has run reliably at its current level (the "prove it manually first"
  rule, applied continuously). Its verification history is the evidence to promote. **Demotion** fires
  automatically when verification starts failing.
- The human-in-loop mechanic is *own your control flow* (§8): a not-yet-autonomous activity is a
  control-flow break ... the system pauses at the decision point, routes the item to the human via the
  channel, and resumes on approval (serialize state, resume the same run). Propose-then-confirm is this
  pattern; promotion is removing the break once code or model has earned the trust.

### 7.4 Channel: resolved

Fixed enum to start ... **surface / email / queue / ping**. An open channel registry is abstraction we
cannot fill yet; add a fifth when a real activity needs one. Same discipline as not building the
autonomy metric before activities exist.

> Not yet applied. This is the design; the migration is a destructive DDL change to canon and waits on
> Nick's go before it runs.

## 8. References (the architecture canon this methodology rests on)

Bundled for the skill to point to; indexed in ctx under the source labels in parentheses.

- Anthropic, *Building Effective Agents* (Dec 2024) ... workflows vs agents, the pattern vocabulary,
  simplest-first. (`anthropic-building-effective-agents`)
- Anthropic, *Effective Context Engineering for AI Agents* (Sep 2025) ... the database/context role;
  write / select / compress / isolate; context rot. (`anthropic-context-engineering`)
- HumanLayer, *12-Factor Agents* ... own your control flow, tools are structured outputs, small focused
  agents, contact humans with tool calls, stateless reducer. (`12-factor-agents`)
- Cognition, *Don't Build Multi-Agents* (+ "What's Actually Working" follow-up) ... single-agent
  default, writes single-threaded, multi only for parallel reads. (`cognition-dont-build-multi-agents`)
- Corroborating the determinism lesson: Salesforce Engineering and MLflow production post-mortems
  ("most agent failures are architecture failures"); Arthur / Anthropic on continuous binary evals.
