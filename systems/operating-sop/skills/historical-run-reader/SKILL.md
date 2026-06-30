---
name: historical-run-reader
description: Use this skill when iterating on an activity and you need to understand how it has been performing across runs (cross-engagement). It reads canon.activity_runs filtered by activity_id, returns the last N runs with diff summaries, surfaces failure clusters, and computes aggregate stats (success rate, median duration, median cost). This is the load-bearing read-and-summarize skill that other ITERATE skills compose against ... eval-reviewer, prompt-tweak-proposer, and regression-fixture-author all consume its output. Do NOT use for: fetching a single live run's status (use the run-detail view), proposing prompt changes (use prompt-tweak-proposer), capturing a fixture from a run (use regression-fixture-author).
status: DRAFT
---

# historical-run-reader

## Purpose
Give an iterating operator a compact, honest picture of how an activity has performed over its recent run history, across every engagement that has executed it. The output is the substrate every other ITERATE skill reasons against.

## When to use
- The operator opens an activity in ITERATE mode and needs a baseline read.
- Another ITERATE skill (prompt-tweak-proposer, eval-reviewer) needs run history as input.
- Diagnosing a regression or pattern of failures across engagements.

## What it does
- Loads the last N runs from canon.activity_runs for the given activity_id.
- Computes aggregate stats: total runs, success rate, median duration, median cost.
- Clusters failure messages into common buckets.
- Returns per-run digests with engagement, started_at, status, duration, cost, and a short message preview.

## Reads
- canon.activity_runs (filtered by activity_id, ordered by started_at desc, limit N).
- Uses systems/operating-sop/lib/historical-runs.ts as the canonical loader.

## Writes
- Nothing. Read-only summarization skill.

## Do NOT use for
- Fetching a single live run's status (use the run-detail view).
- Proposing prompt changes (use prompt-tweak-proposer).
- Capturing a fixture from a run (use regression-fixture-author).
