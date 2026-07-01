# Handoff → Boris: expert-liaison-engine build (2026-06-30)

Boris, this is the build handoff for a new shared-infra system, `expert-liaison-engine`. Built + verified end-to-end on live data this session. Status `building` in canon. Nothing pushed (local branch `expert-liaison-engine`, commit `0821b85`).

## What it is (one paragraph)

The intake + persistence front-half of the expert-liaison loop. The outbound half (`expert_exchanges` → `expert_review_packets`) already existed; what was missing was (1) a governed way for any agent/system to hand off "the expert needs to weigh in," and (2) persistence — a sent message isn't done; something has to pursue the expert until the answer comes back. This system adds `expert_requests` (intake) and `expert_motions` (a persistent, goal-owning thread that drives follow-up until resolved or abandoned), feeds the existing exchange→packet machinery, and binds the resolved verdict back to the system that asked. Operated by the Hermes practice (same practice↔system split as `revops`↔`revops-engine`).

## The membrane framing (why it's not a queue)

Per the locked stewardship model in `scratchpad/handoff-2026-06-30.md`: SOP = function(expertise, account); the SOP steward composes expertise; expertise accumulates into a living AI expert-folder; the human migrates to optimizer. This engine is the **membrane** carrying the human's shrinking frontier-push + supervision signal to a *maturing* AI expert. v1 routes to a human channel, but the contracts anticipate the folder: `target_type`/`target_ref` flip `human_expert`→`ai_expert_folder` with zero schema change, and the steward reads bindings via `expert_binding_for_system` / `open_motion_blocking`. The AI-expert-folder itself is deliberately NOT built — only the seam.

## Architecture decisions (the ones worth knowing)

- **Four objects.** `expert_requests` (raw intake atom) → triaged into `expert_motions` (the persistent goal spine) → `expert_exchanges` (projected ask, +`motion_id` FK) batched into `expert_review_packets` (existing, M:N to motions).
- **Single source of truth for a verdict.** It lives only on `expert_exchanges.metadata.verdict`. A motion's `goal_predicate.line_items[]` each *point* at the exchange that resolves them; verdicts are never copied. `advance_motion` derives line-item state by reading the pointed-at exchange.
- **`advance_motion` is the sole writer of motion state** (events: `packet_sent | packet_answered | sweep_due | follow_up | escalate | resolve | park | abandon`). `send_review_packet` + `record_packet_answer` were patched to call it in lockstep. Verdict vocab gained `rejected_revise` (was binary `approved|flagged`; the column is freeform, so no constraint change — the value just drives line-item state).
- **Bind-back is outbox-via-status, not a cross-DB write.** canon (`mzzjvoiwughcnmmqzbxv`) and revops (`mrmnyscurmkfppicqqhk`) are separate Postgres projects, so `apply_motion_binding` can't cross-write. On `achieved` it stamps `meta.binding_status='emitted'`; the asking system reads `expert_binding_for_system`, applies the verdict to its own data, then calls `mark_motion_consumed`. This outbox-consumer pattern *is* the SOP-steward read seam — it generalizes.
- **Migrations append to the canon chain.** One Postgres = one migration chain, so 024–027 live in `systems/canon-engine/supabase/migrations/` (not split into the system folder) but are logically owned + documented here. Numbering is 3-digit `NNN_`; `022` is a genuine gap in the existing chain.
- **`compose_motion_exchange` (026)** is the compose primitive: creates a drafted exchange linked to the motion AND wires it to a line-item, so the eventual answer resolves the predicate. Added during the build (the plan had 024–026; registration moved to 027).

## Current state

- All four phases done. Verified live: the full motion state machine (request→triage→compose→send→answer→`achieved/full/goal_satisfied`), AND the cross-DB producer→consumer loop (a revops `review` row → motion → resolved → `apply-expert-verdicts.mjs` flips it `review→matched`, unblocking `promote_staging_batch`). Test rows cleaned up; tables are empty.
- Surface renders clean (caught + fixed a `server-only` 500 that `tsc` couldn't see — see the shared-types extraction below).
- `tsc --noEmit` on projection-ui: exit 0.
- Registered in `canon.systems` (`system_slug='expert-liaison-engine'`, status `building`, surface `/expert-liaison`).

## Paths

**System folder** — `/Users/nplmini/code/work/systems/expert-liaison-engine/`
- `CLAUDE.md`, `SYSTEM.md` — operator context + contract
- `runbooks/RUNBOOK.md` — operate flow, the reusable producer-integration recipe, the verify story
- `workflows/index.ts` — Inngest barrel (`expertLiaisonEngineFunctions`)
- `workflows/motion-follow-up-sweep.ts` — hourly cron, calls `advance_motion(id,'sweep_due')`

**Migrations** — `/Users/nplmini/code/work/systems/canon-engine/supabase/migrations/`
- `024_expert_motion_intake.sql` — `expert_motions` + `expert_requests` tables
- `025_expert_motion_rpcs.sql` — `motion_id` FK + all RPCs + the `send_review_packet`/`record_packet_answer` patches + consume seam
- `026_compose_motion_exchange.sql` — the compose primitive
- `027_register_expert_liaison_engine.sql` — the `canon.systems` row

**Surface** — `/Users/nplmini/code/work/systems/projection-ui/`
- `app/expert-liaison/page.tsx` (M) — server fetch
- `app/expert-liaison/ExpertLiaisonSurface.tsx` (M) — added Inbound + Motions tabs
- `app/expert-liaison/InboundLane.tsx` (new) — open requests + triage actions
- `app/expert-liaison/MotionsBoard.tsx` (new) — motions grouped by expert, ball-in-court, actions
- `app/api/expert-liaison/request/route.ts` (new) — record / open_motion / attach / dismiss
- `app/api/expert-liaison/motion/route.ts` (new) — compose / advance / resolve / escalate
- `lib/queries/expertLiaison.ts` (M, server-only) — data fetchers
- `lib/queries/expertLiaison-shared.ts` (new) — client-safe types + `matchExpert`; server module re-exports it. **This split is load-bearing**: a client component value-importing from a `server-only` module 500s the route and `tsc` won't catch it (the known server-only gotcha).
- `lib/queries/ranking.ts` (M) — folds `dueMotions()` into the daily-protocol next-action ranking
- `app/api/inngest/route.ts` (M) — unions `...expertLiaisonEngineFunctions`

**Producer + consumer** — `/Users/nplmini/code/work/systems/revops-engine/`
- `route-runner.mjs` (M) — the `status="review"` branch emits a verdict request per review group
- `lib/canon-emit.mjs` (new) — emit to canon via the Management-API SQL endpoint
- `apply-expert-verdicts.mjs` (new) — consumes `expert_binding_for_system('revops-engine')`, flips staging rows, marks consumed

**Practice** — `/Users/nplmini/code/work/practices/expert-liaison/CLAUDE.md` (M) — now points to its engine.

**Off-repo** — plan at `~/.claude/plans/yes-it-s-a-shared-infra-inherited-catmull.md`; memory `project_expert_liaison_engine`.

## RPC reference (canon `mzzjvoiwughcnmmqzbxv`, all SECURITY DEFINER, service-role-locked)

`record_expert_request` (emit) · `triage_expert_request` (open/attach/dismiss) · `advance_motion` (sole state writer) · `compose_motion_exchange` · `apply_motion_binding` · `mark_motion_consumed` · `expert_binding_for_system` · `open_motion_blocking` · view `v_motion_resolved_answers`.

## Loose ends / next moves

- **Inngest cron not watched fire.** Wired + type-clean, but live firing needs the Inngest deployment active — confirm out-of-band.
- **Not pushed.** Branch `expert-liaison-engine` (`0821b85`), scoped to this task's files; the broader uncommitted working tree was left untouched. No PR yet.
- **AI-expert-folder is the next real frontier.** The seam is in (target abstraction + consume contracts + `learning` request type + `v_motion_resolved_answers` as the future folder's reader). When its shape is decided, the folder reads the consume seam and `target_type` flips — no schema migration on this engine.
- **More producers.** The revops route-review path is the only wired producer. Any system with an expert steward emits via `record_expert_request` (recipe in the RUNBOOK). Natural next: the konstellation/Will approval path.
- **Surface depth.** v1 Motions board is functional; richer line-item editing / partial-satisfaction affordances are the obvious iteration.
