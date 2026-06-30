-- Migration: publish RPCs + current-SOP view
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Completes the versioning loop for /operate BUILD mode. ITERATE/BUILD save a
--   draft row (is_current=false, version=N+1); publish flips it to current in a
--   single transaction, demoting the previous current row. Two RPCs:
--     - publish_activity_version  : flip a sop_activities draft to current
--                                   (the loop the ITERATE editor actually produces)
--     - publish_sop_version       : flip a sops head version to current + stamp
--                                   published_at / published_by
--   Plus v_current_sops for convenience reads.
--
--   The partial unique index (<id>) WHERE is_current forbids two current rows,
--   so each RPC demotes-then-promotes inside its (atomic) function body.
--   SECURITY DEFINER + locked search_path per the canon RPC convention; execute
--   granted to service_role (the UI calls these via the service-role client).

-- ─── Activity-level publish ─────────────────────────────────────────────────

create or replace function public.publish_activity_version(
  p_activity_id text,
  p_version     int,
  p_by          text default null
) returns public.sop_activities
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.sop_activities;
begin
  -- target must exist
  perform 1 from public.sop_activities
    where activity_id = p_activity_id and version = p_version;
  if not found then
    raise exception 'activity version not found: % v%', p_activity_id, p_version;
  end if;

  -- demote any other current version, then promote the target
  update public.sop_activities
    set is_current = false
    where activity_id = p_activity_id and is_current = true and version <> p_version;

  update public.sop_activities
    set is_current = true
    where activity_id = p_activity_id and version = p_version
    returning * into r;

  return r;
end;
$$;

revoke all on function public.publish_activity_version(text, int, text) from public, anon, authenticated;
grant execute on function public.publish_activity_version(text, int, text) to service_role;

-- ─── SOP-head publish ───────────────────────────────────────────────────────

create or replace function public.publish_sop_version(
  p_sop_id      text,
  p_new_version int,
  p_by          text default null
) returns public.sops
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.sops;
begin
  perform 1 from public.sops where sop_id = p_sop_id and version = p_new_version;
  if not found then
    raise exception 'sop version not found: % v%', p_sop_id, p_new_version;
  end if;

  update public.sops
    set is_current = false
    where sop_id = p_sop_id and is_current = true and version <> p_new_version;

  update public.sops
    set is_current = true,
        published_at = now(),
        published_by = p_by
    where sop_id = p_sop_id and version = p_new_version
    returning * into r;

  return r;
end;
$$;

revoke all on function public.publish_sop_version(text, int, text) from public, anon, authenticated;
grant execute on function public.publish_sop_version(text, int, text) to service_role;

-- ─── Convenience view ───────────────────────────────────────────────────────

create or replace view public.v_current_sops as
  select * from public.sops where is_current;

revoke all on public.v_current_sops from public, anon, authenticated;
grant select on public.v_current_sops to service_role;
