# Workflow Asset Registry

> **SUPERSEDED 2026-05-18.** The system of record is now the **System Registry** Airtable base `apppQjlZiktpbO4aX` → Assets table, under system `teknova-aav-enrichment`. That base also closed two gaps this file never tracked: L1 Capture (`9gcmEjq1lvOY2jZS`) and the Supabase→Airtable sync. This file is frozen as a tombstone for audit history. Do not edit it to record new state — update the base. Design: `practices/agentic-systems/DESIGN-system-registry-v0-2026-05-18.md`.

The system of record for every n8n workflow in this engagement. If a workflow is not listed here as `prod`, it is not production. Retired assets stay listed as tombstones (audit value), never silently erased.

Governed by `practices/agentic-systems/reference/build-operating-system.md`. Updating this registry and tearing down scratch are **gates** on "done," not afterthoughts.

Last reconciled: 2026-05-18 (agentic-systems).

| Name | n8n ID | Status | Source build file | Deployed versionId | Last verified | Owner | Notes |
|---|---|---|---|---|---|---|---|
| L2 Classify (v4 R5) | `rXKuqfDwqX7TYzxK` | **prod** | `.build/L2-rebuild-2026-05-18.ts` + `.build/L2-applyRules-R5-2026-05-18.js` + shared `.build/r5-trial-test-2026-05-18.ts` | `34f97db9` (as of raw-B re-pull; credential UI ops bump versionId without param change) | 2026-05-18 — raw-B field-by-field read-back, PASSED (agentic-systems) | E-D (build) / agentic-systems (review) | **DEPLOYED, NEVER RUN.** Live Companies data is still 2026-05-15 v3 vintage. Full v4 R5 run deliberately held pending the currency-gate layer. |
| Step 9 Verify (R5) | `2rTMeD7SB3SBNZZE` | **prod** | `.build/Verify-build-2026-05-18.ts` + shared `.build/r5-trial-test-2026-05-18.ts` | (deployed; confirm at next reconcile) | 2026-05-18 — live smoke exec 80769 (29/3/3) + after-state review PASSED | E-D (build) / agentic-systems (review) | Writes only the 3 Verification fields; single linear path (no dup-log). Modality-only. |
| L2 Smoke-Variant 6-row v4 R5 | `3ba5obhDdKcKc5Hs` | **archived** | (derived from prod L2; no independent canonical source) | n/a | 2026-05-18 — smoke exec 80773, data-integrity PASS | E-D | Disposable bounded-test copy. Served its purpose. **Archived by Nick 2026-05-18.** Tombstone — do not recreate; if an L2 smoke is needed again, regenerate from the prod source build file under a fresh `[SCRATCH-yyyymmdd]` name. |

## Open lifecycle items

- Duplicate-run-log defect (Collect noOp multi-fires → ~4 identical Enrichment Runs receipts per L2 run). Pre-existing, receipt-only, no Companies-data impact. Trigger to fix: before L2 becomes recurring/automated — i.e., as part of the currency-gate build, not before.
- Reconciliation cadence: diff n8n actual workflow list vs this registry at every session close-out. Anything in n8n not listed `prod` (past any scratch expiry) → flag for archive same turn.
