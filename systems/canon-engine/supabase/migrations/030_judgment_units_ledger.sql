-- Migration: judgment_units ledger + record/ratify RPCs
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: operating-sop / AI-expert-folder (Boris)
-- Purpose:
--   The ledger of accumulated operable judgment (the proposal/event stream). Every unit is born here
--   at standing='proposed', carries provenance (ai_originated|human_injected|human_corrected) and a
--   standing ladder (proposed -> active -> locked). A unit is one of three kinds:
--     recipe_edit -> binds to a library recipe (031); the recipe publish is a separate governed step
--     option      -> binds to a step; ratify flips the linked activity_options row (029)
--     ruling      -> the active judgment_units row IS the ruling (constraint/disqualifier/default/entity_rule)
--   Write path: record_judgment_unit (emit) + ratify_judgment_unit (sole apply path). Copies the
--   004_source_assessments / 015_discovery_recipes discipline (SECURITY DEFINER, service-role-locked).
--   The gate: push_to_veto auto-ratifies an ai_originated/human_injected unit to active on file
--   (the shrinking-human-input default); pull_to_approve leaves it proposed. motion_id is the pointer
--   into Hermes's membrane (024/025) for expert-boundary ratification; standing lives only here.

create extension if not exists pgcrypto;

create table public.judgment_units (
  id                   uuid primary key default gen_random_uuid(),
  folder_slug          text not null references public.expert_folders(folder_slug),
  kind                 text not null check (kind in ('recipe_edit','option','ruling')),
  ruling_kind          text check (ruling_kind in ('constraint','disqualifier','default','entity_rule')),
  -- binding target (exactly one shape per kind, enforced below)
  target_activity_id   text,                              -- loose ref to sop_activities.activity_id
  target_option_id     uuid references public.activity_options(id) on delete set null,
  target_recipe_id     text,                              -- loose ref to library_recipes.recipe_id (031)
  assertion            text not null,                     -- "PI = primary contact"
  trigger              jsonb not null default '{}'::jsonb,-- structured predicate when machine-evaluable
  reasoning            text,                              -- the why (mirrors source_assessments.reasoning)
  provenance           public.judgment_provenance not null,
  standing             public.judgment_standing not null default 'proposed',
  gate_posture         text not null default 'push_to_veto' check (gate_posture in ('push_to_veto','pull_to_approve')),
  proposed_by          text not null,
  ratified_by          text,
  ratified_at          timestamptz,
  supersedes_id        uuid references public.judgment_units(id) on delete set null,
  retired_at           timestamptz,                       -- set when a superseding unit activates
  motion_id            uuid references public.expert_motions(id) on delete set null,
  origin_session       text,
  origin_activity_run  uuid,
  applied_artifact_kind text,
  applied_artifact_id  text,
  metadata             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint judgment_units_binding_shape check (
       (kind = 'recipe_edit' and target_recipe_id   is not null and target_activity_id is null and target_option_id is null)
    or (kind = 'option'      and target_activity_id is not null and target_recipe_id   is null)
    or (kind = 'ruling'      and target_activity_id is not null and target_recipe_id   is null)
  ),
  constraint judgment_units_ruling_kind_scope check (ruling_kind is null or kind = 'ruling')
);

comment on table public.judgment_units is
  'Judgment-unit ledger: the proposal/event stream of accumulated operable judgment (recipe_edit|option|ruling). Provenance + standing (proposed->active->locked) gauge the shrinking-human-input curve. Written via record_judgment_unit; standing flipped only via ratify_judgment_unit. motion_id points into the expert-liaison membrane for expert-boundary ratification.';

create index judgment_units_folder_idx      on public.judgment_units (folder_slug, kind, standing);
create index judgment_units_activity_idx    on public.judgment_units (target_activity_id) where target_activity_id is not null;
create index judgment_units_active_idx       on public.judgment_units (folder_slug, standing) where retired_at is null;
create index judgment_units_motion_idx      on public.judgment_units (motion_id) where motion_id is not null;

create trigger judgment_units_set_updated_at
  before update on public.judgment_units
  for each row execute function public.fn_set_updated_at();

alter table public.judgment_units enable row level security;
create policy judgment_units_service_all
  on public.judgment_units for all to service_role using (true) with check (true);

-- ─── ratify: the SOLE standing-writer + apply-to-artifact path ───────────────
create or replace function public.ratify_judgment_unit(
  p_id          uuid,
  p_ratified_by text,
  p_to_standing public.judgment_standing default 'active'
)
returns public.judgment_units
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.judgment_units;
begin
  select * into v_row from public.judgment_units where id = p_id for update;
  if v_row.id is null then raise exception 'judgment_unit % not found', p_id; end if;

  update public.judgment_units
     set standing    = p_to_standing,
         ratified_by = p_ratified_by,
         ratified_at = now()
   where id = p_id
  returning * into v_row;

  -- apply to the artifact's current state
  if v_row.kind = 'option' and v_row.target_option_id is not null then
    update public.activity_options set standing = p_to_standing where id = v_row.target_option_id;
    update public.judgment_units
       set applied_artifact_kind = 'activity_options', applied_artifact_id = v_row.target_option_id::text
     where id = p_id returning * into v_row;
  elsif v_row.kind = 'ruling' then
    -- the active judgment_units row IS the ruling; stamp self-reference
    update public.judgment_units
       set applied_artifact_kind = 'judgment_units', applied_artifact_id = p_id::text
     where id = p_id returning * into v_row;
  elsif v_row.kind = 'recipe_edit' then
    -- recipe publish is a separate governed step (publish_recipe_version, 031); just record the target
    update public.judgment_units
       set applied_artifact_kind = 'library_recipes', applied_artifact_id = v_row.target_recipe_id
     where id = p_id returning * into v_row;
  end if;

  -- iteration: retire the unit this one supersedes
  if v_row.supersedes_id is not null and p_to_standing in ('active','locked') then
    update public.judgment_units set retired_at = now()
     where id = v_row.supersedes_id and retired_at is null;
  end if;

  return v_row;
end;
$$;

comment on function public.ratify_judgment_unit is
  'Sole standing-writer for a judgment_unit (proposed->active->locked) + the apply-to-artifact path (option flips activity_options; ruling is self; recipe_edit records the target for a separate publish). Retires the superseded unit. SECURITY DEFINER, service-role only.';

-- ─── record: the emit; push_to_veto auto-ratifies on file ────────────────────
create or replace function public.record_judgment_unit(
  p_folder_slug         text,
  p_kind                text,
  p_assertion           text,
  p_provenance          public.judgment_provenance,
  p_proposed_by         text,
  p_ruling_kind         text default null,
  p_target_activity_id  text default null,
  p_target_option_id    uuid default null,
  p_target_recipe_id    text default null,
  p_trigger             jsonb default '{}'::jsonb,
  p_reasoning           text default null,
  p_gate_posture        text default 'push_to_veto',
  p_supersedes_id       uuid default null,
  p_motion_id           uuid default null,
  p_origin_session      text default null,
  p_origin_activity_run uuid default null,
  p_metadata            jsonb default '{}'::jsonb
)
returns public.judgment_units
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.judgment_units;
begin
  insert into public.judgment_units (
    folder_slug, kind, ruling_kind, target_activity_id, target_option_id, target_recipe_id,
    assertion, trigger, reasoning, provenance, standing, gate_posture, proposed_by,
    supersedes_id, motion_id, origin_session, origin_activity_run, metadata
  ) values (
    p_folder_slug, p_kind, p_ruling_kind, p_target_activity_id, p_target_option_id, p_target_recipe_id,
    p_assertion, coalesce(p_trigger,'{}'::jsonb), p_reasoning, p_provenance, 'proposed',
    coalesce(p_gate_posture,'push_to_veto'), p_proposed_by,
    p_supersedes_id, p_motion_id, p_origin_session, p_origin_activity_run, coalesce(p_metadata,'{}'::jsonb)
  )
  returning * into v_row;

  -- the gate: push_to_veto auto-ratifies an AI/human-injected unit to active on file
  if coalesce(p_gate_posture,'push_to_veto') = 'push_to_veto'
     and p_provenance in ('ai_originated','human_injected') then
    v_row := public.ratify_judgment_unit(v_row.id, 'auto:push_to_veto', 'active');
  end if;

  return v_row;
end;
$$;

comment on function public.record_judgment_unit is
  'Sanctioned emit for a judgment_unit. Inserts at standing=proposed; under push_to_veto an ai_originated/human_injected unit auto-ratifies to active on file (the shrinking-human-input default). pull_to_approve leaves it proposed for expert/operator ratification. SECURITY DEFINER, service-role only.';

-- ─── lockdown (new functions default-grant EXECUTE to public; revoke it) ─────
revoke execute on function public.ratify_judgment_unit(uuid,text,public.judgment_standing) from public, anon, authenticated;
grant  execute on function public.ratify_judgment_unit(uuid,text,public.judgment_standing) to service_role;
revoke execute on function public.record_judgment_unit(text,text,text,public.judgment_provenance,text,text,text,uuid,text,jsonb,text,text,uuid,uuid,text,uuid,jsonb) from public, anon, authenticated;
grant  execute on function public.record_judgment_unit(text,text,text,public.judgment_provenance,text,text,text,uuid,text,jsonb,text,text,uuid,uuid,text,uuid,jsonb) to service_role;
