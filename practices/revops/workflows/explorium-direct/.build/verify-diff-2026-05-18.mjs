// =====================================================================
// Verify regression harness — 2026-05-18
// Offline. CT.gov v2 reads only (free, no auth). NO Airtable, NO n8n,
// NO spend. Proves the shared R5 brain against the CORRECTED acceptance
// test (ORACLE-CORRECTION-2026-05-18b.md) using the immutable oracle
// file's nct_ids — before any deploy or real run.
//
// Run: node .build/verify-diff-2026-05-18.mjs
// Exit 0 = all hard criteria pass. Exit 1 = a real regression.
// Expected divergences (domain_knowledge / firmographic_defunct /
// gene_editing) are reported, never fail the run.
// =====================================================================
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load the shared R5 module (the exact string embedded in both workflows).
const src = readFileSync(join(__dirname, 'r5-trial-test-2026-05-18.ts'), 'utf8');
const body = src.replace(/^[\s\S]*?export const R5_MODULE_JS = String\.raw`/, '').replace(/`;\s*$/, '');
const mod = {};
new Function('module', 'exports', body + '\nmodule.exports={r5TestStudy,r5VerifyCompany,r5_parseNcts,r5_norm};')(mod, mod);
const { r5VerifyCompany, r5_parseNcts } = mod.exports || mod;

const oracle = JSON.parse(readFileSync(join(ROOT, 'ORACLE-verification-35-2026-05-18.json'), 'utf8'));
const rows = oracle.rows;

// Canonical + disease-AAV exclusion: mirror the live Classification Rules
// table content as used by L2/Verify. Sourced from the criteria artifact
// Part 2 (29 canonical) + Part 2 disease-AAV exclusion variants.
const ART = '/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md';
const art = readFileSync(ART, 'utf8');
const norm = mod.exports.r5_norm;
const canonLine = (art.match(/Canonical AAV indications \(29\):([^\n]+)/) || [])[1] || '';
const canonical = canonLine.split(';').map(s => norm(s.replace(/\(.*?\)/g, ''))).filter(Boolean);
const dvLine = (art.match(/ANCA \/ antibody forms:([^\n]+)/) || [])[1] || '';
const dvLine2 = (art.match(/Polyangiitis \/ Wegener \/ Churg-Strauss forms:([^\n]+)/) || [])[1] || '';
const diseaseVariants = (dvLine + ',' + dvLine2).split(/`,\s*`|`/).map(s => s.replace(/[`]/g, '').trim()).filter(Boolean).map(v => ({ raw: v, n: norm(v) }));

const httpReq = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.json();
};

const HARD = { pfizer_ultragenyx_confirmed: [], in_record_machine_confirmed: [], no_nct_needs_review: [], evidence_integrity: [], per_trial_guard: [] };
const failures = [];
const divergences = [];

function rec(arr, ok, msg) { arr.push({ ok, msg }); if (!ok) failures.push(msg); }

const results = [];
for (const row of rows) {
  const ncts = r5_parseNcts(row.nct_ids);
  const v = await r5VerifyCompany(ncts, canonical, diseaseVariants, httpReq, { throttleMs: 120 });
  results.push({ company: row.company, repro: row.repro_class, oracle: row.oracle_verdict, machine: v.verdict, passingNct: v.passingNct, ncts });

  if (row.repro_class === 'no_nct') {
    rec(HARD.no_nct_needs_review, v.verdict === 'Needs review', `${row.company} (no_nct): expected Needs review, got ${v.verdict}`);
  } else if (/Pfizer|Ultragenyx/i.test(row.company)) {
    rec(HARD.pfizer_ultragenyx_confirmed, v.verdict === 'Confirmed', `${row.company}: corrected oracle expects Confirmed (modality), got ${v.verdict}`);
    if (/Pfizer/i.test(row.company)) rec(HARD.evidence_integrity, v.passingNct && v.passingNct !== 'NCT03587116', `Pfizer evidence must cite a passing NCT, not the weak NCT03587116 (got ${v.passingNct})`);
  } else if (row.repro_class === 'in_record_machine') {
    rec(HARD.in_record_machine_confirmed, v.verdict === 'Confirmed', `${row.company} (in_record_machine): MUST stay Confirmed, got ${v.verdict}`);
  } else {
    divergences.push(`${row.company} (${row.repro_class}): oracle=${row.oracle_verdict} machine=${v.verdict} — expected divergence, informational`);
  }
}

// Per-trial regression guard (the real bug class).
{
  const t1 = await httpReq('https://clinicaltrials.gov/api/v2/studies/NCT03587116?fields=protocolSection.identificationModule,protocolSection.designModule,protocolSection.armsInterventionsModule,protocolSection.conditionsModule');
  const r1 = mod.exports.r5TestStudy(t1, canonical, diseaseVariants);
  rec(HARD.per_trial_guard, !r1.pass && !r1.c3, `NCT03587116 must fail R5 on clause 3 (SoC-only); got pass=${r1.pass} c3=${r1.c3}`);
  const t2 = await httpReq('https://clinicaltrials.gov/api/v2/studies/NCT04909346?fields=protocolSection.identificationModule,protocolSection.designModule,protocolSection.armsInterventionsModule,protocolSection.conditionsModule');
  const r2 = mod.exports.r5TestStudy(t2, canonical, diseaseVariants);
  rec(HARD.per_trial_guard, !r2.pass && !r2.c1, `NCT04909346 must fail R5 on clause 1 (OBSERVATIONAL); got pass=${r2.pass} c1=${r2.c1}`);
}

console.log('=== Verify R5 regression harness (corrected acceptance test) ===');
console.log('canonical indications loaded:', canonical.length, '| disease-AAV variants:', diseaseVariants.length);
for (const [k, arr] of Object.entries(HARD)) {
  const bad = arr.filter(x => !x.ok);
  console.log(`[${bad.length === 0 ? 'PASS' : 'FAIL'}] ${k} (${arr.length} checks${bad.length ? ', ' + bad.length + ' failing' : ''})`);
}
console.log('\n--- Per-company verdicts ---');
for (const r of results) console.log(`  ${r.machine.padEnd(13)} ${r.company}  [${r.repro}${r.passingNct ? ', via ' + r.passingNct : ''}]`);
console.log('\n--- Expected divergences (informational, non-blocking) ---');
for (const d of divergences) console.log('  ~ ' + d);
if (failures.length) { console.log('\nREGRESSIONS:'); for (const f of failures) console.log('  X ' + f); console.log(`\nRESULT: FAIL (${failures.length} regression(s))`); process.exit(1); }
console.log('\nRESULT: PASS — all hard acceptance criteria met. Expected divergences only.');
