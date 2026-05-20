-- Migration: companies_client_view_fields
-- Date: 2026-05-07
-- Target: Supabase project mrmnyscurmkfppicqqhk, public.companies
-- Purpose: add fields needed for Teknova client-facing trust-in-data view.
--          Reconciled against clients/teknova/artifacts/revops-enrichment-spec-aav-gene-therapy-ellie-outreach.md
--          and against the Airtable Companies table (appFoLY6hjroyA2KW / tblmd04rMsw3GE3pK).
-- Strategy:
--   - Field names follow the enrichment spec where it speaks (canonical source).
--   - text + CHECK constraint instead of Postgres enums (per Nick: lower migration tax while vocabulary settles).
--   - Type drift fixes: confidence_score and last_funding_value normalized to numeric.
--   - All adds are nullable, no backfill required. Booleans default false; counts default 0.
--   - Existing columns are reused where they cover the spec (e.g., size_bucket, country, last_enriched_at, sf_has_open_opp).

BEGIN;

-- ============================================================================
-- A0. Drop dependent view (recreated in section G)
-- ============================================================================
-- v_pearl_display_companies references last_funding_value; type cast fails until view is dropped.
DROP VIEW IF EXISTS public.v_pearl_display_companies;

-- ============================================================================
-- A. Type drift fixes
-- ============================================================================

-- confidence_score: text -> numeric (defensive cast; non-numeric strings go NULL)
ALTER TABLE public.companies
  ALTER COLUMN confidence_score TYPE numeric
  USING CASE
    WHEN confidence_score ~ '^-?[0-9]+(\.[0-9]+)?$' THEN confidence_score::numeric
    ELSE NULL
  END;

-- last_funding_value: text -> numeric (preserves existing values that parse cleanly; rest go NULL)
ALTER TABLE public.companies
  ALTER COLUMN last_funding_value TYPE numeric
  USING CASE
    WHEN last_funding_value ~ '^-?[0-9]+(\.[0-9]+)?$' THEN last_funding_value::numeric
    ELSE NULL
  END;

-- ============================================================================
-- B. Spec-aligned company-level fields
-- ============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS hq_state text,
  ADD COLUMN IF NOT EXISTS company_type_primary text,
  ADD COLUMN IF NOT EXISTS modality_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS modality_source text,
  ADD COLUMN IF NOT EXISTS pipeline_indication text,
  ADD COLUMN IF NOT EXISTS subsidiary_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subsidiary_parent text,
  ADD COLUMN IF NOT EXISTS company_status text;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_company_type_primary_chk
    CHECK (company_type_primary IS NULL OR company_type_primary IN ('biopharma','cdmo'));

ALTER TABLE public.companies
  ADD CONSTRAINT companies_company_status_chk
    CHECK (company_status IS NULL OR company_status IN ('active','acquired','defunct'));

-- ============================================================================
-- C. Why-now signal fields (composed text per spec; booleans for Airtable parity)
-- ============================================================================

-- Composed text (spec canonical)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS funding_event text,
  ADD COLUMN IF NOT EXISTS ind_or_stage_advance text,
  ADD COLUMN IF NOT EXISTS leadership_hire text,
  ADD COLUMN IF NOT EXISTS conference_presence text,
  ADD COLUMN IF NOT EXISTS recent_publication text;

-- Per-signal booleans (Airtable parity; populated alongside the composed text)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS signal_hiring boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signal_ind_filing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signal_conference boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signal_publication boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signal_clinical_stage_advance boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signal_phase_transition boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signal_facility_expansion boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_signals_summary text;

-- Note: Airtable's "Signal: Recent Funding" is already covered by existing funded_last_12_months bool.

-- ============================================================================
-- D. Spec-aligned relationship-state fields (company-level rollups)
-- ============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS salesforce_engagement_status text,
  ADD COLUMN IF NOT EXISTS existing_customer text;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_sf_engagement_status_chk
    CHECK (salesforce_engagement_status IS NULL OR salesforce_engagement_status IN
      ('engaged_last_6mo','lapsed_6mo_to_2yr','lapsed_2yr_plus','no_record','unknown'));

ALTER TABLE public.companies
  ADD CONSTRAINT companies_existing_customer_chk
    CHECK (existing_customer IS NULL OR existing_customer IN
      ('current_customer','historical_customer','never'));

-- ============================================================================
-- E. Spec-aligned enrichment outcome
-- ============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS enrichment_status text,
  ADD COLUMN IF NOT EXISTS enrichment_failed_check text;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_enrichment_status_chk
    CHECK (enrichment_status IS NULL OR enrichment_status IN
      ('enrichment_complete','enrichment_incomplete','disqualified','held_for_review'));

-- ============================================================================
-- F. Airtable-aligned governance & display fields
-- ============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS last_contacted_date date,
  ADD COLUMN IF NOT EXISTS dnc_opt_out boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS complaint_history text,
  ADD COLUMN IF NOT EXISTS in_cadence_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS already_engaged_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tam_note text,
  ADD COLUMN IF NOT EXISTS play_eligibility_status text,
  ADD COLUMN IF NOT EXISTS exclusion_reason text,
  ADD COLUMN IF NOT EXISTS data_freshness_status text,
  ADD COLUMN IF NOT EXISTS segments_text text,
  ADD COLUMN IF NOT EXISTS sf_sync_action text,
  ADD COLUMN IF NOT EXISTS sf_last_synced timestamptz,
  ADD COLUMN IF NOT EXISTS approved_stats text,
  ADD COLUMN IF NOT EXISTS email_domain text,
  ADD COLUMN IF NOT EXISTS linkedin_domain_mismatch boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_linkedin_url text,
  ADD COLUMN IF NOT EXISTS provenance_flags_summary text,
  ADD COLUMN IF NOT EXISTS field_source_log text;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_data_freshness_status_chk
    CHECK (data_freshness_status IS NULL OR data_freshness_status IN
      ('fresh','aging','stale','manual_override'));

ALTER TABLE public.companies
  ADD CONSTRAINT companies_sf_sync_action_chk
    CHECK (sf_sync_action IS NULL OR sf_sync_action IN
      ('none','queued','pushed','failed','manual_review'));

-- ============================================================================
-- G. Indexes for the client view
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_companies_enrichment_status ON public.companies (enrichment_status)
  WHERE enrichment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_play_eligibility_status ON public.companies (play_eligibility_status)
  WHERE play_eligibility_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_modality_confirmed ON public.companies (modality_confirmed)
  WHERE modality_confirmed = true;

CREATE INDEX IF NOT EXISTS idx_companies_subsidiary_flag ON public.companies (subsidiary_flag)
  WHERE subsidiary_flag = true;

CREATE INDEX IF NOT EXISTS idx_companies_data_freshness ON public.companies (data_freshness_status, last_enriched_at)
  WHERE data_freshness_status IS NOT NULL;

-- ============================================================================
-- H. Column comments (so the client view's "explain where data came from" can render automatically)
-- ============================================================================

COMMENT ON COLUMN public.companies.modality_confirmed IS
  'Spec field. True only if the company''s own website or a press release <12mo explicitly names AAV. False = third-party tag, requires manual review. Source of truth for AAV play eligibility.';
COMMENT ON COLUMN public.companies.modality_source IS
  'Spec field. URL or citation string proving the modality classification. Powers the "where did this come from" client view.';
COMMENT ON COLUMN public.companies.subsidiary_flag IS
  'Spec field. True if wholly-owned subsidiary of a top-20 pharma. Excluded by segment hard filter unless subsidiary operates independent CMC.';
COMMENT ON COLUMN public.companies.subsidiary_parent IS
  'Spec field. Required when subsidiary_flag=true. Parent company name.';
COMMENT ON COLUMN public.companies.company_status IS
  'Spec field. active|acquired|defunct. Drives auto-suppression of acquired/defunct companies.';
COMMENT ON COLUMN public.companies.company_type_primary IS
  'Spec field. biopharma|cdmo. Single primary value (existing company_type[] preserves multi-type history).';
COMMENT ON COLUMN public.companies.funding_event IS
  'Spec field. Composed string: "Series B, $35M, 2026-04-15". Composed at enrichment time from raw funding data.';
COMMENT ON COLUMN public.companies.ind_or_stage_advance IS
  'Spec field. Composed string: "IND filed, 2026-03-20" or "Phase 1 initiated, 2026-02-01".';
COMMENT ON COLUMN public.companies.leadership_hire IS
  'Spec field. Composed string: "Hired VP Manufacturing, 2026-04-01" or "Open role: Director Process Development".';
COMMENT ON COLUMN public.companies.conference_presence IS
  'Spec field. Composed string: "Speaker, Interphex 2026" | "Attendee, BPI West 2026".';
COMMENT ON COLUMN public.companies.recent_publication IS
  'Spec field. Title + venue + date for AAV process work in last 12mo.';
COMMENT ON COLUMN public.companies.salesforce_engagement_status IS
  'Spec field. Drives the Rocket-rule suppression. SF message-ID sync is known-unreliable; treat "no_record" as low-confidence.';
COMMENT ON COLUMN public.companies.existing_customer IS
  'Spec field. current_customer|historical_customer|never. Replaces ad-hoc Customer Status logic.';
COMMENT ON COLUMN public.companies.enrichment_status IS
  'Spec field. Outcome of the 9-check enrichment-complete gate. Records ship only when status=enrichment_complete.';
COMMENT ON COLUMN public.companies.enrichment_failed_check IS
  'Spec field. Names the check that failed when enrichment_status is disqualified or enrichment_incomplete.';
COMMENT ON COLUMN public.companies.dnc_opt_out IS
  'Company-level rollup of contact opt-outs. True if any contact has opted out OR a company-wide DNC is set.';
COMMENT ON COLUMN public.companies.in_cadence_count IS
  'Number of contacts at this company currently enrolled in any active cadence. Drives the TAM-vs-cadence-vs-engaged distinction.';
COMMENT ON COLUMN public.companies.already_engaged_count IS
  'Number of contacts at this company with active positive reply or ongoing engagement. The "already engaged" metric.';
COMMENT ON COLUMN public.companies.tam_note IS
  'Manual annotation clarifying TAM vs in-cadence vs already-engaged. Addresses the "45 vs 200 vs 19" client question.';
COMMENT ON COLUMN public.companies.exclusion_reason IS
  'Audit-trail string explaining why this company is excluded from the current play. Distinct from classification_notes.';
COMMENT ON COLUMN public.companies.data_freshness_status IS
  'Derived from last_enriched_at with manual override allowed. fresh|aging|stale|manual_override.';
COMMENT ON COLUMN public.companies.provenance_flags_summary IS
  'Human-readable rendering of field_provenance jsonb for the client view.';
COMMENT ON COLUMN public.companies.field_source_log IS
  'Per-key-field log of which provider populated each value (LinkedIn / Hunter / SF / manual). One line per field.';
COMMENT ON COLUMN public.companies.linkedin_domain_mismatch IS
  'True if Company LinkedIn URL''s domain does not match domain. Signals data conflict — review before trusting.';
COMMENT ON COLUMN public.companies.email_domain IS
  'Primary email domain for contacts at this company. Used for LinkedIn-vs-email consistency check.';

COMMIT;

-- ============================================================================
-- Rollback plan (run this if the migration causes problems)
-- ============================================================================
-- BEGIN;
-- ALTER TABLE public.companies
--   DROP COLUMN IF EXISTS hq_state,
--   DROP COLUMN IF EXISTS company_type_primary,
--   DROP COLUMN IF EXISTS modality_confirmed,
--   DROP COLUMN IF EXISTS modality_source,
--   DROP COLUMN IF EXISTS pipeline_indication,
--   DROP COLUMN IF EXISTS subsidiary_flag,
--   DROP COLUMN IF EXISTS subsidiary_parent,
--   DROP COLUMN IF EXISTS company_status,
--   DROP COLUMN IF EXISTS funding_event,
--   DROP COLUMN IF EXISTS ind_or_stage_advance,
--   DROP COLUMN IF EXISTS leadership_hire,
--   DROP COLUMN IF EXISTS conference_presence,
--   DROP COLUMN IF EXISTS recent_publication,
--   DROP COLUMN IF EXISTS signal_hiring,
--   DROP COLUMN IF EXISTS signal_ind_filing,
--   DROP COLUMN IF EXISTS signal_conference,
--   DROP COLUMN IF EXISTS signal_publication,
--   DROP COLUMN IF EXISTS signal_clinical_stage_advance,
--   DROP COLUMN IF EXISTS signal_phase_transition,
--   DROP COLUMN IF EXISTS signal_facility_expansion,
--   DROP COLUMN IF EXISTS active_signals_summary,
--   DROP COLUMN IF EXISTS salesforce_engagement_status,
--   DROP COLUMN IF EXISTS existing_customer,
--   DROP COLUMN IF EXISTS enrichment_status,
--   DROP COLUMN IF EXISTS enrichment_failed_check,
--   DROP COLUMN IF EXISTS last_contacted_date,
--   DROP COLUMN IF EXISTS dnc_opt_out,
--   DROP COLUMN IF EXISTS complaint_history,
--   DROP COLUMN IF EXISTS in_cadence_count,
--   DROP COLUMN IF EXISTS already_engaged_count,
--   DROP COLUMN IF EXISTS tam_note,
--   DROP COLUMN IF EXISTS play_eligibility_status,
--   DROP COLUMN IF EXISTS exclusion_reason,
--   DROP COLUMN IF EXISTS data_freshness_status,
--   DROP COLUMN IF EXISTS segments_text,
--   DROP COLUMN IF EXISTS sf_sync_action,
--   DROP COLUMN IF EXISTS sf_last_synced,
--   DROP COLUMN IF EXISTS approved_stats,
--   DROP COLUMN IF EXISTS email_domain,
--   DROP COLUMN IF EXISTS linkedin_domain_mismatch,
--   DROP COLUMN IF EXISTS company_linkedin_url,
--   DROP COLUMN IF EXISTS provenance_flags_summary,
--   DROP COLUMN IF EXISTS field_source_log;
-- -- Type drift fixes are not rolled back automatically; reverse manually if needed:
-- --   ALTER TABLE public.companies ALTER COLUMN confidence_score TYPE text USING confidence_score::text;
-- --   ALTER TABLE public.companies ALTER COLUMN last_funding_value TYPE text USING last_funding_value::text;
-- COMMIT;
