// FULL REPLACEMENT — Prepare Run Log (workflow Z6RROKx5omdfvhtn)
// Change: emits `providers: ['explorium']` for the run-log row.

const fetchedItems = $('Get Unenriched Companies').all();
const recordsIn = fetchedItems.length;
const today = new Date().toISOString().split('T')[0];

return [{ json: {
  runName: 'Companies Enrichment - ' + today,
  runDate: new Date().toISOString(),
  play: 'aav-gene-therapy-ellie-outreach',
  gateVersion: 'enrichment-explorium-v1',
  runType: 'enrichment',
  runMode: 'incremental',
  rulesVersion: 'explorium-firmographics-v1',
  companiesEvaluated: recordsIn,
  passedAAV: 0,
  rerouted: 0,
  archived: 0,
  markdownReport: '# Companies Enrichment Run\n\n**Date:** ' + today + '\n**Records In:** ' + recordsIn + '\n**Execution ID:** ' + $execution.id + '\n\nSee n8n execution for per-record outcomes (enriched / rerouted / archived breakdown).',
  notes: 'Explorium match+enrich. Records in: ' + recordsIn + '. Per-record outcomes in n8n execution ' + $execution.id + '.',
  workflowId: 'Z6RROKx5omdfvhtn',
  executionId: $execution.id,
  recordsIn: recordsIn,
  recordsOut: recordsIn,
  providers: ['explorium'],
} }];
