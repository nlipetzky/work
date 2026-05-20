// FULL REPLACEMENT — Map Archive No AAV Unmatched (workflow Z6RROKx5omdfvhtn)
// Adds: fold Explorium firmographic + match-business keys (where available).
// Unmatched path: match-business may have returned no business; firm is empty.
// Still safe — foldExplorium just emits nothing when src is empty.

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

const qualify = $json;
const firm = $('Enrich Firmographics Only').first()?.json?.enriched_data?.[0]?.data || {};
const matched = $('Match Business').first()?.json?.matched_businesses?.[0] || {};
const __prior = $('Get Unenriched Companies').item.json.fields?.['Enrichment Provider'] || [];
const __providers = Array.from(new Set([...__prior, 'explorium']));

const exploriumFlat = Object.assign(
  {},
  foldExplorium(matched, 'explorium_'),
  foldExplorium(firm, 'explorium_'),
);
delete exploriumFlat.explorium_input;

const statusValue = qualify._finalRouting || 'archived_out_of_industry';
const curated = {
  id: qualify._id,
  "Industry": qualify._industry || null,
  "Revenue Range": qualify._revenueRange || null,
  "Country": qualify._country || null,
  "HQ State": qualify._state || null,
  "HQ City": qualify._city || null,
  "Company LinkedIn URL": qualify._linkedinUrl || null,
  "Employee Range": qualify._employeeRange || null,
  "NAICS Code": qualify._naics || null,
  "Explorium Business ID": qualify._matchedBusinessId || null,
  "Stock Ticker": qualify._ticker || null,
  "Last Enriched At": new Date().toISOString(),
  "Enrichment Status": statusValue,
  "Custom Classification": qualify._modality || null,
  "Custom Classification Source": qualify._modalitySource || null,
  "Custom Classification Confidence": qualify._modalityConfidence || null,
  "Custom Classification Detected Keywords": qualify._detectedKeywords || null,
  "Classification Run ID": qualify._classificationRunId || null,
  "Gate Version": qualify._gateVersion || null,
  "Classification Notes": qualify._classificationNotes || null,
  "explorium_payload_truncated": false,
  "Enrichment Provider": __providers,
};

return [{ json: Object.assign({}, curated, exploriumFlat) }];
