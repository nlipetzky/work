/**
 * AOS Operational Supabase client.
 * Connects to atyhdmcsjgmlxcqmqijm (roadmap, sessions, engagements, evidence store).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getAosOperationalSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env["AOS_SUPABASE_URL"];
  const key = process.env["AOS_SUPABASE_SERVICE_KEY"];

  if (!url || !key) {
    throw new Error(
      "Missing AOS_SUPABASE_URL or AOS_SUPABASE_SERVICE_KEY environment variables",
    );
  }

  _client = createClient(url, key);
  return _client;
}
