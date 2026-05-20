# Companies table field audit

Question being answered: **why is every empty field empty?** And: **what does it take to fill them?**

The Companies table has ~140 fields. Each field falls into one of seven categories based on what's supposed to populate it.

---

## Category A: filled by today's enrichment workflow

These get written when `Companies Enrichment` runs successfully. If they're empty on a record, that record hasn't been enriched yet.

Firmographics: Industry, Revenue Range, Country, HQ State, HQ City, Company LinkedIn URL, Employee Range, NAICS Code, Domain, Explorium Business ID, Stock Ticker, Last Enriched At, Founded Year, Parent Company, Ultimate Parent, Funding Stage, Last Funding Date, Last Funding Amount USD, Total Known Funding USD, Number of Funding Rounds, SEC CIK, Key Competitors, Company Focus, Strategic Notes, Deep Enrichment Raw.

Classification: Enrichment Status, Custom Classification, Custom Classification Source, Custom Classification Confidence, Custom Classification Detected Keywords, Classification Run ID, Gate Version, Classification Notes.

**Status:** working. The 7 records that landed `enrichment_complete` have all of these populated as of today.

---

## Category B: filled by upstream discovery workflows (CT.gov L1, L2 Classify)

Already populated on the 103 CT.gov-sourced records:

Trial Count, Most Advanced Phase, Lead Indication, Sponsor HQ Country, CT.gov NCT IDs, CT.gov Indications, Vector Evidence Clause, Discovery Sources, Discovery Confidence, Canonical Status, First Discovered, Last Verified, Verification Status, Classification Version, Classification Run Date, Rejection Reason (filled when L2 rejects).

**Status:** working for CT.gov-sourced records. Records from other sources (manual, Salesforce existing, etc.) won't have these unless those source workflows write them.

Patent Count — *should* come from a USPTO/PatentsView enrichment step. That workflow isn't built yet. Currently zero everywhere.

---

## Category C: filled by downstream workflows that don't exist yet

These fields are by design. They're targets for workflows that haven't been built.

| Field | Should be filled by | Status |
|---|---|---|
| Segment Score, Segment Version, Segment Run Date, Outreach Eligible | L3 Segment Filter workflow | Not built |
| Company Tier, Company Tier Reason, Cohort Quality Framework Version, Last Scored At, Hard Filters Pass | Cohort Quality scoring workflow | Not built |
| Active Signals Count, Most Recent Signal Type, Most Recent Signal Date, Active Signals Summary | Signal aggregator (rolls up from Company Events child table) | Not built |
| Signal Last Refreshed At, Signal Structurally Unavailable | Signal Refresh workflow | Not built |
| Suppression Flags Checked At | Suppression Refresh workflow | Not built |
| Press Mentions 12mo Count, Press Mentions Sample URLs, Conference Attendance 12mo Count | Media / event signal workflows | Not built |
| Domain Last Verified | Domain hygiene workflow | Not built |
| LinkedIn Channel Available, Phone Channel Available | Channel hygiene workflow | Not built |

**Status:** intentionally empty until those workflows are built.

---

## Category D: filled by external system syncs that aren't wired up for this play

| Field | Source system | Status |
|---|---|---|
| Salesforce Engagement, SF Account ID, SF Opp Stage, SF Has Open Opp, SF Has Closed Won, SF Sync Timestamp, Last Account-Level Contact Date | Salesforce → Airtable sync | Sync runs in another base but not flowing into Teknova Outreach (correct — Teknova's Outreach base is the target, RevOps Command is source) |
| In Cadence Count, Already Engaged Count | Outreach tool (Outreach, Apollo, HeyReach) → Airtable sync | Not wired |
| Recent Web Engagement Date (on Contacts) | Marketing platform sync | Not wired |

**Status:** waiting on integration buildout.

---

## Category E: filled manually by humans (AEs, RevOps, you)

These fields are operational controls. Nobody and nothing should auto-populate them.

| Field | Purpose | Default |
|---|---|---|
| Account Health Status | CS state of existing customer accounts | Empty for prospects |
| M&A Status | Active M&A activity preventing outreach | Empty unless flagged |
| Outbound Restricted, Outbound Restriction Reason | Legal / strategic carve-outs | Empty unless flagged |
| Stale Identity | Defunct / rebranded companies | Empty unless flagged |
| AE Cleared for Outreach, AE Cleared By, AE Cleared At | AE override of SF-has-open-opp suppression | Empty by default |
| Last BD Outcome, BD Follow-up Window Opens | Per-account BD activity tracking | Empty until BD activity logged |
| Account-Level DNC | Account-level do-not-contact | Empty unless flagged |
| Current Customer | True customer status | Empty unless set |
| Company Brief | Hand-written context | Empty by default |

**Status:** correctly empty. These are inputs from humans, not outputs from the system.

---

## Category F: legacy fields, marked or should be marked for deletion

Already tagged "- DELETE" in field descriptions, pending Phase 3/4 cleanup:

Primary Modality - DELETE, Modality Confirmed - DELETE, Existing Customer - DELETE, Signal Funding Event - DELETE, Signal Leadership Hire - DELETE, Signal IND/Stage Advance - DELETE, Signal Conference Presence - DELETE, Recent Publication - DELETE, Signal Publication - DELETE, Signal Clinical Stage Advance - DELETE, Signal Phase Transition - DELETE, Signal Office Opening / Geo Expansion - DELETE, Signal Major Partnership - DELETE, Signal Product Launch - DELETE, Signal Sources - DELETE, Funding Event Detail - DELETE, Leadership Hire Detail - DELETE, IND/Stage Advance Detail - DELETE, Conference Presence Detail - DELETE, IND/Stage Advance Date - DELETE, Funding Event Date - DELETE, Leadership Hire Date - DELETE, Conference Date - DELETE, Publication Date - DELETE, Clinical Stage Advance Date - DELETE, Phase Transition Date - DELETE, Office Opening Date - DELETE, Major Partnership Date - DELETE, Product Launch Date - DELETE, DNC Opt Out - DELETE, SF Has Open Opp - DELETE, SF Has Closed Won - DELETE, V2 Primary Modality - DELETE.

**Status:** all of these will be removed in the migration cleanup. Don't worry about them being empty — they're scheduled to die.

---

## Category G: legacy fields without "- DELETE" tag (should they be deleted?)

These are old fields that don't fit the current schema but haven't been tagged for removal. They were left over from earlier iterations.

| Field | Verdict |
|---|---|
| Play | Unused. The play is tracked in the Playbook table now. **Delete or repurpose.** |
| Clinical Stage | Superseded by Most Advanced Phase (which comes from CT.gov). **Delete.** |
| Company Type | Superseded by NAICS / Industry. **Delete.** |
| Pipeline Indication | Superseded by CT.gov Indications and Lead Indication. **Delete.** |
| Website | Superseded by Domain. **Delete (per your call earlier).** |
| Playbook Fit Score, Playbook Fit Level | Predecessor of Cohort Quality scoring. **Delete** — Company Tier is the replacement. |
| Play Eligibility Status | Predecessor of Outreach Eligible. **Delete.** |
| Exclusion Reason | Predecessor of Custom Classification + Rejection Reason. **Delete.** |
| Active Signals Summary | Can be computed from Company Events. **Delete** or convert to formula. |
| Company Status | Vague. **Delete unless you have a use for it.** |
| Development Stage | Same as Clinical Stage / Most Advanced Phase. **Delete.** |
| Research Focus | Vague free text. **Delete** unless used for manual tagging. |
| V2 Company Type | Abandoned iteration. **Delete.** |
| Fit Score | Predecessor of Cohort Quality scoring. **Delete.** |
| Company Score | Unclear source / use. **Delete unless you have a use for it.** |
| Employee Count (number) | Superseded by Employee Range. **Delete unless you have a use for the precise number.** |
| Therapeutic Modality | This IS useful (separate from delivery vector). For AAV play it's redundant with Custom Classification, but for other plays it's distinct. **Keep, populate from CT.gov data.** |
| Delivery Vehicle | This IS useful — AAV here = in-scope for reagent play. **Keep, populate from CT.gov data + classification result.** |
| Sub-Vertical | Useful free-text refinement. **Keep, populate manually or from Explorium tags.** |
| Subsidiary Status | Could be auto-computed from Parent Company presence. **Keep, populate via formula or Enrich Deep extract.** |
| Founded Year | Now populating from Deep Enrichment. **Keep.** |

---

## What's truly empty for the wrong reasons (vs. by design)

Stripping out legacy/delete fields and downstream-workflow fields, the **real gaps** are:

1. **Therapeutic Modality, Delivery Vehicle** — should be populated from CT.gov data + classification result. Both already exist as singleSelect fields. Just needs a small workflow change to write them.
2. **Sub-Vertical** — Explorium has tags / categories that could fill this. Not currently captured.
3. **Subsidiary Status** — derivable from Parent Company. Could be auto-set.
4. **Patent Count** — needs a PatentsView/USPTO enrichment step. Not built.
5. **Publicly Traded** — can be auto-derived from Stock Ticker presence. Not currently set.

Everything else empty is either: (a) waiting on a downstream workflow that needs to be built, (b) waiting on a human, (c) waiting on a system sync, or (d) a legacy field that should be deleted.

---

## Path to a fully enriched database

In order of effort vs. value:

### Cheap wins (this session or next)

1. **Populate Therapeutic Modality + Delivery Vehicle** on AAV-confirmed records. Modality = `gene_therapy`, Delivery Vehicle = `aav`. One-line edits to the Map Enriched Fields node.
2. **Populate Publicly Traded** as `yes` when Stock Ticker is present. Same place.
3. **Populate Subsidiary Status** as `subsidiary` when Parent Company is present, else `independent`. Same place.
4. **Delete the ~32 legacy fields** above (Phase 3/4 cleanup work).

### Medium lift (separate session, separate workflow)

5. **Build L3 Segment Filter workflow.** Reads classification rules, scores against Custom Classification + CT.gov data + Cohort Quality framework signals, writes Segment Score, Outreach Eligible.
6. **Build Cohort Quality scoring workflow.** Reads firmographics + signals + suppression flags, writes Company Tier, Company Tier Reason, Hard Filters Pass.
7. **Build Signal aggregator.** Rolls up Company Events into Active Signals Count / Most Recent Signal Type / Most Recent Signal Date.

### Heavy lift (later)

8. **Salesforce sync** for SF Account ID, SF Opp Stage, Last Account-Level Contact Date.
9. **Outreach tool sync** for In Cadence Count, Already Engaged Count.
10. **PatentsView enrichment** for Patent Count.
11. **Media / press tracking** for Press Mentions counts.

### Operational, no workflow needed

12. **AE-facing fields** (AE Cleared, M&A Status, Account Health, BD outcomes) — fill manually as the engagement runs.
