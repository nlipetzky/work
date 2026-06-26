# Handoff: Enrichment Pipeline — 5-Step Execution Plan
**Date:** 2026-05-13  
**Session context:** Airtable schema migrations (Phases 1-4) are complete. The Companies Enrichment workflow was built but never finished. This session executes the remaining work.

---

## What's already done (don't redo)

- Airtable schema Phases 1-4 complete. Companies and Contacts tables are clean. Signal: * fields deprecated and marked `- DELETE`. Company Events child table exists and is empty (ready for gate workflow to write to directly).
- CT.gov L1 Discovery ran: 35 companies written to Companies table.
- Companies Enrichment workflow (`Z6RROKx5omdfvhtn`) built end-to-end — match → enrich chain works — but was never executed. Steps 1-4 from `practices/revops/workflows/explorium-enrichment-handoff.md` are pending.
- Classification Rules Airtable table (`tbl1HFYzezFYs5C3k`) exists but is empty.
- No contacts enrichment workflow exists.

**Read these files before starting any work:**
- `practices/revops/workflows/explorium-enrichment-handoff.md` — step-by-step instructions for finishing the Companies Enrichment workflow
- `practices/revops/workflows/HANDOFF-three-layer-pipeline-2026-05-12.md` — full three-layer architecture and what Phase 2 onward requires
- `practices/revops/workflows/canonical-aav-discovery/DESIGN.md` — data source design and dedup strategy

---

## Key identifiers

| Item | Value |
|---|---|
| Airtable base | `appYBYH3aOHhTODAw` |
| Companies table | `tblnj3YlOI3thjrXp` |
| Contacts table | (check via list_tables_for_base) |
| Company Events table | `tblnzX2b2kqNGzW6r` |
| Classification Rules table | `tbl1HFYzezFYs5C3k` |
| Enrichment Runs table | `tblEVSEqetmu4ScHe` |
| Companies Enrichment workflow | `Z6RROKx5omdfvhtn` |
| CT.gov Discovery workflow | `9gcmEjq1lvOY2jZS` |
| L2 Classify workflow | `rXKuqfDwqX7TYzxK` |
| n8n instance | `https://instig8.app.n8n.cloud` |
| n8n project | INSTIG8 AI (`Pj1xUgbrL58T1CS1`) |

---

## 5-step execution plan

### Step 1 — Finish Companies Enrichment workflow (immediate, unblocked)

Full instructions in `explorium-enrichment-handoff.md`. Summary:

1. Create 4 new fields on Companies table (`appYBYH3aOHhTODAw`, `tblnj3YlOI3thjrXp`):
   - `HQ City` (singleLineText) — maps to `firmo_city_name`
   - `NAICS Code` (singleLineText) — maps to `firmo_naics`
   - `Stock Ticker` (singleLineText) — maps to `firmo_ticker`
   - `Explorium Business ID` (singleLineText) — business_id from match step (for dedup/reuse)

2. Update the "Map to Airtable Fields" Code node in workflow `Z6RROKx5omdfvhtn` with the correct field mapping code (see `explorium-enrichment-handoff.md` Step 2 for the exact jsCode block).

3. Run a 5-record test using these known-good record IDs (reset their Enrichment Status to null first):
   - `rec1ccHC8DlO6cPVR` — Tableau (confirmed Explorium match, use as validation anchor)
   - `rec1bjCSqzefykwES` — Nanoscope Therapeutics
   - `rec1L2tBbU89yv2JC` — ImmPACT Bio
   - `rec0VVjV895xlzPr4` — Opus Recruitment Solutions
   - `rec03zeF3aFdztbwW` — Sensorion

4. Verify Tableau row in Airtable: Industry = "Software Publishers", Revenue Range = "500M-1B", Country = "united states". Confirm `firmo_` prefix behavior from the actual node output.

5. Flip to `returnAll: true`, run all unenriched Companies records (~553 records, ~1/sec).

**Stop and report after each sub-step.**

---

### Step 2 — Populate Classification Rules table

Extract structured rules from these artifact docs into Airtable rows in `tbl1HFYzezFYs5C3k`:

| Source doc | Rules to extract |
|---|---|
| `accounts/clients/teknova/artifacts/revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md` | Modality buckets, AAV pass criteria, re-route mapping, edge case disqualifiers |
| `accounts/clients/teknova/artifacts/revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md` | Source trust ranking, auto-add vs queue thresholds |
| `accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` | Hard filters (7), soft signals (7 with weights), disqualifiers (9) |
| `accounts/clients/teknova/HANDOFF-aav-sourcing-workflow-validation-2026-05-12.md` | Disease-AAV vocabulary, canonical AAV indications, vector evidence regex |

Classification Rules table schema: Rule Name, Rule Category (`vocabulary_filter` / `vector_evidence` / `indication_list` / `disqualifier` / `modality_bucket` / `reroute_map` / `hard_filter` / `soft_signal`), Rule Value, Rule Weight, Active (checkbox), Source Doc, Notes.

Surface the rules for review before writing. Stop and show the mapping before any Airtable writes.

---

### Step 3 — Refactor CT.gov L1 Capture workflow

Workflow `9gcmEjq1lvOY2jZS`. Known issues to fix:

- Classification logic in the Extract Industry Sponsors node — strip it out. L1 is pure capture, no judgment.
- pageSize bug: duplicate parameter in the query string.
- Linear chain issue: Bulk Lookup must sit between Extract and Merge (currently on a side branch).
- Add `fields` parameter to slim the CT.gov API response (currently 1.6 MB payload).

After fix: re-run and confirm existing 35 companies aren't duplicated (upsert logic on domain).

---

### Step 4 — Build Contacts enrichment workflow

**This is the highest-leverage gap.** 377 contacts exist in Airtable but there's no repeatable pipeline.

Goal: given a company record in Airtable, find and enrich contacts at that company — title, email, LinkedIn, tenure.

Explorium tools available:
- `fetch-prospects` — find people at a company by domain/business_id
- `enrich-prospects` — enrich a list of prospects with email, LinkedIn, firmographic signals

Design before building. Before writing any n8n code:
1. Check which Explorium prospect fields map to the existing Contacts table schema.
2. Confirm the Airtable Contacts table field IDs (list_tables_for_base on `appYBYH3aOHhTODAw`).
3. Decide: enrich existing 377 records in-place, or run discovery first and add new contacts?
4. Write a design doc to `practices/revops/workflows/contacts-enrichment/DESIGN.md` before building.

---

### Step 5 — Build L3 Filter workflow

Reads `hard_filter` and `soft_signal` rows from Classification Rules table. For each company:
- Apply hard filters (instant disqualification if any fail)
- Score soft signals (weighted sum)
- Write `Segment Score`, `Segment Version`, `Segment Run Date`, `Outreach Eligible` (checkbox)

This is a new workflow. Design doc exists in `practices/revops/workflows/canonical-aav-discovery/DESIGN.md`. Build after Step 2 (Classification Rules table populated) and Step 1 (Companies enriched).

---

## Behavioral rules for this session

- Read the handoff docs listed above before starting. Do not invent context.
- Stop and report after each sub-step. Do not batch sub-steps silently.
- No pinned/simulated n8n tests. Only real executions count.
- Do not filter during ingestion. Capture wide.
- Show absolute file paths when creating or editing files.
- Airtable credentials are confirmed working. Never mention them as a blocker.
- Steps 4 and 5 require a design doc before any n8n build work begins.
