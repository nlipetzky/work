# Copy — CIPO LinkedIn cold sequence (Will Rosellini)

**Artifact type:** Cold outreach copy (LinkedIn DM sequence)
**Play:** Konstellation CIPO — fractional Chief IP Officer offering
**Version:** v0 (DRAFT — not cleared to send)
**Status:** PENDING expert sign-off (Will) on the flagged lines below
**Sender:** Will Rosellini (sole sender)
**Owner:** Nick Lipetzky
**Created:** 2026-06-25
**Channel:** LinkedIn (connect note + 3 follow-up DMs), sender's own account
**Target:** Venture-backed deep-tech / biotech / medtech founders, ~Series A stage, where IP is material to valuation — the intersection of the approved ICP and Will's highest-credibility segment ("Medical Device / Biotech / Deep Tech — the segment Will most wants to pitch; treat as primary" — sme-credibility).
**Companion artifacts:** offer-architecture-and-pricing, icp-and-disqualifiers, customer-problem-model, mechanism-of-action, faithfulness-constraints (all approved); sme-identity, sme-voice, sme-credibility, sme-hot-takes (Will SME bundle).

---

## The copy

### Touch 1 — Connect note (≤300 chars)
```
{{firstName}} — I'm a fractional Chief IP Officer for venture-backed deep-tech founders. 15 years in IP monetization. I'm building continuous IP strategy for teams who keep deferring it because patent firms bill $500-800/hr with no ceiling. Worth connecting?
```

### Touch 2 — DM, on accept
```
Thanks for connecting, {{firstName}}.

Quick reason I reached out: most venture-backed founders I talk to defer IP strategy — not from carelessness, but because hourly patent billing is unpredictable, so deferring is the rational call. Then the bill comes due at the raise: a thin portfolio, a weaker round, a blocking patent nobody saw coming.

I run it differently. The AI does the analysis — FTO, prior art, landscape. I do the judgment, as your Chief IP Officer. A subscription, not an hourly meter, so you actually use it before it's too late.

Want the 2-minute version of what we'd look at first for {{company}}?
```

### Touch 3 — DM, ~3 days no reply
```
{{firstName}} — one more, then I'll leave it alone.

The piece founders miss: IP isn't a one-time project you buy and forget. Competitors keep filing while you're heads-down building, and episodic IP consulting can't see that. A continuous one can — competitor filings, FTO, and landscape, tracked every month.

I've spent 15 years doing this, and I've raised a Series A myself at the end of a Phase 2 — so I know exactly what an investor wants the IP story to look like.

If a 1-page read of your IP exposure would help before your next raise, say the word and I'll put it together.
```

### Touch 4 — DM, ~4 days no reply (breakup)
```
{{firstName}} — closing the loop. If IP isn't on the front burner yet, no worries; it usually isn't until a raise or a cease-and-desist forces it. When that day comes, I'm easy to find. Good luck with {{company}}.
```

---

## Source map (line by line)

**Touch 1**
- "fractional Chief IP Officer" → [SME-credential/faithfulness: faithfulness-constraints#title-rule — CIPO is the APPROVED title; "attorney/lawyer" forbidden]
- "venture-backed deep-tech founders" → [audience: icp-and-disqualifiers#fit-signals + sme-credibility#medical-device-biotech-deep-tech "treat as primary"]
- "15 years in IP monetization" → [SME-verbatim: sme-identity#self-description "I've been in the business for 15 years that has a track record in monetization"]
- "continuous IP strategy for teams who keep deferring it" → [artifact: customer-problem-model "episodic vs continuous"; "deferral is the rational choice"]
- "patent firms bill $500-800/hr with no ceiling" → [artifact: customer-problem-model "$500-800/hr with no ceiling" — INDUSTRY anchor, not our price] ⚑ see flag 2

**Touch 2**
- "defer IP strategy — not from carelessness, but because hourly patent billing is unpredictable, so deferring is the rational call" → [artifact: customer-problem-model#mechanism-1 verbatim sense]
- "the bill comes due at the raise: a thin portfolio, a weaker round, a blocking patent nobody saw" → [artifact: customer-problem-model#what-it-costs "weak portfolio → lower valuation, weaker fundraise, exposure to blocking patents"]
- "The AI does the analysis — FTO, prior art, landscape. I do the judgment, as your Chief IP Officer." → [artifact: mechanism-of-action#step-2 + #step-4 "the AI produces data, the CIPO produces judgment"]
- "A subscription, not an hourly meter" → [artifact: offer-architecture-and-pricing — subscription model] ⚑ see flag 3 (model only, no figure)
- "Want the 2-minute version of what we'd look at first for {{company}}?" → [CTA: interest-based, cold-stage, no calendar — cta-research]

**Touch 3**
- "IP isn't a one-time project... competitors keep filing while you're heads-down... episodic can't see that; a continuous one can — competitor filings, FTO, landscape, tracked every month" → [artifact: customer-problem-model#mechanism-2 (episodic blind spots) + mechanism-of-action#step-3 (continuous monitoring, monthly)]
- "15 years doing this" → [SME-verbatim: sme-identity]
- "raised a Series A myself at the end of a Phase 2 — so I know exactly what an investor wants the IP story to look like" → [SME-verbatim: sme-identity "I'm the CEO raising money at the end of a Phase 2 trying to get the Series A done. So I know exactly what to do there"]
- "1-page read of your IP exposure... say the word" → [CTA: interest-based, cold-stage]

**Touch 4**
- "until a raise or a cease-and-desist forces it" → [artifact: customer-problem-model "blocking patents discovered only when a competitor sends a cease-and-desist"]
- breakup framing → [CTA: low-pressure close]

---

## Flag list (SHIP-BLOCKERS — resolve via Will before this sends)

These are the lines I could not fully self-source. Route to Will (via the Expert Liaison console / Hermes). Do not paste into a send tool until each is resolved or explicitly overridden.

1. **The whole sequence needs Will's cold-copy sign-off.** sme-voice Gap #2: Will has not defined his copy-approval mechanism. This v0 is PENDING his review under his own name. → Ask: "Approve this LinkedIn sequence to send under your name, or mark edits?"

2. **"First US FDA approval of an AI medical device" — DELIBERATELY HELD OUT of v0.** It's Will's strongest hook, but sme-identity Gap #6 + faithfulness-constraints#2 require device + company + year confirmed before public use. I left it out rather than ship an unconfirmed credential. → Ask: "Which device/company/year? Confirm it's defensible, and I'll add it as the lead hook (big upgrade)."

3. **Industry hourly anchor "$500-800/hr"** (Touch 1) — sourced to the approved problem-model, and it's the *competitor's* rate, not ours. But faithfulness-constraints#3 guards pricing under Will's name. → Ask: "OK to cite '$500-800/hr patent billing' as the industry anchor in your copy?"

4. **"A subscription, not an hourly meter"** (Touch 2) — the model, no figure. Still implies our pricing structure. → Ask: "OK to say 'subscription, not hourly' publicly (no number quoted)?"

5. **Target segment confirmation** — I aimed at venture-backed deep-tech/biotech founders (your primary high-credibility segment). → Ask: "Confirm this segment for batch one, or redirect (e.g. DoD/SBIR-adjacent deep tech)." (The actual prospect *list* is a separate revops build, not a copy blocker.)

---

## CTA / channel config
- **Channel:** LinkedIn, Will's account. Connect note ≤300 chars (Touch 1 is ~250).
- **Cadence:** connect → (on accept) Touch 2 → +3d Touch 3 → +4d Touch 4. No calendar links, no "30 minutes" at cold stage (interest CTAs convert 2-3x cold — cta-research).
- **Send caps:** stay within LinkedIn safe connect/DM limits per day per account (HeyReach or manual).

## Deliberately NOT in the copy
- **No price figures** (faithfulness#3). Tiers/numbers route through Will.
- **No "attorney / lawyer / counsel"** for Will (faithfulness#1) — "Chief IP Officer" only.
- **No refused vocabulary** — "agentic," "agent," "canon," "constellation/orbit/star systems" (sme-voice refused list). Plain commercial language only.
- **No hot-takes** ("the whole law firm is going away," the SBIR data-rights loophole) — all marked cold-copy-approval PENDING and bridge-burning; held for a spicier variant if Will green-lights.
- **No profanity** (sme-voice: not client-facing).
- **No law-firm / IP-services targeting** (faithfulness#4, hard exclusion).

## How this evolves
- v1 once Will resolves the flags (esp. the FDA hook → lead with it).
- A/B the connect-note hook (credential-led vs problem-led) after reply data.
- A spicier "law firm is going away" variant if Will approves that take for cold copy.
- Nick-as-sender variant later (different voice, different source rules — Nick is the source then).
