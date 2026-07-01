# Cold Copy — CIPO Competitor Teardown (Will Rosellini) — v1

- **Type:** copy-draft (cold outbound, ghostwritten for SME)
- **Play:** konstellation-cipo / competitor-filing-teardown (Option A, locked)
- **Version:** v1 (2026-06-30) · supersedes copy-cipo-linkedin-will-v0
- **Status:** DRAFT — ship-blocked on the flags in §4 (route to Will via Hermes)
- **Sender:** Will Rosellini · **Owner:** Nick · **Channels:** LinkedIn (HeyReach, Will's account) + cold email (warmed domains)
- **Companion artifacts:** outreach-offer-ladder (Option A), icp-titles, segment-criteria, faithfulness-constraints, sme-voice / sme-identity / sme-credibility (will-rosellini, 2026-05-27)
- **Personalization tokens** (per-company, from `enrichment.nih`): `{first}` `{company}` `{science}` (their NIH project area) `{award_end}` (award end month)

The offer: a custom teardown of where a competitor is already filing patents in the prospect's exact space. Cold message earns a one-word "yes." Deliver-first: we produce it from data we already hold, prove it with a specific finding, then present it live. No calendar link in the cold touches (cold-stage = interest CTA only).

---

## 2. THE COPY

### LinkedIn (HeyReach, under Will)

**T1 — connection note (≤300 chars):**
```
{first} — fellow founder here, raising at the end of my own Phase 2, so I know the IP scramble before a Series A. I'd put together a teardown of where a competitor is already filing around {company}'s {science} — where they're boxing you in. Want it? Just reply "yes."
```

**T2 — DM, +3 days if no reply:**
```
{first} — to be clear, the teardown is real work, not a pitch: one competitor's recent filings in your space, where the wall's going up, where the white space sits. Takes me an afternoon. Reply "yes" and I'll get started.
```

**T3 — DM, +4 days, final:**
```
{first} — last note from me. You're heading into a raise; investors will press on your IP moat. I'll show you where {company} stands against a competitor's filings, on me. "yes" and it's yours.
```

### Cold email (warmed domains, under Will)

**Subject:** `a competitor teardown for {company}`
**T1:**
```
{first} —

I run the IP side for deep-tech founders, and I'm a founder myself — raising at the end of my own Phase 2, so I've lived the scramble to get the IP story straight before a Series A.

I'd pull a teardown of where a competitor is already filing patents around {company}'s {science}: where they're building a wall, and where the white space sits. Real work, on me — the kind of thing investors poke at before they wire.

Want it? Just reply "yes" and I'll get started. Nothing needed from you.

— Will
```
**T2 (+4 days):** short nudge — "still happy to put this together; reply 'yes'."

### Follow-through (on "yes")

**Auto-ack (minutes):**
```
Thanks {first} — on it. I'll pull where competitors are already filing around {company}'s space and come back with what I find. Nothing needed from you.
```
**Proof + book (after the teardown is produced):**
```
{first} — went through the recent filings around {company}'s {science}. Found a few crowding your lane, and one that looks like a real blocking risk before your raise. Rather than send a PDF you'll skim, let me walk you through it and the white space — grab 15 min here: [book link].
```

---

## 3. SOURCE MAP (line by line)

- "fellow founder … raising at the end of my own Phase 2" → [SME-identity: sme-identity-will-rosellini-2026-05-27 — "I'm the CEO raising money at the end of a Phase 2 … I know exactly what to do there"]
- "I run the IP side for deep-tech founders" / "15 years" implied → [SME-identity: "15 years … track record in monetization"] + [SME-credibility: Medical-Device/Biotech/Deep-Tech = Will's high-credibility segment]
- "a competitor is already filing around {company}'s {science}" → [offer-artifact: outreach-offer-ladder Option A] + [prospect-fact: `enrichment.nih` — their own NIH project; factual about THEM, not a Will claim]
- "where they're building a wall / where the white space sits" → [offer-artifact: Option A teardown definition]
- "investors will press on your IP moat / poke at before they wire" → [offer/problem-model: IP material to the raise] + [generic-frame: falsifiable, true of venture raises]
- "real work, not a pitch … takes me an afternoon" → [mechanism-of-action: agentic layer collapses cost-to-deliver; CIPO review] (kept as effort-signal, no capability invented)
- one-word "yes" CTA, no calendar in cold touches → [CTA-research: cold-stage interest CTA, 2-3x vs time-ask]
- "walk you through it … 15 min" (follow-through only) → [CTA-research: warm-stage specific CTA after positive reply]

---

## 4. FLAG LIST (ship-blockers — resolve via Hermes before send)

1. **Founder-peer frame** — leading with "I'm a founder raising at the end of my own Phase 2" puts Will's current personal situation in cold copy. Sourced to identity, but confirm he's comfortable opening with it under his name. *Ask Will: OK to lead cold outreach as a fellow-founder peer?*
2. **Target segment** — aimed at venture-/grant-backed deep-tech / biotech / med-device founders (his primary credibility segment). *Confirm or redirect.*
3. **Copy-approval mechanism** — does Will sign off every variant, changes-only, or first-template-only? (sme-voice gap.) *Set the mechanism.*
4. **TABA wedge — deliberately held from v1.** Strong ("$50K of TABA earmarked for IP"), but it's a claim about their funding and a budget nudge; confirm Will wants it in the sequence (likely a T2/follow-up line, not the cold open). *Ask Will: use the TABA angle, and where?*
5. **High-value hooks held pending verification** (available upgrades, not in v1): "first US FDA approval of an AI medical device" (needs device/company/year — faithfulness #2) and the $500–800/hr industry anchor (faithfulness #3). *Verify FDA claim → it becomes the strongest credibility line.*

Minor: offer doc top tier reads "Fortress" in offer-architecture but the qualify gate/surface use "Arsenal" — reconcile the tier name (not in this copy).

---

## 5. CHANNEL CONFIG
- LinkedIn: connect note ≤300 chars (T1 ~270). HeyReach under Will's account; respect daily connect/DM caps.
- Email: warmed burner domains; subject lowercase, no spam triggers; one link max, and only in the follow-through, not the cold touch.
- Cadence: LinkedIn T1 → +3d T2 → +4d T3; email T1 → +4d T2. Stop on reply.

## 6. DELIBERATELY NOT IN THE COPY
- No price figures (faithfulness #3). No "attorney/lawyer/counsel" — CIPO framing only (faithfulness #1). No refused vocabulary: "agentic," "agent," "canon," "orbits," "constellation," "star systems" (sme-voice blacklist). No FDA claim until verified. No law-firm targeting (faithfulness #4). No PatentVest branding (faithfulness #7). No calendar link in cold touches.

## 7. HOW THIS EVOLVES
v1 → resolve §4 flags with Will (via Hermes) → v1.1 (flags cleared, FDA hook added if verified, TABA line placed). Per-company personalization renders from `enrichment.nih` at send. Reply-rate + positive-reply data feed the next version.
