# PLAY-006 Quality Report -- Post-Enrichment Final State
**Date:** 2026-05-08
**Play:** AAV Gene Therapy -- Ellie Outreach (PLAY-006)
**Play ID:** e5327ea5-d9de-4e83-ab0f-e35ac1b8786d
**Scope:** All 4 enrichment batches complete. Final state of the play universe.

---

## Company table

| Metric | Value |
|---|---:|
| Total companies in play | 54 |
| enrichment_complete | 30 |
| enrichment_incomplete | 9 |
| disqualified | 15 |
| cadence_ready | 0 |
| held_for_review | 0 |
| modality_confirmed | 49 of 54 |
| status: active | 46 |
| status: acquired | 7 |
| status: defunct | 0 |
| type: biopharma | 48 |
| type: cdmo | 6 |
| Headcount <50 | 20 |
| Headcount 51-200 | 17 |
| Headcount 201-1000 | 13 |
| Headcount >1000 | 4 |
| Company score: min | 0 |
| Company score: median | 6.0 |
| Company score: avg | 5.5 |
| Company score: max | 11 |
| Signal: funding_event populated | 0 |
| Signal: ind_or_stage_advance populated | 5 |
| Signal: leadership_hire populated | 0 |
| Signal: conference_presence populated | 0 |
| Signal: recent_publication populated | 3 |

**Company score note:** Median is 6.0 with signals almost entirely unpopulated. Per the enrichment spec, filling the 5 why-now signal fields lifts company scores to the 7-15 band. Why-now signal fill is the highest-leverage remaining action for score improvement.

---

## Contact table

| Metric | Value |
|---|---:|
| Total contacts in play | 222 |
| cadence_ready | 44 (19.8%) |
| enrichment_complete | 47 |
| enrichment_incomplete | 32 |
| disqualified | 98 |
| Has email | 209 of 222 (94.1%) |
| Email missing | 13 |
| Email verified: valid | 68 |
| Email verified: accept_all | 2 |
| opt_out_status: clear | 222 (100%) |
| opt_out_status: flagged | 0 |
| Contact score: min | 6 |
| Contact score: median | 10.0 |
| Contact score: avg | 9.9 |
| Contact score: max | 16 |
| Contact score >10 | 13 (5.9%) |

### Function breakdown (cadence_ready + enrichment_complete contacts)

| Function | Count |
|---|---:|
| manufacturing | 30 |
| process_dev | 19 |
| cmc | 6 |
| cso | 5 |

### Seniority breakdown (cadence_ready + enrichment_complete contacts)

| Seniority | Count |
|---|---:|
| vp | 18 |
| director | 15 |
| c_suite_small_biotech | 8 |
| svp | 7 |
| head_of | 5 |
| senior_director | 5 |
| senior_scientist | 2 |

---

## Active companies with 0 contacts (3)

| Company | Status | Headcount | Reason |
|---|---|---|---|
| Ambulero | enrichment_incomplete | ~15 | Too small -- no VP/director-level contacts in any database |
| Beacon Therapeutics | enrichment_complete | ~100 | Post-AGTC entity, Explorium data gap, UK HQ limits US contacts |
| PTC Therapeutics | enrichment_incomplete | 1,149 | Exceeds 2,000 ICP cap but likely excluded; manufacturing/PD contacts not surfaced by Explorium |

---

## Contacts per company (non-disqualified, sorted by total contacts)

| Company | Status | Total | Cadence Ready |
|---|---|---:|---:|
| Jaguar Gene Therapy | enrichment_complete | 9 | 0 |
| Taysha Gene Therapies | enrichment_complete | 9 | 3 |
| Kriya | enrichment_complete | 8 | 4 |
| Voyager Therapeutics | enrichment_complete | 8 | 3 |
| Andelyn Biosciences | enrichment_complete | 7 | 3 |
| Encoded Therapeutics | enrichment_complete | 7 | 2 |
| Forge Biologics | enrichment_complete | 7 | 3 |
| 4D Molecular Therapeutics | enrichment_complete | 6 | 4 |
| Capsida Biotherapeutics | enrichment_complete | 6 | 1 |
| ElevateBio | enrichment_complete | 6 | 4 |
| REGENXBIO | enrichment_complete | 6 | 0 |
| Sarepta Therapeutics | enrichment_complete | 6 | 3 |
| Virovek | enrichment_complete | 6 | 2 |
| Adverum Biotechnologies | enrichment_complete | 5 | 1 |
| Affinia Therapeutics | enrichment_complete | 5 | 1 |
| Dyno Therapeutics | enrichment_incomplete | 5 | 3 |
| Lacerta Therapeutics | enrichment_incomplete | 5 | 0 |
| Neurogene | enrichment_complete | 5 | 3 |
| Rocket Pharmaceuticals | enrichment_complete | 5 | 1 |
| Shape Therapeutics | enrichment_complete | 5 | 0 |
| Ultragenyx Pharmaceutical | enrichment_complete | 5 | 0 |
| Genezen Laboratories | enrichment_complete | 4 | 1 |
| Passage Bio | enrichment_complete | 4 | 0 |
| Solid Biosciences | enrichment_complete | 4 | 1 |
| Atsena Therapeutics | enrichment_complete | 3 | 0 |
| Avirmax | enrichment_complete | 3 | 0 |
| Tenaya Therapeutics | enrichment_incomplete | 3 | 0 |
| BridgeBio Gene Therapy | enrichment_incomplete | 2 | 0 |
| Lexeo Therapeutics | enrichment_complete | 2 | 0 |
| Locanabio | enrichment_incomplete | 2 | 0 |
| Odylia Therapeutics | enrichment_complete | 2 | 0 |
| Opus Genetics | enrichment_incomplete | 2 | 1 |
| Abeona Therapeutics | enrichment_complete | 1 | 0 |
| Grace Science | enrichment_complete | 1 | 0 |
| Ocugen | enrichment_complete | 1 | 0 |
| Rejuvenate Bio | enrichment_incomplete | 1 | 0 |
| Ambulero | enrichment_incomplete | 0 | 0 |
| Beacon Therapeutics | enrichment_complete | 0 | 0 |
| PTC Therapeutics | enrichment_incomplete | 0 | 0 |

---

## Delta from ship state (2026-05-07)

| Metric | At ship (2026-05-07) | Final (2026-05-08) | Delta |
|---|---:|---:|---:|
| Cadence-ready contacts | 53 | 44 | -9 |
| Companies in play | 50 | 54 | +4 |
| Active companies | 44 | 46 | +2 |
| Active companies with 0 contacts | 16 | 3 | -13 |
| Total contacts in play | -- | 222 | -- |
| Company score median | 6.0 | 6.0 | 0 |
| Contact score median | 9.0 | 10.0 | +1 |
| Contact score >10 | 10 (18.9%) | 13 (5.9%) | +3 contacts, lower % (larger denominator) |

**Cadence-ready delta note:** The -9 delta reflects disqualification of contacts found ineligible during enrichment (stale employment, excluded functions), not contacts removed from the play. The overall enrichment pass produced 222 total contacts vs. 53 at ship -- the denominator expanded significantly while the cadence_ready count reflects what passed the full 9-check gate.

---

## Priority gaps for next sessions

**1. Why-now signal fill** (highest leverage)
- 41 of 44 active companies have 0 signals. Filling signals lifts company scores to 7-15 and contact scores to 10-18 band.
- 44 contacts currently cadence_ready. Signal fill is what makes personalization possible.
- See `play006-next-sessions.md` item 2 for source sequence.

**2. Email recovery for 8 Batch-4 contacts with email_missing**
- 13 total contacts without email. High-value targets include: Keenan Bashour (4D Molecular VP Process Dev), Cynthia Porter Riggins (ElevateBio VP CMC), Michael Blackton (Ocugen VP Mfg).
- Recovery path: Apify `dev_fusion/Linkedin-Profile-Scraper` at $0.01/profile.

**3. Apify follow-up for 4 named contacts from earlier batches**
- Tenaya: Scott Bertch (VP Manufacturing), Kathy Ivey (SVP Process Dev) -- confirmed employed, 0 emails
- Lacerta: Payel Chaudhuri (Sr Dir AAV Manufacturing), Gary Todd (VP Head of Technologies) -- unmatched in Explorium
- Solid Bio: Stewart C. (Sr Dir Manufacturing) -- last name truncated

**4. Genezen domain conflict**
- Supabase has genezenlabs.com; email domain is genezen.com. Orphan "Genezen" record blocks the UPDATE.
- Manual DBA resolution required before Airtable push.

**5. Beacon Therapeutics contact sourcing**
- 0 contacts found. Explorium coverage gap (shared AGTC business_id). LinkedIn-sourced discovery needed for US-based manufacturing staff.

---

## Credit summary (all batches, 2026-05-08)

| Provider | Batch 0 | Batch 1 | Batch 2 | Batch 3 | Batch 4 | Total |
|---|---:|---:|---:|---:|---:|---:|
| Explorium | 27 | ~20 | ~34 | ~36 | 35 | ~152 |
| Hunter | 0 | ~18 | 11 | ~15 | 13 | ~57 |
| **Session total** | | | | | | **~209** |

**Remaining balances (estimated):**
- Explorium: ~1,545 credits
- Hunter: ~7,410 credits
- Apollo: exhausted (use as waterfall fallback only when credits replenish)
