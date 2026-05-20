# Teknova Weekly Status — Template

**Cadence:** Every Wednesday EOD
**To:** Jenn (primary), Ellie cc'd
**Purpose:** Standing snapshot of program state. Replaces the need to recover this content live on Thursday.

Use the structure below for every weekly. Keep sections short — if something needs depth, link to the doc instead of expanding inline. The whole email should be scannable in under 2 minutes.

---

## Subject line format

`Teknova weekly — [YYYY-MM-DD] — [1-line top headline]`

Example: `Teknova weekly — 2026-05-14 — AAV first list with Ellie; patents capture in build`

---

## Email body template

```
Hi Jenn,

Weekly update on the Teknova program.

**Priority surface** ([link to Drive doc])
- ACTIVE this week: [item, with date direction was set]
- QUEUED NEXT (default): [item — confirm or redirect]
- OFF-MENU raised this week: [item if any; skip section if none]
Confirm the queued item or pick something else from AVAILABLE. Direction lands in the surface doc or by reply to this email; verbal asks don't move items.

**Shipped this week**
- [Item 1 — short description, with link]
- [Item 2]

**In Ellie's queue**
- [Doc / list name — link — what I'm waiting on her for, when I sent it]

**Blocked or paused**
- [Item — specific reason, what unblocks it, who has the move]
  (Skip section if nothing is blocked.)

**Coming next week**
- [What I'm building or shipping]
- [What you'll see by next Wednesday]

**Decisions I need**
- [From Jenn: question, context link, deadline if any]
- [From Ellie: question, context link, deadline if any]
  (Skip section if nothing is open.)

Thursday slot is on the calendar. If anything above needs a live conversation, that's the time. If everything is clear, no need to meet — I'll be available either way.

— Nick
```

---

## What goes in each section

### Priority surface
The current state of the priority surface (Drive doc), mirrored into the email for visibility. Always opens the email. Three lines:
- ACTIVE this week (with the date the client set it)
- QUEUED NEXT (the operator's default for next week)
- OFF-MENU items raised this week (skip the line entirely if none)

Closes with the confirm-or-redirect prompt. The client edits the Drive doc to redirect, or replies to the email — either lands in writing. The pattern reference and rules live at `/Users/nplmini/code/work/practices/agentic-systems/reference/priority-surface-pattern.md`.

### Shipped this week
Outputs the client can see or use. Lists handed over. Workflows live. Docs published. Anything that moved from "in build" to "in their hands."

Not: internal milestones, infrastructure work, prep that didn't produce a client-visible artifact. Those are mine to track, not theirs to read.

### In Ellie's queue
Specifically what's awaiting Ellie's async review. Include the doc/list link and what kind of input I'm asking for (approve, mark up, verify per row, etc.). This is the section that makes Ellie's role concrete to Jenn — visible cycle, not invisible waiting.

### Blocked or paused
Real blockers only. "Waiting on Ellie" goes in the previous section. This section is for things that need Jenn's input, an external dependency to resolve, or a decision that hasn't been made yet. If something has been blocked more than 2 weeks, flag it explicitly with a recommendation for unblocking.

### Coming next week
What the client should expect to see by the following Wednesday. Concrete deliverables, not vague intent. If next week's work is internal-only (refactoring, setup), say so honestly: "Internal build, nothing client-facing landing this week."

### Decisions I need
Single most important section. Every decision request should have:
- The question
- A link to the doc or context (no decisions made without paper)
- A deadline if missing one would block work

If Jenn doesn't answer by the deadline, the decision rolls into the next Wednesday email with `STILL OPEN` flagged on it.

---

## Tone

- Direct, professional, no padding
- No apologies for what wasn't done unless there's a real reason worth explaining
- No "circling back," "touching base," or other meeting-substitute language
- If a section is empty, skip the heading entirely. Don't pad with "nothing this week" boilerplate.

---

## What the email is NOT

- A summary of meetings or calls
- A list of tasks I worked on internally
- A request to schedule discussion of what's in it
- A meeting prep doc

It's a standing communication that conveys current state. The Thursday slot exists if Jenn wants to use it after reading. The email itself does the job of the meeting; it doesn't replace it.

---

## File this template

When sending an actual weekly, copy the body template into a new email, fill in sections, send. Save the sent version as `teknova-weekly-status-YYYY-MM-DD.md` in `/Users/nplmini/code/work/accounts/clients/teknova/` for the running history.
