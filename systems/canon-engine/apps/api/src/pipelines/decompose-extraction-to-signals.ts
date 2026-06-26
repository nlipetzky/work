import { getAosOperationalSupabase } from "../lib/aos-operational.js";

const VALIDITY_DAYS = 14;

interface ExtractionRow {
  id: string;
  account_id: string;
  meeting_title: string | null;
  meeting_date: string | null;
  decisions: Array<{ text: string; owner?: string }> | null;
  promises: Array<{ text: string; owner?: string; recipient?: string; due_date?: string }> | null;
  feature_requests: Array<{ text: string; requested_by?: string }> | null;
  issues: Array<{ text: string; severity?: string }> | null;
}

interface SignalInsert {
  assertion_type: "decision" | "commitment" | "action_item" | "risk" | "blocker";
  source_quote: string;
  structured_data: Record<string, unknown>;
  confidence: number;
  confidence_band: "high" | "medium" | "low";
}

function decomposeExtraction(extraction: ExtractionRow): SignalInsert[] {
  const out: SignalInsert[] = [];

  for (const d of extraction.decisions ?? []) {
    if (!d?.text?.trim()) continue;
    out.push({
      assertion_type: "decision",
      source_quote: d.text.trim(),
      structured_data: d.owner ? { owner: d.owner } : {},
      confidence: 0.8,
      confidence_band: "high",
    });
  }

  for (const p of extraction.promises ?? []) {
    if (!p?.text?.trim()) continue;
    const struct: Record<string, unknown> = {};
    if (p.owner) struct.owner = p.owner;
    if (p.recipient) struct.recipient = p.recipient;
    if (p.due_date) struct.due_date = p.due_date;
    out.push({
      assertion_type: "commitment",
      source_quote: p.text.trim(),
      structured_data: struct,
      confidence: 0.8,
      confidence_band: "high",
    });
  }

  for (const f of extraction.feature_requests ?? []) {
    if (!f?.text?.trim()) continue;
    out.push({
      assertion_type: "action_item",
      source_quote: f.text.trim(),
      structured_data: f.requested_by ? { requested_by: f.requested_by } : {},
      confidence: 0.7,
      confidence_band: "medium",
    });
  }

  for (const i of extraction.issues ?? []) {
    if (!i?.text?.trim()) continue;
    const sev = (i.severity ?? "").toLowerCase();
    const isBlocker = sev === "high" || sev === "critical" || sev === "blocker";
    out.push({
      assertion_type: isBlocker ? "blocker" : "risk",
      source_quote: i.text.trim(),
      structured_data: i.severity ? { severity: i.severity } : {},
      confidence: 0.65,
      confidence_band: "medium",
    });
  }

  return out;
}

async function fetchPendingExtractions(extractionId?: string): Promise<ExtractionRow[]> {
  const aos = getAosOperationalSupabase();
  let q = aos
    .from("meeting_extractions")
    .select(
      "id, account_id, meeting_title, meeting_date, decisions, promises, feature_requests, issues",
    )
    .eq("processing_status", "complete");

  if (extractionId) q = q.eq("id", extractionId);
  else q = q.order("meeting_date", { ascending: false }).limit(20);

  const { data, error } = await q;
  if (error) throw new Error(`meeting_extractions fetch failed: ${error.message}`);
  return (data ?? []) as unknown as ExtractionRow[];
}

async function extractionAlreadyDecomposed(extractionId: string): Promise<boolean> {
  const aos = getAosOperationalSupabase();
  const { data, error } = await aos
    .from("assertions")
    .select("id")
    .eq("source_type", "transcript")
    .eq("source_id", extractionId)
    .limit(1);
  if (error) throw new Error(`idempotency check failed: ${error.message}`);
  return (data ?? []).length > 0;
}

async function insertSignals(extraction: ExtractionRow, signals: SignalInsert[]): Promise<string[]> {
  const aos = getAosOperationalSupabase();
  const entityRefs = [`account:${extraction.account_id}`];

  const validFrom = extraction.meeting_date
    ? new Date(extraction.meeting_date).toISOString()
    : new Date().toISOString();
  const validTo = new Date(
    new Date(validFrom).getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const rows = signals.map((s) => ({
    assertion_type: s.assertion_type,
    temporal_tier: "week",
    valid_from: validFrom,
    valid_to: validTo,
    provenance: "event_extraction",
    source_type: "transcript",
    source_id: extraction.id,
    source_quote: s.source_quote,
    structured_data: s.structured_data,
    confidence: s.confidence,
    confidence_band: s.confidence_band,
    entity_refs: entityRefs,
    status: "draft",
  }));

  const { data, error } = await aos.from("assertions").insert(rows).select("id");
  if (error) throw new Error(`signals insert failed: ${error.message}`);
  return (data ?? []).map((r: { id: string }) => r.id);
}

export async function runDecomposeExtractionToSignals(opts?: { extractionId?: string }): Promise<{
  message: string;
  processed: number;
  totalSignals: number;
  results: Array<{ extractionId: string; skipped?: boolean; signalCount: number; signalIds?: string[] }>;
}> {
  const extractions = await fetchPendingExtractions(opts?.extractionId);

  if (extractions.length === 0) {
    return { message: "No extractions to process", processed: 0, totalSignals: 0, results: [] };
  }

  const results: Array<{ extractionId: string; skipped?: boolean; signalCount: number; signalIds?: string[] }> = [];

  for (const extraction of extractions) {
    const alreadyDone = await extractionAlreadyDecomposed(extraction.id);
    if (alreadyDone) {
      results.push({ extractionId: extraction.id, skipped: true, signalCount: 0 });
      continue;
    }

    const signals = decomposeExtraction(extraction);
    const ids = signals.length > 0 ? await insertSignals(extraction, signals) : [];

    results.push({ extractionId: extraction.id, signalCount: ids.length, signalIds: ids });
  }

  const totalSignals = results.reduce((n, r) => n + r.signalCount, 0);
  return {
    message: `Decomposed ${results.filter((r) => !r.skipped).length} extractions into ${totalSignals} signals`,
    processed: results.filter((r) => !r.skipped).length,
    totalSignals,
    results,
  };
}
