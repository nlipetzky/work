-- Migration: set_expert_contact RPC
-- Date: 2026-06-25
-- Project: canon_engine (mzzjvoiwughcnmmqzbxv)
-- Purpose:
--   Targeted update of an expert's contact jsonb (e.g. set Will's email from the console),
--   without going through upsert_expert (which would overwrite the rest of the profile on a
--   partial call). SECURITY DEFINER, service-role-locked.

create or replace function public.set_expert_contact(
  p_slug    text,
  p_contact jsonb
)
returns public.experts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.experts;
begin
  update public.experts
    set contact = coalesce(p_contact, '{}'::jsonb), updated_at = now()
    where slug = p_slug
  returning * into v_row;
  return v_row;
end;
$$;

comment on function public.set_expert_contact is 'Set an expert''s contact jsonb. SECURITY DEFINER, service-role only.';

revoke execute on function public.set_expert_contact(text,jsonb) from public, anon, authenticated;
grant  execute on function public.set_expert_contact(text,jsonb) to service_role;
