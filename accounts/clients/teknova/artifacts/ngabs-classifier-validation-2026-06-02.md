# ngAbs Classifier Validation -- 2026-06-02 export

**Export:** `Biotech-Therapeutics-Antibody-Default-view-export-1780422595942.csv` (420 rows, 33 cols)
**vs. prior export 1780421260989:** +1 column (`Lab & Process Job Openings`), +4 upserts (6 -> 10), no new classifier verdicts.

## What's correct

- All 4 "no" verdicts are right: Recursion (AI/computational), BlueRock (cell therapy), Allogene (cell therapy), PSC Biotech (consulting services). The classifier is filtering non-antibody and non-wet-lab orgs the way the playbook says to.
- 10 confirmed qualified rows (yes + high confidence + NA address): Piramal, FUJIFILM Biotech, AGC, FUJIFILM Diosynth, Curia, Seagen, Hovione, PCI Pharma, Exelixis, Summit.
- Evidence/verdict pairing is honest. Each "yes" carries a citable evidence quote with role and modality.
- 14 of 15 verdicts are high-confidence. Only Insilico is "unclear / medium."

## What needs a call before bulk-running

### 1. Two job-posting columns now exist with the same intent

`Mfg & Process Job Openings` (original) and `Lab & Process Job Openings` (new). They disagree on real companies:

| Company | Mfg | Lab |
|---|---|---|
| FUJIFILM Biotech | 10 | 10 |
| AGC Biologics | 8 | 0 |
| Curia | 0 | 0 |
| Seagen | 0 | 0 |
| Hovione | 0 | 0 |
| PCI Pharma | 2 | 3 |

Question: are these meant to be two filters (mfg-suite roles vs. lab/PD roles), or is `Lab & Process` a rename in progress? If two filters, the lab column is missing real coverage at AGC (1,000+ employee biologics CDMO with zero lab postings is wrong).

### 2. Several "yes" rows return zero job openings from both columns

Seagen, Curia, Hovione, Piramal -- all multi-site real CDMOs or large developers. Zero jobs is almost certainly a sourcing problem, not reality. Likely causes:
- Domain-matching: Seagen is now part of Pfizer, the ATS may be on `pfizer.com` not `seagen.com`
- Job-API coverage: some ATSs (Workday, Greenhouse, etc.) get indexed; others don't

This is the column that the **Gap 1 wet-lab verification** depends on. If job postings under-report on real CDMOs, the wet-lab proxy is unreliable. Worth testing on 5 known-good companies before trusting it.

### 3. The most-recently-classified rows missed downstream enrichment

Recursion, BlueRock, Allogene, Exelixis, Summit -- all have a classifier verdict, but blank job columns AND blank Airtable upsert. Either auto-run is off downstream, or the rows haven't been re-triggered. Worth confirming auto-run settings on:
- `Mfg & Process Job Openings`
- `Lab & Process Job Openings`
- `Upsert Company Record`

### 4. Insilico Medicine = unclear / medium (only non-high verdict in 15)

Insilico is a textbook playbook exclusion: pure computational/AI shop. The classifier said "unclear" rather than "no." Two ways to read this:
- The prompt is being too cautious on AI/computational companies. Tighten with: "If the company's antibody work is exclusively in-silico / AI-prediction with no internal wet-lab discovery, return no."
- Or: leave the prompt alone and trust the wet-lab gate (Gap 1 fix) to catch it. Insilico's wet-lab footprint in NA is minimal -- the job-posting signal would surface this.

Either is defensible. Pick before the wet-lab column is finalized.

### 5. Hovione = yes on antibody fragments only

The playbook (Section 2.4) puts antibody fragments under "adjacent ngAbs formats" -- qualified but lower priority than bispecifics / multispecifics / ADCs. The current `Has ngAbs Program = yes` doesn't carry that priority distinction. Worth adding a `ngAbs Priority` column (high / qualified) or pushing the distinction into the existing column as `yes-high / yes-adjacent`.

## Recommended before running on remaining ~405 rows

1. Decide what `Lab & Process Job Openings` is vs. `Mfg & Process Job Openings`. Either rename + delete the old, or document both filters precisely.
2. Test the job-postings column on 5 known-good companies (Seagen, Genentech, Regeneron, Lilly, BMS). If you don't get postings from these, the API/source is the bottleneck, not the prompt.
3. Re-trigger the 5 rows missing downstream enrichment, confirm auto-run is on for all post-classifier columns.
4. Decide on Insilico question (tighten the prompt vs. trust the wet-lab gate).
5. Decide on priority distinction for fragment-only vs. bispecific/ADC.

Then bulk-run. Cost is small ($5ish in credits); the value of pre-validation is avoiding 405 rows of bad data that the team has to manually re-review.
