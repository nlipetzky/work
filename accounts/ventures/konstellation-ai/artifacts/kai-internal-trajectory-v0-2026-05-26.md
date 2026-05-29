# KAI Internal ... Trajectory (Medical Device Robotics Play)

**Artifact type:** Trajectory (engagement-governance; sponsor-facing)
**Engagement:** KAI Internal Lead Gen ... Medical Device Robotics
**Version:** v0
**Status:** Draft (pending sponsor approval)
**Approver:** Will Rosellini (sponsor mode ... stewards scope, cadence, success and termination criteria)
**Owner:** Nick Lipetzky
**Created:** 2026-05-26
**Approved:** (pending)
**Linked artifacts:**
- Play definition: `kai-internal-play-medical-device-robotics-v0-2026-05-26.md`
- ICP titles: `kai-internal-icp-titles-v0-2026-05-26.md`
- Playbook row: RevOps Surface base `appYBYH3aOHhTODAw`, Playbook table

---

## Engagement purpose

Stand up KAI's internal AI SDR motion to put qualified medical-device-robotics conversations on Will's calendar. Run the motion as a productized play, collect Learnings against the seven Learning Questions in `reference/learning-questions.md`, and either reach the 30-call demand-signal milestone with a clear "yes" (continue, scale) or a clear "no" (pivot segment, with sponsor approval).

This is dogfood. KAI is using its own catalog (RevOps Cluster systems) to sell KAI itself.

## Phases

Phase numbers below are KAI internal Trajectory phases. The RevOps engine's A-I phases (see `practices/revops/ENGAGEMENT-PROCESS.md`) are referenced in parentheses where they map.

### Phase 1 ... Play definition and artifact lock (RevOps Phase B)

**Deliverables**
- Offer artifact (offer hypothesis already encoded in the Play definition; full offer extract artifact deferred until first 10 calls produce buyer-language signal)
- Segment criteria artifact (segment encoded in the Play definition for v0; full segment-criteria artifact deferred until v1)
- ICP titles artifact (drafted; pending expert approval)
- Sourcing rules (deferred; v0 uses Sales Navigator + standard B2B database providers per the RevOps engine defaults)
- Play definition (drafted; pending expert approval)
- Trajectory (this artifact; pending sponsor approval)
- Playbook row registered in RevOps Surface

**Dependencies:** none. Phase 1 is the gate to everything else.

**Status:** in progress (2026-05-26).

### Phase 2 ... List build (RevOps Phase C: Discovery)

**Deliverables**
- Company universe of medical-device-robotics-where-the-robot-IS-the-device, $10M-$100M revenue, North America. Pulled from provider waterfall and Sales Navigator. Deduplicated on domain.
- Per-company enrichment to Tier A titles per ICP titles artifact, with Tier B fallback when Tier A absent.

**Dependencies:** Phase 1 artifacts approved.

**Success gate:** company list of N candidate accounts (target to be set with sponsor; recommend 200-500 for first batch) with Tier A or B contact per row.

### Phase 3 ... Contact enrichment and verification (RevOps Phase F: Enrichment)

**Deliverables**
- LinkedIn URL verified for every Tier A and Tier B contact (HeyReach requires this).
- Email captured where available, but Phase 4 launches on LinkedIn first (per channel decision below).
- Contacts written to Airtable Prospects table at base `app5tsy6zjfA8H3rx`.

**Dependencies:** Phase 2 company list complete.

### Phase 4 ... LinkedIn outreach launch via HeyReach (RevOps Phase G + H)

**Deliverables**
- Outreach copy drafted (Nick drafts v0; expert-liaison routes to Will for refinement and approval)
- HeyReach sequence configured on Will's personal LinkedIn account (already active, per prior session)
- First batch sent; replies route to Will's inbox and to the Airtable Events table

**Dependencies:** Phase 3 contacts written; copy artifact approved by Will.

**Channel rationale:** LinkedIn-first because Will's personal account is already active in HeyReach and Sales Navigator is live. Email layered in once Nick completes domain warming (separate workstream; not on the Trajectory's critical path).

### Phase 5 ... Email outreach launch (RevOps Phase G + H)

**Deliverables**
- Email domain warmed (Nick owns this; runs in parallel starting Phase 1)
- Email copy drafted (separate v0 from LinkedIn; different cadence shape)
- Email sequence configured and first batch sent
- Same Events table receives email events

**Dependencies:** domain warming complete; LinkedIn motion producing reply data Will can pattern-match against.

### Phase 6 ... Conversation cadence to Will's calendar (RevOps Phase H)

**Deliverables**
- Replies and meeting bookings flow to Will's Motion calendar (booking link already in place)
- 30 calls run against the template per Will's stated target
- Each call captured in Airtable Events table; Learnings logged in Airtable Learnings table

**Dependencies:** outreach motion producing replies (Phase 4 and/or Phase 5).

**Success gate:** 30 calls complete with template; demand-signal verdict reached.

### Phase 7 ... Iteration (RevOps Phase I)

**Deliverables**
- Learnings reviewed weekly. Approved Learnings update existing artifacts (ICP titles, copy, offer hypothesis) or propose new artifacts (recurring patterns with no container).
- v1 versions of ICP titles, offer, and segment criteria produced from real conversation data.
- Decision: continue with this segment, expand to adjacent segment, or pivot.

**Dependencies:** Phase 6 calls in progress or complete.

## Success criteria

The engagement is a success if, by completion of Phase 6:

- 30 calls run with the template.
- Demand signal validated: enough conversations report the pain Will is selling against that the offer hypothesis holds.
- At least one paid client signed (any tier; Will sets the bar on commercial close).
- v1 artifacts produced for ICP titles, offer, and outreach copy from real conversation data.

The stretch target (5 clients at $5k/mo) sits beyond the demand-signal milestone and depends on close rate, which is itself a Learning to extract.

## Termination criteria

The engagement terminates or pivots (sponsor-approved) if:

- 30 calls run and the demand signal is absent (no pattern of buyers naming the pain Will is selling against in their own words).
- Outreach fails to produce reply rates that allow 30 calls within a reasonable window (sponsor and operator agree on the threshold; placeholder: if reply rate from the first 200 contacts is below 1%, treat as channel or message failure, not segment failure, and re-test before pivoting segment).
- Sponsor decides commercial focus has shifted elsewhere.

Termination is not failure. It is a decision converted to a Learning that updates the artifact taxonomy for the next play.

## Cadence

Per the delivery models doc and engagement-governance pattern:

- **Weekly meeting:** 45 minutes. Reviews what shipped, surfaces friction, aligns next batch. Will and Nick. Recurring slot to be set.
- **Weekly written update:** Friday-ish. Slot Report format. Names what shipped this week, what's next, anything Will needs to know.
- **Ad-hoc:** Slack or email for friction-clearing within reason.

Scope creep into the weekly meeting triggers a re-Diagnostic (in KAI terms) or a scope-change notification (in engagement-governance terms), not a 30-minute detour.

## Scope-change protocol

When Will (sponsor mode) requests work that does not fit this Trajectory, the response is structural:
- Name the request.
- State whether it fits the current Trajectory.
- If yes, schedule it into a phase.
- If no, propose either a Trajectory amendment (re-approval needed) or a separate play.

Pricing implications (if any) route through Will in commercial mode.

## Open design questions

Held loosely; resolve as reality demands:

- **Phase 2 batch size.** 200, 500, 1000 candidate accounts in the first list? Larger means more statistical signal; smaller means tighter feedback loop. Recommend 200-300 for v0.
- **Email warming timeline.** Nick owns; needs to feed back to the Trajectory so Phase 5 can be scheduled honestly.
- **Sub-segment within "robots that are the medical device."** Surgical, rehab, diagnostic, imaging ... if Will has strongest credibility in one sub-category, Phase 2 starts there.
- **Reply-rate floor for "channel failure" vs "segment failure."** Placeholder above. Sharpen after Phase 4.

## How this artifact evolves

- Phase status updates as the engagement runs (in-progress, complete, blocked).
- v1 of this Trajectory produced after Phase 6 demand-signal verdict.
- Termination or pivot decisions appended here as dated notes; major direction changes produce a new version (v1, v2).

## Approval

Sponsor mode. Routes through engagement-governance interface to Will. Approval format: Will replies with "approved as v0" (or proposed edits). On approval, this header's Status flips to "Approved" and the Approved date is set. The Playbook row references this Trajectory as the engagement contract.
