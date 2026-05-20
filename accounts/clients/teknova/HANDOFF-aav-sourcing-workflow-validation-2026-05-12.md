# Handoff: harden the AAV CT.gov sourcing workflow

**Date:** 2026-05-12
**For:** the folder/skill that owns the n8n workflow producing the AAV sourcing list (workflow `Z6RROKx5omdfvhtn` and the CT.gov fetch node feeding it)
**Mission:** add five validation steps to the CT.gov sourcing pipeline that catch false positives before any company gets to Ellie. The current pipeline keyword-matches "AAV" on the trial registry and surfaces three categories of garbage: disease-name collisions, non-AAV delivery, and out-of-geography sponsors. This handoff specifies the rules in execution order with concrete signals and example failures from a real sample.

## Companion handoff

There is a parallel handoff for the RevOps practice skill that owns the AAV operating docs:

`/Users/nplmini/code/work/accounts/clients/teknova/HANDOFF-apply-ellie-feedback-to-operating-docs-2026-05-12.md`

That handoff updates `revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md` and `revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md` to reflect Ellie's Apr 17 and May 9 feedback. The rules in THIS handoff need to land in the sourcing-rules doc as well, so coordinate ordering: ideally the doc-update folder applies Ellie's feedback first, then this workflow handoff appends the CT.gov-specific rules in a second change-log entry. If both run concurrently, they edit different sections and should not collide.

## Sample input for testing

A real CT.gov response (page 1 of 3, 100 of 263 studies, query: AAV-related interventional studies) is available at:

`/Users/nplmini/Desktop/Fetch_AAV_Studies.json`

Format: n8n-envelope-wrapped, top-level is `[ { json: { totalCount, studies, nextPageToken } }, { json: { data: <error string> } } ]`. The error item is an n8n bug where `pageSize` was passed twice in the query. Fix that bug in the fetch node so the response is clean (one item, no error payload).

Use this file as the validation fixture. After applying the five rules below, the surfaced-company count should drop from 27 unique to 13 confirmed-AAV companies, with explicit reject reasons recorded for the 14 filtered out.

## The five validation rules, in execution order

### Rule 1: Disease-AAV filter on the conditions list

The CT.gov text-search for "AAV" matches **ANCA-Associated Vasculitis (AAV)**, an autoimmune disease, in addition to **Adeno-Associated Virus (AAV)**, the vector. Three sponsors in the sample failed cleanly here: Cartesian Therapeutics, Nkarta, Alpine Immune Sciences.

If a trial's `conditionsModule.conditions` contains ANY of these strings (case-insensitive substring match), the trial requires positive vector evidence from Rule 2 before it is accepted:

```
ANCA-Associated Vasculitis
Anti-Neutrophil Cytoplasmic Antibody
Granulomatosis With Polyangiitis
Microscopic Polyangiitis
Eosinophilic Granulomatosis with Polyangiitis
AAV-Vasculitis
ANCA Vasculitis
```

Maintain this list as a configurable constant. New disease-AAV variants may appear; the list should be appendable without code change.

### Rule 2: Vector evidence required for the AAV-pass

A trial passes the AAV-vector check ONLY if at least one of the following is true. Record which clause matched, so future debugging can trace the decision.

**Clause A: intervention name has explicit vector signal.**

For each `armsInterventionsModule.interventions[].name`:

- Regex match `\b[rR]?AAV[0-9rhu]*\b` (catches AAV, rAAV, AAV1, AAV2, AAV5, AAV6, AAV8, AAV9, AAVrh10, AAVrh74, AAVhu37, AAVhu68, etc.). The optional leading `r` covers `rAAV` (recombinant AAV), which is the precise form used in scientific literature.
- OR substring match "Adeno-Associated" (case-insensitive)
- OR substring match any of `capsid`, `serotype`, `tropism`, `transduction` co-occurring with `vector` or with a GENETIC / BIOLOGICAL intervention type

**Clause B: gene therapy intervention + AAV-named trial.**

- `armsInterventionsModule.interventions[].type` is GENETIC or BIOLOGICAL
- AND `identificationModule.briefTitle` OR `identificationModule.officialTitle` contains one of: "Adeno-Associated Virus", "AAV-mediated", "AAV Gene Transfer", "AAV vector"

**Clause C: canonical AAV-treated indication + gene therapy intervention.**

- `armsInterventionsModule.interventions[].type` is GENETIC
- AND `conditionsModule.conditions` contains at least one of the curated AAV-canonical indications (starter list, expandable):

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

- AND Rule 1's disease-AAV filter did NOT trigger on this trial.

**Reject case:** if all three clauses fail, the trial is logged as a false positive with reason `no_vector_evidence` and the trial's snapshot (sponsor, NCT, conditions, intervention names, intervention types) is written to a `ct_gov_false_positives` table for audit.

### Rule 3: Record delivery vehicle and therapeutic modality as separate fields

The current single-bucket modality classification conflates two distinct axes. A company can do epigenetic reprogramming THERAPEUTICALLY while using AAV as the DELIVERY vehicle. From Teknova's reagent-buyer perspective, AAV delivery is what matters. From Ellie's outreach-fit perspective, the therapeutic mechanism is what matters.

Three companies in the sample sit in this borderline zone: Life Biosciences (epigenetic therapy via AAV), Ascidian Therapeutics (RNA exon editing via AAV), Precision BioSciences (ARCUS gene editing).

On every company record produced by the gate, store two fields:

- `Therapeutic Modality` ... what the product does. Values: gene replacement, epigenetic reprogramming, RNA editing, gene editing, antisense, RNAi, etc.
- `Delivery Vehicle` ... how it gets there. Values: AAV, LNP, lentiviral, electroporation, naked, oral, IV, etc.

A pass for the AAV play requires `Delivery Vehicle = AAV`. The therapeutic modality is informational for routing and copy variants.

Source the delivery vehicle and therapeutic modality from:
1. Intervention name pattern matching (AAV9 → AAV delivery; ARCUS, CRISPR → gene editing modality)
2. Trial title language
3. Company website (existing taxonomy doc trust order applies)

When the CT.gov record alone cannot resolve both axes, mark `Therapeutic Modality` or `Delivery Vehicle` as `needs_verification` and queue the company for an Exa-grounded confirmation pass before surfacing.

### Rule 4: Enrich sponsor HQ separately from trial-site geography

The CT.gov `contactsLocationsModule.locations[].country` field tells you where patients enroll. It does NOT tell you where the sponsor's process development team sits. UniQure (Netherlands), Vivet (France), Trogenix (UK), and Elpida (Cayman SPC) all have US trial sites because they file with FDA, but the sponsor entity is not US/Canada.

For each surfaced sponsor:

1. Look up the sponsor entity headquarters via an enrichment provider (LinkedIn company, Crunchbase, the company's own contact page).
2. Store `Sponsor HQ Country` as a first-class field.
3. Apply the US/Canada geography filter against `Sponsor HQ Country`, not against trial-site countries.
4. If sponsor HQ cannot be determined, mark `needs_verification` and queue; do not auto-include.

This rule cannot be enforced from CT.gov data alone. It is an enrichment step that must run between CT.gov surfacing and Ellie-handoff.

### Rule 5: Dedupe against prior reviewed-companies set

Before surfacing any sponsor as a verification candidate, check it against the existing reviewed-companies set (Apr 17 list + May 9 spreadsheet, Companies table in RevOps Surface Airtable). If the sponsor name matches (normalize for legal suffixes like Inc, LLC, Corp, Ltd, SPC):

- If Ellie previously classified this company AAV-confirmed, attach her prior classification and skip re-review.
- If Ellie previously classified this company as a different modality, surface a conflict-resolution row to her ("CT.gov says AAV, you said X, which is right?") rather than silently overriding.
- If Ellie has neither seen nor classified this company, surface as a fresh candidate.

The sample has five overlap hits: 4D Molecular, Adverum, Beacon, AskBio, Rocket. These should flag, not re-ask.

## Source-aware vocabulary register

The five rules above are tuned to the regulatory register (CT.gov, IND filings). Industry uses several other vocabularies across audiences, and the workflow needs to keep this in mind as more canonical sources come online. Without this awareness, future sources will get filtered against the wrong vocabulary and the workflow will produce false negatives the same way the unfiltered CT.gov pull produced ANCA-Vasculitis false positives.

Vocabulary by audience:

- **Scientific / academic literature** uses `rAAV` (recombinant AAV) most precisely, almost always paired with a serotype (`rAAV9`, `AAVrh10`, `AAVrh74`, `AAVhu37`). Capsid engineering papers use `tropism`, `transduction efficiency`, `neutralizing antibodies`.
- **Regulatory filings (CT.gov, FDA IND, EMA)** use both `AAV` and the full `Adeno-Associated Virus`, often in the same document. Trial titles read "AAV-mediated gene transfer" or "Adeno-Associated Virus serotype 9 vector encoding...".
- **Investor / corporate marketing** uses umbrella terms. `genetic medicines`, `gene therapy platform`, `one-time treatment`, `durable expression`. Many AAV-focused biotechs do not lead with AAV on their homepage because it narrows the perceived platform. AAV-specific language lives on the technology or pipeline page.
- **Process development / CMC (Ellie's buyer audience)** uses technical CMC vocabulary. `capsid`, `serotype`, `titer`, `full/empty capsid ratio`, `HEK293` vs `Sf9 baculovirus`, `transient transfection` vs `stable producer cell line`, `affinity chromatography`, `CsCl gradient purification`. These terms in a contact's title or LinkedIn description are the strongest signal that the person is a reagent buyer.

Match rules by source type:

- **Website-level scraping:** require ANY of (acronym form, full term, serotype pattern) AND ANY of (mechanism word, canonical monogenic indication, capsid-platform language) on the same page. Single-page homepage scrapes will miss companies like Spark Therapeutics and Lexeo whose homepages use umbrella terms. Scrape the technology, pipeline, and platform pages, not just the root.
- **Regulatory data (CT.gov, IND):** the five-rule chain above. Already source-specific.
- **Patent data (future canonical source):** match IPC/CPC classification codes in the C12N15/86 family (vectors and viral vector engineering) AND any vocabulary form from the term list. Patent abstracts use formal language; the IPC codes are unambiguous.
- **Industry directory data (future canonical source, e.g., BIO, ARM, Cell & Gene Therapy directories):** use the directory's modality / category tag as primary signal, text search as secondary. Most directories pre-classify members by modality.

Implication for the strict-pattern rule in the operating sourcing doc: that rule is high-precision but tuned to one register. The doc-update folder is replacing it with the source-aware structure documented above. This handoff handles the workflow-side encoding. Coordinate so the doc and the workflow agree on the term list.

This vocabulary expansion is captured in parallel in the doc-update handoff at `/Users/nplmini/code/work/accounts/clients/teknova/HANDOFF-apply-ellie-feedback-to-operating-docs-2026-05-11.md`. Both must apply the same term list and the same source-aware match logic.

## Expected behavior on the sample file

After all five rules apply, the gate output against `Fetch_AAV_Studies.json` page 1 should be:

| Bucket | Count | Examples |
|---|---|---|
| Confirmed AAV, new candidate | ~8 | Solid Biosciences, Tenaya, Adrenas, Spur, YAP Therapeutics, MavriX, Life Biosciences (or borderline), Ultragenyx (verify size) |
| Confirmed AAV, already reviewed | 5 | 4D Molecular, Adverum, Beacon, AskBio, Rocket |
| Borderline (AAV delivery, non-classical modality) | ~3 | Life Biosciences, Ascidian, Precision BioSciences |
| Rejected: disease-AAV false positive | 3 | Cartesian, Nkarta, Alpine |
| Rejected: non-US/Canada sponsor HQ | 5 | UniQure, Vivet, Trogenix, Elpida, Chengdu Origen |
| Rejected: large pharma | 4 | BioMarin, Pfizer, Bayer, Amgen |

Total surfaced to Ellie for verification: ~13 (the new + already-reviewed buckets), each with their classification evidence attached. Rejected sponsors are logged with reason, not silently dropped.

## Schema changes implied by these rules

If the workflow currently writes to the Companies table in RevOps Surface (base `appYBYH3aOHhTODAw`), add these fields:

- `Therapeutic Modality` (single-select with the modality bucket list)
- `Delivery Vehicle` (single-select: AAV, LNP, Lentiviral, etc.)
- `Sponsor HQ Country` (single-select, US/Canada or other)
- `CT.gov NCT IDs` (long text or multi-link, comma-separated)
- `CT.gov Trial Phases` (multi-select)
- `CT.gov Trial Statuses` (multi-select)
- `CT.gov Indications` (long text)
- `CT.gov Sample Intervention Name` (single-line text)
- `Vector Evidence Clause` (single-select: A, B, C, or none ... which rule passed)
- `Verification Status` (single-select: surfaced / borderline / rejected / needs_verification)
- `Rejection Reason` (single-select: disease_AAV / no_vector_evidence / non_US_HQ / large_pharma / non_AAV_modality / other, with free-text override)

Also create an audit table (or use Enrichment Runs with a category field) for false positives so the rules can be tuned over time.

## Bug to fix in the fetch node

The sample file shows two items at the top level, the second containing the error string `pageSize is single value parameter, but request has 2 values`. The CT.gov API call has `pageSize` passed twice. Fix the node so only one `pageSize` parameter is sent. After the fix, the response should be a single envelope item.

## Pagination

The sample is page 1 of 3 (`totalCount: 263`, `studies: 100`, `nextPageToken` present). The workflow needs to paginate until `nextPageToken` is absent and apply the five rules across the full set. The expected surfaced-company count from all three pages is unknown until the pagination runs cleanly.

## House style for any docs touched

- No em dashes. Ellipses ("...") if a pause is needed.
- No emojis.
- Match the operating doc voice: each rule has a "how to change this" path, the docs are living.
- Credit Ellie's Apr 17 and May 9 feedback in change-log entries when these rules land in the sourcing-rules doc.

## Definition of done

- Five validation rules implemented in the workflow, in order, with per-trial decision logging.
- Disease-AAV term list and AAV-canonical indication list externalized as configurable constants.
- Sponsor HQ enrichment step added between CT.gov surfacing and surfacing-to-Ellie.
- Dedupe against existing reviewed-companies set is in place.
- Companies table schema extended with the new fields listed above.
- CT.gov fetch node bug (duplicate pageSize) fixed.
- Pagination loops cleanly through the `nextPageToken` chain.
- Re-running against `/Users/nplmini/Desktop/Fetch_AAV_Studies.json` produces the expected bucket counts above, with the three false positives logged in the audit table.
- The sourcing-rules doc gets a 2026-05-12 change log entry summarizing what landed, requested-by attribution split between Nick (workflow-side observation) and Ellie (whose Apr 17 and May 9 feedback motivated the strictness in the first place).

## When this handoff is complete

Delete or archive this file. The picking-up session for the email-to-Ellie draft can then truthfully tell her: "The list we're sending you went through five filters before it got to your inbox, and three companies that the trial registry flagged as AAV were rejected because the AAV in their trials means Vasculitis, not the vector."
