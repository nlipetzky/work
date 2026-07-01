# Handoff to Atlas — clean up + push the shared-CRM-ingest work

**Date:** 2026-07-01
**From:** the CRM-ingest build session (Boris-side work on canon-engine)
**Why you're getting this:** the branch `konstellation-crm-ingest` got polluted — multiple open sessions worked on it at once, and it was cut off the wrong base. Nick asked you to isolate the CRM-ingest work into a clean branch, push it, and open a PR.

---

## The one job

Get the 3 CRM-ingest commits onto a clean branch off `main`, push, open a PR. Leave everyone else's work alone.

## The 3 commits that ARE the CRM-ingest work (the only ones to move)

Newest first, contiguous on top of `bd428d9`:

- `51d543b` — canon-engine: drop defunct agent_8@konstellationai.com from ingest ACCOUNTS
- `7510e53` — canon-engine: scheduled SA-path ingest runner + launchd (5-min) + auth key-path fallback
- `6a32ef0` — canon-engine: ingest Will's mailbox + service-account calendar leg

Files these touch (all under `systems/canon-engine/`):
- `packages/ingestion/src/google/accounts.ts`, `gmail.ts`, `fetch-emails.ts`, `fetch-calendar.ts` (new), `auth.ts`
- `scripts/run-ingest.mjs` (new)
- `launchd/com.nick.canon-ingest.plist` (new)

They're self-contained to canon-engine. No conflicts with `main` expected.

## What's wrong with `konstellation-crm-ingest`

- It was branched off the `ai-expert-folder` tip, so `git log main..konstellation-crm-ingest` also contains commits that belong to OTHER features:
  - `bd428d9`, `cd97f60`, `31d5a34` — the `ai-expert-folder` feature (its own branch exists at `bd428d9`)
  - `0821b85` — the `expert-liaison-engine` feature (its own branch exists at `0821b85`)
  Those should merge via THEIR branches, not via this one.
- Multiple sessions used `konstellation-crm-ingest` at once; the working tree has ~63 uncommitted files (mixed WIP from those sessions + ai-expert-folder). **This is live WIP — do not discard it.**
- Not pushed to origin yet. Remote is `origin  https://github.com/nlipetzky/work.git`.

## Recommended cleanup

```
# fresh clean branch off main
git branch crm-ingest main
git switch crm-ingest

# graft the 3 CRM commits, oldest first
git cherry-pick 6a32ef0 7510e53 51d543b

git push -u origin crm-ingest
# then open the PR to main
```

If a cherry-pick conflicts (only if main moved under systems/canon-engine), resolve in favor of the CRM commit's intent and continue.

## Do NOT

- **Do not `git reset --hard` or `git clean -fdx`** on the shared tree — it destroys the other sessions' 63-file WIP, and `-x` wipes gitignored `.env`/`.secrets` (standing landmine).
- **Do not try to salvage the ai-expert-folder / expert-liaison commits from this branch** — they already have their own branches; leave them.
- The ~63 uncommitted files belong to other sessions/features — leave them for those sessions to commit. Only the 3 commits above are ours to move.

## Live-system notes (won't affect the branch cleanup, but know them)

- The launchd job `com.nick.canon-ingest` is LOADED and running every 5 min (copy in `~/Library/LaunchAgents/`, source in the repo). It runs from the working-tree build. Branch surgery does not touch it; it keeps running. If someone rebuilds canon-engine on a different branch state, the job uses whatever dist is present.
- Work-root `.env` has `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` added (gitignored, machine-local, NOT in any commit). The clean branch correctly does not carry it.
- `dist/` is gitignored; the 3 commits carry SOURCE only. Any deploy needs `pnpm build` at the canon-engine root.

## Context

Full project state + remaining open items (Will's Send-As option, more prospect domains, transcript-router overlap) are in memory `project_shared_crm_ingest.md`. None of those block the PR. Plan doc: `~/.claude/plans/1-yes-2-yes-abstract-pebble.md`.
