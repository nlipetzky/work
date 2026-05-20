# Proposal: criteria artifact → Classification Rules generation contract

**Date:** 2026-05-15
**Status:** APPROVED WITH AMENDMENT 2026-05-15 (agentic-systems, plan `we-are-aligned-draft-zany-hamming`). See Approval section at end. The §3 gate is split into two flags: generation runs on v3 *pending-ratification* to produce a REVIEW cohort; OUTBOUND consumption still waits for Ellie v-confirm.
**Owner of the generator itself:** agentic-systems session. This doc only proposes the contract so we review it here before anything writes to the table.

---

## The problem this prevents

We just de-fragmented three markdown files into one criteria artifact. The Classification Rules table (`tbl1HFYzezFYs5C3k`, "consumed by L2/L3 workflows at runtime") is a fourth place rules could live. If workflows read it and humans also hand-edit it, it becomes an unsynced parallel source ... the exact failure we just eliminated, reintroduced one table over.

The rule: **one authorable source (the artifact), N derived projections.** The detection node is one projection. This table is another. Neither is authored; both are generated.

---

## Contract

### 1. Source of truth
The criteria artifact Part 2 detection layer, repo markdown at `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`. Canonical, human-approvable, version-controlled. The only authorable source.

### 2. Direction
One-way: artifact → `tbl1HFYzezFYs5C3k`. Never the reverse. The table is never hand-edited. A hand edit is a contract violation, not a shortcut.

### 3. Gating (the confident-garbage guard)
Generation runs **only** from an artifact version whose changelog marks Part 2 expert-confirmed (Ellie sign-off, v3+). The current v2 Part 2 is synthesized, not confirmed ... it must **not** be projected into the table. Unvalidated judgment must never reach a live gate.

### 4. Ownership
The generator is defined and run in the agentic-systems session. Explorium-Direct never writes the table and never reads the artifact directly for rules. Explorium-Direct workflows read the table read-only at runtime, and only when a version-validated flag is set.

### 5. Mapping (shape only; agentic-systems defines the semantics)
Part 2 detection entries → Classification Rules rows, using the real columns:

| Artifact Part 2 element | Classification Rules field | ID |
|---|---|---|
| Detection rule identifier | Rule Name | `fldQ3pdiF8OTe9nvI` |
| Signal class (positive / negative / disambiguation / definition) | Rule Category | `fld1iLUQpKRGGEcoo` |
| Term / regex / threshold | Rule Value | `fldtcbGr2IarmpFCf` |
| Recall/precision bias → weight | Rule Weight | `fldG9XO7MrIdmyNsm` |
| Confirmed flag | Active | `fld3NB4Cfmg804w2c` |
| Artifact filename + version | Source Doc | `fldnwXyCG2mV0mVHJ` |
| Provenance / why | Notes | `fld1sfYPlIjIa0CMu` |

`Rule Category` is an existing singleSelect; its option semantics are agentic-systems' to define against the artifact schema, not mine to author. Shown here as mapping shape only.

### 6. Idempotency
Full regenerate-and-replace per artifact version. Every row stamped with the artifact version in `Source Doc`. No incremental hand-patching, no partial merges. A version bump replaces the projection wholesale so the table can never drift from the artifact.

### 7. Explorium-Direct runtime contract
- Workflows read `tbl1HFYzezFYs5C3k` read-only.
- Consumption gated on the version-validated flag (set only when the projected version is Ellie-confirmed).
- No fallback path that reads the artifact directly or hand-edits the table.
- If the flag is absent, gates that depend on Part 2 rules **do not run** ... they halt, per the load-bearing invariant. Absence of validated judgment is a halt, never a default-through.

---

## What I need from you

1. Approve or amend this contract.
2. Confirm the generator is agentic-systems-owned (my read of your directive; stated here for the record).
3. The version-validated flag: where does it live? Options ... a row in the tenant config table, a sentinel in `Source Doc`, or a Playbook field. Recommend the tenant config table for auditability. Your call.

Nothing writes to the table until 1-3 are settled and an Ellie-confirmed artifact version exists. I will not build the generator; that is agentic-systems scope.

---

## Approval (2026-05-15, agentic-systems)

**1. Contract approved, with one amendment.** §3 splits into two flags, not one:
- `review-validated` — set when the v3 *machine-resolved* subset is projected (pending-ratification). Lets L2 classification and the review cohort run. This is the push-forward loop: producing the review cohort is how Ellie gets v3-qualified data to confirm. Not a contract violation.
- `outbound-validated` — set only when Ellie v-confirms (artifact changelog shows R-items ratified). Lets cadence/outbound run.
The confident-garbage guard is intact: unratified judgment never reaches *outbound*. It may reach the *review surface*, which is its entire purpose.

**2. Generator is agentic-systems-owned.** Confirmed for the record.

**3. Validated-flag home.** There is no dedicated tenant-config table in `appYBYH3aOHhTODAw`. The per-play config home is the **Playbook table (`tbli5DqoRR8jpHuo6`)**. Canonical source of truth for what is validated remains the **artifact Part 3 change log** (per the schema); the Playbook value is a runtime mirror. Proper typed fields (`review-validated`, `outbound-validated`) on Playbook are a schema change and therefore a **Nick decision**, held under the same gate as `Contact Sourcing Status`. Interim, non-blocking: the state is carried as a structured line in the existing Playbook `Notes` field for this play, so the pipeline is not blocked while the field decision is pending.

**Projection rule for the generator (binding):** project stable Part 1/Part 2 + Part 3 R-items (R1 35 vasculitis variants, R2 Amgen/Fate/Nkarta exclusion, R4 dormancy). **Exclude every Part 3 "To answer" Q-item**, Q6 CNS / candidate indications especially. M1/M2 are non-blocking parallel cleanup, not gating. Every projected row stamped `Source Doc` = `revops-segment-aav-gene-therapy-ellie-outreach.md v3 pending-ratification`.

**Explorium-Direct is unblocked** to begin the workflow audit (plan Step 3) in parallel. Do not consume Classification Rules until the generator has run and `review-validated` is set; do not enable outbound until `outbound-validated`.
