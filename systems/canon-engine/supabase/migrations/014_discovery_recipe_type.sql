-- Migration: register the discovery-recipe artifact type + CIPO manifest row
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   The recipe object: the signal -> qualified-leads enrichment pipeline that synthesizes the four
--   list-build input artifacts into the executable shape of the build (doctrine §8). Governed by the
--   same machine (govern-artifacts), hinging on the four input artifacts + the doctrine (incl. §6 custom
--   authoritative sources). This is the worked example a future recipe-authoring agent will learn from,
--   and the unit the targeting flywheel runs. Deterministic standard_rules use only checkRules
--   primitives; the recipe standard lives in standard_rubric. required_expertise = {marketing}. Idempotent.

insert into public.canon_artifact_types (artifact_type, layer, owner_agent, registry_no, done_when)
values (
  'discovery-recipe', 'revops', 'revops', 39,
  'An agent can run the signal -> qualified-leads pipeline step by step, each step with a named source, keying method, and expected hit-rate.'
)
on conflict (artifact_type) do update
  set layer = excluded.layer, owner_agent = excluded.owner_agent,
      registry_no = excluded.registry_no, done_when = excluded.done_when;

insert into public.canon_artifact_manifest
  (engagement_type, engagement_id, artifact_type, required, standard_rules, standard_rubric, required_expertise)
values (
  'venture', 'konstellation-cipo', 'discovery-recipe', true,
  '["min_length:600", "no_markers:TODO,empty —", "cites_source"]'::jsonb,
  'A named, ordered, signal-driven pipeline (per doctrine §8): signal watch -> signal->company resolution -> company enrichment + segment screen -> contact discovery + verified-email gate -> qualify -> hand-off to outreach. It turns a LIVE signal into qualified leads in a database, designed to run continuously (a standing watch), not a one-shot pull. It starts from a CONCRETE signal (not "find good companies") ... e.g. USPTO PatentsView filings in the tech classes, per §6. Every step names its source/tool (a commercial provider OR a §6 custom authoritative source), the keying method (how the prior step''s output becomes this step''s input, e.g. patent assignee -> company-name normalization), and the expected hit-rate / cost, so the funnel is sized honestly. Every step is buildable per §7 (no unsourced step). It synthesizes the four input artifacts (segment-criteria, icp-titles, enrichment-spec, list-qualification) and is consistent with them. It defines the output contract (what a qualified-lead row contains). It invents no providers or capabilities not in the doctrine or the deepline craft docs.',
  '{marketing}'
)
on conflict (engagement_type, engagement_id, artifact_type) do update
  set required = excluded.required, standard_rules = excluded.standard_rules,
      standard_rubric = excluded.standard_rubric, required_expertise = excluded.required_expertise;
