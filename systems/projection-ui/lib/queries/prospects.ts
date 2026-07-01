import "server-only";
import { db } from "@/lib/supabase";

// The Prospect spine — signal-sourced companies moving signal -> qualified. Filled by the free signal
// watch (ClinicalTrials.gov now; USPTO PatentsView with a key); advanced by the (credit-gated)
// enrichment step. Reads from revops-engine.public.prospects (collapsed from canon in slice-2 refactor).

export type ProspectStage = "signal" | "resolved" | "screened" | "enriched" | "qualified" | "disqualified";
const STAGES: ProspectStage[] = ["signal", "resolved", "screened", "enriched", "qualified", "disqualified"];

export interface ProspectSignal { type?: string; nctId?: string; patent_id?: string; phase?: string | null; status?: string | null; title?: string | null; date?: string | null; condition?: string[] }
export interface Prospect {
  id: string;
  company_name: string;
  domain: string | null;
  source: string;
  source_ref: string;
  recipe_name: string | null;
  stage: ProspectStage;
  verdict: string | null;
  signal: ProspectSignal;
  created_at: string;
}
export interface ProspectEngagement {
  engagement_type: string;
  engagement_id: string;
  total: number;
  byStage: Record<string, number>;
  bySource: Record<string, number>;
  prospects: Prospect[];      // capped sample, newest first
}
export interface ProspectsSystem { engagements: ProspectEngagement[] }

export async function getProspects(): Promise<ProspectsSystem> {
  const { data, error } = await db.from("prospects")
    .select("id, engagement_type, engagement_id, company_name, domain, source, source_ref, recipe_name, stage, verdict, signal, created_at")
    .order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);

  const byEng = new Map<string, ProspectEngagement>();
  for (const r of data ?? []) {
    const k = `${r.engagement_type}:${r.engagement_id}`;
    let e = byEng.get(k);
    if (!e) {
      e = { engagement_type: r.engagement_type, engagement_id: r.engagement_id, total: 0,
            byStage: Object.fromEntries(STAGES.map((s) => [s, 0])), bySource: {}, prospects: [] };
      byEng.set(k, e);
    }
    e.total += 1;
    e.byStage[r.stage] = (e.byStage[r.stage] ?? 0) + 1;
    e.bySource[r.source] = (e.bySource[r.source] ?? 0) + 1;
    if (e.prospects.length < 200) {
      e.prospects.push({
        id: r.id, company_name: r.company_name, domain: r.domain ?? null, source: r.source, source_ref: r.source_ref,
        recipe_name: r.recipe_name ?? null, stage: r.stage as ProspectStage, verdict: r.verdict ?? null,
        signal: (r.signal as ProspectSignal) ?? {}, created_at: r.created_at,
      });
    }
  }
  return { engagements: [...byEng.values()].sort((a, b) => b.total - a.total) };
}
