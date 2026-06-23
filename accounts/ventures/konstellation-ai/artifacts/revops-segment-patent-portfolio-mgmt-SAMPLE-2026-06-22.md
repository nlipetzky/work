# Segment Criteria: patent-portfolio-mgmt (SAMPLE)

**Venture:** konstellation-ai
**Play:** patent-portfolio-mgmt
**Date:** 2026-06-22
**Offer (one sentence):** A fractional CIPO who turns a patent portfolio from cost-and-complexity
into managed intelligence — lowering outside-counsel spend while raising IP decision quality.
**Status:** SAMPLE / DRAFT — synthesized by `demand-needs-extract` from
`plays/patent-portfolio-mgmt/demand-context/needs-map-patent-portfolio-mgmt-2026-06-22.md`.
NOT a replacement for the canonical `revops-segment-patent-portfolio-mgmt.md` (Kepler v0.2
scaffold). This file demonstrates what `demand-needs-extract` emits from transcript evidence;
the canonical artifact carries the locked $3k/mo offer and the four-sub-ICP structure. Reconcile
the two after the real founder-buyer capture event lands.

---

## Hard filters

Records must match all hard filters to enter the segment.

### Holds a real patent portfolio
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** company/owner is a named assignee on multiple active patents
  (patent-office assignee records, public filings).
- **Description:** the offer is portfolio management; no portfolio, no pain. *(grounded in: PAT-02)*

### Uses outside counsel for IP (no internal IP strategist)
- **Type:** firmographic / relational
- **Match:** hard filter
- **Observable signal:** filings prosecuted by an external firm; no in-house CIPO / VP IP listed.
- **Description:** the offer manages outside counsel and fills the missing strategist seat.
  *(grounded in: PAT-01, PAT-02)*

### Post-revenue, founder/CEO controls the IP budget
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** operating company; founder/CEO is the economic buyer.
- **Description:** matches the persona who owns the budget and the build-vs-buy decision.
  *(grounded in: OBS-04)*

---

## Soft signals (label, don't filter)

### Active build-vs-buy / AI-experimentation posture
- **Type:** behavioral
- **Match:** soft signal
- **Observable signal:** public AI-adoption signals or ops/automation hiring.
- **Description:** the "do I do the AI myself?" tension is live; why-now window open.
  *(grounded in: OBS-04, PAT-04)*

### Recent financing or growth event
- **Type:** behavioral
- **Match:** soft signal
- **Observable signal:** funding, expansion, or new-market entry in trailing 12 months.
- **Description:** IP cost/complexity becomes acute as the company scales. *(grounded in: PAT-02)*

### Litigation or competitive-IP pressure
- **Type:** behavioral
- **Match:** soft signal
- **Observable signal:** named in IP litigation, or operating in a crowded patent space.
- **Description:** raises urgency for managed intelligence over raw reports. *(grounded in: PAT-03)*

---

## Disqualifiers

### Already has an internal Chief IP Officer / head of IP
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** in-house senior IP leader on staff.
- **Description:** the seat the offer fills is taken.

### No patent portfolio
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** no assignee records.
- **Description:** nothing to manage.

### Expert has a current advisory / board / commercial relationship (or channel conflict)
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** appears on the expert's do-not-contact list (runtime input from the expert).
- **Description:** relationship + channel-conflict protection. Requires the expert's DNC list via
  Hermes. (Aligns with D4/D7 in the canonical artifact.)

---

## Confidence and gaps

- Hard filters derive from grade-B / provisional CIPO patterns (PAT-01, PAT-02). Defensible first
  cut; re-validate once founder-buyer transcripts land (the blocked real capture event).
- "Uses outside counsel, no internal CIPO" is the load-bearing, hardest-to-observe filter — flag as
  the data-prep risk.
- This SAMPLE deliberately omits the canonical artifact's four-sub-ICP tagging and the $3k/mo
  offer mechanics — those are richer and already locked there. The value this sample adds is the
  evidence trace (every line -> pattern -> verbatim).
- Size is intentionally not a hard filter (label, don't filter), per studio rule.
