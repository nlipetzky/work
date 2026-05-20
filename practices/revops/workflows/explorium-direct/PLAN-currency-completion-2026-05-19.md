# Currency Completion Implementation Plan (A + B + C)

> **For the executing session (Explorium-Direct lane).** Self-contained. You own L1 and L2 and the build environment. This closes the Pfizer/Adrenas gap by making currency a multi-source signal verdict. Three linked changes. "Tests" = real executions + surface read-back, never pinned runs. Where it says STOP, stop and surface to Nick via agentic-systems.

**Goal:** A company whose AAV program is dead in the trade press but still shows an active trial on clinicaltrials.gov (Pfizer, Adrenas) must NOT surface. Achieved by: (B) capturing a trade-press signal per surfaced company, and (A) deriving the currency verdict across the Company Events signal set with source authority, so a trade-press "discontinued" overrides a stale clinicaltrials.gov "active." Plus (C) stop creating duplicate company rows.

**What this does NOT include:** the Ellie-facing narrative. That is a separate expert-liaison-system item (registered there), generated on surfaced companies downstream — explicitly out of scope here. Do not add narrative generation to L1 or L2.

**Assets:** L1 `9gcmEjq1lvOY2jZS`, L2 `rXKuqfDwqX7TYzxK`, RevOps Surface base `appYBYH3aOHhTODAw` — Companies `tblnj3YlOI3thjrXp`, Company Events `tblnzX2b2kqNGzW6r`. Registry base `apppQjlZiktpbO4aX`.

## Hard constraints (read before Task 1)

- **Deploy path:** prefer manual n8n UI edits. If using the REST API PUT (it preserves credentials, unlike n8n-mcp `update_workflow` which wipes them): you MUST capture the full workflow JSON first and verify node count + connections immediately after the PUT. A malformed PUT replaces the ENTIRE workflow — this nearly destroyed L1 (briefly reduced to one node). Capture-then-verify is mandatory on that path. Do NOT use n8n-mcp `update_workflow` on L1/L2 (credential wipe).
- **Raw read-back gate:** after any workflow change, read the deployed config field-by-field. `validate_workflow` does not catch Airtable-node mapping corruption.
- **Trade-press = SPEND. Authorized to BUILD, not to auto-run.** Nick has authorized adding the Perplexity source. The FIRST real paid Perplexity batch is a STOP gate — surface to Nick before it runs. Scope: surfaced companies only (~35), never all 121/186.
- **Single writer:** confirm no other session is mid-edit on L1 or L2 (System Registry → Assets).
- **No invented vocabulary:** reuse existing Airtable select values; do not create parallel ones (Provider `clinicaltrials.gov` already exists; add `perplexity` as a new Provider value, that is allowed).
- **Idempotent signals:** every signal row is an upsert keyed on a stable External ID. Re-runs update, never duplicate (this is already proven for the clinicaltrials.gov signals — keep that property for trade-press).
- **Verify on the surface; agent narration is hypothesis.** agentic-systems independently verifies after you report.

## Recon-confirmed current state (verified this session — confirm, do not re-derive)

- **L1** (`9gcmEjq1lvOY2jZS`, 11 nodes): `Upsert Company` is an Airtable upsert with `matchingColumns: ["Company Name"]` — matches on the RAW company name string. L1 sources from clinicaltrials.gov; at upsert time it has Company Name, but **NOT** Explorium Business ID and NOT a domain (those are added later by enrichment). So the dedup key at L1 can only be a normalized name — Business-ID matching is not available here.
- `Extract Industry Sponsors` already computes a `normKey` (strips Inc/LLC/Ltd/Corp/etc, lowercases) used for in-run sponsor dedup, but the Airtable upsert ignores it and matches on raw `Company Name`. That mismatch is the duplicate source (e.g. "MeiraGTx, LLC" vs "MeiraGTx UK II Ltd"; the PTC duplicate).
- **L2** (`rXKuqfDwqX7TYzxK`): `Apply Rules` computes currency in-memory via `currencyVerdict(v.trials.filter(t=>t.pass))` over the live clinicaltrials.gov fetch. It does NOT read Company Events. The currency verdict is therefore single-source (clinicaltrials.gov only) — this is exactly why Pfizer/Adrenas still surface.
- **Company Events** holds 186 clinicaltrials.gov signal rows (Provider `clinicaltrials.gov`, Event Type `clinical_trial_status`), idempotent on `External ID` = NCT, Company link set, Vitality populated.

---

## Task 1: Confirm current state
- [ ] Open L1 and L2. Confirm `Upsert Company` matches on raw `Company Name`; confirm L2 `Apply Rules` computes currency only from the in-memory fetch and does not read Company Events. If either diverges, STOP and report.

## Task C: L1 — stop creating duplicate company rows

The fix is normalized-name matching against existing rows, reusing the existing record. (Business ID / domain are not available at L1 — do not attempt to match on them here.)

- [ ] **Step 1:** L1 already reads existing companies in `Bulk Lookup Existing Sources`. Extend `Merge Discovery Sources` so that for each incoming sponsor it computes the same `normKey` (strip legal suffixes, punctuation, lowercase) and compares against the normalized names of existing rows. If a normalized match exists, carry that existing row's Airtable record id forward on the item as `existingRecordId`.
- [ ] **Step 2:** Change `Upsert Company`: when `existingRecordId` is present, perform an UPDATE to that record id (no new row). Only when there is no normalized match does it create. Keep all existing field writes unchanged. This resolves the PTC-class duplicate without touching downstream behavior.
- [ ] **Step 3:** Verify on a real L1 run: a sponsor whose name differs only by legal suffix from an existing row updates that row, does not create a second. Spot-check PTC Therapeutics ends as ONE row.

## Task B: New trade-press signal source (Perplexity)

A new step (new small workflow OR a branch — your call, simplest that is idempotent and surfaced-scoped) that, per surfaced company, asks Perplexity whether its AAV / gene-therapy program is discontinued, and writes the answer as a signal row in Company Events.

- [ ] **Step 1:** Input set = companies with `Verification Status = surfaced` (the ~35, not all). Hard-bound the set; never run over the full table.
- [ ] **Step 2:** Per company, one Perplexity call. Prompt (verbatim intent): *"Has {company} discontinued, terminated, wound down, or exited its AAV gene-therapy program? Use trade press (BioPharma Dive, Fierce Pharma, Endpoints, company press releases). Answer strictly: VERDICT = ACTIVE | DISCONTINUED | UNCLEAR; one sentence of evidence; source URL(s)."*
- [ ] **Step 3:** Write one Company Events row per company, **upsert keyed on `External ID` = `{companyRecordId}:program-status`** (idempotent — re-runs update, not duplicate):
  - `Event Type` = `program_status` (add this one select value; do not reuse `clinical_trial_status`)
  - `Provider` = `perplexity` (new Provider value, allowed)
  - `Signal State (raw)` = the model's VERDICT token
  - `Vitality` = DISCONTINUED → `ended`; ACTIVE → `active`; UNCLEAR → `unknown` (absence/uncertainty must NOT override clinicaltrials.gov — only a clear DISCONTINUED carries weight)
  - `Detail` = the one-sentence evidence; `Source URL` = cited URL; `Detected At` = run date; `Company` link set; `Is Latest` = true; `Confidence` = high if a dated source URL is returned, else medium.
- [ ] **Step 4:** STOP — surface to Nick before the first real paid Perplexity batch (spend gate). Do not run it autonomously.

## Task A: L2 — derive the currency verdict across signals with source authority

L2 stops deciding currency from the in-memory clinicaltrials.gov fetch alone. It reads the company's Company Events signals and applies source authority.

- [ ] **Step 1:** In L2, before/within `Apply Rules`, read Company Events rows for the candidate company (filter by the Company link / company name; only `Is Latest` rows). You will have: clinicaltrials.gov signals (per NCT) and, if present, the `program_status` trade-press signal.
- [ ] **Step 2:** New verdict precedence (replaces the in-memory `currencyVerdict` as the surfacing decision; keep the clinicaltrials.gov computation as the fallback layer):
  1. If a `program_status` trade-press signal exists with `Vitality = ended` and `Detected At` within the staleness window → **currency = discontinued** (route to needs-review, NOT surfaced). Trade press overrides a stale clinicaltrials.gov "active." This is the Pfizer/Adrenas closure.
  2. Else, derive from the clinicaltrials.gov signals exactly as today (terminated/withdrawn/suspended-only → discontinued; any live/recent → current; else dormant).
  3. A trade-press `unknown`/absent signal changes nothing — never override clinicaltrials.gov on absence.
- [ ] **Step 3:** Write the currency verdict + evidence (cite which signal carried it: "trade press: {url}" or "clinicaltrials.gov: {NCT}") to the existing Currency fields, same as now.
- [ ] **Step 4:** Run L2 selectively (it has the `Run Selected` gate) on the same set incl. Pfizer and Adrenas. Expected: with a trade-press `ended` signal present for them, they route to needs-review, NOT surfaced. Without the trade-press signal yet, they still surface (proves the precedence is wired but the signal is the deciding input).

## Task: Close-out
- [ ] System Registry `apppQjlZiktpbO4aX`: update the currency roadmap item with the execution IDs; set the L1/L2 asset notes; `Reconciled` true only after agentic-systems' independent surface check.
- [ ] Update `SPEC-L1-recency-change-2026-05-15.md` (L1's source of record) and note the L2 verdict change in the L2 build files.
- [ ] Report to agentic-systems for independent verification. Do not self-certify.

## What proves success
Pfizer and Adrenas: a `program_status` trade-press signal = `ended` written for them; L2 then routes them to needs-review, not surfaced; clinicaltrials.gov-terminated cases (eyeDNA) still correctly discontinued; a genuinely-active company still surfaces; no duplicate company rows; trade-press signals idempotent on re-run.

## Self-review
A closes the verdict gap, B supplies the signal that makes A bite, C removes the duplicate-row defect, D explicitly excluded and routed to expert-liaison. Spend gated to Nick (Task B Step 4). Deploy-path near-miss lesson encoded as a hard constraint. No invented vocab beyond the one allowed new Provider/Event Type value.
