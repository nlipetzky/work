# AUDIT — Companies Field Provenance (v1)

**Date:** 2026-05-19. **Method:** programmatic cross-reference of Companies (`tblnj3YlOI3thjrXp`) field schema vs. fields actually written by deployed n8n workflows. **Scope:** name-filtered candidate workflows (filter keywords: aav/discov/classif/cohort/source/contact/sync/supabase/enrich/revops/gate/companies/target/segment/L1/L2/L3/taskb/perplexity/trade/canonical) — Companies-specific workflows; broader scan of all 200 deferred to v2 if needed.

## Headline

- Total Companies fields: **135**
- `working` (≥1 deployed workflow writes it): **41**
- `computed` (auto-populated, no writer needed): **1**
- `not_written` (orphan / manual-only — no current deployed-workflow writer): **93**

⚠ Field names in workflow writes that do NOT match the Companies schema (drift/rename/typo): `DNC Opt Out, Last Contacted Date, id`

## Workflows that write to Companies

- **Canonical AAV Discovery - L1 ClinicalTrials.gov** (`9gcmEjq1lvOY2jZS`, active=False): `Upsert Company` op=upsert writes=29
- **Canonical AAV Discovery - L2 Classify** (`76fIhtHR2mCYeMl4`, active=False): `Update Company` op=upsert writes=7
- **Canonical AAV Discovery - L2 Classify** (`81WjlQxAhiGsMLxT`, active=False): `Update Company` op=upsert writes=7
- **Canonical AAV Discovery - L2 Classify dupe** (`HUpkdwNTBcDutT8o`, active=False): `Update Company` op=upsert writes=7
- **Companies Enrichment (Explorium → Airtable)** (`U6DohwIWkv47mMoZ`, active=False): `Update Company Record` op=update writes=0
- **Companies Enrichment (Explorium → Airtable)** (`Z6RROKx5omdfvhtn`, active=False): `Update Enriched Record` op=update writes=1; `Update Rerouted` op=update writes=1; `Update Archived` op=update writes=1
- **Companies Enrichment via agent (Explorium → Airtable)** (`LqYwYcastjKq0IJ5`, active=False): `Update Company Record` op=update writes=0
- **Companies Enrichment via agent 2 (Explorium → Airtable)** (`EDvAvXxo7ilAmUCY`, active=False): `Update Company Record` op=update writes=0
- **Supabase RevOps -> AT Surface** (`DX4pEWGoSOZy8y3n`, active=False): `Update RevOps Companies` op=update writes=9

## `not_written` fields (the orphan / manual candidates — review for retirement)

- `AAV Segment` (singleSelect)
- `Account Health Status` (singleSelect) — Customer-success state of the account. Backs the company-level suppression check for accounts in active churn save or red CS status.
- `Account-Level DNC` (checkbox) — Account-level do-not-contact (distinct from per-contact DNC). True = excluded from cohort outright.
- `Active Signals Summary` (singleLineText)
- `AE Cleared At` (date) — When the AE clearance was granted. Companion to AE Cleared for Outreach.
- `AE Cleared By` (singleLineText) — Name of the AE who cleared the account for outreach. Companion to AE Cleared for Outreach.
- `AE Cleared for Outreach` (checkbox) — Conditional override on SF Has Open Opp suppression. True = AE has cleared this account for multi-thread outreach.
- `BD Follow-up Window Opens` (date) — When the polite-no follow-up window opens. Suppress until this date. Companion to Last BD Outcome.
- `Classification Run ID` (singleLineText)
- `Clinical Stage` (singleLineText)
- `Cohort Quality Framework Version` (singleLineText) — Version of the Cohort Quality framework used to score this row (e.g., '2026-05-13').
- `Company Events` (multipleRecordLinks)
- `Company Focus` (multilineText) — Strategic focus narrative per Explorium. Useful for outreach personalization.
- `Company LinkedIn URL` (singleLineText)
- `Company Status` (singleLineText)
- `Company Tier` (singleSelect) — Phase D output. Company-scope tier per the Cohort Quality framework. Composes with Contact Tier into the cohort tier (lower of two).
- `Company Tier Reason` (singleLineText) — Which dimension scores produced the Company Tier. Short prose for audit, e.g. 'Tier B: HQ location stale > 60 days; signal partial'.
- `Company Type` (singleLineText)
- `Contacts` (multipleRecordLinks)
- `Currency Checked At` (date) — Date L2 computed Currency Status. Backs freshness.
- `Currency Evidence` (multilineText) — Plain-language proof for Currency Status: the NCT carrying the verdict, its overall status, its start/last-update date, and why. Client-presentable. Written by
- `Currency Status` (singleSelect) — Deterministic CT.gov currency verdict (Phase 1). current = a modality-passing trial is live/recent and not terminated. discontinued = the modality-passing trial
- `Current Customer` (checkbox) — Per the Cohort Quality framework's company-level absolute suppression check. True = the account is a current customer of the client; excluded from cohort outrig
- `Custom Classification` (singleLineText) — Per-play classification result (universal vocabulary). For biotech plays the value might be 'aav', 'lentiviral', 'small_molecule', etc.; for SaaS plays it might
- `Custom Classification Confidence` (singleLineText) — Confidence level for the Custom Classification: high / medium / low. Renamed from Modality Confidence on 2026-05-13.
- `Custom Classification Detected Keywords` (multilineText) — Literal strings matched during the per-play classification. JSON array or pipe-separated list. Audit trail. Renamed from Detected Keywords on 2026-05-13.
- `Custom Classification Source` (singleLineText) — URL or tool identifier where the Custom Classification was derived. Format: '<tool>:<sub_signal>' or a URL. Audit trail for the per-play classification. Renamed
- `Deep Enrichment Raw` (multilineText) — Full JSON blob from Explorium Enrich Deep response. Preserves all 210 fields for downstream extraction. Truncated to 95KB if needed.
- `Delivery Vehicle` (singleSelect) — How the therapy gets delivered. AAV here = in scope for reagent play.
- `Development Stage` (singleLineText)
- `Domain` (url)
- `Domain Last Verified` (date) — When we last confirmed the domain resolves to the company's canonical site. Backs hygiene freshness for the Domain Canonical check.
- `Ellie Note` (multilineText)
- `Ellie Reviewed At` (date)
- `Ellie Segment Override` (singleSelect)
- `Employee Range` (singleLineText)
- `Enrichment Status` (singleSelect)
- `Exclusion Reason` (singleLineText)
- `Explorium Business ID` (singleLineText)
- `Funding Stage` (singleLineText)
- `Gate Version` (singleLineText)
- `Hard Filters Pass` (checkbox) — True if the company cleared every hard filter in the play's segment criteria. Set by the gate workflow.
- `HQ City` (singleLineText)
- `HQ Country` (singleLineText)
- `HQ State` (singleLineText)
- `Industry` (singleLineText)
- `Key Competitors` (multilineText) — List of competitor companies per Explorium. One per line. Capped at top 20.
- `Last Account-Level Contact Date` (date) — Most recent date ANY contact at this account was touched (per Salesforce sync or outreach tool sync). Distinct from per-contact BD activity on the Contacts tabl
- `Last BD Outcome` (singleSelect) — Outcome of the most recent BD activity at the account. Drives the three-state conditional on recent BD activity suppression.
- `Last Funding Date` (date) — Date of the most recent funding round per Explorium.
- `Last Scored At` (dateTime) — When the Cohort Quality scoring last ran on this record. Distinct from Last Enriched At (which tracks data freshness).
- `LinkedIn Channel Available` (checkbox) — Whether the company has an active LinkedIn presence with discoverable employees. False = LinkedIn channel not viable at this account.
- `M&A Status` (singleSelect) — Whether the account is in a merger/acquisition/divestiture with outbound restrictions. Backs the company-level absolute suppression check.
- `Most Recent Signal Date` (date) — Date of the most recent in-window Company Event for this company. Written by the gate workflow.
- `Most Recent Signal Type` (singleSelect) — Event type of the most recent in-window Company Event for this company. Written by the gate workflow.
- `NAICS Code` (singleLineText)
- `Outbound Restricted` (checkbox) — Generic top-down outbound restriction flag (legal, client carve-out, etc.) separate from DNC. True = excluded from cohort.
- `Outbound Restriction Reason` (singleLineText) — Why Outbound Restricted is true. Free text for audit.
- `Outreach Eligible` (checkbox) — Final L3 output: this company is ready for outreach cadence
- `Parent Company` (singleLineText) — Parent company name if this is a subsidiary or division. Free text.
- `Phone Channel Available` (checkbox) — Whether corporate phone is reachable without gating. False = phone channel not viable at this account.
- `Pipeline Indication` (singleLineText)
- `Play` (singleLineText)
- `Play Eligibility Status` (singleLineText)
- `Playbook Fit Level` (singleLineText)
- `Press Mentions Sample URLs` (multilineText) — Sample URLs for press mentions counted. One URL per line. Audit trail for the structural-signal-unavailability test.
- `Publicly Traded` (singleSelect) — Public-trading status. Input to the structural-signal-unavailability test.
- `Research Focus` (singleLineText)
- `Revenue Range` (singleLineText)
- `Run Selected` (checkbox) — Selective-run gate (RevOps-engine protocol, practices/agentic-systems/reference/revops-engine-selective-run-protocol.md). If ANY row has this checked, an engine
- `SEC CIK` (singleLineText) — SEC EDGAR Central Index Key. Public companies only.
- `Segment Run Date` (dateTime) — When L3 filter last ran on this record
- `Segment Version` (singleLineText) — Version of segment criteria doc used for L3 scoring
- `SF Account Ownership` (singleLineText)
- `SF Account Status Summary` (richText)
- `SF Has Closed Won` (checkbox) — True if Salesforce shows a Closed Won opportunity at this account. Per the Cohort Quality framework's absolute suppression check. Migrated from text field on 20
- `SF Sync Timestamp` (dateTime) — When this record's Salesforce fields (SF Account ID, SF Opp Stage, SF Has Open Opp, SF Has Closed Won, Salesforce Engagement, Last Account-Level Contact Date) w
- `Signal Last Refreshed At` (dateTime) — When the signal apparatus was last re-checked for this company. Backs signal-freshness ops.
- `Signal Structurally Unavailable` (checkbox) — Output of the operational test. True = the six AND conditions all returned null; contacts at this company can sort into Tier A on fit alone.
- `Sponsor HQ Country` (singleLineText) — Enriched sponsor headquarters country. Not trial-site geography.
- `Stale Identity` (checkbox) — The entity is defunct, rebranded into a different successor, or otherwise no longer trading under this identity. True = excluded from cohort.
- `Stock Ticker` (singleLineText)
- `Strategic Notes` (multilineText) — Consolidated narratives from Explorium: competition dynamics, market saturation, customer adoption barriers.
- `Sub-Vertical` (singleLineText) — Free-text vertical refinement beyond NAICS (e.g., 'developer tools', 'gene therapy CDMO', 'beverage CPG').
- `Subsidiary Status` (singleSelect) — Whether this company operates independently or as a subsidiary/division of a parent.
- `Suppression Flags Checked At` (dateTime) — When the company-level suppression flags were last refreshed. Backs the 7-day freshness rule on suppression.
- `Therapeutic Modality` (singleSelect) — What the product does therapeutically. Separate from delivery vehicle.
- `Ultimate Parent` (singleLineText) — Top-level parent company name per Explorium hierarchy. Distinct from immediate Parent Company.
- `V2 Company Type` (singleLineText)
- `Verification Checked At` (date) — Date the independent ground-truth verification was performed. Backs freshness on the Verification Verdict.
- `Verification Evidence` (multilineText) — Plain-language proof behind the Verification Verdict, client-presentable. Cites the actual source record (NCT ID + trial title + intervention) and states why th
- `Verification Verdict` (singleSelect) — Independent ground-truth check of L2's classification against the actual source record (e.g. the cited clinicaltrials.gov trial). Play-agnostic: the subject is
- `Website` (singleLineText)

## `working` fields

- `Active Recruiting` (checkbox) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Active Signals Count` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Already Engaged Count` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Canonical Status` (singleSelect) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Classification Notes` (multilineText) ← Canonical AAV Discovery - L2 Classify + Canonical AAV Discovery - L2 Classify dupe
- `Classification Run Date` (dateTime) ← Canonical AAV Discovery - L2 Classify + Canonical AAV Discovery - L2 Classify dupe
- `Classification Version` (singleLineText) ← Canonical AAV Discovery - L2 Classify + Canonical AAV Discovery - L2 Classify dupe
- `Company Brief` (multilineText) ← Supabase RevOps -> AT Surface
- `Company Name` (singleLineText) ← Canonical AAV Discovery - L1 ClinicalTrials.gov + Canonical AAV Discovery - L2 Classify + Canonical AAV Discovery - L2 Classify dupe
- `Company Score` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Conference Attendance 12mo Count` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `CT.gov Indications` (multilineText) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `CT.gov NCT IDs` (multilineText) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Discovery Confidence` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Discovery Sources` (multipleSelects) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Employee Count` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `First Discovered` (date) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Fit Score` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Founded Year` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `In Cadence Count` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Last Enriched At` (dateTime) ← Supabase RevOps -> AT Surface
- `Last Funding Amount USD` (currency) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Last Verified` (date) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Lead Indication` (singleLineText) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Most Advanced Phase` (singleSelect) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Most Recent Trial Date` (date) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Number of Funding Rounds` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Patent Count` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Playbook Fit Score` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Press Mentions 12mo Count` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Rejection Reason` (singleLineText) ← Canonical AAV Discovery - L2 Classify + Canonical AAV Discovery - L2 Classify dupe
- `Salesforce Engagement` (multilineText) ← Supabase RevOps -> AT Surface
- `Segment Score` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `SF Account ID` (singleLineText) ← Supabase RevOps -> AT Surface
- `SF Has Open Opp` (checkbox) ← Supabase RevOps -> AT Surface
- `SF Opp Stage` (singleLineText) ← Supabase RevOps -> AT Surface
- `Supabase ID` (singleLineText) ← Supabase RevOps -> AT Surface
- `Total Known Funding USD` (currency) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Trial Count` (number) ← Canonical AAV Discovery - L1 ClinicalTrials.gov
- `Vector Evidence Clause` (singleSelect) ← Canonical AAV Discovery - L2 Classify + Canonical AAV Discovery - L2 Classify dupe
- `Verification Status` (singleSelect) ← Canonical AAV Discovery - L1 ClinicalTrials.gov + Canonical AAV Discovery - L2 Classify + Canonical AAV Discovery - L2 Classify dupe

## `computed` fields (auto, no writer expected)

- `Last modified time ` (lastModifiedTime)