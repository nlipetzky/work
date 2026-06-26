import "server-only";
import type { z } from "zod";
import { canonDb } from "@/lib/canon";
import {
  type Provenance,
  ProposeGoal,
  ProposeProject,
  ProposeTask,
  UpdateTaskStatus,
  UpdateProjectStatus,
  SetWeeklyIntent,
  AddToConsider,
  PromoteCaptureItem,
  CloseCaptureItem,
  LogConversation,
  RegisterSystem,
  parseMove as parse,
} from "@/lib/moves/schemas";

// ── Enforced semantic-move write layer (reliability component #1) ───────────────────────
// The ONLY path that writes the operator spine. Every durable change to goals/projects/tasks/
// weekly_intent/consider/capture_items/agent_sessions goes through a validated move here —
// never raw .insert() elsewhere. Validation schemas live in ./schemas (pure, unit-tested);
// these functions do the service-role writes against the live canon_engine schema.
//
// SERVER-ONLY. Never import into a "use client" file — these use the service-role key.

export type { Provenance } from "@/lib/moves/schemas";

const PROVENANCE_DEFAULT = { created_by: "atlas", owner_actor_id: "operator-os" } as const;

/** Compact provenance string stored in spine `source` columns (tasks have no provenance cols). */
function sourceTag(p?: Provenance): string {
  const by = p?.created_by ?? PROVENANCE_DEFAULT.created_by;
  return p?.session_id ? `${by}:${p.session_id}` : by;
}

/** Append a canon_ref to a notes body without clobbering existing notes. */
function withCanonRef(notes: string | undefined, p?: Provenance): string | null {
  const parts = [notes?.trim(), p?.canon_ref ? `canon_ref: ${p.canon_ref}` : null].filter(Boolean);
  return parts.length ? parts.join("\n") : null;
}

function slugify(s: string): string {
  const base = s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "item";
  return `${base}-${crypto.randomUUID().slice(0, 4)}`;
}

const db = () => canonDb();

// ── Goals ───────────────────────────────────────────────────────────────────────────────
export async function proposeGoal(input: z.input<typeof ProposeGoal>): Promise<{ id: string }> {
  const v = parse(ProposeGoal, input, "proposeGoal");
  const { data, error } = await db()
    .from("goals")
    .insert({ slug: slugify(v.title), status: "active", ...v })
    .select("id")
    .single();
  if (error) throw new Error(`proposeGoal failed: ${error.message}`);
  return data as { id: string };
}

// ── Projects ────────────────────────────────────────────────────────────────────────────
export async function proposeProject(input: z.input<typeof ProposeProject>): Promise<{ id: string }> {
  const v = parse(ProposeProject, input, "proposeProject");
  const { data, error } = await db()
    .from("projects")
    .insert({
      slug: slugify(v.name),
      name: v.name,
      goal_id: v.goal_id,
      area: v.area,
      outcome: v.outcome ?? null,
      next_action: v.next_action ?? null,
      status: "active",
      system_slug: v.system_slug ?? null,
      notes: withCanonRef(v.notes, v.provenance),
    })
    .select("id")
    .single();
  if (error) throw new Error(`proposeProject failed: ${error.message}`);
  return data as { id: string };
}

// Declare a new system to build (status 'emerging'). Returns the generated slug.
export async function registerSystem(input: z.input<typeof RegisterSystem>): Promise<{ system_slug: string }> {
  const v = parse(RegisterSystem, input, "registerSystem");
  const slug = slugify(v.name);
  const { error } = await db()
    .from("systems")
    .insert({ system_slug: slug, name: v.name, status: "emerging", purpose: v.purpose ?? null, depends_on: [], goal_id: v.goal_id ?? null });
  if (error) throw new Error(`registerSystem failed: ${error.message}`);
  return { system_slug: slug };
}

// ── Tasks ───────────────────────────────────────────────────────────────────────────────
export async function proposeTask(input: z.input<typeof ProposeTask>): Promise<{ id: string }> {
  const v = parse(ProposeTask, input, "proposeTask");
  const { data, error } = await db()
    .from("tasks")
    .insert({
      title: v.title,
      project_id: v.project_id ?? null,
      status: "open",
      importance: v.importance,
      urgency: v.urgency,
      first_5_minutes: v.first_5_minutes,
      due: v.due ?? null,
      recurring: v.recurring ?? false,
      source: sourceTag(v.provenance),
      notes: withCanonRef(v.notes, v.provenance),
    })
    .select("id")
    .single();
  if (error) throw new Error(`proposeTask failed: ${error.message}`);
  return data as { id: string };
}

export async function updateTaskStatus(input: z.input<typeof UpdateTaskStatus>): Promise<void> {
  const v = parse(UpdateTaskStatus, input, "updateTaskStatus");
  const patch: Record<string, unknown> = { status: v.new_status };
  if (v.new_status === "completed") patch.completed = v.completion_date ?? new Date().toISOString().slice(0, 10);
  const { error } = await db().from("tasks").update(patch).eq("id", v.task_id);
  if (error) throw new Error(`updateTaskStatus failed: ${error.message}`);
}

export async function updateProjectStatus(input: z.input<typeof UpdateProjectStatus>): Promise<void> {
  const v = parse(UpdateProjectStatus, input, "updateProjectStatus");
  const patch: Record<string, unknown> = { status: v.new_status };
  if (v.new_status !== "active") patch.closed = v.closed_date ?? new Date().toISOString().slice(0, 10);
  const { error } = await db().from("projects").update(patch).eq("id", v.project_id);
  if (error) throw new Error(`updateProjectStatus failed: ${error.message}`);
}

// ── Weekly intent ─────────────────────────────────────────────────────────────────────────
export async function setWeeklyIntent(input: z.input<typeof SetWeeklyIntent>): Promise<{ id: string }> {
  const v = parse(SetWeeklyIntent, input, "setWeeklyIntent");
  // one row per week: upsert on week_of so re-declaring the current week overwrites.
  const { data, error } = await db()
    .from("weekly_intent")
    .upsert({ ...v, status: "active" }, { onConflict: "week_of" })
    .select("id")
    .single();
  if (error) throw new Error(`setWeeklyIntent failed: ${error.message}`);
  return data as { id: string };
}

// ── Consider (someday/maybe) ───────────────────────────────────────────────────────────────
export async function addToConsider(input: z.input<typeof AddToConsider>): Promise<{ id: string }> {
  const v = parse(AddToConsider, input, "addToConsider");
  const { data, error } = await db().from("consider").insert(v).select("id").single();
  if (error) throw new Error(`addToConsider failed: ${error.message}`);
  return data as { id: string };
}

// ── Capture-item triage terminal states ─────────────────────────────────────────────────────
export async function promoteCaptureItem(input: z.input<typeof PromoteCaptureItem>): Promise<void> {
  const v = parse(PromoteCaptureItem, input, "promoteCaptureItem");
  const { error } = await db()
    .from("capture_items")
    .update({ status: "promoted", promoted_to: v.promoted_to, resolved_note: v.note ?? null })
    .eq("id", v.item_id);
  if (error) throw new Error(`promoteCaptureItem failed: ${error.message}`);
}

export async function closeCaptureItem(input: z.input<typeof CloseCaptureItem>): Promise<void> {
  const v = parse(CloseCaptureItem, input, "closeCaptureItem");
  const { error } = await db()
    .from("capture_items")
    .update({ status: v.status, resolved_note: v.resolved_note })
    .eq("id", v.item_id);
  if (error) throw new Error(`closeCaptureItem failed: ${error.message}`);
}

// ── Session log (reliability component #2: the Stop step) ────────────────────────────────────
export async function logConversation(input: z.input<typeof LogConversation>): Promise<{ id: string }> {
  const v = parse(LogConversation, input, "logConversation");
  const row: Record<string, unknown> = {
    system_slug: "operator-os",
    persona: "atlas",
    title: v.title,
    summary: v.summary ?? null,
    key_decisions: v.key_decisions ?? null,
    action_items: v.action_items ?? null,
    canon_refs: v.canon_refs?.length ? v.canon_refs.join("\n") : null, // column is text, not array
    asset_refs: v.asset_refs?.length ? v.asset_refs.join("\n") : null,
    related_session_id: v.related_session_id ?? null,
    model: v.model ?? null,
    ended: new Date().toISOString(),
    metadata: v.next_session_pointer ? { next_session_pointer: v.next_session_pointer } : {},
  };
  if (v.session_id) row.id = v.session_id; // make the run id the session id so logs round-trip
  const { data, error } = await db().from("agent_sessions").insert(row).select("id").single();
  if (error) throw new Error(`logConversation failed: ${error.message}`);
  return data as { id: string };
}

// NOTE: add_notification is specified in CLAUDE.md but there is no `notifications` table in
// canon_engine yet — intentionally omitted from v1 rather than writing a phantom move.
