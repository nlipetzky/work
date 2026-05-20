# Handoff: Play Orchestrator Build
**Session date:** 2026-05-13
**Next session:** Pick up manual Airtable UI tasks + Teknova AAV Step 2

---

## What was built

Two state-tracking tables added to the RevOps Surface base (`appYBYH3aOHhTODAw`):

- **Playbook** (`tbli5DqoRR8jpHuo6`) — extended with Client, Status, Start Date, Owner, Notes. One active row: Teknova AAV outreach (recgfrlCdaFUx5dpV).
- **Play Steps** (`tblzE9GB8UIs5hGFJ`) — new table. 16 rows backfilled for Teknova AAV covering phases A-I. Depends On self-link wired for Phase D dependencies.

The session start protocol in `practices/revops/CLAUDE.md` now forces every RevOps session to read these tables before responding and write on every step transition. These tables are the source of truth. HANDOFF-*.md files (including this one) describe history; the table describes current state.

---

## How to orient next session

Open a RevOps session and let the protocol run. It will:
1. Find the active Playbook row (Teknova AAV outreach, Status = active)
2. Find in-progress Play Steps (Phase D Step 2: Match)
3. Propose a session plan based on actual table state

Do not reconstruct state from markdown. The table has it.

---

## Immediate next actions

### 1. Manual Airtable UI tasks (9 items)

All 9 are in the Work base (`appz7I91uNxWBnly8`) Tasks table, Source = manual, Status = Open. Search for "Playbook" or "Play Steps" to find them. Summary:

- Add rollup: Current Phase on Playbook
- Add rollup: Current Step on Playbook
- Add lastModifiedTime field to Playbook
- Add lastModifiedTime field to Play Steps
- Build view: Active state (in-progress, grouped by Play)
- Build view: Next available (not-started)
- Build view: Awaiting Nick (needs-input, Awaiting From = Nick)
- Build view: Stalled (in-progress, Last Updated > 5 days ago -- requires lastModifiedTime first)
- Delete 3 empty Playbook stub rows (rec1i6EYkF9MUtF2R, rec253XRTaep3hZbU, rectDl55SjrdbLA0U)

### 2. Teknova AAV: complete Phase D Step 2 (Match)

Play Steps row: recNgmEiwkNtbg69t. Status = in-progress.

What's pending: the n8n Match workflow ran a 5-record test (execution 68784, passed). The full run with `returnAll: true` has not executed. Until it completes:
- Phase D Step 3 (Light Enrich, recAkDwwE5SXSiqUi) cannot start -- it depends on Step 2
- Phase D Step 4 Gate firmographic (rec7tVFXx4aF1bTUn) is blocked -- depends on Steps 2 and 3, plus Classification Rules table is empty

When Step 2 completes: update its Play Steps row (Status = done, What Happened, Completed At, Execution ID), then Step 3 becomes the next available step.

---

## Deferred to v2

- Auto write-back from n8n: when a step completes via automation, write Status, What Happened, Completed At, Execution ID to the Play Steps row. Currently manual.
- Session-start hook that auto-injects Play Steps state into the system prompt for client folders.
- Per-client CLAUDE.md for Teknova folder (same session-start protocol scoped to the Teknova AAV play).
