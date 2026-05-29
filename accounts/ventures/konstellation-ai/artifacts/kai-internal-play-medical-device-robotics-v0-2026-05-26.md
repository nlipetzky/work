# KAI Internal Play ... Medical Device Robotics

**Artifact type:** Play definition
**Play name:** KAI Internal ... Medical Device Robotics
**Version:** v0
**Status:** Draft (pending expert approval)
**Approver:** Will Rosellini (expert mode ... approves play substance; sponsor approval lives on the Trajectory)
**Owner:** Nick Lipetzky
**Created:** 2026-05-26
**Approved:** (pending)
**Linked artifacts:**
- ICP titles: `kai-internal-icp-titles-v0-2026-05-26.md`
- Trajectory: `kai-internal-trajectory-v0-2026-05-26.md`
- Playbook row: RevOps Surface base `appYBYH3aOHhTODAw`, Playbook table (Play Name: "KAI Internal ... Medical Device Robotics")
- CRM landing: Airtable base `app5tsy6zjfA8H3rx` (Prospects, Events, Artifacts, Learnings tables)
- Source of voice: `accounts/ventures/konstellation-ai/reference/narrative.md`, `accounts/ventures/konstellation-ai/reference/locked-decisions.md`
- Source of catalog: `accounts/ventures/konstellation-ai/reference/catalog.md`

---

## What this play is

KAI's first internal lead-gen play. Generates qualified conversations with operators at North American medical-device-robotics companies where the robot IS the device, sized $10M-$100M in revenue. Conversations route to Will's calendar for the SDR motion he runs. The deliverable on the KAI side is one of the catalog's Clusters (most likely RevOps Cluster, with a Customer Expansion Cluster fallback), entered through a paid GTM Survey.

This is also KAI's first dogfood: KAI is using its own catalog to sell KAI itself.

## Target accounts

### Segment definition

- **Industry:** medical device manufacturers whose product IS a robot (surgical robotics, rehab robotics, diagnostic robotics, imaging robotics, robotic delivery systems, etc.). Excludes robotic-process-automation companies that serve medical device manufacturing as customers.
- **Revenue band:** $10M to $100M annual revenue.
- **Geography:** North America (US + Canada).
- **Stage:** post-revenue, pre-enterprise. Companies large enough to feel pipeline pain, small enough to move on a decision.

### Disqualifiers (do not surface)

- Enterprise companies (above $100M revenue). Will explicitly flagged these as too slow.
- Law firms and IP-services firms. Will explicitly flagged these even though they sit adjacent to his background.
- Companies outside North America (v0 scope only; may revisit).
- Companies where Will has a current advisory, board, or commercial relationship (Will to confirm list).

### Sub-segment open question

"Robots that are the medical device" spans surgical, rehab, diagnostic, imaging, and delivery-system categories. Will to confirm whether one sub-category gets prioritized in Phase 2 of the Trajectory based on his peer credibility. Default: run all sub-categories in v0 and let reply data inform v1 prioritization.

## Titles to target

See `kai-internal-icp-titles-v0-2026-05-26.md` for the full Tier A / Tier B / Skip breakdown and sequencing rationale.

Sequencing summary:
1. Founders and CEOs at $10-30M companies first.
2. CCOs and VP Sales at $30-100M companies second, after message validation.

## Offer hypothesis

Will leads with the outcome and gates on the Diagnostic. The shape (from transcripts):

- **Outcome named first:** more warm leads for your salespeople (or for you, if you are the de facto head of GTM).
- **Diagnostic gate:** "If you want us to do this, you have to do the audit and the assessment. If you get the assessment and you don't agree with what should be done, we part ways."
- **The Diagnostic is itself the first revenue event.** Productized, ~2 weeks, paid. See `reference/catalog.md` for the Diagnostic / Survey shape.

What we are NOT pitching cold:
- Architectural concepts (Constellations, Clusters, Systems). Those live in the Survey deliverable, not in cold copy.
- Pricing of any kind. Will commits numbers; cold copy doesn't.
- Case studies or named client outcomes. We do not have a usable cold proof point yet (Q2 in `reference/learning-questions.md` is also still open ... do prospects need a sample of the Diagnostic to close).

What we are using as proof in cold copy:
- Will's personal credential: first US AI medical device approval; commercialization and IP background.
- Will's updated LinkedIn title: "agentic AI strategist."

## Channels

### LinkedIn (launch first)

- Sender: Will Rosellini personally (not Konstellation AI brand).
- Tool: HeyReach (Will's account already active).
- Account assets: Sales Navigator is live; LinkedIn profile updated by Will to surface the AI medical device approval credential.
- Why first: account and tooling are already in place; no domain warming needed; Will's profile is the credibility anchor.

### Email (launch second)

- Sender: Will Rosellini personally, on a warmed sending domain.
- Tool: TBD (likely n8n + a transactional sender or a sequencer Will and Nick agree on).
- Dependency: Nick owns email domain warming. Email launches when warming is complete and the LinkedIn motion has produced reply data Will can pattern-match against.

## Sender identity

Will Rosellini personally on both channels. Not the Konstellation AI brand. The Konstellation narrative and Cluster vocabulary surface inside the Diagnostic deliverable and on the discovery call, not in cold copy.

## CRM and operational landing

- **Prospects table:** Airtable base `app5tsy6zjfA8H3rx`, table "Prospects". Each contact lands here. Will's working surface for who he is talking to and what is next.
- **Events table:** every prospect interaction (meeting, email, text). Linked to Prospects.
- **Artifacts table:** GTM assets used in this play. Versioned, status-tracked.
- **Learnings table:** insights from real conversations. Routed through the expert-liaison loop for approval; approved Learnings update the artifacts they affect.

Playbook row in RevOps Surface base `appYBYH3aOHhTODAw` (Playbook table) tracks engine state and references this artifact path.

## Success metrics

Per Trajectory (see linked artifact for full criteria):

- 30 calls run with the template (Phase 6 milestone).
- Demand signal validated (offer hypothesis holds in buyer language).
- At least one paid client signed.
- v1 artifacts produced for ICP titles, offer, and outreach copy from real conversation data.

Stretch target named by Will: 5 clients at $5k/mo. Sits beyond demand-signal milestone; depends on close rate.

## Termination criteria

Per Trajectory. Summary:
- 30 calls run with no demand signal → pivot segment with sponsor approval.
- Reply rate below ~1% from first 200 contacts → re-test channel and message before pivoting segment.
- Sponsor redirects commercial focus.

## Learning loop hooks

This play feeds the Learning Questions in `reference/learning-questions.md`:

- **Q1 (pain language):** every call captures the words the buyer used unprompted. After ~5-10 calls, synthesize. Output goes to Pitch Sheet, Discovery Question Library, and back into this play's offer hypothesis.
- **Q2 (Diagnostic close cold or with sample):** track "ask for sample" vs "send the contract" responses.
- **Q3 (decision profile):** capture title, internal champion, decision flow per closed-or-lost.
- **Q4 (objection library):** start aggregating recurring objections after the first 20 calls.
- **Q5 (which Cluster pulls):** which Cluster does the buyer's pain map to most often.
- **Q6 (assets-per-week framing):** do prospects accept productized assets or default to expecting hours.
- **Q7 (price posture):** flinch points and price-question timing.

Each Learning routes through the expert-liaison loop:
- **Update existing:** Will approves; artifact version increments.
- **Propose new:** Will approves; new artifact type added to taxonomy.
- **Context gap:** noted on Will's roadmap; informs what to build next.

## Context gaps named (AI self-disclosure)

Per artifact discipline, I am naming the context I lacked while drafting this play. These are roadmap signals, not complaints.

1. **No practice-level ICP-titles template exists yet.** This is the first ICP-titles artifact in the studio. Eventually it should generalize into a reusable subtype in the cross-practice artifact taxonomy (per `practices/agentic-systems/reference/artifact-discipline.md`).
2. **Expert-liaison interface to Will is not concretely defined.** The methodology doc names Hermes and the approval-loop pattern, but the actual channel for routing approvals to Will (email format, batched cadence, where his "approved" replies land) is unspecified. The Trajectory above assumes Nick handles the loop manually for v0; a structural interface for Will is on the roadmap implicitly.
3. **No starter Trajectory template exists.** `engagement-governance.md` describes the pattern; a reusable phase-structure scaffold (mapping engagement phases to RevOps engine phases) would have made this Trajectory faster to draft and more consistent across future engagements.
4. **Sub-segment credibility map for Will is missing.** "Robots that are the medical device" spans 4-5 distinct sub-categories. A short artifact (Will's credibility map by sub-category) would let Phase 2 of the Trajectory start with the highest-yield sub-cohort instead of running all sub-categories flat.
5. **No cold-proof artifact exists yet.** We have Will's personal credential, but no client-outcome proof and no Diagnostic sample. Q2 in `learning-questions.md` will tell us whether the lack of a sample is a real conversion blocker; if so, a "redacted Diagnostic sample" artifact becomes the next thing to build.

## Approval

Expert mode. Routes through expert-liaison loop to Will. Approval format: Will replies with "approved as v0" (or proposed edits). On approval, this header's Status flips to "Approved" and the Approved date is set.
