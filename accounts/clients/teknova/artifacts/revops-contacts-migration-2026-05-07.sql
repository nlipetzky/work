-- Migration: contacts_client_view_fields
-- Date: 2026-05-07
-- Target: Supabase project mrmnyscurmkfppicqqhk, public.contacts
-- Status: APPLIED (partial). Five new columns + opt_out_status trigger landed.
--         Three CHECKs (role_segment, seniority_level, employment_status) HELD —
--         legacy data uses non-spec vocabularies that would break app updates.
--         See `revops-contacts-spec-mapping-2026-05-07.md` for the conflict report.

BEGIN;

-- ============================================================================
-- A. Spec-aligned new columns
-- ============================================================================

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS current_employer_match boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_domain_match boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_cadence_enrollment text,
  ADD COLUMN IF NOT EXISTS opt_out_status text,
  ADD COLUMN IF NOT EXISTS tenure_months integer;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_opt_out_status_chk
    CHECK (opt_out_status IS NULL OR opt_out_status IN
      ('clear','opted_out','bounced','dnc','known'));

-- ============================================================================
-- B. opt_out_status trigger (derives from existing booleans + known_status)
-- Priority: dnc > bounced > opted_out > known > clear
-- ============================================================================

CREATE OR REPLACE FUNCTION public.contacts_set_opt_out_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.do_not_contact = true THEN
    NEW.opt_out_status := 'dnc';
  ELSIF NEW.hard_bounced = true THEN
    NEW.opt_out_status := 'bounced';
  ELSIF NEW.email_opt_out = true THEN
    NEW.opt_out_status := 'opted_out';
  ELSIF lower(coalesce(NEW.known_status, '')) = 'known' THEN
    NEW.opt_out_status := 'known';
  ELSE
    NEW.opt_out_status := 'clear';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contacts_opt_out_status_trg ON public.contacts;
CREATE TRIGGER contacts_opt_out_status_trg
  BEFORE INSERT OR UPDATE OF do_not_contact, hard_bounced, email_opt_out, known_status
  ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.contacts_set_opt_out_status();

-- ============================================================================
-- C. Backfill opt_out_status for existing rows
-- ============================================================================

UPDATE public.contacts
SET opt_out_status = CASE
  WHEN do_not_contact = true THEN 'dnc'
  WHEN hard_bounced = true THEN 'bounced'
  WHEN email_opt_out = true THEN 'opted_out'
  WHEN lower(coalesce(known_status, '')) = 'known' THEN 'known'
  ELSE 'clear'
END
WHERE opt_out_status IS NULL;

-- ============================================================================
-- D. Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contacts_current_employer_match ON public.contacts (current_employer_match)
  WHERE current_employer_match = false;

CREATE INDEX IF NOT EXISTS idx_contacts_opt_out_status ON public.contacts (opt_out_status);

CREATE INDEX IF NOT EXISTS idx_contacts_active_cadence_enrollment ON public.contacts (active_cadence_enrollment)
  WHERE active_cadence_enrollment IS NOT NULL AND active_cadence_enrollment <> 'none';

-- ============================================================================
-- E. Column comments
-- ============================================================================

COMMENT ON COLUMN public.contacts.current_employer_match IS
  'Spec field. True if the contact''s current LinkedIn employer matches the company record being enriched. The Carrie scenario catch — false means do not pitch this contact about company A.';
COMMENT ON COLUMN public.contacts.email_domain_match IS
  'Spec field. True if the email domain matches the company''s primary domain or a known alias. Paired with current_employer_match.';
COMMENT ON COLUMN public.contacts.active_cadence_enrollment IS
  'Spec field. Name of an active cadence the contact is currently enrolled in, or "none". No CHECK — cadence names change per play.';
COMMENT ON COLUMN public.contacts.opt_out_status IS
  'Spec-facing opt-out surface. Derived from do_not_contact/hard_bounced/email_opt_out/known_status by trigger contacts_opt_out_status_trg.';
COMMENT ON COLUMN public.contacts.tenure_months IS
  'Spec field. Months in current role from LinkedIn start date. Existing tenure_years preserved — do not derive one from the other.';

COMMIT;

-- ============================================================================
-- HELD: CHECKs on role_segment, seniority_level, employment_status
-- ============================================================================
-- The original instruction was to add CHECKs against spec vocabularies on these
-- three legacy columns. Held because existing data uses non-spec values that
-- would block all subsequent app updates on legacy rows. Sample distribution:
--
-- seniority_level:
--   Director (8248), Manager (6267), IC (5515), Senior IC (3198), VP (1704),
--   Other (751), C-Suite (252)
--   Spec values: senior_scientist | director | senior_director | head_of | vp | svp | c_suite_small_biotech
--   Conflict: Manager (6267 rows) and Other (751) have NO spec equivalent. CHECK
--   would prevent any UPDATE on those rows.
--
-- employment_status:
--   active (25657), departed (229), unverified (51), unknown (1)
--   Spec values: active | ended | open_to_work | retired | unknown
--   Conflict: departed→ended and unverified→unknown are clean mappings.
--   This one is safely backfillable.
--
-- role_segment:
--   14 distinct values, mostly title-case multi-word like "Process Development",
--   "Manufacturing/Operations", "R&D/Scientific Leadership", "Quality & Regulatory".
--   Spec values: process_dev | manufacturing | cmc | cso | other_excluded
--   Conflict: most legacy values map ambiguously or to "other_excluded".
--
-- Recommended path forward (HOLD UNTIL DECISION):
--   Option A — Backfill `employment_status` only (clean mappings exist), then
--              add NOT VALID CHECK + VALIDATE; leave the other two as free text.
--   Option B — Add three NEW spec-aligned columns (seniority, role_status,
--              function_classification) with CHECKs; keep legacy columns alongside
--              as free text. Enrichment populates the new columns; client view
--              reads from the new columns.
--   Option C — Backfill all three with best-effort mappings, accept information
--              loss on Manager/Other/non-mappable values.
