# Spec field → Supabase column mapping

**Date:** 2026-05-07
**Migration applied:** `companies_client_view_fields` (project `mrmnyscurmkfppicqqhk`)
**Scope:** verifies every field in `revops-enrichment-spec-aav-gene-therapy-ellie-outreach.md` has a corresponding column. Companies migration is live; contacts gaps flagged below.

---

## Company-level fields (all covered)

| Spec field | Column | Status |
|---|---|---|
| company_name | `companies.name` | existing |
| company_domain | `companies.domain` | existing |
| company_type | `companies.company_type_primary` (text + CHECK biopharma/cdmo) | **new** |
| headcount | `companies.employee_count` (int) + `companies.size_bucket` (text) | existing |
| hq_country | `companies.country` | existing (no CHECK; app validates US/CA) |
| hq_state | `companies.hq_state` | **new** |
| modality | `companies.primary_modality` + `companies.secondary_modalities` (jsonb) | existing |
| modality_confirmed | `companies.modality_confirmed` (bool) | **new** |
| modality_source | `companies.modality_source` (text) | **new** |
| clinical_stage | `companies.clinical_stage` | existing (no CHECK; app validates) |
| pipeline_indication | `companies.pipeline_indication` | **new** |
| subsidiary_flag | `companies.subsidiary_flag` (bool) | **new** |
| subsidiary_parent | `companies.subsidiary_parent` (text) | **new** |
| company_status | `companies.company_status` (text + CHECK active/acquired/defunct) | **new** |

## Why-now signal fields (all covered)

| Spec field | Column | Status |
|---|---|---|
| funding_event | `companies.funding_event` | **new** |
| ind_or_stage_advance | `companies.ind_or_stage_advance` | **new** |
| leadership_hire | `companies.leadership_hire` | **new** |
| conference_presence | `companies.conference_presence` | **new** |
| recent_publication | `companies.recent_publication` | **new** |

## Relationship-state (company-level: covered; contact-level: gaps below)

| Spec field | Column | Status |
|---|---|---|
| salesforce_engagement_status | `companies.salesforce_engagement_status` (text + CHECK) | **new** |
| existing_customer | `companies.existing_customer` (text + CHECK) | **new** |
| active_cadence_enrollment | (per-contact spec field — see contacts gaps) | **GAP on contacts** |
| opt_out_status | (per-contact spec field — see contacts gaps) | **GAP on contacts** |

## Enrichment outcome (covered)

| Spec field | Column | Status |
|---|---|---|
| enrichment_status (the 9-check gate result) | `companies.enrichment_status` (text + CHECK) | **new** |
| enrichment_failed_check | `companies.enrichment_failed_check` (text) | **new** |

---

## Contact-level fields (post `contacts_client_view_fields` + `contacts_spec_vocab_alignment`)

| Spec field | Column | Status |
|---|---|---|
| first_name | `contacts.first_name` | existing |
| last_name | `contacts.last_name` | existing |
| title | `contacts.title` | existing |
| function_classification | `contacts.function_classification` (text + CHECK) | **new — Option B** (legacy `role_segment` preserved as free text) |
| seniority | `contacts.seniority` (text + CHECK) | **new — Option B** (legacy `seniority_level` preserved as free text) |
| current_employer_match | `contacts.current_employer_match` (bool) | **new** |
| linkedin_url | `contacts.linkedin_url` | existing |
| email | `contacts.email` | existing |
| email_verification_status | `contacts.email_verified_status` | existing |
| email_domain_match | `contacts.email_domain_match` (bool) | **new** |
| tenure_months | `contacts.tenure_months` (int) | **new** (legacy `tenure_years` preserved) |
| role_status | `contacts.employment_status` (text + CHECK, validated) | existing — **Option A backfill applied 2026-05-07** (`departed→ended`, `unverified→unknown`) |
| active_cadence_enrollment | `contacts.active_cadence_enrollment` (text, no CHECK by design) | **new** |
| opt_out_status | `contacts.opt_out_status` (text + CHECK, derived by trigger) | **new** |

Trigger `contacts_opt_out_status_trg` fires on insert or update of `do_not_contact`, `hard_bounced`, `email_opt_out`, `known_status`. Priority: `dnc > bounced > opted_out > known > clear`. Backfill ran on existing rows: 25,935 marked `clear`, 3 marked `dnc`.

---

## CHECK constraints HELD on three legacy columns

Nick's instruction was to add CHECKs against the spec vocabulary on `role_segment`, `seniority_level`, `employment_status`. Held because existing data uses non-spec vocabularies. A strict CHECK would block all subsequent app updates on the legacy rows (PostgreSQL re-validates a row whenever any column changes, regardless of `NOT VALID`). The first apply attempt failed at the backfill step on this exact issue.

Distribution sample (n contacts):

**seniority_level** — spec: `senior_scientist | director | senior_director | head_of | vp | svp | c_suite_small_biotech`
- Director (8,248), Manager (6,267), IC (5,515), Senior IC (3,198), VP (1,704), Other (751), C-Suite (252)
- Conflict: `Manager` and `Other` (~7,000 rows) have no spec equivalent. CHECK would prevent any UPDATE on those rows.

**employment_status** — spec: `active | ended | open_to_work | retired | unknown`
- active (25,657), departed (229), unverified (51), unknown (1)
- Conflict: clean mappings exist (`departed→ended`, `unverified→unknown`). This one is **safely backfillable**.

**role_segment** — spec: `process_dev | manufacturing | cmc | cso | other_excluded`
- 14 distinct values: "Process Development" (7,995), "Manufacturing/Operations" (4,494), "R&D/Scientific Leadership" (2,725), "No Matching Fields" (1,646), "Quality & Regulatory" (1,610), "Business Development & Strategy" (1,525), and 8 more.
- Conflict: most legacy values map ambiguously or only to `other_excluded`. Backfill loses information.

### Three options for resolving

- **Option A (cleanest, partial coverage):** backfill `employment_status` only, then add `NOT VALID` CHECK + `VALIDATE CONSTRAINT`. Leave the other two as free text. Spec's `role_status` is then enforced at the column level; `function_classification` and `seniority` rely on enrichment-time validation.
- **Option B (full coverage, parallel columns):** add three new spec-aligned columns alongside the legacy ones — `seniority` text + CHECK, `role_status` text + CHECK, `function_classification` text + CHECK. Enrichment writes to both; client view reads the new columns. Legacy columns remain free text.
- **Option C (full coverage, destructive):** backfill all three with best-effort mappings, accept information loss on `Manager`, `Other`, and ambiguous role-segment values. Then add CHECKs.

Recommendation: **A + B**. Apply Option A for `employment_status` immediately (clean and lossless). Apply Option B for `seniority` and `role_segment` since lossless backfill isn't possible. That gets us 100% spec coverage without breaking legacy reads.

---

## Verification

Migration applied successfully. All 41 new columns present with correct types. Two type drifts fixed (`confidence_score`, `last_funding_value` both numeric). View `v_pearl_display_companies` was dropped, the column types changed, and the view was recreated against the new column types.

```
44 columns confirmed via information_schema.columns
```

---

## Gaps remaining (need a contacts migration before enrichment runs against this schema)

To fully match the spec on the contacts side, a follow-up migration should add:

1. `contacts.current_employer_match` boolean (the second-most-important field per the spec, after modality).
2. `contacts.email_domain_match` boolean.
3. `contacts.active_cadence_enrollment` text (cadence name or `none`).
4. `contacts.opt_out_status` text + CHECK (`clear/opted_out/bounced/dnc/known`) — or document that it's derived from the four existing booleans and add a generated column / view.
5. **Tenure unit decision:** keep `tenure_years` and have the spec convert at read time, OR add `tenure_months` (int) and deprecate `tenure_years`. Spec is months, column is years.
6. Optional: CHECK constraints on `role_segment` and `seniority_level` and `employment_status` to enforce spec vocabularies.

Suggested name for follow-up: `contacts_client_view_fields`. Same pattern (text + CHECK, all nullable, no backfill).
