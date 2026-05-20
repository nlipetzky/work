// MODIFIED Extract Industry Sponsors — L1 ClinicalTrials.gov
// Delta vs deployed: adds `trials: []` to sponsor init + push per-trial objects + `trials: s.trials` in output
// All existing rollup fields are unchanged.
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
      .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\.?A\.?|AG|GmbH|B\.?V\.?)?\s*$/i, '')
      .replace(/[.,]/g, '').trim().toLowerCase();
    if (!sponsors[normKey]) {
      sponsors[normKey] = { companyName: rawName, trialCount: 0, phases: [], conditions: [], nctIds: [], statuses: [], sampleIntervention: '', mostRecentTrialDate: null, activeRecruiting: false, trials: [] };
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

    // NEW: push per-trial object to trials array
    if (nctId) {
      s.trials.push({
        nct: nctId,
        overallStatus: status || null,
        startDate: normDate(sd),
        lastUpdateDate: normDate(ld),
        phase: phases.length > 0 ? phases[0] : null,
        briefTitle: idModule && idModule.briefTitle ? idModule.briefTitle : null,
        conditions: conditions.slice(0, 5)
      });
    }

    const collaborators = sponsorModule.collaborators || [];
    for (const collab of collaborators) {
      if (collab.class !== 'INDUSTRY') continue;
      const collabNorm = collab.name.trim()
        .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\.?A\.?|AG|GmbH|B\.?V\.?)?\s*$/i, '')
        .replace(/[.,]/g, '').trim().toLowerCase();
      if (!sponsors[collabNorm]) {
        sponsors[collabNorm] = { companyName: collab.name.trim(), trialCount: 0, phases: [], conditions: [], nctIds: [], statuses: [], sampleIntervention: '', mostRecentTrialDate: null, activeRecruiting: false, trials: [] };
      }
      const cs = sponsors[collabNorm];
      cs.trialCount++;
      for (const p of phases) { if (!cs.phases.includes(p)) cs.phases.push(p); }
      if (status && ACTIVE.includes(status)) cs.activeRecruiting = true;
      for (const dRaw of [sd, ld]) {
        const d = normDate(dRaw);
        if (d && (!cs.mostRecentTrialDate || d > cs.mostRecentTrialDate)) cs.mostRecentTrialDate = d;
      }
      // NEW: collaborator shares this trial
      if (nctId) {
        cs.trials.push({
          nct: nctId,
          overallStatus: status || null,
          startDate: normDate(sd),
          lastUpdateDate: normDate(ld),
          phase: phases.length > 0 ? phases[0] : null,
          briefTitle: idModule && idModule.briefTitle ? idModule.briefTitle : null,
          conditions: conditions.slice(0, 5)
        });
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
      _totalStudiesProcessed: totalStudiesProcessed,
      trials: s.trials
    }
  });
}
return output;
