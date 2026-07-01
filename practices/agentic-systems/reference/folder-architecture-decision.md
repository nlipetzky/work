# Folder-architecture decision: A + small-C now, B + canon-MCP deferred

## Update 2026-06-29 (later session): vertical-by-system confirmed + Inngest pattern proven

After a Perplexity revision pass on the architecture, vertical-by-system is the conscious choice. Slogan: **systems are the unit of ownership; capabilities are the shared library.** Each system owns its own vertical (workflows, scripts, schemas, skills, adapters, evals). Code lives with the system that owns the work it does, not in a global folder.

**Capabilities promotion rubric.** Move something into `capabilities/` only if it answers yes to all four:

1. Used by 2+ systems?
2. Stable upstream contract (interface won't churn per-consumer)?
3. No system-specific assumptions baked in?
4. Placement test ... if every system rebuilt this, would it duplicate?

If any answer is no, leave it in the system that needs it. Premature promotion is the failure mode.

**Inngest mount pattern (first concrete proof).** The shared Inngest client lives in `capabilities/inngest/`. Durable functions live in each owning system's `workflows/` folder and import the client. Projection-ui's `app/api/inngest/route.ts` unions functions from every owning system and serves the single endpoint. Dev command: `inngest dev -u http://localhost:4180/api/inngest`.

First concrete move executed: `systems/revops-engine/workflows/sync-on-promote.ts` (out of `projection-ui/lib/inngest/`, which was the wrong owner). Projection-ui is the HTTP host; it does not own cross-system workflows.

Full pattern: `/Users/nplmini/code/work/practices/agentic-systems/reference/vertical-system-pattern.md`.

**Open items still deferred:**
- `canon.systems`-as-MCP topology tool (option D) ... still gated on canon stabilizing off Micro + a logged failure of the static INDEX approach.
- `libs/` migration to `capabilities/` ... known drift; not done yet, no urgency until something else forces the touch.
- ETA + the 3 prospect engagement CLAUDE.mds ... not written yet; needed before those prospects move to active.
- `reference/studio-thesis.md` ... still missing; root CLAUDE.md flags rather than `@`-imports.

## Implementation status (2026-06-29)

Moves 1 and 2 of the recommended path shipped today:

- `~/code/work/scripts/generate-indexes.mjs` writes `systems/INDEX.md`, `practices/INDEX.md`, `accounts/INDEX.md`, `capabilities/INDEX.md`. Idempotent. Skips `_template` and hidden folders. Skips context-mode boilerplate when extracting summaries. Marks bare CLAUDE.md files (boilerplate-only) vs missing CLAUDE.md files in the index.
- Root `~/code/work/CLAUDE.md` `@`-loads all four INDEX.md files in the "Topology indexes" section.
- SessionStart hook at `~/code/work/.claude/hooks/session-start-context.mjs` injects a compact "you launched from X" pointer. Filesystem source of truth, no canon dependency, silent fail. Wired in `~/code/work/.claude/settings.json` with a 1500ms timeout. Replaces the prior inline node command.
- `practices/agentic-systems/ECOSYSTEM-MAP.md` deleted (its job is now done by `systems/INDEX.md`).
- `reference/studio-thesis.md` is still a known gap; root CLAUDE.md "Studio thesis" section now flags it rather than `@`-referencing a missing file.

**Correction to the original verdict:** `canon.systems` DOES exist as `public.systems` in the `canon_engine` Supabase project (40 rows; `public.assets` has 107). The verdict agent only grep'd the migration files and missed live state. This does not change the deferral on full-C (SessionStart hook injecting from canon) but it unblocks the option-D path (MCP tool exposing canon topology) whenever it's needed.

## When to revisit (the explicit defer rules)

- **Revisit B (skill-ifying reference docs)** only when 3+ named sessions have failed because a missing cross-cutting reference doc caused a bad artifact. Log them in a `Learnings:` block on this doc before re-opening the decision. Each candidate atomization gets its own skill with a tight trigger; no bulk conversion.
- **Revisit C-as-MCP-tool (option D)** when canon stabilizes off Micro AND the static INDEX approach has a logged failure mode that pull-based topology would fix. Build it as an MCP tool (`canon_topology(query)`) not a SessionStart hook. Do not put session bootstrap on canon's critical path.
- **Do not stack** new SessionStart hooks on top of this one without an audit ... per-session injection budget is finite.

## Original verdict (preserved below)

## Headline verdict

Do not proceed with B+C as scoped. **Confidence: high.** The mechanics check confirmed both are technically feasible, but the pattern survey, repo audit, and adversarial pass converged on the same diagnosis from three different angles: B+C pays per-session token rent on every launch to solve a problem that an explicit, deterministic alternative solves cheaper. Pivot to a hybrid: ship a thin static index now (A), upgrade the existing SessionStart hook to be cwd-aware (a much smaller version of C), and defer skill-ification of reference docs (B) until you have a logged failure mode that demands it.

## What verified

- SessionStart `additionalContext` injection is real and well-documented... ~10k char cap, system-reminder wrapping, exits on stdout JSON.
- The existing hook at `/Users/nplmini/code/work/.claude/settings.json` already injects `ECOSYSTEM-MAP.md` on every session... extension point is in place, no greenfield work needed.
- `@`-imports load at launch, count toward context, support 4 hops (not 5), and work from nested CLAUDE.md... mechanism is sound for option A.
- claude-mem + context-mode patterns prove the "SessionStart hook queries a local broker" shape works in production... the cwd-aware hook idea is not novel risk.
- Skills load from `.claude/skills/` walking up to repo root, so a workspace-root skills folder IS discoverable from any subdirectory launch... B's loading model works.
- Anthropic's documented ladder (CLAUDE.md → Skills → Subagents → Plugins) confirms Nick is on-canon for everything except the multi-axis peer-folder shape, which is past the documented frontier.

## What broke

- **B atomizes reference docs into skills.** Skills are action-shaped with sharp triggers; reference docs are topology and conventions. Wrapping them in SKILL.md frontmatter adds 5-10 candidates to the trigger matcher competing with action skills (`find-qualified-titles`, `n8n-safe-update`). Failure mode: silent mis-triggers and description-writing tax with no compounding payoff. Boris's own CLAUDE.md warns against exactly this ("skills that exist to make Claude do something it shouldn't do anyway").
- **C as scoped (SessionStart hook injects topology from canon-engine) has no source to query.** Repo audit: there is no `canon.systems` / `canon.practices` / `canon.reference_docs` table in the 16 migrations. The MEMORY.md claim of "canon_engine.public.systems (35) + assets (101)" does not appear in migration files. C requires building the topology schema first... that's not a hook task, it's a canon-engine project.
- **C puts session bootstrap behind an unstable dependency.** `revops-engine-dev` Micro DB already saturates from 4 pg_cron jobs / 26k contacts (HTTP 544 incidents on record). Adding per-session canon queries puts Claude Code launch on the critical path of a known-unhealthy surface.
- **C fights prompt caching.** Canon is hot. Cache invalidates on every write. Token spend goes UP for the 80% of sessions that don't need topology.
- **Three sources of truth.** Canon table + CLAUDE.md tree + injected prefix all describe the same topology. Drift is guaranteed; filesystem rename silently disagrees with canon.
- **`studio-thesis.md` is referenced from root CLAUDE.md but does not exist on disk.** Any travel scheme has a broken link at the root before it starts.
- **`operating-sop/skills/` is empty (`.gitkeep` only).** The system that should own operating-protocol-as-skill has no scaffolding... B would create the convention before the example exists.
- **The "stops at /Users/<user>/" framing of CLAUDE.md walk-up is wrong.** Walk goes from filesystem root down to cwd; `~/.claude/CLAUDE.md` is a separate user-scope loader. Minor, but corrects a mental model used in the original proposal.
- **Max `@`-import depth is 4 hops, not 5.** A deeply chained reference doc graph silently truncates.
- **Nested CLAUDE.md does NOT survive `/compact`.** Only project-root re-injects. Any load-bearing rule must live at root.

## What changed the picture

**Option A (static `@`-references) got stronger; Option D (canon-topology as an MCP tool) emerged as the right shape if canon-backed topology is actually needed.**

- A costs ~5 lines in root CLAUDE.md plus a generated `systems/INDEX.md` and `practices/INDEX.md`. It's deterministic, version-controlled with the filesystem, and reversible.
- D (pull-based MCP query) dominates C: topology is fetched when needed, scoped to the query, doesn't pollute every session's prefix, doesn't fight prompt caching, and keeps canon as the source of truth without paying SessionStart rent. If canon-backed topology is genuinely required, this is the shape.
- The adversarial check on determinism landed hard: project_deterministic_systems_produce_work and the just-shipped `/operate` surface are both bets on explicit invocation over inferred routing. B+C re-introduces the inference layer Nick just engineered out.

## Recommended path

**Modified plan, three moves in order:**

1. **A now (cheap, reversible):** Generate `systems/INDEX.md`, `practices/INDEX.md`, `accounts/INDEX.md`, `capabilities/INDEX.md` from a script that reads the filesystem. Add `@`-references to root `~/code/work/CLAUDE.md`. Create the missing `reference/studio-thesis.md` or remove the dangling reference.
2. **Upgrade existing SessionStart hook (smaller version of C, no canon dependency):** Change `.claude/settings.json` hook to enumerate sibling INDEX files from cwd and inject a compact "you launched from X, here's what else exists" stanza. No DB query. No canon dependency. Filesystem is the source of truth. Keep total injection under 2k tokens. Hard-timeout 1500ms. Degrade silently to today's `ECOSYSTEM-MAP.md` behavior on any error.
3. **Defer B and full-C until evidence forces them.** When you can name 3+ sessions where a missing cross-cutting reference doc caused a bad artifact, atomize that specific doc into a skill (one, with a tight trigger). When canon stabilizes off Micro and `canon.systems` actually exists, expose it as an MCP tool (`canon_topology(query)`), not a SessionStart hook.

## Concrete first move

One script: `~/code/work/scripts/generate-indexes.mjs`. Reads `systems/`, `practices/`, `accounts/`, `capabilities/`. For each child folder with a `CLAUDE.md`, extracts the first paragraph as a one-line summary. Emits `<axis>/INDEX.md`. Run it once. Add `@systems/INDEX.md @practices/INDEX.md @accounts/INDEX.md @capabilities/INDEX.md` to root `~/code/work/CLAUDE.md`. Open a fresh session from three different folders (a system, a practice, an account) and verify the indexes load and the agent uses them correctly. Total cost: an hour. If this fails to solve the discoverability pain, you have evidence to justify the bigger swing.

## Open questions for Nick

- **Is the discoverability pain logged anywhere?** Which specific sessions failed because topology wasn't pre-loaded vs. failed because the operator persona made a bad call? Without 2-3 named failures, B+C is solving an unmeasured problem.
- **Does `canon.systems` actually exist?** MEMORY.md says yes (35 systems, 101 assets), migrations say no. If it's in a schema or out-of-band, name it. If it doesn't exist, C is blocked on building it... and that's a different project.
- **Is the `studio-thesis.md` doc missing or moved?** Root CLAUDE.md depends on it. Either write it or strip the reference.
- **Are you willing to delete the existing static `ECOSYSTEM-MAP.md` injection if A makes it redundant?** The hook is load-bearing today; replacing it cleanly requires removing the old behavior, not stacking new on top.
- **At what scale do you actually expect this to break?** If 50 systems / 200 canon entries / 5 ventures is a year out, A + cwd-aware hook buys you a year. If it's three months, the canon-topology MCP tool moves up the queue.
