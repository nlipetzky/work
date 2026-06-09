# Handoff: Phase 4 — Skill hierarchy / agent-driven driver

**Start the new session here.** Self-contained. Launch from `/Users/nplmini/code/work/practices/agentic-systems/`
(loads Boris + the roadmap + the deepline reference docs). Branch fresh off `main`.

---

## Where we are

Phases 0-3 of the owned execution engine are **done and merged to `main`** (PR #1 merged; `main` at
`9d68c0a`). The roadmap is the source of truth:
`/Users/nplmini/code/work/practices/agentic-systems/ROADMAP.md`.

- **Phase 0** — Staging → Promote → Core + projection-ui trust surface (pre-existing).
- **Phase 1** — Run observability: `public.prep_run_status` + `lib/run-status.mjs` (the status primitive
  with a `seed/set/msg` **CLI seam**) + projection-ui Runs strip.
- **Phase 2** — Execution plan as data: per-play `prep-recipe.json` + `lib/stage-registry.mjs` (safety
  boundary) + `lib/recipe.mjs` (loader/validator); `run-prep.mjs` reads the recipe. Plus the binding:
  `systems/revops-engine/CLAUDE.md` + an `@import` in `accounts/clients/teknova/CLAUDE.md`.
- **Phase 3** — Input readiness check: `lib/readiness.mjs` + a visible `inputs` list in the recipe;
  `run-prep.mjs` prints a plain-English readiness report and proceeds (a report, **not** a gate);
  `--strict` is opt-in.

## Do this FIRST (small, real, slot before Phase 4)

**Batch `route-runner.mjs`'s writes.** `/Users/nplmini/code/work/systems/revops-engine/route-runner.mjs`
writes one row at a time (a `for` loop with `await sql(update ... where id=...)` per contact, ~173 calls).
That tripped the Supabase Management API rate limit (HTTP 429) under load this session. Rewrite it to a
single `UPDATE ... FROM (VALUES ...)` batched write, exactly like
`/Users/nplmini/code/work/systems/revops-engine/contacts-screen-runner.mjs:83-91` already does. Small,
isolated, removes a recurring failure mode. (`dedup-runner.mjs` also does per-row writes but on a far
smaller set — batch it too if cheap, otherwise leave.)

## Phase 4 — what to build

**Goal (from the roadmap):** the **play-prep skill** drives the funnel end-to-end — an agent issuing the
status-primitive CLI and reading the recipe — instead of `run-prep.mjs`. This is the manual→autonomous
step: `run-prep.mjs` becomes *one* driver (the deterministic script), the skill becomes the *other* (the
agent), sharing the same machinery underneath. The `seed/set/msg` CLI on `lib/run-status.mjs` was built in
Phase 1 **specifically** for this — it's the seam the agent plugs into.

**The model to borrow:** Deepline's skill bundle — a meta-skill (router) → phase docs → recipes →
provider playbooks, with mandatory pre-execution read gates and the Session-UI choreography
(`session start --steps` / `--update --status` / `session status --message`). We've already studied it:
- Reference docs: `/Users/nplmini/code/work/practices/agentic-systems/reference/deepline-methodology.md`,
  `deepline-tactical-execution-discipline.md`, `deepline-upstream-inputs.md`, `deepline-user-experience.md`.
- The actual bundle: `/Users/nplmini/.claude/skills/deepline-gtm/` (SKILL.md is the meta-skill;
  `claude-deepline-statusline.mjs` is the live-status pattern we mirrored in the Runs strip).

**There is already a play-prep agent** (thin SKILL + planner/executor subagents, sandboxed runners,
verification mandate) — see memory `project_play_prep_agent`, plan at
`/Users/nplmini/.claude/plans/we-are-now-at-glimmering-eich.md`. Phase 4 is about evolving THAT to drive
the recipe-defined funnel via the status CLI, not building a skill from scratch. **Brainstorm the seam
first** — how much the skill owns vs the script, whether the skill calls the CLI per stage or shells
`run-prep.mjs`, where the meta-skill/phase-doc/recipe split lands for our funnel.

**HARD CONSTRAINT (do not skip):** memory `feedback_no_blocker_overbuild`. Autonomy must not become a wall
of blockers, caveats, or invented acronyms. The agent-driven path must stay legible and keep work moving —
inform in plain English, hard-block only the truly-fatal case, no jargon Nick has to decipher.

## The workflow that's been working

brainstorm → spec → plan → execute → finish. Concretely: `superpowers:brainstorming` (design + approval) →
write spec to `/Users/nplmini/code/work/practices/agentic-systems/specs/` → `superpowers:writing-plans`
(plan to `.../plans/`) → execute (`subagent-driven-development` or `executing-plans`) →
`finishing-a-development-branch`. Phases 2 and 3 both shipped this way. See the Phase 2/3 specs and plans
in those folders as the pattern to match.

## Architecture cheat-sheet (the machinery Phase 4 drives)

- A run = `node run-prep.mjs <batch_id> [--play <playDir>] [--strict]`
  (`/Users/nplmini/code/work/systems/revops-engine/run-prep.mjs`). It: loads the recipe, prints readiness,
  seeds `prep_run_status`, runs each stage via its registered runner threading `--run-id`.
- `lib/recipe.mjs` — `loadRecipe(playDir)` (reads `<playDir>/prep-recipe.json`, default fallback) +
  `resolveStages` (validates against the registry, fail-fast).
- `lib/stage-registry.mjs` — maps a stage name → runner + argv. A recipe can only name a known stage.
- `lib/readiness.mjs` — `checkReadiness` / `formatReadiness` (the report).
- `lib/run-status.mjs` — `sql`, `seedPlan/markRunning/markDone/markError/setMessage` + a CLI
  (`node lib/run-status.mjs seed|set|msg ...`). **This CLI is the agent-driver seam.**
- The five runners: `run-stage1`, `classify-runner`, `dedup-runner`, `route-runner`,
  `contacts-screen-runner`. Each takes `--run-id` (optional; absent = no status writes).
- Tests: `cd /Users/nplmini/code/work/systems/revops-engine && node --test lib/stage-registry.test.mjs lib/recipe.test.mjs lib/readiness.test.mjs` (14 pass). No framework — Node built-in runner.

## DB / infra gotchas

- Supabase project `mrmnyscurmkfppicqqhk` (revops-engine-dev), **Micro instance**. Writes go via the
  Management API, bearer token `SupaBase_CLI_access_token` in `/Users/nplmini/code/work/.env`. No
  supabase-js in the engine, no OAuth.
- **HTTP 544** "Connection terminated" during cron matview-refresh windows — saturation. Mostly fixed by
  migration 0012 (staggered the cron). Memory `project_revops_db_micro_cron_saturation`. Retry through it.
- **HTTP 429** ThrottlerException — the Management API rate-limits after many runs in a session. This is
  why `route-runner` batching matters. If you see 429, back off and retry; don't hammer.
- Migration 0010 (drop n8n triggers) is intentionally **held** — do not apply.

## Memories to respect (the load-bearing ones)

`feedback_no_blocker_overbuild` (above), `feedback_full_file_paths` (always absolute paths),
`feedback_no_multiple_choice` (clarifying questions as plain chat, not pickers), `feedback_no_gate_jargon`,
`feedback_understand_architecture_first`, `feedback_hold_things_loosely`, `project_play_prep_agent`,
`project_revops_ingest_pipeline`, `project_projection_ui`.

## Loose ends (tracked, not blocking Phase 4)

- **Phase 2 manual check, still unticked:** launch a session from
  `/Users/nplmini/code/work/accounts/clients/teknova/` and confirm the `@import` actually loads
  revops-engine context.
- **DB hygiene:** capture the four audit-matview definitions in tracked migrations; rework the slow
  `v_contact_field_completeness` query.
- **Roadmap/registry consolidation:** the two Airtable roadmaps + stale-item cleanup (deferred; both base
  IDs are on the roadmap under "Open threads").

## After Phase 4

Roadmap order is **Phase 5** (approval gate + cost discipline — before paid providers) then **Phase 6**
(the full funnel beyond prep: discovery → enrich → personalize → activate → capture → analyze).
**Phase 7** (strategic layer that authors the input documents) is open-ended and already started via the
`lead-gen-strategist` skill that landed on `main`.
