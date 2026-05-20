# SPEC: L1 trial-recency change (manual UI edit, no MCP push)

**Date:** 2026-05-15
**Workflow:** `9gcmEjq1lvOY2jZS` — "Canonical AAV Discovery - ClinicalTrials.gov"
**Why manual:** the MCP `update_workflow` builder corrupts Airtable write-node mappings. This change is applied **by hand in the n8n UI**. Do NOT push this workflow via MCP.
**Targets 4 nodes:** Fetch AAV Studies · Extract Industry Sponsors · Merge Discovery Sources · Upsert Company.
**New Companies fields (already created):** `Most Recent Trial Date` (date, ISO, `fld8wCr8FI00xjqnz`) · `Active Recruiting` (checkbox, `fldIQZlyDRW10nWVE`).
**Status:** for agentic-systems review before apply (recommended, Nick's call to waive). No enrichment, no spend. CT.gov is free.

---

## Edit 1 — node "Fetch AAV Studies" (HTTP Request)

In Query Parameters, find the parameter named **`fields`**. Append these two to the END of its existing comma-separated value (no spaces):

```
,protocolSection.statusModule.startDateStruct,protocolSection.statusModule.lastUpdatePostDateStruct
```

Nothing else in this node changes. (`overallStatus` is already requested.)

---

## Edit 2 — node "Extract Industry Sponsors" (Code)

Select ALL code in the node and replace with this (original logic + recency additions only):

```javascript
// L1 PURE CAPTURE. No filtering, no classification.
const items = $input.all();
const sponsors = {};
let totalStudiesProcessed = 0;
const ACTIVE = ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION'];

function normDate(raw) {
  if (!raw) return null;
  if (raw.length === 4) return raw + '-01-01';
  if (raw.length === 7) return raw + '-01';
  return raw;
}

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
      sponsors[normKey] = { companyName: rawName, trialCount: 0, phases: [], conditions: [], nctIds: [], statuses: [], sampleIntervention: '', mostRecentTrialDate: null, activeRecruiting: false };
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
    if (status && ACTIVE.includes(status)) s.activeRecruiting = true;

    const sd = statusModule && statusModule.startDateStruct && statusModule.startDateStruct.date;
    const ld = statusModule && statusModule.lastUpdatePostDateStruct && statusModule.lastUpdatePostDateStruct.date;
    for (const dRaw of [sd, ld]) {
      const d = normDate(dRaw);
      if (d && (!s.mostRecentTrialDate || d > s.mostRecentTrialDate)) s.mostRecentTrialDate = d;
    }

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
        sponsors[collabNorm] = { companyName: collab.name.trim(), trialCount: 0, phases: [], conditions: [], nctIds: [], statuses: [], sampleIntervention: '', mostRecentTrialDate: null, activeRecruiting: false };
      }
      const cs = sponsors[collabNorm];
      cs.trialCount++;
      for (const p of phases) { if (!cs.phases.includes(p)) cs.phases.push(p); }
      if (status && ACTIVE.includes(status)) cs.activeRecruiting = true;
      for (const dRaw of [sd, ld]) {
        const d = normDate(dRaw);
        if (d && (!cs.mostRecentTrialDate || d > cs.mostRecentTrialDate)) cs.mostRecentTrialDate = d;
      }
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
      mostRecentTrialDate: s.mostRecentTrialDate,
      activeRecruiting: s.activeRecruiting,
      _totalStudiesProcessed: totalStudiesProcessed
    }
  });
}
return output;
```

Changed vs original: added `ACTIVE` set + `normDate()`; init two fields on sponsor/collaborator objects; capture date + active flag per study; emit `mostRecentTrialDate` + `activeRecruiting` in output. Everything else byte-identical.

---

## Edit 3 — node "Merge Discovery Sources" (Code)

Select ALL code in the node and replace with this (original logic + the two recency fields in the output object; nothing else changed):

```javascript
// Merge new clinicaltrials_gov source with any existing Discovery Sources
const newCompanies = $('Extract Industry Sponsors').all();
const existingRecords = $('Bulk Lookup Existing Sources').all();

const existingMap = {};
for (const rec of existingRecords) {
  const name = (rec.json['Company Name'] || '').trim().toLowerCase();
  if (name) {
    existingMap[name] = {
      sources: rec.json['Discovery Sources'] || [],
      confidence: rec.json['Discovery Confidence'] || 0,
      firstDiscovered: rec.json['First Discovered'] || null
    };
  }
}

const today = new Date().toISOString().split('T')[0];
const output = [];

for (const item of newCompanies) {
  const company = item.json;
  const lookupKey = company.companyName.trim().toLowerCase();
  const existing = existingMap[lookupKey];

  let mergedSources = ['clinicaltrials_gov'];
  let firstDiscovered = today;

  if (existing) {
    const prevSources = Array.isArray(existing.sources)
      ? existing.sources.map(s => typeof s === 'object' ? s.name : s)
      : [];
    mergedSources = [...new Set([...prevSources, 'clinicaltrials_gov'])];
    firstDiscovered = existing.firstDiscovered || today;
  }

  output.push({
    json: {
      companyName: company.companyName,
      trialCount: company.trialCount,
      mostAdvancedPhase: company.mostAdvancedPhase,
      leadIndication: company.leadIndication,
      allConditions: company.allConditions,
      nctIds: company.nctIds,
      mergedSources: mergedSources,
      mergedConfidence: mergedSources.length,
      firstDiscovered: firstDiscovered,
      lastVerified: today,
      mostRecentTrialDate: company.mostRecentTrialDate || null,
      activeRecruiting: company.activeRecruiting === true
    }
  });
}
return output;
```

---

## Edit 4 — node "Upsert Company" (Airtable)

1. Open the node. If the two new fields don't appear, click the field-mapping **refresh** (re-fetch columns) so `Most Recent Trial Date` and `Active Recruiting` appear in the picker.
2. Add two field mappings (Map Each Field mode, same as the others):
   - `Most Recent Trial Date`  →  `={{ $json.mostRecentTrialDate }}`
   - `Active Recruiting`  →  `={{ $json.activeRecruiting }}`
3. Leave `typecast` ON (it already is). Match column stays `Company Name`. Do not touch any other mapping.

---

## After editing

- **Save** the workflow. Do NOT run it yet — the run sequence is gated (gates 1a/1b, post-build read-back, re-smoke still apply; L2 must be rebuilt per SPEC rev 2 first).
- Tell me it's saved. I read the deployed config back via MCP (read-only) and verify the 4 edits landed exactly and nothing else changed.
- Then the L2 HTTP-PATCH build proceeds, then the gated full sequence.

## Verification checklist (I run this read-only after you save)

- Fetch AAV Studies `fields` param contains the two `statusModule` date paths.
- Extract / Merge Code nodes contain `mostRecentTrialDate` + `activeRecruiting` in their output objects.
- Upsert Company maps exactly 2 new fields to the two expressions; no other mapping changed; no injected zero-fields.

---

# Amendment: L1 Company Events Signal-Writing Branch (2026-05-19)

**Plan:** `PLAN-L1-ctgov-signals-2026-05-18.md`
**Deployed via:** n8n REST API PUT (not MCP update_workflow — credentials preserved)
**Verified:** exec 80780 + 80781 — 186 signal rows written, count unchanged on second run (idempotent).

Adds two new nodes inserted into the existing `Batch for Airtable` loop. The loop now runs:
`Batch for Airtable (output 1) → Upsert Company → Resolve & Explode Trials → Write Trial Signals → Batch for Airtable (loopback)`

The run-log branch (`Batch for Airtable output 0 → Prepare Run Log → Write Run Log`) is unchanged.

---

## Edit 5 — node "Extract Industry Sponsors" (Code) — amended again 2026-05-19

Replaces the Edit 2 version. Adds `trials: []` to sponsor/collaborator init and a per-trial push inside the study loop. All existing rollup fields unchanged. Full replacement code at:
`practices/revops/workflows/explorium-direct/L1-edit-extract-sponsors-code-2026-05-18.js`

Key additions vs Edit 2:
- Sponsor/collaborator init: `trials: []`
- After the per-study rollup block: `if (nctId) { s.trials.push({ nct, overallStatus, startDate, lastUpdateDate, phase, briefTitle, conditions }) }`
- Output object: `trials: s.trials`

---

## Edit 6 — NEW node "Resolve & Explode Trials" (Code)

Placed AFTER `Upsert Company`, BEFORE `Write Trial Signals`. Joins upserted Airtable record id with per-trial array from Extract Industry Sponsors. Outputs one item per trial per company. Full code at:
`practices/revops/workflows/explorium-direct/L1-resolve-explode-trials-node-2026-05-18.js`

Key logic:
- Builds a lookup `normalizedCompanyName → trials[]` from `$('Extract Industry Sponsors').all()`
- For each upserted company: resolves `companyRecordId` from `item.json.id`, looks up its trials
- `computeVitality(overallStatus, startDate, lastUpdateDate)`: TERMINATED/WITHDRAWN/SUSPENDED → `ended`; RECRUITING/ACTIVE_NOT_RECRUITING/ENROLLING_BY_INVITATION/NOT_YET_RECRUITING → `active`; COMPLETED/UNKNOWN within 5 years → `active`, else → `dormant`; missing → `unknown`
- Outputs fields: `eventId`, `companyRecordId`, `companyName`, `nct`, `eventType='clinical_trial_status'`, `signalStateRaw`, `vitality`, `eventDate`, `mostRecentActivityDate`, `detectedAt`, `sourceUrl`, `provider='clinicaltrials.gov'`, `rawReference`, `detail`, `isLatest=true`, `confidence='high'`

---

## Edit 7 — NEW node "Write Trial Signals" (Airtable upsert)

Placed AFTER `Resolve & Explode Trials`. Upserts to Company Events `tblnzX2b2kqNGzW6r` in base `appYBYH3aOHhTODAw`. Match on `External ID` = NCT (idempotent). Credentials: `FYqJQqdXIQkmT715` ("may 26 all bases"). `typecast: true` (auto-creates `clinical_trial_status` select option).

Field mappings:
| Airtable field | Expression |
|---|---|
| Event ID | `={{ $json.eventId }}` |
| Event Type | `={{ $json.eventType }}` |
| External ID | `={{ $json.nct }}` |
| Signal State (raw) | `={{ $json.signalStateRaw }}` |
| Vitality | `={{ $json.vitality }}` |
| Event Date | `={{ $json.eventDate }}` |
| Most Recent Activity Date | `={{ $json.mostRecentActivityDate }}` |
| Detected At | `={{ $json.detectedAt }}` |
| Source URL | `={{ $json.sourceUrl }}` |
| Provider | `={{ $json.provider }}` |
| Raw Reference | `={{ $json.rawReference }}` |
| Detail | `={{ $json.detail }}` |
| Company | `={{ [$json.companyRecordId] }}` |
| Is Latest | `={{ $json.isLatest }}` |
| Confidence | `={{ $json.confidence }}` |

Output loops back to `Batch for Airtable` to continue to next batch.

---

# Amendment: L1 normKey Deduplication Fix (2026-05-19)

**Plan:** `PLAN-currency-completion-2026-05-19.md` Task C
**Deployed via:** n8n REST API PUT (credentials preserved)
**Verified:** PUT returned 200, node count 11 (unchanged), connections 10 (unchanged).

Fixes a duplicate-row bug where re-runs created new Companies rows when a legal-suffix variant appeared (e.g. "PTC Therapeutics Ltd." vs "PTC Therapeutics"). Both nodes now use `normKey()` to canonicalize company names before lookup/output.

**`normKey()` function (both nodes):**
```javascript
function normKey(name) {
  return (name || '')
    .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\.?A\.?|AG|GmbH|B\.?V\.?)(\s*\.)?$/i, '')
    .replace(/[.,]/g, '').trim().toLowerCase();
}
```

---

## Edit 8 — node "Merge Discovery Sources" (Code) — v2

Replaces the Edit 3 version. Adds normKey matching so that incoming companies whose normalized name matches an existing row use the canonical name from Airtable (ensuring the Upsert hits the existing row, not creates a new one). Full replacement code at:
`practices/revops/workflows/explorium-direct/build/merge-discovery-sources-v2.js`

Key changes vs Edit 3:
- `normKey()` helper added
- `existingMap` keyed by `normKey(rawName)` instead of `name.trim().toLowerCase()`; stores `canonicalName: rawName`
- Lookup uses `normKey(company.companyName)` instead of `.toLowerCase()`
- When normKey matches: `outputCompanyName = existing.canonicalName` (Upsert hits existing row, no duplicate)

---

## Edit 9 — node "Resolve & Explode Trials" (Code) — v2

Replaces the Edit 6 version. Required because Merge Discovery Sources now outputs canonical names; the sponsorTrialsMap lookup must also use normKey to still join trial data correctly after name canonicalization. Full replacement code at:
`practices/revops/workflows/explorium-direct/build/resolve-explode-trials-v2.js`

Key changes vs Edit 6:
- `normKey()` helper added (same function)
- `sponsorTrialsMap` keyed by `normKey(sponsor.json.companyName)` instead of raw name
- Lookup key uses `normKey(companyName)` instead of `.toLowerCase()`
