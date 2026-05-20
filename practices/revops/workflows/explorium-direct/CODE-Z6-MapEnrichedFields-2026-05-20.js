// FULL REPLACEMENT — Map Enriched Fields (workflow Z6RROKx5omdfvhtn)
// Changes vs prior version:
//   1. Truncation cap bumped 95K → 100K
//   2. explorium_payload_truncated flag added
//   3. Every Explorium deep + firmographic + match-business key folded
//      into explorium_<key> columns alongside the existing curated columns

function foldExplorium(src, prefix) {
  const out = {};
  if (!src || typeof src !== 'object') return out;
  for (const k of Object.keys(src)) {
    const v = src[k];
    const col = prefix + k;
    if (v === null || v === undefined) { out[col] = null; continue; }
    if (Array.isArray(v)) {
      if (v.length === 0) { out[col] = null; continue; }
      if (typeof v[0] === 'object') { out[col] = JSON.stringify(v, null, 2); continue; }
      out[col] = v.join('\n');
      continue;
    }
    if (typeof v === 'object') { out[col] = JSON.stringify(v, null, 2); continue; }
    out[col] = v;
  }
  return out;
}

const qualify = $('Check AAV Modality').first().json;
const deep = $json.enriched_data?.[0]?.data || {};
const firm = $('Enrich Firmographics Only').first()?.json?.enriched_data?.[0]?.data || {};
const matched = $('Match Business').first()?.json?.matched_businesses?.[0] || {};
const __prior = $('Get Unenriched Companies').item.json.fields?.['Enrichment Provider'] || [];
const __providers = Array.from(new Set([...__prior, 'explorium']));

const fundingDate = deep.last_funding_round_date ? String(deep.last_funding_round_date).split('T')[0] : null;
const lastFundingUSD = deep.last_funding_round_value_usd ? Number(deep.last_funding_round_value_usd) : null;
const totalFundingUSD = deep.known_funding_total_value ? Number(deep.known_funding_total_value) : null;

const competitors = Array.isArray(deep.key_competitors) && deep.key_competitors.length
  ? deep.key_competitors.slice(0, 20).join('\n')
  : null;

const focus = Array.isArray(deep.company_focus) && deep.company_focus.length
  ? deep.company_focus.join('\n\n')
  : (typeof deep.company_focus === 'string' ? deep.company_focus : null);

const narrativeOf = (val, header) => {
  if (!val) return null;
  const text = Array.isArray(val) ? val.join('\n') : String(val);
  if (!text.trim()) return null;
  return '## ' + header + '\n' + text;
};

const strategicNotes = [
  narrativeOf(deep.company_competition, 'Competition'),
  narrativeOf(deep.company_market_saturation, 'Market saturation'),
  narrativeOf(deep.company_customer_adoption, 'Customer adoption'),
  narrativeOf(deep.company_data_security_privacy, 'Regulatory / privacy'),
].filter(Boolean).join('\n\n') || null;

// Raw blob fallback. Cap at Airtable cell limit (100K). Flag if truncated.
let rawBlob = null;
let payloadTruncated = false;
try {
  rawBlob = JSON.stringify(deep);
  if (rawBlob && rawBlob.length > 100000) {
    rawBlob = rawBlob.slice(0, 100000) + '...[truncated]';
    payloadTruncated = true;
  }
} catch (e) {
  rawBlob = null;
}

// AAV Segment classifier
const KNOWN_CDMOS = [
  'forge biologics', 'andelyn biosciences', 'catalent', 'resilience',
  'national resilience', 'charles river', 'probio', 'thermo fisher',
  'brammer bio', 'lonza', 'agc biologics', 'aavnergene',
];
const CDMO_WITH_PIPELINE = ['forge biologics'];
const companyNamesToCheck = [
  (deep.company_name || deep.name || '').toLowerCase().trim(),
  (qualify._companyName || '').toLowerCase().trim(),
].join(' ');
const CDMO_WEB_TERMS = [
  'cdmo', 'contract manufacturing', 'contract development',
  'manufacturing services', 'process development', 'vector production services',
  'aav production', 'gmp manufacturing', 'viral vector services',
  'contract development and manufacturing',
];
const THERAPY_WEB_TERMS = [
  'our pipeline', 'our programs', 'clinical trial', 'ind submission',
  'phase 1', 'phase 2', 'phase 3', 'investigational new drug',
];

const webText = (qualify._gate2CombinedText || '').toLowerCase();
const isKnownCDMO = KNOWN_CDMOS.some(c => companyNamesToCheck.includes(c));
const isCDMOWithPipeline = CDMO_WITH_PIPELINE.some(c => companyNamesToCheck.includes(c));
const hasTrialEvidence = !!(qualify._modalitySource && qualify._modalitySource.includes('l2_classify'));
const hasCDMOWebSignal = webText && CDMO_WEB_TERMS.some(t => webText.includes(t));
const hasTherapyWebSignal = webText && THERAPY_WEB_TERMS.some(t => webText.includes(t));

let aavSegment;
if (isKnownCDMO && isCDMOWithPipeline) {
  aavSegment = 'both';
} else if (isKnownCDMO) {
  aavSegment = 'production_tool';
} else if (hasCDMOWebSignal && !hasTrialEvidence && !hasTherapyWebSignal) {
  aavSegment = 'production_tool';
} else if (hasCDMOWebSignal && (hasTrialEvidence || hasTherapyWebSignal)) {
  aavSegment = 'both';
} else if (hasTrialEvidence || hasTherapyWebSignal) {
  aavSegment = 'gene_therapy';
} else {
  aavSegment = 'unknown';
}

const DELIVERY_VEHICLE_MAP = {
  aav: 'AAV',
  lentiviral: 'Lentiviral',
  adenovirus: 'Adenovirus',
  lnp: 'LNP',
  non_viral: 'Non-viral',
  electroporation: 'Electroporation',
};
const deliveryVehicle = DELIVERY_VEHICLE_MAP[qualify._modality] || null;

const ticker = qualify._ticker || '';
const US_TICKER_PREFIXES = ['xnas:', 'xnys:', 'xase:', 'xamx:', 'nasdaq:', 'nyse:'];
let publiclyTraded = null;
if (ticker) {
  const lowerTicker = ticker.toLowerCase();
  publiclyTraded = US_TICKER_PREFIXES.some(p => lowerTicker.startsWith(p)) ? 'public-domestic' : 'public-foreign';
} else {
  publiclyTraded = 'private';
}

const parentName = deep.parent_company_name || null;
const ultimateParent = deep.ultimate_parent_name || null;
const companyNameLower = (qualify._matchedBusinessId ? (deep.company_name || deep.name || '') : '').toLowerCase().trim();
const ultimateParentLower = (ultimateParent || '').toLowerCase().trim();
let subsidiaryStatus = null;
if (parentName) {
  subsidiaryStatus = 'subsidiary';
} else if (!ultimateParent || ultimateParentLower === companyNameLower) {
  subsidiaryStatus = 'independent';
} else {
  subsidiaryStatus = 'unknown';
}

// Fold all Explorium keys into explorium_<key> columns.
// Deep overrides firmographic on key collision. Match-business contributes business_id.
const exploriumFlat = Object.assign(
  {},
  foldExplorium(matched, 'explorium_'),
  foldExplorium(firm, 'explorium_'),
  foldExplorium(deep, 'explorium_'),
);
// "input" is internal echo from match-business; drop.
delete exploriumFlat.explorium_input;

const curated = {
  id: qualify._id,
  "Industry": qualify._industry || null,
  "Revenue Range": qualify._revenueRange || null,
  "HQ Country": qualify._hqCountryDisplay || null,
  "HQ State": qualify._state || null,
  "HQ City": qualify._city || null,
  "Company LinkedIn URL": qualify._linkedinUrl || null,
  "Employee Range": qualify._employeeRange || null,
  "NAICS Code": qualify._naics || null,
  "Domain": qualify._domain || null,
  "Explorium Business ID": qualify._matchedBusinessId || null,
  "Stock Ticker": qualify._ticker || null,
  "Last Enriched At": new Date().toISOString(),
  "Enrichment Status": "enrichment_complete",
  "Custom Classification": qualify._modality || null,
  "Custom Classification Source": qualify._modalitySource || null,
  "Custom Classification Confidence": qualify._modalityConfidence || null,
  "Custom Classification Detected Keywords": qualify._detectedKeywords || null,
  "Classification Run ID": qualify._classificationRunId || null,
  "Gate Version": qualify._gateVersion || null,
  "Classification Notes": qualify._classificationNotes || null,
  "Founded Year": deep.founded_year || null,
  "Parent Company": deep.parent_company_name || null,
  "Ultimate Parent": deep.ultimate_parent_name || null,
  "Funding Stage": deep.last_funding_round_type || null,
  "Last Funding Date": fundingDate,
  "Last Funding Amount USD": lastFundingUSD,
  "Total Known Funding USD": totalFundingUSD,
  "Number of Funding Rounds": deep.number_of_funding_rounds || null,
  "SEC CIK": deep.cik || null,
  "Key Competitors": competitors,
  "Company Focus": focus,
  "Strategic Notes": strategicNotes,
  "Deep Enrichment Raw": rawBlob,
  "Delivery Vehicle": deliveryVehicle,
  "Publicly Traded": publiclyTraded,
  "Subsidiary Status": subsidiaryStatus,
  "AAV Segment": aavSegment,
  "explorium_payload_truncated": payloadTruncated,
  "Enrichment Provider": __providers,
};

return [{ json: Object.assign({}, curated, exploriumFlat) }];
