# HANDOFF: KAI Internal Lead Gen Play ... Medical Device Robotics

**Date:** 2026-05-27
**Purpose:** Operational handoff so a fresh Kepler session can resume work on KAI's first internal lead-gen play without re-deriving context.
**Pickup point:** Cold copy v0 not yet drafted; Clay workflow blueprint not yet executed; Hermes routing not yet wired.

---

## Read this first

### Where to launch

Launch Claude Code from `~/code/work/accounts/ventures/konstellation-ai/`. The venture's `CLAUDE.md` auto-loads (catalog, narrative, locked decisions). The work-OS `CLAUDE.md` (one level up) auto-loads on top.

### Who to be

First message to the fresh session: invoke Kepler.

> "Acting as Kepler (sales-and-gtm), resume work on the KAI Internal Medical Device Robotics play. Read this handoff first: `HANDOFF-kai-internal-lead-gen-play-2026-05-27.md`."

That triggers the agent to load `~/code/work/practices/sales-and-gtm/CLAUDE.md` (Kepler's persona definition) and apply it inside the venture context.

### Skills available that you'll likely trigger

- `sme-intake-interview` ... if any of Will's eleven SME artifacts need a refinement pass
- `clay-com` ... for the Clay UI execution
- `offer-extract`, `segment-criteria`, `creative-copy`, `copy-draft` ... GTM craft

---

## The play in one paragraph

KAI's first internal lead-gen motion. Targets medical device robotics companies in North America, $10M-$100M revenue, where the product IS a robot (surgical, rehab, diagnostic imaging, delivery). Goal: put 30 qualified conversations on Will Rosellini's calendar by running cold outreach where **Will is the offer** (not Konstellation services). The buyer says yes to "30 minutes with Will, first US FDA approval of an AI medical device, currently in market in your segment." If the conversation surfaces a real pipeline gap, the paid GTM Diagnostic is offered as the conversion gate. The motion runs as KAI's own dogfood: KAI is selling KAI using its own RevOps Cluster systems.

---

## State at handoff (2026-05-27)

### Playbook row

- Base: RevOps Surface `appYBYH3aOHhTODAw`
- Table: `Playbook`
- Record: `recRndspri0mfqsCT`
- Status: active
- Play name: "KAI Internal ... Medical Device Robotics"
- Owner: Nick

### Play Steps state

| Step | Phase | Status | Notes |
|---|---|---|---|
| 1 | B: Play Definition | done | Artifact lock relaxed; v0.1 from transcripts is enough to launch. |
| 2 | C: Discovery | in-progress | Clay workflow blueprinted; not yet executed. |
| 3 | F: Enrichment | not-started | Gated on Step 2 output. |
| 4 | G: Outreach Generation | in-progress | Offer v0.1 written. Cold copy v0 not yet drafted. |
| 5 | H: Send and Track | not-started | Gated on Steps 3 and 4. |
| 6 | I: Iteration | not-started | After 30 calls. |

### Artifact counts

- 4 KAI play artifacts (ICP titles, Trajectory, Play definition, Offer v0.1)
- 11 SME profile artifacts (Will), populated to v0.1 from a 21-transcript notebook
- 1 Clay workflow blueprint
- 1 Storage architecture doc (in sales-and-gtm/reference/)
- 11 Expert Artifacts rows in liaison base `appbFsdqrC5vnxuIR` registered for Will's SME content

---

## What's locked (do not re-litigate)

- **Beachhead:** medical device robotics, robot-IS-the-product (not RPA-for-manufacturing), $10M-$100M revenue, North America.
- **Disqualifiers:** enterprise (>$100M), law firms, IP-services firms, RPA companies, companies where Will has personal-history conflict.
- **Titles (Tier A primary):** Founder, Co-Founder, CEO, President, CCO, VP Sales, SVP Sales. Tier B fallback: CGO, BD heads, GM. Skip technical and clinical seats.
- **Sequencing:** founders/CEOs at $10-30M first (peer-credential match); CCOs/VP Sales at $30-100M second after message validation.
- **Channel v0:** LinkedIn via HeyReach on Will's personal account. Email layered in after Nick's domain warming (separate workstream).
- **Sender identity:** Will Rosellini personally, NOT Konstellation brand.
- **The offer reframe (v0.1):** Will is the offer. Cold message asks for 30 minutes with Will. The Diagnostic is the conversion gate on the call, not the cold pitch.
- **CRM:** Airtable base `app5tsy6zjfA8H3rx` (Prospects, Events, Artifacts, Learnings).
- **Storage:** liaison base `appbFsdqrC5vnxuIR` Expert Artifacts table for registry/lineage; markdown content in `accounts/ventures/konstellation-ai/artifacts/`.
- **Phase 1 gate relaxed:** approvals run in parallel with launch, not as a synchronous lock before Phase C.

---

## What's open (next decisions)

1. **Cold copy v0.** Not written yet. Four opener variants in offer artifact:
   - A: direct-peer
   - B: pattern-led
   - C: specific-credential
   - D: M&A-soft
   Nick has not picked or said "test all four." Next concrete artifact: `kai-internal-copy-medical-device-robotics-v0-2026-05-27.md`.
2. **Sub-segment decision.** Run all robotics sub-categories flat for v0, or pre-pick (surgical / rehab / diagnostic-imaging / delivery)? Default if undecided: run flat, let 50-row Clay sanity check inform v1.
3. **HeyReach campaign status.** Is an ACTIVE campaign on Will's HeyReach (not DRAFT)? Needed before Clay's HeyReach handoff column can fire. If DRAFT, Will or Nick activates with at least one sender.
4. **Hermes interface.** Still notional. v0 manual routing; Nick conducts the conversations and updates artifact statuses by hand. Wiring real Hermes (email-based async approvals) is a separate workstream.
5. **Five specific approval asks for Will (in offer artifact v0.1):**
   - Approve FDA-AI-medical-device credential phrasing for cold copy
   - Approve "actively allocating capital and operating attention in medical device robotics this quarter" framing
   - Approve "90 days" window claim
   - Approve all four opener variants for testing (or kill some)
   - Approve voice register for cold copy (formal-peer vs blunt-direct vs profane-where-it-fits)

---

## What NOT to redo

The temptation in a fresh session is to re-extract or re-derive. Don't.

- **Don't re-extract SME profile from the notebook.** v0.1 is populated from 21 transcripts. Refine via Learnings from real conversations, not another extraction pass.
- **Don't re-litigate the offer framing.** v0.1 (Will is the offer) is the resolved position. v0 (Konstellation sells a Diagnostic) was the wrong frame. Update v0.1 with real reply data, don't revert.
- **Don't re-derive the ICP, beachhead, disqualifiers, or titles.** All locked. Refine with reply data only.
- **Don't re-mint the Playbook row or Play Steps.** They exist. Update statuses; don't recreate.
- **Don't propose a new base for SME storage.** Liaison base `appbFsdqrC5vnxuIR` is the registry. Storage architecture decision is logged.
- **Don't re-do the methodology doc.** Cross-practice canon at `~/code/work/practices/agentic-systems/reference/sme-extraction-methodology.md`. Update only after real intake teaches a refinement.

---

## Artifacts that exist (paths)

All KAI play and SME artifacts live in `~/code/work/accounts/ventures/konstellation-ai/artifacts/`:

**KAI play artifacts (4):**
- `kai-internal-icp-titles-v0-2026-05-26.md`
- `kai-internal-trajectory-v0-2026-05-26.md`
- `kai-internal-play-medical-device-robotics-v0-2026-05-26.md`
- `kai-internal-offer-medical-device-robotics-v0-2026-05-27.md` (v0.1; reframed; the foundation for cold copy)

**Will's SME profile artifacts (11):**
- `sme-identity-will-rosellini-v0-2026-05-27.md`
- `sme-credibility-will-rosellini-v0-2026-05-27.md`
- `sme-patterns-will-rosellini-v0-2026-05-27.md`
- `sme-hot-takes-will-rosellini-v0-2026-05-27.md`
- `sme-war-stories-will-rosellini-v0-2026-05-27.md`
- `sme-network-will-rosellini-v0-2026-05-27.md`
- `sme-refusals-will-rosellini-v0-2026-05-27.md`
- `sme-voice-will-rosellini-v0-2026-05-27.md`
- `sme-hypotheses-will-rosellini-v0-2026-05-27.md`
- `sme-time-boundaries-will-rosellini-v0-2026-05-27.md`
- `sme-decision-profile-will-rosellini-v0-2026-05-27.md`

**Clay workflow:**
- `clay-workflow-medical-device-robotics-v0-2026-05-27.md` (~30-click Clay UI blueprint)

**Cross-practice canon and supporting docs:**
- `~/code/work/practices/agentic-systems/reference/sme-extraction-methodology.md`
- `~/code/work/practices/sales-and-gtm/reference/sme-storage-architecture-v0-2026-05-27.md`
- `~/code/work/practices/sales-and-gtm/skills/sme-intake-interview/SKILL.md`

---

## Recommended next move

**Option A (recommended): Draft cold copy v0.** Pulls from the offer artifact + SME Voice + Hot Takes + Identity + Credibility Map. Output: `kai-internal-copy-medical-device-robotics-v0-2026-05-27.md`. Includes:
- First-touch LinkedIn DM (the 4 opener variants from the offer artifact, each in Will's voice)
- 1-2 follow-up messages per variant
- Reply-handler talk track (what Will says when someone replies "yes")
- Voice register notes (when to be direct, when to be blunt, when to drop profanity)

After copy is drafted: route to Will via Hermes (manual for v0) for his approval asks. On approval, plug into HeyReach.

**Option B: Execute the Clay workflow.** Run the 30-click blueprint. Sanity-check 50 rows from Find Companies, then scale to 200-300 companies + Tier A enrichment. By the time copy is drafted, the Contacts table is populated and HeyReach campaign can launch immediately.

**Both can run in parallel.** Copy is Kepler's craft work; Clay is operator click-through. They converge at the HeyReach launch step.

---

## Watch-outs (mistakes that happened this past session)

1. **Path convention.** Authoritative path is `~/code/work/accounts/ventures/<venture>/`, NOT `~/code/work/ventures/<venture>/`. The old `/ventures/` tree was removed mid-session. Same for clients: `accounts/clients/<client>/`. Don't write artifacts at the old paths.
2. **The offer is Will, not Konstellation.** v0 of the offer artifact framed Konstellation as the seller and Will as a footnote. v0.1 reframed it. If a fresh session reads only the play definition (which mentions "RevOps Cluster" prominently), they may accidentally regenerate the v0 framing. The offer artifact v0.1 is the authoritative position.
3. **Hermes is notional.** The expert-liaison practice exists, the methodology exists, but the actual routing interface (Will's email, Slack channel, approval batching) is not wired. v0 means Nick manually emails Will for approvals. Don't assume Hermes will route automatically; verify with Nick.
4. **Don't quote pricing.** Will commits all numbers. Cold copy never includes dollar amounts. Per-vendor incidentals OK ("via HeyReach"); aggregate cost claims never.
5. **Don't auto-spend on providers.** Explorium credits ran out mid-session. Nick wants to use Clay credits ("a ton" available). Before switching providers, ask.
6. **Don't over-engineer the methodology layer when the work is concrete outbound.** This session drifted into 2 days of methodology-and-storage architecture before producing a single prospect. Nick caught the over-engineering. The work is: get 200-300 medical device robotics CEOs into HeyReach with Will's voice in the copy. Everything else is in service of that.
7. **Stay on target.** When asked to do X, do X. Don't pivot to recommending the next-step work mid-task. Nick has flagged this twice in feedback memory.

---

## Operational quick reference

### Key base IDs

| Base | ID | Purpose |
|---|---|---|
| RevOps Surface | `appYBYH3aOHhTODAw` | Playbook + Play Steps (engine state) |
| KAI CRM | `app5tsy6zjfA8H3rx` | Prospects + Events + Learnings (Will's working surface) |
| Liaison | `appbFsdqrC5vnxuIR` | Expert Artifacts + System Artifacts + Exchanges (lineage layer) |
| System Registry | `apppQjlZiktpbO4aX` | Systems + Assets + Roadmap (operating model) |

### Playbook record IDs (for this play)

- Playbook row: `recRndspri0mfqsCT`
- Step 1 (Lock artifacts, done): `recS6If6uLw5w2uaZ`
- Step 2 (Build company list, in-progress): `recqrJdeKUH0datBI`
- Step 3 (Enrich contacts, not-started): `reciULyUAYGG2b3Qh`
- Step 4 (Draft copy, in-progress): `reclapv0JccOEHAWc`
- Step 5 (Launch HeyReach, not-started): `recUV4Iunqhggkq5F`
- Step 6 (30 calls + Learnings, not-started): `recLUzMf6HAH9Jgvj`

### NotebookLM

- `KAI Offers` ... id `9597dc22-56db-4291-a59e-4363b700e3f6` ... 21 transcripts of Nick + Will conversations. Authoritative source for Will's voice, patterns, hot takes.

### Key paths

- Venture root: `~/code/work/accounts/ventures/konstellation-ai/`
- Venture artifacts: `~/code/work/accounts/ventures/konstellation-ai/artifacts/`
- Venture reference: `~/code/work/accounts/ventures/konstellation-ai/reference/`
- KAI venture CLAUDE.md: `~/code/work/accounts/ventures/konstellation-ai/CLAUDE.md`
- Sales-and-gtm practice CLAUDE.md (Kepler): `~/code/work/practices/sales-and-gtm/CLAUDE.md`
- Expert-liaison methodology (Hermes): `~/code/work/practices/expert-liaison/reference/methodology.md`
- SME extraction methodology (canon): `~/code/work/practices/agentic-systems/reference/sme-extraction-methodology.md`

---

## How this handoff evolves

This is a snapshot at end-of-session 2026-05-27. The next session should:

1. Read it on first message.
2. Decide whether to proceed with Option A (cold copy) or Option B (Clay execution) or both.
3. As work progresses, update the Playbook Step statuses in `appYBYH3aOHhTODAw` (the engine state IS the source of truth, not this handoff).
4. When this play closes (either successful or pivoted), this handoff gets archived and replaced with the post-mortem.

If reality contradicts anything in this handoff, the Playbook row and the artifact statuses win. This document is a launch pad, not a contract.
