# Handoff: Enrichment Resume
**Date:** 2026-05-13 (afternoon session)
**Pick up from:** `practices/revops/workflows/explorium-direct/`
**Resumes:** `HANDOFF-enrichment-plan-2026-05-13.md` (5-step plan)

---

## What this session completed

### Airtable schema (Enrichment Runs table — `tblEVSEqetmu4ScHe`)
Four new fields added:
- `Workflow ID` (`fldh97o2G9tdr53z7`)
- `Execution ID` (`fldL6ac77BeJEhMcD`)
- `Records In` (`fldR2EbLmC48QWuA0`)
- `Records Out` (`fldaIbqeTRtZwdPa7`)

### n8n run log wiring (all three workflows now write to Enrichment Runs on completion)
- **CT.gov Discovery** (`9gcmEjq1lvOY2jZS`): `Prepare Run Log` updated to emit `workflowId`, `executionId`, `recordsIn` (studies), `recordsOut` (sponsors upserted)
- **L2 Classify** (`rXKuqfDwqX7TYzxK`): same — `recordsIn` = companies evaluated, `recordsOut` = surfaced + borderline
- **Companies Enrichment** (`Z6RROKx5omdfvhtn`): new `Prepare Run Log` + `Write Run Log` nodes added after the `Done` noOp node, wired and deployed

### Companies Enrichment workflow — Step 1.1 through 1.4 complete
- **Step 1.1:** All 4 new Airtable fields confirmed on Companies table (`tblnj3YlOI3thjrXp`):
  - `HQ City` (`fldQDPCaAjucxZmnc`) — pre-existing
  - `NAICS Code` (`fld87WcKOimXRx00I`) — pre-existing
  - `Explorium Business ID` (`fld5VgnZC0Vxf613q`) — pre-existing
  - `Stock Ticker` (`fld6tZsW5eyFJg5Yb`) — created this session
- **Step 1.2:** Code nodes patched:
  - `Qualify Company`: `_ticker: firm.ticker || null` added to return (bare field names confirmed — no `firmo_` prefix in native node output)
  - `Map Enriched Fields`, `Map Archive Fields`, `Map Reroute Fields`, `Map Pass Unmatched`, `Map Archive No AAV Unmatched`: `"Stock Ticker": qualify._ticker || null` added before `Last Enriched At`
- **Step 1.3:** 5-record test run (execution `68784`) — success
  - Sensorion, Opus, ImmPACT Bio, Nanoscope, Tableau all processed
  - 3 archived, 2 rerouted (expected — none of these 5 are AAV plays)
- **Step 1.4:** Tableau verified in Airtable:
  - Industry = "Software Publishers" ✅
  - Revenue Range = "500M-1B" ✅
  - Country = "united states" ✅
  - Stock Ticker confirmed working (Sensorion = "xpar:alsen") ✅

### Workflow current config
- `Get Unenriched Companies` node: `returnAll: false`, `limit: 5` (set for the test; must be updated before the full run)
- Filter formula: `AND({Enrichment Status} = '', {Domain} != '')`

---

## What is NOT done — pick up here

### Step 1.5 — Full enrichment run (immediate, unblocked)

1. Update `Get Unenriched Companies` node in workflow `Z6RROKx5omdfvhtn`:
   - Set `returnAll: true`
   - Remove / zero out `limit`
   - PUT the workflow back (use minimal payload: `name`, `nodes`, `connections`, `settings: {}`, `staticData`)

2. Execute the workflow (manual trigger). Expect ~600 records, ~1/sec, 10-15 minutes.

3. Monitor to completion. Check Enrichment Runs table for the new row — confirm `Records In` populated.

4. Spot-check 3-5 records in Airtable: confirm `Industry`, `Revenue Range`, `Country`, `HQ City`, `Explorium Business ID`, `Enrichment Status` populated.

**Note:** Many records will hit `archived_out_of_industry` (correct — most companies in the base aren't biotech/NA). The AAV-qualified records will hit `enrichment_complete` or `rerouted_wrong_modality`. That's expected behavior.

---

### Steps 2-5 (from original 5-step plan — unchanged)

**Step 2 — Populate Classification Rules table (`tbl1HFYzezFYs5C3k`)**
Extract rules from these artifacts into Airtable rows:
- `accounts/clients/teknova/artifacts/revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md`
- `accounts/clients/teknova/artifacts/revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md`
- `accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`
- `accounts/clients/teknova/HANDOFF-aav-sourcing-workflow-validation-2026-05-12.md`

Schema: Rule Name, Rule Category (`vocabulary_filter` / `vector_evidence` / `indication_list` / `disqualifier` / `modality_bucket` / `reroute_map` / `hard_filter` / `soft_signal`), Rule Value, Rule Weight, Active (checkbox), Source Doc, Notes.

**Surface rules for review before writing any Airtable rows.**

**Step 3 — Refactor CT.gov L1 Capture workflow (`9gcmEjq1lvOY2jZS`)**
Known issues to fix:
- Classification logic in `Extract Industry Sponsors` — strip it out (L1 is pure capture)
- Duplicate `pageSize` parameter in query string
- `Bulk Lookup` node on a side branch — move it between Extract and Merge (linear chain)
- Add `fields` parameter to the CT.gov API call to slim the 1.6 MB payload

After fix: re-run and confirm existing 103 companies aren't duplicated (upsert logic on domain).

**Step 4 — Contacts enrichment workflow (design doc required before building)**
Read `practices/revops/workflows/HANDOFF-three-layer-pipeline-2026-05-12.md` and the Contacts table schema before designing.
Write design doc to `practices/revops/workflows/contacts-enrichment/DESIGN.md` first.

**Step 5 — L3 Filter workflow (design doc required before building)**
Reads `hard_filter` and `soft_signal` rows from Classification Rules table. Blocked on Step 2.
Design doc exists in `practices/revops/workflows/canonical-aav-discovery/DESIGN.md`.

---

## Key identifiers

| Item | Value |
|---|---|
| Airtable base | `appYBYH3aOHhTODAw` |
| Companies table | `tblnj3YlOI3thjrXp` |
| Contacts table | `tblWJksRL1yKSUgrm` |
| Company Events table | `tblnzX2b2kqNGzW6r` |
| Classification Rules table | `tbl1HFYzezFYs5C3k` |
| Enrichment Runs table | `tblEVSEqetmu4ScHe` |
| Companies Enrichment workflow | `Z6RROKx5omdfvhtn` |
| CT.gov Discovery workflow | `9gcmEjq1lvOY2jZS` |
| L2 Classify workflow | `rXKuqfDwqX7TYzxK` |
| n8n instance | `https://instig8.app.n8n.cloud` |
| n8n project | INSTIG8 AI (`Pj1xUgbrL58T1CS1`) |
| Airtable credential (n8n) | `oWpVVSd23y4jOtSK` |

## Current play state (for Play Steps backfill)

| Phase / Step | Status | Evidence |
|---|---|---|
| A: Intake | Done | |
| B: Play Definition | Done | Offer, segment criteria, taxonomy, sourcing rules in `accounts/clients/teknova/artifacts/` |
| C / Step 1: Discovery | Done | CT.gov L1 ran 2026-05-12 — 103 companies (`recVJRpcvmE5QSrdp` in Enrichment Runs) |
| D / Step 2: Match | Tested, full run pending | 5-record test exec `68784` passed |
| D / Step 3: Light Enrich | Tested, full run pending | Same workflow as Step 2 |
| D / Step 4: Gate (web) | Done | L2 Classify ran 2026-05-12 — 32 surfaced, 65 borderline, 6 archived (`recEDN5jVh3OcE50o`) |
| D / Step 4: Gate (firmographic) | Blocked | Depends on Steps 2-3 completing + Classification Rules table populated |
| E: SME Review | Not started | |
| F / Steps 5-9 | Not started | |
| G, H, I | Not started | |

## Behavioral rules for next session

- No pinned/simulated n8n tests — only real executions count
- Stop and report after each sub-step
- Steps 4 and 5 require design docs before any n8n build work
- Show absolute file paths when creating or editing files
- Airtable credentials are confirmed working — never flag as blocker
- n8n PUT payload: use `{ name, nodes, connections, settings: {}, staticData }` only — `active`, `meta`, `pinData`, `settings.executionOrder` all cause 400 errors
