// Task B: AAV Trade Press Signals - Perplexity
// Reads surfaced companies (~35), calls Perplexity per company to check if AAV program is discontinued,
// writes one Company Events row per company (upsert on External ID = {companyRecordId}:program-status).
//
// STOP GATE: Do NOT activate or run this workflow without Nick's explicit approval (spend gate).
// Scope: surfaced companies only (~35). Never run over the full table.
// Build: 2026-05-19.

import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {
    name: 'Run Trade Press Batch',
    position: [240, 400]
  },
  output: [{}]
});

const readSurfacedCompanies = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Read Surfaced Companies',
    executeOnce: true,
    parameters: {
      operation: 'search',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblnj3YlOI3thjrXp' },
      filterByFormula: "{Verification Status}='surfaced'",
      options: {
        fields: ['Company Name', 'Verification Status']
      }
    },
    credentials: { airtableTokenApi: newCredential('Airtable') },
    position: [480, 400]
  },
  output: [
    { id: 'recABC001', fields: { 'Company Name': 'Example Therapeutics', 'Verification Status': 'surfaced' } },
    { id: 'recABC002', fields: { 'Company Name': 'Example Genetics', 'Verification Status': 'surfaced' } }
  ]
});

const callPerplexity = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Call Perplexity',
    parameters: {
      method: 'POST',
      url: 'https://api.perplexity.ai/chat/completions',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr(`={{ JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a life-sciences research assistant. Answer in exactly this format: VERDICT = ACTIVE|DISCONTINUED|UNCLEAR\\nEVIDENCE: one sentence. SOURCE: url or N/A"
          },
          {
            role: "user",
            content: "Has " + ($json.fields?.['Company Name'] || $json['Company Name'] || '') + " discontinued, terminated, wound down, or exited its AAV gene-therapy program? Use trade press (BioPharma Dive, Fierce Pharma, Endpoints, company press releases). Answer strictly: VERDICT = ACTIVE | DISCONTINUED | UNCLEAR; one sentence of evidence; source URL(s)."
          }
        ],
        return_citations: true,
        search_recency_filter: "year"
      }) }}`),
      options: { timeout: 30000, response: { response: { neverError: true } } }
    },
    credentials: { httpHeaderAuth: newCredential('Perplexity API') },
    position: [720, 400]
  },
  output: [
    {
      choices: [{ message: { content: 'VERDICT = ACTIVE\\nEVIDENCE: Company has active Phase 2 trial. SOURCE: https://example.com' } }],
      citations: ['https://example.com']
    }
  ]
});

const parseAndWrite = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Parse & Prepare Signal',
    parameters: {
      jsCode: `// Parse Perplexity response and prepare Company Events upsert row
const today = new Date().toISOString().split('T')[0];
const output = [];

for (const item of $input.all()) {
  const companyRecordId = item.json._companyRecordId;
  const companyName = item.json._companyName || '';

  const responseBody = item.json;
  const content = (responseBody?.choices?.[0]?.message?.content || '').trim();
  const citations = Array.isArray(responseBody?.citations) ? responseBody.citations : [];

  // Extract VERDICT token
  const verdictMatch = content.match(/VERDICT\\s*=\\s*(ACTIVE|DISCONTINUED|UNCLEAR)/i);
  const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : 'UNCLEAR';

  // Extract evidence sentence (line after VERDICT line, or whole content)
  const lines = content.split('\\n').map(l => l.trim()).filter(Boolean);
  const evidenceLines = lines.filter(l => !l.match(/^VERDICT\\s*=/i));
  const evidence = evidenceLines.slice(0, 2).join(' ').replace(/^EVIDENCE:\\s*/i, '').slice(0, 500);

  // Source URL: prefer first citation, else extract from SOURCE: line
  const sourceMatch = content.match(/SOURCE:\\s*(https?:\\/\\/[^\\s]+)/i);
  const sourceUrl = citations[0] || (sourceMatch ? sourceMatch[1] : '') || '';

  // Map VERDICT to Airtable Vitality
  const vitalityMap = { ACTIVE: 'active', DISCONTINUED: 'ended', UNCLEAR: 'unknown' };
  const vitality = vitalityMap[verdict] || 'unknown';

  // Confidence: high if we have a dated source URL, medium otherwise
  const confidence = sourceUrl ? 'high' : 'medium';

  // External ID: stable upsert key per plan spec
  const externalId = companyRecordId + ':program-status';

  output.push({
    json: {
      externalId,
      companyRecordId,
      companyName,
      verdict,
      vitality,
      evidence,
      sourceUrl,
      confidence,
      detectedAt: today
    }
  });
}
return output;`
    },
    position: [960, 400]
  },
  output: [
    {
      externalId: 'recABC001:program-status',
      companyRecordId: 'recABC001',
      companyName: 'Example Therapeutics',
      verdict: 'ACTIVE',
      vitality: 'active',
      evidence: 'Company has active Phase 2 trial.',
      sourceUrl: 'https://example.com',
      confidence: 'high',
      detectedAt: '2026-05-19'
    }
  ]
});

const writeCompanyEvents = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Write Company Events',
    parameters: {
      operation: 'upsert',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblnzX2b2kqNGzW6r' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'External ID': expr('={{ $json.externalId }}'),
          'Event Type': 'program_status',
          'Provider': 'perplexity',
          'Signal State (raw)': expr('={{ $json.verdict }}'),
          'Vitality': expr('={{ $json.vitality }}'),
          'Detail': expr('={{ $json.evidence }}'),
          'Source URL': expr('={{ $json.sourceUrl }}'),
          'Detected At': expr('={{ $json.detectedAt }}'),
          'Company': expr('={{ [$json.companyRecordId] }}'),
          'Is Latest': true,
          'Confidence': expr('={{ $json.confidence }}')
        },
        matchingColumns: ['External ID']
      },
      options: { typecast: true }
    },
    credentials: { airtableTokenApi: newCredential('Airtable') },
    position: [1200, 400]
  },
  output: [{ id: 'recNEW001', fields: { 'External ID': 'recABC001:program-status' } }]
});

const prepareRunLog = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Run Log',
    parameters: {
      jsCode: `if ($itemIndex > 0) return [];
const items = $('Write Company Events').all();
const total = items.length;
let active = 0, discontinued = 0, unclear = 0;
for (const it of $('Parse & Prepare Signal').all()) {
  const v = it.json.verdict;
  if (v === 'DISCONTINUED') discontinued++;
  else if (v === 'ACTIVE') active++;
  else unclear++;
}
const today = new Date().toISOString().split('T')[0];
const report = [
  '# AAV Trade Press Signals - Perplexity Run',
  '',
  '**Date:** ' + today,
  '**Source:** Perplexity sonar (web search)',
  '**Scope:** surfaced companies only',
  '**Total rows written:** ' + total,
  '',
  '## Verdicts',
  '- ACTIVE: ' + active,
  '- DISCONTINUED: ' + discontinued,
  '- UNCLEAR: ' + unclear,
].join('\\n');
return [{ json: {
  runName: 'Trade Press Signals Perplexity - ' + today,
  runDate: new Date().toISOString(),
  play: 'aav-gene-therapy-ellie-outreach',
  gateVersion: 'trade-press-v1',
  runType: 'L1_capture',
  runMode: 'incremental',
  companiesEvaluated: total,
  passedAAV: discontinued,
  rerouted: 0,
  archived: 0,
  markdownReport: report,
  workflowId: 'TASK_B_PERPLEXITY',
  executionId: $execution.id,
  recordsIn: total,
  recordsOut: total,
  notes: 'Trade press program_status signals via Perplexity. ' + discontinued + ' discontinued, ' + active + ' active, ' + unclear + ' unclear.'
}}];`
    },
    position: [1440, 400]
  },
  output: [{ runName: 'Trade Press Signals Perplexity - 2026-05-19' }]
});

const writeRunLog = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Write Run Log',
    parameters: {
      operation: 'create',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblEVSEqetmu4ScHe' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Name': expr('={{ $json.runName }}'),
          'Status': 'Done',
          'Run Date': expr('={{ $json.runDate }}'),
          'Play': expr('={{ $json.play }}'),
          'Gate Version': expr('={{ $json.gateVersion }}'),
          'Run Type': expr('={{ $json.runType }}'),
          'Run Mode': expr('={{ $json.runMode }}'),
          'Companies Evaluated': expr('={{ $json.companiesEvaluated }}'),
          'Passed (AAV)': expr('={{ $json.passedAAV }}'),
          'Re-routed': expr('={{ $json.rerouted }}'),
          'Archived': expr('={{ $json.archived }}'),
          'Markdown Report': expr('={{ $json.markdownReport }}'),
          'Notes': expr('={{ $json.notes }}'),
          'Workflow ID': expr('={{ $json.workflowId }}'),
          'Execution ID': expr('={{ $json.executionId }}'),
          'Records In': expr('={{ $json.recordsIn }}'),
          'Records Out': expr('={{ $json.recordsOut }}')
        }
      },
      options: { typecast: true }
    },
    credentials: { airtableTokenApi: newCredential('Airtable') },
    position: [1680, 400]
  },
  output: [{}]
});

// Stitch company record ID onto each item before Perplexity call
const attachRecordId = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Attach Record ID',
    parameters: {
      jsCode: `return $input.all().map(item => ({
  json: {
    ...item.json,
    _companyRecordId: item.json.id,
    _companyName: item.json.fields?.['Company Name'] || item.json['Company Name'] || ''
  }
}));`
    },
    position: [600, 400]
  },
  output: [{ id: 'recABC001', _companyRecordId: 'recABC001', _companyName: 'Example Therapeutics' }]
});

export default workflow('task-b-perplexity', 'AAV Trade Press Signals - Perplexity')
  .add(startTrigger)
  .to(readSurfacedCompanies)
  .to(attachRecordId)
  .to(callPerplexity)
  .to(parseAndWrite)
  .to(writeCompanyEvents)
  .to(prepareRunLog)
  .to(writeRunLog);
