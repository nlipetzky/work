/**
 * Canon — Process Meeting Intelligence
 * Ported from workflows/canon/process-meeting-intelligence.ts (Inngest wrapper removed).
 *
 * Reads ingested transcripts from Canon/UKB, extracts structured intelligence via Claude
 * (decisions, promises, issues, expectations, feature_requests, conflicts, classification),
 * and writes to AOS Operational `meeting_extractions` table.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAosOperationalSupabase } from "../lib/aos-operational.js";

function getCanonSupabase(): SupabaseClient {
  return createClient(
    process.env["CANON_SUPABASE_URL"]!,
    process.env["CANON_SUPABASE_SERVICE_KEY"]!,
  );
}

const ExtractionSchema = z.object({
  decisions: z.array(z.object({
    text: z.string(),
    owner: z.string().optional(),
    rationale: z.string().optional(),
  })).describe("Concrete decisions made during the meeting"),
  promises: z.array(z.object({
    text: z.string(),
    owner: z.string().optional(),
    recipient: z.string().optional(),
    due_date: z.string().optional(),
  })).describe("Explicit commitments made by any party"),
  issues: z.array(z.object({
    text: z.string(),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
    category: z.string().optional(),
  })).describe("Problems, blockers, risks, or concerns raised"),
  expectations: z.array(z.object({
    text: z.string(),
    from_party: z.string().optional(),
    regarding: z.string().optional(),
  })).describe("What parties expect from each other going forward"),
  feature_requests: z.array(z.object({
    text: z.string(),
    requested_by: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
  })).describe("Requests for new capabilities, features, or changes"),
  conflicts: z.array(z.object({
    topic: z.string(),
    parties: z.array(z.string()).optional(),
    resolution: z.string().optional(),
  })).optional().describe("Disagreements or tensions (if any)"),
  classification: z.object({
    tone: z.enum(["positive", "neutral", "tense", "mixed"]).optional(),
    health: z.enum(["green", "yellow", "red"]).optional(),
    urgency: z.enum(["low", "medium", "high"]).optional(),
    meeting_phase: z.enum(["discovery", "delivery", "feedback", "escalation", "internal", "other"]).optional(),
  }).optional().describe("Overall relationship and meeting signals"),
  engagement_type: z.enum(["discovery", "delivery", "feedback", "escalation", "internal", "other"]),
});

type ExtractionResult = z.infer<typeof ExtractionSchema>;

interface TranscriptRow {
  id: string;
  transcript_title: string | null;
  meeting_date: string | null;
  account_name: string | null;
  meeting_type: string | null;
  participants: string | null;
  summary: string | null;
  key_decisions: string | null;
  action_items: string | null;
  raw_transcript_text: string | null;
}

function normalizeAccountName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function resolveAccountId(accountName: string | null): Promise<string> {
  const AOS_INFRA_ID = "4ea800ed-2532-44b4-8f3b-a1acad31db8d";
  if (!accountName) return AOS_INFRA_ID;

  const aos = getAosOperationalSupabase();
  const { data } = await aos.from("accounts").select("id, account_name");
  const target = normalizeAccountName(accountName);

  const match = (data ?? []).find((row) => {
    const normalized = normalizeAccountName(row.account_name as string);
    return normalized.includes(target) || target.includes(normalized);
  });

  return (match?.id as string) ?? AOS_INFRA_ID;
}

async function fetchUnprocessedTranscripts(
  transcriptId?: string,
  lookbackHours = 72,
): Promise<TranscriptRow[]> {
  const canon = getCanonSupabase();
  const aos = getAosOperationalSupabase();

  const { data: existing } = await aos
    .from("meeting_extractions")
    .select("transcript_id")
    .neq("processing_status", "failed")
    .not("transcript_id", "is", null);

  const processedIds = new Set(
    (existing ?? []).map((r) => r.transcript_id as string).filter(Boolean),
  );

  const fields = [
    "id", "transcript_title", "meeting_date", "account_name", "meeting_type",
    "participants", "summary", "key_decisions", "action_items", "raw_transcript_text",
  ].join(", ");

  let query = canon.from("transcripts").select(fields);

  if (transcriptId) {
    query = query.eq("id", transcriptId);
  } else {
    const cutoff = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", cutoff);
  }

  const { data, error } = await query
    .order("meeting_date", { ascending: false })
    .limit(processedIds.size + 20);

  if (error) throw new Error(`Canon transcript fetch failed: ${error.message}`);

  const unprocessed = ((data ?? []) as unknown as TranscriptRow[]).filter((t) => !processedIds.has(t.id));
  return unprocessed.slice(0, 20);
}

function buildExtractionPrompt(transcript: TranscriptRow): string {
  return `You are a meeting intelligence extractor. Analyze the meeting content and extract structured intelligence.

Meeting: ${transcript.transcript_title ?? "Untitled"}
Date: ${transcript.meeting_date ?? "unknown"}
Account: ${transcript.account_name ?? "unknown"}
Type: ${transcript.meeting_type ?? "unknown"}
Participants: ${transcript.participants ?? "not specified"}

Extract only what is explicitly stated or clearly implied. Return empty arrays for categories with no content. Do not fabricate.

Fields:
- decisions: concrete decisions made
- promises: commitments made ("I will...", "We'll...", "By next week...")
- issues: problems, blockers, risks, concerns raised
- expectations: what parties expect from each other
- feature_requests: requests for new capabilities or changes
- conflicts: disagreements or tensions (empty array if none)
- classification: tone, health signal (green/yellow/red), urgency, meeting_phase
- engagement_type: dominant type (discovery/delivery/feedback/escalation/internal/other)`;
}

export async function runProcessMeetingIntelligence(opts?: {
  transcriptId?: string;
  lookbackHours?: number;
}): Promise<{
  processed: number;
  total: number;
  extractions: Array<{ transcriptId: string; extractionId: string; engagementType: string }>;
}> {
  const transcriptId = opts?.transcriptId;
  const lookbackHours = opts?.lookbackHours ?? 72;

  const transcripts = await fetchUnprocessedTranscripts(transcriptId, lookbackHours);

  if (transcripts.length === 0) {
    return { processed: 0, total: 0, extractions: [] };
  }

  const results: Array<{ transcriptId: string; extractionId: string; engagementType: string }> = [];

  for (const transcript of transcripts) {
    const aos = getAosOperationalSupabase();

    const { data: existing } = await aos
      .from("meeting_extractions")
      .select("id, processing_status")
      .eq("transcript_id", transcript.id)
      .maybeSingle();

    if (existing && existing.processing_status !== "failed") continue;

    const accountId = await resolveAccountId(transcript.account_name);
    const meetingDate = transcript.meeting_date
      ? new Date(transcript.meeting_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const { data: claimed, error: claimErr } = await aos
      .from("meeting_extractions")
      .insert({
        account_id: accountId,
        transcript_id: transcript.id,
        meeting_date: meetingDate,
        meeting_title: transcript.transcript_title,
        attendees: transcript.participants ? [transcript.participants] : [],
        engagement_type: "other",
        processing_status: "processing",
      })
      .select("id")
      .single();

    if (claimErr) {
      console.error(`[process-meeting-intelligence] claim failed for ${transcript.id}: ${claimErr.message}`);
      continue;
    }

    const extractionId = claimed.id as string;

    const content = [
      transcript.raw_transcript_text,
      transcript.summary,
      transcript.key_decisions,
      transcript.action_items,
    ]
      .filter(Boolean)
      .join("\n\n---\n\n");

    let extraction: ExtractionResult | null = null;

    if (content.trim()) {
      try {
        const { object } = await generateObject({
          model: anthropic("claude-sonnet-4-6"),
          schema: ExtractionSchema,
          system: buildExtractionPrompt(transcript),
          prompt: `Analyze this meeting content and extract structured intelligence:\n\n${content.substring(0, 80000)}`,
        });
        extraction = object as ExtractionResult;
      } catch (err) {
        console.error(`[process-meeting-intelligence] extraction failed for ${transcript.id}:`, err);
      }
    }

    const update: Record<string, unknown> = {
      processing_status: extraction ? "complete" : "failed",
      updated_at: new Date().toISOString(),
    };

    if (extraction) {
      update["decisions"] = extraction.decisions;
      update["promises"] = extraction.promises;
      update["issues"] = extraction.issues;
      update["expectations"] = extraction.expectations;
      update["feature_requests"] = extraction.feature_requests;
      update["conflicts"] = extraction.conflicts ?? [];
      update["classification"] = extraction.classification ?? null;
      update["engagement_type"] = extraction.engagement_type;
    }

    const { error: writeErr } = await aos
      .from("meeting_extractions")
      .update(update)
      .eq("id", extractionId);

    if (writeErr) {
      console.error(`[process-meeting-intelligence] write failed for ${extractionId}: ${writeErr.message}`);
      continue;
    }

    if (extraction) {
      results.push({ transcriptId: transcript.id, extractionId, engagementType: extraction.engagement_type });
    }
  }

  return { processed: results.length, total: transcripts.length, extractions: results };
}
