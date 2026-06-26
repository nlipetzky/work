# Handoff: AAV Mover state — 2026-05-21

**Author:** Workflows session (builder)
**For:** Nick (taking control)
**Predecessor doc:** [HANDOFF-airtable-mover-aav-companies-2026-05-20.md](HANDOFF-airtable-mover-aav-companies-2026-05-20.md)
**Workflow:** `hjXfpABgHM0zjnda` ("AT -> AT Mover") on `https://instig8.app.n8n.cloud/`
**Latest versionId:** `38c53b40-8669-4149-89a1-4c65db32c97f`

---

## What is in place

### Teknova Outreach Companies (`appFoLY6hjroyA2KW` / `tblmd04rMsw3GE3pK`) — 16 new fields created

| # | Field | Field ID | Type | Options |
|---|---|---|---|---|
| 1 | Verification Verdict | fldcbENoQz9225Vmc | singleSelect | AAV, Not AAV, Not sure |
| 2 | AAV Segment | fldGRtrHT0xWtZcZ3 | singleSelect | Gene therapy, Production tool, Both, Not AAV |
| 3 | Canonical Status | fldm9hqjPJQTnZjJu | singleSelect | Surfaced, Borderline, Rejected |
| 4 | Hard Filters Pass | fldkRoy9BsAbdv6Qx | checkbox | greenBright/check |
| 5 | Best Evidence | fld2LCXe4hDKcbaFD | singleLineText | — |
| 6 | AAV Positive Event Count | fldBC3BrLZ4pQx4BW | number | precision 0 |
| 7 | Most Recent AAV Event Date | fldL0hi9sHjdGkRFI | date | ISO YYYY-MM-DD |
| 8 | AAV Event Sources | fldUGPeVj6KhtCRjm | multipleSelects | ctgov, pubmed, uspto, press, manual |
| 9 | Sample Intervention Name | fld3xDFS01zv3nGXG | singleLineText | — |
| 10 | Most Advanced Phase | fld6oBJp0LZihhBK6 | singleSelect | Preclinical, Phase I, Phase II, Phase III, Approved |
| 11 | Lead Indication | fldLXWFssbB7pL5mJ | singleLineText | — |
| 12 | Ultimate Parent | fldT28XmWgdVpVF2r | singleLineText | — |
| 13 | Ellie Verdict | fldAWGs9bLSgOitVk | singleSelect | AAV, Not AAV, Not sure |
| 14 | Ellie Bucket | fldWl8UaxYBTyyxwg | singleSelect | Gene therapy, Production tool, Both, Not AAV |
| 15 | Ellie Note | fldwq9DhKTAcVXZ8U | multilineText | — |
| 16 | Ellie Reviewed At | fld7nNaEto5Oe2mZ6 | date | ISO YYYY-MM-DD |

Predecessor handoff dropped `IND-enabling` from Most Advanced Phase (source never emits it).

### Workflow node topology (current)

```
Trigger
  → Search records                       (Companies; filter OR(Run Selected, AAV Status (derived)="Active AAV"); returnAll)
  → Search AAV Events Per Company        (Company Events; per-Company filter; BROKEN — see below)
  → Map to Outreach schema               (Code; reads $('Search AAV Events Per Company').all() and $('Search records').all())
  → Upsert to Outreach Companies         (matchingColumns: Website Domain; typecast: true; 35 column mappings)
  → Build Signal Payloads                (Code; filters Activity Status=active + maps Type/Source; emits one item per event)
  → Upsert to Outreach Signals           (tbl1kg8oxubRlWtwL; matchingColumns: Supabase Signal ID; typecast: true)
  → Prepare Clear                        (Code; uses $('Map to Outreach schema').all() for source IDs)
  → Clear Run Selected in Surface        (updates Run Selected=false on Companies)
```

All 4 Airtable-credentialed nodes bind credential ID `FYqJQqdXIQkmT715` ("may 26 all bases"). Verified after every PUT.

### Decisions locked (confirmed by Nick this session)

- **Singleselect mismatches: Option B** — Ellie-facing destination vocabulary with value mapping in Code node.
- **Most Advanced Phase mapping:** `Preclinical→Preclinical`, `Phase 1→Phase I`, `Phase 1/2→Phase II`, `Phase 2→Phase II`, `Phase 2/3→Phase III`, `Phase 3→Phase III`, `Phase 3+→Phase III`, `Clinical→Phase I`, `Approved→Approved`. No `IND-enabling`.
- **Verification Verdict mapping:** `Confirmed→AAV`, `Not confirmed→Not AAV`, `Needs review→Not sure`, `Not yet verified→Not sure`.
- **AAV Segment mapping:** `gene_therapy→Gene therapy`, `production_tool→Production tool`, `both→Both`, `unknown→Not AAV`.
- **Canonical Status mapping:** `canonical→Surfaced`, `candidate→Borderline`, `archived→Rejected`.
- **Provider→AAV Event Sources mapping:** `clinicaltrials.gov→ctgov`, `PubMed/pubmed→pubmed`, `Manual→manual`. Others dropped.
- **Signals filter:** only events with `Activity Status="active"` get written to Signals (positive AND active).
- **Signals.Signal Type mapping:** `clinical_trial_status→Clinical Trial`, `publication→Publication`, `clinical_stage_advance→Stage Advance`, `regulatory→FDA Approval`, `funding→Funding`. Unmapped Event Types → drop the event.
- **Signals.Source mapping:** `clinicaltrials.gov→ClinicalTrials.gov`, `pubmed/PubMed→PubMed`, `Exa→Exa`. Unmapped Providers → drop the event.
- **Companies–Signals link:** by Company Name string with `typecast: true`. Dedup on `Supabase Signal ID` = `<source company recId>:<External ID or Title head or Event ID>`.
- **Match key Companies upsert:** `Website Domain` (destination has no `Supabase ID` field).

### Verified data points

- Source field availability on RevOps Surface Companies — all required fields exist with expected types.
- Source field availability on Company Events — all required fields exist.
- Affinia Therapeutics (`rectq2g0JZ7e1W2I5`) has 1 AAV-positive event: `recy3FQi70OBTP2rQ` (External ID `NCT07426419`, AAV Verdict=yes, Is Latest=true, Activity Status=active). 25 other linked events are PubMed publications with no AAV Verdict set.
- Regeneron Pharmaceuticals (`recx3mcEOj08iAqmk`) has 18 AAV-positive events per `AAV Active Event Count` rollup.

---

## Broken: Search AAV Events Per Company

Current filterByFormula on the node:
```
={{ `AND({AAV Verdict}="yes", {Is Latest}, FIND(RECORD_ID(), "${($json.fields["Company Events"] || []).join(",")}")>0)` }}
```

Returns zero output items when run with Affinia + Regeneron as input. Cause: not confirmed. Hypothesis: n8n expression engine isn't producing the expected formula string at runtime (template-literal interpolation issue), since the static formula form works against Airtable for the same event/Company pair.

Two unapplied alternatives were proposed but not deployed:

1. **String-concat expression** (avoids backtick template literals):
   ```
   ={{ 'AND({AAV Verdict}="yes", {Is Latest}, FIND(RECORD_ID(), "' + ($json.fields["Company Events"] || []).join(",") + '")>0)' }}
   ```

2. **`OR(RECORD_ID()=...)` per-company list** (more explicit):
   ```
   ={{ 'AND({AAV Verdict}="yes", {Is Latest}, OR(' + ($json.fields["Company Events"] || []).map(id => `RECORD_ID()="${id}"`).join(',') + '))' }}
   ```

Neither was tested. Nick took control here.

Earlier failed attempt (in workflow history) used `FIND($json.id, ARRAYJOIN({Company}))` — that one is structurally wrong because `{Company}` in an Airtable formula returns linked-record primary field values (Company Names), not record IDs.

A working fallback that does NOT depend on per-company filtering at all: a single global query `AND({AAV Verdict}="yes", {Is Latest})` (`executeOnce: true`, `returnAll: true`), with intersection done in the Map code by iterating each Company's `fields["Company Events"]` array and looking up events by ID in an in-memory index. This was the original v1 design and is the cleanest fit for Airtable's formula model. Out of scope for Wave 1 by Nick's preference.

---

## Not executed

- **No sync run.** Workflow has never executed end-to-end against real Companies. Zero rows written to Teknova Outreach Companies or Signals from this work.
- **No `Ellie Review — AAV Wave 1` view created.** Predecessor handoff Step 4 not started.

---

## References for orchestrator to re-pull

- Latest workflow GET: `GET https://instig8.app.n8n.cloud/api/v1/workflows/hjXfpABgHM0zjnda` with `X-N8N-API-KEY` from `/Users/nplmini/code/work/practices/n8n-practice/.mcp.json`. Expect versionId `38c53b40-8669-4149-89a1-4c65db32c97f`, 9 nodes, 4 nodes binding credential `FYqJQqdXIQkmT715`.
- Destination Companies schema: `appFoLY6hjroyA2KW` / `tblmd04rMsw3GE3pK`. Expect all 16 field IDs in the table above to resolve.
- Destination Signals table: `appFoLY6hjroyA2KW` / `tbl1kg8oxubRlWtwL`. No rows written yet from this workflow.
- Source Companies: `appYBYH3aOHhTODAw` / `tblnj3YlOI3thjrXp`. Run Selected = true on Affinia (`rectq2g0JZ7e1W2I5`) and Regeneron (`recx3mcEOj08iAqmk`) as of the session.
- Source Company Events: `appYBYH3aOHhTODAw` / `tblnzX2b2kqNGzW6r`. Affinia has 1 AAV-positive event `recy3FQi70OBTP2rQ`.

---

## What to undo if abandoning this path

- 16 new fields on Teknova Outreach Companies (table above). Deleting fields in Airtable is destructive and unrecoverable from API.
- 8 nodes touched on workflow `hjXfpABgHM0zjnda`. The pre-change versionId before this session began was `da6d3f0c-b919-4a55-b534-2b820f046b2a` — there is no built-in n8n rollback to a prior versionId via PUT, but the prior node config is preserved in `/tmp/wf_hjXfpABgHM0zjnda.json` on the host this session ran on (may be wiped on reboot).
