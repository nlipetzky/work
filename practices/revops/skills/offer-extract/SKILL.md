---
name: offer-extract
description: Use this skill when defining and structuring the offer for a RevOps play, or when refining an existing offer artifact. Triggers include "write the offer for the X play," "what are we pitching for [play]," "extract the offer from [client]'s materials," "draft the offer doc," "tighten the offer for [play]," or any request to lock down what is being sold, to whom, and why now for a specific outbound play. Produces a markdown artifact at clients/<client>/artifacts/revops-offer-<play-slug>.md, which downstream skills (segment-criteria, creative-brief, copy-draft) read as input. Do NOT use for: defining who in the database to target (use segment-criteria); writing the message tone or proof selection for outbound copy (use creative-brief); drafting email sequences (use copy-draft); defining a client's overall portfolio or product roadmap (this is per-play, not strategic).
---

# Offer Extract

Locks the substance of what's being pitched in a play: the offer, the audience, the why-now, the proof, the ask, and the boundaries. Output is read by every downstream skill in the RevOps pipeline (`segment-criteria`, `creative-brief`, `copy-draft`).

## When this skill runs

Preconditions:
- The play has been named (kebab-case slug, named for substance not timing).
- The user has identified the client folder where the artifact should land.

If both preconditions are met, proceed.

## Step 1: Lock the play in one sentence

Confirm the play in one sentence. Not the offer alone... the play: who's getting hit, with what, why now. If the user cannot articulate it, stop and prompt for it.

A locked play looks like: "Outreach to LA-area AAV gene therapy developers about Teknova's GMP cell and gene therapy reagent capabilities, timed to the wave of regional CGT capacity expansion announcements."

## Step 2: Pull context from NotebookLM

The user runs the following queries against the client's NotebookLM and pastes the responses into `clients/<client>/sources/` using the source filename convention `<source-type>-<scope>-<date>.md` (e.g. `notebooklm-<play-slug>-<YYYY-MM-DD>.md`). One file per query, or one combined file with clear section headers. These queries are the practice's encoded expertise; do not skip or paraphrase them.

Required queries (run all five):

1. **Offer history.** "What has [client] sold to similar audiences before? Pull product names, programs, packaged offerings, and pricing structures, with descriptions and outcomes where available."
2. **Why-now triggers.** "What market events, customer pains, regulatory changes, or industry shifts are driving demand for [client]'s offerings to [audience description] right now? Cite specific cases or signals."
3. **Proof and references.** "What customer wins, case studies, named references, or measurable outcomes does [client] have for [audience description]? Pull specific results and customer names where available."
4. **Audience pain.** "What problems do [audience description] articulate that [client] solves? Pull verbatim language from sales calls, customer quotes, or market research."
5. **Boundaries.** "What has [client] explicitly stated they won't do, won't sell, won't position, or won't promise in this market? Out-of-scope items and red lines."

If a query returns thin results, note it in confidence-and-gaps. Do not invent context to fill gaps.

## Step 3: Draft the offer using the anatomy

Every offer artifact has seven load-bearing sections. See `offer-anatomy.md` for the structure and what each section is for:

1. **Headline** — the one-sentence offer.
2. **Audience** — the persona/role this is pitched to (not the database segment; that's `segment-criteria`'s job).
3. **The offer** — what's being pitched, in substance.
4. **Why now** — specific triggers, market context, urgency. No vague "the market is changing."
5. **Proof** — customer wins, results, named references. Quantitative where possible.
6. **The ask** — what we want the prospect to do next.
7. **Out of scope** — what this offer is NOT.

## Step 4: Apply the substance filter

Read each section. For every claim, ask: is this substance or is this packaging?
- If the offer description names the delivery mechanism instead of the outcome ("a 30-minute consultation" instead of "a diagnostic on your reagent qualification timeline"), it's packaging.
- For the why-now section, ask: would this why-now have been equally true two years ago? If yes, it's not a why-now.
- For the proof section, ask: is this verifiable by the prospect? Vague proof ("trusted by leading companies") is not proof. Push back for named references or measurable outcomes.

## Step 5: Write the artifact

Write the artifact to `clients/<client>/artifacts/revops-offer-<play-slug>.md`, conforming to the schema at `practices/revops/schemas/offer.md`.

Path is exact and non-negotiable:
- Folder: `clients/<client>/artifacts/` (client-scoped, top-level under the client). Never `clients/<client>/revops/artifacts/`. Never `clients/<client>/<practice>/artifacts/`. Practices are sub-namespaces; artifacts live above them.
- Filename: `revops-offer-<play-slug>.md`. The `revops-offer-` prefix is the `<practice>-<capability>-` convention so artifacts from different practices can share one folder without collisions.

If `clients/<client>/artifacts/` does not exist, create it before writing.

The play slug is named for what the play does, not when it runs. Specific over temporal: `aav-gene-therapy-ellie-outreach`, `mcb-launch`, `new-leader-abm-launch`. Date-based slugs (`may-play`) are forbidden; the file's date metadata captures timing.

Pattern-match against `example-output.md` for tone and density.

## Common failure modes

- **Conflating offer with audience.** "Mid-market SaaS companies" is not the offer; it's the audience. The offer is what you're selling them.
- **Naming the offer by delivery mechanism.** "30-minute consultation" is not an offer; it's how the offer gets delivered. The offer is the outcome the prospect gets.
- **Vague why-now.** If the why-now would be equally true a year ago, it isn't a why-now.
- **Stacking multiple offers in one play.** A play has one offer. If you find yourself writing two, they should be two plays.
- **Skipping the ask.** Without an explicit ask, downstream copy will manufacture one and it will land wrong.
- **Skipping out-of-scope.** Without explicit boundaries, the play scope drifts in execution and copy wanders into adjacent territory.
- **Treating offer-extract as a strategy doc.** This is the offer for one play, not the client's positioning or portfolio.
- **Silently absorbing a vague brief.** If the brief skips pricing, audience definition, or boundary, pick a definition, write it under "decisions against the brief," and proceed.

## References

- `practices/revops/schemas/offer.md` — output structure
- `practices/revops/skills/offer-extract/offer-anatomy.md` — the seven sections of a strong offer
- `practices/revops/skills/offer-extract/example-output.md` — worked example
