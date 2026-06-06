# Clay Table vs. ngAbs Playbook -- Alignment Note

**Source table:** `Biotech-Therapeutics-Antibody-Default-view-export-1780421260989.csv` (420 rows, 32 cols)
**Playbook:** `Teknova ngAbs Outreach Playbook_v1_2026.05.29.md`
**Date:** 2026-06-02

## What the Clay table is doing

A single-table sourcing workbook structured as: pre-filtered company universe -> AI modality classifier -> evidence/role/modality typing -> event signals (trials, press, jobs, conferences) -> Airtable upsert.

The table is the operational expression of the playbook's **Section 5 company gates (G1-G5)**, plus the modality mapping in **Section 2**. Contact-level work (Section 4.2 titles, Section 6 LinkedIn/CRM checks) is downstream and not yet in scope.

## Gate-by-gate fit

| Playbook gate | Column(s) carrying it | Status |
|---|---|---|
| G1 modality fit | `Has ngAbs Program` (yes/no/unclear), `Confidence`, `Evidence Quote`, `Modality Types`, `Role`, `Company Research Narrative` | Architecture matches; classifier records the verdict + cited evidence per gate-row, exactly what the playbook demands. |
| G2 active development | `Antibody Trials Summary`, `ngAb Press Mentions`, `Mfg & Process Job Openings`, `Conference Participation` | Four orthogonal liveness signals -- stronger than the playbook's "pipeline OR trial OR pub OR hiring OR funding" threshold. |
| G3 NA footprint | `Country`, `HQ_STATE`, `HQ_CITY`, `Location` | 420/420 rows are US/Canada/Mexico. Pre-filtered upstream, not gated by Clay. Caveat: playbook says HQ alone doesn't satisfy G3 -- needs wet-lab/PD/mfg confirmation. Not yet checked. |
| G4 reagent relevance | `Role`, `Modality Types`, `Company Research Narrative` | Covered indirectly via role typing (CDMO / developer / platform / not applicable). Pure-computational shops surface as "not applicable" -- 4 rows so far. |
| G5 not excluded | `Role = "not applicable"` acts as the soft exclusion | Functional but not explicit. No dedicated disqualifier column. |

## Modality coverage (Section 2)

`Modality Types` is free-text and captures ADCs, bispecific ADCs, multispecifics, radioimmunoconjugates, antibody fragments. Maps cleanly to playbook 2.2-2.4. No structured taxonomy column -- you cannot filter "show me bispecific ADC companies only" without parsing the string.

## Throughput status (this is the headline)

- **Classified so far:** 15 / 420 rows (3.6%)
- **Verdicts:** 10 yes, 4 no, 1 unclear (14 high-confidence, 1 medium)
- **Upserted to Airtable:** 6 / 420
- **Qualified NA + ngAbs=yes:** 10 confirmed

The table architecture is correct. The bottleneck is the AI classifier hasn't run on 405 of 420 rows. Sprint 1 commitment is to validate the prompt on a controlled subset before bulk-running the remaining ~400 (per yesterday's decision point).

## Gaps vs. playbook

1. **G3 wet-lab confirmation** -- no column verifies the NA address is a PD/mfg site, not a sales office or HQ shell.
2. **Catalog vs. custom claim discipline** -- playbook warns reps to position mammalian media as custom service, not stock SKU. No column captures whether the lead operates CHO/mammalian (which would make Teknova's pitch a custom-formulation engagement, not catalog). Useful for downstream copy.
3. **Modality Types is unstructured** -- single-select or multi-select would let downstream filtering by modality.
4. **No suppression/exclusion column** -- Section 3 exclusions (discovery-only, distributors, unrelated modality) are caught implicitly by `Role = "not applicable"` but there's no audit trail.
5. **Section 6 (contacts) not yet modeled** -- title screening, LinkedIn verification, and CRM 6-month suppression all live downstream of this company-qualification table.

## Verdict

The table is the right shape for the playbook's company-level gates and is producing high-confidence verdicts where it has run. The work to finish Sprint 1 is operational (run the classifier on the remaining ~400 rows after subset validation), not architectural.
