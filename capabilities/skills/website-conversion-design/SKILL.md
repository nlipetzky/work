---
name: website-conversion-design
description: >
  Use this skill to design or optimize a website (or any standing web surface ...
  landing page, homepage, services page, lead magnet, micro-site) to maximize
  lead generation and audience engagement for a specific engagement (asset,
  venture, or client). Trigger on "design the website for X", "build the landing
  page for X", "maximize the site for lead gen", "improve conversion on the
  homepage", "what should the site say / look like to convert", "optimize the
  site for engagement", "rework the website to sell X", or any request to turn a
  brand into a high-converting standing web surface. This skill is the
  orchestrator: it reads the engagement's brand-context store, then routes copy
  to creative-copy / copy-draft / offer-extract and visual/layout to
  ui-ux-pro-max, and synthesizes one site spec. Do NOT use to invent positioning,
  voice, or proof (those live in the brand store and the SME artifacts); to write
  cold outbound (use copy-draft); to define the segment (use segment-criteria); or
  to build the outbound list (that is the revops engine).
---

# Website conversion design

Turns a brand into a standing web surface engineered for two jobs: **lead
generation** (convert a stranger into a captured lead or booked call) and
**engagement** (deepen and retain an existing audience). It is engagement-agnostic.
It runs the same for an owned asset, a venture, or a client.

## What this skill is and is not

This skill is an **orchestrator and architect**, not a copy generator. It does
not hold any brand's positioning, voice, proof, or offer. Those live in the
engagement's brand-context store and in the SME artifacts. This skill reads them,
decides site architecture and conversion mechanics, and routes the actual writing
and visual work to the specialist skills. Its output is a **site spec** that
others (or you) execute.

If the context registry does not exist yet for the engagement, stop and create it
first (see Input contract). A site designed without the registry is invented
positioning ... that is the failure mode this skill exists to prevent.

## Hard rules

- **Never invent positioning, voice, proof, or offer.** Pull every load-bearing
  claim from the brand store or a sourced SME artifact. Anything you cannot source
  is a marked gap, not a guess.
- **Respect documented refusals and voice rules.** If the brand store records a
  segment, framing, or phrasing the expert refuses, the site does not use it. If
  the brand store and a fresh idea conflict, surface the conflict ... do not
  auto-resolve toward either side.
- **No pricing in page copy** unless the brand store explicitly clears a number.
  Sketch tier shapes; the commercial owner commits numbers.
- **Expert-facing decisions route through Hermes.** Voice/tone sign-off,
  founder-led bio approval, and any expert-authored content review are Hermes's
  job, not this skill's.
- **Objective is a parameter, not a fork.** One brand truth drives both lead-gen
  and engagement surfaces. Do not design two disconnected sites.

## Input contract: the context registry

Before designing, the skill reads the engagement's context registry (for a venture:
`accounts/ventures/<name>/context/REGISTRY.md` and its spine artifacts under
`canon/`, `revops/`, `creative/`). It requires these fields, each sourced from a
specific registry artifact; any missing one is logged as a gap that blocks the
dependent page section:

1. **Positioning** ... `revops/value-proposition-canon.md` + `canon/founding-thesis.md`.
2. **Buyer / audience** ... `revops/icp-and-disqualifiers.md`.
3. **Voice + lexicon** ... `creative/voice-codex.md`, `creative/controlled-lexicon.md`.
4. **Proof** ... Proof Model (#18) + the offering's outcome/mechanism artifacts.
5. **Offer + next step** ... `revops/offer-architecture-and-pricing.md` (the conversion action).
6. **Constraints** ... `canon/non-goals.md`, `canon/faithfulness-constraints.md` (what the site must never say/claim).
7. **Visual identity** ... Aesthetic System (#33) or a marked gap.

## Process

1. **Set the objective(s).** Lead-gen, engagement, or both. Most sites do both;
   name the primary per page.
2. **Read the context registry.** Confirm the input fields against their artifacts.
   Log gaps. If a load-bearing artifact (positioning, buyer, offer) is unresolved,
   flag it as a decision gate at the top of the spec and design around it ... do not
   paper over it.
3. **Define information architecture.** Page list and the path each audience walks
   from arrival to the conversion action. Keep the path short.
4. **Per page, specify the conversion structure**, in this order of leverage:
   - Above-the-fold promise (the one thing) + primary CTA
   - Proof immediately under the promise
   - Objection handling / how-it-works
   - Secondary CTA and capture mechanics
   - Engagement hooks (subscribe, resource, return reason) where the objective is engagement
5. **Route the writing.** Hero/identity lines and headlines → creative-copy.
   Body/offer framing → offer-extract output. Any sender-attributed or
   expert-voiced copy → copy-draft (with source map). This skill writes the
   *brief* for each, never the final line.
6. **Route the visual.** Layout, style, palette, type, component choices →
   ui-ux-pro-max, fed the brand store's visual identity.
7. **Specify instrumentation.** What converts must be measurable: primary
   conversion event, capture form fields, analytics/events, and the one metric
   per page that defines success.
8. **Write the spec.** One artifact: IA + per-page specs + copy briefs + visual
   direction + instrumentation + open decision gates.

## Optimization loop (the "maximize" part)

A site is not done at launch. After real traffic:

- Read the per-page success metric against actual behavior.
- Form one hypothesis per underperforming page (promise unclear? proof weak? CTA
  buried? wrong audience?).
- Change one thing, re-measure. Log the learning back into the context registry so
  the next surface inherits it.

Silent caps are forbidden: if you optimize only the top pages or skip a measured
section, say so in the spec.

## Output

A single site-spec artifact at the engagement's location (for a venture:
`accounts/ventures/<name>/context/website-spec.md`), plus the routed briefs the
specialist skills consume. Return only the file path and a one-line summary.

## Companion skills

- `offer-extract` ... what is sold (positioning input)
- `segment-criteria` ... who it is for (audience input)
- `creative-copy` ... identity lines, headlines, hero copy
- `copy-draft` ... any expert-attributed / voiced copy, with source map
- `ui-ux-pro-max` ... visual identity, layout, components, palette, type
