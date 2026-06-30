---
name: prompt-tweak-proposer
description: Use this skill when iteration on an activity needs a concrete prompt-level change ... not a vague "tighten this up" but a specific, shippable diff. It takes the activity's current bound prompt or SKILL.md plus recent failure cases from historical-run-reader, and proposes ONE concrete tightening: a diff against the current skill body, a rationale tied to the observed failures, and 1-2 regression fixtures to add to the eval set so the change is locked in. Do NOT use for: critiquing the existing skill's quality without proposing a change (use skill-quality-critic), capturing fixtures unrelated to a prompt change (use regression-fixture-author), reading the run history itself (use historical-run-reader first).
status: DRAFT
---

# prompt-tweak-proposer

## Purpose
Close the loop from observed failure to shippable prompt change in one move ... diff, rationale, regression fixtures, all bundled so the operator can review and ship.

## When to use
- historical-run-reader has surfaced a failure cluster and the cause looks prompt-shaped.
- The operator wants ONE concrete proposal, not a menu of options.
- Following a skill-quality-critic pass that identified a specific weak spot.

## What it does
- Ingests the current bound prompt/skill body and recent failure cases (from historical-run-reader output).
- Identifies the smallest tightening that would have prevented the observed failures.
- Outputs: a unified diff against the current skill body, a rationale tied to specific failed runs, and 1-2 proposed regression fixtures that lock the new behavior into evals.

## Reads
- The activity's current bound SKILL.md or prompt.
- historical-run-reader output (failure cases + run digests).

## Writes
- Proposes a draft via /api/operate/iterate. Does not apply the diff or insert fixtures directly; the operator confirms.

## Do NOT use for
- Critiquing the existing skill's quality without proposing a change (use skill-quality-critic).
- Capturing fixtures unrelated to a prompt change (use regression-fixture-author).
- Reading the run history itself (use historical-run-reader first).
