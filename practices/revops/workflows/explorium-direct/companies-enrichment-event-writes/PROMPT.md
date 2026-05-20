# Explorium-Direct ticket — Companies Enrichment: write event rows to Company Events

**Write-owned by:** Explorium-Direct builder
**Workflow target:** `Z6RROKx5omdfvhtn` (Companies Enrichment Explorium → Airtable) — shared owner with the `capture-all-explorium-fields` ticket; coordinate via folder neighbor
**Working scope:** this folder (`practices/revops/workflows/explorium-direct/companies-enrichment-event-writes/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Explorium-Direct (builder)
**Status:** SPEC. Companion to the existing capture-all-fields ticket.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`
**Composes with:** `practices/revops/workflows/explorium-direct/PROMPT-capture-all-explorium-fields-2026-05-20.md`
**Engine principles:** `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md`

## Directive

The existing capture-all-fields ticket adds per-field `explorium_*` columns to Companies for every Explorium business field. **Extend the same workflow** to also write one event row per discrete business event Explorium returns — funding rounds, leadership hires, partnerships, IPO, M&A — to Company Events with full source content. Do not collapse these into Companies columns; they belong in events.

## Scope

- **Workflow ID:** `Z6RROKx5omdfvhtn` (Companies Enrichment, Explorium → Airtable). Same workflow as the capture-all-fields ticket.
- **Provider value:** `explorium` (auto-creates via typecast).
- **Target table:** Company Events (`tblnzX2b2kqNGzW6r`).
- **Source path:** the Explorium `business_events` response on Enrich Deep, OR the `fetch-businesses-events` endpoint if needed.

## Event types to write (one row per discrete event)

| Explorium event type | Our Event Type |
|---|---|
| funding round | `funding_round` |
| leadership / executive hire | `leadership_hire` |
| partnership / collaboration | `partnership` |
| IPO | `ipo` |
| M&A / acquisition | `mna` |
| product launch | `product_launch` |
| layoff / restructuring | `restructuring` |
| office expansion | `expansion` |

The exact Explorium event-type taxonomy may differ; map Explorium's strings to our normalized set above. Capture Explorium's raw type in `Signal State (raw)`.

## Per-event row mapping

| Event field | Source from Explorium business_events object |
|---|---|
| Event Type | normalized per the table above |
| Event Date | event date from Explorium |
| Provider | `explorium` |
| Company | linked Companies row |
| Title | event title / short label |
| Names | for hires: hire name + role; for fundings: lead investor; for M&A: acquirer/target |
| Categories / Tags | round type (Series A/B/C), event tags |
| Magnitude | funding amount, deal size, headcount delta where applicable |
| Magnitude Unit | `USD`, `employees`, etc. |
| Detail | event narrative from Explorium |
| Source URL | Explorium's cited source URL if provided; otherwise empty |
| External ID | Explorium event identifier |
| Raw Reference | `explorium:business_events:<event_id>` |
| Signal State (raw) | Explorium's raw event-type string |
| Vitality | `active` for ongoing partnerships, ended/active for hires based on tenure, etc. — derive sensibly |
| Confidence | `high` for direct Explorium events; `medium` if inferred |
| Detected At | run timestamp |
| Is Latest | true on most recent observation per External ID |
| Raw Payload | full Explorium event object JSON, capped at 95K |

## Website-fetch-hit events (additional)

The Companies Enrichment workflow's `Fetch Pages` + `Check AAV Modality` nodes already pull the company website and scan for AAV vocabulary. **Write one `website_evidence_hit` event row** per fetch that yielded modality vocabulary hits:

- Event Type: `website_evidence_hit`
- Provider: `explorium` (or `direct_fetch` if we differentiate — recommend `explorium` for now since the fetch is part of the same workflow)
- Title: page URL fetched
- Detail: matched anchor + mechanism words, with surrounding context
- Categories / Tags: matched token list
- Source URL: the fetched page URL
- Raw Payload: the cleaned page text, capped at 95K

## What to do

1. Read the current `Z6RROKx5omdfvhtn` workflow (post-capture-all-fields-ticket). Confirm credentials are intact.
2. Add a node (or extend `Map Enriched Fields`) that produces an array of event-row payloads from the Explorium business_events response.
3. Add a downstream Airtable node that creates the event rows in Company Events.
4. Add another path for `website_evidence_hit` events from the `Check AAV Modality` output.
5. Use typecast=true on Airtable writes so new singleSelect options auto-create.
6. Implement Is Latest latch for repeat observations.
7. Deploy via credential-preserving REST PUT. Verify credentials intact.

## Hard rules

- **Do not bulk-trigger paid Explorium runs.** This ticket extends the workflow's outputs; it does not change the trigger pattern. Smoke against saved historical executions or against one company with explicit Nick authorization.
- **REST PUT wipes credentials.** Capture + read-back per the n8n protocol.
- **Composability:** this ticket assumes the capture-all-fields ticket has shipped. If the per-field `explorium_*` columns aren't on Companies yet, ship them first.
- **Honor the principles.** Events are the source of truth; Companies columns are the cache. Do not write event-derived aggregates to Companies in this workflow — that's Phase-2 rollup work.

## Verification gate

Smoke on one company (use a saved historical execution where Explorium returned multiple business_events):
- One event row per Explorium event in Company Events.
- All mapped fields populated.
- A `website_evidence_hit` event row exists if the company's website was fetched and matched.
- Companies row's `explorium_*` columns still populate from the existing capture-all-fields logic.
- Workflow credentials intact post-deploy.

## Handoff

`practices/revops/workflows/explorium-direct/HANDOFF-companies-enrichment-event-writes-2026-05-20.md`. Include the smoke execution ID, the resulting event row IDs, and the diff vs the post-capture-all-fields baseline.

## Out of scope

- Contact-side prospect events. Separate ticket: `PROMPT-contact-sourcing-event-writes-2026-05-20.md`.
- Removing Companies columns that now have event-row equivalents. Phase-2.
- L2 reading from events instead of fetching CT.gov live. Phase-2 L2 refactor.
