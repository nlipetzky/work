import { createClaudeClient } from "@canon-engine/ingestion/pipelines/adapters/index.js";
import { deriveQuadrant } from "@canon-engine/ingestion/pipelines/email-ingest.js";
import { getCanonSupabase } from "./deps.js";

const CLASSIFICATION_PROMPT = `You are an expert email analyst for a consulting firm. Given an email thread subject, summary, and latest message body, classify its urgency and importance.

Return a JSON object with exactly these fields:
- urgency: A number from 0 to 1 indicating time-sensitivity. 1.0 = needs response today, 0.7 = this week, 0.4 = eventually, 0.0 = no time pressure at all.
- importance: A number from 0 to 1 indicating business impact. 1.0 = deal-critical or relationship-defining, 0.7 = meaningful business impact, 0.4 = routine but relevant, 0.0 = noise or irrelevant.
- classificationRationale: A single sentence explaining why you rated urgency and importance this way.

Return ONLY valid JSON, no markdown fences or extra text.`;

const BATCH_SIZE = 10;

export async function runBackfillEmailClassification(opts?: {
  threadId?: string;
  limit?: number;
}): Promise<{
  classified: number;
  total: number;
}> {
  const supabase = getCanonSupabase();
  const claude = createClaudeClient();

  let q = supabase
    .from("email_threads")
    .select("id, thread_id, subject, thread_summary, action_items")
    .is("quadrant", null)
    .order("thread_last_activity", { ascending: false });

  if (opts?.threadId) {
    q = q.eq("thread_id", opts.threadId);
  } else {
    q = q.limit(opts?.limit ?? 200);
  }

  const { data: threads, error } = await q;
  if (error) throw new Error(`Failed to fetch threads: ${error.message}`);

  if (!threads || threads.length === 0) {
    return { classified: 0, total: 0 };
  }

  let classified = 0;

  for (let i = 0; i < threads.length; i += BATCH_SIZE) {
    const batch = threads.slice(i, i + BATCH_SIZE);
    const batchResults: Array<{
      id: string;
      urgency: number;
      importance: number;
      quadrant: string;
      rationale: string;
    }> = [];

    for (const thread of batch) {
      const { data: messages } = await supabase
        .from("email_messages")
        .select("body_text, from_address, subject")
        .eq("thread_id", thread.id)
        .order("date", { ascending: false })
        .limit(1);

      const messageBody = messages?.[0]?.body_text?.slice(0, 2000) ?? "";

      const userPrompt = [
        `Subject: ${thread.subject}`,
        thread.thread_summary ? `Summary: ${thread.thread_summary}` : "",
        thread.action_items ? `Action items: ${thread.action_items}` : "",
        messageBody ? `Latest message:\n${messageBody}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      try {
        const result = (await claude.completeJSON({
          system: CLASSIFICATION_PROMPT,
          user: userPrompt,
          maxTokens: 256,
        })) as Record<string, unknown>;

        const urgency =
          typeof result.urgency === "number" ? Math.max(0, Math.min(1, result.urgency)) : 0.5;
        const importance =
          typeof result.importance === "number"
            ? Math.max(0, Math.min(1, result.importance))
            : 0.5;

        batchResults.push({
          id: thread.id,
          urgency,
          importance,
          quadrant: deriveQuadrant(urgency, importance),
          rationale: (result.classificationRationale as string) ?? "",
        });
      } catch (err) {
        console.error(`[backfill] Failed to classify thread ${thread.id}:`, err);
      }
    }

    for (const r of batchResults) {
      await supabase
        .from("email_threads")
        .update({
          urgency: r.urgency,
          importance: r.importance,
          quadrant: r.quadrant,
          classification_rationale: r.rationale,
        })
        .eq("id", r.id);
    }

    classified += batchResults.length;
  }

  return { classified, total: threads.length };
}
