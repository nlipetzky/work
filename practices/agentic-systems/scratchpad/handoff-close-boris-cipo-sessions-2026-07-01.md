# Handoff: closing the Boris + CIPO sessions

From the Hermes / expert-liaison session that absorbed and completed the shared work stream (2026-07-01). Purpose: confirm what got finished here, and let you close + archive the **Boris (agentic-systems)** and **CIPO Venture** sessions without losing anything.

## TL;DR

- Everything both sessions were driving toward is **done and verified here**.
- Your **DB work is already durable** (applied to live canon) — safe regardless of git.
- The only real loss-risk is **uncommitted working-tree files**. Commit what you want kept before archiving.
- **Never `git clean -fdx`** on this tree — `.env` is gitignored and `-x` wipes it. And **do not commit `accounts/ventures/konstellation-cipo/exports/`** (PII CSVs).

## Verified live in canon (durable — NOT at git risk)

Project `mzzjvoiwughcnmmqzbxv`:
- `expert-liaison-engine` registered; migrations **024–027** applied.
- Boris's AI-expert-folder: `expert_folders` / `judgment_units` live; migrations **028–033** applied.
- `cold-outreach` registered; migration **034** applied.
- The CIPO **"Will signs off the CIPO Teardown cold copy (5 decisions)"** motion is **live and open** — 5 decision line-items, ball in operator's court, pending Will's real answer (nothing faked).

## Git baseline (committed + pushed = SAFE)

`origin/ai-expert-folder @ bd428d9` contains:
- `31d5a34` / `cd97f60` / `bd428d9` — Boris's AI-expert-folder (schema, `/folder`, FolderDefaults in `/operate`, the membrane seam).
- `0821b85` — the expert-liaison-engine (intake + motion system).
- `cf82582` — the `/operate` three-mode cockpit.

**Heads-up:** the working tree is currently checked out on **`konstellation-crm-ingest`** (local branch, HEAD = `bd428d9`, no upstream). Decide where the pending commits should land (the pushed home is `ai-expert-folder`).

---

## To the Boris session — you're clear to archive

Your AI-expert-folder is **committed + pushed** (`bd428d9`). This session composed the Expert Liaison embed as a **peer** to your `FolderDefaults`: a branch inside `SystemViewEmbed` (your `FolderDefaults.tsx` / `composition-draft.ts` were **not touched**). For an EL-owned activity, your folder-default ruling and the live human-expert motion now render side by side — the membrane in one view.

- **Still open (shared, not fixed here):** the canon/TS SOP-drift you flagged. This session **worked around** it (all EL reads are engagement-keyed, never keyed to canon `sop_activities`), it did not resolve it. The `/operate` preview-harness bounce to `/records` you saw persists — confirmed again here; verify `/operate` at the data layer.
- **Before closing:** your core folder work is safely in `bd428d9`. A few untracked `capabilities/**` and `practices/agentic-systems/reference/*` files exist in the tree — most predate this session, but if any are yours and unsaved, commit them first.

## To the CIPO Venture session — commit before archiving

Your outbound build is the **largest uncommitted body of work** on the tree, and this session built directly on it and finished the Will gate:

- Added a reusable **`wf-expert-signoff`** workflow to your SOP's existing `s13-route-flags` stage and **un-blocked `send-sequence`** (static-blocked → motion-driven). My edits sit **on top of your** `launch-outbound-for-venture.ts`, so that file now carries **both** your 16-stage rewrite and this workflow — commit it once, together.
- Your "gated on Will's sign-off" is now a **live 5-decision motion** on `/expert-liaison` + embedded in the `/operate` SOP view — the markdown brief is now tracked state.

**Your uncommitted files to commit (else at risk):**
- `systems/canon-engine/scripts/`: `find-contacts.mjs`, `verify-contacts.mjs`, `qualify-prospects.mjs`, `enrich-nih.mjs`, `gen-approval-surface.mjs`, `export-send-list.mjs` (new) + edits to `enrich-prospects.mjs`, `watch-signals.mjs`
- `systems/operating-sop/sops/launch-outbound-for-venture.ts` (your rewrite + this session's workflow — one file)
- `accounts/ventures/konstellation-cipo/artifacts/`: `copy-cipo-teardown-will-v1.md`, `hermes-brief-will-teardown-copy.md`, `email-draft-will-lead-magnet-decision-2026-06-30.md`
- `accounts/ventures/konstellation-cipo/CLAUDE.md` (edited)
- **EXCLUDE:** `accounts/ventures/konstellation-cipo/exports/` (PII CSVs — keep out of git).

## What THIS session added (commit these to keep them)

- **Migration:** `systems/canon-engine/supabase/migrations/034_register_cold_outreach.sql` (applied).
- **CIPO producer/consumer:** `systems/canon-engine/scripts/request-copy-signoff.mjs` (new), `apply-copy-approvals.mjs` (new), edit to `produce-sequence.mjs`.
- **/operate embed (projection-ui):** edits to `lib/operate/sop-types.ts`, `lib/queries/operatingSop.ts`, `components/operate/SystemViewEmbed.tsx`, `components/operate/ActivityDetail.tsx`, `components/operate/OperateCockpit.tsx`, `app/expert-liaison/ExpertLiaisonSurface.tsx`.
- **SOP workflow:** the `wf-expert-signoff` edits inside `launch-outbound-for-venture.ts` (shared with CIPO, above).
- **Docs:** `systems/expert-liaison-engine/HANDOFF-build-2026-06-30.md` (the engine build handoff).
- All type-clean (`tsc --noEmit` exit 0).

## Recommended safe close-out

1. **DB:** nothing to do — durable.
2. **Pick the branch** these commits land on (pushed home is `ai-expert-folder`; tree is on `konstellation-crm-ingest`).
3. **Commit in scoped groups**, e.g.: (a) CIPO outbound pipeline, (b) the expert-liaison SOP + embed + cold-outreach producer, (c) anything else you want kept. The SOP file goes in whichever group commits it — just once.
4. **Exclude** `exports/` (PII). **Never `git clean -fdx`** (`.env`).
5. Push, then archive the sessions.

## Everything intended was done

- Hermes inbox / persistent-motion engine: **built + verified** (revops producer proof + follow-up).
- Expert sign-off modeled as a reusable **SOP workflow**, attached to the outbound SOP: **done**.
- Expert Liaison **embedded in the `/operate` SOP view** (peer to FolderDefaults): **done**.
- CIPO copy sign-off as a **2nd producer + live motion** (Will pending): **done**.
- Boris's AI-expert-folder: **committed + pushed**; consumed by the cold-outreach producer through the membrane seam.

Nothing is lost as long as the uncommitted files above are committed before any tree reset.
