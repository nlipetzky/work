-- Migration: register cold-outreach in the system registry
-- Date: 2026-07-01
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: expert-liaison-engine build (Hermes/Boris)
-- Purpose:
--   The system whose output the expert stewards for the outbound-launch SOP: the cold copy + send.
--   Needed so expert_motions.concerning_system='cold-outreach' resolves for the copy-signoff loop
--   (apply_motion_binding no-ops on a null concerning_system; expert_binding_for_system filters by it).
--   Idempotent (NOT EXISTS guard).

insert into public.systems (
  id, system_slug, name, status, system_type, definition_maturity,
  owner, purpose, outputs, inputs, constellation, runs_surface, last_reconciled
)
select
  gen_random_uuid(),
  'cold-outreach',
  'Cold Outreach',
  'building',
  'platform',
  'forming',
  'Hermes (expert-liaison) + the outbound-launch SOP',
  'Owned cold outreach for a venture: the sourced copy (under the expert''s name) + the multi-channel send. The expert stewards the copy via the expert-liaison sign-off loop; this system is the concerning_system that copy-approval motions bind back to.',
  'An approved, expert-signed cold sequence sent on the expert''s channels (LinkedIn + email); replies routed to the follow-through.',
  'The qualified/enriched cohort (revops prospects), the locked offer, and the drafted copy + flag list.',
  'Signal',
  '/outreach',
  now()
where not exists (
  select 1 from public.systems where system_slug = 'cold-outreach'
);
