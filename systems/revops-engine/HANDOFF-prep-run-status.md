# Handoff: build `prep_run_status` (run-progress observability)

**Use this as the single starting point for the new session.** It is self-contained. You do not
need the old omnibus handoff except as optional deep history (see "Pointers").

---

## FIRST STEP — do not jump to a plan

Nick has additional context that will shape this build. **Before writing any plan, ask him for it
and work through it with him** (brainstorm first). The spec below is the baseline target, not the
final shape — his context may change scope, surface, or priorities. Plan only after that.

---

## What `prep_run_status` is (plain English)

A progress bar for the play-prep / screening pipeline, shown in projection-ui. Today you can see the
*results* of a prep run (verdicts sitting in staging) but you cannot watch the work *move* — you fire
a run and wait blind until it finishes. This makes each stage's progress visible live, e.g.:

```
Stage-1 ✓ 5 decided · Classifier 40/77 · Dedup ✓ 4 · Routing ✓ · Contacts ✓ 85 eligible
```

It is the run-side mirror of the data-observability that already exists.

## The spec (baseline)

**DB:** new table `prep_run_status(run_id uuid, batch_id text, entity text, stage text,
status text /* running|done|error */, counts jsonb, message text, started_at timestamptz,
updated_at timestamptz)`. One row per (run_id, stage). This is a new migration — **next file number
is `0011`** (0001–0010 already exist; see "Current state").

**Runners write status:** each runner in `systems/revops-engine/` writes a `running` row at start
and `done`/`error` (+ counts) at finish, via the Supabase Management API (the pattern they already
use). Add a `--run-id` arg. The **planner** (`generate-prep-plan.mjs`) mints one `run_id` and threads
it to every stage so the stages group as one run. Runners to touch:
`run-stage1.mjs`, `classify-runner.mjs`, `dedup-runner.mjs`, `route-runner.mjs`,
`contacts-screen-runner.mjs`, `generate-prep-plan.mjs`.

**Surface:** a section on the projection-ui **Runs** page that tails `prep_run_status` for the
active/most-recent run and renders the live strip. Reuse the existing fetch/poll pattern; a 2–3s
poll is fine.

**Acceptance:** run the funnel on a batch and watch the Runs page advance stage-by-stage, including
a stage going **red** if it throws (not silently hanging).

## Additions from the 2026-06-08 session (not in the original spec)

- **Batch the status writes — do NOT loop per-row.** Running per-row writes against the Management
  API hit a **429 (ThrottlerException)** this session and left a table half-written.
  `contacts-screen-runner.mjs` was rewritten to a **single batched UPDATE** as a result — use it as
  the template for how runners talk to the Management API. Status writes are only ~2 calls per stage,
  so they're cheap, but keep them that way.
- **Verify the Runs page exists before wiring it.** The spec assumes `projection-ui/app/runs/` and an
  existing poll pattern. Confirm that's real (projection-ui has `app/staging/`, `app/api/staging/`,
  `app/api/inngest/`). If there's no Runs page yet, building it is part of this work.
- **Confirm the planner is the right place to mint `run_id`.** Read `generate-prep-plan.mjs` first.
- **Define "done" up front and verify by actually watching it move** on a real batch — don't declare
  it done because the code compiles. (Hard-won lesson from this session; see memory
  `feedback_delivery_contract_first`.)

## Current state (so you don't act on stale assumptions)

- **Migrations applied through `0009`** (revops-engine, Supabase project `mrmnyscurmkfppicqqhk`).
  `0008` = promote SECURITY DEFINER fix (applied). `0009` = `staging_promotions.airtable_synced_at`
  (applied). `0010` = drop the n8n Airtable triggers — **file exists, NOT applied yet, intentionally
  held.** Do not apply 0010 as part of this build. Your new table is `0011`.
- Runner scripts and the staging schema (`staging.<entity>_<batch_id>`, classified via the play's
  rules in `accounts/clients/teknova/plays/ngabs-next-gen-antibodies/classifier/`) are current.
- `contacts-screen-runner.mjs` writes plain-English status strings and a single batched UPDATE.

## State + decisions from the 2026-06-08 session (current truth)

- **Promote to core is DONE/confirmed** for `ngabs_2026_06_05`: 62 companies + 159 contacts in
  canonical, idempotent (re-running promotes 0). Not related to prep_run_status, but it's the
  current state.
- **Output-state pattern shipped.** `export-airtable-payload.mjs` projects the contract-passing set
  from STAGING into transport-agnostic Airtable-ready JSON (one blob per row; merge key + the
  `agent_ngabs` Discovery-Source tag baked in). Output:
  `accounts/clients/teknova/plays/ngabs-next-gen-antibodies/output/airtable-{companies,contacts}-ngabs_2026_06_05.json`
  (62 + 133). **The delivery contract is enforced at generation time; transport stays dumb.**
- **Architectural canon (Nick, 2026-06-08):** CORE accumulates every contact and grows over time —
  do NOT delete; dedupe only by identity (email). The contract gate lives at EXPORT, not at storage.
  Core stores broadly (full set); the JSON payload exports narrowly (gated subset). Each contact
  carries its status + source so the export filter always works.
- **Vocabulary (locked, Nick-aligned 2026-06-08):** "Core" = the Records view =
  `public.companies` (~9,167) + `public.contacts` (~25,978), the permanent growing database. NOT a
  small per-batch set. Layers: **Staging** (in-flight batches) → **Promote** (moves a batch's
  qualifying rows into Core) → **Core/Records** (keeps everything, grows) → **Export** (contract-gated
  subset projected out for delivery). The contract gate is at Export, never at Core. Use these terms;
  do not say "canonical"/"working tables" loosely.

## Related open work (NOT prep_run_status — separate threads, captured so they aren't lost)

1. **Airtable transport consumer** — small idempotent script that reads the JSON payloads and upserts
   by `merge_on`, using record-ID lookup to survive the duplicate-laden Airtable table (the pattern
   that landed 62 + 215 with zero dupes today). Recommended transport over n8n/Inngest; wrap in
   Inngest later only if you want schedule/event triggering.
2. **Promote-page Airtable toggle** — decouple "promote to core" from "push to Airtable"; make the
   push opt-in and contract-gated. Today they're welded in the promote route (promote auto-fires the
   Inngest sync), which is why the UI Promote button is currently unsafe to click.
3. **Collapse the promotion ledger UI** — the Staging page renders `staging_promotions` as 100 raw
   near-identical rows; collapse to a per-batch summary line.
4. **Capture the full 215 in core** — core should hold the broader contact set (growing asset), not
   just the screened 133. Core currently holds 159; loading the delta from the broader
   Airtable-sourced set is a future load task.
5. **2 persistently-rejected contacts** — promote rejects them every run (a constraint/trigger);
   needs a look. Minor.

## Pointers

- **Runners + new table:** `systems/revops-engine/` (the six `.mjs` runners; add migration `0011`).
- **UI surface:** `systems/projection-ui/app/runs/` (verify) — reuse the staging-page poll pattern.
- **Deep history (OPTIONAL, mostly stale):** `systems/revops-engine/HANDOFF-2026-06-08.md`. Only its
  `prep_run_status` section is still accurate; ignore the Inngest/Airtable/sync parts — they were
  superseded on 2026-06-08 (sync now delivers via a contract-checked path; that work is done and is
  not relevant to this build).

---

Start by getting Nick's additional context. Then plan. Then build. Then watch it move.
