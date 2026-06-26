import Anthropic from "@anthropic-ai/sdk";
import { getAosOperationalSupabase } from "../lib/aos-operational.js";
import { getCanonSupabase } from "./deps.js";

const ACCOUNT_NAME_SLUG: Record<string, string> = {
  konstellationai: "konstellation-ai",
  instig8: "instig8",
};

const DOMAIN_SLUG: Record<string, string> = {
  "teknova.com": "teknova",
  "konstellationai.com": "konstellation-ai",
  "instig8.ai": "instig8",
};

function accountSlugFromThread(
  accountName: string | null | undefined,
  fromAddress: string | null | undefined,
  toAddresses: string | null | undefined,
): string {
  const combined = `${fromAddress ?? ""} ${toAddresses ?? ""}`.toLowerCase();
  for (const [domain, slug] of Object.entries(DOMAIN_SLUG)) {
    if (combined.includes(domain) && slug !== "konstellation-ai" && slug !== "instig8") {
      return slug;
    }
  }
  const normalized = (accountName ?? "").trim().toLowerCase();
  if (normalized && ACCOUNT_NAME_SLUG[normalized]) {
    return ACCOUNT_NAME_SLUG[normalized];
  }
  return "unknown";
}

const VALIDITY_DAYS = 14;
const SCAN_LOOKBACK_HOURS = 24;
const MAX_BODY_CHARS = 8000;

interface EmailRow {
  id: string;
  message_id: string;
  thread_id: string;
  gmail_thread_id: string;
  date: string | null;
  from_address: string | null;
  to_addresses: string | null;
  body_text: string | null;
  subject: string | null;
  account_name: string | null;
}

interface ExtractedSignal {
  assertion_type: "decision" | "commitment" | "action_item" | "risk" | "blocker";
  source_quote: string;
  structured_data: Record<string, unknown>;
  confidence: number;
  confidence_band: "high" | "medium" | "low";
}

const EXTRACTION_PROMPT = `You extract structured signals from a single email.

Return ONLY valid JSON matching this schema:
{
  "decisions":   [{"text": "...", "owner": "optional"}],
  "commitments": [{"text": "...", "owner": "optional", "recipient": "optional", "due_date": "YYYY-MM-DD optional"}],
  "action_items":[{"text": "...", "requested_by": "optional"}],
  "issues":      [{"text": "...", "severity": "low|medium|high|critical"}]
}

Rules:
- Only include items actually present in the email. Empty arrays are fine.
- "text" must be a verbatim or near-verbatim quote from the email (max 300 chars).
- Decisions = something resolved / chosen. Commitments = someone promises to do X by Y.
  Action items = requests or tasks raised. Issues = problems, risks, blockers.
- If the email is pure noise (newsletter, receipt, no-reply), return all empty arrays.
- Do NOT infer. Do NOT summarize. Extract literal statements.`;

async function extractSignalsWithClaude(email: EmailRow): Promise<ExtractedSignal[]> {
  const client = new Anthropic();
  const body = (email.body_text ?? "").slice(0, MAX_BODY_CHARS);
  const userMsg = `FROM: ${email.from_address ?? "(unknown)"}
TO: ${email.to_addresses ?? "(unknown)"}
SUBJECT: ${email.subject ?? "(none)"}
DATE: ${email.date ?? "(unknown)"}

${body}`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: EXTRACTION_PROMPT,
    messages: [{ role: "user", content: userMsg }],
  });

  const text = (msg.content[0] as { text: string })?.text?.trim() ?? "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed: {
    decisions?: Array<{ text: string; owner?: string }>;
    commitments?: Array<{ text: string; owner?: string; recipient?: string; due_date?: string }>;
    action_items?: Array<{ text: string; requested_by?: string }>;
    issues?: Array<{ text: string; severity?: string }>;
  };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn(`[decompose-email] non-JSON response for ${email.message_id}`);
    return [];
  }

  const signals: ExtractedSignal[] = [];

  for (const d of parsed.decisions ?? []) {
    if (!d?.text?.trim()) continue;
    signals.push({
      assertion_type: "decision",
      source_quote: d.text.trim().slice(0, 500),
      structured_data: d.owner ? { owner: d.owner } : {},
      confidence: 0.75,
      confidence_band: "medium",
    });
  }
  for (const c of parsed.commitments ?? []) {
    if (!c?.text?.trim()) continue;
    const struct: Record<string, unknown> = {};
    if (c.owner) struct.owner = c.owner;
    if (c.recipient) struct.recipient = c.recipient;
    if (c.due_date) struct.due_date = c.due_date;
    signals.push({
      assertion_type: "commitment",
      source_quote: c.text.trim().slice(0, 500),
      structured_data: struct,
      confidence: 0.75,
      confidence_band: "medium",
    });
  }
  for (const a of parsed.action_items ?? []) {
    if (!a?.text?.trim()) continue;
    signals.push({
      assertion_type: "action_item",
      source_quote: a.text.trim().slice(0, 500),
      structured_data: a.requested_by ? { requested_by: a.requested_by } : {},
      confidence: 0.7,
      confidence_band: "medium",
    });
  }
  for (const i of parsed.issues ?? []) {
    if (!i?.text?.trim()) continue;
    const sev = (i.severity ?? "").toLowerCase();
    const isBlocker = sev === "high" || sev === "critical" || sev === "blocker";
    signals.push({
      assertion_type: isBlocker ? "blocker" : "risk",
      source_quote: i.text.trim().slice(0, 500),
      structured_data: i.severity ? { severity: i.severity } : {},
      confidence: 0.65,
      confidence_band: "medium",
    });
  }

  return signals;
}

async function fetchPendingEmails(messageId?: string): Promise<EmailRow[]> {
  const canon = getCanonSupabase();
  const since = new Date(Date.now() - SCAN_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

  let q = canon
    .from("email_messages")
    .select(
      `id, message_id, thread_id, date, from_address, to_addresses, body_text,
       email_threads!inner(thread_id, subject, account_name)`,
    )
    .eq("direction", "Inbound");

  if (messageId) {
    q = q.eq("message_id", messageId);
  } else {
    q = q.gte("date", since).order("date", { ascending: false }).limit(50);
  }

  const { data, error } = await q;
  if (error) throw new Error(`email_messages fetch failed: ${error.message}`);

  return (data ?? []).map((r: Record<string, unknown>) => {
    const thread = r.email_threads as
      | { thread_id?: string; subject?: string; account_name?: string }
      | undefined;
    return {
      id: r.id as string,
      message_id: r.message_id as string,
      thread_id: r.thread_id as string,
      gmail_thread_id: thread?.thread_id ?? "",
      date: (r.date as string | null) ?? null,
      from_address: (r.from_address as string | null) ?? null,
      to_addresses: (r.to_addresses as string | null) ?? null,
      body_text: (r.body_text as string | null) ?? null,
      subject: thread?.subject ?? null,
      account_name: thread?.account_name ?? null,
    } satisfies EmailRow;
  });
}

async function emailAlreadyDecomposed(messageId: string): Promise<boolean> {
  const aos = getAosOperationalSupabase();
  const { data, error } = await aos
    .from("assertions")
    .select("id")
    .eq("source_type", "email")
    .eq("source_id", messageId)
    .limit(1);
  if (error) throw new Error(`idempotency check failed: ${error.message}`);
  return (data ?? []).length > 0;
}

async function insertEmailSignals(
  email: EmailRow,
  signals: ExtractedSignal[],
  accountSlug: string,
): Promise<string[]> {
  const aos = getAosOperationalSupabase();

  const validFrom = email.date
    ? new Date(email.date).toISOString()
    : new Date().toISOString();
  const validTo = new Date(
    new Date(validFrom).getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const entityRefs = [
    `account:${accountSlug}`,
    `email:${email.message_id}`,
    `thread:${email.gmail_thread_id || email.thread_id}`,
  ];

  const rows = signals.map((s) => ({
    assertion_type: s.assertion_type,
    temporal_tier: "week",
    valid_from: validFrom,
    valid_to: validTo,
    provenance: "event_extraction",
    source_type: "email",
    source_id: email.message_id,
    source_quote: s.source_quote,
    structured_data: s.structured_data,
    confidence: s.confidence,
    confidence_band: s.confidence_band,
    entity_refs: entityRefs,
    status: "draft",
  }));

  const { data, error } = await aos.from("assertions").insert(rows).select("id");
  if (error) throw new Error(`assertions insert failed: ${error.message}`);
  return (data ?? []).map((r: { id: string }) => r.id);
}

export async function runDecomposeEmailToSignals(opts?: {
  emailThreadId?: string;
  lookbackHours?: number;
}): Promise<{
  message: string;
  processed: number;
  totalSignals: number;
  results: Array<{
    messageId: string;
    skipped?: boolean;
    signalCount: number;
    signalIds?: string[];
    accountSlug?: string;
  }>;
}> {
  const emails = await fetchPendingEmails(opts?.emailThreadId);

  if (emails.length === 0) {
    return { message: "No emails to process", processed: 0, totalSignals: 0, results: [] };
  }

  const results: Array<{
    messageId: string;
    skipped?: boolean;
    signalCount: number;
    signalIds?: string[];
    accountSlug?: string;
  }> = [];

  for (const email of emails) {
    const alreadyDone = await emailAlreadyDecomposed(email.message_id);
    if (alreadyDone) {
      results.push({ messageId: email.message_id, skipped: true, signalCount: 0 });
      continue;
    }

    const signals = await extractSignalsWithClaude(email);
    const accountSlug = accountSlugFromThread(email.account_name, email.from_address, email.to_addresses);
    const ids = signals.length > 0 ? await insertEmailSignals(email, signals, accountSlug) : [];

    results.push({
      messageId: email.message_id,
      signalCount: ids.length,
      signalIds: ids,
      accountSlug,
    });
  }

  const totalSignals = results.reduce((n, r) => n + r.signalCount, 0);
  return {
    message: `Decomposed ${results.length} emails into ${totalSignals} signals`,
    processed: results.length,
    totalSignals,
    results,
  };
}

export const _internal = { accountSlugFromThread };
