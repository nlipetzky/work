# HANDOFF — Contact Sourcing + ICP Gate workflow

Date: 2026-05-18
Owner: Nick (liaison to agentic-systems folder)
Workflow: `RevOps — Contact Sourcing + ICP Gate`
n8n ID: `bYZ0sAzyUvU60wMZ` — https://instig8.app.n8n.cloud/workflow/bYZ0sAzyUvU60wMZ
Project: RevOps (`Pj1xUgbrL58T1CS1`)
Status: **inactive, never executed**. SDK source: `/Users/nplmini/code/work/practices/revops/workflows/contact-sourcing-icp.workflow.ts`

## What this workflow does

Sources employees at already-qualified target companies and gates them against the buyer persona. Pipeline stage 4-adjacent (contact layer), consuming stage-3 company output.

Flow (22 nodes): triggers → read persona rules (Airtable Classification Rules) → read outreach-eligible companies → build per-company Explorium query → loop per company → Explorium fetch-prospects (persona hard filters at query time) → Explorium enrich → normalize → Apollo people-match (email + 2nd employer source) → two-source employment verify → Apify LinkedIn tiebreak (in-line, not deferred) → Hunter email verify → LLM residual ICP scoring → map → upsert to Airtable Contacts.

## Design decisions (locked)

- **Provider stack:** Explorium primary (already the company-enrichment provider; clean business_id joins). Apollo fallback for missing email + 2nd employer source. Apify LinkedIn as employment tiebreak. Hunter for email verification. Anthropic (`claude-sonnet-4-5`) for residual scoring. No Clay — direct providers by Nick's directive.
- **Employment verification is in-line and dual-source, every contact.** Explorium employer + Apollo employer must agree → confirmed (2 sources). One source or disagreement → Apify LinkedIn tiebreak. Not a deferred phase.
- **ICP input mechanism:** the workflow does NOT author ICP. It reads `persona_*` rows from the existing **Classification Rules** table (`tbl1HFYzezFYs5C3k` in base `appYBYH3aOHhTODAw`). Hard filters (seniority/department/title) applied at Explorium query time; residual natural-language criteria scored by LLM. See MANDATORY section below.
- **Filtering at query time, not post-hoc** — persona is an input to the people search, not a scoring afterthought.
- **Airtable write via HTTP REST** (`performUpsert` on Email), not the native Airtable node — avoids the documented MCP corruption of Airtable mapping nodes.

## Q1 ANSWERED — Apify actor recommendation

Use **`harvestapi/linkedin-profile-scraper`** in the `Run an Actor` node.

Rationale vs the alternative (`dev_fusion/Linkedin-Profile-Scraper`, which my HTTP node originally referenced):
- harvestapi: 4.90★ (49 reviews), 99.9% success, **$4/1k** profile-details (no email), no cookies.
- dev_fusion: 3.83★ (150 reviews), 99.9% success, $10/1k.
- We only need current employer for the tiebreak (email comes from Explorium/Apollo/Hunter), so the cheaper no-email mode is sufficient. harvestapi is cheaper and better rated.

Native node config (Nick, in UI):
- Actor: `harvestapi/linkedin-profile-scraper`
- Input JSON: `{ "queries": ["{{ $json.linkedin }}"], "profileScraperMode": "Profile details no email ($4 per 1k)" }`
- Operation: "Run Actor and get dataset" (returns one dataset item per profile).
- `Apply LinkedIn Result` parser will need updating to harvestapi's output shape once the actor is confirmed — flagged for follow-up.

## CRITICAL CORRECTION — Explorium REST contract (built blind, now verified wrong)

Confirmed against https://developers.explorium.ai. The `Explorium Enrich Prospects` node is **incorrect** and must be fixed before any run:

- **Auth:** header `api_key: <key>` (plus `accept: application/json`). The two Explorium HTTP nodes use generic `httpHeaderAuth` — the credential's header name must be `api_key`.
- **Fetch prospects:** `POST https://api.explorium.ai/v1/prospects`, body `{mode:"full", size, page_size, page, filters}` — **correct as built.**
- **Enrich:** there is NO single `/v1/prospects/enrich` endpoint. That was an MCP-tool abstraction. The REST API requires **two separate bulk calls**, max **50** prospect_ids each (not 100):
  - `POST https://api.explorium.ai/v1/prospects/profiles/bulk_enrich` → `{prospect_ids:[...]}` → returns `data[].data.{full_name, linkedin, country_name, region_name, city, experience:[{company:{name,website}, title:{name,levels}, start_date}]}`. Current employer = most-recent `experience` entry. Tenure must be derived from `start_date` (no months field).
  - `POST https://api.explorium.ai/v1/prospects/contacts_information/bulk_enrich` → `{prospect_ids:[...]}` → returns `data[].data.{emails:[{address,type}], phone_numbers:[{phone_number}], mobile_phone}`. Professional email = `emails[].type === "professional"`.

Required change: replace the single `Explorium Enrich Prospects` node with two parallel bulk-enrich nodes (profiles + contacts) merged by `prospect_id`, batch ids in groups of 50, and rewrite `Normalize Prospects` to the real response shapes (job_title/level/department come from the fetch-prospects record; employer/tenure/location from profiles enrich; email/phone from contacts enrich). This is the single biggest open correction.

## Credential / node state (Nick's manual additions)

Nick added two native nodes with proper credential types, parallel to the HTTP versions:
- `Run an Actor` (native Apify) ‖ `Apify LinkedIn Verify` (HTTP) — **delete the HTTP one**
- `Hunter` (native Hunter, emailVerifier) ‖ `Hunter Email Verify` (HTTP) — **delete the HTTP one**

Deletion must be done in the n8n UI, NOT via MCP `update_workflow` — that tool wipes every credential on every node (Nick has already attached credentials; an MCP edit would undo that). After deleting the two HTTP nodes the native ones are already wired in parallel; no re-linking needed. Then update the two downstream parsers (`Apply Email Verify`, `Apply LinkedIn Result`) to the native nodes' output shapes — paste-in code to follow once the Apify actor is confirmed.

Native node config still needed: `Hunter` node Email field = `{{ $json.email }}`; `Run an Actor` actor + input per Q1 above.

## MANDATORY — seed the persona rows in Classification Rules

**The workflow cannot produce correct output until persona rows exist.** The ICP input is read live from the Classification Rules table (`tbl1HFYzezFYs5C3k`, base `appYBYH3aOHhTODAw`). It is currently empty of persona rows. Required rows (Active = true), one row per value:

- `persona_seniority` — Explorium job_level values (e.g. `director`, `vice president`, `c-suite`)
- `persona_department` — Explorium job_department values (e.g. `r&d`, `manufacturing`, `operations`)
- `persona_title_include` — title keywords to match
- `persona_title_exclude` — title keywords to drop
- `persona_residual` — natural-language criteria the LLM scores (e.g. "owns process development buying decisions")
- `persona_min_score` — single row, integer threshold (default 60)

These are the structured projection of `revops-segment-<play-slug>.md`. Authoring them is a separate step (segment-criteria skill or human). **Known limitation:** the Classification Rules table has no Play column, so persona rows are single-play until a Play column is added. The agentic-systems folder should decide: add a Play column now, or accept single-play for the first run.

## Open items for the agentic-systems folder to guide

1. Approve/assign the Explorium enrich correction (split into two bulk endpoints + rewrite Normalize). Largest remaining work.
2. Confirm Apify actor = harvestapi (Q1) so the `Apply LinkedIn Result` parser can be finalized.
3. Decide Classification Rules Play-column question (single-play vs multi-play now).
4. Decide who authors the persona rows and for which play (first target: the active Teknova AAV play).
5. Credentials to create in n8n: `Explorium API` (header `api_key`), `Apollo API`, `Hunter` (native cred), `Apify` (native cred), `anthropicApi`, `airtableTokenApi`. Airtable reads already auto-bound to "All KAI Bases".
6. No run until 1-5 resolved. First run should be manual against 1-2 test companies, not scheduled. No autonomous paid runs.
