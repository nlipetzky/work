---
name: regression-fixture-author
description: Use this skill when a recent run revealed a behavior worth locking into the eval set ... a fix that should never regress, an edge case the activity now handles, or an input shape the evals don't yet cover. It captures the run's input and output (from canon.activity_runs) and proposes a new entry in canon.activity_evals with the expected output frozen as the assertion. Do NOT use for: proposing the prompt change that produced the behavior (use prompt-tweak-proposer), reviewing eval coverage at large (use eval-reviewer), reading run history for diagnosis (use historical-run-reader).
status: DRAFT
---

# regression-fixture-author

## Purpose
Turn a real run into a permanent guardrail. When a behavior is worth keeping, freeze its input/output into the eval set so any future drift trips the fixture.

## When to use
- A run produced output the operator wants to lock in as the expected behavior.
- A prompt-tweak-proposer change shipped and the new behavior needs a fixture (often invoked right after).
- An edge case appeared in production that the current eval set doesn't cover.

## What it does
- Loads the source run from canon.activity_runs by run_id.
- Extracts the input payload and the run's output.
- Proposes a new canon.activity_evals row: fixture name, input, expected output, link back to the source run for provenance.
- Surfaces the proposal for operator confirmation before insert.

## Reads
- canon.activity_runs (single row by run_id).
- canon.activity_evals (to check for fixture-name collisions).

## Writes
- Proposes a draft via /api/operate/iterate. Does not insert into canon.activity_evals directly; the operator confirms.

## Do NOT use for
- Proposing the prompt change that produced the behavior (use prompt-tweak-proposer).
- Reviewing eval coverage at large (use eval-reviewer).
- Reading run history for diagnosis (use historical-run-reader).
