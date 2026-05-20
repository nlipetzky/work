# SPEC: L2 v3 Companies write-node field contract (rev 2)

**Date:** 2026-05-15
**Status:** REV 2 — **APPROVED by agentic-systems pass 2 (2026-05-15).** Contract is the binding build spec. One scope addition: L1 persists trial-recency + active-recruiting (see Pass 2 Rulings). No build until Nick confirms L1 recency in scope (CONFIRMED). No enrichment, no spend.
**Target:** Companies `tblnj3YlOI3thjrXp` in base `appYBYH3aOHhTODAw`. Workflow `rXKuqfDwqX7TYzxK`.
**Source of truth:** `DESIGN-step4-L2-rebuild-2026-05-15.md` §3 precedence + write contract; live schema per `STATE-MACHINE-families-1-3-2026-05-15.md`.
**Confirmed by pass 1 (unchanged):** HTTP-PATCH write path; node 1 (re-queue scope = Verification Status + clear Custom Classification/Vector Evidence Clause only).

## Rev-2 changelog (what pass 1 corrected)

1. Modality Reroute: **add `Enrichment Status` = `rerouted_wrong_modality`** (Step 6 alt-play pool keys off it; do not collapse to rejected+text).
2. Needs Review: write **`Enrichment Status` = `needs_aav_review`** per DESIGN route 6 — not the Verification Status=borderline+Rejection Reason reinterpretation.
3. **New node added: Update Dormant.** DESIGN route 4 + Nick ruling: dormant → Verification Status=borderline + dormancy Rejection Reason. Evaluated BEFORE positive evidence (precedence step 4, ahead of step 5).
4. AAV Segment on Surfaced: escalated as a **conscious decision** (below), not resolved by omission.
5. Global forbid-list corrected: forbids the ~17 numerics + L3 + Therapeutic Modality/Delivery Vehicle/Canonical Status. **`Enrichment Status` is NOT forbidden** — `rerouted_wrong_modality`/`needs_aav_review` are canonical halt values, safe under the halt invariant.

## Why HTTP-PATCH (unchanged, confirmed)

MCP `update_workflow` builder non-deterministically expands Airtable `update`-node `columns.value` against the 100+ field Companies schema, injecting ~17 numeric fields = `0`. Spike `sY4rR92r7EpMHTbJ` proved HTTP Request `PATCH` bodies survive intact (no schema to expand). All Companies writes = HTTP PATCH. Reads stay Airtable `search` (not corrupted).

## Precedence (Apply Rules evaluation order — DESIGN §3, dormancy corrected to step 4)

1. `parent_company_domain` — skip (Active=false, flagged).
2. `disease_aav_exclusion` hit → **route: disease_reject**.
3. modality exclusion token (+context) → **route: modality_reroute**.
4. **`dormancy_rule` hit → route: dormant.** (NEW position — must precede positive or dormant AAV companies mis-surface; without this R4 is defeated.)
5. positive (canonical indication, or AAV intervention-name) → **route: surfaced**.
6. `clause_b` gene-therapy-branded, no AAV terms → **route: needs_review**.
7. else → **route: borderline**.

Switch has **6 outcomes**: surfaced, disease_reject, modality_reroute, dormant, needs_review, borderline.

## Global rules for every Companies write node

- `PATCH https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnj3YlOI3thjrXp`
- Body: `{ "records":[ {"id":"<recordId>","fields":{ ...ONLY fields listed for that node... }} ], "typecast":true }`, ≤10 records/request.
- Auth: HTTP node → predefined credential `airtableTokenApi` → **`may 26 all bases`** (manual UI attach per node; one-time, survives pushes).
- Match by Airtable record `id`.
- **A node writes ONLY its enumerated fields.** Forbidden on every node: the ~17 injected numerics (Trial Count, Employee Count, Founded Year, all funding, all scores/counts, Discovery Confidence, Patent Count, Press/Conference counts, Active Signals Count); all L3 (Segment Score/Version/Run Date, Outreach Eligible, Hard Filters Pass, Company Tier); Therapeutic Modality; Delivery Vehicle; Canonical Status.
- **`Enrichment Status` is permitted** where specified — `rerouted_wrong_modality`, `needs_aav_review` are canonical halt values; the halt invariant makes them safe (no workflow auto-advances a halt).

## The Companies write nodes

### 1. Reset + Clear Stale (re-queue, first, batched all rows) — CONFIRMED pass 1
- `Verification Status` = `"needs_verification"`
- `Custom Classification` = `""`
- `Vector Evidence Clause` = `""`

### 2. Update Surfaced (route 5: canonical indication OR AAV intervention-name)
- `Verification Status` = `"surfaced"`
- `Vector Evidence Clause` = `"C"` or `"A"` (never `"none"`/empty)
- `Custom Classification` = `"aav"`
- `Custom Classification Source` = `"L2:clause_c_canonical_indication"` or `"L2:clause_a_intervention_name"`
- `Custom Classification Confidence` = `"high"` (C) / `"medium"` (A)
- `Custom Classification Detected Keywords` = matched canonical terms, `" | "`-joined
- `Classification Version` / `Classification Run ID` / `Classification Run Date` / `Classification Notes`
- **AAV Segment — see Conscious Decision A below. Not written by L2 in this spec; escalated for confirmation.**

### 3. Update Disease Reject (route 2: disease_aav_exclusion — Nkarta keystone)
- `Verification Status` = `"rejected"`
- `Rejection Reason` = matched disease-AAV variant(s), deduped, `"; "`-joined
- `Custom Classification Source` = `"L2:disease_aav_exclusion"`
- `Classification Version` / `Run ID` / `Run Date` / `Notes`

### 4. Update Modality Reroute (route 3: wrong-modality token) — CORRECTED
- `Verification Status` = `"rejected"`
- `Enrichment Status` = `"rerouted_wrong_modality"`  ← ADDED (Step 6 alt-play pool keys off this)
- `Rejection Reason` = `"wrong_modality: <token>"`
- `Custom Classification` = mapped modality bucket (e.g. `"lentiviral"`)
- `Custom Classification Source` = `"L2:disqualifier_modality"`
- `Classification Version` / `Run ID` / `Run Date` / `Notes` (incl. reroute-map line)

### 5. Update Dormant (route 4) — NEW NODE
- `Verification Status` = `"borderline"`
- `Rejection Reason` = `"dormant: most recent trial >5yr, no active/recruiting (machine default, Q4 pending Ellie)"`
- `Custom Classification Source` = `"L2:dormancy_rule"`
- `Classification Version` / `Run ID` / `Run Date` / `Notes`
- **Data-availability caveat (for review):** dormancy needs trial recency / recruiting-status. Persisted Companies fields currently expose `Trial Count` + `Most Advanced Phase` only — not last-trial date or recruiting status. So this route rarely fires until L1 persists trial-recency. The node + precedence MUST exist anyway so R4 is not structurally defeated; flagged, not silently dropped.

### 6. Update Needs Review (route 6: clause_b branded, no AAV) — CORRECTED
- `Enrichment Status` = `"needs_aav_review"`  ← per DESIGN route 6 (replaces the borderline+text reinterpretation)
- `Custom Classification Source` = `"L2:clause_b_gene_therapy_branded_fallback"`
- `Classification Version` / `Run ID` / `Run Date` / `Notes`
- **Open question for pass 2:** `Read Candidates` filters `{Verification Status}='needs_verification'`. This node sets `Enrichment Status` but (per literal DESIGN) does not change `Verification Status`, so a re-run would re-pick these rows. `needs_aav_review` is a halt by the invariant, but the candidate read keys on Verification Status, not Enrichment Status. Flagging the interaction for an explicit ruling rather than reinterpreting the design. Options: (a) accept idempotent re-classification of these rows each run; (b) candidate read also excludes `Enrichment Status` halts; (c) this node also sets `Verification Status='borderline'`. Design-literal = (a); needs a conscious choice.

### 7. Update Borderline (route 7: no match) — unchanged
- `Verification Status` = `"borderline"`
- `Classification Version` / `Run ID` / `Run Date` / `Notes`
- (intentionally minimal halt — no Rejection Reason, no Custom Classification)

### Write Run Log — NOT a Companies node (unchanged)
Enrichment Runs `tblEVSEqetmu4ScHe`, Airtable `create`, existing run-log field contract. Not corrupted (different table). Listed for completeness only.

## Conscious Decision A — AAV Segment (escalated, NOT omission)

DESIGN route 5 says Surfaced writes `Custom Classification` AND `AAV Segment` = `modality_aav`. **Problem:** live `AAV Segment` singleSelect options are `{gene_therapy, production_tool, both, unknown}` — `modality_aav` is not a valid option (it is a `modality_bucket` rule value, a different vocabulary). Writing it would 422 or invent vocab (forbidden).

**Recommended decision:** `AAV Segment` is **Ellie-write-only**. L2 writes `Custom Classification="aav"` (universal vocab) and does NOT write `AAV Segment`. Rationale: L2-from-CT.gov cannot distinguish gene-therapy developer vs production-tool vendor — that distinction is precisely the human review purpose (companion field `Ellie Segment Override` exists). Inventing an AAV Segment value violates the no-confident-garbage rule. This is the precision-over-coverage principle Nick affirmed for the firmographic-archive gap, applied consistently.

**Requires agentic-systems ruling:** confirm "AAV Segment = Ellie-write-only, L2 does not write it" — OR specify the exact valid mapping from L2 evidence to `{gene_therapy|production_tool|both|unknown}` if L2 should write it.

## Hard gates (unchanged)

- **1a:** read feeding re-queue must provably return all 631 (`Return All` ON, no view/filter); verified by deployed-config read + count.
- **1b:** full run authorized only when that read returns the live `totalRecordCount`.
- **MCP write-freeze post-build:** full field-by-field read-back of all write nodes + re-smoke proving Trial Count / Employee Count / funding fields UNCHANGED (not 0) before any full run.
- No enrichment, no spend.

## Pass 2 rulings — APPROVED (2026-05-15)

1. **Nodes 2–7 match canonical DESIGN §3: CONFIRMED.** Contract approved as the binding build spec.
2. **Conscious Decision A: CONFIRMED — AAV Segment is Ellie-write-only.** L2 writes `Custom Classification="aav"` and does NOT touch `AAV Segment`. Leave blank (blank = awaiting Ellie; do not pre-fill even `unknown`). DESIGN §3 route 5 updated to retire the invalid `AAV Segment=modality_aav` instruction so DESIGN/SPEC don't drift.
3. **Needs Review re-pickup: ruling (a)** — accept idempotent re-classification for this scoped single-pass run (harmless: same fields, no spend, no corruption). (c) rejected (re-collapses needs_aav_review onto the Verification Status axis — the pass-1 reinterpretation). (b) (candidate read excludes Enrichment-Status halts) is correct continuous-run behavior but **deferred to Step 6 hardening** — do NOT add now (touches the gated read path).
4. **Dormancy: rare-fire NOT acceptable. L1 scope addition REQUIRED (not optional).** As part of the Step 4 L1 touch (Return All + fresh pull), L1 (`9gcmEjq1lvOY2jZS`) must additionally persist two values it already fetches from CT.gov: most-recent-trial date + an active/recruiting/enrolling flag. Without them R4 is decorative and dormant AAV shells (Tacere/Avigen/Ceregene/Neurologix) mis-surface in Ellie's proof cohort. Bounded, no spend, in-scope. **Nick confirmed in scope 2026-05-15.**

## Build sequence (gated, post-approval)

1. **L1 change first** (`9gcmEjq1lvOY2jZS`): fetch CT.gov trial date(s) + overallStatus (already partially fetched), compute per-sponsor most-recent-trial date + active-recruiting flag, persist to Companies. Open design point: which fields these land in given the zero-new-fields discipline — resolve as part of the L1 work (reuse an existing date/flag field if one fits, else escalate a minimal conscious 2-field add since dormancy is "not optional").
2. **L2 rebuild** per this rev-2 contract via the HTTP-PATCH path (all 7 Companies write nodes as HTTP `PATCH`; one MCP push — bodies survive).
3. Nick attaches `may 26 all bases` to each HTTP node in UI (one-time); set `List All` → Return All.
4. **Gate 1a/1b:** deployed-config read-back proving the re-queue read returns exactly the live `totalRecordCount`.
5. **Post-build verification:** full field-by-field read-back of all 7 write nodes (HTTP bodies intact, no injected numerics) + re-smoke (Nkarta/Pfizer/PTC/Sensorion) asserting Trial Count / Employee Count / funding fields UNCHANGED (not 0).
6. Only then: the gated full-cohort run. No enrichment, no spend.
