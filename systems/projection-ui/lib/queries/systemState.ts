import "server-only";
import { canonDb } from "@/lib/canon";
import { hasRealSurface } from "@/lib/planning/guards";
import { evidencedState, type SystemEvidence, type EvidencedState } from "@/lib/systemState";

// Gathers the evidence for every system in one pass and computes its honest state. Compute-on-read
// (never stored) so it can't drift from reality. Keyed by system_slug.

const DAY = 86_400_000;
function daysSince(ts: string | null | undefined): number | null {
  if (!ts) return null;
  const t = Date.parse(ts);
  return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / DAY);
}

interface SysRow {
  id: string; system_slug: string; status: string | null; runs_surface: string | null;
  body: string | null; last_reconciled: string | null;
}
interface ActRow { system_id: string | null; ensured: boolean | null; current_automation_level: string | null; channel: string | null; verification: string | null; last_ensured_at: string | null }
interface AssetRow { system_id: string | null; reconciled_against_reality: boolean | null }
interface TrigRow { system_id: string | null; status: string | null }

export async function systemStates(): Promise<Map<string, EvidencedState>> {
  const db = canonDb();
  const [{ data: systems, error }, { data: acts }, { data: assets }, { data: trigs }] = await Promise.all([
    db.from("systems").select("id, system_slug, status, runs_surface, body, last_reconciled").neq("status", "archived"),
    db.from("activities").select("system_id, ensured, current_automation_level, channel, verification, last_ensured_at"),
    db.from("assets").select("system_id, reconciled_against_reality"),
    db.from("system_triggers").select("system_id, status"),
  ]);
  if (error) throw new Error(error.message);

  // Accumulate evidence per system id.
  const acc = new Map<string, SystemEvidence & { _ensuredDays: number[] }>();
  const init = (s: SysRow): SystemEvidence & { _ensuredDays: number[] } => ({
    claimed_status: s.status,
    spec_defined: !!(s.body && s.body.trim().length > 40), // a real spec body, not a one-liner
    has_surface: hasRealSurface(s.runs_surface),
    activities: 0, ensured: 0, verified: 0, unrouted: 0, last_ensured_days: null,
    assets: 0, assets_reconciled: 0, triggers: 0, triggers_wired: 0,
    last_reconciled_days: daysSince(s.last_reconciled),
    _ensuredDays: [],
  });
  const idToSlug = new Map<string, string>();
  for (const s of (systems ?? []) as SysRow[]) { acc.set(s.id, init(s)); idToSlug.set(s.id, s.system_slug); }

  for (const a of (acts ?? []) as ActRow[]) {
    const e = a.system_id && acc.get(a.system_id);
    if (!e) continue;
    e.activities += 1;
    if (a.ensured) {
      e.ensured += 1;
      if (a.verification && a.verification.trim()) e.verified += 1;
      const d = daysSince(a.last_ensured_at);
      if (d !== null) e._ensuredDays.push(d);
    }
    if (a.current_automation_level !== "autonomous" && !a.channel) e.unrouted += 1;
  }
  for (const a of (assets ?? []) as AssetRow[]) {
    const e = a.system_id && acc.get(a.system_id);
    if (!e) continue;
    e.assets += 1;
    if (a.reconciled_against_reality) e.assets_reconciled += 1;
  }
  for (const t of (trigs ?? []) as TrigRow[]) {
    const e = t.system_id && acc.get(t.system_id);
    if (!e) continue;
    e.triggers += 1;
    if (t.status === "wired") e.triggers_wired += 1;
  }

  const out = new Map<string, EvidencedState>();
  for (const [id, e] of acc) {
    e.last_ensured_days = e._ensuredDays.length ? Math.min(...e._ensuredDays) : null;
    out.set(idToSlug.get(id)!, evidencedState(e));
  }
  return out;
}
