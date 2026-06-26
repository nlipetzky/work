# Agentic-Systems re-pull handoff — 2026-05-20

**Builder:** Explorium-Direct (Claude)
**Session scope:** [PROMPT-capture-all-explorium-fields-2026-05-20.md](PROMPT-capture-all-explorium-fields-2026-05-20.md) + provider-tagging addendum requested mid-session.
**Status:** Deployed. Awaiting your independent re-read. No paid Explorium calls triggered.

This file is the re-pull index, not a verification claim. Every line is a machine-checkable reference. Verify independently per the builder output contract.

---

## What to re-pull and check

### 1. Workflows

| Workflow | ID | Final versionId | Pre versionId | Nodes patched |
|---|---|---|---|---|
| Companies Enrichment | `Z6RROKx5omdfvhtn` | `43cd0ae6-62b1-4be1-aa74-0fba50e62b72` | `d98227f1-1bc5-484e-97e2-ea7d8461ce8c` | 7 Code nodes + Write Run Log value-map |
| Contact Sourcing + ICP Gate | `bYZ0sAzyUvU60wMZ` | `4347d9c3-8c02-4b21-8844-b7ba335d939f` | `1ab0f32f-2aff-4cd5-aeab-f790cb8d96e5` | 1 Code node (Prepare Contacts Upsert) |

Pull each via raw REST `GET /workflows/{id}` (not MCP — MCP can strip credentials in the response). Check:
- `nodes.length` = 32 (Z6), 23 (bY) — unchanged from pre.
- `Object.keys(connections).length` = 31 (Z6), 22 (bY) — unchanged from pre.
- `credentials` object on every node that had one before. Z6: 8 nodes. bY: 10 nodes. Both verified `JSON.stringify(pre) === JSON.stringify(post)` at deploy time.
- Patched Code nodes contain marker substrings:
  - Z6 Map Enriched Fields: `foldExplorium`, `__providers`, `100000` (truncation cap), `explorium_payload_truncated`
  - Z6 Map Reroute / Map Archive / Map Archive No AAV Unmatched / Map Pass Unmatched: `foldExplorium`, `__providers`
  - Z6 Map Archive No Domain: `__providers`, `explorium_payload_truncated`
  - Z6 Prepare Run Log: `providers: ['explorium']`
  - Z6 Write Run Log `parameters.columns.value['Providers']` = `={{ $json.providers }}`
  - bY Prepare Contacts Upsert: `foldExplorium`, `explorium_fetched_`, `explorium_profile_`, `explorium_contacts_`, `explorium_payload_truncated`

### 2. Airtable schema, base `appYBYH3aOHhTODAw`

Pull `GET https://api.airtable.com/v0/meta/bases/appYBYH3aOHhTODAw/tables`.

| Table | ID | Total fields | New explorium_* | Provider field |
|---|---|---|---|---|
| Companies | `tblnj3YlOI3thjrXp` | 365 | 229 | `Enrichment Provider` (`fldS682K7TfnTLS5Q`, multipleSelects, 12 seed choices) |
| Contacts | `tblWJksRL1yKSUgrm` | 130 | 54 | not yet added (flagged) |
| Enrichment Runs | `tblEVSEqetmu4ScHe` | (unchanged + 1) | n/a | `Providers` (`fldfHFaGsqWVutzAs`, multipleSelects, 12 seed choices) |

Every new column carries description verbatim:
`Sole writer: <workflow_id>. Source: Explorium <endpoint>. Field: <exact_key>. Added 2026-05-20.`

Field-ID maps saved at:
- `/tmp/n8n/explorium_field_ids_companies.json`
- `/tmp/n8n/explorium_field_ids_contacts.json`
- `/tmp/n8n/provider_field_ids.json`

### 3. Scratch tables (your verification surface)

Created in same base. Safe to delete after re-read.

| Table | ID | Sole record written | Notes |
|---|---|---|---|
| TEST_Companies_Explorium_Smoke_2026_05_20 | `tblhDAPcnQ5S5msn7` | `recQVaxLRzpgn0soy` | 185 non-null fields written via POST; GET returned 181 (4 omitted are all `false` checkboxes — Airtable default GET strips unchecked) |
| TEST_Contacts_Explorium_Smoke_2026_05_20 | `tbl8MOiNCG6k7KY5y` | `recKiOgDSXhPmD7De` | 53 non-null fields written; GET returned 52 (`explorium_payload_truncated=false` stripped) |

Re-pull both records to confirm round-trip. Source-of-truth executions used to seed the writes:
- Companies: exec `72396` (2026-05-14T17:24:37Z), node `Enrich Deep`.
- Contacts: exec `80834` (2026-05-19T21:41:17Z), node `Explorium Profiles Enrich` / `Explorium Contacts Enrich`.

### 4. Repo artifacts (committed, builder-owned)

In `practices/revops/workflows/explorium-direct/`:

- [HANDOFF-capture-all-explorium-fields-2026-05-20.md](HANDOFF-capture-all-explorium-fields-2026-05-20.md) — the full per-step receipt with diff shapes and footnotes.
- [inventory-companies-explorium-fields-2026-05-20.json](inventory-companies-explorium-fields-2026-05-20.json) — 232 keys (match=2, firmo=20, deep=210), each with `types[]` + `sample`.
- [inventory-contacts-explorium-fields-2026-05-20.json](inventory-contacts-explorium-fields-2026-05-20.json) — 53 keys (fetched=24, profile=24, contacts=5).
- Replacement Code-node files (full select-all replace blocks):
  - [CODE-Z6-MapEnrichedFields-2026-05-20.js](CODE-Z6-MapEnrichedFields-2026-05-20.js)
  - [CODE-Z6-MapRerouteFields-2026-05-20.js](CODE-Z6-MapRerouteFields-2026-05-20.js)
  - [CODE-Z6-MapArchiveFields-2026-05-20.js](CODE-Z6-MapArchiveFields-2026-05-20.js)
  - [CODE-Z6-MapArchiveNoAAVUnmatched-2026-05-20.js](CODE-Z6-MapArchiveNoAAVUnmatched-2026-05-20.js)
  - [CODE-Z6-MapPassUnmatched-2026-05-20.js](CODE-Z6-MapPassUnmatched-2026-05-20.js)
  - [CODE-Z6-MapArchiveNoDomain-2026-05-20.js](CODE-Z6-MapArchiveNoDomain-2026-05-20.js)
  - [CODE-Z6-PrepareRunLog-2026-05-20.js](CODE-Z6-PrepareRunLog-2026-05-20.js)
  - [CODE-bY-PrepareContactsUpsert-2026-05-20.js](CODE-bY-PrepareContactsUpsert-2026-05-20.js)

---

## What was NOT done

- No paid Explorium calls triggered. Live Companies data is whatever was there before this session.
- L1 (`9gcmEjq1lvOY2jZS`), any L2 Classify workflow, AAV classifier logic, Contact-Sourcing employment-trust/email-verify/ICP-Score-Reason logic: untouched.
- No existing column renamed or deleted.
- No workflow re-published / no real runs initiated. Activation states unchanged from pre.
- Contacts table: no `Enrichment Provider` multi-select added yet. Open question raised with Nick.

---

## Known footnotes for review

1. **Inventory depth.** Column set was created from keys observed in **one** successful execution per workflow. Explorium omits null keys, so the live universe is wider. Reference doc [REFERENCE-explorium-extractable-data-2026-05-19.md](../../REFERENCE-explorium-extractable-data-2026-05-19.md) lists 271 business + ~50 prospect fields. A future paid run that surfaces a key we haven't observed will be silently dropped at upsert. Open question whether to pre-create reference-only columns now or after a broader exec sample.

2. **False-boolean read behavior.** Airtable's default GET omits `false`-valued checkbox fields from `fields{}`. This affected the scratch-table read-back diff (4 keys "missing" on Companies, 1 on Contacts). Data IS stored; this is Airtable surface behavior. Use `?returnFieldsByFieldId=true` or a list-records call with explicit field filter if you need to confirm.

3. **Map Archive No Domain branch.** No Explorium calls fire on that branch. Its row will have null in every `explorium_*` column and `Enrichment Provider` will be whatever was already on the row (no append). `explorium_payload_truncated = false` is set so the flag column populates.

4. **Provider seed values.** 12 choices: `explorium`, `apollo`, `hunter`, `apify_linkedin`, `clay`, `crunchbase`, `clinicaltrials_gov`, `salesforce`, `perplexity`, `exa`, `leadmagic`, `manual`. Add more in Airtable UI as new providers come online.

5. **Architectural debt unchanged.** Z6's hardcoded 10-record trigger input, parallel-source classification logic, and mixed gate versions 1.6.0/1.7.0 are still present. Out of scope per the prompt's "do not touch classifier" rule. Flagged for Nick's Step 5 scoping discussion.

---

## Decision gates owed to Nick

- Authorize paid Explorium-billing run (Step 5 spend gate).
- Authorize adding `Enrichment Provider` multi-select to Contacts table + patching bY writers (Apollo / Apify / Hunter / Explorium / Anthropic provider tags).
- Authorize column-extension pass to cover reference-doc-only keys not yet observed in live execs.

End of session.
