import "server-only";
import { canonDb } from "@/lib/canon";
import { structuredCall, MODELS } from "@/lib/ai";
import { proposeTask, proposeProject, addToConsider, promoteCaptureItem, closeCaptureItem } from "@/lib/moves";
import type { TriageProposal, TriageDecision, CommittedItem, TriageVerdict, PromoteShape, SpineArea } from "@/lib/protocol/types";

// Step 2 — Triage (the interactive core). Atlas PRE-COMPUTES a proposed verdict + ladder + dedupe
// per open capture_item (model = called function). Nick approves/overrides per item. On commit the
// writes go through the ENFORCED semantic moves — never raw CRUD. Inbox ends empty.

interface OpenItem {
  id: string;
  title: string;
  body: string | null;
  item_type: string;
  source: string;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
}

const TRIAGE_SCHEMA = {
  type: "object" as const,
  properties: {
    verdict: { type: "string", enum: ["do", "delegate", "automate", "drop"] },
    shape: { type: "string", enum: ["task", "project", "consider", "close"], description: "How it lands on the spine. 'close' = not new work (dupe, already handled, or just info)." },
    ladder_goal_id: { type: ["string", "null"], description: "id of the active goal this work advances, or null if it ladders to none." },
    dedupe_note: { type: ["string", "null"], description: "If it duplicates an existing project/task, name it; else null." },
    rationale: { type: "string", description: "One sentence: why this verdict + shape." },
    draft_title: { type: "string" },
    importance: { type: "string", enum: ["important", "not_important"] },
    urgency: { type: "string", enum: ["urgent", "not_urgent"] },
    first_5_minutes: { type: "string", description: "Concrete first move if shape=task." },
    area: { type: "string", enum: ["Client engagement", "Prospect engagement", "Infrastructure", "Finance", "Admin", "Personal"] },
    close_status: { type: "string", enum: ["deferred", "resolved", "dismissed"] },
    close_note: { type: "string" },
  },
  required: ["verdict", "shape", "rationale", "draft_title"],
};

interface TriageModelOut {
  verdict: TriageVerdict;
  shape: PromoteShape;
  ladder_goal_id: string | null;
  dedupe_note: string | null;
  rationale: string;
  draft_title: string;
  importance?: "important" | "not_important";
  urgency?: "urgent" | "not_urgent";
  first_5_minutes?: string;
  area?: SpineArea;
  close_status?: "deferred" | "resolved" | "dismissed";
  close_note?: string;
}

const SYSTEM = `You are Atlas, Nick's chief of staff, triaging his inbox (capture_items) against his work spine.
For one inbound item, decide:
- verdict: do | delegate | automate | drop (the aspirational-hourly-rate call).
- shape: task (actionable, belongs under a project) | project (a new multi-step effort under a goal) | consider (someday/maybe, an idea/option) | close (NOT new work — a duplicate, already handled, or just information).
- ladder it to the active goal it advances (ladder_goal_id), or null.
- dedupe: if it already exists on the spine, set dedupe_note and prefer shape=close.
Rules: action_item usually -> task; idea/option -> consider; decision/question with no action -> close. A task needs a concrete first_5_minutes. Be terse. Default to close (deferred) when uncertain rather than inventing work.
SYSTEMS-FIRST first_5_minutes: the systems do the work, not Nick's hands. Frame the first move as triggering the system that produces this output, or building it if none is live (route to Boris / Forge). Only prescribe manual work when it's irreducibly human (a decision, relationship, or approval). Never tell Nick to hand-produce what a system should make.`;

export async function precomputeTriage(): Promise<TriageProposal[]> {
  const db = canonDb();
  const { data: items, error } = await db
    .from("capture_items")
    .select("id, title, body, item_type, source, created_by, metadata")
    .eq("status", "open")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`precomputeTriage failed: ${error.message}`);
  const open = (items ?? []) as OpenItem[];
  if (!open.length) return [];

  // Spine context for laddering + dedupe (compact).
  const [{ data: goals }, { data: projects }, { data: tasks }] = await Promise.all([
    db.from("goals").select("id, title, area").eq("status", "active").order("rank"),
    db.from("projects").select("id, name, goal_id").eq("status", "active"),
    db.from("tasks").select("title").eq("status", "open").limit(60),
  ]);
  const goalById = new Map((goals ?? []).map((g: any) => [g.id, g.title]));
  const context =
    `ACTIVE GOALS:\n${(goals ?? []).map((g: any) => `- ${g.id} :: ${g.title} [${g.area ?? "?"}]`).join("\n")}\n\n` +
    `ACTIVE PROJECTS:\n${(projects ?? []).map((p: any) => `- ${p.name}`).join("\n")}\n\n` +
    `OPEN TASK TITLES:\n${(tasks ?? []).map((t: any) => `- ${t.title}`).join("\n")}`;

  // One call per item (sonnet; cheap at volume).
  const proposals = await Promise.all(
    open.map(async (item) => {
      const canonRef = (item.metadata?.source_ref as string | undefined) ?? null;
      const out = await structuredCall<TriageModelOut>({
        model: MODELS.triage,
        system: SYSTEM,
        schemaName: "triage_decision",
        schema: TRIAGE_SCHEMA,
        prompt:
          `${context}\n\nINBOUND ITEM:\n- type: ${item.item_type}\n- source: ${item.source} (by ${item.created_by ?? "?"})\n- title: ${item.title}\n- body: ${item.body ?? "(none)"}\n\nTriage it.`,
      });
      const proposal: TriageProposal = {
        item_id: item.id,
        title: item.title,
        item_type: item.item_type,
        source: item.source,
        created_by: item.created_by,
        verdict: out.verdict,
        shape: out.shape,
        ladder_goal_id: out.ladder_goal_id ?? null,
        ladder_goal_title: out.ladder_goal_id ? goalById.get(out.ladder_goal_id) ?? null : null,
        dedupe_note: out.dedupe_note ?? null,
        rationale: out.rationale,
        draft: {
          title: out.draft_title,
          importance: out.importance,
          urgency: out.urgency,
          first_5_minutes: out.first_5_minutes,
          goal_id: out.ladder_goal_id ?? null,
          area: out.area,
          close_status: out.close_status ?? "deferred",
          close_note: out.close_note ?? out.rationale,
          canon_ref: canonRef ?? undefined,
        },
      };
      return proposal;
    }),
  );
  return proposals;
}

// Apply Nick's approved/overridden decisions via the enforced moves. runId → provenance.
export async function commitTriage(runId: string, decisions: TriageDecision[]): Promise<CommittedItem[]> {
  const committed: CommittedItem[] = [];
  for (const d of decisions) {
    const prov = { created_by: "atlas", session_id: runId, canon_ref: d.draft.canon_ref };
    if (d.shape === "task") {
      const { id } = await proposeTask({
        title: d.draft.title,
        project_id: d.draft.project_id ?? null,
        allowOrphan: !d.draft.project_id,
        importance: d.draft.importance ?? "not_important",
        urgency: d.draft.urgency ?? "not_urgent",
        first_5_minutes: d.draft.first_5_minutes ?? "Open the item and define the first concrete move.",
        provenance: prov,
      });
      await promoteCaptureItem({ item_id: d.item_id, promoted_to: `task:${id}`, note: "promoted via triage" });
      committed.push({ item_id: d.item_id, shape: "task", spine_id: id });
    } else if (d.shape === "project") {
      if (!d.draft.goal_id || !d.draft.area) throw new Error(`commitTriage: project for ${d.item_id} needs goal_id + area`);
      const { id } = await proposeProject({
        name: d.draft.title,
        goal_id: d.draft.goal_id,
        area: d.draft.area,
        outcome: d.draft.outcome,
        provenance: prov,
      });
      await promoteCaptureItem({ item_id: d.item_id, promoted_to: `project:${id}`, note: "promoted via triage" });
      committed.push({ item_id: d.item_id, shape: "project", spine_id: id });
    } else if (d.shape === "consider") {
      const { id } = await addToConsider({ title: d.draft.title, notes: d.draft.close_note });
      await promoteCaptureItem({ item_id: d.item_id, promoted_to: `consider:${id}`, note: "filed to Consider via triage" });
      committed.push({ item_id: d.item_id, shape: "consider", spine_id: id });
    } else {
      await closeCaptureItem({
        item_id: d.item_id,
        status: d.draft.close_status ?? "deferred",
        resolved_note: d.draft.close_note ?? "closed via triage",
      });
      committed.push({ item_id: d.item_id, shape: "close", spine_id: null });
    }
  }
  return committed;
}

export async function openItemCount(): Promise<number> {
  const { count, error } = await canonDb().from("capture_items").select("id", { count: "exact", head: true }).eq("status", "open");
  if (error) throw new Error(`openItemCount failed: ${error.message}`);
  return count ?? 0;
}
