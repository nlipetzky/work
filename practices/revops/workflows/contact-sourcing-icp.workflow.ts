import {
  workflow,
  node,
  trigger,
  splitInBatches,
  nextBatch,
  ifElse,
  newCredential,
  expr,
} from '@n8n/workflow-sdk';

const AIRTABLE_BASE = 'appYBYH3aOHhTODAw';
const COMPANIES_TABLE = 'tblnj3YlOI3thjrXp';
const CONTACTS_TABLE = 'tblWJksRL1yKSUgrm';
const RULES_TABLE = 'tbl1HFYzezFYs5C3k';

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Trigger', position: [-220, 0] },
  output: [{}],
});

const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Schedule Trigger',
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 7 * * 1' }] } },
    position: [-220, 200],
  },
  output: [{}],
});

const readPersonaRules = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Read Persona Rules',
    parameters: {
      resource: 'record',
      operation: 'search',
      base: { __rl: true, mode: 'id', value: AIRTABLE_BASE },
      table: { __rl: true, mode: 'id', value: RULES_TABLE },
      filterByFormula: "AND({Active}=1, FIND('persona_', {Rule Category}&''))",
      returnAll: true,
      options: {},
    },
    credentials: { airtableTokenApi: newCredential('Airtable RevOps') },
    position: [0, 0],
  },
  output: [{ id: 'rec1', fields: { 'Rule Category': 'persona_seniority', 'Rule Value': 'director', 'Rule Weight': 3 } }],
});

const readTargetCompanies = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Read Target Companies',
    parameters: {
      resource: 'record',
      operation: 'search',
      base: { __rl: true, mode: 'id', value: AIRTABLE_BASE },
      table: { __rl: true, mode: 'id', value: COMPANIES_TABLE },
      filterByFormula: "AND({Outreach Eligible}=1, {Explorium Business ID}&''!='')",
      returnAll: true,
      options: {},
    },
    credentials: { airtableTokenApi: newCredential('Airtable RevOps') },
    executeOnce: true,
    position: [220, 0],
  },
  output: [
    {
      id: 'recCmp1',
      fields: {
        'Company Name': 'Acme Bio',
        'Domain': 'https://acmebio.com',
        'Play': 'teknova-aav',
        'Explorium Business ID': 'biz_abc123',
      },
    },
  ],
});

const buildSourcingPlan = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Sourcing Plan',
    parameters: {
      mode: 'runOnceForAllItems',
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

const companies = $('Read Target Companies').all().map(i => i.json.fields || i.json);
const out = [];
for (const c of companies) {
  const bizId = (c['Explorium Business ID'] || '').trim();
  if (!bizId) continue;
  const filters = { business_id: { values: [bizId] } };
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
      exploriumProspectBody: { mode: 'full', size: 50, page_size: 50, filters },
    },
  });
}
return out;
`,
    },
    position: [440, 0],
  },
  output: [
    {
      targetCompany: 'Acme Bio',
      targetDomain: 'acmebio.com',
      play: 'teknova-aav',
      exploriumBusinessId: 'biz_abc123',
      personaResidual: 'owns process development buying decisions',
      personaMinScore: 60,
      personaSeniority: ['director', 'senior manager', 'vice president'],
      personaDepartment: ['r&d', 'manufacturing'],
      personaTitleInclude: ['process development', 'gene therapy', 'viral vector', 'manufacturing', 'cmo', 'technical operations'],
      personaTitleExclude: ['intern'],
      exploriumProspectBody: { mode: 'full', size: 50, page_size: 50, filters: { business_id: { values: ['biz_abc123'] } } },
    },
  ],
});

const loopCompanies = splitInBatches({
  version: 3,
  config: { name: 'Loop Companies', parameters: { batchSize: 1 }, position: [660, 0] },
});

const fetchProspects = node({
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
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ JSON.stringify($json.exploriumProspectBody) }}'),
      options: { response: { response: { neverError: true } } },
    },
    credentials: { httpHeaderAuth: newCredential('Explorium API') },
    onError: 'continueRegularOutput',
    position: [880, -120],
  },
  output: [
    {
      data: [
        {
          prospect_id: 'pro_1',
          full_name: 'Jane Doe',
          first_name: null,
          last_name: null,
          country_name: 'United States',
          region_name: null,
          city: null,
          linkedin: null,
          company_name: 'Acme Bio',
          company_website: 'acmebio.com',
          job_title: 'VP Process Development',
          job_department: 'r&d',
          job_department_main: 'r&d',
          job_level_main: 'vice president',
          job_seniority_level: 'vice president',
          business_id: 'biz_abc123',
        },
      ],
    },
  ],
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
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '={{ JSON.stringify({ prospect_ids: ($json.data || []).map(p => p.prospect_id).filter(Boolean).slice(0,50) }) }}'
      ),
      options: { response: { response: { neverError: true } } },
    },
    credentials: { httpHeaderAuth: newCredential('Explorium API') },
    onError: 'continueRegularOutput',
    position: [1100, -200],
  },
  output: [
    {
      data: [
        {
          prospect_id: 'pro_1',
          data: {
            full_name: 'Jane Doe',
            country_name: 'United States',
            region_name: 'California',
            city: 'San Francisco',
            linkedin: 'https://linkedin.com/in/janedoe',
            experience: [
              {
                company: { name: 'Acme Bio', website: 'acmebio.com' },
                title: { levels: ['vice president'], name: 'VP Process Development' },
                start_date: '2022-01',
              },
            ],
          },
        },
      ],
    },
  ],
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
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '={{ JSON.stringify({ prospect_ids: ($json.data || []).map(p => p.prospect_id).filter(Boolean).slice(0,50) }) }}'
      ),
      options: { response: { response: { neverError: true } } },
    },
    credentials: { httpHeaderAuth: newCredential('Explorium API') },
    onError: 'continueRegularOutput',
    position: [1320, -200],
  },
  output: [
    {
      data: [
        {
          prospect_id: 'pro_1',
          data: {
            emails: [
              { address: 'jane@acmebio.com', type: 'professional' },
              { address: 'jane.doe@gmail.com', type: 'personal' },
            ],
            phone_numbers: [{ phone_number: '+14155550100' }],
            mobile_phone: '+14155550199',
          },
        },
      ],
    },
  ],
});

const normalizeProspects = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Normalize Prospects',
    parameters: {
      mode: 'runOnceForAllItems',
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
const plan = $('Loop Companies').item.json;
const fetched = ($('Explorium Fetch Prospects').first().json.data) || [];
const profilesArr = ($('Explorium Profiles Enrich').first().json.data) || [];
const contactsArr = ($input.first().json.data) || [];
const profById = {};
for (const e of profilesArr) { if (e && e.prospect_id) profById[e.prospect_id] = (e.data || {}); }
const contById = {};
for (const e of contactsArr) { if (e && e.prospect_id) contById[e.prospect_id] = (e.data || {}); }
const out = [];
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
      title: p.job_title || '',
      seniority: p.job_level_main || p.job_seniority_level || '',
      department: p.job_department_main || p.job_department || '',
      linkedin: prof.linkedin || p.linkedin || '',
      linkedinHeadline: '',
      country: prof.country_name || p.country_name || '',
      region: prof.region_name || p.region_name || '',
      tenureCompanyMonths: tenureMonths ?? null,
      tenureRoleMonths: tenureMonths ?? null,
      exploriumEmployer: (p.company_name || (exp.company && exp.company.name) || '').trim(),
      exploriumEmail: exEmail || '',
      exploriumPhone: exPhone || '',
    },
  });
}
return out;
`,
    },
    position: [1540, -120],
  },
  output: [
    {
      play: 'teknova-aav',
      targetCompany: 'Acme Bio',
      targetDomain: 'acmebio.com',
      personaResidual: 'owns process development buying decisions',
      personaMinScore: 60,
      personaSeniority: ['director', 'senior manager', 'vice president'],
      personaDepartment: ['r&d', 'manufacturing'],
      personaTitleInclude: ['process development', 'gene therapy', 'viral vector', 'manufacturing', 'cmo', 'technical operations'],
      personaTitleExclude: ['intern'],
      prospectId: 'pro_1',
      fullName: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      title: 'VP Process Development',
      seniority: 'vice president',
      department: 'r&d',
      linkedin: 'https://linkedin.com/in/janedoe',
      linkedinHeadline: '',
      country: 'United States',
      region: 'California',
      tenureCompanyMonths: 30,
      tenureRoleMonths: 30,
      exploriumEmployer: 'Acme Bio',
      exploriumEmail: 'jane@acmebio.com',
      exploriumPhone: '+14155550199',
    },
  ],
});

const collectAllProspects = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Collect All Prospects',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const all = $('Normalize Prospects').all().map(i => i.json);
const seen = new Set();
const out = [];
for (const p of all) {
  const key = p.prospectId || (p.fullName + '|' + p.targetCompany);
  if (seen.has(key)) continue;
  seen.add(key);
  out.push({ json: p });
}
return out;
`,
    },
    position: [880, 160],
  },
  output: [
    {
      play: 'teknova-aav',
      targetCompany: 'Acme Bio',
      targetDomain: 'acmebio.com',
      personaResidual: 'owns process development buying decisions',
      personaMinScore: 60,
      personaSeniority: ['director', 'senior manager', 'vice president'],
      personaDepartment: ['r&d', 'manufacturing'],
      personaTitleInclude: ['process development', 'gene therapy', 'viral vector', 'manufacturing', 'cmo', 'technical operations'],
      personaTitleExclude: ['intern'],
      prospectId: 'pro_1',
      fullName: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      title: 'VP Process Development',
      seniority: 'vice president',
      department: 'r&d',
      linkedin: 'https://linkedin.com/in/janedoe',
      linkedinHeadline: '',
      country: 'United States',
      region: 'California',
      tenureCompanyMonths: 30,
      tenureRoleMonths: 30,
      exploriumEmployer: 'Acme Bio',
      exploriumEmail: 'jane@acmebio.com',
      exploriumPhone: '+14155550199',
    },
  ],
});

const apolloMatch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Apollo People Match',
    parameters: {
      method: 'POST',
      url: 'https://api.apollo.io/v1/people/match',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '={{ JSON.stringify({ first_name: $json.firstName, last_name: $json.lastName, organization_name: $json.targetCompany, domain: $json.targetDomain, reveal_personal_emails: false }) }}'
      ),
      options: { response: { response: { neverError: true } }, batching: { batch: { batchSize: 10, batchInterval: 1200 } } },
    },
    credentials: { httpHeaderAuth: newCredential('Apollo API') },
    onError: 'continueRegularOutput',
    position: [1100, 160],
  },
  output: [{ person: { email: 'jane@acmebio.com', organization: { name: 'Acme Bio' } } }],
});

const emailEmployerVerify = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Email + Employer Verify',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `
function norm(s){return (s||'').toString().toLowerCase().replace(/[^a-z0-9]/g,'').replace(/(inc|llc|ltd|corp|co|company|therapeutics|bio|biosciences|pharma|pharmaceuticals)$/,'');}
const prospect = $('Collect All Prospects').itemMatching($itemIndex)?.json || {};
const apollo = ($json.person) || {};
const apolloEmail = apollo.email && !/email_not_unlocked/i.test(apollo.email) ? apollo.email : '';
const apolloEmployer = (apollo.organization && apollo.organization.name) || '';

let email = '', emailSource = '';
if (prospect.exploriumEmail) { email = prospect.exploriumEmail; emailSource = 'explorium'; }
else if (apolloEmail) { email = apolloEmail; emailSource = 'apollo'; }

const target = norm(prospect.targetCompany);
const exMatch = !!prospect.exploriumEmployer && norm(prospect.exploriumEmployer) === target;
const apMatch = !!apolloEmployer && norm(apolloEmployer) === target;
let employerConfirmed = false, sourceCount = 0, needsLiCheck = false;
if (exMatch && apMatch) { employerConfirmed = true; sourceCount = 2; }
else if (exMatch || apMatch) { employerConfirmed = true; sourceCount = 1; needsLiCheck = true; }
else { employerConfirmed = false; sourceCount = 0; needsLiCheck = true; }

return { json: { ...prospect, email, emailSource, apolloEmployer, employerConfirmed, sourceCount, needsLiCheck } };
`,
    },
    position: [1320, 160],
  },
  output: [
    {
      play: 'teknova-aav',
      targetCompany: 'Acme Bio',
      targetDomain: 'acmebio.com',
      personaResidual: 'owns process development buying decisions',
      personaMinScore: 60,
      personaSeniority: ['director', 'senior manager', 'vice president'],
      personaDepartment: ['r&d', 'manufacturing'],
      personaTitleInclude: ['process development', 'gene therapy', 'viral vector', 'manufacturing', 'cmo', 'technical operations'],
      personaTitleExclude: ['intern'],
      prospectId: 'pro_1',
      fullName: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      title: 'VP Process Development',
      seniority: 'vice president',
      department: 'r&d',
      linkedin: 'https://linkedin.com/in/janedoe',
      linkedinHeadline: '',
      country: 'United States',
      region: 'California',
      tenureCompanyMonths: 30,
      tenureRoleMonths: 30,
      exploriumEmployer: 'Acme Bio',
      exploriumEmail: 'jane@acmebio.com',
      exploriumPhone: '+14155550199',
      email: 'jane@acmebio.com',
      emailSource: 'explorium',
      apolloEmployer: 'Acme Bio',
      employerConfirmed: true,
      sourceCount: 2,
      needsLiCheck: false,
    },
  ],
});

const needsLiCheck = ifElse({
  version: 2.2,
  config: {
    name: 'Needs LinkedIn Tiebreak?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [
          {
            leftValue: expr('={{ $json.needsLiCheck }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
    },
    position: [1540, 160],
  },
});

const apifyLinkedIn = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Apify LinkedIn Verify',
    parameters: {
      method: 'POST',
      url: 'https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/run-sync-get-dataset-items',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpQueryAuth',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '={{ JSON.stringify({ queries: [$json.linkedin].filter(Boolean), profileScraperMode: "Profile details no email ($4 per 1k)" }) }}'
      ),
      options: { response: { response: { neverError: true } } },
    },
    credentials: { httpQueryAuth: newCredential('Apify API') },
    onError: 'continueRegularOutput',
    position: [1760, 60],
  },
  output: [
    [
      {
        firstName: 'Jane',
        lastName: 'Doe',
        linkedinUrl: 'https://linkedin.com/in/janedoe',
        headline: 'VP Process Dev at Acme Bio',
        currentPosition: [{ companyName: 'Acme Bio', startDate: { year: 2022, month: 1 } }],
        experience: [
          { companyName: 'Acme Bio', startDate: { year: 2022, month: 1 }, endDate: { text: 'Present' } },
        ],
        location: { parsed: { country: 'United States', state: 'California' } },
      },
    ],
  ],
});

const applyLiResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Apply LinkedIn Result',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `
function norm(s){return (s||'').toString().toLowerCase().replace(/[^a-z0-9]/g,'').replace(/(inc|llc|ltd|corp|co|company|therapeutics|bio|biosciences|pharma|pharmaceuticals)$/,'');}
const prospect = $('Email + Employer Verify').itemMatching($itemIndex)?.json || {};
const arr = Array.isArray($json) ? $json : ($json.data || []);
const profile = arr[0] || {};
const liEmployer = (profile.currentPosition && profile.currentPosition[0] && profile.currentPosition[0].companyName)
  || (profile.experience && profile.experience[0] && profile.experience[0].companyName) || '';
const liValid = !!(profile.firstName || profile.lastName || profile.linkedinUrl);
const target = norm(prospect.targetCompany);
const liMatch = !!liEmployer && norm(liEmployer) === target;
let employerConfirmed = prospect.employerConfirmed;
let sourceCount = prospect.sourceCount;
if (liMatch) { employerConfirmed = true; sourceCount = (prospect.sourceCount || 0) + 1; }
const liHeadline = profile.headline || prospect.linkedinHeadline || '';
return { json: { ...prospect, employerConfirmed, sourceCount, linkedinValid: liValid, linkedinHeadline: liHeadline } };
`,
    },
    position: [1980, 60],
  },
  output: [
    {
      play: 'teknova-aav',
      targetCompany: 'Acme Bio',
      targetDomain: 'acmebio.com',
      personaResidual: 'owns process development buying decisions',
      personaMinScore: 60,
      personaSeniority: ['director', 'senior manager', 'vice president'],
      personaDepartment: ['r&d', 'manufacturing'],
      personaTitleInclude: ['process development', 'gene therapy', 'viral vector', 'manufacturing', 'cmo', 'technical operations'],
      personaTitleExclude: ['intern'],
      prospectId: 'pro_1',
      fullName: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      title: 'VP Process Development',
      seniority: 'vice president',
      department: 'r&d',
      linkedin: 'https://linkedin.com/in/janedoe',
      linkedinHeadline: 'VP Process Dev at Acme Bio',
      country: 'United States',
      region: 'California',
      tenureCompanyMonths: 30,
      tenureRoleMonths: 30,
      exploriumEmployer: 'Acme Bio',
      exploriumEmail: 'jane@acmebio.com',
      exploriumPhone: '+14155550199',
      email: 'jane@acmebio.com',
      emailSource: 'explorium',
      apolloEmployer: 'Acme Bio',
      employerConfirmed: true,
      sourceCount: 2,
      needsLiCheck: false,
      linkedinValid: true,
    },
  ],
});

const liResolved = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'LI Resolved',
    parameters: {
      mode: 'manual',
      assignments: { assignments: [] },
      includeOtherFields: true,
      include: 'all',
    },
    position: [2200, 160],
  },
  output: [
    {
      play: 'teknova-aav',
      targetCompany: 'Acme Bio',
      targetDomain: 'acmebio.com',
      personaResidual: 'owns process development buying decisions',
      personaMinScore: 60,
      personaSeniority: ['director', 'senior manager', 'vice president'],
      personaDepartment: ['r&d', 'manufacturing'],
      personaTitleInclude: ['process development', 'gene therapy', 'viral vector', 'manufacturing', 'cmo', 'technical operations'],
      personaTitleExclude: ['intern'],
      prospectId: 'pro_1',
      fullName: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      title: 'VP Process Development',
      seniority: 'vice president',
      department: 'r&d',
      linkedin: 'https://linkedin.com/in/janedoe',
      linkedinHeadline: 'VP Process Dev at Acme Bio',
      country: 'United States',
      region: 'California',
      tenureCompanyMonths: 30,
      tenureRoleMonths: 30,
      exploriumEmployer: 'Acme Bio',
      exploriumEmail: 'jane@acmebio.com',
      exploriumPhone: '+14155550199',
      email: 'jane@acmebio.com',
      emailSource: 'explorium',
      apolloEmployer: 'Acme Bio',
      employerConfirmed: true,
      sourceCount: 2,
      needsLiCheck: false,
      linkedinValid: true,
    },
  ],
});

const emailVerify = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Hunter Email Verify',
    parameters: {
      method: 'GET',
      url: 'https://api.hunter.io/v2/email-verifier',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpQueryAuth',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'email', value: expr('={{ $json.email }}') }] },
      options: { response: { response: { neverError: true } } },
    },
    credentials: { httpQueryAuth: newCredential('Hunter API') },
    onError: 'continueRegularOutput',
    position: [2420, 160],
  },
  output: [{ data: { status: 'valid', result: 'deliverable' } }],
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
const r = $json.data || $json || {};
const result = (r.result || r.status || '').toLowerCase();
let status = 'unverifiable';
if (!prospect.email) status = 'unverifiable';
else if (result === 'deliverable' || result === 'valid') status = 'verified';
else if (result === 'risky' || result === 'accept_all' || result === 'catch_all' || result === 'webmail') status = 'catch-all';
else if (result === 'undeliverable' || result === 'invalid') status = 'invalid';
else status = 'unverifiable';
const identityConfirmed = status === 'verified' && !!prospect.email && !/^(info|sales|hello|contact|admin|support)@/i.test(prospect.email);
return { json: { ...prospect, emailVerifiedStatus: status, emailIdentityConfirmed: identityConfirmed } };
`,
    },
    position: [2640, 160],
  },
  output: [
    {
      play: 'teknova-aav',
      targetCompany: 'Acme Bio',
      targetDomain: 'acmebio.com',
      personaResidual: 'owns process development buying decisions',
      personaMinScore: 60,
      personaSeniority: ['director', 'senior manager', 'vice president'],
      personaDepartment: ['r&d', 'manufacturing'],
      personaTitleInclude: ['process development', 'gene therapy', 'viral vector', 'manufacturing', 'cmo', 'technical operations'],
      personaTitleExclude: ['intern'],
      prospectId: 'pro_1',
      fullName: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      title: 'VP Process Development',
      seniority: 'vice president',
      department: 'r&d',
      linkedin: 'https://linkedin.com/in/janedoe',
      linkedinHeadline: 'VP Process Dev at Acme Bio',
      country: 'United States',
      region: 'California',
      tenureCompanyMonths: 30,
      tenureRoleMonths: 30,
      exploriumEmployer: 'Acme Bio',
      exploriumEmail: 'jane@acmebio.com',
      exploriumPhone: '+14155550199',
      email: 'jane@acmebio.com',
      emailSource: 'explorium',
      apolloEmployer: 'Acme Bio',
      employerConfirmed: true,
      sourceCount: 2,
      needsLiCheck: false,
      linkedinValid: true,
      emailVerifiedStatus: 'verified',
      emailIdentityConfirmed: true,
    },
  ],
});

const residualScore = node({
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
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'anthropic-version', value: '2023-06-01' },
          { name: 'content-type', value: 'application/json' },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '={{ JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 200, system: "You score how well a person matches an ideal-customer persona. Output ONLY strict JSON: {\\"score\\": <0-100 integer>, \\"reason\\": \\"<one sentence>\\"}. Score reflects fit to the residual persona criteria only.", messages: [{ role: "user", content: "Residual criteria: " + ($json.personaResidual || "none") + "\\nTarget seniority (soft): " + (($json.personaSeniority || []).join(", ") || "any") + "\\nTarget departments (soft): " + (($json.personaDepartment || []).join(", ") || "any") + "\\nTitle signals (OR/soft positive): " + (($json.personaTitleInclude || []).join(", ") || "any") + "\\n\\nPerson: " + ($json.fullName || "") + " | Title: " + ($json.title || "") + " | Seniority: " + ($json.seniority || "") + " | Department: " + ($json.department || "") + " | Headline: " + ($json.linkedinHeadline || "") + "\\n\\nTitle signals are soft OR positives, not requirements. Score 0-100. Return the JSON now." }] }) }}'
      ),
      options: { response: { response: { neverError: true } } },
    },
    onError: 'continueRegularOutput',
    position: [2860, 160],
  },
  output: [{ content: [{ type: 'text', text: '{"score": 82, "reason": "Owns process development decisions."}' }] }],
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
    position: [3080, 160],
  },
  output: [
    {
      play: 'teknova-aav',
      targetCompany: 'Acme Bio',
      targetDomain: 'acmebio.com',
      fullName: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      title: 'VP Process Development',
      seniority: 'vice president',
      department: 'r&d',
      linkedin: 'https://linkedin.com/in/janedoe',
      linkedinHeadline: 'VP Process Dev at Acme Bio',
      country: 'United States',
      region: 'California',
      tenureCompanyMonths: 30,
      tenureRoleMonths: 30,
      exploriumEmployer: 'Acme Bio',
      exploriumEmail: 'jane@acmebio.com',
      exploriumPhone: '+14155550199',
      email: 'jane@acmebio.com',
      emailSource: 'explorium',
      employerConfirmed: true,
      sourceCount: 2,
      linkedinValid: true,
      emailVerifiedStatus: 'verified',
      emailIdentityConfirmed: true,
      icpScore: 82,
      icpReason: 'Owns process development decisions.',
      passesResidual: true,
      titleExcluded: false,
      enrichStatus: 'enrichment_complete',
    },
  ],
});

const prepareContacts = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Contacts Upsert',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const nowIso = new Date().toISOString();
const records = [];
for (const it of $input.all()) {
  const d = it.json;
  if (!d.fullName && !d.email) continue;
  records.push({ fields: {
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
    'LinkedIn URL': d.linkedin || '',
    'LinkedIn Headline': d.linkedinHeadline || '',
    'Email Provider Source': d.emailSource || '',
    'Email Verified Status': d.emailVerifiedStatus || 'unverifiable',
    'Email Identity Confirmed': !!d.emailIdentityConfirmed,
    'Employer Match Confirmed': !!d.employerConfirmed,
    'LinkedIn URL Valid': !!d.linkedinValid,
    'Source Confirmation Count': d.sourceCount != null ? d.sourceCount : 0,
    'Tenure at Company (months)': d.tenureCompanyMonths != null ? d.tenureCompanyMonths : null,
    'Tenure in Role (months)': d.tenureRoleMonths != null ? d.tenureRoleMonths : null,
    'Country': d.country || '',
    'State/Region': d.region || '',
    'Enrichment Status': d.enrichStatus || '',
    'Last Enriched At': nowIso,
  }});
}
const out = [];
for (let i = 0; i < records.length; i += 10) {
  out.push({ json: { airtableBody: {
    performUpsert: { fieldsToMergeOn: ['Email'] },
    typecast: true,
    records: records.slice(i, i + 10),
  } } });
}
if (out.length === 0) return [];
return out;
`,
    },
    position: [3300, 160],
  },
  output: [
    {
      airtableBody: {
        performUpsert: { fieldsToMergeOn: ['Email'] },
        typecast: true,
        records: [{ fields: { 'Full Name': 'Jane Doe', Email: 'jane@acmebio.com' } }],
      },
    },
  ],
});

const upsertContacts = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Contacts to Airtable',
    parameters: {
      method: 'PATCH',
      url: `https://api.airtable.com/v0/${AIRTABLE_BASE}/${CONTACTS_TABLE}`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ JSON.stringify($json.airtableBody) }}'),
      options: {
        response: { response: { neverError: true } },
        batching: { batch: { batchSize: 1, batchInterval: 250 } },
      },
    },
    credentials: { airtableTokenApi: newCredential('Airtable RevOps') },
    onError: 'continueRegularOutput',
    position: [3520, 160],
  },
  output: [{ records: [{ id: 'recNew1' }] }],
});

export default workflow('contact-sourcing-icp', 'RevOps — Contact Sourcing + ICP Gate')
  .add(manualTrigger)
  .to(readPersonaRules)
  .to(readTargetCompanies)
  .to(buildSourcingPlan)
  .to(
    loopCompanies
      .onEachBatch(
        fetchProspects
          .to(exploriumProfilesEnrich)
          .to(exploriumContactsEnrich)
          .to(normalizeProspects)
          .to(nextBatch(loopCompanies))
      )
      .onDone(
        collectAllProspects
          .to(apolloMatch)
          .to(emailEmployerVerify)
          .to(
            needsLiCheck
              .onTrue(apifyLinkedIn.to(applyLiResult).to(liResolved))
              .onFalse(liResolved)
          )
      )
  )
  .add(liResolved)
  .to(emailVerify)
  .to(applyEmailVerify)
  .to(residualScore)
  .to(applyScoreMap)
  .to(prepareContacts)
  .to(upsertContacts)
  .add(scheduleTrigger)
  .to(readPersonaRules);
