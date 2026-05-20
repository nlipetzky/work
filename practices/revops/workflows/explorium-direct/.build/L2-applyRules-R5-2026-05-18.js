// =====================================================================
// L2 CLASSIFY — "Apply Rules" node — FULL REPLACEMENT BLOCK (R5, v4)
// 2026-05-18. Select-all -> paste this entire block into the Apply Rules
// Code node (mode: Run Once for All Items). Node must allow async (n8n
// Code node v2 supports top-level await).
//
// Change vs v3: the two would-surface paths (canonical-indication match,
// intervention-name match) are now gated by the R5 3-clause CT.gov trial
// test. A would-surface candidate is only routed `surfaced` if >=1 of its
// cited NCTs passes all 3 clauses; otherwise it routes to needs_aav_review
// (route 4, borderline) — never auto-surfaced on condition text alone.
// All non-surface routes (disease reject, modality reroute, dormant,
// branded, borderline) are UNCHANGED. No PATCH-body field changes; no new
// nodes; 26-node topology intact. R5 functions are generated verbatim
// from .build/r5-trial-test-2026-05-18.ts — do not edit here in isolation.
// =====================================================================

// ---- R5 module (verbatim from r5-trial-test-2026-05-18.ts) ----
function r5_norm(s){ return String(s||'').toLowerCase().replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/[^a-z0-9]+/g,' ').trim(); }
function r5_parseNcts(v){ if(v==null) return []; const m = String(v).match(/NCT\d{8}/gi) || []; const seen={}; const out=[]; for(const x of m){ const u=x.toUpperCase(); if(!seen[u]){seen[u]=1; out.push(u);} } return out; }
var R5_TOKEN = /(adeno[ -]?associated|\baav\d*\b|aav[1-9](?:\/[0-9])?\b|[a-z]+parvovec\b|\brecombinant aav|\bgene therap|\bgene transfer|\bvector-mediated)/i;
var R5_NONTREAT_NAME = /(standard of care|replacement therapy|\bplacebo\b|\bsham\b|best supportive care|no intervention|non-treatment|observation only|usual care|natural history|seroprevalence|prevalence|antibody study)/i;
var R5_NONTREAT_TYPE = { DEVICE:1, DIAGNOSTIC_TEST:1, OTHER:1, BEHAVIORAL:1, PROCEDURE:1, DIETARY_SUPPLEMENT:1, RADIATION:1 };
function r5_isNonTreatment(i){ if(!i) return true; var t=String(i.type||'').toUpperCase(); var n=String(i.name||''); if(R5_NONTREAT_NAME.test(n)) return true; if(R5_NONTREAT_TYPE[t]) return true; return false; }
function r5TestStudy(study, canonical, diseaseVariants){
  var ps=(study&&study.protocolSection)||{}; var idm=ps.identificationModule||{}; var dm=ps.designModule||{}; var cm=ps.conditionsModule||{}; var aim=ps.armsInterventionsModule||{};
  var nct=(idm.nctId||(study&&study.nctId)||'').toUpperCase(); var studyType=String(dm.studyType||'').toUpperCase();
  var conditions=Array.isArray(cm.conditions)?cm.conditions:[]; var interventions=Array.isArray(aim.interventions)?aim.interventions:[];
  var briefTitle=idm.briefTitle||''; var officialTitle=idm.officialTitle||'';
  var sm=ps.statusModule||{}; var overallStatus=String(sm.overallStatus||'').toUpperCase(); var startDate=(sm.startDateStruct&&sm.startDateStruct.date)||null; var lastUpdateDate=(sm.lastUpdatePostDateStruct&&sm.lastUpdatePostDateStruct.date)||null;
  var c1=studyType==='INTERVENTIONAL';
  var condText=r5_norm(conditions.join(' ; '));
  var matchedCanon=canonical.filter(function(t){return t&&condText.indexOf(t)!==-1;});
  var hitDisease=diseaseVariants.filter(function(v){return v.n&&condText.indexOf(v.n)!==-1;}).map(function(v){return v.raw;});
  var c2=matchedCanon.length>0&&hitDisease.length===0;
  var intvNames=interventions.map(function(i){return (i&&i.name)?String(i.name):'';}).filter(Boolean);
  var hasToken=R5_TOKEN.test([briefTitle,officialTitle,intvNames.join(' ')].join(' '));
  var hasTreatment=interventions.length>0&&interventions.some(function(i){return !r5_isNonTreatment(i);});
  var c3=hasToken&&hasTreatment;
  var pass=c1&&c2&&c3; var reason;
  if(pass) reason='PASS: interventional + canonical condition ('+matchedCanon.slice(0,2).join(', ')+') + AAV/gene-transfer intervention';
  else if(!c1) reason='FAIL c1: studyType='+(studyType||'(none)')+' not INTERVENTIONAL';
  else if(!c2) reason=hitDisease.length?('FAIL c2: disease-AAV exclusion ('+hitDisease.slice(0,2).join(', ')+')'):'FAIL c2: no canonical AAV indication in conditions';
  else reason=!hasToken?'FAIL c3: no AAV/gene-therapy token in title or intervention name':'FAIL c3: all interventions are standard-of-care / non-treatment / diagnostic / placebo';
  return {nct:nct,pass:pass,c1:c1,c2:c2,c3:c3,studyType:studyType,matchedCanon:matchedCanon,hitDisease:hitDisease,briefTitle:briefTitle,intervention:(intvNames[0]||''),reason:reason,overallStatus:overallStatus,startDate:startDate,lastUpdateDate:lastUpdateDate};
}
async function r5VerifyCompany(nctIds,canonical,diseaseVariants,httpReq,opts){
  opts=opts||{}; var throttleMs=opts.throttleMs==null?150:opts.throttleMs;
  var ncts=Array.isArray(nctIds)?nctIds:r5_parseNcts(nctIds);
  if(ncts.length===0) return {verdict:'Needs review',evidence:'No CT.gov NCT ID stored — cannot ground-truth modality from trial evidence (R5).',trials:[],passingNct:null};
  var trials=[];
  for(var k=0;k<ncts.length;k++){
    var id=ncts[k]; var study=null,err=null;
    try { study=await httpReq('https://clinicaltrials.gov/api/v2/studies/'+id+'?fields=protocolSection.identificationModule,protocolSection.designModule,protocolSection.armsInterventionsModule,protocolSection.conditionsModule,protocolSection.statusModule'); }
    catch(e){ err=(e&&e.message)?e.message:String(e); }
    if(err||!study){ trials.push({nct:id,pass:false,reason:'FETCH ERROR: '+(err||'no body'),fetchError:true}); }
    else { var r=r5TestStudy(study,canonical,diseaseVariants); r.nct=r.nct||id; trials.push(r); }
    if(throttleMs&&k<ncts.length-1){ await new Promise(function(res){setTimeout(res,throttleMs);}); }
  }
  var passing=trials.filter(function(t){return t.pass;});
  if(passing.length>0){ var p=passing[0];
    var ev='Confirmed AAV gene therapy via '+p.nct+': "'+String(p.briefTitle||'').slice(0,160)+'"'+(p.intervention?(' | intervention: '+String(p.intervention).slice(0,120)):'')+' | '+p.reason+(passing.length>1?(' | ('+passing.length+' cited trials pass R5)'):'');
    return {verdict:'Confirmed',evidence:ev,trials:trials,passingNct:p.nct}; }
  var summary=trials.map(function(t){return t.nct+': '+t.reason;}).join(' || ');
  var fetchErrors=trials.filter(function(t){return t.fetchError;});
  if(fetchErrors.length>0){ return {verdict:'Needs review',evidence:'Could not verify modality: '+fetchErrors.length+' of '+trials.length+' cited trial(s) failed to fetch from clinicaltrials.gov (transient — re-run before trusting). '+summary,trials:trials,passingNct:null}; }
  return {verdict:'Not confirmed',evidence:'No cited trial passes the R5 3-clause gate. '+summary,trials:trials,passingNct:null};
}
/* --- Currency gate — Phase 1 (deterministic CT.gov) ---
   STALENESS_YEARS = Nick/Ellie-tunable Q4 commercial call. */
var STALENESS_YEARS=5;
function currencyOfTrial(trial){
  var s=String((trial&&trial.overallStatus)||'').toUpperCase().trim();
  if(!s) return 'unknown';
  if(s==='TERMINATED'||s==='WITHDRAWN'||s==='SUSPENDED') return 'discontinued';
  if(s==='RECRUITING'||s==='ACTIVE_NOT_RECRUITING'||s==='ENROLLING_BY_INVITATION'||s==='NOT_YET_RECRUITING') return 'current';
  if(s==='COMPLETED'||s==='UNKNOWN'){
    var cutoff=Date.now()-STALENESS_YEARS*365.25*24*3600*1000;
    var sd=trial.startDate?Date.parse(trial.startDate):NaN;
    var ud=trial.lastUpdateDate?Date.parse(trial.lastUpdateDate):NaN;
    if((!isNaN(sd)&&sd>=cutoff)||(!isNaN(ud)&&ud>=cutoff)) return 'current';
    return 'dormant';
  }
  return 'unknown';
}
function currencyVerdict(modalityPassingTrials){
  if(!modalityPassingTrials||modalityPassingTrials.length===0) return {verdict:'unknown',evidence:'No modality-passing trials to evaluate currency on.',carryingNct:null};
  var PRIO={current:3,dormant:2,discontinued:1,unknown:0};
  var best='unknown'; var bestTrial=null; var bestScore=-1;
  for(var i=0;i<modalityPassingTrials.length;i++){
    var t=modalityPassingTrials[i]; var v=currencyOfTrial(t);
    var score=PRIO[v]!=null?PRIO[v]:0;
    if(score>bestScore){bestScore=score;best=v;bestTrial=t;}
    else if(score===bestScore&&bestTrial){
      var td=Math.max(t.startDate?(Date.parse(t.startDate)||0):0,t.lastUpdateDate?(Date.parse(t.lastUpdateDate)||0):0);
      var bd=Math.max(bestTrial.startDate?(Date.parse(bestTrial.startDate)||0):0,bestTrial.lastUpdateDate?(Date.parse(bestTrial.lastUpdateDate)||0):0);
      if(td>bd){best=v;bestTrial=t;}
    }
  }
  var nct=bestTrial?bestTrial.nct:'unknown';
  var status=bestTrial?(bestTrial.overallStatus||'unknown'):'unknown';
  var dateStr=bestTrial?(bestTrial.lastUpdateDate||bestTrial.startDate||'unknown'):'unknown';
  var branch=best==='discontinued'?'all modality-passing trials are TERMINATED/WITHDRAWN/SUSPENDED':best==='current'?'trial is live/recruiting or COMPLETED within '+STALENESS_YEARS+'yr':best==='dormant'?'no terminated signal but stale (>'+STALENESS_YEARS+'yr)':'insufficient status data';
  return {verdict:best,evidence:'Currency: '+best+' — carried by '+nct+' (status: '+status+', date: '+dateStr+'). Rule: '+branch+'.',carryingNct:nct};
}
// ---- end R5 module ----

const rules = $('Read Classification Rules').all();
const candidates = $('Read Candidates').all();
const RULES_VERSION = 'revops-segment-aav-gene-therapy-ellie-outreach.md v4 R5+currency-PROPOSED';
const runId = 'l2_' + Date.now();
const nowIso = new Date().toISOString();
const f = (rec, key) => (rec.json && rec.json.fields && rec.json.fields[key] !== undefined) ? rec.json.fields[key] : (rec.json ? rec.json[key] : undefined);
const recId = (rec) => (rec.json && rec.json.id) ? rec.json.id : (rec.json && rec.json.fields && rec.json.fields.id);
function parseVal(v){ if(v==null) return null; if(typeof v!=='string') return v; const s=v.trim(); if(s.startsWith('{')||s.startsWith('[')){ try{return JSON.parse(s);}catch(e){return v;} } return v; }
const norm = r5_norm;
let canonical = []; let diseaseVariants = []; const modalityExcl = []; let rerouteMap = {}; let brandedPhrases = []; let clauseARegex = null, clauseASubs = []; let dormancyConfirmed = [];
for (const r of rules) {
  const name = f(r,'Rule Name'); const cat = f(r,'Rule Category'); const val = parseVal(f(r,'Rule Value'));
  if (name === 'canonical_aav_indications' && typeof val === 'string') canonical = val.split('|').map(x=>norm(x)).filter(Boolean);
  else if (name === 'disease_aav_exclusion' && val && val.variants) diseaseVariants = val.variants.map(v=>({raw:v, n:norm(v)})).filter(v=>v.n);
  else if (cat === 'disqualifier_modality' && val && val.tokens) modalityExcl.push({ tokens:(val.tokens||[]).map(t=>norm(t)), ctx:(val.requires_context_word||[]).map(t=>norm(t)), mapsTo: val.maps_to || val.mapsTo || '' });
  else if (name === 'modality_to_alt_play_map' && val && typeof val === 'object') rerouteMap = val;
  else if (name === 'clause_b_gene_therapy_branded_fallback' && val && val.branded_phrases) brandedPhrases = val.branded_phrases.map(p=>norm(p)).filter(Boolean);
  else if (name === 'clause_a_intervention_name' && val) { try { if(val.regex) clauseARegex = new RegExp(val.regex,'i'); } catch(e){} clauseASubs = (val.substring_case_insensitive||[]).map(s=>norm(s)).filter(Boolean); }
  else if (name === 'dormancy_rule' && val && val.confirmed_dormant) dormancyConfirmed = val.confirmed_dormant.map(x=>norm(x)).filter(Boolean);
}
const FIVE_YR_MS = 5 * 365.25 * 24 * 3600 * 1000;
const httpReq = async (url) => await this.helpers.httpRequest({ method:'GET', url, json:true, timeout:15000 });
const MAX_FETCH = 800; // fail-closed budget: would-surface set is ~35-60; exceeding signals a data anomaly
let fetchBudget = 0;
const out = [];
for (const c of candidates) {
  const id = recId(c);
  const companyName = f(c,'Company Name') || '';
  const rawInd = f(c,'CT.gov Indications') || '';
  const lead = f(c,'Lead Indication') || '';
  const text = norm(rawInd + ' ; ' + lead);
  const nameN = norm(companyName);
  const mostRecentTrial = f(c,'Most Recent Trial Date');
  const activeRecruiting = f(c,'Active Recruiting');
  let trialDateKnown = false, trialRecent = false;
  if (mostRecentTrial) { const t = Date.parse(mostRecentTrial); if (!isNaN(t)) { trialDateKnown = true; if ((Date.now() - t) <= FIVE_YR_MS) trialRecent = true; } }
  const isDormant = (dormancyConfirmed.length > 0 && dormancyConfirmed.indexOf(nameN) !== -1) || (trialDateKnown && !trialRecent && !activeRecruiting);
  let route, routeIdx, verification, clause = '', custom = '', customSrc = '', customConf = '', kw = '', reason = '', notes = '';
  let currencyStatus = '', currencyEvidence = '', currencyCheckedAt = '';
  const hitDiseaseRaw = diseaseVariants.filter(v => text.indexOf(v.n) !== -1).map(v=>v.raw);
  const hitDisease = [...new Set(hitDiseaseRaw)];
  let hitModality = null;
  for (const m of modalityExcl) { const tok = m.tokens.find(t => t && text.indexOf(t) !== -1); if (tok) { const hasCtx = m.ctx.length === 0 || m.ctx.some(w => text.indexOf(w) !== -1); if (hasCtx) { hitModality = { tok, mapsTo: m.mapsTo }; break; } } }
  const matchedCanon = canonical.filter(t => t && text.indexOf(t) !== -1);
  const clauseAHit = (clauseARegex && clauseARegex.test(rawInd + ' ' + lead)) || clauseASubs.some(s => text.indexOf(s) !== -1);
  const brandedHit = brandedPhrases.some(p => text.indexOf(p) !== -1);
  if (hitDisease.length > 0) { route='disease_reject'; routeIdx=1; verification='rejected'; reason = hitDisease.slice(0,3).join('; '); notes = nowIso + ' | v4 R5 | disease_aav_exclusion: ' + reason; customSrc = 'L2:disease_aav_exclusion'; }
  else if (hitModality) { route='modality_reroute'; routeIdx=2; verification='rejected'; custom = hitModality.mapsTo || hitModality.tok; const rr = rerouteMap[custom] || rerouteMap[hitModality.tok] || ''; reason = 'wrong_modality: ' + hitModality.tok; notes = nowIso + ' | v4 R5 | modality exclusion token "' + hitModality.tok + '"' + (rr ? (' | reroute: ' + rr) : ''); customSrc = 'L2:disqualifier_modality'; }
  else if (isDormant) { route='dormant'; routeIdx=3; verification='borderline'; reason='dormant: most recent trial >5yr, no active/recruiting (machine default, Q4 pending Ellie)'; customSrc='L2:dormancy_rule'; notes = nowIso + ' | v4 R5 | dormancy_rule: ' + (dormancyConfirmed.indexOf(nameN) !== -1 ? 'confirmed_dormant list' : 'most recent trial >5yr and not active/recruiting'); }
  else if (matchedCanon.length > 0 || clauseAHit) {
    // v3 would-surface — now R5-gated on cited CT.gov trial evidence.
    const ncts = r5_parseNcts(f(c,'CT.gov NCT IDs'));
    if (ncts.length === 0) {
      route='needs_review'; routeIdx=4; verification='borderline';
      reason='needs_aav_review'; customSrc='L2:r5_no_nct';
      notes = nowIso + ' | v4 R5 | canonical/intervention text match but NO CT.gov NCT stored to validate — manual AAV review';
    } else {
      if (fetchBudget + ncts.length > MAX_FETCH) {
        throw new Error('R5 ABORT: CT.gov fetch budget ' + MAX_FETCH + ' exceeded at company "' + companyName + '" (would-surface set far larger than expected — data anomaly). Hard stop before any PATCH.');
      }
      fetchBudget += ncts.length;
      const v = await r5VerifyCompany(ncts, canonical, diseaseVariants, httpReq, { throttleMs: 150 });
      if (v.verdict === 'Confirmed') {
        const cv = currencyVerdict(v.trials.filter(t => t.pass));
        currencyStatus = cv.verdict;
        currencyEvidence = cv.evidence;
        currencyCheckedAt = nowIso.slice(0, 10);
        if (cv.verdict === 'current') {
          route='surfaced'; routeIdx=0; verification='surfaced'; clause='R5'; custom='aav';
          customSrc='L2:r5_trial_evidence'; customConf='high';
          kw = matchedCanon.slice(0,8).join(' | ');
          notes = nowIso + ' | v4 R5+currency | ' + v.evidence + ' | ' + cv.evidence;
        } else {
          route='needs_review'; routeIdx=4; verification='borderline';
          reason='needs_aav_review'; customSrc='L2:r5_currency_gate';
          notes = nowIso + ' | v4 R5+currency | AAV confirmed but currency=' + cv.verdict + ' | ' + cv.evidence;
        }
      } else {
        route='needs_review'; routeIdx=4; verification='borderline';
        reason='needs_aav_review'; customSrc='L2:r5_no_passing_trial';
        notes = nowIso + ' | v4 R5 | condition/intervention match but no cited trial passes R5 3-clause gate | ' + String(v.evidence).slice(0,400);
      }
    }
  }
  else if (brandedHit) { route='needs_review'; routeIdx=4; verification='borderline'; reason='needs_aav_review'; notes = nowIso + ' | v4 R5 | gene-therapy branded, no AAV terms (clause B) - needs AAV review'; customSrc='L2:clause_b_gene_therapy_branded_fallback'; }
  else { route='borderline'; routeIdx=5; verification='borderline'; notes = nowIso + ' | v4 R5 | no canonical match, no disease-AAV collision - manual review'; }
  out.push({ json: { id, _companyName: companyName, _route: route, _routeIndex: routeIdx, _verification: verification, _clause: clause, _custom: custom, _customSrc: customSrc, _customConf: customConf, _kw: kw, _reason: reason, _notes: notes, _classVersion: RULES_VERSION, _runId: runId, _runDate: nowIso, _currencyStatus: currencyStatus, _currencyEvidence: currencyEvidence, _currencyCheckedAt: currencyCheckedAt }});
}
return out;
