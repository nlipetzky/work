# Runbook: expert-liaison-engine

How to operate the engine, wire a new producer to it, and verify the loop.

## Operate (the surface)

projection-ui `/expert-liaison`. Two new lanes feed the existing exchange/packet machinery:

- **Inbound** — open `expert_requests`. Triage each: **Open motion** (verdict/approval/learning), **Attach** to an existing open motion, or **Dismiss** (direction/onboarding never open a motion).
- **Motions** — open + active `expert_motions`, grouped by expert, sorted by `next_action_due`, overdue flagged. Per motion: **Compose** (drafts an `expert_exchange` → appears in the existing Asks/Packets tabs), **Follow up**, **Resolve**, **Escalate**. Package + send happen in the existing Packets tab; sending and answering advance the motion automatically.

The expert never touches this. They only ever see the composed packet in their own channel.

## Wire a new producer (the emit contract)

Any system that needs an expert ruling calls ONE RPC and stops — never writes the expert tables directly:

```
record_expert_request(
  p_request_type,      -- 'verdict' | 'approval' | 'direction' | 'learning' | 'onboarding'
  p_engagement_type,   -- 'venture' | 'client' | 'practice'
  p_engagement_id,     -- e.g. 'teknova'
  p_expert_slug,       -- e.g. 'ellie'  (becomes target_ref for the human case)
  p_concerning_system, -- the system whose output the expert stewards = the bind-back target
  p_subject, p_body, p_payload,
  p_source_system, p_source_ref,   -- idempotency: re-emitting the same source_ref updates, never duplicates
  p_goal_key,          -- deterministic dedup key; multiple requests with the same key attach to one motion
  ...)
```

Reference producer: `systems/revops-engine/lib/canon-emit.mjs` + the `status="review"` branch in `systems/revops-engine/route-runner.mjs`. canon is a separate Supabase project, so producers reach it via the Management-API SQL endpoint (admin token) or a service-role client. Put the staging coordinates the bind-back needs into `p_payload`.

## Consume / bind-back

When a motion resolves, the verdict is stamped emitted-for-consumption on the motion (`meta.binding_status='emitted'`). The asking system reads it and applies it to its own data — canon does not cross-write into another project's DB.

- `expert_binding_for_system(p_system)` → resolved motions + their exchange verdicts for that system.
- `open_motion_blocking(p_system)` → still-open motions blocking that system (for the SOP steward).
- After applying, call `mark_motion_consumed(motion_id, note)` (flips to `consumed`, so it applies exactly once).
- `v_motion_resolved_answers` → the flat per-exchange view (future AI-expert-folder reader).

Reference consumer: `systems/revops-engine/apply-expert-verdicts.mjs` (an `approved` verdict flips the flagged staging rows `review → matched`, which unblocks `promote_staging_batch`).

## Follow-up persistence

A motion is not done when sent. `advance_motion` sets `ball_in_court` + `next_action_due`; an overdue active motion surfaces as a ranked next action in the daily protocol, and the hourly Inngest cron `expert-motion-follow-up-sweep` calls `advance_motion(id,'sweep_due')` autonomously.

## Verify the loop (end-to-end)

1. Seed a `review` row in a revops `staging.contacts_<batch>` table.
2. Emit: run the route stage (or `record_expert_request`) with `payload.batch_id/company_name/observed_domain`.
3. Triage in Inbound → Open motion; Compose; Package + Send (existing Packets tab).
4. Record the expert's reply with a per-member verdict `approved` → motion goes `achieved` + `binding_status='emitted'`.
5. `node systems/revops-engine/apply-expert-verdicts.mjs` → staging row flips `review → matched`; motion `binding_status='consumed'`.
6. Re-run `promote_staging_batch` → the previously-blocked contact promotes to Core.

(Validated 2026-06-30 with a throwaway `staging.contacts_eltest1` row; cleaned up after.)

## Schema / migrations

canon-engine `mzzjvoiwughcnmmqzbxv`, migrations `024`–`027`:
- `024` — `expert_motions` + `expert_requests` tables
- `025` — `motion_id` FK on `expert_exchanges`; `record_expert_request`, `triage_expert_request`, `advance_motion` (sole motion-state writer), `apply_motion_binding`, `mark_motion_consumed`, consume seam; patches `send_review_packet` + `record_packet_answer` to advance motions in lockstep (verdict vocab adds `rejected_revise`)
- `026` — `compose_motion_exchange`
- `027` — registers the system in `public.systems`

Verdicts live in exactly one place: `expert_exchanges.metadata.verdict`. A motion's `goal_predicate.line_items[]` only *point* at the exchange that resolves them.
