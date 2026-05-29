import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook',
    parameters: {
      httpMethod: 'GET',
      path: 'linkedin-verify',
      responseMode: 'lastNode',
      options: {}
    },
    position: [-560, 0]
  },
  output: [{ query: { companyId: 'rec83lbbxLTPi84zv', force: 'false', days: '14' } }]
});

const getCompany = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Get Company',
    parameters: {
      resource: 'record',
      operation: 'get',
      base: { __rl: true, mode: 'list', value: 'appYBYH3aOHhTODAw', cachedResultName: 'RevOps Surface', cachedResultUrl: 'https://airtable.com/appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'list', value: 'tblnj3YlOI3thjrXp', cachedResultName: 'Companies', cachedResultUrl: 'https://airtable.com/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp' },
      id: expr('{{ $json.query.companyId }}'),
      options: {}
    },
    position: [-320, 0]
  },
  output: [{ id: 'rec83lbbxLTPi84zv', 'Company Name': 'Pfizer' }]
});

const searchContacts = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Search Contacts',
    parameters: {
      resource: 'record',
      operation: 'search',
      base: { __rl: true, mode: 'list', value: 'appYBYH3aOHhTODAw', cachedResultName: 'RevOps Surface', cachedResultUrl: 'https://airtable.com/appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'list', value: 'tblWJksRL1yKSUgrm', cachedResultName: 'Contacts', cachedResultUrl: 'https://airtable.com/appYBYH3aOHhTODAw/tblWJksRL1yKSUgrm' },
      filterByFormula: expr('{{ \'{Company Name} = "\' + $json["Company Name"].replace(/"/g, \'\\\\"\') + \'"\' }}'),
      returnAll: true,
      options: {}
    },
    position: [-80, 0]
  },
  output: [{ id: 'recAAA', 'Full Name': 'Jane Doe', 'LinkedIn URL': 'https://www.linkedin.com/in/janedoe', 'Title': 'Principal Scientist', 'Company Name': 'Pfizer', 'LinkedIn Last Verified At': null }]
});

const filterAndBuildBatch = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Filter & Build Apify Batch',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: [
        "function normLi(u) {",
        "  if (!u) return '';",
        "  return String(u).trim().toLowerCase()",
        "    .replace(/^https?:\\/\\//, '')",
        "    .replace(/^www\\./, '')",
        "    .split(/[?#]/)[0]",
        "    .replace(/\\/+$/, '');",
        "}",
        "",
        "const query = $('Webhook').first().json.query || {};",
        "const force = query.force === 'true' || query.force === '1';",
        "const days = parseInt(query.days || '14', 10);",
        "const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;",
        "",
        "const all = $input.all();",
        "const contacts = [];",
        "const skipped = { noUrl: 0, recent: 0 };",
        "",
        "for (const item of all) {",
        "  const j = item.json;",
        "  const url = j['LinkedIn URL'] || '';",
        "  if (!url || !/linkedin\\.com\\/in\\//i.test(url)) {",
        "    skipped.noUrl++;",
        "    continue;",
        "  }",
        "  if (!force && j['LinkedIn Last Verified At']) {",
        "    const t = new Date(j['LinkedIn Last Verified At']).getTime();",
        "    if (!isNaN(t) && t > cutoff) {",
        "      skipped.recent++;",
        "      continue;",
        "    }",
        "  }",
        "  contacts.push({",
        "    recordId: j.id,",
        "    linkedinUrl: url,",
        "    fullName: j['Full Name'] || '',",
        "    title: j['Title'] || '',",
        "    companyName: j['Company Name'] || ''",
        "  });",
        "}",
        "",
        "const urls = contacts.map(c => c.linkedinUrl);",
        "return [{",
        "  json: {",
        "    contacts,",
        "    apifyBody: { queries: urls, profileScraperMode: 'Profile details no email ($4 per 1k)' },",
        "    contactCount: all.length,",
        "    toVerifyCount: contacts.length,",
        "    skipped",
        "  }",
        "}];"
      ].join('\n')
    },
    position: [160, 0]
  },
  output: [{ contacts: [], apifyBody: { queries: [], profileScraperMode: 'Profile details no email ($4 per 1k)' }, contactCount: 0, toVerifyCount: 0, skipped: { noUrl: 0, recent: 0 } }]
});

const apifyCall = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Apify LinkedIn Profiles',
    parameters: {
      method: 'POST',
      url: 'https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/run-sync-get-dataset-items',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'apifyApi',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'content-type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.apifyBody) }}'),
      options: {
        response: { response: { neverError: true } }
      }
    },
    position: [400, 0]
  },
  output: [{ linkedinUrl: 'https://www.linkedin.com/in/janedoe', publicIdentifier: 'janedoe', firstName: 'Jane', lastName: 'Doe', headline: 'Principal Scientist at Pfizer', currentPosition: [{ companyName: 'Pfizer', position: 'Principal Scientist', startDate: { year: 2022, month: 3, text: 'Mar 2022' } }], openToWork: false }]
});

const compareLive = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Compare Live vs Stored',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: [
        "function normLi(u) {",
        "  if (!u) return '';",
        "  return String(u).trim().toLowerCase()",
        "    .replace(/^https?:\\/\\//, '')",
        "    .replace(/^www\\./, '')",
        "    .split(/[?#]/)[0]",
        "    .replace(/\\/+$/, '');",
        "}",
        "function liveTenureMonths(startDate) {",
        "  if (!startDate) return null;",
        "  let y = startDate.year;",
        "  if (!y && typeof startDate.text === 'string') {",
        "    const m = startDate.text.match(/(\\d{4})/);",
        "    if (m) y = m[1];",
        "  }",
        "  const m = startDate.month || 1;",
        "  if (!y) return null;",
        "  const now = new Date();",
        "  return (now.getFullYear() - +y) * 12 + (now.getMonth() + 1 - +m);",
        "}",
        "function tenureHuman(months) {",
        "  if (months == null || months <= 0) return '';",
        "  if (months < 12) return Math.round(months) + ' mo';",
        "  const years = Math.floor(months / 12);",
        "  const rem = Math.round(months % 12);",
        "  if (rem === 0) return years + ' yr';",
        "  return years + ' yr ' + rem + ' mo';",
        "}",
        "",
        "const contacts = $('Filter & Build Apify Batch').first().json.contacts || [];",
        "const verifiedAt = new Date().toISOString();",
        "",
        "let profiles = [];",
        "for (const it of $input.all()) {",
        "  const j = it.json;",
        "  if (Array.isArray(j)) profiles = profiles.concat(j);",
        "  else if (j && Array.isArray(j.items)) profiles = profiles.concat(j.items);",
        "  else if (j && typeof j === 'object') profiles.push(j);",
        "}",
        "",
        "const byKey = {};",
        "for (const p of profiles) {",
        "  if (!p) continue;",
        "  const k1 = normLi(p.linkedinUrl || p.url || '');",
        "  const k2 = (p.publicIdentifier || '').toLowerCase();",
        "  if (k1) byKey[k1] = p;",
        "  if (k2) byKey['li:' + k2] = p;",
        "}",
        "",
        "const out = [];",
        "for (const c of contacts) {",
        "  const urlKey = normLi(c.linkedinUrl);",
        "  const slug = urlKey.split('/').pop();",
        "  const live = byKey[urlKey] || byKey['li:' + slug] || null;",
        "",
        "  if (!live) {",
        "    out.push({",
        "      id: c.recordId,",
        "      'LinkedIn Verification Status': 'Not Found',",
        "      'LinkedIn Last Verified At': verifiedAt,",
        "      'LinkedIn Verified Live': 'NOT FOUND on LinkedIn at ' + verifiedAt + '. URL: ' + c.linkedinUrl + '. Consider this contact stale until manually checked.',",
        "      'LinkedIn Live Title': '',",
        "      'LinkedIn Live Employer': '',",
        "      'LinkedIn Live Tenure (months)': null",
        "    });",
        "    continue;",
        "  }",
        "",
        "  const cp = Array.isArray(live.currentPosition) ? live.currentPosition[0] : (live.currentPosition || null);",
        "  const liveTitle = (cp && (cp.position || cp.title)) || '';",
        "  const liveEmployer = (cp && cp.companyName) || '';",
        "  const liveTenure = cp ? liveTenureMonths(cp.startDate) : null;",
        "  const liveHeadline = live.headline || '';",
        "  const openToWork = !!live.openToWork;",
        "",
        "  const titleMismatch = c.title && liveTitle && c.title.trim().toLowerCase() !== liveTitle.trim().toLowerCase();",
        "  const companyMismatch = c.companyName && liveEmployer && c.companyName.trim().toLowerCase() !== liveEmployer.trim().toLowerCase();",
        "",
        "  let status = (titleMismatch || companyMismatch) ? 'Stale Mismatch' : 'Stale Match';",
        "  if (openToWork) status = 'Open to Work';",
        "",
        "  let summary;",
        "  if (status === 'Open to Work') {",
        "    summary = 'OPEN TO WORK badge active on LinkedIn at ' + verifiedAt + '. ' + liveTitle + ' at ' + liveEmployer + ' · ' + tenureHuman(liveTenure) + '. Treat this contact as transitioning; defer outreach.';",
        "  } else {",
        "    summary = liveTitle + ' at ' + liveEmployer + ' · ' + tenureHuman(liveTenure) + '\\nHeadline: ' + liveHeadline + '\\nOpen to work: ' + (openToWork ? 'yes' : 'no') + '\\nVerified: ' + verifiedAt;",
        "  }",
        "",
        "  out.push({",
        "    id: c.recordId,",
        "    'LinkedIn Verification Status': status,",
        "    'LinkedIn Last Verified At': verifiedAt,",
        "    'LinkedIn Live Title': liveTitle,",
        "    'LinkedIn Live Employer': liveEmployer,",
        "    'LinkedIn Live Tenure (months)': liveTenure,",
        "    'LinkedIn Verified Live': summary",
        "  });",
        "}",
        "",
        "return out.map(o => ({ json: o }));"
      ].join('\n')
    },
    position: [640, 0]
  },
  output: [{ id: 'recAAA', 'LinkedIn Verification Status': 'Stale Match', 'LinkedIn Last Verified At': '2026-05-22T18:00:00.000Z', 'LinkedIn Live Title': 'Principal Scientist', 'LinkedIn Live Employer': 'Pfizer', 'LinkedIn Live Tenure (months)': 38, 'LinkedIn Verified Live': 'Principal Scientist at Pfizer · 3 yr 2 mo\nHeadline: Principal Scientist at Pfizer\nOpen to work: no\nVerified: 2026-05-22T18:00:00.000Z' }]
});

const updateContact = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Update Contact',
    parameters: {
      resource: 'record',
      operation: 'update',
      base: { __rl: true, mode: 'list', value: 'appYBYH3aOHhTODAw', cachedResultName: 'RevOps Surface', cachedResultUrl: 'https://airtable.com/appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'list', value: 'tblWJksRL1yKSUgrm', cachedResultName: 'Contacts', cachedResultUrl: 'https://airtable.com/appYBYH3aOHhTODAw/tblWJksRL1yKSUgrm' },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['id'],
        value: {
          'id': expr('{{ $json.id }}'),
          'LinkedIn Verification Status': expr('{{ $json["LinkedIn Verification Status"] }}'),
          'LinkedIn Last Verified At': expr('{{ $json["LinkedIn Last Verified At"] }}'),
          'LinkedIn Live Title': expr('{{ $json["LinkedIn Live Title"] }}'),
          'LinkedIn Live Employer': expr('{{ $json["LinkedIn Live Employer"] }}'),
          'LinkedIn Live Tenure (months)': expr('{{ $json["LinkedIn Live Tenure (months)"] }}'),
          'LinkedIn Verified Live': expr('{{ $json["LinkedIn Verified Live"] }}')
        }
      },
      options: { typecast: true }
    },
    position: [880, 0]
  },
  output: [{ id: 'recAAA' }]
});

const buildRunRecord = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Run Record',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: [
        "const compare = $('Compare Live vs Stored').all();",
        "const fb = $('Filter & Build Apify Batch').first().json;",
        "const query = $('Webhook').first().json.query || {};",
        "const companyName = $('Get Company').first().json['Company Name'] || '';",
        "",
        "const counts = { 'Verified': 0, 'Stale Match': 0, 'Stale Mismatch': 0, 'Open to Work': 0, 'Not Found': 0, 'URL Invalid': 0 };",
        "for (const it of compare) {",
        "  const s = it.json['LinkedIn Verification Status'];",
        "  if (counts[s] != null) counts[s]++;",
        "}",
        "const apifyCalls = fb.toVerifyCount || 0;",
        "const cost = +(apifyCalls * 0.004).toFixed(4);",
        "",
        "const notes = [",
        "  'Company: ' + companyName + ' (' + (query.companyId || '') + ')',",
        "  'Verified: ' + counts['Stale Match'] + ' match, ' + counts['Stale Mismatch'] + ' mismatch, ' + counts['Open to Work'] + ' open-to-work, ' + counts['Not Found'] + ' not found.',",
        "  'Skipped: ' + ((fb.skipped && fb.skipped.noUrl) || 0) + ' no URL, ' + ((fb.skipped && fb.skipped.recent) || 0) + ' verified within window.',",
        "  'Apify calls: ' + apifyCalls + ' · est. cost: $' + cost",
        "].join('\\n');",
        "",
        "return [{",
        "  json: {",
        "    'Name': 'LinkedIn Verify · ' + companyName + ' · ' + new Date().toISOString(),",
        "    'Run Type': 'linkedin_verification',",
        "    'Run Date': new Date().toISOString(),",
        "    'Status': 'Done',",
        "    'Workflow ID': $workflow.id,",
        "    'Execution ID': $execution.id,",
        "    'Records In': fb.contactCount || 0,",
        "    'Records Out': compare.length,",
        "    'Notes': notes",
        "  }",
        "}];"
      ].join('\n'),
    },
    position: [1120, 0],
    executeOnce: true
  },
  output: [{ Name: 'LinkedIn Verify · Pfizer · 2026-05-22T18:00:00.000Z', 'Run Type': 'linkedin_verification', 'Run Date': '2026-05-22T18:00:00.000Z', Status: 'Done', 'Workflow ID': 'lIhgJKw4ij1d0O4U', 'Execution ID': '99999', 'Records In': 58, 'Records Out': 52, Notes: 'Company: Pfizer (rec83lbbxLTPi84zv)\n...' }]
});

const createRunRecord = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Create Run Record',
    parameters: {
      resource: 'record',
      operation: 'create',
      base: { __rl: true, mode: 'list', value: 'appYBYH3aOHhTODAw', cachedResultName: 'RevOps Surface', cachedResultUrl: 'https://airtable.com/appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'list', value: 'tblEVSEqetmu4ScHe', cachedResultName: 'Enrichment Runs', cachedResultUrl: 'https://airtable.com/appYBYH3aOHhTODAw/tblEVSEqetmu4ScHe' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Name': expr('{{ $json.Name }}'),
          'Run Type': expr('{{ $json["Run Type"] }}'),
          'Run Date': expr('{{ $json["Run Date"] }}'),
          'Status': expr('{{ $json.Status }}'),
          'Workflow ID': expr('{{ $json["Workflow ID"] }}'),
          'Execution ID': expr('{{ $json["Execution ID"] }}'),
          'Records In': expr('{{ $json["Records In"] }}'),
          'Records Out': expr('{{ $json["Records Out"] }}'),
          'Notes': expr('{{ $json.Notes }}')
        }
      },
      options: { typecast: true }
    },
    position: [1360, 0]
  },
  output: [{ id: 'recRUN' }]
});

export default workflow('lIhgJKw4ij1d0O4U', 'LinkedIn Role Status Verify Live')
  .add(webhookTrigger)
  .to(getCompany)
  .to(searchContacts)
  .to(filterAndBuildBatch)
  .to(apifyCall)
  .to(compareLive)
  .to(updateContact)
  .to(buildRunRecord)
  .to(createRunRecord);
