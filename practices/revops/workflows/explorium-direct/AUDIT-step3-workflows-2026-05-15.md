# Step 3 audit: live n8n workflows vs. state-machine design

**Date:** 2026-05-15
**Scope:** read-only audit. No build. Project `Pj1xUgbrL58T1CS1` / folder `TmR35w0s71YQicv1`, instance instig8.app.n8n.cloud.
**n8n MCP connection:** healthy (all read calls succeeded). No connection blocker.

## Workflows that exist (the L1→L2→enrich path)

| Role | Workflow | ID | Active | Last run | Verdict |
|---|---|---|---|---|---|
| L1 Source (CT.gov) | Canonical AAV Discovery - ClinicalTrials.gov | `9gcmEjq1lvOY2jZS` | false, triggerCount 0 | exec 67500 **success** 2026-05-12 17:14 | Built & proven. Pre-v3. |
| L2 Classify (canonical) | Canonical AAV Discovery - L2 Classify | `rXKuqfDwqX7TYzxK` | false | exec 67512 **success** 2026-05-12 17:44 (2 prior errors) | Built but cannot consume v3 rules. |
| L2 Classify (DUPLICATE) | Canonical AAV Discovery - L2 Classify | `HUpkdwNTBcDutT8o` | false | **0 executions ever** | Dead duplicate. Recommend Nick archive (MCP can't delete). |
| Enrichment (monolith) | Companies Enrichment (Explorium → Airtable) | `Z6RROKx5omdfvhtn` | false | exec 72396 **success** 2026-05-14 17:26 (55 execs total) | Out of scope to run; architecture is a gap. |
| Enrichment (agent variant) | Companies Enrichment via agent (Explorium → Airtable) | `LqYwYcastjKq0IJ5` | false | — | Not production. Note only. |

`9gcmEjq1lvOY2jZS` status resolved: it is the **L1 CT.gov pure-capture** workflow. Schedule trigger (weekly Mon 6am) present but never activated; runs only manual. Clean build, matches state-machine row 1.x: upserts Companies on Company Name, sets `Verification Status=needs_verification`, `Canonical Status=candidate`, no classification/filtering. Re-runnable as-is for the fresh pull.

## Build-vs-design gaps (plain)

1. **L2 cannot consume v3 rules. (blocker for Step 4)** `rXKuqfDwqX7TYzxK` "Apply Rules" reads `{Active}=TRUE()` from `tbl1HFYzezFYs5C3k` correctly, but then only extracts **two legacy named rows** (`disease_aav_collision_terms`, `canonical_aav_indications`) split on `|`. The v3 generator emits **51 typed rows** keyed by `Rule Category` (positive/negative/disambiguation/definition) + `Rule Weight`. Current code ignores Category/Weight entirely. The 35-variant vasculitis exclusion and dormancy rule are invisible to it. L2 must be rebuilt to a category/weight evaluator. This is the primary Step 4 build, not a tweak.

2. **L2 candidate scope can't reclassify the 631.** "Read Candidates" filters `{Verification Status}='needs_verification'` only. The 631 contaminated rows are mostly `surfaced`/`borderline`/`rejected` (Nkarta = `borderline`). Per the state-machine halt invariant those never auto-advance, and this filter excludes them anyway. **Reclassify-in-place is impossible with the current workflow.** Step 4 needs an explicit re-queue design (clear the 631's `Verification Status` → `needs_verification`) or a broader read scope — a design decision to surface to Nick.

3. **L2 outputs don't match state-machine 2.3.** It writes `Verification Status`, `Vector Evidence Clause`, `Rejection Reason`, `Classification Version/Run Date/Notes`. It does **not** write `Custom Classification`/`AAV Segment` or any `Enrichment Status`. There is **no `archived_out_of_industry` path** in L2. The handoff's required outcomes — bread company → `archived_out_of_industry`, Nkarta → `rejected` with a *vasculitis* `Rejection Reason` — are **not producible by current L2**: it emits a fixed token `disease_AAV`, not the 35-variant reason, and has no archive branch. Bread-company archival today only happens inside the enrichment monolith's biotech gate (out of scope, spend-gated).

4. **2.2 Match & Verify has no standalone workflow.** Explorium match → `Explorium Business ID` → `surfaced` is fused inside the enrichment monolith, post-classification. State machine wants it separable and pre-enrichment. Gap.

5. **Enrichment monolith is a second rules source.** `Z6RROKx5omdfvhtn` does match → firmographics → biotech gate → web fetch → AAV modality → deep enrich in one workflow, with its **own hardcoded modality/biotech logic** (it never reads `tbl1HFYzezFYs5C3k`). That is exactly the parallel-source contamination the contract forbids. Also: mixed gate versions in-code (`1.6.0` and `1.7.0` in different nodes; description says `1.6.0`), and its trigger input is hardcoded to **10 specific record IDs** (a test batch, not general intake). Not run this step; flagged for Nick's Step 5 scoping.

## Net

L1 is real and reusable. L2 exists in name only relative to v3 — it rides the dead 2-row legacy format and must be rebuilt to the v3 category/weight schema, given a reclassify path for the 631, and an `archived_out_of_industry`/typed-`Rejection Reason` branch to satisfy the handoff acceptance tests. 2.2 needs extraction from the monolith. The enrichment monolith stays untouched (spend gate) but is the architectural debt behind Step 6.

**Stop here per instruction. This report is the input to the Step 4 build/scope decision (held for Nick's review).**
