# Atlas handoff — CIPO outbound + session close-out (2026-07-01)

From the Boris / CIPO session. Six items are in your inbox (`canon.capture_items`, status=open, created_by=`boris`, session `c4d7902b-58fd-4283-b8ca-e1fc1bff130a`). This doc is the detail they reference. Triage + drive; the urgent one is the git commit (loss-risk).

## Context in one paragraph
A CIPO outbound pipeline was built end-to-end this session (295 big-pharma rows → 113 qualified, enriched, personalized companies / 190 reachable contacts → locked Teardown offer → sourced copy v1 → one approval surface). A parallel Hermes session built `expert-liaison-engine` and absorbed the shared stream: the CIPO "Will signs off (5 decisions)" gate is now a **live motion** on `/expert-liaison`, embedded in `/operate`. DB is durable (canon migrations 024–034 applied). **The only loss-risk is the uncommitted working tree.**

## The remaining-work register (→ inbox items)
| # | Item | Owner | Priority |
|---|---|---|---|
| 1 | Commit + branch-reconcile the uncommitted tree (this runbook ↓) | agentic-systems | **urgent** |
| 2 | Get Will's real answers to the 5-decision copy motion → consumer applies → copy v1.1 + surface regen | expert-liaison (Hermes) | high |
| 3 | Send the CIPO outbound (LinkedIn HeyReach + email) — gated on #2 reaching `achieved` | agentic-systems | high (blocked) |
| 4 | Confirm the Inngest `motion-follow-up-sweep` cron is actually firing | agentic-systems | med |
| 5 | Shared open: canon/TS SOP-drift + `/operate`→`/records` preview bounce | agentic-systems | med |
| 6 | Backlog polish: qualify tier recalibration (Arsenal over-assigns on SBIR $); deprecate the superseded prose SOP (`sop-launch-outreach.md`) | agentic-systems | low |

---

## GIT CLEANUP RUNBOOK (item #1 — the loss-risk)

### State
- Tree on branch **`konstellation-crm-ingest`** (local, no upstream, HEAD = `bd428d9`).
- Pushed home is **`ai-expert-folder`** (`origin/ai-expert-folder @ bd428d9` already contains the AI-expert-folder + expert-liaison-engine + /operate cockpit commits).
- ~64 uncommitted files. DB is durable — NOT at git risk.

### HARD SAFETY RULES
- **NEVER `git clean -fdx`** on this tree — `.env` is gitignored and `-x` deletes it (unrecoverable).
- **Do NOT commit `accounts/ventures/konstellation-cipo/exports/`** — PII CSVs. (Already gitignored; `git add exports/` adds only the `.gitignore` guard, which is fine.)
- Do NOT `git add -A` blind — it will sweep stray/other-workstream files. Add by path.

### Branch decision (Nick's call; recommendation)
Commit **on the current branch** (`konstellation-crm-ingest`) — switching branches with this many dirty files is how work gets lost — then merge/push to `ai-expert-folder`. (Alternative: `git switch ai-expert-folder` first, but riskier now.)

### Group A — CIPO outbound pipeline (verified present in `git status`)
```
git add \
  systems/canon-engine/scripts/find-contacts.mjs \
  systems/canon-engine/scripts/verify-contacts.mjs \
  systems/canon-engine/scripts/qualify-prospects.mjs \
  systems/canon-engine/scripts/enrich-nih.mjs \
  systems/canon-engine/scripts/gen-approval-surface.mjs \
  systems/canon-engine/scripts/export-send-list.mjs \
  systems/canon-engine/scripts/enrich-prospects.mjs \
  systems/canon-engine/scripts/watch-signals.mjs \
  systems/operating-sop/sops/launch-outbound-for-venture.ts \
  accounts/ventures/konstellation-cipo/artifacts/copy-cipo-teardown-will-v1.md \
  accounts/ventures/konstellation-cipo/artifacts/hermes-brief-will-teardown-copy.md \
  accounts/ventures/konstellation-cipo/artifacts/email-draft-will-lead-magnet-decision-2026-06-30.md \
  accounts/ventures/konstellation-cipo/CLAUDE.md \
  accounts/ventures/konstellation-cipo/exports/.gitignore
git commit -m "cipo: signal-driven outbound pipeline (NIH source → resolve → contacts+PI → verify → personalize → qualify → export → approval surface) + SOP rewrite to the validated 16-stage path"
```
Note: `launch-outbound-for-venture.ts` carries BOTH the SOP rewrite and the Hermes session's `wf-expert-signoff` — commit it once, here.

### Group B — expert-liaison completion (confirm each with `git status` first)
Per the expert-liaison handoff (`systems/expert-liaison-engine/HANDOFF-build-2026-06-30.md`):
```
git add \
  systems/canon-engine/scripts/request-copy-signoff.mjs \
  systems/canon-engine/scripts/apply-copy-approvals.mjs \
  systems/canon-engine/scripts/produce-sequence.mjs \
  systems/canon-engine/supabase/migrations/034_register_cold_outreach.sql \
  systems/projection-ui/lib/operate/sop-types.ts \
  systems/projection-ui/lib/queries/operatingSop.ts \
  systems/projection-ui/components/operate/SystemViewEmbed.tsx \
  systems/projection-ui/components/operate/ActivityDetail.tsx \
  systems/projection-ui/components/operate/OperateCockpit.tsx \
  systems/projection-ui/app/expert-liaison/ExpertLiaisonSurface.tsx
git commit -m "expert-liaison: cold-outreach copy-signoff producer/consumer + /operate SOP embed + migration 034"
```
(The expert-liaison-engine system + migrations 024–027 + AI-expert-folder are already committed+pushed in `bd428d9` — do not re-add.)

### LEAVE OUT (other workstream / unverified — do NOT commit without Nick's OK)
- `systems/canon-engine/scripts/run-ingest.mjs` (the `konstellation-crm-ingest` workstream, likely mid-flight).
- Any untracked `capabilities/**` or `practices/agentic-systems/reference/*` — most predate this session; confirm ownership before adding.

### Finish
```
git push -u origin konstellation-crm-ingest   # or merge into ai-expert-folder, then push
```
Then the Boris + CIPO sessions are safe to archive.

---

## Item detail (for triage)

- **#2 Will motion** — live 5-decision motion on `/expert-liaison` (FDA-claim verify, founder-peer frame, TABA placement, target segment, copy-approval mechanism). Content is `artifacts/hermes-brief-will-teardown-copy.md`. On Will's answers, `apply-copy-approvals.mjs` binds verdicts back → drives copy `v1`→`v1.1` (add the FDA line if verified) → regenerate `gen-approval-surface.mjs`. Highest-leverage decision: verify the FDA-first-AI-device claim.
- **#3 Send** — blocked until #2 `achieved`. Then load HeyReach (Will's account) + email sequencer (warmed burner domains) → multi-channel to the 190. Copy artifact + `export-send-list.mjs` output are the inputs.
- **#4 Inngest sweep** — `expert-liaison-engine/workflows/motion-follow-up-sweep.ts` (hourly `advance_motion(id,'sweep_due')`). Wired + type-clean but live firing unconfirmed; without it motions won't auto-pursue Will.
- **#5 Shared open** — canon `sop_activities` vs the TS SOP definition drift (EL reads work around it, engagement-keyed); the `/operate` preview-harness bounce to `/records`. Both flagged in the two prior handoffs.
- **#6 Backlog** — qualify tier over-assigns Arsenal on SBIR $ (re-tier on real stage signals or pull Apollo/Crunchbase funding); prose `accounts/ventures/konstellation-cipo/artifacts/sop-launch-outreach.md` is superseded by the typed canonical SOP (deprecate/point).
