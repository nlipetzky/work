# Play Brief: Patent Portfolio Management

- **Play slug:** patent-portfolio-mgmt
- **Engagement:** ventures/konstellation-ai
- **Operator:** Ferris (RevOps)
- **Created:** 2026-06-09
- **Last updated:** 2026-06-09
- **Readiness:** blocked

## What you actually need to know (plain English)

This play sells a $3k/month subscription to patent owners: an AI system hunts for people infringing their patents, and a human runs a monthly call to walk them through what it found.

It can't go out yet. Almost everything depends on tomorrow's intake meeting (2026-06-10), which is supposed to nail down who exactly we're targeting and why they'd buy right now. Until that happens, the targeting, the offer's "why now," and the contact list are all half-built on purpose. Don't push this to outreach yet.

One thing you can start today without waiting for the intake: **decide whose name the outreach goes out under (probably Will), get that person's OK to be the sender, and capture how they actually talk and what they can credibly claim.** That one is slow because it depends on people, not on the meeting, so kicking it off now keeps it from becoming the bottleneck later.

Everything below this section is written for the agents that run the play, in their own vocabulary. You don't need to track it.

## The one-sentence play

Outreach to patent owners with active, commercially-standing patents about a $3k/month subscription that runs an agentic system on their behalf to surface and pursue infringement opportunities, with a CIPO synthesizing findings back to them. (Why-now per sub-ICP is not yet locked... see input 1.)

## Input ledger

| # | Input | Status | Source | Artifact | Notes |
|---|---|---|---|---|---|
| 1 | Offer definition | draft | operator-filled | `revops-segment-patent-portfolio-mgmt.md` (embedded "Offer" section) | Price, format, tiers, human layer locked. Why-now per sub-ICP, CIPO monthly deliverable, agent in/out-of-scope NOT locked. No standalone `revops-offer-patent-portfolio-mgmt.md`... run `offer-extract` to produce it. |
| 2 | Segment definition | draft | skill-produced (segment-criteria) | `revops-segment-patent-portfolio-mgmt.md` | v0.2 scaffold. H1-H4 firm; H5 (jurisdiction) is `TBD-from-intake`. Sub-ICPs 1-4 are placeholders pending the 2026-06-10 intake. |
| 3 | Hard disqualifiers | draft | skill-produced (segment-criteria, embedded) | `revops-segment-patent-portfolio-mgmt.md` | Categorized by enforcement (filter / classifier / runtime DNC). D5 jurisdiction `TBD`. Runtime DNC list is an operational dependency Will must produce and maintain. |
| 4 | Sub-segment tagging | draft | skill-produced (segment-criteria, embedded) | `revops-segment-patent-portfolio-mgmt.md` | Enum shape locked (4 named + explicit "other", one tag per record). The four named sub-ICPs are `PLACEHOLDER, TBD-from-intake`. |
| 5 | ICP titles / persona tiers | draft | operator-filled | `revops-icp-titles-patent-portfolio-mgmt.md` | Standalone artifact exists with universal title principles, disqualifiers, and cross-sub-ICP sequencing. Per-sub-ICP tier lists are placeholders pending intake. No titles skill yet... operator-filled scaffold. |
| 6 | Sender identity + credential | gap | n/a | — | Named sender + public credential + voice rules not locked for this play. Crosses Polaris (sponsor sign-off) and Hermes (voice capture). Route both; see hand-off log. |
| 7 | Proof points / copy constraints | deferred | n/a | — | Decision: build `revops-creative-brief-patent-portfolio-mgmt.md` after the 2026-06-10 intake. No `creative-brief` skill exists yet; will be operator-filled or routed to Kepler. |
| 8 | Channel selection | deferred | n/a | `revops-segment-patent-portfolio-mgmt.md` (per-sub-ICP "Channel hypothesis: TBD") | Per-sub-ICP channel hypotheses to be set at intake. Deferred pending intake. |
| 9 | Volume target | gap | n/a | — | Not specified anywhere. First-wave contact volume per tier needs an operator decision. |
| 10 | Personalization rule + hooks | deferred | n/a | — | Queued into the post-intake creative-brief artifact alongside input 7. |
| 11 | Cold copy / sequence | deferred | n/a | — | Depends on inputs 1, 6, 7. Do not run `copy-draft` until sender identity (6) and proof constraints (7) exist, or it will invent the sender's POV (ship-blocker). |

## Hand-off log

- **Hermes (expert-liaison):** Sender voice capture for input 6 not yet routed. ICP refinement and sub-ICP naming will come out of the 2026-06-10 intake and may need expert capture. Status: pending intake.
- **Polaris (engagement-governance):** Sender identity sign-off for input 6 (who the outbound is attributed to, what credential) is a sponsor-side decision. Status: not yet routed.
- **Kepler (sales-and-gtm):** Creative-brief work (inputs 7, 10) and cold copy (input 11) hand across to Kepler once the bundle clears intake. Status: queued post-intake.

## Readiness verdict

Blocked, and blocked on a single named event: the 2026-06-10 CMO intake (`cmo-intake-checklist-2026-06-10.md`). Every strategic input is either `draft` pending that intake (1, 2, 3, 4, 5, 8), `deferred` until after it (7, 10, 11), or an open `gap` the intake should also resolve (6 sender identity, 9 volume). Nothing is execution-ready and the engine should not run this play yet.

The critical path after intake: (1) run `offer-extract` to lock the why-now and produce a standalone offer artifact; (2) re-run `segment-criteria` to replace the sub-ICP and jurisdiction placeholders; (3) lock sender identity through Polaris + Hermes; (4) build the creative-brief; (5) set volume; then copy. Sender identity (6) is the input most likely to lag because it depends on two external parties, not on the intake alone... start that routing in parallel rather than waiting.
