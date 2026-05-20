/**
 * SHARED R5 TRIAL-EVIDENCE MODULE — 2026-05-18
 * Source of truth for the 3-clause CT.gov gate. Embedded VERBATIM (as a JS
 * string) into BOTH the L2 Classify "Apply Rules" node and the new Verify
 * workflow. Do not fork. If this changes, regenerate both workflows from it.
 *
 * Authority: revops-segment-aav-gene-therapy-ellie-outreach.md Part 2 (R5,
 * v4) + ORACLE-CORRECTION-2026-05-18b.md (clause-3 scope reconciliation,
 * modality-only, multi-NCT any-pass). The correction doc is authoritative
 * over the original ORACLE JSON's verdict semantics.
 *
 * R5 (per trial, ALL three must hold):
 *  1. studyType === 'INTERVENTIONAL'  (kills OBSERVATIONAL: seroprevalence,
 *     anti-AAV antibody, registry, natural-history — e.g. NCT04909346,
 *     NCT03185897).
 *  2. >=1 canonical AAV indication in conditions AND 0 disease-AAV
 *     exclusion terms (vasculitis homonym).
 *  3. An AAV / gene-therapy token in the trial TITLE or an INTERVENTION
 *     NAME (correction doc point 2 — title scope is required so Bayer
 *     NCT03588299 reproduces Confirmed; intervention-name-only would
 *     regress it), AND NOT every intervention is standard-of-care /
 *     replacement / placebo / sham / diagnostic / device / OTHER
 *     non-treatment (kills Pfizer NCT03587116 SoC-only and NCT05568719
 *     diagnostic-only while letting NCT04370054 / NCT02484092 /
 *     NCT03362502 pass).
 *
 * Per company: >=1 cited NCT passes all 3 -> Confirmed; cited NCTs exist
 * but none pass -> Not confirmed; no NCT stored -> Needs review.
 * Test EVERY cited NCT, not just the first. Evidence must cite a PASSING
 * NCT, never the weak surfacing trial.
 *
 * Token scope is deliberately title + intervention name ONLY (NOT
 * briefSummary) per correction doc point 2. domain_knowledge rows whose
 * AAV proof lives only in the summary therefore fail here and route to
 * Not confirmed — an expected, flagged-not-blocked divergence.
 *
 * canonical / diseaseVariants / norm are supplied by the caller from the
 * live Classification Rules Airtable table (single authorable source — no
 * vocab is invented here).
 */

export const R5_MODULE_JS = String.raw`
function r5_norm(s){ return String(s||'').toLowerCase().replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/[^a-z0-9]+/g,' ').trim(); }
function r5_parseNcts(v){ if(v==null) return []; const m = String(v).match(/NCT\d{8}/gi) || []; const seen={}; const out=[]; for(const x of m){ const u=x.toUpperCase(); if(!seen[u]){seen[u]=1; out.push(u);} } return out; }
var R5_TOKEN = /(adeno[ -]?associated|\baav\d*\b|aav[1-9](?:\/[0-9])?\b|[a-z]+parvovec\b|\brecombinant aav|\bgene therap|\bgene transfer|\bvector-mediated)/i;
var R5_NONTREAT_NAME = /(standard of care|replacement therapy|\bplacebo\b|\bsham\b|best supportive care|no intervention|non-treatment|observation only|usual care|natural history|seroprevalence|prevalence|antibody study)/i;
var R5_NONTREAT_TYPE = { DEVICE:1, DIAGNOSTIC_TEST:1, OTHER:1, BEHAVIORAL:1, PROCEDURE:1, DIETARY_SUPPLEMENT:1, RADIATION:1 };
function r5_isNonTreatment(i){ if(!i) return true; var t=String(i.type||'').toUpperCase(); var n=String(i.name||''); if(R5_NONTREAT_NAME.test(n)) return true; if(R5_NONTREAT_TYPE[t]) return true; return false; }

/* study = CT.gov v2 study JSON. canonical = array of normalized canonical
   indication strings. diseaseVariants = array of {raw,n}. Returns a verdict
   object for ONE trial. */
function r5TestStudy(study, canonical, diseaseVariants){
  var ps = (study && study.protocolSection) || {};
  var idm = ps.identificationModule || {};
  var dm  = ps.designModule || {};
  var cm  = ps.conditionsModule || {};
  var aim = ps.armsInterventionsModule || {};
  var nct = (idm.nctId || (study && study.nctId) || '').toUpperCase();
  var studyType = String(dm.studyType||'').toUpperCase();
  var conditions = Array.isArray(cm.conditions) ? cm.conditions : [];
  var interventions = Array.isArray(aim.interventions) ? aim.interventions : [];
  var briefTitle = idm.briefTitle || '';
  var officialTitle = idm.officialTitle || '';
  var sm  = ps.statusModule || {};
  var overallStatus = String(sm.overallStatus||'').toUpperCase();
  var startDate = (sm.startDateStruct&&sm.startDateStruct.date)||null;
  var lastUpdateDate = (sm.lastUpdatePostDateStruct&&sm.lastUpdatePostDateStruct.date)||null;

  var c1 = studyType === 'INTERVENTIONAL';

  var condText = r5_norm(conditions.join(' ; '));
  var matchedCanon = canonical.filter(function(t){ return t && condText.indexOf(t) !== -1; });
  var hitDisease = diseaseVariants.filter(function(v){ return v.n && condText.indexOf(v.n) !== -1; }).map(function(v){ return v.raw; });
  var c2 = matchedCanon.length > 0 && hitDisease.length === 0;

  var intvNames = interventions.map(function(i){ return (i && i.name) ? String(i.name) : ''; }).filter(Boolean);
  var tokenBlob = [briefTitle, officialTitle, intvNames.join(' ')].join(' ');
  var hasToken = R5_TOKEN.test(tokenBlob);
  var hasTreatment = interventions.length > 0 && interventions.some(function(i){ return !r5_isNonTreatment(i); });
  var c3 = hasToken && hasTreatment;

  var pass = c1 && c2 && c3;
  var reason;
  if (pass) reason = 'PASS: interventional + canonical condition (' + matchedCanon.slice(0,2).join(', ') + ') + AAV/gene-transfer intervention';
  else if (!c1) reason = 'FAIL c1: studyType=' + (studyType||'(none)') + ' not INTERVENTIONAL';
  else if (!c2) reason = hitDisease.length ? ('FAIL c2: disease-AAV exclusion (' + hitDisease.slice(0,2).join(', ') + ')') : 'FAIL c2: no canonical AAV indication in conditions';
  else reason = !hasToken ? 'FAIL c3: no AAV/gene-therapy token in title or intervention name' : 'FAIL c3: all interventions are standard-of-care / non-treatment / diagnostic / placebo';
  return { nct:nct, pass:pass, c1:c1, c2:c2, c3:c3, studyType:studyType, matchedCanon:matchedCanon, hitDisease:hitDisease, briefTitle:briefTitle, intervention:(intvNames[0]||''), reason:reason, overallStatus:overallStatus, startDate:startDate, lastUpdateDate:lastUpdateDate };
}

/* Fetch + per-company roll-up. httpReq = an async (url)->json fn; in n8n
   pass a wrapper over this.helpers.httpRequest. Sequential + throttled
   (CT.gov v2, free, no auth). Network/parse failure on a trial = that
   trial fails (fail-safe; never auto-confirm on error). */
async function r5VerifyCompany(nctIds, canonical, diseaseVariants, httpReq, opts){
  opts = opts || {};
  var throttleMs = opts.throttleMs == null ? 150 : opts.throttleMs;
  var ncts = Array.isArray(nctIds) ? nctIds : r5_parseNcts(nctIds);
  if (ncts.length === 0) return { verdict:'Needs review', evidence:'No CT.gov NCT ID stored — cannot ground-truth modality from trial evidence (R5).', trials:[], passingNct:null };
  var trials = [];
  for (var k=0; k<ncts.length; k++){
    var id = ncts[k];
    var study = null, err = null;
    try {
      study = await httpReq('https://clinicaltrials.gov/api/v2/studies/' + id + '?fields=protocolSection.identificationModule,protocolSection.designModule,protocolSection.armsInterventionsModule,protocolSection.conditionsModule,protocolSection.statusModule');
    } catch(e){ err = (e && e.message) ? e.message : String(e); }
    if (err || !study) { trials.push({ nct:id, pass:false, reason:'FETCH ERROR: ' + (err||'no body'), fetchError:true }); }
    else { var r = r5TestStudy(study, canonical, diseaseVariants); r.nct = r.nct || id; trials.push(r); }
    if (throttleMs && k < ncts.length-1) { await new Promise(function(res){ setTimeout(res, throttleMs); }); }
  }
  var passing = trials.filter(function(t){ return t.pass; });
  if (passing.length > 0) {
    var p = passing[0];
    var ev = 'Confirmed AAV gene therapy via ' + p.nct + ': "' + String(p.briefTitle||'').slice(0,160) + '"' + (p.intervention ? (' | intervention: ' + String(p.intervention).slice(0,120)) : '') + ' | ' + p.reason + (passing.length>1 ? (' | (' + passing.length + ' cited trials pass R5)') : '');
    return { verdict:'Confirmed', evidence:ev, trials:trials, passingNct:p.nct };
  }
  var summary = trials.map(function(t){ return t.nct + ': ' + t.reason; }).join(' || ');
  // Fetch-error fix: a transient clinicaltrials.gov failure must NOT silently
  // demote a real AAV company to Not confirmed (that would drop it off the
  // surface). If no trial passed AND >=1 fetch errored, we genuinely could
  // not verify -> conservative hold (Needs review), flagged for re-run.
  var fetchErrors = trials.filter(function(t){ return t.fetchError; });
  if (fetchErrors.length > 0) {
    return { verdict:'Needs review', evidence:'Could not verify modality: ' + fetchErrors.length + ' of ' + trials.length + ' cited trial(s) failed to fetch from clinicaltrials.gov (transient — re-run Verify before trusting this verdict). ' + summary, trials:trials, passingNct:null };
  }
  return { verdict:'Not confirmed', evidence:'No cited trial passes the R5 3-clause gate. ' + summary, trials:trials, passingNct:null };
}

/* --- Currency gate — Phase 1 (deterministic CT.gov) ---
   currencyOfTrial: verdict for one trial from its overallStatus + staleness.
   currencyVerdict: best-alive verdict across the modality-passing trial set.
   STALENESS_YEARS = Nick/Ellie-tunable Q4 commercial call; one constant only. */
var STALENESS_YEARS = 5;

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
`;

// TypeScript re-exports for offline harness and deploy scripts.
// Logic is byte-identical to the JS functions inside R5_MODULE_JS above.

/** Q4 commercial-weight call — Nick/Ellie-tunable, pending ratification. */
export const STALENESS_YEARS_TS = 5;

export interface TrialCurrencyInput {
  nct?: string;
  overallStatus?: string | null;
  startDate?: string | null;
  lastUpdateDate?: string | null;
}

export type CurrencyLabel = 'current' | 'dormant' | 'discontinued' | 'unknown';

export interface CurrencyVerdictResult {
  verdict: CurrencyLabel;
  evidence: string;
  carryingNct: string | null;
}

export function currencyOfTrial(trial: TrialCurrencyInput): CurrencyLabel {
  const s = String((trial && trial.overallStatus) || '').toUpperCase().trim();
  if (!s) return 'unknown';
  if (s === 'TERMINATED' || s === 'WITHDRAWN' || s === 'SUSPENDED') return 'discontinued';
  if (s === 'RECRUITING' || s === 'ACTIVE_NOT_RECRUITING' || s === 'ENROLLING_BY_INVITATION' || s === 'NOT_YET_RECRUITING') return 'current';
  if (s === 'COMPLETED' || s === 'UNKNOWN') {
    const cutoff = Date.now() - STALENESS_YEARS_TS * 365.25 * 24 * 3600 * 1000;
    const sd = trial.startDate ? Date.parse(trial.startDate) : NaN;
    const ud = trial.lastUpdateDate ? Date.parse(trial.lastUpdateDate) : NaN;
    if ((!isNaN(sd) && sd >= cutoff) || (!isNaN(ud) && ud >= cutoff)) return 'current';
    return 'dormant';
  }
  return 'unknown';
}

export function currencyVerdict(modalityPassingTrials: TrialCurrencyInput[]): CurrencyVerdictResult {
  if (!modalityPassingTrials || modalityPassingTrials.length === 0) {
    return { verdict: 'unknown', evidence: 'No modality-passing trials to evaluate currency on.', carryingNct: null };
  }
  const PRIO: Record<CurrencyLabel, number> = { current: 3, dormant: 2, discontinued: 1, unknown: 0 };
  let best: CurrencyLabel = 'unknown';
  let bestTrial: TrialCurrencyInput | null = null;
  let bestScore = -1;
  for (const t of modalityPassingTrials) {
    const v = currencyOfTrial(t);
    const score = PRIO[v] ?? 0;
    if (score > bestScore) { bestScore = score; best = v; bestTrial = t; }
    else if (score === bestScore && bestTrial) {
      const td = Math.max(t.startDate ? (Date.parse(t.startDate) || 0) : 0, t.lastUpdateDate ? (Date.parse(t.lastUpdateDate) || 0) : 0);
      const bd = Math.max(bestTrial.startDate ? (Date.parse(bestTrial.startDate) || 0) : 0, bestTrial.lastUpdateDate ? (Date.parse(bestTrial.lastUpdateDate) || 0) : 0);
      if (td > bd) { best = v; bestTrial = t; }
    }
  }
  const nct = bestTrial ? (bestTrial.nct || 'unknown') : 'unknown';
  const status = bestTrial ? (bestTrial.overallStatus || 'unknown') : 'unknown';
  const dateStr = bestTrial ? (bestTrial.lastUpdateDate || bestTrial.startDate || 'unknown') : 'unknown';
  const branch =
    best === 'discontinued' ? 'all modality-passing trials are TERMINATED/WITHDRAWN/SUSPENDED' :
    best === 'current' ? `trial is live/recruiting or COMPLETED within ${STALENESS_YEARS_TS}yr` :
    best === 'dormant' ? `no terminated signal but stale (>${STALENESS_YEARS_TS}yr)` :
    'insufficient status data';
  return {
    verdict: best,
    evidence: `Currency: ${best} — carried by ${nct} (status: ${status}, date: ${dateStr}). Rule: ${branch}.`,
    carryingNct: nct,
  };
}
