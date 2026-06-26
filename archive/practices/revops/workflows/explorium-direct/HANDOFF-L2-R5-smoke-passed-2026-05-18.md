# RESUME HANDOFF — L2 R5 + Step 9 Verify: built, deployed, smoke-passed, gated

**Date:** 2026-05-18
**State source of truth:** RevOps Surface Play Steps `recv2wtYsXy6zsRPq` (L2/Classify – Gate web) and `recFiLfgGvw5r3JdB` (Step 9 Verify), table `tblzE9GB8UIs5hGFJ`, base `appYBYH3aOHhTODAw`. Read those `What Happened` fields first — they have the full receipt. This file is the orientation summary, not the authority.

## Workflows (instig8.app.n8n.cloud)

- **L2 v4 R5 — PROD `rXKuqfDwqX7TYzxK`** — deployed (versionId 34f97db9 family; Nick's UI cred attach bumps it, params byte-identical). raw-B config reviewed PASS by agentic-systems. Credentials set by Nick, stand. Manual-trigger (run via Execute, not "publish"). **NOT run on full 631.** Re-running from trigger re-blanks + reclassifies all 631 (CT.gov reads only, no spend; Step 5 Explorium is the separate spend gate).
- **Step 9 Verify — `2rTMeD7SB3SBNZZE`** — built, deployed, live smoke PASSED (exec 80769: 29 Confirmed / 3 Not confirmed / 3 Needs review; all hard criteria; exactly one receipt). Functionally complete. Single linear path (no dup-log).
- **Smoke-variant — `3ba5obhDdKcKc5Hs`** — bounded 6-row L2, ALL-HTTP (zero Airtable-typed nodes → no resource locator → UI-save-immune; this permanently killed the RL-corruption loop). Apply Rules + 7 PATCH byte-identical to reviewed prod. Smoke PASSED (exec 80773, ~10s, 6 rows, CT.gov only, no spend). This is **scratch scaffolding** pending teardown.

## Smoke result (exec 80773) — data-integrity ALL PASS

CSL Behring→surfaced(R5,NCT03569891); Pfizer→surfaced(R5, evidence NCT03362502 not weak NCT03587116); Nkarta→rejected(disease); Amgen→rejected, **numeric/funding byte-unchanged (325412/10B-100B/10001+)**; Prevail→**approved deviation PATCH field-for-field** (borderline+needs_aav_review+Rejection Reason); The Clinical Trial Company→borderline(clean). `this.helpers.httpRequest` resolved.

## Open items

1. **Dup-log defect (pre-existing, NOT new):** L2 `Collect`→Prepare/Write Run Log convergence writes ~4 content-identical Enrichment Runs receipts per run (exec 80773 produced 4: recO3c36VSJT0kwlT, recWD9BeEa8HfayqJ, recmhXIMOjXQIo6Iy, recsfSbvZgGOZGwbI). Receipt-table only — never Companies data. Verify unaffected. agentic-systems logged open item since session start; prod L2 carries it regardless. **Awaiting agentic-systems ruling: does it block full-631, or fix-first?**
2. **Smoke after-state review** — pending with agentic-systems.
3. **Full-631 L2 v4 R5 run** — gated. Separate explicit Nick instruction AFTER #1+#2. Never implied by the smoke passing.
4. **Step 5 Explorium enrichment spend gate** — separate downstream, Nick's call, untouched.
5. **Scratch teardown (build-asset-lifecycle):** archive/delete smoke-variant `3ba5obhDdKcKc5Hs` and reconcile REGISTRY once the after-state review clears. Kept live now so the artifact stays inspectable.
6. **Carried downstream:** PTC Therapeutics duplicate company rows; domain_knowledge dedupe — deferred to enrichment/handoff stage.

## Hard constraints carried forward

- No full-631 run, no Step 5 / any enrichment spend, without explicit same-session Nick go.
- n8n MCP has NO credential API: every create/update wipes node creds; user reattaches in UI after the FINAL MCP write. Minimize/batch MCP writes.
- Airtable-typed nodes' resource locators get blanked by MCP-create AND n8n UI-save; the durable fix is HTTP-conversion (no RL). cachedResultName/Url hardening only survives MCP, not UI-save. (Memory `feedback_n8n_mcp_airtable_node_corruption` updated.)
- Prod L2 untouched this round; do not re-push it before the dup-log ruling.

## Key build artifacts (`.build/`)

`L2-prod-raw-patch-bodies-2026-05-18.json` (raw-B, reviewed PASS), `L2-smoke-before-state-2026-05-18.json` (immutable 6-row before-state), `L2-smoke-variant-DEPLOYED-readback-2026-05-18.json`, `L2-SMOKE-VARIANT-HTTP-2026-05-18.ts` (deployed all-HTTP variant), `r5-trial-test-2026-05-18.ts`, `verify-diff-2026-05-18.mjs`, `PR-NOTES-2026-05-18.md`.

## Exact resume point

Wait for agentic-systems' after-state + dup-log ruling on Play Step `recv2wtYsXy6zsRPq`. Then route per ruling: either fix the dup-log on prod L2 (re-earn gates) or proceed to Nick's explicit full-631 go. Then Step 5 spend gate. Pull the Play Step `What Happened` before acting — do not act from this file alone.
