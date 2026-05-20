# Company Discovery Summary: aav-gene-therapy-ellie-outreach

**Date:** 2026-05-08
**Play:** PLAY-006 AAV Gene Therapy — Ellie Outreach
**Segment criteria:** `revops-segment-aav-gene-therapy-ellie-outreach.md`
**Output CSV:** `revops-discovery-aav-gene-therapy-ellie-outreach.csv`

---

## Totals

| Metric | Count |
|--------|------:|
| Total companies (post-dedup) | 107 |
| Already in play (existing_in_play) | 54 |
| Net new from discovery | 53 |
| Disqualified at discovery | 15 |
| **Net new addressable** | **49** |
| Estimated net new contacts (2-3/co) | 98–147 |

Pre-discovery play size was 54 companies (all from Salesforce, not a TAM search). Discovery expanded the universe by **98%** — consistent with the handoff estimate of 2-3x.

---

## By provider

| Provider | Companies found | Unique to this provider | Cost |
|----------|----------------:|------------------------:|------|
| Supabase (existing play) | 54 | 54 (baseline) | $0 |
| Exa (4 queries) | 42 | ~22 vs. Supabase | $0 (subscription) |
| Explorium (1 search) | 100 | ~31 vs. Supabase+Exa | $0 (0 credits used) |
| Perplexity research | ~10 | ~4 vs. other sources | $0 (subscription) |
| clinicaltrials.gov | Covered via Perplexity | — | $0 |
| **Total session spend** | | | **$0** |

Explorium pricing confirmed: `fetch-businesses` and `fetch-businesses-statistics` both returned 0 credits used. Credits balance (1,703) unchanged.

---

## Disqualified at discovery (15 total)

11 were already disqualified in Supabase from prior enrichment. 4 are new:

| Company | Domain | Reason |
|---------|--------|--------|
| Spirovant Sciences Inc | spirovant.com | Top-pharma subsidiary: Sumitomo Pharma |
| rAAVen Therapeutics | raaven.se | Non-US/CA: Sweden |
| Zhongmou Therapeutics | zmtherapeutics.com | Verify: likely China-based |
| uBriGene Biosciences Inc | ubrigene.com | Verify: likely China-based CDMO |

Two others flagged for manual verification before enrichment:
- **Coave Therapeutics** (coavetx.com): 36 employees, HQ unclear — may be France
- **Forge Biologics** (forgebiologics.com): Ajinomoto (Japanese food/chemical company) subsidiary — not top-20 pharma, already in play. Keep unless client calls otherwise.

---

## Net new addressable companies (49)

Highlights by source confidence (source_count ≥ 2 = higher confidence):

**Multi-source (appeared in 2+ providers):**
- Apertura Gene Therapy (aperturagtx.com) — NY, 12 emp
- PackGene Biotech Inc (packgene.com) — Houston TX, 42 emp, AAV CDMO
- Remedium Bio (remedium-bio.com) — 15 emp
- Siren Biotechnology (sirenbiotechnology.com) — SF CA, 9 emp
- VVector Bio (vvectorbio.com) — Montreal CA, 4 emp
- Vironexis Biotherapeutics (vironexis.com) — CA, 14 emp
- nVector Inc (nvector.com) — Scottsdale AZ, 3 emp
- Latus Bio (latusbio.com) — Philadelphia PA, $97M Series A (Perplexity + Explorium)
- AAVnerGene Inc (aavnergene.com) — Rockville MD, 6 emp

**Notable single-source (high clinical signal from Perplexity):**
- Myrtelle Inc (myrtellegtx.com) — Phase 1/2 clinical, Canavan disease, FDA RMAT + START designations
- Nanoscope Therapeutics (nanoscopetech.com) — Phase 2 clinical, vision restoration, Dallas TX
- MeiraGTx (meiragtx.com) — Phase 2/3, Parkinson's, NY operations, $430M JV funded
- SpliceBio (splice.bio) — Phase 1/2 ASTRA trial, Stargardt, $135M Series B June 2025

**Canadian candidates (5):**
Biogate Laboratories (BC), COSCIENS Biopharma (ON), Genvira Biosciences (ON), Helix Biopharma (ON), Incisive Genetics (BC), Inspire Biotherapeutics (CA), Medicenna Therapeutics (ON), Quantum BioPharma (ON), VVector Bio (QC)

---

## What discovery does NOT confirm

These are discovery-time signals only. Before any company enters the enrichment pipeline:
- Modality must be confirmed AAV-specific (not just gene therapy broadly)
- Clinical stage must be verified (preclinical through Phase II)
- Subsidiary status must be verified
- Headcount must be verified for VP-cap rule

The enrichment spec (`revops-enrichment-spec-aav-gene-therapy-ellie-outreach.md`) governs those checks. Do not treat discovery output as enrichment-complete.

---

## Next steps

1. **Queue 49 net-new companies for enrichment** — run Clay company-classify first (cheap, high reject rate) to kill non-AAV false positives before spending on contacts.
2. **Verify 4 flagged companies** before enrichment: Coave (France?), Zhongmou, uBriGene, Forge (Ajinomoto call).
3. **Contact sourcing** — for existing 16 zero-contact surviving companies, run in parallel with new company classification.
4. **Why-now signal fill** — fund/leadership/conference signals still 0/44 on existing companies. Run after classification pass.
