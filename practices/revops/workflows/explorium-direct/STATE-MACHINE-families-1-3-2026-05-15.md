# Status-field state machine: Families 1-3 (reconciled to live schema)

**Date:** 2026-05-15
**Scope:** Cursor model and legal transitions for source, enrichment, contact workflows. Mechanical only.
**Grounding:** All option strings below were read live from RevOps Surface (`appYBYH3aOHhTODAw`) on 2026-05-15 via `get_table_schema`. Nothing invented.

---

## Live option strings (read 2026-05-15)

**Companies `Enrichment Status` (`fldyfIr4H4lSIYZdC`):**
`enrichment_complete`, `enrichment_incomplete`, `disqualified`, `held_for_review`, `cadence_ready`, `disqualified_non_biotech`, `rerouted_wrong_modality`, `archived_out_of_industry`, `needs_aav_review`, `needs_data_quality_review`

**Companies `Verification Status` (`fldirGjP6bjd5GCaL`)** ("L2 classification outcome"):
`surfaced`, `borderline`, `rejected`, `needs_verification`

**Companies `Canonical Status` (`fldNGF6RLdUqIKrzM`):**
`canonical`, `candidate`, `archived`

**Contacts `Enrichment Status` (`fldlB5OesdxKfk5wL`):**
`enrichment_complete`, `enrichment_incomplete`, `disqualified`, `held_for_review`, `cadence_ready`

**Contacts `Email Verified Status` (`fldjV4B9bGsXwEfi9`):**
`verified`, `catch-all`, `unverifiable`, `invalid`

---

## The reconciliation finding (this changes the model)

The earlier draft proposed a granular progress cursor (`domain_resolved` → `verified` → `classified` → `enrichment_complete`). **The live data says that is the wrong design.**

`Enrichment Status` is not a progress cursor in this base. It is a **coarse outcome bucket**: complete / incomplete / disqualified / held / cadence-ready, plus modality-specific archive reasons. Progress through the pipeline is already tracked by **companion stamp fields** that exist on Companies:

- `Domain` + `Domain Last Verified` (`fldFNeVqgRM2iyPSG`)
- `Explorium Business ID` (`fld5VgnZC0Vxf613q`) + `Verification Status` + `Rejection Reason`
- `Custom Classification` / `AAV Segment` + `Classification Version` + `Classification Run Date`
- `Segment Score` + `Segment Version` + `Segment Run Date`
- `Last Enriched At` + `Gate Version`

Adding a parallel granular cursor would fragment state across two systems ... the exact failure pattern we just spent this effort eliminating in the criteria artifact. So the model bends to the live schema, not the reverse.

---

## Reconciled model: stage is a derived predicate, not a stored value

Workflows do **not** read a single cursor value to decide whether to act. Each workflow evaluates a **precondition predicate** over fields that already exist, and writes only the coarse outcome plus its own companion stamp.

| Workflow | Runs when (derived precondition) | Writes on success | Writes on halt |
|---|---|---|---|
| 1.x Source | record absent (dedupe miss) | insert; `Enrichment Status` = `enrichment_incomplete` | n/a |
| 2.1 Resolve Domain | `Domain` empty OR `Domain Last Verified` stale | `Domain`, `Domain Last Verified` | `Enrichment Status` = `needs_data_quality_review` (no domain) |
| 2.2 Match & Verify | `Domain` present AND `Verification Status` ∈ {empty, `needs_verification`} | `Explorium Business ID`, `Verification Status` = `surfaced` | `Verification Status` = `borderline`/`rejected`; `Rejection Reason`; `Enrichment Status` = `needs_data_quality_review` or `archived_out_of_industry` |
| 2.3 Classify | `Verification Status` = `surfaced` AND `Custom Classification` empty | `Custom Classification`/`AAV Segment`, `Classification Version`, `Classification Run Date` | `Enrichment Status` = `rerouted_wrong_modality` or `disqualified_non_biotech`; `needs_aav_review` for ambiguous |
| 2.4 Deep Enrichment | classification present AND (`Last Enriched At` empty OR `Gate Version` < current) | deep fields, `Last Enriched At`, `Gate Version`; `Enrichment Status` = `enrichment_complete` | `Enrichment Status` = `enrichment_incomplete` |
| 3.1 Find People | `Enrichment Status` ∈ {`enrichment_complete`,`cadence_ready`} AND zero linked `Contacts` | insert Contacts, `Enrichment Status`(contact) = `enrichment_incomplete` | `needs_aav_review` (no candidates) on Company |
| 3.2 Enrich Contact | Contact `Enrichment Status` = `enrichment_incomplete` AND `Email` empty | `Email`, LinkedIn, employment; keep `enrichment_incomplete` | `held_for_review` |
| 3.3 Validate Contact | Contact `Email` present AND `Email Verified Status` empty | `Email Verified Status`; `Enrichment Status`(contact) = `cadence_ready` if pass | `disqualified` (email invalid / out of ICP) |

Net new singleSelect options required: **zero**. Net new fields required: **zero** (see Contact Sourcing note below). The model rides what exists.

---

## The load-bearing invariant (unchanged, now expressed against live values)

Halt states never auto-advance. A workflow may only move a record forward from a clean precondition. These are halts; only a human or an explicit re-queue clears them:

- Companies `Enrichment Status` ∈ {`held_for_review`, `needs_data_quality_review`, `needs_aav_review`}
- Companies `Verification Status` ∈ {`borderline`, `needs_verification`}
- Contacts `Enrichment Status` = `held_for_review`

No workflow treats `borderline` or `needs_*` as a pass. This is the anti-confident-garbage rule at the state level, and it now maps onto the field values that actually exist.

---

## Verification verdict: reuse the 4 live values, do not expand

The earlier draft proposed a `review_geography`/`review_entity`/`review_sector`/`review_criteria` taxonomy. Reconciled: **keep the 4 live `Verification Status` values** (`surfaced`/`borderline`/`rejected`/`needs_verification`) and carry the granular reason in the existing free-text `Rejection Reason` (`fldlt7fAcZUJg8RES`). The reason taxonomy lives in text, not in new options. Less invention, reuses wired fields.

---

## Reconciliation outcomes (the four items)

1. **Live option strings.** Read and reported above. Under the derived-predicate model, **no option migration is needed** ... the heavy item dissolves by not fragmenting. The pipeline writes only values that already exist.
2. **`Contact Sourcing Status` new field.** HELD per Nick (schema change needs explicit approval). Under the derived model it is likely **unnecessary**: "ready for contact sourcing" = Company `Enrichment Status` ∈ {`enrichment_complete`,`cadence_ready`} AND zero linked `Contacts`. Recommend deriving it and creating **no** new field. Decision deferred to Nick.
3. **L3 boundary.** `Canonical Status`, `Segment Score`/`Segment Version`/`Segment Run Date`, `Outreach Eligible`, `Hard Filters Pass` are the existing L3/handoff layer, downstream of Family 2.4. Proposal: Family 2 never writes them. A separate handoff/L3 workflow owns them, gated on `Enrichment Status` = `enrichment_complete`. Family 2 stops at `enrichment_complete`; L3 promotes to `cadence_ready` + `canonical`. Boundary stated explicitly so it is not silently absorbed.
4. **In-flight record backfill.** Under the derived model, **minimal**: existing records already carry `Domain`/`Verification Status`/classification/`Last Enriched At`, so the preconditions evaluate correctly with no status remap. Records in `archived_out_of_industry` from the wrong-entity bug are the only re-queue set (clear `Verification Status` → `needs_verification`, let 2.1/2.2 re-run). Counts pulled at migration time via filtered count queries, never a full table list (token discipline; `list_records_for_table` has overflowed this table before).

---

## Summary

The live schema already separates coarse outcome (`Enrichment Status`) from verdict (`Verification Status`) from per-stage stamps. The state machine rides that: stage is a derived precondition over existing fields, not a new stored cursor. Zero new options, zero new fields, the halt invariant intact and mapped to real values. Three of four reconciliations resolve to "no migration"; `Contact Sourcing Status` stays held for Nick; the L3 boundary is proposed, not assumed.
