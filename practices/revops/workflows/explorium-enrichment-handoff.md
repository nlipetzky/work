# Explorium Companies Enrichment — Handoff

**Session date:** 2026-05-11  
**Pick up in:** fresh Claude Code session from `~/code/work/practices/revops/workflows/`

---

## Current state

The n8n workflow is built and the match → enrich chain is working end-to-end. The remaining work is:
1. Create 4 new Airtable fields
2. Update the Code node with correct field paths from the native Explorium node output
3. Run a clean 5-record test (use Tableau — it definitely returns firmographic data)
4. Flip `returnAll: true` and run the full 553 records

---

## n8n Workflow

**Workflow ID:** `Z6RROKx5omdfvhtn`  
**Name:** Companies Enrichment (Explorium → Airtable)  
**Instance:** `https://instig8.app.n8n.cloud`  
**Project:** INSTIG8 AI (`Pj1xUgbrL58T1CS1`)

### Node chain (9 nodes, all native — no AI agent)

```
Run Enrichment (manualTrigger)
  → Get Unenriched Companies (Airtable search, limit:5 for test)
  → Loop Over Companies (splitInBatches, batchSize:1)
    [batch] → Prepare for Match (Code — maps Airtable fields to name/domain)
            → Match Business (Explorium API, operation:match)
            → Enrich Firmographics (Explorium API, operation:enrich, ALL enrichment types)
            → Map to Airtable Fields (Code — needs updating, see below)
            → Update Company Record (Airtable update, autoMapInputData)
            → [loops back to Loop Over Companies]
```

### Critical node configs

**Match Business node**
```json
{
  "operation": "match",
  "businesses_to_match": {
    "businesses_to_match": [{
      "name": "={{ $('Get Unenriched Companies').item.json.fields['Company Name'] }}",
      "domain": "={{ $('Get Unenriched Companies').item.json.fields.Domain }}"
    }]
  }
}
```
Credential: `exploriumApi` → id `2hCOPHr2VEpraeAH` ("Explorium account")

**Enrich Firmographics node**
```json
{
  "operation": "enrich",
  "enrichment": ["firmographics", "technographics", "company_ratings", "financial_metrics",
    "funding_and_acquisitions", "challenges", "competitive_landscape", "strategic_insights",
    "workforce_trends", "linkedin_posts", "website_changes", "website_keywords",
    "lookalike_companies", "company_webstack", "company_hierarchy", "website_traffic",
    "business_intent_topics"],
  "business_ids": {
    "business_ids": [{ "id": "={{ $json.matched_businesses[0].business_id }}" }]
  },
  "min_score": 60
}
```

**Airtable Search node** (currently limited to 5 for testing)
- Base: `appYBYH3aOHhTODAw`, Table: `tblnj3YlOI3thjrXp`
- Formula: `AND({Enrichment Status} = '', {Domain} != '')`
- `returnAll: false`, `limit: 5` — **flip to `returnAll: true` after test passes**

**Airtable Update node**
- Same base/table, `mappingMode: "autoMapInputData"`, `typecast: true`
- Credential: `airtableTokenApi` → id `oWpVVSd23y4jOtSK`

---

## Enrich node output structure

The native Explorium node wraps all results in `enrichmentsResponse`:

```json
{
  "enrichmentsResponse": [
    {
      "enrichment_type": "firmographics",
      "response": {
        "request_status": "success",
        "data": { ...firmographic fields... },
        "entity_id": "...",
        "total_results": 1
      },
      "hasData": true
    },
    { "enrichment_type": "technographics", ... },
    ...
  ]
}
```

**To access firmographics:** `enrichmentsResponse.find(e => e.enrichment_type === 'firmographics')`

**Confirmed firmographic field names** (from direct Explorium MCP, with `firmo_` prefix):

| firmo_ field | Value example |
|---|---|
| `firmo_naics_description` | "Software Publishers" |
| `firmo_naics` | "5112" |
| `firmo_number_of_employees_range` | "1001-5000" |
| `firmo_yearly_revenue_range` | "500M-1B" |
| `firmo_country_name` | "united states" |
| `firmo_region_name` | "washington" |
| `firmo_city_name` | "seattle" |
| `firmo_linkedin_profile` | "https://www.linkedin.com/company/tableau-software" |
| `firmo_ticker` | null (or "NASDAQ:XYZ") |
| `firmo_business_description` | "Tableau helps people see..." |
| `firmo_website` | "https://www.tableau.com/" |

**IMPORTANT — unknown:** The native n8n node's `response.data` may or may not have the `firmo_` prefix. The Code node (step 2 below) uses fallback logic to handle both cases.

---

## Step 1: Create 4 new Airtable fields

Base: `appYBYH3aOHhTODAw` — Table: Companies (`tblnj3YlOI3thjrXp`)

Use `mcp__997baadc-8d4d-4759-89f5-2c784d9162bb__create_field` for each:

| Field name | Type | Purpose |
|---|---|---|
| `HQ City` | `singleLineText` | `firmo_city_name` |
| `NAICS Code` | `singleLineText` | `firmo_naics` |
| `Stock Ticker` | `singleLineText` | `firmo_ticker` |
| `Explorium Business ID` | `singleLineText` | business_id from match (for dedup/reuse) |

Record the field IDs returned — needed for the Code node.

**Already-existing fields** that will be populated (no creation needed):

| Field | ID | Source |
|---|---|---|
| Industry | `fldUHwakW7yPjPkb4` | `firmo_naics_description` |
| Revenue Range | `fld3UZDhUdXPtFPf8` | `firmo_yearly_revenue_range` |
| Country | `fldFQbbX88x3r6Ar1` | `firmo_country_name` |
| Company LinkedIn URL | `fldcLt7qGq6MfKncq` | `firmo_linkedin_profile` |
| Employee Range | `fldFd5qXJ8d01GN17` | `firmo_number_of_employees_range` |
| HQ State | `fldaHbzPvWkkTNkl1` | `firmo_region_name` |
| Last Enriched At | `fldCVsgnVpsr2bz7m` | `new Date().toISOString()` |
| Enrichment Status | `fldyfIr4H4lSIYZdC` | `enrichment_complete` / `enrichment_incomplete` |

---

## Step 2: Update the "Map to Airtable Fields" Code node

PUT to `https://instig8.app.n8n.cloud/api/v1/workflows/Z6RROKx5omdfvhtn`

Replace the `jsCode` in the `Map to Airtable Fields` node with:

```javascript
const enrichments = $json.enrichmentsResponse || [];
const original = $("Get Unenriched Companies").item.json;
const matchOut = $("Match Business").item.json;

// Find firmographics entry
const firmoEntry = enrichments.find(e => e.enrichment_type === 'firmographics');
const hasData = firmoEntry?.hasData || false;
const d = firmoEntry?.response?.data || {};

// Helper: try both firmo_prefixed and bare field names
const f = (name) => d['firmo_' + name] ?? d[name] ?? null;

// business_id from match output
const business_id = matchOut?.matched_businesses?.[0]?.business_id || null;
const matched = hasData && !!business_id;

return [{ json: {
  id: original.id,
  "Industry":              f('naics_description'),
  "Revenue Range":         f('yearly_revenue_range'),
  "Country":               f('country_name'),
  "Company LinkedIn URL":  f('linkedin_profile') || f('linkedin_url'),
  "Employee Range":        f('number_of_employees_range'),
  "HQ State":              f('region_name'),
  "HQ City":               f('city_name'),
  "NAICS Code":            f('naics'),
  "Stock Ticker":          f('ticker'),
  "Explorium Business ID": business_id,
  "Last Enriched At":      new Date().toISOString(),
  "Enrichment Status":     matched ? "enrichment_complete" : "enrichment_incomplete"
} }];
```

---

## Step 3: First test run — 5 records (must include Tableau)

Tableau (`tableau.com`) confirmed-matchable in Explorium. Use these 5 record IDs for the test reset:

- `rec1ccHC8DlO6cPVR` — Tableau
- `rec1bjCSqzefykwES` — Nanoscope Therapeutics
- `rec1L2tBbU89yv2JC` — ImmPACT Bio
- `rec0VVjV895xlzPr4` — Opus Recruitment Solutions
- `rec03zeF3aFdztbwW` — Sensorion

Reset these via Airtable MCP (clear `fldyfIr4H4lSIYZdC` and `fldCVsgnVpsr2bz7m` to null) before running.

**After the run:**
1. In n8n, open "Enrich Firmographics" output — confirm `enrichmentsResponse[0].response.data` field names (with or without `firmo_` prefix)
2. If field names differ from what's in the Code node, update the `f()` helper
3. Check Airtable: Tableau row should have Industry = "Software Publishers", Revenue Range = "500M-1B", Country = "united states"

---

## Step 4: Full run

Once the 5-record test passes:
1. Update "Get Unenriched Companies" node: `returnAll: true`, remove `limit: 5`
2. Execute workflow — it will process all unenriched Companies records
3. Monitor: ~553 records, ~1 record/second through the loop

---

## API credentials (for REST API calls if needed)

```
N8N_URL: https://instig8.app.n8n.cloud/api/v1
N8N_API_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZTM1ODBjZS00NWU2LTQ3MGUtOTFiMS01NTUyYWNkOTg2ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWNhNDhlZTAtMmJmMC00YjhiLTg1OTYtZDE1MGFlY2EwOGZiIiwiaWF0IjoxNzcyNTcyMDAyfQ.ks6W5n8kDlNRLY5W98OmHFNp_532uskduUoobXAhU1c
AIRTABLE_BASE: appYBYH3aOHhTODAw
COMPANIES_TABLE: tblnj3YlOI3thjrXp
```

PUT allowedSettings strip: `["executionOrder","timezone","saveManualExecutions","saveExecutionProgress","saveDataSuccessExecution","saveDataErrorExecution","executionTimeout","errorWorkflow","callerPolicy","callerIds","maxAgentSteps"]`

---

## Known issues resolved in this session

- n8n-mcp SDK returns HTTP 500 for Airtable v2.2 nodes → use REST API directly
- Airtable v2.2 returns nested `{ id, fields: {...} }` not flat → use `$json.fields['Company Name']`
- AI agent `text` parameter needs `=` prefix for expression evaluation
- `lmChatAnthropic` model param needs `{ __rl: true, mode: "list", value: "..." }` format
- Haiku hallucinates `tool_reasoning` param → switched to Sonnet → output parser errors → dropped AI agent entirely in favor of native Explorium nodes
