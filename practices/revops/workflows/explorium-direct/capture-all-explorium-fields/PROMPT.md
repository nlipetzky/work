# Explorium-Direct ticket — capture every Explorium field on every paid call

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Explorium-Direct (builder)
**Status:** SPEC. Not authorized for paid Explorium runs. Build + deploy + read-back only.

---

## Directive (one sentence)

Every Explorium API call we already pay for must write **every field** in the response to the RevOps Surface Airtable base — no field discarded, no field summarized away. The "Deep Enrichment Raw" JSON blob is a fallback, not the destination. If a field exists in the payload, it gets its own column.

## Scope: two workflows, two Airtable tables

You will modify **two existing workflows** in the Creative Glue n8n project. Both write to base `appYBYH3aOHhTODAw` (RevOps Surface).

### Workflow 1 — Company side
- **Workflow ID:** `Z6RROKx5omdfvhtn`
- **Name:** Companies Enrichment (Explorium → Airtable)
- **Writes to:** Companies table `tblnj3YlOI3thjrXp`
- **Explorium endpoints called:** `match-business`, `enrich` (firmographic), `enrich` (deep)

### Workflow 2 — Contact side
- **Workflow ID:** `bYZ0sAzyUvU60wMZ`
- **Name:** RevOps — Contact Sourcing + ICP Gate
- **Writes to:** Contacts table `tblWJksRL1yKSUgrm`
- **Explorium endpoints called:** `fetch-prospects` (structured search), `enrich-prospects` (deep profile), prospect `contacts` lookup

You will not delete the existing field-extraction code in either workflow. You will **extend** it so every additional field gets its own first-class column.

---

## Current state (audited 2026-05-20)

### Workflow Z6RROKx5omdfvhtn current Companies field writes (from `Map Enriched Fields` node)

Today writes ~38 fields:
`Industry, Revenue Range, HQ Country, HQ State, HQ City, Company LinkedIn URL, Employee Range, NAICS Code, Domain, Explorium Business ID, Stock Ticker, Last Enriched At, Enrichment Status, Custom Classification, Custom Classification Source, Custom Classification Confidence, Custom Classification Detected Keywords, Classification Run ID, Gate Version, Classification Notes, Founded Year, Parent Company, Ultimate Parent, Funding Stage, Last Funding Date, Last Funding Amount USD, Total Known Funding USD, Number of Funding Rounds, SEC CIK, Key Competitors, Company Focus, Strategic Notes, Deep Enrichment Raw (truncated JSON), Delivery Vehicle, Publicly Traded, Subsidiary Status, AAV Segment`

Everything else from the Explorium deep payload is **only in the truncated `Deep Enrichment Raw` blob** (95K cap). When the blob truncates, that data is lost. This is what you are fixing.

### Workflow bYZ0sAzyUvU60wMZ current Contacts field writes
Audit the `Raw Provider Payloads` node + final Airtable upsert mapping yourself. The expectation is the same: every Explorium-returned prospect field gets its own column.

---

## What you must do — step by step

### Step 1 — Inventory the full Explorium response surface

Authoritative reference: `practices/revops/REFERENCE-explorium-extractable-data-2026-05-19.md` (271 business fields + ~50 prospect fields).

For each of the two workflows, pull the most recent successful execution and extract the **complete list of keys** present in the Explorium response object(s). Do not rely on the reference doc as exhaustive — use the live payload as truth, and treat the reference as a second-source check.

For the company workflow: keys come from the `Enrich Deep` node output (the `enriched_data[0].data` object) AND from the `Match Business` and `Enrich Firmographics Only` outputs. Some fields are firmographic-call only (returned before AAV gate even runs). Capture all of them.

For the contact workflow: keys come from `explorium.fetched`, `explorium.profile`, and `explorium.contacts` sub-objects on each prospect. Capture every key across all three.

Produce two field inventories as part of your handoff:
- `inventory-companies-explorium-fields-2026-05-20.json` — every key returned by any Explorium endpoint the company workflow calls, with its observed data type (string, number, array, object).
- `inventory-contacts-explorium-fields-2026-05-20.json` — same for the contact workflow.

### Step 2 — Add missing Airtable columns

For each Explorium field that does not have a matching column on the destination table, add a column. Use these field-type rules:

| Explorium type | Airtable type |
|---|---|
| string (short) | `singleLineText` |
| string (long / multi-paragraph) | `multilineText` |
| URL | `url` |
| number / int / float | `number` |
| boolean | `checkbox` |
| ISO date | `date` |
| ISO datetime | `dateTime` |
| array of strings | `multilineText` (newline-joined) |
| array of objects | `multilineText` (JSON-stringified, pretty) |
| nested object | `multilineText` (JSON-stringified, pretty) |
| enum / categorical | `singleSelect` only when the value set is small + closed (≤ ~20 values); otherwise `singleLineText` |

Column naming: use **Explorium's exact snake_case key as the Airtable field name**, prefixed with `explorium_` to keep them grouped and to prevent collision with existing curated columns. Examples: `explorium_intent_topics`, `explorium_change_in_engineering_roles`, `explorium_live_techs`. Do not invent friendly names. The data lake column is the snake_case original; curated/derived columns can stay as they are.

Description on every new column: `"Sole writer: <workflow_id>. Source: Explorium <endpoint>. Field: <exact_key>. Added 2026-05-20."` Use this format verbatim so the next field provenance audit picks it up cleanly.

### Step 3 — Update the Code nodes to write every field

**Workflow Z6RROKx5omdfvhtn — `Map Enriched Fields` node:**

Keep the existing curated fields exactly as they are (the AAV Segment classifier, delivery vehicle mapping, subsidiary status logic, etc.). After the existing return block, fold in every additional Explorium key from the `deep` object as a new property keyed by `explorium_<key>`. For arrays of objects and nested objects, JSON.stringify with 2-space indent. For arrays of strings, join with newlines. Numbers and primitives pass through.

Also update `Map Reroute Fields` and `Map Archive Fields` (and any other Code node that writes to Companies in the non-deep paths) so that whatever Explorium data WAS returned on that path still lands in the `explorium_*` columns. A rerouted or archived row should still carry whatever Explorium fields the firmographic call returned. Today these paths discard most of the payload.

**Workflow bYZ0sAzyUvU60wMZ — prospect mapping nodes:**

Audit which Code/Set nodes are between the Explorium prospect calls and the final Airtable upsert. Add the same pattern: every `explorium.fetched.*`, `explorium.profile.*`, and `explorium.contacts.*` key gets written to an `explorium_<sub>_<key>` column on Contacts (e.g. `explorium_fetched_job_seniority_level`, `explorium_profile_education`, `explorium_contacts_phone_numbers`). Keep `Raw Provider Payloads` as the full-blob fallback. Keep existing curated columns (Email, Title, Seniority, Function, Person Key, etc.) untouched.

### Step 4 — Eliminate the Deep Enrichment Raw truncation cap as primary storage

`Deep Enrichment Raw` stays as a fallback / archival blob, but it is no longer the place we read from. Once Step 3 lands, every field is queryable as its own column. Increase the truncation cap from 95K to the Airtable cell limit (100K hard cap), and add a check: if the JSON would truncate, write a flag column `explorium_payload_truncated = true` so we know that row's blob is incomplete. Curated columns will still be intact because they're written first.

### Step 5 — Deploy via credential-preserving REST PUT

Both workflows have live credentials attached. **MCP `update_workflow` and naive REST PUT will wipe them.** Use the credential-preserving REST PUT pattern documented at:
- `practices/agentic-systems/reference/n8n-rest-put-protocol.md` (or the closest equivalent in the repo)
- Memory: `feedback_n8n_rest_put_settings.md`

Specifically:
1. GET the current full workflow JSON via raw API (not MCP — MCP strips credentials).
2. Modify ONLY the Code/Airtable nodes you need to change. Preserve every `credentials` object on every node verbatim.
3. PUT with the modified JSON. Settings block: keep only `executionOrder`.
4. Immediately GET again and verify: (a) every credential is still attached on every node, (b) the new Airtable column names appear in the upsert/update node value maps, (c) node count + connection count are unchanged from your modified version.
5. Publish.

### Step 6 — Verify with a dry execution, NOT a paid run

**You are not authorized to trigger paid Explorium calls in this build.** Verification is on saved historical executions:

For each workflow:
1. Find a recent successful execution.
2. Manually feed that execution's Explorium response into the modified Code node (either by pinning a previous execution's output into the trigger, or by using n8n's "execute node" with the saved JSON).
3. Confirm the new Code node output object contains every `explorium_*` key you expected.
4. Confirm a dry Airtable upsert (write to a TEST scratch table you create, not Companies/Contacts) preserves the data round-trip — every column populated, no nulls where the source had a value.

Then publish. Do not trigger a real Explorium-billing execution. That call is Nick's separately, after you hand off.

### Step 7 — Handoff report

Write your handoff to `practices/revops/workflows/explorium-direct/HANDOFF-capture-all-explorium-fields-2026-05-20.md` with:
- Two field inventories (or paths to them).
- List of Airtable columns added (per table, with field IDs).
- List of nodes modified, with the diff for each Code node.
- Read-back verification: credentials still attached, columns present, dry-run output sample.
- What you did NOT do (e.g. "did not trigger paid run; did not modify L1/L2 workflows; did not touch the Contact Sourcing email or LinkedIn verification logic").

---

## Hard rules

- **Do not bulk-trigger paid Explorium runs.** Nick authorizes spend per session. Prior approval does not carry.
- **Do not delete or rename existing curated columns.** Add new `explorium_*` columns alongside them.
- **Do not edit L1 (`9gcmEjq1lvOY2jZS`), L2 (any Classify workflow), or any contact-trust workflow.** Scope is the two named workflows only.
- **Do not run "pinned tests" and call them tests.** Only real executions or dry-runs against a TEST scratch table count.
- **REST PUT wipes credentials.** Verify creds on every node by read-back after every deploy.
- **Honor `Raw Provider Payloads` and `Deep Enrichment Raw` as fallbacks, not as primary destinations.** Every key gets its own column from now on.
- **No friendly renaming of Explorium keys.** `explorium_change_in_engineering_roles` stays as `change_in_engineering_roles` in the column name. Future automation needs the key to be predictable.
- **When in doubt, write the field as `multilineText`.** Coercing arrays/objects into strings beats losing the data.

## Out of scope (do not touch)

- The AAV classifier logic in `Check AAV Modality` / `Check AAV Unmatched` / `Map Enriched Fields` (the AAV Segment computation block).
- The L1 CT.gov workflow.
- Any L2 classify workflow.
- The Contact Sourcing employment-trust, email-verification, and ICP Score Reason logic — all those landed yesterday and are verified.
- The 9-field orphan-deletion list on Companies (separate decision pending with Nick).
- The state model / Lifecycle State writer (separate workstream).
- The Salesforce sync (separate base).

## Verification gate (what Boris will check before this is "done")

- Both workflows publish without losing credentials.
- A test execution on a scratch table populates every new `explorium_*` column with the corresponding payload key.
- The field provenance audit re-run shows the new columns as `working` (declared writer + actually written), not `orphaned`.
- `Deep Enrichment Raw` cell on a real row shows `explorium_payload_truncated = false` OR the truncated flag is set and we know why.
- Handoff doc lists every column added and every node modified.

If any of those fail, stop and report. Do not proceed to "complete."
