# PLAY-006 — Post-enrichment quality report

**Date:** 2026-05-07
**List:** PLAY-006 / AAV gene therapy / Ellie outreach.
**Format:** dual-table (companies + contacts) per the enrichment spec's `Post-enrichment quality report` section. Diagnostic — ship/no-ship is Nick's call.

Updated after a partial why-now signal fill via Perplexity web search.

---

## Company metrics

| Metric | Value |
|---|---:|
| Total companies in play | 46 |
| Companies active | 40 |
| Companies disqualified | 11 |
| Companies held for review | 6 |
| Modality confirmed | 82.5% (33/40 active) |
| Company score — min | 0 |
| Company score — median | **6.0** |
| Company score — max | **10** |
| Active companies with 0 enrichment-complete contacts | 19 |

### Company disqualified — by failed check

| Failed check | Count |
|---|---:|
| company_status (acquired / defunct) | 6 |
| subsidiary_flag (top-20 pharma subsidiaries) | 4 |
| modality_confirmed (XyloCor — adenoviral, not AAV) | 1 |

### Company held_for_review — by failed check

| Failed check | Count |
|---|---:|
| modality_confirmed | 6 (5 documented mismatches + AGTC unclear) |

---

## Contact metrics

| Metric | Value |
|---|---:|
| Total contacts in play | 174 |
| Contacts enrichment-complete | **53** |
| Contacts incomplete | 21 |
| Contacts disqualified | 100 |
| Email coverage | 100% (53/53) |
| Email verified rate | 94.3% (50/53) |
| LinkedIn coverage | 100% (53/53) |
| Active employment rate (strict — `tenure_months` populated) | 47.2% (25/53) |
| Freshness (≤90d) | 54.7% (29/53) |
| Contact score — min | 6 |
| Contact score — median | **9.0** |
| Contact score — max | **14** |
| Contacts scoring above 10 | **10 (18.9%)** |

### Contact disqualified — by failed check

| Failed check | Count |
|---|---:|
| role_status (employment_status='ended') | 81 |
| company_disqualified (cascade) | 19 |

### Contact incomplete — by failed check

| Failed check | Count | Recoverable? |
|---|---:|---|
| email_invalid (`@example.com` placeholders) | 14 | No — re-source |
| current_employer_match (employment_status='unknown') | 3 | Yes |
| email_missing | 3 | Yes |
| email_verification_status (provider says invalid) | 1 | No |

---

## Why-now signal fill — what landed and what didn't

This pass populated only 3 confirmed signals across 40 active companies. Honest read on the constraint:

- **Perplexity research mode declined** to ground in current web data on the first batch call (returned essay rather than data).
- **Perplexity search mode** returned good results on targeted queries (Sarepta, Voyager, Kriya) but each batch of ~5 companies × 1 signal type costs one search call and produces 5-10 KB of text to parse. Doing the full 40 × 5 matrix this way is a multi-hour ops run, not one session.
- **Most companies have no recent qualifying signals** — the spec windows are 45/60/90 days, and small biotechs without recent press cycles will return blank legitimately. Blank is correct per spec.

### Signals applied (high-confidence, sourced)

| Company | Field | Value | Source |
|---|---|---|---|
| Ultragenyx | ind_or_stage_advance | "BLA accepted by FDA, 2026-04 (UX111)" | ir.ultragenyx.com 2026-04 |
| Opus Genetics | ind_or_stage_advance | "Phase 1b/2a clinical data, 2026-02 (OPGx-BEST1)" | Macula Society Annual Meeting 2026-02 |
| Sarepta Therapeutics | ind_or_stage_advance | "ENDEAVOR Cohort 8 dosing initiated, 2026-04 (ELEVIDYS)" | Sarepta Q1 2026 results, 2026-05 |

Each lifts the company score from 5-7 to 8-10 (+3 from ind_or_stage_advance signal). Contacts at those companies inherit the lift.

### Signals NOT yet applied (full pass needed)

- `funding_event` — checked Kriya, 4D MT, Sarepta, Voyager, Solid, Tenaya. Most-recent rounds outside the 45-day window. None applied.
- `leadership_hire` — not searched in this pass.
- `conference_presence` (Interphex / BPI West / Advanced Therapies Week) — not searched.
- `recent_publication` — not searched.

A complete fill across all 5 fields × 40 companies requires a dedicated ops run via clinicaltrials.gov, PubMed, conference attendee lists, LinkedIn job postings, and Crunchbase. Conservative estimate: 2-4 hours of agent time with parallel tool calls.

---

## Headline reading

- **53 enrichment-complete contacts at 21 active companies.** Same as previous pass — the why-now fill is non-gating per spec.
- **Score lift modest but real:** company median 5.5 → 6.0, max 7 → 10. Contact median holds at 9.0; max 11 → 14; count > 10 climbed from 9 to 10.
- **The 10 contacts scoring above 10 are the priority send order.** Disproportionately at Ultragenyx, Opus, and Sarepta after this pass.
- **Largest leverage remaining:** finishing the why-now fill on the 37 active companies still at 0 signals. Free sources cover most of it (clinicaltrials.gov, PubMed, conference websites). Should be the next ops sweep, not blocked by anything.

## Two unblocking moves

1. **Ship the 53.** All pass per-record gate. Order by `contact_score DESC`. Top 10 (score >10) lead.
2. **Finish the why-now fill** before sending. Parallelize 40 companies × 5 signals via batched search/research calls. Likely lifts the score-above-10 count from 10 to 25-35 and gives Ellie real personalization material per company.
