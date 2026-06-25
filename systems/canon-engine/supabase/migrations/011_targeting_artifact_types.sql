-- Migration: register the list-build targeting/enrichment artifact types + CIPO manifest rows
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   The INPUT side of the list-build system (signal-targeting): the fundamental artifacts that define
--   and drive a list build, produced by the EXISTING govern-artifacts.mjs machine, gated by the
--   Targeting & Enrichment Doctrine (practices/revops/reference/targeting-enrichment-doctrine.md), and
--   hinging on the approved marketing canon. Source-agnostic (no provider/column names); the
--   revops-engine compiles these into the actual build.
--
--   Four governed artifacts. NOTE: we do NOT reuse the existing `qualification-logic` type ... that one
--   means a qualifying *conversation* (sales discovery). The list gate is a distinct concept, so we
--   register `list-qualification`. Deterministic standard_rules use only the checkRules primitives;
--   the richer doctrine gates live in standard_rubric (the LLM judge). required_expertise = {marketing}
--   (Nick owns targeting; the SME sign-off lane handles domain truth where needed). Idempotent.

insert into public.canon_artifact_types (artifact_type, layer, owner_agent, registry_no, done_when) values
  ('segment-criteria',   'revops', 'revops', 35, 'An agent decides which accounts are in/out of the segment from named, observable signals (hard filters, soft signals, disqualifiers).'),
  ('icp-titles',         'revops', 'revops', 36, 'An agent decides which contacts at a qualified account to target, by function signal and persona tier.'),
  ('enrichment-spec',    'revops', 'revops', 37, 'An agent knows which data points to collect per account/contact and which are qualify-gates vs enrich-only.'),
  ('list-qualification', 'revops', 'revops', 38, 'An agent turns a sourced + enriched record into a qualified / edge / not-qualified verdict it can explain.')
on conflict (artifact_type) do update
  set layer = excluded.layer, owner_agent = excluded.owner_agent,
      registry_no = excluded.registry_no, done_when = excluded.done_when;

insert into public.canon_artifact_manifest
  (engagement_type, engagement_id, artifact_type, required, standard_rules, standard_rubric, required_expertise) values
  ('venture','konstellation-cipo','segment-criteria', true,
   '["min_length:500", "no_markers:TODO,empty —", "cites_source"]'::jsonb,
   'Account-level, source-agnostic targeting. Every criterion carries Type (firmographic/technographic/demographic/behavioral/relational/disqualifier) + Match (hard filter/soft signal/disqualifier) + Observability (a signal a person could verify without inside info ... NO vibes like "innovative companies" or "decision makers"). Hard filters are account-level and used sparingly (roughly 5-10, more returns an empty list); behavioral/relational criteria default to soft signals. Soft signals are weighted high/medium/low with discrimination. Disqualifiers are present, non-duplicative of hard filters, and remove what filters miss (current customers, active cycles, recent acquisitions, burned audiences, named-accounts-to-avoid). Consistent with the approved ICP and its hard exclusions; a defensible blue-ocean target, not an abused red-ocean list. Person-level titles are deferred to icp-titles, not here.',
   '{marketing}'),
  ('venture','konstellation-cipo','icp-titles', true,
   '["min_length:400", "no_markers:TODO,empty —", "cites_source"]'::jsonb,
   'Contact-level. Titles expressed as observable FUNCTION signals, not literal title text (so "VP Pipeline Strategy" is not excluded by a literal "Director of Demand Gen" filter). Personas are tiered: decision-maker / economic buyer vs influencer / champion vs disqualified-role, each with its function signal and the in/out reason. Reconciled to the approved ICP and any role-exclusion rules; where a seniority/function pattern is the rule, it cites evidence rather than guessing.',
   '{marketing}'),
  ('venture','konstellation-cipo','enrichment-spec', true,
   '["min_length:500", "no_markers:TODO,empty —", "cites_source"]'::jsonb,
   'Source-agnostic data points to collect per account and per contact, each tagged account/contact level AND qualify-gate vs enrich-only. Includes a verified-work-email reachability gate (an unreachable contact is not usable) and the named research/fit signals an AI judge uses to decide in-scope vs out-of-scope, each with the value that qualifies. Excludes personalization-snippet fields (email opener / ideal customers / past clients) ... those are the copy layer''s input, not enrichment. Nothing a provider could not actually observe.',
   '{marketing}'),
  ('venture','konstellation-cipo','list-qualification', true,
   '["min_length:400", "no_markers:TODO,empty —", "cites_source"]'::jsonb,
   'A deterministic, explainable verdict that turns a raw pull into a vetted cohort: pass all segment hard filters AND no disqualifier AND soft-score >= a named threshold -> qualified; near-miss within a named edge band -> edge (human review); else not-qualified. Composes the segment-criteria filters/disqualifiers + the enrichment-spec qualify-gates. States the company-first-then-contact order (account qualifies, then contacts are pulled and screened). Every verdict is explainable from named signals; no vibe gates.',
   '{marketing}')
on conflict (engagement_type, engagement_id, artifact_type) do update
  set required = excluded.required, standard_rules = excluded.standard_rules,
      standard_rubric = excluded.standard_rubric, required_expertise = excluded.required_expertise;
