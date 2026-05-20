# Workflows ticket — PubMed Publication Capture (NEW workflow, dual-target)

**Write-owned by:** Workflows builder
**Workflow target:** NEW workflow (suggested name: `PubMed Publication Capture`)
**Working scope:** this folder (`practices/revops/workflows/pubmed-capture/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Workflows (builder)
**Status:** SPEC. New workflow build.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`

## Directive

Build a new n8n workflow that queries PubMed (NCBI E-utilities) for publications associated with each company or named contact in the RevOps Surface base, and writes one `publication` event row per publication. **Dual target:** company-affiliated publications go to Company Events; author-attributed publications go to Contact Events.

## Scope

- **New workflow.** Source: PubMed via NCBI E-utilities (https://www.ncbi.nlm.nih.gov/books/NBK25501/). Free.
- **Provider value:** `pubmed`
- **Event Type value:** `publication`
- **Targets:** Company Events AND Contact Events.
- **Inputs:** Companies rows (by name); Contacts rows (by name + LinkedIn URL for disambiguation).

## Per-publication event row mapping

| Event field | Source |
|---|---|
| Event Type | `publication` |
| Event Date | Publication date |
| Provider | `pubmed` |
| Company / Contact | Link as appropriate |
| Title | Article title |
| Names | All author names, one per line |
| Categories / Tags | MeSH terms, one per line |
| Detail | Abstract, capped at 8K |
| Source URL | `https://pubmed.ncbi.nlm.nih.gov/<PMID>/` |
| External ID | PMID |
| Raw Reference | `pubmed:<PMID>` |
| Vitality | `active` (publications don't expire) |
| Confidence | `high` |
| Magnitude | Citation count if obtainable |
| Magnitude Unit | `citations` |
| Raw Payload | Full PubMed XML / JSON record for the publication, capped at 95K |

## What to do

1. Two query paths in the workflow:
   - **Company-mode:** for each Company row, query PubMed for `<Company Name>[Affiliation]` (and Ultimate Parent if different).
   - **Contact-mode:** for each Contact row with a known LinkedIn / full name, query PubMed for `<Last Name> <First Initial>[Author]` and filter by affiliation match against the contact's company.
2. Disambiguate author name collisions using affiliation + co-author overlap. Flag ambiguous matches to a `needs_data_quality_review` queue rather than guessing.
3. Use typecast=true.
4. Manual + scheduled trigger (monthly initially).

## Hard rules

- PubMed E-utilities is free. Honor NCBI's rate limits: 3 requests per second without an API key, 10 per second with one (apply for an API key if scaling).
- **No autonomous full-cohort run.** Smoke on a known publication-active company + contact (Lexeo CTO, or Voyager) first.
- Author disambiguation is a real problem; do not write a Contact Events row for an ambiguous match without flagging.

## Verification gate

Smoke on one company (e.g. Voyager Therapeutics) + one named contact known to publish:
- Multiple `publication` event rows on Company Events.
- 1+ `publication` event rows on Contact Events.
- MeSH terms populated in `Categories / Tags`.

## Handoff

`practices/revops/workflows/HANDOFF-pubmed-capture-2026-05-20.md`.

## Out of scope

- bioRxiv / preprint capture. Phase-2.
- Full-text retrieval (only abstract). Phase-2.
- Citation network analysis. Phase-2.
