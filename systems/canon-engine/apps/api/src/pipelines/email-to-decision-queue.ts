/**
 * Canon — Email Classification → Decision Queue
 * Ported from workflows/canon/email-to-decision-queue.ts (Inngest wrapper removed).
 *
 * Monitors email_threads (Canon/UKB) for urgent_important classification and writes
 * approval_queue entries (AOS Operational) so Nick can review high-priority emails.
 * Deduplication: checks approval_queue for existing entries keyed on email_thread_id.
 */
import { createClient } from "@supabase/supabase-js";
import { getAosOperationalSupabase } from "../lib/aos-operational.js";

const TEKNOVA_ID = "0e5aa792-2130-4942-9f9d-5cb6513659b3";
const INSTIG8_ID = "03180256-bb8b-4421-8adf-c1fe3567958d";
const AOS_INFRA_ID = "4ea800ed-2532-44b4-8f3b-a1acad31db8d";

interface EmailThread {
  id: string;
  thread_id: string;
  subject: string | null;
  thread_summary: string | null;
  action_items: string | null;
  urgency: number | null;
  importance: number | null;
  quadrant: string | null;
  classification_rationale: string | null;
  thread_last_activity: string | null;
}

function getCanonSupabase() {
  return createClient(
    process.env["CANON_SUPABASE_URL"]!,
    process.env["CANON_SUPABASE_SERVICE_KEY"]!,
  );
}

function resolveAccountIdFromThread(thread: EmailThread): string {
  const text = [thread.subject ?? "", thread.thread_summary ?? ""].join(" ").toLowerCase();
  if (text.includes("teknova") || text.includes("konstellationai") || text.includes("ellie")) {
    return TEKNOVA_ID;
  }
  if (text.includes("instig8") || text.includes("nick")) {
    return INSTIG8_ID;
  }
  return AOS_INFRA_ID;
}

export async function runEmailToDecisionQueue(): Promise<{
  found: number;
  new: number;
  enqueued: number;
}> {
  const canon = getCanonSupabase();
  const { data, error } = await canon
    .from("email_threads")
    .select(
      "id, thread_id, subject, thread_summary, action_items, urgency, importance, quadrant, classification_rationale, thread_last_activity",
    )
    .eq("quadrant", "urgent_important")
    .order("thread_last_activity", { ascending: false })
    .limit(50);

  if (error) throw new Error(`email_threads fetch failed: ${error.message}`);
  const urgentThreads = (data ?? []) as EmailThread[];

  if (urgentThreads.length === 0) {
    return { found: 0, new: 0, enqueued: 0 };
  }

  const aos = getAosOperationalSupabase();
  const { data: existing } = await aos
    .from("approval_queue")
    .select("action_spec")
    .eq("action_type", "other")
    .in("status", ["pending", "approved", "rejected"]);

  const alreadyQueuedIds = new Set(
    ((existing ?? []) as Array<{ action_spec: Record<string, unknown> }>)
      .filter((row) => row.action_spec?.type === "email_review")
      .map((row) => row.action_spec.email_thread_id as string)
      .filter(Boolean),
  );

  const newThreads = urgentThreads.filter((t) => !alreadyQueuedIds.has(t.id));

  if (newThreads.length === 0) {
    return { found: urgentThreads.length, new: 0, enqueued: 0 };
  }

  let count = 0;
  for (const thread of newThreads) {
    const accountId = resolveAccountIdFromThread(thread);
    const subject = thread.subject ?? "(no subject)";
    const { error: insertErr } = await aos.from("approval_queue").insert({
      account_id: accountId,
      agent_id: "canon-email-classifier",
      action_type: "other",
      action_spec: {
        type: "email_review",
        email_thread_id: thread.id,
        thread_id: thread.thread_id,
        subject,
        summary: thread.thread_summary,
        action_items: thread.action_items,
        classification_rationale: thread.classification_rationale,
        urgency: thread.urgency,
        importance: thread.importance,
        last_activity: thread.thread_last_activity,
      },
      reasoning: `Email classified urgent_important — review needed: "${subject}"`,
      status: "pending",
    });
    if (!insertErr) count++;
  }

  return { found: urgentThreads.length, new: newThreads.length, enqueued: count };
}
