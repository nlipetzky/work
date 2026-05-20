const qualify = $('IF Biotech?').first().json;
const responses = $input.all();
const urlItems = $('Build URLs Matched').all();

if (qualify._l2Validated) {
  const ts = new Date().toISOString();
  const gateVersion = qualify._gateVersion || '1.6.0';
  const classificationNotes = ts + ' | Gate v' + gateVersion + '\n' +
    'Outcome: pass_l2_validated_skip_web_gate\n\n' +
    'Match: matched\n' +
    '  - Explorium business_id: ' + (qualify._matchedBusinessId || 'none') + '\n' +
    '  - NAICS: ' + (qualify._naics || 'n/a') + ' (' + (qualify._industry || 'n/a') + ')\n' +
    '  - Industry: ' + (qualify._industry || 'n/a') + '\n\n' +
    'Gate 1 (industry filter): pass\n' +
    '  - Reason: ' + (qualify._qualReason || 'n/a') + '\n\n' +
    'Gate 2 (modality fetch): SKIPPED ... L2 Classify already validated AAV via CT.gov trial evidence (Verification Status: ' + (qualify._l2VerificationStatus || 'n/a') + ')\n\n' +
    'Final routing: enrichment_complete\n' +
    'Reason: Upstream gate (L2 Classify) confirmed AAV based on clinical trial sponsorship. Website vocabulary check skipped because trial evidence is more authoritative than marketing copy. This handles mature commercial-stage AAV companies (Spark, BioMarin, etc.) whose public sites have moved past technical vocabulary.';
  return [{ json: {
    ...qualify,
    _isAAV: true,
    _modality: 'aav',
    _modalitySource: 'l2_classify_trial_evidence',
    _modalityConfidence: 'high',
    _detectedKeywords: null,
    _gate2UrlsHit: 'skipped:l2_validated',
    _gate2ContentLen: 0,
    _gate2AnchorCount: 0,
    _gate2MechCount: 0,
    _gate2AAVRegexCount: 0,
    _gate2ExclusionCount: 0,
    _gate2CombinedText: null,
    _finalRouting: 'enrichment_complete',
    _classificationNotes: classificationNotes,
  } }];
}

const AAV_ANCHOR = ['aav', 'adeno-associated virus', 'adeno-associated viral'];
const VECTOR_MECH = ['vector', 'capsid', 'transduction', 'viral delivery', 'serotype'];
const EXCLUSION_TOKENS = {
  lentiviral: ['lentiviral', 'lentivirus'],
  peptide: ['peptide'],
  small_molecule: ['small molecule'],
  rna_editing: ['rna editing', 'mrna therap', 'sirna', 'crispr', 'base editing', 'prime editing'],
  autologous_cell: ['autologous cell', 'car-t', 'car t-cell', 'ipsc'],
  non_viral: ['non-viral delivery', 'lipid nanoparticle', 'lnp ', 'ctdna'],
};
const EXCLUSION_CONTEXT = ['therapeutic', 'therapeutics', 'pipeline', 'drug', 'platform', 'program', 'candidate', 'medicine'];
const GENE_THERAPY_PHRASES = ['gene therapy', 'gene therapies', 'genetic medicines', 'genetic medicine', 'cell and gene therap', 'gene and biologic therap', 'gene-to-cell', 'cell-and-gene'];
const PARENT_COMPANY_DOMAINS = ['thermofisher.com', 'lonza.com', 'catalent.com', 'charlesriver.com', 'merckmillipore.com', 'sartorius.com', 'cytiva.com'];

const cleanDomain = qualify._cleanDomain || '';
const isParentCompanyDomain = PARENT_COMPANY_DOMAINS.some(d => cleanDomain === d || cleanDomain.endsWith('.' + d));
const matchedParentDomain = PARENT_COMPANY_DOMAINS.find(d => cleanDomain === d || cleanDomain.endsWith('.' + d)) || null;

const hitUrls = [];
let combinedRaw = '';
let combinedLen = 0;

for (let i = 0; i < responses.length; i++) {
  const raw = responses[i]?.json?.data;
  const url = urlItems[i]?.json?.url || ('attempt_' + i);
  if (typeof raw !== 'string' || raw.length < 200) continue;
  const stripped = raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  combinedRaw += ' ' + stripped;
  combinedLen += raw.length;
  hitUrls.push(url);
}

const text = combinedRaw.toLowerCase().slice(0, 80000);
const urlsAttempted = urlItems.length;
const urlsHitCount = hitUrls.length;

const ts = new Date().toISOString();
const gateVersion = qualify._gateVersion || '1.6.0';

let foundAnchor = [];
let foundMech = [];
let aavMatchCount = 0;
let detectedExclusion = null;
let exclusionHits = [];
let isAAV = false;
let isGeneTherapyBranded = false;
let modality, confidence, source, finalRouting, outcomeLabel, reviewReason;

if (isParentCompanyDomain) {
  modality = 'parent_company_domain';
  confidence = 'high';
  source = 'domain_match:parent_company_list:' + matchedParentDomain;
  finalRouting = 'needs_data_quality_review';
  outcomeLabel = 'review_parent_company_domain';
  reviewReason = 'Domain matches a known parent-company / tools-vendor domain (' + matchedParentDomain + '). The record likely points to the wrong company. Manually verify the actual operating entity and update the Domain field.';
} else if (!text || urlsHitCount === 0) {
  modality = 'unknown';
  confidence = 'low';
  source = 'web_fetch:no_content';
  finalRouting = 'rerouted_wrong_modality';
  outcomeLabel = 'reroute_no_web_content';
} else {
  foundAnchor = AAV_ANCHOR.filter(k => text.includes(k));
  foundMech = VECTOR_MECH.filter(k => text.includes(k));
  const aavMatches = text.match(/\baav\b/g) || [];
  aavMatchCount = aavMatches.length;
  const hasAnchor = foundAnchor.length > 0;
  const hasMech = foundMech.length > 0;
  const strongAnchor = foundAnchor.length >= 2 || aavMatchCount >= 3;
  if (!hasAnchor) {
    for (const [mod, tokens] of Object.entries(EXCLUSION_TOKENS)) {
      const tokenHits = tokens.filter(t => text.includes(t));
      if (tokenHits.length === 0) continue;
      const contextHits = EXCLUSION_CONTEXT.filter(c => text.includes(c));
      if (contextHits.length > 0) {
        detectedExclusion = mod;
        exclusionHits = [...tokenHits, ...contextHits];
        break;
      }
    }
  }
  isAAV = ((hasAnchor && hasMech) || strongAnchor) && !detectedExclusion;
  isGeneTherapyBranded = !isAAV && GENE_THERAPY_PHRASES.some(p => text.includes(p));
  if (detectedExclusion === 'autologous_cell' && isGeneTherapyBranded) {
    detectedExclusion = null;
    exclusionHits = [];
  }
  source = hitUrls[0];
  if (isAAV) {
    modality = 'aav'; confidence = 'high';
    finalRouting = 'enrichment_complete'; outcomeLabel = 'pass_aav_confirmed';
  } else if (detectedExclusion) {
    modality = detectedExclusion; confidence = 'medium';
    finalRouting = 'rerouted_wrong_modality'; outcomeLabel = 'reroute_' + detectedExclusion;
  } else if (isGeneTherapyBranded) {
    modality = 'gene_therapy_unspecified_vector';
    confidence = 'low';
    source = hitUrls[0] + ':gene_therapy_branded_no_aav_terms';
    finalRouting = 'needs_aav_review';
    outcomeLabel = 'review_gene_therapy_branded_no_aav_terms';
    reviewReason = 'Gene therapy branding detected but no AAV/capsid/vector vocabulary in fetched content. Likely an AAV biotech that does not name the modality publicly. Surfaced for manual confirmation.';
  } else {
    modality = 'unknown'; confidence = 'low';
    finalRouting = 'rerouted_wrong_modality'; outcomeLabel = 'reroute_modality_unknown';
  }
}

const allDetected = [...foundAnchor, ...foundMech, ...exclusionHits];
const exclusionListStr = exclusionHits.toString() || 'none';
const hitUrlsStr = hitUrls.toString() || 'none';

let classificationNotes;
if (isParentCompanyDomain) {
  classificationNotes = ts + ' | Gate v' + gateVersion + '\n' +
    'Outcome: ' + outcomeLabel + '\n\n' +
    'Match: matched\n' +
    '  - Explorium business_id: ' + (qualify._matchedBusinessId || 'none') + '\n' +
    '  - NAICS: ' + (qualify._naics || 'n/a') + ' (' + (qualify._industry || 'n/a') + ')\n' +
    '  - Industry: ' + (qualify._industry || 'n/a') + '\n\n' +
    'Gate 1 (industry filter): pass\n' +
    '  - Reason: ' + (qualify._qualReason || 'n/a') + '\n\n' +
    'Gate 2 (modality fetch): skipped (parent-company domain detected: ' + matchedParentDomain + ')\n\n' +
    'Final routing: needs_data_quality_review\n' +
    'Reason: ' + reviewReason;
} else {
  classificationNotes = ts + ' | Gate v' + gateVersion + '\n' +
    'Outcome: ' + outcomeLabel + '\n\n' +
    'Match: matched\n' +
    '  - Explorium business_id: ' + (qualify._matchedBusinessId || 'none') + '\n' +
    '  - NAICS: ' + (qualify._naics || 'n/a') + ' (' + (qualify._industry || 'n/a') + ')\n' +
    '  - Industry: ' + (qualify._industry || 'n/a') + '\n\n' +
    'Gate 1 (industry filter): pass\n' +
    '  - Reason: ' + (qualify._qualReason || 'n/a') + '\n\n' +
    'Gate 2 (modality fetch): ' + (urlsHitCount > 0 ? 'pass' : 'fail') + ' (' + urlsHitCount + ' of ' + urlsAttempted + ' URLs returned content)\n' +
    '  - URLs hit: ' + hitUrlsStr + '\n' +
    '  - Combined content length: ' + combinedLen + ' chars\n' +
    '  - AAV anchor matches: ' + foundAnchor.length + ' (' + (foundAnchor.toString() || 'none') + ')\n' +
    '  - AAV literal regex count: ' + aavMatchCount + '\n' +
    '  - Mechanism keywords: ' + foundMech.length + ' (' + (foundMech.toString() || 'none') + ')\n' +
    '  - Exclusion keywords: ' + exclusionHits.length + ' (' + exclusionListStr + ')\n' +
    '  - Gene therapy branded: ' + isGeneTherapyBranded + '\n' +
    '  - Detected modality: ' + modality + '\n' +
    '  - Confidence: ' + confidence + '\n\n' +
    'Final routing: ' + finalRouting;
  if (reviewReason) {
    classificationNotes += '\nReason: ' + reviewReason;
  }
}

return [{ json: { ...qualify, _isAAV: isAAV, _modality: modality, _modalitySource: source, _modalityConfidence: confidence, _detectedKeywords: allDetected.length ? JSON.stringify(allDetected) : null, _gate2UrlsHit: hitUrlsStr, _gate2ContentLen: combinedLen, _gate2AnchorCount: foundAnchor.length, _gate2MechCount: foundMech.length, _gate2AAVRegexCount: aavMatchCount, _gate2ExclusionCount: exclusionHits.length, _gate2CombinedText: combinedRaw ? combinedRaw.slice(0, 20000) : null, _finalRouting: finalRouting, _classificationNotes: classificationNotes } }];
