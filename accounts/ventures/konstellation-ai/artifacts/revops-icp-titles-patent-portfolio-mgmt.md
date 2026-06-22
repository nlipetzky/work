# ICP Titles — Patent Portfolio Management Play

**Status:** v0.1 SCAFFOLD. All title tiers are TBD-from-intake (2026-06-10).
**Engagement:** Konstellation AI (venture)
**SME / Operator:** Will Rosellini
**Drafted by:** Kepler, 2026-06-09
**Pairs with:** `revops-segment-patent-portfolio-mgmt.md` (sub-ICP definitions)

---

## Why this is its own artifact

Per Deepline upstream-input pattern (Section 2.5), titles live in a separate file from segment criteria. Reasons:

1. **Different consumer.** Segment criteria feed universe-build (Phase 1, company-level). Titles feed contact discovery (Phase 3, person-level). Conflating them couples two distinct provider operations.
2. **Tier sequencing is a per-vertical decision.** Tier A runs first; Tier B activates only after Tier A produces message-validation signal. That logic doesn't belong in a segment definition.
3. **Per-sub-ICP variation is high in this vertical.** A solo inventor IS the buyer (Tier A = the inventor). A research institution's buyer might be a tech transfer officer or a licensing director. A corporate IP team's buyer is in-house counsel. These need distinct title lists.

---

## Title selection principles (universal)

These hold across all sub-ICPs unless explicitly overridden:

- **No vibes.** "Decision maker," "leader," "head of" are vibes ... not titles. Force specific strings.
- **Tier A = highest-confidence buyer based on prior response data.** Run first.
- **Tier B = secondary, conditional activation.** Activates after Tier A produces a measurable signal (e.g., 20+ Tier A conversations with X% response).
- **Tier C / Skip = explicit exclusion.** Either too junior (no authority) or wrong function (HR, recruiting, marketing-at-vendor) ... pulled out so the contact discovery step doesn't waste credits.
- **Map to provider title filters.** Title strings need to be specific enough for a clean Apollo / RocketReach / PDL filter ... not so generic that the provider returns noise.

---

## Per-sub-ICP title tiers

Each block below maps to one of the four sub-ICPs in `revops-segment-patent-portfolio-mgmt.md`. Sub-ICP names are TBD-from-intake.

### Sub-ICP 1 — [PLACEHOLDER]

| Tier | Titles | Rationale |
|---|---|---|
| Tier A (run first) | TBD-from-intake | TBD |
| Tier B (conditional) | TBD-from-intake | TBD |
| Tier B activation condition | TBD-from-intake | e.g., "after 20 Tier A conversations validate message" |
| Tier C / Skip | TBD-from-intake | Titles that should NOT be pulled |

### Sub-ICP 2 — [PLACEHOLDER]

(same structure)

### Sub-ICP 3 — [PLACEHOLDER]

(same structure)

### Sub-ICP 4 — [PLACEHOLDER]

(same structure)

### Sub-ICP 5 — "other"

| Tier | Titles | Rationale |
|---|---|---|
| Tier A | None until reply data justifies | "Other" is the long-tail bucket. Do not run outbound here until a pattern emerges. |
| Tier B | N/A | |
| Skip | All | Deprioritize until reply data from sub-ICPs 1–4 informs a fifth pattern. |

---

## Universal title disqualifiers (across all sub-ICPs)

These titles are excluded regardless of which sub-ICP a record falls into:

- TBD-from-intake: e.g., recruiters, agency reps, vendors selling patent services
- TBD-from-intake: any titles Will explicitly refuses to engage

---

## Sequencing strategy (across sub-ICPs)

Open question for tomorrow's intake: do we run Tier A across all four sub-ICPs simultaneously, or sequence sub-ICP-by-sub-ICP?

**Argument for simultaneous:** faster reply data, faster v1 learning.
**Argument for sequential:** Will's "don't overwhelm me" constraint. One sub-ICP at a time matches his stated working preference.

**Default recommendation:** sequential. Start with the sub-ICP Will believes has the highest current conversion rate from his first 100 conversations. Validate message there before opening the next sub-ICP.

---

## Confidence and gaps

### What's confident

- The four-sub-ICP structure justifies a separate titles artifact.
- The "no vibes" rule and Tier C/Skip discipline are universal.
- The "other" bucket gets no outbound until reply data warrants it.

### What's not confident

- All title strings. Cannot draft without Will's input.
- Tier B activation conditions. Need Will's read on what counts as "Tier A validated."
- The universal disqualifier list. Will sets this.

### Operational gap

Provider selection (Apollo vs RocketReach vs PDL vs hybrid) for title-driven contact discovery is a downstream decision, not a criteria-file decision. Flagged here so it doesn't get lost when the criteria file feels "done."

---

## What this artifact is for

- Capturing per-sub-ICP title tiers during/after the 2026-06-10 intake.
- Feeding the downstream contact-discovery step (Deepline Phase 3 or equivalent).
- Maintaining the sequencing logic that prevents Tier A and Tier B from running simultaneously and corrupting reply-rate data.

## What this artifact is NOT

- Not a list of contacts. Just title strings + tier rules.
- Not a substitute for the segment criteria file.
- Not constrained to a specific provider. Source-agnostic.
