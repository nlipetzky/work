import "server-only";
import { canonDb } from "@/lib/canon";

// Read canon.public.skills for the ITERATE skill-swap panel.
// Filesystem stays source-of-truth; this table is the queryable mirror
// (populated by systems/canon-engine/scripts/sync-skills.mjs).

export type AvailableSkill = {
  slug: string;
  title: string;
  description: string | null;
  path: string;
  ownerSystemSlug: string | null;
  status: "active" | "draft" | "deprecated";
};

function isMissingTable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  if (typeof e.message === "string" && /does not exist|schema cache/i.test(e.message)) return true;
  return false;
}

export async function listAvailableSkills(): Promise<AvailableSkill[]> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("skills")
      .select("slug, title, description, path, owner_system_slug, status")
      .in("status", ["active", "draft"])
      .order("owner_system_slug", { ascending: true, nullsFirst: false })
      .order("slug", { ascending: true });
    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    if (!data) return [];
    return data.map((r) => ({
      slug: r.slug as string,
      title: (r.title as string) ?? (r.slug as string),
      description: (r.description as string | null) ?? null,
      path: (r.path as string) ?? "",
      ownerSystemSlug: (r.owner_system_slug as string | null) ?? null,
      status: (r.status as AvailableSkill["status"]) ?? "active",
    }));
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
}
