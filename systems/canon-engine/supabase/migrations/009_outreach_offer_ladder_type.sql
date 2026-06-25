-- Migration: register the outreach-offer-ladder artifact type + CIPO manifest row
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Phase 2 of the offer-first outreach build. The front-end cold offer + ascension ladder is a
--   governed canon artifact produced by the EXISTING govern-artifacts.mjs driver (no new driver).
--   Its standard is the Outreach Offer-Construction Doctrine
--   (practices/revops/reference/outreach-offer-doctrine.md), distilled from the Lead Gen Jay course.
--
--   Deterministic standard_rules use only the primitives checkRules() implements
--   (min_length / no_markers / cites_source). The richer doctrine gates (front-end != core,
--   ladder names the ascension, blue-ocean differentiation, the four offer-killers) are fuzzy and
--   live in standard_rubric for the LLM-judge tier.
--
--   This is the certified HINGE: copy (Phase 3) leads with the approved front-end offer. The
--   artifact itself is an INTERNAL strategic record (like offer-architecture-and-pricing), so it is
--   NOT gated on no-pricing / no-attorney here. Those faithfulness gates bind the PUBLIC copy
--   producer in Phase 3. required_expertise = {marketing,legal}: Nick (marketing) chooses the
--   front-end angle; Will (legal) certifies faithfulness. Idempotent.

insert into public.canon_artifact_types (artifact_type, layer, owner_agent, registry_no, done_when)
values (
  'outreach-offer-ladder',
  'revops',
  'revops',
  34,
  'An agent can state the chosen front-end cold offer, why it opens the door, and the explicit ladder up to the named core retainer.'
)
on conflict (artifact_type) do update
  set layer = excluded.layer,
      owner_agent = excluded.owner_agent,
      registry_no = excluded.registry_no,
      done_when = excluded.done_when;

insert into public.canon_artifact_manifest
  (engagement_type, engagement_id, artifact_type, required, standard_rules, standard_rubric, required_expertise)
values (
  'venture',
  'konstellation-cipo',
  'outreach-offer-ladder',
  true,
  '["min_length:500", "no_markers:TODO,gap,empty —", "cites_source"]'::jsonb,
  'Proposes 2-3 concrete front-end COLD offers (each clearly one of: loss-leader, trojan-horse, or reverse-lead-magnet) for Will/Nick to choose between. Each option must be DISTINCT from the core retainer (front-end != core), hyper-specific, high-desire, and a single deliverable, not the umbrella service. For each option it names the explicit ascension ladder to the named core offer (open door -> prove competence -> ascend to retainer). It avoids the four offer-killers: not boring, not commodity/competitive, no absurd guarantee without a stated mechanism, not complex. It targets a defensible blue ocean for medical-device / biotech IP work, not an abused red-ocean segment, and is consistent with the approved ICP and its hard exclusions. The whole thing aims at a raised hand ("I am a fit, tell me more"), not a cold close. It grounds every option in the approved core offer-architecture, the approved ICP, the mechanism-of-action, and the offer doctrine; it invents no positioning, credential, or expert POV. It commits NO public pricing figure (pricing is Will''s call) and makes no "attorney / lawyer / counsel" claim about Will in any prospect-facing phrasing.',
  '{marketing,legal}'
)
on conflict (engagement_type, engagement_id, artifact_type) do update
  set required = excluded.required,
      standard_rules = excluded.standard_rules,
      standard_rubric = excluded.standard_rubric,
      required_expertise = excluded.required_expertise;
