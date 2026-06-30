-- Migration: register expert-liaison-engine in the system registry
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: expert-liaison-engine (Hermes)
-- Purpose:
--   Add the expert-liaison-engine row to public.systems so it shows honest state on /system.
--   status='building' until the end-to-end loop is verified. Idempotent (NOT EXISTS guard).

insert into public.systems (
  id, system_slug, name, status, system_type, definition_maturity,
  owner, purpose, outputs, inputs, constellation, runs_surface, last_reconciled
)
select
  gen_random_uuid(),
  'expert-liaison-engine',
  'Expert Liaison Engine',
  'building',
  'platform',
  'forming',
  'Hermes (expert-liaison) + Boris (agentic-systems)',
  'The intake + persistent motion engine for expert liaison: the membrane carrying the human''s frontier-push + supervision to a (maturing) expert, driving each ask to resolution and binding the verdict back to the asking system. Emit = record_expert_request; consume = expert_binding_for_system / open_motion_blocking.',
  'A resolved expert judgment bound back to the asking system — a closed expert_motion whose verdict is written to its concerning_system.',
  'Inbound expert requests from any producing agent/system (record_expert_request); expert replies captured via the review-packet machinery (007).',
  'Signal',
  '/expert-liaison',
  now()
where not exists (
  select 1 from public.systems where system_slug = 'expert-liaison-engine'
);
