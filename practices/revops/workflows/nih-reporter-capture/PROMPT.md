# Workflows ticket — NIH RePORTER Grant Capture (NEW workflow)

**Write-owned by:** Workflows builder
**Workflow target:** NEW workflow (suggested name: `NIH RePORTER Grant Capture`)
**Working scope:** this folder (`practices/revops/workflows/nih-reporter-capture/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Workflows (builder)
**Status:** SPEC. New workflow build.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`

## Directive

Build a new n8n workflow that queries NIH RePORTER for grants awarded to each company / institution in the RevOps Surface Companies table, and writes one `nih_grant` event row per award to Company Events.

## Scope

- **New workflow.** Source: NIH RePORTER API (https://api.reporter.nih.gov/), free, public.
- **Provider value:** `nih_reporter`
- **Event Type value:** `nih_grant`
- **Target:** Company Events

## Per-grant event row mapping

| Event field | Source |
|---|---|
| Event Type | `nih_grant` |
| Event Date | Award notice date OR project start date |
| Provider | `nih_reporter` |
| Company | Link by organization name match |
| Title | Grant project title |
| Names | PI name(s), one per line |
| Categories / Tags | NIH IC code, activity code (R01, SBIR, etc.), one per line |
| Magnitude | Award amount USD |
| Magnitude Unit | `USD` |
| Detail | Project abstract / public description, capped at 8K |
| Source URL | `https://reporter.nih.gov/project-details/<project_id>` |
| External ID | NIH project number (e.g. `1R01EY012345-01`) |
| Raw Reference | `nih_reporter:<project_number>` |
| Vitality | `active` if project end date is in the future; `ended` if past |
| Confidence | `high` |
| Raw Payload | Full RePORTER record JSON, capped at 95K |

## What to do

1. Manual + scheduled trigger (monthly).
2. Read Companies rows (Company Name + Ultimate Parent + any known associated academic institution names — note this is a data quality issue for early-stage academic spinouts; flag any company missing an institution affiliation).
3. Query RePORTER by organization name. Iterate pages.
4. Write event rows to Company Events. Use typecast=true.
5. Smoke on 1 company first.

## Hard rules

- NIH RePORTER is free. No spend authorization needed beyond n8n execution.
- Honor RePORTER's rate limits (1 request per second per their docs).
- **Critical for the AAV play context:** academic-spinout AAV companies often surface here before they appear on CT.gov. The data here is high-signal for pre-clinical discovery. Build accordingly.
- **No autonomous full-cohort run.** Smoke first.

## Verification gate

Smoke on one company known to have NIH funding (e.g. a Sangamo, Voyager, or academic-spinout candidate):
- At least one `nih_grant` event row.
- All mapped fields populated.

## Handoff

`practices/revops/workflows/HANDOFF-nih-reporter-capture-2026-05-20.md`.

## Out of scope

- Grants.gov (broader federal grants, separate ticket if useful).
- PI-to-contact resolution. Phase-2 contact-side capture concern.
