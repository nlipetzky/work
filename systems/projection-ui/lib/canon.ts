import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY service-role client for canon_engine (operator-os Goals live here).
// `goals` has RLS enabled with no anon policy, so reads go through the service role.
// The "server-only" import makes the build fail if this key ever reaches a client
// component. Lazily initialised so `next build` succeeds without secrets.

let _canon: SupabaseClient | null = null;

export function canonDb(): SupabaseClient {
  if (_canon) return _canon;
  const url = process.env.CANON_SUPABASE_URL?.trim();
  const key = process.env.CANON_SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing CANON_SUPABASE_URL or CANON_SUPABASE_SERVICE_KEY in .env.local (operator-os Goals read from canon_engine).",
    );
  }
  _canon = createClient(url, key, { auth: { persistSession: false } });
  return _canon;
}
