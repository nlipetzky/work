// Merge new clinicaltrials_gov source with any existing Discovery Sources
// v2: normKey matching prevents duplicate rows when legal suffix differs (e.g. "PTC Therapeutics Ltd." vs "PTC Therapeutics")
const newCompanies = $('Extract Industry Sponsors').all();
const existingRecords = $('Bulk Lookup Existing Sources').all();

function normKey(name) {
  return (name || '')
    .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|Incorporated|Limited|Corporation|Company|Plc|PLC|S\.?A\.?|AG|GmbH|B\.?V\.?)(\s*\.)?$/i, '')
    .replace(/[.,]/g, '').trim().toLowerCase();
}

// Build map keyed by normKey; store canonical name so Airtable upsert matches existing row
const existingMap = {};
for (const rec of existingRecords) {
  // Airtable search node in n8n v2 returns fields at top level of rec.json
  const rawName = (rec.json['Company Name'] || '').trim();
  const nk = normKey(rawName);
  if (nk) {
    existingMap[nk] = {
      canonicalName: rawName,
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
  const incomingNk = normKey(company.companyName);
  const existing = existingMap[incomingNk];

  // When normKey matches, use canonical name: Airtable upsert will UPDATE not CREATE
  const outputCompanyName = existing ? existing.canonicalName : company.companyName;

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
      companyName: outputCompanyName,
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
