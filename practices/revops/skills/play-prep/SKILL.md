---
name: play-prep
description: >-
  Prepare a play's staged data batch for client review: classify every row against the play
  criteria + client guidance, verify it (filled is never trusted), flag gaps, and land the result
  in the projection-ui Staging surface for the Promote checkpoint. Trigger on "prep the <play>
  batch", "classify the staging batch", "run data-prep on <batch_id>", "verify the <play>
  companies against the guidance". NOT for sourcing/building lists (that is discovery), NOT for
  client-comms or projecting client feedback into guidance (that is Hermes/expert-liaison), NOT
  for identity resolution. One play, one batch at a time.
---

# play-prep — play-scoped data-prep agent

A plan → execute → verify loop over one staging batch. The agent **orchestrates the runners; it
never free-hands data**. Every mutation goes through the controlled runners / `promote_staging_batch`
so it is provenance-stamped and visible in the surface. If a change isn't in the surface with
provenance, it didn't happen.

## The non-negotiables
- **On-rails only.** Canonical writes go through `promote_staging_batch` (the enrichment trigger
  rejects any write without recipe context). Working classification labels go to `staging.prep_*`
  columns only. No ad-hoc canonical SQL.
- **Verification mandate.** "Filled" is never "trusted." A value is verified only when checked
  against the criteria/guidance (or a validator) and stamped. Unverified-but-present is work, not
  done. A verdict resting on an unverified field is `NEEDS_REVIEW`, never a guessed IN.
- **Rows never enter a conversation.** All per-row work runs inside the runner scripts; only
  aggregates and file paths come back.
- **Human checkpoints.** The operator approves the prep-plan artifact before execution, and clicks
  **Promote** in the surface before anything reaches the client. The agent does not auto-promote.
- **Criteria are a living iteration**, not law. Surface rule-vs-evidence conflicts; don't force
  evidence to fit a rule.

## The loop
1. **Plan.** Dispatch the **play-prep-planner** sub-agent. It runs the funnel (deterministic
   Stage-1 SQL → semantic classifier on the residual → gap/verification detection) and emits the
   approvable **prep-plan artifact** to the play's `prep-plans/` folder. It stops for approval.
2. **Approve.** The operator reads the artifact (or the Staging drawer) and signs the approval line.
3. **Execute.** Dispatch the **play-prep-executor** sub-agent. It applies the approved
   dedup/hierarchy + acquired-routing labels to staging and leaves the prepared batch for the
   Promote checkpoint. On-rails only; it does not auto-promote.
4. **Verify.** The operator reviews in projection-ui Staging (verified rows show a green row
   number; the drawer shows per-criterion evidence) and clicks **Promote**.

## What exists (use; do not rebuild)
- Play bundle: `accounts/clients/<client>/plays/<play>/` — `playbook-*.md` (criteria),
  `client-guidance.md` (the executable rule set), `classifier/` (the play's stage1 SQL + semantic
  prompt + the dedup/route/contacts-screen config files), `prep-plans/` (the artifacts).
- **The plan is data, not prose.** `<play>/prep-recipe.json` declares the ordered `stages` and the
  `inputs` the run needs. The funnel is whatever the recipe says — you never hardcode the stage list.
- The machinery in `systems/revops-engine/`:
  - `lib/recipe.mjs` — `loadRecipe` / `resolveStages` / `buildPlan` (recipe → concrete commands).
  - `lib/stage-registry.mjs` — the safety boundary: a recipe can only name a known stage type.
  - `lib/readiness.mjs` — the input-readiness report (a report, not a gate).
  - `lib/run-status.mjs` — the run-progress primitive + its CLI (`seed` / `set` / `msg`). **This CLI is
    how the agent drives.** Each run writes `public.prep_run_status`, which the projection-ui Runs strip
    reads live.
  - `run-prep.mjs` — the deterministic sibling driver (headless/cron). `--print-plan` makes it emit the
    readiness report + the resolved plan JSON for the agent to drive. The runners: `run-stage1.mjs`
    (deterministic), `classify-runner.mjs` (semantic, isolated per-row), `dedup-runner.mjs`,
    `route-runner.mjs`, `contacts-screen-runner.mjs`, `generate-prep-plan.mjs` (the artifact). Each
    accepts `--run-id` and writes its own status.
- On-rails: `promote_staging_batch` (provenance-aware), `staging_batch_preview`,
  `list_staging_batches`. Validity guard: `projection-ui/lib/validity.ts`.
- Schema of the artifact: `practices/revops/skills/play-prep/schema.md`.

## How the agent drives
The **play-prep-planner** sub-agent runs `run-prep.mjs --print-plan` to get the readiness report + the
plan, then drives each stage itself via the `run-status.mjs` CLI (seed once, `set ... running` per
stage, run the stage's command with `--run-id`, let the runner mark its own `done`/`error`). It is the
interactive driver; `run-prep.mjs` (no flag) is the deterministic one. Both read the same recipe and
write the same status table.

## Parked / pending (say so honestly in the artifact)
- Research lane (gap re-enrichment with source-cites) — designed, not wired.
- Dedup/hierarchy + acquired-routing as runners — currently noted in the artifact, applied by the
  executor as they come online.
- Contacts pass — the classifier currently runs on companies.
