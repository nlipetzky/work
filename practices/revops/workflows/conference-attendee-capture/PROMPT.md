# Workflows ticket — Conference Attendee Capture (NEW workflow)

**Write-owned by:** Workflows builder
**Workflow target:** NEW workflow (suggested name: `Conference Attendee Capture`)
**Working scope:** this folder (`practices/revops/workflows/conference-attendee-capture/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Workflows (builder)
**Status:** SPEC. New workflow build.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`

## Directive

Build a new n8n workflow that captures conference attendee, presenter, and exhibitor information from ASGCT, BioProcess International, JPM Healthcare, and BIO International programs, writing `conference_appearance` (company-level) and `conference_speaker` (contact-level) event rows.

## Scope

- **New workflow.** Sources: per-conference websites or program PDFs.
- **Provider values** (per conference): `asgct`, `bioprocess_international`, `jpm_healthcare`, `bio_international`
- **Event Type values:** `conference_appearance` (Company Events), `conference_speaker` (Contact Events)
- **Targets:** Company Events + Contact Events

## Per-conference-appearance event row mapping

| Event field | Source |
|---|---|
| Event Type | `conference_appearance` or `conference_speaker` |
| Event Date | Conference start date (or the specific session date if attributable) |
| Provider | per-conference value above |
| Company / Contact | Link as appropriate |
| Title | Conference name + year + session title if applicable |
| Names | Presenter / panelist names, one per line |
| Categories / Tags | Conference track / theme tags |
| Detail | Abstract or session description, capped at 8K |
| Source URL | Conference program URL for the specific session |
| External ID | Conference + year + session ID (e.g. `asgct-2026-AB123`) |
| Raw Reference | `<provider>:<external_id>` |
| Vitality | `active` if conference is current/future; `ended` if past |
| Confidence | `high` if from official program; `medium` if scraped from sponsor list |
| Raw Payload | Full session / attendee record, capped at 95K |

## What to do

This source is less structured than APIs. Two approaches; choose pragmatically per conference:

1. **RAG-fetch + structured extract** (preferred for HTML-based programs): use Apify RAG Web Browser or equivalent to fetch the program pages, then LLM-extract structured rows (Anthropic Claude). Write to the appropriate events table.
2. **PDF parse** (for PDF-only programs): use n8n's PDF Extract or a Python step to parse the program PDF.

For each company / contact, attempt to match attendees by name. Unmatched attendees that look like AAV/biotech roles → write to a `needs_company_match` queue for manual reconciliation.

Use typecast=true on Airtable writes.

## Hard rules

- **LLM-extraction is a paid operation.** Smoke on one conference (start with ASGCT 2026, the most AAV-relevant) before any broader run. Anthropic spend authorization required.
- **Conference data quality varies.** Flag low-confidence rows (`Confidence = medium`) rather than dropping them.
- **Build once per conference, not one workflow per conference.** Parameterize the conference, source URL, and program structure as workflow inputs.

## Verification gate

Smoke on ASGCT 2026 program (or 2025 if 2026 is not yet posted):
- Multiple `conference_appearance` event rows on Company Events for known AAV companies (Spark, BioMarin, Sarepta, Voyager).
- 1+ `conference_speaker` rows on Contact Events for named presenters.
- The `Conference Attendance 12mo Count` field on Companies (currently no writer) is unaffected; Phase-2 converts to a rollup.

## Handoff

`practices/revops/workflows/HANDOFF-conference-attendee-capture-2026-05-20.md`. Include the LLM extraction prompt / pattern used.

## Out of scope

- Conference registration / lead lists (sales data, behind paywalls).
- Real-time conference Twitter / LinkedIn capture. Phase-2.
- Conference-specific scoring (which conferences matter for which plays). Phase-2 view-time concern.
