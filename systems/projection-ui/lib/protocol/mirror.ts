import "server-only";
import { canonDb } from "@/lib/canon";
import { structuredCall } from "@/lib/ai";
import { latestWeeklyIntent } from "@/lib/queries/intent";

// Step 5 — Mirror (close of day). Pull the day's spine deltas deterministically, then one model
// call summarizes moved / stalled / hijacked against the week's intent.

export async function mirror(): Promise<string> {
  const db = canonDb();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: completed }, { data: createdTasks }, { data: closedProjects }, intent] = await Promise.all([
    db.from("tasks").select("title, importance, urgency").eq("status", "completed").eq("completed", today),
    db.from("tasks").select("title").gte("created_at", `${today}T00:00:00Z`),
    db.from("projects").select("name, status").neq("status", "active").eq("closed", today),
    latestWeeklyIntent(),
  ]);

  const done = completed ?? [];
  const made = createdTasks ?? [];
  const closed = closedProjects ?? [];
  if (!done.length && !made.length && !closed.length) {
    return "No spine activity recorded today — nothing completed, created, or closed.";
  }

  const out = await structuredCall<{ summary: string }>({
    system:
      "You are Atlas. Mirror Nick's day against the week's intent in 2-3 terse sentences: what MOVED (completed/closed), what STALLED, what HIJACKED the plan (reactive work off-theme). Peer tone, no preamble, no praise.",
    schemaName: "daily_mirror",
    schema: { type: "object" as const, properties: { summary: { type: "string" } }, required: ["summary"] },
    prompt:
      `Week's theme: ${intent?.theme ?? "(none declared)"}\n` +
      `Completed today (${done.length}): ${done.map((t: any) => t.title).join("; ") || "none"}\n` +
      `Created today (${made.length}): ${made.map((t: any) => t.title).join("; ") || "none"}\n` +
      `Projects closed today: ${closed.map((p: any) => `${p.name} (${p.status})`).join("; ") || "none"}\n\n` +
      `Write the mirror.`,
  });
  return out.summary;
}
