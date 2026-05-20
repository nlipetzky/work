# Handoff: Supabase → Airtable Sandbox Data Mover (n8n Workflow)
**Date:** 2026-05-08  
**Status:** BLOCKED — n8n MCP pointed at wrong instance  
**Next session:** Build the n8n workflow once MCP is fixed

---

## What this workflow does

Moves companies and contacts associated with a named play from Supabase (revops-engine) into an Airtable sandbox for Ellie/Jenn to review before any push to Teknova Outreach. Designed as a reusable mover: one config value (play name) controls what gets pulled.

---

## Current state

### Done
- Airtable sandbox tables created and ready:
  - Base: `appYBYH3aOHhTODAw` (Teknova Sandbox)
  - Companies table: `tblnj3YlOI3thjrXp` (21 fields including Supabase ID for upsert key)
  - Contacts table: `tblWJksRL1yKSUgrm` (17 fields including Supabase ID)
  - Both tables have `Play` field to tag records by source play
- Blank n8n workflow exists at: `GRo45TloP6Awor4V` (instig8.app.n8n.cloud, project `Pj1xUgbrL58T1CS1`)
- Data for AAV Gene Therapy play is already in the sandbox (moved manually this session — do not repeat)

### NOT done
- The n8n workflow itself has NOT been built
- The n8n MCP is currently pointed at `millermechanical.app.n8n.cloud`, not `instig8.app.n8n.cloud`

### Blocker
**Fix the n8n MCP config.** Update the MCP server so `N8N_API_URL` points at `https://instig8.app.n8n.cloud/api/v1` with the instig8 API key. Then start the new session.

---

## What to build next session

Build the workflow in `GRo45TloP6Awor4V`. Follow the n8n build protocol (CLAUDE.md) exactly.

### Workflow structure

**Manual Trigger → Set (config: play_name) → Companies branch → [done] → Contacts branch**

**Companies branch:**
1. Supabase getAll `playbook_triggers` — filter `playbook_name` ilike `{{ $json.play_name }}`
2. Code — extract `trigger_id` from result
3. Supabase getAll `playbook_evaluations` — filter `playbook_id = trigger_id`, `matched = true` — get `contact_id` list
4. Code — collect all `contact_id`s, fetch full contact rows via `$helpers.httpRequest` to Supabase REST  
   Also: for each contact, resolve `company_id` → company row (second httpRequest or join in query)
5. Extract distinct `company_id`s → fetch company rows via httpRequest
6. Split in Batches (10)
7. Code — map Supabase fields → Airtable field IDs (see mapping below)
8. Airtable Search — filterByFormula `{Supabase ID}="{id}"` in Companies table
9. IF — record found?
   - true: Airtable Update
   - false: Airtable Create
10. [loop back / done]

**Contacts branch** (wired from companies "done"):
Same pattern using contact records already fetched in step 3-4.

### Supabase source query logic
- Play lookup: `playbook_triggers` where `playbook_name ILIKE '%{{ play_name }}%'`
- Contacts: `playbook_evaluations` where `playbook_id = trigger_id AND matched = true`
- Companies: distinct `company_id` from matched contacts → `companies` table
- Note: `play_executions.playbook_trigger_id` join returned 0 rows — use contacts path only

### Airtable field ID maps

**Companies table** (`tblnj3YlOI3thjrXp` in `appYBYH3aOHhTODAw`):
| Airtable Field | Field ID | Supabase column |
|---|---|---|
| Company Name | `fldr4H5k84ZaK2Htq` | `name` |
| Domain | `fldEqSb37DpGNeKVt` | `domain` |
| Play | `fldYrRJWpCM0bCJjY` | injected from config |
| Primary Modality | `fldpYEJ4yq6VUgHpy` | `primary_modality` |
| Clinical Stage | `fldKt2hFgrUyldOpA` | `clinical_stage` |
| Company Type | `fldorXuOQuNDbWZYD` | `company_type_primary` |
| HQ State | `fldaHbzPvWkkTNkl1` | `hq_state` |
| Employee Count | `fldMFiJcyhdiL80Qi` | `employee_count` |
| Company Score | `fldYbQczHTZnIETaw` | `company_score` |
| Enrichment Status | `fldyfIr4H4lSIYZdC` | `enrichment_status` |
| Modality Confirmed | `fld6UtGMfhXN7nKr6` | `modality_confirmed` (boolean → string) |
| Pipeline Indication | `fldm0ShmY1M0wBBIw` | `pipeline_indication` |
| Signal: Funding Event | `fldrwUKOWoy2SMC28` | `signal_facility_expansion` |
| Signal: Leadership Hire | `fldHXctWtWtrkXyOd` | `signal_hiring` |
| Signal: IND/Stage Advance | `fldO7KCqiC92O763s` | `signal_ind_filing` |
| Signal: Conference Presence | `fldwi6zbq6vfZ3mMc` | `signal_conference` |
| Recent Publication | `fldD5DEkQLP4uu0tj` | `recent_publication` |
| Salesforce Engagement | `fldLuK1MDTSKz8I4P` | `salesforce_engagement_status` |
| Existing Customer | `fldwDkTwex2yxuo9K` | `existing_customer` |
| Last Enriched At | `fldCVsgnVpsr2bz7m` | `last_enriched_at` |
| Supabase ID | `fldubY8BHhT0JW9He` | `id` |

**Contacts table** (`tblWJksRL1yKSUgrm` in `appYBYH3aOHhTODAw`):
| Airtable Field | Field ID | Supabase column |
|---|---|---|
| Full Name | `fldpQUwk3gUgzoSkF` | `first_name + ' ' + last_name` |
| First Name | `fldkhGi2gas2uLQex` | `first_name` |
| Last Name | `fld9JXNAcLgEcCIwJ` | `last_name` |
| Email | `fldg0OddUy32PNEfO` | `email` |
| Title | `fldDSnOeNkjyiewLP` | `title` |
| Company Name | `fld3xXN1WVv4M1DlE` | via company join |
| Company Domain | `fldvxC24fPdtBMeZ9` | via company join |
| Play | `fldKJZJBwgMQWIEDI` | injected from config |
| Seniority | `fldhDXgkRDbbEYiDN` | `seniority` |
| Function | `fldDdvtAo8WXy3gmI` | `function_classification` |
| Contact Score | `fldus1Gsedb8zOFu1` | `contact_score` |
| Enrichment Status | `fldlB5OesdxKfk5wL` | `enrichment_status` |
| Opt Out | `fldd4M8qyIqP5GtSo` | `opt_out_status` |
| Active Cadence | `fldIlphFezFenpU6b` | `active_cadence_enrollment` |
| Email Verified | `fld6ckO3UuYpDdBeE` | `email_verified_status` |
| Last Enriched At | `fldTg0CP2TC6T3ahZ` | `last_enriched_at` |
| Supabase ID | `fld5D1WmlktnEXmKV` | `id` |

### Supabase schema notes
- `signal_funding_event` does NOT exist — use `signal_facility_expansion`
- `role_status` does NOT exist in contacts — skip it
- `email_verification_status` does NOT exist — correct column is `email_verified_status`
- `modality_confirmed` is boolean type — cast to string before writing to singleLineText
- Signal columns are all boolean: `signal_clinical_stage_advance`, `signal_conference`, `signal_facility_expansion`, `signal_hiring`, `signal_ind_filing`, `signal_phase_transition`, `signal_publication`

### Credentials
- Supabase: service role key for `mrmnyscurmkfppicqqhk` (already in n8n as a credential)
- Airtable: PAT already in n8n — verify it covers `appYBYH3aOHhTODAw`

---

## Verification (after build)
1. Execute workflow manually with `play_name = "AAV Gene Therapy — Ellie Outreach"`
2. Inspect run — check companies and contacts branch item counts (~126, ~377)
3. Open `appYBYH3aOHhTODAw` — existing records should be updated (not duplicated) since Supabase IDs already present
4. Spot-check: Affinia Therapeutics → enrichment_status, company_score, clinical_stage should be populated
