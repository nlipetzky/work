# Handoff: Retarget SF Enrichment Workflow to Write to Supabase

**From:** Agentic Systems practice (Boris)
**To:** n8n practice
**Date:** 2026-05-07
**Depends on:** The Supabase→Airtable sync workflow being built and verified first. Do not apply this change until that workflow is live and confirmed working.

## What this changes

The `Teknova — Companies SF Enrichment` workflow (`9lHIriKSBaYId9Xd`) currently reads from Airtable SF mirrors + live Salesforce, then writes 11 fields directly to the Airtable Teknova Outreach Companies table.

This handoff changes the write target from Airtable to Supabase. The Supabase→Airtable sync workflow then pushes everything (SF-derived fields + enrichment fields) to Airtable in one daily pass.

## Why

Two independent workflows writing to Airtable creates conflicting data. The SF enrichment workflow writes `Customer Status` and `Active BD Engagement` from SF mirror data. The enrichment spec writes `existing_customer` and `salesforce_engagement_status` from the enrichment process. Both land in Airtable with no reconciliation. Making Supabase the single source of truth for all data eliminates this problem.

New architecture:
```
Salesforce → n8n SF enrichment → Supabase → n8n Supabase→Airtable sync → Airtable
                                    ↑
              Enrichment agent also writes here
```

One write path to Airtable. One source of truth in Supabase.

## Field mapping: SF enrichment → Supabase columns

Every field the workflow currently writes to Airtable already has a corresponding column in Supabase from today's migrations. The workflow needs to write to these columns instead.

| Current Airtable field | Supabase column | Type | Notes |
|----------------------|----------------|------|-------|
| SF Record ID | `salesforce_id` | text | Already exists in Supabase |
| Last Contacted Date | `last_contacted_date` | date | Added in companies migration |
| DNC / Opt-Out | `dnc_opt_out` | bool | Added in companies migration |
| Active SF Opportunity | `sf_has_open_opp` | bool | Already exists |
| SF Opportunity Stage | `sf_opp_stage` | text | Already exists |
| Customer Status | `existing_customer` | text, CHECK constraint | Added in companies migration. Map: "Current Customer"→`current_customer`, "Historical"→`historical_customer`, "Never"→`never` |
| Active BD Engagement | `salesforce_engagement_status` | text, CHECK constraint | Added in companies migration. Map: "Active"→`engaged_last_6mo`, "Past"→`lapsed_6mo_to_2yr`, "None"→`no_record` |
| SF Account Owner | `sf_account_owner` | text | **Needs to be added** -- see migration below |
| SF Account Type | `sf_account_type` | text | **Needs to be added** -- see migration below |
| Open Opp Next Step | `sf_opp_next_step` | text | **Needs to be added** -- see migration below |
| SF Activity Summary | `sf_activity_summary` | text | **Needs to be added** -- see migration below |

### Pre-requisite migration

Four columns need to be added to Supabase before retargeting the workflow. Apply this migration first:

```sql
BEGIN;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sf_account_owner text,
  ADD COLUMN IF NOT EXISTS sf_account_type text,
  ADD COLUMN IF NOT EXISTS sf_opp_next_step text,
  ADD COLUMN IF NOT EXISTS sf_activity_summary text;

COMMENT ON COLUMN public.companies.sf_account_owner IS
  'SF Account.Owner.Name. Written by the SF enrichment n8n workflow via Supabase.';
COMMENT ON COLUMN public.companies.sf_account_type IS
  'SF Account.Type (Prospect, Customer, etc.). Written by SF enrichment workflow.';
COMMENT ON COLUMN public.companies.sf_opp_next_step IS
  'NextStep field from the most recently modified open Opportunity. Written by SF enrichment workflow.';
COMMENT ON COLUMN public.companies.sf_activity_summary IS
  'AI-generated 2-4 sentence summary of recent SF activity. Written by SF enrichment workflow using Claude Sonnet.';

COMMIT;
```

### Value mapping for CHECK-constrained columns

The SF enrichment workflow currently writes human-readable values ("Current Customer", "Active"). Supabase columns have CHECK constraints with spec vocabulary. The workflow's Code nodes need to map values before writing:

**`existing_customer`:**
- "Current Customer" → `current_customer`
- "Historical" → `historical_customer`
- "Never" → `never`

**`salesforce_engagement_status`:**
- "Active" → `engaged_last_6mo`
- "Past" → `lapsed_6mo_to_2yr`
- "None" → `no_record`

If the workflow produces a value not in the CHECK constraint, the Supabase write will fail. Handle unknown values by writing `unknown` (add to the CHECK if needed) or logging and skipping.

## What to change in the workflow

1. **Keep everything before the write step identical.** The read from SF mirrors, the matching logic, the AI summary generation -- all stay the same. Only the write target changes.

2. **Replace the Airtable "Update Company" node** with a Supabase upsert. Match on `domain` (same as enrichment). Write the 11 fields to the Supabase columns listed above, with value mapping for the two CHECK-constrained columns.

3. **Remove the Airtable batch loop** (Loop Over Companies → Update Company). Replace with a Supabase bulk upsert or a batch HTTP call to the Supabase REST API.

4. **Keep the manual trigger.** The workflow should still be runnable on demand.

5. **Keep the 06:00 CT schedule.** The Supabase→Airtable sync runs at 07:00 CT, giving the SF enrichment one hour to land data in Supabase before it gets pushed to Airtable.

## What to verify after retargeting

1. Run the workflow manually.
2. Check Supabase `public.companies` for a known matched company (e.g., Amici Procurement, domain match). Verify all 11 fields are populated with correct values.
3. Verify `existing_customer` and `salesforce_engagement_status` have spec-vocabulary values, not human-readable strings.
4. Verify `sf_activity_summary` contains the AI-generated narrative.
5. Wait for (or manually trigger) the Supabase→Airtable sync. Verify the same data appears in the Airtable Teknova Outreach Companies table.
6. Confirm Airtable no longer receives direct writes from this workflow.

## What this does NOT change

- The read side is unchanged. Still reads from Airtable SF mirrors + live Salesforce SOQL.
- The AI summary generation is unchanged. Still calls Claude Sonnet with the same prompt.
- The match strategy is unchanged. Domain-first, name fallback, refuse ambiguous matches.
- The 191 unmatched companies still get empty-string writes (now to Supabase instead of Airtable).
- The SF Account Sync and SF Lead_Contact Sync workflows are unaffected. They write TO Salesforce from an Airtable sync queue -- different direction entirely.

## Sequence

1. Apply the 4-column migration to Supabase
2. Confirm the Supabase→Airtable sync workflow is built and verified
3. Modify the SF enrichment workflow to write to Supabase
4. Test with a manual run
5. Verify end-to-end: SF → Supabase → Airtable
6. Deactivate any direct Airtable write nodes in the SF enrichment workflow
7. Update the operations inventory at `clients/teknova/artifacts/teknova-operations-inventory.md`

## Reference files

- `clients/teknova/revops/context/n8n-sf-enrichment-workflow-2026-05-07.md` -- current workflow handoff (describes the Airtable-targeting version)
- `clients/teknova/revops/context/n8n-supabase-airtable-sync-handoff-2026-05-07.md` -- the sync workflow this depends on
- `clients/teknova/artifacts/teknova-operations-inventory.md` -- update after retargeting
- `clients/teknova/artifacts/revops-companies-spec-mapping-2026-05-07.md` -- full column mapping
