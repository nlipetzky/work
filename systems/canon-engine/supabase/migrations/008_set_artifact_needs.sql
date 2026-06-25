-- Migration: set_artifact_needs RPC
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Let the Expert Liaison console persist a human's edits to an artifact's recorded needs
--   (the questions). Nick can reword / guide / course-correct the Assembler's questions, and
--   those edits stick on canon_artifact_manifest.needs so future (autonomous) asks use them.
--   SECURITY DEFINER, service-role-locked (canon_artifact_manifest has no RLS; don't widen it).

create or replace function public.set_artifact_needs(
  p_engagement_type text,
  p_engagement_id   text,
  p_artifact_type   text,
  p_needs           jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.canon_artifact_manifest
    set needs = coalesce(p_needs, '{}'::jsonb)
    where engagement_type = p_engagement_type
      and engagement_id   = p_engagement_id
      and artifact_type   = p_artifact_type;
end;
$$;

comment on function public.set_artifact_needs is 'Persist human-edited artifact needs (questions). SECURITY DEFINER, service-role only.';

revoke execute on function public.set_artifact_needs(text,text,text,jsonb) from public, anon, authenticated;
grant  execute on function public.set_artifact_needs(text,text,text,jsonb) to service_role;
