// =====================================================================
// STEP 9 — VERIFY workflow (NEW). create_workflow_from_code.
// 2026-05-18. Modality-only trial-evidence verification of every
// surfaced Companies row, per ORACLE-CORRECTION-2026-05-18b.md.
//
// Single linear path (no switch / no fan-in) so Collect converges ONCE
// and exactly ONE Enrichment Runs receipt is written per execution —
// deliberately NOT the known L2 duplicate-run-log bug.
//
// Writes Companies fields: Verification Verdict (Confirmed / Not
// confirmed / Needs review — existing single-select options, no
// typecast needed), Verification Evidence (multilineText, cites a
// PASSING NCT), Verification Checked At (date YYYY-MM-DD). All writes
// HTTP-PATCH (builder-immune), batched, throttled. CT.gov v2 reads only
// (free, no auth, no spend). Idempotent: re-run overwrites verdicts
// cleanly, no duplicate Companies rows, one receipt per run.
//
// Oracle is NEVER read from live Airtable — the immutable file
// ORACLE-verification-35-2026-05-18.json + the correction doc are the
// regression target; the diff harness (verify-diff-2026-05-18.mjs)
// compares Verify output to that file out-of-band.
//
// new workflow -> n8n-safe-update does NOT apply for creation, but the
// `may 26 all bases` credential must still be attached to the 3 Airtable
// nodes + the HTTP-PATCH node in the UI before any real run, then
// publish. MCP may false-500 on create — verify by read-back.
// =====================================================================
import { readFileSync } from 'fs';
import { join } from 'path';
import { workflow, node, trigger, splitInBatches, nextBatch, newCredential, expr } from '@n8n/workflow-sdk';

// R5 module: verbatim from the shared source of truth.
const R5_MODULE = readFileSync(join(__dirname, 'r5-trial-test-2026-05-18.ts'), 'utf8')
  .replace(/^[\s\S]*?export const R5_MODULE_JS = String\.raw`/, '')
  .replace(/`;\s*$/, '');

const verifyCode = `
${R5_MODULE}

const companies = $('Read Surfaced').all();
const rules = $('Read Classification Rules').all();
const today = new Date().toISOString().split('T')[0];
const f = (rec, key) => (rec.json && rec.json.fields && rec.json.fields[key] !== undefined) ? rec.json.fields[key] : (rec.json ? rec.json[key] : undefined);
const recId = (rec) => (rec.json && rec.json.id) ? rec.json.id : (rec.json && rec.json.fields && rec.json.fields.id);
function parseVal(v){ if(v==null) return null; if(typeof v!=='string') return v; const s=v.trim(); if(s.startsWith('{')||s.startsWith('[')){ try{return JSON.parse(s);}catch(e){return v;} } return v; }
let canonical = []; let diseaseVariants = [];
for (const r of rules) {
  const name = f(r,'Rule Name'); const val = parseVal(f(r,'Rule Value'));
  if (name === 'canonical_aav_indications' && typeof val === 'string') canonical = val.split('|').map(x=>r5_norm(x)).filter(Boolean);
  else if (name === 'disease_aav_exclusion' && val && val.variants) diseaseVariants = val.variants.map(v=>({raw:v, n:r5_norm(v)})).filter(v=>v.n);
}
const httpReq = async (url) => await this.helpers.httpRequest({ method:'GET', url, json:true, timeout:15000 });
const out = [];
for (const c of companies) {
  const id = recId(c);
  const name = f(c,'Company Name') || '';
  const nctRaw = f(c,'CT.gov NCT IDs') || '';
  const v = await r5VerifyCompany(nctRaw, canonical, diseaseVariants, httpReq, { throttleMs: 150 });
  out.push({ json: { id, _company: name, _verdict: v.verdict, _evidence: v.evidence, _passingNct: v.passingNct || '', _checkedAt: today } });
}
return out;
`;

const chunkCode = `
const all = $input.all().map(i => i.json);
const out = [];
for (let i = 0; i < all.length; i += 10) { out.push({ json: { batch: all.slice(i, i + 10) } }); }
return out;
`;

const prepareReceiptCode = `
// Reads Verify R5 ONCE (single linear path -> Collect fires once -> one receipt).
const items = $('Verify R5').all();
const total = items.length;
let confirmed=0, notConfirmed=0, needsReview=0;
const lines=[];
for (const it of items) { const j = it.json;
  if (j._verdict === 'Confirmed') confirmed++;
  else if (j._verdict === 'Not confirmed') notConfirmed++;
  else needsReview++;
  lines.push('- ' + j._company + ' -> ' + j._verdict + (j._passingNct ? (' (' + j._passingNct + ')') : '')); }
const today = new Date().toISOString().split('T')[0];
const report = ['# Step 9 Verify - trial-evidence (R5)','','**Date:** '+today,'**Surfaced verified:** '+total,'','## Verdicts','- Confirmed: '+confirmed,'- Not confirmed: '+notConfirmed,'- Needs review: '+needsReview,'','## Per company',...lines].join(String.fromCharCode(10));
return [{ json: { runName: 'Step 9 Verify (R5) - ' + today, runDate: new Date().toISOString(), play: 'aav-gene-therapy-ellie-outreach', gateVersion: 'verify-r5', runType: 'verify', runMode: 'full', rulesVersion: 'v4-r5-pending-ratification', companiesEvaluated: total, passedAAV: confirmed, rerouted: 0, archived: notConfirmed, markdownReport: report, workflowId: $workflow.id, executionId: $execution.id, recordsIn: total, recordsOut: total, notes: 'Step 9 Verify: ' + confirmed + ' Confirmed, ' + notConfirmed + ' Not confirmed, ' + needsReview + ' Needs review. Modality-only; size/ICP exclusion is a separate downstream gate.' }}];
`;

const runTrigger = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Run Verify', position: [0, 320] }, output: [{}] });

const readSurfaced = node({ type: 'n8n-nodes-base.airtable', version: 2.2, config: { name: 'Read Surfaced', position: [224, 320], executeOnce: true, parameters: { operation: 'search', base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' }, table: { __rl: true, mode: 'id', value: 'tblnj3YlOI3thjrXp' }, filterByFormula: "{Verification Status}='surfaced'", options: { fields: ['Company Name', 'CT.gov NCT IDs'] } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recCand' }] });

const readRules = node({ type: 'n8n-nodes-base.airtable', version: 2.2, config: { name: 'Read Classification Rules', position: [448, 320], executeOnce: true, parameters: { operation: 'search', base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' }, table: { __rl: true, mode: 'id', value: 'tbl1HFYzezFYs5C3k' }, filterByFormula: '{Active}=TRUE()', options: { fields: ['Rule Name', 'Rule Category', 'Rule Value'] } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recRule' }] });

const verifyR5 = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Verify R5', position: [672, 320], parameters: { jsCode: verifyCode } }, output: [{ id: 'rec1', _verdict: 'Confirmed' }] });

const chunkVerify = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Chunk Verify', position: [896, 320], parameters: { jsCode: chunkCode } }, output: [{ batch: [{ id: 'recXXX' }] }] });

const updateVerify = node({ type: 'n8n-nodes-base.httpRequest', version: 4.2, config: { name: 'Update Verify', position: [1120, 320], retryOnFail: true, maxTries: 5, waitBetweenTries: 2000, parameters: { method: 'PATCH', url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp', authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi', sendBody: true, specifyBody: 'json', jsonBody: expr('={{ JSON.stringify({ records: $json.batch.map(r => ({ id: r.id, fields: { "Verification Verdict": r._verdict, "Verification Evidence": r._evidence, "Verification Checked At": r._checkedAt } })), typecast: true }) }}'), options: { batching: { batch: { batchSize: 1, batchInterval: 300 } } } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recXXX' }] });

const collect = node({ type: 'n8n-nodes-base.noOp', version: 1, config: { name: 'Collect', position: [1344, 320], parameters: {} }, output: [{}] });

const prepareReceipt = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Prepare Receipt', position: [1568, 320], parameters: { jsCode: prepareReceiptCode } }, output: [{ runName: 'Step 9 Verify (R5)', runType: 'verify', companiesEvaluated: 35, passedAAV: 0, archived: 0, recordsIn: 35, recordsOut: 35 }] });

const writeReceipt = node({ type: 'n8n-nodes-base.airtable', version: 2.2, config: { name: 'Write Receipt', position: [1792, 320], parameters: { operation: 'create', base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' }, table: { __rl: true, mode: 'id', value: 'tblEVSEqetmu4ScHe' }, columns: { mappingMode: 'defineBelow', value: { Name: expr('={{ $json.runName }}'), Status: 'Done', 'Run Date': expr('={{ $json.runDate }}'), Play: expr('={{ $json.play }}'), 'Gate Version': expr('={{ $json.gateVersion }}'), 'Run Type': expr('={{ $json.runType }}'), 'Run Mode': expr('={{ $json.runMode }}'), 'Rules Version': expr('={{ $json.rulesVersion }}'), 'Companies Evaluated': expr('={{ $json.companiesEvaluated }}'), 'Passed (AAV)': expr('={{ $json.passedAAV }}'), 'Re-routed': expr('={{ $json.rerouted }}'), Archived: expr('={{ $json.archived }}'), 'Markdown Report': expr('={{ $json.markdownReport }}'), Notes: expr('={{ $json.notes }}'), 'Workflow ID': expr('={{ $json.workflowId }}'), 'Execution ID': expr('={{ $json.executionId }}'), 'Records In': expr('={{ $json.recordsIn }}'), 'Records Out': expr('={{ $json.recordsOut }}') }, matchingColumns: [], attemptToConvertTypes: false, convertFieldsToString: false }, options: { typecast: true } }, credentials: { airtableTokenApi: newCredential('may 26 all bases') } }, output: [{ id: 'recLog' }] });

export default workflow('VERIFY_STEP9', 'Canonical AAV Discovery - Step 9 Verify')
  .add(runTrigger)
  .to(readSurfaced)
  .to(readRules)
  .to(verifyR5)
  .to(chunkVerify)
  .to(updateVerify)
  .to(collect)
  .to(prepareReceipt)
  .to(writeReceipt);
