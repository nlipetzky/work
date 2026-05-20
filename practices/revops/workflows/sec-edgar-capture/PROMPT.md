# Workflows ticket — SEC EDGAR Filing Capture (NEW workflow)

**Write-owned by:** Workflows builder
**Workflow target:** NEW workflow (suggested name: `SEC EDGAR Filing Capture`)
**Working scope:** this folder (`practices/revops/workflows/sec-edgar-capture/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Workflows (builder)
**Status:** SPEC. New workflow build.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`

## Directive

Build a new n8n workflow that queries SEC EDGAR for 10-K / 10-Q / 8-K / S-1 / proxy filings for every public company in the RevOps Surface Companies table (join key: `SEC CIK`), and writes one `sec_filing` event row per filing to Company Events.

## Scope

- **New workflow.** Source: SEC EDGAR (https://www.sec.gov/edgar/sec-api-documentation). Free, no API key.
- **Provider value:** `sec_edgar`
- **Event Type value:** `sec_filing`
- **Target:** Company Events
- **Input filter:** Companies rows where `SEC CIK` is populated (public companies only).

## Per-filing event row mapping

| Event field | Source |
|---|---|
| Event Type | `sec_filing` |
| Event Date | Filing date (`filedAt`) |
| Provider | `sec_edgar` |
| Company | Link by SEC CIK match |
| Title | Filing type + period (e.g. `10-K — FY2025`) |
| Names | Reporting officer names if extractable from filing header |
| Categories / Tags | Filing type code, primary SIC code |
| Detail | Filing description / item summary, capped at 8K |
| Source URL | Direct EDGAR filing URL (`https://www.sec.gov/Archives/edgar/data/<cik>/...`) |
| External ID | Accession number |
| Raw Reference | `sec_edgar:<accession_number>` |
| Vitality | `active` for all filings (they don't expire) |
| Confidence | `high` |
| Raw Payload | Filing metadata JSON + extracted text of items 1, 1A, 7, 7A (for 10-K/Q), capped at 95K |

## What to do

1. Manual + scheduled trigger (daily for 8-K, weekly for 10-K/Q).
2. Read public Companies rows (filter: `SEC CIK` not empty). Resolve CIK to padded 10-digit form for EDGAR API.
3. For each CIK, query `https://data.sec.gov/submissions/CIK<padded>.json` for recent filings.
4. Filter by filing type (10-K, 10-Q, 8-K, S-1, proxy).
5. For each new filing (External ID not already in Company Events), fetch the filing document, extract key text sections, write the event row.
6. Use typecast=true.

## Hard rules

- SEC EDGAR is free. Honor their fair-use policy: max 10 requests per second per their docs; include a descriptive User-Agent (e.g. `Teknova RevOps - nick@lipetzky.com`).
- **No autonomous full-cohort run.** Smoke on 1-2 public companies (BioMarin, Pfizer) first.
- Filing content can be large. Honor the 95K cap on Raw Payload; truncate at section boundaries when possible.

## Verification gate

Smoke on BioMarin (BMRN, CIK = 0001048477):
- 5+ recent filings written as event rows.
- Source URL resolves to a real EDGAR document.
- Raw Payload contains extracted text (not raw HTML).

## Handoff

`practices/revops/workflows/HANDOFF-sec-edgar-capture-2026-05-20.md`.

## Out of scope

- Form 4 (insider trading) capture. Defer to Phase-2.
- 13F holdings — investor-side, not company-side.
- XBRL financial data extraction. Phase-2 if/when financial analysis is needed.
