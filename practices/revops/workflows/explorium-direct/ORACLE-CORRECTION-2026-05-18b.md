# Oracle correction — supersedes ORACLE-verification-35-2026-05-18.json verdict semantics

**Date:** 2026-05-18 (later same day)
**Reason:** Explorium-Direct, building Verify, ground-truthed Pfizer's 5 cited NCTs against live CT.gov and surfaced a load-bearing contradiction in the original oracle. The contradiction is real. This document is the authoritative correction. The original oracle JSON is retained unaltered as the record of the 2026-05-18 manual pass and its now-identified methodological flaw.

## The flaw in the original manual pass

The 2026-05-18 hand validation checked, for each surfaced company, only the **single cited surfacing trial**. When that trial was weak (standard-of-care, observational, antibody), the company was marked `Not confirmed`. That conflated two distinct questions:

- **Modality:** is this an AAV gene therapy company? (what R5 / Verify answers)
- **Cohort worthiness:** should this company reach the client? (modality AND size/ICP AND disqualifiers)

Pfizer is a genuine AAV gene therapy company (fordadistrogene movaparvovec, giroctocogene fitelparvovec; 3 of its 5 cited NCTs are clean AAV interventional trials in canonical indications). The original false positive was never "Pfizer isn't AAV." It was "the system cited the wrong trial as Pfizer's evidence." Same for Ultragenyx (DTX301/DTX401 AAV programs; the cited trial was an observational antibody study).

## Corrected verdict semantics

1. **R5 / Verify is modality-only.** A company is `Confirmed` if ANY of its cited NCTs passes all three R5 clauses. Multi-NCT any-pass stands (it was the correct instruction).
2. **`in_record_machine` definition holds:** an NCT passes clause 3 if the AAV / gene-therapy token is in the trial **title OR an intervention name** (Bayer NCT03588299 passes on title; do not regress it to intervention-name-only).
3. **Pfizer and Ultragenyx → `Confirmed` (AAV) is CORRECT.** The original oracle rows marking them `Not confirmed / divergence_expected:false` are **void**. Treat as superseded.
4. **`Verification Evidence` must cite an NCT that actually passes R5**, not the weak surfacing trial. For Pfizer that means citing its real AAV trial (e.g. NCT04370054 / NCT02484092 / NCT03362502), not NCT03587116.

## The exclusion that still must happen (separate gate)

Pfizer, Bayer, Novartis Gene Therapies, Biogen, CSL Behring, BioMarin, Ultragenyx are all genuine AAV companies AND all fail the **company size / ICP hard filter** (top-20 global pharma, or >2,000 employees, not an AAV CDMO) defined in the criteria artifact Part 1. They must be excluded from the client cohort **via that filter**, not by misclassifying their modality. `Confirmed-AAV` + `ICP-excluded` is the correct end state.

Verify does NOT apply the size/ICP filter. That is the next gate (the long-deferred ICP/fit layer). Until it exists, "Confirmed-AAV" is not equivalent to "client-ready" and must not be presented as such.

## Corrected acceptance test (authoritative; replaces the JSON's `_meta.acceptance_test_restated`)

Verify PASSES if:
1. **Per-trial:** standard-of-care / observational / antibody / registry trials fail R5 individually (NCT03587116 fails clause 3; NCT04909346 fails clause 1). This is the real regression guard.
2. **Per-company:** a company with ≥1 cited NCT passing all 3 clauses → `Confirmed`. A company whose every cited NCT fails → `Not confirmed`. No NCT stored → `Needs review`.
3. **Evidence integrity:** the written `Verification Evidence` cites a passing NCT, not the weak surfacing one.
4. Pfizer and Ultragenyx are expected `Confirmed` (modality). Their removal from the client cohort is the size/ICP gate's job, evaluated separately.

The original JSON's per-row `expected_machine_verdict` values remain useful for the `in_record_machine` and `no_nct` classes. The `domain_knowledge` rows still route to `Needs review` under multi-NCT R5 unless a non-first cited NCT carries an in-record token (test all NCTs — some will legitimately flip to `Confirmed`). The `firmographic_defunct` (Baxalta) and `gene_editing` (Precision) divergence notes still hold.

## Knock-on: client-facing methodology doc needs correction

`/Users/nplmini/code/work/accounts/clients/teknova/methodology-outline-2026-05-18.md` currently states the verification "caught two large companies (Pfizer, Ultragenyx) whose flagged trials turned out to be ... not AAV treatments." Under this correction that statement is misleading: they ARE AAV companies; what was caught was a wrong-trial-citation, and they are excluded on size, not modality. That doc must be corrected before the client conversation.
