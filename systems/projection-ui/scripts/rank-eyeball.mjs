// Eyeball the ranking formula over the REAL task set before any UI rides on it (DEFINE §8.2).
// Prints the ranked next-actions with their factor breakdown. Pure formula lives in
// ../lib/ranking.mjs — this script only fetches + prints, so the printout proves the same
// code the app uses. Run: node scripts/rank-eyeball.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { rankNextActions } from "../lib/ranking.mjs";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const canon = createClient(env.CANON_SUPABASE_URL, env.CANON_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const { data: tasks, error } = await canon
  .from("tasks")
  .select(
    "id,title,importance,urgency,due,first_5_minutes,recurring," +
      "project:projects(id,name,area,goal:goals(id,title,leverage,wealth_test,area))",
  )
  .eq("status", "open");
if (error) throw error;

const { data: intent } = await canon
  .from("weekly_intent")
  .select("client_engagement_pct,prospect_engagement_pct,infrastructure_pct,finance_pct,admin_pct,personal_pct,week_of,theme")
  .order("week_of", { ascending: false })
  .limit(1)
  .maybeSingle();

const flat = (tasks ?? []).map((row) => {
  const p = row.project ?? null;
  const g = p?.goal ?? null;
  return {
    id: row.id, title: row.title, importance: row.importance, urgency: row.urgency,
    due: row.due, first_5_minutes: row.first_5_minutes, recurring: row.recurring ?? false,
    area: p?.area ?? g?.area ?? null, leverage: g?.leverage ?? null, wealth_test: g?.wealth_test ?? null,
    project: p ? { id: p.id, name: p.name, goal: g ? { id: g.id, title: g.title } : null } : null,
  };
});

const { top, ranked, overrodeUrgent } = rankNextActions(flat, intent ?? null);

const recurring = (tasks ?? []).filter((t) => t.recurring).length;
console.log(`\nWeekly intent: ${intent ? `${intent.week_of} — "${intent.theme ?? ""}"` : "none"}`);
console.log(`Open tasks: ${flat.length} ranked, ${recurring} recurring excluded\n`);
console.log("THE ONE NEXT ACTION:");
if (top) {
  console.log(`  ${top.title}`);
  console.log(`  score ${top.score}  ·  ${top.leverage ?? "no-lev"}/${top.wealth_test ?? "?"}  ·  ${top.project?.goal?.title ?? "[orphan]"}`);
  console.log(`  first-5: ${top.first_5_minutes ?? "(none set)"}`);
}
if (overrodeUrgent) console.log(`  ↑ lever beat a do-first task: "${overrodeUrgent.beatTitle}"`);

console.log("\nRANKED (top 20):");
const pad = (s, n) => String(s ?? "").slice(0, n).padEnd(n);
console.log(`  ${pad("score", 7)}${pad("I/U", 8)}${pad("lev/wlt", 13)}${pad("due", 12)}${pad("area", 14)}title`);
for (const t of ranked.slice(0, 20)) {
  const iu = `${t.importance === "important" ? "I" : "i"}${t.urgency === "urgent" ? "U" : "u"}`;
  console.log(
    `  ${pad(t.score, 7)}${pad(iu, 8)}${pad(`${t.leverage ?? "-"}/${t.wealth_test ?? "-"}`, 13)}${pad(t.due ?? "-", 12)}${pad(t.area ?? "-", 14)}${t.title}`,
  );
}
console.log("");
