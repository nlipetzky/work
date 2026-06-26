# Cold Outreach — Context Substrate (what the AI needs to perform well)

Status: v1, 2026-06-23. Companion to `cold-outreach-system-design.md`. Owner: Ferris (revops), reviewed by Boris.

This maps the **context contract** (system-anatomy §3 — the least-modeled part of every system) for the
cold-outreach constellation. The system design says what moves data; this says **what each AI judgment
point must be fed to decide well.** Wiring is necessary; context is what makes the judgment good. A
perfectly-plumbed system with a context-starved model produces confident garbage.

## The shape of the problem

By the architecture ladder, **most steps are deterministic (rung 1) and need ~no context.** AI judgment —
and therefore context dependency — **concentrates at three points:**

1. **demand-context** — extract evidence from raw transcripts.
2. **System A** — qualify a company against that evidence.
3. **System M** — write copy in the buyer's pains and the expert's voice.

Systems I, O, F are mostly deterministic; their small AI surfaces are noted but they are not where the
moat lives. **The context substrate for those three judgment points IS the differentiator** — the sending
machinery is commodity, the encoded judgment is the asset (per `project_core_offering_expert_productization`).

---

## Per-system AI judgment points and their context needs

### demand-context (upstream)
- **Judgment: is this a demand signal, and how strong?** (signal → observation → pattern)
  - Needs: the **prospect transcripts** (raw demand — the GAP, not yet captured); the **evidence-grade rubric** (verbatim + provenance + grades, locked 2026-06-10); the **SME-extraction methodology** (`reference/sme-extraction-methodology.md`, 11 artifacts); the expert's domain frame so it knows what counts as signal.
- **Judgment: emit the offer / ICP / buyer-language artifacts.**
  - Needs: the **consuming-artifact schemas** (`schemas/offer.md`, `schemas/segment-criteria.md`); worked examples of a good vs weak offer; the expert's voice + refusals (`sandbox/will-artifacts.json`, v0.1, pending confirmation).
- **Status:** system `emerging`; the demand-side evidence is the headline gap.

### System A — Audience & Qualification
- **Judgment: the fit-qualification gate (the 30-50% shrink) — "is this company actually a fit for this offer?"** This is the one real AI call in an otherwise deterministic pipeline.
  - Needs, to perform well:
    - the **evidenced segment + ICP + disqualifiers** from demand-context (NOT a guessed ICP) — the input contract.
    - the **company context to judge** (scraped description, signals, technographics) — System A already gathers this.
    - the **expert's classification rules as encoded judgment** — e.g. the per-play criteria that *override* engagement ICP, role-exclusion rules, suppression rules. These exist today only per-engagement and as tacit operator knowledge (`feedback_play_criteria_supersedes_engagement_icp`, `project_mrna_suppression_contact_level`). Generalizing them into a reusable **classification rule artifact + labeled examples** is the gap.
    - **worked examples**: qualified vs disqualified companies, each with the reason (the AAV-verdict pattern). Few-shot examples are the cheapest large lift here.
    - **evidence grades / provenance** on the inputs so it weights trustworthy signal over scraped noise.
- **Context contract:** mostly *select* (retrieve the right criteria + company context per play) + *static* (the rules + examples). 
- **Status:** engine built; the **judgment context (rules + examples + evidenced criteria) is thin** — today it qualifies against whatever criteria the operator hands it.

### System I — Sender Infrastructure
- **AI judgment: essentially none.** Deterministic config — limits, warmup schedules, DNS. Rung 1.
- **Context need: ~zero.** Listed here precisely to make the point: not every system needs a knowledge substrate, and that's a *good* outcome, not a missing one (system-anatomy §intro). Don't manufacture AI where config suffices.

### System M — Message  *(the most context-hungry component in the constellation)*
- **Judgment: write the copy + the personalization snippets, in the buyer's pains and the expert's voice, without inventing the expert's POV.**
  - Needs, to perform well (this is the `copy-draft` skill's entire discipline):
    - the **buyer language + named pains + proof** from demand-context (*substance* — the words real buyers used).
    - the **SME Voice artifact** + **refused-phrasings list** — copy-draft requires every line source-tagged to a documented SME quote, a verifiable credential, a prior artifact, or a research-backed generic frame. Unsourced line = ship-blocker.
    - the **offer + proof constraints** (`revops-offer-<play>.md`).
    - the **channel doctrine** (`cold-email-doctrine.md` / `linkedin-outreach-doctrine.md`) — governs *form* (length, no-link rules, note-vs-DM).
    - **per-prospect research** — the 2-8 word personalization input (recent hire, partnership, podcast).
    - **worked examples**: on-voice vs off-voice, with why.
- **Context contract:** heavy on *static* (voice profile, refusals, doctrine) + *select* (per-prospect research, per-play offer). The voice profile is the load-bearing asset and it's only at v0.1.
- **Owner:** Kepler. **Status:** skill exists; the **voice substrate is the gap** (will-artifacts.json unconfirmed; no generalized SME-voice capture for other experts).

### System O — Cadence Orchestrator
- **AI judgment: small — reply classification** (positive / objection / OOO / not-interested) to route the next step. Everything else (state machine, timing, accept-gate) is deterministic.
  - Needs: a **reply-classification rubric + examples** (a small labeled set). Cheap to build.
- **Status:** concept; classification rubric not built.

### System F — Deliverability & Feedback
- **AI judgment: small — define/score "positive reply"** (shares the classifier with O) and optionally diagnose a failing campaign.
  - Needs: the **positive-reply definition + objection taxonomy**; the **benchmark thresholds** (already in the doctrines). Diagnosis is mostly deterministic (metric crossed a line) + the doctrine's failure-mode playbook.
- **Status:** concept; the positive-reply definition is the one context artifact to lock.

---

## The cross-cutting context assets (build these once, reused across systems)

These are the artifacts the moat is actually made of. Most don't exist yet or are v0.

| Asset | Feeds | Exists? |
| --- | --- | --- |
| Prospect transcripts (raw demand evidence) | demand-context | **GAP** — the demand side is uncaptured |
| Evidence-grade rubric (verbatim + provenance + grades) | demand-context, A | exists (locked 2026-06-10) |
| Evidenced offer / ICP / segment artifacts | A (qualify), M (substance) | schema exists; instances per-play |
| Expert voice profile + refused-phrasings | M | v0.1 (`will-artifacts.json`), unconfirmed; no multi-expert capture |
| Buyer-language / named-pains library | M | **GAP** — output of demand-context, not yet produced |
| Classification rule set + labeled qualified/disqualified examples | A | tacit + per-engagement; **not generalized** |
| Reply-classification rubric (positive/objection/…) | O, F | **GAP** — small, cheap |
| Channel doctrines (form rules) | M, F | **exist** (`cold-email-doctrine.md`, `linkedin-outreach-doctrine.md`) |
| Per-prospect research snippets (2-8 words) | M | gathered at runtime by A; pattern from the Clay map |

## The headline
The plumbing (5 systems) is mostly deterministic and mostly buildable/buyable. The **performance** of the
whole thing rides on three context-hungry judgments — extract, qualify, voice — and the context they need
is **overwhelmingly encoded expert judgment + captured demand evidence.** That substrate is largely a GAP
today. It is also exactly the asset that makes this Nick's, not a commodity outbound shop. Build order
implication: the context assets above are not a follow-on to the systems — for A and M, **they are the
gating input**, and capturing them (demand-context manual-first, the voice profile) is the real first move.
