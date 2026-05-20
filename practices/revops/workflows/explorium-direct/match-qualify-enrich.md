# Match → qualify → enrich workflow (play006: Teknova AAV / Ellie outreach)

**Play:** aav-gene-therapy-ellie-outreach
**Segment artifact:** [accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md](../../../../accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md)
**Pattern reference:** [practices/revops/skills/enrichment-providers/references/explorium-match-qualify-enrich.md](../../skills/enrichment-providers/references/explorium-match-qualify-enrich.md)
**Taxonomy reference:** [reference/explorium-biotech-taxonomy.md](reference/explorium-biotech-taxonomy.md)
**Deployed gate:** n8n workflow `Z6RROKx5omdfvhtn` (Companies Enrichment, Explorium → Airtable). 30 nodes.
**Gate version:** `1.6.0`

This file is the play-specific instantiation of the generic match → qualify → enrich pattern. It reflects the deployed state of workflow `Z6RROKx5omdfvhtn` as of 2026-05-11.

## Outcome buckets

The gate routes every record into one of five `Enrichment Status` values, written to the `Companies` table in the Teknova Outreach Airtable base (`appYBYH3aOHhTODAw / tblnj3YlOI3thjrXp`):

| Status | Meaning |
|---|---|
| `enrichment_complete` | AAV modality confirmed. Deep-enriched. Ready for cadence. |
| `rerouted_wrong_modality` | Biotech but wrong modality (peptide, small molecule, autologous cell, etc.) OR no modality signal at all. Available for alt-play pools. |
| `needs_aav_review` | Gene-therapy-branded but no AAV/capsid/vector vocabulary in fetched content. Likely an AAV biotech that doesn't name the modality publicly. Manual confirmation queue. |
| `needs_data_quality_review` | Domain points to a known parent-company / tools-vendor (Thermo Fisher, Lonza, Catalent, Charles River, Merck Millipore, Sartorius, Cytiva). The record's Domain field needs manual correction. |
| `archived_out_of_industry` | Failed Gate 1 (wrong NAICS, out-of-NA geography, or no biotech signal), OR failed match with no AAV signal recoverable from the web. |

All five outcomes write the same 16-field classification record (Modality, Modality Source, Modality Confidence, Detected Keywords, Classification Run ID, Gate Version, Classification Notes, plus full firmographics where Explorium had data).

## Flow

```
Run Enrichment trigger
  → Get Unenriched Companies (Airtable search)
  → Loop Over Companies (batchSize: 1)
      → Prepare for Match (Code)
      → Match Business (Explorium match)
      → IF Match Found?
          true:
            → Enrich Firmographics Only (Explorium enrich, firmographics)
            → Qualify Company (Code: Gate 1 — NAICS prefix + biotech keywords + NA geography)
            → IF Biotech?
                true:
                  → Build URLs Matched (Code: emit 6 paths per company)
                  → Fetch Pages Matched (HTTP Request, runs 6x per company)
                  → Check AAV Modality (Code: parent-domain check, then keyword scan)
                  → IF AAV?
                      true:  → Enrich Deep (16 enrichment types) → Map Enriched → Update Airtable
                      false: → Map Reroute → Update Airtable (status = _finalRouting)
                false:
                  → Map Archive → Update Airtable (archived_out_of_industry)
          false:
            → IF Has Domain?
                true:
                  → Build Unmatched Context (Code)
                  → Build URLs Unmatched (Code: emit 6 paths)
                  → Fetch Pages Unmatched (HTTP Request)
                  → Check AAV Unmatched (Code)
                  → IF AAV Unmatched?
                      true:  → Map Pass Unmatched → Update Airtable (enrichment_complete)
                      false: → Map Archive No AAV Unmatched → Update Airtable (status = _finalRouting)
                false:
                  → Map Archive No Domain → Update Airtable (archived_out_of_industry)
```

The matched and unmatched-web paths both fan-out → fetch → consolidate via `$input.all()` in the Check AAV node, so 6 URL fetches per company merge into a single AAV evaluation.

## Gate 1: industry / NAICS / geography (matched path only)

Uses `linkedin_category` and `naics_code` from `enrich-business` firmographics. Taxonomy values are locked in [reference/explorium-biotech-taxonomy.md](reference/explorium-biotech-taxonomy.md).

- **NAICS prefixes (any match):** `325414, 325413, 325411, 541714, 3254`
- **Biotech keywords (any match against `naics_description`):** `biotech, biolog, gene, pharma, biopharma, biopharmaceutical, life science`
- **Geography:** `country_name` must include one of `united states, us, usa, canada, ca`

Pass = (NAICS prefix match OR biotech keyword match) AND in-NA. Fail → archive with `modality = out_of_industry | geography_mismatch`.

## Gate 2: AAV modality verification

Fetches 6 URLs per company (homepage + `/pipeline` + `/platform` + `/science` + `/technology` + `/about`), strips `<script>`/`<style>`/comments, concatenates, slices to 80,000 chars lowercased.

### Parent-company domain short-circuit

If `cleanDomain` matches a parent-company / tools-vendor domain (`thermofisher.com, lonza.com, catalent.com, charlesriver.com, merckmillipore.com, sartorius.com, cytiva.com`), route immediately to `needs_data_quality_review` with `modality = parent_company_domain`. Skip the keyword scan. The Domain field is likely wrong at source.

### Keyword sets

- **AAV anchors:** `aav, adeno-associated virus, adeno-associated viral`
- **Vector mechanism:** `vector, capsid, transduction, viral delivery, serotype`
- **Exclusion tokens** (paired with at least one context word: `therapeutic, therapeutics, pipeline, drug, platform, program, candidate, medicine`):
  - `lentiviral`: `lentiviral, lentivirus`
  - `peptide`: `peptide`
  - `small_molecule`: `small molecule`
  - `rna_editing`: `rna editing, mrna therap, sirna, crispr, base editing, prime editing`
  - `autologous_cell`: `autologous cell, car-t, car t-cell, ipsc`
  - `non_viral`: `non-viral delivery, lipid nanoparticle, lnp , ctdna`
- **Gene-therapy review trigger phrases (any match):** `gene therapy, gene therapies, genetic medicines, genetic medicine, cell and gene therap, gene and biologic therap, gene-to-cell, cell-and-gene`

### Decision tree

```
isAAV = (anchor present AND mechanism present)
     OR (anchor count ≥ 2 OR aav-regex count ≥ 3)
     AND NOT detectedExclusion

isGeneTherapyBranded = NOT isAAV AND any gene-therapy phrase matches

if detectedExclusion == 'autologous_cell' AND isGeneTherapyBranded:
    clear the exclusion (override — gene therapy framing wins over CAR-T mention)

if isParentCompanyDomain:        → needs_data_quality_review
elif no web content:             → rerouted_wrong_modality (unknown, web_fetch:no_content)
elif isAAV:                      → enrichment_complete (modality=aav, confidence=high)
elif detectedExclusion:          → rerouted_wrong_modality (modality=<exclusion>, confidence=medium)
elif isGeneTherapyBranded:       → needs_aav_review (modality=gene_therapy_unspecified_vector)
else:                            → rerouted_wrong_modality (modality=unknown)
```

The unmatched-web path is identical except `Gate 1` is skipped (no firmographics), `enrichment_complete` modality is recovered via web fetch alone, and unknown/exclusion outcomes route to `archived_out_of_industry` (not reroute) since there's no Explorium business_id to deep-enrich anyway.

## Airtable schema

The `Companies` table (`tblnj3YlOI3thjrXp`) has these gate-managed fields:

| Field | Type | Purpose |
|---|---|---|
| `Enrichment Status` | singleSelect | The outcome bucket (5 values) |
| `Modality` | text | Detected primary modality |
| `Modality Source` | text | Provenance — `<tool>:<sub_signal>` |
| `Modality Confidence` | text | `high / medium / low` |
| `Detected Keywords` | text (JSON array) | Literal strings matched |
| `Classification Run ID` | text | Unique per gate execution |
| `Gate Version` | text | Semver — currently `1.6.0` |
| `Classification Notes` | multilineText | Structured prose narrative for human audit |
| `HQ City`, `HQ State`, `Country` | text | Explorium firmographics |
| `Industry`, `NAICS Code` | text | Explorium firmographics |
| `Employee Range`, `Revenue Range` | text | Explorium firmographics |
| `Company LinkedIn URL` | text | Explorium firmographics |
| `Explorium Business ID` | text | For follow-on enrichment |
| `Last Enriched At` | dateTime | When the gate last touched this record |

The `Enrichment Status` singleSelect auto-accepts new values via Airtable `typecast: true`.

## Classification Notes format

Structured prose, Ellie-readable. Example for a pass:

```
2026-05-11T22:48:18.679Z | Gate v1.6.0
Outcome: pass_aav_confirmed

Match: matched
  - Explorium business_id: 9c3508e704aa16945cf79b05af57848c
  - NAICS: 325412 (Pharmaceutical Preparation Manufacturing)
  - Industry: Pharmaceutical Preparation Manufacturing

Gate 1 (industry filter): pass
  - Reason: naics_match

Gate 2 (modality fetch): pass (6 of 6 URLs returned content)
  - URLs hit: https://sangamo.com, .../pipeline, .../platform, .../science, .../technology, .../about
  - Combined content length: 341562 chars
  - AAV anchor matches: 2 (aav, adeno-associated viral)
  - AAV literal regex count: 1
  - Mechanism keywords: 1 (vector)
  - Exclusion keywords: 0 (none)
  - Gene therapy branded: false
  - Detected modality: aav
  - Confidence: high

Final routing: enrichment_complete
```

For `needs_aav_review` and `needs_data_quality_review`, an additional `Reason:` line follows `Final routing:` explaining what the human reviewer should check.

## Verification record sets

Used during gate development. Each retest a record under a new gate version, blank `Enrichment Status` and `Modality Source` to put it back in the filter pool.

| Company | Domain | Record ID | Expected outcome | Tests |
|---|---|---|---|---|
| REGENXBIO Inc | regenxbio.com | recT5jjJIHJi5cnHz | `enrichment_complete` | Happy path, matched flow |
| Voyager Therapeutics | voyagertherapeutics.com | recITaZ11Ot0ztV90 | `enrichment_complete` | Happy path, matched flow |
| Sangamo Therapeutics | sangamo.com | (varies, found in 67117 batch) | `enrichment_complete` | Matched flow, strong AAV signal |
| Taysha | tayshagtx.com | rec7Ezbz6b5vXyD1W | `needs_aav_review` | Gene-therapy branded, no AAV terms |
| Microgenics (Thermo Fisher subsidiary) | thermofisher.com | (varies) | `needs_data_quality_review` | Parent-company domain detection |
| Renovacor Inc | renovacor.com | rec3Ag2aaTNHzTpX8 | `rerouted_wrong_modality` (honest miss) | Parked domain after acquisition |
| Enveda Biosciences | envedabio.com | rec5srBZ9JMBxXuKf | `archived_out_of_industry` | Small-molecule company, unmatched-web archive |
| Altimmune | altimmune.com | rec6Ki6VQ3E2kNqXT | `rerouted_wrong_modality` | Peptide modality detection |

## Production observations (2026-05-11)

50-record sample run (execution 67124) against the play006 source list returned:

- `archived_out_of_industry`: 26 (52%) — Gate 1 fails, mostly wrong NAICS or non-NA geography
- `rerouted_wrong_modality`: 20 (40%) — biotechs with peptide / small molecule / autologous cell / rna editing modalities
- `needs_aav_review`: 2 (4%) — gene-therapy branded, no AAV terms
- `needs_data_quality_review`: 1 (2%) — domain pointed to a parent-company tools vendor
- `enrichment_complete`: 1 (2%) — Sangamo Therapeutics

**The 2% pass rate signals a sourcing problem, not a gate problem.** The play006 source list (assembled via Exa semantic search + Explorium broad tag match + Perplexity) is heavily contaminated with adjacent-modality biotechs and non-AAV companies. The gate correctly classifies them; expanding the gate to "loosen" AAV detection further would just route non-AAV companies into the pass bucket.

The right next move is a different sourcing workflow targeting AAV-specific surfaces (clinicaltrials.gov AAV registrations, IND announcements with AAV vector mentions, AAV consortium membership lists, conference attendee lists for AAV-specific events) rather than further gate tuning.

## Known gate limitations

- **JS-rendered SPAs:** When a company's site is a SPA shell that loads content client-side, the static HTML fetch returns navigation/marketing copy without technical modality terms. Multi-URL fetching helps when subpaths have differing static HTML, but for true SPAs all 6 paths return the same shell. Mitigation today: such records land in `needs_aav_review` if any gene-therapy phrase is present, otherwise `unknown`. A Playwright/Puppeteer rendered-fetch step would fix this but isn't deployed.
- **Acquired / parked domains:** Renovacor (acquired by Rocket Pharma) and similar return Flywheel/Squarespace placeholder pages. The fetch succeeds but contains no real content. Gate honestly reports the miss. The segment artifact has a separate acquired-subsidiary disqualifier intended to catch these upstream.
- **Stale Airtable domains:** Some records carry parent-company or rebranded-entity domains (e.g. Intrexon → `dna.com` but actually Precigen). The parent-company list catches the seven biggest tools vendors; other stale domains will hit unknown/no-content outcomes.

## Cost notes

- Match Business: free
- Enrich Firmographics Only: 1 credit per match
- Enrich Deep: ~5 credits per match (technographics + 15 other enrichment types)
- HTTP fetches: free (n8n cloud bandwidth)
- Airtable updates: API rate-limited but well within free-tier limits at 50-record batches

Per-record run time observed: ~3.2s including 6 parallel URL fetches and Explorium round-trips. 50 records = 2m38s. Full 553 records projected: ~30 minutes if continuous.

## What this workflow does not handle

- **Sourcing.** The gate qualifies an input list; it doesn't produce one. Garbage in, garbage rerouted.
- **JS-rendered content** (see limitations).
- **Active BD engagement disqualifier.** Runs later in the cadence pipeline against contact-level Salesforce data.
- **Per-contact qualification** (function, seniority). Contact-level, downstream of this gate.
- **Soft-signal scoring** (funding rounds, IND filings, hires). Applied during contact handoff to cadence.

## Operating the gate

To re-run records under the current gate version:

1. Blank `Enrichment Status` and `Modality Source` on the records you want to re-process.
2. Trigger workflow `Z6RROKx5omdfvhtn` manually via n8n UI or `execute_workflow` MCP call.
3. The filter `AND({Enrichment Status} = '', {Domain} != '')` picks up flushed records; `limit: 50` caps each run.

To run a targeted verification set, switch the filter temporarily to `OR(RECORD_ID()='...', ...)` and `returnAll: true`. Restore the production filter after.

To extend the gate (new exclusion modality, new review trigger, new parent-domain), edit the matching constants in `Check AAV Modality` AND `Check AAV Unmatched` (the logic is duplicated across both paths), bump `gateVersion`, redeploy.
