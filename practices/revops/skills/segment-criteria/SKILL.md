---
name: segment-criteria
description: Use this skill when translating a play brief or offer document into a structured segment criteria document for a RevOps engagement, or when refining an existing segment criteria artifact. Triggers include "build a segment for the X play," "define the targeting for [offer]," "who should we target for [play]," "translate this brief into criteria," "tighten/refine the segment for [play]," or any request to define the targeting rules for a specific play. Produces a source-agnostic markdown artifact (no column names, no provider names, no SQL) at clients/<client>/artifacts/revops-segment-<play-slug>.md, which a separate downstream evaluation step turns into an actual list. Do NOT use for: extracting the offer itself (use offer-extract first); writing the creative brief, tone, or proof points (use creative-brief); drafting copy or email sequences (use copy-draft); querying the database or producing the actual list of accounts and contacts (separate evaluation capability, not this skill); defining a client's permanent ICP or overall positioning (this is per-play, not strategic).
---

# Segment Criteria

Translates a play brief into a structured, source-agnostic segment criteria document. The output is read by a separate downstream evaluation step that turns criteria into an actual list.

## When this skill runs

Preconditions:
- A play brief or offer document exists for this play. If not, run `offer-extract` first and come back.
- The user has identified the client folder where the artifact should land.

If both preconditions are met, proceed.

## Step 1: Lock the offer in one sentence

Confirm the offer in one sentence: what is being pitched, to whom, why now. If the user cannot articulate it that tightly, stop and prompt for it. Do not draft criteria against a vague offer; the criteria will inherit the vagueness.

A locked offer looks like: "ABM-in-a-box program for newly-hired demand gen leaders at mid-market B2B SaaS companies, helping them stand up a target-account motion within their first 90 days."

## Step 2: Pull context from NotebookLM

The user runs the following queries against the client's NotebookLM and pastes the responses into `clients/<client>/sources/` using the source filename convention `<source-type>-<scope>-<date>.md` (e.g. `notebooklm-<play-slug>-<YYYY-MM-DD>.md`). One file per query, or one combined file with clear section headers. These queries are the practice's encoded expertise; do not skip or paraphrase them.

Required queries (run all five):

1. **Disqualifier history.** "What disqualifiers has [client] used in past plays? List explicit exclusions and patterns of accounts removed during review, with reasoning where stated."
2. **ICP language.** "What language does [client] use to describe their ideal customer? Pull verbatim phrases from sales calls, marketing materials, and internal docs."
3. **Burned audiences.** "What previous outreach has hit this market? List plays, outcomes, and audiences that were over-fished, burned, or generated negative response."
4. **Past response patterns.** "What seniority and function patterns produced response in past plays? Cite specific cases with role and company size if available."
5. **Named accounts to avoid.** "Which named accounts has [client] explicitly asked to exclude from outreach? Reasons if stated."

If a query returns thin results, note it in confidence-and-gaps. Do not invent context to fill gaps.

## Step 3: Draft criteria using the taxonomy

Every criterion gets classified by three axes:

- **Type:** firmographic, technographic, demographic, behavioral, relational, or disqualifier. See `criterion-types.md`.
- **Match:** hard filter, soft signal, or disqualifier.
- **Observability:** the answer to "how would someone verify this." Names the signal, not the source.

### Hard filters

A record must match all hard filters. Use sparingly. Five or six is a normal hard-filter count; more than ten and the segment will return empty.

Behavioral and relational hard filters are uncommon. Most criteria of those types are better expressed as soft signals. If you do use a behavioral or relational hard filter, defend the choice in the confidence-and-gaps section.

### Soft signals

Records that pass hard filters get scored by soft signals. Each gets a weight (high, medium, low). Three buckets are intentional for v1; use them with discrimination, not all-medium.

### Disqualifiers

Explicit anti-list. A disqualifier should not duplicate a hard filter. If "company under 50 employees" is already caught by a hard filter on size, don't list it again. Disqualifiers earn their keep by removing things hard filters miss: current customers, accounts in active sales cycles, recent acquisitions.

## Step 4: Apply the vibes filter

Read each criterion. For every one, ask: could a person verify this without inside information? If the answer is no, the criterion is a vibe.

Common vibes: "innovative companies," "growth-minded leaders," "forward-thinking organizations," "decision makers," "high-intent prospects."

For every vibe, push back to the user with a request for the concrete signal. Do not write the artifact until vibes are resolved or explicitly converted to confidence-and-gaps entries.

## Step 5: Write the artifact

Write the artifact to `clients/<client>/artifacts/revops-segment-<play-slug>.md`, conforming to the schema at `practices/revops/schemas/segment-criteria.md`.

Path is exact and non-negotiable:
- Folder: `clients/<client>/artifacts/` (client-scoped, top-level under the client). Never `clients/<client>/revops/artifacts/`. Never `clients/<client>/<practice>/artifacts/`. Practices are sub-namespaces; artifacts live above them.
- Filename: `revops-segment-<play-slug>.md`. The `revops-segment-` prefix is the `<practice>-<capability>-` convention so artifacts from different practices can share one folder without collisions.

If `clients/<client>/artifacts/` does not exist, create it before writing.

The play slug is named for what the play does, not when it runs. Specific over temporal: `mcb-launch`, `cdmo-cell-therapy-process-dev`, `new-leader-abm-launch`. Date-based slugs (`may-play`) are forbidden; the file's date metadata captures timing.

Pattern-match against `example-output.md` for tone and density.

## Common failure modes

- **Treating soft signals as hard filters.** Produces tiny lists. If you find yourself listing six behavioral signals as hard filters, most are soft.
- **Accepting "decision makers" as a title criterion.** This is a vibe. Push back for actual title patterns or stated function responsibilities.
- **Conflating company-level and person-level criteria.** "Buys software" applies to a company; "evaluates software" applies to a person. Keep them distinct via the type taxonomy.
- **Skipping disqualifiers because none came up.** A segment with no disqualifiers is rare and suspicious. Probe past-play exclusions.
- **Pattern-matching titles too literally.** "Director of Demand Generation" excludes a real buyer titled "VP Pipeline Strategy." Write observable signals that handle function, not just title text. See the example.
- **Silently accepting a vague brief.** Brief says "newly-hired" without defining it. Pick a definition, write it down in confidence-and-gaps under "decisions against the brief," and proceed. Do not absorb the vagueness into the criteria.

## References

- `practices/revops/schemas/segment-criteria.md` — output structure
- `practices/revops/skills/segment-criteria/criterion-types.md` — the six criterion types
- `practices/revops/skills/segment-criteria/example-output.md` — worked example
