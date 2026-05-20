# Workflows ticket — fix `Collect All Prospects` silent multi-company reducer

**Workflow:** `bYZ0sAzyUvU60wMZ`. **Owner:** Workflows. **agentic-systems surface-verifies.**
Scope is exactly this one defect. Nothing else (no broader merge-topology rewrite beyond what's required to collect across multiple loop iterations).

## The defect (surface-verified, exec 80833)

`Collect All Prospects` calls `$('Normalize Prospects').all()` from outside the `Loop Companies` (`SplitInBatches`) loop. In n8n, `.all()` on a node with multiple runs returns only **one run's** items, not the union across runs.

**Evidence from exec 80833 (3-company run, Voyager + Solid + Lexeo, surface-verified):**

| Node | Counts |
|---|---|
| Read Target Companies | 1r / 3i |
| Build Sourcing Plan | 1r / 3i |
| Loop Companies | 4r / 15i |
| Normalize Prospects | **3r / 15i** (5 per company × 3 companies) |
| `Collect All Prospects` | **1r / 5i** (silent 15→5 reducer) |
| Downstream | 5i (Lexeo only) |

Voyager's 5 normalized prospects and Solid's 5 normalized prospects were silently dropped. Single-company runs masked this for the entire prior history of the workflow.

## Fix (do NOT over-prescribe — diagnose and apply the correct n8n pattern)

`Collect All Prospects` must aggregate **across all runs** of `Normalize Prospects`, not one. Standard n8n patterns for this include:
- Aggregating inside the SplitInBatches loop and emitting once the loop completes, or
- Using a node configured to collect across multiple iterations,
- Or refactoring so the join happens via a node n8n natively unions across runs.

Pick the smallest correct fix; document which pattern in the deploy report.

## Constraints (non-negotiable)

- n8n PUT/MCP wipes credentials; `validate_workflow` misses Airtable corruption. Capture full workflow JSON before any edit; after deploy, raw read-back every credential + node/connection counts; report as references. Do not assert "credentials preserved."
- No autonomous spend. Deploy inactive. Verification = bounded paid re-run on **Voyager + Solid** specifically (the two companies that were silently dropped) — Nick same-session go required. ~10 prospects, no broader cohort.
- Output contract: references only — workflow/version IDs, execution ID, per-node counts from the cited execution. No narrative, no "verified/working." agentic-systems decides pass/fail on surface.
- Scope is exactly this fix. Nothing else.

## Definition of done (agentic-systems verifies on surface)

On a bounded Voyager + Solid re-run (size:5 each):
1. `Normalize Prospects`: 2 runs, 10 items total (5 per company).
2. `Collect All Prospects`: emits **all 10** items, not 5.
3. Downstream (`Apply Score + Map`, `Prepare Contacts Upsert`, `Upsert Contacts to Airtable`): processes 10 prospects, all reach the surface.
4. Each company's prospects identifiable on the surface (Voyager's 5 and Solid's 5 both present in Contacts, linked to their respective Company records).
5. No regression: Lexeo's prior 5 still upsert-merge cleanly via Person Key if it's included again (don't re-run Lexeo here — the test is the dropped companies).

Pass on all five = reducer closed. Unblocks the eventual full-cohort run in the engine's path-to-done.
