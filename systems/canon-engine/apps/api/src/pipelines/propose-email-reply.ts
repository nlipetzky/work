import Anthropic from "@anthropic-ai/sdk";
import { getAosOperationalSupabase } from "../lib/aos-operational.js";
import { getCanonSupabase } from "./deps.js";

const TEKNOVA_ACCOUNT_ID = "0e5aa792-2130-4942-9f9d-5cb6513659b3";
const PILOT_ACCOUNT_SLUGS = new Set(["teknova"]);
const MAX_THREAD_MESSAGES = 10;
const MAX_BODY_CHARS = 6000;

// Voice reference — seeded from canon/instig8/voice/nick-email-voice.md.
// Canon file is authoritative. If that file changes, update this constant.
const VOICE_REFERENCE = `
You are drafting an email on behalf of Nick Lipetzky / Konstellation AI.
Nick communicates as a peer. Direct. Warm without softness. Strategically deliberate.

THE 7 RULES (apply all):
1. No meta-commentary — never narrate your choices.
2. Show capability through action — completed actions, not intentions.
3. Fewer words — cut 30-40% from AI defaults. Short sentences.
4. No subordinate framing — peer-to-peer always. No "would it be possible," no "at your convenience."
5. Strategic opacity — don't reveal the full hand. Create curiosity without dumping specifics.
6. Peer warmth without softness — authentic warmth ("Good catching up") over filler warmth ("Hope this finds you well").
7. Entity reinforcement — sign off as "Nick Lipetzky | Konstellation AI" for external registers.

RELATIONSHIP REGISTERS:
- Client: ~50 words. Max opacity. Full sign-off. Never defer.
- Partner: ~80 words. Selective opacity. Sign off where natural.
- Investor: ~70 words. Low opacity (they need the picture). Full sign-off.
- Internal: ~120 words. No opacity. Casual direct. No entity sign-off required.

ANTI-PATTERNS TO AVOID:
- "I hope this email finds you well" / "Thanks so much for your time"
- "I wanted to share" / "I wanted to take a moment"
- "Would it be possible" / "at your convenience" / "if you don't mind"
- "Just wanted to check in" / "Just following up"
- Narrating structure ("I'll keep this brief")
`.trim();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailSignalEventData {
  inbound_email_uuid: string;
  message_id: string;
  thread_id: string;
  account_slug: string;
  assertion_ids: string[];
}

interface InboundEmail {
  id: string;
  message_id: string;
  thread_id: string;
  gmail_thread_id: string;
  subject: string | null;
  from_address: string | null;
  to_addresses: string | null;
  cc_addresses: string | null;
  body_text: string | null;
  date: string | null;
  direction: string | null;
  account_name: string | null;
}

interface ThreadMessage {
  direction: string | null;
  from_address: string | null;
  to_addresses: string | null;
  body_text: string | null;
  date: string | null;
}

interface DraftedReply {
  tier: 0 | 1 | 2 | 3;
  tier_rationale: string;
  draft_subject: string;
  draft_body: string;
  draft_to: string[];
  draft_cc: string[];
}

interface OutboundSignal {
  assertion_type: "decision" | "commitment" | "action_item" | "risk" | "blocker";
  source_quote: string;
  structured_data: Record<string, unknown>;
  confidence: number;
  confidence_band: "high" | "medium" | "low";
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchInboundEmail(inboundUuid: string): Promise<InboundEmail | null> {
  const canon = getCanonSupabase();
  const { data, error } = await canon
    .from("email_messages")
    .select(
      `id, message_id, thread_id, from_address, to_addresses, cc_addresses,
       body_text, date, direction,
       email_threads!inner(thread_id, subject, account_name)`,
    )
    .eq("id", inboundUuid)
    .maybeSingle();

  if (error) throw new Error(`inbound email fetch failed: ${error.message}`);
  if (!data) return null;

  const thread = data.email_threads as
    | { thread_id?: string; subject?: string; account_name?: string }
    | undefined;

  return {
    id: data.id as string,
    message_id: data.message_id as string,
    thread_id: data.thread_id as string,
    gmail_thread_id: thread?.thread_id ?? "",
    subject: thread?.subject ?? null,
    from_address: (data.from_address as string | null) ?? null,
    to_addresses: (data.to_addresses as string | null) ?? null,
    cc_addresses: (data.cc_addresses as string | null) ?? null,
    body_text: (data.body_text as string | null) ?? null,
    date: (data.date as string | null) ?? null,
    direction: (data.direction as string | null) ?? null,
    account_name: thread?.account_name ?? null,
  };
}

async function fetchThreadHistory(threadUuid: string, excludeMessageId: string): Promise<ThreadMessage[]> {
  const canon = getCanonSupabase();
  const { data, error } = await canon
    .from("email_messages")
    .select("direction, from_address, to_addresses, body_text, date, message_id")
    .eq("thread_id", threadUuid)
    .order("date", { ascending: false })
    .limit(MAX_THREAD_MESSAGES + 1);

  if (error) throw new Error(`thread history fetch failed: ${error.message}`);

  return (data ?? [])
    .filter((m: Record<string, unknown>) => m.message_id !== excludeMessageId)
    .slice(0, MAX_THREAD_MESSAGES)
    .map((m: Record<string, unknown>) => ({
      direction: (m.direction as string | null) ?? null,
      from_address: (m.from_address as string | null) ?? null,
      to_addresses: (m.to_addresses as string | null) ?? null,
      body_text: (m.body_text as string | null) ?? null,
      date: (m.date as string | null) ?? null,
    }));
}

async function fetchAssertions(assertionIds: string[]) {
  if (assertionIds.length === 0) return [];
  const aos = getAosOperationalSupabase();
  const { data, error } = await aos
    .from("assertions")
    .select("id, assertion_type, source_quote, structured_data")
    .in("id", assertionIds);
  if (error) throw new Error(`assertions fetch failed: ${error.message}`);
  return data ?? [];
}

async function alreadyHasProposal(messageId: string): Promise<boolean> {
  const aos = getAosOperationalSupabase();
  const { data, error } = await aos
    .from("email_proposals")
    .select("id")
    .eq("inbound_message_id", messageId)
    .limit(1);
  if (error) throw new Error(`proposal idempotency check failed: ${error.message}`);
  return (data ?? []).length > 0;
}

// ---------------------------------------------------------------------------
// Drafting (LLM)
// ---------------------------------------------------------------------------

function buildUserPrompt(
  email: InboundEmail,
  history: ThreadMessage[],
  assertions: Array<{ assertion_type: string; source_quote: string; structured_data: unknown }>,
): string {
  const historyBlock = history.length
    ? history
        .reverse()
        .map(
          (m) =>
            `[${m.date ?? "?"}] ${m.direction ?? "?"} from ${m.from_address ?? "?"}\n${(m.body_text ?? "").slice(0, 600)}`,
        )
        .join("\n\n---\n\n")
    : "(no prior messages in thread)";

  const assertionsBlock = assertions.length
    ? assertions
        .map(
          (a, i) =>
            `${i + 1}. ${a.assertion_type}: "${a.source_quote}" ${JSON.stringify(a.structured_data)}`,
        )
        .join("\n")
    : "(none extracted)";

  const currentBody = (email.body_text ?? "").slice(0, MAX_BODY_CHARS);

  return `You are drafting Nick's reply to an inbound email. Apply the voice rules above.

=== CONTEXT ===

Account: ${email.account_name ?? "(unknown)"}
Subject: ${email.subject ?? "(none)"}
From: ${email.from_address ?? "(unknown)"}
To: ${email.to_addresses ?? "(unknown)"}
Cc: ${email.cc_addresses ?? "(none)"}
Date: ${email.date ?? "(unknown)"}

=== PRIOR THREAD (oldest first, last 10 messages) ===

${historyBlock}

=== THE INBOUND EMAIL TO REPLY TO ===

${currentBody}

=== EXTRACTED SIGNALS FROM THIS EMAIL ===

${assertionsBlock}

=== YOUR TASK ===

Draft a reply AND classify its tier. Return ONLY valid JSON matching this exact schema:

{
  "tier": 0 | 1 | 2 | 3,
  "tier_rationale": "1-2 sentences — why this tier",
  "draft_subject": "Re: ...",
  "draft_body": "...",
  "draft_to": ["email@example.com"],
  "draft_cc": ["email@example.com"]
}

TIER GUIDE:
  0 = Noise (newsletter, receipt, no-reply). Return minimal/empty reply; the steward will dismiss.
  1 = Templated (scheduling ack, simple thanks, one-line confirm). Reply is nearly ready to send.
  2 = Substantive, pattern-matched. The reply covers the ask cleanly.
  3 = Sensitive / high-stakes / relationship-defining. Flag for careful steward review.

Return ONLY valid JSON. No markdown fences. No preamble.`;
}

async function draftReply(
  email: InboundEmail,
  history: ThreadMessage[],
  assertions: Array<{ assertion_type: string; source_quote: string; structured_data: unknown }>,
): Promise<DraftedReply> {
  const client = new Anthropic();
  const userPrompt = buildUserPrompt(email, history, assertions);

  const msg = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    system: VOICE_REFERENCE,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = (msg.content[0] as { text: string })?.text?.trim() ?? "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned) as DraftedReply;

  if (typeof parsed.tier !== "number" || parsed.tier < 0 || parsed.tier > 3) {
    throw new Error(`invalid tier returned: ${parsed.tier}`);
  }
  if (typeof parsed.draft_body !== "string" || parsed.draft_body.length === 0) {
    throw new Error(`empty draft_body returned`);
  }
  return {
    tier: parsed.tier as 0 | 1 | 2 | 3,
    tier_rationale: String(parsed.tier_rationale ?? ""),
    draft_subject: String(parsed.draft_subject ?? `Re: ${email.subject ?? ""}`),
    draft_body: parsed.draft_body,
    draft_to: Array.isArray(parsed.draft_to) ? parsed.draft_to.map(String) : [],
    draft_cc: Array.isArray(parsed.draft_cc) ? parsed.draft_cc.map(String) : [],
  };
}

// ---------------------------------------------------------------------------
// Outbound signal extraction
// ---------------------------------------------------------------------------

const OUTBOUND_EXTRACTION_PROMPT = `Extract structured signals from a DRAFT email reply that the user (Nick Lipetzky / Konstellation AI) is about to send.

You are looking for things the SENDER (Nick) is committing to, deciding, or raising — statements that should become durable signals in Canon so nothing promised in this reply is lost.

Return ONLY valid JSON matching this schema:
{
  "decisions":   [{"text": "...", "owner": "optional"}],
  "commitments": [{"text": "...", "owner": "optional", "recipient": "optional", "due_date": "YYYY-MM-DD optional"}],
  "action_items":[{"text": "...", "assigned_to": "optional"}],
  "issues":      [{"text": "...", "severity": "low|medium|high|critical"}]
}

Rules:
- Only extract statements where Nick is the actor — things he's committing to do, deciding, or assigning to themselves.
- Issues = risks, blockers, or concerns the sender is surfacing.
- "text" must be a verbatim or near-verbatim quote from the draft (max 300 chars).
- Do NOT fabricate. Extract only what is actually in the draft.
- Empty arrays are fine.`;

async function extractOutboundSignals(draftBody: string): Promise<OutboundSignal[]> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    system: OUTBOUND_EXTRACTION_PROMPT,
    messages: [{ role: "user", content: draftBody.slice(0, MAX_BODY_CHARS) }],
  });

  const text = (msg.content[0] as { text: string })?.text?.trim() ?? "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed: {
    decisions?: Array<{ text: string; owner?: string }>;
    commitments?: Array<{ text: string; owner?: string; recipient?: string; due_date?: string }>;
    action_items?: Array<{ text: string; assigned_to?: string }>;
    issues?: Array<{ text: string; severity?: string }>;
  };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn(`[propose-email-reply] outbound extraction non-JSON response`);
    return [];
  }

  const signals: OutboundSignal[] = [];

  for (const d of parsed.decisions ?? []) {
    if (!d?.text?.trim()) continue;
    signals.push({
      assertion_type: "decision",
      source_quote: d.text.trim().slice(0, 500),
      structured_data: { direction: "outbound", ...(d.owner ? { owner: d.owner } : {}) },
      confidence: 0.75,
      confidence_band: "medium",
    });
  }
  for (const c of parsed.commitments ?? []) {
    if (!c?.text?.trim()) continue;
    const struct: Record<string, unknown> = { direction: "outbound" };
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
      structured_data: { direction: "outbound", ...(a.assigned_to ? { assigned_to: a.assigned_to } : {}) },
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
      structured_data: { direction: "outbound", ...(i.severity ? { severity: i.severity } : {}) },
      confidence: 0.65,
      confidence_band: "medium",
    });
  }

  return signals;
}

async function insertOutboundAssertions(
  signals: OutboundSignal[],
  email: InboundEmail,
  accountSlug: string,
): Promise<string[]> {
  if (signals.length === 0) return [];
  const aos = getAosOperationalSupabase();

  const validFrom = new Date().toISOString();
  const validTo = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

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
    provenance: "agent_reasoning",
    source_type: "agent",
    source_id: `email_draft:${email.message_id}`,
    source_quote: s.source_quote,
    structured_data: s.structured_data,
    confidence: s.confidence,
    confidence_band: s.confidence_band,
    entity_refs: entityRefs,
    status: "draft",
  }));

  const { data, error } = await aos.from("assertions").insert(rows).select("id");
  if (error) throw new Error(`outbound assertions insert failed: ${error.message}`);
  return (data ?? []).map((r: { id: string }) => r.id);
}

async function insertProposal(args: {
  accountId: string;
  email: InboundEmail;
  drafted: DraftedReply;
  assertionIds: string[];
}): Promise<string> {
  const aos = getAosOperationalSupabase();
  const { data, error } = await aos
    .from("email_proposals")
    .insert({
      account_id: args.accountId,
      inbound_email_uuid: args.email.id,
      inbound_message_id: args.email.message_id,
      thread_id: args.email.gmail_thread_id || args.email.thread_id,
      draft_subject: args.drafted.draft_subject,
      draft_body: args.drafted.draft_body,
      draft_to: args.drafted.draft_to,
      draft_cc: args.drafted.draft_cc,
      tier: args.drafted.tier,
      tier_rationale: args.drafted.tier_rationale,
      linked_assertion_ids: args.assertionIds,
      linked_canon_doc_ids: [],
      status: "pending",
      owning_agent: "exec_8",
    })
    .select("id")
    .single();

  if (error) throw new Error(`email_proposals insert failed: ${error.message}`);
  return data.id as string;
}

// ---------------------------------------------------------------------------
// Exported run function
// ---------------------------------------------------------------------------

export async function runProposeEmailReply(data: EmailSignalEventData): Promise<{
  proposal_id?: string;
  tier?: number;
  message_id?: string;
  skipped?: boolean;
  reason?: string;
  account_slug?: string;
}> {
  if (!PILOT_ACCOUNT_SLUGS.has(data.account_slug)) {
    return { skipped: true, reason: "outside_pilot_scope", account_slug: data.account_slug };
  }

  const exists = await alreadyHasProposal(data.message_id);
  if (exists) {
    return { skipped: true, reason: "proposal_already_exists", message_id: data.message_id };
  }

  const email = await fetchInboundEmail(data.inbound_email_uuid);
  if (!email) {
    return { skipped: true, reason: "inbound_email_not_found" };
  }
  if (email.direction !== "Inbound") {
    return { skipped: true, reason: "not_inbound" };
  }

  const history = await fetchThreadHistory(email.thread_id, email.message_id);
  const assertions = await fetchAssertions(data.assertion_ids);
  const drafted = await draftReply(email, history, assertions);
  const outboundSignals = await extractOutboundSignals(drafted.draft_body);
  const outboundAssertionIds = await insertOutboundAssertions(outboundSignals, email, data.account_slug);

  const proposalId = await insertProposal({
    accountId: TEKNOVA_ACCOUNT_ID,
    email,
    drafted,
    assertionIds: [...data.assertion_ids, ...outboundAssertionIds],
  });

  return {
    proposal_id: proposalId,
    tier: drafted.tier,
    message_id: data.message_id,
  };
}
