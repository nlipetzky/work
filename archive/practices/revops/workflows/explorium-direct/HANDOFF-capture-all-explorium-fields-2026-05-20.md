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

---

## Addendum 2 — 2026-05-20 re-verification (PROMPT.md execution)

Re-verified the above by fresh GET read of both workflows and Airtable schema.

**versionIds confirmed (2026-05-20):**
- Z6: `43cd0ae6-62b1-4be1-aa74-0fba50e62b72` (matches addendum above)
- bY: `4347d9c3-8c02-4b21-8844-b7ba335d939f` (matches table above)

**Credentials confirmed intact:**
- Z6: all 8 Airtable/Explorium node bindings present (same credential IDs as per-node table above)
- bY: all 10 node bindings present (Airtable, Explorium, Apollo, Apify, Anthropic, Hunter)

**Airtable column counts confirmed:**
- Companies `tblnj3YlOI3thjrXp`: 229 explorium_* columns (fetched from live schema)
- Contacts `tblWJksRL1yKSUgrm`: 54 explorium_* columns (fetched from live schema)
- Cross-check against code simulation: 0 columns missing from Airtable; 3 Airtable columns absent from exec-72396 simulation (explained: 2 sparse fields absent from that company's payload + 1 synthetic field handled by curated section, not foldExplorium)

**Active state:** Both workflows `active: false`, `activeVersionId: null`. Both use `manualTrigger` only. This is the expected state between paid runs. No action needed to prevent accidental scheduled runs.

**Additional scratch table written this session:**
- Table: `SCRATCH-explorium-dry-run-2026-05-20` (tblNFrtL2iz5u12i9, appYBYH3aOHhTODAw)
- Record: `recIOM49YfvcM6Abk` (created 2026-05-20T02:38:21Z)
- Fields verified round-trip: singleLineText (business_id), number integer (ratings_count), number float (ratings_outlook), multilineText newline-joined array (full_tech_stack), checkbox false (payload_truncated)
- All types confirmed write-read correctly. Scratch table safe to delete.

**Field inventories written to:**
- `capture-all-explorium-fields/inventory-companies-explorium-fields-2026-05-20.json` (226 keys from exec 72396 simulation)
- `capture-all-explorium-fields/inventory-contacts-explorium-fields-2026-05-20.json` (53 keys from exec 80834)

**No post-update execution exists.** Most recent Z6 run is exec 72396 (2026-05-14), before the code deploy. Most recent bY run is exec 80834 (2026-05-19T21:41Z), also before the code deploy (deployed at ~23:07Z same day). Live test pending Nick's authorization.

---

## Addendum 3 — 2026-05-20 live 3-company test run + bug fixes

Three companies were selected for a live test run: REGENXBIO (`recJCe3fwYK4oU1uT`), Rocket Pharmaceuticals (`recXuzce8u5YpMpC9`), Spirovant Sciences (`rec0LOo5HdS4ZXmgJ`). Their `Enrichment Status` was cleared to blank before the run. `Get Unenriched Companies` filter was scoped to `FIND(RECORD_ID(), 'recJCe3fwYK4oU1uT,recXuzce8u5YpMpC9,rec0LOo5HdS4ZXmgJ')` for the duration of the test.

### Bugs found and fixed (sequential; each exec triggered live)

**Bug 1 — exec 80857 — credential not shared**
- `Get Unenriched Companies` was bound to `RevOps Surface Airtable (oWpVVSd23y4jOtSK)`, not shared with INSTIG8 AI project.
- Fix: Nick swapped the credential on that node to `may 26 all bases (FYqJQqdXIQkmT715)` via UI.

**Bug 2 — exec 80858 — number value into singleLineText column**
- `explorium_number_of_investors_for_first_funding_round` is `singleLineText`; `foldExplorium` was passing JS number `1`. Airtable's typecast does not coerce numbers → strings for text columns.
- Fix: added `if (typeof v === 'number') { out[col] = String(v); continue; }` to `foldExplorium` in all 5 Z6 Code nodes + 1 bY Code node via REST PUT.
- versionId after: `6a84a723-9986-45c3-99a9-f7b73a0dfc72` (Z6).

**Bug 3 — exec 80860 / 80881 — `Update Enriched Record` node had `defineBelow` mapping with hardcoded `false` values for all explorium_* fields**
- Node used `mappingMode: defineBelow` with 102 entries. All 71 explorium_* entries in `columns.value` were hardcoded `false` booleans, not expressions. The node was not reading from `Map Enriched Fields` output for those columns.
- Fix: switched `Update Enriched Record` to `mappingMode: autoMapInputData`, cleared `columns.value`. Node now reads all input keys by name.
- versionId after: `2ef3fb10-7589-491f-9919-a7a375c9d2b0` (Z6).

**Bug 4 — exec 80881 — `Deep Enrichment Raw` blob 100,014 chars, exceeds Airtable 100K cell limit**
- `Map Enriched Fields` sliced the blob to 100,000 chars then appended `'...[truncated]'` (14 chars) = 100,014. Airtable `multilineText` hard cap is 100,000. 422 result.
- Fix: changed `.slice(0, 100000)` to `.slice(0, 99986)` so 99,986 + 14 = exactly 100,000.
- Only `Map Enriched Fields` had this pattern (confirmed by grep across all Code nodes).
- versionId after: `c49c5953-e9ab-4495-84fd-32d24a10c327` (Z6).

**Bug 5 — exec 80904 — `Map Reroute Fields` output key `"Country"` instead of `"HQ Country"`**
- `Update Rerouted` uses `autoMapInputData`. Airtable rejected unknown field `Country` (422). `Map Enriched Fields` and `Map Archive Fields` both correctly use `"HQ Country"` — this was a pre-existing inconsistency in `Map Reroute Fields` only.
- Fix: renamed `"Country": qualify._country` → `"HQ Country": qualify._country` in `Map Reroute Fields` via REST PUT.
- versionId after: `2e2345fa-0a4d-411d-a1a1-1cf7affcc7d1` (Z6). **This is the final deployed versionId.**

### Final credential map, post all fixes (Z6 versionId `2e2345fa-0a4d-411d-a1a1-1cf7affcc7d1`)

- Get Unenriched Companies: `airtableTokenApi=may 26 all bases (FYqJQqdXIQkmT715)` ← changed by Nick from `oWpVVSd23y4jOtSK`
- Match Business: `exploriumApi=Explorium account (2hCOPHr2VEpraeAH)`
- Enrich Firmographics Only: `exploriumApi=Explorium account (2hCOPHr2VEpraeAH)`
- Enrich Deep: `exploriumApi=Explorium account (2hCOPHr2VEpraeAH)`
- Update Enriched Record: `airtableTokenApi=All KAI Bases (gppZOg4RmjcuPf9T)`
- Update Rerouted: `airtableTokenApi=All KAI Bases (gppZOg4RmjcuPf9T)`
- Update Archived: `airtableTokenApi=All KAI Bases (gppZOg4RmjcuPf9T)`
- Write Run Log: `airtableTokenApi=may 26 all bases (FYqJQqdXIQkmT715)`

### Successful execution — exec 80918 (status: success, finished 2026-05-20T03:16:31.278Z)

Per-node item counts (from exec 80918 runData):
- Run Enrichment: 1, Get Unenriched Companies: 1, Loop Over Companies: 0
- Prepare for Match: 1, Match Business: 1, IF Match Found?: 1
- Enrich Firmographics Only: 1, Qualify Company: 1, IF Biotech?: 1
- Build URLs Matched: 6, Fetch Pages Matched: 6, Check AAV Modality: 1
- IF AAV?: 0, Map Reroute Fields: 1, Update Rerouted: 1
- Done: 1, Prepare Run Log: 1, Write Run Log: 1

Exec 80918 processed 1 company per trigger (Rocket, `recXuzce8u5YpMpC9`). The other 2 were processed in prior execs of this session before the bugs were fully isolated. All 3 records confirmed in Airtable after session:

| Record ID | Company | Enrichment Status | explorium_payload_truncated | Notes |
|---|---|---|---|---|
| `recJCe3fwYK4oU1uT` | REGENXBIO Inc. | `enrichment_complete` | `true` | Deep blob truncated at 99,986 chars; explorium_* columns intact |
| `recXuzce8u5YpMpC9` | Rocket Pharmaceuticals | `needs_aav_review` | — | Rerouted path; 82 explorium_* fields in Airtable update response |
| `rec0LOo5HdS4ZXmgJ` | Spirovant Sciences | `enrichment_complete` | — | Full enrichment path |

Airtable read: all 3 records confirmed via `list_records_for_table` (baseId `appYBYH3aOHhTODAw`, tableId `tblnj3YlOI3thjrXp`): `explorium_name`, `explorium_naics`, `Explorium Business ID` populated on all 3; `explorium_payload_truncated` true on REGENXBIO as expected.

### Open items for orchestrator

1. **`Get Unenriched Companies` filter is still scoped to the 3 test record IDs.** Must be restored to the production filter before any real run. Nick holds the correct production formula.
2. **bY Contacts workflow live test not executed.** bY code was updated in prior session (versionId `4347d9c3-8c02-4b21-8844-b7ba335d939f`). No live Explorium run was triggered — per PROMPT hard rule, paid runs require Nick's explicit authorization.
3. **`publish_workflow` on Z6 returns error** ("no trigger node") — expected for a manually-triggered sub-workflow. The draft at versionId `2e2345fa` is the version that ran exec 80918 successfully. No activation action needed between manual runs.
