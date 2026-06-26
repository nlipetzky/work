import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

export type CanonClient = SupabaseClient<Database>;

export function createCanonClient(url?: string, key?: string): CanonClient {
  const supabaseUrl = url ?? process.env.CANON_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey =
    key ?? process.env.CANON_SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Canon Supabase credentials required: CANON_SUPABASE_URL + CANON_SUPABASE_SERVICE_KEY',
    );
  }
  return createClient<Database>(supabaseUrl, supabaseKey);
}
