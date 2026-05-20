# PLAY-006 — Next sessions pickup list

**Date:** 2026-05-07
**Status of PLAY-006:** 53 contacts marked `cadence_ready`. 50 companies in play, 44 active, 33 surviving (modality_confirmed + active + not disqualified). Shipped per Nick directive 2026-05-07.

This file is the canonical pickup list for the work that comes after the ship. Items are ordered by leverage and dependency, not urgency. Pick the top item that's unblocked.

---

## 1. Full company discovery

**Goal:** find the rest of the AAV gene therapy TAM. The Perplexity pass on 2026-05-07 surfaced 4 valid additions (LEXEO, Atsena, Passage Bio, Ambulero — plus MeiraGTx rejected on geo). The actual US/CA TAM is likely 2-3× the current 50-company list.

**Skill to use:** the `company-discovery` skill (run it properly per its own procedure, not the ad-hoc Perplexity pass).

**Required sources, all in parallel:**
1. **Clay company search** — query for AAV gene therapy companies via `find-and-enrich-company` (`mcp__278a87c2-...__find-and-enrich-company`) by industry keyword + geography. Use Clay Audiences if Teknova has the segment seeded there.
2. **Exa semantic search** — query against pipeline pages, press releases, and "company description" fields for AAV-platform language. Free, web-grounded.
3. **clinicaltrials.gov sponsor list** — pull all active studies with `intervention contains AAV`, then dedupe sponsors. This is the most authoritative source since registration is required for human trials.
4. **Crunchbase funding search** — funding-event-driven discovery for companies that raised capital with AAV in their description.

**Filters to apply per candidate (segment criteria):**
- Country: US or CA only.
- Headcount: <2,000 AND not a wholly-owned subsidiary of a top-20 global pharma.
- Modality: AAV explicitly named in the company's own published materials. Not generic "gene therapy."
- Stage: at least one program in preclinical / IND-enabling / Phase 1 / Phase 1/2 / Phase 2. Phase 3+ at commercial scale fails.

**Anti-patterns surfaced 2026-05-07 to dedupe against:** see `clients/teknova/sources/notebooklm-segment-criteria-aav-ellie-2026-05-07.md` (named accounts to avoid section). Also exclude every company already in the 50-row PLAY-006 set (see Supabase `play_company_membership` for `PLAY-006`).

**Output:** new rows inserted to `companies` and added to `play_company_membership`. Per-row `modality_source` populated with the URL or citation that proved AAV.

**Highest-leverage action of the four follow-ups.** A larger company universe expands every downstream metric — sourcing targets, signal fill candidates, eventual cadence size.

---

## 2. Why-now signal fill

**Goal:** populate the 5 signal text fields per the enrichment spec for all 44 active companies. Currently 3 of 44 have any signal; 41 are at 0. Score median is 6.0 with cap at 10. Filling the why-now signals lifts company scores into a 7-15 band and contact scores into the 10-18 band, which is the actual personalization fuel for Ellie's send.

**Spec source:** `clients/teknova/artifacts/revops-enrichment-spec-aav-gene-therapy-ellie-outreach.md`, section "Why-now signal fields."

**Five fields per company, free sources:**
- `funding_event` — Crunchbase + Google News (last 45 days)
- `ind_or_stage_advance` — clinicaltrials.gov + press releases (last 60 days)
- `leadership_hire` — LinkedIn company page recent hires + open job postings (last 60 days)
- `conference_presence` — Interphex / BPI West / Advanced Therapies Week attendee/speaker lists (last 90 days)
- `recent_publication` — PubMed + Google Scholar on AAV process / manufacturing / purification / formulation (last 12 months)

**Operational notes from 2026-05-07 attempt:**
- Perplexity research mode declined to ground in current web data. Use perplexity_search (web-grounded) or perplexity_ask with sharp prompts instead.
- Batched per-signal queries across all 44 companies works better than per-company-all-signals.
- Most signals will legitimately come back blank. Blank is correct per spec.
- After fill, also set the corresponding signal booleans (`signal_hiring`, `signal_ind_filing`, `signal_conference`, `signal_publication`, `signal_clinical_stage_advance`) based on whether the text field is populated.

**After fill: recompute company_score and contact_score across the play. The recompute SQL is in `clients/teknova/artifacts/revops-companies-migration-2026-05-07.sql` (scoring section was added in the `scores_columns` migration; the formula lives in the enrichment spec section "Scoring").**

---

## 3. Contact sourcing

**Goal:** add new contacts at the 16 surviving zero-contact companies (which now includes the 4 new companies from Discovery if Discovery hasn't expanded the universe further).

**Per-company target:** 4-5 new contacts each, capped at 3-5 per company per the engagement CLAUDE.md rule.

**Title patterns (segment criteria, primary):** viral vector, downstream processing, purification, process development, vector manufacturing, gene therapy manufacturing, CMC.

**Title patterns (secondary, only at companies <200 employees):** chief scientific officer, CSO, head of manufacturing, head of process development, VP manufacturing, director of manufacturing, director of process development.

**Function classifications (per spec):** the contact must map to `process_dev | manufacturing | cmc | cso`.

**Hard exclusions per spec:**
- Already-disqualified contact list — do not re-source the same people. Check `contacts.enrichment_status='disqualified'` filter.
- Excluded title keywords: Legal, Sales, Talent Acquisition, Marketing, IT, Finance, Regulatory (non-CMC), Program Management, QC.
- Patient-facing clinical roles.
- Agronomy / agriculture / plant science backgrounds.
- US/CA only.

**Sourcing channel decision (open):**
- Clay MCP `find-and-enrich-contacts-at-company` returned mixed-quality data on the 2026-05-07 sample (1-2 valid contacts per thin biotech, lots of stale records). Worth retrying with cleaner filter setup.
- Ellie's manual Clay UI sourcing has been the operational baseline per the Teknova notebook. Higher quality but human-rate-limited.
- Apollo is exhausted. Explorium has 1,703 credits (verified 2026-05-07). Check current balance before using.
- LinkedIn Sales Navigator export by title pattern is a viable batch path if budget allows.

**Validation gate per new contact (run before INSERT):** spec checks 3, 4, 7 first — `current_employer_match`, `role_status=active`, `linkedin_url` verified to actual LinkedIn profile of the named person. Then email find via Hunter. Then full 9-check gate.

**Insert path:** `contacts` row + `play_contact_membership` row. Use engine_account_id `00000000-0000-0000-0000-000000000001` and account_id `00000000-0000-0000-0000-000000000010`.

---

## Reference state (as of 2026-05-07 ship)

| Metric | Value |
|---|---:|
| Cadence-ready contacts | 53 |
| Companies in play | 50 |
| Companies active | 44 |
| Companies surviving (modality_confirmed + active + not disqualified) | 33 |
| Active companies with 0 cadence-ready contacts | 16 |
| Company score | min 0, median 6.0, max 10 |
| Contact score | min 6, median 9.0, max 14, >10: 10 contacts (18.9%) |

Inventory snapshot also persisted to `plays.acceptance_criteria.inventory_state_2026_05_07` for in-database reference. Segment cached counts refreshed on `icp_segments.gene_therapy_aav` (counts_refreshed_at = 2026-05-07).
