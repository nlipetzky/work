# Workflows ticket — USPTO / PatentsView Patent Capture (NEW workflow)

> **⚠ DEFERRED — 2026-05-20.** Do not build this. PatentsView is in a migration dead zone: `api.patentsview.org` discontinued 2025-05-01; `search.patentsview.org` DNS dropped 2026-03-20 when the system moved to the USPTO Open Data Portal; replacement endpoint under `data.uspto.gov` has no published REST docs yet and now requires a key. Nick's call: wait for USPTO ODP to publish the new patent search API.
>
> **Trigger to resume:** any of the following — (a) `data.uspto.gov` publishes patent search API documentation; (b) `data@uspto.gov` responds with an ETA or early-access path; (c) Nick reverses to Option A (Lens.org API). When the trigger fires, re-issue this ticket with the new endpoint + auth pattern wired into the Scope section below.
>
> **Wave A composition adjusted:** USPTO drops out. Wave A is now NIH RePORTER + SEC EDGAR + FDA Designations (3 in parallel, not 4).

---

**Write-owned by:** Workflows builder
**Workflow target:** NEW workflow (suggested name: `USPTO + PatentsView Patent Capture`)
**Working scope:** this folder (`practices/revops/workflows/uspto-patent-capture/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Workflows (builder)
**Status:** DEFERRED — see banner above. SPEC retained for re-issue when trigger fires.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`
**Engine principles:** `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md`

## Directive

Build a new n8n workflow that queries USPTO + PatentsView for patents assigned to each company in the RevOps Surface Companies table, and writes one `patent_filing` event row per patent to Company Events with full source content.

## Scope

- **New workflow** in the Creative Glue project (`zUtXwwXkg6z00OLO`).
- **Suggested name:** `USPTO + PatentsView Patent Capture`
- **Source:** USPTO PatentsView API (https://patentsview.org/apis) — free, no API key required for the base endpoints. Companion: USPTO public dataset (https://developer.uspto.gov/).
- **Input:** Companies rows (read via Airtable). For each, query PatentsView by normalized assignee name.
- **Target table:** Company Events (`tblnzX2b2kqNGzW6r`).
- **Provider value:** `patentsview` (auto-creates via typecast).
- **Event Type value:** `patent_filing` (auto-creates).

## Per-patent event row mapping

| Event field | Source |
|---|---|
| Event Type | `patent_filing` |
| Event Date | Patent filing date OR grant date (write whichever is present; prefer filing date) |
| Provider | `patentsview` |
| Company | Link to Companies row by normalized name match |
| Title | Patent title |
| Names | Inventor names, one per line |
| Categories / Tags | CPC classification codes, comma-joined |
| Detail | Patent abstract, capped at 8K |
| Source URL | `https://patents.google.com/patent/<patent_number>` |
| External ID | Patent number (e.g. `US12345678B2`) |
| Raw Reference | `patentsview:<patent_number>` |
| Signal State (raw) | Patent status if available (granted / pending / expired) |
| Vitality | `active` if granted and not expired; `ended` if expired or abandoned; `unknown` otherwise |
| Confidence | `high` |
| Detected At | Run timestamp |
| Is Latest | true on most recent observation per patent number |
| Raw Payload | Full PatentsView JSON record for the patent, capped at 95K |

## What to do

1. Build the workflow with these nodes:
   - Manual + scheduled trigger (weekly cadence to start)
   - Read Companies rows (filter to non-archived; field set: Company Name, Domain, Ultimate Parent)
   - For each company, query PatentsView by assignee organization name (and Ultimate Parent if present, separately)
   - Normalize results: dedupe by patent number; route unmatched assignee names to a `needs_data_quality_review` Enrichment Runs flag
   - Write one event row per patent to Company Events
   - Write a summary Enrichment Runs row
2. Use typecast=true on every Airtable write so new singleSelect options auto-create.
3. Implement `Is Latest` latch logic: when re-observing the same External ID, flip prior rows to false.
4. Activate manually first; run a 1-company smoke before scheduling.

## Hard rules

- **PatentsView is free.** No spend authorization needed for the API itself. n8n execution cost only.
- **Do not deduplicate based on name without provenance.** If a patent matches multiple Companies rows by assignee, write to each (Raw Reference disambiguates) rather than picking one.
- **Honor PatentsView rate limits.** 45 requests per minute per IP per their docs.
- **No autonomous full-cohort run.** Smoke on 1 company; report; await Nick's go for 122.

## Verification gate

Smoke test on one known patent-active company (e.g. Voyager Therapeutics or BioMarin):
- At least one `patent_filing` event row written.
- Title, Names, External ID, Source URL, Raw Payload all populated.
- The Companies row's existing `Patent Count` field (which has no writer today) is unaffected — Phase-2 will convert it to a rollup.

## Handoff

`practices/revops/workflows/HANDOFF-uspto-patent-capture-2026-05-20.md`. Include the workflow ID, smoke execution ID, and the resulting event row IDs.

## Out of scope

- USPTO direct (vs PatentsView) — PatentsView is the recommended primary; USPTO direct is fallback only.
- Google Patents direct (web wrapper) — secondary discovery only; PatentsView preferred for structured data.
- Patent-to-product mapping (which patent covers which pipeline asset). Phase-2.
