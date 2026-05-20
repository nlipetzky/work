# HANDOFF: USPTO + PatentsView Patent Capture

**Date:** 2026-05-20  
**Builder:** Workflows  
**Status:** Deployed — credential fix required before smoke run

---

## Deployed References

- **Workflow ID:** `1PorXD6WcENcXUow`
- **Version ID:** `ffd79029-252e-4f69-9884-22080f1bd9c7` (updated 2026-05-20 — base/table fix)
- **Smoke Execution ID:** NOT YET RUN — see Blocker below
- **Event Row IDs:** NOT YET WRITTEN

---

## Blocker: Credential Assignment

The n8n MCP auto-assigned the `ETA Jets` Airtable credential to all three Airtable nodes. This is the wrong credential for the RevOps Surface base (`appYBYH3aOHhTODAw`).

**Manual fix required in the n8n UI before running:**

| Node | Required credential |
|---|---|
| List Companies | RevOps Airtable API token (the one with access to `appYBYH3aOHhTODAw`) |
| Upsert Patent Event | Same |
| Create Enrichment Run | Same |

The HTTP Request node (Query PatentsView) has no credentials — correct, PatentsView is free/no key.

---

## Smoke Test Procedure

1. Fix credentials (above)
2. Open workflow `1PorXD6WcENcXUow` in n8n
3. On the **List Companies** node, temporarily add a filter condition to restrict to one known patent-active company: `{Company Name} = "Voyager Therapeutics"` (or BioMarin)
4. Click **Run Manually**
5. Verify:
   - At least one `patent_filing` event row in Company Events (`tblnzX2b2kqNGzW6r`)
   - Row has: Title, Names, External ID, Source URL, Raw Payload all populated
   - Provider = `patentsview`, Event Type = `patent_filing`
   - The Companies row `Patent Count` field is unaffected
6. Report the execution ID and created record IDs back to Boris
7. Remove the single-company filter
8. Await Nick's go before running on all ~122 companies

---

## Workflow Design Notes

**Is Latest latch:** Implemented via upsert (Airtable upsert operation) matching on the `Event ID` field. Event ID is a compound key: `{companyRecordId}--{patentNumber}`. Re-runs update the existing row in place rather than creating duplicates. `Is Latest = true` is always written.

**Ultimate Parent handling:** If a company has a non-empty Ultimate Parent field that differs from the Company Name, the workflow issues a second PatentsView query by the parent org name. Patents from both queries are deduped by `patent_id` before writing.

**Rate limiting:** 2-second wait per company after the upsert pass. PatentsView limit is 45 req/min. With up to 2 queries per company, 2s/company = ~30 companies/min, well within limit.

**Zero-patent companies:** If PatentsView returns 0 patents for a company, the `Has Patents?` IF node routes directly to `nextBatch` (skipping the upsert and wait), so the loop advances correctly.

**typecast=true:** Set on both Airtable write nodes. `patent_filing` and `patentsview` will be auto-created as new singleSelect options on first run.

---

## Node Credential Bindings (from live GET, 2026-05-20)

Credential fields are stripped by `get_workflow_details` MCP. Bindings were reported by `create_workflow_from_code`:

| Node | Assigned Credential | Correct? |
|---|---|---|
| List Companies | ETA Jets (airtableTokenApi) | **NO — needs RevOps token** |
| Upsert Patent Event | ETA Jets (airtableTokenApi) | **NO — needs RevOps token** |
| Create Enrichment Run | ETA Jets (airtableTokenApi) | **NO — needs RevOps token** |
| Query PatentsView | (none) | Correct — free API |

---

## Deployed Node Config Snapshot

Key parameters verified from `get_workflow_details` response:

**Upsert Patent Event:**
```json
{
  "operation": "upsert",
  "base": { "value": "appYBYH3aOHhTODAw" },
  "table": { "value": "tblnzX2b2kqNGzW6r" },
  "columns": {
    "mappingMode": "autoMapInputData",
    "matchingColumns": ["Event ID"]
  },
  "options": { "typecast": true, "ignoreFields": "_hasPatents,_companyRecordId,_companyName" }
}
```

**List Companies:**
```json
{
  "operation": "search",
  "base": { "value": "appYBYH3aOHhTODAw" },
  "table": { "value": "tblnj3YlOI3thjrXp" },
  "filterByFormula": "NOT({Canonical Status} = 'archived')",
  "returnAll": true,
  "fields": ["Company Name", "Domain", "Ultimate Parent"]
}
```

---

## Out of Scope (Phase 2)

- USPTO direct API (fallback to PatentsView for now)
- Pagination beyond 100 results per assignee (most biotech companies have <100 patents; can add cursor pagination if needed)
- Patent-to-product mapping
- Converting the Companies `Patent Count` field to a rollup from events
