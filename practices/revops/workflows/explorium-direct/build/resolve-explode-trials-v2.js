// Resolve company record id from Upsert Company; join with per-trial array; explode to one item per trial.
// v2: normKey lookup in sponsorTrialsMap so canonical-name upserts still join to original trial data.
const upsertedItems = $input.all();
const allSponsors = $('Extract Industry Sponsors').all();

function normKey(name) {
  return (name || '')
    .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\.?A\.?|AG|GmbH|B\.?V\.?)(\s*\.)?$/i, '')
    .replace(/[.,]/g, '').trim().toLowerCase();
}

// Key by normKey so canonical-name upserts still join to original trial data
const sponsorTrialsMap = {};
for (const sponsor of allSponsors) {
  const nk = normKey(sponsor.json.companyName || '');
  if (nk && Array.isArray(sponsor.json.trials)) {
    sponsorTrialsMap[nk] = sponsor.json.trials;
  }
}

const ENDED = ['TERMINATED', 'WITHDRAWN', 'SUSPENDED'];
const ACTIVE_STATUSES = ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION', 'NOT_YET_RECRUITING'];
const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
const now = Date.now();
const runDate = new Date().toISOString().split('T')[0];

function computeVitality(overallStatus, startDate, lastUpdateDate) {
  if (!overallStatus) return 'unknown';
  const s = overallStatus.toUpperCase().trim();
  if (ENDED.includes(s)) return 'ended';
  if (ACTIVE_STATUSES.includes(s)) return 'active';
  const refDate = lastUpdateDate || startDate;
  if (!refDate) return 'dormant';
  const d = new Date(refDate);
  if (isNaN(d.getTime())) return 'unknown';
  return (now - d.getTime()) <= fiveYearsMs ? 'active' : 'dormant';
}

const output = [];
for (const item of upsertedItems) {
  const recordId = item.json.id;
  if (!recordId) continue;
  const companyName = (item.json.fields && item.json.fields['Company Name']) || '';
  const lookupKey = normKey(companyName);
  const trials = sponsorTrialsMap[lookupKey] || [];

  for (const trial of trials) {
    if (!trial.nct) continue;
    const eventDate = trial.lastUpdateDate || trial.startDate || null;
    const vitality = computeVitality(trial.overallStatus, trial.startDate, trial.lastUpdateDate);
    const phaseStr = trial.phase || '';
    const briefTitle = trial.briefTitle || '';
    const detail = [briefTitle, phaseStr].filter(Boolean).join(' | ');
    const eventId = companyName + ' — clinical_trial_status — ' + trial.nct;

    output.push({
      json: {
        eventId,
        companyRecordId: recordId,
        companyName,
        nct: trial.nct,
        eventType: 'clinical_trial_status',
        signalStateRaw: trial.overallStatus || '',
        vitality,
        eventDate,
        mostRecentActivityDate: eventDate,
        detectedAt: runDate,
        sourceUrl: 'https://clinicaltrials.gov/study/' + trial.nct,
        provider: 'clinicaltrials.gov',
        rawReference: 'ctgov:' + trial.nct,
        detail,
        isLatest: true,
        confidence: 'high'
      }
    });
  }
}
return output;
