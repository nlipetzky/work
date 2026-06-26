import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { getAosOperationalSupabase } from "../lib/aos-operational.js";

const AOS_INFRA_ID = "4ea800ed-2532-44b4-8f3b-a1acad31db8d";

const RoadmapCandidateSchema = z.object({
  candidates: z.array(z.object({
    effort_name: z.string().describe("Short title for the roadmap item (5-10 words)"),
    description: z.string().describe("One-line summary of what needs to happen"),
    acceptance_criteria: z.string().describe("How to know this is done"),
    priority: z.number().int().describe("Priority 1-10. 1=highest, 10=lowest. Most meeting items are 5-7."),
    source_type: z.enum(["decision", "promise", "feature_request", "issue"]),
    is_strategic_shift: z.boolean().describe("True if this changes project direction or reprioritizes existing work — requires approval. False for execution work."),
    source_text: z.string().describe("The original text this was derived from"),
  })).describe("Actionable items worth tracking. Omit noise, vague observations, and items already clearly tracked."),
});

type RoadmapCandidate = z.infer<typeof RoadmapCandidateSchema>["candidates"][number];

interface ExtractionRow {
  id: string;
  account_id: string;
  meeting_title: string | null;
  meeting_date: string | null;
  decisions: Array<{ text: string; owner?: string }>;
  promises: Array<{ text: string; owner?: string; recipient?: string; due_date?: string }>;
  feature_requests: Array<{ text: string; requested_by?: string }>;
  issues: Array<{ text: string; severity?: string }>;
}

async function fetchPendingExtractions(extractionId?: string): Promise<ExtractionRow[]> {
  const aos = getAosOperationalSupabase();

  let query = aos
    .from("meeting_extractions")
    .select("id, account_id, meeting_title, meeting_date, decisions, promises, feature_requests, issues")
    .eq("processing_status", "complete")
    .eq("aos_roadmap_item_ids", "{}");

  if (extractionId) {
    query = query.eq("id", extractionId);
  } else {
    query = query.order("meeting_date", { ascending: false }).limit(20);
  }

  const { data, error } = await query;
  if (error) throw new Error(`meeting_extractions fetch failed: ${error.message}`);
  return (data ?? []) as unknown as ExtractionRow[];
}

function buildEvaluationPrompt(extraction: ExtractionRow): string {
  const sections: string[] = [];

  sections.push(`Meeting: ${extraction.meeting_title ?? "Untitled"}`);
  sections.push(`Date: ${extraction.meeting_date ?? "unknown"}`);

  if (extraction.decisions?.length) {
    sections.push("\nDecisions made:");
    extraction.decisions.forEach((d) =>
      sections.push(`  - ${d.text}${d.owner ? ` (owner: ${d.owner})` : ""}`),
    );
  }

  if (extraction.promises?.length) {
    sections.push("\nCommitments made:");
    extraction.promises.forEach((p) => {
      const parts = [p.text];
      if (p.owner) parts.push(`owner: ${p.owner}`);
      if (p.recipient) parts.push(`to: ${p.recipient}`);
      if (p.due_date) parts.push(`by: ${p.due_date}`);
      sections.push(`  - ${parts.join(", ")}`);
    });
  }

  if (extraction.feature_requests?.length) {
    sections.push("\nFeature requests:");
    extraction.feature_requests.forEach((f) => sections.push(`  - ${f.text}`));
  }

  if (extraction.issues?.length) {
    sections.push("\nIssues/blockers raised:");
    extraction.issues.forEach((i) =>
      sections.push(`  - [${i.severity ?? "unknown"}] ${i.text}`),
    );
  }

  return sections.join("\n");
}

export async function runMeetingToRoadmap(opts?: {
  extractionId?: string;
  lookbackHours?: number;
}): Promise<{
  processed: number;
  total: number;
  roadmapItemsCreated: number;
  approvalQueueEntries: number;
  extractionResults: Array<{ extractionId: string; roadmapIds: string[]; queuedCount: number }>;
}> {
  const extractions = await fetchPendingExtractions(opts?.extractionId);

  if (extractions.length === 0) {
    return { processed: 0, total: 0, roadmapItemsCreated: 0, approvalQueueEntries: 0, extractionResults: [] };
  }

  const results: Array<{ extractionId: string; roadmapIds: string[]; queuedCount: number }> = [];

  for (const extraction of extractions) {
    const totalItems =
      (extraction.decisions?.length ?? 0) +
      (extraction.promises?.length ?? 0) +
      (extraction.feature_requests?.length ?? 0) +
      (extraction.issues?.length ?? 0);

    if (totalItems === 0) {
      const aos = getAosOperationalSupabase();
      await aos.from("meeting_extractions").update({ aos_roadmap_item_ids: ["__none__"] }).eq("id", extraction.id);
      continue;
    }

    const content = buildEvaluationPrompt(extraction);
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: RoadmapCandidateSchema,
      system: `You are a project manager reviewing meeting intelligence for an AI consulting firm.
Evaluate the extracted items and identify those that represent concrete, actionable work items.

Rules:
- Only include items with clear scope and outcome. Discard vague observations, and items that are discussions not action items.
- Each item must independently justify its own roadmap entry — not part of a larger item. Do not duplicate or split items unnecessarily.
- is_strategic_shift = true ONLY if the item changes project direction, cancels existing work, or shifts priorities — requires human approval before proceeding.
- priority 1-3 = urgent/client-facing, 4-6 = normal backlog, 7-10 = nice-to-have.`,
      prompt: `Review these meeting extractions and identify roadmap candidates:\n\n${content}`,
    });

    const candidates: RoadmapCandidate[] = (object as { candidates: RoadmapCandidate[] }).candidates;

    if (candidates.length === 0) {
      const aos = getAosOperationalSupabase();
      await aos.from("meeting_extractions").update({ aos_roadmap_item_ids: ["__none__"] }).eq("id", extraction.id);
      continue;
    }

    const aos = getAosOperationalSupabase();
    const insertedIds: string[] = [];
    let queued = 0;
    const meetingLabel = `${extraction.meeting_title ?? "meeting"} (${extraction.meeting_date ?? "unknown date"})`;

    for (const candidate of candidates) {
      const accountId = extraction.account_id ?? AOS_INFRA_ID;

      if (candidate.is_strategic_shift) {
        await aos.from("approval_queue").insert({
          account_id: accountId,
          agent_id: "forge_8",
          action_type: "other",
          action_spec: {
            type: "roadmap_strategic_shift",
            effort_name: candidate.effort_name,
            description: candidate.description,
            acceptance_criteria: candidate.acceptance_criteria,
            priority: candidate.priority,
            source_type: candidate.source_type,
            source_text: candidate.source_text,
            meeting_extraction_id: extraction.id,
          },
          reasoning: `Strategic priority shift proposed from ${meetingLabel}: "${candidate.effort_name}"`,
        });
        queued++;
      } else {
        const { data, error } = await aos
          .from("roadmap")
          .insert({
            effort_name: candidate.effort_name,
            description: candidate.description,
            acceptance_criteria: candidate.acceptance_criteria,
            priority: candidate.priority,
            account_id: accountId,
            status: "not started",
            owned_by: "forge_8",
            notes: `Sourced from ${meetingLabel}. Source type: ${candidate.source_type}. Original: "${candidate.source_text}"`,
          })
          .select("id")
          .single();
        if (!error && data) insertedIds.push(data.id as string);
      }
    }

    const trackingIds = insertedIds.length > 0 ? insertedIds : ["__none__"];
    await aos.from("meeting_extractions").update({ aos_roadmap_item_ids: trackingIds }).eq("id", extraction.id);

    results.push({ extractionId: extraction.id, roadmapIds: insertedIds, queuedCount: queued });
  }

  return {
    processed: results.length,
    total: extractions.length,
    roadmapItemsCreated: results.reduce((n, r) => n + r.roadmapIds.length, 0),
    approvalQueueEntries: results.reduce((n, r) => n + r.queuedCount, 0),
    extractionResults: results,
  };
}
