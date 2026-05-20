# Handoff: canonical AAV discovery architecture

**Date:** 2026-05-11
**Open this in:** a fresh Claude Code session from `~/code/work/practices/revops/workflows/`
**Mission:** scope and design a canonical-source discovery system for AAV gene therapy companies. Replace the current "filter a noisy general B2B list" approach with a "construct a clean list from AAV-specific signals" approach. Output of this session is a design document, not implementation. Implementation spawns into follow-on sessions.

---

## Why this exists (strategic context)

Nick has spent 8 months trying to source AAV gene therapy companies for Teknova's outreach play. The current approach feeds general B2B data (Salesforce sync, Explorium, Apollo, broad Exa queries) through a classification gate. Outcome on a 50-record stress batch: **1 AAV pass out of 50** (2% rate). The gate workflow is mechanically correct; the input list is noisy because general B2B databases don't tag AAV at the right granularity. NAICS 325414 ("Biological Product Manufacturing") includes thousands of companies, most not AAV.

The professional RevOps approach for specialized clinical-stage niches is different. AAV gene therapy is a small, well-defined universe (~100-300 companies globally, ~75-100 NA-located and play-relevant). They're findable via AAV-specific signals: clinical trial registrations, patent filings, industry directories. Not via general firmographic databases.

**The reframe:** the gate workflow already built (workflow `Z6RROKx5omdfvhtn`, gate v1.5.0) does not get thrown away. It becomes a verification + monitoring layer rather than a discovery filter. The discovery side gets rebuilt against canonical AAV sources.

This handoff scopes the rebuild.

---

## What this session produces

A design document at `practices/revops/workflows/canonical-aav-discovery/DESIGN.md` covering:

1. The data sources, ranked by yield-per-effort
2. Per-source: API access pattern, fields returned, rate limits, cost
3. The canonical Companies schema (new Airtable table OR augmented existing table)
4. Dedup + cross-source confidence scoring approach
5. Integration with the existing gate (how the new flow + old flow coexist)
6. Recommended build order with effort estimates
7. Open questions for Nick to weigh in on before implementation begins

No code in this session. No workflow builds. No Airtable schema changes. Pure design.

---

## Data sources to evaluate

Listed in rough priority order. Each needs a section in the design doc with: access method, expected yield, cost, integration shape, build effort.

### Tier 1 (highest yield-per-effort, free, structured)

**clinicaltrials.gov API**
- Endpoint: `https://clinicaltrials.gov/api/v2/studies`
- Free, public, well-documented
- Search for AAV in intervention text. Returns trials, with sponsor (company) as a field
- Each AAV-using sponsor is a candidate AAV company
- Strong signal: company has at least one active or recent trial using AAV
- Build a list of unique sponsors filtered by AAV interventions in the last 5-10 years
- Bonus metadata: trial phase, indication, status, primary completion date

**USPTO + WIPO patent filings**
- USPTO: open data via PatentsView API (https://api.patentsview.org/) or bulk downloads
- WIPO: Patentscope (less convenient API; consider Google Patents BigQuery as a unified source)
- Filter approach: assignee organizations on patents matching AAV / capsid / viral vector classifications
- IPC codes worth filtering: C12N15/86 (recombinant viruses), A61K48 (gene therapy preparations), specific capsid-related subclasses
- Bonus: filing frequency = R&D intensity signal

**Existing Teknova Salesforce**
- Filter the 7,463 Salesforce-synced records in Supabase for `modality_confirmed = true` and `primary_modality` containing "AAV"
- This is essentially free internal signal that's already been validated by past human review
- Likely 50-200 records of known AAV companies

### Tier 2 (high yield, some effort)

**PubMed publications**
- NCBI E-utilities API, free
- Search "AAV gene therapy" with affiliation containing common corporate suffixes (Inc, Therapeutics, Biosciences, etc.)
- Extracts corporate affiliations from author metadata
- Catches academic-spinout-stage companies before they appear in trials or patents

**Funding announcement trackers**
- Crunchbase API (paid; Nick may have access)
- Endpoints News, BioPharma Dive, FierceBiotech (RSS / scrape via Apify)
- Filter announcements mentioning AAV / gene therapy
- Bonus signal: recent funding event for an existing canonical-list company is a high-value signal for outreach prioritization

### Tier 3 (curated industry sources)

**Alliance for Regenerative Medicine (ARM) directory**
- ~400 member companies, tagged by modality
- May require ARM membership for full access, or scrape the public member list via Apify
- Highest signal-to-noise of any source... industry body curation

**ASGCT (American Society of Gene & Cell Therapy)**
- Annual conference exhibitor / attendee lists
- Less structured; may need manual capture or Apify scrape of the conference site
- Captures CDMOs, suppliers, and smaller companies that don't show in patents or trials

### Tier 4 (specialty paid databases, defer unless budget allows)

**BioPharma Catalyst, Citeline Pharmaprojects, Evaluate Pharma, GlobalData**
- Industry-grade pharma trackers
- Modality-tagged at the asset level (not company level)
- Expensive but comprehensive
- Worth pricing as a future option; not required for v1

---

## Architecture: how this integrates with the existing gate

The proposed shape:

```
[Tier 1+2 sources] ──> Canonical AAV Universe table (Airtable)
                            │
                            ├──> Gate workflow (verification, not discovery)
                            │      └──> Confirms still active, NA-located, in scope
                            │
                            ├──> Signal monitor workflow (periodic re-scan)
                            │      └──> Detects new IND filings, funding events, leadership hires
                            │
                            └──> Outreach pipeline (Phase G+)
```

The current gate workflow (`Z6RROKx5omdfvhtn`) continues to exist but its INPUT changes. Instead of filtering a noisy 553-record general list, it verifies a curated 100-200-record canonical list. Expected pass rate: 60-80%. Records that fail the gate at this stage are likely dead companies, acquired subsidiaries, or domain-quality issues... a meaningful signal, not noise.

The 553-record existing Airtable list is parked, not deleted. Some of those records may overlap with the canonical universe. Cross-reference can light up "we have prior history with this company in our CRM."

---

## Canonical universe schema (open question for design)

Two options to evaluate:

**Option A: New Airtable table `Canonical AAV Universe`**
- Separate from `Companies`
- Each row: company name, primary domain, source(s) it was discovered from, source confidence count, discovery date, last verified date
- Linked record to existing `Companies` when there's a cross-match

**Option B: Augment existing `Companies` table**
- Add fields: `Discovery Sources` (multipleSelects: clinicaltrials, uspto, arm, asgct, pubmed, crunchbase, salesforce_sync, manual), `Discovery Confidence` (number: count of sources confirming), `Canonical Status` (singleSelect: canonical, candidate, archived)
- Existing 553 records get backfilled where possible
- All future discovery writes to the same table

The design doc should recommend one (lean toward B for simplicity, but evaluate explicitly).

---

## Recommended build order (for follow-on sessions, not this one)

1. **Phase 1:** clinicaltrials.gov pull. Lowest effort, highest yield. Probably 1 session, ~2-4 hours of work.
2. **Phase 2:** USPTO PatentsView pull. ~1 session, ~3-5 hours.
3. **Phase 3:** Salesforce-existing-AAV filter into canonical. Quick win, ~1 hour.
4. **Phase 4:** Dedup + cross-source confidence scoring. Run once Phases 1-3 produce data.
5. **Phase 5:** Wire the canonical universe into the existing gate as the new input source.
6. **Phase 6:** ARM directory (scrape via Apify if no API).
7. **Phase 7:** PubMed E-utilities.
8. **Phase 8:** Funding announcement trackers.

Don't try to build all of them. The first three plus dedup should produce a usable canonical list of 150-250 companies. That's enough to ship to Teknova as v1.

---

## Open questions for Nick (collect answers in the design doc)

1. **Crunchbase API access?** Yes/no. If no, skip Tier 2 funding trackers in v1.
2. **ARM membership?** Yes/no. If yes, what's the public-vs-member-only data split.
3. **Budget for Tier 4 paid databases (Citeline, Evaluate Pharma)?** Probably not now, but worth naming.
4. **What does Ellie's current knowledge cover?** A 30-minute conversation with her to extract "the 50 AAV companies you know off the top of your head" could be the cheapest, highest-quality first input.
5. **Should the canonical universe be Teknova-specific or generic?** If Nick onboards a second AAV-adjacent client later, do they share the canonical universe or get their own? (Argues for a shared canonical at a higher tier in the data model, with per-client play membership overlays.)

---

## What NOT to do in this session

- Don't write code. This is a design session.
- Don't change the existing gate workflow. It works for what it does.
- Don't propose to delete the 553-record list. Park it. Some records will turn out to be canonical.
- Don't build the Airtable schema yet. The design doc proposes; Nick approves; then a separate session executes.
- Don't try to scope all 8 sources in detail. Tiers 1 and 2 deserve depth; Tiers 3 and 4 get a paragraph each.

---

## Definition of done

- A design doc exists at `practices/revops/workflows/canonical-aav-discovery/DESIGN.md`
- Tier 1 sources (clinicaltrials.gov, USPTO, Salesforce-existing) have full sections: API access, field mapping, expected yield estimate, build effort estimate, integration sketch
- Tier 2 and 3 sources have shorter sections (one to two paragraphs each)
- The canonical universe schema option is recommended (A or B) with reasoning
- The build-order list is in the doc with effort estimates
- Open questions for Nick are surfaced explicitly in a section he can answer in-line
- A one-paragraph executive summary at the top lets Nick scan the doc in 60 seconds

---

## Reference material in this repo

- Existing gate workflow doc: `practices/revops/workflows/HANDOFF-comprehensive-gate-fix-2026-05-11.md`
- Engagement process master: `practices/revops/ENGAGEMENT-PROCESS.md` (Phase C is where this work fits)
- Teknova segment definition: `accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`
- Modality taxonomy: `accounts/clients/teknova/artifacts/revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md`
- Sourcing rules (current): `accounts/clients/teknova/artifacts/revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md` (this gets a new section once canonical sources are wired)
- Existing skills: `practices/revops/skills/company-discovery/SKILL.md`, `practices/revops/skills/enrichment-providers/SKILL.md`

The session picking this up can read those for context but shouldn't try to absorb everything before starting. The design doc is the deliverable, not a comprehensive review.
