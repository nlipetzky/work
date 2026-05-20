# Phase 3: Refactor CT.gov workflow into pure L1 Capture

**Workflow:** `9gcmEjq1lvOY2jZS` — Canonical AAV Discovery - ClinicalTrials.gov
**Status:** changes drafted, awaiting execution
**Execution paths:**
- **A. Manual UI edits** (you, ~15 min) — recommended for surgical scope
- **B. SDK rewrite via n8n MCP** (Boris, ~30 min) — full workflow replacement, higher rollback cost

---

## Why these changes

L1 capture must be indiscriminate. Classification belongs in L2 (reads the Classification Rules table populated in Phase 2). The current workflow does both. The five edits below strip classification, fix the pageSize bug, slim the API payload, and wire up the new CT.gov-specific fields on Companies.

---

## The five edits

### 1. Fix pageSize duplicate bug (Fetch AAV Studies node)

**Current** (`options.pagination.pagination.nextURL`):
```
={{ $response.body.nextPageToken ? "https://clinicaltrials.gov/api/v2/studies?query.intr=AAV&pageSize=100&countTotal=true&pageToken=" + $response.body.nextPageToken : "" }}
```

**New:**
```
={{ $response.body.nextPageToken ? "https://clinicaltrials.gov/api/v2/studies?pageToken=" + $response.body.nextPageToken : "" }}
```

**Why:** n8n merges the base queryParameters into every paginated request. The current nextURL re-passes pageSize and countTotal, producing the duplicate-param error visible in the sample fixture.

---

### 2. Add `fields` parameter to slim 1.6 MB payload (Fetch AAV Studies node)

**Add to `queryParameters.parameters`:**
```json
{
  "name": "fields",
  "value": "protocolSection.identificationModule.nctId,protocolSection.identificationModule.briefTitle,protocolSection.sponsorCollaboratorsModule.leadSponsor,protocolSection.sponsorCollaboratorsModule.collaborators,protocolSection.designModule.phases,protocolSection.statusModule.overallStatus,protocolSection.conditionsModule.conditions,protocolSection.armsInterventionsModule.interventions"
}
```

**Why:** CT.gov API v2 supports `fields` to scope the response. Dropping everything we don't read (eligibilityCriteria, contactsLocationsModule, outcomesModule, etc.) shrinks the payload an estimated 70-80%.

---

### 3. Strip the hasAAV filter from Extract Industry Sponsors node

**Find these lines in the Code node:**
```javascript
    const combined = (interventionText + ' ' + studyTitle).toUpperCase();
    const hasAAV = combined.includes('AAV') || combined.includes('ADENO-ASSOCIATED') || combined.includes('ADENOASSOCIATED');
    if (!hasAAV) continue;
```

**Delete all three lines.**

**Why:** The CT.gov query `query.intr=AAV` already scopes the universe. The keyword check at L1 was filtering out trials where AAV appears in conditions but not interventions (e.g., ANCA-Vasculitis), which IS the disease-AAV collision case L2 is designed to handle. L1 captures; L2 classifies.

---

### 4. Capture additional CT.gov fields in Extract Industry Sponsors node

**In the sponsor accumulator (where `s` is built), add three fields:**

Find:
```javascript
    if (!sponsors[normKey]) {
      sponsors[normKey] = { companyName: rawName, trialCount: 0, phases: [], conditions: [], nctIds: [] };
    }
```

Replace with:
```javascript
    if (!sponsors[normKey]) {
      sponsors[normKey] = { companyName: rawName, trialCount: 0, phases: [], conditions: [], nctIds: [], statuses: [], sampleIntervention: '' };
    }
```

Then in the loop body, after the existing condition/nctId accumulation, add:
```javascript
    const status = proto.statusModule && proto.statusModule.overallStatus;
    if (status && !s.statuses.includes(status)) s.statuses.push(status);
    if (!s.sampleIntervention && interventions.length > 0 && interventions[0].name) {
      s.sampleIntervention = interventions[0].name;
    }
```

In the output construction (`output.push(...)`):
```javascript
  output.push({
    json: {
      companyName: s.companyName,
      trialCount: s.trialCount,
      mostAdvancedPhase: mostAdvancedPhase,
      leadIndication: s.conditions.length > 0 ? s.conditions[0] : '',
      allConditions: s.conditions.join('; '),
      allPhases: s.phases.join(', '),
      allStatuses: s.statuses.join(', '),
      sampleIntervention: s.sampleIntervention,
      discoveryDate: today,
      nctIds: s.nctIds.join(', '),
      source: 'clinicaltrials_gov',
      _totalStudiesProcessed: totalStudiesProcessed
    }
  });
```

The new fields (`allPhases`, `allStatuses`, `sampleIntervention`) flow through Merge → Upsert.

---

### Full updated Extract Industry Sponsors code (paste-able)

If easier than applying the diffs above, replace the entire Code node body with this:

```javascript
// L1 PURE CAPTURE. No filtering, no classification.
// CT.gov query.intr=AAV already scopes the universe.
// Disease-AAV collision (ANCA-Vasculitis) handled in L2 via Classification Rules.
const items = $input.all();
const sponsors = {};
let totalStudiesProcessed = 0;

for (const item of items) {
  const studies = item.json.studies || [];
  totalStudiesProcessed += studies.length;
  for (const study of studies) {
    const proto = study.protocolSection;
    if (!proto) continue;
    const sponsorModule = proto.sponsorCollaboratorsModule;
    const designModule = proto.designModule;
    const conditionsModule = proto.conditionsModule;
    const idModule = proto.identificationModule;
    const interventionsModule = proto.armsInterventionsModule;
    const statusModule = proto.statusModule;
    if (!sponsorModule || !sponsorModule.leadSponsor) continue;
    const leadSponsor = sponsorModule.leadSponsor;
    if (leadSponsor.class !== 'INDUSTRY') continue;

    const interventions = (interventionsModule && interventionsModule.interventions) || [];
    const rawName = leadSponsor.name.trim();
    const normKey = rawName
      .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\.?A\.?|AG|GmbH|B\.?V\.?)\s*$/i, '')
      .replace(/[.,]/g, '').trim().toLowerCase();
    if (!sponsors[normKey]) {
      sponsors[normKey] = { companyName: rawName, trialCount: 0, phases: [], conditions: [], nctIds: [], statuses: [], sampleIntervention: '' };
    }
    const s = sponsors[normKey];
    s.trialCount++;

    const phases = (designModule && designModule.phases) || [];
    for (const p of phases) { if (!s.phases.includes(p)) s.phases.push(p); }

    const conditions = (conditionsModule && conditionsModule.conditions) || [];
    for (const c of conditions) { if (!s.conditions.includes(c) && s.conditions.length < 10) s.conditions.push(c); }

    const nctId = idModule && idModule.nctId;
    if (nctId) s.nctIds.push(nctId);

    const status = statusModule && statusModule.overallStatus;
    if (status && !s.statuses.includes(status)) s.statuses.push(status);

    if (!s.sampleIntervention && interventions.length > 0 && interventions[0].name) {
      s.sampleIntervention = interventions[0].name;
    }

    const collaborators = sponsorModule.collaborators || [];
    for (const collab of collaborators) {
      if (collab.class !== 'INDUSTRY') continue;
      const collabNorm = collab.name.trim()
        .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\.?A\.?|AG|GmbH|B\.?V\.?)\s*$/i, '')
        .replace(/[.,]/g, '').trim().toLowerCase();
      if (!sponsors[collabNorm]) {
        sponsors[collabNorm] = { companyName: collab.name.trim(), trialCount: 0, phases: [], conditions: [], nctIds: [], statuses: [], sampleIntervention: '' };
      }
      sponsors[collabNorm].trialCount++;
      for (const p of phases) { if (!sponsors[collabNorm].phases.includes(p)) sponsors[collabNorm].phases.push(p); }
    }
  }
}

const phaseRank = { 'EARLY_PHASE1': 1, 'PHASE1': 2, 'PHASE2': 3, 'PHASE3': 4 };
const phaseLabel = { 1: 'Phase 1', 2: 'Phase 1', 3: 'Phase 2', 4: 'Phase 3' };
const today = new Date().toISOString().split('T')[0];

const output = [];
for (const [key, s] of Object.entries(sponsors)) {
  let maxRank = 0;
  for (const p of s.phases) { const rank = phaseRank[p] || 0; if (rank > maxRank) maxRank = rank; }
  const mostAdvancedPhase = maxRank > 0 ? phaseLabel[maxRank] : 'Preclinical';
  output.push({
    json: {
      companyName: s.companyName,
      trialCount: s.trialCount,
      mostAdvancedPhase: mostAdvancedPhase,
      leadIndication: s.conditions.length > 0 ? s.conditions[0] : '',
      allConditions: s.conditions.join('; '),
      allPhases: s.phases.join(', '),
      allStatuses: s.statuses.join(', '),
      sampleIntervention: s.sampleIntervention,
      discoveryDate: today,
      nctIds: s.nctIds.join(', '),
      source: 'clinicaltrials_gov',
      _totalStudiesProcessed: totalStudiesProcessed
    }
  });
}
return output;
```

---

### 5. Update Upsert Company node mappings

**In `columns.value`, make three changes:**

**Remove this line entirely:**
```
"Primary Modality": "AAV",
```
(L1 must not classify modality. L2 sets this via the Classification Rules.)

**Add these three new mappings:**
```
"CT.gov NCT IDs": "={{ $json.nctIds }}",
"CT.gov Indications": "={{ $json.allConditions }}",
"Verification Status": "needs_verification"
```

**Why:**
- NCT IDs and Indications get captured as the audit trail of WHY this company landed in the universe.
- `Verification Status = needs_verification` is the handoff signal for L2 — L2 reads rows in this state, applies classification rules, writes back the final status.

Also add `Merge Discovery Sources` passthrough for the new fields if you want them written later (allPhases, allStatuses, sampleIntervention can stay in the node for now; not yet mapped to Companies fields).

---

## Optional cleanup (not blocking)

### Run Log fields (Prepare Run Log + Write Run Log)

The Phase 1 schema added `Run Type`, `Run Mode`, `Rules Version` to Enrichment Runs. Currently the workflow only writes `Gate Version`. Update:

**Prepare Run Log node, in the output:**
```javascript
runType: 'L1_capture',
runMode: 'incremental',
rulesVersion: null,
```

**Write Run Log node, add to `columns.value`:**
```
"Run Type": "={{ $json.runType }}",
"Run Mode": "={{ $json.runMode }}"
```

### Sticky note "Architecture"

Replace contents with:
```
## Canonical AAV Discovery - ClinicalTrials.gov (L1 Capture)

Phase 1 of three-layer pipeline. PURE L1: no classification, no filtering.

Flow:
Fetch AAV studies (paginated) -> Extract industry sponsors ->
Bulk lookup existing sources -> Merge sources (preserves prior) ->
Batch upsert Companies (Verification Status = needs_verification) ->
Write run log (Run Type = L1_capture)

Downstream: L2 Classify workflow reads needs_verification rows,
applies Classification Rules table, writes Verification Status,
Therapeutic Modality, Delivery Vehicle, Vector Evidence Clause.

Base: RevOps Surface (appYBYH3aOHhTODAw)
Design: practices/revops/workflows/canonical-aav-discovery/DESIGN.md
```

---

## Verification (after edits land)

Per the no-pinned-tests rule, this needs a real execution before we trust it.

**Pre-conditions:**
- Workflow currently `active: false` — leave it inactive for the verification run
- Existing 35 Companies records from Phase 1 will be re-upserted on match; new sponsors captured

**Manual test steps:**
1. Open workflow `9gcmEjq1lvOY2jZS` in n8n UI
2. Click **Execute Workflow** (manual trigger, not the scheduled one)
3. Wait for completion (CT.gov fetch + Airtable writes; expect 30-60 seconds with pagination)
4. Check Companies table for new records and verify the new fields populated: CT.gov NCT IDs, CT.gov Indications, Verification Status = needs_verification
5. Check Enrichment Runs table for the new run log row

**Expected output:**
- Sponsor count higher than Phase 1's 35 (no hasAAV filter; estimated 50-80)
- Some sponsors will be disease-AAV false positives (Cartesian, Nkarta, Alpine etc.) — these will sit with Verification Status = needs_verification until L2 classifies them out
- 1.6 MB → ~300-400 KB payload per page

**Failure modes to watch:**
- 422 errors on Airtable writes if a new field doesn't exist on Companies (unlikely, all checked against the schema pulled today)
- Pagination loop breaking on the new shorter nextURL (the API merges query params, but if it doesn't, fall back to keeping pageSize in nextURL only and removing from queryParameters)
- New sponsors hitting unfamiliar Discovery Sources options (clinicaltrials_gov already exists in the multi-select)

---

## If you want me to execute via SDK rewrite instead

Say "do it via MCP" and I'll author the full SDK code, validate it, and apply via `update_workflow`. The result is identical; the cost is replacing the entire workflow definition rather than five surgical edits, with the rollback cost that implies.
