# AAV Evidence Resolution — clinicaltrials.gov

Source: clinicaltrials.gov API v2. Generated 2026-05-15. Every claim cites NCT IDs.

## 1. Disease List Expansion (proposed additions, not in the 29 canonical)

Ranked by distinct AAV-vector trials supporting each. Each is an interventional trial with an AAV-vector intervention string.

| # | Indication | # trials | Example NCT(s) | Sponsor / intervention |
|---|---|---|---|---|
| 1 | Parkinson's Disease | 5+ | NCT01621581, NCT00643890, NCT05603312 | NINDS (AAV2-GDNF); Neurologix (AAV-GAD); MeiraGTx (AAV-GAD) |
| 2 | Alzheimer's Disease | 3 | NCT00087789, NCT05040217, NCT00876863 | Sangamo/Ceregene (CERE-110 AAV-NGF); Tuszynski (AAV2-BDNF) |
| 3 | Achromatopsia | 3 | NCT03001310, NCT03758404, NCT03278873 | MeiraGTx (AAV-CNGB3 / AAV-CNGA3) |
| 4 | Canavan Disease | 2 | NCT04833907, NCT04998396 | Myrtelle (rAAV-Olig001-ASPA); Aspa Tx (AAV9 BBP-812) |
| 5 | Frontotemporal Dementia (FTD / FTD-GRN) | 1 | NCT06064890 | AviadoBio (intrathalamic AAV.PGRN / AVB-101) |
| 6 | Cardiomyopathy — non-HCM/ARVC (cardiomyopathies, cardiac hypertrophy, myocardial fibrosis) | 1 | NCT05302271 | Weill Cornell (AAVrh.10hFXN) — Friedreich cardiomyopathy |
| 7 | Dilated Cardiomyopathy (DCM) | 1 | NCT07137338 | Rocket Pharmaceuticals (RP-A701, AAV) |
| 8 | Tay-Sachs / Sandhoff (GM2 gangliosidosis) | 1 | NCT04669535 | Flotte (AXO-AAV-GM2) |
| 9 | LCA5 (distinct from LCA/RPE65 generic) | 1 | NCT05616793 | Opus Genetics (AAV8.hLCA5) |
| 10 | Cystic Fibrosis | 1 | NCT00004533 | NIDDK (AAV-CFTR vector) |
| 11 | Homozygous Familial Hypercholesterolemia | 1 | NCT02651675 | REGENXBIO (AAV hLDLR) |
| 12 | Menkes Syndrome | 1 | NCT05507996 | Kunming Hope of Health (rAAV) |
| 13 | X-linked Retinoschisis | 1 | NCT02317887 | VegaVect (RS1 AAV vector) |
| 14 | Age-related Macular Degeneration | 1 | NCT05984927 | Elisigen (NG101 AAV) |
| 15 | Age-related Muscle Decline (sarcopenia) | 1 | NCT07443826 | Unlimited Biotech (AAV9-Follistatin) |

High-confidence additions: rows 1–5 (multiple sponsors or marquee programs). Rows 6–15 are single-trial; treat as candidates pending Ellie review. Parkinson's, Alzheimer's, FTD are large CNS categories the canonical list omits entirely — likely the biggest coverage gap.

## 2. Five-Company Adjudication

| Company | Verdict | Evidence |
|---|---|---|
| **Amgen** | vasculitis-AAV (exclude) — no AAV vector | NCT05984251 cond "Vasculitis; SLE", intr CCX168 (avacopan)/Placebo. Zero AAV-vector trials across 264 sponsored studies. |
| **Novartis Pharmaceuticals** | neither (under this exact sponsor name) | 333 trials under "Novartis Pharmaceuticals"; no vasculitis-condition and no AAV-vector trials matched. See uncertainty note — Novartis AAV work sits under other legal entities. |
| **Mitsubishi Tanabe Pharma** | no data under this sponsor string | `query.spons=Mitsubishi Tanabe Pharma` returned 0. Needs alias retry ("Tanabe", "Mitsubishi Tanabe Pharma America"). Cannot adjudicate from current data. |
| **Fate Therapeutics** | vasculitis-AAV (exclude) — iPSC cell therapy, not vector | NCT06308978 cond "Antineutrophilic Cytoplasmic Antibody (ANCA)- Associated Vasculitis (AAV); IIM; SSc; SLE; LN", intr FT819/Flu/Cy/Benda. AAV here = the disease. No AAV-vector trials in 24 studies. |
| **Nkarta** | vasculitis-AAV (exclude) — NK cell therapy | NCT06733935 cond "Antineutrophil Cytoplasmic Antibody-Associated Vasculitis; SSc; IIM", intr NKX019/Flu/Cy. No AAV-vector trials in 4 studies. |

Bottom line: Amgen, Fate, Nkarta are genuine vasculitis-disease companies — correctly excluded. Their condition strings ("Antineutrophilic Cytoplasmic Antibody (ANCA)- Associated Vasculitis (AAV)" etc.) are exactly the variants that slip a naive "AAV" substring filter. Novartis/Tanabe inconclusive under the queried sponsor names — see scope.

## 3. ANCA-Vasculitis Spelling Variants (literal strings observed, one NCT each)

Disease-AAV exclusion list — expand the filter to match these exact condition strings:

- ANCA Associated Vasculitis — NCT06548607
- ANCA-associated Vasculitis — NCT02126098
- ANCA-Associated Vasculitis — NCT06978738
- ANCA-Associated Vasculitis (AAV) — NCT07526350
- ANCA Associated Vasculitis (AAV) — NCT07168161
- ANCA Associated Systemic Vasculitis — NCT07305116
- ANCA Associated Systemic Vasculitis Including Wegener's — NCT00307645
- ANCA-Associated Glomerulonephritis — NCT05969522
- ANCA-IgG-positive ANCA Associated Vasculitis — NCT06590545
- ANCA-associated Vasculitides — NCT02433522
- ANCA-associated Primary Necrotizing Vasculitides — NCT02117453
- Antineutrophilic Cytoplasmic Antibody (ANCA)- Associated Vasculitis (AAV) — NCT06308978
- Antineutrophil Cytoplasmic Antibody-Associated Vasculitis — NCT06733935
- Antineutrophil Cytoplasmic Antibody-associated Vasculitis — NCT07388277
- Anti-neutrophil Cytoplasmic Antibody-associated Vasculitis — NCT05988021
- Anti-Neutrophil Cytoplasmic Antibody-Associated Vasculitis — NCT06350110
- Anti-Neutrophil Cytoplasm Antibodies (ANCA) Associated Vasculitis — NCT06388941
- Anti-Neutrophil Cytoplasmic Antibody — NCT00301652
- Antineutrophil Cytoplasmic Antibody Positive Vasculitis — NCT07556484
- Antineutrophil Cytoplasmic Antibody Associated Vasculitis — NCT05702983
- Antineutrophil Cytoplasmic Antibody (ANCA)-associated Nephritis (AAGN) — NCT06656962
- MPO-ANCA Vasculitis — NCT00405860
- Granulomatosis With Polyangiitis — NCT03919435
- Granulomatosis With Polyangiitis (GPA) — NCT03895801
- Granulomatosis With Polyangiitis (Wegener's) — NCT02967068
- Granulomatous Polyangiitis — NCT06350110
- Microscopic Polyangiitis — NCT02126098
- Microscopic Polyangiitis (MPA) — NCT03895801
- Eosinophilic Granulomatosis With Polyangiitis — NCT00315380
- EosinphilicGranulomatosis With Polyangiitis [sic, no space] — NCT02126098
- Wegener's Granulomatosis — NCT00753103
- Wegener Granulomatosis — NCT03919435
- Wegeners Granulomatosis — NCT01446211
- Wegener&#39;s [HTML-entity apostrophe] — NCT07176546
- Churg-Strauss Syndrome — NCT00006055
- Churg Strauss Syndrome — NCT00716651

Two filter traps worth flagging: the missing-space "EosinphilicGranulomatosis" (NCT02126098, also a misspelling) and the HTML-entity apostrophe "Wegener&#39;s" (NCT07176546). A substring or normalized matcher must handle both.

## 4. Dormant Check

| Sponsor | Most recent trial | Status | Verdict |
|---|---|---|---|
| Tacere Therapeutics | NCT02315638, start 2014-11 | TERMINATED (HCV, TT-034) | **Dormant** — no activity since 2014; both trials dead/done |
| Avigen | NCT00532532 / NCT00576277, start 2007-09 / 2006-09 | TERMINATED / COMPLETED | **Dormant** — last AAV trial NCT00076557 (Hemophilia B, 2004, TERMINATED); pivoted off gene therapy then inactive |
| Ceregene | NCT00400634, start 2006-11 | COMPLETED | **Dormant** — newest trial 2006; all CERE-110/CERE-120 AAV trials COMPLETED, none recent |
| Neurologix | NCT01301573, start 2011-01 | TERMINATED | **Dormant** — last trial 2011, TERMINATED; AAV-GAD Parkinson's program defunct |

All four confirmed dormant. No post-2014 trial activity for any; all most-recent trials are TERMINATED or long-COMPLETED. No other clearly-dormant sponsors surfaced beyond these in the queried set.

## Scope and Uncertainty

**Queried:** `query.intr` for adeno-associated virus, rAAV, AAV2/5/8/9, AAVrh10; `query.term` "adeno-associated virus gene therapy" + INTERVENTIONAL filter; `query.spons` for the 5 adjudication + 4 dormant sponsors; `query.cond` for ANCA/polyangiitis/vasculitis. Vector confirmation = regex on intervention strings for aav/raav/scaav/adeno-associated.

**Not covered / limits:**
- **Not exhaustive.** Result paging was capped (~6–8 pages/query, ~600 studies max). High-volume terms truncate; single-trial D1 rows especially under-counted. Treat counts as lower bounds.
- **Sponsor-name aliasing is a real gap.** Mitsubishi Tanabe returned 0 under the exact string — almost certainly an alias problem, not absence of trials. Novartis AAV programs run under entities other than "Novartis Pharmaceuticals" (e.g., AveXis/Novartis Gene Therapies, the Zolgensma SMA sponsor) and would not appear here. Novartis "neither" verdict is scoped strictly to the queried sponsor string, not the corporate group.
- **Vector detection is string-based.** Trials describing the AAV vector only in protocol text (not the intervention name) are missed. Conversely, "AAV" in a condition = the disease and is correctly excluded from vector counts.
- **D1 condition rollup is literal.** clinicaltrials.gov does not normalize condition synonyms; "FTD", "FTD-GRN", "Frontotemporal Dementia" are one disease split across rows. Counts undercount true per-disease support.

**Ellie's judgment still required:**
- Whether CNS indications (Parkinson's, Alzheimer's, FTD) belong in the canonical AAV list or are scoped out by reagent-fit — data shows the trials exist; relevance to the offer is a domain call.
- Single-trial D1 rows (6–15): real but thin; Ellie decides if one program justifies a canonical entry.
- Mitsubishi Tanabe and the Novartis corporate group need an alias re-query before a final keep/exclude verdict.
