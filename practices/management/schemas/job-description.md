# Schema: Job Description

**Locked.** Output of pipeline stage 2. One per hire at
`hires/<role-slug>/job-description.md`. Derived strictly from the approved `role-brief.md`
— nothing in the JD that isn't backed by the brief.

Upwork-optimized: search-friendly title, short hook, scannable body, screening questions
that filter, and an application instruction that screens out low-effort applicants.

Produce a markdown file with exactly these sections, in this order:

---

# <Title>

**Title** — written how a freelancer would search for it on Upwork (role + key tool/skill,
not internal jargon). Under ~80 chars.

## Hook

2–3 lines. What this is and why it's worth their time. No corporate filler. Leads with the
work, not the company.

## What you'll do

Bulleted, scannable. Derived from the brief's "In scope" and "Outcomes owned." Concrete
verbs.

## What we're looking for

**Must have:** (from brief's Must-have skills)
**Nice to have:** (from brief's Nice-to-have)

## About the work

Short. The engagement shape in candidate-facing terms: ongoing vs project, rough hours,
how we work (async, tools). Honest about what it is.

## Screening questions

3–5 questions. Each maps 1:1 to a brief "Screening signal." Phrased so a copy-paste or
generic answer is obviously weak. At least one asks for a concrete example or sample.

## Engagement & rate

Model (hourly/fixed), rate or range (matching the brief), expected duration/load.

## How to apply

A specific instruction that filters low-effort applicants — e.g. "Start your proposal
with [keyword] so I know you read this" plus answer the screening questions directly.
Keep it short and unambiguous.
