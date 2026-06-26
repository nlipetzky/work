# LinkedIn Outreach Doctrine

Source: deep-research synthesis (2026-06-23), seeded from HeyReach's hub + Expandi, Belkins, Botdog,
LaGrowthMachine, PhantomBuster, Dux-Soup, Lemlist, Evaboot. 29 sources fetched, 25 claims adversarially
verified (21 confirmed, 4 killed). The LinkedIn analog to `cold-email-doctrine.md`.

**Read this first — source quality.** Every quantitative benchmark below is **vendor self-reported
platform data** (Expandi, Belkins+Expandi, Botdog, HeyReach), selection-biased toward each tool's own
users running that tool's defaults. Treat numbers as **directional ranges, not constants**. This mirrors
our own "canon demand signal is selection-biased" caution. Where a number is contested or unverified, it
says so — do not launder a placeholder into a fact.

---

## 1. Account infrastructure & safety
- **Daily action ceiling: ~200 actions/day/account** (HeyReach freeze point). **Any click is one action** — a profile view, a like, a message, a connection request all draw from the same budget. The limit is account-level and **shared across all campaigns** that account runs, not per-campaign. [HeyReach]
- **Warm-up is mandatory, ~14-day gradual ramp.** Documented example: start **10 actions/day, +2 every 3 days, ceiling 20/day**. Skipping warm-up gets new accounts restricted within **7-14 days** (PhantomBuster/Closely/Botdog corroborate). Warm-up only runs when the account has an active campaign with leads loaded. [Expandi]
- **One dedicated static residential proxy per account, never shared.** LinkedIn favors a stable non-rotating IP that looks like one real user. [HeyReach] **CONTESTED (2026):** detection-survival data suggests mobile 4G/5G proxies (~85%) now beat residential (~50%) after LinkedIn expanded detection in 2025. Architecture (one dedicated IP/account) is settled; *which type* is an open call.
- **Mobile Connector adds capacity:** +**50-100 connection requests/week** on top of the standard cap (mobile-app requests are metered separately), **requires 2FA**, and **cannot carry a note**. [Expandi, vote 2-1]
- **Weekly invite cap is reputation-based, not a flat 100.** *(2nd-pass, ~5 sources converge, verify gate incomplete — see note at end.)* The real answer: LinkedIn meters connection requests dynamically by account trust. Standard account ~**80-100/week**; high-trust (SSI >65, acceptance >40%) up to ~**150-200/week**; an account whose acceptance falls below ~20% can be throttled to ~**50/week**. Daily safe automated rate ~**20-40 connection requests/day** (HeyReach: LinkedIn capped requests at 20-40/day since May 2023), some sources tighter at 15-20/day, hourly ≤10. Randomize within a daily *range* (Expandi e.g. 20-27/day), never a fixed number.
- **Account count: scale by adding accounts, not by raising per-account volume.** *(2nd-pass, HeyReach primary docs + for-agencies page.)* This is THE agency model and the most decision-relevant finding: one account safely produces only ~100-200 connects/week, so target volume ÷ ~150 = number of sender accounts. HeyReach assigns **unlimited sender accounts to one campaign with auto-rotation** (and a unified inbox). So "how many accounts" is a pure function of your weekly volume target, not a fixed number.

## 2. Targeting
- **Open Profiles are the highest-value non-connection tier:** message via **free Open InMail** without spending a connection request. LinkedIn caps free Open InMail at **800/month/account**; ramp ~25/day (warm-up) to ~40/day steady. Filter the list on Open-Profile status first. [Expandi]
- **Degree of connection matters.** *(2nd-pass, Cleverly + LinkedIn help, verify incomplete.)* 2nd-degree with shared connections beats cold 3rd-degree; engaging with a prospect's content *before* requesting can push acceptance >60% vs ~20-30% for cold context-free. So warm the 3rd-degree before the request.
- **Group + event channels (connectionless).** *(2nd-pass, LinkedIn help — primary but unverified.)* Fellow **Group members** and coworkers can be reached via a **message request without connecting first** — a real connectionless channel. **Event** messaging looks degraded: a plain attendee can now only message attendees they're *already connected to* (the old message-request-to-non-connected-attendee path appears removed); organizer-messaging is unconfirmed. Treat Groups as the live connectionless play; don't build on Event-attendee DMs until reconfirmed.

## 3. Copywriting (connection note + first DM)
- **The note's job is to win the REPLY, not the accept.** Belkins (20M+ attempts): note vs no-note acceptance is near-parity (**26.42% vs 26.37%**) but note nearly **doubles reply rate (9.36% vs 5.44%, ~1.7x)**. So personalize for the downstream conversation, not the connection. [Belkins, vote 2-1]
  - **CONTESTED, loudly:** Botdog/ReactIn/growleads report noteless requests *win acceptance materially* (~55-68% noteless vs ~28-45% noted). The accept-half is the **single biggest unresolved disagreement** in the field. Only the reply-lift half is consensus. Test both on your own list.
- **Note-reply value is decaying:** connection-note reply rate fell **3.5% → 2.2% over 12 months (-37%)** while post-acceptance message reply held flat ~10-11%. Shift weight off the note onto the post-accept DM. [Expandi]
- **AI-assisted first message:** modest edge on initial reply (**4.19% vs 2.60%**) and total (7.66% vs 6.50%), but **non-AI wins follow-ups** (3.91% vs 3.48%). Mixed, not a slam dunk. [Belkins]
- **Character limit: 300, on every plan.** *(2nd-pass, ReactIn ×2, verify incomplete.)* The note cap is **300 characters across Free/Premium/Sales Navigator/Recruiter** (spaces + emojis count), stable since 2023. The "200-char" figure is **InMail subject lines, not connection notes** — that confusion is now resolved. Practical advice: ~140-180 chars referencing one specific trigger; pitching inside the note hurts.
- **No-note-vs-note is shifting toward no-note for ACCEPTANCE.** *(2nd-pass adds weight.)* Four more sources (Botdog, ReactIn 80k+ requests, Outflo, Leadriver) report **blank requests beat noted on acceptance** (~55-68% blank vs ~28-45% generic-noted), against Belkins' near-parity. The reply-lift-from-notes consensus still holds. Net read: **a note costs you some accepts to buy more replies** — so use no-note (or a trigger-anchored note) to maximize *connections*, accept the note only when reply quality matters more than connection volume. Still vendor data; A/B on your own list.

## 4. Offer / CTA
- Thin verified data. The cross-channel signal: **a direct message is the single highest-leverage action** (see §6). Carries the email doctrine's low-resistance-CTA logic by analogy, but LinkedIn-specific soft-vs-hard-ask data did not surface as a verified claim. Treat as **inherited from email doctrine until LinkedIn-specific evidence exists.**

## 5. Sequencing & the multichannel angle
- **The acceptance gate is the spine.** Connector campaigns **auto-revoke the request if not accepted**; follow-up messages fire **only after acceptance** (you cannot DM a non-connection without InMail). This is the structural difference from email — there is no "send anyway." Auto-revoke timing is a configurable withdrawal-period setting. [Expandi]
- **HeyReach sequence model:** 7 action-step types — Send Connection Request (+note), **If Connection** (branch on already-connected), Send Message, InMail, View Profile, Follow, Like Post — plus Delay and End. **Minimum 3-hour delay between any two actions** (only exception: the first step of each If-Connection branch). [HeyReach]
- **Stack a passive touch with the DM:** message-alone reply **4.88%**; **message + profile visit → 11.87%** (~2.4x). Profile views/likes alone ≈ 0 reply but are worth it *as warm-up touches stacked before/with the DM*. [Belkins]
- **GAP — email interleave.** The exact LinkedIn↔email combined-cadence step order, which channel leads, and inter-channel delays **did not survive verification**. Only within-LinkedIn multi-action data is solid. LaGrowthMachine is the documented multichannel reference but its specific timing wasn't verified.

## 6. Metrics & benchmarks
- **Acceptance rate reality: ~26-29% platform-wide,** NOT the 45%+ vendor marketing implies. Belkins/Expandi (20M+, 2024): ~26%. Expandi 2026 (13.2M requests): **28.5%**. Botdog self-study: 37% blended. The "45% personalized / 70-90% hyper-personalized" figures were **REFUTED (0-3)** — do not use.
- **Post-acceptance message reply: ~10-11%.** Connection-note reply: **2.2-3.5% and falling.**
- **Single-action reply ladder:** DM **4.88%** > connection request 3.53% >> passive (profile view, like, message-less) ≈ 0. Two-action combo (msg + visit) **11.87%**.
- **Diagnostic threshold: acceptance < ~25% = a TARGETING problem first** (wrong titles/industries/geo), then weak profile, then timing. Note: 25% is editorial advice, not dataset-derived; some peg the hard-fail line at <20% and treat 25% as merely mediocre. [Botdog]
- **The "J variable" analog:** compute connections→replies→positive-replies→booked-call per account so you can size account count to a target. Channel benchmarks are NOT comparable to email — track LinkedIn separately.

---

## Where the sources disagree (carry these as live tensions, not settled law)
1. **Note help/hurt/neutral on ACCEPTANCE** — Belkins near-parity vs Botdog/ReactIn noteless-wins-big. Unresolved. Consensus only that notes lift *replies*.
2. **Headline acceptance benchmark** — ~26% vs 28.5% vs 37%. Use the 26-29% range; discard 45%+.
3. **Proxy type** — dedicated static residential (documented) vs mobile 4G/5G (better 2026 survival).

## Named gaps (per artifact discipline — what to source next)
A 2nd research pass (2026-06-23) closed four of the six with multi-source convergence (above, tagged
*2nd-pass*) but its **adversarial verify gate failed on rate-limiting** — those answers are corroborated
by source convergence, NOT adversarially verified. Re-run a clean verify pass before treating them as hard.

Still genuinely open (neither pass produced usable answers):
- **LinkedIn↔email interleave** — verified combined-cadence step order, lead channel, inter-channel timing. LaGrowthMachine is the reference; specifics never surfaced as a claim.
- **Proxy type for 2026** — dedicated static residential vs mobile 4G/5G; survival-rate sources conflict (~50% vs ~85%), no clean resolution.

Closed by 2nd pass (pending verify): weekly invite cap (reputation-based 50-200/wk), account-count model (scale by senders), char limit (300 all plans), degree + group/event mechanics.

## Time-sensitivity
All studies 2024-2026. Note-reply value is actively decaying (-37%/yr) — any reply benchmark older than ~6 months is suspect on the downside. HeyReach's step set is version-dependent. LinkedIn proxy detection changed materially in 2025. Re-verify before each major build.
