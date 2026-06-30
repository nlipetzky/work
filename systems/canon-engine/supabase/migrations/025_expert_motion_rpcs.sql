-- Migration: expert_motion_rpcs (motion_id FK + the motion engine RPCs)
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: expert-liaison-engine (Hermes)
-- Purpose:
--   The write + read contracts for the motion engine. All SECURITY DEFINER, service-role-locked,
--   same discipline as 006/007.
--     record_expert_request   -- sole inbound writer (idempotent on source_ref)
--     triage_expert_request   -- open-or-attach a motion (verdict/approval/learning) | dismiss (direction/onboarding)
--     advance_motion          -- SOLE writer of motion state; all lifecycle events
--     apply_motion_binding    -- on achieved: stamp the verdict emitted-for-consumption (outbox via status)
--     mark_motion_consumed    -- consumer flips emitted -> consumed after applying it to its own system
--     expert_binding_for_system / open_motion_blocking / v_motion_resolved_answers -- the SOP-steward / future-folder read seam
--   Patches send_review_packet + record_packet_answer (007) to call advance_motion in lockstep.
--   Single source of truth for a verdict stays expert_exchanges.metadata.verdict; line_items only POINT.

-- =====================================================================
-- motion_id on expert_exchanges (threads every ask/packet to its motion)
-- =====================================================================
alter table public.expert_exchanges
  add column if not exists motion_id uuid references public.expert_motions(id) on delete set null;
create index if not exists expert_exchanges_motion_idx on public.expert_exchanges (motion_id);

-- =====================================================================
-- record_expert_request: the ONE inbound write. Idempotent on (source_system, source_ref).
-- =====================================================================
create or replace function public.record_expert_request(
  p_request_type      text,
  p_engagement_type   text,
  p_engagement_id     text,
  p_expert_slug       text default null,
  p_concerning_system text default null,
  p_subject           text default null,
  p_body              text default null,
  p_payload           jsonb default '{}'::jsonb,
  p_source_system     text default null,
  p_source_ref        text default null,
  p_goal_key          text default null,
  p_target_type       text default 'human_expert',
  p_target_ref        text default null,
  p_created_by        text default null,
  p_session_id        text default null
)
returns public.expert_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.expert_requests;
begin
  insert into public.expert_requests (
    request_type, engagement_type, engagement_id, expert_slug, concerning_system,
    subject, body, payload, source_system, source_ref, goal_key,
    target_type, target_ref, created_by, session_id
  ) values (
    p_request_type, p_engagement_type, p_engagement_id, p_expert_slug, p_concerning_system,
    p_subject, p_body, coalesce(p_payload,'{}'::jsonb), p_source_system, p_source_ref, p_goal_key,
    coalesce(p_target_type,'human_expert'), coalesce(p_target_ref, p_expert_slug), p_created_by, p_session_id
  )
  on conflict (source_system, source_ref) where source_system is not null and source_ref is not null
  do update set payload = excluded.payload, body = excluded.body, subject = excluded.subject
  returning * into v_row;
  return v_row;
end;
$$;

-- =====================================================================
-- apply_motion_binding: on achieved, stamp the verdict emitted-for-consumption.
--   Cross-DB application (e.g. writing revops staging) is consumer-side via
--   expert_binding_for_system; this is the outbox stamp, not a cross-database write.
-- =====================================================================
create or replace function public.apply_motion_binding(p_motion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.expert_motions;
begin
  select * into v_row from public.expert_motions where id = p_motion_id;
  if v_row.id is null then raise exception 'motion % not found', p_motion_id; end if;
  if v_row.concerning_system is null then
    raise notice 'motion % has no concerning_system; nothing to bind', p_motion_id;
    return;
  end if;
  update public.expert_motions
    set bound_at = now(),
        meta = coalesce(meta,'{}'::jsonb) || jsonb_build_object('binding_status','emitted'),
        updated_at = now()
    where id = p_motion_id;
end;
$$;

-- =====================================================================
-- advance_motion: the SOLE writer of motion state. Events:
--   packet_sent | packet_answered | sweep_due | follow_up | escalate | resolve | park | abandon
-- =====================================================================
create or replace function public.advance_motion(
  p_motion_id uuid,
  p_event     text,
  p_payload   jsonb default '{}'::jsonb
)
returns public.expert_motions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row           public.expert_motions;
  v_new_predicate jsonb;
  v_total         int;
  v_satisfied     int;
  v_rejected      int;
  v_satisfaction  text;
  v_window        interval := coalesce(nullif(p_payload->>'response_window','')::interval, interval '3 days');
begin
  select * into v_row from public.expert_motions where id = p_motion_id for update;
  if v_row.id is null then raise exception 'motion % not found', p_motion_id; end if;

  if p_event = 'packet_sent' then
    update public.expert_motions set
      status           = case when status = 'open' then 'active' else status end,
      ball_in_court    = 'expert',
      next_action_due  = now() + v_window,
      next_action_kind = 'nudge',
      updated_at       = now()
    where id = p_motion_id returning * into v_row;

  elsif p_event = 'packet_answered' then
    -- refresh each line_item's state from the single source of truth: the exchange verdict
    select jsonb_build_object(
             'rule', coalesce(v_row.goal_predicate->>'rule','all'),
             'line_items', coalesce(jsonb_agg(elem2 order by ord), '[]'::jsonb)
           )
      into v_new_predicate
    from (
      select ord,
             elem || jsonb_build_object('state',
               case
                 when (elem->>'state') in ('superseded','withdrawn') then elem->>'state'
                 when ex.verdict = 'approved' then 'satisfied'
                 when ex.verdict in ('rejected_revise','flagged') then 'rejected_revise'
                 else coalesce(elem->>'state','open')
               end) as elem2
      from jsonb_array_elements(v_row.goal_predicate->'line_items') with ordinality as t(elem, ord)
      left join lateral (
        select e.metadata->>'verdict' as verdict
        from public.expert_exchanges e
        where e.id = nullif(elem->>'exchange_id','')::uuid
      ) ex on true
    ) s;

    select count(*) filter (where (e->>'state') not in ('superseded','withdrawn')),
           count(*) filter (where e->>'state' = 'satisfied'),
           count(*) filter (where e->>'state' = 'rejected_revise')
      into v_total, v_satisfied, v_rejected
    from jsonb_array_elements(v_new_predicate->'line_items') as e;

    if v_total > 0 and v_satisfied = v_total then v_satisfaction := 'full';
    elsif v_satisfied > 0 then v_satisfaction := 'partial';
    else v_satisfaction := 'none'; end if;

    if v_satisfaction = 'full' then
      update public.expert_motions set
        goal_predicate=v_new_predicate, satisfaction='full',
        status='achieved', resolution='goal_satisfied',
        ball_in_court='operator', next_action_due=null, next_action_kind=null, updated_at=now()
      where id=p_motion_id returning * into v_row;
      perform public.apply_motion_binding(p_motion_id);
      select * into v_row from public.expert_motions where id = p_motion_id;
    elsif v_rejected > 0 then
      update public.expert_motions set
        goal_predicate=v_new_predicate, satisfaction=v_satisfaction,
        status='active', ball_in_court='operator',
        next_action_kind='re_ask_revised', next_action_due=now(), updated_at=now()
      where id=p_motion_id returning * into v_row;
    elsif v_satisfaction = 'partial' then
      update public.expert_motions set
        goal_predicate=v_new_predicate, satisfaction='partial',
        status='active', ball_in_court='operator',
        next_action_kind='clarify', next_action_due=now(), updated_at=now()
      where id=p_motion_id returning * into v_row;
    else
      update public.expert_motions set
        goal_predicate=v_new_predicate, satisfaction='none',
        ball_in_court='expert', next_action_due=now()+v_window, next_action_kind='nudge', updated_at=now()
      where id=p_motion_id returning * into v_row;
    end if;

  elsif p_event = 'sweep_due' then
    update public.expert_motions set
      ball_in_court='operator',
      next_action_kind=coalesce(next_action_kind,'nudge'),
      updated_at=now()
    where id=p_motion_id returning * into v_row;

  elsif p_event = 'follow_up' then
    update public.expert_motions set
      status           = case when status in ('open','parked') then 'active' else status end,
      ball_in_court    = 'expert',
      next_action_due  = now() + v_window,
      next_action_kind = 'nudge',
      updated_at       = now()
    where id=p_motion_id returning * into v_row;

  elsif p_event = 'escalate' then
    update public.expert_motions set
      next_action_kind='review_for_abandon', next_action_due=now(), updated_at=now()
    where id=p_motion_id returning * into v_row;

  elsif p_event = 'resolve' then
    update public.expert_motions set
      status='achieved',
      resolution=coalesce(p_payload->>'resolution','goal_satisfied'),
      resolution_reason=p_payload->>'reason',
      satisfaction='full',
      ball_in_court='operator', next_action_due=null, next_action_kind=null, updated_at=now()
    where id=p_motion_id returning * into v_row;
    perform public.apply_motion_binding(p_motion_id);
    select * into v_row from public.expert_motions where id = p_motion_id;

  elsif p_event = 'park' then
    update public.expert_motions set
      status='parked', next_action_due=null, updated_at=now()
    where id=p_motion_id returning * into v_row;

  elsif p_event = 'abandon' then
    update public.expert_motions set
      status='abandoned', resolution='abandoned',
      resolution_reason=coalesce(p_payload->>'reason', resolution_reason),
      next_action_due=null, next_action_kind=null, updated_at=now()
    where id=p_motion_id returning * into v_row;

  else
    raise exception 'advance_motion: unknown event %', p_event;
  end if;

  return v_row;
end;
$$;

-- =====================================================================
-- triage_expert_request: open-or-attach a motion, or dismiss.
-- =====================================================================
create or replace function public.triage_expert_request(
  p_request_id        uuid,
  p_decision          text default 'open',           -- 'open' | 'attach' | 'dismiss'
  p_goal              text default null,
  p_goal_key          text default null,
  p_concerning_system text default null,
  p_goal_predicate    jsonb default null,
  p_bind_target       jsonb default null,
  p_attach_motion_id  uuid default null
)
returns public.expert_motions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req       public.expert_requests;
  v_motion    public.expert_motions;
  v_goal_key  text;
  v_predicate jsonb;
  v_existing  uuid;
  v_system    text;
begin
  select * into v_req from public.expert_requests where id = p_request_id for update;
  if v_req.id is null then raise exception 'request % not found', p_request_id; end if;

  if p_decision = 'dismiss' or v_req.request_type in ('direction','onboarding') then
    update public.expert_requests set status='dismissed' where id = p_request_id;
    return null;
  end if;

  if p_decision = 'attach' and p_attach_motion_id is not null then
    update public.expert_motions
      set opened_from_request_ids = array_append(opened_from_request_ids, v_req.id), updated_at=now()
      where id = p_attach_motion_id returning * into v_motion;
    update public.expert_requests set status='attached', motion_id=p_attach_motion_id where id=p_request_id;
    return v_motion;
  end if;

  v_goal_key := coalesce(p_goal_key, v_req.goal_key,
                         'md5:' || md5(coalesce(v_req.body, v_req.subject, v_req.id::text)));

  select id into v_existing from public.expert_motions
    where engagement_type = v_req.engagement_type
      and engagement_id   = v_req.engagement_id
      and goal_key        = v_goal_key
      and status in ('open','active','parked')
    limit 1;

  if v_existing is not null then
    update public.expert_motions
      set opened_from_request_ids = array_append(opened_from_request_ids, v_req.id), updated_at=now()
      where id = v_existing returning * into v_motion;
    update public.expert_requests set status='attached', motion_id=v_existing where id=p_request_id;
    return v_motion;
  end if;

  v_system := coalesce(p_concerning_system, v_req.concerning_system);
  v_predicate := coalesce(p_goal_predicate, jsonb_build_object(
    'rule','all',
    'line_items', jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid(), 'ask_label', coalesce(v_req.subject, v_req.request_type),
      'state','open', 'exchange_id', null))
  ));

  insert into public.expert_motions (
    target_type, target_ref, expert_slug, engagement_type, engagement_id, concerning_system,
    goal, goal_key, goal_predicate, status, ball_in_court,
    opened_from_request_ids, bind_target, created_by, session_id
  ) values (
    v_req.target_type, coalesce(v_req.target_ref, v_req.expert_slug), v_req.expert_slug,
    v_req.engagement_type, v_req.engagement_id, v_system,
    coalesce(p_goal, v_req.subject, v_req.request_type || ' — ' || v_req.engagement_id),
    v_goal_key, v_predicate, 'open', 'operator',
    array[v_req.id], coalesce(p_bind_target,
      case when v_system is not null then jsonb_build_object('system', v_system, 'kind','verdict') else null end),
    v_req.created_by, v_req.session_id
  ) returning * into v_motion;

  update public.expert_requests set status='triaged', motion_id=v_motion.id where id=p_request_id;
  return v_motion;
end;
$$;

-- =====================================================================
-- mark_motion_consumed: a downstream system flips emitted -> consumed after applying the verdict.
-- =====================================================================
create or replace function public.mark_motion_consumed(p_motion_id uuid, p_note text default null)
returns public.expert_motions
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.expert_motions;
begin
  update public.expert_motions
    set meta = coalesce(meta,'{}'::jsonb) || jsonb_build_object('binding_status','consumed','binding_note', p_note),
        updated_at = now()
    where id = p_motion_id returning * into v_row;
  return v_row;
end;
$$;

-- =====================================================================
-- Consume seam (SOP steward + future AI expert-folder reader)
-- =====================================================================
create or replace function public.expert_binding_for_system(p_system text)
returns table (
  motion_id       uuid,
  expert_slug     text,
  engagement_type text,
  engagement_id   text,
  goal            text,
  resolution      text,
  bound_at        timestamptz,
  binding_status  text,
  verdicts        jsonb
)
language sql
security definer
set search_path = public
as $$
  select m.id, m.expert_slug, m.engagement_type, m.engagement_id, m.goal, m.resolution, m.bound_at,
         coalesce(m.meta->>'binding_status','emitted'),
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'exchange_id', e.id, 'subject', e.subject,
             'verdict', e.metadata->>'verdict', 'response', e.response))
           from public.expert_exchanges e where e.motion_id = m.id
         ), '[]'::jsonb)
  from public.expert_motions m
  where m.concerning_system = p_system
    and m.status = 'achieved';
$$;

create or replace function public.open_motion_blocking(p_system text)
returns table (
  motion_id       uuid,
  expert_slug     text,
  goal            text,
  status          text,
  ball_in_court   text,
  next_action_due timestamptz
)
language sql
security definer
set search_path = public
as $$
  select m.id, m.expert_slug, m.goal, m.status, m.ball_in_court, m.next_action_due
  from public.expert_motions m
  where m.concerning_system = p_system
    and m.status in ('open','active','parked');
$$;

create or replace view public.v_motion_resolved_answers as
  select m.id as motion_id, m.expert_slug, m.engagement_type, m.engagement_id,
         m.concerning_system, m.goal, m.resolution, m.bound_at,
         e.id as exchange_id, e.subject, e.metadata->>'verdict' as verdict, e.response
  from public.expert_motions m
  join public.expert_exchanges e on e.motion_id = m.id
  where m.status = 'achieved';

-- =====================================================================
-- Patches to 007: advance the threaded motions in lockstep with the packet.
--   record_packet_answer also documents 'rejected_revise' as a valid member verdict
--   (the verdict column is freeform; the value drives line_item state in advance_motion).
-- =====================================================================
create or replace function public.send_review_packet(p_id uuid)
returns public.expert_review_packets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row    public.expert_review_packets;
  v_motion uuid;
begin
  update public.expert_review_packets
    set status='sent', sent_at=now(), updated_at=now()
    where id = p_id returning * into v_row;
  if v_row.id is null then raise exception 'review packet % not found', p_id; end if;

  update public.expert_exchanges
    set status='sent', sent_at=now(), updated_at=now()
    where id = any (v_row.member_exchange_ids) and status='drafted';

  for v_motion in
    select distinct motion_id from public.expert_exchanges
    where id = any (v_row.member_exchange_ids) and motion_id is not null
  loop
    perform public.advance_motion(v_motion, 'packet_sent', '{}'::jsonb);
  end loop;

  return v_row;
end;
$$;

create or replace function public.record_packet_answer(
  p_id              uuid,
  p_response        text default null,
  p_member_verdicts jsonb default '{}'::jsonb     -- { "<exchange_id>": "approved"|"flagged"|"rejected_revise", ... }
)
returns public.expert_review_packets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row     public.expert_review_packets;
  v_member  uuid;
  v_verdict text;
  v_motion  uuid;
begin
  update public.expert_review_packets
    set status='answered', answered_at=now(), response=coalesce(p_response, response), updated_at=now()
    where id = p_id returning * into v_row;
  if v_row.id is null then raise exception 'review packet % not found', p_id; end if;

  foreach v_member in array v_row.member_exchange_ids loop
    v_verdict := coalesce(p_member_verdicts->>(v_member::text), null);
    update public.expert_exchanges
      set status='answered', answered_at=now(), response=coalesce(p_response, response),
          metadata = case when v_verdict is null then metadata
                          else metadata || jsonb_build_object('verdict', v_verdict) end,
          updated_at=now()
      where id = v_member and status in ('sent','drafted');
  end loop;

  for v_motion in
    select distinct motion_id from public.expert_exchanges
    where id = any (v_row.member_exchange_ids) and motion_id is not null
  loop
    perform public.advance_motion(v_motion, 'packet_answered', '{}'::jsonb);
  end loop;

  return v_row;
end;
$$;

-- =====================================================================
-- Comments + lockdown (new functions default-grant EXECUTE to public; revoke it)
-- =====================================================================
comment on function public.record_expert_request(text,text,text,text,text,text,text,jsonb,text,text,text,text,text,text,text) is 'Sole inbound write for expert-liaison-engine: record a raw expert request. Idempotent on (source_system, source_ref). SECURITY DEFINER, service-role only.';
comment on function public.advance_motion(uuid,text,jsonb) is 'Sole writer of expert_motion state. Events: packet_sent|packet_answered|sweep_due|follow_up|escalate|resolve|park|abandon. SECURITY DEFINER, service-role only.';
comment on function public.triage_expert_request(uuid,text,text,text,text,jsonb,jsonb,uuid) is 'Open-or-attach a motion for a request (verdict/approval/learning) or dismiss (direction/onboarding). SECURITY DEFINER, service-role only.';
comment on function public.apply_motion_binding(uuid) is 'On achieved: stamp the resolved verdict emitted-for-consumption (outbox via meta.binding_status). Cross-system application is consumer-side. SECURITY DEFINER.';
comment on function public.expert_binding_for_system(text) is 'Consume seam: resolved expert verdicts for a system (SOP steward / downstream bind-back reader). SECURITY DEFINER, service-role only.';

revoke execute on function public.record_expert_request(text,text,text,text,text,text,text,jsonb,text,text,text,text,text,text,text) from public, anon, authenticated;
grant  execute on function public.record_expert_request(text,text,text,text,text,text,text,jsonb,text,text,text,text,text,text,text) to service_role;
revoke execute on function public.triage_expert_request(uuid,text,text,text,text,jsonb,jsonb,uuid) from public, anon, authenticated;
grant  execute on function public.triage_expert_request(uuid,text,text,text,text,jsonb,jsonb,uuid) to service_role;
revoke execute on function public.advance_motion(uuid,text,jsonb) from public, anon, authenticated;
grant  execute on function public.advance_motion(uuid,text,jsonb) to service_role;
revoke execute on function public.apply_motion_binding(uuid) from public, anon, authenticated;
grant  execute on function public.apply_motion_binding(uuid) to service_role;
revoke execute on function public.mark_motion_consumed(uuid,text) from public, anon, authenticated;
grant  execute on function public.mark_motion_consumed(uuid,text) to service_role;
revoke execute on function public.expert_binding_for_system(text) from public, anon, authenticated;
grant  execute on function public.expert_binding_for_system(text) to service_role;
revoke execute on function public.open_motion_blocking(text) from public, anon, authenticated;
grant  execute on function public.open_motion_blocking(text) to service_role;

revoke all on public.v_motion_resolved_answers from public, anon, authenticated;
grant  select on public.v_motion_resolved_answers to service_role;
