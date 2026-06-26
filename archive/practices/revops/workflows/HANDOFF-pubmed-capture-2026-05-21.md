# HANDOFF — PubMed Publication Capture (AAV-filtered)

**Date:** 2026-05-21
**To:** agentic-systems (orchestrator)
**From:** workflows builder
**Status:** Deployed, last manual run succeeded. Not activated. No schedule change.

References-only. All claims below are re-pullable from the n8n instance or Airtable.

---

## Workflow

| Field | Value |
|---|---|
| Workflow ID | `poYzPN589ZK4zfO5` |
| Workflow URL | https://instig8.app.n8n.cloud/workflow/poYzPN589ZK4zfO5 |
| Current versionId | `a216e114-8c6a-406e-b13c-25b99edc36bf` |
| Active | `false` |
| Trigger nodes | `Manual Trigger`, `Monthly Schedule` (cron `0 6 1 * *`) |
| Node count | 20 |

### Per-node credentials (live workflow GET, verbatim)

| Node | type | credentials |
|---|---|---|
| Manual Trigger | manualTrigger | `{}` |
| Monthly Schedule | scheduleTrigger | `{}` |
| Co List Companies | airtable v2.2 | `{"airtableTokenApi":{"id":"gppZOg4RmjcuPf9T","name":"All KAI Bases"}}` |
| Co Split Companies | splitInBatches v3 | `{}` |
| Co Build Company Query | code v2 | `{}` |
| Co PubMed Search | httpRequest v4.3 | `{}` |
| Co Has Publications? | if v2.2 | `{}` |
| Co Fetch Publication XML | httpRequest v4.3 | `{}` |
| Co Parse & Build Events | code v2 | `{}` |
| Co Has Events? | if v2.2 | `{}` |
| Co Write Company Events | airtable v2.2 | `{"airtableTokenApi":{"id":"FYqJQqdXIQkmT715","name":"may 26 all bases"}}` |
| Ct List Contacts | airtable v2.2 | `{"airtableTokenApi":{"id":"gppZOg4RmjcuPf9T","name":"All KAI Bases"}}` |
| Ct Split Contacts | splitInBatches v3 | `{}` |
| Ct Build Author Query | code v2 | `{}` |
| Ct PubMed Author Search | httpRequest v4.3 | `{}` |
| Ct Has Author Publications? | if v2.2 | `{}` |
| Ct Fetch Author XML | httpRequest v4.3 | `{}` |
| Ct Parse & Disambiguate | code v2 | `{}` |
| Ct Has Events? | if v2.2 | `{}` |
| Ct Write Contact Events | airtable v2.2 | `{"airtableTokenApi":{"id":"FYqJQqdXIQkmT715","name":"may 26 all bases"}}` |

### Search query shape (in `Co Build Company Query` / `Ct Build Author Query` jsCode)

```
( <scope> )
AND
( AAV[Title/Abstract] OR "adeno-associated"[Title/Abstract]
  OR Dependovirus[MeSH Terms] OR "Genetic Therapy"[MeSH Terms] OR "Genetic Vectors"[MeSH Terms]
  OR AAV1..AAV9[Title/Abstract] OR AAVrh10[Title/Abstract] OR rAAV[Title/Abstract]
  OR "gene therapy"[Title/Abstract]
  OR Zolgensma OR LUXTURNA OR "onasemnogene abeparvovec" OR "voretigene neparvovec"
  OR Hemgenix OR "etranacogene dezaparvovec"
  OR Roctavian OR "valoctocogene roxaparvovec"
  OR Elevidys OR "delandistrogene moxeparvovec"
  OR Beqvez OR "fidanacogene elaparvovec" )
AND
( "Journal Article"[Publication Type] OR "Clinical Trial"[Publication Type] OR "Review"[Publication Type] )
```

Co scope = `"<Company Name>"[Affiliation] OR "<Company Name>"[Investigator]` (plus `Ultimate Parent` if different).
Ct scope = `<LastName> <FirstInitial>[Author]`.

`esearch` uses `usehistory=y`. `efetch` uses `query_key` + `WebEnv` (not `id`). retmax: Co=25, Ct=20.

### Has Publications? gate

`count > 0 AND count <= 500` (giant-pharma guard; companies with >500 AAV-filtered hits are excluded).

### Has Events? gate

`$json.has_event === true` (parse emits `has_event:false` on dry holes to keep SiB loop alive).

---

## Executions

### Latest post-AAV-filter run

| Field | Value |
|---|---|
| Execution ID | `82595` |
| Status | `success` |
| Started | `2026-05-20T13:28:53Z` |
| Stopped | `2026-05-20T13:46:46Z` |
| Duration | 1073s |
| Workflow versionId at run time | `a216e114-8c6a-406e-b13c-25b99edc36bf` |
| Trigger | `Manual Trigger` via API `POST /workflows/{id}/execute` |

### Per-node runData counts (exec `82595`, read directly from `data.resultData.runData`)

```
Manual Trigger                  runs=1   items=1   errs=0
Co List Companies               runs=1   items=178 errs=0
Co Split Companies              runs=179 items=1079 errs=0
Co Build Company Query          runs=178 items=178 errs=0
Co PubMed Search                runs=178 items=178 errs=0
Co Has Publications?            runs=178 items=94  errs=0
Co Fetch Publication XML        runs=94  items=94  errs=0
Co Parse & Build Events         runs=94  items=995 errs=0
Co Has Events?                  runs=94  items=995 errs=0
Co Write Company Events         runs=94  items=995 errs=0
Ct List Contacts                runs=1   items=20  errs=0
Ct Split Contacts               runs=21  items=52  errs=0
Ct Build Author Query           runs=20  items=20  errs=0
Ct PubMed Author Search         runs=20  items=20  errs=0
Ct Has Author Publications?    runs=20  items=7   errs=0
Ct Fetch Author XML             runs=7   items=7   errs=0
Ct Parse & Disambiguate         runs=7   items=39  errs=0
Ct Has Events?                  runs=7   items=39  errs=0
Ct Write Contact Events         runs=7   items=39  errs=0
```

`lastNodeExecuted: Ct Split Contacts`. Top-level error: none.

### Prior executions (history, for diff context)

| ID | Status | Duration | Notes |
|---|---|---|---|
| `82595` | success | 1073s | AAV-filter live |
| `82584` | success | 76s | Tagging workflow (separate) |
| `82575` | error | 37s | Tagging workflow earlier iteration |
| `80874` | crashed | 0s | Pre-AAV-filter run |
| `80856` | crashed | 7s | Pre-AAV-filter, memory-fix version |
| `80855` | error | 101s | Date-parse bug (`2026-04-31`) |
| `80854` | canceled | 93s | Pre-fix |
| `80853` | success | 10s | Earliest run, 0 writes (bug-shadowed) |
| `80851` | error | 7s | Initial deploy errors |

---

## Helper workflow (one-shot, kept for re-tagging needs)

| Field | Value |
|---|---|
| Workflow ID | `13vn4UKYyw3BAvqm` |
| Name | `TEMP — Tag pre-AAV pubmed events (one-shot)` |
| versionId | `f420b082-f46f-4056-acff-a392e066b1b6` |
| Active | `false` |
| Last exec | `82584` (success, 76s) |
| Function | Lists `Provider=pubmed` rows from Company Events + Contact Events, appends `out-of-scope: pre-aav-filter` to `Categories / Tags` if not present, via HTTP PATCH `/v0/{base}/{table}` batched 10 records per call. |

---

## Airtable

Base: `appYBYH3aOHhTODAw`

| Table | Table ID | Field IDs of interest |
|---|---|---|
| Companies | `tblnj3YlOI3thjrXp` | (read source) |
| Contacts | `tblWJksRL1yKSUgrm` | (read source) |
| Company Events | `tblnzX2b2kqNGzW6r` | Event ID `fldxW6uuEcg73Wfkb`, Provider `fldJ92czEDveRZ0ss`, External ID `fldozCZoy0SN8t5oA`, Categories/Tags `fld2fwTyksjMqNZnq`, Detail `fldbBKER5RwHshZLr` |
| Contact Events | `tblDYItHaNcT2gnwi` | Event ID `fld4kwgiecyCBk3UZ`, Provider `fldgalubT93aBTyN1`, Categories/Tags `fldWkFpCTDZJ27Pxq` |

Provider option IDs for `pubmed`: Company Events `selKejW9bjxSGHnzs`; Contact Events `sel2LUygWS9vKthkR`. Legacy `PubMed` (cap-P) option on Company Events: `selUEsx5jpfuueNJJ`.

### Row counts at handoff time (`Provider=pubmed` on Company Events)

| Filter | Count |
|---|---|
| `Provider=pubmed` (total) | 1,609 |
| `Provider=pubmed AND Categories/Tags CONTAINS "out-of-scope"` | 1,253 |
| `Provider=pubmed AND Categories/Tags doesNotContain "out-of-scope"` | 995 |

Contact Events rows with `Provider=pubmed` at tagging time: 0. Exec `82595` wrote 39 Contact Events rows; those have no out-of-scope marker by construction.

### Sample rows written by exec `82595` (Event ID / External ID / record ID)

| Record ID | Event ID | External ID (PMID) |
|---|---|---|
| `rec04AXNpBZgBmral` | `Novartis Gene Therapies — publication — 35715566` | `35715566` |
| `rec06d4TWRid7aEfJ` | `Astellas Gene Therapies — publication — 40838110` | `40838110` |
| `rec08OQkMduyHHpHR` | `UniQure N.V. — publication — 31194088` | `31194088` |

---

## Field mapping (Company Events upsert, matchingColumns=`["Event ID"]`)

25 fields written. Mapping table:

| Airtable field | Source |
|---|---|
| Event ID | `<company> — publication — <PMID>` |
| Event Type | literal `publication` |
| Event Date | parsed PubDate (clamped via `safeBuildDate`) |
| Detail | citation + publication types + abstract (labeled) + affiliations + funding/grants (cap 8K) |
| Source URL | `https://pubmed.ncbi.nlm.nih.gov/<PMID>/` |
| Provider | literal `pubmed` |
| Company | `[record_id]` link to Companies row |
| Signal State (raw) | empty string |
| Vitality | literal `active` |
| Most Recent Activity Date | same as `Event Date` |
| Magnitude | `0` |
| Magnitude Unit | literal `citations` |
| External ID | PMID |
| Raw Reference | `pubmed:<PMID>; doi:<DOI>; pmc:<PMCID>` (DOI/PMC if present) |
| Confidence | literal `high` |
| Detected At | run date (`YYYY-MM-DD`) |
| Is Latest | `true` |
| Title | ArticleTitle |
| Names | author "Last, First" list, newline-joined |
| Categories / Tags | MeSH DescriptorNames ∪ author Keywords, newline-joined |
| Study Type | PublicationType list, `; `-joined (cap 250) |
| Intervention Type | derived: `Clinical Trial Publication` / `Meta-Analysis` / `Review` / `Publication` |
| Intervention Names | NameOfSubstance list (Chemical block), newline-joined |
| Conditions | grant funders + grant IDs, newline-joined |
| Raw Payload | full PubmedArticle XML (cap 30K) |

## Field mapping (Contact Events upsert, matchingColumns=`["Event ID"]`)

20 fields. Same shape minus `Most Recent Activity Date / Study Type / Intervention Type / Intervention Names / Conditions` (Contact Events lacks those). `Confidence` and `Signal State (raw)` come from per-article affiliation match against the contact's company:
- match → `confidence=high`, `signal_state=''`
- no match → `confidence=low`, `signal_state=needs_dq_review`

---

## Files

| Path | Purpose |
|---|---|
| `practices/revops/workflows/pubmed-capture/workflow-sdk.js` | SDK source (pre-AAV-filter; not the source of truth for current deployed state — raw REST PUT delivered final version) |
| `practices/revops/workflows/pubmed-capture/workflow.json` | Initial JSON (reference, drift expected) |
| `practices/revops/workflows/pubmed-capture/PROMPT.md` | Original build ticket |
| `practices/revops/workflows/pubmed-capture/DIRECTIVE-aav-relevance-filter-2026-05-20.md` | AAV-filter directive |
| `practices/revops/workflows/HANDOFF-pubmed-capture-2026-05-20.md` | Prior handoff (initial deploy) |
| `practices/revops/workflows/HANDOFF-pubmed-capture-2026-05-21.md` | This file |

Source of truth for live workflow config is the n8n GET at `https://instig8.app.n8n.cloud/api/v1/workflows/poYzPN589ZK4zfO5` (versionId `a216e114-8c6a-406e-b13c-25b99edc36bf`).

---

## Open items for orchestrator decision

- **Activate `Monthly Schedule`?** Not done per directive ("Do not activate or change schedule cadence").
- **84 companies skipped** by `Has Publications? count<=500` gate in exec `82595` (178 Co iterations, 94 passed the gate). The skipped 84 are companies with >500 AAV-filtered PubMed hits. Re-pullable list: re-run the workflow with the gate disabled, or query `esearch.fcgi` per Companies row offline.
- **n8n instance has 20+ orphaned `running` executions** from `nYnpliJqX2fGHcC2` (SF Account Sync, active, cron every 3 min, stuck since 2026-05-15) and `4ovg5GUeDPa1PtUg` (ETA Jets, active, daily). Public API rejects DELETE on these (HTTP 400). The cap was hit during this session (`22/20 active` observed in UI). Not in this workflow's scope.
- **Contact Events `pubmed` rows before this run: 0.** All 39 written by exec `82595` are new. If prior expected non-zero, upstream contact-write path warrants its own investigation.
