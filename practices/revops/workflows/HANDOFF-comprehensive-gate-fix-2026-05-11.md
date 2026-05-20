# Handoff: comprehensive gate fix and full-list readiness

**Date:** 2026-05-11
**Open this in:** the Explorium-Direct session currently iterating on n8n workflow `Z6RROKx5omdfvhtn`
**Mission:** finish three structural fixes so the gate is ready to run cleanly on the full 553-record queue. Sequenced. Do not bundle.

---

## Where we are

Gate is functional. Three-way routing works. All 6 classification fields populate. Latest run classified 22 records: 8 archived, 14 rerouted, 0 enriched (no AAV positives in the test queue).

Three open issues this handoff addresses:

1. Companies Explorium doesn't have get archived as `explorium_match_failed` even when Gate 2 (web fetch) could classify them correctly from their website. Taysha Gene Therapies is the canary... a real public AAV gene therapy company archived for this reason.
2. Archive and reroute paths may not be populating the full firmographic field set. Hard to confirm field coverage without auditing.
3. No per-record narrative explaining what the gate did and why. Ellie cannot audit decisions without going into workflow logs.

---

## Three changes, sequenced. Do not bundle.

### Change 1: Match-failed routing fix

**Current behavior:** `Match Business` returns null business_id → Qualify Company archives as `explorium_match_failed` → company never sees Gate 2.

**New behavior:**

```
Match Business
  → IF business_id is null?
      true  → IF company has a domain?
                  true  → run Gate 2 (web fetch + modality keyword check)
                            → IF AAV detected → pass (modality_source: web_fetch_after_unmatched)
                            → IF AAV not detected → archive (modality_not_found_after_unmatched)
                  false → archive (explorium_match_failed_no_domain)
      false → continue to Enrich Firmographics Only → Gate 1 → Gate 2 (existing flow)
```

The bucket names matter. `explorium_match_failed` implied "out of industry." It isn't. We just don't know. The new labels honestly describe what was checked and what was found.

This change makes `continueOnFail: true` on `Enrich Firmographics Only` unnecessary. Remove it as part of this change. Real errors should bubble; routing handles the expected null-id case explicitly.

### Change 2: Full firmographic coverage on every path

Audit every Map node (`Map Enriched Fields`, `Map Disqualified Fields`, any new ones added by Change 1). Every path... pass, reroute, archive... must write the same firmographic field set when Explorium data is available:

| Field | Source |
|---|---|
| NAICS Code | `firmo_naics` |
| Industry | `firmo_naics_description` |
| Country | `firmo_country_name` |
| HQ State | `firmo_region_name` |
| HQ City | `firmo_city_name` |
| Employee Range | `firmo_number_of_employees_range` |
| Revenue Range | `firmo_yearly_revenue_range` |
| Company LinkedIn URL | `firmo_linkedin_profile` |
| Explorium Business ID | match output (blank if unmatched) |
| Last Enriched At | `new Date().toISOString()` |
| Modality | gate output |
| Modality Source | gate output |
| Modality Confidence | gate output |
| Detected Keywords | gate output (never empty string... use null or an actual reason) |
| Classification Run ID | this run's record ID |
| Gate Version | from the operating taxonomy doc's change log |

Only the 16 deep enrichments (technographics, financial_metrics, events, etc.) stay gated on the pass path. Firmographics is cheap and informative... write it everywhere it's available, including on archive paths. Ellie needs to be able to audit "why was this archived?" by reading the firmographics.

For unmatched companies (no Explorium data), populate what we know: Modality, Modality Source, Confidence, Detected Keywords, Run ID, Gate Version, and Classification Notes (Change 3). Leave Explorium-only fields blank.

### Change 3: Classification Notes field

Add a new field to the Companies table (`tblnj3YlOI3thjrXp`) in the RevOps Surface base (`appYBYH3aOHhTODAw`):

- Name: `Classification Notes`
- Type: `multilineText`

The workflow writes a structured narrative per record at classification time. Use this exact format... Ellie will read it, so prose readability matters:

```
{run_date_iso} | Gate v{gate_version}
Outcome: {pass | reroute | archive}_{reason}

Match: {matched | unmatched}
  - Explorium business_id: {id | none}
  - NAICS: {code} ({description})
  - Industry: {name}

Gate 1 (industry filter): {pass | fail | skipped}
  - Reason: {short string}

Gate 2 (modality fetch): {pass | fail | skipped}
  - URL: {url | n/a}
  - Status: {200 | 4xx | 5xx | timeout | skipped}
  - Content length: {N chars | n/a}
  - AAV keywords found: {count} ({list})
  - Exclusion keywords found: {count} ({list})
  - Detected modality: {bucket}
  - Confidence: {high | medium | low}

Final routing: {airtable status value}
```

Example for Taysha after the Change 1 routing fix:

```
2026-05-11T14:32:00Z | Gate v1.1.0
Outcome: pass_modality_recovered_from_web

Match: unmatched
  - Explorium business_id: none
  - NAICS: n/a
  - Industry: n/a

Gate 1 (industry filter): skipped (no firmographics)

Gate 2 (modality fetch): pass
  - URL: https://tayshagtx.com
  - Status: 200
  - Content length: 47231
  - AAV keywords found: 12 (AAV x8, capsid x3, serotype x5)
  - Exclusion keywords found: 0
  - Detected modality: AAV
  - Confidence: high

Final routing: enrichment_complete
```

Example for Altimmune (peptide reroute after the keyword loosening sub-fix):

```
2026-05-11T14:35:00Z | Gate v1.1.0
Outcome: reroute_wrong_modality

Match: matched
  - Explorium business_id: b_xxx
  - NAICS: 5417 (Research and Development in the Physical, Engineering, and Life Sciences)
  - Industry: Biotechnology

Gate 1 (industry filter): pass

Gate 2 (modality fetch): pass
  - URL: https://altimmune.com
  - Status: 200
  - Content length: 28447
  - AAV keywords found: 0
  - Exclusion keywords found: 8 (peptide x6 with context: therapeutic x4, pipeline x2)
  - Detected modality: peptide therapeutics
  - Confidence: high

Final routing: rerouted_wrong_modality
```

Plain enough that Ellie audits a decision in 10 seconds without ever opening the workflow.

---

## Sub-fix bundled with Change 3: peptide exclusion loosening

The current peptide exclusion looks for phrases (`peptide therapy`, `peptide-based therapeutic`) that don't appear on most biotech homepages. Replace with the same pattern as the AAV inclusion: bare token + at least one context word.

- Trigger phrase: literal `peptide`
- Required context (any one of): `therapeutic`, `therapeutics`, `pipeline`, `drug`, `platform`, `program`, `candidate`
- Apply the same shape to other exclusion modalities in the taxonomy doc (lentiviral, small molecule, mRNA, etc.) when you get to them. For now, peptide is the active gap.

---

## Six-company verification set

Do not run the full 553 until these six pass clean:

| Company | Expected outcome | Tests |
|---|---|---|
| REGENXBIO | `enrichment_complete` | Known AAV positive, Explorium-known. Confirms happy path. |
| Voyager Therapeutics | `enrichment_complete` | Known AAV positive, Explorium-known. Confirms happy path. |
| Taysha Gene Therapies | `enrichment_complete` | Confirms Change 1: match-failed → web fetch recovery. |
| Altimmune | `rerouted_wrong_modality` with `modality: peptide` (not `unknown`) | Confirms peptide keyword loosening. |
| Affimedix | `archived_out_of_industry` with non-empty `Detected Keywords` | Confirms Change 2 (provenance) and that Gate 1 still works. |
| Renovacor | `enrichment_complete` | Was previously `web_fetch:no_content` from a pre-fix run. Confirms re-run flushes correctly. |

All six must end with a populated `Classification Notes` field in the prose format above. All six must have firmographics populated where Explorium had data.

Reset the existing seven `web_fetch:no_content` records (Renovacor, Generation Bio, Palleon, Myeloid Tx, GeneFab, Synthego, Intrexon) by blanking their Enrichment Status as part of the same flush. They re-enter the queue under the new logic.

---

## Definition of done

- Change 1, 2, 3 deployed in that order, with a verification run after each
- Six-company verification set runs clean: no crashes, no `web_fetch:no_content` on reachable sites, all six routing outcomes match the expected table
- `Classification Notes` populated on every test record in the structured format
- Firmographic field coverage verified on all six records (NAICS Code, Industry, Country, HQ State, Employee Range populated where Explorium had data)
- Gate Version bumped to `1.1.0` in the workflow code and reflected in the taxonomy doc's change log
- Tell Nick before flipping `returnAll: true`. He wants to be in the loop before the 553 fires.

---

## What NOT to do

- Don't bundle Changes 1, 2, 3 into one mega-deploy. Sequence and verify.
- Don't add `continueOnFail: true` to mask routing bugs. Change 1 removes the need.
- Don't write `Classification Notes` as raw JSON. Use the structured prose format. Non-engineers read it.
- Don't run the full 553 until the six-company set passes.
- Don't expand scope. If you spot another fix worth doing, log it for a follow-on handoff, don't ship it inline.

---

## What lands after this

Once the 553 run completes, the next session writes one row to the `Enrichment Runs` Airtable table (`tblEVSEqetmu4ScHe`) with the markdown report rendered. That run is the artifact Ellie reviews. The current handoff just gets us to a state where that run can land cleanly.
