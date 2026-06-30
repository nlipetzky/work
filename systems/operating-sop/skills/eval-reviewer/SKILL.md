---
name: eval-reviewer
description: Use this skill when diagnosing the quality or coverage of an activity's eval set ... typically after historical-run-reader has surfaced a regression or before proposing a prompt change. It opens canon.activity_evals and canon.activity_eval_runs for the activity, returns the pass-rate trend over recent runs, flags fixtures that look stale (haven't been touched while the activity has changed), and maps which fixtures cover which input shapes so coverage gaps are visible. Do NOT use for: authoring a new fixture (use regression-fixture-author), proposing the prompt change itself (use prompt-tweak-proposer), critiquing the bound SKILL.md (use skill-quality-critic).
status: DRAFT
---

# eval-reviewer

## Purpose
Tell the operator whether the eval set behind an activity is actually doing its job ... catching regressions, covering the input shapes the activity sees in production, and staying current with the bound skill.

## When to use
- Pass-rate has drifted and you need to know whether evals are weak or the activity is broken.
- Before shipping a prompt-tweak-proposer change ... confirm the evals will catch a regression.
- Periodic coverage audit on an activity that has accumulated many runs.

## What it does
- Loads canon.activity_evals and canon.activity_eval_runs for the activity_id.
- Computes pass-rate trend over the last N eval runs.
- Flags fixtures that are stale (last-updated predates the bound skill's last revision).
- Maps each fixture to the input shape it covers; surfaces shapes from production runs that no fixture covers.

## Reads
- canon.activity_evals, canon.activity_eval_runs (filtered by activity_id).
- canon.activity_runs (to extract production input shapes for coverage comparison).

## Writes
- Nothing. Read-only diagnostic skill.

## Do NOT use for
- Authoring a new fixture (use regression-fixture-author).
- Proposing the prompt change itself (use prompt-tweak-proposer).
- Critiquing the bound SKILL.md (use skill-quality-critic).
