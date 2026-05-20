# HANDOFF — PubMed Publication Capture

**Date:** 2026-05-20
**Status:** Deployed, awaiting smoke verification
**Issued by:** Workflows builder → Boris (orchestrator)

---

## Deployment references

| Artifact | ID |
|---|---|
| Workflow ID | `poYzPN589ZK4zfO5` |
| Workflow URL | https://instig8.app.n8n.cloud/workflow/poYzPN589ZK4zfO5 |
| Source file | `practices/revops/workflows/pubmed-capture/workflow-sdk.js` |
| Node count | 18 |

No execution IDs yet. No run has been triggered.

---

## Credential status

The n8n MCP did not auto-assign any credentials. Two node types need manual wiring before first run:

- **Airtable nodes** (4 nodes: Co List Companies, Ct List Contacts, Co Create Company Events, Ct Create Contact Events) — need Airtable credential
- **HTTP Request nodes** (4 nodes: Co PubMed Search, Co Fetch Publication XML, Ct PubMed Author Search, Ct Fetch Author XML) — NCBI E-utilities is a free public API, **no auth required**; these nodes should work without credentials

---

## What was built

**Dual-target workflow.** Manual trigger + monthly schedule (1st of each month, 06:00 UTC). Both paths run in parallel from the same trigger.

### Company path (Company Events → `tblnzX2b2kqNGzW6r`)

1. `Co List Companies` — Airtable list, `NOT({Company Name} = '')` filter, pulls Company Name + Ultimate Parent
2. `Co Split Companies` — SplitInBatches, batchSize=1
3. `Co Build Company Query` — Code: 400ms rate-limit delay, builds `"CompanyName"[Affiliation]` (OR `"UltimateParent"[Affiliation]` if different)
4. `Co PubMed Search` — HTTP GET esearch.fcgi, retmax=100, sort by pub date, returns JSON
5. `Co Has Publications?` — IF `parseInt(count) > 0`
6. `Co Fetch Publication XML` — HTTP GET efetch.fcgi, all PMIDs comma-joined, retmode=xml, rettype=abstract, response as text
7. `Co Parse & Build Events` — Code: regex parse PubMed XML → one item per publication with: event_id, pmid, title, detail (abstract, 8K cap), authors (newline-separated), pub_date, mesh_terms (newline-separated), source_url, raw_payload (95K cap)
8. `Co Create Company Events` — Airtable create, typecast=true, writes all per-publication event row fields

### Contact path (Contact Events → `tblDYItHaNcT2gnwi`)

Same shape. Key differences:
- Author query: `"LastName FI[Author]"` (first initial from First Name field)
- `Ct Parse & Disambiguate` — Code: after parsing XML, checks each article's affiliation strings against contact's company name (after stripping common legal suffixes). Sets `confidence=high` + clears `signal_state` if match; `confidence=low` + `signal_state=needs_dq_review` if no affiliation match or no affiliation present.

---

## Verification gate (per PROMPT.md)

Smoke on Voyager Therapeutics (company) + one known-publishing contact before full cohort:

1. Wire Airtable credentials on all 4 Airtable nodes.
2. Manually trigger the workflow (`Manual Trigger` node).
3. Pull Company Events filtered to Voyager Therapeutics via Airtable MCP:
   - Expect: multiple `publication` event rows
   - Expect: `Event Type = publication`, `Provider = pubmed`, `External ID = <PMID>`, `Source URL = https://pubmed.ncbi.nlm.nih.gov/<PMID>/`
   - Expect: `Categories / Tags` populated with MeSH terms
4. Pull Contact Events for the known-publishing contact:
   - Expect: 1+ rows with `Event Type = publication`
   - `Confidence = high` if affiliation matched; `Signal State (raw) = needs_dq_review` if not
5. Confirm no regression on Company or Contact identity fields.
6. Re-pull live workflow JSON and verify Airtable credential binding per node (REST PUT note: MCP create preserves credentials on initial deploy; verify field-by-field on first update).

---

## Hard limits honored

- Rate limit: 400ms delay in each Code node before HTTP call (~2.5 req/sec, under NCBI's 3/sec free limit)
- Abstract capped at 8K characters
- Raw payload capped at 95K characters
- No autonomous full-cohort run authorized. Smoke first.
- Ambiguous contact matches flagged (`needs_dq_review`), not suppressed.

---

## Out of scope (Phase-2)

- Citation count / iCite API (Magnitude field left empty)
- bioRxiv / preprint capture
- Full-text retrieval (abstract only)
- Citation network analysis
- NCBI API key (apply at scale; current 3/sec limit is sufficient for 122-company cohort)

---

## Files

| File | Purpose |
|---|---|
| `practices/revops/workflows/pubmed-capture/workflow-sdk.js` | Source of truth — n8n Workflow SDK code |
| `practices/revops/workflows/pubmed-capture/workflow.json` | Raw n8n JSON (reference, may drift) |
| `practices/revops/workflows/HANDOFF-pubmed-capture-2026-05-20.md` | This file |
