# Handoff → Atlas: sort the working-tree mess (2026-07-01)

**From:** Boris (agentic-systems) session. **To:** Atlas (operator-os).
**Purpose:** reconcile the shared `~/code/work` checkout into scoped commits before the Boris + CIPO + Hermes sessions archive — without losing work or committing PII. Sibling handoffs from the CIPO, Hermes, and CRM-ingest sessions are landing alongside this one; synthesize across all of them.

## The one job

The shared checkout has multiple sessions' **uncommitted** work intermingled on the wrong branch. Sort it into scoped, per-workstream commits. **The DB is durable** (all migrations already applied to live canon) — only uncommitted **files** are at risk.

## Git baseline

- **SAFE — committed + pushed:** `origin/ai-expert-folder @ bd428d9` = the AI-expert-folder (Boris): `31d5a34` (schema 028–033), `cd97f60` (/folder + file-judgment-unit skill + /operate integration), `bd428d9` (FolderDefaults render). Same history carries `0821b85` (expert-liaison-engine) and `cf82582` (/operate cockpit). **Do not re-touch these — the folder work is done.**
- **Current checkout:** local branch `konstellation-crm-ingest` (HEAD = `bd428d9`, no upstream). All the pending work is loose here.

## Workstreams to sort (each owner's handoff has the exact file list)

1. **Boris AI-expert-folder** — DONE + pushed. Nothing to commit. Listed so it is not disturbed.
2. **CIPO outbound pipeline** (owner: CIPO session) — new scripts `find-contacts.mjs`, `verify-contacts.mjs`, `qualify-prospects.mjs`, `enrich-nih.mjs`, `gen-approval-surface.mjs`, `export-send-list.mjs`; edits to `enrich-prospects.mjs`, `watch-signals.mjs`; CIPO artifacts (`copy-cipo-teardown-will-v1.md`, `hermes-brief-will-teardown-copy.md`, `email-draft-will-lead-magnet-decision-2026-06-30.md`); `accounts/ventures/konstellation-cipo/CLAUDE.md`.
3. **Hermes EL / cold-outreach** (owner: Hermes session) — migration `034_register_cold_outreach.sql`; `request-copy-signoff.mjs`, `apply-copy-approvals.mjs`, edit to `produce-sequence.mjs`; the /operate EL-embed edits (`lib/operate/sop-types.ts`, `lib/queries/operatingSop.ts`, `components/operate/SystemViewEmbed.tsx`, `components/operate/ActivityDetail.tsx`, `components/operate/OperateCockpit.tsx`, `app/expert-liaison/ExpertLiaisonSurface.tsx`); the `wf-expert-signoff` workflow inside the SOP file.
4. **CRM ingest** (owner: CRM-ingest session) — `systems/canon-engine/packages/ingestion/src/google/*` (`accounts.ts`, `auth.ts`, `fetch-emails.ts`, `gmail.ts`). Home branch = `konstellation-crm-ingest`.

**SHARED FILE — commit ONCE:** `systems/operating-sop/sops/launch-outbound-for-venture.ts` carries BOTH the CIPO 16-stage rewrite AND Hermes's `wf-expert-signoff`. Put it in whichever group commits it, but only one commit.

## Hard rules

- **EXCLUDE** `accounts/ventures/konstellation-cipo/exports/` — PII CSVs, never commit.
- **NEVER** `git clean -fdx` on this tree — `.env` is gitignored and `-x` wipes it (memory: `git_clean_fdx_landmine`).
- **Never** `git add -A` blindly — it fuses unrelated workstreams. Add explicit paths per group.
- Don't touch the `ai-expert-folder` branch or its files (`FolderDefaults.tsx`, `composition-draft.ts` were explicitly left untouched by the Hermes session — keep it that way).

## Pre-existing background mess (a SEPARATE problem — flag, do not assume)

Not everything uncommitted belongs to these four workstreams. A layer predates them (present at this session's start): `capabilities/**` scaffolding + `INDEX.md` files, `.claude/hooks/`, the inngest deletions (`lib/inngest/client.ts` / `functions.ts`) + `package.json`, `app/api/staging/*` route edits, `.claude/launch.json`, some root/`CLAUDE.md` edits, the `ECOSYSTEM-MAP.md` deletion, `lib/queries/prospects.ts`. Treat this as a distinct reconciliation — confirm ownership before committing any of it; do not sweep it into a workstream commit.

## Authoritative sources

- Close-out handoff: `practices/agentic-systems/scratchpad/handoff-close-boris-cipo-sessions-2026-07-01.md` (enumerates the CIPO + Hermes files + safe-close steps precisely).
- The sibling session handoffs (CIPO, Hermes, CRM) landing alongside this.

## Recommended approach (Boris's rec — Nick decides branch strategy)

Fastest de-risk: commit **each workstream as its own scoped commit**, all on one branch first (keep them on `konstellation-crm-ingest` or a fresh `worktree-reconcile` branch), then split into per-workstream branches later if wanted. Cleaner-now: three branches (`cipo-outbound`, `cold-outreach-signoff`; CRM ingest stays on `konstellation-crm-ingest`). Either way: exclude `exports/`, one commit for the shared SOP file, leave `ai-expert-folder` alone.

## DB state (durable — no git action needed)

canon `mzzjvoiwughcnmmqzbxv`: migrations **024–034** applied. The "Will signs off the CIPO Teardown cold copy (5 decisions)" motion is **live + open** (ball in operator's court, nothing faked). AI-expert-folder ledger clean (0 units), `revops` folder registered.

## Explicitly NOT in scope for this sort

- The canon/TS SOP-drift (separate reconciliation — real, still open, worked-around not fixed).
- Backfilling real folder judgment_units (NIH/PI/enrichment-recipe) — separate future BUILD.
