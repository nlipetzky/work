import "server-only";
import { canonDb } from "@/lib/canon";

// The curation ledger: what the Expert Liaison loop reviewed and what came out. Each row is
// one source assessed for one engagement -> outcome -> (if valuable) the extracted snippet and
// which artifact it fed. This is the run-layer observability surface for the expert-liaison
// system (system-anatomy part 8): "what was reviewed and what came out" made visible, so the
// loop doesn't rely on the agent remembering. Written only via the record_source_assessment RPC.

export type AssessmentOutcome = "valuable" | "not_valuable" | "insufficient" | "unclear";

export interface LedgerRow {
  source_type: string;
  source_id: string;
  source_locator: string | null;
  assessed_by: string;
  assessed_at: string;
  outcome: AssessmentOutcome;
  reasoning: string | null;
  snippet: string | null;
  artifact_type: string | null;
  artifact_id: string | null;
  artifact_name: string | null;     // joined from canon_artifacts
  artifact_version: number | null;  // joined from canon_artifacts
  fed_to_assembler: boolean;
}
export interface LedgerEngagement {
  engagement_type: string;
  engagement_id: string;
  rows: LedgerRow[];
  sourcesAssessed: number;  // distinct sources reviewed
  valuable: number;         // rows with outcome 'valuable'
  fed: number;              // rows fed to the Assembler
  artifactsTouched: number; // distinct artifact_types fed
}
export interface SourceAssessmentLedger {
  engagements: LedgerEngagement[];
  totalSources: number;
  totalValuable: number;
  totalFed: number;
}

interface RawRow {
  source_type: string;
  source_id: string;
  source_locator: string | null;
  engagement_type: string;
  engagement_id: string;
  assessed_by: string;
  assessed_at: string;
  outcome: AssessmentOutcome;
  reasoning: string | null;
  snippet: string | null;
  artifact_type: string | null;
  artifact_id: string | null;
  fed_to_assembler: boolean;
  canon_artifacts: { name: string | null; version: number | null } | null;
}

export async function getSourceAssessments(): Promise<SourceAssessmentLedger> {
  const db = canonDb();
  const { data, error } = await db
    .from("source_assessments")
    .select(
      "source_type, source_id, source_locator, engagement_type, engagement_id, assessed_by, assessed_at, outcome, reasoning, snippet, artifact_type, artifact_id, fed_to_assembler, canon_artifacts(name, version)",
    )
    .order("assessed_at", { ascending: false });
  if (error) throw new Error(error.message);

  const byEng = new Map<string, LedgerEngagement>();
  for (const r of (data ?? []) as unknown as RawRow[]) {
    const ek = `${r.engagement_type}:${r.engagement_id}`;
    let eng = byEng.get(ek);
    if (!eng) {
      eng = { engagement_type: r.engagement_type, engagement_id: r.engagement_id, rows: [], sourcesAssessed: 0, valuable: 0, fed: 0, artifactsTouched: 0 };
      byEng.set(ek, eng);
    }
    eng.rows.push({
      source_type: r.source_type, source_id: r.source_id, source_locator: r.source_locator,
      assessed_by: r.assessed_by, assessed_at: r.assessed_at, outcome: r.outcome,
      reasoning: r.reasoning, snippet: r.snippet, artifact_type: r.artifact_type, artifact_id: r.artifact_id,
      artifact_name: r.canon_artifacts?.name ?? null, artifact_version: r.canon_artifacts?.version ?? null,
      fed_to_assembler: r.fed_to_assembler,
    });
  }

  for (const eng of byEng.values()) {
    eng.sourcesAssessed = new Set(eng.rows.map((x) => `${x.source_type}:${x.source_id}`)).size;
    eng.valuable = eng.rows.filter((x) => x.outcome === "valuable").length;
    eng.fed = eng.rows.filter((x) => x.fed_to_assembler).length;
    eng.artifactsTouched = new Set(eng.rows.filter((x) => x.artifact_type).map((x) => x.artifact_type)).size;
  }

  const engagements = [...byEng.values()].sort((a, b) => a.engagement_id.localeCompare(b.engagement_id));
  const totalSources = engagements.reduce((n, e) => n + e.sourcesAssessed, 0);
  const totalValuable = engagements.reduce((n, e) => n + e.valuable, 0);
  const totalFed = engagements.reduce((n, e) => n + e.fed, 0);
  return { engagements, totalSources, totalValuable, totalFed };
}
