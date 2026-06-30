-- Migration: compose_motion_exchange (the motion -> exchange compose primitive)
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: expert-liaison-engine (Hermes)
-- Purpose:
--   The "Compose" action on the Motions board. Creates a drafted expert_exchange (006) carrying
--   this motion's ask, threaded by motion_id, and links it to a goal_predicate line_item (the
--   named one, else the first open/unlinked one) so the eventual verdict resolves that line item.
--   The operator then Packages + Sends via the existing review-packet machinery (007), which
--   advances the motion in lockstep. SECURITY DEFINER, service-role-locked.

create or replace function public.compose_motion_exchange(
  p_motion_id    uuid,
  p_subject      text default null,
  p_body         text default null,
  p_line_item_id text default null,
  p_channel      text default 'email'
)
returns public.expert_exchanges
language plpgsql
security definer
set search_path = public
as $$
declare
  v_motion public.expert_motions;
  v_ex     public.expert_exchanges;
  v_li_id  text;
  v_idx    int;
begin
  select * into v_motion from public.expert_motions where id = p_motion_id for update;
  if v_motion.id is null then raise exception 'motion % not found', p_motion_id; end if;

  insert into public.expert_exchanges (
    expert_slug, engagement_type, engagement_id, channel, subject, body, status, motion_id
  ) values (
    v_motion.expert_slug, v_motion.engagement_type, v_motion.engagement_id, coalesce(p_channel,'email'),
    coalesce(p_subject, v_motion.goal), p_body, 'drafted', p_motion_id
  ) returning * into v_ex;

  -- link to a line_item: the named one, else the first open + unlinked one
  v_li_id := coalesce(
    p_line_item_id,
    (select li->>'id'
       from jsonb_array_elements(v_motion.goal_predicate->'line_items') li
      where (li->>'state') = 'open' and coalesce(li->>'exchange_id','') = ''
      limit 1)
  );

  if v_li_id is not null then
    select (idx - 1) into v_idx
      from jsonb_array_elements(v_motion.goal_predicate->'line_items') with ordinality as t(li, idx)
      where li->>'id' = v_li_id
      limit 1;
    if v_idx is not null then
      update public.expert_motions
        set goal_predicate = jsonb_set(goal_predicate, array['line_items', v_idx::text, 'exchange_id'], to_jsonb(v_ex.id::text)),
            updated_at = now()
        where id = p_motion_id;
    end if;
  end if;

  return v_ex;
end;
$$;

comment on function public.compose_motion_exchange(uuid,text,text,text,text) is 'Compose a drafted expert_exchange for a motion and link it to a goal_predicate line_item. SECURITY DEFINER, service-role only.';

revoke execute on function public.compose_motion_exchange(uuid,text,text,text,text) from public, anon, authenticated;
grant  execute on function public.compose_motion_exchange(uuid,text,text,text,text) to service_role;
