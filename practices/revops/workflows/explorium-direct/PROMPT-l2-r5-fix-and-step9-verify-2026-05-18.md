# Explorium-Direct build prompt — L2 R5 fix + Step 9 Verify workflow (2026-05-18)

Self-contained. Do not rely on prior chat. The spec source of truth is the criteria artifact v4, R5:
`accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` → Part 2 "CT.gov trial evidence (L2)" + disambiguation rule 2 + Part 3 change-log v4 / R5.

Base: RevOps Surface `appYBYH3aOHhTODAw`, Companies `tblnj3YlOI3thjrXp`. L2 workflow: `rXKuqfDwqX7TYzxK`. L1 workflow: `9gcmEjq1lvOY2jZS`. Run log: Enrichment Runs `tblEVSEqetmu4ScHe`.

## Why (the failure, named)

L2's CT.gov trial-evidence gate surfaces a company if a sponsored trial's *condition* is a canonical AAV indication and no vasculitis term hits. It never checks the trial is an AAV *product*. Manual ground-truth of all 35 surfaced companies (clinicaltrials.gov API v2, 2026-05-18) found the false-positive class: Pfizer (NCT03587116 = standard-of-care factor replacement), Ultragenyx (NCT04909346 = anti-AAV antibody study), Baxalta (NCT03185897 = AAV seroprevalence, also defunct entity). 28/35 were genuine. Per-record proof is already written to Companies `Verification Verdict` / `Verification Evidence` / `Verification Checked At`.

## Build 1 — L2 R5 gate fix (modify `rXKuqfDwqX7TYzxK`)

Replace the single-clause condition test with the R5 three-clause gate. A trial qualifies as AAV product evidence only if ALL hold:

1. `protocolSection.designModule.studyType == "INTERVENTIONAL"`. Reject `OBSERVATIONAL`.
2. Condition match unchanged: ≥1 canonical AAV indication AND 0 disease-AAV exclusion terms (existing logic, keep as-is).
3. ≥1 intervention in `protocolSection.armsInterventionsModule.interventions[]` with `type` in {`GENETIC`,`BIOLOGICAL`} (or `COMBINATION_PRODUCT` whose components include one) AND whose `name` matches an AAV/gene-therapy token: `aav`, `adeno-associated`, `-parvovec` (stem), `gene therapy`, a serotype/vector token, or a known AAV product name. Reject if the only interventions are standard-of-care / replacement therapy / placebo / sham / device-only / `OTHER` non-treatment.

A trial failing clause 1 or 3 does NOT get the high-confidence trial-evidence pass and does NOT skip the website gate (disambiguation rule 2 is now conditioned on a qualifying trial — see artifact). Route a company whose only evidence was a now-failing trial to `needs_aav_review`, not auto-surface.

Data dependency: clauses 1 and 3 need `studyType` and `interventions[]`, which L1 (`9gcmEjq1lvOY2jZS`) does not currently capture. Choose ONE, your call, but state which and why in the PR notes:
- (a) L1 captures `studyType` + an interventions summary (type + name) per NCT into new Companies fields; L2 reads them. Cheaper per L2 run, but L1 must re-pull.
- (b) L2 re-fetches the cited NCT(s) from clinicaltrials.gov API v2 at classify time. Decoupled, always fresh, no L1 change. Slower L2.
Recommendation: (b) — it shares the exact fetch the Verify workflow needs (Build 2), so build the fetch once and reuse.

## Build 2 — Step 9 Verify workflow (new workflow)

New workflow, not a modification. For every Companies row with `Verification Status = surfaced`:
1. Read its `CT.gov NCT IDs`.
2. Fetch each NCT from `https://clinicaltrials.gov/api/v2/studies/{NCT}` (fields: identificationModule, designModule, armsInterventionsModule, sponsorCollaboratorsModule).
3. Apply the R5 three-clause test.
4. Write: `Verification Verdict` (`Confirmed` if ≥1 cited trial passes all 3 R5 clauses; `Not confirmed` if NCT(s) stored and none pass; `Needs review` if no NCT stored). Test ALL cited NCTs on a row, not just the first. `Verification Evidence` (plain client-readable: NCT + trial title + intervention + the verdict reason); `Verification Checked At` (run date).
   - **Verify is trial-evidence-only (Q2 ruling, agentic-systems 2026-05-18).** It does NOT adjudicate corporate status. "Defunct/acquired entity" (e.g. Baxalta→Takeda) is the Part 1 disqualifier "Acquired or operationally abandoned company", evaluated at the enrichment/firmographic stage — NOT by Verify. Do not make Verify infer defunct status from CT.gov; it cannot and must not.
   - The regression target is `ORACLE-verification-35-2026-05-18.json` (this folder), NOT the live Airtable fields (Verify overwrites them). Each oracle row carries a `repro_class` and `divergence_expected` flag. `divergence_expected: true` rows (domain_knowledge, firmographic_defunct, gene_editing) are EXPECTED to differ from the oracle and must not be treated as regressions or "fixed" — the oracle's `_meta.Q2_ruling_repro_class` defines why for each class.
5. Write one receipt row to Enrichment Runs: Run Type = a new `verify` value, counts by verdict, workflow + execution ID. This is the Step 9 "Verify" deliverable.

Idempotent: re-running overwrites verdicts cleanly, no duplicate Companies rows, exactly one Enrichment Runs receipt per execution (do NOT replicate the known duplicate-run-log bug — Prepare/Write receipt fires once per execution, not once per item).

## Hard constraints (n8n-safe-update protocol applies)

- `update_workflow` via the MCP **wipes credentials** and **corrupts Airtable update-node mappings** (injects zeros, drops sparse clears) and the API returns **500 on success**. After any update: republish the draft, reattach the `may 26 all bases` credential to every write node, and read back the deployed node config field-by-field before trusting it. All Companies writes must be HTTP-PATCH (builder-immune), never the Airtable update node.
- No pinned/simulated tests. Only real n8n executions count. State the manual steps Nick must do (credential reattach, publish) before any real run.
- No paid enrichment. Both builds are clinicaltrials.gov reads only (free). No Explorium/provider spend. Do not trigger any enrichment workflow.
- Gate #1 before any full run: deployed-config PATCH-body read-back, and a real small smoke (re-verify a known Confirmed like CSL Behring NCT03569891 and a known Not-confirmed like Pfizer NCT03587116) before the full surfaced set.

## SUPERSEDING CORRECTION (read first)

`ORACLE-CORRECTION-2026-05-18b.md` (this folder) is authoritative over the JSON oracle's verdict semantics and acceptance test. R5/Verify is modality-only; multi-NCT any-pass stands; Pfizer/Ultragenyx are correctly `Confirmed` (AAV) and their JSON `Not confirmed` rows are void. Big-pharma exclusion is the separate size/ICP gate, not Verify. Use the corrected acceptance test below.

## Acceptance test (goal-backward) — per ORACLE-CORRECTION-2026-05-18b.md

After the L2 fix re-runs over the CT.gov cohort: Pfizer and Ultragenyx no longer surface (route to `needs_aav_review` or rejected); the `in_record_machine` confirmed companies still surface. After the Verify workflow runs: every surfaced row carries a `Verification Verdict` + evidence + date. Diff against `ORACLE-verification-35-2026-05-18.json`. PASS criteria (from the oracle's `_meta.acceptance_test_restated`): (1) Pfizer + Ultragenyx → `Not confirmed`; (2) every `in_record_machine` row stays `Confirmed` (no regression); (3) `no_nct` rows → `Needs review`. Rows flagged `divergence_expected: true` are NOT required to match — those divergences are explained per-row and are correct conservative behavior, not bugs. If a `divergence_expected: false` row disagrees with the oracle, the workflow is wrong — investigate before trusting.

Return the build for review before any full run. No build/run/spend past the gates without Nick's go.
