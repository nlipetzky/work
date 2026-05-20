const data = $json;
const original = $('Get Unenriched Companies').item.json;

const matchedBusinessId = $('Match Business').item.json.matched_businesses?.[0]?.business_id || null;
const classificationRunId = 'run_' + Date.now() + '_' + original.id;
const gateVersion = '1.7.0';
const ts = new Date().toISOString();

const firm = data.enriched_data?.[0]?.data || {};

const rawDomain = original.fields?.Domain || firm.domain || firm.website || '';
const afterProtocol = rawDomain.replace(/^https?:\/\//, '');
const withoutWww = afterProtocol.startsWith('www.') ? afterProtocol.slice(4) : afterProtocol;
const cleanDomain = withoutWww.split('/')[0].trim();

const verificationStatus = (original.fields?.['Verification Status'] || '').toString().toLowerCase();
const l2Validated = verificationStatus === 'surfaced' || verificationStatus === 'borderline';

const BIOTECH_NAICS_PREFIXES = ['325414', '325413', '325411', '541714', '3254'];
const BIOTECH_KEYWORDS = ['biotech', 'biolog', 'gene', 'pharma', 'biopharma', 'biopharmaceutical', 'life science'];
const NA_COUNTRIES = ['united states', 'us', 'usa', 'canada', 'ca'];

const industry = (firm.naics_description || '').toLowerCase();
const naics = String(firm.naics || '').trim();

// HQ Country is the single source of truth for geography qualification.
// Manually-set values (e.g. correcting an Explorium parent-entity mismatch) take precedence.
// When empty, Explorium entity country is used and written back to HQ Country.
const hqCountryRaw = (original.fields?.['HQ Country'] || '').trim();
const explorimCountryRaw = (firm.country_name || '').trim();
const hqCountryDisplay = hqCountryRaw || explorimCountryRaw;
const effectiveCountry = hqCountryDisplay.toLowerCase();
const geographySource = hqCountryRaw ? 'hq_country_field' : 'explorium_firmographics';
const inNA = NA_COUNTRIES.some(c => effectiveCountry.includes(c));

const hasBiotechNAICS = BIOTECH_NAICS_PREFIXES.some(prefix => naics.startsWith(prefix));
const hasBiotechKeyword = BIOTECH_KEYWORDS.some(kw => industry.includes(kw));
const qualified = (hasBiotechNAICS || hasBiotechKeyword) && inNA;

const qualReason = !inNA
  ? 'outside_na'
  : hasBiotechNAICS ? 'naics_match'
  : hasBiotechKeyword ? 'industry_keyword'
  : 'no_biotech_signal';

const gate1Modality = !inNA ? 'geography_mismatch' : 'out_of_industry';
const gate1Source = !inNA
  ? 'gate1:' + geographySource
  : 'explorium_firmographics:linkedin_category';
const gate1Keywords = !inNA
  ? (hqCountryDisplay ? JSON.stringify([hqCountryDisplay]) : null)
  : (firm.naics_description ? JSON.stringify([firm.naics_description]) : null);

let classificationNotes = null;
let finalRouting = null;
if (!qualified) {
  finalRouting = 'archived_out_of_industry';
  classificationNotes = ts + ' | Gate v' + gateVersion + '\n' +
    'Outcome: archive_' + gate1Modality + '\n\n' +
    'Match: matched\n' +
    '  - Explorium business_id: ' + (matchedBusinessId || 'none') + '\n' +
    '  - NAICS: ' + (firm.naics || 'n/a') + ' (' + (firm.naics_description || 'n/a') + ')\n' +
    '  - Industry: ' + (firm.naics_description || 'n/a') + '\n\n' +
    'Gate 1 (industry filter): fail\n' +
    '  - Reason: ' + qualReason + '\n' +
    '  - HQ Country: ' + (hqCountryDisplay || 'n/a') + '\n' +
    '  - Geography source: ' + geographySource + '\n' +
    '  - In NA: ' + inNA + '\n' +
    '  - Biotech NAICS match: ' + hasBiotechNAICS + '\n' +
    '  - Biotech keyword match: ' + hasBiotechKeyword + '\n\n' +
    'Gate 2 (modality fetch): skipped (filtered by Gate 1)\n\n' +
    'Final routing: archived_out_of_industry';
}

return [{ json: {
  _id: original.id,
  _pathContext: 'matched',
  _isQualified: qualified,
  _qualReason: qualReason,
  _matchedBusinessId: matchedBusinessId,
  _hqCountryDisplay: hqCountryDisplay || null,
  _state: firm.region_name || null,
  _city: firm.city_name || null,
  _industry: firm.naics_description || null,
  _naics: firm.naics || null,
  _revenueRange: firm.yearly_revenue_range || null,
  _linkedinUrl: firm.linkedin_profile || null,
  _domain: original.fields?.Domain || firm.domain || firm.website || null,
  _employeeRange: firm.number_of_employees_range || null,
  _ticker: firm.ticker || null,
  _cleanDomain: cleanDomain,
  _l2Validated: l2Validated,
  _l2VerificationStatus: verificationStatus || null,
  _classificationRunId: classificationRunId,
  _gateVersion: gateVersion,
  _geographySource: geographySource,
  _companyName: original.fields?.['Company Name'] || null,
  _modality: qualified ? null : gate1Modality,
  _modalitySource: qualified ? null : gate1Source,
  _modalityConfidence: qualified ? null : 'high',
  _detectedKeywords: qualified ? null : gate1Keywords,
  _finalRouting: finalRouting,
  _classificationNotes: classificationNotes,
} }];
