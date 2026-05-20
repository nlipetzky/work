# PLAY-006 — Step 1 + Step 3 results

**Date:** 2026-05-07
**Steps applied in parallel:** stale-employment suppression (Step 1) + company classification (Step 3).

---

## Step 1 — stale-employment suppression

| Metric | Value |
|---|---:|
| Contacts disqualified (`enrichment_status='disqualified'`, `enrichment_failed_check='role_status'`) | 81 |
| Companies touched | 34 |
| Companies that dropped to 0 active contacts | 12 |
| Companies still with ≥1 active contact | 34 |
| Active contacts surviving | 86 (down from 174 baseline) |

---

## Step 3 — company classification

Applied via SQL on all 46 companies. Classifications fall into four buckets:

### Bucket A — fully surviving (modality_confirmed=true, status=active): 9 companies, 23 active contacts

| Company | Type | Parent | Active contacts |
|---|---|---|---:|
| AskBio Inc | biopharma | Bayer AG | 5 |
| ElevateBio | cdmo | — | 4 |
| Forge Biologics | cdmo | Ajinomoto Bio-Pharma | 4 |
| Akouos | biopharma | Eli Lilly | 3 |
| Andelyn Biosciences | cdmo | — | 3 |
| Virovek | cdmo | — | 2 |
| Genezen Laboratories | cdmo | — | 1 |
| Prevail Therapeutics | biopharma | Eli Lilly | 1 |
| Spark Therapeutics, Inc | biopharma | Roche | 0 |

5 of these are subsidiaries of top-20 pharma. Per the segment's hard filter, subsidiaries are excluded UNLESS they operate independent CMC. That decision is per-company and Jenn's call. If all 5 subsidiaries get suppressed by the rule, surviving companies drop to 4 (ElevateBio, Andelyn, Virovek, Genezen — all CDMOs) with 10 contacts.

### Bucket B — disqualified (acquired/defunct): 5 companies, 6 contacts dropped

| Company | Status | Reason |
|---|---|---|
| Astellas Gene Therapies | acquired | Astellas subsidiary; brand no longer monitored. (5 active contacts dropped) |
| Audentes Therapeutics Inc | acquired | Resolves to Astellas. (0 active contacts) |
| AveXis, Inc | acquired | Resolves to Novartis. (0) |
| Aavantibio Inc | acquired | Leadership departed for Solid Biosciences. (1) |
| Sio Gene Therapies Inc | defunct | No Clay data, no public activity. (0) |

### Bucket C — held for review (modality_confirmed=false, pending live URL verification): 32 companies, 53 active contacts

Five are documented non-AAV-primary mismatches per the 2026-05-07 ops audit and will be moved to `disqualified` on next pass:
- American Gene Technologies (lentiviral primary)
- Expression Therapeutics LLC (gene+cell combo)
- Locanabio, Inc (RNA-targeting)
- Rejuvenate Bio (epigenetic reprogramming)
- Shape Therapeutics Inc (RNA editing primary)

The remaining 27 are bona fide AAV biopharma per their existing `primary_modality` tag — held only because the spec literal-string rule requires a live URL fetch confirming the company's own published materials name AAV specifically. I did not perform 27 live web fetches in this pass. Examples include 4D Molecular Therapeutics, Adverum, Beacon, Capsida, Dyno, Encoded, Homology, Jaguar, Kriya, Neurogene, Opus, REGENXBIO, Rocket, Sarepta, Solid Biosciences, Taysha, Tenaya, Ultragenyx, Voyager, XyloCor.

Top held-for-review companies by active contact count (likely-pass on verification):
- Taysha Gene Therapies — 6
- 4D Molecular Therapeutics — 5
- Kriya — 4
- Encoded Therapeutics-RTP — 3
- Dyno Therapeutics — 3
- Jaguar Gene Therapy — 3
- Neurogene Inc — 3
- Rocket Pharmaceuticals — 3
- Sarepta Therapeutics Inc — 3
- Solid Biosciences — 3
- Ultragenyx Pharmaceutical Inc. — 3
- Voyager Therapeutics, Inc — 3

### Bucket D — companies with 0 active contacts (sourcing targets)

12 companies, regardless of bucket A/B/C:
- Audentes, AveXis, Sio (already disqualified)
- Applied Genetics Technologies Corp, Beacon Therapeutics, Homology Medicines, Lacerta Therapeutics, Locanabio, Odylia Therapeutics, Rejuvenate Bio, Stridebio (held)
- (12th: count includes one of the Bucket A cases — Spark Therapeutics has 0 active contacts despite passing classification)

---

## Vocabulary remaps applied

- `clinical_stage` re-mapped on all 46 companies: "Pre-Clinical Research" → preclinical, "Clinical Research Phase 1" → Phase 1, "Phase 1/2" → Phase 1/2, "Phase 2" → Phase 2, "Phase 3" / "Commercial/Approved" → Phase 3+, "Not Applicable" → null.
- `size_bucket` re-mapped from `employee_count` on all 46 companies to spec ranges (1-50 / 51-200 / 201-500 / 501-1000 / 1001-2000 / 2000+).

---

## Net gap to 150 contacts

Three scenarios depending on what happens at the held-for-review review:

| Scenario | Surviving companies | Active contacts | Gap to 150 |
|---|---:|---:|---:|
| Pessimistic — only confirmed companies pass | 9 | 23 | **127** |
| Realistic — all 27 unverified pass URL check, 5 mismatches stay disqualified | 36 | 76 | 74 |
| Realistic + subsidiaries excluded | 31 | ~58 | 92 |

Either way, **new contact sourcing is the critical path.** Even in the most optimistic case the play needs 70+ new contacts at the surviving companies.

---

## Next moves

1. **Live URL verification on the 27 unverified AAV biopharma in Bucket C.** Fastest unlock — will likely flip most to enrichment_complete and bring contact count to ~76.
2. **Subsidiary policy decision (Jenn).** AskBio, Forge, Spark, Akouos, Prevail — each operates with varying degrees of independence under their parent's CMC. Per-company override list needed.
3. **Sourcing run.** Target ≥75 new contacts at the surviving companies, prioritized by Bucket A first (subsidiary policy permitting), then Bucket C top-active-contact companies. Title patterns from the criteria doc: viral vector, downstream processing, purification, process development, vector manufacturing, gene therapy manufacturing.
