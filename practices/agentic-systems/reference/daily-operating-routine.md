# Daily Operating Routine

A daily loop for working from the Work Airtable base (`appz7I91uNxWBnly8`). The base holds three kinds of state: what to do today (Tasks), what's in motion (Projects), and what's been signaled but doesn't need action (Notifications). The routine binds them together.

## The three surfaces

- **Tasks** — atomic next actions. The Eisenhower matrix lives here. Every Task has an Importance and an Urgency; the Action formula maps them to Do First / Schedule / Delegate / Eliminate.
- **Projects** — multi-step outcomes. Each Project has an Outcome statement, an Area, and a Status. The current next-action for each Project lives in Tasks, linked.
- **Notifications** — things Staff (or a person) wants you to know. Digests, doc-activity, calendar prep. No action implied; if action is needed, there's a Task too.

## Morning (5 min)

1. **Notifications → Unread.** Skim. If something needs action, create a Task. Mark read.
2. **Tasks → Matrix.** Look at Do First, then Schedule. Commit to 1–3 items for today.
3. **Projects → Stalled** (Active projects with zero open Tasks). For each, add the next-action Task or change the Project Status (Blocked, Paused, Dropped, Done).

## Throughout the day

Work the Do First items. Mark each Completed when done (Status → Completed, set Completed date).

New work arrives → triage on entry:

- Atomic, doable in one sitting → **Task**. Set Importance and Urgency. The matrix sorts it.
- Multi-step or has a decision gate → **Project**. Add one next-action Task linked to it.
- Informational, no action implied → **Notification**, or skip. Don't pollute Tasks.

## Evening (5 min)

1. **Tasks → Matrix.** Mark any Open tasks that actually got done. Stamp Completed.
2. **Projects → Active by Area.** Scan. Any Status changes needed? Any Projects that should have a next-action Task for tomorrow?
3. If tomorrow needs a different focus, edit Importance/Urgency on the relevant Tasks. Matrix re-sorts automatically.

## Weekly (15 min, end of week)

1. **Projects → Done this week.** Scan, write wrap-up Notes, stamp Closed.
2. **Projects → Blocked / Paused.** Anything unblocked? Anything that should be Dropped?
3. **Tasks → Done this week.** Skim. Notice anything that should have been a Project (would have done it differently) or should have been Dropped (spent time on the wrong thing).

## Principles to keep the routine honest

- **One ACTIVE next-action per Project.** A Project with three open Tasks usually means you've front-loaded planning. Pick the next physical action, leave the rest in Notes.
- **Tasks open more than a week need a decision.** Do it, delegate it, drop it, or convert to a Project with a real start date.
- **Notifications are read-once.** If you reread the same digest, that's a sign Staff should be creating Tasks instead.
- **The Matrix is the boss, not the calendar.** The Action formula drives priority. Due dates are for hard external deadlines only.

## Airtable views to set up (UI only, can't be created via API)

**Tasks**

- *Matrix* — filter Status=Open; group by Action; sort by Importance desc, Urgency desc
- *Today's focus* — filter Status=Open AND Action="Do First"; sort Due asc, Created desc
- *By Project* — filter Status=Open; group by Project
- *Done this week* — filter Status=Completed AND Completed within last 7 days; sort Completed desc

**Projects**

- *Active by Area* — filter Status=Active; group by Area
- *Stalled* — filter Status=Active AND Open Tasks=0  (requires rollup field; see below)
- *Blocked* — filter Status=Blocked
- *Done this month* — filter Status=Done AND Closed within last 30 days

**Notifications**

- *Unread* — filter Read=false; sort Created desc
- *Today* — filter Created today

## Fields to add manually on Projects (also UI only)

These need to be created in the Airtable UI because the API doesn't expose rollup/lookup configuration:

- **Open Tasks** (rollup) — link field: Tasks (auto reverse-link); roll up: Status; aggregation: `SUM(IF(values="Open", 1, 0))`. Used by the "Stalled" view above.
- **Next Action** (rollup, optional) — link field: Tasks; roll up: Task; aggregation: `ARRAYJOIN(values & "", ", ")` filtered to Open. Shows the current next-action name on the Project row.

## How this fits with Staff (the autonomous layer)

Every n8n workflow that writes to the Work base writes to ONE of the three surfaces. Never two. When this routine surfaces a duplicate or a mis-categorized entry, the right move is to fix the workflow that produced it, not to clean up the row by hand. The routine is also a quality signal on Staff itself.

## Resume pointer

If a future Boris session needs to know how Nick operates the Work base: read this doc, then read `/Users/nplmini/.claude/projects/-Users-nplmini/memory/project_work_base_structure.md` and the two `feedback_project_vs_task_classification.md` / `feedback_staff_one_action_per_task.md` memories.
