# Phase 3 — Input readiness check (design spec)

**Date:** 2026-06-09
**Roadmap phase:** Phase 3 — Input-document contract + pre-flight gate (`practices/agentic-systems/ROADMAP.md`)
**Status:** design approved, ready for implementation plan

## Context

Phase 3 is the seam between the strategic layer (which authors a play's input documents — offer, segment,
disqualifiers, ICP-titles, sender, copy...) and the execution engine (which consumes them). The roadmap
Done-when allows either "refuses to start" or "clearly flags." **We take the "clearly flags" branch
deliberately.**

This is a direct response to a stated guardrail (memory `feedback_no_blocker_overbuild`): do not build a
system so full of blockers, caveats, and invented jargon that work can't happen. So Phase 3 is a
**readiness report, not a blocker**. It prints, in plain English, what input documents back the play and
what's missing — then **runs anyway**. It adds zero new hard stops. The only existing hard stop is the
mechanical config-missing check from Phase 2 (a config file a stage literally reads), which stays as-is.
The "teeth" (stop-on-missing) are opt-in via `--strict` and matter later, before paid/activation runs.

## Goal / Done when

Before a run, the engine reports — in plain language, no acronyms — which of the play's declared input
documents are present and which are missing, distinguishing what's needed for *this run* from what's for
*later*. It proceeds by default; `--strict` makes it stop when an input needed for this run is missing.

## Design

### 1. The `inputs` list (per-play, visible in the recipe)

`prep-recipe.json` gains an optional `inputs` array. The play author (a human, or the strategic-layer
skill later) declares the documents that should back this play, in plain names, with paths and timing.
It lives in the recipe **so it's visible and editable** — nothing hidden in code.

```json
{
  "system": "revops-engine",
  "configDir": "classifier",
  "inputs": [
    { "name": "offer",              "path": "../../artifacts/revops-offer-ngabs.md",   "when": "now" },
    { "name": "segment",            "path": "../../artifacts/revops-segment-ngabs.md", "when": "now" },
    { "name": "screening criteria", "path": "classifier/classifier-prompt.md",         "when": "now" },
    { "name": "client guidance",    "path": "client-guidance.md",                      "when": "now" },
    { "name": "contact titles",     "path": "../../artifacts/revops-icp-titles-ngabs.md", "when": "later" },
    { "name": "sender voice",       "path": "../../artifacts/revops-sender-voice-ngabs.md", "when": "later" },
    { "name": "outreach copy",      "path": "../../artifacts/revops-copy-ngabs.md",    "when": "later" }
  ],
  "stages": [ ... unchanged ... ]
}
```

- `path` is relative to the play dir (the play is at `accounts/clients/teknova/plays/<play>/`; engagement
  artifacts at `../../artifacts/`).
- `when`: `"now"` = backs a stage in the current run (enforced only under `--strict`); `"later"` =
  informational, for the outreach/activation funnel that doesn't run yet. Defaults to `"now"` if omitted.
- `"later"` entries may point at files that don't exist yet — the report shows the expected location.
- A recipe with **no** `inputs` array runs exactly as today (backward compatible; no report).

### 2. Readiness check module — `systems/revops-engine/lib/readiness.mjs` (NEW)

- `checkReadiness(recipe, playDir)` → `{ items: [{name, path, when, present}], missingNow: [...], allNowPresent: bool }`.
  - "present" = the file **exists and is non-empty** (size > 0). No stub/placeholder detector — that would
    over-think and misfire. Exists + non-empty is the whole rule.
  - Pure of side effects beyond `fs.existsSync`/`fs.statSync`; unit-testable with temp dirs.
- `formatReadiness(report, playName)` → the plain-English multi-line string (see example below). No
  acronyms, no gate numbers.

Example output:

```
Play readiness — ngabs
  Ready for this run:
    ✓ offer              artifacts/revops-offer-ngabs.md
    ✓ segment            artifacts/revops-segment-ngabs.md
    ✓ screening criteria classifier/classifier-prompt.md
    ✓ client guidance    client-guidance.md
  Not yet (needed for outreach, not this run):
    — contact titles     (no file)
    — sender voice       (no file)
    — outreach copy      (no file)
  All inputs for this run are present. Proceeding.
```

If a `now` input is absent: the "Ready for this run" line for it reads `✗ segment  (no file: <path>)`, and
the closing line becomes `Missing for this run: segment. Proceeding anyway — add --strict to stop on missing inputs.`

### 3. `run-prep.mjs` wiring

- Parse a `--strict` flag.
- After `resolveStages` (so a bad recipe still fails first) and **before** `seedPlan`:
  ```
  const readiness = checkReadiness(recipe, playDir);
  console.log(formatReadiness(readiness, <playName from playDir basename>));
  if (strict && !readiness.allNowPresent) {
    console.error("--strict: an input needed for this run is missing — stopping.");
    process.exit(1);
  }
  ```
- Default (no `--strict`): print and proceed. No behavior change to the run itself.

### 4. Author the ngAbs `inputs` list

Add the `inputs` array above to
`accounts/clients/teknova/plays/ngabs-next-gen-antibodies/prep-recipe.json`. The four `now` documents all
exist today (verified); the three `later` ones don't yet (correct — they're outreach inputs).

## Out of scope (Phase 3)

- The strategic layer that *produces* the input documents (Phase 7 / the `lead-gen-strategist` skill).
- Per-stage input declaration in code — rejected in favor of the visible per-play `inputs` list.
- Any validity check beyond exists-and-non-empty (no TBD/placeholder scanning).
- Hard-blocking on paid/activation inputs — that arrives with the activation stages (Phase 6) and the
  `--strict`/must-block path; not built now.

## Verification

1. `node run-prep.mjs ngabs_2026_06_05` prints the readiness report (4 `now` present ✓, 3 `later` missing —),
   closing line "All inputs for this run are present. Proceeding," then runs the funnel as before.
2. Temporarily point a `now` input at a missing path → report shows it missing, closing line says
   "Proceeding anyway," and the run still completes. Restore.
3. Same missing-input recipe with `--strict` → prints the report, then stops with a nonzero exit before
   `seedPlan` (no `prep_run_status` rows written).
4. An empty file at a `now` path counts as missing (size 0).
5. A recipe with no `inputs` array runs with no readiness report (backward compatible).
6. Unit tests (`node --test`): `checkReadiness` present/missing/empty-file cases; `formatReadiness` renders
   `now` vs `later` sections and the all-present vs missing closing lines.
