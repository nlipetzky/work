# Handoff to Boris: build the demand-context system (manual-first)

From: Atlas (operator-os) · Date: 2026-06-23 · For: agentic-systems (Boris)

## The ask

Scope and build the **demand-context system**. Nick's directive this session: "make the system
the goal" ... the work is not "manually get Will leads," it is building the system that turns an
expert's prospect transcripts into an evidenced offer, ICP, and buyer language, which then feeds
the RevOps engine. Atlas has captured this in the spine (G1 project `demand-context-system`,
canon) and is handing the build to you. Atlas does not build it.

## What already exists (don't reinvent)

- **Canon system:** `demand-context` (id `120523ed-925a-4b5f-abfc-99bd85f5057e`), status `emerging`,
  now linked to goal G1 (instig8-expert-engine). Purpose, verbatim: *"Outbound plays run on
  evidenced demand understanding, never a guessed ICP."* Inputs/outputs/loop_pattern/activities all
  null ... it is a defined shell.
- **Method locked 2026-06-10:** signal → observation → pattern → consuming-artifact, captured
  *verbatim* with provenance + evidence grades, **manual-first**. Build spec (emit contract: one
  outcome, inputs/outputs, stopping, failure, escalation, cost envelope) at
  `registry/signal/demand-context/system.md`.
- **Related specs:** `practices/agentic-systems/reference/sme-extraction-methodology.md` (11 SME
  artifacts) and `practices/agentic-systems/reference/expert-to-campaign-workflow.md` (the full
  13-phase pipeline; names the failure modes ... prose audience, no filter spec, the 84-vs-16 list
  mismatch).
- **Partial first run:** `practices/agentic-systems/sandbox/will-artifacts.json` ... a v0.1
  extraction of Will (voice, hot-takes, patterns, refusals), pending Will confirmation. NOTE: that
  is the *supply side* (Will's own voice, from the Will/Nick notebook). The demand-context system is
  the *demand side* ... the **prospect** transcripts (the buyers Will talked to under PatentVest).
  That demand side is the gap.

## What to decide / build

1. The manual-first v0 shape of the loop (capture verbatim prospect signal → grade → cluster into
   patterns → emit offer/ICP/language artifacts).
2. The run-layer: what `activities` rows the demand-context system should carry, and their
   automation levels.
3. How its output binds to the RevOps engine inputs (offer-extract, segment-criteria, ICP titles,
   cold copy).

## Runway note

Nick has ~30 days of runway then zero revenue. The manual-first v0 is also his fastest path to
leads for Will. Prioritize the manual pass over full automation ... manual-first *is* the
methodology, so the v0 doubles as the near-term cash play.
