import "server-only";
import { canonDb } from "@/lib/canon";
import type { RitualFlag } from "@/lib/protocol/types";

// Step 4 — Flag rituals. Pure deterministic predicates (no model). Surfaces; never auto-acts.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Monday (UTC) of the week containing `d`, as YYYY-MM-DD. */
function mondayOf(d: Date): string {
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  const mon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  return mon.toISOString().slice(0, 10);
}

export async function ritualFlags(): Promise<RitualFlag[]> {
  const db = canonDb();
  const now = new Date();
  const flags: RitualFlag[] = [];

  // 1. Weekly intent stale: no row for the current week.
  const thisMonday = mondayOf(now);
  const { data: wi } = await db
    .from("weekly_intent")
    .select("week_of")
    .order("week_of", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!wi || wi.week_of < thisMonday) {
    flags.push({
      kind: "weekly_intent_stale",
      message: wi
        ? `No Weekly Intent for the week of ${thisMonday} (latest is ${wi.week_of}). Declare this week's allocation.`
        : `No Weekly Intent declared. Set this week's allocation (${thisMonday}).`,
    });
  }

  // 2. Stale projects: active 3+ weeks with zero completed tasks.
  const cutoff = new Date(now.getTime() - 21 * DAY_MS).toISOString().slice(0, 10);
  const { data: projects } = await db
    .from("projects")
    .select("id, name, started, created_at")
    .eq("status", "active");
  const old = (projects ?? []).filter((p: any) => (p.started ?? p.created_at?.slice(0, 10) ?? "9999") <= cutoff);
  if (old.length) {
    const ids = old.map((p: any) => p.id);
    const { data: doneTasks } = await db
      .from("tasks")
      .select("project_id")
      .in("project_id", ids)
      .eq("status", "completed");
    const withProgress = new Set((doneTasks ?? []).map((t: any) => t.project_id));
    for (const p of old) {
      if (!withProgress.has(p.id)) {
        flags.push({ kind: "stale_project", ref_id: p.id, message: `Project "${p.name}" has been Active 3+ weeks with zero completed tasks — pause or drop?` });
      }
    }
  }

  // 3. Urgency drift: important + not-urgent tasks now due within 3 days (about to flip urgent).
  const soon = new Date(now.getTime() + 3 * DAY_MS).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const { data: drifting } = await db
    .from("tasks")
    .select("id, title, due")
    .eq("status", "open")
    .eq("importance", "important")
    .eq("urgency", "not_urgent")
    .not("due", "is", null)
    .lte("due", soon)
    .gte("due", today);
  for (const t of drifting ?? []) {
    flags.push({ kind: "urgency_drift", ref_id: t.id, message: `"${t.title}" (important, not-urgent) is due ${t.due} — drifting into urgent.` });
  }

  return flags;
}
