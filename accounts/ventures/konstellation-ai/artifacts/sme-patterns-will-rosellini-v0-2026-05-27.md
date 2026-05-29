# SME Pattern Library ... Will Rosellini

**Artifact type:** SME Pattern Library
**Expert:** Will Rosellini
**Engagement:** Konstellation AI (KAI)
**Version:** v0.1
**Status:** Populated from transcript extraction. Pending Will confirmation + additional patterns from non-transcript memory.
**Approver:** Will Rosellini (expert mode)
**Owner:** Nick Lipetzky
**Created:** 2026-05-27
**Approved:** (pending Hermes intake)
**Methodology:** `/Users/nplmini/code/work/practices/agentic-systems/reference/sme-extraction-methodology.md`
**Source:** Will and Nick NotebookLM notebook
**Liaison base row:** (pending; `Expert Artifacts` table at `appbFsdqrC5vnxuIR`)

---

## Purpose

The things Will has seen repeatedly that less-experienced people miss. Each pattern anchors a diagnostic insight in the GTM Survey/Diagnostic deliverable ... the audit becomes specific because it's auditing for the failure modes Will already knows cold.

## Content

### Pattern: Enterprise rejects working AI because it doesn't look like work
- Setup: An enterprise sees a working AI solution that took 10 minutes to build, or a vendor bid that comes in too cheap or too fast.
- Typical mistake: Management interprets the speed/simplicity as illegitimate. "Magic and fraud."
- Why it fails: Enterprise validation is bound to friction ... cost, committees, time. If a solution doesn't look like enterprise procurement, it can't be real to them. "It doesn't take six months and a million dollars and three committees. If it doesn't have that, then it's not real."
- What Will does instead: Skips enterprise as a buyer; sells to founders who don't have that gating reflex.
- First observed: Patentvest's response to the 28yo AI firm's 10-minute build (2026-04-21)
- Confidence: high

### Pattern: Vibe-coded internal AI tools fail at enterprise/law-firm scale
- Setup: A CEO sees Claude Legal, has a junior analyst vibe-code a quick demo, and decides to abandon the vendor process.
- Typical mistake: Confusing a demo with a deployable enterprise system. No validation layer. No rubric. No comparison to top human professionals.
- Why it fails: Hallucination rates require human-in-the-loop. SOC2 compliance is harder than the demo suggests. "It's going to look cool to demo and never generate a single usable output."
- What Will does instead: Focus on the validation layer and TCO comparison vs. existing labor. When clients won't fund proper validation, Will exits the relationship.
- First observed: Patentvest / Claude Legal episode (2026-05-20)
- Confidence: high

### Pattern: Founders / leaders misdiagnose their own bottlenecks
- Setup: A founder asks for more cold leads, more marketing automation, more SDRs.
- Typical mistake: Solving for lead volume when the real problem is revenue or conversion further down the funnel.
- Why it fails: "They're solving bottlenecks that aren't their real bottlenecks ... because they don't have clear goals."
- What Will does instead: Audit-first framing ... map the whole process before agreeing to automate any one piece. "You want more sales. Here's what's wrong with your marketing." If the client disagrees with the assessment, part ways.
- First observed: Jen's "give me more cold leads" episode (referenced 2026-04-21; recurring frame)
- Confidence: high

### Pattern: Lawyers reject AI tools reflexively, fail to test
- Setup: AI-driven patent drafting / prior art search tool emerges.
- Typical mistake: "It's not possible. It's better for the patent attorney to do it themselves." No actual test. No published rubric. Reflexive defense.
- Why it fails: Lawyers are anchored to the billable hour and can't think outside it; they also lack the operational discipline to A/B test their own workflow.
- What Will does instead: Removes the law firm from the equation entirely. Trains internal counsel + AI to bypass the patent attorney. Pivots to the asset-owner / enforcement side, where AI's deflationary effect creates a tailwind instead of a threat.
- First observed: Will's patent claim drafting variability research (2026-04-21)
- Confidence: high

### Pattern: Valuable IP gets stranded on a shelf
- Setup: Companies/researchers secure $2M Phase 2 SBIRs and other federal R&D funding. They generate millions of dollars of data, file issued patents, build TRL-6/7 prototypes.
- Typical mistake: PI leaves, company deprioritizes, the IP sits. No one buys the data rights because no one knows you can.
- Why it fails: Original creators lack commercial navigation skills; capital-allocation expertise is rare; no marketplace surface for these assets.
- What Will does instead: Buys data rights cheap; bids sole-source Phase 3 contracts (up to $30M); anchors AI work to hardware (VLSI chips) so the moat doesn't get open-sourced overnight.
- First observed: 2026-03-31 (his three-week-old SBIR loophole discovery)
- Confidence: high

### Pattern: Traditional labs waste weeks on 8-hour experiments
- Setup: A scientist has a hypothesis and three experiments to run.
- Typical mistake: Run the experiments on a bench-top, in a sink, manually. Inventory, training, certifications, protocol approvals, signatures ... pre-experiment overhead crushes throughput.
- Why it fails: Manual workflow + serial human approval = "disastrous levels of delay and procrastination." Eight-hour experiments take three weeks. Reproducibility is poor.
- What Will does instead: Autonomous lab with digital twin testing. Move the high-risk approval logic into a chip (VLSI tolerances hardcoded), let the robot run 24/7. Compresses 24 months and $2M of work into a six-week cycle.
- First observed: Project Genesis design work (2026-02-17 forward)
- Confidence: high

### Pattern: Software-only IP gets erased overnight
- Setup: A company builds an AI tool entirely in software (no hardware, no proprietary data, no regulatory wedge).
- Typical mistake: Believing the software itself is the moat.
- Why it fails: An open-source release (Claude Legal, Open Patents, etc.) collapses your moat in 72 hours. Will saw this happen: spent $1.5M on a quote for software the very week Open Patents launched the same capability for free.
- What Will does instead: Anchors KAI's R&D to hardware (VLSI chip, autonomous lab robot), regulated data sources (DoD / national lab licenses), or domain-specific data the AI ingests over time. Software is the orchestration layer, not the moat.
- First observed: 2026-04-07 (Open Patents launch overlap)
- Confidence: high

### Pattern: Clients don't read reports
- Setup: Deliver a one-page recommendation set and analysis to a client.
- Typical mistake: The client shows up to the meeting unable to log in. Says "I didn't get a chance to read it." You start reading it for them. They don't pay attention.
- Why it fails: The deliverable assumes asynchronous absorption; the client doesn't operate that way; the work never lands.
- What Will does instead: Productize the deliverable so it works without the client paying attention. Build pricing mechanisms that penalize non-engagement (Will mentioned this with respect to Technova). Move toward audit-pricing where engagement is enforced by the deal shape.
- First observed: recurring at Patentvest (2026-05-20)
- Confidence: high

### Pattern: Hourly consulting hours go to zero
- Setup: Will (or any expert) sells billable hours for AI strategy work.
- Typical mistake: Anchoring revenue to hours that AI itself is collapsing. "I'm now able to on a 20-hour engagement do the work in 30 minutes without analysts."
- Why it fails: Buyers will eventually realize the work takes 30 minutes; pricing pressure follows; revenue compresses to zero.
- What Will does instead: Shift to flat-fee retainers, one-time audits, or equity-based engagement. "I'm just going to launch my advisory business in Constellation."
- First observed: 2026-Q1/Q2 (multiple transcripts)
- Confidence: high

### Pattern: Test/validation regulated environments under-build
- Setup: Buyer in a regulated profession (law, medicine, finance) wants AI for a critical workflow.
- Typical mistake: Buyer + vendor agree on requirements without defining what "good" means or how to measure it. No rubric. No baseline.
- Why it fails: "Canon is critical but no one even knows what that means." The AI ships, no one can tell if it's working, the project stalls or fails.
- What Will does instead: Builds the validation/test layer first. "What is the test for the requirement?" Anchors evaluation against top human performers, not average ones. Publishes papers on variability when needed.
- First observed: Perimeter Medical (prior) and recurring at Patentvest (2026-04-21)
- Confidence: high

## Consumes

- Diagnostic / Survey deliverable content
- Audit framework that anchors the paid first step
- "We look at X" credibility moments in cold copy
- Discovery-call diagnostic questions

## How this artifact evolves

- New pattern named during a call or in conversation → propose new entry; Will approves
- Pattern revised by new evidence → version increments
- Pattern superseded (was wrong) → marked superseded; not deleted; lineage preserved

## Gap List ... for Hermes

1. **Patterns from outside the transcripts.** The transcripts focus on AI/IP/law/lab patterns. Will likely has patterns on capital allocation (how founders mis-raise), deal terms (how IP deals collapse), commercialization (how Phase 2-to-Series-A bridges break), and hiring (how scientific teams over- or under-staff). One Hermes prompt: "Are there 3-5 patterns from your earlier career we should add?"
2. **Numbers to anchor each pattern.** Several patterns lack the hard metric that makes them undeniable. The lab pattern has "24 months → 6 weeks." Others (clients not reading reports, hourly going to zero) are anecdotal. Ask Will for the metric for each.
3. **Confidence rating per pattern.** All current patterns are marked "high" based on transcript repetition. Will should confirm.
4. **Diagnostic questions per pattern.** Each pattern should map to a question Will can ask on a discovery call. "How do you currently validate AI outputs against your top professionals?" maps to the regulated-environment pattern. We need the question list for the Survey/Diagnostic skill to consume.
5. **Patterns that are KAI-internal vs. client-facing.** Some patterns (clients don't read reports) are operational lessons; others (lab waste) are the basis of the offer. Will should flag each as "use in Diagnostic deliverable" vs. "internal-only / engagement design only."
