import "server-only";
import { db } from "@/lib/supabase";

// Demand-Context console source of truth: public.dc_* in revops-engine.
// Read-only projection; the whole bundle is small, so we fetch every table and
// shape per-account on the client. Derived values (pattern strength, traceability)
// are computed downstream, never stored.

export interface DcAccount {
  id: string;
  name: string;
  industry: string | null;
  accent: string | null;
}
export interface TranscriptLine {
  who: string;
  text: string;
  is_prospect: boolean;
}
export interface DcCapture {
  id: string;
  account_id: string;
  ref: string | null;
  company: string | null;
  contact_role: string | null;
  source: string | null;
  event_date: string | null;
  status: string;
  transcript: TranscriptLine[];
}
export interface DcObservation {
  id: string;
  account_id: string;
  capture_id: string;
  ref: string | null;
  grade: string;
  quote: string;
}
export interface DcPattern {
  id: string;
  account_id: string;
  ref: string | null;
  name: string;
}
export interface DcArtifact {
  id: string;
  account_id: string;
  ref: string | null;
  title: string;
  step: string | null;
  type: string;
  approved: boolean;
  sort: number;
}
export interface DcArtifactRow {
  id: string;
  artifact_id: string;
  label: string | null;
  text: string;
  verdict: string | null;
  confidence: string | null;
  sort: number;
}
export interface DemandData {
  accounts: DcAccount[];
  captures: DcCapture[];
  observations: DcObservation[];
  patternObs: { pattern_id: string; observation_id: string }[];
  patterns: DcPattern[];
  artifacts: DcArtifact[];
  rows: DcArtifactRow[];
  rowPatterns: { row_id: string; pattern_id: string }[];
}

export async function getDemandData(): Promise<DemandData> {
  const [accounts, captures, observations, patternObs, patterns, artifacts, rows, rowPatterns] =
    await Promise.all([
      db.from("dc_accounts").select("id,name,industry,accent").order("created_at"),
      db
        .from("dc_captures")
        .select("id,account_id,ref,company,contact_role,source,event_date,status,transcript")
        .order("ref"),
      db.from("dc_observations").select("id,account_id,capture_id,ref,grade,quote").order("ref"),
      db.from("dc_pattern_observations").select("pattern_id,observation_id"),
      db.from("dc_patterns").select("id,account_id,ref,name").order("ref"),
      db.from("dc_artifacts").select("id,account_id,ref,title,step,type,approved,sort").order("sort"),
      db.from("dc_artifact_rows").select("id,artifact_id,label,text,verdict,confidence,sort").order("sort"),
      db.from("dc_artifact_row_patterns").select("row_id,pattern_id"),
    ]);

  for (const r of [accounts, captures, observations, patternObs, patterns, artifacts, rows, rowPatterns]) {
    if (r.error) throw new Error(r.error.message);
  }

  return {
    accounts: (accounts.data ?? []) as DcAccount[],
    captures: (captures.data ?? []) as unknown as DcCapture[],
    observations: (observations.data ?? []) as DcObservation[],
    patternObs: (patternObs.data ?? []) as { pattern_id: string; observation_id: string }[],
    patterns: (patterns.data ?? []) as DcPattern[],
    artifacts: (artifacts.data ?? []) as DcArtifact[],
    rows: (rows.data ?? []) as DcArtifactRow[],
    rowPatterns: (rowPatterns.data ?? []) as { row_id: string; pattern_id: string }[],
  };
}
