# Audit: RevOps Surface Companies table

**Date:** 2026-05-21
**Base:** RevOps Surface (`appYBYH3aOHhTODAw`)
**Table:** Companies (`tblnj3YlOI3thjrXp`)
**Total fields:** 371 (142 curated + 229 `explorium_*`)
**Total records in table:** 183
**Sample size:** 30 records (~16% of table; selected as alphabetically-first records to avoid sort bias toward enrichment cohort, but note that nearly all 30 had enrichment data, suggesting Active AAV cohort fills most of the table)
**Reference:** `/Users/nplmini/code/work/practices/agentic-systems/reference/revops-architecture-spec.md`

## Executive summary

- 371 fields total. Recommendation: DELETE 49, MOVE TO TEKNOVA OUTREACH 7, POPULATE GAP 13, KEEP ON SURFACE 302.
- The biggest cleanup target is dead Salesforce / Cohort-Quality scaffolding (~30 fields at 0% fill that were created speculatively for SF sync, BD outcome tracking, suppression flags, and channel availability checks that no workflow currently writes to).
- 21 `explorium_*` fields are structurally dead (0% fill across the sample, names that are unlikely to ever be populated by Explorium's biotech-coverage profile - e.g., `explorium_shopify_apps_in_use`, `explorium_perc_real_estate_roles`, `explorium_acquired_by`). These are safe to drop. The remaining 208 `explorium_*` fields show legitimate sparse coverage and stay.
- Teknova/AAV-specific taxonomy is leaking into Surface: `AAV Segment`, `Ellie Segment Override`, `Ellie Note`, `Ellie Reviewed At` are reviewer/play taxonomy and belong in the client base per the architecture spec. No `Teknova <Play> Ready` stamp column exists yet on Surface, which is the architecture's intended replacement.

## DELETE

Curated fields with 0% fill that are clearly speculative scaffolding, legacy artifacts, or duplicates. Plus 21 structurally-dead `explorium_*` fields.

| Field | Type | Fill | Reason |
|---|---|---|---|
| Play | singleLineText | 0% | Legacy. Per-play status now lives in stamp columns (`<Client> <Play> Ready`) per architecture spec. Free-text Play column is the wrong shape. |
| Clinical Stage | singleLineText | 0% | Duplicate of `Most Advanced Phase` (97% fill, structured). |
| Company Type | singleLineText | 0% | Duplicate of `V2 Company Type` (also 0%, also delete) and overlaps with `Lifecycle State`/`Subsidiary Status`. Pick one. |
| V2 Company Type | singleLineText | 0% | "V2" naming is a smell. No workflow writes to it. |
| Pipeline Indication | singleLineText | 0% | Duplicate of `Lead Indication` (80% fill, populated). |
| Salesforce Engagement | multilineText | 0% | SF sync isn't running. Distinct from `SF Account Status Summary` (3% fill from a different scaffolding attempt). |
| Website | singleLineText | 0% | Duplicate of `Domain` (73% fill, url type). |
| Playbook Fit Level | singleLineText | 0% | Companion to `Playbook Fit Score` (100% fill but values look like default zeros). String-version of a numeric is redundant; if fit-level taxonomy is needed, derive from score. |
| Play Eligibility Status | singleLineText | 0% | Speculative status field. Replaced by stamp column pattern. |
| Exclusion Reason | singleLineText | 0% | No exclusion workflow writes to it. `Rejection Reason` (7% fill) is the actual field in use. |
| Active Signals Summary | singleLineText | 0% | Speculative summary field. `Active Signals Count` (100% fill) covers it numerically. |
| SF Opp Stage | singleLineText | 0% | SF sync not running. |
| Last Account-Level Contact Date | date | 0% | SF sync not running. |
| Company Status | singleLineText | 0% | Duplicate of `Canonical Status` (100% fill) and `Lifecycle State` (83% fill). |
| Company Brief | multilineText | 0% | No workflow writes to it. `Strategic Notes` and `Company Focus` (Explorium-sourced) cover this. |
| Development Stage | singleLineText | 0% | Duplicate of `Most Advanced Phase` and `Lifecycle State`. |
| Research Focus | singleLineText | 0% | Duplicate of `Lead Indication` (80% fill) and `Sub-Vertical` (also 0%). |
| Therapeutic Modality | singleSelect | 0% | Belongs to client play taxonomy, not Surface. See MOVE list — but it's also empty, so just delete the Surface copy. |
| Sponsor HQ Country | singleLineText | 0% | Duplicate of `HQ Country` (63% fill). |
| Segment Version | singleLineText | 0% | Legacy from "L3 segment filter" architecture that's been superseded by the play-classifier model. |
| Segment Run Date | dateTime | 0% | Same. |
| Account Health Status | singleSelect | 0% | Cohort Quality framework field; no workflow populates it. |
| M&A Status | singleSelect | 0% | Same. |
| Outbound Restricted | checkbox | 0% | Same. |
| Outbound Restriction Reason | singleLineText | 0% | Same. |
| Stale Identity | checkbox | 0% | Same. |
| AE Cleared for Outreach | checkbox | 0% | Same. |
| AE Cleared By | singleLineText | 0% | Same. |
| AE Cleared At | date | 0% | Same. |
| Last BD Outcome | singleSelect | 0% | Same. |
| BD Follow-up Window Opens | date | 0% | Same. |
| Press Mentions Sample URLs | multilineText | 0% | Cohort Quality scaffolding. `Press Mentions 12mo Count` (100% fill, all zeros) is also useless without source signal — flag for KEEP only if a workflow gets built. |
| Signal Structurally Unavailable | checkbox | 0% | Cohort Quality scaffolding. |
| Domain Last Verified | date | 0% | Cohort Quality scaffolding. |
| LinkedIn Channel Available | checkbox | 0% | Cohort Quality scaffolding. |
| Phone Channel Available | checkbox | 0% | Cohort Quality scaffolding. |
| Company Tier | singleSelect | 0% | Cohort Quality "Phase D" scaffolding; not in current pipeline. |
| Company Tier Reason | singleLineText | 0% | Same. |
| Suppression Flags Checked At | dateTime | 0% | Same. |
| Signal Last Refreshed At | dateTime | 0% | Same. |
| Sub-Vertical | singleLineText | 0% | Free-text vertical refinement, not populated by any workflow. |
| Hard Filters Pass | checkbox | 0% | Cohort Quality scaffolding. |
| Account-Level DNC | checkbox | 0% | Same. |
| Last Scored At | dateTime | 0% | Same. |
| Cohort Quality Framework Version | singleLineText | 0% | Same. |
| Most Recent Signal Type | singleSelect | 0% | Speculative companion to `Most Recent Signal Date` (also 0%). |
| Most Recent Signal Date | date | 0% | Same. |
| Currency Status | singleSelect | 0% | Legacy from L2 currency-verdict architecture. `Verification Status` (100% fill) is the active field. |
| Currency Evidence | multilineText | 0% | Same. |
| Currency Checked At | date | 0% | Same. |
| Run Selected | checkbox | 0% | "Selective-run gate" protocol artifact; no current workflow uses it. |
| Ellie Reviewed At | date | 0% | Reviewer field — but see MOVE list. Empty on Surface; the actual Ellie reviews happen in Teknova Outreach. |

### Explorium fields to DELETE (structurally dead)

21 `explorium_*` fields at 0% fill with names that Explorium's biotech coverage will never populate (consumer-web / e-commerce / role-change vocab unrelated to gene therapy targets):

| Field | Reason |
|---|---|
| explorium_acquired_by | Acquisition data not in deep-enrich payload for biotech |
| explorium_affiliate_links | E-commerce field |
| explorium_bounced_visits | Web analytics; covered by other bounce fields |
| explorium_change_in_legal_roles | Headcount-change field that Explorium doesn't populate for our biotech cohort |
| explorium_change_in_real_estate_roles | Same |
| explorium_channel | Ambiguous; no values seen |
| explorium_company_score | Duplicate of `Company Score` curated field; Explorium variant unused |
| explorium_display_name | Duplicate of `explorium_name` |
| explorium_experience_negative | Glassdoor-derived sentiment; not populated |
| explorium_experience_neutral | Same |
| explorium_experience_positive | Same |
| explorium_latest_update | Ambiguous; superseded by `Last Enriched At` |
| explorium_level_of_intent | Intent-data field; not populated for biotech |
| explorium_num_of_news | Not populated |
| explorium_parked | Domain-parking flag; irrelevant for biotech |
| explorium_perc_design_roles | Role-mix field that Explorium doesn't populate for biotech |
| explorium_perc_media_roles | Same |
| explorium_perc_real_estate_roles | Same |
| explorium_ratings_culture_values | Glassdoor field; not populated |
| explorium_shopify_apps_in_use | E-commerce field |
| explorium_topic_count | Not populated |

## MOVE TO TEKNOVA OUTREACH

Tenant-specific taxonomy or reviewer state that violates the "tenant-agnostic schema at hub" rule. Move column + data, then delete from Surface.

| Field | Type | Fill | Reason | Suggested destination column |
|---|---|---|---|---|
| AAV Segment | singleSelect | 63% | Play taxonomy (segments are Teknova's AAV bucket vocabulary). Per spec, segmentation lives at the client base. | `AAV Segment` (already exists in Teknova Outreach per the 16-field set) |
| Ellie Segment Override | singleSelect | 0% | Reviewer override. Reviewer fields are owned by the client base. | `AAV Segment Override` |
| Ellie Note | multilineText | 7% | Reviewer note. | `Reviewer Note` |
| Ellie Reviewed At | date | 0% | Reviewer timestamp. | `Reviewed At` |
| Verification Verdict | singleSelect | 30% | Ground-truth check against the AAV classification — that's per-play QA, not universal data. | `Verification Verdict` |
| Verification Evidence | multilineText | 30% | Companion. | `Verification Evidence` |
| Verification Checked At | date | 30% | Companion. | `Verification Checked At` |

Note: `Verification Status` (100% fill, singleSelect) is the L2 classifier output and is more borderline — it's tenant-agnostic in shape (it just says "verified / not verified") but the *meaning* is AAV-specific. Flagged as an open question below.

## POPULATE GAP

Fields that look architecturally useful for AAV outreach but are empty. Note what would have to change.

| Field | Type | Current fill | Likely source |
|---|---|---|---|
| Domain | url | 73% | Explorium provides this. 27% empty = companies that weren't matched in Explorium. Domain resolver workflow (per `HANDOFF-companies-enrichment-domain-resolver-2026-05-20.md`) should close the gap. |
| HQ State | singleLineText | 43% | Explorium populates partially. Could derive from `explorium_region_name` where missing. Manual fallback for international. |
| HQ Country | singleLineText | 63% | Explorium provides via `explorium_country_name`. Backfill workflow needed. |
| HQ City | singleLineText | 70% | Same — Explorium covers but not all. |
| Founded Year | number | 47% | Explorium provides. Coverage gap is in deep-enrich misses. |
| Funding Stage | singleLineText | 43% | Explorium provides indirectly via funding round fields. Derive field. |
| Parent Company | singleLineText | 20% | Explorium `explorium_parent_company_name` (5/30 = 17%). Sparse but matches. Not really a gap — most biotechs are independent. |
| Stock Ticker | singleLineText | 27% | Explorium `explorium_ticker` (5/30 = 17%). Public companies only. Not really a gap. |
| Key Competitors | multilineText | 10% | Explorium `explorium_key_competitors` (7%). Matched sparse. Could backfill from Explorium where present. |
| Company Focus | multilineText | 10% | Explorium `explorium_company_focus` (7%). Same. |
| Strategic Notes | multilineText | 10% | Manual + Explorium consolidation. Workflow not built. |
| Number of Funding Rounds | number | 90% | Explorium-sourced. Already well-covered. |
| Press Mentions 12mo Count | number | 100% (all zeros) | Field is populated but value is always 0. Needs a press-mention capture workflow if signal is wanted; otherwise DELETE. |

The biggest *structural* gap for AAV outreach — manufacturing site data, process-team headcounts, CMC/process org info — isn't represented as a field at all. Explorium doesn't carry it. New enrichment source needed (LinkedIn scrape, FDA designation lookups, company-site scrape) before adding fields.

## KEEP ON SURFACE

Curated tenant-agnostic fields that belong on the hub. Listing fields with >0% fill plus the structural/identity fields that should stay even if empty pending a workflow.

| Field | Type | Fill | Why |
|---|---|---|---|
| Company Name | singleLineText | 100% | Identity. |
| Discovery Sources | multipleSelects | 100% | Provider metadata per source layer spec. |
| Employee Count | number | 100% | Universal firmographic. |
| Company Score | number | 100% | Universal score (values look stale, but field belongs). |
| Fit Score | number | 100% | Same. |
| Playbook Fit Score | number | 100% | Same. |
| In Cadence Count | number | 100% | Universal engagement metric. |
| Already Engaged Count | number | 100% | Same. |
| Last modified time | lastModifiedTime | 100% | System. |
| Discovery Confidence | number | 100% | Universal discovery metric. |
| Canonical Status | singleSelect | 100% | Universal lifecycle. |
| First Discovered | date | 100% | Identity. |
| Last Verified | date | 100% | Identity. |
| Trial Count | number | 100% | Universal CT.gov enrichment. |
| Patent Count | number | 100% | Universal patent enrichment. |
| Verification Status | singleSelect | 100% | L2 classifier output (universal in shape, AAV in meaning — flagged in open questions). |
| Segment Score | number | 100% | Universal score field. |
| Conference Attendance 12mo Count | number | 100% | Universal signal count. |
| Active Signals Count | number | 100% | Universal rollup. |
| AAV Event Count | rollup | 100% | Rollup from Events (universal mechanism, even though name is AAV-flavored). |
| AAV Active Event Count | rollup | 100% | Same. |
| AAV Status (derived) | formula | 100% | Same. |
| Most Advanced Phase | singleSelect | 97% | Universal CT.gov rollup. |
| Company Events | multipleRecordLinks | 97% | Link to Events table. |
| Most Recent Trial Date | date | 97% | Universal. |
| Number of Funding Rounds | number | 90% | Universal. |
| Classification Run ID | singleLineText | 87% | Audit trail for classifier runs. |
| Classification Notes | multilineText | 87% | Same. |
| Total Known Funding USD | currency | 87% | Universal firmographic. |
| Vector Evidence Clause | singleSelect | 83% | L2 classifier metadata. Universal in shape. |
| Classification Version | singleLineText | 83% | Audit. |
| Classification Run Date | dateTime | 83% | Audit. |
| Last Funding Amount USD | currency | 83% | Universal. |
| Lifecycle State | singleSelect | 83% | Universal. |
| Lead Indication | singleLineText | 80% | Universal therapeutic-area field. |
| Custom Classification | singleLineText | 67% | Per-play classification result (universal vocab per the field description). Stays per spec. |
| Custom Classification Source | singleLineText | 77% | Audit. |
| Custom Classification Confidence | singleLineText | 73% | Audit. |
| Custom Classification Detected Keywords | multilineText | 30% | Audit. |
| CT.gov NCT IDs | multilineText | 77% | Universal CT.gov enrichment. |
| CT.gov Indications | multilineText | 77% | Same. |
| Latest AAV Event Date | rollup | 77% | Rollup. |
| Enrichment Status | singleSelect | 73% | Universal operational state. |
| Last Enriched At | lastModifiedTime | 73% | Audit. |
| Revenue Range | singleLineText | 73% | Universal firmographic. |
| Company LinkedIn URL | singleLineText | 73% | Universal identity. |
| Employee Range | singleLineText | 73% | Universal firmographic. |
| Explorium Business ID | singleLineText | 73% | Provider external ID. |
| Gate Version | singleLineText | 73% | Classifier audit. |
| Active Recruiting | checkbox | 73% | Universal CT.gov rollup. |
| Industry | singleLineText | 70% | Universal firmographic. |
| NAICS Code | singleLineText | 70% | Same. |
| Deep Enrichment Raw | multilineText | 63% | Raw Explorium payload archive. |
| Delivery Vehicle | singleSelect | 60% | Universal taxonomy (in scope for any modality play). |
| Publicly Traded | singleSelect | 60% | Universal firmographic. |
| Subsidiary Status | singleSelect | 60% | Universal firmographic. |
| Enrichment Provider | multipleSelects | 57% | Provider metadata. |
| Last Funding Date | date | 50% | Universal. |
| Founded Year | number | 47% | Universal (gap above). |
| Supabase ID | singleLineText | 43% | Cross-system identity (legacy from Supabase era; keep if Supabase still references this). |
| HQ State / Country / City | text | 43-70% | Universal (gap above). |
| Ultimate Parent | singleLineText | 40% | Universal. |
| Verification Verdict / Evidence / Checked At | mixed | 30% | Flagged as MOVE candidates above. Either move or keep based on Nick's call. |
| Stock Ticker | singleLineText | 27% | Universal. |
| Parent Company | singleLineText | 20% | Universal. |
| SEC CIK | singleLineText | 10% | Universal. |
| Key Competitors / Company Focus / Strategic Notes | multilineText | 10% | Universal Explorium-sourced narratives. |
| Rejection Reason | singleLineText | 7% | Audit. |
| Signal Drafts | multipleRecordLinks | 7% | Link to new Signal Drafts table per spec. |
| SF Account ID | singleLineText | 3% | Identity. Even though SF sync is mostly dead, the field is the right shape. |
| Outreach Eligible | checkbox | 3% | Universal in shape. Borderline — only 1 record has it; check whether any workflow writes it. |
| SF Account Ownership | singleLineText | 3% | SF identity. Borderline. |
| SF Account Status Summary | richText | 3% | SF state. Borderline. |
| Contacts | multipleRecordLinks | 0% | Link to Contacts table. Empty because contacts aren't loaded yet; keep the link. |
| Current Customer / SF Has Open Opp / SF Has Closed Won | checkbox | 0% | Universal SF-derived flags. Keep, will be populated when SF sync resumes. |
| SF Sync Timestamp | dateTime | 0% | Same. |

### Explorium fields to KEEP (208 fields)

229 `explorium_*` fields exist. 21 are flagged for DELETE above. The remaining 208 stay on Surface regardless of fill rate — Explorium's deep-enrich payload omits null keys, so sparse fill is normal coverage variability, not a schema problem.

Distribution across the 30-record sample:
- 77 fields at 16+/30 fill (firmographic + web analytics + role percentages — high coverage)
- 94 fields at 4-15/30 fill (tech stack, funding, lookalike, narrative blocks)
- 37 fields at 1-3/30 fill (sparse but legitimate — IPO data, role-change deltas, narrative pages that Explorium fills opportunistically)

## Open questions for Nick

1. **`Verification Status` (100% fill) is L2 AAV classifier output**. It's universal in shape (singleSelect with verdicts) but the semantics are AAV-specific. Does the spec's "tenant-agnostic at hub" rule mean L2 outputs from per-play classifiers should ALSO live in the client base? Or do classifier verdicts count as a per-client stamp that's allowed to stay on Surface? Current `Custom Classification*` family suggests the latter.

2. **Where is the `Teknova AAV Ready` stamp column?** The spec mandates `<Client> <Play> Ready` (boolean) + `<Client> <Play> Match Reason` (long text) as the allowed per-client stamps on Surface. They don't exist yet. Should this audit's output include creating them? The current `AAV Status (derived)` formula is close but not the right shape (it's a derived rollup, not a classifier stamp).

3. **`Custom Classification` family (67-77% fill)** is the play-classifier surface but doesn't follow the `<Client> <Play>` naming pattern. Is "Custom Classification" the canonical universal name (single classification slot per company per play, multi-play companies handled how?), or should it be renamed to fit the stamp pattern?

4. **Cohort Quality scaffolding (15+ fields at 0% fill).** Were these created for a planned workflow that was deferred, or abandoned? If deferred, KEEP. If abandoned, DELETE all 15. I categorized as DELETE — confirm.

5. **`Supabase ID` (43% fill).** Legacy from a prior architecture. Still referenced by any active system, or safe to drop?

6. **`Press Mentions 12mo Count` (100% fill, all zeros)**. Field is populated mechanically with 0 — no press-mention capture workflow exists. Either build the workflow (gap) or delete the field (clutter). Currently in KEEP — recommend DELETE if no workflow planned within next sprint.

7. **`Discovery Sources` and `Enrichment Provider` overlap.** Both are multipleSelects tracking provenance. Probably redundant. Pick one.
