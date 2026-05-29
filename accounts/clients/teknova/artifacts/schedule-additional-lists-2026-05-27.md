# Teknova — Additional Modality Lists Schedule

**Drafted:** 2026-05-27
**Scope of this doc:** Production schedule for the additional modality-focused lists Jenn requested in her 2026-05-26 email. Closeout activities (JSON drop, snapshot, final report) are **not** in scope here.
**Protocol reference:** `practices/engagement-governance/reference/weekly-delivery-shape.md`

---

## Scope

**In scope:**
- Producing N additional modality-focused lists for Ellie, where each list = one ranked contact set against a specific modality and Teknova's existing ICP/persona criteria
- Modality definition input from Ellie (which modality, what's in/out)
- Delivery in Ellie's stated preferred format: CSV/spreadsheet, not Airtable

**Not in scope of this schedule:**
- JSON export of workflows
- System state snapshot
- Closeout package
- Documentation, training, knowledge transfer
- Anything past 2026-06-25

**Unit of capacity:** 1 list = 1 slot (1 week). Solo tier = 1 slot/week.

---

## Per-list slot anatomy (what one week looks like for one modality list)

| Day | Activity | Owner | Output |
|---|---|---|---|
| Mon | Term-set construction for the modality (MeSH, branded products, capsid/cell-line/molecule variants, exclusion terms to avoid false matches) | operator | term-set file + classification rules draft |
| Tue | Modality taxonomy + classification rules tuned for the new modality | operator | rules version tagged in Airtable Classification Rules table |
| Tue PM – Wed AM | Pipeline runs: signal capture (CT.gov + PubMed) → LLM classification → company rollup → enrichment (Explorium) → contact sourcing (Apollo + Hunter) → LinkedIn verification → SF Contact Summary verdict | automated | populated list in Airtable |
| Wed PM | Operator review of pipeline output, audit of edge cases, exclusion-term tuning if needed | operator | cleaned list |
| Thu AM | List exported to CSV/Sheet in Ellie's preferred format; preview prepared for Thursday session | operator | shipped list (CSV link or attachment) |
| Thu (working session) | Walk Ellie through the list, capture any rule-adjustment feedback | operator + Ellie | feedback notes |
| Fri | Weekly Update sent; rule adjustments applied if minor; major adjustments roll into next slot | operator | Weekly Update |

**Slot ships when:** the list is delivered to Ellie in her stated format by Thursday's session.

---

## Dependencies (must land or the slot shifts)

| Dependency | Owner | Needed by | If missed |
|---|---|---|---|
| Modality named for the slot (e.g., "Cell Therapy — Autologous" or "Lentiviral vector") | Ellie or Jenn | Friday before the slot week starts | Slot shifts; do not start without the modality named |
| Modality scope (in/out) clarified (e.g., does "Cell Therapy" include CAR-T? Allogeneic only? Both?) | Ellie | Monday of the slot week | Operator makes a defensible default and notes the assumption in the list |
| Persona/ICP criteria — assumed to inherit from existing AAV play criteria unless Ellie says otherwise | Ellie | Monday of the slot week | Default to existing criteria; flag in Weekly Update |

---

## Modalities likely to be in the requested set

Based on prior transcripts and context, the modalities Ellie has discussed:
- Cell Therapy — Autologous (CAR-T, TCR, TIL)
- Cell Therapy — Allogeneic
- Lentiviral / Retroviral vectors
- mRNA / LNP delivery
- Other AAV sub-segments not already covered (e.g., production tool vs. gene therapy split)

**This is a guess list, not a committed list.** Ellie or Jenn confirms which ones and in what order.

---

## Schedule scenarios

### Scenario A: 2 lists (conservative, leaves slots for closeout work)

| Thu session | Slot week | Slot |
|---|---|---|
| May 28 | May 27 – Jun 3 | List #1 — modality TBD by Ellie |
| Jun 4 | Jun 4 – Jun 10 | List #2 — modality TBD by Ellie |
| Jun 11 | Jun 11 – Jun 17 | Available for other work (not list production) |
| Jun 18 | Jun 18 – Jun 24 | Available for other work |

### Scenario B: 3 lists (max realistic list output given dependencies on Ellie)

| Thu session | Slot week | Slot |
|---|---|---|
| May 28 | May 27 – Jun 3 | List #1 |
| Jun 4 | Jun 4 – Jun 10 | List #2 |
| Jun 11 | Jun 11 – Jun 17 | List #3 |
| Jun 18 | Jun 18 – Jun 24 | Available for other work |

### Scenario C: 4 lists (full capacity to lists; leaves zero room for anything else)

| Thu session | Slot week | Slot |
|---|---|---|
| May 28 | May 27 – Jun 3 | List #1 |
| Jun 4 | Jun 4 – Jun 10 | List #2 |
| Jun 11 | Jun 11 – Jun 17 | List #3 |
| Jun 18 | Jun 18 – Jun 24 | List #4 |

**Recommended:** Scenario A or B. Scenario C absorbs every slot and leaves no capacity for the other deliverables Jenn asked about (transition / JSON drop).

---

## Throughput constraints

- **Hard limit: 1 list per week** under Solo tier. Even if Ellie supplies 4 modalities on day 1, the pipeline runs sequentially against each modality's term set.
- **No parallel modalities** within a single slot. Each modality has its own term set, classification rules, and taxonomy; parallelizing them creates rule-version contamination in the Classification Rules table.
- **Pipeline cost per list:** ~85–100 Explorium credits (enrichment) + Apollo + Hunter credits per list of ~50 companies. Current credit state per the Operations Inventory: Explorium ~1,545 credits, Hunter ~7,410 credits. Well within budget for 2–4 lists.

---

## What stops a list from shipping in its slot

| Failure | Recovery |
|---|---|
| Ellie doesn't name the modality by Friday before the slot week | Slot does not start; surface in Weekly Update; defer to next slot if modality lands by Monday EOD of the following week |
| Modality scope ambiguous (e.g., "Cell Therapy" without specifying autologous/allogeneic) | Operator picks a defensible default, ships the list with the assumption documented; Ellie can request a refined version in a future slot |
| Pipeline returns a thin list (<20 companies) | Ship the thin list with a note; Ellie decides whether to broaden the modality definition in next slot |
| Pipeline classification rules produce noisy output | Operator tunes rules during Wed PM review window; ships cleaned list Thursday; if cleanup exceeds Wed PM window, slot ships late by 1–2 days with notification |
| Ellie requests substantial rule changes in Thursday session | Minor changes applied Friday and re-shipped; major changes (new term set, redefined modality boundary) roll into a separate slot, not absorbed into current week |

---

## What's NOT included in a list slot

These trigger Scope-Change Notification if requested:

- Email copy or sequence drafting per modality (out of scope; existing copy reused or Ellie writes)
- Salesforce upload coordination — Ellie's SF admin team uploads; operator delivers the CSV only
- Landing page or asset production per modality
- Live walkthrough of the list with Ellie or her team beyond the standard Thursday session
- Multi-list synthesis (e.g., "deduplicate across lists 1–4 and show me unique contacts per modality")
- Custom field requests beyond the existing Airtable contact schema

---

## Operator hours estimate per list

| Activity | Hours |
|---|---|
| Term-set construction + rules tuning | 4–6 |
| Pipeline oversight (mostly automated; ~30 min checkpoints) | 1–2 |
| Wed PM review + cleanup | 2–3 |
| Thursday session walk-through | 1 (already inside the contractual weekly meeting) |
| Weekly Update | 0.5 |
| **Total per list** | **8–12** |

This is **per slot week**, on top of the 4–6 hours/week contractual floor.

---

## Decision needed from Nick + Jenn

1. **How many lists?** Pick from Scenarios A / B / C above, or specify a different count.
2. **Which modalities, in what order?** Ellie's call; Jenn signs off.
3. **Are slots not used for lists available for other work?** Affects whether Scenario A leaves room for closeout deliverables or just leaves slots unused.

Once those answer, the slot calendar locks and the per-list dependency clock starts (Ellie names each modality by the Friday before its slot week).
