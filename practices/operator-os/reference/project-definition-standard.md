# Project & Task Definition Standard (operator-os)

Status: v1, 2026-06-23. Owner: Atlas (operator-os). Skill-ification / schema enforcement: Boris.

The problem this solves: Atlas was creating projects/tasks by guessing, or by asking Nick
low-value classification questions ("does system X do Y?"). Neither adds value. This standard
defines (a) what a well-formed Goal / Project / Task must contain before it is written to canon,
and (b) a fixed elicitation exercise Atlas runs *with Nick* so Nick declares and Atlas captures.

This is not new theory. It is the existing methodology (`methodology.md`: the goal-to-action
spine §2, the leverage axis §3a, Drucker's What/How/Where/When, Grove's objective→key-result)
compiled into a definition-of-done and a question script. Where this and `methodology.md`
disagree, `methodology.md` wins and this file gets fixed.

---

## 1. Definition of done (what a row must contain before it is written)

### Goal
- **Traces to the Vision** with a one-line `why_it_matters` (Drucker: is this the *right* objective?).
- **Target** stated as an observable condition (Grove): the result that means it is met, not an intention.
- **Horizon**: the season/quarter it belongs to.
- **Area**: the dominant one of the six (allocation tag, secondary to the goal).
- **Leverage read** (§3a): dominant leverage form (code / media / capital / labor / none) +
  wealth test (asset vs rented_time). A `rented_time` or imitation goal is a flag Atlas surfaces,
  not a silent rank.
- **Rank** among active goals.

### Project (must satisfy ALL before write)
- **One Goal** (`goal_id`). No goal = a flag ("why are we doing this"), surfaced, not defaulted.
- **One Area**.
- **Outcome**: the observable end-state in one sentence ("done when X is true").
- **Next action**: the single concrete first move (never a category).
- **§3a order — What > Who > How-hard**: scope first; then partners (each screened on
  intelligence / energy / integrity, integrity non-negotiable); then effort.
- **Leverage**: does it compound (asset) or is it rented time? Prefer compounding; name it if not.

### Task (must satisfy ALL before write)
- **Belongs to one Project**, or is an explicit, authorized one-off orphan. Rising orphan count
  is itself a flag.
- **Importance** (important / not_important) and **Urgency** (urgent / not_urgent).
- **First 5 minutes**: the physical ignition step — the thing you literally do to start. Reduces
  initiation friction. Mandatory for any "do-first" task.
- **Rate verdict** (aspirational hourly rate): do / delegate / automate / drop. Only `do` tasks
  land on Nick's list. Below-rate chores never become Nick's tasks unless they unblock an asset.
- **Provenance** (`canon_ref`) when extracted from an email or transcript.
- **Recurring operational work is an activity, not a task.** If it repeats on a cadence and a
  system should own it, route it to the run layer (`activities`), do not park it on Nick's list.

A row that cannot meet its checklist is not "good enough to write" — it is the trigger to run
the exercise below, or to surface the gap to Nick. Do not fabricate the missing fields.

---

## 2. The definition exercise (Atlas asks, Nick declares)

Run this when a goal/project is new, fuzzy, or fails its definition-of-done. Nick supplies the
judgment; Atlas supplies the structure and does the capture. One pass per goal/project.

**A. Frame (sharpen before decomposing)**
1. What is the observable result that means this is *done*? (forces the target/outcome)
2. Why does this matter — what does it serve one level up (goal → vision)? Is it the *right*
   objective, or are we executing the wrong aim well?
3. Is this the hedgehog — best-in-world × drives-you × economic-engine? If it's off any axis, say so.

**B. Leverage (score it, don't assume)**
4. Does this earn while you sleep (asset) or only while you work (rented time)? If rented, is it a
   named, capped bridge or scope creep?
5. What's the dominant leverage form — code, media, capital, or labor? Are we favoring the
   permissionless ones?

**C. Shape (What > Who > How-hard)**
6. What exactly is in scope, and what are we explicitly NOT doing?
7. Who else touches this (partners / experts / vendors)? Each screened on intelligence / energy /
   integrity?
8. What's the single next action, and what's the literal first-5-minutes ignition step?

**D. Verdict (per task)**
9. For each piece of work: do / delegate / automate / drop? (Only `do` reaches Nick's list.)
10. Anything here that's recurring and should be a *system activity* instead of a task?

Capture answers straight into the semantic moves (`propose_goal` / `propose_project` /
`propose_task`) and write on Nick's approval. If an answer is "I don't know yet," that becomes a
flagged open question, not a guessed field.

---

## 3. When NOT to ask Nick

If the answer lives in canon or the codebase, Atlas finds it — system inventory, which system owns
an activity, what's already built. Asking Nick to classify something Atlas could look up is the
failure mode this standard exists to kill. Ask Nick only for *judgment* (the questions above), never
for *facts Atlas can retrieve*.
