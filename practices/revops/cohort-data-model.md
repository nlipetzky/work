# Cohort Data Model
## The schema behind every RevOps engagement

**Nick Lipetzky · Konstellation AI**
**Locked:** 2026-05-13
**Tables live in:** Airtable base `appYBYH3aOHhTODAw` (RevOps Surface)

---

## What this is

This document is the locked schema for the two tables (and one child table) that every RevOps engagement produces. The schema is universal across verticals, multichannel-capable for contacts, and scored against the Cohort Quality framework (`practices/revops/cohort-quality-framework.md`).

The schema is the contract. Process docs, workflows, and skills are built around it; not the other way around.

## Design decisions, locked

| Decision | Choice |
|---|---|
| Vertical scope | Universal. Vertical-specific classification fits into generic `Custom Classification` fields driven per-play by the segment criteria. |
| Channel scope | Multichannel parity for email and LinkedIn. Phone supported but optional. Each channel carries its own hygiene, suppression, and tier fields. |
| Intent data | Reserved structure; no committed source. Populated when a play needs it. |
| Public vs private | Uniform schema with a `Publicly Traded` flag that drives signal-collector behavior. |
| Industry classification | NAICS canonical. Industry text is a derived display alongside NAICS. |
| Tenure granularity on contacts | Three flavors stored: in-role, at-company, in-function. |
| Signals storage | Normalized child table (`Company Events`), linked to Companies. Companies row carries rollup summary only. |
| Salesforce-sync field types | Native booleans/checkboxes on Airtable side. Sync workflow updated to write proper types (Option B). |
| Biotech-specific fields | Preserved on Companies for now (Teknova data lives there). Marked for future migration to a Teknova play-extension table. |

---

## Companies table (universal, 60 fields)

Table ID: `tblnj3YlOI3thjrXp`. Six functional groups.

### Group 1 — Identity (14 fields)

Who is this company.

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Company Name | text (primary) | Explorium match, verified via Exa fetch | Canonical |
| Domain | url | Discovery + DNS resolution | Lowercased, no www, no protocol |
| Domain Last Verified | date | system | When the domain was last confirmed canonical |
| Explorium Business ID | text | Explorium match-business | Pivot key for all Explorium calls |
| Company LinkedIn URL | url | Explorium firmographics / Apify | LinkedIn pivot |
| HQ Country | text | Explorium firmographics | |
| HQ State / Region | text | Explorium firmographics | |
| HQ City | text | Explorium firmographics | |
| Founded Year | number | Explorium / Crunchbase | Age signal |
| Operational Status | singleSelect | Manual / Perplexity / news | active / acquired / defunct / parked / stealth / unknown |
| Stale Identity | checkbox | derived from Operational Status | Per Cohort Quality suppression check |
| Parent Company | text | Perplexity / Exa research | Subsidiary detection |
| Subsidiary Status | singleSelect | derived | independent / subsidiary / division |
| Publicly Traded | singleSelect | Explorium / SEC / Crunchbase | private / public-domestic / public-foreign / private-with-public-parent / unknown |

### Group 2 — Classification (7 fields)

What kind of company. Universal, not play-specific.

| Field | Type | Primary source | Notes |
|---|---|---|---|
| NAICS Code | text | Explorium firmographics | Canonical industry code |
| Industry | text | Explorium firmographics | NAICS description; display alias |
| Sub-Vertical | text | Manual / Perplexity | Free-text vertical refinement |
| Employee Count Exact | number | Explorium / Apify LinkedIn | When known precisely |
| Employee Range | text | Explorium firmographics | Headcount band |
| Revenue Range | text | Explorium firmographics | Revenue band |
| Funding Stage | text | Explorium / Crunchbase | seed / Series A / B / ... / public |

### Group 3 — Targeting fit (12 fields)

Per-play classification results. Universal field structure; play-specific values.

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Play | text | system | Which play this row was evaluated against |
| Hard Filters Pass | checkbox | system | All segment hard filters cleared |
| Disqualifiers Hit | multilineText | system | Which disqualifiers triggered |
| Custom Classification | singleSelect | system | Per-play vocabulary from segment criteria (e.g., `aav`, `lentiviral`, `shopify`, `salesforce`, etc.) |
| Custom Classification Source | text | system | URL + tool that produced the classification |
| Custom Classification Confidence | singleSelect | system | high / medium / low |
| Custom Classification Detected Keywords | multilineText | system | Literal strings matched |
| Classification Notes | multilineText | system | Structured narrative for human audit |
| Classification Run ID | text | system | Unique per gate execution |
| Classification Version | text | system | Semver of classification ruleset |
| Classification Run Date | dateTime | system | When the classification last ran |
| Enrichment Status | singleSelect | system | Five-bucket gate output |

### Group 4 — Signals (8 fields on row; full events in child table)

The Companies row carries summary; per-event detail lives in `Company Events`.

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Active Signals Count | rollup from Company Events | system | Count of linked events within window |
| Most Recent Signal Type | lookup from Company Events | system | Latest event type |
| Most Recent Signal Date | lookup from Company Events | system | Latest event date |
| Signal Last Refreshed At | dateTime | system | When the signal apparatus last ran |
| Signal Structurally Unavailable | checkbox | system | Output of the operational test |
| Press Mentions 12mo Count | number | Perplexity / news API | Input to the test |
| Press Mentions Sample URLs | multilineText | system | Audit trail |
| Conference Attendance 12mo Count | number | Exa / Apify | Backward-looking conference count |

### Group 5 — Suppression (14 fields)

Whether we can approach the account.

**Absolute (any failure excludes from cohort):**

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Current Customer | checkbox | Salesforce sync | |
| Active Inbound Conversation | checkbox | Salesforce sync / marketing automation | Reply-in-progress, demo scheduled, active MQL |
| Account Health Status | singleSelect | Salesforce sync / CS platform | healthy / at-risk / churn-save-active / churn-confirmed / unknown |
| M&A Status | singleSelect | Manual / news | none / in-acquisition / in-divestiture / recently-closed / unknown |
| Account-Level DNC | checkbox | Manual / client-provided list | Account-level suppression |
| Outbound Restricted | checkbox | Manual | Legal or client-imposed restriction |
| Outbound Restriction Reason | text | Manual | Audit |

**Conditional (record stays only if condition clears):**

| Field | Type | Primary source | Notes |
|---|---|---|---|
| SF Has Open Opp | checkbox | Salesforce sync | |
| SF Opp Stage | text | Salesforce sync | |
| AE Cleared for Outreach | checkbox | Manual | Override when SF Has Open Opp |
| AE Cleared By | text | Manual | Audit |
| AE Cleared At | date | Manual | Audit |

**Account-level BD freshness:**

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Last Account-Level Contact Date | date | Salesforce sync / outreach tool | When ANY contact at the account was last touched |
| Suppression Flags Checked At | dateTime | system | Backs the 7-day suppression freshness rule |

### Group 6 — Scoring + Provenance (8 fields)

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Company Tier | singleSelect | system | A / B / C / excluded / not-tiered |
| Company Tier Reason | text | system | Short prose explaining tier |
| Cohort Quality Framework Version | text | system | Which framework version scored this row |
| Last Enriched At | dateTime | system | Overall freshness pointer |
| Last Scored At | dateTime | system | When scoring last ran |
| Discovery Sources | multipleSelects | system | Which providers surfaced this company |
| Discovery Confidence | number | system | Count of confirming sources |
| First Discovered | date | system | When the company first appeared |

---

## Company Events child table (new, 7 fields)

Table to be created. Linked to Companies. One row per signal event.

| Field | Type | Notes |
|---|---|---|
| Company | linked record (to Companies, `tblnj3YlOI3thjrXp`) | Required |
| Event Type | singleSelect | funding / leadership_hire / m&a / partnership / product_launch / office_opening / conference / hiring_spike / earnings / regulatory / clinical_stage_advance / patent / publication / press_mention |
| Event Date | date | When the event happened (forward-looking for conferences) |
| Detail | multilineText | Short narrative |
| Source URL | url | Where we learned this |
| Provider | singleSelect | Explorium / Crunchbase / Perplexity / Exa / Apify / SEC / clinicaltrials.gov / PubMed / Manual |
| Within Window | formula | Compares Event Date against the Cohort Quality framework's recency window for the Event Type |

The `Within Window` formula references the framework's recency windows:
- funding, m&a, partnership, product_launch, earnings: 90 days
- leadership_hire, promotion: 90 days
- office_opening: 120 days
- regulatory, clinical_stage_advance: 180 days
- conference: forward-looking 90 days
- press_mention: 30 days
- patent, publication: per play (default 365 days)

---

## Contacts table (universal multichannel, 50 fields)

Table ID: `tblWJksRL1yKSUgrm`. Six functional groups.

### Group 1 — Identity (5 fields)

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Full Name | text (primary) | Explorium | |
| First Name | text | Explorium | |
| Last Name | text | Explorium | |
| LinkedIn URL | url | Explorium | Identity pivot |
| Country / State | text | Explorium | Location |

### Group 2 — Reachability (multichannel, 11 fields)

**Email channel:**

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Email | email | Explorium → Hunter waterfall | |
| Email Verified Status | singleSelect | Hunter email-verifier | verified / catch-all / unverifiable / invalid |
| Email Identity Confirmed | checkbox | Hunter + logic | Not catch-all, not role account |
| Email Provider Source | singleSelect | system | Which provider supplied the email |
| Email Confidence | number | Hunter | Hunter confidence score |

**LinkedIn channel:**

| Field | Type | Primary source | Notes |
|---|---|---|---|
| LinkedIn URL Valid | checkbox | Apify LinkedIn check | URL resolves to a real profile |
| LinkedIn Active Profile | checkbox | Apify | Profile shows activity within 90 days |
| LinkedIn Last Active | date | Apify | Most recent post or activity date |
| LinkedIn Connection Possible | checkbox | manual / Apify | InMail-able or 2nd-degree |

**Phone channel:**

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Mobile Phone | phone | Explorium enrich-prospects (contacts) | |
| Phone Verified | checkbox | Manual / phone-verify provider | |

### Group 3 — Role context (9 fields)

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Company | linked record (to Companies) | system | Account this person works at |
| Title | text | Explorium | |
| Function | singleSelect | derived from title | marketing / sales / engineering / finance / operations / executive / etc. |
| Seniority | singleSelect | derived from title | IC / manager / director / VP / C-level |
| Tenure in Role (months) | number | Explorium / Apify | Months in current titled role |
| Tenure at Company (months) | number | Explorium / Apify | Months at current employer |
| Tenure in Function (months) | number | Explorium / Apify | Months in buyer function, including in-company promotions |
| Employer Match Confirmed | checkbox | Explorium events + profile match | Still works at the named company |
| Role Status | singleSelect | derived | active / recent_change / open_to_work / unknown |

### Group 4 — Per-contact Signal (5 fields)

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Recent Role Change Date | date | Explorium events (prospect_changed_role) | |
| Recent Promotion Date | date | Explorium events | |
| Recent Publication | multilineText | PubMed / Perplexity | Date + URL |
| Most Recent LinkedIn Post | multilineText | Explorium / Apify | Date + topic + URL |
| Recent Web Engagement Date | date | Client tracking platform | Optional; populated only when client provides tracking data |

### Group 5 — Suppression (9 fields)

Contact-level. Account-level suppression inherits from the linked Companies row.

| Field | Type | Primary source | Notes |
|---|---|---|---|
| DNC / Opt-Out (Email) | checkbox | Salesforce sync / sender platform | |
| Email Hard-Bounced | checkbox | Sender platform | |
| Email Active Cadence Elsewhere | checkbox | Outreach tool sync | In another platform on email |
| LinkedIn DNC | checkbox | Manual / LinkedIn signal | |
| LinkedIn Active Cadence Elsewhere | checkbox | HeyReach sync (or equivalent) | |
| Phone DNC | checkbox | Manual / TCPA list | |
| Last Per-Contact BD Outcome | singleSelect | Salesforce sync / outreach tool | no-reply / polite-no-window / polite-no-permanent / interest-no-followup / declined-final / none |
| Per-Contact BD Follow-up Window Opens | date | Salesforce / outreach tool | When the polite-no window opens |
| Suppression Flags Checked At | dateTime | system | 7-day freshness |

### Group 6 — Scoring + Provenance (11 fields)

Multichannel tier with per-channel scoring.

| Field | Type | Primary source | Notes |
|---|---|---|---|
| Email Tier | singleSelect | system | A / B / C / excluded |
| Email Tier Reason | text | system | |
| LinkedIn Tier | singleSelect | system | A / B / C / excluded |
| LinkedIn Tier Reason | text | system | |
| Phone Tier | singleSelect | system | A / B / C / excluded / unused |
| Phone Tier Reason | text | system | |
| Cohort Tier | singleSelect | system | min(Company Tier, primary-channel Contact Tier); primary channel set per play |
| Cohort Tier Reason | text | system | |
| Cohort Quality Framework Version | text | system | |
| Last Enriched At | dateTime | system | |
| Source Confirmation Count | number | system | Multi-source confirmation lift attribute |

---

## Existing-field disposition

What happens to each of the 96+ fields currently in the Companies table and 39 in the Contacts table.

### Companies — KEEP (no change)

Most fields keep both name and purpose. The 36 fields added on 2026-05-13 all stay.

### Companies — RENAME (data preserved, name + description updated)

| Current name | New name | Reason |
|---|---|---|
| `Modality` | `Custom Classification` | Universal vocabulary |
| `Modality Source` | `Custom Classification Source` | |
| `Modality Confidence` | `Custom Classification Confidence` | |
| `Detected Keywords` | `Custom Classification Detected Keywords` | |
| `Last Contacted Date` | `Last Account-Level Contact Date` | Disambiguate from per-contact freshness |

### Companies — ADD (new fields in the locked schema not yet in Airtable)

Founded Year, Parent Company, Subsidiary Status, Sub-Vertical, Employee Count Exact (already exists as `Employee Count`; keep), Hard Filters Pass, Active Signals Count (rollup, after Company Events exists), Most Recent Signal Type (lookup), Most Recent Signal Date (lookup), Account-Level DNC, Last Scored At, Cohort Quality Framework Version.

### Companies — DEPRECATE (mark in description, keep for backward compat, stop using for new plays)

| Field | Reason |
|---|---|
| `Primary Modality` | Legacy taxonomy; superseded by Custom Classification |
| `V2 Primary Modality` | Abandoned iteration |
| `Modality Confirmed` | Redundant with Enrichment Status |
| `Segment Score`, `Segment Version`, `Segment Run Date`, `Outreach Eligible` | Replaced by Company Tier in the unified scoring model |
| `Verification Status` | Replaced by Company Tier; consider keeping if the L2 layer is still wanted as a separate stage |
| `Vector Evidence Clause`, `Verification Status`, `Rejection Reason`, `Canonical Status`, `Most Advanced Phase`, `CT.gov NCT IDs`, `CT.gov Indications`, `Trial Count`, `Patent Count`, `Lead Indication`, `Therapeutic Modality`, `Delivery Vehicle`, `Sponsor HQ Country` | Biotech-specific. Stay for Teknova, migrate to a Teknova play-extension table in a future phase. |

### Companies — TYPE CHANGE (text → checkbox, Salesforce sync update required)

| Field | Migration |
|---|---|
| `Existing Customer` (text) | → checkbox. Zero data populated; safe to drop and recreate. |
| `Modality Confirmed` | → drop (deprecated). |
| `Signal: Funding Event`, `Signal: Leadership Hire`, `Signal: IND/Stage Advance`, `Signal: Conference Presence`, `Signal: Publication`, `Signal: Clinical Stage Advance`, `Signal: Phase Transition` | All seven migrate into Company Events rows (one row per fired signal). Drop the text flag fields after migration. The date fields added today (Funding Event Date, etc.) also migrate into Company Events. |
| `SF Has Open Opp`, `SF Has Closed Won`, `DNC Opt Out` | → checkbox. Salesforce sync update required (Option B). |

### Contacts — KEEP

Full Name, First Name, Last Name, Email, Title, Company Name, Company Domain, Play, Seniority, Function, Enrichment Status, Last Enriched At, Supabase ID, LinkedIn URL, SF Contact ID, SF Entity Type, State/Region, Country, Email Confidence, LinkedIn Headline, Mobile Phone.

### Contacts — RENAME

| Current name | New name | Reason |
|---|---|---|
| `Email Verified` (text) | `Email Verified Status` (singleSelect: verified / catch-all / unverifiable / invalid) | Type promotion + clarification |
| `Employment Status` | `Role Status` | Match framework terminology |
| `Tenure Years` (number) | `Tenure in Role (months)` | Switch unit to months; add the other two tenure flavors as new fields |

### Contacts — ADD (~30 new fields)

Company (linked record), Email Identity Confirmed, Email Provider Source, LinkedIn URL Valid, LinkedIn Active Profile, LinkedIn Last Active, LinkedIn Connection Possible, Phone Verified, Tenure at Company (months), Tenure in Function (months), Employer Match Confirmed, Recent Role Change Date, Recent Promotion Date, Recent Publication, Most Recent LinkedIn Post, Recent Web Engagement Date, LinkedIn DNC, LinkedIn Active Cadence Elsewhere, Phone DNC, Last Per-Contact BD Outcome, Per-Contact BD Follow-up Window Opens, Suppression Flags Checked At, Email Tier, Email Tier Reason, LinkedIn Tier, LinkedIn Tier Reason, Phone Tier, Phone Tier Reason, Cohort Tier, Cohort Tier Reason, Cohort Quality Framework Version, Source Confirmation Count.

### Contacts — TYPE CHANGE (text → checkbox)

| Field | Migration |
|---|---|
| `Opt Out`, `Active Cadence`, `Do Not Contact`, `Email Opt Out`, `Hard Bounced` | All migrate to per-channel checkbox fields. Salesforce/outreach-tool sync update required. |

### Contacts — DEPRECATE

`Contact Score`, `Fit Score`, `ICP Score`, `DMU Tier`, `Gate Level`, `Signal Score`, `Seniority Level` (duplicate of Seniority), `Delivery Path`, `Contact Modality`, `Known Status`. All replaced by the unified tier scoring or unused.

---

## Migration plan — 7 phases

Each phase is one work item. Phases 1-2 are non-destructive and can run today. Phases 3-5 require workflow code changes. Phases 6-7 are cleanup once the migration is verified.

### Phase 1 — Additive (no data risk)

1. Create the **Company Events** child table (7 fields).
2. Add new Companies fields: Parent Company, Subsidiary Status, Founded Year, Sub-Vertical, Hard Filters Pass, Account-Level DNC, Last Scored At, Cohort Quality Framework Version.
3. Add Companies rollup/lookup fields (Active Signals Count, Most Recent Signal Type, Most Recent Signal Date) — depend on Company Events existing.
4. Add ~30 new Contacts fields.

**Status before Phase 1:** the framework cannot fully score the cohort.
**Status after Phase 1:** schema is in place; backfill and workflow updates still needed.

### Phase 2 — Renames (preserve data, no consumer breakage if consumers updated together)

1. Companies: Modality → Custom Classification (and three siblings); Last Contacted Date → Last Account-Level Contact Date.
2. Contacts: Employment Status → Role Status; Tenure Years → Tenure in Role (months).
3. Update n8n workflow `Z6RROKx5omdfvhtn` to write to new field names.
4. Update SF sync to write to renamed fields where applicable.

### Phase 3 — Salesforce sync: text-to-checkbox migration (Option B)

For each Salesforce-synced text field that should be a checkbox:

1. Add the sibling checkbox field (e.g., `Existing Customer (bool)`).
2. Update the SF sync workflow to write the boolean value to the new checkbox field instead of the text field.
3. Backfill: one-shot conversion of existing text values to checkboxes.
4. Update workflow consumers (gate workflow, scoring, views) to read the checkbox field.
5. Verify zero references remain to the text field.
6. Drop the text field.
7. Rename the sibling to the original name.

Affected fields:
- Companies: Existing Customer, SF Has Open Opp, SF Has Closed Won, DNC Opt Out
- Contacts: Opt Out, Active Cadence, Do Not Contact, Email Opt Out, Hard Bounced

Sequence carefully: one field at a time, verify each, then the next.

### Phase 4 — Signal migration to Company Events

For each Companies row with at least one signal flagged true:

1. For each `Signal: *` field that is true, create a row in Company Events with the event type, the date (from the corresponding date field added today), the detail (from the `* Detail` text field), and provider = Explorium (or whichever supplied it).
2. After all rows migrated, drop the seven `Signal: *` text fields from Companies.
3. Drop the seven `* Date` fields I added today from Companies (since they live in Company Events now).
4. Drop the per-event detail fields (Funding Event Detail, Leadership Hire Detail, IND/Stage Advance Detail, Conference Presence Detail, Recent Publication).
5. Verify the Companies row rollup/lookup fields (Active Signals Count, etc.) populate correctly.

### Phase 5 — Workflow code updates

Update the gate workflow (`Z6RROKx5omdfvhtn`) to:

1. Write Custom Classification (renamed from Modality).
2. Write Company Events rows instead of `Signal: *` flags.
3. Write Last Scored At, Cohort Quality Framework Version, Company Tier, Company Tier Reason.
4. Read Hard Filters Pass from the segment criteria evaluation.

### Phase 6 — Legacy field deprecation

For each deprecated field on Companies and Contacts:

1. Update field description to mark DEPRECATED with pointer to replacement.
2. Update internal references to read from the replacement.
3. Leave the field in place for backward compatibility; do not delete.

### Phase 7 — Teknova play-extension table

For the biotech-specific fields (Vector Evidence Clause, CT.gov NCT IDs, etc.):

1. Create a new table: `Teknova Companies Extension`, linked to Companies.
2. Move biotech-specific fields to it.
3. Migrate existing biotech data from Companies to the extension table.
4. Drop the fields from Companies.
5. Update Teknova workflows to read/write the extension table.

Phase 7 is the most disruptive and the lowest priority. Defer until the universal schema is proven across two non-biotech engagements.

---

## What's locked vs. what's still open

**Locked:**
- The six design decisions.
- The 60-field Companies schema.
- The 50-field Contacts schema.
- The 7-field Company Events child table.
- The 7-phase migration sequence.

**Still open (decide as we go):**
- Salesforce-sync owner alignment for Phase 3. Who owns the sync workflow today, and when do we schedule the migration sprint?
- LinkedIn outreach-tool sync for the per-channel suppression checks. HeyReach is the named tool; need to confirm.
- Whether Phase 7 ever happens, or whether Teknova-specific fields stay on Companies indefinitely.
- The "Within Window" formula in Company Events needs to be written; sketched here but not implemented.

---

## Reference

- Cohort Quality framework: `practices/revops/cohort-quality-framework.md`
- Engagement process: `practices/revops/ENGAGEMENT-PROCESS.md`
- Cohort production process: `practices/revops/cohort-production-process.md`
- Enrichment providers reference: `practices/revops/skills/enrichment-providers/SKILL.md`
- Cleanup plan for legacy fields: `practices/revops/airtable-companies-cleanup-plan-2026-05-13.md`
