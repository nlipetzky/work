# Segment Criteria Schema

The shape of a segment criteria artifact. Skill output conforms to this structure.

**Output path:** `clients/<client>/<practice>/artifacts/segment-<play-slug>.md`

---

## Template

````markdown
# Segment Criteria: <play-slug>

**Client:** <client>
**Play:** <play-slug>
**Date:** <YYYY-MM-DD>
**Offer (one sentence):** <what is being pitched, to whom, why now>

---

## Hard filters

Records must match all hard filters to enter the segment.

### <Criterion name>
- **Type:** firmographic | technographic | demographic | behavioral | relational
- **Match:** hard filter
- **Observable signal:** <how someone would verify this, naming the signal not the source>
- **Description:** <the rule in business language, one or two sentences>

(Repeat per hard filter. If there are many, group by type: firmographic, then technographic, then demographic, then behavioral or relational if used.)

---

## Soft signals

Records that pass hard filters get scored by soft signals. Soft signals do not exclude.

### <Criterion name>
- **Type:** behavioral | relational | technographic | demographic
- **Match:** soft signal
- **Weight:** high | medium | low
- **Observable signal:** <how someone would verify this>
- **Description:** <the rule in business language; include time window if behavioral>

(Repeat per soft signal.)

---

## Disqualifiers

Explicit anti-list. A record matching any disqualifier is removed regardless of other matches.

### <Criterion name>
- **Type:** firmographic | technographic | demographic | relational
- **Match:** disqualifier
- **Observable signal:** <how someone would verify this>
- **Description:** <the rule in business language>

(Repeat per disqualifier.)

---

## Confidence and gaps

- **Assumptions made:** <decisions made without explicit guidance, with reasoning>
- **Decisions against the brief:** <choices that diverge from or extend the brief, with reasoning>
- **Open questions:** <items the user should clarify before this segment runs>
- **Signals not yet observable:** <criteria that would improve the segment if a new data source existed; wishlist, not filters>
````

---

## Field definitions

**Play slug.** Kebab-case, matches the filename. Named for what the play does, not when it runs. Example: `new-leader-abm-launch`, `mcb-launch`. Date-based slugs (`may-play`, `q2-launch`) are forbidden; timing is captured by the date metadata.

**Offer (one sentence).** What is being pitched, to whom, why now. If it cannot fit in one sentence, the offer is not yet clear. Stop and resolve before drafting criteria.

**Type.** Which of the six criterion types this is. See `practices/revops/skills/segment-criteria/criterion-types.md`.

**Match.** How the criterion is applied.
- `hard filter`: a record must match.
- `soft signal`: scoring input; absence does not exclude.
- `disqualifier`: presence excludes regardless of other matches.

Hard filters of type behavioral or relational are uncommon and should be defended in the confidence-and-gaps section. Most criteria of these types are better expressed as soft signals.

**Observable signal.** The answer to "how would someone verify this." Names the signal, not the source.
- Good: "company published a job posting for a data engineer in the last 60 days."
- Bad: "LinkedIn shows a hiring signal" (names a source) or "they are hiring" (not verifiable).

**Description.** Business-language rule. Source-agnostic. Never names columns, tables, providers, or query syntax.

**Weight (soft signals only).** Rough priority for the downstream scoring step. Three buckets: high, medium, low. Granularity is intentional for v1. May evolve as the downstream evaluation capability matures and discrimination needs increase.

**Confidence and gaps.** Not optional. Every artifact ends with this section, even if entries are short. A segment with no flagged assumptions is itself a flag.
