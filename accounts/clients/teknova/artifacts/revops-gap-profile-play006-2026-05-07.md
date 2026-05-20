# PLAY-006 — Gap profile

**Date:** 2026-05-07
**Record set:** 46 companies and 174 contacts in PLAY-006 via `play_company_membership` / `play_contact_membership`. Segment-membership tables (`segment_company_membership` for `gene_therapy_aav`) are empty for this play; play tables are the canonical source.
**Purpose:** baseline of what's populated vs. blank before any enrichment runs. Drives provider sequencing.

---

## Companies (n = 46)

| Spec field | Column | Populated | Blank | % populated | Notes |
|---|---|---:|---:|---:|---|
| company_name | `name` | 46 | 0 | 100% | |
| company_domain | `domain` | 46 | 0 | 100% | |
| company_linkedin_url | `company_linkedin_url` | 0 | 46 | 0% | New column. Clay LinkedIn enrichment fills. |
| company_type | `company_type_primary` | 0 | 46 | 0% | New column. Clay company-classify fills. |
| headcount | `employee_count` | 46 | 0 | 100% | |
| size_bucket | `size_bucket` | 45 | 1 | 98% | **Vocabulary drift:** "Mid" (27), "SMB" (15), "Enterprise" (3). Spec wants `1-50/51-200/201-500/501-1000/1001-2000/2000+`. Re-bucket on enrichment. |
| hq_country | `country` | 46 | 0 | 100% | All 46 = US. No CA, no other. |
| hq_state | `hq_state` | 0 | 46 | 0% | New column. LinkedIn / company website. |
| modality (primary) | `primary_modality` | 46 | 0 | 100% | All "AAV / Gene Therapy". |
| modality (secondary) | `secondary_modalities` | 27 | 19 | 59% | |
| modality_confirmed | `modality_confirmed` | 0 true / 46 false | 0 | 0% confirmed | **Highest-priority gap.** Clay company-classify confirms or rejects. |
| modality_source | `modality_source` | 0 | 46 | 0% | Pairs with modality_confirmed. |
| clinical_stage | `clinical_stage` | 46 | 0 | 100% | **Vocabulary drift:** "Clinical Research Phase 1" (15), "Pre-Clinical Research" (12), "Clinical Research Phase 1/2" (6), "Clinical Research Phase 2" (5), "Clinical Research Phase 3" (4 — fails segment hard filter), "Commercial/Approved" (3 — fails), "Not Applicable" (1). Spec wants `preclinical/IND-enabling/Phase 1/Phase 1/2/Phase 2/Phase 3+`. Re-map on enrichment. |
| pipeline_indication | `pipeline_indication` | 0 | 46 | 0% | New column. Pipeline-page scrape. |
| subsidiary_flag | `subsidiary_flag` | 0 true | 46 default false | 0% true | New column. Clay company-classify. |
| subsidiary_parent | `subsidiary_parent` | 0 | 46 | 0% | |
| company_status | `company_status` | 0 | 46 | 0% | New column. Clay description language ("page no longer monitored", domain redirects). |
| funding_event | `funding_event` | 0 | 46 | 0% | New. Crunchbase / press release. |
| ind_or_stage_advance | `ind_or_stage_advance` | 0 | 46 | 0% | New. clinicaltrials.gov / press. |
| leadership_hire | `leadership_hire` | 0 | 46 | 0% | New. LinkedIn recent hires + job postings. |
| conference_presence | `conference_presence` | 0 | 46 | 0% | New. Conference attendee lists. |
| recent_publication | `recent_publication` | 0 | 46 | 0% | New. PubMed / Google Scholar. |
| salesforce_engagement_status | `salesforce_engagement_status` | 0 | 46 | 0% | New. SF activity rollup. |
| existing_customer | `existing_customer` | 0 | 46 | 0% | New. SF opportunity history. |
| enrichment_status | `enrichment_status` | 0 | 46 | 0% | New. Set by the enrichment agent at gate-check time. |
| Freshness (≤90d) | `last_enriched_at` | 46 | 0 | 100% | All within 90-day window per `last_enriched_at` (but most spec fields haven't been touched — freshness reflects legacy enrichment, not current spec). |

**Companies headline:** identity (name/domain/employee_count/country) is solid at 100%. Modality is tagged but unconfirmed (0% have `modality_confirmed = true`). All 14 new spec fields are 0% populated — expected, they were added today. Two existing columns have vocabulary drift that will need re-mapping at enrichment time: `clinical_stage` and `size_bucket`.

---

## Contacts (n = 174)

| Spec field | Column | Populated | Blank | % populated | Notes |
|---|---|---:|---:|---:|---|
| first_name | `first_name` | 174 | 0 | 100% | |
| last_name | `last_name` | 174 | 0 | 100% | |
| title | `title` | 174 | 0 | 100% | |
| function_classification | `function_classification` | 0 | 174 | 0% | New column. Derive at enrichment from title + LinkedIn. |
| seniority | `seniority` | 0 | 174 | 0% | New column. Derive from title. |
| current_employer_match | `current_employer_match` | 0 true / 174 false | 0 | 0% true | **Critical gap.** All 174 default false. LinkedIn-vs-company-record check needed. |
| linkedin_url | `linkedin_url` | 174 | 0 | 100% | |
| email | `email` | 171 | 3 | 98% | |
| email_verified_status | `email_verified_status` | 171 | 3 | 98% | **Vocabulary drift:** "valid" (70), "deliverable" (61), "apollo_verified" (17), "clay_enriched" (11), "invalid" (6), "catch-all" (5), "unknown" (1). Spec wants `verified/catch_all/unverifiable/invalid`. ~159 (93%) plausibly map to `verified`; 5 to `catch_all`; 6 to `invalid`; 1 to `unverifiable`. Re-map on enrichment. |
| email_personal_domain | derived from `email` | 0 | 174 | 0% | Clean — no gmail/yahoo/outlook addresses on file. |
| email_domain_match | `email_domain_match` | 0 true / 174 false | 0 | 0% true | **Critical gap.** Pairs with `current_employer_match`. |
| tenure_months | `tenure_months` | 0 | 174 | 0% | New column. LinkedIn start date. |
| tenure_years (legacy) | `tenure_years` | 3 | 171 | 2% | Legacy column. Mostly empty. |
| role_status | `employment_status` | 174 | 0 | 100% | **Distribution:** active (86, 49%) / **ended (81, 47%)** / unknown (7, 4%). The 81 ended contacts must be excluded or re-enriched. This is the play's biggest contact-side data quality issue. |
| active_cadence_enrollment | `active_cadence_enrollment` | 0 | 174 | 0% | New. Outreach platform sync. |
| opt_out_status | `opt_out_status` | 174 | 0 | 100% | All 174 = `clear` (auto-derived by trigger; no contacts currently flagged dnc/bounced/opted_out/known on this play). |

**Contacts headline:** identity layer (name/title/LinkedIn/email) is essentially complete. The catastrophic gap is **employment freshness — 47% of contacts (81 of 174) have `employment_status = ended`**. These are not enrichable into this play; they have to be removed or replaced. After that purge, 93 contacts remain — below the play's `min_list_size = 150` threshold, meaning new contact sourcing is required to ship.

---

## Provider sequencing implications

Ranked by gap size and dependency order:

1. **Stale-employment purge first.** 81 of 174 contacts (47%) are flagged `ended`. These do not get enriched — they get suppressed or removed. Net contact count drops to 93. This alone puts the play below its 150-contact floor before any other work.
2. **New contact sourcing.** To clear the 150-record bar after the purge, source ~60+ new contacts at the existing 46 companies (or expand the company set). LinkedIn search by title patterns from the criteria doc.
3. **Clay company-classify (highest-leverage company step).** 0% of companies have `modality_confirmed = true`, `subsidiary_flag` set, or `company_status` set. One Clay run lights up: `modality_confirmed`, `modality_source`, `subsidiary_flag`, `subsidiary_parent`, `company_status`, `company_type_primary`. Also re-buckets `size_bucket` to spec values and remaps `clinical_stage` to spec values where possible.
4. **LinkedIn refresh on contacts at companies that survive step 3.** Fills `current_employer_match`, `tenure_months`, `email_domain_match`, refreshes `employment_status`. The 81 `ended` contacts get formally suppressed; the 86 `active` contacts get re-verified.
5. **Hunter on contacts that pass steps 3-4.** Fills missing `email` (3 contacts) and re-verifies the existing 171. Re-maps `email_verified_status` to spec vocabulary.
6. **Direct sources** (clinicaltrials.gov, press releases, PubMed, conference attendee lists). Fills the 5 why-now signal text fields. Free, no provider spend.
7. **Salesforce activity rollup.** Fills `salesforce_engagement_status` and `existing_customer`. Acknowledge known message-ID sync flakiness.

**The single number that matters:** after the stale-employment purge, this play has 93 enrichable contacts at 46 companies. The criteria doc's 150-record floor cannot be met from current records alone. New sourcing is on the critical path.
