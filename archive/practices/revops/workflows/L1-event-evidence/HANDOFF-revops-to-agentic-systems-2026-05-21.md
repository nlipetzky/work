# L1 Event Evidence -- RevOps Builder Handoff to Agentic-Systems
**Date:** 2026-05-21  
**From:** RevOps builder (two sessions: May 19 + May 20/21)  
**Workflow:** `9gcmEjq1lvOY2jZS` "Canonical AAV Discovery - L1 ClinicalTrials.gov"  
**Active versionId:** `85b3d2c0-2a6e-44f7-8361-39434cb461b0`  
**Status:** Published, scheduled weekly Monday 6am  
**Last good execution:** 80870 (May 20, 5m run, success)

---

## What This Workflow Does

Multi-query CT.gov L1 capture pipeline for the AAV gene therapy RevOps play. Each weekly run:

1. Fires 5 CT.gov queries against interventional Phase 1-3 genetic/biological trials
2. Paginates (pageSize=100, up to 50 pages per query)
3. Deduplicates by NCT ID across all queries and pages
4. Extracts industry sponsors (lead + collaborators, INDUSTRY class only)
5. Upserts companies to Airtable Companies table (`appYBYH3aOHhTODAw / tblnj3YlOI3thjrXp`)
6. Explodes to one item per trial per company
7. Classifies each trial (tier1/tier2/tier3 deterministic classifier)
8. Writes two Company Events rows per trial (`tblnzX2b2kqNGzW6r`):
   - `clinical_trial_status` -- trial-level signal (NCT, phase, status, enrollment)
   - `target_classification` -- classifier output (tier, confidence, MeSH evidence)

Last full run: 93 companies, 199 trials, 199 classification events.

---

## Airtable Surface

- **Base:** `appYBYH3aOHhTODAw`
- **Companies table:** `tblnj3YlOI3thjrXp`
- **Company Events table:** `tblnzX2b2kqNGzW6r`
- **Play Steps table:** `tblzE9GB8UIs5hGFJ`
- **Enrichment Runs table:** `tblEVSEqetmu4ScHe`

Discovery Play Step record: `recBdGsorJloFkLAM` (status: done, What Happened updated May 19)

---

## What Was Built / Fixed This Session

### Session 1 (May 19) -- Initial build
- Deployed 15-node workflow from SDK file
- Fixed pagination (pageSize=100 embedded in URL, not query param -- n8n was silently ignoring it)
- Fixed Write Classification Events empty base/table (raw REST PUT corruption)
- Fixed `target_classification` missing from Event Type schema cache
- Fixed Define Search Queries override (single-query test mode left active in prod)
- First full run: execution 80852, 90 companies, 181 trial events

### Session 2 (May 20-21) -- Gap audit + fixes

**Query term fixes:**
- Replaced bare `'AAV'` query with `'"AAV vector" OR "AAV gene" OR "AAV capsid"'` -- bare AAV was matching ANCA-Associated Vasculitis (autoimmune disease, not gene therapy)

**Classifier fixes:**
- Expanded `hasAAVName` regex to include branded AAV products: Zolgensma/onasemnogene, Roctavian/valoctocogene, Hemgenix/etranacogene, Beqvez/fidanacogene, Luxturna/voretigene -- these were landing at tier2 instead of tier1

**Field coverage audit -- fetched but not extracted (now fixed):**
- Added to EIS trial push: `enrollmentCount`, `primaryCompletionDate`, `whyStopped`, `isFdaRegulatedDrug`, `countries`, `officialTitle`, `studyFirstSubmitDate`, `overallOfficials`
- Added to CT.gov fetch fields: `officialTitle`, `studyFirstSubmitDate`, `overallOfficials` (24 fields total)
- Added to Write Trial Signals: `Magnitude` = enrollmentCount, `Magnitude Unit` = "participants", `Categories / Tags` = phase/status/vitality/fda tags
- Updated `Detail` to include: `Started: YYYY-MM-DD | Completion: YYYY-MM-DD | Stopped: reason`

**Temporal context fix:**
- `Event Date` was `lastUpdateDate || startDate` -- made a 2015 trial look like a 2025 event
- Now: `Event Date` = `studyFirstSubmitDate || startDate` (when company registered the trial)
- Now: `Most Recent Activity Date` = `lastUpdateDate` (last CT.gov status update, independent)

**Batching bug fix:**
- `Batch for Airtable` had `batchSize: 10`
- With 93 companies (10 batches), Resolve & Explode Trials only saw the last batch (3 companies = 26 trials instead of 199)
- Fixed: `batchSize: 200` -- all companies flow through in one pass

---

## Current Field Mapping

### CT.gov fetch (24 fields):
nctId, briefTitle, officialTitle, leadSponsor, collaborators, phases, overallStatus, studyFirstSubmitDate, conditions, interventions, startDateStruct, lastUpdatePostDateStruct, studyType, primaryPurpose, briefSummary, interventionBrowseModule.meshes, conditionBrowseModule.meshes, enrollmentInfo.count, primaryCompletionDateStruct.date, whyStopped, isFdaRegulatedDrug, secondaryIdInfos, locations.country, overallOfficials

### Company Events -- clinical_trial_status:
Event ID, Event Type, External ID (NCT), Signal State (raw=overallStatus), Vitality, Event Date (studyFirstSubmitDate||startDate), Most Recent Activity Date (lastUpdateDate), Detected At, Source URL, Provider, Raw Reference, Detail (title|phase|started|completion|stopped), Company (linked), Is Latest, Confidence (high), Title (briefTitle), Study Type, Intervention Type, Intervention Names, Conditions, Magnitude (enrollmentCount), Magnitude Unit (participants), Categories/Tags (phase/status/vitality/fda), Raw Payload

### Company Events -- target_classification:
Event ID, Event Type, External ID (NCT), Signal State (raw=classifierTier), Event Date, Detected At, Source URL, Provider, Raw Reference, Detail (classifierDetail), Company (linked), Is Latest, Confidence (classifierConfidence), Title (classifierTier), Categories/Tags (aav-gene-therapy + tier), Raw Payload (classifierRawPayload)

### Companies (written by L1):
Company Name, Discovery Sources, Discovery Confidence, Canonical Status (candidate), First Discovered, Last Verified, Trial Count, Most Advanced Phase, Lead Indication, CT.gov NCT IDs, CT.gov Indications, Verification Status (needs_verification), Most Recent Trial Date, Active Recruiting

---

## Classifier Logic

Three tiers, deterministic v1 (LLM augmentation deferred to v2):

**Tier 1 (high confidence):**
- MeSH Dependovirus + GENETIC/BIOLOGICAL intervention + TREATMENT purpose → `tier1_mesh_match`
- MeSH Dependovirus + gene therapy MeSH → `tier1_mesh_match`
- "aav"/"adeno-associated"/branded product in intervention name + GENETIC/BIOLOGICAL + TREATMENT → `tier1_name_match`

**Tier 2 (medium, needs LLM v2):**
- Any partial signal (GENETIC/BIOLOGICAL type, AAV name, Dependovirus MeSH) without full tier1 confirmation → `tier2_heuristic`

**Tier 3 (reject):**
- All interventions are DRUG/DEVICE/PROCEDURE with no GENETIC/BIOLOGICAL → `tier3_reject`
- primaryPurpose = BASIC_SCIENCE or DIAGNOSTIC → `tier3_reject`
- No signals at all → `tier3_weak`

**Known v1 gaps (document for v2):**
- Tier 2 pool is noisy -- includes CAR-T and other biologics that aren't AAV
- Branded products (Zolgensma etc.) now hit tier1 via name match, but novel branded names will miss until the regex is updated
- No LLM resolution for tier2 -- those companies sit in the database unresolved

---

## Open Items for Agentic-Systems

1. **Last triggered run (temporal fix) not yet confirmed** -- the `Event Date` / `Most Recent Activity Date` fix was deployed (versionId `85b3d2c0`) but a confirming execution has not been run yet. The next session should trigger and verify that Event Date = studyFirstSubmitDate on a known old trial (e.g., BioMarin NCT02576795 should show ~2015-10-05, not 2025-04-10).

2. **overallOfficials (PI names) not written to a dedicated Airtable field** -- the data is extracted and in Raw Payload. Company Events has no PI column. If contact discovery is a priority, either (a) add a PI field to Company Events, or (b) route PI data to Contacts table directly in the workflow.

3. **Therapeutic Modality / Delivery Vehicle on Companies not set by L1** -- these fields exist on Companies but are not populated by the discovery pipeline. Would require a post-classify step that aggregates classifier output per company and writes "Gene Therapy" / "AAV" to Companies. Currently requires manual enrichment or a separate workflow.

4. **tier2_heuristic pool unresolved** -- LLM augmentation node was designed but not built. All tier2 companies in Company Events have target_classification = tier2_heuristic. A v2 step would send these to an LLM (Anthropic HTTP Request node) for binary AAV/not-AAV resolution.

5. **Play Steps "Match" step** (`recNgmEiwkNtbg69t`) still in-progress from May 13 -- unrelated to L1 build but is the only in-progress step and will show up in session start protocol. It's about Apollo people matching, not CT.gov.

6. **80852 trial count (181) was likely a partial result** -- that run had batchSize=10 and 90 companies. If the batching bug existed then too, RET would have seen only the last batch. Worth auditing whether those 181 records are complete or represent only ~10 companies' worth of trials. The 80870 run (199 trials from 93 companies) supersedes it via upsert so records are correct now, but the history is worth noting.

---

## SDK File

`/Users/nplmini/code/work/practices/revops/workflows/L1-event-evidence/workflow-sdk.js`

Synced to deployed workflow as of this session. Contains full node definitions including jsCode for all Code nodes, Fetch node field list, and Write node column mappings.

---

## Raw REST PUT Pattern (required for any future workflow edits)

MCP `update_workflow` wipes credentials. Always use raw REST PUT:

```javascript
const cfg = JSON.parse(require('fs').readFileSync('/Users/nplmini/code/work/practices/n8n-practice/.mcp.json','utf8'));
const baseUrl = cfg.mcpServers['n8n-mcp'].env.N8N_API_URL;
const key = cfg.mcpServers['n8n-mcp'].env.N8N_API_KEY;
// GET first, modify only target nodes, PUT with {name, nodes, connections, settings: {executionOrder}}
// Strip: active, id, versionId, createdAt, updatedAt, triggerCount, tags, meta, pinData, staticData, shared
// Verify-after: GET again, check credentials on all Airtable nodes
```

After any PUT, publish via MCP `publish_workflow` (doesn't touch credentials).
