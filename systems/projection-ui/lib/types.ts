export type Entity = "companies" | "contacts";

export interface ListResult {
  rows: Record<string, unknown>[];
  total: number;
  columns: string[];
  page: number;
  pageSize: number;
}

export interface ProvenanceEntry {
  field: string;
  source?: string;
  action?: string;
  provider?: string;
  run_id?: string;
  jobId?: string;
  captured_at?: string;
  confidence?: number | string;
  raw: Record<string, unknown>;
}

export interface RecordDetail {
  entity: Entity;
  id: string;
  record: Record<string, unknown>;
  provenance: ProvenanceEntry[];
  activity: Record<string, unknown>[];
  jobs: Record<string, unknown>[];
}

export interface ColumnInspectorResult {
  entity: Entity;
  column: string;
  validityRule: string;
  coverage: { total: number; real: number; placeholder: number; empty: number };
  sources: { source: string; count: number }[];
  recipeMeta: Record<string, unknown> | null;
  recipeNote: string;
  sampleSize: number;
}
