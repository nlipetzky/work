// =====================================================================
// L2 CLASSIFY v4 (R5) — SDK build source. Workflow rXKuqfDwqX7TYzxK.
// 2026-05-18. Supersedes .build/L2-rebuild-2026-05-15.ts.
//
// ONLY change vs the 05-15 build: the "Apply Rules" node body is now the
// R5-gated evaluator, loaded verbatim from the single source of truth
// L2-applyRules-R5-2026-05-18.js (no divergence). Version stamps bumped
// v3 -> v4 R5. 26-node topology, all PATCH bodies, Gate 1b breaker,
// batched throttle, executeOnce flags — IDENTICAL to 05-15. No new nodes.
//
// Apply Rules is async (awaits CT.gov reads on the would-surface path
// only). n8n Code node v2 supports await. CT.gov v2 is free/no-auth — no
// spend. update_workflow wipes credentials -> reattach `may 26 all bases`
// to all 8 HTTP + Airtable read/log nodes and republish; expect false 500
// (verify by read-back). See n8n-safe-update.
// =====================================================================
import { readFileSync } from 'fs';
import { join } from 'path';
import { workflow, node, trigger, switchCase, splitInBatches, nextBatch, newCredential, expr } from '@n8n/workflow-sdk';

const applyRulesCode = readFileSync(join(__dirname, 'L2-applyRules-R5-2026-05-18.js'), 'utf8');

const chunkCode = `
const all = $input.all().map(i => i.json);
const out = [];
for (let i = 0; i < all.length; i += 10) {
  out.push({ json: { batch: all.slice(i, i + 10) } });
}
return out;
`;

const gate1bBreakerCode = `
const emitted = $('List All Companies').all().length;
const pages = $('Count Live Companies').all();
let live = 0;
let sawRecordsArray = false;
for (const p of pages) {
  const body = (p && p.json) ? p.json : {};
  if (Array.isArray(body.records)) { live += body.records.length; sawRecordsArray = true; }
}
if (!sawRecordsArray) {
  throw new Error('GATE 1b ABORT: Count Live Companies returned no parseable Airtable pages (auth/parse failure). Hard stop before any PATCH.');
}
if (!Number.isInteger(live) || live <= 0) {
  throw new Error('GATE 1b ABORT: independent live Companies count invalid (' + live + '). Hard stop before any PATCH.');
}
if (!Number.isInteger(emitted) || emitted <= 0) {
  throw new Error('GATE 1b ABORT: List All Companies emitted invalid count (' + emitted + '). Hard stop before any PATCH.');
}
if (emitted !== live) {
  throw new Error('GATE 1b ABORT: List All Companies emitted ' + emitted + ' but independent Airtable REST count is ' + live + '. Mismatch -> hard stop before any PATCH.');
}
return $('List All Companies').all();
`;

const prepareRunLogCode = `
if ($itemIndex > 0) return [];
const items = $('Apply Rules').all();
const total = items.length;
let surfaced=0, borderline=0, rejected=0, reviewed=0, rerouted=0;
const surfacedList=[], rejectedList=[]; let nkarta=null;
for (const it of items) { const j = it.json;
  if (j._verification === 'surfaced') { surfaced++; surfacedList.push(j._companyName); }
  else if (j._verification === 'rejected') { rejected++; rejectedList.push(j._companyName + ' (' + (j._reason||j._route) + ')'); if(j._route==='modality_reroute') rerouted++; }
  else { borderline++; if (j._route==='needs_review') reviewed++; }
  if ((j._companyName||'').toLowerCase().indexOf('nkarta') !== -1) nkarta = j; }
const today = new Date().toISOString().split('T')[0];
const nk = nkarta ? ('Nkarta -> ' + nkarta._verification + (nkarta._reason ? (' | reason: ' + nkarta._reason) : '')) : 'Nkarta not in candidate set';
const report = ['# L2 Classify v4 R5 - FULL COHORT','','**Date:** '+today,'**Rules:** v4 R5 pending-ratification','**Evaluated:** '+total,'','## Outcomes','- Surfaced: '+surfaced,'- Borderline: '+borderline+' (needs_aav_review: '+reviewed+')','- Rejected: '+rejected+' (modality reroute: '+rerouted+')','','## Acceptance','- '+nk,'','## Rejected (first 200)',...rejectedList.slice(0,200).map(x=>'- '+x),'','## Surfaced (first 200)',...surfacedList.slice(0,200).map(x=>'- '+x)].join(String.fromCharCode(10));
return [{ json: { runName: 'L2 Classify v4 R5 FULL - ' + today, runDate: new Date().toISOString(), play: 'aav-gene-therapy-ellie-outreach', gateVersion: 'l2-classify-v4-r5', runType: 'L2_classify', runMode: 'incremental', rulesVersion: 'v4-r5-pending-ratification', companiesEvaluated: total, passedAAV: surfaced, rerouted: rerouted, archived: rejected, markdownReport: report, workflowId: 'rXKuqfDwqX7TYzxK', executionId: $execution.id, recordsIn: total, recordsOut: surfaced + borderline, notes: 'L2 v4 R5 full cohort. R5 3-clause CT.gov trial gate on would-surface path. ' + surfaced + ' surfaced, ' + borderline + ' borderline, ' + rejected + ' rejected.' }}];
`;

const runTrigger = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Run L2 Classify', position: [0, 624] }, output: [{}] });

const listAllCompanies = node({ type: 'n8n-nodes-base.airtable', version: 2.2, config: { name: 'List All Companies', position: [224, 624], parameters: { operation: 'search', base: { __rl: true, value: 'appYBYH3aOHhTODAw', mode: 'id' }, table: { __rl: true, value: 'tblnj3YlOI3thjrXp', mode: 'list', cachedResultName: 'Companies', cachedResultUrl: 'https://airtable.com/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp' }, options: { fields: ['Company Name'] } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recXXX' }] });

const countLiveCompanies = node({ type: 'n8n-nodes-base.httpRequest', version: 4.2, config: { name: 'Count Live Companies', position: [448, 624], executeOnce: true, parameters: { method: 'GET', url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp', authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi', sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'pageSize', value: '100' }] }, options: { pagination: { pagination: { paginationMode: 'updateAParameterInEachRequest', parameters: { parameters: [{ type: 'qs', name: 'offset', value: expr('={{ $response.body.offset }}') }] }, paginationCompleteWhen: 'other', completeExpression: expr('={{ $response.body.offset === undefined }}'), limitPagesFetched: false } } } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ records: [{ id: 'recXXX' }] }] });

const gate1bBreaker = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Gate 1b Breaker', position: [672, 624], parameters: { jsCode: gate1bBreakerCode } }, output: [{ id: 'recXXX' }] });

const requeueBatches = splitInBatches({ version: 3, config: { name: 'Re-queue Batches', position: [896, 624], parameters: { batchSize: 50, options: {} } } });

const chunkReset = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Chunk Reset', position: [1008, 720], parameters: { jsCode: chunkCode } }, output: [{ batch: [{ id: 'recXXX' }] }] });

const resetClearStale = node({ type: 'n8n-nodes-base.httpRequest', version: 4.2, config: { name: 'Reset + Clear Stale', position: [1232, 720], retryOnFail: true, maxTries: 5, waitBetweenTries: 2000, parameters: { method: 'PATCH', url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp', authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi', sendBody: true, specifyBody: 'json', jsonBody: expr('={{ JSON.stringify({ records: $json.batch.map(r => ({ id: r.id, fields: { "Verification Status": "needs_verification", "Custom Classification": "", "Vector Evidence Clause": "" } })), typecast: true }) }}'), options: { batching: { batch: { batchSize: 1, batchInterval: 300 } } } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recXXX' }] });

const readRules = node({ type: 'n8n-nodes-base.airtable', version: 2.2, config: { name: 'Read Classification Rules', position: [1120, 480], executeOnce: true, parameters: { operation: 'search', base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' }, table: { __rl: true, mode: 'id', value: 'tbl1HFYzezFYs5C3k' }, filterByFormula: '{Active}=TRUE()', options: { fields: ['Rule Name', 'Rule Category', 'Rule Value', 'Rule Weight', 'Notes'] } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recRule' }] });

const readCandidates = node({ type: 'n8n-nodes-base.airtable', version: 2.2, config: { name: 'Read Candidates', position: [1344, 480], executeOnce: true, parameters: { operation: 'search', base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' }, table: { __rl: true, mode: 'id', value: 'tblnj3YlOI3thjrXp' }, filterByFormula: "{Verification Status}='needs_verification'", options: { fields: ['Company Name', 'CT.gov Indications', 'CT.gov NCT IDs', 'Most Advanced Phase', 'Trial Count', 'Discovery Sources', 'Lead Indication', 'Most Recent Trial Date', 'Active Recruiting'] } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recCand' }] });

const applyRules = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Apply Rules', position: [1568, 480], parameters: { jsCode: applyRulesCode } }, output: [{ id: 'rec1', _routeIndex: 0, _route: 'surfaced' }] });

const routeByOutcome = switchCase({ version: 3.2, config: { name: 'Route by Outcome', position: [1792, 416], parameters: { mode: 'expression', numberOutputs: 6, output: expr('={{ $json._routeIndex }}') } } });

const chunkSurfaced = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Chunk Surfaced', position: [2016, -96], parameters: { jsCode: chunkCode } }, output: [{ batch: [{ id: 'recXXX' }] }] });
const updateSurfaced = node({ type: 'n8n-nodes-base.httpRequest', version: 4.2, config: { name: 'Update Surfaced', position: [2240, -96], retryOnFail: true, maxTries: 5, waitBetweenTries: 2000, parameters: { method: 'PATCH', url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp', authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi', sendBody: true, specifyBody: 'json', jsonBody: expr('={{ JSON.stringify({ records: $json.batch.map(r => ({ id: r.id, fields: { "Verification Status": "surfaced", "Vector Evidence Clause": r._clause, "Custom Classification": "aav", "Custom Classification Source": r._customSrc, "Custom Classification Confidence": r._customConf, "Custom Classification Detected Keywords": r._kw, "Classification Version": r._classVersion, "Classification Run ID": r._runId, "Classification Run Date": r._runDate, "Classification Notes": r._notes, "Currency Status": r._currencyStatus || null, "Currency Evidence": r._currencyEvidence || null, "Currency Checked At": r._currencyCheckedAt || null } })), typecast: true }) }}'), options: { batching: { batch: { batchSize: 1, batchInterval: 300 } } } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recXXX' }] });

const chunkDiseaseReject = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Chunk Disease Reject', position: [2016, 96], parameters: { jsCode: chunkCode } }, output: [{ batch: [{ id: 'recXXX' }] }] });
const updateDiseaseReject = node({ type: 'n8n-nodes-base.httpRequest', version: 4.2, config: { name: 'Update Disease Reject', position: [2240, 96], retryOnFail: true, maxTries: 5, waitBetweenTries: 2000, parameters: { method: 'PATCH', url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp', authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi', sendBody: true, specifyBody: 'json', jsonBody: expr('={{ JSON.stringify({ records: $json.batch.map(r => ({ id: r.id, fields: { "Verification Status": "rejected", "Rejection Reason": r._reason, "Custom Classification Source": r._customSrc, "Classification Version": r._classVersion, "Classification Run ID": r._runId, "Classification Run Date": r._runDate, "Classification Notes": r._notes } })), typecast: true }) }}'), options: { batching: { batch: { batchSize: 1, batchInterval: 300 } } } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recXXX' }] });

const chunkModalityReroute = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Chunk Modality Reroute', position: [2016, 288], parameters: { jsCode: chunkCode } }, output: [{ batch: [{ id: 'recXXX' }] }] });
const updateModalityReroute = node({ type: 'n8n-nodes-base.httpRequest', version: 4.2, config: { name: 'Update Modality Reroute', position: [2240, 288], retryOnFail: true, maxTries: 5, waitBetweenTries: 2000, parameters: { method: 'PATCH', url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp', authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi', sendBody: true, specifyBody: 'json', jsonBody: expr('={{ JSON.stringify({ records: $json.batch.map(r => ({ id: r.id, fields: { "Verification Status": "rejected", "Enrichment Status": "rerouted_wrong_modality", "Rejection Reason": r._reason, "Custom Classification": r._custom, "Custom Classification Source": r._customSrc, "Classification Version": r._classVersion, "Classification Run ID": r._runId, "Classification Run Date": r._runDate, "Classification Notes": r._notes } })), typecast: true }) }}'), options: { batching: { batch: { batchSize: 1, batchInterval: 300 } } } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recXXX' }] });

const chunkDormant = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Chunk Dormant', position: [2016, 480], parameters: { jsCode: chunkCode } }, output: [{ batch: [{ id: 'recXXX' }] }] });
const updateDormant = node({ type: 'n8n-nodes-base.httpRequest', version: 4.2, config: { name: 'Update Dormant', position: [2240, 480], retryOnFail: true, maxTries: 5, waitBetweenTries: 2000, parameters: { method: 'PATCH', url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp', authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi', sendBody: true, specifyBody: 'json', jsonBody: expr('={{ JSON.stringify({ records: $json.batch.map(r => ({ id: r.id, fields: { "Verification Status": "borderline", "Rejection Reason": r._reason, "Custom Classification Source": "L2:dormancy_rule", "Classification Version": r._classVersion, "Classification Run ID": r._runId, "Classification Run Date": r._runDate, "Classification Notes": r._notes } })), typecast: true }) }}'), options: { batching: { batch: { batchSize: 1, batchInterval: 300 } } } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recXXX' }] });

const chunkNeedsReview = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Chunk Needs Review', position: [2016, 672], parameters: { jsCode: chunkCode } }, output: [{ batch: [{ id: 'recXXX' }] }] });
const updateNeedsReview = node({ type: 'n8n-nodes-base.httpRequest', version: 4.2, config: { name: 'Update Needs Review', position: [2240, 672], retryOnFail: true, maxTries: 5, waitBetweenTries: 2000, parameters: { method: 'PATCH', url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp', authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi', sendBody: true, specifyBody: 'json', jsonBody: expr('={{ JSON.stringify({ records: $json.batch.map(r => ({ id: r.id, fields: { "Verification Status": "borderline", "Enrichment Status": "needs_aav_review", "Rejection Reason": r._reason, "Custom Classification Source": r._customSrc, "Classification Version": r._classVersion, "Classification Run ID": r._runId, "Classification Run Date": r._runDate, "Classification Notes": r._notes, "Currency Status": r._currencyStatus || null, "Currency Evidence": r._currencyEvidence || null, "Currency Checked At": r._currencyCheckedAt || null } })), typecast: true }) }}'), options: { batching: { batch: { batchSize: 1, batchInterval: 300 } } } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recXXX' }] });

const chunkBorderline = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Chunk Borderline', position: [2016, 864], parameters: { jsCode: chunkCode } }, output: [{ batch: [{ id: 'recXXX' }] }] });
const updateBorderline = node({ type: 'n8n-nodes-base.httpRequest', version: 4.2, config: { name: 'Update Borderline', position: [2240, 864], retryOnFail: true, maxTries: 5, waitBetweenTries: 2000, parameters: { method: 'PATCH', url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp', authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi', sendBody: true, specifyBody: 'json', jsonBody: expr('={{ JSON.stringify({ records: $json.batch.map(r => ({ id: r.id, fields: { "Verification Status": "borderline", "Classification Version": r._classVersion, "Classification Run ID": r._runId, "Classification Run Date": r._runDate, "Classification Notes": r._notes } })), typecast: true }) }}'), options: { batching: { batch: { batchSize: 1, batchInterval: 300 } } } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recXXX' }] });

const collect = node({ type: 'n8n-nodes-base.noOp', version: 1, config: { name: 'Collect', position: [2464, 384], parameters: {} }, output: [{}] });

const prepareRunLog = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Prepare Run Log', position: [2688, 384], parameters: { jsCode: prepareRunLogCode } }, output: [{ runName: 'L2 Classify v4 R5 FULL', runDate: '2026-05-18T00:00:00.000Z', play: 'aav-gene-therapy-ellie-outreach', gateVersion: 'l2-classify-v4-r5', runType: 'L2_classify', runMode: 'incremental', rulesVersion: 'v4-r5-pending-ratification', companiesEvaluated: 631, passedAAV: 0, rerouted: 0, archived: 0, markdownReport: '#', notes: 'n', workflowId: 'rXKuqfDwqX7TYzxK', executionId: '0', recordsIn: 631, recordsOut: 0 }] });

const writeRunLog = node({ type: 'n8n-nodes-base.airtable', version: 2.2, config: { name: 'Write Run Log', position: [2912, 384], parameters: { operation: 'create', base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' }, table: { __rl: true, mode: 'id', value: 'tblEVSEqetmu4ScHe' }, columns: { mappingMode: 'defineBelow', value: { Name: expr('={{ $json.runName }}'), Status: 'Done', 'Run Date': expr('={{ $json.runDate }}'), Play: expr('={{ $json.play }}'), 'Gate Version': expr('={{ $json.gateVersion }}'), 'Run Type': expr('={{ $json.runType }}'), 'Run Mode': expr('={{ $json.runMode }}'), 'Rules Version': expr('={{ $json.rulesVersion }}'), 'Companies Evaluated': expr('={{ $json.companiesEvaluated }}'), 'Passed (AAV)': expr('={{ $json.passedAAV }}'), 'Re-routed': expr('={{ $json.rerouted }}'), Archived: expr('={{ $json.archived }}'), 'Markdown Report': expr('={{ $json.markdownReport }}'), Notes: expr('={{ $json.notes }}'), 'Workflow ID': expr('={{ $json.workflowId }}'), 'Execution ID': expr('={{ $json.executionId }}'), 'Records In': expr('={{ $json.recordsIn }}'), 'Records Out': expr('={{ $json.recordsOut }}') }, matchingColumns: [], attemptToConvertTypes: false, convertFieldsToString: false }, options: { typecast: true } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recLog' }] });

export default workflow('rXKuqfDwqX7TYzxK', 'Canonical AAV Discovery - L2 Classify')
  .add(runTrigger)
  .to(listAllCompanies)
  .to(countLiveCompanies)
  .to(gate1bBreaker)
  .to(requeueBatches
    .onDone(readRules.to(readCandidates.to(applyRules.to(routeByOutcome
      .onCase(0, chunkSurfaced.to(updateSurfaced.to(collect)))
      .onCase(1, chunkDiseaseReject.to(updateDiseaseReject.to(collect)))
      .onCase(2, chunkModalityReroute.to(updateModalityReroute.to(collect)))
      .onCase(3, chunkDormant.to(updateDormant.to(collect)))
      .onCase(4, chunkNeedsReview.to(updateNeedsReview.to(collect)))
      .onCase(5, chunkBorderline.to(updateBorderline.to(collect)))))))
    .onEachBatch(chunkReset.to(resetClearStale.to(nextBatch(requeueBatches)))))
  .add(collect)
  .to(prepareRunLog)
  .to(writeRunLog);
