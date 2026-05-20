# ClinicalTrials.gov AAV Discovery: First Run Summary

**Date:** 2026-05-12
**Source:** clinicaltrials.gov API v2, query `query.intr=AAV`
**For:** Ellie review and feedback
**Total companies found:** 35 unique industry sponsors of AAV clinical trials

---

## What this is

We queried the US federal clinical trials registry for every trial that uses AAV (adeno-associated virus) as an intervention. The API returned ~1,000+ studies. We filtered to industry-sponsored trials only (not academic/NIH), verified "AAV" appears in the intervention or title text, and deduplicated by company name. This produced 35 unique companies that are actively sponsoring or have recently sponsored AAV gene therapy clinical trials.

This is the first of several canonical sources. Patents, industry directories, and PubMed come next. Each additional source will either confirm companies already found (increasing confidence) or surface new ones.

---

## By clinical phase

### Phase 3 (5 companies)
These have AAV programs at or near registration. Likely past the IND-prep sweet spot for the reagent pitch, but worth knowing.

| Company | Lead Indication | Trials |
|---|---|---|
| Ultragenyx Pharmaceutical | Ornithine Transcarbamylase Deficiency | 4 |
| Solid Biosciences | Friedreich's Ataxia | 2 |
| Spur Therapeutics | Gaucher Disease Type 1 | 1 |
| CSL Behring | Hemophilia B | 1 |
| Pfizer | Hemophilia A | 1 |

### Phase 2 (18 companies)
The core of the target zone. Active clinical programs, likely scaling manufacturing, likely making reagent decisions.

| Company | Lead Indication | Trials |
|---|---|---|
| Beacon Therapeutics | X-Linked Retinitis Pigmentosa | 4 |
| 4D Molecular Therapeutics | Cystic Fibrosis Lung | 3 |
| BioMarin Pharmaceutical | Hereditary Angioedema | 2 |
| Nanoscope Therapeutics | Retinitis Pigmentosa | 2 |
| Tenaya Therapeutics | Arrhythmogenic Right Ventricular Cardiomyopathy | 2 |
| Shanghai Vitalgen BioPharma | Bietti Crystalline Dystrophy | 2 |
| Ascidian Therapeutics | Stargardt Disease | 1 |
| Intellia Therapeutics | Lung Disease | 1 |
| Lexeo Therapeutics | Alzheimer Disease | 1 |
| MeiraGTx UK II Ltd | Achromatopsia | 1 |
| UniQure Biopharma B.V. | Huntington's Disease | 1 |
| Adrenas Therapeutics | Congenital Adrenal Hyperplasia | 1 |
| Cartesian Therapeutics | Childhood-onset SLE | 1 |
| Vivet Therapeutics SAS | Wilson's Disease | 1 |
| NGGT (Suzhou) Biotechnology | Bietti Crystalline Corneoretinal Dystrophy | 1 |
| Elpida Therapeutics SPC | Spasticity, Muscle | 1 |
| Trogenix ltd | Glioblastoma | 1 |
| MavriX Bio | Angelman Syndrome | 1 |

### Phase 1 (8 companies)
Earlier stage. Approaching or just past IND. Potentially the tightest fit for the reagent-readiness pitch.

| Company | Lead Indication | Trials |
|---|---|---|
| Chengdu Origen Biotechnology | Age-Related Macular Degeneration | 2 |
| Spark Therapeutics | Leber Congenital Amaurosis | 1 |
| Rocket Pharmaceuticals | Dilated Cardiomyopathy | 1 |
| Genzyme, a Sanofi Company | Parkinson's Disease | 1 |
| GeneCraft Inc. | Non-Small Cell Lung Cancer | 1 |
| InnoVec Biotherapeutics | Retinoschisis | 1 |
| YAP Therapeutics | Heart Failure | 1 |
| Life Biosciences | Open Angle Glaucoma | 1 |

### Preclinical (1 company)
| Company | Lead Indication | Trials |
|---|---|---|
| Baxalta now part of Shire | Hemophilia A | 1 |

### Collaborators (no lead trial, captured as co-sponsors)
| Company | Trials |
|---|---|
| Janssen Research & Development | 1 |
| Avigen | 1 |
| Bayer | 1 |

---

## Indication clusters

The AAV universe clusters heavily around a few therapeutic areas:

- **Ophthalmology / inherited retinal disease:** Beacon, 4D Molecular, Nanoscope, MeiraGTx, Ascidian, InnoVec, Life Biosciences, Chengdu Origen, NGGT, Shanghai Vitalgen (~10 companies)
- **Hemophilia / blood disorders:** BioMarin, Pfizer, CSL Behring, Bayer, Avigen, Baxalta (~6 companies)
- **Neurology / neuromuscular:** Solid Biosciences, UniQure, Lexeo, Genzyme/Sanofi (~4 companies)
- **Cardiac:** Tenaya, Rocket, YAP Therapeutics (~3 companies)
- **Metabolic / rare disease:** Ultragenyx, Spur, Adrenas, Vivet (~4 companies)
- **Other:** Intellia, GeneCraft, Cartesian, MavriX, Trogenix, Elpida (~6 companies)

Ophthalmology is the largest cluster by far. Ellie should know: are retinal gene therapy companies using the same reagent workflow as systemic AAV programs? If yes, this is a rich target zone. If no, the pitch needs a different angle for this subgroup.

---

## Issues to flag for Ellie

### Companies that need filtering out (per segment criteria)

**Non-NA headquartered (hard filter: US/Canada only):**
- Shanghai Vitalgen BioPharma (China)
- Chengdu Origen Biotechnology (China)
- NGGT (Suzhou) Biotechnology (China)
- Trogenix ltd (UK)
- Vivet Therapeutics SAS (France)
- Elpida Therapeutics SPC (likely non-NA)
- MeiraGTx UK II Ltd (UK, but has US operations... needs check)

**Big pharma / >2,000 employees (hard filter):**
- Pfizer
- Bayer
- CSL Behring
- Janssen Research & Development (J&J subsidiary)
- Genzyme, a Sanofi Company

**Acquired or operationally absorbed (disqualifier):**
- Baxalta now part of Shire (now Takeda)
- Spark Therapeutics (acquired by Roche)
- Avigen (acquired years ago, likely inactive)

### After filtering: ~18-22 companies likely in scope

Removing the above categories leaves roughly 18-22 NA-based, independent, small-to-mid AAV companies in the Phase 1-3 range. That's from ONE source. Patents and industry directories will add more.

---

## Questions for Ellie

1. **Ophthalmology cluster:** Are retinal AAV companies (intravitreal/subretinal delivery) using the same buffers and reagent workflow as systemic AAV programs? Does the pitch land the same way?

2. **Phase 3 companies:** Are Ultragenyx, Solid Biosciences, and Spur still in the reagent-decision window, or have they locked in GMP suppliers? Worth reaching out anyway?

3. **Name recognition:** Which of these 35 companies does Ellie already know? Which are surprising? That reaction tells us how much discovery value this source is adding vs confirming what's already known.

4. **Missing companies:** Are there AAV companies Ellie expected to see here that are missing? That tells us what the other canonical sources need to catch.

---

## What happens next

- This list gets cross-referenced against patents (Phase 2) and Salesforce existing records (Phase 3)
- Companies confirmed by 2+ sources get promoted from "candidate" to "canonical"
- The existing gate workflow verifies each canonical company is still active, NA-located, and showing AAV on their website
- Contacts get sourced only after the canonical universe is verified
