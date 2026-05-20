# Executive Function as a System

A design foundation for Staff. Frames the whole agentic system as an externalized executive function for Nick. Read this before making large architectural decisions about Staff.

## What executive function is

Executive function (EF) is the brain's mechanism for **goal-directed behavior across time and against distraction**. It is what lets a person hold an intent, plan an action, suppress impulses that don't serve the intent, monitor whether the action is working, and adjust as conditions change. It is mediated primarily by the prefrontal cortex, with major contributions from the anterior cingulate cortex (conflict and error monitoring), basal ganglia (action selection and inhibition), and parietal cortex (attention).

The consensus cognitive-neuroscience model is Miyake et al. (2000), refined by Diamond (2013). EF resolves to **three core components**:

1. **Inhibitory control** ... suppressing prepotent responses, distracting stimuli, and impulses that conflict with the active goal. Includes both behavioral inhibition (don't do the wrong thing) and attentional control (don't attend to the wrong thing).
2. **Working memory** ... holding information online and manipulating it. Keeping the goal in mind while executing sub-tasks. Updating mental representations as context shifts.
3. **Cognitive flexibility / set-shifting** ... switching between mental sets, perspectives, or task rules. Adapting when the environment changes.

These three are the substrate. Higher-order EFs are built from them: **planning** (sequencing), **reasoning**, **problem-solving**, **self-monitoring**, **initiation** (starting a task), **prospective memory** (remembering to do something at a future time), **emotional regulation**.

Russell Barkley's reframing for ADHD ("Executive Functions: What They Are, How They Work, and Why They Evolved," 2012) is more about **self-regulation across time**. He argues EF evolved to let humans bind their actions to a future-self goal across delay, in the presence of distraction, and against competing emotional pull. His view: EF impairment (e.g., ADHD) is a delayed-self-regulation problem more than an attention problem.

## What EF failure looks like behaviorally

This is the failure-mode catalog the system needs to defend against:

- **Goal neglect** ... forgetting what you're trying to do mid-task.
- **Capture** ... attention pulled to a salient but irrelevant stimulus (a notification, an interesting tangent, a fresh problem).
- **Perseveration** ... continuing an action after it stops working; getting stuck on a strategy that fails.
- **Initiation failure** ... knowing what to do but unable to start. Disproportionate to task difficulty.
- **Set-switching cost** ... measurable performance drop when changing context. Acute when the contexts have similar features (different clients, similar artifacts).
- **Working-memory overload** ... too many open items in mind, drops the ball on one.
- **Time blindness** ... poor estimation of how long things take, when they're due, what fits in a day. Barkley's signature finding for ADHD.
- **Hot-state hijack** ... emotional/affective state overrides goal-directed plan. Decisions made in frustration, anxiety, or excitement don't match the cool-state intent.
- **Avoidance** ... a Project sits untouched not because it's blocked but because it's aversive. The avoidance is invisible because the avoider tells themselves it's blocked.
- **Compression failure** ... feedback loop too long to learn from. You can't tell whether what you did served the goal because the result is far in time from the action.

Most adults with high cognitive load show subsets of these even without a clinical diagnosis. ADHD-adjacent profiles show them more intensely and more reliably.

## What externalizing EF looks like (the evidence)

Clinical and applied research on EF scaffolding converges on a few findings:

- **Externalized representations of goals reduce working-memory load.** Writing the goal down, displaying it visibly, and referencing it before action improves goal-directed performance. The brain does not have to hold the goal in WM if the environment does.
- **Cueing systems improve initiation.** Time-bound cues, environmental triggers, and "if-then" implementation intentions (Gollwitzer) reliably reduce initiation failure.
- **Self-monitoring requires explicit feedback channels.** People can't reliably introspect on whether their behavior matched their intent; surfacing the actual record (what got done vs. what was planned) is a strong corrective.
- **Switching costs are reduced by structured handoffs.** A brief, structured reorientation when entering a new context (what was the last decision, what's the next action, why does it matter) compresses set-shifting cost.
- **Hot/cold separation.** Decisions made in cool states should bind the hot-state self. Pre-commitment, calendar discipline, written policies. The system should preserve the cool-state intent against hot-state pressure.
- **Compress the feedback loop.** Reduce the time between action and signal-that-the-action-worked. Daily and weekly reflective cycles do this.

The key insight: a well-designed external system functions as **prefrontal cortex offload**. The human spends EF on what cannot be offloaded (creative, strategic, relational, judgment-laden work); the system handles working memory, monitoring, cueing, and routine inhibition.

## Mapping EF → system requirements

| EF function | System requirement | Mechanism |
|---|---|---|
| Working memory (goal stack) | The current goals are persistently visible without effort | Projects table with Outcome statements, surfaced everywhere Tasks appear |
| Inhibitory control (attention) | Irrelevant incoming signals don't capture attention | Notifications surface; Staff routes info-only signals away from Tasks |
| Cognitive flexibility (set-shifting) | Context switches carry a structured reorientation | Per-Project "where we left off" surface; per-Area daily review |
| Planning | Sequencing of actions across time is externalized | Tasks linked to Projects; Due dates and capacity awareness |
| Initiation | First micro-step is pre-resolved, not invented at action time | Each Task carries a "first 5 minutes" or "ignition" action |
| Prospective memory | Future commitments surface at the right time | Scheduled workflows, Due-date-driven views, "remember this tomorrow" |
| Self-monitoring | Actual behavior is reflected back, compared to intent | Daily/weekly review surfaces; "Done this week" views; Staff-generated digests of WHERE time went |
| Conflict detection | When two goals compete, the system flags it before the human collides | Capacity / commitment tracking; over-commitment alerts |
| Avoidance detection | Stale Projects are surfaced as "is this blocked or are you avoiding?" | Projects with no movement in N days get a prompt |
| Hot/cold separation | Cool-state decisions bind hot-state self | Priority surface; pre-commitment to one ACTIVE focus; written-direction-only rule |
| Feedback compression | Action → result loop is fast and visible | Daily routine, weekly review, end-of-Task "outcome closer?" prompt |

## What we already have in Staff that serves EF

- **Working memory offload**: Projects table holds the goal stack. Tasks Matrix holds the action queue. Both are persistently visible in Airtable.
- **Inhibitory control**: The three-surface split (Tasks / Projects / Notifications) routes capturing-but-non-actionable signals away from the Matrix. Staff workflows (compose-daily-digest, note-drive-activity) already feed Notifications, not Tasks. That's an EF defense.
- **Set-shifting support (weak)**: Project Areas group context. Not yet a structured reorientation.
- **Self-monitoring (weak)**: Daily routine exists. Weekly review exists. Reflective surface is absent.
- **Prospective memory**: Due dates exist on Tasks. Scheduled workflows fire. Real prospective memory (e.g., "remind me about Heyreach the day RevOps lands") not yet wired.
- **Hot/cold separation (partial)**: The priority surface pattern (Teknova engagement) is exactly this for client work. Not yet applied to Nick's own work.
- **Feedback compression (weak)**: Tasks get marked Completed; nothing compares completion to goal advancement.

What's strong today: working memory offload and inhibitory control. What's weak or missing: initiation support, self-monitoring, conflict detection, avoidance detection, feedback compression.

## Where to build next, ordered

Each item below maps to a specific EF deficit and a specific build. Prioritized by impact-per-effort on Nick's daily operating reality.

### 1. Goal omnipresence (working memory)

Every view of Tasks shows the linked Project Outcome inline. Reading a Task should automatically refresh "what is this in service of." Today the Project link is there but the Outcome is one click away.

*Build:* Add a Project Outcome lookup field on Tasks, surface in all views. One field add, no workflow change.

### 2. Initiation support

Each Task gets a **First 5 minutes** field. Either Nick fills it in when creating, or Staff drafts it from the linked Project context when a Task is created by a workflow. Reduces the cost of starting.

*Build:* Add field. For Staff-created Tasks, update the workflow to draft an ignition step. Manual Tasks: Nick fills it for the Do First quadrant only.

### 3. Self-monitoring surface

A weekly "where did your time go" report. Staff generates it from the Tasks Completed log, grouped by Project Area and Project. Sits alongside the priority direction. Compares stated focus to actual focus. Surfaces drift.

*Build:* A new n8n workflow `weekly-where-did-time-go`. Fires Friday afternoon. Writes a Notification with the analysis.

### 4. Avoidance detection

Projects in Active status with no Task completed in N days (default 7 for fast work, 14 for deeper) get a prompt: "Is this blocked, or are you avoiding it?" Forces a Status update or a deliberate choice.

*Build:* `detect-stalled-projects` workflow, daily. Writes a Notification or creates a "check-in on Project X" Task in Schedule quadrant.

### 5. Conflict / capacity detection

A capacity model: how many hours per week are realistically available for goal work (subtract meetings, support, admin). Active Projects carry a rough effort estimate. When committed effort > available capacity, the system flags overcommitment before Nick collides with it.

*Build:* Capacity field on Projects (rough). A formula or view computes total committed effort. A daily alert if it exceeds available hours. This is the most speculative item; might not pay rent yet.

### 6. Set-switching primers

When Nick opens a Project page in Airtable, the top of the page shows: "Last completed Task / Last decision / Current next action / Why this matters." A 30-second reorientation. Reduces switching cost when bouncing between Projects.

*Build:* Airtable Interface page per Project, populated by rollups + a Last Decision field. UI-only build.

### 7. Feedback compression on Task completion

When a Task is marked Completed, a quick prompt: "Did this move the Project's Outcome closer? Same? Further?" Builds metadata over time on what actually advances goals vs. what just feels productive.

*Build:* A "Closer to Outcome?" singleSelect on Tasks. Nick fills it at completion. Over time, surface "Tasks that didn't move Outcomes" as a pattern.

### 8. Hot/cold separation for Nick's own work

Apply the priority-surface pattern to Nick's personal operating system. One ACTIVE focus item per day or per week, written down, not chosen in the moment. Reduces hot-state drift.

*Build:* A "Nick's Priority Surface" record (single row, edited daily/weekly). Shown at the top of every Tasks view via a dashboard.

## Principles for designing EF-as-a-system

- **Offload, don't replace.** EF is also where creativity, judgment, and meaning live. The system handles routine (working memory, monitoring, cueing). The human keeps the creative core.
- **The system must be honest.** A monitoring surface that flatters distorts EF rather than supporting it. If avoidance is real, surface it. If capacity is overcommitted, say so.
- **Compression beats completeness.** A 30-second daily check-in done every day beats a 30-minute weekly review skipped half the time. Build for ergonomics first.
- **Cool-state writes bind hot-state reads.** Decisions made when calm should resist edits made when stressed. Status fields, written priorities, structured handoffs all serve this.
- **One ACTIVE thing.** EF is a serial resource. The matrix can hold many open Tasks, but the active focus is one at a time. The system enforces this by surfacing, not by hiding.
- **Don't pathologize.** This is not therapy. Nick has high cognitive load, multiple engagements, and a complex life. The system is an amplifier, not a remediation.

## Resume pointer

If a future session needs to extend Staff or build new agents, read this doc first. The whole design rationale of Staff is grounded here. The roadmap items above (1–8) are the build queue. Items 1–4 are highest leverage; build them in that order.
