# Handoff to Hermes: Will extraction + prospect-transcript intake

From: Atlas (operator-os) · Date: 2026-06-23 · For: expert-liaison (Hermes)

## The ask

Two things, both expert↔engine translation (your lane, not Atlas's):

1. **Route the existing Will extraction to confirmation.**
   `practices/agentic-systems/sandbox/will-artifacts.json` holds a v0.1 SME extraction of Will
   Rosellini ... voice/vocabulary, credibility, hot-takes, war-stories, patterns, refusals, 11
   artifacts total ... drafted 2026-05-27 from the Will/Nick NotebookLM notebook. Status:
   "Populated from transcript extraction. Pending Will confirmation." It has never gone through the
   approval loop. Get Will's confirmation/corrections and land the approved artifacts in the
   liaison base (`appbFsdqrC5vnxuIR`, `Expert Artifacts` table), one row per artifact.

2. **Set up the prospect-transcript intake (the new, higher-value input).**
   Nick wants Will's **PatentVest prospect-call transcripts** ... the language and pain of the
   *buyers* Will talked to ... as the raw input to the demand-context system (see Boris handoff
   `practices/agentic-systems/HANDOFF-demand-context-build-2026-06-23.md`). The transcript links
   Will sent previously were dead. Help get working links and a clean intake path from Will into
   the demand-context loop.

## Context / honest state

- Per `sme-extraction-methodology.md`, the Hermes approval interface is still **notional, not
  wired** ... v0 assumes Nick routes manually. So for now this is "Hermes-shaped work Nick does by
  hand"; flag what should be automated.
- Distinction to hold: artifact #1 is the **supply side** (how Will sounds, for cold-copy
  authenticity); #2 is the **demand side** (what prospects say, for offer/ICP evidence). Both feed
  the engine; keep them separate in the liaison base.

Atlas has captured the demand-context build as a G1 project in canon and is routing the expert-loop
pieces to you. Atlas does not run the expert loop.
