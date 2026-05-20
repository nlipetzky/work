import {
  workflow,
  node,
  trigger,
  sticky,
  newCredential,
  ifElse,
  splitInBatches,
  nextBatch,
  expr,
} from '@n8n/workflow-sdk';

const airtableCred = newCredential('RevOps Airtable');

// ─── TRIGGERS ────────────────────────────────────────────────────────────────

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Run Manually', position: [240, 200] },
  output: [{}],
});

const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Weekly Monday 6am',
    parameters: {
      rule: {
        interval: [
          {
            field: 'weeks',
            weeksInterval: 1,
            triggerAtDay: [1],
            triggerAtHour: 6,
            triggerAtMinute: 0,
          },
        ],
      },
    },
    position: [240, 440],
  },
  output: [{}],
});

// ─── SHARED PIPELINE ─────────────────────────────────────────────────────────

const setTimestamp = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Set Run Timestamp',
    parameters: {
      assignments: {
        assignments: [
          {
            id: 'ts1',
            name: 'runTimestamp',
            value: expr('{{ $now.toISO() }}'),
            type: 'string',
          },
        ],
      },
      options: {},
    },
    position: [500, 320],
  },
  output: [{ runTimestamp: '2026-05-20T06:00:00.000Z' }],
});

const listCompanies = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  credentials: { airtableTokenApi: airtableCred },
  config: {
    name: 'List Companies',
    parameters: {
      resource: 'record',
      operation: 'search',
      base: {
        __rl: true,
        mode: 'id',
        value: 'appYBYH3aOHhTODAw',
        cachedResultName: 'RevOps Surface',
      },
      table: {
        __rl: true,
        mode: 'id',
        value: 'tblnj3YlOI3thjrXp',
        cachedResultName: 'Companies',
      },
      filterByFormula: "NOT({Canonical Status} = 'archived')",
      returnAll: true,
      options: {
        fields: ['Company Name', 'Domain', 'Ultimate Parent'],
      },
    },
    position: [760, 320],
  },
  output: [
    {
      id: 'recABC',
      'Company Name': 'Voyager Therapeutics',
      Domain: 'voyagertherapeutics.com',
      'Ultimate Parent': '',
    },
  ],
});

// ─── COMPANY LOOP ─────────────────────────────────────────────────────────────

const splitByCompany = splitInBatches({
  version: 3,
  config: {
    name: 'Loop Over Companies',
    parameters: { batchSize: 1 },
    position: [1020, 320],
  },
});

// Prepares 1 or 2 assignee name queries per company (company name + ultimate parent if different)
const prepareQueries = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Assignee Queries',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `const company = $input.first().json;
const companyRecordId = $input.first().json.id;
const companyName = (company['Company Name'] || '').trim();
const ultimateParent = (company['Ultimate Parent'] || '').trim();
const runTimestamp = $('Set Run Timestamp').first().json.runTimestamp;

const queries = [{ assigneeName: companyName, companyRecordId, companyName, runTimestamp }];

if (ultimateParent && ultimateParent.toLowerCase() !== companyName.toLowerCase()) {
  queries.push({ assigneeName: ultimateParent, companyRecordId, companyName, runTimestamp });
}

return queries.map(q => ({ json: q }));`,
    },
    position: [1280, 320],
  },
  output: [
    {
      assigneeName: 'Voyager Therapeutics',
      companyRecordId: 'recABC',
      companyName: 'Voyager Therapeutics',
      runTimestamp: '2026-05-20T06:00:00.000Z',
    },
  ],
});

// Runs once per assignee name item (1 or 2 calls per company)
const queryPatentsView = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Query PatentsView',
    parameters: {
      method: 'GET',
      url: 'https://search.patentsview.org/api/v1/patent/',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          {
            name: 'q',
            value: expr(
              '{{ JSON.stringify({"assignee_organization": $json.assigneeName}) }}'
            ),
          },
          {
            name: 'f',
            value: '["patent_id","patent_number","patent_title","patent_date","patent_abstract","assignees.assignee_organization","inventors.inventor_name_first","inventors.inventor_name_last","cpcs.cpc_subgroup_id","applications.filing_date"]',
          },
          { name: 's', value: '[{"patent_date":"desc"}]' },
          { name: 'o', value: '{"per_page":100,"page":1}' },
        ],
      },
      options: {
        response: {
          response: {
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
    position: [1540, 320],
  },
  output: [{ patents: [], count: 0, total_patent_count: 0 }],
});

// Collects all query responses, dedupes by patent_id, normalises to event row format.
// Always returns at least 1 item (_hasPatents: false when no patents found).
const aggregatePatents = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Aggregate and Dedupe Patents',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `const allResponses = $input.all();
const ctx = $('Prepare Assignee Queries').first().json;
const companyRecordId = ctx.companyRecordId;
const companyName = ctx.companyName;
const runTimestamp = ctx.runTimestamp || new Date().toISOString();
const runDate = runTimestamp.substring(0, 10);

const seen = new Set();
const patents = [];

for (const r of allResponses) {
  const patentList = r.json.patents || [];
  for (const p of patentList) {
    const pid = p.patent_id || p.patent_number;
    if (pid && !seen.has(pid)) {
      seen.add(pid);
      patents.push(p);
    }
  }
}

if (patents.length === 0) {
  return [{ json: { _hasPatents: false, _companyRecordId: companyRecordId, _companyName: companyName } }];
}

return patents.map(p => {
  const patentNumber = p.patent_number || p.patent_id;
  const grantDate = p.patent_date || null;
  const apps = p.applications || [];
  const filingDate = apps.length > 0 ? (apps[0].filing_date || null) : null;
  const eventDate = filingDate || grantDate;

  const inventorNames = (p.inventors || [])
    .map(inv => ((inv.inventor_name_first || '') + ' ' + (inv.inventor_name_last || '')).trim())
    .filter(Boolean).join('\\n');

  const cpcCodes = (p.cpcs || [])
    .map(c => c.cpc_subgroup_id || '')
    .filter(Boolean).join(', ');

  const abstract = p.patent_abstract ? p.patent_abstract.substring(0, 8000) : '';
  const rawPayload = JSON.stringify(p).substring(0, 95000);
  const eventId = companyRecordId + '--' + patentNumber;

  return {
    json: {
      _hasPatents: true,
      'Event ID': eventId,
      'Event Type': 'patent_filing',
      'Event Date': eventDate,
      Provider: 'patentsview',
      Company: [companyRecordId],
      Title: p.patent_title || '',
      Names: inventorNames,
      'Categories / Tags': cpcCodes,
      Detail: abstract,
      'Source URL': 'https://patents.google.com/patent/' + patentNumber,
      'External ID': patentNumber,
      'Raw Reference': 'patentsview:' + patentNumber,
      'Signal State (raw)': 'granted',
      Vitality: 'active',
      Confidence: 'high',
      'Detected At': runDate,
      'Is Latest': true,
      'Raw Payload': rawPayload,
      _companyRecordId: companyRecordId,
      _companyName: companyName,
    },
  };
});`,
    },
    position: [1800, 320],
  },
  output: [
    {
      _hasPatents: true,
      'Event ID': 'recABC--US12345678B2',
      'Event Type': 'patent_filing',
      Provider: 'patentsview',
    },
  ],
});

const checkHasPatents = ifElse({
  version: 2.3,
  config: {
    name: 'Has Patents?',
    parameters: {
      conditions: {
        options: { caseSensitive: false },
        conditions: [
          {
            id: 'has-patents-check',
            leftValue: expr('{{ $json._hasPatents }}'),
            operator: { type: 'boolean', operation: 'equals' },
            rightValue: true,
          },
        ],
        combinator: 'and',
      },
    },
    position: [2060, 320],
  },
});

// Upserts one event row per patent. Matches on Event ID (compound: companyRecordId--patentNumber).
// typecast=true lets Airtable auto-create new singleSelect options (patent_filing, patentsview, etc.)
const upsertPatentEvent = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  credentials: { airtableTokenApi: airtableCred },
  config: {
    name: 'Upsert Patent Event',
    parameters: {
      resource: 'record',
      operation: 'upsert',
      base: {
        __rl: true,
        mode: 'id',
        value: 'appYBYH3aOHhTODAw',
        cachedResultName: 'RevOps Surface',
      },
      table: {
        __rl: true,
        mode: 'id',
        value: 'tblnzX2b2kqNGzW6r',
        cachedResultName: 'Company Events',
      },
      columns: {
        mappingMode: 'autoMapInputData',
        value: null,
        schema: [],
        matchingColumns: ['Event ID'],
      },
      options: {
        typecast: true,
        ignoreFields: '_hasPatents,_companyRecordId,_companyName',
      },
    },
    position: [2320, 200],
  },
  output: [{ id: 'recXXX' }],
});

// Waits 2s once per company (even if N patents were upserted) to respect the 45 req/min rate limit
const waitBetweenCompanies = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Rate Limit Wait',
    parameters: {
      resume: 'timeInterval',
      amount: 2,
      unit: 'seconds',
    },
    executeOnce: true,
    position: [2580, 200],
  },
  output: [{}],
});

// ─── DONE HANDLER ─────────────────────────────────────────────────────────────

const buildEnrichmentRun = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Enrichment Run Record',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `const companiesCount = $('List Companies').all().length;
const upsertedCount = $('Upsert Patent Event').all().length;
const runTimestamp = $('Set Run Timestamp').first().json.runTimestamp;
const runDate = runTimestamp.substring(0, 10);

return [{
  json: {
    Name: 'USPTO + PatentsView Patent Capture — ' + runDate,
    'Run Date': runTimestamp,
    Play: 'patent-capture',
    Status: 'complete',
    'Companies Evaluated': companiesCount,
    'Records In': companiesCount,
    'Records Out': upsertedCount,
    'Workflow ID': $workflow.id,
    'Execution ID': $execution.id,
    'Run Type': 'auto',
    Notes: 'Weekly patent capture from PatentsView API. Upserts by compound key: companyRecordId--patentNumber.',
    'Markdown Report': '## Patent Capture Run\\n- Companies: ' + companiesCount + '\\n- Patent events upserted: ' + upsertedCount + '\\n- Provider: patentsview\\n- Run: ' + runTimestamp,
  },
}];`,
    },
    executeOnce: true,
    position: [2320, 500],
  },
  output: [
    {
      Name: 'USPTO + PatentsView Patent Capture — 2026-05-20',
      'Companies Evaluated': 1,
    },
  ],
});

const createEnrichmentRun = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  credentials: { airtableTokenApi: airtableCred },
  config: {
    name: 'Create Enrichment Run',
    parameters: {
      resource: 'record',
      operation: 'create',
      base: {
        __rl: true,
        mode: 'id',
        value: 'appYBYH3aOHhTODAw',
        cachedResultName: 'RevOps Surface',
      },
      table: {
        __rl: true,
        mode: 'id',
        value: 'tblEVSEqetmu4ScHe',
        cachedResultName: 'Enrichment Runs',
      },
      columns: {
        mappingMode: 'autoMapInputData',
        value: null,
        schema: [],
      },
      options: {
        typecast: true,
      },
    },
    position: [2580, 500],
  },
  output: [{ id: 'recRunXXX' }],
});

// ─── NOTES ────────────────────────────────────────────────────────────────────

const noteSmokeTest = sticky(
  '## Smoke Test\n\nBefore running on full cohort:\n1. In List Companies, add a filter: `{Company Name} = "Voyager Therapeutics"` (or any known patent-active company)\n2. Run manually\n3. Verify ≥1 patent_filing row in Company Events with Title, Names, External ID, Source URL, Raw Payload populated\n4. Remove the single-company filter and get Nick approval before running on all 122 companies',
  [listCompanies, splitByCompany],
  { color: 3 }
);

const noteRateLimit = sticky(
  '## PatentsView Rate Limits\n\n45 requests/min per IP (free, no API key).\n2-second wait per company = ~30 companies/min = safe for 2 queries/company.',
  [queryPatentsView],
  { color: 5 }
);

// ─── WORKFLOW ─────────────────────────────────────────────────────────────────

const nb = nextBatch(splitByCompany);

export default workflow('uspto-patent-capture', 'USPTO + PatentsView Patent Capture')
  .add(manualTrigger)
  .to(setTimestamp)
  .to(listCompanies)
  .to(
    splitByCompany
      .onDone(buildEnrichmentRun.to(createEnrichmentRun))
      .onEachBatch(
        prepareQueries
          .to(queryPatentsView)
          .to(aggregatePatents)
          .to(
            checkHasPatents
              .onTrue(upsertPatentEvent.to(waitBetweenCompanies).to(nb))
              .onFalse(nb)
          )
      )
  )
  .add(scheduleTrigger)
  .to(setTimestamp)
  .add(noteSmokeTest)
  .add(noteRateLimit);
