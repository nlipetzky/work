// Reads ground truth from Canon Engine (Supabase). No state derivation here.
// IDENTITY: resolve a deal by participant email DOMAIN, never account_name.
// Validated 2026-06-04: account_name is workspace-level (all 48 transcripts = "konstellationai",
// emails mostly null/workspace), so it over-matches catastrophically. Domain is the per-deal key.
import { createClient } from "@supabase/supabase-js";
import type { Interaction } from "./derive.js";

const url = process.env.CANON_SUPABASE_URL!;
const key = process.env.CANON_SUPABASE_SERVICE_ROLE_KEY!;
export const canon = createClient(url, key, { auth: { persistSession: false } });

export interface AccountKeys {
  domain?: string; // email domain, e.g. "rahrbsg.com" — the per-deal key
}

// Pull the deal's interactions. v1 = EMAILS ONLY, resolved by domain.
// Transcripts are deferred: their participants are names (not emails/domains), so they can't be
// domain-matched yet. Consequence: meeting-based Stage under-reports until transcript->deal
// resolution is solved. Waiting On (email-direction-driven) is trustworthy now.
export async function fetchInteractions(keys: AccountKeys): Promise<Interaction[]> {
  if (!keys.domain) return [];
  const { data } = await canon
    .from("email_threads")
    .select("subject, thread_last_activity, direction")
    .ilike("participants", `%${keys.domain}%`)
    .order("thread_last_activity", { ascending: false })
    .limit(100);
  return (data ?? []).map((r: any) => {
    const dir = (r.direction || "").toLowerCase();
    return {
      kind: "email" as const,
      direction: dir === "inbound" ? "inbound" : dir === "outbound" ? "outbound" : null,
      date: r.thread_last_activity,
      label: r.subject,
    };
  });
}
