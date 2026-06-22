# Segment Criteria — Patent Portfolio Management Play

**Status:** v0.2 SCAFFOLD. Restructured against Deepline upstream-input contract (industry/geo/revenue/employee/stage/tech/signals axes; disqualifiers categorized by enforcement; sub-segment tagging with explicit "other" + decision + tiebreaker rules). Four sub-ICP blocks remain placeholders to be populated by the 2026-06-10 intake. Umbrella axes are partial-confidence and need Will's verification.
**Engagement:** Konstellation AI (venture)
**SME / Operator:** Will Rosellini
**Drafted by:** Kepler, 2026-06-09
**Pairs with:** `cmo-intake-checklist-2026-06-10.md` (Section 2 fills the sub-ICPs) and `revops-icp-titles-patent-portfolio-mgmt.md` (title tiers per sub-ICP)

---

## Offer (one sentence, partial lock)

A $3k/month subscription that runs an agentic system on a patent owner's behalf to surface and pursue infringement opportunities, managed by a CIPO who synthesizes findings back to the owner.

**Locked:** price, format (subscription), agent count tiers (5 or 10), human layer (CIPO synthesis call cadence).
**Not locked:** the "why now" trigger per sub-ICP, what the CIPO actually delivers per month, what's IN vs OUT of the agent work.

---

## Population (umbrella)

Patent owners with one or more active patents who suspect or could plausibly suspect commercial infringement, and who have the means and authority to retain a $3k/month service against that suspicion.

**Important:** "patent owner" is a population, not an ICP. The four sub-ICPs below cut this population into actionable segments. Do not run outbound against the umbrella.

---

## Umbrella segment definition (7-axis format)

This block is the source-agnostic input the downstream evaluation step turns into provider filters. Empty axes are TBD-from-intake, not skipped.

| Axis | Value | Notes |
|---|---|---|
| Industry | TBD-from-intake | Likely "industries where commercial infringement is common." Need Will to name two or three concrete vertical sectors per sub-ICP. |
| Geography | TBD-from-intake | US-only? US + Canada? International with US-issued patents? Drives H5 below. |
| Revenue band (of patent owner's commercial entity) | TBD-from-intake | Floor and ceiling. Each sub-ICP may set its own. |
| Employee band | TBD-from-intake | **Label, don't filter** ... use for prioritization signal, not exclusion. |
| Stage qualifier | Post-revenue commercial operation tied to the patent | Distinguishes from pre-commercial / pure academic. |
| Technology profile | Determined per sub-ICP | Not a global axis ... each sub-ICP's industry sets this. |
| Hiring / funding / news signals | Continuation/divisional filings, enforcement notices, product launches that overlap a held patent, recent IP-related press | **Label, don't filter** ... feeds soft signals below. |

---

## Hard filters (all must match, derived from the axes above)

| # | Criterion | Type | Observability |
|---|---|---|---|
| H1 | Named on one or more active (non-expired) patents as inventor or assignee | demographic / firmographic | USPTO assignee data, patent filings |
| H2 | Patent(s) issued, not pending | demographic | USPTO grant status |
| H3 | Has commercial standing to retain a service (legal authority + means) | demographic | Public records, basic OSINT |
| H4 | English-language fluency sufficient for synthesis call cadence | demographic | LinkedIn / public profile language |
| H5 | TBD-from-intake: jurisdiction filter | demographic | Patent office of filing |

Five hard filters is the right ceiling. Resist adding more here. Behavioral/relational nuance belongs in soft signals or disqualifiers.

---

## Soft signals (scored, weighted)

| # | Signal | Type | Weight | Mode | Observability |
|---|---|---|---|---|---|
| S1 | Publicly expressed frustration about infringement, IP theft, or "knockoffs" | behavioral | high | score | LinkedIn posts, podcasts, press, forums |
| S2 | Owns multiple patents in same product family (strategic IP posture) | demographic | high | score | Patent count + classification clustering |
| S3 | Consulted with patent counsel or filed continuations/divisionals in last 24 months | behavioral | medium | score | USPTO filing history |
| S4 | Appears at industry conferences / panels / publications as inventor / IP voice | relational | medium | score | Conference rosters, speaker bios |
| S5 | Active on LinkedIn with non-trivial reach (1k+ followers, posts in last 90 days) | behavioral | medium | score | LinkedIn signals |
| S6 | Has public-facing business / product tied to the patent (not pure research) | firmographic | high | score | Company website, product page |
| S7 | Prior history of licensing, litigation, or IP enforcement | behavioral | high | score | PACER, court filings, licensing announcements |
| S8 | Revenue / employee band fits the affordability-of-$3k/mo window | firmographic | TBD | **label, don't filter** | Provider firmographics |

"Mode" column makes the label-don't-filter discipline explicit. Default is "score." Anything in "label, don't filter" mode never blocks a record ... it tags for prioritization.

---

## Disqualifiers (categorized by enforcement mechanism)

Deepline pattern: every disqualifier has to specify HOW it gets enforced ... a clean provider filter, a classifier prompt, or a runtime do-not-contact list. Without this split, disqualifiers leak into the activation list.

### Filter-encodable (provider filter at universe-build time)

| # | Criterion | Reasoning |
|---|---|---|
| D1 | Currently engaged in active litigation on the patent in question | Already represented; not in market |
| D2 | Patent expired more than 6 months ago with no continuations | No commercial standing |
| D5-filter | TBD-from-intake: jurisdiction exclusions (mirrors H5) | Drives provider geo filter |

### Classifier-encodable (fuzzy categories, decided by LLM classifier at qualification time)

| # | Criterion | Reasoning |
|---|---|---|
| D3 | Pure academic inventor with no commercial entity behind the patent | Misalignment with subscription model; rarely authority to retain. Fuzzy because some academics DO have commercial entities ... needs classifier judgment, not a clean filter. |
| D6 | TBD-from-intake: sectors / technology areas Will refuses (e.g. weapons, certain biotech) | Will sets the list; classifier enforces. |

### Runtime DNC list (Will must produce and maintain)

| # | Criterion | Reasoning |
|---|---|---|
| D4 | Already a SemIP / PatentVest client or active prospect for the same patent | **RUNTIME INPUT.** Will is at SemIP. Channel conflict can't be encoded statically ... Will has to surface the list per outreach batch. |
| D7 | TBD-from-intake: any current advisory / board / commercial relationships Will has with patent owners | **RUNTIME INPUT.** Same pattern. Will surfaces, agent enforces. |

**Operational consequence:** D4 and D7 are runtime inputs (Deepline input #21 pattern). They block execution if not produced. Add to tomorrow's intake as an explicit ask.

---

## Sub-segment tagging logic

Five buckets: four named sub-ICPs + an explicit "other" bucket. Every record gets exactly one tag. The "other" bucket prevents force-fitting and preserves the learning signal.

### Schema per sub-ICP

Each slot below requires three things to be considered populated:
1. **Defining cut** ... what specifically distinguishes this sub-ICP from the others?
2. **Decision rule** ... what makes a row land in this bucket (deterministic where possible)?
3. **Tiebreaker rule** ... when multiple sub-ICPs could apply, how does the classifier pick?

### Sub-ICP 1 — [PLACEHOLDER, name TBD-from-intake]

- **Defining cut:** TBD
- **Decision rule:** TBD
- **Tiebreaker rule:** TBD
- **Sub-ICP-specific hard filters:** TBD
- **Sub-ICP-specific soft signals:** TBD
- **Channel hypothesis:** TBD

### Sub-ICP 2 — [PLACEHOLDER]

(same structure)

### Sub-ICP 3 — [PLACEHOLDER]

(same structure)

### Sub-ICP 4 — [PLACEHOLDER]

(same structure)

### Sub-ICP 5 — "other"

- **Defining cut:** any record that passes all umbrella hard filters but does not match the decision rule of sub-ICPs 1–4.
- **Decision rule:** assigned by elimination after sub-ICPs 1–4 evaluated.
- **Tiebreaker rule:** N/A ... terminal bucket.
- **Purpose:** preserves the long-tail signal so reply data can reveal a fifth pattern Will didn't anticipate. Do NOT collapse the "other" bucket into sub-ICP 1–4 prematurely ... that destroys the learning loop.
- **Outbound posture:** depriortize until reply data justifies elevation.

---

## Confidence and gaps

### What I'm confident in

- The umbrella population (patent owners with perceived infringement) is broad enough to contain the four sub-ICPs.
- The offer mechanics ($3k/month, 5/10 agents, CIPO-managed) are locked per the 2026-06-09 transcript.
- The 7-axis structure is the right input shape for any downstream evaluation step (Deepline or otherwise).
- H1–H4 will hold regardless of how the four sub-ICPs are defined.
- D1, D2 are defensible without Will's confirmation.
- D4 and D7 as runtime DNC inputs (not static rules) is the correct enforcement pattern given Will's SemIP role and advisory relationships.

### What I'm not confident in

- **The four sub-ICPs.** Entire point of the 2026-06-10 intake. Placeholders by design.
- **Jurisdiction (H5 + D5-filter).** Will hasn't confirmed scope.
- **Revenue / employee bands (S8 + axis row).** $3k/month is non-trivial for solo inventors and trivial for public companies; thresholds depend on which sub-ICP.
- **The "why now" trigger per sub-ICP.** Without this, outbound copy will be generic.
- **The full sector exclusion list (D6).** Will sets, I can't pre-fill.

### Decisions against the brief

- Treating "patent owner" as a population, not an ICP. Refusing to draft against the umbrella as if it were one ICP.
- Not pre-filling sub-ICP slots with guesses. Slots are empty by design.
- Putting D4 and D7 in the runtime-DNC enforcement bucket, not the static-rule bucket. This means execution can't proceed until Will produces the lists.
- "Other" sub-ICP bucket is mandatory, not optional. Preserves learning loop.

### Inputs that need to come from elsewhere (not segment file)

Per Deepline 2.7, 2.10, and Section 7, these belong in a separate creative-brief artifact:
- Proof points / disallowed claims
- Personalization rule + hook sources
- Pricing posture / case-study posture for cold copy

Queue: build `revops-creative-brief-patent-portfolio-mgmt.md` after the intake.

### Operational gaps to surface tomorrow

Deepline flags these as the inputs that get forgotten and block execution:
- **Activation destination** (where qualified leads land for outreach ... HeyReach? Smartlead? Manual?)
- **CRM landing schema** (where qualified records land for tracking)
- **Cost budget** (how much per month is acceptable for sourcing/enrichment)
- **Do-not-contact list** (D4 + D7 ... see above)

Add these to the operational section of tomorrow's intake.

### Follow-up NotebookLM queries (run after intake, against KAI notebook)

Once Will's 100 conversations are ingested into a structured store, run these:
1. **ICP language.** "What language do patent owners use to describe the moment they realize they may be infringed? Pull verbatim phrases."
2. **Past response patterns.** "Which patent-owner profiles produced response in Will's first 100 conversations? Cite specific cases."
3. **Burned audiences.** "Have any patent-owner audiences been over-fished or generated negative response?"
4. **Disqualifier history.** "Which patent owners has Will declined to work with, and why?"
5. **Named-account avoid list.** "Which named patent owners or assignees has Will explicitly excluded?"

If KAI hasn't built the conversation ingestion pipeline, this is a context gap to name as a roadmap item.

---

## What this scaffold is for

- **Tomorrow's intake (2026-06-10, 10 a.m. central):** structure for capturing Will's answers in Section 2 of the CMO checklist.
- **Post-intake:** Kepler returns to this file, fills the four sub-ICP blocks, ships v0.3 for Will to react to ... one sub-ICP at a time per Will's "don't overwhelm me" constraint.
- **Downstream consumer:** the evaluation step that turns criteria into actual lists. Source-agnostic by design ... no column names, no provider names, no SQL here.

## What this scaffold is NOT

- Not a finalized segment criteria artifact. v0.2 only.
- Not a pitch document. Internal only.
- Not a substitute for the intake meeting.
- Not constrained to a specific data provider.
- Not the home for proof points, personalization rules, or cold copy ... those live in a creative-brief artifact.
- Not the home for title tiers ... those live in `revops-icp-titles-patent-portfolio-mgmt.md`.
