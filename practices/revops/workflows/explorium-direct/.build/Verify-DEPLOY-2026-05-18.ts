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
import { workflow, node, trigger, splitInBatches, nextBatch, newCredential, expr } from '@n8n/workflow-sdk';

const R5_MODULE = "\nfunction r5_norm(s){ return String(s||'').toLowerCase().replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,\"'\").replace(/&quot;/g,'\"').replace(/[^a-z0-9]+/g,' ').trim(); }\nfunction r5_parseNcts(v){ if(v==null) return []; const m = String(v).match(/NCT\\d{8}/gi) || []; const seen={}; const out=[]; for(const x of m){ const u=x.toUpperCase(); if(!seen[u]){seen[u]=1; out.push(u);} } return out; }\nvar R5_TOKEN = /(adeno[ -]?associated|\\baav\\d*\\b|aav[1-9](?:\\/[0-9])?\\b|[a-z]+parvovec\\b|\\brecombinant aav|\\bgene therap|\\bgene transfer|\\bvector-mediated)/i;\nvar R5_NONTREAT_NAME = /(standard of care|replacement therapy|\\bplacebo\\b|\\bsham\\b|best supportive care|no intervention|non-treatment|observation only|usual care|natural history|seroprevalence|prevalence|antibody study)/i;\nvar R5_NONTREAT_TYPE = { DEVICE:1, DIAGNOSTIC_TEST:1, OTHER:1, BEHAVIORAL:1, PROCEDURE:1, DIETARY_SUPPLEMENT:1, RADIATION:1 };\nfunction r5_isNonTreatment(i){ if(!i) return true; var t=String(i.type||'').toUpperCase(); var n=String(i.name||''); if(R5_NONTREAT_NAME.test(n)) return true; if(R5_NONTREAT_TYPE[t]) return true; return false; }\n\n/* study = CT.gov v2 study JSON. canonical = array of normalized canonical\n   indication strings. diseaseVariants = array of {raw,n}. Returns a verdict\n   object for ONE trial. */\nfunction r5TestStudy(study, canonical, diseaseVariants){\n  var ps = (study && study.protocolSection) || {};\n  var idm = ps.identificationModule || {};\n  var dm  = ps.designModule || {};\n  var cm  = ps.conditionsModule || {};\n  var aim = ps.armsInterventionsModule || {};\n  var nct = (idm.nctId || (study && study.nctId) || '').toUpperCase();\n  var studyType = String(dm.studyType||'').toUpperCase();\n  var conditions = Array.isArray(cm.conditions) ? cm.conditions : [];\n  var interventions = Array.isArray(aim.interventions) ? aim.interventions : [];\n  var briefTitle = idm.briefTitle || '';\n  var officialTitle = idm.officialTitle || '';\n\n  var c1 = studyType === 'INTERVENTIONAL';\n\n  var condText = r5_norm(conditions.join(' ; '));\n  var matchedCanon = canonical.filter(function(t){ return t && condText.indexOf(t) !== -1; });\n  var hitDisease = diseaseVariants.filter(function(v){ return v.n && condText.indexOf(v.n) !== -1; }).map(function(v){ return v.raw; });\n  var c2 = matchedCanon.length > 0 && hitDisease.length === 0;\n\n  var intvNames = interventions.map(function(i){ return (i && i.name) ? String(i.name) : ''; }).filter(Boolean);\n  var tokenBlob = [briefTitle, officialTitle, intvNames.join(' ')].join(' ');\n  var hasToken = R5_TOKEN.test(tokenBlob);\n  var hasTreatment = interventions.length > 0 && interventions.some(function(i){ return !r5_isNonTreatment(i); });\n  var c3 = hasToken && hasTreatment;\n\n  var pass = c1 && c2 && c3;\n  var reason;\n  if (pass) reason = 'PASS: interventional + canonical condition (' + matchedCanon.slice(0,2).join(', ') + ') + AAV/gene-transfer intervention';\n  else if (!c1) reason = 'FAIL c1: studyType=' + (studyType||'(none)') + ' not INTERVENTIONAL';\n  else if (!c2) reason = hitDisease.length ? ('FAIL c2: disease-AAV exclusion (' + hitDisease.slice(0,2).join(', ') + ')') : 'FAIL c2: no canonical AAV indication in conditions';\n  else reason = !hasToken ? 'FAIL c3: no AAV/gene-therapy token in title or intervention name' : 'FAIL c3: all interventions are standard-of-care / non-treatment / diagnostic / placebo';\n  return { nct:nct, pass:pass, c1:c1, c2:c2, c3:c3, studyType:studyType, matchedCanon:matchedCanon, hitDisease:hitDisease, briefTitle:briefTitle, intervention:(intvNames[0]||''), reason:reason };\n}\n\n/* Fetch + per-company roll-up. httpReq = an async (url)->json fn; in n8n\n   pass a wrapper over this.helpers.httpRequest. Sequential + throttled\n   (CT.gov v2, free, no auth). Network/parse failure on a trial = that\n   trial fails (fail-safe; never auto-confirm on error). */\nasync function r5VerifyCompany(nctIds, canonical, diseaseVariants, httpReq, opts){\n  opts = opts || {};\n  var throttleMs = opts.throttleMs == null ? 150 : opts.throttleMs;\n  var ncts = Array.isArray(nctIds) ? nctIds : r5_parseNcts(nctIds);\n  if (ncts.length === 0) return { verdict:'Needs review', evidence:'No CT.gov NCT ID stored — cannot ground-truth modality from trial evidence (R5).', trials:[], passingNct:null };\n  var trials = [];\n  for (var k=0; k<ncts.length; k++){\n    var id = ncts[k];\n    var study = null, err = null;\n    try {\n      study = await httpReq('https://clinicaltrials.gov/api/v2/studies/' + id + '?fields=protocolSection.identificationModule,protocolSection.designModule,protocolSection.armsInterventionsModule,protocolSection.conditionsModule');\n    } catch(e){ err = (e && e.message) ? e.message : String(e); }\n    if (err || !study) { trials.push({ nct:id, pass:false, reason:'FETCH ERROR: ' + (err||'no body'), fetchError:true }); }\n    else { var r = r5TestStudy(study, canonical, diseaseVariants); r.nct = r.nct || id; trials.push(r); }\n    if (throttleMs && k < ncts.length-1) { await new Promise(function(res){ setTimeout(res, throttleMs); }); }\n  }\n  var passing = trials.filter(function(t){ return t.pass; });\n  if (passing.length > 0) {\n    var p = passing[0];\n    var ev = 'Confirmed AAV gene therapy via ' + p.nct + ': \"' + String(p.briefTitle||'').slice(0,160) + '\"' + (p.intervention ? (' | intervention: ' + String(p.intervention).slice(0,120)) : '') + ' | ' + p.reason + (passing.length>1 ? (' | (' + passing.length + ' cited trials pass R5)') : '');\n    return { verdict:'Confirmed', evidence:ev, trials:trials, passingNct:p.nct };\n  }\n  var summary = trials.map(function(t){ return t.nct + ': ' + t.reason; }).join(' || ');\n  // Fetch-error fix: a transient clinicaltrials.gov failure must NOT silently\n  // demote a real AAV company to Not confirmed (that would drop it off the\n  // surface). If no trial passed AND >=1 fetch errored, we genuinely could\n  // not verify -> conservative hold (Needs review), flagged for re-run.\n  var fetchErrors = trials.filter(function(t){ return t.fetchError; });\n  if (fetchErrors.length > 0) {\n    return { verdict:'Needs review', evidence:'Could not verify modality: ' + fetchErrors.length + ' of ' + trials.length + ' cited trial(s) failed to fetch from clinicaltrials.gov (transient — re-run Verify before trusting this verdict). ' + summary, trials:trials, passingNct:null };\n  }\n  return { verdict:'Not confirmed', evidence:'No cited trial passes the R5 3-clause gate. ' + summary, trials:trials, passingNct:null };\n}\n";

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
