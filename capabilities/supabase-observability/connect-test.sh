#!/usr/bin/env bash
# Proves the Supabase Postgres connection BEFORE wiring NocoDB.
# If this fails, NocoDB will too — fix the connection/role here first.
#
# Usage:
#   export SUPABASE_DB_URL='postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres'
#   ./connect-test.sh
#
# Never commit SUPABASE_DB_URL. No secrets are stored in this file.

set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "ERROR: SUPABASE_DB_URL is not set."
  echo "Get the DIRECT connection string (port 5432) from the Supabase"
  echo "dashboard -> Project Settings -> Database -> Connection string,"
  echo "then: export SUPABASE_DB_URL='postgresql://...'"
  exit 1
fi

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql not installed (brew install libpq)"; exit 1; }

echo "== Connectivity =="
psql "$SUPABASE_DB_URL" -tAc "select 'connected as ' || current_user || ' / db ' || current_database();"

echo
echo "== Public tables + estimated row counts (what NocoDB will see) =="
psql "$SUPABASE_DB_URL" -P pager=off -c "
  select c.relname as table,
         c.reltuples::bigint as approx_rows
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by 1;"

echo
echo "== RLS status (empty NocoDB tables are usually this) =="
psql "$SUPABASE_DB_URL" -P pager=off -c "
  select relname as table,
         relrowsecurity as rls_enabled,
         relforcerowsecurity as rls_forced
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by 1;"

echo
echo "If rls_enabled = t on tables you need, connect NocoDB with a role that"
echo "bypasses RLS (e.g. postgres) or add policies. That is the #1 dead-end."
