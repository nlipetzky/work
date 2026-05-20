# HANDOFF: scoped pipeline build (agentic-systems → Explorium-Direct)

**Date:** 2026-05-15
**From:** agentic-systems
**Plan:** `~/.claude/plans/we-are-aligned-draft-zany-hamming.md` (approved). This file is the build brief; the plan is canonical for sequencing.

## What's done (you are unblocked)

1. **Contract approved with amendment.** See `PROPOSAL-artifact-to-classification-rules-contract-2026-05-15.md` Approval section. Two flags, not one:
   - `review-validated` — SET (the v3 machine-resolved subset is projected, pending-ratification). L2 classification and the review cohort may run.
   - `outbound-validated` — NOT set. No cadence/outbound until Ellie v-confirms (artifact changelog R-items ratified).
2. **Generator run. Classification Rules (`tbl1HFYzezFYs5C3k`) is now v3.** 51 `Active=true` rows, all `Source Doc` = `revops-segment-aav-gene-therapy-ellie-outreach.md v3 pending-ratification`. The old 48 are `Active=false`, `Source Doc` stamped `SUPERSEDED 2026-05-15 ... safe to bulk-delete` (Nick deletes them; MCP can't).
3. **Generator source of truth:** `classification-rules-v3-projection.json` in this folder. Regenerate-and-replace per contract §6 runs from that file.

## Binding constraints (do not deviate)

- **Consume `Active=true` only.** The 48 tombstones are inert by design; never read them. This is the contract §6 reconciliation: deactivate-not-delete because only Nick can delete.
- **`parent_company_domain` is `Active=false` on purpose** (Part 3 M2: domain list not yet extracted). Do not activate it. The parent-company short-circuit (disambiguation rule 1) is therefore not enforced this run — acceptable, flagged.
- **No outbound.** `outbound-validated` is unset. L1/L2/enrich and the review cohort only.
- **No enrichment without Nick's Step 5 spend gate.** Hard rule. Handoff/prior context does not authorize spend.

## Your build scope (plan Steps 3-4-6)

**Step 3 (now, parallel):** audit live n8n workflows. What L1 (CT.gov), L2 (classify), enrichment workflows exist; status of `9gcmEjq1lvOY2jZS` (inventory says "needs audit"). Report build-vs-design gap. No build yet.

**Step 4 (after audit):** build/scope the minimal pipeline, riding the derived-predicate state machine (`STATE-MACHINE-families-1-3-2026-05-15.md`):
- L1 CT.gov source — config exists (`Sources` row `clinicaltrials_gov`, active, trust 5, `query.intr=AAV`, auto-add 0.9).
- L2 classify against the v3 Classification Rules (read-only, `Active=true` filter).
- Run over BOTH: (a) the 631 existing Companies rows = reclassify in place (purges the bread company → `archived_out_of_industry`; flips Nkarta → `rejected` with vasculitis `Rejection Reason` via the 35-variant `disease_aav_exclusion`); (b) a fresh CT.gov pull = supplement, dedupe on domain.
- Write `Verification Status` + classification + stamps per the state machine. **No enrichment in this step.**

**Step 5 is Nick's** — visibility + spend gate. You stop after Step 4 and report counts (surfaced/borderline/rejected, garbage purged, Nkarta flipped). Nick approves the enrichment scope/cap before Step 6.

**Step 6 (after Nick's approval):** enrich L2 survivors only, within the cap. Build the filtered Companies view (this `Play`, v3-classified, enriched, non-halt) — Ellie's surface, not the raw 631.

## Out of scope

Full provider waterfall, registry sources beyond CT.gov, Contacts (Family 3), orchestrators, Q-item/CNS expansions, M1 (Novartis/Tanabe alias re-query), M2 (parent-domain extraction). Deferred.

## Open item back to Nick (not blocking your audit)

Playbook-table typed fields for `review-validated`/`outbound-validated` are a schema change held under the same gate as `Contact Sourcing Status`. Interim: state rides Playbook `Notes`. Nick decides if/when the typed fields get created.
