# Phase 3 — n8n editor walkthrough

**Workflow to edit:** `Canonical AAV Discovery - ClinicalTrials.gov` (`9gcmEjq1lvOY2jZS`)
**Time:** ~15 minutes
**Pre-check:** workflow is currently inactive. Keep it inactive until you've manually executed and verified the run.

Open the workflow in the n8n editor. Work through these steps in order.

---

## Step 1 — Fetch AAV Studies node

**1a. Fix the pagination URL.**

Open the node. Click into the Options section → Pagination → Next URL.

Replace the existing expression with:

```
={{ $response.body.nextPageToken ? "https://clinicaltrials.gov/api/v2/studies?pageToken=" + $response.body.nextPageToken : "" }}
```

**1b. Add a `fields` query parameter.**

Still in this node, scroll to Query Parameters. Click **Add Parameter**.

- Name: `fields`
- Value:

```
protocolSection.identificationModule.nctId,protocolSection.identificationModule.briefTitle,protocolSection.sponsorCollaboratorsModule.leadSponsor,protocolSection.sponsorCollaboratorsModule.collaborators,protocolSection.designModule.phases,protocolSection.statusModule.overallStatus,protocolSection.conditionsModule.conditions,protocolSection.armsInterventionsModule.interventions
```

**Verify:** Query Parameters table now has four rows: `query.intr`, `pageSize`, `countTotal`, `fields`.

Close the node.

---

## Step 2 — Extract Industry Sponsors node

Open the node. Select all the existing code in the JavaScript box. Replace it with:

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

**Verify:** The `hasAAV` keyword check is no longer in the code. Close the node.

---

## Step 3 — Upsert Company node

Open the node. Scroll to the Fields to Send section (the field mapping table).

**3a. Remove one mapping.**

Find the row `Primary Modality` → `AAV`. Delete that row.

**3b. Add three new mappings.** Click **Add Field** for each.

| Field name (Airtable column) | Value (expression) |
|---|---|
| CT.gov NCT IDs | `={{ $json.nctIds }}` |
| CT.gov Indications | `={{ $json.allConditions }}` |
| Verification Status | `needs_verification` (no expression syntax, just the string) |

**Verify:** Mapping table no longer contains `Primary Modality`. The three new rows show up in the table.

Close the node.

---

## Step 4 — Save and execute manually

**4a. Save the workflow** (Cmd+S or the Save button in the top right).

**4b. Click Execute Workflow** (the play button, top right). This runs the manual trigger path, not the Monday scheduled one.

Wait for completion. The HTTP node will paginate; expect 30-90 seconds depending on CT.gov response time.

---

## Step 5 — Verify the run

Open Airtable, RevOps Surface base (`appYBYH3aOHhTODAw`).

**5a. Check Enrichment Runs table.**

The newest row should be `CT.gov Discovery - <today's date>`. Open it. Look at:
- **Companies Evaluated** — should be 200-300 (up from previous; was ~100 before the pagination fixes).
- **Passed (AAV)** — should be 50-80 unique sponsors (up from 35; no hasAAV filter).
- **Markdown Report** — readable phase distribution.

**5b. Check Companies table.**

Filter by `Discovery Sources` contains `clinicaltrials_gov`. You should see:
- More rows than before (was 35; expect 50-80).
- New rows have `Verification Status = needs_verification`.
- New rows have `CT.gov NCT IDs` populated (comma-separated NCTxxxxxxxx strings).
- New rows have `CT.gov Indications` populated (semicolon-separated condition list).
- Rows do NOT have `Primary Modality` set (it's blank or whatever it was before; L1 doesn't write it).

Expected new sponsors to look for (disease-AAV false positives that L1 captures and L2 will reject): Cartesian Therapeutics, Nkarta, Alpine Immune Sciences. These should be in the list with `needs_verification` status.

---

## Step 6 — Report back

Reply with:
- Sponsor count from the run
- Any errors that surfaced (Airtable 422s, pagination loops, etc.)
- Whether the new fields look right

If everything looks clean, we proceed to Phase 4 (build L2 Classify workflow).
If errors, paste the n8n execution view error message and I'll diagnose.

---

## Rollback (if something breaks)

Each step is independently revertable in n8n:
- **Step 1a:** revert nextURL to the previous full-URL form (with `pageSize=100&countTotal=true&pageToken=`).
- **Step 1b:** delete the `fields` parameter row.
- **Step 2:** the previous Code body is in workflow version `471a7c51-67c3-40ba-a459-632d644e419f`. The n8n editor's version history can roll back the node.
- **Step 3:** re-add `Primary Modality: AAV` mapping, delete the three new ones.

The workflow is inactive throughout, so no scheduled run will hit a broken state.
