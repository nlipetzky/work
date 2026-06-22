---
type: new-node + engine-fix
system: signal-prospecting
lifecycle: engineering
evidence: practices/agentic-systems/HANDOFF-mrna-session-state-2026-06-11.md
also:
  - systems/revops-engine/verify-runner.mjs
  - systems/revops-engine/lib/db-batch.mjs
  - systems/revops-engine/lib/ai-call.mjs
proposed: "Admit the Verify node (evidence-gated qualification) to the flow between Screen and Promote; confirm the batched-write engine fix as the standard write path for the per-row runners."
created: 2026-06-11
---

## What changed this session (engine)

1. **Verify node — a new evidence gate.** `verify-runner.mjs` + a play `verify-prompt.md` (the proven ngAbs
   site-verification pattern, mRNA-adapted): fetches the company's OWN site, extracts every North-American
   site, classifies each (`rnd_wetlab | process_dev | gmp_mfg | qc_analytical | sales_admin | unclear`) with
   an evidence URL, reconfirms the mRNA program, and recomputes `prep_qualified` deterministically (a real NA
   lab evidenced AND mRNA not contradicted). Confirms ONLY from fetched content — inference flags, evidence
   confirms. Proven on the 140-batch (12 evidenced vs 43 inferred; caught real false positives). Belongs on
   the flow as **Screen → Flag-resolve → Verify → Promote**; the surface renders the `qualified` chip + a
   per-site evidence drawer (`projection-ui/app/staging/page.tsx`).

2. **Batched-write engine fix (the §6.1 wall).** Per-row Management-API writes 429-walled a 572-row batch and
   the classifier marked throttled rows as permanent `semantic_error` while exiting 0 (false "done"). Fixed:
   `lib/db-batch.mjs` (one `UPDATE … FROM (VALUES …)` per 25 rows) + `lib/ai-call.mjs` (shared Anthropic call
   with 429/529 backoff + loose-JSON parse); both runners adopted it. Big batches now complete in one pass.

## State left for the next session

`staging.companies_mrna_2026_06_11` (wide keyword net, 572): SCREEN COMPLETE — 94 IN / 3 NARROW / 79
NEEDS_REVIEW (176 candidates) / 446 OUT. **Verify not yet run on this net** — that is step 1 next session.

## What approval means

Add Verify to the flow/assets on the system record (evidence-gated qualification is the contract: "qualified"
means verified, everywhere — surface, counts, client artifacts). Confirm batched writes as the standard path
and retire the per-row pattern in remaining runners/loaders.
