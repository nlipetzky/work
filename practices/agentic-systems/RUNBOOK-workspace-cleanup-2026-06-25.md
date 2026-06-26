# Runbook: workspace cleanup (re-baselined to live state, 2026-06-25)

Supersedes the day-old "clean up the workspace" plan, whose git inventory was stale.
This is verified against current live state. Method is identical (gitignore junk,
snapshot everything, then delete freely); the specifics are corrected.

## Who runs this and where

Run from a FRESH session launched in the main checkout `/Users/nplmini/code/work`
(NOT inside any worktree, because a worktree cannot remove itself). Run it only AFTER
every worktree session is closed (the expert-liaison session, plus the four `claude/*`
worktree sessions). Closing the sessions is what lets their worktrees be removed.

Let `W=/Users/nplmini/code/work` in every command below.

## Live state this runbook assumes (re-verify in Pre-flight)

- Main checkout `$W` is on branch `expert-liaison-curation-ledger` with a large
  uncommitted pile (~130 entries, real work + junk + already-snapshotted copies).
- Four worktrees under `$W/practices/agentic-systems/.claude/worktrees/`:
  - `brave-beaver-741367`  -> branch `claude/brave-beaver-741367` @ 198a30a. HAS WORK
    (the system-building snapshot: methodology + /build console). Already committed.
  - `musing-mcnulty-52958b` -> branch `claude/musing-mcnulty-52958b`. CHECK for work.
  - `happy-engelbart-3b77c1` -> branch `claude/happy-engelbart-3b77c1`. (old plan said merged)
  - `nervous-jepsen-01692f` -> branch `claude/nervous-jepsen-01692f`. (old plan said merged)
- Branches also present: `main`, `rls-service-role-lockdown`, `revops-staging-pipeline`.

## Pre-flight (read-only, never skip; the inventory may have shifted)

    git -C $W worktree list
    git -C $W branch -vv
    git -C $W status --short | wc -l
    # uncommitted work in EACH worktree (do not skip any):
    for d in $W/practices/agentic-systems/.claude/worktrees/*/; do
      echo "== $d =="; git -C "$d" status --short | wc -l; git -C "$d" log --oneline -2
    done

Confirm: which worktrees have uncommitted work, and that all their sessions are closed.

## Phase 1 - Make nothing losable (non-destructive, do completely before any delete)

1. Fix `.gitignore` so regenerable junk is never committed and is always safe to delete.
   `node_modules` and `.next` are already ignored; ADD: `.turbo`, `dist`, `build`,
   `.next-preview`, `*.tsbuildinfo`, `node-compile-cache`. Then confirm junk is not staged:

       git -C $W status --short | grep -E 'node_modules|\.next|\.turbo' || echo "clean of junk"

2. Snapshot the ENTIRE main-checkout pile to a recovery branch. Nothing can be lost after this.

       git -C $W checkout -b snapshot/pre-cleanup-2026-06-25
       git -C $W add -A
       git -C $W commit -m "snapshot: full pre-cleanup working tree (recovery point)"

3. Snapshot any worktree that still has uncommitted work (from Pre-flight). `brave-beaver`
   is already committed (@198a30a). For any other worktree showing uncommitted changes:

       git -C <that-worktree> add -A
       git -C <that-worktree> commit -m "snapshot: <worktree> pre-cleanup"

After Phase 1, every real file lives in git history. Deletes are now reversible.

## Phase 2 - Make `main` the single source of truth

Decision A (yours): commit the WHOLE pile to main (recommended, loses nothing; junk is
already gitignored), or curate first. Recommended = whole pile.

    git -C $W checkout main
    git -C $W merge --no-ff snapshot/pre-cleanup-2026-06-25 -m "consolidate workspace into main"
    # main was almost certainly the ancestor, so expect a clean merge. Resolve if not.

Verify the system-building work reached main (it was in the pile):

    git -C $W ls-files | grep -E 'system-building-methodology|app/build/|lib/builds/|system_builds' | head

If those show up, `claude/brave-beaver-741367` is fully represented on main and is
redundant. If for any reason they do NOT, merge the branch explicitly before deleting it:

    git -C $W merge --no-ff claude/brave-beaver-741367 -m "merge system-building snapshot"

For the other branches, check merged status before deleting (Phase 3):

    git -C $W branch --merged main   # anything listed here is safe to delete
    # KEEP for separate review (do NOT delete this pass): revops-staging-pipeline,
    # rls-service-role-lockdown -- confirm their work is in main first.

## Phase 3 - Reclaim (destructive; ONLY after Phase 1 + 2)

1. Archive (do not bulk-delete) the old status files. Keeps history, cleans the tree:

       mkdir -p $W/archive
       git -C $W mv HANDOFF-*.md AUDIT-*.md archive/ 2>/dev/null
       # also the per-practice ones if desired:
       git -C $W mv practices/agentic-systems/HANDOFF-*.md archive/ 2>/dev/null
       git -C $W commit -m "archive old HANDOFF/AUDIT status files"

   Decision B (yours): archive (recommended) vs delete the clearly-dead ones. Default archive.

2. Remove the worktrees whose sessions are closed (this session, brave-beaver, removes LAST,
   after it is closed):

       git -C $W worktree remove $W/practices/agentic-systems/.claude/worktrees/happy-engelbart-3b77c1
       git -C $W worktree remove $W/practices/agentic-systems/.claude/worktrees/nervous-jepsen-01692f
       git -C $W worktree remove $W/practices/agentic-systems/.claude/worktrees/musing-mcnulty-52958b
       git -C $W worktree remove $W/practices/agentic-systems/.claude/worktrees/brave-beaver-741367
       git -C $W worktree prune
       # if 'remove' refuses due to changes, you already snapshotted in Phase 1: re-verify, then add --force

3. Delete branches that are merged into main (use lowercase -d so git refuses if NOT merged):

       git -C $W branch -d claude/brave-beaver-741367 claude/happy-engelbart-3b77c1 \
                          claude/nervous-jepsen-01692f claude/musing-mcnulty-52958b \
                          expert-liaison-curation-ledger
       # KEEP: revops-staging-pipeline, rls-service-role-lockdown (review separately)

4. Reclaim disk (junk only; safe because Phase 1 committed all real files, so nothing
   untracked-and-real remains). DRY RUN first, read it, then run for real:

       git -C $W clean -ndx        # DRY RUN: lists what would be deleted (expect node_modules, .next, caches)
       # review the list, then:
       git -C $W clean -fdx        # deletes ignored + untracked junk; reinstall deps on demand

## Phase 4 - One rule so this does not recur

One session = one worktree = one branch, cut from an up-to-date `main`, merged back when
done. Never hand-edit the shared `$W` checkout directly (that is what scattered this
session's work into the main checkout). Optional: create future worktrees at a sibling
path outside the repo (`~/code/work-trees/<name>`) so they never nest inside the tree.

## Verify (done when all true)

    git -C $W status --short            # clean
    git -C $W worktree list             # only $W remains
    git -C $W branch                    # only main + intentionally-kept branches
    git -C $W ls-files | grep system-building-methodology   # our work is tracked on main
    du -sh $W                           # meaningfully smaller

Keep the `snapshot/pre-cleanup-2026-06-25` branch as a recovery point until you are
satisfied, then delete it.

## What is NOT lost

- System source (canon-engine, projection-ui, the /build console): in main after Phase 2.
- Reference docs, methodology, specs, the system-building snapshot: in main after Phase 2.
- HANDOFF/AUDIT history: archived in Phase 3, not deleted.
- Worktree work: snapshotted in Phase 1, merged in Phase 2.
- Deleted outright only: regenerable junk (node_modules, .next, caches).
