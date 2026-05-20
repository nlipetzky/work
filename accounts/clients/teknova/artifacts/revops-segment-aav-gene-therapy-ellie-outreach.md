# Criteria Artifact: aav-gene-therapy-ellie-outreach

**Client:** Teknova
**Play:** aav-gene-therapy-ellie-outreach
**Date:** 2026-05-18
**Version:** 4
**Offer (one sentence):** A reagent-readiness pitch to AAV gene therapy Process Dev / CMC leaders heading toward IND, anchored on a per-prospect signal, opening with a 20-min "reagent readiness check" and offering RUO+ small-batch GMP buffers + Express-Tek audit-ready documentation to compress the 6-month lead time and 8-week paperwork cycle.

This is the single canonical criteria artifact for the play. Part 1 is the declarative target in the client expert's language (Ellie / Jenn approved). Part 2 is the operational detection logic the engine applies. Part 3 is provenance. It supersedes the prior Part-1-only segment criteria (v1, 2026-05-07) and absorbs the modality taxonomy and the hardcoded detection node. There is no separate taxonomy file or detection-logic source of truth; both live here.

---

## Part 1 — Segment definition (declarative, client-expert language)

Source-agnostic: every criterion names the observable signal, not the table or provider where it lives.

### Hard filters

A record must match every hard filter to enter the segment.

#### Company modality: active AAV gene therapy work
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** company's currently published platform, pipeline, or product description states the company develops, manufactures, or contract-manufactures AAV-based gene therapies. Verifiable by company website, the LinkedIn "About" section, the company's pipeline page, or a recent press release.
- **Description:** the offer assumes an AAV vector workflow as the buyer's daily reality. Companies whose primary platform is peptide / small molecule, lentiviral, RNA editing, autologous cell therapy, epigenetic reprogramming, or non-viral delivery do not fit this play even if they appear under broad "gene therapy" tagging. Multi-vector CDMOs only match if AAV is one of their named services.

#### Company stage: preclinical through Phase II
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** company's stated clinical pipeline includes at least one program in preclinical, IND-enabling, Phase I, or Phase II. Verifiable by clinicaltrials.gov registration, pipeline page, recent investor or press communications, or 10-K / 10-Q for public companies.
- **Description:** the RUO+ and Express-Tek pitch lands inside the 60–120-day window before IND submission and through Phase I/II clinical-supply scale. Programs that are pure discovery without a stated clinical track, or programs already past Phase II at commercial scale, are different conversations and different products.

#### Company size: small-to-mid biotech, or AAV CDMO
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** headcount under 2,000 full-time employees as reported on the company's most recent public profile or filing, AND the company is not a wholly-owned subsidiary of a top-20 global pharma operating under that parent's CMC infrastructure.
- **Description:** the play targets companies that still own their own reagent supplier decisions. Subsidiaries that operate under a parent pharma's GMP supply chain are excluded as hard filter. Independent CDMOs serving AAV vectors are included regardless of headcount.

#### Geography: United States or Canada
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** company headquarters or the contact's primary work location is the United States or Canada.
- **Description:** Ellie's outbound, the offer's pricing, and the GMP supply-chain references are all NA-anchored. EMEA and APAC are out of scope for this play.

#### Contact function: process development, manufacturing, or CMC ownership
- **Type:** demographic
- **Match:** hard filter
- **Observable signal:** the contact's current role's primary responsibility is owning, leading, or directly executing process development, manufacturing, or CMC for the company's AAV program. Evidenced by either: (a) title containing "process development," "viral vector," "downstream processing," "purification," "vector manufacturing," "gene therapy manufacturing," "CMC," or "process science"; OR (b) the role's stated responsibilities cover those domains; OR (c) the contact is the chief scientific officer at a company under 200 employees.
- **Description:** Ellie's working framing — "anything with viral vector downstream processing purification are going to be the two big ones" — is the title-pattern anchor, but title strings vary. Function ownership is the filter; title pattern is the primary verifier; CSO at small biotechs is a permitted shortcut because at that headcount the CSO often is the CMC function.

#### Contact seniority: Director through SVP, with VP cap at large biopharma
- **Type:** demographic
- **Match:** hard filter
- **Observable signal:** contact's current seniority is Director, Senior Director, Head of, VP, or SVP. With one exception: at companies with more than 500 employees that are not pure CDMOs, VPs and above are EXCLUDED.
- **Description:** the buyer is the operator who owns the RUO-to-GMP transition, not a senior-scientist hands-on-the-bench contributor and not the C-suite at a large biopharma. The VP cap at large biopharma is to avoid burning high-level relationships that BD owns separately. Senior Scientists / Manufacturing Leads / Tech Ops Leads can be added as secondary contacts if the play needs depth, but not as the primary.

#### Contact-company alignment: current employer is the AAV company
- **Type:** demographic
- **Match:** hard filter
- **Observable signal:** the contact's current LinkedIn-listed employer matches the AAV company being targeted. Past AAV experience at a different employer does not satisfy this filter on its own.
- **Description:** the AAV pitch is to the company's current production reality. A contact whose only AAV exposure is from a job they left two years ago, while their current employer makes peptides, fails this filter even if their profile keywords say "AAV."

### Soft signals

Records that pass hard filters get scored by soft signals. Soft signals do not exclude.

#### Recent funding round
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** company announced a Series A or later funding round, IPO, or major strategic investment in the last 45 days.
- **Description:** Jenn's stated rationale: a funding event "validates whether or not that company is doing well, if they have money to spend with us potentially." Recent capital is the highest-confidence "they can buy" signal available without inside data. Reference: ArsenalBio's $35M raise was the prompt that surfaced this play.

#### Recent IND filing or clinical-stage advance
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** clinicaltrials.gov registration, IND announcement, or stage-progression press release in the last 60 days.
- **Description:** the 60-120-day window before IND is the offer's tightest fit. Companies that just filed are inside the window where reagent-documentation gaps surface and a switch is still operationally possible.

#### Capacity-expansion or process-dev leadership hire
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** company posted a job opening for, or announced a hire in, a process development, manufacturing, vector production, or CMC leadership role in the last 60 days.
- **Description:** Jenn's diagnostic frame: companies hiring for these roles are scaling, not contracting. Treat the hire as a proxy for capacity intent, not as a contact target on its own.

#### Recent conference attendance or speaking presence
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** the contact or company appears on the published attendee, speaker, or sponsor list of a relevant industry event in the last 90 days. Currently anchored: Interphex, BPI West, Advanced Therapies Week.
- **Description:** post-conference lists give a reason-to-reach-out anchor in opening copy. Useful for sequencing but not a primary qualifier.

#### Recent publication or technical presentation on AAV process work
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** contact authored or co-authored a paper, poster, conference talk, or webinar covering AAV upstream/downstream processing, purification, formulation, or analytics in the last 12 months.
- **Description:** publicly committed thinking on the offer's exact technical territory is a strong proxy for budget intent and for the contact being the actual decision influencer.

#### Tenure-in-role over 12 months
- **Type:** demographic
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** contact's stated start date in current role is more than 12 months ago.
- **Description:** the play has been hit hard by stale data. Tenure over 12 months is a freshness/stability proxy: the contact is more likely still in the role on send day, and senior enough in their tenure to own the buying conversation.

#### Product / pipeline therapeutic area named in messaging
- **Type:** firmographic
- **Match:** soft signal
- **Weight:** low
- **Observable signal:** company's lead AAV program targets a specific named indication (rare disease, ophthalmology, neurology, etc.) per their pipeline disclosure.
- **Description:** Ellie has flagged that naming the specific program in opening copy is a cleaner anchor than a generic "your gene therapy program." Used for personalization, not qualification.

### Disqualifiers

A record matching any disqualifier is removed from the segment regardless of other matches.

#### Active BD engagement in the last six months
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** the contact, or any contact at the same domain, has a logged BD meeting, ongoing scheduled meetings, or appears as a participant or CC on an active sales-thread email within the last six months.
- **Description:** Ellie's "Rocket rule." Cold outreach into accounts BD is actively working creates owner conflict and looks uncoordinated to the prospect. Lapsed accounts (>2 years no activity) are NOT disqualified — those are explicitly re-eligible for re-engagement.

#### Currently enrolled in another active Teknova cadence
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** contact is presently sequenced in any other active Teknova outreach cadence (PluriFreeze / cell therapy / event follow-up / other plays).
- **Description:** prevents the cross-tagging spam pattern Mika flagged on the cryo + gene therapy lists. A contact may be re-eligible after their other cadence completes; the disqualifier is concurrent enrollment, not historical enrollment.

#### Stale or inactive employment
- **Type:** demographic
- **Match:** disqualifier
- **Observable signal:** any of the following on the contact's LinkedIn or sourced profile: an end date set on the current role; an "open to work" badge; a "retiring" / "retired" notation; or a most-recent role change more than 6 months ago without a confirmed new employer.
- **Description:** the play has burned hours of Ellie's time on contacts who left months or years ago. Treat any of these as a hard remove, not a maybe.

#### Acquired or operationally abandoned company
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** the company's domain redirects to a parent or acquirer; OR the LinkedIn page is explicitly marked as "no longer active or monitored"; OR the company has publicly ceased operations; OR recent leadership has departed for a named acquirer.
- **Description:** observed pattern from the 2026-05-07 Clay pass on PLAY-006: Astellas Gene Therapies, Audentes Therapeutics (resolves to Astellas), AveXis (resolves to Novartis), Aavantibio (leadership at Solid Biosciences). Auto-suppress pending manual confirmation; the database row stays but contacts are held.

#### Patient-facing clinical role
- **Type:** demographic
- **Match:** disqualifier
- **Observable signal:** title or stated responsibilities include direct patient care, clinical trial coordination on the patient side, nursing, or any role where the work product is patient interaction rather than upstream/downstream process work.
- **Description:** Ellie's framing: "if it says patients anywhere... they're not actually working on making the sauce." These contacts cannot influence reagent selection.

#### Excluded function
- **Type:** demographic
- **Match:** disqualifier
- **Observable signal:** the contact's primary function is Legal, Sales, Talent Acquisition, Marketing, IT, Finance, Regulatory, Program Management, or QC.
- **Description:** mirrors the engagement-wide exclusions in `clients/teknova/CLAUDE.md`. Regulatory in particular is "explicitly banned from outreach."

#### Out-of-scope industry background
- **Type:** demographic
- **Match:** disqualifier
- **Observable signal:** the contact's stated career history is primarily in agronomy, agricultural science, plant biology, or veterinary work without a documented pivot into human cell or gene therapy.
- **Description:** observed from prior list reviews. These contacts surface via shared keyword matches but cannot consume the offer.

#### Disqualifying email status
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** the contact's email status in the system is hard-bounced, do-not-contact, or email opt-out.
- **Description:** mirrors the play's existing acceptance-criteria disqualification list. Records here cannot enter the cadence regardless of fit.

---

## Part 2 — Detection logic (operational, machine-consumable)

The operational definition of "AAV gene therapy company." Synthesized from the modality taxonomy, Ellie's classification rules (2026-05-12), and the detection node (gate v1.6.0). This is what the Sourcing Planner, Match-and-Verify, and Classify gates read.

### Working definitions

#### AAV
- **Means:** Adeno-Associated Virus used as a gene therapy delivery vector. A company is in scope when it develops, manufactures, or contract-manufactures AAV-vectored therapeutics.
- **Does not mean:** other viral vectors (lentiviral, adenoviral), non-viral delivery, peptide / small molecule / RNA / autologous-cell modalities, or research-tools-only vendors that sell into AAV labs without running their own programs.
- **Collision:** "AAV" is a homonym. In clinical-trial condition fields it frequently means **ANCA-Associated Vasculitis**, an autoimmune disease, not the vector. This is the single highest-frequency false-positive source. Resolve by: (a) requiring a vector mechanism word alongside the AAV token in website checks; (b) on trial evidence, requiring a match to the canonical AAV indication list AND no match to the disease-AAV exclusion list. A trial whose only "AAV" is the vasculitis disease is a reject, not a borderline.

#### CDMO (in scope)
- **Means:** a contract development / manufacturing organization that names AAV vector services in its offerings.
- **Does not mean:** multi-vector CDMOs that do not name AAV; research-tools or analytics vendors.
- **Collision:** none material. Included regardless of headcount (the headcount hard filter is waived for AAV CDMOs).

### Positive detection signals

#### Website modality vocabulary
- **Consumer:** verification, classification
- **Bias:** precision
- **Test:** fetched company web content (pipeline / platform / science / technology / about subpaths) contains at least one **AAV anchor** AND at least one **vector mechanism** term.
  - AAV anchors: `aav`, `adeno-associated virus`, `adeno-associated viral`
  - Vector mechanism: `vector`, `capsid`, `transduction`, `viral delivery`, `serotype`
  - Strong anchor (raises confidence to high): ≥2 distinct anchors present, OR the literal token `aav` (word-boundary match) appears ≥3 times.
- **Evidence source rank:** company website (rank 2 below). Highest-trust source available at the verification gate for live companies.
- **Confidence:** strong anchor → high; single anchor + single mechanism → medium; anchor without mechanism → see gene-therapy-branded fallback.

#### CT.gov trial evidence (L2)
- **Consumer:** sourcing, verification, classification
- **Bias:** precision
- **Test:** the company is a sponsor on clinicaltrials.gov of a trial that satisfies **all three** clauses (R5, 2026-05-18):
  1. **Study type is `INTERVENTIONAL`.** Reject `OBSERVATIONAL`. Seroprevalence, anti-AAV-antibody, immunity, epidemiology, natural-history, and registry studies are not product evidence even when their condition or title contains "AAV" (defeats Ultragenyx NCT04909346, Baxalta NCT03185897).
  2. **Condition match:** conditions contain (case-insensitive substring) at least one **canonical AAV indication** AND none of the **disease-AAV exclusion terms**.
  3. **Therapeutic gene-transfer intervention present:** at least one intervention of type `GENETIC` or `BIOLOGICAL` (or a `COMBINATION_PRODUCT` containing one) whose name indicates an AAV / gene-therapy product — contains `aav`, `adeno-associated`, the `-parvovec` stem, `gene therapy`, a vector/serotype token, or a known AAV product name. **Reject** trials whose only interventions are standard-of-care / replacement therapy / placebo / sham / device-only / `OTHER` non-treatment. This clause is the fix for the Pfizer/Ultragenyx false-positive class: a company surfacing only because it runs a trial in an AAV-common disease, while the cited trial is not an AAV product.
  - Canonical AAV indications (29): Hemophilia A; Hemophilia B; Ornithine Transcarbamylase Deficiency; Wilson Disease; Glycogen Storage Disease Type Ia; Von Gierke; Duchenne Muscular Dystrophy; Friedreich's Ataxia; Gaucher Disease; Spinal Muscular Atrophy; Mucopolysaccharidosis (any subtype); Sanfilippo Syndrome; Leber Congenital Amaurosis; Retinitis Pigmentosa; RPE65; Choroideremia; Pompe Disease; Aromatic L-amino acid decarboxylase (AADC) deficiency; Crigler-Najjar; Methylmalonic Acidemia; Phenylketonuria; Hunter Syndrome; Hurler Syndrome; Niemann-Pick; Arrhythmogenic Right Ventricular Cardiomyopathy; Hypertrophic Cardiomyopathy; Heart Failure; Angelman Syndrome; Congenital Adrenal Hyperplasia.
  - Evidence-backed candidate additions (15, clinicaltrials.gov 2026-05-15) are listed in Part 3 "To answer" pending Ellie's offer-fit ruling. They are NOT active in this list. The 29 ship unchanged until she rules. Biggest evidenced gap is CNS: Parkinson's, Alzheimer's, FTD have AAV-vector trials but zero canonical coverage — whether they fit the reagent offer is her call, not a data call.
- **Evidence source rank:** authoritative. Outranks website marketing copy (see disambiguation rule 2).
- **Confidence:** high. A company validated here skips the website vocabulary gate (`pass_l2_validated_skip_web_gate`), which is how mature commercial-stage AAV companies (Spark, BioMarin) whose sites dropped technical vocabulary still pass.

#### Salesforce AAV account tag
- **Consumer:** sourcing, verification
- **Bias:** precision
- **Test:** the company matches an existing Teknova Salesforce account tagged AAV.
- **Evidence source rank:** highest (rank 1 below). Treat as confirmed.
- **Confidence:** high. Auto-add without further source corroboration.

### Negative / exclusion signals

#### Disease-AAV exclusion (the vasculitis homonym)
- **Consumer:** sourcing, verification, classification
- **Bias:** precision
- **Match method:** normalize the condition string before comparison — lowercase, decode HTML entities (`&#39;` → `'`), collapse repeated/missing whitespace, strip punctuation — then test for any variant below. Naive substring matching is insufficient; the two traps that defeat it are the missing-space `EosinphilicGranulomatosis` (NCT02126098) and the HTML-entity apostrophe `Wegener&#39;s` (NCT07176546).
- **Test:** normalized trial conditions contain any of these observed variants (clinicaltrials.gov, 2026-05-15) AND no canonical AAV indication matches:
  - ANCA / antibody forms: `ANCA Associated Vasculitis`, `ANCA-associated Vasculitis`, `ANCA-Associated Vasculitis`, `ANCA-Associated Vasculitis (AAV)`, `ANCA Associated Vasculitis (AAV)`, `ANCA Associated Systemic Vasculitis`, `ANCA Associated Systemic Vasculitis Including Wegener's`, `ANCA-Associated Glomerulonephritis`, `ANCA-IgG-positive ANCA Associated Vasculitis`, `ANCA-associated Vasculitides`, `ANCA-associated Primary Necrotizing Vasculitides`, `Antineutrophilic Cytoplasmic Antibody (ANCA)- Associated Vasculitis (AAV)`, `Antineutrophil Cytoplasmic Antibody-Associated Vasculitis`, `Anti-neutrophil Cytoplasmic Antibody-associated Vasculitis`, `Anti-Neutrophil Cytoplasmic Antibody-Associated Vasculitis`, `Anti-Neutrophil Cytoplasm Antibodies (ANCA) Associated Vasculitis`, `Anti-Neutrophil Cytoplasmic Antibody`, `Antineutrophil Cytoplasmic Antibody Positive Vasculitis`, `Antineutrophil Cytoplasmic Antibody Associated Vasculitis`, `Antineutrophil Cytoplasmic Antibody (ANCA)-associated Nephritis (AAGN)`, `MPO-ANCA Vasculitis`
  - Polyangiitis / Wegener / Churg-Strauss forms: `Granulomatosis With Polyangiitis`, `Granulomatosis With Polyangiitis (GPA)`, `Granulomatosis With Polyangiitis (Wegener's)`, `Granulomatous Polyangiitis`, `Microscopic Polyangiitis`, `Microscopic Polyangiitis (MPA)`, `Eosinophilic Granulomatosis With Polyangiitis`, `EosinphilicGranulomatosis With Polyangiitis`, `Wegener's Granulomatosis`, `Wegener Granulomatosis`, `Wegeners Granulomatosis`, `Churg-Strauss Syndrome`, `Churg Strauss Syndrome`
- **Action on hit:** reject.
- **Adjudication status (machine-resolved, pending ratification — see Part 3 R1/R2):** Amgen (NCT05984251, avacopan), Fate Therapeutics (NCT06308978, FT819 iPSC), and Nkarta (NCT06733935, NKX019 NK-cell) were confirmed genuine vasculitis-disease sponsors with zero AAV-vector trials — correctly excluded. Novartis Pharmaceuticals and Mitsubishi Tanabe Pharma are unresolved: sponsor-name aliasing returned no usable data (Tanabe 0 results under that string; Novartis AAV work sits under AveXis / Novartis Gene Therapies). An alias re-query is required before a verdict — open machine task, not an expert question (Part 3 M1).

#### Wrong-modality exclusion tokens
- **Consumer:** classification
- **Bias:** precision
- **Test:** in the absence of an AAV anchor, fetched content contains a modality token paired with at least one context word (`therapeutic`, `therapeutics`, `pipeline`, `drug`, `platform`, `program`, `candidate`, `medicine`):
  - `lentiviral`: lentiviral, lentivirus
  - `peptide`: peptide
  - `small_molecule`: small molecule
  - `rna_editing`: rna editing, mrna therap, sirna, crispr, base editing, prime editing
  - `autologous_cell`: autologous cell, car-t, car t-cell, ipsc
  - `non_viral`: non-viral delivery, lipid nanoparticle, lnp, ctdna
- **Action on hit:** reroute:<detected modality> (see re-route mapping).

#### Parent-company / tools-vendor domain
- **Consumer:** verification
- **Bias:** precision
- **Test:** the record's domain matches a maintained parent-company / tools-vendor domain list (the seven biggest tools vendors and known acquirer parents; verbatim list is held in the detection node constant — see open question Q3).
- **Action on hit:** queue-for-review as `needs_data_quality_review`, reason: domain points to a parent / tools vendor, not the operating entity; manually verify and correct the Domain field.

### Disambiguation rules

Ordered. Higher rules win on conflict.

1. **Parent-company domain short-circuit.** If the domain matches the parent-company / tools-vendor list, route to `needs_data_quality_review` immediately. Do not run the modality fetch; do not resolve the record to the parent entity. A clinical-trial sponsor or operating biotech is the target, never its holding company or its tools supplier.
2. **Qualifying trial evidence outranks marketing copy.** If CT.gov L2 validated AAV via a trial passing **all three clauses** of the CT.gov trial evidence test (interventional + canonical condition + therapeutic gene-transfer intervention), skip the website vocabulary gate and pass. A condition-only or title-only match does NOT qualify and does NOT outrank anything — the "company runs an AAV program" claim requires clause 3. Mature commercial-stage AAV companies move past technical vocabulary on their public sites; a *qualifying* trial record is more authoritative than the homepage.
3. **Active pipeline over graveyard.** Machine-default (pending ratification, Part 3 R4): a sponsor is **dormant** if it has no interventional trial with a start or last-update date in the last 5 years AND no trial in `Recruiting` / `Active, not recruiting` / `Enrolling` status. Dormant sponsors do not get the high-confidence trial-evidence pass; they route to review. Confirmed dormant on CT.gov 2026-05-15: Tacere Therapeutics (last NCT02315638, 2014, TERMINATED), Avigen (last AAV NCT00076557, 2004, TERMINATED), Ceregene (last NCT00400634, 2006, COMPLETED), Neurologix (last NCT01301573, 2011, TERMINATED). The 5-year threshold itself is a commercial-weight call for Ellie (Part 3 Q4) — the per-company dormancy facts are machine-resolved.
4. **Disease-AAV reject.** If a disease-AAV exclusion term is present and no canonical indication matches, reject. The vasculitis homonym is out of scope regardless of any other AAV-looking signal.
5. **Gene-therapy-branded fallback.** If gene-therapy branding is present (`gene therapy`, `gene therapies`, `genetic medicine(s)`, `cell and gene therap`, `gene and biologic therap`, `gene-to-cell`, `cell-and-gene`) but no AAV anchor or mechanism term, route to `needs_aav_review` (low confidence) — likely an AAV biotech that does not name the modality publicly, surfaced for manual confirmation, not auto-rejected.

### Evidence hierarchy

Source trust order, highest first. Used by the source-conflict tiebreaker.

1. **Existing Teknova Salesforce account tagged AAV.** Confirmed.
2. **Company's own website** (pipeline / About / platform pages). Source of truth on live modality.
3. **Web-search-grounded summary** (Exa, Perplexity). Surface here, then verify on the website.
4. **Paid firmographic database industry tag** (Explorium NAICS / industry). Lowest. Establishes "is a biotech"; cannot distinguish AAV from any other modality. Never the sole source for adding to the AAV list.

(Note: CT.gov trial evidence is treated as authoritative for the *modality* question per disambiguation rule 2, parallel to and in tension with website rank — when both exist and disagree, trial evidence wins on whether the company runs an AAV program; website wins on current public positioning.)

### Confidence routing

- **High** — Salesforce AAV tag, OR CT.gov L2 trial-evidence validated, OR confirmed by ≥2 independent sources (e.g. website + Exa): auto-add / `enrichment_complete`, proceeds to deep enrichment.
- **Medium** — confirmed by a single trusted source (website only, or single web-search summary): queue for Ellie's review before enrichment spend.
- **Low / no web content / gene-therapy-branded-no-AAV-terms:** `needs_aav_review` — manual confirmation (Phase E).
- **Parent-company domain hit:** `needs_data_quality_review` — correction queue with a specific reason string.
- **Wrong modality:** `rerouted_wrong_modality` — tagged and held in the alt-play pool, excluded from this cohort.
- **Failed Stage 1 (industry / geography) or unmatched with no recoverable web signal:** `archived_out_of_industry`.

### Re-route mapping (non-AAV but legitimate biotech → alt-play pool)

| Detected modality | Alt-play / pitch direction |
|---|---|
| Lentiviral | Reagent-readiness pitch, viral-vector framing without AAV-specifics |
| Peptide therapeutics | Tools provider / nextgen antibody play |
| Small molecule | Hold, no current pitch |
| RNA editing | Hold, no current pitch |
| mRNA therapeutics | Hold, possible LNP-reagent angle later |
| Autologous cell therapy | Cell therapy reagent pitch |
| Allogeneic cell therapy | Cell therapy reagent pitch |
| Non-viral delivery | Hold |
| Antibody / biologic | Hold |
| CRISPR / gene editing (non-viral) | Hold |
| Epigenetic | Hold |
| Vaccine | Hold |
| Diagnostic / research tools only | Archive, no fit |

"Hold" means tagged and stored, not pitched. The pool surfaces when one modality bucket crosses 50 companies, or when a new alt-play queries it for fit. Weekly surfacing was rejected as noise.

### Edge-case disqualifiers (archive, do not re-route)

- Wholly-owned subsidiary of a top-20 global pharma (parent dictates CMC supply chain — e.g. AveXis under Novartis).
- All programs pre-clinical discovery with no clinical track (no IND-anchored pitch window).
- All programs past Phase II at commercial scale (different conversation, different products).
- Headquarters outside US or Canada.
- Headcount above 2,000 full-time employees and not a CDMO.

### Auto-add vs queue (sourcing gate, recall-biased)

- Confirmed by Salesforce tag → auto-add.
- Confirmed by two or more sources (e.g. website + Exa) → auto-add.
- Confirmed by a single source → queue for Ellie's review before enrichment runs.

Most legitimate AAV companies appear across multiple sources. Single-source surfacing is where most mistakes happen. Sourcing casts wide (recall); the precision gates above narrow.

---

## Part 3 — Provenance and versioning

The loop maintaining Parts 1 and 2: open question → evidence resolution (close what data closes, with provenance) → expert review pack (ratify + answer) → synthesis → version bump → change log. The expert is an optimizer, not a gate: this list ships at current quality regardless of reply latency.

### Change log

Append-only. The liability record: every rule influencing client-facing data traces here to expert approval or evidence-plus-ratification. Also the regression-recovery record.

| Version | Date | What changed | Why | Source / evidence | Resolution | Ratified by |
|---|---|---|---|---|---|---|
| 1 | 2026-05-07 | Initial segment criteria (Part 1 only). | First articulation of the AAV play target. | Jenn/Ellie intake; 2026-05-07 Clay pass. | expert-resolved | Jenn, Ellie (working docs) |
| 2 | 2026-05-15 | Absorbed modality taxonomy + detection node (gate v1.6.0) into Part 2; restructured to schema. No Part 1 rule changed. | Detection logic was scattered across three unsynced files and could drift. | `criteria-artifact.md`; `revops-modality-taxonomy-*`; `ellie-aav-classification-rules-2026-05-12.md`; `node-check-aav-modality.js`. | machine-resolved (synthesis) | pending ratification |
| 3 | 2026-05-15 | Disease-AAV exclusion expanded to 35 observed variants + normalized match method (HTML-entity + missing-space traps). Dormancy rule made concrete (5yr + status). Amgen/Fate/Nkarta confirmed correctly excluded. 15 candidate indications staged for Ellie (not applied). 29 canonical unchanged. | Evidence-resolution pass: filter bug fixes ship now; offer-scope expansion is Ellie's call, proposed not applied. | clinicaltrials.gov API v2, 2026-05-15; evidence report `practices/agentic-systems/artifacts/aav-evidence-resolution-2026-05-15.md` (NCT-cited). | machine-resolved | pending ratification |
| 4 | 2026-05-18 | CT.gov trial evidence test made a 3-clause gate (R5): interventional study type + canonical condition + therapeutic gene-transfer intervention. Disambiguation rule 2 conditioned on a qualifying trial. | Manual ground-truth validation of all 35 surfaced companies against live clinicaltrials.gov records found a false-positive class: condition-only matching surfaced companies whose cited trial is not an AAV product (Pfizer standard-of-care, Ultragenyx/Baxalta antibody-seroprevalence). 28/35 confirmed, 2 not confirmed, 5 needs-review. | clinicaltrials.gov API v2, 2026-05-18; per-record evidence written to Companies `Verification Verdict` / `Verification Evidence` / `Verification Checked At`. | machine-resolved | pending ratification |
| 5 | 2026-05-18 | No Part 1 or Part 2 rule changed. Part 1 contact-layer demographic filters (function, seniority, title, residual) projected into 19 `persona_*` rows in Classification Rules (`tbl1HFYzezFYs5C3k`). Company hard filters, contact-company alignment, soft signals, and all other disqualifiers were deliberately NOT projected (owned by L2 / employer-verify / scoring layer). | The contact-sourcing workflow (`bYZ0sAzyUvU60wMZ`) consumes persona rows as its ICP input. Recorded here to close the provenance loop: the derived projection traces to this artifact without re-authoring it. | Contact-layer persona projection contract, 5 invariants (`project_teknova_l2_state_and_deferred.md`); Explorium fetch-prospects fixed enum schema; row IDs + line-by-line mapping in `practices/revops/workflows/PROPOSAL-persona-projection-teknova-aav.md`. | machine-resolved (projection); contract confirmed by Nick 2026-05-18 | pending ratification |

### Expert review queue

Signals are not instructions. Two kinds reach Ellie in the next review pack.

**To ratify** (machine-resolved, live now, default-accept on silence):

- **R1** (2026-05-15, CT.gov): disease-AAV exclusion expanded to 35 literal variants + normalized matching. Fixes the substring-bypass bug. Status: pending.
- **R2** (2026-05-15, CT.gov NCT05984251 / NCT06308978 / NCT06733935): Amgen, Fate, Nkarta are genuine vasculitis-disease sponsors, correctly excluded. Status: pending.
- **R4** (2026-05-15, CT.gov): Tacere, Avigen, Ceregene, Neurologix confirmed dormant (NCT-cited); dormant→review rule active at a 5-year default. Status: pending.
- **R5** (2026-05-18, CT.gov): CT.gov trial evidence is now a 3-clause gate (interventional + canonical condition + therapeutic gene-transfer intervention). Ground-truth check of all 35 surfaced companies confirmed the condition-only bug: Pfizer (NCT03587116, standard-of-care replacement) and Ultragenyx (NCT04909346, anti-AAV antibody study) were false positives; Baxalta (NCT03185897 seroprevalence) is a defunct-entity needs-review. 28 confirmed true AAV. Per-record proof in Companies verification fields. Status: pending.

**To answer** (expert judgment required, no data substitute — list ships without these):

- **Q1** (2026-05-15): the 29 canonical indications ship unchanged. Confirm still current, or correct. Status: open.
- **Q4** (2026-05-15): per-company dormancy is machine-resolved; the 5-year threshold is a commercial-weight call. Confirm 5 years or set your number. Status: open.
- **Q5** (2026-05-15): how you bucket AAV companies (pure-play / vector platform / big-pharma program / academic spinout / discovery-stage) and which matter most to the pitch. Not derivable from data. Status: open.
- **Q6** (2026-05-15, CT.gov): 15 evidence-backed candidate indications, biggest gap CNS (Parkinson's, Alzheimer's, FTD — AAV-vector trials confirmed, zero canonical coverage). Do these fit the reagent offer? Rows 1–5 multi-sponsor, rows 6–15 single-trial. Offer-fit is yours. Status: open.

**Open machine tasks** (not expert questions):

- **M1** (2026-05-15): Mitsubishi Tanabe and the Novartis corporate group (AveXis / Novartis Gene Therapies) need a sponsor-alias re-query before a keep/exclude verdict. Status: open.
- **M2** (was Q3): parent-company / tools-vendor domain list referenced by the detection node not yet extracted verbatim into this artifact. Pull from the node constant. Status: open.
