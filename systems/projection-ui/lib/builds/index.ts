import "server-only";
import { canonDb } from "@/lib/canon";
import { NEXT_ASK, type Move } from "@/lib/builds/shared";

// Enforced write for the system-building system. Resolving a build's current-move ask advances it
// to the next move (or to done after Move 4). Service-role write against canon public.system_builds;
// never a raw insert from a client. Mirrors the lib/moves discipline (the only path that mutates).

export interface ResolveResult {
  slug: string;
  current_move: Move;
  status: "in_flight" | "done";
}

export async function resolveBuildAsk(slug: string): Promise<ResolveResult> {
  const db = canonDb();
  const { data: cur, error: readErr } = await db
    .from("system_builds")
    .select("current_move, status")
    .eq("slug", slug)
    .single();
  if (readErr) throw new Error(`resolveBuildAsk read failed: ${readErr.message}`);

  const move = cur.current_move as Move;
  if (cur.status === "done") return { slug, current_move: move, status: "done" };

  const next = NEXT_ASK[move];
  const patch = next
    ? {
        current_move: (move + 1) as Move,
        pending_ask_type: next.type,
        pending_ask_text: next.text,
        status: "in_flight" as const,
        updated_at: new Date().toISOString(),
      }
    : {
        pending_ask_type: null,
        pending_ask_text: null,
        status: "done" as const,
        updated_at: new Date().toISOString(),
      };

  const { error: writeErr } = await db.from("system_builds").update(patch).eq("slug", slug);
  if (writeErr) throw new Error(`resolveBuildAsk write failed: ${writeErr.message}`);

  return { slug, current_move: next ? ((move + 1) as Move) : move, status: patch.status };
}
