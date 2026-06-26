/**
 * POST /webhook/transcript
 *
 * Cannon-Engine → Paperclip wake bridge.
 * Ported from packages/v3-ui/src/app/api/cannon/transcript-event/route.ts
 * and packages/v3-ui/src/lib/cannon-bridge/route-transcript.ts.
 *
 * Status semantics:
 *   200 — wake created or idempotent replay (Supabase OK)
 *   400 — bad payload or routing miss (Supabase will NOT retry — by design)
 *   401 — bad shared secret
 *   500 — transient (Supabase will retry with exponential backoff)
 *
 * Required env:
 *   CANNON_BRIDGE_WEBHOOK_SECRET   — shared secret with the Supabase webhook
 *   PAPERCLIP_API_URL              — e.g. https://paperclip.example.com
 *   PAPERCLIP_BRIDGE_API_KEY       — long-lived service-agent token
 *   PAPERCLIP_BRIDGE_COMPANY_ID    — the Paperclip company id where AMs live
 */

import { getCanonSupabase } from "../pipelines/deps.js";
import { makeRouter } from "../lib/router.js";

// ---------------------------------------------------------------------------
// Types (ported from route-transcript.ts verbatim)
// ---------------------------------------------------------------------------

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema?: string;
  record: TranscriptRecord | null;
  old_record?: TranscriptRecord | null;
}

interface TranscriptRecord {
  id: string;
  account_name?: string | null;
  title?: string | null;
  meeting_date?: string | null;
  meeting_type?: string | null;
  participants?: unknown;
  source_url?: string | null;
  google_doc_url?: string | null;
  drive_file_id?: string | null;
  account_id?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

interface AccountRoutingRow {
  account_name: string;
  account_manager_agent_id: string;
  paperclip_account_id: string | null;
  is_active: boolean | null;
}

type RouteOutcome =
  | { kind: "wake_created"; issueId: string; identifier?: string | null }
  | { kind: "wake_deduped"; reason: string }
  | { kind: "ignored"; reason: string }
  | { kind: "routing_miss"; reason: string }
  | { kind: "bad_payload"; reason: string }
  | { kind: "transient_error"; reason: string };

interface RouteDeps {
  routingDb: { from(table: string): ReturnType<ReturnType<typeof getCanonSupabase>["from"]> };
  paperclipApiUrl: string;
  paperclipApiKey: string;
  paperclipCompanyId: string;
  fetchImpl?: typeof fetch;
}

// ---------------------------------------------------------------------------
// Pure routing logic (ported from route-transcript.ts verbatim)
// ---------------------------------------------------------------------------

const PAPERCLIP_TIMEOUT_MS = 15_000;

async function routeTranscriptEvent(
  payload: SupabaseWebhookPayload,
  deps: RouteDeps,
): Promise<RouteOutcome> {
  if (!payload || payload.type !== "INSERT") {
    return { kind: "ignored", reason: `non-INSERT event: ${payload?.type ?? "unknown"}` };
  }
  if (payload.table !== "transcripts") {
    return { kind: "ignored", reason: `wrong table: ${payload.table}` };
  }
  const record = payload.record;
  if (!record || typeof record.id !== "string" || !record.id) {
    return { kind: "bad_payload", reason: "record.id missing" };
  }
  const accountName = (record.account_name ?? "").trim();
  if (!accountName) {
    return { kind: "routing_miss", reason: `transcript ${record.id} has no account_name` };
  }

  let routing: AccountRoutingRow | null = null;
  try {
    const { data, error } = await deps.routingDb
      .from("account_routing")
      .select("account_name, account_manager_agent_id, paperclip_account_id, is_active")
      .eq("account_name", accountName)
      .maybeSingle();
    if (error) {
      return { kind: "transient_error", reason: `account_routing query failed: ${error.message}` };
    }
    routing = (data as AccountRoutingRow | null) ?? null;
  } catch (err) {
    return { kind: "transient_error", reason: `account_routing query threw: ${(err as Error).message}` };
  }
  if (!routing) {
    return { kind: "routing_miss", reason: `no account_routing row for "${accountName}"` };
  }
  if (routing.is_active === false) {
    return { kind: "ignored", reason: `account_routing for "${accountName}" is inactive` };
  }

  const wake = buildWakePayload(record, routing);
  const idempotencyKey = `transcript-${record.id}`;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const url = `${trimTrailingSlash(deps.paperclipApiUrl)}/api/companies/${encodeURIComponent(deps.paperclipCompanyId)}/issues`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PAPERCLIP_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${deps.paperclipApiKey}`,
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(wake),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    return { kind: "transient_error", reason: `paperclip request failed: ${(err as Error).message}` };
  }
  clearTimeout(timeout);

  if (response.status === 409) {
    return { kind: "wake_deduped", reason: `paperclip 409 for ${idempotencyKey}` };
  }
  if (response.status >= 500) {
    const body = await safeText(response);
    return { kind: "transient_error", reason: `paperclip 5xx (${response.status}): ${body.slice(0, 300)}` };
  }
  if (response.status >= 400) {
    const body = await safeText(response);
    return { kind: "routing_miss", reason: `paperclip ${response.status} creating issue: ${body.slice(0, 300)}` };
  }

  let created: { id?: string; identifier?: string | null } = {};
  try {
    created = (await response.json()) as { id?: string; identifier?: string | null };
  } catch {
    // empty body — treat as success without id
  }
  return { kind: "wake_created", issueId: created.id ?? "", identifier: created.identifier ?? null };
}

interface PaperclipIssuePayload {
  title: string;
  description: string;
  assigneeAgentId: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "todo";
}

function buildWakePayload(record: TranscriptRecord, routing: AccountRoutingRow): PaperclipIssuePayload {
  const transcriptTitle = (record.title ?? "untitled meeting").trim() || "untitled meeting";
  const meetingDate = record.meeting_date ?? record.created_at ?? null;
  const meetingType = record.meeting_type ?? "unspecified";
  const sourceUrl = record.source_url ?? record.google_doc_url ?? null;
  const driveFileId = record.drive_file_id ?? null;
  const participants = formatParticipants(record.participants);
  const accountId = record.account_id ?? routing.paperclip_account_id ?? null;

  const lines = [
    "## New transcript ingested",
    "",
    `- **transcript_id:** \`${record.id}\``,
    `- **account:** ${routing.account_name}${accountId ? ` (account_id: ${accountId})` : ""}`,
    `- **meeting_date:** ${meetingDate ?? "unknown"}`,
    `- **meeting_type:** ${meetingType}`,
    `- **title:** ${transcriptTitle}`,
  ];
  if (participants) lines.push(`- **participants:** ${participants}`);
  if (sourceUrl) lines.push(`- **source:** ${sourceUrl}`);
  else if (driveFileId) lines.push(`- **drive_file_id:** \`${driveFileId}\``);
  lines.push("", "Vector queries against Cannon-Engine stay inside this agent.");

  return {
    title: `New transcript: ${transcriptTitle}`,
    description: lines.join("\n"),
    assigneeAgentId: routing.account_manager_agent_id,
    priority: "medium",
    status: "todo",
  };
}

function formatParticipants(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const parts = value
      .map((p) => {
        if (typeof p === "string") return p;
        if (p && typeof p === "object") {
          const o = p as Record<string, unknown>;
          return (o.email as string) ?? (o.name as string) ?? null;
        }
        return null;
      })
      .filter((p): p is string => Boolean(p));
    return parts.length ? parts.join(", ") : null;
  }
  return null;
}

function trimTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

async function safeText(res: Response): Promise<string> {
  try { return await res.text(); } catch { return ""; }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// ---------------------------------------------------------------------------
// Hono route
// ---------------------------------------------------------------------------

const router = makeRouter();

router.post("/transcript", async (c) => {
  const expectedSecret = process.env.CANNON_BRIDGE_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("[cannon-bridge] CANNON_BRIDGE_WEBHOOK_SECRET is not set");
    return c.json({ error: "bridge misconfigured: webhook secret missing" }, 500);
  }
  const presented = c.req.header("x-supabase-webhook-secret");
  if (!presented || !timingSafeEqual(presented, expectedSecret)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  let payload: SupabaseWebhookPayload;
  try {
    payload = (await c.req.json()) as SupabaseWebhookPayload;
  } catch (err) {
    return c.json({ error: `invalid JSON: ${(err as Error).message}` }, 400);
  }

  const paperclipApiUrl = process.env.PAPERCLIP_API_URL;
  const paperclipApiKey = process.env.PAPERCLIP_BRIDGE_API_KEY;
  const paperclipCompanyId = process.env.PAPERCLIP_BRIDGE_COMPANY_ID;
  if (!paperclipApiUrl || !paperclipApiKey || !paperclipCompanyId) {
    console.error("[cannon-bridge] Paperclip env vars missing", {
      hasUrl: Boolean(paperclipApiUrl),
      hasKey: Boolean(paperclipApiKey),
      hasCompanyId: Boolean(paperclipCompanyId),
    });
    return c.json({ error: "bridge misconfigured: paperclip env missing" }, 500);
  }

  const outcome = await routeTranscriptEvent(payload, {
    routingDb: getCanonSupabase(),
    paperclipApiUrl,
    paperclipApiKey,
    paperclipCompanyId,
  });

  switch (outcome.kind) {
    case "wake_created":
      console.log(`[cannon-bridge] wake_created issue=${outcome.identifier ?? outcome.issueId}`);
      return c.json({ ok: true, status: "wake_created", issueId: outcome.issueId, identifier: outcome.identifier ?? null }, 200);
    case "wake_deduped":
      console.log(`[cannon-bridge] wake_deduped: ${outcome.reason}`);
      return c.json({ ok: true, status: "wake_deduped", reason: outcome.reason }, 200);
    case "ignored":
      return c.json({ ok: true, status: "ignored", reason: outcome.reason }, 200);
    case "routing_miss":
      console.warn(`[cannon-bridge] routing_miss: ${outcome.reason}`);
      return c.json({ ok: false, status: "routing_miss", reason: outcome.reason }, 400);
    case "bad_payload":
      return c.json({ ok: false, status: "bad_payload", reason: outcome.reason }, 400);
    case "transient_error":
      console.error(`[cannon-bridge] transient_error: ${outcome.reason}`);
      return c.json({ ok: false, status: "transient_error", reason: outcome.reason }, 500);
    default: {
      const exhaustive: never = outcome;
      return c.json({ error: `unhandled outcome: ${JSON.stringify(exhaustive)}` }, 500);
    }
  }
});

export default router;
