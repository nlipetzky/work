// FULL REPLACEMENT — Prepare Contacts Upsert (workflow bYZ0sAzyUvU60wMZ)
// Adds: flatten d.rawExplorium.{fetched|profile|contacts} into
// explorium_fetched_<key>, explorium_profile_<key>, explorium_contacts_<key>
// columns on each upserted record. Existing curated fields untouched.

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

function normLi(u){ if(!u) return ''; let s=String(u).trim().toLowerCase(); s=s.replace(/^https?:\/\//,'').replace(/^www\./,'').split(/[?#]/)[0].replace(/\/+$/,''); return s; }
function truthy(v){ return v===true || v===1 || /^(true|yes|y|1|opt[-_ ]?out|do[-_ ]?not[-_ ]?contact|dnc)$/i.test(String(v==null?'':v)); }

const nowIso = new Date().toISOString();
const records = [];
for (const it of $input.all()) {
  const d = it.json;
  if (!d.email) continue;
  const personKey = normLi(d.linkedin)
    || (d.prospectId ? ('explorium:' + d.prospectId) : '')
    || ('name:' + String(d.fullName||'').toLowerCase().trim() + '|' + String(d.targetCompany||'').toLowerCase().trim());
  const ra = d.rawApollo || {};
  let optOut = false;
  if (truthy(ra.do_not_contact) || (ra.contact && truthy(ra.contact.do_not_contact)) || /unavailable|do_not_contact|opted_out/i.test(String(ra.email_status||''))) optOut = true;

  // Raw fallback (kept). Cap at 100K (Airtable cell limit) and flag truncation.
  let raw = '';
  let payloadTruncated = false;
  try { raw = JSON.stringify({ explorium: d.rawExplorium||null, apollo: d.rawApollo||null, linkedin: d.rawLinkedin||null, hunter: d.rawHunter||null }); }
  catch (e) { raw = JSON.stringify({ error: 'stringify failed' }); }
  if (raw.length > 100000) { raw = raw.slice(0, 100000); payloadTruncated = true; }

  // Fold every Explorium key into its own column.
  const expl = d.rawExplorium || {};
  const exploriumFlat = Object.assign(
    {},
    foldExplorium(expl.fetched, 'explorium_fetched_'),
    foldExplorium(expl.profile, 'explorium_profile_'),
    foldExplorium(expl.contacts, 'explorium_contacts_'),
  );

  const curated = {
    'Full Name': d.fullName || '',
    'First Name': d.firstName || '',
    'Last Name': d.lastName || '',
    'Email': d.email || '',
    'Title': d.title || '',
    'Company Name': d.targetCompany || '',
    'Company Domain': d.targetDomain || '',
    'Play': d.play || '',
    'Seniority': d.seniority || '',
    'Function': d.department || '',
    'ICP Score': d.icpScore != null ? d.icpScore : null,
    'Contact Score': d.icpScore != null ? d.icpScore : null,
    'ICP Score Reason': d.icpReason || '',
    'LinkedIn URL': d.linkedin || '',
    'LinkedIn Headline': d.linkedinHeadline || '',
    'Email Provider Source': d.emailSource || '',
    'Email Verified Status': d.emailVerifiedStatus || 'unverifiable',
    'Email Identity Confirmed': !!d.emailIdentityConfirmed,
    'Employer Match Confirmed': !!d.employerConfirmed,
    'Employment Verification Status': d.employmentStatus || 'No signal',
    'LinkedIn URL Valid': !!d.linkedinValid,
    'Source Confirmation Count': d.sourceCount != null ? d.sourceCount : 0,
    'Tenure at Company (months)': d.tenureCompanyMonths != null ? d.tenureCompanyMonths : null,
    'Tenure in Role (months)': d.tenureRoleMonths != null ? d.tenureRoleMonths : null,
    'Country': d.country || '',
    'State/Region': d.region || '',
    'Enrichment Status': d.enrichStatus || '',
    'Person Key': personKey,
    'DNC / Opt-Out (Email)': optOut,
    'Raw Provider Payloads': raw,
    'Last Enriched At': nowIso,
    'explorium_payload_truncated': payloadTruncated,
  };

  records.push({ fields: Object.assign({}, curated, exploriumFlat) });
}

const out = [];
for (let i = 0; i < records.length; i += 10) {
  out.push({ json: { airtableBody: {
    performUpsert: { fieldsToMergeOn: ['Person Key'] },
    typecast: true,
    records: records.slice(i, i + 10),
  } } });
}
if (out.length === 0) return [];
return out;
