---
name: demand-needs-extract
description: >
  Use this skill when turning audience-conversation transcripts (CMO/founder intake,
  prospect discovery calls, expert walkthroughs) into a structured demand-needs map AND
  synthesized RevOps engine inputs for a play. Triggers include "extract the needs from
  this transcript," "what does the engine need from this call," "build the demand map for
  [play]," "the partner just handed over transcripts — pull the demand signal,"
  "synthesize the offer/segment from these calls," or any request to convert raw
  demand-side conversation into graded observations, durable patterns, and draft engine
  inputs (offer, segment criteria, ICP titles, proof/copy constraints). Runs the locked
  demand-side context-loop methodology: signal -> observation -> pattern -> consuming
  artifact, with verbatim quotes + provenance + evidence grades. Has a LIVE MODE for
  real-time use on a call. Do NOT use for: defining a client's permanent ICP (per-play,
  not strategic); producing one engine input in isolation when no transcript exists (call
  offer-extract / segment-criteria directly against NotebookLM instead); running the list
  build (that is the engine, downstream); authoring under an expert's name (route to
  Hermes / expert-liaison).
---

# Demand Needs Extract

This skill is the front of the demand-side context loop. It ingests raw demand-side
conversation and emits two things the rest of the system consumes:

1. A **demand-needs map** — graded, sourced observations promoted into durable patterns.
2. **Draft engine inputs** — offer, segment criteria, ICP titles, and proof/copy
   constraints, synthesized from the patterned needs, in the exact format the downstream
   engine already consumes (`offer-extract` / `segment-criteria` artifacts).

It implements the demand-context methodology locked 2026-06-10
(`registry/signal/demand-context/system.md`): **signal -> observation -> pattern ->
consuming artifact**, verbatim + provenance + evidence grade, manual first. It is the
hand-run version of the `demand-context` system's extraction + synthesis skills (v0/v2 in
that system's roadmap). Authoring drafts here is operator craft; anything that ships under
an expert's name routes through Hermes (expert-liaison) and keeps the approval gate.

## When this skill runs

Preconditions:
- The play is named (kebab-case slug, named for substance not timing).
- You have at least one transcript or conversation artifact (file path or pasted text).
- You know the engagement folder where outputs land (`accounts/<type>/<name>/`).

If all three are met, proceed. If a transcript is missing, do not invent demand signal —
say so and stop. (Methodology failure rule: missing input -> proceed and report, never
silent skip. Low-confidence extraction -> grade it low, never drop the verbatim.)

## The four stages (the locked loop)

Run these in order. Each stage has a strict output shape so it stays traceable.

### Stage 1 — Signals
A **signal** is a single moment in the conversation worth capturing: a stated pain, an
objection, a value framing that landed, a decision, a founder hypothesis, a piece of
buyer language. Do not summarize the call. Pull discrete signals, each anchored to a real
moment.

### Stage 2 — Observations (the core unit)
Promote each signal into an **observation**. Every observation carries four fields, no
exceptions:

- **Verbatim** — the exact quote (or tightest faithful paraphrase if the recording is
  noisy; mark paraphrases). Never drop the verbatim, even when confidence is low.
- **Provenance** — who said it, in what conversation, when. The `canon_ref` /
  source-event pointer so the claim traces back to "the call where they said this."
- **Evidence grade** — `A` (stated explicitly, unprompted, by the buyer/audience),
  `B` (stated but prompted, or stated by the expert about the buyer), `C` (inferred /
  operator interpretation). Use the rubric below.
- **Tag** — one of: `pain` | `objection` | `language-resonance` | `decision` |
  `expert-believes` | `diagnostic-signal` | `decision-profile`. (Matches the demand-loop
  grammar and the Learnings-table taxonomy.)

Evidence-grading rubric (`v1`, part of the locked methodology):
- `A` — the buyer/audience said it themselves, unprompted. Shippable as language once
  patterned.
- `B` — prompted, OR the expert asserting what the buyer believes (`expert-believes`).
  Must be confirmed against buyer-said evidence before it becomes shippable copy.
- `C` — operator inference or pattern-match across calls. Useful, never quoted as the
  buyer's voice.

### Stage 3 — Patterns
A **pattern** is a durable claim that earns its place by recurring. Promotion rule
(locked): **anything heard 3+ times, across calls or within one call from independent
moments, becomes a pattern.** A single high-grade `A` observation on a load-bearing point
may be promoted as a `provisional` pattern, marked as such, pending a second source.

Each pattern records: the claim, the observation IDs that support it, the dominant
evidence grade, and a status (`confirmed` | `provisional`). When a pattern tests a prior
`expert-believes` hypothesis, record `confirms` / `contradicts` — contradictions are
findings to route back to the expert via Hermes.

### Stage 4 — Consuming artifacts (draft engine inputs)
Synthesize the patterns into the engine's input contract
(`practices/agentic-systems/reference/deepline-upstream-inputs.md`). This skill drafts
four of the eleven strategic inputs, each grounded in patterns (cite the pattern IDs in a
"grounded in" line so every claim is traceable):

- **Offer** — in the exact `offer-extract` / `practices/revops/schemas/offer.md` format
  (`revops-offer-<play-slug>.md`).
- **Segment criteria** — in the exact `segment-criteria` /
  `practices/revops/schemas/segment-criteria.md` format
  (`revops-segment-<play-slug>.md`).
- **ICP titles** — persona tiers + title exclusions, matching the existing
  `revops-icp-titles-<play-slug>.md` shape.
- **Proof / copy constraints** — what is shippable as the buyer's own language
  (grade-`A` patterns), what proof is verifiable, and what is refused / out of bounds.

These are DRAFTS. They carry a `Confidence and gaps` section and are marked for review.
The other seven strategic inputs (disqualifiers detail, sub-segment tags, sender
identity, channel, volume, personalization, cold copy) are out of scope here — flag them
as open and route per the input contract.

## Process

1. **Frame.** Confirm play slug + engagement folder. Identify each transcript (path or
   paste). If processing files, read them in a sandbox (see context-safety note) so only
   the structured output surfaces.
2. **Stage 1 -> 2.** Walk each transcript, pull signals, promote each to an observation
   with verbatim + provenance + grade + tag. Assign stable IDs (`OBS-01`, ...).
3. **Stage 3.** Cluster observations; promote recurrences (3+) and load-bearing `A`s to
   patterns (`PAT-01`, ...). Test each prior `expert-believes` hypothesis.
4. **Write the demand-needs map** to the play's demand-context folder (see Landing).
5. **Stage 4.** Synthesize the four draft engine inputs from the patterns, each in the
   exact downstream format, each with a "grounded in: PAT-xx" trace. Apply the substance
   filter from `offer-extract` (outcome not mechanism; why-now must be time-specific;
   proof must be prospect-verifiable) and the taxonomy discipline from `segment-criteria`
   (source-agnostic, label-don't-filter on size).
6. **Optionally capture** the new observations as Raw rows in the Learnings table for
   human approval (see Landing).
7. **Report** the top patterns, whether the drafts look usable, and the open inputs.

## LIVE MODE (real-time, on a call)

When a partner hands over transcripts mid-call and you need output in one pass:

- Run a **single-pass** path: paste transcript -> straight to a compressed demand-needs
  map (observations with verbatim + grade + tag, skip formal IDs if speed demands) ->
  immediately draft the offer and segment in their target formats.
- Lead with the **top 3-5 patterns** out loud, then the draft offer headline + the segment
  hard filters. Hold the rest (ICP tiers, proof constraints, full artifacts) for the
  written pass after the call.
- Grade fast but grade honestly. An `A` you can quote back to the partner in the room is
  worth more than ten `C` inferences. If you are inferring, say "this is my read, not
  what they said."
- Do not block on completeness. Missing input -> note it, keep moving. The written pass
  fills gaps.

### Context-safety note
Transcripts are large and will flood context if read raw. Process them in a sandbox
(`ctx_execute_file` / `ctx_execute`): extract observations in the sandbox and surface only
the structured map, not the raw transcript. Only the demand-needs map and the draft
artifacts should enter context or land on disk. This keeps a 30-call dump from costing the
session.

## Landing (where outputs go)

Exact paths, non-negotiable.

- **Demand-needs map** ->
  `accounts/<type>/<name>/plays/<play-slug>/demand-context/needs-map-<play-slug>-<YYYY-MM-DD>.md`
  Source signal files already live alongside as `signal-NN-<scope>-<date>.md`; the needs
  map is the synthesized observation+pattern layer over them.
- **Draft offer** -> `accounts/<type>/<name>/artifacts/revops-offer-<play-slug>.md`
  (conforms to `practices/revops/schemas/offer.md`). For ventures, `<type>` = `ventures`.
- **Draft segment** -> `accounts/<type>/<name>/artifacts/revops-segment-<play-slug>.md`
  (conforms to `practices/revops/schemas/segment-criteria.md`).
- **Draft ICP titles** -> `accounts/<type>/<name>/artifacts/revops-icp-titles-<play-slug>.md`.
- **Draft proof/copy constraints** ->
  `accounts/<type>/<name>/artifacts/revops-proof-constraints-<play-slug>.md`.
- **Optional Learnings capture** -> Airtable base `app5tsy6zjfA8H3rx`, table
  `tbl8NyDBTYZI8lum2`, new rows with `Status = Raw` (human approves the promotion). Write
  the verbatim, the one-line observation, the tag, and the source-event link. Never
  auto-promote past Raw.

Path discipline (from the sibling skills): artifacts live at
`accounts/<type>/<name>/artifacts/`, above the practice namespace — never under a
`/<practice>/` subfolder. The `revops-<capability>-` prefix prevents cross-practice
collisions. The play slug names what the play does, not when it runs.

## Hard rules

- **No person names in shared artifacts.** The demand-needs map and all engine-input
  drafts use role-based language only (the partner / the founder buyer / the head of
  marketing). Person names may appear only in provenance pointers, never in the synthesized
  claim or the shippable copy. Never frame a named person negatively.
- **Never drop the verbatim.** Low confidence -> grade it low, keep the quote.
- **`expert-believes` is not shippable until confirmed.** A founder's hypothesis about
  buyer pain is grade `B` at best until a buyer says it. Mark it; test it; flag
  contradictions for Hermes.
- **Drafts are drafts.** Everything this skill emits carries `Confidence and gaps` and is
  marked for review. The engine reads it; the operator (and, for expert-attributed copy,
  the expert via Hermes) approves it.
- **Do not invent demand signal to fill a gap.** Thin transcript -> thin map, noted.

## References

- Methodology + grading rubric: `registry/signal/demand-context/system.md`
- Loop architecture: `practices/agentic-systems/reference/sme-context-loop.md`
- Engine input contract: `practices/agentic-systems/reference/deepline-upstream-inputs.md`
- Offer format: `practices/revops/skills/offer-extract/SKILL.md`,
  `practices/revops/schemas/offer.md`
- Segment format: `practices/revops/skills/segment-criteria/SKILL.md`,
  `practices/revops/schemas/segment-criteria.md`
- First capture event (CIPO play):
  `accounts/ventures/konstellation-ai/plays/patent-portfolio-mgmt/demand-context/signal-00-strategy-cmo-2026-06-10.md`
- Worked example: `process/worked-example.md` in this skill folder.
