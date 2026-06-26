import "server-only";
import { canonDb } from "@/lib/canon";
import type { SystemBuild, BuildStatus } from "@/lib/builds/shared";

// The system-building system's run-layer surface: one row per system being built, tracked through
// the four-move methodology. Source: canon public.system_builds. Read-only; the single mutation
// (resolving a move's ask) lives in lib/builds. Active builds first, done last; then by move.
export type { SystemBuild } from "@/lib/builds/shared";

export async function listSystemBuilds(): Promise<SystemBuild[]> {
  const { data, error } = await canonDb()
    .from("system_builds")
    .select(
      "slug, name, current_move, status, pending_ask_type, pending_ask_text, brief_path, sketch_path, system_slug, notes, updated_at",
    );
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as SystemBuild[];
  const rank = (s: BuildStatus) => (s === "done" ? 1 : 0);
  return rows.sort(
    (a, b) => rank(a.status) - rank(b.status) || b.current_move - a.current_move || a.name.localeCompare(b.name),
  );
}
