---
name: skill-quality-critic
description: Use this skill when iterating on the SKILL.md bound to an activity and you need a blunt critique of its quality before shipping a change. It reads a single SKILL.md file and applies the loading-rent rubric from practices/agentic-systems/CLAUDE.md ... description specificity, NOT-for boundary quality, scope creep (does the description have "and" three times?), instructions Claude already follows by default, lines that aren't paying rent. Returns concrete tightening suggestions, not vague "make it better" feedback. Do NOT use for: proposing prompt-level changes to the skill body (use prompt-tweak-proposer), reading run history (use historical-run-reader), authoring a new skill from scratch (use skill-creator).
status: DRAFT
---

# skill-quality-critic

## Purpose
Be the senior-engineer review that catches a SKILL.md before it ships bloated, vague, or scope-creeping. Every line in a SKILL.md is paying context rent; this skill is the rent collector.

## When to use
- About to commit a SKILL.md edit and want a critique pass first.
- An activity's bound skill keeps triggering at the wrong times (or failing to trigger).
- Auditing skills periodically for drift against the loading-rent doctrine.

## What it does
- Reads the target SKILL.md file (frontmatter + body).
- Applies the rubric: description quality (does it tell Claude when AND when not to use the skill?), NOT-for specificity (concrete sibling skills, not generic categories), scope creep (multiple "and"s in description signal multiple skills), default-behavior instructions (lines Claude follows anyway), bloat (instructions covered better by reference files).
- Returns a critique with line-level tightening suggestions and an overall verdict.

## Reads
- The single SKILL.md file passed in.
- practices/agentic-systems/CLAUDE.md (the rubric source).

## Writes
- Nothing. Returns critique text only; the operator decides whether to apply.

## Do NOT use for
- Proposing prompt-level changes to the skill body (use prompt-tweak-proposer).
- Reading run history (use historical-run-reader).
- Authoring a new skill from scratch (use skill-creator).
