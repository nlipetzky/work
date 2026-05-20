import {
  workflow,
  node,
  trigger,
  expr,
} from '@n8n/workflow-sdk';

const SUPABASE_URL = 'https://mrmnyscurmkfppicqqhk.supabase.co/rest/v1';
const AIRTABLE_BASE = 'appYBYH3aOHhTODAw';
const AIRTABLE_COMPANIES = 'tblnj3YlOI3thjrXp';
const AIRTABLE_CONTACTS = 'tblWJksRL1yKSUgrm';
const AIRTABLE_SYNC_RUNS = 'tbllwfj2qEiqY1sdm';
const WORKFLOW_ID_LITERAL = 'GRo45TloP6Awor4V';
const WORKFLOW_NAME_LITERAL = 'Supabase RevOps -> Airtable Sync';

const COMPANY_FIELDS = [
  'Supabase ID', 'Company Name', 'Domain', 'Play', 'Primary Modality', 'Clinical Stage',
  'Company Type', 'HQ State', 'Employee Count', 'Company Score', 'Enrichment Status',
  'Modality Confirmed', 'Pipeline Indication', 'Signal: Funding Event', 'Funding Event Detail',
  'Signal: Leadership Hire', 'Leadership Hire Detail', 'Signal: IND/Stage Advance',
  'IND/Stage Advance Detail', 'Signal: Conference Presence', 'Conference Presence Detail',
  'Recent Publication', 'Signal: Publication', 'Signal: Clinical Stage Advance',
  'Signal: Phase Transition', 'Active Signals Summary', 'Salesforce Engagement', 'Existing Customer',
  'SF Account ID', 'SF Opp Stage', 'SF Has Open Opp', 'SF Has Closed Won', 'DNC Opt Out',
  'Last Contacted Date', 'In Cadence Count', 'Already Engaged Count', 'Company Status',
  'Play Eligibility Status', 'Exclusion Reason', 'Fit Score', 'Playbook Fit Score',
  'Playbook Fit Level', 'Industry', 'Country', 'Website', 'Funding Stage', 'Revenue Range',
  'Company Brief', 'Development Stage', 'Research Focus', 'V2 Primary Modality',
  'V2 Company Type', 'Company LinkedIn URL', 'Last Enriched At',
];

const CONTACT_FIELDS = [
  'Supabase ID', 'Full Name', 'First Name', 'Last Name', 'Email', 'Title', 'Company Name',
  'Company Domain', 'Play', 'Seniority', 'Function', 'Contact Score', 'Enrichment Status',
  'Opt Out', 'Active Cadence', 'Email Verified', 'Last Enriched At', 'LinkedIn URL', 'Fit Score',
  'ICP Score', 'DMU Tier', 'Gate Level', 'Seniority Level', 'Do Not Contact', 'Email Opt Out',
  'Hard Bounced', 'Employment Status', 'SF Contact ID', 'SF Entity Type', 'Known Status',
  'Signal Score', 'Tenure Years', 'State/Region', 'Country', 'Email Confidence', 'Delivery Path',
  'LinkedIn Headline', 'Contact Modality', 'Mobile Phone',
];

function fieldMap(fields: string[]): Record<string, any> {
  const map: Record<string, any> = {};
  fields.forEach((f) => {
    map[f] = expr('={{ $json[' + JSON.stringify(f) + '] }}');
  });
  return map;
}

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Trigger', position: [0, 304] },
  output: [{}],
});

const configNode = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Config',
    parameters: {
      assignments: {
        assignments: [
          { id: 'play-name', name: 'play_name', value: 'AAV Gene Therapy', type: 'string' },
          { id: 'workflow-id', name: 'workflow_id', value: WORKFLOW_ID_LITERAL, type: 'string' },
          { id: 'workflow-name', name: 'workflow_name', value: WORKFLOW_NAME_LITERAL, type: 'string' },
          { id: 'triggered-by', name: 'triggered_by', value: 'manual', type: 'string' },
        ],
      },
      options: {},
    },
    position: [224, 304],
  },
  output: [{ play_name: 'AAV Gene Therapy', workflow_id: WORKFLOW_ID_LITERAL, workflow_name: WORKFLOW_NAME_LITERAL, triggered_by: 'manual' }],
});

const checkActiveRuns = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Check Active Runs',
    parameters: {
      url: SUPABASE_URL + '/sync_runs_active',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      queryParameters: { parameters: [{ name: 'select', value: 'id,workflow_id,running_seconds' }] },
      options: {},
    },
    alwaysOutputData: true,
    position: [448, 304],
  },
  output: [{ id: 'sample-uuid', workflow_id: WORKFLOW_ID_LITERAL, running_seconds: 0 }],
});

const guardActiveRuns = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Guard: No Active Runs',
    parameters: {
      jsCode:
        "const active = $input.all().filter(function(i){ return i.json && i.json.id; });\n" +
        "if (active.length > 0) {\n" +
        "  const ids = active.map(function(a){ return a.json.id + ' (' + a.json.running_seconds + 's)'; }).join(', ');\n" +
        "  throw new Error('Active sync run(s) in progress: ' + ids + '. Halting to prevent parallel mutation. If stuck, manually mark them failed in sync_runs.');\n" +
        "}\n" +
        "return [{ json: $('Config').first().json }];",
    },
    position: [672, 304],
  },
  output: [{ play_name: 'AAV Gene Therapy', workflow_id: WORKFLOW_ID_LITERAL, workflow_name: WORKFLOW_NAME_LITERAL, triggered_by: 'manual' }],
});

const openRun = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Open Run (Supabase)',
    parameters: {
      method: 'POST',
      url: SUPABASE_URL + '/sync_runs',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Prefer', value: 'return=representation' },
          { name: 'Accept', value: 'application/vnd.pgrst.object+json' },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '={{ JSON.stringify({ workflow_id: $json.workflow_id, workflow_name: $json.workflow_name, play_name: $json.play_name, triggered_by: $json.triggered_by, status: "running", config: { play_name: $json.play_name } }) }}'
      ),
      options: {},
    },
    position: [896, 304],
  },
  output: [{ id: 'sample-uuid', status: 'running', started_at: '2026-05-11T15:00:00Z' }],
});

const mirrorOpenRun = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Mirror Run -> Airtable (open)',
    parameters: {
      operation: 'upsert',
      base: { __rl: true, value: AIRTABLE_BASE, mode: 'id' },
      table: { __rl: true, value: AIRTABLE_SYNC_RUNS, mode: 'id' },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['Run ID'],
        value: {
          'Run ID': expr('={{ $json.id }}'),
          'Status': 'running',
          'Started At': expr('={{ $json.started_at }}'),
          'Play': expr("={{ $('Config').first().json.play_name }}"),
          'Workflow': expr("={{ $('Config').first().json.workflow_name }}"),
          'Triggered By': expr("={{ $('Config').first().json.triggered_by }}"),
        },
      },
      options: {},
    },
    position: [1120, 304],
  },
  output: [{ id: 'recXXX', fields: {} }],
});

const getEvaluations = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Get Evaluations',
    parameters: {
      url: SUPABASE_URL + '/playbook_evaluations',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'playbook_name', value: expr("=ilike.*{{ $('Config').first().json.play_name }}*") },
          { name: 'matched', value: 'eq.true' },
          { name: 'select', value: 'company_id,contact_id' },
          { name: 'limit', value: '2000' },
        ],
      },
      options: {},
    },
    alwaysOutputData: true,
    position: [1344, 304],
  },
  output: [{ company_id: 'co-1', contact_id: 'c-1' }],
});

const extractIds = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Extract IDs',
    parameters: {
      jsCode:
        "const items = $input.all();\n" +
        "const companyIds = [...new Set(items.map(function(i){ return i.json.company_id; }).filter(Boolean))];\n" +
        "const contactIds = [...new Set(items.map(function(i){ return i.json.contact_id; }).filter(Boolean))];\n" +
        "const runId = $('Open Run (Supabase)').first().json.id;\n" +
        "return [{ json: { company_ids: companyIds, contact_ids: contactIds, evaluations_matched: items.length, run_id: runId } }];",
    },
    position: [1568, 304],
  },
  output: [{ company_ids: ['co-1'], contact_ids: ['c-1'], evaluations_matched: 1, run_id: 'sample-uuid' }],
});

const updateRunFetched = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Update Run: Fetched',
    parameters: {
      method: 'PATCH',
      url: SUPABASE_URL + '/sync_runs',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      queryParameters: { parameters: [{ name: 'id', value: expr("=eq.{{ $json.run_id }}") }] },
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '={{ JSON.stringify({ evaluations_matched: $json.evaluations_matched, companies_fetched: $json.company_ids.length, contacts_fetched: $json.contact_ids.length }) }}'
      ),
      options: {},
    },
    position: [1792, 304],
  },
  output: [{}],
});

const fetchCompanies = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Companies',
    parameters: {
      url: SUPABASE_URL + '/companies',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'id', value: expr("={{ 'in.(' + $('Extract IDs').first().json.company_ids.join(',') + ')' }}") },
          { name: 'select', value: 'id,name,domain,industry,country,employee_count,funding_stage,revenue_range,primary_modality,clinical_stage,company_type_primary,hq_state,company_score,fit_score,playbook_fit_score,playbook_fit_level,enrichment_status,modality_confirmed,pipeline_indication,funding_event,ind_or_stage_advance,leadership_hire,conference_presence,recent_publication,signal_hiring,signal_ind_filing,signal_conference,signal_publication,signal_clinical_stage_advance,signal_phase_transition,active_signals_summary,salesforce_engagement_status,existing_customer,sf_account_id,sf_opp_stage,sf_has_open_opp,sf_has_closed_won,last_enriched_at,company_brief,website,research_focus,development_stage,v2_primary_modality,v2_company_type,company_status,play_eligibility_status,exclusion_reason,last_contacted_date,dnc_opt_out,in_cadence_count,already_engaged_count,company_linkedin_url' },
          { name: 'limit', value: '1000' },
        ],
      },
      options: {},
    },
    alwaysOutputData: true,
    position: [2016, 304],
  },
  output: [{ id: 'co-1', name: 'Acme Bio' }],
});

const mapCompanies = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Map Companies',
    parameters: {
      jsCode:
        "const items = $input.all();\n" +
        "const playName = $('Config').first().json.play_name;\n" +
        "function toBool(v){ if (v === null || v === undefined) return null; return v ? 'Yes' : 'No'; }\n" +
        "return items.map(function(i){\n" +
        "  const c = i.json; const f = {};\n" +
        "  f['Supabase ID'] = c.id;\n" +
        "  if (c.name) f['Company Name'] = c.name;\n" +
        "  if (c.domain) f['Domain'] = c.domain;\n" +
        "  f['Play'] = playName;\n" +
        "  if (c.primary_modality) f['Primary Modality'] = c.primary_modality;\n" +
        "  if (c.clinical_stage) f['Clinical Stage'] = c.clinical_stage;\n" +
        "  if (c.company_type_primary) f['Company Type'] = c.company_type_primary;\n" +
        "  if (c.hq_state) f['HQ State'] = c.hq_state;\n" +
        "  if (c.employee_count != null) f['Employee Count'] = Number(c.employee_count);\n" +
        "  if (c.company_score != null) f['Company Score'] = Number(c.company_score);\n" +
        "  if (c.enrichment_status) f['Enrichment Status'] = c.enrichment_status;\n" +
        "  const mc = toBool(c.modality_confirmed); if (mc) f['Modality Confirmed'] = mc;\n" +
        "  if (c.pipeline_indication) f['Pipeline Indication'] = c.pipeline_indication;\n" +
        "  f['Signal: Funding Event'] = c.funding_event ? 'Yes' : 'No';\n" +
        "  if (c.funding_event) f['Funding Event Detail'] = c.funding_event;\n" +
        "  const sh = toBool(c.signal_hiring); if (sh) f['Signal: Leadership Hire'] = sh;\n" +
        "  if (c.leadership_hire) f['Leadership Hire Detail'] = c.leadership_hire;\n" +
        "  const si = toBool(c.signal_ind_filing); if (si) f['Signal: IND/Stage Advance'] = si;\n" +
        "  if (c.ind_or_stage_advance) f['IND/Stage Advance Detail'] = c.ind_or_stage_advance;\n" +
        "  const sc = toBool(c.signal_conference); if (sc) f['Signal: Conference Presence'] = sc;\n" +
        "  if (c.conference_presence) f['Conference Presence Detail'] = c.conference_presence;\n" +
        "  if (c.recent_publication) f['Recent Publication'] = c.recent_publication;\n" +
        "  const sp = toBool(c.signal_publication); if (sp) f['Signal: Publication'] = sp;\n" +
        "  const sca = toBool(c.signal_clinical_stage_advance); if (sca) f['Signal: Clinical Stage Advance'] = sca;\n" +
        "  const spt = toBool(c.signal_phase_transition); if (spt) f['Signal: Phase Transition'] = spt;\n" +
        "  if (c.active_signals_summary) f['Active Signals Summary'] = c.active_signals_summary;\n" +
        "  if (c.salesforce_engagement_status) f['Salesforce Engagement'] = c.salesforce_engagement_status;\n" +
        "  if (c.existing_customer) f['Existing Customer'] = c.existing_customer;\n" +
        "  if (c.sf_account_id) f['SF Account ID'] = c.sf_account_id;\n" +
        "  if (c.sf_opp_stage) f['SF Opp Stage'] = c.sf_opp_stage;\n" +
        "  const soo = toBool(c.sf_has_open_opp); if (soo) f['SF Has Open Opp'] = soo;\n" +
        "  const scw = toBool(c.sf_has_closed_won); if (scw) f['SF Has Closed Won'] = scw;\n" +
        "  const dnc = toBool(c.dnc_opt_out); if (dnc) f['DNC Opt Out'] = dnc;\n" +
        "  if (c.last_contacted_date) f['Last Contacted Date'] = c.last_contacted_date;\n" +
        "  if (c.in_cadence_count != null) f['In Cadence Count'] = Number(c.in_cadence_count);\n" +
        "  if (c.already_engaged_count != null) f['Already Engaged Count'] = Number(c.already_engaged_count);\n" +
        "  if (c.company_status) f['Company Status'] = c.company_status;\n" +
        "  if (c.play_eligibility_status) f['Play Eligibility Status'] = c.play_eligibility_status;\n" +
        "  if (c.exclusion_reason) f['Exclusion Reason'] = c.exclusion_reason;\n" +
        "  if (c.fit_score != null) f['Fit Score'] = Number(c.fit_score);\n" +
        "  if (c.playbook_fit_score != null) f['Playbook Fit Score'] = Number(c.playbook_fit_score);\n" +
        "  if (c.playbook_fit_level) f['Playbook Fit Level'] = c.playbook_fit_level;\n" +
        "  if (c.industry) f['Industry'] = c.industry;\n" +
        "  if (c.country) f['Country'] = c.country;\n" +
        "  if (c.website) f['Website'] = c.website;\n" +
        "  if (c.funding_stage) f['Funding Stage'] = c.funding_stage;\n" +
        "  if (c.revenue_range) f['Revenue Range'] = c.revenue_range;\n" +
        "  if (c.company_brief) f['Company Brief'] = c.company_brief;\n" +
        "  if (c.development_stage) f['Development Stage'] = c.development_stage;\n" +
        "  if (c.research_focus) f['Research Focus'] = c.research_focus;\n" +
        "  if (c.v2_primary_modality) f['V2 Primary Modality'] = c.v2_primary_modality;\n" +
        "  if (c.v2_company_type) f['V2 Company Type'] = c.v2_company_type;\n" +
        "  if (c.company_linkedin_url) f['Company LinkedIn URL'] = c.company_linkedin_url;\n" +
        "  if (c.last_enriched_at) f['Last Enriched At'] = c.last_enriched_at;\n" +
        "  return { json: f };\n" +
        "});",
    },
    position: [2240, 304],
  },
  output: [{ 'Supabase ID': 'co-1', 'Company Name': 'Acme Bio', 'Play': 'AAV Gene Therapy' }],
});

const upsertCompanies = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Upsert Companies',
    parameters: {
      operation: 'upsert',
      base: { __rl: true, value: AIRTABLE_BASE, mode: 'id' },
      table: { __rl: true, value: AIRTABLE_COMPANIES, mode: 'id' },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['Supabase ID'],
        value: fieldMap(COMPANY_FIELDS),
      },
      options: {},
    },
    continueOnFail: true,
    position: [2464, 304],
  },
  output: [{ id: 'recXXX', fields: {}, createdTime: '' }],
});

const captureCompaniesResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Capture Companies Result',
    parameters: {
      jsCode:
        "const items = $input.all();\n" +
        "let upserted = 0;\n" +
        "let failed = 0;\n" +
        "const errors = [];\n" +
        "items.forEach(function(item, idx){\n" +
        "  const j = item.json || {};\n" +
        "  if (j.error || item.error) {\n" +
        "    failed++;\n" +
        "    errors.push({\n" +
        "      phase: 'companies',\n" +
        "      item_index: idx,\n" +
        "      message: (j.error && (j.error.message || j.error)) || (item.error && item.error.message) || 'Unknown error',\n" +
        "      payload: j\n" +
        "    });\n" +
        "  } else if (j.id) {\n" +
        "    upserted++;\n" +
        "  }\n" +
        "});\n" +
        "return [{ json: { run_id: $('Extract IDs').first().json.run_id, companies_upserted: upserted, companies_failed: failed, errors: errors } }];",
    },
    position: [2688, 304],
  },
  output: [{ run_id: 'sample-uuid', companies_upserted: 0, companies_failed: 0, errors: [] }],
});

const updateRunCompanies = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Update Run: Companies',
    parameters: {
      method: 'PATCH',
      url: SUPABASE_URL + '/sync_runs',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      queryParameters: { parameters: [{ name: 'id', value: expr("=eq.{{ $json.run_id }}") }] },
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '={{ JSON.stringify({ companies_upserted: $json.companies_upserted, companies_failed: $json.companies_failed, errors: $json.errors }) }}'
      ),
      options: {},
    },
    position: [2912, 304],
  },
  output: [{}],
});

const startContacts = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Start Contacts',
    parameters: {
      jsCode:
        "const ext = $('Extract IDs').first().json;\n" +
        "return [{ json: { contact_ids: ext.contact_ids, run_id: ext.run_id, prior_errors: $('Capture Companies Result').first().json.errors } }];",
    },
    position: [3136, 304],
  },
  output: [{ contact_ids: ['c-1'], run_id: 'sample-uuid', prior_errors: [] }],
});

const fetchContacts = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Contacts',
    parameters: {
      url: SUPABASE_URL + '/contacts',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'id', value: expr("={{ 'in.(' + $json.contact_ids.join(',') + ')' }}") },
          { name: 'select', value: 'id,first_name,last_name,email,linkedin_url,title,country,state_region,email_confidence,dmu_tier,seniority_level,icp_score,email_verified_status,tenure_years,last_enriched_at,gate_level,contact_modality,known_status,do_not_contact,email_opt_out,hard_bounced,delivery_path,employment_status,linkedin_headline,sf_contact_id,sf_entity_type,fit_score,signal_score,active_cadence_enrollment,opt_out_status,seniority,function_classification,enrichment_status,contact_score,mobile_phone,company:companies(name,domain)' },
          { name: 'limit', value: '1000' },
        ],
      },
      options: {},
    },
    alwaysOutputData: true,
    position: [3360, 304],
  },
  output: [{ id: 'c-1', first_name: 'Jane' }],
});

const mapContacts = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Map Contacts',
    parameters: {
      jsCode:
        "const items = $input.all();\n" +
        "const playName = $('Config').first().json.play_name;\n" +
        "function toBool(v){ if (v === null || v === undefined) return null; return v ? 'Yes' : 'No'; }\n" +
        "return items.map(function(i){\n" +
        "  const c = i.json; const co = c.company || {}; const f = {};\n" +
        "  f['Supabase ID'] = c.id;\n" +
        "  const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ');\n" +
        "  if (fullName) f['Full Name'] = fullName;\n" +
        "  if (c.first_name) f['First Name'] = c.first_name;\n" +
        "  if (c.last_name) f['Last Name'] = c.last_name;\n" +
        "  if (c.email) f['Email'] = c.email;\n" +
        "  if (c.title) f['Title'] = c.title;\n" +
        "  if (co.name) f['Company Name'] = co.name;\n" +
        "  if (co.domain) f['Company Domain'] = co.domain;\n" +
        "  f['Play'] = playName;\n" +
        "  if (c.seniority) f['Seniority'] = c.seniority;\n" +
        "  if (c.function_classification) f['Function'] = c.function_classification;\n" +
        "  if (c.contact_score != null) f['Contact Score'] = Number(c.contact_score);\n" +
        "  if (c.enrichment_status) f['Enrichment Status'] = c.enrichment_status;\n" +
        "  if (c.opt_out_status) f['Opt Out'] = c.opt_out_status;\n" +
        "  if (c.active_cadence_enrollment) f['Active Cadence'] = c.active_cadence_enrollment;\n" +
        "  if (c.email_verified_status) f['Email Verified'] = c.email_verified_status;\n" +
        "  if (c.last_enriched_at) f['Last Enriched At'] = c.last_enriched_at;\n" +
        "  if (c.linkedin_url) f['LinkedIn URL'] = c.linkedin_url;\n" +
        "  if (c.fit_score != null) f['Fit Score'] = Number(c.fit_score);\n" +
        "  if (c.icp_score != null) f['ICP Score'] = Number(c.icp_score);\n" +
        "  if (c.dmu_tier) f['DMU Tier'] = c.dmu_tier;\n" +
        "  if (c.gate_level) f['Gate Level'] = c.gate_level;\n" +
        "  if (c.seniority_level) f['Seniority Level'] = c.seniority_level;\n" +
        "  const dnc = toBool(c.do_not_contact); if (dnc) f['Do Not Contact'] = dnc;\n" +
        "  const eoo = toBool(c.email_opt_out); if (eoo) f['Email Opt Out'] = eoo;\n" +
        "  const hb = toBool(c.hard_bounced); if (hb) f['Hard Bounced'] = hb;\n" +
        "  if (c.employment_status) f['Employment Status'] = c.employment_status;\n" +
        "  if (c.sf_contact_id) f['SF Contact ID'] = c.sf_contact_id;\n" +
        "  if (c.sf_entity_type) f['SF Entity Type'] = c.sf_entity_type;\n" +
        "  if (c.known_status) f['Known Status'] = c.known_status;\n" +
        "  if (c.signal_score != null) f['Signal Score'] = Number(c.signal_score);\n" +
        "  if (c.tenure_years != null) f['Tenure Years'] = Number(c.tenure_years);\n" +
        "  if (c.state_region) f['State/Region'] = c.state_region;\n" +
        "  if (c.country) f['Country'] = c.country;\n" +
        "  if (c.email_confidence != null) f['Email Confidence'] = Number(c.email_confidence);\n" +
        "  if (c.delivery_path) f['Delivery Path'] = c.delivery_path;\n" +
        "  if (c.linkedin_headline) f['LinkedIn Headline'] = c.linkedin_headline;\n" +
        "  if (c.contact_modality) f['Contact Modality'] = c.contact_modality;\n" +
        "  if (c.mobile_phone) f['Mobile Phone'] = c.mobile_phone;\n" +
        "  return { json: f };\n" +
        "});",
    },
    position: [3584, 304],
  },
  output: [{ 'Supabase ID': 'c-1', 'Full Name': 'Jane Smith', 'Play': 'AAV Gene Therapy' }],
});

const upsertContacts = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Upsert Contacts',
    parameters: {
      operation: 'upsert',
      base: { __rl: true, value: AIRTABLE_BASE, mode: 'id' },
      table: { __rl: true, value: AIRTABLE_CONTACTS, mode: 'id' },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['Supabase ID'],
        value: fieldMap(CONTACT_FIELDS),
      },
      options: {},
    },
    continueOnFail: true,
    position: [3808, 304],
  },
  output: [{ id: 'recXXX', fields: {}, createdTime: '' }],
});

const captureContactsResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Capture Contacts Result',
    parameters: {
      jsCode:
        "const items = $input.all();\n" +
        "const priorErrors = $('Start Contacts').first().json.prior_errors || [];\n" +
        "let upserted = 0;\n" +
        "let failed = 0;\n" +
        "const errors = priorErrors.slice();\n" +
        "items.forEach(function(item, idx){\n" +
        "  const j = item.json || {};\n" +
        "  if (j.error || item.error) {\n" +
        "    failed++;\n" +
        "    errors.push({\n" +
        "      phase: 'contacts',\n" +
        "      item_index: idx,\n" +
        "      message: (j.error && (j.error.message || j.error)) || (item.error && item.error.message) || 'Unknown error',\n" +
        "      payload: j\n" +
        "    });\n" +
        "  } else if (j.id) {\n" +
        "    upserted++;\n" +
        "  }\n" +
        "});\n" +
        "const finalStatus = errors.length === 0 ? 'complete' : 'partial';\n" +
        "return [{ json: { run_id: $('Start Contacts').first().json.run_id, contacts_upserted: upserted, contacts_failed: failed, errors: errors, final_status: finalStatus, completed_at: new Date().toISOString() } }];",
    },
    position: [4032, 304],
  },
  output: [{ run_id: 'sample-uuid', contacts_upserted: 0, contacts_failed: 0, errors: [], final_status: 'complete', completed_at: '2026-05-11T15:00:00Z' }],
});

const closeRunSupabase = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Close Run (Supabase)',
    parameters: {
      method: 'PATCH',
      url: SUPABASE_URL + '/sync_runs',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      queryParameters: { parameters: [{ name: 'id', value: expr("=eq.{{ $json.run_id }}") }] },
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '={{ JSON.stringify({ status: $json.final_status, completed_at: $json.completed_at, contacts_upserted: $json.contacts_upserted, contacts_failed: $json.contacts_failed, errors: $json.errors }) }}'
      ),
      options: {},
    },
    position: [4256, 304],
  },
  output: [{}],
});

const closeRunAirtable = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Mirror Run -> Airtable (close)',
    parameters: {
      operation: 'upsert',
      base: { __rl: true, value: AIRTABLE_BASE, mode: 'id' },
      table: { __rl: true, value: AIRTABLE_SYNC_RUNS, mode: 'id' },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['Run ID'],
        value: {
          'Run ID': expr("={{ $('Capture Contacts Result').first().json.run_id }}"),
          'Status': expr("={{ $('Capture Contacts Result').first().json.final_status }}"),
          'Completed At': expr("={{ $('Capture Contacts Result').first().json.completed_at }}"),
          'Evaluations Matched': expr("={{ $('Extract IDs').first().json.evaluations_matched }}"),
          'Companies Fetched': expr("={{ $('Extract IDs').first().json.company_ids.length }}"),
          'Companies Upserted': expr("={{ $('Capture Companies Result').first().json.companies_upserted }}"),
          'Companies Failed': expr("={{ $('Capture Companies Result').first().json.companies_failed }}"),
          'Contacts Fetched': expr("={{ $('Extract IDs').first().json.contact_ids.length }}"),
          'Contacts Upserted': expr("={{ $('Capture Contacts Result').first().json.contacts_upserted }}"),
          'Contacts Failed': expr("={{ $('Capture Contacts Result').first().json.contacts_failed }}"),
          'Error Count': expr("={{ $('Capture Contacts Result').first().json.errors.length }}"),
          'Errors': expr("={{ JSON.stringify($('Capture Contacts Result').first().json.errors, null, 2) }}"),
        },
      },
      options: {},
    },
    position: [4480, 304],
  },
  output: [{ id: 'recXXX', fields: {} }],
});

export default workflow(WORKFLOW_ID_LITERAL, WORKFLOW_NAME_LITERAL)
  .add(manualTrigger)
  .to(configNode)
  .to(checkActiveRuns)
  .to(guardActiveRuns)
  .to(openRun)
  .to(mirrorOpenRun)
  .to(getEvaluations)
  .to(extractIds)
  .to(updateRunFetched)
  .to(fetchCompanies)
  .to(mapCompanies)
  .to(upsertCompanies)
  .to(captureCompaniesResult)
  .to(updateRunCompanies)
  .to(startContacts)
  .to(fetchContacts)
  .to(mapContacts)
  .to(upsertContacts)
  .to(captureContactsResult)
  .to(closeRunSupabase)
  .to(closeRunAirtable);
