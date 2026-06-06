import { db } from "@/lib/supabase";

export interface GapDef {
  key: string;
  label: string;
  view: string;
  blurb: string;
}

// Gap views confirmed present in revops-engine-dev. Counts come from the view, never a
// client-side row scan.
export const GAP_VIEWS: GapDef[] = [
  { key: "contacts_missing_email", label: "Contacts missing email", view: "v_contacts_missing_email", blurb: "Contacts with no usable email." },
  { key: "companies_missing_modality", label: "Companies missing modality", view: "v_companies_missing_modality", blurb: "Companies with no primary modality classified." },
  { key: "contacts_stale_employment", label: "Contacts stale employment", view: "v_contacts_stale_employment", blurb: "Employer field unverified / stale." },
  { key: "companies_needs_human_review", label: "Companies needs review", view: "v_companies_needs_human_review", blurb: "Flagged for manual review." },
  { key: "orphaned_contacts", label: "Orphaned contacts", view: "v_orphaned_contacts", blurb: "Contacts with no linked company." },
  { key: "enrichment_jobs_zombies", label: "Zombie enrichment jobs", view: "v_enrichment_jobs_zombies", blurb: "Jobs stuck without terminal status." },
  { key: "dead_letter", label: "Dead letter", view: "v_dead_letter", blurb: "Failures parked for inspection." },
];

export async function getGapCounts(): Promise<{ key: string; label: string; blurb: string; view: string; count: number; error?: string }[]> {
  const out = await Promise.all(
    GAP_VIEWS.map(async (g) => {
      try {
        const { count, error } = await db.from(g.view).select("*", { count: "exact", head: true });
        if (error) return { ...g, count: 0, error: error.message };
        return { ...g, count: count ?? 0 };
      } catch (e) {
        return { ...g, count: 0, error: String(e) };
      }
    }),
  );
  return out;
}

export async function getGapRecords(viewKey: string, limit = 100): Promise<{
  columns: string[];
  rows: Record<string, unknown>[];
}> {
  const def = GAP_VIEWS.find((g) => g.key === viewKey);
  if (!def) throw new Error(`unknown gap view: ${viewKey}`);
  const { data, error } = await db.from(def.view).select("*").limit(limit);
  if (error) throw new Error(`getGapRecords(${viewKey}): ${error.message}`);
  const rows = data ?? [];
  return { columns: rows.length ? Object.keys(rows[0]) : [], rows };
}
