/**
 * Currency Phase 1 — Offline Assertion Harness
 * Tests pure currencyOfTrial + currencyVerdict logic only.
 * No network, no Airtable, no spend.
 *
 * Runner: bun currency-phase1-cases.ts
 *
 * ⚠ SPEC INCONSISTENCY NOTE (surface to Nick at Task 5):
 * The plan's Pfizer-like case expected verdict `discontinued`, but the
 * algorithm as specified uses priority current > dormant > discontinued > unknown.
 * For [TERMINATED, COMPLETED-stale], COMPLETED-stale → `dormant` beats
 * TERMINATED → `discontinued`, so the algorithm produces `dormant`, not
 * `discontinued`. Routing consequence is IDENTICAL (both → needs-review).
 * Case 2 below is corrected to match the algorithm. The discrepancy and its
 * routing-neutrality must be ratified by Nick before Phase 1 ships.
 */

import { currencyOfTrial, currencyVerdict, STALENESS_YEARS_TS } from './r5-trial-test-2026-05-18.ts';

let passed = 0;
let failed = 0;

function assert(caseName: string, actual: string, expected: string, extraCheck?: () => { ok: boolean; msg: string }) {
  const verdictOk = actual === expected;
  const extra = extraCheck ? extraCheck() : null;
  if (verdictOk && (!extra || extra.ok)) {
    console.log(`  PASS  ${caseName}`);
    passed++;
  } else {
    console.log(`  FAIL  ${caseName}`);
    if (!verdictOk) console.log(`        verdict: got "${actual}", expected "${expected}"`);
    if (extra && !extra.ok) console.log(`        ${extra.msg}`);
    failed++;
  }
}

// Compute a date N months back from today
function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

// Compute a date N years back from today
function yearsAgo(n: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
}

console.log(`\nCurrency Phase 1 — offline harness (STALENESS_YEARS=${STALENESS_YEARS_TS})`);
console.log('='.repeat(60));

// Case 1: Adrenas-like
// One modality-passing NCT, TERMINATED, last-update recent.
// Status beats recency — defect 1 closure.
{
  const trials = [{ nct: 'NCT_ADRENAS', overallStatus: 'TERMINATED', lastUpdateDate: '2025-12-01', startDate: '2020-01-01' }];
  const r = currencyVerdict(trials);
  assert(
    'Case 1 (Adrenas-like): TERMINATED → discontinued',
    r.verdict,
    'discontinued',
    () => ({
      ok: r.evidence.includes('TERMINATED') && r.carryingNct === 'NCT_ADRENAS',
      msg: `evidence must include "TERMINATED" and carryingNct="NCT_ADRENAS"; got evidence="${r.evidence}", carryingNct="${r.carryingNct}"`,
    }),
  );
}

// Case 2: Pfizer-like (CORRECTED — see header note)
// [NCT_a TERMINATED, NCT_b COMPLETED-stale (7yr)]
// Per algorithm priority (dormant > discontinued), verdict = dormant.
// Plan stated discontinued — routing consequence is identical (needs-review).
// Surface discrepancy to Nick.
{
  const trials = [
    { nct: 'NCT_A', overallStatus: 'TERMINATED', lastUpdateDate: '2025-01-15', startDate: '2020-06-01' },
    { nct: 'NCT_B', overallStatus: 'COMPLETED', lastUpdateDate: yearsAgo(7), startDate: yearsAgo(9) },
  ];
  const r = currencyVerdict(trials);
  assert(
    'Case 2 (Pfizer-like): [TERMINATED, COMPLETED-stale-7yr] → dormant (algorithm; see header note)',
    r.verdict,
    'dormant',  // corrected from plan's stated "discontinued"
    () => ({
      ok: r.carryingNct === 'NCT_B',
      msg: `carryingNct should be NCT_B (the dormant trial, higher priority); got "${r.carryingNct}"`,
    }),
  );
}

// Case 3: Live-AAV
// Single modality-passing NCT, RECRUITING → current
{
  const trials = [{ nct: 'NCT_X', overallStatus: 'RECRUITING', startDate: '2022-01-01' }];
  const r = currencyVerdict(trials);
  assert(
    'Case 3 (Live-AAV): RECRUITING → current',
    r.verdict,
    'current',
    () => ({
      ok: r.carryingNct === 'NCT_X' && r.evidence.includes('RECRUITING'),
      msg: `carryingNct must be NCT_X and evidence must include "RECRUITING"; got carryingNct="${r.carryingNct}"`,
    }),
  );
}

// Case 4: Mixed — multi-NCT arbitration (defect 2 closure)
// [NCT_p TERMINATED, NCT_q ACTIVE_NOT_RECRUITING] → current, carrying NCT_q
{
  const trials = [
    { nct: 'NCT_P', overallStatus: 'TERMINATED', lastUpdateDate: '2024-01-01', startDate: '2020-01-01' },
    { nct: 'NCT_Q', overallStatus: 'ACTIVE_NOT_RECRUITING', startDate: '2021-06-01' },
  ];
  const r = currencyVerdict(trials);
  assert(
    'Case 4 (Mixed): [TERMINATED, ACTIVE_NOT_RECRUITING] → current, carrying NCT_Q',
    r.verdict,
    'current',
    () => ({
      ok: r.carryingNct === 'NCT_Q',
      msg: `carryingNct must be NCT_Q; got "${r.carryingNct}"`,
    }),
  );
}

// Case 5: Completed-recent
// COMPLETED, last-update 14 months ago → within STALENESS_YEARS → current
{
  const trials = [{ nct: 'NCT_R', overallStatus: 'COMPLETED', lastUpdateDate: monthsAgo(14), startDate: yearsAgo(3) }];
  const r = currencyVerdict(trials);
  assert(
    'Case 5 (Completed-recent): COMPLETED 14mo ago → current',
    r.verdict,
    'current',
  );
}

// Case 6: Completed-stale
// COMPLETED, last-update 7 years ago, start 9 years ago → both stale → dormant
{
  const trials = [{ nct: 'NCT_S', overallStatus: 'COMPLETED', lastUpdateDate: yearsAgo(7), startDate: yearsAgo(9) }];
  const r = currencyVerdict(trials);
  assert(
    'Case 6 (Completed-stale): COMPLETED 7yr ago → dormant',
    r.verdict,
    'dormant',
  );
}

console.log('='.repeat(60));
console.log(`Result: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\nFAIL — fix pure functions, not the cases.');
  process.exit(1);
} else {
  console.log('\nAll assertions PASS.');
}
