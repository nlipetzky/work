# Handoff to Boris: build the cold-outreach system

From: Ferris (revops) · Date: 2026-06-23 · For: agentic-systems (Boris)

## The ask

Build Nick's **owned cold-outreach capability** — email + LinkedIn, one core system out via channels —
following the system-building method (`reference/system-building-method.md`) and the anatomy spec format
(`reference/system-anatomy.md`). The strategy work is done: doctrine extracted and verified, the
constellation decomposed, build order set, build-vs-buy called. This handoff is the entry point for the
build sessions. **Do not re-litigate the design; execute it.**

## Read first (the artifacts — all in `practices/revops/reference/`)

1. `cold-outreach-system-design.md` — **the spec.** 5-system constellation, channel as a first-class dimension, per-system maturity + architecture rung + build-vs-buy, the build order. This is your master.
2. `cold-email-doctrine.md` — email thresholds (verified from a 7-hr masterclass).
3. `linkedin-outreach-doctrine.md` — LinkedIn thresholds (2 research passes; pass-1 adversarially verified, pass-2 corroborated-by-convergence but verify-incomplete — tags inline).
4. `cold-email-clay-column-map.md` — Lead Gen Jay's Clay template mapped to engine stages (reference impl of pillars 2-3).
5. `cold-outreach-context-substrate.md` — **the context contract** (system-anatomy §3) per AI judgment point. The system design is the plumbing; this is what the AI needs to perform well. The performance of A and M rides on the context assets named here, most of which are GAPs — treat them as gating inputs, not follow-ons.

## Upstream dependency — read this before treating the constellation as self-contained

This constellation is the **execution half** of outbound. It does not define the offer, segment, ICP, or
buyer language — it assumes them. Those come from the **demand-context system** (canon `demand-context`,
`emerging`, goal G1, own handoff: `HANDOFF-demand-context-build-2026-06-23.md`), which turns expert
prospect transcripts into evidenced offer/ICP/buyer-language, fed in via `lead-gen-strategist`. Build the
engine without it, but **do not run a live campaign on a guessed ICP** — running on evidenced demand is the
differentiated half of Nick's offering; the sending machinery is commodity. The two compose:
demand-context → lead-gen-strategist → System A/M. (System F's replies loop back as fresh demand signal.)

## The shape (so you don't have to reload the whole spec to orient)

One constellation, the **Prospect** object as spine (email + LI URL + per-channel eligibility, qualified once). Five execution systems, fed by demand-context upstream:

- **A · Audience & Qualification** — channel-agnostic. *Already built* = `systems/revops-engine`. Highest leverage: encode the doctrine thresholds + LI-URL validation, stand up the verify gate. `beta`→`operating`.
- **I · Sender Infrastructure** — channel-SPLIT, **BUY both**. Email (domains/mailboxes/DNS/warmup, Smartlead/Instantly). LinkedIn (accounts/proxies/limits, HeyReach). Disjoint implementations. **Key economic fact: LinkedIn scales by adding accounts, not per-account volume** (~100-200 connects/wk/account; account count = target ÷ ~150).
- **M · Message** — channel-SPLIT doctrine, one system. Owned by Kepler. Lock the per-(prospect, channel) copy contract (the discrete-snippet field pattern).
- **O · Multichannel Cadence Orchestrator** — the unlock. **BUY substrate** (lemlist / La Growth Machine / Smartlead+HeyReach). Models the LinkedIn accept-gate; interleaves channels per prospect.
- **F · Deliverability & Feedback** — **BUILD the thin edge.** Pull stats/replies from sending-tool APIs → canon → `/system`. Positive-reply-rate + J variable per channel.

Verdict on architecture (method §2, lowest rung): buy the commodity (infra, sequencing, mechanical deliverability); build only the edge (qualification — done; the feedback loop). Don't build an SMTP/warmup stack you can rent.

## Build order (the funnel — each step gates the next)

0. **demand-context manual-first v0** (its own handoff) runs in parallel — precondition for *live send*, not for building the engine. Don't block engine work on it; do block a real campaign on it.
1. **System A to `operating`.** Encode email + LI thresholds into `revops-engine`, add LI-URL validation, stand up a continuous verify gate (SQL counts on valid-rate / qualified-rate). You own this repo; cheapest + highest leverage. Its fit-qualification judges against the demand-context evidence, not a guessed ICP. Start here.
2. **System I procurement, in parallel.** Pick the email tool + the LI tool (or one multichannel substrate), buy domains, **start warmup now** — the 30-day email clock and 14-day LI clock gate every send. This is a buy decision, not an engineering project; surface it to Nick to ratify the tool choice.
3. **System M contract.** Lock the per-(prospect, channel) copy object; hand to Kepler.
4. **System O.** Pick the multichannel substrate; **prove one interleaved cadence by hand** (method §3.3) before wiring.
5. **System F.** Wire after the first real campaign yields a real per-channel J to verify against.

## Open gaps (don't block on these; named so they're not silently dropped)

- **LI↔email interleave timing** — verified combined-cadence step order/delays never surfaced. La Growth Machine is the reference. Resolve at System O design time by reading the tool's own docs.
- **Proxy type for 2026** — residential vs mobile 4G/5G unresolved. Resolve at System I (LinkedIn) procurement.
- **Note-vs-no-note on LI acceptance** — contested; A/B on real data once System A produces prospects.

## Method discipline (the rails — non-negotiable)

- **Spec before build.** Each system gets its anatomy-format spec ratified before code (method §3.1). The design doc is the spec seed; expand per system as you start it.
- **Deterministic spine, AI as a called component** (method §0). No chat-agent-as-engine.
- **`beta` until the verify gate is green read from live state** (method §4). No "operating" by assertion.
- **Register + surface** each system in canon so `/system` renders it (method §3.6).

## To put this on Nick's work spine

This is spine work. Per `~/code/work/CLAUDE.md`, do **not** write goals/projects/tasks directly — drop a
`canon_engine.public.capture_items` row (status=open, with provenance) for Atlas to triage and promote.
One capture item: "Build cold-outreach system (5-system constellation), spec at
`practices/revops/reference/cold-outreach-system-design.md`." Let Atlas shape the goal/project structure.
