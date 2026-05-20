# Workflows ticket — FDA Designations Capture (NEW workflow)

**Write-owned by:** Workflows builder
**Workflow target:** NEW workflow (suggested name: `FDA Designations Capture`)
**Working scope:** this folder (`practices/revops/workflows/fda-designations-capture/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Workflows (builder)
**Status:** SPEC. New workflow build.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`

## Directive

Build a new n8n workflow that captures FDA regulatory designations (Fast Track, Orphan Drug, RMAT, Breakthrough Therapy, Rare Pediatric Disease, Priority Review, Accelerated Approval) for sponsors in the RevOps Surface Companies table, and writes one `regulatory_designation` event row per designation to Company Events.

## Scope

- **New workflow.** Source: FDA public databases — Orphan Drug Database, Designations Lookup, FDA news releases.
- **Provider value:** `fda`
- **Event Type value:** `regulatory_designation`
- **Target:** Company Events

## Per-designation event row mapping

| Event field | Source |
|---|---|
| Event Type | `regulatory_designation` |
| Event Date | Designation grant date |
| Provider | `fda` |
| Company | Link by sponsor name match |
| Title | Designation type + product name (e.g. `Orphan Drug — fidanacogene elaparvovec for Hemophilia B`) |
| Names | Empty (designations are program-level, not person-level) |
| Categories / Tags | Designation type (one of: fast_track, orphan, rmat, breakthrough, rare_pediatric, priority_review, accelerated_approval), indication |
| Detail | Designation summary, capped at 8K |
| Source URL | Direct FDA database / press release URL |
| External ID | FDA designation number or press release ID |
| Raw Reference | `fda:<designation_id>` |
| Vitality | `active` if designation is current; `ended` if rescinded |
| Confidence | `high` |
| Raw Payload | Full source record, capped at 95K |

## What to do

1. Pull from these FDA public sources:
   - **Orphan Drug Designations:** https://www.accessdata.fda.gov/scripts/opdlisting/oopd/ (HTML-scrapable)
   - **CBER Designations** (gene therapy relevant): FDA news + press release feed
   - **RMAT designations:** typically announced via press release; combine FDA + trade press (Perplexity wrapper acceptable)
2. Match designations to Companies rows by sponsor name. Flag unmatched sponsors to a `needs_company_match` queue.
3. Use typecast=true.
4. Manual + scheduled trigger (monthly).

## Hard rules

- FDA databases are free. No spend authorization needed for FDA itself.
- **Trade press fallback for RMAT/Breakthrough** uses Perplexity — that's paid. Smoke on 1 company first.
- **No autonomous full-cohort run.** Smoke on Spark Therapeutics (known to have RMAT and Priority Review designations historically) first.

## Verification gate

Smoke on Spark Therapeutics:
- 1+ `regulatory_designation` event rows.
- Categories / Tags lists designation type.
- Source URL resolves to FDA.gov or a press release.

## Handoff

`practices/revops/workflows/HANDOFF-fda-designations-capture-2026-05-20.md`.

## Out of scope

- FDA Advisory Committee minutes capture. Phase-2.
- Approval status capture (separate event type `regulatory_approval`). Phase-2.
- 510(k) device clearances — not relevant to gene therapy plays.
