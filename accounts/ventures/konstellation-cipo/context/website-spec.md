# KonstellationAI.com — Website Spec (Konstellation CIPO)

Output of the `website-conversion-design` process, run 2026-06-30 against this
venture's context registry (`canon/`, `revops/`, `creative/`). **State: spec drafted
— build-ready, launch-gated.** The conversion architecture and sourced draft copy
below are ready for the kit/site build into STAGING. Public launch is gated on the
three decision gates at the bottom.

**Objectives:** lead-gen (primary) — qualified founder → opts into the front-end
offer (interest-based, no calendar); engagement (secondary) — a return reason for
founders not yet raising. One brand truth, both jobs.

**Source discipline:** every load-bearing line traces to a registry artifact (cited
inline as `[src: …]`). Anything unsourced is a marked gap, not a guess. No pricing
figures appear in copy (faithfulness-constraint #3). Will's refused vocabulary
(agentic/agent/canon/constellation/orbit/star, attorney/lawyer/counsel for Will) is
banned site-wide.

**Front-end offer — Will-certified ranking.** Will ranked the three front-end offers
**A > C > B** (email "offers for your review," reply 2026-06-26):
- **A = Competitor Filing Teardown** (Reverse Lead Magnet) — his #1. **The site leads with this.**
- **C = IP Velocity Score Read-Out** (Trojan Horse) — his #2. Documented secondary / campaign-landing variant.
- **B = Single FTO on the lead product** (Loss Leader) — his #3.
`[src: outreach-offer-ladder; Will email 2026-06-26]`

---

## 1. Information architecture (keep the path short)

| Page | Route | Primary job | Conversion action |
|------|-------|-------------|-------------------|
| Home | `/` | Carry the full narrative for a raising founder | "Get a teardown of your top competitor's filings" |
| Competitor Teardown (lead magnet) | `/competitor-teardown` | Deliver Will's #1 front-end offer; capture the lead | RLM opt-in (research-my-competitor) |
| Approach | `/approach` | Depth for the skeptical/technical founder | Secondary CTA back to the teardown |

Path: arrival (Home) → promise + proof → opt into the competitor teardown → we
research + deliver it → exploratory conversation → ascent to the Shield/Arsenal
retainer. The website's only job is the first opt-in. `[src: offer-architecture-and-pricing,
outreach-offer-ladder]`

The teardown is a **Reverse Lead Magnet**: the ask itself is the magnet — "tell us
your top competitor; we'll spend the time researching their recent filings and put a
teardown together for you specifically." It reads as custom 1:1 work (high perceived
value up-market), lands on the founder's acute fixation ("is a competitor boxing me
in?"), and ladders to Shield/Arsenal. `[src: outreach-offer-ladder Option A]`

---

## 2. Home — per-page conversion structure (leverage order)

### 2.1 Above-the-fold promise + primary CTA  [block: Hero]
- **Promise (draft):** "Continuous IP intelligence, plus a Chief IP Officer's
  judgment — at a subscription, not $500–800 an hour." `[src: value-proposition-canon;
  customer-problem-model — competitor hourly range is Will's framing, flag for Will]`
- **Subhead (draft):** "The AI does the analysis. A fractional Chief IP Officer does
  the judgment. You get both." `[src: value-proposition-canon; sme-voice — signature line]`
- **Primary CTA:** "Get a teardown of your top competitor's filings" → `/competitor-teardown`
- **Proof strip (draft):** "Led by Will Rosellini · 15 years in IP monetization ·
  raised a Series A himself" `[src: sme-voice, sme-credibility]`

### 2.2 Proof immediately under the promise  [block: Proof]
- The mechanism in one line: "Hourly billing makes deferral the rational choice —
  until the bill comes due at the raise: thin portfolio, weaker round, blocking
  patents nobody saw." `[src: mechanism-of-action; sme-voice — Will's problem-naming]`
- Credibility anchors (sourced, verbatim-safe): "15 years in IP monetization,"
  "I raised a Series A myself at the end of a Phase 2 — so I know exactly what an
  investor wants the IP story to look like." `[src: sme-voice]`
- No logos/case studies yet (startup stage) — proof is mechanism + Will's track
  record, not customer logos. `[src: digest §4 — outcome proof partial]`

### 2.3 The problem → how it works  [block: HowItWorks / Mechanism]
- Problem: episodic consulting creates blind spots; deferral compounds risk.
  `[src: customer-problem-model, mechanism-of-action]`
- How it works, 3 steps: (1) AI runs FTO / prior-art / landscape / competitor
  filings. (2) The CIPO turns analysis into strategy, portfolio framing, and the
  investor narrative. (3) Continuous monthly monitoring catches landscape shifts
  episodic consulting misses. `[src: mechanism-of-action steps 2–4]`

### 2.4 The offer shape (NO figures)  [block: Offer/Tiers — pricing gated]
- Show three tiers as *shapes*, not prices: Scout (continuous monitoring), Shield
  (adds competitive intelligence + investor-narrative prep), Arsenal (adds
  outcome-aligned participation). Render a `[pricing pending Will]` placeholder where
  numbers would go. `[src: offer-architecture-and-pricing; faithfulness-constraint #3]`

### 2.5 Objection handling  [block: Objection]
- "Why not a patent firm?" → continuous vs episodic; predictable subscription vs
  open-ended hourly. `[src: customer-problem-model]`
- "Why not wait until we raise?" → that's when the bill comes due. `[src: sme-voice]`
- "Is this legal counsel?" → No. Will is your fractional **Chief IP Officer** —
  strategy and judgment, not legal representation. `[src: faithfulness-constraints
  title rule — never imply attorney/counsel]`

### 2.6 Secondary CTA + capture  [block: CTA + Capture]
- Repeat the competitor-teardown CTA. Capture is the RLM ask itself: name, work
  email, company, and "your top competitor (or the space you're worried about)" — we
  research and send the teardown; no calendar, no commitment. `[src: outreach-offer-ladder
  Option A — the ask is the magnet; cold-stage conversion = interest, no calendar]`

### 2.7 Engagement hook (secondary objective)
- For founders not yet raising: offer the teardown as the entry + a low-frequency
  note on IP-at-the-raise. Return reason without a hard ask. `[src: objectives]`

---

## 3. `/competitor-teardown` — lead magnet page  [blocks: Hero (compact) + Capture]
- Promise: "We'll tear down your top competitor's recent patent filings — where
  they're building a wall, and the white space they've left you."
- The ask IS the magnet (RLM): "Tell us your top competitor; we'll spend the time
  researching their filings and put a teardown together for you." Custom 1:1 work,
  CIPO-reviewed, carrying the 18-month publication-lag disclaimer. `[src:
  outreach-offer-ladder Option A; mechanism-of-action steps 2–3]`
- Capture form (the site's primary conversion event): name, work email, company,
  top competitor / worried space. Disqualify-aware microcopy: for venture-backed
  founders, not law firms or patent-prosecution-only needs. `[src: icp-and-disqualifiers
  — hard exclusions]`

## 4. `/approach` — depth page  [blocks: HowItWorks + Proof + Objection]
- Long-form mechanism + Will's credibility, for the technical/skeptical founder.
  Same sourced content, more room. Secondary CTA back to the teardown.

## 4a. Secondary variant (build later, not in the staging slice)
- `/ip-velocity-score` — Will's #2 offer (C, Trojan Horse): a one-time IP Velocity
  Score read-out (depth, competitive position, prosecution velocity, commercial
  alignment, risk), framed as a diagnostic. Reuses the same kit blocks; different
  copy + capture. Stand up as a campaign-landing variant after the primary ships.
  `[src: outreach-offer-ladder Option C]`

---

## 5. Copy routing (briefs — final lines NOT written here)
- Hero/identity lines + headlines → **creative-copy** (use the drafts above as the brief).
- Any Will-voiced / first-person line → **copy-draft**, with a source map, then to
  **Hermes** for Will's sign-off. Examples flagged above ("I raised a Series A
  myself…", "hired gun" if used).
- The site writes the *brief*; Hermes routes final expert-voiced copy to Will.

## 6. Visual direction → DECISION GATE (not resolved)
- No visual identity exists. CIPO must define its own — it **cannot** inherit KAI's
  astronomical/"constellation" frame (Will's controlled-lexicon refuses it).
  `[src: controlled-lexicon, voice-codex "do not auto-inherit"]`
- Build proceeds on a **provisional, refusal-safe theme**: neutral, authoritative,
  credibility-forward (think "fractional executive," not "legal SaaS," not "space").
  Route a real visual direction to Will via Hermes (gate #2). Layout/components →
  **ui-ux-pro-max**, fed the provisional theme tokens.

## 7. Instrumentation
- **Primary conversion event:** `competitor_teardown_requested` (the capture form).
- **Capture fields:** name, work email, company, top competitor / worried space.
- **Per-page success metric:** Home → CTA click-through to `/competitor-teardown`;
  `/competitor-teardown` → form completion rate; `/approach` → CTA-back rate.
- Analytics provider TBD at build (Vercel Analytics or PostHog).

---

## 8. Decision gates (block public launch, NOT the staging build)
1. **Domain + brand fork** — KonstellationAI.com takeover vs CIPO's own domain. → Polaris + Will.
2. **Visual identity** — define CIPO's own (refusal-safe). → Hermes routes to Will.
3. **Copy + public pricing sign-off** — generated copy + any price figures. → Hermes routes to Will.

Resolved (no longer open): front-end offer choice — Will ranked A>C>B; site leads
with A (Competitor Filing Teardown). Until the three gates clear: staging preview
only, draft copy, `[pricing pending]` placeholders, no custom domain.
