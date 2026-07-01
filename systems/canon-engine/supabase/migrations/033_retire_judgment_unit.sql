-- Migration: retire_judgment_unit (the veto path)
-- Date: 2026-06-30
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Owner: operating-sop / AI-expert-folder (Boris)
-- Purpose:
--   Completes the judgment_unit write API for the /folder surface: veto/retire. Sets retired_at so the
--   unit drops out of v_folder_active_units (which filters retired_at is null) without adding a standing
--   value. Used to veto an auto-activated push_to_veto unit or dismiss a proposed one. Reuses the
--   existing retired_at column (030); metadata records who + why.

create or replace function public.retire_judgment_unit(
  p_id     uuid,
  p_by     text,
  p_reason text default null
)
returns public.judgment_units
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.judgment_units;
begin
  update public.judgment_units
     set retired_at = now(),
         metadata   = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('retired_by', p_by, 'retire_reason', p_reason)
   where id = p_id
  returning * into v_row;
  if v_row.id is null then raise exception 'judgment_unit % not found', p_id; end if;
  return v_row;
end;
$$;

comment on function public.retire_judgment_unit is
  'Veto/retire a judgment_unit: set retired_at so it leaves the active view. Records retired_by + reason in metadata. SECURITY DEFINER, service-role only.';

revoke execute on function public.retire_judgment_unit(uuid,text,text) from public, anon, authenticated;
grant  execute on function public.retire_judgment_unit(uuid,text,text) to service_role;
