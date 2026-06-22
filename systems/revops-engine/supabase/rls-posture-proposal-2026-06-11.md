# RLS posture proposal — revops-engine-dev (mrmnyscurmkfppicqqhk)

Date: 2026-06-11. **Status: APPLIED 2026-06-22** via migration
`0014_service_role_only_grants.sql` (Nick gave the go). Pre-flight (n8n anon-key
audit) closed clean; before/after verified live. Advisors + pg_catalog verified
live via Management API.

## Outcome (verified 2026-06-22)

- anon/authenticated table+sequence grants in public: 2408 → 0.
- anon/authenticated function EXECUTE in public: 63 → 0 (needed a `REVOKE ... FROM
  PUBLIC` + re-grant to service_role; revoking only from the two roles left the
  PUBLIC-inherited EXECUTE intact). service_role EXECUTE retained on all 76.
- Live REST: anon read of a view and of base tables `companies`/`contacts` → HTTP 401
  (was 200). service_role read + RPC → HTTP 200 (unchanged).
- Advisors: the 24 ERROR `security_definer_view`, both `*_security_definer_function_executable`
  (6+6), `materialized_view_in_api` (1), and `rls_policy_always_true` (3) all cleared.
  Remaining: `function_search_path_mutable` (4, separate hardening item, no exposure)
  and `rls_enabled_no_policy` (91 INFO, the intended deny-all posture).
- Pre-flight result: all 46 active n8n workflows reach Supabase only through
  `n8n-nodes-base.supabase` nodes (service_role credential "Teknova Supabase
  (revops-engine-dev)"); the "SB > AT *" single-node workflows are webhook receivers
  (Supabase → n8n push), not n8n authenticating to Supabase. No anon key in use.

---
## Original proposal (pre-apply)

## Current state (verified 2026-06-11)

The 2026-06-05 carry-over ("36 public tables with RLS disabled") is resolved. Advisor reports
zero `rls_disabled_in_public`. Ground truth: 115/115 public tables have RLS enabled; 91 of them
have no policies at all, which is deny-all for anon/authenticated and exactly the intended
service-role-only posture.

What remains is grant-level exposure, not RLS:

1. **57 views/matviews in public have SELECT granted to anon/authenticated.** Postgres views
   run with owner privileges by default (no `security_invoker`), so they bypass the base-table
   RLS entirely. The anon key can read all model_*, v_*, pipeline, completeness, and pearl
   views today. This is the advisor's ERROR-level `security_definer_view` x24 plus the rest.
2. **63 public functions are EXECUTE-granted to anon**, including 6 SECURITY DEFINER:
   `promote_staging_batch`, `staging_batch_preview`, `list_staging_batches`,
   `notify_n8n_airtable_sync`, `clay_contacts_raw_notify_router`, `clay_events_raw_notify_router`.
   An anon-key holder could promote staging batches.
3. **3 tables have `roles={public}` always-true ALL policies** (writable with the anon key):
   `system_definitions`, `system_workflow_links`, `workflow_definitions`.
4. 5 staging.* tables have RLS off, but `staging` is not in PostgREST `db_schema`
   (`public,graphql_public`) and is granted to postgres only. Not reachable. No action needed.

## Is the anon key exposed anywhere?

No. Verified consumers:
- projection-ui: service-role key, `server-only` import, no NEXT_PUBLIC_* vars (lib/supabase.ts).
- revops-engine runners/loaders: Supabase Management API with PAT from work/.env. No supabase-js.
- Inngest sync: runs in projection-ui with the same service-role env.
- Unverified: any still-live n8n workflow holding a Supabase credential. Pre-flight check below.

So this is defense-in-depth against a future leak or accidental client-side use, not an active breach.

## Recommended policy: service-role-only default

Revoke everything from anon/authenticated in public; service_role and Management API paths
are unaffected (service_role keeps its own grants and BYPASSRLS).

```sql
-- proposed migration: 00XX_service_role_only_grants.sql
begin;
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
-- tidy: scope the three public-role policies to service_role
alter policy system_defs_engine_access     on public.system_definitions     to service_role;
alter policy system_wf_links_engine_access on public.system_workflow_links  to service_role;
alter policy workflow_defs_engine_access   on public.workflow_definitions   to service_role;
commit;
```

One judgment call inside this: it also cuts the `authenticated` role, which the
`authenticated_read_execution_plans/steps` policies suggest someone intended for a future
logged-in surface. Nothing deployed uses Supabase Auth, so cutting it now and re-granting
when a portal exists seems right, but it is a call.

## Blast radius / pre-flight

- Closes: all 57 view reads, all 63 function calls (incl. batch promotion), writes to the
  3 public-policy tables, for both anon and authenticated keys.
- Unaffected: projection-ui, runners/loaders, Inngest, migrations (all service_role or PAT).
- Pre-flight before applying: confirm no live n8n workflow authenticates to this project with
  the anon key (service-role credential is fine).
- Post-apply smoke test: load projection-ui /records, run `staging_batch_preview` via
  service-role RPC, confirm both still work.

Not applied. Waiting on Nick's go.
