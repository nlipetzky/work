# Handoff: Explorium → Airtable direct enrichment

**Status:** templates imported, build location decided, ready to plan the first workflow. Previous Supabase → Airtable approach is dead. Do not revive.

## What Nick wants

Direct enrichment from Explorium into the Airtable base **RevOps Surface** (`appYBYH3aOHhTODAw`). No Supabase. No run log gymnastics. Single-purpose workflows, one per use case.

Nick will handle "the rest" himself later. The deliverable here is: enriched data lands reliably in Airtable.

## Build location

All workflow artifacts live under `practices/revops/workflows/explorium-direct/`. The `n8n-practice/` folder is reserved for reusable patterns and skills, not engagement-specific workflows.

Proposed structure:

```
practices/revops/workflows/explorium-direct/
  README.md                          -- index + status of each workflow
  reference/
    airtable-revops-surface.md       -- field map for Companies + Contacts tables
    explorium-templates-inventory.md -- what each imported template does + verdict
    rate-limit-strategy.md           -- the 5 req/sec plan, proven before reuse
  <workflow-slug>/
    design.md                        -- inputs, outputs, node-by-node intent
    workflow.ts                      -- n8n SDK source (if rewriting from scratch)
    NOTES.md                         -- execution observations, gotchas
```

Workflow slug examples: `hubspot-to-explorium-enrich`, `salesforce-lead-qualify`, `gmail-outreach-from-leads`. One folder per workflow. Keep them isolated so failure in one doesn't pollute the others.

## Templates available

Nick imported 8 Explorium templates into n8n project **INSTIG8 AI > RevOps > Explorium templates** folder (confirmed live in the UI):
https://instig8.app.n8n.cloud/projects/Pj1xUgbrL58T1CS1/folders/btf3VTheihpzLRMN/workflows

Source: n8n.io creator page (https://n8n.io/creators/explorium):

1. Automated AI lead enrichment: Salesforce → Explorium
2. Enrich company firmographic data in Google Sheets with Explorium MCP
3. Automate sales meeting prep with Claude AI + Explorium Intelligence
4. Search business prospects with natural language (Explorium MCP)
5. Automated AI lead enrichment: HubSpot → Explorium
6. Automate HubSpot → Salesforce lead creation with Explorium enrichment
7. Generate personalized sales leads with Claude AI + Explorium for Gmail outreach
8. Qualify leads with Salesforce, Explorium data + Claude AI

**Before building anything**, audit each template:
- Does it match a use case Nick actually has?
- What credentials does it require?
- What's its trigger / input shape?
- Which can be adapted to write into Airtable RevOps Surface instead of Salesforce/HubSpot/Sheets?

Write the audit to `reference/explorium-templates-inventory.md` with a verdict per template: adapt / discard / hold.

## Open questions Nick still needs to answer

These were asked but not answered before the session ended:

1. **"Eniden"** — likely typo. Could be a person (Ellie?), a company, an account name, or autocorrect. Ask.
2. **Input cohort** — where does the list of companies/contacts come from?
   - A. Already in Airtable Companies table (enrich-in-place)
   - B. A separate input list (CSV, paste, etc.)
   - C. Explorium discovery fetch first, then enrich

Do not start building until both are answered. Build-first-ask-later is what burned the last 4 hours.

## What is in place (and should be left alone)

- **Airtable base `appYBYH3aOHhTODAw`** — "RevOps Surface". Tables: Companies, Contacts, Data Status, Play, Sync Runs.
  - Companies and Contacts already have the field schema we want (~55 / ~40 fields).
  - Sync Runs table can stay or be ignored; previous workflow wrote to it. Not needed.
- **Supabase `mrmnyscurmkfppicqqhk` (revops-engine-dev)**
  - `sync_runs` table + `sync_runs_active` view exist. Drop them on Nick's say-so. Not needed.
- **n8n workflow `GRo45TloP6Awor4V`** — abandoned Supabase → Airtable Sync. Archive or delete on Nick's say-so. Do not modify.

## What was abandoned and why

Previous approach: Supabase `playbook_evaluations` → companies/contacts → Airtable, with run log in `sync_runs`.

**Worked end-to-end but unreliable.** Four-hour bug hunt covered:
- SDK rewrites kept wiping HTTP node credentials
- Schema mismatch (`company_id` vs `account_id` on playbook_evaluations)
- n8n HTTP node wrapped PostgREST responses as `{data: "<JSON string>"}` — required defensive JSON.parse
- Airtable v2.2 node `upsert` needed schema cached via UI; SDK couldn't inline
- **Final blocker:** Airtable rate limit (5 req/sec). 100 parallel batches → 60% HTTP 429. `Retry On Fail` didn't trigger because `neverError: true` masked failures.

Nick called it. New direction.

## Rate limit constraint (carry forward)

Airtable enforces 5 req/sec per base. Any workflow that writes to RevOps Surface must:
- Batch records into ≤10 per PATCH (Airtable's upsert cap)
- Throttle with `splitInBatches` + Wait node (≥250ms) OR use `Retry On Fail` with exponential backoff
- **Never** enable `neverError: true` on write nodes without explicit retry-in-code — it silently masks 429s as successes

Prove the rate-limit strategy on the first workflow before reusing the pattern.

## Reference

- Abandoned architecture doc: `practices/revops/workflows/supabase-airtable-sync-design.md` — read for Airtable schema context. Do not implement the topology.
- Schema notes: `practices/revops/database/revops-engine-dev.md`
- Explorium MCP tools: `mcp__explorium__*`. Per provider status memory, credits may be exhausted... verify before relying on it.

## Don't repeat

- No full SDK rewrites of existing workflows. Surgical UI edits or new workflow from scratch.
- No `neverError: true` without explicit retry handling.
- No schema assumptions. Query Airtable fields or `information_schema.columns` first.
- No shipping without proving the rate-limit strategy on a real batch.
- No bundling multiple use cases into one workflow. One slug, one folder, one purpose.

## First action for the next session

1. Answer the two open questions above.
2. Pick ONE template to adapt first (Nick's call). Recommend: HubSpot → Explorium enrichment, since it's the closest shape to "enrich-in-place" and the field mapping work transfers to all other adaptations.
3. Create `explorium-direct/<slug>/design.md` and audit the template against Airtable schema.
4. Build, test on a 10-record batch, prove rate-limit handling, then expand.
