# Explorium match → qualify → enrich pattern

The generic pattern for the first step of any Explorium-backed enrichment workflow. A multi-stage qualify gate that runs BEFORE deep enrich, so credits are never spent on companies that don't fit the play.

Source-agnostic. For a specific play's instantiation, see the workflow spec at `practices/revops/workflows/explorium-direct/match-qualify-enrich.md` (currently play006: Teknova AAV).

## When to use this pattern

Use this as the first step of any workflow that will run deep enrich (`fetch-prospects`, `enrich-prospects`, Hunter email-finder, Apify profile scraping) on a company list. The gate's job is to triage inputs before any per-contact spend.

Skip this pattern only if the input list is already a hand-curated, modality-verified set. Even then, prefer running the gate to capture classification provenance.

## Outcome buckets

The deployed gate (v1.6.0) routes every record into one of five `Enrichment Status` values. The bucket set was refined empirically — earlier versions had three buckets (pass / reroute / archive), which conflated true negatives with cases where the gate genuinely couldn't tell.

| Status | Meaning | Downstream |
|---|---|---|
| `enrichment_complete` | Play-required modality confirmed. Deep-enriched. | Cadence |
| `rerouted_wrong_modality` | Biotech but wrong modality, OR no modality signal at all. | Alt-play pool, no deep-enrich spend |
| `needs_<play>_review` | Branded as the play's domain (e.g. "gene therapy") but the specific modality term isn't in the fetched content. Likely a real fit that doesn't name the modality publicly. | Manual confirmation queue |
| `needs_data_quality_review` | Domain points to a known parent-company / tools-vendor. The record's Domain field is likely wrong. | Manual correction queue |
| `archived_out_of_industry` | Failed Gate 1 (wrong NAICS, wrong geography, no biotech signal) OR unmatched + no modality signal recoverable from web. | Archive, no further work |

All five outcomes write the same classification record (Modality, Modality Source, Modality Confidence, Detected Keywords, Classification Run ID, Gate Version, Classification Notes, plus full firmographics where available).

## The architecture

```
Match (Explorium)
  → IF business_id present?
      true: Enrich Firmographics → Qualify (Gate 1) → IF biotech?
              true:  Multi-URL Fetch → Check Modality (Gate 2) → IF play-modality? → Deep Enrich | Reroute
              false: Archive
      false: IF has domain?
              true:  Multi-URL Fetch → Check Modality (web-only) → IF play-modality? → Pass-via-web | Archive
              false: Archive (no domain)
```

Three paths, not two: the unmatched-but-has-domain path is necessary because Explorium's match table doesn't cover every real company (encountered in production with Taysha Gene Therapies, Enveda Biosciences — real companies, no Explorium match). Without the unmatched-web path, real positives get archived as "match failed" with no chance to recover.

## The seven steps

### Step 1 — Match (company name + domain → business ID)

- **MCP:** `mcp__explorium__match-business`
- **Cost:** free
- **Why first:** every downstream Explorium call needs `business_id`. A failed Match is the cheapest possible disqualification.
- **Null business_id is normal**, not an error — route to the unmatched-web path.

### Step 2 — Autocomplete probe to lock taxonomy values

- **MCP:** `mcp__explorium__autocomplete`
- **Input:** the play's seed industry terms.
- **Fields to probe:** `linkedin_category`, `naics_category`.
- **Output:** save accepted parameter values to a play-scoped taxonomy reference file. Do not guess these. Autocomplete returns the only strings Explorium accepts downstream.
- **Cost:** free.
- **Frequency:** run once per play, refresh if Explorium updates their taxonomy.

### Step 3 — Firmographics enrich (matched path only)

- **MCP:** `mcp__explorium__enrich-business` with `enrichment: ['firmographics']`.
- **Returns:** `linkedin_category`, `naics`, `naics_description`, `country_name`, `region_name`, `city_name`, `number_of_employees_range`, `yearly_revenue_range`, `linkedin_profile`.
- **Cost:** ~1 credit per match.

### Step 4 — Gate 1 (industry / NAICS / geography)

Three-way routing based on firmographics:

- **Pass-through** → continue to Gate 2:
  - `linkedin_category` matches biotech keyword set OR `naics_code` starts with biotech NAICS prefix
  - `country_name` matches play geography set
- **Archive** → `out_of_industry`, `geography_mismatch`. Write classification record, stop.

Per-play thresholds live in the workflow spec.

### Step 5 — Gate 2 (modality keyword verification)

Required for plays where the segment is narrower than Explorium's category taxonomy can express. Skip only if Gate 1 fully discriminates.

#### Multi-URL fetch (v1.4.0+)

A single homepage fetch is too narrow — real biotech sites put technical modality terms on subpaths (`/pipeline`, `/platform`, `/science`), not the marketing homepage. The deployed gate fetches 6 URLs per company in parallel:

```
https://{domain}, /pipeline, /platform, /science, /technology, /about
```

n8n implementation: a Code node ("Build URLs") emits 6 items per company; an HTTP Request node runs once per item; a downstream Code node ("Check Modality") consolidates via `$input.all()` and produces a single output. HTTP node config: `responseFormat: text`, `neverError: true`, `timeout: 10000`, `allowUnauthorizedCerts: true`, `followRedirects: true, maxRedirects: 5`.

For each response, strip `<script>`, `<style>`, and HTML comments before concatenating. Slice combined content to 80,000 lowercased chars. **The slice limit matters** — JS bundle preamble at the top of each HTML response can crowd out actual content if you cap too low. v1.2.0 had a 12k cap that hid real AAV terms; v1.4.0+ uses 80k after the strip pass.

#### Parent-company domain short-circuit

Maintain a play-scoped list of parent-company / tools-vendor domains (Thermo Fisher, Lonza, Catalent, Charles River, Merck Millipore, Sartorius, Cytiva for biotech plays). If the company's domain matches the list, route to `needs_data_quality_review` immediately — skip the keyword scan. The Domain field is wrong at source and no amount of keyword detection will fix it.

#### Keyword scan

Three keyword sets:

- **Anchors** — the modality's signature term(s) (e.g. for AAV: `aav, adeno-associated virus, adeno-associated viral`)
- **Mechanisms** — supporting technical terms (`vector, capsid, transduction, viral delivery, serotype`)
- **Exclusions** — adjacent modalities, paired with a context word to avoid false positives. Each exclusion modality has a token list + a shared context list. Token + context = match.

Pass condition:
```
isPlayModality = (anchor present AND mechanism present)
              OR (anchor count ≥ 2 OR anchor-regex count ≥ 3)
              AND NOT detectedExclusion
```

The dual-path anchor logic (strict anchor+mech OR strong anchor alone) was added in v1.3.0 after observing that companies like REGENXBIO put AAV all over their pipeline page (11 occurrences) but barely mention mechanism terms.

#### Review trigger

A bucket between pass and reroute for cases where the play's broader category is named but the specific modality term isn't. For AAV: a record with "gene therapy" phrasing but no AAV/capsid/vector → `needs_aav_review`, modality `gene_therapy_unspecified_vector`.

Trigger phrase list for AAV play: `gene therapy, gene therapies, genetic medicines, genetic medicine, cell and gene therap, gene and biologic therap, gene-to-cell, cell-and-gene`.

#### Exclusion override

When an exclusion fires but the broader category is ALSO present, prefer the review bucket. Example: a record that says "CAR-T therapeutic" once but talks about "gene therapy" repeatedly → don't archive as autologous_cell; route to review. The autologous_cell exclusion override was added because cell + gene therapy CDMOs were getting wrongly archived.

### Step 6 — Five-way destination wiring

Every gate execution writes one row to the `Companies` Airtable table per company, with the same field set across all outcomes. The `Enrichment Status` singleSelect accepts new values via `typecast: true` — no schema migration needed when adding outcome buckets.

Required fields, populated for ALL outcomes:

| Field | Purpose |
|---|---|
| `modality` | detected primary modality |
| `modality_source` | provenance — `<tool>:<sub_signal>` (e.g. `domain_match:parent_company_list:thermofisher.com`) |
| `modality_confidence` | `high / medium / low` |
| `detected_keywords` | literal strings matched (JSON array) |
| `classification_run_id` | unique per gate execution |
| `gate_version` | semver |
| `classification_notes` | structured prose narrative for human audit |
| firmographic fields | populated where Explorium had data; null where unmatched |

### Step 7 — Deep enrich, only on pass-bucket records

Now spend credits. The contacts coming out the other side are the only ones the play pays for. Everything else stayed in the classification table with full provenance.

## Classification Notes prose format

Structured to be human-auditable in 10 seconds. Format:

```
{run_date_iso} | Gate v{gate_version}
Outcome: {outcome_label}

Match: {matched | unmatched}
  - Explorium business_id: {id | none}
  - NAICS: {code} ({description})
  - Industry: {name}

Gate 1 (industry filter): {pass | fail | skipped}
  - Reason: {short string}

Gate 2 (modality fetch): {pass | fail | skipped} ({N of M URLs returned content})
  - URLs hit: {url list}
  - Combined content length: {N chars}
  - {Modality}-anchor matches: {count} ({list})
  - Mechanism keywords: {count} ({list})
  - Exclusion keywords: {count} ({list})
  - Gene therapy branded: {true | false}    [or play-specific review-trigger flag]
  - Detected modality: {bucket}
  - Confidence: {high | medium | low}

Final routing: {airtable status value}
[Reason: {explanation for review-bucket records}]
```

Use string concatenation in the n8n Code node — template literals with backticks conflict with the SDK's parameter wrapping. Avoid `.join()` — the n8n SDK security policy blocks it.

## Why the bucket set evolved

| Version | Buckets | What changed |
|---|---|---|
| v1.0.0 | 3 (pass / reroute / archive) | Original design |
| v1.1.0 | Same, added unmatched-web path | Real companies missing from Explorium were being archived as "match failed" without checking the web |
| v1.2.0 | Same, added Classification Notes | Ellie couldn't audit decisions without going into workflow logs |
| v1.3.0 | Same, loosened anchor logic | REGENXBIO has AAV everywhere but few mechanism terms — strict AND was too narrow |
| v1.4.0 | Same, multi-URL fetch + script-strip + 80k slice | Single-URL static fetch missed AAV terms living on subpaths |
| v1.5.0 | 4 (added needs_review) | "Gene therapy branded but no AAV" pattern (Taysha) was getting auto-rerouted as unknown — should go to human review |
| v1.6.0 | 5 (added needs_data_quality_review) | Parent-company domains (Microgenics → thermofisher.com) were burning fetch time and producing misleading reviews — short-circuit them |

The buckets multiplied because real-world data has more failure modes than three. Don't start with three — start with five.

## What this pattern does not do

- **Sourcing.** The gate qualifies an input list; it doesn't produce one. If the source list is mostly non-play companies (e.g. broad semantic search results for "gene therapy" returning peptide / small molecule / autologous cell companies), the gate will correctly route most of them out of the pass bucket and the per-record pass rate will be low. That's a sourcing problem, not a gate problem.
- **JS-rendered content.** Multi-URL fetch helps for sites that paginate technical content across subpaths, but doesn't help for true SPAs where all paths return the same JS shell. Rendered fetching (Playwright) is the next architectural step; not deployed.
- **Stale-employment or BD-engagement disqualifiers.** Run later against contact-level data.
- **Deduplication against CRM records.** Run Match against your CRM index separately if needed.

## Cost characteristics

For a single matched-path company:
- Match: free
- Firmographics enrich: 1 credit
- HTTP fetches: free (cloud bandwidth)
- Deep enrich (pass-bucket only): ~5 credits

For a 500-record run with ~2% pass rate:
- 500 matches: free
- ~470 firmographics enriches (some unmatched skip this): ~470 credits
- ~10 deep enriches: ~50 credits
- Total: ~520 Explorium credits

Per-record runtime in production: ~3-5s with 6 parallel URL fetches. 50 records = 2-3 minutes. 500 records = ~20-30 minutes.

## Operating notes

- **Re-run records under a new gate version:** blank `Enrichment Status` and `Modality Source`; the production filter `AND({Enrichment Status} = '', {Domain} != '')` picks them back up.
- **Targeted verification runs:** swap the filter temporarily to `OR(RECORD_ID()='...', ...)` with `returnAll: true`. Restore the production filter after.
- **Extending the gate:** keyword constants are duplicated between the matched-path and unmatched-path Check Modality nodes. Edit both. Bump `gateVersion`. Redeploy.
- **Airtable singleSelect schema:** `typecast: true` on the Update node auto-creates new option strings — no manual schema work when adding outcome buckets.
- **n8n SDK quirks:** `.join()` is security-blocked; use string concat. Backticks inside jsCode string conflict with outer template literals; use single/double quotes. The `continueOnFail` legacy field is stripped on deploy; use `onError: 'continueRegularOutput'` instead.
