-- 0014_service_role_only_grants.sql
-- Lock the public schema to a service-role-only posture.
--
-- Context: all 115 public tables already have RLS enabled (91 with no policies =
-- deny-all). The residual exposure was grant-level: anon/authenticated held SELECT
-- on 57 views (views bypass base-table RLS), EXECUTE on 63 functions (incl.
-- promote_staging_batch), and write access to 3 tables via roles=public always-true
-- policies. Nothing client-facing ships the anon key (projection-ui = service_role
-- with server-only guard; engine runners/loaders = Management API PAT; all live n8n
-- Supabase nodes = service_role credential). This is defense-in-depth: revoke every
-- anon/authenticated privilege in public so a future key leak or accidental
-- client-side use reads/writes nothing. service_role (BYPASSRLS) and the postgres/PAT
-- paths are untouched.
--
-- Verified safe 2026-06-22 against live advisors, pg_catalog grants, and all 46
-- active n8n workflows.

begin;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Functions default-grant EXECUTE to the PUBLIC pseudo-role, which anon/authenticated
-- inherit. Revoking only from anon/authenticated leaves that inherited EXECUTE intact,
-- so revoke from PUBLIC and re-grant EXECUTE to service_role.
revoke execute on all functions in schema public from public, anon, authenticated;
grant  execute on all functions in schema public to service_role;

-- Stop future objects created by postgres from re-granting to the web roles.
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public grant  execute on functions to service_role;

-- Scope the three roles=public always-true policies to service_role
-- (clears the rls_policy_always_true advisory; service_role keeps full access).
-- Guarded so a re-run (or a run where a policy was since dropped/renamed) is a no-op
-- instead of erroring with undefined_object. Re-setting the same role is harmless.
do $$
declare
  p record;
begin
  for p in
    select * from (values
      ('system_defs_engine_access',     'system_definitions'),
      ('system_wf_links_engine_access', 'system_workflow_links'),
      ('workflow_defs_engine_access',   'workflow_definitions')
    ) as t(polname, tblname)
  loop
    if exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = p.tblname and policyname = p.polname
    ) then
      execute format('alter policy %I on public.%I to service_role', p.polname, p.tblname);
    end if;
  end loop;
end $$;

commit;
