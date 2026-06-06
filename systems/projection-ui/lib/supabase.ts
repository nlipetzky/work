import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. The service-role key bypasses RLS (companies/contacts have RLS enabled with
// no policies; 38 other tables have it disabled). It must never reach a client component —
// the "server-only" import makes the build fail if that ever happens.
//
// Lazily initialised: importing this module never touches env, so `next build` succeeds
// without secrets. The client is created on first query, at request time.

let _db: SupabaseClient | null = null;

function init(): SupabaseClient {
  if (_db) return _db;
  // Deliberately namespaced: a bare SUPABASE_URL is often exported in the shell profile,
  // and Next.js gives real env vars precedence over .env.local — which silently points the
  // app at the wrong project. The PROJECTION_ prefix prevents that collision.
  const url = process.env.PROJECTION_SUPABASE_URL?.trim();
  const key = process.env.PROJECTION_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing PROJECTION_SUPABASE_URL or PROJECTION_SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and fill them in.",
    );
  }
  _db = createClient(url, key, { auth: { persistSession: false } });
  return _db;
}

export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = init();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});
