import { workflow, node, trigger, ifElse, splitInBatches, nextBatch } from '@n8n/workflow-sdk';

const webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook',
    parameters: { path: '6083fd08-4ee3-4ac1-b978-a390c104cbbb', options: {} },
    webhookId: '6083fd08-4ee3-4ac1-b978-a390c104cbbb',
    position: [-48, 272],
  },
});

const readPersonaRules = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Read Persona Rules',
    parameters: {
      operation: 'search',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tbl1HFYzezFYs5C3k' },
      filterByFormula: "AND({Active}=1, FIND('persona_', {Rule Category}&''))",
      options: {},
    },
    position: [224, 272],
  },
});

const readTargetCompanies = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Read Target Companies',
    parameters: {
      operation: 'search',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblnj3YlOI3thjrXp' },
      filterByFormula: "={{ \"RECORD_ID()='\" + ($('Webhook').first().json.query.recordId || '') + \"'\" }}",
      options: {},
    },
    executeOnce: true,
    position: [448, 272],
  },
});

const buildSourcingPlan = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Sourcing Plan',
    parameters: {
      jsCode: `
function bareDomain(url) {
  if (!url) return null;
  return String(url).toLowerCase()
    .replace(/^https?:\\/\\//, '').replace(/^www\\./, '')
    .replace(/\\/.*$/, '').trim() || null;
}
const rules = $('Read Persona Rules').all().map(i => i.json.fields || i.json);
const byCat = {};
for (const r of rules) {
  const cat = (r['Rule Category'] || '').trim();
  const val = (r['Rule Value'] || '').toString().trim();
  if (!cat || !val) continue;
  (byCat[cat] = byCat[cat] || []).push(val);
}
const seniority = byCat['persona_seniority'] || [];
const departments = byCat['persona_department'] || [];
const departmentsExclude = byCat['persona_department_exclude'] || [];
const titleInclude = byCat['persona_title_include'] || [];
const titleExclude = byCat['persona_title_exclude'] || [];
const residual = (byCat['persona_residual'] || []).join(' ');
const minScore = parseInt((byCat['persona_min_score'] || ['60'])[0], 10) || 60;

const exploriumJobLevels = new Set(['c-suite','manager','owner','senior non-managerial','partner','freelancer','junior','director','board member','founder','president','senior manager','advisor','non-managerial','vice president']);
const exploriumJobDepartments = new Set(['administration','healthcare','partnerships','c-suite','design','human resources','engineering','education','strategy','product','sales','r&d','retail','customer success','security','public service','creative','it','support','marketing','trade','legal','operations','real estate','procurement','data','manufacturing','logistics','finance']);

let serverJobLevel = seniority.map(s => s.toLowerCase().trim()).filter(s => exploriumJobLevels.has(s));
if (!serverJobLevel.length) {
  serverJobLevel = ['manager','senior manager','director','vice president','c-suite','president','founder'];
} else {
  for (const v of ['manager','senior manager']) if (!serverJobLevel.includes(v)) serverJobLevel.push(v);
}

const serverJobDept = departments.map(s => s.toLowerCase().trim()).filter(s => exploriumJobDepartments.has(s));

const companies = $('Read Target Companies').all().map(i => i.json.fields || i.json);
const out = [];
for (const c of companies) {
  const bizId = (c['Explorium Business ID'] || '').trim();
  if (!bizId) continue;
  const filters = {
    business_id: { values: [bizId] },
    country_code: { values: ['US', 'CA'] },
    job_level: { values: serverJobLevel },
  };
  if (serverJobDept.length) filters.job_department = { values: serverJobDept };
  out.push({
    json: {
      targetCompany: (c['Company Name'] || '').trim(),
      targetDomain: bareDomain(c['Domain'] || c['Website']),
      play: (c['Play'] || '').trim(),
      exploriumBusinessId: bizId,
      personaResidual: residual,
      personaMinScore: minScore,
      personaSeniority: seniority,
      personaDepartment: departments,
      personaTitleInclude: titleInclude,
      personaTitleExclude: titleExclude,
      exploriumProspectBody: { mode: 'full', size: 1000, page_size: 100, filters },
    },
  });
}
return out;
`,
    },
    position: [672, 272],
  },
});

const loopCompanies = splitInBatches({
  version: 3,
  config: { name: 'Loop Companies', parameters: { options: {} }, position: [896, 272] },
});

const exploriumFetchProspects = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Explorium Fetch Prospects',
    parameters: {
      method: 'POST',
      url: 'https://api.explorium.ai/v1/prospects',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify(Object.assign({}, $json.exploriumProspectBody, { page: ($pageCount || 0) + 1 })) }}',
      options: {
        response: { response: { neverError: true } },
        pagination: {
          pagination: {
            paginationMode: 'updateAParameterInEachRequest',
            parameters: { parameters: [] },
            paginationCompleteWhen: 'other',
            completeExpression: '={{ (($pageCount || 0) + 1) >= ($response.body.total_pages || 1) || !($response.body.data && $response.body.data.length) }}',
            limitPagesFetched: true,
            maxRequests: 20,
          },
        },
      },
    },
    onError: 'continueRegularOutput',
    position: [1120, 272],
  },
});

const exploriumProfilesEnrich = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Explorium Profiles Enrich',
    parameters: {
      method: 'POST',
      url: 'https://api.explorium.ai/v1/prospects/profiles/bulk_enrich',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify({ prospect_ids: ($json.data || []).map(p => p.prospect_id).filter(Boolean).slice(0,50) }) }}',
      options: { response: { response: { neverError: true } } },
    },
    onError: 'continueRegularOutput',
    position: [1344, 272],
  },
});

const exploriumContactsEnrich = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Explorium Contacts Enrich',
    parameters: {
      method: 'POST',
      url: 'https://api.explorium.ai/v1/prospects/contacts_information/bulk_enrich',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify({ prospect_ids: ($json.data || []).map(p => p.prospect_id).filter(Boolean).slice(0,50) }) }}',
      options: { response: { response: { neverError: true } } },
    },
    onError: 'continueRegularOutput',
    position: [1568, 272],
  },
});

const normalizeProspects = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Normalize Prospects',
    parameters: {
      jsCode: `
function monthsBetween(startStr) {
  if (!startStr) return null;
  const s = String(startStr).trim();
  let y, m;
  const mm = s.match(/^(\\d{4})-(\\d{1,2})/);
  const yy = s.match(/^(\\d{4})$/);
  if (mm) { y = parseInt(mm[1],10); m = parseInt(mm[2],10); }
  else if (yy) { y = parseInt(yy[1],10); m = 1; }
  else return null;
  if (!y) return null;
  const now = new Date();
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  return months >= 0 ? months : null;
}
function normTitle(s) { return String(s||'').toLowerCase(); }

const plan = $('Loop Companies').item.json;
const fetched = $('Explorium Fetch Prospects').all().flatMap(it => ((it && it.json && it.json.data) || []));
const profilesArr = $('Explorium Profiles Enrich').all().flatMap(it => ((it && it.json && it.json.data) || []));
const contactsArr = $input.all().flatMap(it => ((it && it.json && it.json.data) || []));
const profById = {};
for (const e of profilesArr) { if (e && e.prospect_id) profById[e.prospect_id] = (e.data || {}); }
const contById = {};
for (const e of contactsArr) { if (e && e.prospect_id) contById[e.prospect_id] = (e.data || {}); }

const titleInclude = (plan.personaTitleInclude || []).map(s => s.toLowerCase().trim()).filter(Boolean);
const titleExclude = (plan.personaTitleExclude || []).map(s => s.toLowerCase().trim()).filter(Boolean);
const seniorityBypass = new Set(['c-suite','founder','president']);

const out = [];
let droppedPatient = 0, droppedTitleMiss = 0, droppedTitleExclude = 0;

for (const p of fetched) {
  const prof = profById[p.prospect_id] || {};
  const cont = contById[p.prospect_id] || {};
  const fullName = (p.full_name || prof.full_name || '').trim();
  let firstName = p.first_name || '';
  let lastName = p.last_name || '';
  if ((!firstName || !lastName) && fullName) {
    const sp = fullName.indexOf(' ');
    if (sp > 0) {
      firstName = firstName || fullName.slice(0, sp);
      lastName = lastName || fullName.slice(sp + 1);
    } else {
      firstName = firstName || fullName;
    }
  }
  const title = p.job_title || '';
  const titleLc = normTitle(title);
  const seniority = (p.job_level_main || p.job_seniority_level || '').toLowerCase();

  if (titleLc.includes('patient')) { droppedPatient++; continue; }
  if (titleExclude.some(x => x && titleLc.includes(x))) { droppedTitleExclude++; continue; }

  const isExecutiveBypass = seniorityBypass.has(seniority);
  if (!isExecutiveBypass && titleInclude.length) {
    const titleMatched = titleInclude.some(kw => titleLc.includes(kw));
    if (!titleMatched) { droppedTitleMiss++; continue; }
  }

  const exp = (prof.experience && prof.experience[0]) || {};
  const startDate = exp.start_date || '';
  const tenureMonths = monthsBetween(startDate);
  const emails = (cont.emails || []);
  let exEmail = '';
  const proEmail = emails.find(x => x && x.type === 'professional' && x.address);
  if (proEmail) exEmail = proEmail.address;
  else { const anyEmail = emails.find(x => x && x.address); if (anyEmail) exEmail = anyEmail.address; }
  const phones = (cont.phone_numbers || []);
  const exPhone = cont.mobile_phone || (phones[0] && phones[0].phone_number) || '';
  out.push({
    json: {
      play: plan.play,
      targetCompany: plan.targetCompany,
      targetDomain: plan.targetDomain,
      personaResidual: plan.personaResidual,
      personaMinScore: plan.personaMinScore,
      personaSeniority: plan.personaSeniority || [],
      personaDepartment: plan.personaDepartment || [],
      personaTitleInclude: plan.personaTitleInclude || [],
      personaTitleExclude: plan.personaTitleExclude,
      prospectId: p.prospect_id,
      fullName: fullName,
      firstName: firstName || '',
      lastName: lastName || '',
      title: title,
      seniority: p.job_level_main || p.job_seniority_level || '',
      department: p.job_department_main || p.job_department || '',
      linkedin: prof.linkedin || p.linkedin || '',
      linkedinHeadline: '',
      country: prof.country_name || p.country_name || '',
      region: prof.region_name || p.region_name || '',
      tenureCompanyMonths: tenureMonths != null ? tenureMonths : null,
      tenureRoleMonths: tenureMonths != null ? tenureMonths : null,
      exploriumEmployer: (p.company_name || (exp.company && exp.company.name) || '').trim(),
      exploriumEmail: exEmail || '',
      exploriumPhone: exPhone || '',
      rawExplorium: { fetched: p, profile: prof, contacts: cont },
    },
  });
}

try {
  console.log(JSON.stringify({
    targetCompany: plan.targetCompany,
    fetchedCount: fetched.length,
    keptCount: out.length,
    droppedPatient,
    droppedTitleMiss,
    droppedTitleExclude,
  }));
} catch (e) { /* ignore */ }

try {
  const sd = $getWorkflowStaticData('global');
  sd._csCollected = sd._csCollected || {};
  const eid = (typeof $execution !== 'undefined' && $execution && $execution.id) || (typeof $executionId !== 'undefined' ? $executionId : 'default');
  sd._csCollected[eid] = sd._csCollected[eid] || [];
  for (const r of out) sd._csCollected[eid].push(r.json);
} catch (e) { /* never block emission of this iteration's items */ }
if (out.length === 0) {
  return [{ json: { __loopKeepalive: true, targetCompany: plan.targetCompany } }];
}
return out;
`,
    },
    position: [1792, 336],
  },
});

const collectAllProspects = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Collect All Prospects',
    parameters: {
      jsCode: `
const sd = $getWorkflowStaticData('global');
sd._csCollected = sd._csCollected || {};
const eid = (typeof $execution !== 'undefined' && $execution && $execution.id) || (typeof $executionId !== 'undefined' ? $executionId : 'default');
const all = (sd._csCollected[eid] || []).slice();
delete sd._csCollected[eid];
try {
  const keys = Object.keys(sd._csCollected);
  if (keys.length > 50) keys.slice(0, keys.length - 25).forEach(k => delete sd._csCollected[k]);
} catch (e) { /* ignore */ }
const seen = new Set();
const out = [];
for (const p of all) {
  const key = p.prospectId || ((p.fullName||'') + '|' + (p.targetCompany||''));
  if (seen.has(key)) continue;
  seen.add(key);
  out.push({ json: p });
}
return out;
`,
    },
    position: [1120, 80],
  },
});

const apolloPeopleMatch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Apollo People Match',
    parameters: {
      method: 'POST',
      url: 'https://api.apollo.io/v1/people/match',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'X-Api-Key', value: '5HYRwOGFrLeVmpyouDpZEQ' }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify(Object.assign({ first_name: $json.firstName, last_name: $json.lastName, organization_name: $json.targetCompany, domain: $json.targetDomain, reveal_personal_emails: false }, $json.linkedin ? { linkedin_url: $json.linkedin } : {})) }}",
      options: { batching: { batch: { batchSize: 10, batchInterval: 1200 } }, response: { response: { neverError: true } } },
    },
    onError: 'continueRegularOutput',
    position: [1344, 80],
  },
});

const emailEmployerVerify = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Email + Employer Verify',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `
function norm(s){let r=(s||'').toString().toLowerCase().replace(/[^a-z0-9]/g,'');const sfx=/(inc|llc|ltd|corp|co|company|holdings|holding|plc|group|limited|international|therapeutics|bio|biosciences|pharma|pharmaceuticals)$/;let prev;do{prev=r;r=r.replace(sfx,'');}while(r!==prev);return r;}
const prospect = $('Collect All Prospects').itemMatching($itemIndex)?.json || {};
const apollo = ($json.person) || {};
const apolloEmail = apollo.email && !/email_not_unlocked/i.test(apollo.email) ? apollo.email : '';
const apolloEmployer = (apollo.organization && apollo.organization.name) || '';

const target = norm(prospect.targetCompany);
const exMatch = !!prospect.exploriumEmployer && norm(prospect.exploriumEmployer) === target;
const apMatch = !!apolloEmployer && norm(apolloEmployer) === target;
const providerMatchCount = (exMatch ? 1 : 0) + (apMatch ? 1 : 0);

return { json: {
  ...prospect,
  apolloEmail,
  apolloEmployer,
  rawApollo: apollo,
  providerExMatch: exMatch,
  providerApMatch: apMatch,
  providerMatchCount,
  employerConfirmed: false,
  sourceCount: providerMatchCount,
  needsLiCheck: true,
} };
`,
    },
    position: [1568, 80],
  },
});

const needsLinkedinTiebreak = ifElse({
  version: 2.2,
  config: {
    name: 'Needs LinkedIn Tiebreak?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{
          leftValue: '={{ $json.needsLiCheck }}',
          rightValue: true,
          operator: { type: 'boolean', operation: 'true', singleValue: true },
        }],
      },
      options: {},
    },
    position: [1792, 80],
  },
});

const apifyLinkedinVerify = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Apify LinkedIn Verify',
    parameters: {
      method: 'POST',
      url: 'https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/run-sync-get-dataset-items',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'apifyApi',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify({ queries: [$json.linkedin].filter(Boolean), profileScraperMode: "Profile details no email ($4 per 1k)" }) }}',
      options: { batching: { batch: { batchSize: 1, batchInterval: 200 } }, response: { response: { neverError: true } } },
    },
    onError: 'continueRegularOutput',
    position: [2016, 0],
  },
});

const applyLinkedinResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Apply LinkedIn Result',
    parameters: {
      jsCode: `
function norm(s){let r=(s||'').toString().toLowerCase().replace(/[^a-z0-9]/g,'');const sfx=/(inc|llc|ltd|corp|co|company|holdings|holding|plc|group|limited|international|therapeutics|bio|biosciences|pharma|pharmaceuticals)$/;let prev;do{prev=r;r=r.replace(sfx,'');}while(r!==prev);return r;}
function lastSeg(u){ if(!u) return ''; let s=String(u).toLowerCase().replace(/^https?:\\/\\//,'').replace(/^www\\./,'').split(/[?#]/)[0].replace(/\\/+$/,''); const m=s.match(/\\/in\\/([^\\/]+)/); return (m ? m[1] : (s.split('/').pop()||'')).toLowerCase(); }
function MN(m){ if(m==null) return 0; if(/^\\d+$/.test(String(m))) return +m; const k=String(m).slice(0,3).toLowerCase(); const o={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12}; return o[k]||0; }
function ymOf(d){ if(!d) return null; if(typeof d==='string'){ let m=d.match(/(\\d{4})[-\\/](\\d{1,2})/); if(m) return {y:+m[1],m:+m[2]}; let mm=d.match(/([A-Za-z]{3,})\\.?\\s*(\\d{4})/); if(mm) return {y:+mm[2],m:MN(mm[1])||1}; let yy=d.match(/(\\d{4})/); if(yy) return {y:+yy[1],m:1}; return null; } const y=d.year||d.y; if(!y) return null; return {y:+y, m:MN(d.month||d.m)||1}; }
function monthsBetween(a,b){ if(!a) return null; const now=new Date(); const ey=b?b.y:now.getFullYear(); const em=b?b.m:(now.getMonth()+1); const n=(ey-a.y)*12+(em-a.m); return n>=0?n:null; }
function isPresent(end){ if(!end) return true; const t=(typeof end==='object' ? (end.text||'') : String(end)); return !t || /present|current|now/i.test(t); }

const apifyItems = $('Apify LinkedIn Verify').all();
const profByKey = {};
apifyItems.forEach((it, idx) => {
  const p = (it && it.json) || {};
  const keys = [ String(p.id||'').toLowerCase(), String(p.publicIdentifier||'').toLowerCase(), lastSeg(p.linkedinUrl) ].filter(Boolean);
  for (const k of keys) if (k && !(k in profByKey)) profByKey[k] = { p, idx };
});

const out = [];
const prospects = $('Email + Employer Verify').all();
prospects.forEach((pi) => {
  const prospect = (pi && pi.json) || {};
  const target = norm(prospect.targetCompany);
  const want = lastSeg(prospect.linkedin);
  const hit = (want && profByKey[want]) || null;
  const profile = hit ? hit.p : {};
  const pairIdx = hit ? hit.idx : 0;

  const cps = Array.isArray(profile.currentPosition) ? profile.currentPosition : (profile.currentPosition ? [profile.currentPosition] : []);
  const liValid = !!(profile.firstName || profile.lastName || profile.linkedinUrl || cps.length);

  let tEntry = null;
  for (const c of cps) {
    if (c && norm(c.companyName || (c.company && c.company.name) || '') === target && isPresent(c.endDate)) { tEntry = c; break; }
  }
  const liCurrentMatch = !!tEntry;
  const employedElsewhere = !liCurrentMatch && cps.some(c => c && isPresent(c.endDate) && norm(c.companyName||'') && norm(c.companyName||'') !== target);

  const employerConfirmed = liCurrentMatch;
  const sourceCount = (prospect.providerMatchCount || 0) + (liCurrentMatch ? 1 : 0);

  let tenureCompanyMonths = prospect.tenureCompanyMonths != null ? prospect.tenureCompanyMonths : null;
  let employmentStartDate = '', employmentEndDate = '';
  if (tEntry) {
    const sd = ymOf(tEntry.startDate);
    const tm = monthsBetween(sd, null);
    if (tm != null) tenureCompanyMonths = tm;
    const st = tEntry.startDate;
    employmentStartDate = (st && (st.text || (st.year ? ((st.month ? st.month + ' ' : '') + st.year) : ''))) || (typeof st === 'string' ? st : '');
    employmentEndDate = '';
  }

  let employmentStatus;
  if (liCurrentMatch) employmentStatus = 'Employed (current, verified)';
  else if (liValid && employedElsewhere) employmentStatus = 'Not currently employed';
  else if (liValid) employmentStatus = 'Employer unconfirmed';
  else if ((prospect.providerMatchCount || 0) > 0) employmentStatus = 'Employer unconfirmed';
  else employmentStatus = 'No signal';

  const liHeadline = profile.headline || prospect.linkedinHeadline || '';
  out.push({
    json: {
      ...prospect,
      employerConfirmed,
      sourceCount,
      linkedinValid: liValid,
      linkedinHeadline: liHeadline,
      employmentStatus,
      employmentStartDate,
      employmentEndDate,
      tenureCompanyMonths,
      tenureRoleMonths: (tenureCompanyMonths != null ? tenureCompanyMonths : (prospect.tenureRoleMonths != null ? prospect.tenureRoleMonths : null)),
      rawLinkedin: profile,
    },
    pairedItem: { item: pairIdx },
  });
});
return out;
`,
    },
    position: [2240, 0],
  },
});

const liResolved = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'LI Resolved',
    parameters: { assignments: { assignments: [] }, includeOtherFields: true, options: {} },
    position: [2464, 80],
  },
});

const hunter = node({
  type: 'n8n-nodes-base.hunter',
  version: 1,
  config: {
    name: 'Hunter',
    parameters: {
      operation: 'emailFinder',
      domain: '={{ $json.targetDomain }}',
      firstname: '={{ $json.firstName }}',
      lastname: '={{ $json.lastName }}',
    },
    alwaysOutputData: true,
    onError: 'continueRegularOutput',
    position: [2688, 80],
  },
});

const applyEmailVerify = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Apply Email Verify',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `
const prospect = $('LI Resolved').itemMatching($itemIndex)?.json || {};
const hunterData = $json.data || $json || {};
const hunterEmail = (hunterData.email || '').trim();
const hunterVerif = hunterData.verification || {};
const hunterResult = ((hunterVerif.result || hunterVerif.status || hunterData.result || hunterData.status) || '').toLowerCase();

let email = '', emailSource = '', emailVerifiedStatus = '';
if (hunterEmail) {
  email = hunterEmail;
  emailSource = 'hunter';
  if (hunterResult === 'deliverable') {
    emailVerifiedStatus = 'Verified';
  } else if (['accept_all','catch_all','risky','webmail'].includes(hunterResult)) {
    emailVerifiedStatus = 'Catch-all (unconfirmed)';
  } else {
    emailVerifiedStatus = 'Unverifiable';
  }
} else if (prospect.exploriumEmail) {
  email = prospect.exploriumEmail;
  emailSource = 'explorium';
  emailVerifiedStatus = 'Unverifiable';
} else if (prospect.apolloEmail) {
  email = prospect.apolloEmail;
  emailSource = 'apollo';
  emailVerifiedStatus = 'Unverifiable';
} else {
  emailVerifiedStatus = 'Not found';
}

const identityConfirmed = emailVerifiedStatus === 'Verified' && !!email && !/^(info|sales|hello|contact|admin|support)@/i.test(email);
return { json: { ...prospect, email, emailSource, emailVerifiedStatus, emailIdentityConfirmed: identityConfirmed, rawHunter: hunterData } };
`,
    },
    position: [2912, 80],
  },
});

const residualIcpScore = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Residual ICP Score',
    parameters: {
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'anthropicApi',
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'anthropic-version', value: '2023-06-01' },
        { name: 'content-type', value: 'application/json' },
      ] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: `={{ JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 250, system: "You score how well a person matches an ideal-customer persona for outbound. Output ONLY strict JSON: {\\"score\\": <0-100 integer>, \\"reason\\": \\"<one sentence>\\"}.\\n\\nHARD REJECTIONS (return score=0):\\n- Title contains 'patient' (clinical / patient-facing role).\\n- Title contains 'legal', 'sales', 'recruit', 'talent acquisition', 'human resources', 'marketing', 'finance', 'IT', or 'regulatory affairs'.\\n- Title contains 'agronomy' or 'agricultural'.\\n\\nSCORING GUIDANCE:\\n- The target persona is operators at director / senior manager / manager level in process development, CMC, viral vector production, downstream processing / purification, clinical manufacturing, or process science.\\n- For small biotechs (under ~200 employees), CSO and other c-suite operators are excellent targets.\\n- For large biopharma (over ~1000 employees), reject c-suite and VP. Cap at director.\\n- Title keyword fit (viral vector / downstream / purification / process development / CMC / process science / clinical manufacturing) is the strongest positive signal. Score below 60 if no keyword fit and not in an explicitly named target function.", messages: [{ role: "user", content: "Residual criteria: " + ($json.personaResidual || "none") + "\\nTarget seniority floor: " + (($json.personaSeniority || []).join(", ") || "manager+") + "\\nTarget departments: " + (($json.personaDepartment || []).join(", ") || "any") + "\\nTitle keywords (any match boosts score): " + (($json.personaTitleInclude || []).join(", ") || "any") + "\\n\\nPerson: " + ($json.fullName || "") + " | Title: " + ($json.title || "") + " | Seniority: " + ($json.seniority || "") + " | Department: " + ($json.department || "") + " | Headline: " + ($json.linkedinHeadline || "") + "\\n\\nReturn the JSON now." }] }) }}`,
      options: { response: { response: { neverError: true } } },
    },
    onError: 'continueRegularOutput',
    position: [3136, 80],
  },
});

const applyScoreMap = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Apply Score + Map',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `
const prospect = $('Apply Email Verify').itemMatching($itemIndex)?.json || {};
const resp = $json;
let score = 0, reason = '';
try {
  let txt = '';
  if (resp && Array.isArray(resp.content)) txt = resp.content.filter(c => c.type==='text').map(c=>c.text).join('');
  const m = txt.match(/\\{[\\s\\S]*\\}/);
  if (m) { const j = JSON.parse(m[0]); score = parseInt(j.score,10)||0; reason = j.reason||''; }
} catch (e) { reason = 'score parse failed'; }
const minScore = prospect.personaMinScore || 60;
const passesResidual = score >= minScore;
const excl = (prospect.personaTitleExclude || []).map(s=>s.toLowerCase());
const titleExcluded = excl.some(x => (prospect.title||'').toLowerCase().includes(x));
let enrichStatus = 'enrichment_complete';
if (!prospect.email) enrichStatus = 'no_email';
else if (!prospect.employerConfirmed) enrichStatus = 'employer_unconfirmed';
else if (titleExcluded || !passesResidual) enrichStatus = 'icp_filtered_out';
return { json: { ...prospect, icpScore: score, icpReason: reason, passesResidual, titleExcluded, enrichStatus } };
`,
    },
    position: [3360, 80],
  },
});

const prepareContactsUpsert = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Contacts Upsert',
    parameters: {
      jsCode: `
function foldExplorium(src, prefix) {
  const out = {};
  if (!src || typeof src !== 'object') return out;
  for (const k of Object.keys(src)) {
    const v = src[k];
    const col = prefix + k;
    if (v === null || v === undefined) { out[col] = null; continue; }
    if (typeof v === 'number') { out[col] = String(v); continue; }
    if (Array.isArray(v)) {
      if (v.length === 0) { out[col] = null; continue; }
      if (typeof v[0] === 'object') { out[col] = JSON.stringify(v, null, 2); continue; }
      out[col] = v.join('\\n');
      continue;
    }
    if (typeof v === 'object') { out[col] = JSON.stringify(v, null, 2); continue; }
    out[col] = v;
  }
  return out;
}

function normLi(u){ if(!u) return ''; let s=String(u).trim().toLowerCase(); s=s.replace(/^https?:\\/\\//,'').replace(/^www\\./,'').split(/[?#]/)[0].replace(/\\/+$/,''); return s; }
function truthy(v){ return v===true || v===1 || /^(true|yes|y|1|opt[-_ ]?out|do[-_ ]?not[-_ ]?contact|dnc)$/i.test(String(v==null?'':v)); }

const nowIso = new Date().toISOString();
const records = [];
let droppedNoEmail = 0, droppedEmployer = 0;
for (const it of $input.all()) {
  const d = it.json;
  if (!d.email) { droppedNoEmail++; continue; }
  if (!d.employerConfirmed) { droppedEmployer++; continue; }
  const personKey = normLi(d.linkedin)
    || (d.prospectId ? ('explorium:' + d.prospectId) : '')
    || ('name:' + String(d.fullName||'').toLowerCase().trim() + '|' + String(d.targetCompany||'').toLowerCase().trim());
  const ra = d.rawApollo || {};
  let optOut = false;
  if (truthy(ra.do_not_contact) || (ra.contact && truthy(ra.contact.do_not_contact)) || /unavailable|do_not_contact|opted_out/i.test(String(ra.email_status||''))) optOut = true;

  let raw = '';
  let payloadTruncated = false;
  try { raw = JSON.stringify({ explorium: d.rawExplorium||null, apollo: d.rawApollo||null, linkedin: d.rawLinkedin||null, hunter: d.rawHunter||null }); }
  catch (e) { raw = JSON.stringify({ error: 'stringify failed' }); }
  if (raw.length > 100000) { raw = raw.slice(0, 100000); payloadTruncated = true; }

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

try {
  console.log(JSON.stringify({
    totalInput: $input.all().length,
    keptForUpsert: records.length,
    droppedNoEmail,
    droppedEmployer,
  }));
} catch (e) { /* ignore */ }

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
`,
    },
    position: [3584, 80],
  },
});

const upsertContactsToAirtable = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Contacts to Airtable',
    parameters: {
      method: 'PATCH',
      url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblWJksRL1yKSUgrm',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.airtableBody) }}',
      options: { batching: { batch: { batchSize: 1, batchInterval: 250 } }, response: { response: { neverError: true } } },
    },
    onError: 'continueRegularOutput',
    position: [3808, 80],
  },
});

export default workflow('bYZ0sAzyUvU60wMZ', 'RevOps — Contact Sourcing + ICP Gate')
  .add(webhook)
  .to(readPersonaRules)
  .to(readTargetCompanies)
  .to(buildSourcingPlan)
  .to(loopCompanies
    .onDone(collectAllProspects
      .to(apolloPeopleMatch
        .to(emailEmployerVerify
          .to(needsLinkedinTiebreak
            .onTrue(apifyLinkedinVerify.to(applyLinkedinResult.to(liResolved)))
            .onFalse(liResolved)
          )
        )
      )
    )
    .onEachBatch(exploriumFetchProspects
      .to(exploriumProfilesEnrich
        .to(exploriumContactsEnrich
          .to(normalizeProspects.to(nextBatch(loopCompanies)))
        )
      )
    )
  )
  .add(liResolved)
  .to(hunter)
  .to(applyEmailVerify)
  .to(residualIcpScore)
  .to(applyScoreMap)
  .to(prepareContactsUpsert)
  .to(upsertContactsToAirtable);
