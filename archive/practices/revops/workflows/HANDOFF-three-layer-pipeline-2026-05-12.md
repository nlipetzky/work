# Handoff: Three-Layer RevOps Pipeline Build

**Date:** 2026-05-12
**Open this in:** a fresh Claude Code session from `~/code/work/practices/agentic-systems/`
**Plan file:** `~/.claude/plans/bubbly-whistling-crane.md`
**Mission:** Continue building the three-layer pipeline (Capture / Classify / Filter) for Teknova's AAV outreach play. Phase 1 (schema) is complete. Phase 2 (populate rules) is next.

---

## What was decided

Nick identified a recurring problem: classification rules hardcoded in n8n Code nodes force a rebuild every time criteria sharpen. The fix is architectural:

1. **Capture** (Layer 1) -- source data from anywhere, keep everything, no judgment, no filtering
2. **Classify** (Layer 2) -- separate workflow, reads rules from an Airtable Classification Rules table, re-runnable across all records when rules change
3. **Filter** (Layer 3) -- separate workflow, reads segment criteria from the same rules table, produces outreach-ready list

The client (Ellie) owns the rules. When rules change, edit Airtable rows, re-run the classification. No workflow code changes.

---

## What was built this session

### ClinicalTrials.gov Discovery Workflow (`9gcmEjq1lvOY2jZS`)

n8n workflow in the instig8.app.n8n.cloud instance. Current state: working but needs refactoring into pure L1 capture (it still has classification logic mixed in from the initial build).

**Architecture:**
- Schedule trigger (weekly Monday 6am) + manual
- HTTP Request: clinicaltrials.gov API v2, paginated (`query.intr=AAV`, 100/page, up to 50 pages)
- Code: extract industry sponsors, normalize names, aggregate trial metadata
- Bulk Lookup: single Airtable call to get existing Discovery Sources
- Merge: preserves prior sources on re-run (doesn't clobber)
- Batch upsert to Companies table (10 per batch)
- Run log to Enrichment Runs table

**Known issues to fix in Phase 3:**
- Linear chain: Bulk Lookup must be between Extract and Merge (Nick manually rewired this in the UI; the SDK kept putting it on a side branch)
- Classification logic still in the Extract node (AAV keyword matching should move to L2)
- pageSize bug: duplicate parameter in the query
- 1.6 MB payload: add `fields` parameter to slim down API response

### Airtable Schema (Phase 1 complete)

**Companies table (`tblnj3YlOI3thjrXp`)** -- 14 new fields added:
- L1 capture: Sponsor HQ Country, CT.gov NCT IDs, CT.gov Indications
- L2 classify: Therapeutic Modality (singleSelect), Delivery Vehicle (singleSelect), Vector Evidence Clause (A/B/C/none), Verification Status (surfaced/borderline/rejected/needs_verification), Rejection Reason, Classification Version, Classification Run Date
- L3 filter: Segment Score, Segment Version, Segment Run Date, Outreach Eligible (checkbox)

**Classification Rules table (`tbl1HFYzezFYs5C3k`)** -- NEW table:
- Rule Name, Rule Category (vocabulary_filter/vector_evidence/indication_list/disqualifier/modality_bucket/reroute_map/hard_filter/soft_signal), Rule Value, Rule Weight, Active (checkbox), Source Doc, Notes
- Empty. Phase 2 populates it.

**Enrichment Runs table (`tblEVSEqetmu4ScHe`)** -- 3 new fields:
- Run Type (L1_capture/L2_classify/L3_filter/gate_legacy), Run Mode (incremental/full_rerun), Rules Version

### Discovery Data

35 companies captured from clinicaltrials.gov and written to Companies table:
- 5 Phase 3, 18 Phase 2, 8 Phase 1, 1 Preclinical, 3 collaborators
- All tagged: Discovery Sources = clinicaltrials_gov, Discovery Confidence = 1, Canonical Status = candidate
- Summary written to `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/canonical-aav-clinicaltrials-summary-2026-05-12.md`

### Design Doc

`/Users/nplmini/code/work/practices/revops/workflows/canonical-aav-discovery/DESIGN.md` -- covers all 8 planned data sources, schema recommendation, dedup strategy, build order. All open questions resolved.

---

## What's next (Phase 2 onward)

### Phase 2: Populate Classification Rules table (next session)

Extract rules from these operating documents into structured Airtable rows:

| Source Doc | Rules to extract |
|---|---|
| `revops-modality-taxonomy-*.md` | Modality bucket list, AAV pass criteria, re-route mapping, edge case disqualifiers, source conflict tiebreaker |
| `revops-sourcing-rules-*.md` | Query strings, source trust ranking, auto-add vs queue thresholds |
| `revops-segment-*.md` | Hard filters (7), soft signals (7 with weights), disqualifiers (9) |
| `HANDOFF-aav-sourcing-workflow-validation-2026-05-12.md` | Disease-AAV vocabulary (7 terms), canonical AAV indications (27 terms), vector evidence regex, top-20 pharma list |

Estimated: 2-3 hours.

### Phase 3: Refactor CT.gov workflow into pure L1 Capture

Strip classification logic from Extract Industry Sponsors node. Add validation flags (disease-AAV collision, vector evidence clause). Write CT.gov-specific fields (NCT IDs, indications). Fix pageSize bug. Fix linear chain.

Estimated: 4-6 hours.

### Phase 4: Build L2 Classify workflow (new)

Reads Classification Rules table at runtime. Applies modality classification + delivery vehicle detection + three-way routing (surfaced/rerouted/rejected). Supports incremental and full_rerun modes.

Estimated: 6-8 hours.

### Phase 5: Build L3 Filter workflow (new)

Reads hard_filter + soft_signal rules from Classification Rules table. Applies company-level and contact-level filters. Scores soft signals. Produces Outreach Eligible flag.

Estimated: 6-8 hours.

### Phase 6-8: Verify, full run, archive old gate

Estimated: 6-8 hours total.

---

## Key files

| File | Purpose |
|---|---|
| `~/.claude/plans/bubbly-whistling-crane.md` | Full implementation plan |
| `practices/revops/workflows/canonical-aav-discovery/DESIGN.md` | Data source design doc |
| `accounts/clients/teknova/artifacts/revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md` | Taxonomy rules (human-readable) |
| `accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` | Segment criteria (human-readable) |
| `accounts/clients/teknova/artifacts/revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md` | Sourcing rules (human-readable) |
| `accounts/clients/teknova/HANDOFF-aav-sourcing-workflow-validation-2026-05-12.md` | 5 validation rules with test fixtures |
| `accounts/clients/teknova/artifacts/canonical-aav-clinicaltrials-summary-2026-05-12.md` | First run summary for Ellie |

## Key decisions made this session

- **Airtable-primary** for all data (not Supabase)
- **Teknova-specific** canonical universe (not shared across clients)
- **n8n** for all workflow execution
- **No Crunchbase API** (not available). Funding signals via Exa/Perplexity.
- **No filtering at capture time.** Collect everything, filter downstream in Airtable views.
- **Classification Rules in Airtable table** (not markdown parsing at runtime). Structured rows are reliable; markdown parsing is fragile.
- **Enrichment Runs table** reused as Run Log (with new Run Type/Mode/Version fields) rather than creating a separate table.

## Behavioral notes for the next session

- Don't mention n8n Airtable credentials. They're confirmed working. Never bring them up.
- Don't run pinned/simulated n8n tests and call them tests. Only real executions count. Tell Nick what manual steps are needed before running.
- Don't filter during ingestion. Capture everything.
- Show absolute file paths when announcing file creates/edits.
