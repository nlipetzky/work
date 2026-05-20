# Artifact sketch (v0) — Prospect Discovery Package

**Status:** v0 sketch for iteration with Nick. Not locked. Owner system: `expert-liaison` (cold-start intake mode). Lock this before any workflow is built toward it.

## What it is

A structured discovery deliverable `expert-liaison` produces for a *prospect* (not yet a client) from a minimal seed — **company name, website, LinkedIn** — by running RevOps engine resources speculatively, *before* a formal discovery session. Goal UX: the prospect **fine-tunes** a sharp pre-built picture instead of digging up material from scratch.

## Two faces, one record (canon: human-adaptive in, engine-standardized out)

- **Human-facing rendering**: what the prospect sees. Adaptive, narrative, designed to make them lean in.
- **Engine-facing projection**: a structured record `expert-liaison` holds. On conversion, it seeds the play config the RevOps engine consumes (Sources / Classification Rules / Playbook rows, scoped by play). Same package, two derivations.
- It is a **scoped record per prospect**, never a table-per-prospect.

## Honesty frame (non-negotiable, baked in from v0)

Cold-start = no human verification yet. Our known trust gaps (catch-all email, stale-employer, currency) will be wrong sometimes. A prospect who clicks one LinkedIn link and catches an overclaim loses trust on contact — the exact Teknova burn. So **every claim carries an explicit confidence label and source**, and the package never asserts certainty the engine can't back. Intellectual honesty about uncertainty is positioned as the differentiator, not hidden.

## Sections

1. **Frame** — who it's for, the seed we started from, and an explicit statement: machine-generated from public signals before our conversation, confidence-labeled, built for you to correct. Sets the fine-tune expectation.

2. **Company Snapshot (about them)** — what they do, stage, size, funding, HQ, leadership. *Source:* enrichment (Explorium/Apollo firmographics). *Confidence:* per-field. Proves we did the homework.

3. **What We See Happening (signals)** — recent momentum on *them*: funding, hiring, pipeline/clinical or product, press, partnerships, regulatory. The Company Events signal model pointed at the prospect. *Source:* engine signal capture (sources vary by their domain). *Confidence + source per signal.* The "they're already watching us" moment.

4. **Our Read of Your Market & Buyers (HYPOTHESIS)** — inferred ICP / target space, explicitly labeled a hypothesis: here's who we think you sell to and why; correct us. *Source:* engine inference from their positioning. Heavily caveated. This is the primary fine-tune hook — the thing they react to that accelerates real discovery.

5. **A Small, Honest Sample of the Engine Working** — a tiny curated slice (≈5–10) of example target companies/contacts in their likely space, run through sourcing → enrichment → classification, shown **with** honest confidence labels (Verified / Catch-all (unconfirmed) / etc.). Demonstrates the machine *and* that we flag our own uncertainty. Explicitly "a sample of the engine, not your final list." Leverages today's honest-status work as the selling point.

6. **Gaps & Questions for You (the fine-tune agenda)** — what the engine could not determine or is unsure about, framed as the discovery-session agenda. Flips "you dig up material" into "react to our specific questions." This is the operational payoff of the whole UX.

7. **Confidence & Provenance Appendix** — every claim's source + confidence in one place. The trust spine; doubles as the engine-facing standardized projection.

## v1 scope guidance (anti-sprawl)

- Go deep on **2, 3, 4, 6**. These are doable cold and carry the impression.
- Section **5** is the sprawl risk (it requires guessing their ICP and running the full engine). v1 = a *small curated* sample, honesty-labeled, framed as illustrative — not a pre-built cohort. Do not try to fully pre-build their target list cold.
- Lock sections + per-section confidence treatment before wiring any engine call.

## Open iteration questions for Nick

1. Which section is the centerpiece for *this* prospect — the "about you" depth (2/3) or the market/buyer hypothesis (4)?
2. How real should the section-5 sample be for v1 — illustrative handful, or a genuine small run through the live engine?
3. What format does the prospect actually receive (doc, deck, interactive)? Drives the human-facing rendering.
