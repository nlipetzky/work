# Cold Outreach — System Design

Status: v2, 2026-06-23 (supersedes the email-only v1). Owner: Ferris (revops), reviewed by Boris.
Method: `practices/agentic-systems/reference/system-building-method.md`. Spec format: `system-anatomy.md`.
Doctrine: `cold-email-doctrine.md` (email) + `linkedin-outreach-doctrine.md` (LinkedIn, verified 2026-06-23).
Upstream dependency: the **demand-context system** (canon `demand-context`, id `120523ed-925a-4b5f-abfc-99bd85f5057e`, `emerging`) — see its section below. This constellation EXECUTES; demand-context tells it what to say and who to say it to.
Companion: `cold-outreach-context-substrate.md` — the context each AI judgment point needs to perform well (the system-anatomy §3 contract). Read alongside this; the plumbing here, the knowledge there.

Scope change from v1: channel is now a first-class dimension, **channel ∈ {email, linkedin}**, with the
door open to more (SMS, X DM) later. The design is **one constellation, channel as a dimension** — not
one flat pipeline (channels differ too much) and not two parallel pipelines (targeting + cadence are
shared). Verdict on "one core system out via channels": correct for Audience, Orchestration, and the
Feedback model; wrong for Infrastructure and Message, which must specialize per channel.

Scope change from v2 (2026-06-23, after Nick flagged the omission): this constellation is the **execution
half** of outbound. It does NOT define the offer, the segment, the ICP, or the buyer language — it
assumes them. Those come from the **demand-context system** upstream. v2 silently treated them as given
("in = segment criteria," as if criteria fall from the sky); they don't, and the part that derives them
*from evidence* is the differentiated half of Nick's offering. Now named as an explicit upstream dependency.

---

## The spine object: the Prospect
One record per human. Carries identity + **all reachable addresses** (verified work email, LinkedIn
profile URL) + **per-channel eligibility** (is the email verified? is the LI profile valid + connectable?).
Qualified once, channel-agnostic. Every system downstream reads/writes this object. This is what makes it
"one core system" rather than two.

## Upstream dependency: the demand-context system (NOT part of this constellation)

Outbound plays must run on **evidenced demand understanding, never a guessed ICP** (that is the
demand-context system's verbatim canon purpose). It turns an expert's prospect transcripts → graded
signal → patterns → an **evidenced offer, ICP, and buyer language**, manual-first. That output is what
feeds the RevOps engine inputs (offer-extract, segment-criteria, ICP titles, cold copy), assembled by the
`lead-gen-strategist` orchestrator into a play-brief. It has its own lifecycle (`emerging`, on goal G1,
its own handoff: `practices/agentic-systems/HANDOFF-demand-context-build-2026-06-23.md`); do NOT fold it
into this constellation. It is the dependency, not a member. Without it, System A runs on a guess and the
whole constellation produces commodity outbound — the exact thing Nick is exiting.

## The decomposition (5 execution systems; 2 channel-agnostic, 2 channel-split, 1 channel-interleaving)

```
[demand-context]  ── evidence → offer · segment · ICP · buyer language ──┐  (upstream system, own lifecycle)
        │                                                                │
        ▼  via lead-gen-strategist (assembles the 11 inputs → play-brief)│
        ▼                                                                ▼
[A] Audience & Qualification  ── channel-agnostic ──►  emits Prospect (email + LI + eligibility)
        │   (targets the evidenced segment)                  (M speaks the evidenced buyer language)
        ├─► [I] Sender Infrastructure   ── channel-SPLIT (disjoint impls) ──►  healthy senders
        ├─► [M] Message                 ── channel-SPLIT (per-channel doctrine) ──►  copy per channel
        │
[O] Multichannel Cadence Orchestrator  ── interleaves channels per prospect ──►  paced sends
        │
[F] Deliverability & Feedback  ── one model, channel-tagged adapters ──►  positive-reply-rate + J
        └─► (positive replies + objections are fresh demand signal → loop back to demand-context)
```

---

### System A — Audience & Qualification  *(channel-agnostic · already built)*
- **Ensures:** every Prospect is a real, qualified decision-maker with all reachable addresses resolved.
- **Input (the dependency):** the **evidenced segment + offer + ICP titles** from the demand-context system, via `lead-gen-strategist`'s play-brief. NOT a guessed ICP. The AI fit-qualification step judges against *that* evidence. If demand-context hasn't run, A is targeting a guess and the qualified/disqualified verdicts are unreliable.
- **Activities:** discovery/TAM (against the evidenced segment) → dedup → email find+verify (70-80% valid, catch-all recovery) → **LI profile resolve + validate** → AI fit-qualification (30-50% shrink, judged on demand-context evidence) → CRM-suppression gate → emit Prospect with per-channel eligibility.
- **Architecture:** BUILD, exists = `revops-engine` (deterministic spine, AI in gates). Rung 1-2.
- **Channel note:** the ONLY add vs v1 is resolving + validating the LI URL alongside the email (the Clay template already carries `Person Linkedin Url`). One system, no split. **This is the core Nick means, and he's right here.**
- **Maturity:** `beta` → `operating` on a continuous verify gate.

### System I — Sender Infrastructure  *(channel-SPLIT · BUY both)*
- **Ensures:** every message leaves a warmed, authenticated, within-limits, non-banned sender.
- **Email module:** `.com` domains aged 30+ d, ≤5 mailboxes/domain @ 20-25/day (≤50 cap), SPF/DKIM/DMARC, indefinite warmup. (Smartlead/Instantly + Workspace.)
- **LinkedIn module:** aged accounts, **one dedicated static residential proxy/account (never shared)**, **~200 actions/day/account** (any click = 1 action, shared across campaigns), **~20-40 connection requests/day** (≈80-200/week, reputation-based — high-trust accounts run higher, sub-20%-acceptance accounts get throttled to ~50/wk), **14-day warm-up ramp** (10/day, +2 every 3 days, ceiling 20), Open InMail 800/mo, Mobile Connector +50-100 reqs/wk (needs 2FA, no note). (HeyReach + Expandi, 2nd-pass corroborated, verify-incomplete.) Still open: residential-vs-mobile-proxy choice for 2026.
- **The economic fact that reshapes this system: you scale by ADDING accounts, not per-account volume.** One account safely yields only ~100-200 connects/week, so account count = weekly volume target ÷ ~150. HeyReach pools unlimited senders per campaign with auto-rotation + unified inbox. This makes Infrastructure (LI) a per-account-multiplied cost, not a config knob — size it off the target.
- **Why split:** same guarantee, **zero shared implementation**. Disjoint provisioning, disjoint risk model. Flattening these is how you get LI accounts banned.
- **Maturity:** *concept* both. Email warm-up clock (30 d) gates email sends; LI warm-up (14 d) gates LI — start both now, in parallel.

### System M — Message  *(channel-SPLIT doctrine · one system)*
- **Ensures:** every Prospect carries doctrine-compliant copy + discrete personalization snippets, per channel.
- **Input (the dependency):** the **buyer language + proof/offer** from the demand-context system. The doctrine below governs *form* (length, structure, no-link rules); demand-context supplies *substance* (the words real buyers used, the pains they named). Copy that's doctrine-perfect but speaks a guessed pain is still a guess.
- **Email doctrine:** triple-tap, ≤6 sentences, no-link E1, SpinTax, 2-8 word AI opener. (Extracted.)
- **LinkedIn doctrine:** the note's job is the downstream **reply, not the accept** (note ~doubles reply, near-zero effect on acceptance per Belkins — though accept-effect is hotly contested); note-reply value is decaying (-37%/yr) so weight the post-accept DM; AI first-message has a modest initial-reply edge only. Char-limit performance (300 vs 200) is an open gap — don't encode a length rule yet.
- **Output contract:** per-(Prospect, channel) copy object. The discrete-snippet field pattern (Email Opener / Ideal Customers / Past Clients) is the engine→copy contract worth locking.
- **Owner:** Kepler. Rung 2. **Maturity:** `emerging`.

### System O — Multichannel Cadence Orchestrator  *(the unlock · BUY substrate · rung 3)*
- **Ensures:** one sequence per Prospect that interleaves channels, respects each channel's state machine, and routes each step to the right sender — paced and within all per-channel limits.
- **Key behavior:** models the **LinkedIn accept-gate** (connect → auto-revoke if not accepted → DM only after accept); ≥3-hour delay between LI actions; stack a profile-visit with the DM (msg-alone 4.88% reply → msg+visit 11.87%); can interleave LI + email per prospect; centralized reply capture per channel. Exact LI↔email step order/timing is an open gap (LaGrowthMachine is the reference, unverified specifics).
- **Why one system, not per-channel:** the value IS interleaving. This is where "one core system out via channels" is most true.
- **Architecture:** BUY a multichannel substrate (lemlist / La Growth Machine / Smartlead+HeyReach pairing). Config + light orchestration, not a from-scratch scheduler.
- **Maturity:** *concept*.

### System F — Deliverability & Feedback  *(one model · channel-tagged adapters · BUILD thin edge)*
- **Ensures:** every campaign is measured on positive-reply-rate per channel + blended, auto-protected, with economics fed back to scaling.
- **Activities:** tracking pixels OFF; positive-reply-rate as the true metric; **J variable per channel** (messages per booked call) → sender-count math; spam/blacklist + LI-restriction auto-pause; pull stats from Smartlead + HeyReach APIs; write to canon; surface on `/system`.
- **Channel note:** one metric *model*, channel-specific *adapters* + *benchmarks* (email and LI reply rates are not comparable). LI reality: acceptance **~26-29%** (not the 45%+ vendors imply), post-accept message reply **~10-11%**, note-reply 2.2-3.5% and falling; **acceptance <25% = a targeting problem first**. Mostly channel-agnostic in shape — Nick's instinct holds here.
- **Architecture:** BUILD the thin edge (API pulls → canon). Rung 1-2. **Maturity:** `emerging`.

---

## Build order (funnel — kill cheap, build what earns it)
0. **demand-context system (manual-first v0)** — precondition, its own handoff. Runs in parallel: it's also Nick's near-term cash play (manual-first IS the methodology). System A can be *built* without it but should not *run a real campaign* on a guessed ICP. Don't block the engine work on it; do block live send on it.
1. **System A**: encode doctrine thresholds + LI-URL validation, stand up the verify gate → `beta`→`operating`. You own it; highest leverage.
2. **System I (email) + start warmup now** — the 30-day clock gates all email sends. LI accounts can warm in parallel.
3. **System M**: lock the per-(prospect, channel) copy contract, hand to Kepler. (LinkedIn doctrine now sourced — `linkedin-outreach-doctrine.md`.)
4. **System O**: pick the multichannel substrate; prove one interleaved cadence by hand (method §3.3) before wiring.
5. **System F**: wire after the first real campaign yields a real per-channel J to verify against.

## Open gaps (named, per artifact discipline)
- **LinkedIn doctrine sourced, two passes.** Adversarially verified (pass 1): action ceilings, warm-up, acceptance gate, sequence model, note-effect, benchmarks. Corroborated-by-convergence but verify-incomplete (pass 2, rate-limited): weekly cap (reputation-based 50-200/wk), scale-by-accounts model, char limit (300 all plans; "200" was InMail subject), degree + group/event mechanics. **Still genuinely open: verified LI↔email interleave timing, and residential-vs-mobile-proxy choice for 2026.** See doctrine's "Named gaps."
- **Note help/hurt on LI acceptance is contested** (Belkins near-parity vs Botdog noteless-wins). Test on our own list before committing the engine to a rule.
- **Multichannel substrate undecided.** Build-vs-buy on lemlist vs La Growth Machine vs Smartlead+HeyReach pairing is an open call (System O).
- **The demand→execution→demand loop is not yet wired.** System F's positive replies and objections are fresh demand signal that should feed back into demand-context (close the loop, per `project_demand_side_context_loop` and `project_sme_context_loop`). Designed, not built.

Everything ladders to one goal: **an owned demand-generation capability** that earns while it runs — and its differentiator is the demand-context system feeding it evidenced demand, not the sending machinery, which is commodity.
