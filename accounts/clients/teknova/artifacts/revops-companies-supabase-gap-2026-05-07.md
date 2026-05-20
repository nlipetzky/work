# Companies table — Airtable ↔ Supabase gap analysis

**Date:** 2026-05-07
**Airtable source of truth:** base `appFoLY6hjroyA2KW` / table `tblmd04rMsw3GE3pK` (65 fields)
**Supabase target:** project `mrmnyscurmkfppicqqhk` / `public.companies` (85 columns as of read)
**Purpose:** the client view will render every Airtable field with provenance and rationale; Supabase must hold the same fields so the engine can populate them.

---

## Gaps (Airtable has → Supabase missing)

Grouped by purpose. Type is the proposed Postgres type. Each row is a column the engine needs to populate so the client view can render it.

### Per-signal booleans (currently only `funded_last_12_months` exists)

| Proposed column | Type | Maps to Airtable field | Notes |
|---|---|---|---|
| `signal_hiring` | bool | Signal: Hiring | Open PD / GMP roles, weight 8/59 |
| `signal_ind_filing` | bool | Signal: IND Filing | IND filed in last 180d, weight 10/59 |
| `signal_conference` | bool | Signal: Conference | ISCT/ASGCT/BPI in last 90d, weight 6/59 |
| `signal_publication` | bool | Signal: Publication | Peer-reviewed in last 90d, weight 7/59 |
| `signal_clinical_stage_advance` | bool | Signal: Clinical Stage | Stage progression event |
| `signal_phase_transition` | bool | Signal: Phase Transition | Preclinical→Phase I push |
| `signal_facility_expansion` | bool | Signal: Facility Expansion | Capacity / facility announcement |
| `active_signals_summary` | text | Active Signals | Human-readable list, derived |

### AAV-specific (Phase 4 governance)

| Proposed column | Type | Maps to | Notes |
|---|---|---|---|
| `aav_program_confirmed` | bool | AAV Program Confirmed | Triggers AAV play eligibility |
| `aav_program_source` | text | AAV Program Source | Citation (SF / LinkedIn / publication / manual) |
| `pipeline_indication` | text | Pipeline / Indication | Therapeutic indications, e.g. "SMA Phase I" |

### Outreach governance (the Phase 3 Negative Response Architecture)

| Proposed column | Type | Maps to | Notes |
|---|---|---|---|
| `active_bd_engagement` | text | Active BD Engagement | enum (None / Active / Recent / Stale) |
| `last_contacted_date` | date | Last Contacted Date | Sourced from SF activity |
| `dnc_opt_out` | bool | DNC / Opt-Out | Company-level — promote contact-level opt-outs |
| `complaint_history` | text | Complaint History | High-value / recurring notes from SF or BD |
| `customer_status` | text | Customer Status | enum (Prospect / Active / Lapsed / Churned) |
| `in_cadence_count` | int | In Cadence Count | Contacts at company in active cadence |
| `already_engaged_count` | int | Already Engaged Count | Contacts with active reply / engagement |

### Eligibility / data quality (drives Jenn's trust)

| Proposed column | Type | Maps to | Notes |
|---|---|---|---|
| `play_eligibility_status` | text | Play Eligibility Status | enum (Eligible / Held / Excluded) |
| `exclusion_reason` | text | Exclusion Reason | audit trail string |
| `review_status` | text | Review Status | enum (Active / Held / Excluded) |
| `data_freshness_status` | text | Data Freshness Status | derived from `last_enriched_at` |
| `provenance_flags_summary` | text | Provenance Flags | Human-readable from `field_provenance` jsonb |
| `field_source_log` | text | Field Source Log | One line per key field — which provider populated it |
| `tam_note` | text | TAM Note | Clarifies "TAM vs in-cadence vs already engaged" |

### Identity / sync state

| Proposed column | Type | Maps to | Notes |
|---|---|---|---|
| `company_linkedin_url` | text | Company LinkedIn URL | Full URL (Supabase has only `public_identifier` slug) |
| `email_domain` | text | Email Domain | Primary contact email domain — for LinkedIn-vs-email consistency check |
| `linkedin_domain_mismatch` | bool | LinkedIn Domain Mismatch | Conflict flag |
| `hq_state` | text | HQ State | US state for ≥50 headcount filter and territory routing |
| `funding_context` | text | Funding Context | Composed string "Series B — $50M, Mar 2024" |
| `segments_text` | text | Segments | Denormalized segment names for display |
| `sf_sync_action` | text | SF Sync Action | enum |
| `sf_last_synced` | timestamptz | SF Last Synced | Distinct from existing `sf_sync_queued_at` |
| `approved_stats` | text | Approved Stats | Sasha-cleared stats for copy |

---

## Already present (no action)

`name`, `domain`, `website`, `industry`, `country`, `territory`, `ticker`, `primary_modality`, `secondary_modalities`, `delivery_vector`, `company_type`, `clinical_stage`, `development_stage`, `program_type`, `funding_stage`, `last_funding_value`, `last_funding_date`, `total_funding_amount`, `funded_last_12_months`, `employee_count`, `employees_on_linkedin`, `confidence_score`, `fit_score`, `fit_score_signals`, `company_brief`, `brief_generated_at`, `product_recommendation`, `product_recommendation_reasoning`, `salesforce_id`, `sf_account_id`, `sf_opp_stage`, `sf_has_open_opp`, `last_enriched_at`, `field_provenance` (jsonb), `created_at`, `updated_at`.

---

## Migration shape

Single migration adding 28 columns. All nullable, no defaults except booleans default `false` and counts default `0`. No data backfill required at apply time — the engine populates on next wave. Suggest naming `20260507_companies_client_view_fields`.

## Open questions for Nick

1. Should `sf_sync_action`, `customer_status`, `review_status`, `play_eligibility_status`, `data_freshness_status`, `active_bd_engagement` be Postgres enums or free text? Airtable has them as singleSelect — enums are stricter but require migrations to add values.
2. `Recent Funding` (currency) on Airtable looks like the most-recent-round amount, not total. Supabase has both `last_funding_value` (text) and `total_funding_amount` (numeric). Confirm: Airtable's `Recent Funding` = `last_funding_value` parsed to numeric? Worth normalizing.
3. `Confidence Score` is `number` in Airtable but `text` in Supabase. Type drift — normalize to numeric on the Supabase side?
