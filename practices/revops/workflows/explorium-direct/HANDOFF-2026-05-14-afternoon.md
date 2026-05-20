# Handoff: Phase 4b in progress + geography_mismatch structural issue surfaced
**Date:** 2026-05-14 (afternoon)
**Pick up from:** `practices/revops/workflows/explorium-direct/`
**Previous handoff:** `HANDOFF-2026-05-13-evening.md`

---

## First actions in new session

1. Decide how to handle the 4 incorrectly archived US companies (see "Open issue: geography_mismatch" below). This is a strategic decision, not a code decision. Options are listed. Do not just manually set HQ Country = US without Nick explicitly approving the approach.
2. Continue Phase 4b: run the next batch of 10 CT.gov records. Pick US-based AAV biotechs from the unenriched pool (see "Next batch candidates" below).
3. When Phase 4b is far enough along, update the Ellie CSV and re-share the Google Sheets link.
4. Phase 5 and Phase 6 are still pending (read-only investigation + roadmap doc). No approval needed for either.

Pre-condition before any enrichment run: explicit Nick approval same-session per `feedback_no_autonomous_budget_actions.md`.

---

## What happened this session

### Geography gate redesign (gate v1.7.0)

Replaced the three-layer geography logic (Geography Fit field + HQ Country override + Explorium fallback) with a single source of truth: the `HQ Country` field in Airtable. Logic in Qualify Company:

- If `HQ Country` is already set in Airtable: use it (manual or prior enrichment set it).
- If empty: pull `firm.country_name` from Explorium and write it back to `HQ Country`.
- One field, one source, no hidden override chains.

Deleted `Geography Fit` and `Country` fields from the Airtable Companies table. Gate version bumped to 1.7.0.

Deleted the old Ellie review fields and re-created clean: `Ellie Segment Override`, `Ellie Note`, `Ellie Reviewed At`.

### Phase 4a: Ellie's 18 manual records -- COMPLETE

All 18 records enriched. Spot-check confirmed: Sarepta (gene_therapy, public-domestic, HQ Country=US, Ellie Note preserved) and Andelyn Biosciences (production_tool, private, HQ Country=US) both correct on gate v1.7.0.

Ellie's CSV notes were migrated from Classification Notes to the Ellie Note field before running, so the pipeline did not overwrite them.

### Phase 4b batch 1: 10 CT.gov records -- COMPLETE (mixed results)

Records run:

| Company | Result | Notes |
|---|---|---|
| Spirovant Sciences | enrichment_complete | US, gene_therapy, private |
| REGENXBIO Inc. | enrichment_complete | US, gene_therapy, public-domestic, full deep enrichment |
| Rocket Pharmaceuticals | enrichment_complete | US, gene_therapy, public-domestic, full deep enrichment |
| Aspa Therapeutics | enrichment_complete | US, gene_therapy, private |
| Affinia Therapeutics | enrichment_complete | US, gene_therapy, private |
| Adverum Biotechnologies | archived_out_of_industry | geography_mismatch -- Explorium matched wrong entity |
| MeiraGTx, LLC | archived_out_of_industry | geography_mismatch -- Explorium matched wrong entity |
| Nanoscope Therapeutics | archived_out_of_industry | geography_mismatch -- Explorium matched wrong entity |
| Spur Therapeutics | archived_out_of_industry | geography_mismatch -- Explorium matched wrong entity |
| Innopeutics Corporation | archived_out_of_industry | geography_mismatch -- Explorium returned Korea (correct) |

5 of 10 archived on geography_mismatch. Innopeutics is correct (Korean company). The other 4 are US-based AAV biotechs that Explorium matched to a foreign parent or holding entity.

### CSV exported for Ellie review

File: `/Users/nplmini/code/work/practices/revops/workflows/explorium-direct/ellie-review-enrichment-2026-05-14.csv`

63 enrichment_complete records, 23 populated columns. Technical internals stripped (Classification Notes, Explorium Business ID, Custom Classification details). Nick loaded to Google Sheets and sent to Ellie + Christa via email reply to Christa's 11:30 AM email in the "New AAV discovery approach" thread.

Note: a handful of early records (Beacon, 4D Molecular, Lexeo, Voyager) have thin data -- they ran through an older pipeline version before deep enrichment was wired in. They show enrichment_complete but are missing Company Focus, Key Competitors, Strategic Notes, and funding fields. Backfill deferred.

---

## Open issue: geography_mismatch (structural, not yet fixed)

### What happens

The Match Business step sends company name to Explorium and gets back a business_id. Enrich Firmographics fetches that entity's `country_name`. If no HQ Country is set in Airtable (true for all CT.gov records), `country_name` is used as authoritative. If Explorium matched the wrong entity -- typically the foreign ultimate parent rather than the US operating subsidiary -- `country_name` is a foreign country and the record archives.

### Why CT.gov records are especially exposed

CT.gov records came in with only a company name and trial metadata. No domain. The Match Business step is name-only. Name-only matching in a global entity graph is ambiguous. For any AAV company with cross-border ownership (Irish parent, Cayman holding entity, UK incorporation), Explorium often surfaces the foreign parent rather than the US operating entity. The manual Ellie records came in with HQ Country pre-set, so they bypassed this problem.

### The compounding problem

Manually setting HQ Country = US and re-running fixes the geography gate. It does NOT fix the underlying entity match. The record will enrich with data for the foreign entity that Explorium originally matched: wrong revenue range, wrong employee count, wrong funding history, wrong competitors. The data will look plausible but describe the wrong legal entity.

### The real fix (not yet built)

The match needs a domain anchor. A company's domain uniquely identifies its operating entity in Explorium's graph. Foreign parents and US subsidiaries have different domains. Adding a pre-flight step that resolves a domain for each company (from CT.gov trial data, a web search, or Explorium autocomplete) before the Match Business call would eliminate ambiguous name-only matches. Until that exists, every CT.gov batch will produce some percentage of wrong-entity matches.

### Options for the 4 incorrectly archived US companies

Record IDs: Adverum Biotechnologies (recF74xWURNQdFfUd), MeiraGTx (rec7qaGedk0dmOON3), Nanoscope Therapeutics (rec8qiZ5E6vqWnlkk), Spur Therapeutics (recAUuPk6yeMlHlWz).

**Option A (workaround):** Find the correct website domain for each of the 4 companies, set Domain + HQ Country = US in Airtable, clear Enrichment Status, re-run. This forces the geography gate to pass. The domain in the Domain field may also help Explorium re-match to the right entity (the workflow uses the domain in the URL-building steps). Risk: Explorium Match Business may still return the same wrong entity, in which case the enrichment data is still for the foreign parent.

**Option B (structural fix first):** Build the domain pre-flight step into the workflow before running more batches. Slower, but every subsequent batch benefits. This would also fix the batch 1 records if re-run after the fix.

**Option C (accept and flag):** Mark the 4 records as `needs_data_quality_review` rather than archiving. Add a review path in Airtable where Nick or Ellie can manually verify and re-queue. Keeps the list accurate, surfaces the data quality problem without silently losing records.

Nick has not chosen an option yet. Do not act without explicit direction.

---

## Enrichment state at session end

**Total CT.gov records in Airtable:** ~103
**Enriched (enrichment_complete):** ~68 (63 at CSV export time + 5 from Phase 4b batch 1)
**Archived (out of industry or wrong modality):** varies -- includes geography_mismatch cases
**Unenriched CT.gov records remaining:** ~70

**Early thin records needing backfill (deferred):**
- recUjFQdiedOQTmaE -- Beacon Therapeutics
- recgj0YdmktOcjNsb -- 4D Molecular Therapeutics
- recQK2eCNVTSguA1r -- Lexeo Therapeutics
- recITaZ11Ot0ztV90 -- Voyager Therapeutics

These are enrichment_complete but missing Company Focus, Key Competitors, Strategic Notes, and funding fields. They ran before deep enrichment was added to the workflow.

---

## Next batch candidates (Phase 4b batch 2)

From the unenriched CT.gov pool, US-based AAV biotechs likely to produce useful enrichment (skip Chinese, European, large pharma that will archive):

Suggested 10:
- recJCe3fwYK4oU1uT is done (REGENXBIO). Next picks from unenriched:
- recF74xWURNQdFfUd -- Adverum (currently archived, may swap with a fresh pick)
- recXuzce8u5YpMpC9 is done (Rocket). 

Better: pull a fresh unenriched list at session start and pick 10 NA-based companies. Filter: `{Enrichment Status} = ''` AND Discovery Sources contains `clinicaltrials_gov`. Avoid Chinese/EU names.

Good candidates from the visible unenriched pool:
- rec6ysTQtfgv5VS6V -- Life Biosciences Inc.
- recJCe3fwYK4oU1uT -- REGENXBIO (done -- skip)
- recAUuPk6yeMlHlWz -- Spur (archived, skip unless re-queuing)
- rec8KgMDLnxBWzQxh -- Brain Neurotherapy Bio, Inc.
- receidsDBhIOGHERW -- Innopeutics (archived Korea, skip)
- recmleRMH0O6sjwJ5 -- Ascidian Therapeutics, Inc.
- recoJXHNZURpOzGET -- VegaVect, Inc.
- recjN6amHGPXzGZ80 -- eyeDNA Therapeutics
- rectq2g0JZ7e1W2I5 -- Affinia (done -- skip)
- rec8qiZ5E6vqWnlkk -- Nanoscope (archived, skip unless re-queuing)
- recJCe3fwYK4oU1uT -- REGENXBIO (done)
- recBKiPPAp0HcpF5H -- UniQure Biopharma (NL parent, may archive)
- recXuzce8u5YpMpC9 -- Rocket (done)

Pull a fresh unenriched list from Airtable at session start to get clean IDs.

---

## Open plan items (from the approved plan)

| Item | Status |
|---|---|
| Ingest Ellie's 18 companies | DONE |
| AAV Segment classifier deployed | DONE |
| Ellie review UX fields added | DONE |
| Phase 4a enrichment run | DONE |
| Phase 4b enrichment run (batches) | IN PROGRESS -- 1 of ~7 batches done |
| CT.gov L1 recall investigation (Phase 5) | NOT STARTED -- read-only, no approval needed |
| Sourcing layer roadmap doc (Phase 6) | NOT STARTED -- no approval needed |
| Early thin record backfill | DEFERRED |
| Geography_mismatch structural fix | DEFERRED -- options presented, Nick deciding |

---

## Key identifiers

| Item | Value |
|---|---|
| Airtable base | `appYBYH3aOHhTODAw` |
| Companies table | `tblnj3YlOI3thjrXp` |
| Discovery Sources field | `fldTCsyrnKMIPu6IQ` |
| Verification Status field | `fldirGjP6bjd5GCaL` |
| Enrichment Status field | `fldyfIr4H4lSIYZdC` |
| AAV Segment field | `fldDIP7I0ZGlUocsR` |
| Companies Enrichment workflow | `Z6RROKx5omdfvhtn` |
| CT.gov L1 Capture workflow | `9gcmEjq1lvOY2jZS` |
| L2 Classify workflow | `rXKuqfDwqX7TYzxK` |
| Ellie review CSV | `/Users/nplmini/code/work/practices/revops/workflows/explorium-direct/ellie-review-enrichment-2026-05-14.csv` |

---

## Files modified this session

- `node-qualify-company.js` -- gate v1.7.0, single-source HQ Country logic, removed Geography Fit reference
- `node-map-enriched-fields.js` -- `HQ Country` field name (was `Country`), all other fields unchanged
- `node-check-aav-modality.js` -- no changes this session (was fixed in previous session)
- Map Archive Fields (n8n Code node, not a local file) -- updated to output `HQ Country` instead of `Country`
- `ellie-review-enrichment-2026-05-14.csv` -- 63-record CSV for Ellie, sent via email

---

## Behavioral rules to carry forward

- No autonomous budget actions without explicit same-session approval.
- The workflow IS the deliverable. Do not bypass n8n with direct MCP/API data moves.
- Stop and report after each substep on multi-step work.
- Never call the Teknova Airtable base "Pearl." It is "Teknova Outreach."
- Em dashes forbidden. Use ellipses or periods.
- Show absolute file paths when creating or editing files.
- No pinned/simulated n8n tests. Only real executions count.
