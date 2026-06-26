# RESUME HANDOFF — L2 Classify v3 ACCEPTED on full cohort

**Date:** 2026-05-18
**Workflow:** `rXKuqfDwqX7TYzxK` ("Canonical AAV Discovery - L2 Classify")
**Last good version:** `bb1a0114` (bundled join fix + per-PATCH throttle). Published; ran successfully as execution **77423**.
**State source of truth:** RevOps Surface Play Step `recv2wtYsXy6zsRPq` (tblzE9GB8UIs5hGFJ, base `appYBYH3aOHhTODAw`). Read it first — it has the full receipt. Do not act from this file's summary alone.

## Where we are (verified, read-only)

L2 v3 is built, deployed, and **validated on the full 631-company cohort**. Execution 77423 = success (~69s). v3 acceptance gate PASSED on all 7 criteria:

- **Complete:** Verification Status across 631 = surfaced 35 / borderline 585 / rejected 11 / **needs_verification 0**. No partial residue.
- **Keystone held:** Nkarta `rec0SJcJbRMJIiz3Q` = `rejected`, Rejection Reason = ANCA-Associated Vasculitis (v3 disease_aav_exclusion proof, on real data).
- **Numeric-injection closed:** PTC `recw0SR1tCJJ5phH4` retained pre-existing `Last Funding Date 2022-10-27` through reclassification; other keystone numerics unchanged.
- **Stamps:** single run ID `l2_1778889458825` + Classification Version `…v3 pending-ratification` on classified rows.
- **Throttle held empirically:** zero 429 (`options.batching.batch {batchSize:1,batchInterval:300}` on all 7 PATCH nodes; `retryOnFail:true` secondary). Gate 1b Breaker ran once, passed (emitted==live), no throw.
- **Receipt written:** Enrichment Runs rows exist for exec 77423 (join fix `.join(String.fromCharCode(10))` worked).

## Architecture now in place (26 nodes)

Trigger → List All Companies → Count Live Companies (HTTP REST, own offset pagination, executeOnce) → Gate 1b Breaker (fail-closed before any PATCH; emitted==live) → Re-queue Batches → [onEachBatch] Chunk Reset → Reset+Clear Stale → loop / [onDone] Read Classification Rules (executeOnce) → Read Candidates (executeOnce, filters `{Verification Status}='needs_verification'`) → Apply Rules (proven v3 evaluator + dormancy branch, 6 routes) → Route by Outcome → 6× (Chunk → Update PATCH) → Collect → Prepare Run Log → Write Run Log. All 7 Companies writes are HTTP-PATCH, sparse SPEC-rev-2 field sets, batched ≤10, builder-immune.

Build artifact: `.build/L2-rebuild-2026-05-15.ts` (source of truth for the SDK). Breaker design: `.build/GATE-1b-circuit-breaker-2026-05-15.md`.

## Open items — awaiting agentic-systems ruling (do NOT fix unprompted)

1. **Duplicate run-log rows:** `Prepare Run Log` + `Write Run Log` execute 4× per run (Collect convergence fires downstream once per arriving switch branch) → 4 identical Enrichment Runs rows per execution. Content consistent. Logged, not fixed.
2. **PTC Therapeutics duplicate company rows:** `recnXQ9dXlRLF0tPj` (borderline) and `recw0SR1tCJJ5phH4` (surfaced) — same entity, divergent verdicts (each classified on its own CT.gov data). Downstream/enrichment-stage dedupe. Constraint for the eventual Ellie-view: must not show PTC twice with conflicting verdicts.
3. **Distribution skew (informational):** the 35 surfaced sampled so far cluster on a few canonical indications (hemophilia A/B, DMD, Friedreich's Ataxia). A full 35-by-canonical-term breakdown is available on request.

## Hard constraints carried forward

- **No enrichment, no spend** until Nick's Step 5 spend gate. The full L2 run is done; Step 5 (Explorium enrichment) is the next gated stage and is Nick's call.
- Re-running `rXKuqfDwqX7TYzxK` from its trigger ALWAYS fires the full 631 re-queue (unconditional inline Reset+Clear Stale; no MCP partial-exec, no 153-only path). It is idempotent for already-correct rows but re-blanks+rewrites all 631.
- Every L2 code-node edit = FULL replacement block, returned for agentic-systems review; no re-push/re-run on own authority (memory `feedback_full_code_blocks.md`, `feedback_no_autonomous_budget_actions.md`).
- n8n-mcp `get_workflow_details` redacts credentials; `update_workflow` wipes them (Nick reattaches `may 26 all bases` to the 8 HTTP + read/log nodes and republishes after any push). MCP may false-500 on success — verify by read-back.
- maxTries/waitBetweenTries do not SDK-serialize (moot — throttle is the load-bearing rate fix).

## Exact resume point

L2 v3 is accepted. Next session: confirm agentic-systems' ruling on the two open items (duplicate run-log; PTC dedupe), then proceed to whatever they direct — likely the Ellie review-view build (Step 5/handoff layer) and/or Nick's spend gate for enrichment. Pull the Play Step `What Happened` for the authoritative latest before doing anything.
