# Play Brief: mRNA Therapeutics

- **Play slug:** mrna-therapeutics
- **Engagement:** clients/teknova
- **Operator:** Ferris (RevOps)
- **Created:** 2026-06-11
- **Last updated:** 2026-06-11
- **Readiness:** partial

---

## What you actually need to know (plain English)

This play finds North American companies developing mRNA medicines and vaccines — the ones that physically run the lab work (making the RNA, purifying it, formulating it into lipid nanoparticles) and therefore buy a lot of the buffers, salt solutions, ultra-pure water, and custom reagents Teknova makes. The goal is a clean, screened list of the right people at those companies (process-development, manufacturing, R&D, and procurement leads) to reach out to.

The targeting is fully defined and traces to the client's mRNA playbook (2026-06-10) plus four scope calls the expert made on 2026-06-11: oligonucleotide-only companies are out, lipid-nanoparticle/delivery companies are in, the big diversified pharma and the reagent-makers stay in but get flagged, and the list should be ranked, not just pass/fail. A size decision was also settled: this play has no company-size cutoff (it keeps the large players and flags them), which differs from the standing client size rule and applies to this play only. We can build and screen a list now.

The check that worried us — whether someone is already a Teknova customer, has an open deal, or was contacted in the last 6 months — turned out to be available: that data lives in a live Salesforce-to-Airtable sync, so it's wired in, not missing. One screen still needs a data source: confirming on LinkedIn that a person still holds the role we have for them.

What's left before anything sends is a short list of go-to-market choices — whose name the outreach goes under, which channel, how many in the first wave, how tightly to scope the job titles, and the exact call-to-action. They're gathered in one section below so you can answer them in a single pass. Nothing goes out the door until those are set, the customer/recent-contact check has run, and you've reviewed the screened result on the data surface.

*The rest of this brief is agent-facing — you don't need to track it.*

---

## The one-sentence play

Outreach to North American mRNA therapeutics developers — conventional mRNA, saRNA, circRNA, and mRNA vaccines — about Teknova's RUO-through-GMP custom reagent, buffer, and water supply across the full mRNA workflow (plasmid → IVT → purification → LNP formulation/fill-finish → storage), timed to the modality's expansion into new RNA formats and indications.

---

## Input ledger

| # | Input | Status | Source | Artifact | Notes |
|---|---|---|---|---|---|
| 1 | Offer definition | locked | skill-produced (offer-extract) | `revops-offer-mrna-therapeutics.md` | Derived from playbook §1–§2. Pricing frame + CTA defaulted, flagged for sponsor. |
| 2 | Segment definition | locked | skill-produced (segment-criteria) | `revops-segment-mrna-therapeutics.md` | Company gates G1–G5 + contact-level filters, from playbook §3–§6. |
| 3 | Hard disqualifiers | locked | skill-produced (segment-criteria) | `revops-segment-mrna-therapeutics.md` (Disqualifiers) | Non-mRNA-only, siRNA/ASO-only, discovery/computational-only, no-NA, distributor/irrelevant-CRO, CRM-180d, profile-mismatch. |
| 4 | Sub-segment tagging | locked | skill-produced (segment-criteria) | `revops-segment-mrna-therapeutics.md` (G5 org types) | Six in-scope org types from playbook §2 are the sub-segment enum. |
| 5 | ICP titles / persona tiers | operator-filled | operator-filled (playbook §3.2) | `revops-icp-titles-mrna-therapeutics.md` | Lifted verbatim from client playbook; no tiers prescribed. Tiering + first-wave function narrowing open for Ellie. |
| 6 | Sender identity + credential | gap | n/a | — | Whose name/inbox the sends go under. Sponsor + expert decision (Polaris/Hermes). ngAbs used the expert's inbox; not confirmed here. Blocks outreach, not list build. |
| 7 | Proof points / copy constraints | operator-filled | operator-filled (playbook §1) | `revops-offer-mrna-therapeutics.md` (Proof) | Real proof = ISO 13485, published Plasmid Workflow, PluriFreeze, Express•Tek, WFI 1L–200L bags. Named references/quantified outcomes are a gap (NotebookLM would close). |
| 8 | Channel selection | gap | n/a | — | Email / LinkedIn / both. Operator decision. Playbook §7 output fields include LinkedIn URL "if available," implying email-primary. Confirm. |
| 9 | Volume target | gap | n/a | — | First-wave contact count. Operator decision. Engagement convention: max 3–5 contacts/company/wave. |
| 10 | Personalization rule + hooks | deferred | n/a | — | Cold screened sprint; playbook implies low/no per-contact personalization. Revisit if Ellie wants persona-variant copy. |
| 11 | Cold copy / sequence | deferred | n/a | — | Downstream of sender voice (6). Kepler (sales-and-gtm) craft, not needed for the list build. |

---

## Hand-off log

- **Hermes (expert-liaison):** First scope round answered 2026-06-11: ranking wanted; oligonucleotide-only OUT / LNP-delivery IN; reagent-competitors and large diversified pharma KEEP-and-FLAG; no size cutoff; acquired/renamed → resolve-to-parent. Captured in `client-guidance.md` §0 and the segment artifact. Suppression-list ask **dropped** by operator (the SF mirror replaces it). Remaining expert-owned items are in Open Decisions (D4, D6, D8, D9).
- **Polaris (engagement-governance):** Pending — sender identity (D1) and offer commercial frame (D5) are sponsor-side. Provider spend for sourcing/enrichment is gated to the operator (priced per pilot, approved by Nick).
- **Kepler (sales-and-gtm):** Not yet routed. Copy and personalization hand over once sender identity (D1) returns.

---

## Open decisions (answer in one pass)

Per operating doctrine (recommend-then-ratify + batch-at-bundle): every remaining decision is collected here with a **recommendation, reason, and reversal cost**, to be ratified in one pass. If a decision surfaces *after* this brief is approved, that is a **bundle gap** — it will be named as such, not asked inline.

| # | Decision (owner) | Recommendation — why | Reversal cost |
|---|---|---|---|
| D1 | Sender identity / inbox (sponsor + expert) | **Use the expert's inbox**, mirroring ngAbs — the expert's credibility is the selling asset, and a consistent sender across plays compounds it. | **High after first send** (can't un-send under a name); low before. Decide before any send. |
| D2 | Channel (sponsor/operator) | **Email-primary**, capture LinkedIn URL but don't send on it — playbook §7 output is email-centric, list is built email-deliverable. | **Low** — adding a LinkedIn touch later is additive, doesn't invalidate the list. |
| D3 | First-wave volume (operator) | **Small first wave (~25–50 contacts)** before scaling — cold sprint on a wind-down clock; validate deliverability + response before spending the TAM. | **Low** — under-sending scales up next wave; over-sending burns contacts irreversibly. |
| D4 | Title scope (expert) | **All three persona columns, cap 3–5/company** — playbook approves all titles; the NA mRNA universe is finite, narrowing to one function risks under-filling. | **Low** — can narrow next wave; running broad first is the reversible direction. |
| D5 | Offer commercial frame (sponsor) | **Scope-to-quote, RUO vs GMP differentiated** — the standard custom-formulation model, matches Teknova's custom service. | **Low** pre-copy — a framing line in the offer doc. |
| D6 | Primary CTA (sponsor/expert) | **Working call on the program's reagent/buffer footprint** — PD/procurement buy on technical fit, not downloads; matches ngAbs. | **Low** pre-copy. |
| D7 | Personalization (operator) | **Low/none — firmographic-level only** (modality, stage) — cold sprint, no per-contact research budget, wind-down timeline. | **Low** — later waves can add personalization. |
| D8 | LinkedIn-mismatch disposition (expert) | **Route-to-review** (already encoded), not strict-remove — playbook §5.2/§6 reads as review; strict-remove silently drops possibly-good contacts. | **Low** — a flag in contacts-screen-rules; flip anytime. |
| D9 | Named-reference proof for mRNA (sponsor/expert) | **Ask for any citable mRNA win; fall back to capability proof** (ISO 13485, Plasmid Workflow, PluriFreeze, Express•Tek) if none exists. | **Low** — proof slots into copy later. |
| D10 | LinkedIn-verification data source (operator) | **Reuse the live `LinkedIn Role Status Verify` workflow** (already active in n8n) for profiles; accept `null` where no profile — avoids a new enrichment lane. *Verify its cost/behavior read-only before relying on it.* | **Low** — a wiring choice; swap source later. |

**Resolved (recorded, not open):** modality scope (oligonucleotide-only OUT / LNP-delivery IN); competitor + large-diversified pharma keep-and-flag; ranking wanted; **no size cutoff for this play** (per-play override of the engagement ICP); acquired/renamed → resolve-to-live-parent then screen; existing-customer / open-deal / 6-month activity sourced from the Airtable SF mirror `app5wdHwgM1SPNxcx`; suppression-list ask dropped.

---

## Readiness verdict

**Partial — list build is ready; outreach is gated on the one-pass decisions above.** Targeting (offer, segment, disqualifiers, sub-segment tags, ICP titles) is locked from the client playbook and the 2026-06-11 scope calls, so the engine can screen a batch now. The existing-customer / open-deal / 6-month-activity screen **is sourced** (Airtable SF mirror `app5wdHwgM1SPNxcx`), correcting an earlier draft that wrongly called it unavailable. Two things still gate a send, neither of which blocks the screening run: (1) the go-to-market decisions **D1–D9**, to be answered in one pass — **D1 (sender identity)** is the hard blocker; (2) **D10 (LinkedIn verification)**, the only remaining contact-screen data gap, which caps unconfirmable-profile contacts at `eligible`. The immediate next step — separately gated on provider spend — is enriching the pilot batch with descriptions + headcount so the classifier can run.
