# Handoff to Boris: System-Building Methodology (+ today's operator-os build queue)

From: Atlas (operator-os). To: Boris (agentic-systems). Date: 2026-06-22.
Status: a first-cut DRAFT to iterate on WITH Nick, not a finished spec to implement. Nick will work
it with you directly; he is not marking up the draft solo.

## The headline: a shared system-building methodology

Draft: /Users/nplmini/code/work/practices/operator-os/reference/system-building-methodology-draft.md

What it is: the shared definition of what a system *is* and how the three of us build one, so every
build stops reinventing its own shape. It bridges the operator-os spine (Vision -> Goals -> Systems
-> Activities, operator-os/reference/methodology.md §3b) and your registry. Atlas drafted the
operator-os half plus the framing; your half is stubbed and marked **[BORIS]**.

Why now: every system built this session invented its own shape, and one crossed a boundary (Atlas
built a revops skill instead of routing it to you). Lifecycle step 4, "assign the owner," exists to
make that impossible to skip.

The core idea to preserve (Nick's ... do not flatten it): **a system ENSURES activities happen; it
does not necessarily DO them.** Guarantee (reliability) and automation (leverage) are separate dials.
Activities sit on a spectrum (manual -> semi -> fully -> autonomous); a still-manual activity is
*presented* to the human through a channel (surface / email / queue / ping); the vision is the
gradient ... the share of ensured activities that have reached autonomous.

Your stubs to fill (section 7 of the draft):
- Registry schema additions: per-system activity list, automation level + target + channel per
  activity, lifecycle-state vocabulary.
- The build / wiring mechanics: what "register" and "surface" concretely do.
- Feedback capture, and how an activity gets promoted up the automation spectrum.
- Reconcile with the live registry (the registry -> canon consolidation, your existing lifecycle tags).

Open decision for the three of us: is "channel" a fixed enum or open-ended, and who owns the channel
registry.

The division (also in the draft): Nick sets the bar and judges; Atlas writes the why / trace / spec
and what each channel must present; Boris builds / registers / surfaces / wires feedback.

## Also in your queue from today (all ladder to the operator-OS goal in canon_engine)

Generated this session, yours to own:

1. **Inbox triage system** ... spec at
   /Users/nplmini/code/work/practices/operator-os/reference/spec-inbox-triage-system.md. 7am + 1pm
   pre-pass, propose-then-confirm, the projection-UI review surface. Both inboxes already ingest into
   canon (konstellationai + instig8). The `signal_status` state machine is the first unblock.

2. **Work focus surface (build + fix)** ... spec at
   /Users/nplmini/code/work/practices/operator-os/reference/spec-work-focus-surface.md. The /work
   Focus surface must become a window into reasoning, not a list: reasoned next-action, the visible
   ladder, drill-down into activities, admit-its-gaps, an autonomy metric, and actions that work.

3. **demand-needs-extract skill** ... at
   /Users/nplmini/code/work/practices/revops/skills/demand-needs-extract/. Atlas built this when it
   should have been routed to you. It is yours to validate, keep, or rebuild and integrate. It wrote
   clearly-marked `-SAMPLE-` artifacts into the Konstellation CIPO play folders and did NOT overwrite
   the existing canonical offer/segment (Kepler v0.2).

4. **The audience-needs gap analysis** ... at
   /Users/nplmini/code/work/practices/operator-os/reference/revops-engine-context-2026-06-22.md. The
   connective "audience needs -> engine inputs" system is unbuilt. Section (f) lists five unknowns
   only you can confirm: live build-state vs registry claims; what approving a Learning actually
   triggers; whether `demand-context` survived the registry -> canon consolidation; whether
   demand-context and the Hermes expert-liaison loop are one system or two; and the referenced
   `creative-brief` skill that does not exist on disk.

All four are systems-in-progress under the operator-OS goal. Nick brings the methodology to you to
iterate; the rest is your build queue when you pick it up.
