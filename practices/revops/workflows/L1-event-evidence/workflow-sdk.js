import { workflow, node, trigger, splitInBatches, nextBatch, newCredential } from '@n8n/workflow-sdk';

const schedule = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Weekly Monday 6am',
    parameters: { rule: { interval: [{ field: 'weeks', triggerAtDay: [1], triggerAtHour: 6 }] } },
    position: [336, 0]
  },
  output: [{}]
});

const defineSearchQueries = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Define Search Queries',
    parameters: { jsCode: "const filterAdvanced = \"AREA[InterventionType](GENETIC OR BIOLOGICAL) AND AREA[StudyType]INTERVENTIONAL AND AREA[Phase](PHASE1 OR PHASE2 OR PHASE3 OR EARLY_PHASE1)\";\nconst queries = [\n  'AAV',\n  '\"adeno-associated\"',\n  'Dependovirus',\n  '(AAV1 OR AAV2 OR AAV3 OR AAV4 OR AAV5 OR AAV6 OR AAV7 OR AAV8 OR AAV9 OR AAVrh10 OR rAAV)',\n  '(\"gene therapy\" AND vector)',\n];\nreturn queries.map((queryTerm, i) => ({ json: { queryTerm, filterAdvanced, queryIndex: i } }));" },
    position: [336, 256]
  },
  output: [{ queryTerm: 'AAV', filterAdvanced: '...', queryIndex: 0 }]
});

const fetchAAVStudies = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch AAV Studies',
    parameters: {
      url: 'https://clinicaltrials.gov/api/v2/studies',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'query.intr', value: '={{ $json.queryTerm }}' },
          { name: 'filter.advanced', value: '={{ $json.filterAdvanced }}' },
          { name: 'pageSize', value: '100' },
          { name: 'countTotal', value: 'true' },
          { name: 'fields', value: "protocolSection.identificationModule.nctId,protocolSection.identificationModule.briefTitle,protocolSection.sponsorCollaboratorsModule.leadSponsor,protocolSection.sponsorCollaboratorsModule.collaborators,protocolSection.designModule.phases,protocolSection.statusModule.overallStatus,protocolSection.conditionsModule.conditions,protocolSection.armsInterventionsModule.interventions,protocolSection.statusModule.startDateStruct,protocolSection.statusModule.lastUpdatePostDateStruct,protocolSection.designModule.studyType,protocolSection.designModule.designInfo.primaryPurpose,protocolSection.descriptionModule.briefSummary,derivedSection.interventionBrowseModule.meshes,derivedSection.conditionBrowseModule.meshes,protocolSection.designModule.enrollmentInfo.count,protocolSection.statusModule.primaryCompletionDateStruct.date,protocolSection.statusModule.whyStopped,protocolSection.oversightModule.isFdaRegulatedDrug,protocolSection.identificationModule.secondaryIdInfos,protocolSection.contactsLocationsModule.locations.country" }
        ]
      },
      options: {
        response: { response: { neverError: true } },
        pagination: {
          pagination: {
            paginationMode: 'responseContainsNextURL',
            nextURL: "={{ $response.body.nextPageToken ? 'https://clinicaltrials.gov/api/v2/studies?pageToken=' + $response.body.nextPageToken : '' }}",
            paginationCompleteWhen: 'other',
            completeExpression: "={{ !$response.body.nextPageToken }}",
            limitPagesFetched: true,
            maxRequests: 50,
            requestInterval: 200
          }
        },
        timeout: 30000
      }
    },
    position: [608, 256]
  },
  output: [{ studies: [], nextPageToken: null }]
});

const deduplicateNCTs = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Deduplicate NCTs',
    parameters: { jsCode: "// Aggregate studies from all 5 queries + all pagination pages; deduplicate by NCT ID.\nconst allItems = $input.all();\nconst seen = new Set();\nconst uniqueStudies = [];\nlet totalBeforeDedup = 0;\n\nfor (const item of allItems) {\n  const studies = item.json.studies || [];\n  totalBeforeDedup += studies.length;\n  for (const study of studies) {\n    const nct = study.protocolSection && study.protocolSection.identificationModule\n      ? study.protocolSection.identificationModule.nctId : null;\n    if (nct && !seen.has(nct)) {\n      seen.add(nct);\n      uniqueStudies.push(study);\n    }\n  }\n}\n\nconsole.log(`Dedup: ${totalBeforeDedup} total \u2192 ${uniqueStudies.length} unique NCTs`);\n// Return as single item; Extract Industry Sponsors iterates item.json.studies\nreturn [{ json: { studies: uniqueStudies, totalBeforeDedup, totalAfterDedup: uniqueStudies.length } }];" },
    position: [864, 256]
  },
  output: [{ studies: [], totalBeforeDedup: 0, totalAfterDedup: 0 }]
});

const extractIndustrySponsors = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Extract Industry Sponsors',
    parameters: { jsCode: "// L1 PURE CAPTURE \u2014 extended to pass through disambiguation fields for classifier.\nconst items = $input.all();\nconst sponsors = {};\nlet totalStudiesProcessed = 0;\nconst ACTIVE = ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION'];\n\nfunction normDate(raw) {\n  if (!raw) return null;\n  if (raw.length === 4) return raw + '-01-01';\n  if (raw.length === 7) return raw + '-01';\n  return raw;\n}\n\nfor (const item of items) {\n  const studies = item.json.studies || [];\n  totalStudiesProcessed += studies.length;\n  for (const study of studies) {\n    const proto = study.protocolSection;\n    const derivedSection = study.derivedSection;\n    if (!proto) continue;\n    const sponsorModule = proto.sponsorCollaboratorsModule;\n    const designModule = proto.designModule;\n    const conditionsModule = proto.conditionsModule;\n    const idModule = proto.identificationModule;\n    const interventionsModule = proto.armsInterventionsModule;\n    const statusModule = proto.statusModule;\n    const descriptionModule = proto.descriptionModule;\n    if (!sponsorModule || !sponsorModule.leadSponsor) continue;\n    const leadSponsor = sponsorModule.leadSponsor;\n    if (leadSponsor.class !== 'INDUSTRY') continue;\n\n    const interventions = (interventionsModule && interventionsModule.interventions) || [];\n    const rawName = leadSponsor.name.trim();\n    const normKey = rawName\n      .replace(/,?\\s*(Inc\\.?|LLC|Ltd\\.?|Corp\\.?|Co\\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\\.?A\\.?|AG|GmbH|B\\.?V\\.?)\\s*$/i, '')\n      .replace(/[.,]/g, '').trim().toLowerCase();\n    if (!sponsors[normKey]) {\n      sponsors[normKey] = { companyName: rawName, trialCount: 0, phases: [], conditions: [], nctIds: [], statuses: [], sampleIntervention: '', mostRecentTrialDate: null, activeRecruiting: false, trials: [] };\n    }\n    const s = sponsors[normKey];\n    s.trialCount++;\n\n    const phases = (designModule && designModule.phases) || [];\n    for (const p of phases) { if (!s.phases.includes(p)) s.phases.push(p); }\n\n    const conditions = (conditionsModule && conditionsModule.conditions) || [];\n    for (const c of conditions) { if (!s.conditions.includes(c) && s.conditions.length < 10) s.conditions.push(c); }\n\n    const nctId = idModule && idModule.nctId;\n    if (nctId) s.nctIds.push(nctId);\n\n    const status = statusModule && statusModule.overallStatus;\n    if (status && !s.statuses.includes(status)) s.statuses.push(status);\n    if (status && ACTIVE.includes(status)) s.activeRecruiting = true;\n\n    const sd = statusModule && statusModule.startDateStruct && statusModule.startDateStruct.date;\n    const ld = statusModule && statusModule.lastUpdatePostDateStruct && statusModule.lastUpdatePostDateStruct.date;\n    for (const dRaw of [sd, ld]) {\n      const d = normDate(dRaw);\n      if (d && (!s.mostRecentTrialDate || d > s.mostRecentTrialDate)) s.mostRecentTrialDate = d;\n    }\n\n    if (!s.sampleIntervention && interventions.length > 0 && interventions[0].name) {\n      s.sampleIntervention = interventions[0].name;\n    }\n\n    if (nctId) {\n      s.trials.push({\n        nct: nctId,\n        overallStatus: status || null,\n        startDate: normDate(sd),\n        lastUpdateDate: normDate(ld),\n        phase: phases.length > 0 ? phases[0] : null,\n        briefTitle: idModule && idModule.briefTitle ? idModule.briefTitle : null,\n        conditions: conditions.slice(0, 5),\n        conditionsList: conditions.join('\\n'),\n        interventionTypes: interventions.map(i => i.type).filter(Boolean).join(', '),\n        interventionNames: interventions.map(i => i.name).filter(Boolean).join('\\n'),\n        studyType: designModule && designModule.studyType ? designModule.studyType : null,\n        primaryPurpose: designModule && designModule.designInfo ? designModule.designInfo.primaryPurpose : null,\n        briefSummary: descriptionModule && descriptionModule.briefSummary ? descriptionModule.briefSummary.substring(0, 500) : null,\n        meshInterventions: (derivedSection && derivedSection.interventionBrowseModule && derivedSection.interventionBrowseModule.meshes) || [],\n        meshConditions: (derivedSection && derivedSection.conditionBrowseModule && derivedSection.conditionBrowseModule.meshes) || [],\n        rawStudyJson: JSON.stringify(study),\n      });\n    }\n\n    const collaborators = sponsorModule.collaborators || [];\n    for (const collab of collaborators) {\n      if (collab.class !== 'INDUSTRY') continue;\n      const collabNorm = collab.name.trim()\n        .replace(/,?\\s*(Inc\\.?|LLC|Ltd\\.?|Corp\\.?|Co\\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\\.?A\\.?|AG|GmbH|B\\.?V\\.?)(\\s*\\.)?$/i, '')\n        .replace(/[.,]/g, '').trim().toLowerCase();\n      if (!sponsors[collabNorm]) {\n        sponsors[collabNorm] = { companyName: collab.name.trim(), trialCount: 0, phases: [], conditions: [], nctIds: [], statuses: [], sampleIntervention: '', mostRecentTrialDate: null, activeRecruiting: false, trials: [] };\n      }\n      const cs = sponsors[collabNorm];\n      cs.trialCount++;\n      for (const p of phases) { if (!cs.phases.includes(p)) cs.phases.push(p); }\n      if (status && ACTIVE.includes(status)) cs.activeRecruiting = true;\n      for (const dRaw of [sd, ld]) {\n        const d = normDate(dRaw);\n        if (d && (!cs.mostRecentTrialDate || d > cs.mostRecentTrialDate)) cs.mostRecentTrialDate = d;\n      }\n      if (nctId) {\n        cs.trials.push({\n          nct: nctId,\n          overallStatus: status || null,\n          startDate: normDate(sd),\n          lastUpdateDate: normDate(ld),\n          phase: phases.length > 0 ? phases[0] : null,\n          briefTitle: idModule && idModule.briefTitle ? idModule.briefTitle : null,\n          conditions: conditions.slice(0, 5),\n          conditionsList: conditions.join('\\n'),\n          interventionTypes: interventions.map(i => i.type).filter(Boolean).join(', '),\n          interventionNames: interventions.map(i => i.name).filter(Boolean).join('\\n'),\n          studyType: designModule && designModule.studyType ? designModule.studyType : null,\n          primaryPurpose: designModule && designModule.designInfo ? designModule.designInfo.primaryPurpose : null,\n          briefSummary: descriptionModule && descriptionModule.briefSummary ? descriptionModule.briefSummary.substring(0, 500) : null,\n          meshInterventions: (derivedSection && derivedSection.interventionBrowseModule && derivedSection.interventionBrowseModule.meshes) || [],\n          meshConditions: (derivedSection && derivedSection.conditionBrowseModule && derivedSection.conditionBrowseModule.meshes) || [],\n          rawStudyJson: JSON.stringify(study),\n        });\n      }\n    }\n  }\n}\n\nconst phaseRank = { 'EARLY_PHASE1': 1, 'PHASE1': 2, 'PHASE2': 3, 'PHASE3': 4 };\nconst phaseLabel = { 1: 'Phase 1', 2: 'Phase 1', 3: 'Phase 2', 4: 'Phase 3' };\nconst today = new Date().toISOString().split('T')[0];\n\nconst output = [];\nfor (const [key, s] of Object.entries(sponsors)) {\n  let maxRank = 0;\n  for (const p of s.phases) { const rank = phaseRank[p] || 0; if (rank > maxRank) maxRank = rank; }\n  const mostAdvancedPhase = maxRank > 0 ? phaseLabel[maxRank] : 'Preclinical';\n  output.push({\n    json: {\n      companyName: s.companyName,\n      trialCount: s.trialCount,\n      mostAdvancedPhase: mostAdvancedPhase,\n      leadIndication: s.conditions.length > 0 ? s.conditions[0] : '',\n      allConditions: s.conditions.join('; '),\n      allPhases: s.phases.join(', '),\n      allStatuses: s.statuses.join(', '),\n      sampleIntervention: s.sampleIntervention,\n      discoveryDate: today,\n      nctIds: s.nctIds.join(', '),\n      source: 'clinicaltrials_gov',\n      mostRecentTrialDate: s.mostRecentTrialDate,\n      activeRecruiting: s.activeRecruiting,\n      _totalStudiesProcessed: totalStudiesProcessed,\n      trials: s.trials\n    }\n  });\n}\nreturn output;" },
    position: [1120, 256]
  },
  output: [{ companyName: 'Example Therapeutics', trials: [] }]
});

const bulkLookupExisting = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Bulk Lookup Existing Sources',
    parameters: {
      operation: 'search',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblnj3YlOI3thjrXp' },
      filterByFormula: "NOT({Discovery Sources} = '')",
      options: { fields: ['Company Name', 'Discovery Sources', 'Discovery Confidence', 'First Discovered'] }
    },
    credentials: { airtablePersonalAccessToken: newCredential('Airtable Personal Access Token') },
    executeOnce: true,
    position: [1344, 256]
  },
  output: [{ 'Company Name': 'Example Corp', 'Discovery Sources': ['clinicaltrials_gov'] }]
});

const mergeDiscoverySources = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge Discovery Sources',
    parameters: { jsCode: "// Merge new clinicaltrials_gov source with any existing Discovery Sources\nconst newCompanies = $('Extract Industry Sponsors').all();\nconst existingRecords = $('Bulk Lookup Existing Sources').all();\n\nfunction normKey(name) {\n  return (name || '')\n    .replace(/,?\\s*(Inc\\.?|LLC|Ltd\\.?|Corp\\.?|Co\\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\\.?A\\.?|AG|GmbH|B\\.?V\\.?)(\\s*\\.)?$/i, '')\n    .replace(/[.,]/g, '').trim().toLowerCase();\n}\n\nconst existingMap = {};\nfor (const rec of existingRecords) {\n  const rawName = (rec.json['Company Name'] || '').trim();\n  const nk = normKey(rawName);\n  if (nk) {\n    existingMap[nk] = {\n      canonicalName: rawName,\n      sources: rec.json['Discovery Sources'] || [],\n      confidence: rec.json['Discovery Confidence'] || 0,\n      firstDiscovered: rec.json['First Discovered'] || null\n    };\n  }\n}\n\nconst today = new Date().toISOString().split('T')[0];\nconst output = [];\n\nfor (const item of newCompanies) {\n  const company = item.json;\n  const incomingNk = normKey(company.companyName);\n  const existing = existingMap[incomingNk];\n  const outputCompanyName = existing ? existing.canonicalName : company.companyName;\n\n  let mergedSources = ['clinicaltrials_gov'];\n  let firstDiscovered = today;\n\n  if (existing) {\n    const prevSources = Array.isArray(existing.sources)\n      ? existing.sources.map(s => typeof s === 'object' ? s.name : s)\n      : [];\n    mergedSources = [...new Set([...prevSources, 'clinicaltrials_gov'])];\n    firstDiscovered = existing.firstDiscovered || today;\n  }\n\n  output.push({\n    json: {\n      companyName: outputCompanyName,\n      trialCount: company.trialCount,\n      mostAdvancedPhase: company.mostAdvancedPhase,\n      leadIndication: company.leadIndication,\n      allConditions: company.allConditions,\n      nctIds: company.nctIds,\n      mergedSources: mergedSources,\n      mergedConfidence: mergedSources.length,\n      firstDiscovered: firstDiscovered,\n      lastVerified: today,\n      mostRecentTrialDate: company.mostRecentTrialDate || null,\n      activeRecruiting: company.activeRecruiting === true\n    }\n  });\n}\nreturn output;" },
    position: [1568, 256]
  },
  output: [{ companyName: 'Example Corp', mergedSources: ['clinicaltrials_gov'] }]
});

const prepareRunLog = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Run Log',
    parameters: { jsCode: "// Build Enrichment Runs record \u2014 v2: includes multi-query metrics and classifier tier breakdown.\nconst upsertedItems = $('Merge Discovery Sources').all();\nconst extractedItems = $('Extract Industry Sponsors').all();\nconst totalStudies = extractedItems.length > 0 ? (extractedItems[0].json._totalStudiesProcessed || 0) : 0;\nconst companiesUpserted = upsertedItems.length;\n\nlet phase1 = 0, phase2 = 0, phase3 = 0, preclinical = 0;\nconst companies = [];\nfor (const item of upsertedItems) {\n  const c = item.json;\n  const phase = c.mostAdvancedPhase;\n  if (phase === 'Phase 3') phase3++;\n  else if (phase === 'Phase 2') phase2++;\n  else if (phase === 'Phase 1') phase1++;\n  else preclinical++;\n  companies.push(c.companyName + ' | ' + (c.mostAdvancedPhase || 'Unknown') + ' | ' + (c.leadIndication || 'N/A'));\n}\n\nconst today = new Date().toISOString().split('T')[0];\nconst report = [\n  '# ClinicalTrials.gov L1 Capture Run (v2 \u2014 multi-query + evidence capture)',\n  '',\n  '**Date:** ' + today,\n  '**Source:** clinicaltrials.gov API v2',\n  '**Queries:** AAV | adeno-associated | Dependovirus | AAV serotypes | gene therapy AND vector',\n  '**Essie filters:** InterventionType(GENETIC OR BIOLOGICAL), StudyType=INTERVENTIONAL, Phase 1-3',\n  '**Run Type:** L1_capture',\n  '**Studies processed (post-dedup):** ' + totalStudies,\n  '**Unique industry sponsors:** ' + companiesUpserted,\n  '',\n  '## Phase distribution',\n  '- Phase 3: ' + phase3,\n  '- Phase 2: ' + phase2,\n  '- Phase 1: ' + phase1,\n  '- Preclinical: ' + preclinical,\n  '',\n  '## Companies',\n  'Company | Phase | Lead Indication',\n  '--- | --- | ---',\n  ...companies\n].join('\\n');\n\nreturn [{\n  json: {\n    runName: 'CT.gov L1 Capture v2 - ' + today,\n    runDate: new Date().toISOString(),\n    play: 'aav-gene-therapy-ellie-outreach',\n    gateVersion: 'l1-capture-v2-multiquery',\n    runType: 'L1_capture',\n    runMode: 'incremental',\n    companiesEvaluated: totalStudies,\n    passedAAV: companiesUpserted,\n    rerouted: 0,\n    archived: 0,\n    markdownReport: report,\n    workflowId: '9gcmEjq1lvOY2jZS',\n    executionId: $execution.id,\n    recordsIn: totalStudies,\n    recordsOut: companiesUpserted,\n    notes: 'L1 capture v2. Multi-query union (5 queries) + Essie filters. Evidence fields captured per trial. target_classification events written for each trial. Classifier: tier1=high, tier2=medium(LLM pending), tier3=low.'\n  }\n}];" },
    position: [2016, 112]
  },
  output: [{ runName: 'CT.gov L1 Capture', companiesUpserted: 0 }]
});

const writeRunLog = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Write Run Log',
    parameters: {
      operation: 'create',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblEVSEqetmu4ScHe' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          Name: "={{ $json.runName }}",
          Status: 'Done',
          'Run Date': "={{ $json.runDate }}",
          Play: "={{ $json.play }}",
          'Gate Version': "={{ $json.gateVersion }}",
          'Run Type': "={{ $json.runType }}",
          'Run Mode': "={{ $json.runMode }}",
          'Companies Evaluated': "={{ $json.companiesEvaluated }}",
          'Passed (AAV)': "={{ $json.passedAAV }}",
          'Re-routed': "={{ $json.rerouted }}",
          Archived: "={{ $json.archived }}",
          'Markdown Report': "={{ $json.markdownReport }}",
          Notes: "={{ $json.notes }}",
          'Workflow ID': "={{ $json.workflowId }}",
          'Execution ID': "={{ $json.executionId }}",
          'Records In': "={{ $json.recordsIn }}",
          'Records Out': "={{ $json.recordsOut }}"
        },
        matchingColumns: [],
        attemptToConvertTypes: false,
        convertFieldsToString: false
      },
      options: { typecast: true }
    },
    credentials: { airtablePersonalAccessToken: newCredential('Airtable Personal Access Token') },
    position: [2240, 112]
  },
  output: [{}]
});

const upsertCompany = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Upsert Company',
    parameters: {
      operation: 'upsert',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblnj3YlOI3thjrXp' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Company Name': "={{ $json.companyName }}",
          'Discovery Sources': "={{ $json.mergedSources }}",
          'Discovery Confidence': "={{ $json.mergedConfidence }}",
          'Canonical Status': 'candidate',
          'First Discovered': "={{ $json.firstDiscovered }}",
          'Last Verified': "={{ $json.lastVerified }}",
          'Trial Count': "={{ $json.trialCount }}",
          'Most Advanced Phase': "={{ $json.mostAdvancedPhase }}",
          'Lead Indication': "={{ $json.leadIndication }}",
          'CT.gov NCT IDs': "={{ $json.nctIds }}",
          'CT.gov Indications': "={{ $json.allConditions }}",
          'Verification Status': 'needs_verification',
          'Employee Count': 0,
          'Company Score': 0,
          'Fit Score': 0,
          'Playbook Fit Score': 0,
          'In Cadence Count': 0,
          'Already Engaged Count': 0,
          'Patent Count': 0,
          'Segment Score': 0,
          'Press Mentions 12mo Count': 0,
          'Conference Attendance 12mo Count': 0,
          'Founded Year': 0,
          'Active Signals Count': 0,
          'Last Funding Amount USD': 0,
          'Total Known Funding USD': 0,
          'Number of Funding Rounds': 0,
          'Most Recent Trial Date': "={{ $json.mostRecentTrialDate }}",
          'Active Recruiting': "={{ $json.activeRecruiting }}"
        },
        matchingColumns: ['Company Name'],
        attemptToConvertTypes: false,
        convertFieldsToString: false
      },
      options: { typecast: true }
    },
    credentials: { airtablePersonalAccessToken: newCredential('Airtable Personal Access Token') },
    position: [2016, 384]
  },
  output: [{ id: 'recXXXXXXXXXXXXXX', fields: { 'Company Name': 'Example Corp' } }]
});

const resolveExplodeTrials = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resolve & Explode Trials',
    parameters: { jsCode: "// Resolve company record id from Upsert Company; join with per-trial array; explode to one item per trial.\n// v3: passes through disambiguation fields (studyType, primaryPurpose, meshes, etc.) for classifier.\nconst upsertedItems = $input.all();\nconst allSponsors = $('Extract Industry Sponsors').all();\n\nfunction normKey(name) {\n  return (name || '')\n    .replace(/,?\\s*(Inc\\.?|LLC|Ltd\\.?|Corp\\.?|Co\\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\\.?A\\.?|AG|GmbH|B\\.?V\\.?)(\\s*\\.)?$/i, '')\n    .replace(/[.,]/g, '').trim().toLowerCase();\n}\n\nconst sponsorTrialsMap = {};\nfor (const sponsor of allSponsors) {\n  const nk = normKey(sponsor.json.companyName || '');\n  if (nk && Array.isArray(sponsor.json.trials)) {\n    sponsorTrialsMap[nk] = sponsor.json.trials;\n  }\n}\n\nconst ENDED = ['TERMINATED', 'WITHDRAWN', 'SUSPENDED'];\nconst ACTIVE_STATUSES = ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION', 'NOT_YET_RECRUITING'];\nconst fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;\nconst now = Date.now();\nconst runDate = new Date().toISOString().split('T')[0];\n\nfunction computeVitality(overallStatus, startDate, lastUpdateDate) {\n  if (!overallStatus) return 'unknown';\n  const s = overallStatus.toUpperCase().trim();\n  if (ENDED.includes(s)) return 'ended';\n  if (ACTIVE_STATUSES.includes(s)) return 'active';\n  const refDate = lastUpdateDate || startDate;\n  if (!refDate) return 'dormant';\n  const d = new Date(refDate);\n  if (isNaN(d.getTime())) return 'unknown';\n  return (now - d.getTime()) <= fiveYearsMs ? 'active' : 'dormant';\n}\n\nconst output = [];\nfor (const item of upsertedItems) {\n  const recordId = item.json.id;\n  if (!recordId) continue;\n  const companyName = (item.json.fields && item.json.fields['Company Name']) || '';\n  const lookupKey = normKey(companyName);\n  const trials = sponsorTrialsMap[lookupKey] || [];\n\n  for (const trial of trials) {\n    if (!trial.nct) continue;\n    const eventDate = trial.lastUpdateDate || trial.startDate || null;\n    const vitality = computeVitality(trial.overallStatus, trial.startDate, trial.lastUpdateDate);\n    const phaseStr = trial.phase || '';\n    const briefTitle = trial.briefTitle || '';\n    const detail = [briefTitle, phaseStr].filter(Boolean).join(' | ');\n    const eventId = companyName + ' \u2014 clinical_trial_status \u2014 ' + trial.nct;\n    const rawPayload = (trial.rawStudyJson || '').substring(0, 95000);\n\n    output.push({\n      json: {\n        eventId,\n        companyRecordId: recordId,\n        companyName,\n        nct: trial.nct,\n        eventType: 'clinical_trial_status',\n        signalStateRaw: trial.overallStatus || '',\n        vitality,\n        eventDate,\n        mostRecentActivityDate: eventDate,\n        detectedAt: runDate,\n        sourceUrl: 'https://clinicaltrials.gov/study/' + trial.nct,\n        provider: 'clinicaltrials.gov',\n        rawReference: 'ctgov:' + trial.nct,\n        detail,\n        isLatest: true,\n        confidence: 'high',\n        briefTitle,\n        studyType: trial.studyType || '',\n        interventionTypes: trial.interventionTypes || '',\n        interventionNames: trial.interventionNames || '',\n        conditionsList: trial.conditionsList || (trial.conditions || []).join('\\n'),\n        meshInterventions: trial.meshInterventions || [],\n        meshConditions: trial.meshConditions || [],\n        primaryPurpose: trial.primaryPurpose || '',\n        briefSummary: trial.briefSummary || '',\n        rawStudyJson: rawPayload,\n      }\n    });\n  }\n}\nreturn output;" },
    position: [2240, 384]
  },
  output: [{ eventId: 'Example — clinical_trial_status — NCT00000001', nct: 'NCT00000001' }]
});

const classifyTrials = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Classify Trials',
    parameters: { jsCode: "// Tiered classifier: deterministic Tier 1 + Tier 3; heuristic Tier 2 (LLM augmentation deferred to v2).\n// Outputs all items with classifierTier, classifierConfidence, classifierDetail added.\nconst items = $input.all();\nconst runDate = new Date().toISOString().split('T')[0];\n\nfunction classifyTrial(trial) {\n  const meshI = (trial.meshInterventions || []).map(m => (m.term || '').toLowerCase());\n  const meshC = (trial.meshConditions || []).map(m => (m.term || '').toLowerCase());\n  const allMesh = [...meshI, ...meshC];\n  const intTypes = (trial.interventionTypes || '').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);\n  const pp = (trial.primaryPurpose || '').toUpperCase();\n  const intName = (trial.interventionNames || '').toLowerCase();\n  const summary = (trial.briefSummary || '').toLowerCase();\n\n  const hasDependovirus = allMesh.some(m => m.includes('dependovirus') || m.includes('adeno-associated'));\n  const hasGeneTherapyMesh = allMesh.some(m => m.includes('genetic therapy') || m.includes('gene therapy') || m.includes('gene transfer'));\n  const hasGenBio = intTypes.some(t => ['GENETIC', 'BIOLOGICAL'].includes(t));\n  const hasDrugDeviceOnly = intTypes.length > 0 && intTypes.every(t => ['DRUG', 'DEVICE', 'PROCEDURE'].includes(t));\n  const isBasicOrDiag = ['BASIC_SCIENCE', 'DIAGNOSTIC'].includes(pp);\n  const isTreatment = pp === 'TREATMENT';\n  const hasAAVName = /\\baav\\b|adeno.associated|dependovirus/.test(intName) || /\\baav\\b|adeno.associated/.test(summary.substring(0, 300));\n\n  // Tier 3: definitive reject\n  if (hasDrugDeviceOnly && !hasGenBio) return { tier: 'tier3_reject', confidence: 'low', reason: 'All interventions are DRUG/DEVICE; no GENETIC/BIOLOGICAL type' };\n  if (isBasicOrDiag) return { tier: 'tier3_reject', confidence: 'low', reason: `primaryPurpose=${pp}` };\n\n  // Tier 1 high: deterministic AAV confirmation\n  if (hasDependovirus && hasGenBio && isTreatment) return { tier: 'tier1_mesh_match', confidence: 'high', reason: 'MeSH Dependovirus + GENETIC/BIOLOGICAL intervention type + TREATMENT purpose' };\n  if (hasDependovirus && hasGeneTherapyMesh) return { tier: 'tier1_mesh_match', confidence: 'high', reason: 'MeSH Dependovirus + gene therapy MeSH' };\n  if (hasAAVName && hasGenBio && isTreatment) return { tier: 'tier1_name_match', confidence: 'high', reason: 'AAV/adeno-associated in intervention name + GENETIC/BIOLOGICAL + TREATMENT' };\n\n  // Tier 2: ambiguous \u2014 LLM augmentation deferred; use heuristic medium\n  if (hasGenBio || hasAAVName || hasDependovirus) return { tier: 'tier2_heuristic', confidence: 'medium', reason: 'Partial signals present; LLM classification pending (v2)' };\n\n  // Tier 3 weak: no signals\n  return { tier: 'tier3_weak', confidence: 'low', reason: 'No AAV signals detected in MeSH, intervention type, or intervention name' };\n}\n\nconst output = [];\nfor (const item of items) {\n  const trial = item.json;\n  const cls = classifyTrial(trial);\n\n  const meshTerms = [\n    ...(trial.meshInterventions || []).map(m => m.term),\n    ...(trial.meshConditions || []).map(m => m.term),\n  ].filter(Boolean).join(', ');\n\n  const evidenceDetail = [\n    `Tier: ${cls.tier}`,\n    `Reason: ${cls.reason}`,\n    `MeSH: ${meshTerms || 'none'}`,\n    `Intervention types: ${trial.interventionTypes || 'unknown'}`,\n    `Primary purpose: ${trial.primaryPurpose || 'unknown'}`,\n    `Study type: ${trial.studyType || 'unknown'}`,\n  ].join(' | ');\n\n  const rawPayload = JSON.stringify({\n    nct: trial.nct,\n    meshInterventions: trial.meshInterventions,\n    meshConditions: trial.meshConditions,\n    interventionTypes: trial.interventionTypes,\n    interventionNames: trial.interventionNames,\n    primaryPurpose: trial.primaryPurpose,\n    studyType: trial.studyType,\n    briefSummary: (trial.briefSummary || '').substring(0, 500),\n    briefTitle: trial.briefTitle,\n  }).substring(0, 95000);\n\n  output.push({\n    json: {\n      ...trial,\n      classifierTier: cls.tier,\n      classifierConfidence: cls.confidence,\n      classifierReason: cls.reason,\n      classifierDetail: evidenceDetail,\n      classifierRawPayload: rawPayload,\n      categoriesTags: `aav-gene-therapy\\n${cls.tier}`,\n    }\n  });\n}\nreturn output;" },
    position: [2464, 384]
  },
  output: [{ classifierTier: 'tier1_mesh_match', classifierConfidence: 'high' }]
});

const writeTrialSignals = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Write Trial Signals',
    parameters: {
      operation: 'upsert',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblnzX2b2kqNGzW6r' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Event ID': "={{ $json.eventId }}",
          'Event Type': "={{ $json.eventType }}",
          'External ID': "={{ $json.nct }}",
          'Signal State (raw)': "={{ $json.signalStateRaw }}",
          Vitality: "={{ $json.vitality }}",
          'Event Date': "={{ $json.eventDate }}",
          'Most Recent Activity Date': "={{ $json.mostRecentActivityDate }}",
          'Detected At': "={{ $json.detectedAt }}",
          'Source URL': "={{ $json.sourceUrl }}",
          Provider: "={{ $json.provider }}",
          'Raw Reference': "={{ $json.rawReference }}",
          Detail: "={{ $json.detail }}",
          Company: "={{ [$json.companyRecordId] }}",
          'Is Latest': "={{ $json.isLatest }}",
          Confidence: "={{ $json.confidence }}",
          Title: "={{ $json.briefTitle }}",
          'Study Type': "={{ $json.studyType }}",
          'Intervention Type': "={{ $json.interventionTypes }}",
          'Intervention Names': "={{ $json.interventionNames }}",
          Conditions: "={{ $json.conditionsList }}",
          'Raw Payload': "={{ $json.rawStudyJson ? $json.rawStudyJson.substring(0, 95000) : '' }}"
        },
        matchingColumns: ['Event ID'],
        attemptToConvertTypes: false,
        convertFieldsToString: false
      },
      options: { typecast: true }
    },
    credentials: { airtablePersonalAccessToken: newCredential('Airtable Personal Access Token') },
    position: [2688, 256]
  },
  output: [{}]
});

const writeClassificationEvents = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Write Classification Events',
    parameters: {
      operation: 'upsert',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblnzX2b2kqNGzW6r' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Event ID': "={{ $json.companyName + ' — target_classification — ' + $json.nct }}",
          'Event Type': 'target_classification',
          'External ID': "={{ $json.nct }}",
          'Signal State (raw)': "={{ $json.classifierTier }}",
          'Event Date': "={{ $json.detectedAt }}",
          'Detected At': "={{ $json.detectedAt }}",
          'Source URL': "={{ $json.sourceUrl }}",
          Provider: "={{ $json.provider }}",
          'Raw Reference': "={{ $json.rawReference }}",
          Detail: "={{ $json.classifierDetail }}",
          Company: "={{ [$json.companyRecordId] }}",
          'Is Latest': true,
          Confidence: "={{ $json.classifierConfidence }}",
          Title: "={{ $json.classifierTier }}",
          'Categories / Tags': "={{ $json.categoriesTags }}",
          'Raw Payload': "={{ $json.classifierRawPayload }}"
        },
        matchingColumns: ['Event ID'],
        attemptToConvertTypes: false,
        convertFieldsToString: false
      },
      options: { typecast: true }
    },
    credentials: { airtablePersonalAccessToken: newCredential('Airtable Personal Access Token') },
    position: [2688, 512]
  },
  output: [{}]
});

const batchForAirtable = splitInBatches({
  version: 3,
  config: {
    name: 'Batch for Airtable',
    parameters: { batchSize: 10 },
    position: [1792, 256]
  }
});

export default workflow('9gcmEjq1lvOY2jZS', 'Canonical AAV Discovery - L1 ClinicalTrials.gov')
  .add(schedule)
  .to(defineSearchQueries)
  .to(fetchAAVStudies)
  .to(deduplicateNCTs)
  .to(extractIndustrySponsors)
  .to(bulkLookupExisting)
  .to(mergeDiscoverySources)
  .to(batchForAirtable
    .onDone(prepareRunLog.to(writeRunLog))
    .onEachBatch(upsertCompany.to(resolveExplodeTrials).to(classifyTrials).to(writeTrialSignals).to(writeClassificationEvents).to(nextBatch(batchForAirtable)))
  );
