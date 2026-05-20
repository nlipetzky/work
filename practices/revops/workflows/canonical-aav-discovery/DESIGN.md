# Canonical AAV Discovery: Design Document

**Date:** 2026-05-11
**Author:** Boris (agentic-systems practice)
**Status:** Draft, pending Nick's review
**Companion:** [handoff](../HANDOFF-canonical-aav-discovery-2026-05-11.md)

## Executive summary

The current AAV outreach play sources candidates from general B2B databases and filters them through a classification gate. The gate works (v1.5.0 verified), but the input is wrong: 2% pass rate on a 50-record stress batch because general firmographic databases cannot distinguish AAV from other gene therapy modalities. The fix is to invert the pipeline. Instead of filtering a noisy list, construct a clean list from AAV-specific canonical sources (clinical trials, patents, industry directories), then use the existing gate as a verification layer. The canonical universe is ~100-300 companies globally, ~75-150 NA-relevant. Three free, structured Tier 1 sources should produce 60-80% of that universe in ~2 weeks of build effort.

---

## Rules storage architecture (Phase 2 update, 2026-05-12)

The original Phase 2 plan put all configuration into a single Classification Rules table. Research on mature RevOps rule-driven systems (HubSpot lead scoring, 6sense segment catalog, Clay scoring patterns) flagged this as the most common single-table anti-pattern: L1 sourcing config and L2/L3 classification rules have different consumers, different edit cadence, and different failure modes. The revised architecture is two tables:

**Classification Rules table** (`tbl1HFYzezFYs5C3k`, in RevOps Surface base)
- Consumed by L2 (Classify) and L3 (Filter) workflows.
- 9 Categories: `vocabulary_filter`, `vector_evidence`, `indication_list`, `disqualifier_modality`, `disqualifier_segment`, `modality_bucket`, `reroute_map`, `hard_filter`, `soft_signal`.
- Granularity: one row per RULE, not per token. Vocabulary lists are a single row with the value field holding the pipe-delimited list. Ellie edits "the list of AAV indications" not 27 disconnected rows.
- Rule Value is `singleLineText`. Multi-line content stored as pipe-delimited (lists) or single-line JSON (objects). Workflow parses at runtime.
- Rule Weight populated only for `soft_signal` rows (1=low, 2=medium, 3=high).

**Sources table** (`tblqjVzI6LRnc2paA`, NEW, in RevOps Surface base)
- Consumed by L1 (Capture) workflow.
- 11 fields including Source Name, Source Type, Endpoint, Auth Method, Query String, Trust Rank (1-5), Auto-Add Threshold (0.0-1.0), Refresh Cadence, Last Refreshed, Active, Notes.
- Deprecated queries kept as Active=false rows for audit trail rather than deleted.

**Workflow application order is non-negotiable for L3:** hard filters apply as a binary fail-closed pass first; soft signal scoring runs only on records that pass the gate. The Classification Rules table stores both as siblings; the workflow enforces the order. This will be documented in `L3-WORKFLOW-DESIGN.md` when L3 is built (Phase 5).

**What does NOT live in either table:**
- Therapeutic Modality vs Delivery Vehicle separation (validation Rule 3) — workflow design.
- Sponsor HQ enrichment (validation Rule 4) — workflow design.
- Source-aware vocabulary register (different match logic per source type) — workflow design for L1.

Phase 2 populated both tables: 48 Classification Rules rows + 5 active Sources rows + 4 deprecated Sources rows for audit.

---

## Tier 1 sources (highest yield-per-effort, free, structured)

### 1. ClinicalTrials.gov API v2

**Access method:**
- Endpoint: `https://clinicaltrials.gov/api/v2/studies`
- No authentication. Free. Public. Anonymous.
- Rate limit: ~10 requests/second (soft). Aggressive scraping gets 429s.

**Query approach:**
- `query.intr=AAV` scopes to intervention/treatment text (tighter than full-text `query.term`)
- `filter.overallStatus=RECRUITING,ACTIVE_NOT_RECRUITING,COMPLETED,ENROLLING_BY_INVITATION`
- `filter.phase=PHASE1,PHASE2,PHASE3` (skip EARLY_PHASE1 for noise reduction)
- Pagination: token-based via `nextPageToken`, `pageSize` up to 1000

**Fields returned (key paths):**
- `protocolSection.sponsorCollaboratorsModule.leadSponsor.name` ... the company
- `protocolSection.sponsorCollaboratorsModule.leadSponsor.class` ... filter `INDUSTRY` to isolate companies vs academic sponsors
- `protocolSection.sponsorCollaboratorsModule.collaborators[].name` ... secondary sponsors
- `protocolSection.designModule.phases[]` ... trial phase
- `protocolSection.statusModule.overallStatus` ... trial status
- `protocolSection.conditionsModule.conditions[]` ... indication
- `protocolSection.identificationModule.nctId` ... unique trial ID

**Sponsor extraction logic:**
1. Page through all results for `query.intr=AAV`
2. Collect `leadSponsor.name` where `leadSponsor.class = INDUSTRY` into a deduplicated set
3. Also collect `collaborators[].name` (catches CDMOs and co-development partners)
4. Normalize company names (strip Inc/Ltd/LLC suffixes, resolve known acquisitions)
5. Each unique company becomes a candidate row in the canonical universe

**Expected yield:** ~1,000-1,500 AAV-related studies exist. Filtering to `class=INDUSTRY` and deduplicating sponsors should produce ~150-250 unique company names. After removing academic sponsors that leak through, non-NA companies, and acquired entities, expect ~80-120 NA-relevant companies.

**Bonus metadata per company:**
- Number of active trials (R&D intensity signal)
- Most advanced trial phase (maturity signal)
- Indications targeted (personalization signal for outreach)
- Most recent trial start date (freshness signal)

**Build effort:** ~4-6 hours. One n8n workflow or standalone script. Pagination + dedup + Airtable write.

**Integration sketch:**
```
Schedule trigger (weekly)
  -> HTTP Request: clinicaltrials.gov API, paginated
  -> Code node: extract sponsors, dedup, normalize
  -> Airtable: upsert to Canonical AAV Universe
  -> Flag new discoveries for review
```

---

### 2. USPTO PatentsView API

**Access method:**
- Endpoint: `https://api.patentsview.org/patents/query` (POST)
- No authentication. Free. Public.
- Rate limit: not formally published, but ~45 requests/minute is safe

**Query approach:**
- POST body with `q` (query), `f` (fields), `o` (options/pagination)
- CPC classification codes for AAV:
  - `C12N15/86` ... viral vectors for gene transfer (primary)
  - `A61K48` ... gene therapy preparations
  - `C12N7/00` ... viruses, including AAV
  - `C07K14/005` ... viral proteins (capsid engineering)
- Keyword approach (complementary): search `patent_title` or `patent_abstract` for "adeno-associated virus" OR "AAV" AND ("capsid" OR "vector" OR "gene therapy")
- Combine CPC + keyword for best recall

**Fields returned:**
- `assignees.assignee_organization` ... the company (patent owner)
- `patent_title`, `patent_abstract` ... content
- `patent_date` ... filing/grant date
- `cpcs.cpc_subgroup_id` ... classification codes

**Assignee extraction logic:**
1. Query by CPC codes, paginate through results
2. Collect `assignee_organization` into deduplicated set
3. Filter out universities (heuristic: contains "University", "Institute", "Hospital", "College")
4. Normalize company names, resolve acquisitions
5. Count patents per assignee (R&D intensity signal)

**Expected yield:** AAV-related patent filings are concentrated among ~200-400 assignee organizations globally. After removing academic institutions and non-NA entities, expect ~60-100 unique companies. High overlap with clinicaltrials.gov sponsors, but patents catch earlier-stage companies not yet in trials and CDMOs that don't sponsor trials.

**Build effort:** ~6-8 hours. The CPC query syntax requires some iteration. Company name normalization is messier than clinicaltrials.gov because patent assignee names have more variation.

**Integration sketch:**
```
Schedule trigger (monthly -- patents don't change fast)
  -> HTTP Request: PatentsView API, paginated
  -> Code node: extract assignees, filter academics, dedup
  -> Airtable: upsert to Canonical AAV Universe
  -> Cross-reference with existing records, increment source count
```

---

### 3. Existing Teknova Salesforce (internal)

**Access method:**
- Supabase `revops-engine-dev`, `companies` table
- 9,154 records total, unknown AAV tag coverage
- Query: filter where any modality/tag field contains "AAV" or "gene therapy" with manual AAV confirmation

**What's available:**
- Companies already validated by past human review
- Existing CRM relationship history (meetings, deals, activity)
- Contact associations already built

**Expected yield:** Uncertain. The 9,097 records with NULL `enrichment_status` suggest most haven't been through modality classification. Optimistic estimate: 50-200 records with some AAV signal. Realistic: 20-50 with confirmed AAV tags from prior Salesforce work.

**Build effort:** ~1-2 hours. A single Supabase query plus manual review of the results. No workflow needed.

**Integration sketch:**
```
One-time query
  -> Filter companies with AAV/gene therapy signals
  -> Manual review of results
  -> Upsert confirmed records to Canonical AAV Universe with source="salesforce_existing"
```

---

## Tier 2 sources (high yield, moderate effort)

### 4. PubMed (NCBI E-utilities)

**Access:** Free. `esearch.fcgi` + `efetch.fcgi` at `eutils.ncbi.nlm.nih.gov`. API key optional (3 req/sec without, 10 req/sec with). Free key at ncbi.nlm.nih.gov/account.

**Approach:** Search `"AAV gene therapy"[TIAB]`, fetch XML results, extract `<AffiliationInfo>` blocks from author metadata. Filter for corporate suffixes (Inc, Therapeutics, Biosciences, Ltd, Corp). Deduplicate aggressively... affiliation strings are free-text with no standard format ("Spark Therapeutics" vs "Spark Therapeutics, Inc." vs "Spark Therapeutics, a Roche company").

**Yield:** Catches academic-spinout-stage companies before they appear in trials or patents. ~30-60 unique corporate entities after dedup, with significant overlap to Tier 1. The unique value is ~10-20 very early-stage companies not yet in ClinicalTrials.gov or USPTO.

**Gotchas:** Affiliation parsing is the hardest NLP problem in this entire design. Pre-2014 data has sparse affiliations. Mixed academic/industry affiliations common. An LLM pass for entity extraction is probably the most reliable approach.

**Build effort:** ~6-8 hours, mostly spent on affiliation parsing and dedup logic.

### 5. Funding announcement trackers

**Access:** Crunchbase API (paid, unknown if Nick has access). Alternatively, Exa/Perplexity web search for "AAV gene therapy funding" filtered to last 90 days. RSS feeds from Endpoints News, BioPharma Dive, FierceBiotech.

**Approach:** Search for funding announcements mentioning AAV / gene therapy. Extract company names from headlines and body text. Cross-reference with canonical universe to either (a) add new companies or (b) flag existing companies with a fresh funding signal (high-value soft signal per segment criteria).

**Yield:** Low for discovery (~5-10 new companies per quarter). High for enrichment (funding events on existing canonical companies are the best outreach-timing signal available).

**Build effort:** ~4-6 hours for a recurring Exa/Perplexity-based scan. Crunchbase API integration would be ~8-10 hours if access exists.

---

## Tier 3 sources (curated industry directories)

### 6. Alliance for Regenerative Medicine (ARM)

**Access:** Public member directory at alliancerm.org/members/. Filterable by sector (gene therapy, cell therapy). ~400+ member organizations. No login required for public view.

**Approach:** Scrape or Apify the directory. Filter to gene therapy sector. Cross-reference with canonical universe. ARM membership is a strong institutional signal... industry body curation is the highest signal-to-noise of any source.

**Yield:** ~40-80 gene therapy companies after filtering. Not all will be AAV-specific, but the AAV subset should be ~15-30. High overlap with Tier 1 but provides an independent confirmation signal.

**Build effort:** ~3-4 hours. Apify actor or a simple scraper.

### 7. ASGCT annual meeting exhibitor list

**Access:** Published on the conference website (annualmeeting.asgct.org). Typically 150-250 exhibiting companies. Heavily weighted toward gene/cell therapy service providers, CDMOs, and vector manufacturers.

**Approach:** Scrape exhibitor list once per year after the conference. Cross-reference with canonical universe. Good for catching CDMOs and suppliers that don't appear in trials or patents.

**Yield:** ~20-40 AAV-relevant companies from the exhibitor list. Lower discovery value (most will already be in Tier 1), but captures the CDMO/supplier segment that's harder to find via trials alone.

**Build effort:** ~2-3 hours. One-time annual scrape.

---

## Tier 4 sources (paid databases, defer)

**BioPharma Catalyst, Citeline Pharmaprojects, Evaluate Pharma, GlobalData.** Industry-grade pharma pipeline trackers. Modality-tagged at the asset level (not company level), so they can distinguish AAV from lentiviral. Expensive (typically $10K-50K/year). Comprehensive but overkill for a universe of ~200 companies that can be constructed from free sources. Worth pricing if the canonical universe approach proves valuable and Nick wants to add a monitoring/alerting layer. Not required for v1.

---

## Schema recommendation: Option B (augment existing Companies table)

**Recommendation: Option B** ... augment the existing Companies table in Airtable (RevOps Surface base, `appYBYH3aOHhTODAw`).

**Reasoning:**

Option A (separate Canonical AAV Universe table) creates a join problem. Every downstream workflow, every Ellie review, every outreach pipeline step would need to look up the canonical table, cross-reference with the Companies table, and reconcile. The existing gate workflow already reads from Companies. The segment criteria already reference Companies fields. A separate table adds complexity for no structural benefit.

Option B adds fields to the existing table:

| Field | Type | Purpose |
|---|---|---|
| `Discovery Sources` | multipleSelects | Which canonical sources found this company. Values: `clinicaltrials_gov`, `uspto_patents`, `salesforce_existing`, `pubmed`, `arm_directory`, `asgct_exhibitor`, `crunchbase`, `exa_search`, `manual` |
| `Discovery Confidence` | Number | Count of distinct sources that confirmed this company as AAV. Higher = more certain. |
| `Canonical Status` | singleSelect | `canonical` (confirmed AAV, multi-source), `candidate` (single-source, pending verification), `archived` (was canonical, now acquired/inactive/pivoted) |
| `First Discovered` | Date | When this company first entered the canonical universe |
| `Last Verified` | Date | When the most recent source re-confirmed this company |
| `Trial Count` | Number | Active + completed AAV trials (from clinicaltrials.gov) |
| `Most Advanced Phase` | singleSelect | Highest trial phase reached |
| `Patent Count` | Number | AAV-related patents filed (from PatentsView) |
| `Lead Indication` | singleLineText | Primary therapeutic area from pipeline data |

**Backfill plan:** The existing 553 records get `Discovery Sources = manual` and `Canonical Status = candidate`. As canonical sources run, matches get their source added and confidence incremented. Records that appear in 2+ canonical sources get promoted to `canonical`. Records that appear in zero canonical sources after all Tier 1 runs remain `candidate` for manual review.

**Alignment with existing sourcing rules:** The sourcing-rules doc already defines a trust ranking (Salesforce > website > web search > database tag). The `Discovery Confidence` count maps directly to the "auto-add vs queue for review" logic: 2+ sources = auto-add, 1 source = queue for Ellie.

---

## Dedup and cross-source confidence scoring

**The core problem:** company names are inconsistent across sources. "Spark Therapeutics" in ClinicalTrials.gov, "Spark Therapeutics, Inc." in USPTO, "Spark Therapeutics (a Roche company)" in PubMed, "SPARK THERAPEUTICS INC" in Salesforce.

**Approach:**

1. **Normalize on ingest.** Strip suffixes (Inc, Ltd, LLC, Corp, Co). Lowercase. Remove punctuation. This handles 70% of variations.
2. **Domain as anchor.** Where available, resolve the company's primary domain (sparktx.com). Domain is the most stable identifier across sources. ClinicalTrials.gov doesn't provide domains, but a single Exa search per new sponsor name can resolve it.
3. **Fuzzy match on upsert.** Before creating a new record, fuzzy-match against existing `Company Name` (normalized) and `Domain`. Threshold: >85% similarity on name OR exact domain match = treat as same entity.
4. **Acquisition mapping.** Maintain a small lookup table of known acquisitions (AveXis -> Novartis, Audentes -> Astellas, Spark -> Roche). Apply on ingest to resolve parent entities. Flag as acquired in `Canonical Status` if the subsidiary no longer operates independently.
5. **Confidence scoring.** Each source that independently confirms a company increments `Discovery Confidence` by 1. A company found in clinicaltrials.gov AND USPTO AND ARM directory gets confidence = 3.

**When to run dedup:** After each source ingest completes. Not as a separate batch job. Dedup is part of the upsert logic.

---

## Integration with existing gate workflow

The existing gate workflow (`Z6RROKx5omdfvhtn`, v1.5.0) does not change. Its role shifts:

**Before (current):**
```
Noisy 553-record list -> Gate (AAV classification) -> 2% pass rate -> Outreach
```

**After (canonical):**
```
Canonical sources -> Canonical Universe (~150-250) -> Gate (verification) -> 60-80% pass rate -> Outreach
```

The gate's job becomes verification, not discovery:
- Confirms the company is still active (not acquired, not pivoted)
- Confirms NA headquarters
- Confirms website still shows AAV language
- Catches companies that were AAV historically but pivoted

Records that fail the gate from the canonical universe are meaningful signals: acquired companies, pivoted platforms, dead companies. These get `Canonical Status = archived` with the reason noted.

The 553 existing records are parked. They don't get deleted. When canonical sources run, any matches between the 553 and the canonical universe get linked. The remainder stay as `candidate` for potential future plays or manual review.

---

## Recommended build order

| Phase | Source | Effort | Cumulative yield |
|---|---|---|---|
| 1 | ClinicalTrials.gov | 4-6 hours | ~80-120 companies |
| 2 | USPTO PatentsView | 6-8 hours | ~100-150 (with overlap dedup) |
| 3 | Salesforce existing | 1-2 hours | ~110-160 |
| 4 | Dedup + confidence scoring | 3-4 hours | Same count, higher confidence |
| 5 | Wire canonical universe as gate input | 2-3 hours | Gate pass rate jumps to 60-80% |
| 6 | ARM directory scrape | 3-4 hours | ~120-170 |
| 7 | PubMed E-utilities | 6-8 hours | ~130-180 |
| 8 | Funding announcement scan | 4-6 hours | Enrichment signal, not discovery |

**Phases 1-5 are the MVP.** They should produce a usable canonical list of 100-160 NA-relevant AAV companies with confidence scores. That's enough to ship to Teknova as a v1 canonical universe.

**Total MVP effort:** ~17-23 hours across 3-4 sessions.

Phases 6-8 are incremental improvements. Each adds ~10-20 unique companies and/or enrichment signals. Build them when the MVP is running and Ellie has reviewed the first canonical list.

---

## Open questions for Nick

1. ~~**Crunchbase API access?**~~ **Resolved: No.** Funding signals come from Exa/Perplexity web search, not Crunchbase API.

2. ~~**ARM membership?**~~ **Resolved: No.** Use public member directory only.

3. ~~**Budget for Tier 4?**~~ **Resolved: No.** Not needed for v1.

4. ~~**Ellie's known-universe brain dump?**~~ **Resolved: Not now.** Optional future input. Not blocking any phase.

5. ~~**Canonical universe scope: Teknova-specific or shared?**~~ **Resolved: Teknova-specific.** Lives in the RevOps Surface base scoped to this engagement. If a second AAV client appears later, revisit whether to extract a shared universe.

6. ~~**n8n or standalone scripts?**~~ **Resolved: n8n.** All source ingestion built as n8n workflows. HTTP Request nodes for API calls, Code nodes for data transformation only (no outbound HTTP from Code nodes on n8n Cloud). Scheduling and visibility through n8n.

7. ~~**Airtable vs Supabase for canonical storage?**~~ **Resolved: Airtable-primary.** Canonical universe lives in the RevOps Surface base (`appYBYH3aOHhTODAw`). Ellie reviews there. No Supabase sync for v1.

---

## What this design does NOT cover

- **Contact discovery.** This design finds companies, not people. Contact sourcing (Find People at Company via Apollo/Clay) is a downstream step that runs after the canonical universe is populated and gate-verified.
- **Outreach copy or sequencing.** Covered by the creative-brief and copy-draft skills.
- **Gate workflow modifications.** The gate stays as-is. Its input changes; its logic doesn't.
- **Historical data cleanup.** The 553 existing records are parked, not cleaned. Cleanup is a future task after canonical sources provide a ground truth to compare against.

---

## Change log

| Date | Change | Author |
|---|---|---|
| 2026-05-11 | Initial design | Boris |
