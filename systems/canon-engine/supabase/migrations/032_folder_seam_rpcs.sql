-- Migration: folder <-> membrane seam RPCs + folder read view
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: operating-sop / AI-expert-folder (Boris) — reconciles with expert-liaison-engine (Hermes, 024-027)
-- Purpose:
--   The consume-only seam between the AI-expert-folder and Hermes's membrane. NO change to any
--   Hermes-owned table: the folder owns judgment_unit standing; Hermes owns motion + verdict state.
--   route_unit_to_expert  -> outbound: emit via record_expert_request (target_type='ai_expert_folder',
--                            target_ref=folder_slug, source_ref=idempotent correlation) then open a motion
--                            via triage_expert_request; stamp judgment_units.motion_id + flip to pull_to_approve.
--   sync_unit_from_motion -> inbound: read expert_binding_for_system('ai-expert-folder') (only motions the
--                            folder tagged as concerning_system), match by motion_id, and on 'approved'
--                            ratify the unit + mark_motion_consumed (the outbox-consumer close). All intra-canon.
--   Folder units tag concerning_system='ai-expert-folder' so expert_binding_for_system finds them; per-folder
--   scoping is by judgment_units.folder_slug via the stamped motion_id.

-- ─── outbound: route a proposed unit to its domain expert for ratification ────
create or replace function public.route_unit_to_expert(
  p_unit_id         uuid,
  p_engagement_type text,
  p_engagement_id   text,
  p_expert_slug     text default null
)
returns public.expert_motions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit   public.judgment_units;
  v_req    public.expert_requests;
  v_motion public.expert_motions;
begin
  select * into v_unit from public.judgment_units where id = p_unit_id for update;
  if v_unit.id is null then raise exception 'judgment_unit % not found', p_unit_id; end if;

  v_req := public.record_expert_request(
    p_request_type      => 'verdict',
    p_engagement_type   => p_engagement_type,
    p_engagement_id     => p_engagement_id,
    p_expert_slug       => p_expert_slug,
    p_concerning_system => 'ai-expert-folder',
    p_subject           => left(v_unit.assertion, 200),
    p_body              => v_unit.assertion || coalesce(E'\n\nWhy: ' || v_unit.reasoning, ''),
    p_payload           => jsonb_build_object(
                             'unit_id', v_unit.id, 'folder_slug', v_unit.folder_slug,
                             'kind', v_unit.kind, 'target_activity_id', v_unit.target_activity_id),
    p_source_system     => 'ai-expert-folder',
    p_source_ref        => 'folder:' || v_unit.folder_slug || '/judgment_unit/' || v_unit.id,
    p_target_type       => 'ai_expert_folder',
    p_target_ref        => v_unit.folder_slug,
    p_created_by        => 'ai-expert-folder'
  );

  v_motion := public.triage_expert_request(
    p_request_id        => v_req.id,
    p_decision          => 'open',
    p_goal              => v_unit.assertion,
    p_concerning_system => 'ai-expert-folder'
  );

  update public.judgment_units
     set motion_id = v_motion.id, gate_posture = 'pull_to_approve'
   where id = p_unit_id;

  return v_motion;
end;
$$;

comment on function public.route_unit_to_expert is
  'Outbound seam: route a proposed judgment_unit to its domain expert for ratification via Hermes''s record_expert_request + triage_expert_request (target_type=ai_expert_folder). Stamps motion_id, flips to pull_to_approve. No write to a Hermes-owned table beyond the sanctioned RPCs. SECURITY DEFINER, service-role only.';

-- ─── inbound: consume resolved verdicts back into unit standing ──────────────
create or replace function public.sync_unit_from_motion(p_folder_slug text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_binding record;
  v_verdict text;
  v_unit    public.judgment_units;
  v_count   int := 0;
begin
  for v_binding in
    select * from public.expert_binding_for_system('ai-expert-folder')
    where binding_status = 'emitted'
  loop
    select * into v_unit from public.judgment_units
      where motion_id = v_binding.motion_id and folder_slug = p_folder_slug and standing = 'proposed'
      limit 1;
    if v_unit.id is null then continue; end if;

    select case
             when bool_or(x->>'verdict' = 'rejected_revise') then 'rejected_revise'
             when bool_or(x->>'verdict' = 'approved')        then 'approved'
             else coalesce(max(x->>'verdict'), 'flagged')
           end
      into v_verdict
    from jsonb_array_elements(v_binding.verdicts) as x;

    if v_verdict = 'approved' then
      perform public.ratify_judgment_unit(v_unit.id, 'expert:' || coalesce(v_binding.expert_slug,'unknown'), 'active');
      perform public.mark_motion_consumed(v_binding.motion_id, 'ai-expert-folder: unit ' || v_unit.id || ' ratified');
      v_count := v_count + 1;
    elsif v_verdict = 'rejected_revise' then
      -- leave proposed; Hermes already set the re-ask follow-up. Consume so we don't reprocess.
      perform public.mark_motion_consumed(v_binding.motion_id, 'ai-expert-folder: unit ' || v_unit.id || ' rejected_revise');
    else
      null; -- flagged: leave proposed + unconsumed for operator review
    end if;
  end loop;
  return v_count;
end;
$$;

comment on function public.sync_unit_from_motion is
  'Inbound seam (outbox-consumer): read expert_binding_for_system for folder-tagged motions; on approved, ratify the matching unit to active + mark_motion_consumed. Writes only judgment_units + the consume call. Intra-canon (no cross-DB). SECURITY DEFINER, service-role only.';

-- ─── folder read view ────────────────────────────────────────────────────────
create or replace view public.v_folder_active_units as
  select * from public.judgment_units where standing in ('active','locked') and retired_at is null;

revoke all on public.v_folder_active_units from public, anon, authenticated;
grant select on public.v_folder_active_units to service_role;

-- ─── lockdown ────────────────────────────────────────────────────────────────
revoke execute on function public.route_unit_to_expert(uuid,text,text,text) from public, anon, authenticated;
grant  execute on function public.route_unit_to_expert(uuid,text,text,text) to service_role;
revoke execute on function public.sync_unit_from_motion(text) from public, anon, authenticated;
grant  execute on function public.sync_unit_from_motion(text) to service_role;
