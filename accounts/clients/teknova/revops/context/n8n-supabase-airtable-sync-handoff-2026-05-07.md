# Handoff: Supabase Enrichment → Airtable Sync Workflow

**From:** Agentic Systems practice (Boris)
**To:** n8n practice
**Date:** 2026-05-07
**Priority:** High -- enrichment data is in Supabase but invisible to the client. Ellie and Jenn look at Airtable. Until this workflow exists, they can't see the work.

## What this solves

Today we built an enrichment system that populates ~40 fields across the `companies` and `contacts` tables in Supabase (`mrmnyscurmkfppicqqhk`). Scores, modality confirmation, why-now signals, enrichment status, provenance -- all sitting in Supabase with no path to Airtable.

The Teknova Outreach Airtable base (`appFoLY6hjroyA2KW`) is where Ellie and Jenn work. If they can't see the enrichment data there, it doesn't exist to them. The SF enrichment workflow (`9lHIriKSBaYId9Xd`) already writes 11 SF-derived fields to the Companies table daily. This new workflow does the same thing for the Supabase enrichment fields.

## Airtable target tables

**Companies table:** `tblmd04rMsw3GE3pK` in `appFoLY6hjroyA2KW`
**Contacts table:** find the contacts table ID in the same base -- it holds the contact-level records that pair with companies.

## Fields to sync: Companies

These fields exist in Supabase `public.companies` and need to appear in the Airtable Companies table. Create Airtable fields if they don't exist. Match on `domain` (Supabase) to the company's domain field in Airtable.

### Enrichment status and scoring
| Supabase column | Airtable field name | Type |
|----------------|-------------------|------|
| `enrichment_status` | Enrichment Status | singleSelect (`enrichment_complete`, `enrichment_incomplete`, `disqualified`, `held_for_review`, `cadence_ready`) |
| `enrichment_failed_check` | Enrichment Failed Check | text |
| `company_score` | Company Score | number |

### Modality and classification
| Supabase column | Airtable field name | Type |
|----------------|-------------------|------|
| `modality_confirmed` | Modality Confirmed | checkbox |
| `modality_source` | Modality Source | URL or text |
| `company_type_primary` | Company Type (Primary) | singleSelect (`biopharma`, `cdmo`) |
| `company_status` | Company Status | singleSelect (`active`, `acquired`, `defunct`) |
| `subsidiary_flag` | Subsidiary | checkbox |
| `subsidiary_parent` | Subsidiary Parent | text |
| `pipeline_indication` | Pipeline / Indication | text |
| `hq_state` | HQ State | text |

### Why-now signals
| Supabase column | Airtable field name | Type |
|----------------|-------------------|------|
| `funding_event` | Funding Event | text |
| `ind_or_stage_advance` | IND / Stage Advance | text |
| `leadership_hire` | Leadership Hire | text |
| `conference_presence` | Conference Presence | text |
| `recent_publication` | Recent Publication | text |
| `signal_hiring` | Signal: Hiring | checkbox |
| `signal_ind_filing` | Signal: IND Filing | checkbox |
| `signal_conference` | Signal: Conference | checkbox |
| `signal_publication` | Signal: Publication | checkbox |
| `signal_clinical_stage_advance` | Signal: Clinical Stage | checkbox |
| `signal_facility_expansion` | Signal: Facility Expansion | checkbox |

### Data quality and provenance
| Supabase column | Airtable field name | Type |
|----------------|-------------------|------|
| `data_freshness_status` | Data Freshness | singleSelect (`fresh`, `aging`, `stale`, `manual_override`) |
| `provenance_flags_summary` | Provenance Flags | text (long) |
| `field_source_log` | Field Sources | text (long) |
| `last_enriched_at` | Last Enriched | dateTime |

### Relationship state (supplement to SF enrichment workflow)
| Supabase column | Airtable field name | Type |
|----------------|-------------------|------|
| `salesforce_engagement_status` | SF Engagement Status | singleSelect (`engaged_last_6mo`, `lapsed_6mo_to_2yr`, `lapsed_2yr_plus`, `no_record`, `unknown`) |
| `existing_customer` | Customer Status (Enrichment) | singleSelect (`current_customer`, `historical_customer`, `never`) |

Note: The SF enrichment workflow already writes `Customer Status` and `Active BD Engagement` from Airtable mirror data. The Supabase versions (`existing_customer`, `salesforce_engagement_status`) use the enrichment spec vocabulary. Both should be visible -- they may differ because they come from different sources (SF mirror vs direct SF query). The discrepancy is useful, not a bug.

## Fields to sync: Contacts

These fields exist in Supabase `public.contacts` and need to appear in the Airtable contacts table. Match on email (Supabase `email`) to the contact's email field in Airtable.

| Supabase column | Airtable field name | Type |
|----------------|-------------------|------|
| `enrichment_status` | Enrichment Status | singleSelect |
| `enrichment_failed_check` | Enrichment Failed Check | text |
| `contact_score` | Contact Score | number |
| `current_employer_match` | Current Employer Match | checkbox |
| `email_domain_match` | Email Domain Match | checkbox |
| `email_verification_status` | Email Verification | text |
| `tenure_months` | Tenure (Months) | number |
| `function_classification` | Function (Spec) | singleSelect (`process_dev`, `manufacturing`, `cmc`, `cso`, `other_excluded`) |
| `seniority` | Seniority (Spec) | singleSelect (`senior_scientist`, `director`, `senior_director`, `head_of`, `vp`, `svp`, `c_suite_small_biotech`) |
| `opt_out_status` | Opt-Out Status | singleSelect (`clear`, `opted_out`, `bounced`, `dnc`, `known`) |
| `active_cadence_enrollment` | Active Cadence | text |
| `role_status` | Role Status | singleSelect (`active`, `ended`, `open_to_work`, `retired`, `unknown`) |

## Match strategy

**Companies:** Match on `domain`. Supabase `companies.domain` to the Airtable Companies table's domain/website field. Same bare-domain normalization as the SF enrichment workflow (`https://www.x.com/foo` → `x.com`). If no match, skip -- don't create Airtable records from Supabase. Airtable is the record system; Supabase enriches what's already there.

**Contacts:** Match on `email`. Supabase `contacts.email` to the Airtable contacts table's email field. Same rule: skip if no match, don't create.

## Workflow shape

Follow the same pattern as `Teknova — Companies SF Enrichment` (`9lHIriKSBaYId9Xd`):

1. Read all companies from Supabase (SELECT with the enrichment fields)
2. Read all companies from the Airtable Companies table (need record IDs for updates)
3. Match on domain
4. Build update payloads for matched records
5. Batch update Airtable (10/batch, same as SF enrichment)
6. Repeat for contacts (read from Supabase, read from Airtable, match on email, batch update)

**Trigger:** Schedule daily, run AFTER the SF enrichment workflow (which runs at 06:00 CT). Suggest 07:00 CT so the SF data lands first, then the enrichment data layers on top. Plus manual trigger for ad-hoc runs.

**Credentials needed:**
- Supabase: the project's service role key or a read-only API key for `mrmnyscurmkfppicqqhk`
- Airtable: same PAT used by the SF enrichment workflow (`pJ4oVKlLQLrvp3Z9`, "All Teknova Konstellation Bases")

## What this does NOT do

- Does not create records in Airtable. Only updates existing records that match on domain/email.
- Does not write back to Supabase. One-way sync: Supabase → Airtable.
- Does not replace the SF enrichment workflow. Both run. SF enrichment writes SF-derived fields. This writes enrichment-spec-derived fields. They complement each other.
- Does not handle the why-now signal fill or scoring computation. Those happen in the RevOps enrichment process. This workflow just moves the results to Airtable so the client can see them.

## Success criteria

After a successful run, open the Airtable Companies table and pick any company that has enrichment data in Supabase. Verify:
- Company Score is populated
- Enrichment Status shows the correct value
- Modality Confirmed checkbox matches Supabase
- Modality Source shows the URL
- Signal fields (funding, IND, etc.) are populated where Supabase has data, blank where it doesn't

Do the same spot-check on the contacts table for Contact Score, Enrichment Status, and Tenure.

## Reference files

- `clients/teknova/artifacts/revops-enrichment-spec-aav-gene-therapy-ellie-outreach.md` -- the enrichment spec that defines every field
- `clients/teknova/artifacts/revops-companies-spec-mapping-2026-05-07.md` -- spec field → Supabase column mapping
- `clients/teknova/revops/context/n8n-sf-enrichment-workflow-2026-05-07.md` -- the SF enrichment workflow handoff (pattern to follow)
- `clients/teknova/revops/CLAUDE.md` -- enrichment system context, provider stack
