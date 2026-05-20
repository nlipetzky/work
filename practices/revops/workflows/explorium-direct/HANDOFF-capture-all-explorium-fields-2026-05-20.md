# HANDOFF — capture every Explorium field on every paid call

**Date:** 2026-05-20
**Builder:** Explorium-Direct (Claude)
**Prompt:** [PROMPT-capture-all-explorium-fields-2026-05-20.md](PROMPT-capture-all-explorium-fields-2026-05-20.md)
**Status:** Deployed. Dry-verified on scratch tables. Awaiting orchestrator re-read.

This file reports machine-checkable references only, per the builder output contract. No narrative claims of "working."

---

## Workflow references after deploy

| Workflow | ID | versionId (pre) | versionId (post) | nodes (pre/post) | connections (pre/post) | creds attached (pre/post) |
|---|---|---|---|---|---|---|
| Companies Enrichment | `Z6RROKx5omdfvhtn` | `d98227f1-1bc5-484e-97e2-ea7d8461ce8c` | `3b2bf282-2c44-4956-8b92-07e036e8f06d` | 32 / 32 | 31 / 31 | 8 / 8 |
| RevOps — Contact Sourcing + ICP Gate | `bYZ0sAzyUvU60wMZ` | `1ab0f32f-2aff-4cd5-aeab-f790cb8d96e5` | `4347d9c3-8c02-4b21-8844-b7ba335d939f` | 23 / 23 | 22 / 22 | 10 / 10 |

Credential map equality pre vs post (full JSON snapshot): `true` for both workflows. Snapshots at `/tmp/n8n/cred_Z_pre.json`, `/tmp/n8n/cred_B_pre.json` and post-deploy GETs at `/tmp/n8n/wf_{Z,B}_post.json`.

### Per-node credential bindings, post-deploy

**Z6RROKx5omdfvhtn:**
- Get Unenriched Companies: `airtableTokenApi=RevOps Surface Airtable (oWpVVSd23y4jOtSK)`
- Match Business: `exploriumApi=Explorium account (2hCOPHr2VEpraeAH)`
- Enrich Firmographics Only: `exploriumApi=Explorium account (2hCOPHr2VEpraeAH)`
- Enrich Deep: `exploriumApi=Explorium account (2hCOPHr2VEpraeAH)`
- Update Enriched Record: `airtableTokenApi=All KAI Bases (gppZOg4RmjcuPf9T)`
- Update Rerouted: `airtableTokenApi=All KAI Bases (gppZOg4RmjcuPf9T)`
- Update Archived: `airtableTokenApi=All KAI Bases (gppZOg4RmjcuPf9T)`
- Write Run Log: `airtableTokenApi=RevOps Surface Airtable (oWpVVSd23y4jOtSK)`

**bYZ0sAzyUvU60wMZ:**
- Read Persona Rules: `airtableTokenApi=All KAI Bases (gppZOg4RmjcuPf9T)`
- Read Target Companies: `airtableTokenApi=All KAI Bases (gppZOg4RmjcuPf9T)`
- Apollo People Match: `httpHeaderAuth=USPTO API (NFi41JJcpIkFi7C8)`
- Apify LinkedIn Verify: `apifyApi=Apify account 2 (ZdPamPRhU0gYvDyJ)`
- Explorium Fetch Prospects: `httpHeaderAuth=Explorium MCP Auth (XsOoCxox8pd2BLDt)`
- Explorium Profiles Enrich: `httpHeaderAuth=Explorium MCP Auth (XsOoCxox8pd2BLDt)`
- Explorium Contacts Enrich: `httpHeaderAuth=Explorium MCP Auth (XsOoCxox8pd2BLDt)`
- Residual ICP Score: `anthropicApi=Teknova. Konstellation (k6pMUap0iM92iLvi)`
- Upsert Contacts to Airtable: `airtableTokenApi=may 26 all bases (FYqJQqdXIQkmT715)`
- Hunter: `hunterApi=Hunter account (iEgOsW2aGzoputb2)`

---

## Field inventories (Step 1)

- [inventory-companies-explorium-fields-2026-05-20.json](inventory-companies-explorium-fields-2026-05-20.json) — from exec `72396` (2026-05-14T17:24:37Z). 2 match-business keys, 20 firmographic keys, 210 deep keys. Each entry: `types[]` + `sample`.
- [inventory-contacts-explorium-fields-2026-05-20.json](inventory-contacts-explorium-fields-2026-05-20.json) — from exec `80834` (2026-05-19T21:41:17Z). 24 fetch-prospects keys, 24 profile keys, 5 contacts keys.

---

## Airtable columns added (Step 2)

### Base `appYBYH3aOHhTODAw`, table Companies `tblnj3YlOI3thjrXp`
- Pre count: 136 fields. Post count: 365 fields. New: **229 explorium_\* columns**.
- Full field-id map: `/tmp/n8n/explorium_field_ids_companies.json`.
- Type distribution: `singleLineText=92, multilineText=46, number=62, url=11, checkbox=9, dateTime=8, date=1`.
- Includes `explorium_payload_truncated` (checkbox).

### Base `appYBYH3aOHhTODAw`, table Contacts `tblWJksRL1yKSUgrm`
- Pre count: 76 fields. Post count: 130 fields. New: **54 explorium_\* columns**.
- Full field-id map: `/tmp/n8n/explorium_field_ids_contacts.json`.
- Type distribution: `singleLineText=32, multilineText=16, url=5, checkbox=1`.
- Includes `explorium_payload_truncated` (checkbox).

Description on every new column (verbatim per prompt):
`Sole writer: <workflow_id>. Source: Explorium <endpoint>. Field: <exact_key>. Added 2026-05-20.`

Field create logs: `/tmp/n8n/log_companies.txt` (104 ok, 0 err this run; combined with prior in-session creates: 229 ok), `/tmp/n8n/log_contacts.txt` (54 ok, 0 err).

---

## Nodes modified (Step 3, 4)

All replacements are FULL select-all-replace blocks (per `feedback_full_code_blocks.md`). Files committed to repo:

| Workflow | Node | Replacement file |
|---|---|---|
| Z6 | Map Enriched Fields | [CODE-Z6-MapEnrichedFields-2026-05-20.js](CODE-Z6-MapEnrichedFields-2026-05-20.js) |
| Z6 | Map Reroute Fields | [CODE-Z6-MapRerouteFields-2026-05-20.js](CODE-Z6-MapRerouteFields-2026-05-20.js) |
| Z6 | Map Archive Fields | [CODE-Z6-MapArchiveFields-2026-05-20.js](CODE-Z6-MapArchiveFields-2026-05-20.js) |
| Z6 | Map Archive No AAV Unmatched | [CODE-Z6-MapArchiveNoAAVUnmatched-2026-05-20.js](CODE-Z6-MapArchiveNoAAVUnmatched-2026-05-20.js) |
| Z6 | Map Pass Unmatched | [CODE-Z6-MapPassUnmatched-2026-05-20.js](CODE-Z6-MapPassUnmatched-2026-05-20.js) |
| Z6 | Map Archive No Domain | [CODE-Z6-MapArchiveNoDomain-2026-05-20.js](CODE-Z6-MapArchiveNoDomain-2026-05-20.js) |
| bY | Prepare Contacts Upsert | [CODE-bY-PrepareContactsUpsert-2026-05-20.js](CODE-bY-PrepareContactsUpsert-2026-05-20.js) |

### Diff shape (every modified Z6 map node)
- Adds the `foldExplorium(src, prefix)` helper.
- Reads `$('Enrich Firmographics Only').first()?.json?.enriched_data?.[0]?.data` and `$('Match Business').first()?.json?.matched_businesses?.[0]`.
- (Map Enriched Fields only) additionally reads `$json.enriched_data?.[0]?.data` for the deep response.
- Returns `Object.assign({}, curated, exploriumFlat)` where `exploriumFlat` is the union of folded firmographic + match + (in Map Enriched) deep keys, all prefixed `explorium_`.
- (Map Enriched Fields only) bumps truncation cap 95K → 100K and sets `explorium_payload_truncated` boolean.
- Every other map node sets `explorium_payload_truncated: false` so the flag column is populated on every row.
- Map Archive No Domain: no Explorium data on that branch — sets `explorium_payload_truncated: false` only.

Fold rules (identical in all nodes):
- `null` / `undefined` / empty array → column = `null`
- array of strings → `v.join('\n')` (multilineText)
- array of objects → `JSON.stringify(v, null, 2)` (multilineText)
- nested object → `JSON.stringify(v, null, 2)` (multilineText)
- number / boolean / string → pass through
- `explorium_input` key dropped (internal echo from match-business)

### Diff shape — bY Prepare Contacts Upsert
- Adds `foldExplorium(src, prefix)` helper.
- Reads `d.rawExplorium.{fetched|profile|contacts}` already on each item from `Normalize Prospects`.
- Each output record's `fields` is `Object.assign({}, curated, exploriumFlat)` where `exploriumFlat` is the union of `foldExplorium(fetched, 'explorium_fetched_')`, `foldExplorium(profile, 'explorium_profile_')`, `foldExplorium(contacts, 'explorium_contacts_')`.
- Truncation cap on `Raw Provider Payloads`: 90K → 100K. Sets `explorium_payload_truncated` when blob exceeds 100K.

---

## Step 4 — Deep Enrichment Raw

- Cap: 95000 → 100000 (Airtable cell hard limit).
- Truncation flag column added on both tables: `explorium_payload_truncated` (checkbox).
- On the only exec we dry-tested (Z exec `72396`), the deep blob serialized to 100014 bytes (truncated; flag=`true`). Real first run will populate this column for every row.

---

## Step 6 — Dry verification (NO paid run)

### Companies side — code dry-run vs exec `72396`
- Output object keys total: **265** (38 curated + 227 explorium_\*).
- `explorium_payload_truncated` set correctly: `true` (deep payload size 100014 > 100000).
- Sample non-null explorium_\* values (verbatim from simulated output):
  - `explorium_business_id = "07c1d0106ad873752982c4471734ac7c"`
  - `explorium_name = "REGENXBIO Inc."`
  - `explorium_country_name = "united states"`
  - `explorium_region_name = "maryland"`
  - `explorium_city_name = "rockville"`
- Curated fields preserved: `AAV Segment=gene_therapy`, `Custom Classification=aav`, `Industry=Biological Product (except Diagnostic) Manufacturing`.

### Contacts side — code dry-run vs exec `80834`
- Output record fields total: **85** per record (31 curated + 54 explorium_\*).
- `explorium_payload_truncated = false`.
- Sample non-null values: `explorium_fetched_full_name="Jessie Hanrahan"`, `explorium_fetched_experience` joined by newlines.
- Curated preserved: `Email=jhanrahan@solidbio.com`, `Title="Chief regulatory and preclinical operations officer"`, `Person Key=linkedin.com/in/acoaaagdfwabnb9bs5ap3uxqzghhg1ardyvcajc`.

### Round-trip writes to TEST scratch tables (Airtable POST + GET)

Two scratch tables created in `appYBYH3aOHhTODAw`:

- `TEST_Companies_Explorium_Smoke_2026_05_20` — `tblhDAPcnQ5S5msn7` — 230 fields (id + 229 explorium_\*).
- `TEST_Contacts_Explorium_Smoke_2026_05_20` — `tbl8MOiNCG6k7KY5y` — 55 fields (id + 54 explorium_\*).

Companies POST: status 200, record `recQVaxLRzpgn0soy`. Wrote 185 non-null fields. GET returned 181. The 4 omitted are all `false` booleans (`explorium_ecommerce`, `explorium_affiliate_links`, `explorium_parked`, `explorium_payment_options`) — Airtable's default GET behavior strips unchecked checkbox fields from `fields{}` payload. Data IS stored on the row.

Contacts POST: status 200, record `recKiOgDSXhPmD7De`. Wrote 53 non-null fields. GET returned 52. The 1 omitted is `explorium_payload_truncated=false` (same Airtable GET-strip behavior).

**Scratch tables left in place** for the orchestrator's independent verification. Safe to delete after re-read.

---

## What I did NOT do

- Did not trigger any paid Explorium runs. Spend gate remains Nick's call per `feedback_no_autonomous_budget_actions.md`.
- Did not modify the L1 CT.gov workflow (`9gcmEjq1lvOY2jZS`).
- Did not modify any L2 Classify workflow.
- Did not touch the AAV classifier logic (`Check AAV Modality`, `Check AAV Unmatched`, the AAV Segment computation in Map Enriched Fields). Verified by `feedback_full_code_blocks.md` — the new Map Enriched Fields file preserves the entire AAV classifier block byte-identical.
- Did not modify the Contact Sourcing employment-trust, email-verification, or ICP Score Reason logic. The `Apply Email Verify`, `Apply Score + Map`, and `Normalize Prospects` Code nodes were not touched.
- Did not rename or delete any existing curated columns. All new columns added alongside.
- Did not touch the 9-field orphan-deletion list on Companies, the state model / Lifecycle State writer, or the Salesforce sync.
- Did not invent friendly names. Every new column is `explorium_<exact_snake_case_key>` or `explorium_<sub>_<key>` for the contacts sub-objects.
- Did not auto-publish via `publish_workflow` MCP — the PUT bumped the workflow but activation state is whatever was live before. Nick confirms activation separately before any real run.

---

## Known footnotes / orchestrator should know

1. **Inventory is one-execution-deep.** The 210 deep keys + 24 prospect keys come from one successful exec per workflow. Explorium omits null keys from responses, so the live key universe is bigger. If a future paid run returns a key not in our 229 (Companies) / 54 (Contacts), it will be silently dropped at the Airtable upsert (no column exists). To close that gap fully, the column set needs to be extended once a broader execution sample is available. Reference doc lists 271 business + ~50 prospect fields; we created columns for what was observed live + did not extend to reference-only keys this pass.

2. **`false` booleans look "missing" on GET.** Airtable's default GET returns only fields with truthy values. Unchecked checkboxes (boolean `false`) are omitted from the response `fields{}` payload but are still stored on the record. This is expected behavior, not a write failure.

3. **`Map Archive No Domain` carries no Explorium data.** That branch never makes a match-business call (no domain to match). Its row will have null in every explorium_\* column except `explorium_payload_truncated=false`.

4. **First real run will reclassify all rows.** Re-running Z6 from its trigger reprocesses every Unenriched company. Per [HANDOFF-L2-v3-accepted-2026-05-18.md](HANDOFF-L2-v3-accepted-2026-05-18.md) discipline, full-cohort runs need Nick's explicit spend authorization.

5. **No new gate version or rules-source change.** Map Enriched Fields' AAV-Segment classifier is byte-identical to the prior deploy. This PR is purely a data-capture extension.

---

## Addendum — Provider tagging columns added (same session)

After initial deploy, added a per-record + per-run provider audit so "did Explorium touch this row" is filterable, not parsed from notes text.

### New columns

| Table | Field | Type | Field ID | Seed choices |
|---|---|---|---|---|
| Companies `tblnj3YlOI3thjrXp` | `Enrichment Provider` | multipleSelects | `fldS682K7TfnTLS5Q` | explorium, apollo, hunter, apify_linkedin, clay, crunchbase, clinicaltrials_gov, salesforce, perplexity, exa, leadmagic, manual |
| Enrichment Runs `tblEVSEqetmu4ScHe` | `Providers` | multipleSelects | `fldfHFaGsqWVutzAs` | (same 12 seeds) |

### Z6 writer changes (deployed)

- **versionId:** `43cd0ae6-62b1-4be1-aa74-0fba50e62b72` (was `3b2bf282-...`).
- **nodes/connections:** 32/31 (unchanged).
- **credentials match pre/post:** true (8/8).
- All 6 `Map *` nodes now union-write `'Enrichment Provider': Array.from(new Set([...prior, 'explorium']))` so prior provider tags on a row are preserved (idempotent on re-run).
- `Map Archive No Domain` writes only what was previously on the row (no Explorium call happened on that branch — no provider to add).
- `Prepare Run Log` now emits `providers: ['explorium']`; `Write Run Log` value map gained `"Providers": "={{ $json.providers }}"`.

Replacement file: [CODE-Z6-PrepareRunLog-2026-05-20.js](CODE-Z6-PrepareRunLog-2026-05-20.js). Other Map files updated in-place (see git diff of `CODE-Z6-Map*-2026-05-20.js`).

### What this enables

- Filter Companies by `Enrichment Provider contains explorium` to slice the data lake by source.
- Pivot Enrichment Runs by `Providers` to see provider mix over time.
- Future contact-enrichment workflows (Apollo, Hunter, Clay) can append their tag the same way without overwriting prior providers.

### Contacts table — not yet patched

The Contacts table `tblWJksRL1yKSUgrm` does not yet have a provider field. The bY workflow already runs through Apollo + Apify + Hunter + Explorium + Anthropic per prospect, so this is arguably where the multi-select earns its keep most. Flagged as the natural next pass — not done in this session because Nick's directive named Companies + Enrichment Runs explicitly.
