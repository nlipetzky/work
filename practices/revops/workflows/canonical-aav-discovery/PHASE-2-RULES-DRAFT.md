# Phase 2 Rules Draft — Review before Airtable writes

**Date:** 2026-05-12
**For:** Nick review. Mark anything wrong; nothing is sacred. On sign-off this populates the Airtable Classification Rules and Sources tables.

**Counts at a glance:**
- Classification Rules: 49 rows across 9 categories
- Sources: 5 rows
- Open flags: 5

---

## Flags requiring your call before insert

1. **Segment doc has 8 disqualifiers, not 9.** Plan said 9. Recounted, it's 8. Listing 8 below; tell me if I'm missing one.
2. **Top-20 pharma list isn't enumerated in any source doc.** I've proposed a list of 20 (below). Confirm or edit.
3. **Validation handoff Rules 3 and 4 are workflow rules, not classification rules.** Rule 3 (Therapeutic Modality vs Delivery Vehicle separation) and Rule 4 (Sponsor HQ enrichment) describe workflow behavior, not rule storage. NOT included in this draft. They'll live in workflow design docs.
4. **"Active" checkbox default:** all 49 rules ship Active=true unless flagged. The 3 removed Exa queries from the sourcing doc ship as Active=false rows for visibility.
5. **Modality doc edge case disqualifiers overlap with segment hard filters.** 3 of 5 modality edge cases are already encoded as segment hard filters. I'm capturing the 2 unique ones (all-preclinical, past-Phase-II-commercial) as disqualifier_segment. Confirm or push back.

---

## Classification Rules — by Category

### `vocabulary_filter` (1 row)

| Rule Name | Rule Value | Source Doc | Notes |
|---|---|---|---|
| disease_aav_collision_terms | (newline-delimited list, see below) | HANDOFF-aav-sourcing-workflow-validation | Triggers a need for positive vector evidence (Rule 2) before AAV-pass. Case-insensitive substring match against `conditionsModule.conditions`. |

Value:
```
ANCA-Associated Vasculitis
Anti-Neutrophil Cytoplasmic Antibody
Granulomatosis With Polyangiitis
Microscopic Polyangiitis
Eosinophilic Granulomatosis with Polyangiitis
AAV-Vasculitis
ANCA Vasculitis
```

---

### `vector_evidence` (3 rows — one per clause)

| Rule Name | Rule Value | Source Doc | Notes |
|---|---|---|---|
| clause_a_intervention_name | (regex/substring patterns, see below) | HANDOFF-validation Rule 2 | Match against `armsInterventionsModule.interventions[].name`. ANY of three patterns passes Clause A. |
| clause_b_gene_therapy_titled_trial | (JSON, see below) | HANDOFF-validation Rule 2 | Requires GENETIC/BIOLOGICAL intervention type + AAV-titled trial. |
| clause_c_canonical_indication_genetic | (JSON, see below) | HANDOFF-validation Rule 2 | Requires GENETIC intervention type + canonical AAV indication + disease-AAV filter did NOT trigger. |

Clause A value (JSON):
```json
{
  "regex": "\\b[rR]?AAV[0-9rhu]*\\b",
  "substring_case_insensitive": ["Adeno-Associated"],
  "co_occurrence": {
    "any_of": ["capsid", "serotype", "tropism", "transduction"],
    "with_any_of": ["vector"],
    "or_intervention_type_in": ["GENETIC", "BIOLOGICAL"]
  }
}
```

Clause B value (JSON):
```json
{
  "intervention_type_in": ["GENETIC", "BIOLOGICAL"],
  "and_title_contains_any": [
    "Adeno-Associated Virus",
    "AAV-mediated",
    "AAV Gene Transfer",
    "AAV vector"
  ],
  "title_fields": ["identificationModule.briefTitle", "identificationModule.officialTitle"]
}
```

Clause C value (JSON):
```json
{
  "intervention_type_in": ["GENETIC"],
  "and_conditions_in_indication_list": "canonical_aav_indications",
  "and_disease_aav_filter_did_not_trigger": true
}
```

---

### `indication_list` (1 row)

| Rule Name | Rule Value | Source Doc | Notes |
|---|---|---|---|
| canonical_aav_indications | (newline-delimited list, see below) | HANDOFF-validation Rule 2 Clause C | 28 terms (the doc shows 27 numbered but lists 28; recount). Used by vector_evidence Clause C. Expandable; new indications appended without code change. |

Value (28 terms):
```
Hemophilia A
Hemophilia B
Ornithine Transcarbamylase Deficiency
Wilson Disease
Glycogen Storage Disease Type Ia
Von Gierke
Duchenne Muscular Dystrophy
Friedreich's Ataxia
Gaucher Disease
Spinal Muscular Atrophy
Mucopolysaccharidosis (any subtype)
Sanfilippo Syndrome
Leber Congenital Amaurosis
Retinitis Pigmentosa
RPE65
Choroideremia
Pompe Disease
Aromatic L-amino acid decarboxylase (AADC) deficiency
Crigler-Najjar
Methylmalonic Acidemia
Phenylketonuria
Hunter Syndrome
Hurler Syndrome
Niemann-Pick
Arrhythmogenic Right Ventricular Cardiomyopathy
Hypertrophic Cardiomyopathy
Heart Failure
Angelman Syndrome
Congenital Adrenal Hyperplasia
```

---

### `modality_bucket` (16 rows)

One row per bucket. The bucket name is both Rule Name and Rule Value. Notes capture scope and downstream action.

| Rule Name | Rule Value | Notes |
|---|---|---|
| aav | AAV | In scope for this play. Multi-modality platforms pass on AAV signal alone. |
| lentiviral | Lentiviral | Out of scope this play. Re-route: reagent-readiness pitch, viral-vector framing without AAV-specifics. |
| other_viral_vector | Other viral vector | Out of scope. Includes adenovirus, herpes, vaccinia. Hold pool. |
| peptide_therapeutics | Peptide therapeutics | Out of scope. Re-route: tools provider / nextgen antibody play. |
| small_molecule | Small molecule | Out of scope. Hold, no current pitch. |
| rna_editing | RNA editing | Out of scope. Hold. |
| mrna_therapeutics | mRNA therapeutics | Out of scope. Hold, possible LNP-reagent angle later. |
| autologous_cell_therapy | Autologous cell therapy | Out of scope. Re-route: cell therapy reagent pitch. |
| allogeneic_cell_therapy | Allogeneic cell therapy | Out of scope. Re-route: cell therapy reagent pitch. |
| non_viral_delivery | Non-viral delivery | Out of scope. Includes LNP, electroporation. Hold. |
| antibody_biologic | Antibody / biologic | Out of scope. Hold. |
| crispr_non_viral | CRISPR / gene editing without viral delivery | Out of scope. Hold. |
| epigenetic_reprogramming | Epigenetic reprogramming | Out of scope. Hold. |
| vaccine | Vaccine | Out of scope. Hold. |
| diagnostic_research_tools | Diagnostic / research tools only | Out of scope. Archive, no fit. |
| other_freetext | Other | Free-text label captured for review. Manual triage. |

All 16 ship Active=true. Source: revops-modality-taxonomy.

---

### `reroute_map` (1 row, JSON)

| Rule Name | Rule Value | Source Doc | Notes |
|---|---|---|---|
| modality_to_alt_play_map | (JSON, see below) | revops-modality-taxonomy | When a company classifies as a non-AAV modality, this maps the modality to its alt-play pitch direction or hold status. |

Value:
```json
{
  "Lentiviral": "Reagent-readiness pitch, viral-vector framing without AAV-specifics",
  "Peptide therapeutics": "Tools provider / nextgen antibody play",
  "Small molecule": "Hold, no current pitch",
  "RNA editing": "Hold, no current pitch",
  "mRNA therapeutics": "Hold, possible LNP-reagent angle later",
  "Autologous cell therapy": "Cell therapy reagent pitch",
  "Allogeneic cell therapy": "Cell therapy reagent pitch",
  "Non-viral delivery": "Hold",
  "Antibody / biologic": "Hold",
  "CRISPR / gene editing (non-viral)": "Hold",
  "Epigenetic reprogramming": "Hold",
  "Vaccine": "Hold",
  "Diagnostic / research tools only": "Archive, no fit"
}
```

---

### `disqualifier_modality` (1 row)

Only one rule from the source docs that rejects from AAV classification specifically (not from outreach overall). The disease-AAV vocabulary filter triggers a need for vector evidence; this rule captures the outright reject when vector evidence fails.

| Rule Name | Rule Value | Source Doc | Notes |
|---|---|---|---|
| no_vector_evidence | `{"reject_reason": "no_vector_evidence", "trigger": "all three vector_evidence clauses failed"}` (JSON) | HANDOFF-validation Rule 2 | Applied by L2 gate. Record logged to ct_gov_false_positives audit table on reject. |

---

### `hard_filter` (7 rows, JSON)

| Rule Name | Rule Value | Source Doc | Notes |
|---|---|---|---|
| company_modality_active_aav | see JSON | segment doc | Company develops, manufactures, or contract-manufactures AAV gene therapies. Multi-vector CDMOs match only if AAV is named in services. |
| company_stage_preclinical_through_phase_ii | see JSON | segment doc | At least one program in preclinical / IND-enabling / Phase I / Phase II. |
| company_size_small_to_mid_or_aav_cdmo | see JSON | segment doc | Headcount <2000 AND not wholly-owned subsidiary of top-20 pharma. AAV CDMOs included regardless of headcount. |
| geography_us_or_canada | see JSON | segment doc | Company HQ OR contact primary work location in US/Canada. Sponsor HQ check (validation Rule 4) is the rigorous form. |
| contact_function_pd_mfg_cmc | see JSON | segment doc | Title pattern OR role responsibilities OR CSO at <200-person company. |
| contact_seniority_director_through_svp | see JSON | segment doc | Director through SVP. VP cap at companies >500 employees that aren't pure CDMOs. |
| contact_company_alignment | see JSON | segment doc | Current LinkedIn-listed employer = the AAV company being targeted. Past AAV experience alone fails. |

Rule Value JSON template (per rule):
```json
{
  "type": "firmographic" | "demographic",
  "match_logic": "<plain-language description from doc>",
  "verification_sources": ["website", "linkedin", "10-K", "pipeline_page", "..."],
  "exceptions": "<optional exceptions encoded here>"
}
```

(Full JSON for each rule produced at insert time; the template captures the structure. If you want me to expand each before insert, say so.)

---

### `soft_signal` (7 rows, JSON, with Weight)

| Rule Name | Rule Value | Weight | Source Doc | Notes |
|---|---|---|---|---|
| recent_funding_round | `{"signal": "Series A+ funding, IPO, or major strategic investment in last 45 days", "detection": "press release / Crunchbase / news"}` | 3 | segment doc | Highest-confidence "can buy" signal. Doc weight "high" → 3. |
| recent_ind_or_clinical_advance | `{"signal": "CT.gov registration, IND announcement, or stage-progression press release in last 60 days"}` | 3 | segment doc | The 60-120-day window is the offer's tightest fit. Doc weight "high" → 3. |
| pd_or_cmc_leadership_hire | `{"signal": "Posted opening for or hire of PD/mfg/vector-production/CMC leadership in last 60 days"}` | 3 | segment doc | Proxy for capacity intent. Not a contact target itself. Doc weight "high" → 3. |
| recent_conference_attendance | `{"signal": "Contact or company on published attendee/speaker/sponsor list of relevant event in last 90 days", "events": ["Interphex", "BPI West", "Advanced Therapies Week"]}` | 2 | segment doc | Useful for sequencing copy, not primary qualifier. Doc weight "medium" → 2. |
| recent_aav_publication_or_talk | `{"signal": "Contact authored/co-authored paper, poster, talk, or webinar on AAV upstream/downstream/purification/formulation/analytics in last 12 months"}` | 2 | segment doc | Strong proxy for budget intent and decision influence. Doc weight "medium" → 2. |
| tenure_in_role_over_12_months | `{"signal": "Contact start date in current role >12 months ago"}` | 2 | segment doc | Freshness/stability proxy. Hedge against stale data. Doc weight "medium" → 2. |
| pipeline_therapeutic_area_named | `{"signal": "Lead AAV program targets a specific named indication", "use": "personalization, not qualification"}` | 1 | segment doc | Cleaner anchor for opening copy. Doc weight "low" → 1. |

Weight scale: high=3, medium=2, low=1. Default scale per Clay/HubSpot convention. Tunable.

---

### `disqualifier_segment` (10 rows)

8 from segment doc + 2 unique-to-modality-doc edge cases.

| Rule Name | Rule Value | Source Doc | Notes |
|---|---|---|---|
| active_bd_engagement_last_6_months | `{"signal": "Logged BD meeting OR scheduled meeting OR participant/CC on active sales thread in last 6 months at same domain"}` | segment doc | Ellie's "Rocket rule." Lapsed accounts (>2y no activity) NOT disqualified. |
| concurrent_active_cadence | `{"signal": "Contact presently sequenced in any other active Teknova cadence"}` | segment doc | Prevents cross-tagging spam. Historical enrollment OK; concurrent not. |
| stale_or_inactive_employment | `{"signal": "End date on current role OR open-to-work badge OR retiring/retired OR most-recent role change >6mo ago without confirmed new employer"}` | segment doc | Hard remove, not maybe. |
| acquired_or_operationally_abandoned | `{"signal": "Domain redirects to parent/acquirer OR LinkedIn marked 'no longer active' OR publicly ceased operations OR leadership departed for named acquirer"}` | segment doc | Auto-suppress pending manual confirmation. Examples: Astellas Gene Therapies, Audentes, AveXis, Aavantibio. |
| patient_facing_clinical_role | `{"signal": "Title or responsibilities include direct patient care, trial coordination on patient side, nursing"}` | segment doc | "If it says patients anywhere... they're not making the sauce." |
| excluded_function | `{"signal": "Primary function is one of: Legal, Sales, Talent Acquisition, Marketing, IT, Finance, Regulatory, Program Management, QC"}` | segment doc | Regulatory explicitly banned. Mirrors engagement-wide CLAUDE.md exclusions. |
| out_of_scope_industry_background | `{"signal": "Career history primarily in agronomy, ag science, plant biology, or vet work without documented pivot into human cell/gene therapy"}` | segment doc | Surface via shared keyword matches but cannot consume offer. |
| disqualifying_email_status | `{"signal": "Email status is hard-bounced, do-not-contact, or opt-out"}` | segment doc | Cannot enter cadence regardless of fit. |
| all_programs_preclinical_no_clinical_track | `{"signal": "All programs are pre-clinical discovery, no clinical track of any kind"}` | modality doc edge cases | Tighter than the stage hard filter. No window for IND-anchored pitch. |
| all_programs_past_phase_ii_commercial | `{"signal": "All programs past Phase II at commercial scale"}` | modality doc edge cases | Different conversation, different products. |

Note: 3 modality-doc edge cases (top-20 pharma subsidiary, EU/APAC HQ, headcount >2000 non-CDMO) are already encoded as segment hard filters. Not duplicated here.

Top-20 pharma reference list (proposed, for the company_size hard filter's subsidiary check):
```
Pfizer
Roche
Johnson & Johnson
Novartis
Merck & Co
AbbVie
Sanofi
AstraZeneca
GlaxoSmithKline
Eli Lilly
Bristol-Myers Squibb
Bayer
Amgen
Gilead
Takeda
Boehringer Ingelheim
Novo Nordisk
Astellas
Daiichi Sankyo
Otsuka
```

Confirm or edit. This list informs subsidiary detection (AveXis → Novartis, Audentes → Astellas, AskBio → Bayer, Spark → Roche, etc.).

---

## Sources table (5 rows)

| Source Name | Source Type | Endpoint | Auth Method | Query String | Trust Rank | Auto-Add Threshold | Refresh Cadence | Active | Notes |
|---|---|---|---|---|---|---|---|---|---|
| clinicaltrials_gov | api | https://clinicaltrials.gov/api/v2/studies | none | query.intr=AAV (interventional) | 5 | 0.9 | weekly | true | Highest-trust regulatory source. Five-rule validation chain applied (vocabulary_filter, vector_evidence, modality-vs-delivery split, sponsor HQ enrichment, dedupe). |
| company_website | scrape | (per-target URL) | none | n/a (manual or scraped) | 5 | 1.0 | manual | true | Highest trust for modality classification. Pipeline / About / platform pages. Scrape technology, pipeline, platform — not just root. |
| exa | api | https://api.exa.ai/search | api_key | (see active queries below) | 3 | 0.5 | monthly | true | Medium trust. Surface candidates, verify on website. |
| perplexity | api | https://api.perplexity.ai | api_key | (see active queries below) | 3 | 0.5 | monthly | true | Medium trust. Same posture as Exa. |
| explorium | api | (explorium endpoint) | api_key | (no standalone industry-tag pulls) | 1 | n/a | manual | true | Verification only. Never sole source. "Gene therapy" tag too noisy. |

Active query strings (Exa, Perplexity):
- "AAV vector capsid engineering"
- "AAV gene therapy clinical pipeline"
- "AAV gene therapy IND filing"

Constraint: any query must include literal "AAV" plus at least one of: capsid, serotype, vector, transduction, viral delivery.

Removed queries (ship as Active=false rows for audit):
- "AAV gene therapy companies" (Exa) — too broad
- "viral vector manufacturing" (Exa) — surfaced lentiviral
- "gene therapy CDMO" (Exa) — surfaced multi-modality CDMOs without AAV
- "gene therapy" Explorium industry tag — surfaced peptide and small-molecule biotechs

Question: should removed queries live in Sources (as Active=false) or in a separate "Deprecated Queries" notes field? Putting them in Sources keeps the audit trail in one place; flag if you want them elsewhere.

---

## Summary

- **49 Classification Rules rows** across 9 categories
- **5 Sources rows** + 4 removed-query rows for audit trail
- **5 open flags** at the top requiring your call
- **2 source-doc rules NOT included** (Therapeutic Modality vs Delivery Vehicle separation, Sponsor HQ enrichment) — these are workflow design, not classification rules

On your sign-off:
1. Create Sources table in Airtable Teknova Outreach base
2. Batch-insert all rows via Airtable MCP
3. Update DESIGN.md to reflect two-table split
4. Move to Phase 3 (refactor CT.gov workflow into pure L1 capture)
