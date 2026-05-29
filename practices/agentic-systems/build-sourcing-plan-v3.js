function bareDomain(url) {
  if (!url) return null;
  return String(url).toLowerCase()
    .replace(/^https?:\/\//, '').replace(/^www\./, '')
    .replace(/\/.*$/, '').trim() || null;
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

// === APOLLO TAXONOMY TRANSLATION ===
const apolloSeniorityMap = {
  'c-suite': ['c_suite'],
  'president': ['c_suite'],
  'founder': ['founder'],
  'owner': ['owner'],
  'partner': ['partner'],
  'vice president': ['vp'],
  'director': ['director'],
  'senior manager': ['manager'],
  'manager': ['manager'],
  'senior non-managerial': ['senior'],
  'non-managerial': ['entry'],
  'junior': ['entry'],
  'advisor': ['c_suite'],
  'head': ['head'],
};
const apolloDeptMap = {
  'engineering': ['engineering'],
  'r&d': ['engineering'],
  'product': ['product_management'],
  'operations': ['operations'],
  'manufacturing': ['operations'],
  'marketing': ['marketing'],
  'sales': ['sales'],
  'finance': ['finance'],
  'legal': ['legal'],
  'human resources': ['human_resources'],
  'it': ['information_technology'],
  'data': ['information_technology'],
  'support': ['support'],
  'customer success': ['support'],
  'design': ['design'],
  'administration': ['operations'],
  'strategy': ['business_development'],
  'partnerships': ['business_development'],
  'procurement': ['operations'],
  'logistics': ['operations'],
};
const apolloSeniorities = Array.from(new Set((seniority || []).flatMap(s => apolloSeniorityMap[String(s).toLowerCase().trim()] || [])));
const apolloDepartments = Array.from(new Set((departments || []).flatMap(d => apolloDeptMap[String(d).toLowerCase().trim()] || [])));

const companies = $('Read Target Companies').all().map(i => i.json.fields || i.json);
const out = [];
for (const c of companies) {
  const bizId = (c['Explorium Business ID'] || '').trim();
  if (!bizId) continue;
  const domain = bareDomain(c['Domain'] || c['Website']);
  const filters = {
    business_id: { values: [bizId] },
    country_code: { values: ['US', 'CA'] },
    job_level: { values: serverJobLevel },
  };
  if (serverJobDept.length) filters.job_department = { values: serverJobDept };

  const apolloBody = {
    page: 1,
    per_page: 25,
    organization_domains_list: domain ? [domain] : [],
  };
  if (apolloSeniorities.length) apolloBody.person_seniorities = apolloSeniorities;
  if (apolloDepartments.length) apolloBody.person_department_or_subdepartments = apolloDepartments;

  out.push({
    json: {
      targetCompany: (c['Company Name'] || '').trim(),
      targetDomain: domain,
      play: (c['Play'] || '').trim(),
      exploriumBusinessId: bizId,
      personaResidual: residual,
      personaMinScore: minScore,
      personaSeniority: seniority,
      personaDepartment: departments,
      personaTitleInclude: titleInclude,
      personaTitleExclude: titleExclude,
      exploriumProspectBody: { mode: 'full', size: 100, page_size: 100, filters },
      apolloProspectBody: apolloBody,
    },
  });
}
return out;
