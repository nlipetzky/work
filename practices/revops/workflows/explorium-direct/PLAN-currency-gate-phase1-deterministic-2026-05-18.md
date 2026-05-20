# Currency Gate — Phase 1 (Deterministic CT.gov) Implementation Plan

> **For the executing session:** This is a self-contained executable plan. You are a cold session with no memory of how this was designed. Read it top to bottom before touching anything. It ships an n8n workflow change through the `n8n-safe-update` skill + a raw deployed-config read-back gate. "Tests" here are **real executions + oracle diffs**, never pinned/simulated runs. Do not improvise beyond this plan; where it says STOP, stop and surface to Nick.

**Goal:** Make L2 Classify treat clinicaltrials.gov trial *currency* as a hard surfacing gate, so a company whose AAV-modality-passing trial is terminated/withdrawn/suspended (or stale) no longer surfaces as outreach-ready — it routes to review.

**Architecture:** Currency is a SECOND gate layered after R5 modality (which is solved — do not touch it). R5 answers "is this AAV gene therapy." Currency answers "is that AAV program still alive." Deterministic, CT.gov-data-only, zero spend. Announcement/exit intelligence (Exa/Perplexity) is Phase 2 and explicitly OUT of scope here.

**Tech stack:** n8n workflow `rXKuqfDwqX7TYzxK` (L2 Classify, prod); source build files in `practices/revops/workflows/explorium-direct/.build/`; RevOps Surface Airtable base `appYBYH3aOHhTODAw`, Companies table `tblnj3YlOI3thjrXp`; clinicaltrials.gov API v2 (free).

---

## Ownership, lane, and hard constraints (read before step 1)

- **Single writer:** L2 `rXKuqfDwqX7TYzxK` write-owner is the agentic-systems currency lane. Confirm no other session is mid-edit on this workflow before you start (System Registry base `apppQjlZiktpbO4aX` → Assets → "L2 Classify (v4 R5)"). If another lane holds it, STOP.
- **Never re-author the criteria artifact.** `accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` is v5, first-author-only. This plan PROPOSES rule R6 as text for Nick to ratify. You do NOT write R6 into the artifact. Surfacing R6 to Nick is a STOP gate (Task 5).
- **No spend.** CT.gov reads are free. Any Exa/Perplexity/Explorium call is Phase 2 — not in this plan. If you think you need a paid call, you've misread scope; STOP.
- **No full production run.** This plan builds + smokes on a bounded set. The full 121-row reclassify is a separate, Nick-gated roadmap item. Do not run L2 over the full Companies table.
- **n8n-mcp corrupts Airtable nodes.** Every workflow change ships via the `n8n-safe-update` skill, and the deployed config is verified by a raw field-by-field read-back (Task 4). `validate_workflow` does NOT catch the corruption; the raw read-back is mandatory, not optional.
- **Only real executions count.** No pinned-data or simulated "tests." Verification = a real smoke execution + an oracle diff (Task 4).

## Current state (surface-verified facts, do not re-derive)

- L2 `rXKuqfDwqX7TYzxK` is DEPLOYED, never run in prod; live Companies data is 2026-05-15 v3 vintage. Last successful exec 77423 (2026-05-15).
- R5 (modality, 3-clause: interventional + canonical condition + therapeutic gene-transfer intervention, any-pass across a sponsor's NCTs) is SOLVED and client-confirmed. Oracle: 28/35 surfaced companies confirmed true AAV; Pfizer & Ultragenyx are confirmed-AAV (their non-surfacing belongs to ICP/currency, NOT modality — per `ORACLE-CORRECTION-2026-05-18b.md`, authoritative over the JSON oracle).
- R4 (dormancy) exists but is decorative + "pending ratification": dormant = no interventional trial with start/last-update in last 5y AND no trial in Recruiting / Active-not-recruiting / Enrolling. It routes dormant→review but is NOT a hard surfacing gate and is blind to the two defects below.
- Companies fields already present (RevOps Surface, Companies `tblnj3YlOI3thjrXp`):
  - `Most Recent Trial Date` `fld8wCr8FI00xjqnz` — sole writer L1 `9gcmEjq1lvOY2jZS`, sole reader L2 R4.
  - `Active Recruiting` `fldIQZlyDRW10nWVE` — sole writer L1, sole reader L2 R4.
  - `CT.gov NCT IDs` `fldD2kbSLk3h0YlSp`; `Vector Evidence Clause` `fldjzarquZ6z8vQed`; `Verification Status` `fldirGjP6bjd5GCaL`; `Rejection Reason` `fldlt7fAcZUJg8RES`; `Classification Notes` `fldBBRTBbeHIv9iwN`; `Classification Version` `fldNzVjp9HX4BPo6l`.

## The two defects this plan closes

1. **Date-not-status blindness.** R4 keys on last-update date. CT.gov re-dates TERMINATED trials for safety follow-up, so a dead program looks current. Evidence: Adrenas ADventure trial last-updated Dec 2025 though BBP-631 was killed; Pfizer's terminated Duchenne trial similarly fresh-dated. Fix: a trial whose overall status is TERMINATED, WITHDRAWN, or SUSPENDED contributes ZERO currency regardless of how recent its last-update date is.
2. **No multi-NCT arbitration.** R5 is any-pass: a sponsor passes modality if ANY NCT clears the 3 clauses. Currency is never evaluated on the *same* trial that passed, and when several pass nothing forces the live one. Pfizer (5 trials, the terminated one "still passes"). Fix: currency is computed over the set of NCTs that passed R5 modality; the verdict is carried by the most-alive qualifying trial; a terminated/withdrawn/suspended trial can never carry currency even if it was the modality-passer.

## File structure

- **Modify:** L2 shared trial-test module `practices/revops/workflows/explorium-direct/.build/r5-trial-test-2026-05-18.ts` — add a pure `currencyOfTrial(trial)` + `currencyVerdict(modalityPassingTrials[])` alongside the existing R5 test. Pure functions, no I/O.
- **Modify:** `practices/revops/workflows/explorium-direct/.build/L2-applyRules-R5-2026-05-18.js` — call the currency verdict after R5 passes, set routing + the fields in the next task.
- **Modify:** `practices/revops/workflows/explorium-direct/.build/L2-rebuild-2026-05-18.ts` — the deploy/build wiring, only if the node graph changes (it should not; this is logic inside existing nodes).
- **Create (schema):** three Companies fields (Task 2).
- **Create (offline harness):** `practices/revops/workflows/explorium-direct/.build/currency-phase1-cases.ts` — the worked cases below as an offline assertion harness against the pure functions (this is allowed — it tests pure logic, not a pinned workflow run).
- **Create (proposal):** `practices/revops/workflows/explorium-direct/PROPOSAL-R6-currency-2026-05-18.md` — the R6 text for Nick. You do NOT touch the v5 artifact.

---

## Task 1: Read current source, confirm the R5 contract

> **RESOLVED 2026-05-18 (read-only investigation, agentId a6723adb73110a6c2). The fork is closed — the approach holds as written. Findings, cited:**
> - **R5 RETAINS the passing trial(s).** `r5VerifyCompany` returns `{ verdict, evidence, trials, passingNct }` in every branch (`.build/r5-trial-test-2026-05-18.ts:96,112,121,123`). `trials` is the full per-NCT result array (`{nct,pass,c1,c2,c3,studyType,reason,...}`); the modality-passing set = `trials.filter(t => t.pass)`. Only `passing[0]` is currently surfaced (`:108-112`) — the currency layer must derive the full set from the filter, not from `passingNct`.
> - **These are in scope at `.build/L2-applyRules-R5-2026-05-18.js:131`.** Call `currencyVerdict(trials.filter(t=>t.pass))` there. No change to R5's modality decision (`r5TestStudy`, `r5-trial-test:53`) is required.
> - **REQUIRED data change (the one real adjustment):** the CT.gov v2 fetch (`r5-trial-test-2026-05-18.ts:102`, mirrored in `L2-applyRules:53`) requests only identification/design/armsInterventions/conditions modules. `statusModule` is NOT fetched, so overall status, start date, and last-update date are absent on the trial object today. Add `protocolSection.statusModule` to the `?fields=` query. This is a fetch-scope change, not a change to the confirmed modality logic.
> - **Trial id is currently prose-only.** It is written into `Classification Notes` as text, never a structured field — consistent with Task 2 adding structured currency fields.
>
> Task 1 below is now confirmation, not open investigation. Verify the cited lines still match before building; do not re-derive from scratch.

(original Task 1 — confirmation pass)

**Files:** read-only — `.build/r5-trial-test-2026-05-18.ts`, `.build/L2-applyRules-R5-2026-05-18.js`, `.build/L2-rebuild-2026-05-18.ts`, `ORACLE-verification-35-2026-05-18.json`, `ORACLE-CORRECTION-2026-05-18b.md`.

- [ ] **Step 1:** Read all five files. Identify: the exact function R5 uses to test one trial; how a sponsor's NCT list is iterated; the exact shape of a `trial` object (field names for overall status, study type, start date, last-update date, conditions, interventions); where the Airtable write payload is assembled and the field IDs it writes.
- [ ] **Step 2:** Write down (in your working notes, not a file) the exact identifier R5 uses for "this trial passed modality." The currency layer consumes that set. If R5 does not currently retain *which* NCTs passed (only a boolean), that is a required change — note it; the verdict needs the passing-trial set, not just a boolean.
- [ ] **Step 3:** Confirm CT.gov v2 status vocabulary in the existing code: COMPLETED, TERMINATED, WITHDRAWN, SUSPENDED, RECRUITING, ACTIVE_NOT_RECRUITING, ENROLLING_BY_INVITATION, NOT_YET_RECRUITING, UNKNOWN. Use the exact strings the existing R5/R4 code already uses; do not introduce a parallel vocabulary.

## Task 2: Add the three Companies fields (schema, gated)

**Files:** RevOps Surface base `appYBYH3aOHhTODAw`, Companies `tblnj3YlOI3thjrXp`. This base is a `revops-engine` platform asset — visibility-before-automation applies: add fields, eyeball in the Airtable UI, before any workflow writes them.

- [ ] **Step 1:** Create `Currency Status` — singleSelect, choices exactly: `current`, `dormant`, `discontinued`, `unknown`. Description: "Deterministic CT.gov currency verdict (Phase 1). current = a modality-passing trial is live/recent and not terminated. discontinued = the modality-passing trial(s) are TERMINATED/WITHDRAWN/SUSPENDED. dormant = no terminated signal but stale per the staleness cutoff. unknown = insufficient CT.gov data. Sole writer: L2 (rXKuqfDwqX7TYzxK). Phase 2 announcement-intelligence may overlay this later."
- [ ] **Step 2:** Create `Currency Evidence` — multilineText. Description: "Plain-language proof for Currency Status: the NCT carrying the verdict, its overall status, its start/last-update date, and why. Client-presentable. Written by L2."
- [ ] **Step 3:** Create `Currency Checked At` — date. Description: "Date L2 computed Currency Status. Backs freshness."
- [ ] **Step 4:** Open the Companies table in the Airtable UI, confirm all three fields exist with the right type/options. Record their returned field IDs in your notes — the workflow writes by field ID.

## Task 3: Implement the deterministic currency logic (pure functions)

**Files:** modify `.build/r5-trial-test-2026-05-18.ts`; create `.build/currency-phase1-cases.ts`.

The algorithm — implement exactly:

`currencyOfTrial(trial)` returns one of `current` | `discontinued` | `dormant` | `unknown` for ONE trial:
- If overall status ∈ {TERMINATED, WITHDRAWN, SUSPENDED} → `discontinued`. (Status beats recency — defect 1. A fresh last-update date does NOT override this.)
- Else if overall status ∈ {RECRUITING, ACTIVE_NOT_RECRUITING, ENROLLING_BY_INVITATION, NOT_YET_RECRUITING} → `current`.
- Else if status ∈ {COMPLETED, UNKNOWN} → look at the staleness cutoff: if start date OR last-update date is within `STALENESS_YEARS` of run date → `current`; else → `dormant`.
- If status string is absent/unparseable → `unknown`.
- `STALENESS_YEARS` is a single named constant defaulting to **5** (matches the existing R4 default). It is the Q4 commercial-weight call owned by Ellie; do not hardcode it inline — one constant, commented as Nick/Ellie-tunable, pending Q4 ratification.

`currencyVerdict(modalityPassingTrials[])` — multi-NCT arbitration (defect 2). Input is ONLY the trials that passed R5 modality (not the sponsor's whole trial list):
- Compute `currencyOfTrial` for each.
- Verdict = best across the set by priority `current > dormant > discontinued > unknown`. (A sponsor with one live qualifying trial is `current` even if another qualifying trial is terminated; a sponsor whose ONLY qualifying trials are terminated is `discontinued` — this is the Pfizer/Adrenas closure.)
- The carrying NCT = the trial whose `currencyOfTrial` equals the verdict, tie-broken by most recent start/last-update date. Evidence string cites that NCT, its status, its date, and the rule branch that fired.
- If `modalityPassingTrials` is empty → `unknown` (should not happen post-R5-pass; guard anyway).

- [ ] **Step 1:** Implement both pure functions in `r5-trial-test-2026-05-18.ts`. No network, no Airtable, no date lib beyond what the file already imports. Export them.
- [ ] **Step 2:** Create `.build/currency-phase1-cases.ts` asserting these worked cases (offline, pure-logic — permitted; not a pinned workflow run):
  - **Adrenas-like:** one modality-passing NCT, status TERMINATED, last-update 2025-12-01 → verdict `discontinued`; evidence names that NCT + "TERMINATED". (Closes defect 1.)
  - **Pfizer-like:** modality-passing set = [NCT_a TERMINATED 2025-01, NCT_b COMPLETED 2019] → verdict `discontinued` (no live qualifying trial; completed-2019 is stale). Evidence names the rule. (Partial Pfizer closure — see Honest Limit below.)
  - **Live-AAV:** modality-passing set = [NCT_x RECRUITING] → `current`, evidence names NCT_x RECRUITING.
  - **Mixed:** [NCT_p TERMINATED, NCT_q ACTIVE_NOT_RECRUITING] → `current`, carrying NCT = NCT_q. (Multi-NCT arbitration — defect 2.)
  - **Completed-recent:** [NCT_r COMPLETED, last-update 14 months ago], STALENESS_YEARS=5 → `current`.
  - **Completed-stale:** [NCT_s COMPLETED, last-update 7 years ago] → `dormant`.
- [ ] **Step 3:** Run the offline harness. Expected: all six assertions PASS. If any fail, fix the pure function, not the cases.

## Task 4: Wire into L2, ship via n8n-safe-update, verify by raw read-back + smoke

**Files:** modify `.build/L2-applyRules-R5-2026-05-18.js` (+ `.build/L2-rebuild-2026-05-18.ts` only if node graph must change — it should not).

- [ ] **Step 0 (required, from Task 1 finding):** Add `protocolSection.statusModule` to the CT.gov v2 `?fields=` query at `.build/r5-trial-test-2026-05-18.ts:102` (and the mirror at `L2-applyRules:53`). Confirm the trial object now exposes overall status, start date, and last-update date. Without this the currency functions have no status/date input. Do not alter any other module in the query.
- [ ] **Step 1:** In `L2-applyRules-R5-2026-05-18.js`, after R5 modality passes, call `currencyVerdict` on the modality-passing NCT set (`trials.filter(t => t.pass)`, available at `:131`). Map verdict → routing: `current` keeps the existing surface/needs-review behavior unchanged; `discontinued` or `dormant` routes to **needs-review** (NOT surfaced, NOT hard-rejected — review, mirroring R4's conservative posture). Write `Currency Status`, `Currency Evidence`, `Currency Checked At` (field IDs from Task 2 Step 4). Do NOT alter any R5 modality field or verdict. Bump `Classification Version` to the value Nick ratifies in Task 5 (until then use a clearly-provisional tag like `v6-currency-PROPOSED`).
- [ ] **Step 2:** Invoke the `n8n-safe-update` skill and follow it exactly. Expect: credentials wiped on update (re-attach), a 500 on success (not a real failure), a new draft that must be published. Do not skip publish.
- [ ] **Step 3 (mandatory raw read-back gate):** Pull the deployed workflow config and read the changed nodes field-by-field, raw. Confirm the Airtable write node maps `Currency Status`/`Currency Evidence`/`Currency Checked At` by the correct field IDs and that NO other field mapping was zeroed/dropped (the known n8n-mcp Airtable corruption). `validate_workflow` is insufficient — do the raw read. If corrupted, fix the mapping (manual UI edit preferred) and re-read.
- [ ] **Step 4 (smoke — real execution, bounded):** Run L2 on the same 6-row smoke set used by the prior Verify smoke (do NOT run the full 121). Real execution only. Then diff against expectations:
  - The R5 modality verdicts on all 6 rows are UNCHANGED vs the existing oracle (`ORACLE-verification-35-2026-05-18.json` as corrected by `ORACLE-CORRECTION-2026-05-18b.md`). Currency must not move modality. If any modality verdict changed, STOP — you regressed R5.
  - Each row has a populated `Currency Status` + `Currency Evidence` consistent with its trials.
  - Any row whose only modality-passing trial is TERMINATED/WITHDRAWN/SUSPENDED is `discontinued` and routed to needs-review, not surfaced.
- [ ] **Step 5:** Record the smoke execution ID in an Enrichment Runs row (real receipt).

## Task 5: STOP — surface R6 to Nick (do not write the artifact)

**Files:** create `practices/revops/workflows/explorium-direct/PROPOSAL-R6-currency-2026-05-18.md`. Do NOT edit `revops-segment-aav-gene-therapy-ellie-outreach.md`.

- [ ] **Step 1:** Write the proposal file containing the R6 text below verbatim, plus the smoke evidence from Task 4.
- [ ] **Step 2:** STOP. Surface to Nick: R6 ratification + the Q4 staleness cutoff (default 5y — his/Ellie's commercial call) + the honest limit below. The full 121-row reclassify does not happen until Nick gives an explicit go on a separate roadmap item. Do not proceed past this point autonomously.

**Proposed R6 (for Nick — verbatim, not yet authored into v5):**

> **R6 (2026-05-18, CT.gov, currency gate, Phase 1 deterministic).** After R5 modality passes, a sponsor's surfacing is gated on trial *currency* computed over its modality-passing NCTs. A trial with overall status TERMINATED / WITHDRAWN / SUSPENDED contributes zero currency regardless of last-update recency (CT.gov re-dates terminated trials for safety follow-up). Verdict across the modality-passing set: `current` if any such trial is recruiting/active or COMPLETED-within-`STALENESS_YEARS`; `discontinued` if all are terminated/withdrawn/suspended; `dormant` if none terminated but all stale. `current` surfaces as before; `discontinued`/`dormant` route to needs-review (conservative, not hard-reject). `STALENESS_YEARS` defaults to 5 pending Ellie's Q4 commercial ruling. Modality verdicts are unchanged by this rule. Announcement/exit intelligence (trade-press discontinuation that CT.gov status lags) is Phase 2 and explicitly not covered by R6.

## Task 6: Deferred dup-log defect (bundled per prior decision)

The trigger condition ("before L2 becomes recurring") is now. `Prepare Run Log`/`Write Run Log` fire once per Collect arrival → ~4 identical Enrichment Runs rows per execution. Receipt-only, no Companies-data impact.

- [ ] **Step 1:** In the L2 source build, make run-log emission fire exactly once per execution (gate on first Collect arrival or move to a post-merge single node). Ship via the same `n8n-safe-update` + raw read-back path as Task 4.
- [ ] **Step 2:** Confirm on the Task 4 smoke execution that exactly ONE Enrichment Runs row was written.

## Task 7: Close-out (registry + manual obligations — not optional)

- [ ] **Step 1:** System Registry base `apppQjlZiktpbO4aX`: update Roadmap item "Build currency / status gate" with the smoke execution ID in Evidence; set Status to `in progress` (it is NOT done until Nick ratifies R6 and the full run completes — separate item). Update the "L2 Classify (v4 R5)" Asset row note to reflect the currency layer; keep `Reconciled Against Reality` true only after the raw read-back passed.
- [ ] **Step 2:** If any node-graph or schema fact changed that the operating manual or DESIGN doc states, update `practices/agentic-systems/system-registry-operating-manual.md` in the same turn (bidirectional-sync rule).
- [ ] **Step 3:** Tear down any scratch workflow you created under a `[SCRATCH-yyyymmdd]` name. No deferred teardown.

## Honest limit (state this to Nick, do not paper over)

Phase 1 only partially closes Pfizer. Pfizer's *completed* (not terminated) hemophilia trial is old-but-not-dead; whether it counts as `current` depends entirely on `STALENESS_YEARS` (Q4). Pfizer's full closure — the public Beqvez discontinuation and "no active gene-therapy programs" — lives in trade press, not CT.gov status fields, and is **Phase 2 (announcement intelligence)**, which is separate, involves spend, and is not in this plan. Do not claim Phase 1 fully solves currency.

## Self-review checklist (run before handing back)

- Spec coverage: defect 1 (status-beats-date) → Task 3; defect 2 (multi-NCT) → Task 3; hard surfacing gate + fields → Tasks 2, 4; R6 proposal not authored → Task 5; dup-log → Task 6; close-out → Task 7. No gaps.
- No placeholders: algorithm fully specified; field IDs named; STOP gates explicit.
- Consistency: `currencyOfTrial`/`currencyVerdict`, `Currency Status/Evidence/Checked At`, `STALENESS_YEARS` used identically throughout.
