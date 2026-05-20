// FULL REPLACEMENT — Map Archive No Domain (workflow Z6RROKx5omdfvhtn)
// No Explorium calls happen on this branch (no domain → no match), so there
// are no Explorium fields to fold. Sole change: set explorium_payload_truncated=false
// so the flag column is populated on every row.

const original = $('Get Unenriched Companies').item.json;
const __prior = original.fields?.['Enrichment Provider'] || [];
const __providers = Array.from(new Set([...__prior]));  // no provider data captured on no-domain path

const classificationRunId = 'run_' + Date.now() + '_' + original.id;
const ts = new Date().toISOString();
const classificationNotes = ts + ' | Gate v1.6.0\n' +
  'Outcome: archive_match_failed_no_domain\n\n' +
  'Match: unmatched\n' +
  '  - Explorium business_id: none\n' +
  '  - NAICS: n/a\n' +
  '  - Industry: n/a\n\n' +
  'Gate 1 (industry filter): skipped (no firmographics)\n' +
  'Gate 2 (modality fetch): skipped (no domain)\n\n' +
  'Final routing: archived_out_of_industry';
return [{ json: {
  id: original.id,
  "Industry": null, "Revenue Range": null, "Country": null,
  "HQ State": null, "HQ City": null,
  "Company LinkedIn URL": null, "Employee Range": null, "NAICS Code": null,
  "Explorium Business ID": null,
  "Last Enriched At": ts,
  "Enrichment Status": "archived_out_of_industry",
  "Custom Classification": "unknown",
  "Custom Classification Source": "explorium_match_failed_no_domain",
  "Custom Classification Confidence": "low",
  "Custom Classification Detected Keywords": null,
  "Classification Run ID": classificationRunId,
  "Gate Version": "1.6.0",
  "Classification Notes": classificationNotes,
  "explorium_payload_truncated": false,
  "Enrichment Provider": __providers,
} }];
