---
name: file-judgment-unit
description: Use when a bound /operate session produces a new operable judgment (a new data source, a constraint/disqualifier/entity-rule, or a recipe change) that should accumulate into the domain AI-expert-folder rather than evaporate in chat. Files it as a judgment_unit.
status: DRAFT
---

# file-judgment-unit

## Purpose
A bound /operate session, mid-work, produces a judgment that is operable ... it changes how this activity runs, not just what happened for one account. Capture it into the domain's AI-expert-folder as a `judgment_unit` at `standing='proposed'`. The default gate posture (`push_to_veto`) auto-activates it so the operator keeps moving; the human vetoes later if wrong. A judgment that stays in chat evaporates. This skill makes it accumulate.

## The discriminator (ask first, every time)
**"Does this generalize beyond this engagement?"**
- YES ... it is a standing rule/source/recipe change for the activity's domain -> file a unit.
- NO ... it is true for THIS account only -> it is a **run-arg**, NOT a unit. Do not file it. Set it on the run, move on.

If you cannot tell, it is a run-arg. Under-filing is cheap; a folder full of engagement-specific noise is expensive.

## Decision tree: which `kind`
1. **recipe_edit** ... changes which steps exist, or their order/control-flow.
   - Escalate STRUCTURAL recipe changes to BUILD. This skill files the *unit* recording the judgment; it does not `publish_recipe_version`. Set `target_recipe_id`.
2. **option** ... a new **source** or **tactic** for an existing step (a provider to pull from, a search angle to try). Set `target_activity_id`; if it refines an existing option, set `target_option_id`.
3. **ruling** ... constrains, defaults, or qualifies a step or option. Pick `ruling_kind`:
   - `constraint` (must/must-not hold), `disqualifier` (excludes matches), `default` (the value absent an override), `entity_rule` (a fact about a specific entity that governs handling). Set `target_activity_id` (and `target_option_id` if it rules on one option).

One judgment = one unit. If the judgment is really two rules, file two.

## How to file (bound ENV)
The session is bound, so the Activity is pre-filled ... this is a 3-way call (folder + activity + assertion), not a lookup. Resolve:
- **folder_slug** ... from the SOP's domain (the `expert_folders` row whose `owning_system_slug` matches, or the domain the SOP declares). Do not invent a slug; if none resolves, emit `INSUFFICIENT_SOURCE`.
- **target_activity_id** ... `$ACTIVITY_ID` from the bound ENV.
- **provenance** ... be honest: `ai_originated` (the AI reasoned it), `human_injected` (the operator stated it this session), `human_corrected` (the operator overrode a prior AI call). Never label an operator's rule `ai_originated`.
- **origin_session** ... `$SPAWN_SESSION_ID`. **origin_activity_run** ... the run id if this fired inside one.

Call the canon RPC via the service-role client:

```text
record_judgment_unit(
  p_folder_slug      = <resolved folder>,
  p_kind             = recipe_edit | option | ruling,
  p_assertion        = <the rule, in operator language>,
  p_provenance       = ai_originated | human_injected | human_corrected,
  p_proposed_by      = <actor filing it>,
  p_ruling_kind      = constraint | disqualifier | default | entity_rule,   # rulings only
  p_target_activity_id = $ACTIVITY_ID,
  p_target_option_id   = <uuid, if refining an option>,
  p_target_recipe_id   = <recipe, for recipe_edit>,
  p_trigger          = <jsonb: when this applies>,
  p_reasoning        = <why, grounded in what happened this session>,
  p_gate_posture     = push_to_veto,          # default; omit to accept default
  p_origin_session   = $SPAWN_SESSION_ID,
  p_origin_activity_run = <run id, if any>
)
```

`push_to_veto` is the default: the unit lands `proposed` and auto-activates so work continues. The human retires it later via `retire_judgment_unit` (the veto path) if it was wrong. Use `pull_to_approve` only when the operator says this must not take effect until ratified.

## Anti-fabrication
Ground every value in something that actually happened this session. Consistent with govern-artifacts: if you cannot ground the assertion, trigger, or a required target, emit `INSUFFICIENT_SOURCE` naming the missing piece ... do NOT invent a folder_slug, activity id, trigger, or reasoning. A fabricated unit is worse than no unit; it becomes standing law the operator has to hunt down and veto.

## When it crosses the SME's domain truth
If the judgment asserts something only the domain expert can ratify (a claim about their field's truth, not just engine mechanics), file the unit AND note that it should route to the expert: `route_unit_to_expert(p_unit_id, p_engagement_type, p_engagement_id, p_expert_slug?)`. Boris does not decide expert-interaction; flag it for Hermes rather than deciding the channel here.

## Do NOT use for
- Something true for one account only (that is a run-arg, not a unit).
- Publishing a recipe version (BUILD + `publish_recipe_version`).
- Ratifying/locking a unit (`ratify_judgment_unit`) or vetoing one (`retire_judgment_unit`) ... this skill only *files* at `proposed`.
- Authoring the activity binding itself (use activity-binder in BUILD).
