import { z } from "zod";

// Pure validation schemas for the semantic moves. NO "server-only" — these are imported by
// the move functions (lib/moves/index.ts) AND by API routes / the triage UI for input
// validation, and are unit-tested directly. The DB writes live in index.ts.

export interface Provenance {
  created_by?: string;
  session_id?: string;
  owner_actor_id?: string;
  canon_ref?: string;
}

export const AREAS = [
  "Client engagement",
  "Prospect engagement",
  "Infrastructure",
  "Finance",
  "Admin",
  "Personal",
] as const;

export const ProposeGoal = z.object({
  title: z.string().min(1),
  horizon: z.string().optional(),
  why_it_matters: z.string().optional(),
  area: z.string().optional(),
  target: z.string().optional(),
  leverage: z.enum(["code", "media", "capital", "labor", "none"]).optional(),
  wealth_test: z.enum(["asset", "rented_time"]).optional(),
  rank: z.number().int().optional(),
});

export const ProposeProject = z.object({
  name: z.string().min(1),
  goal_id: z.string().uuid("a project must ladder to a goal (goal_id required)"),
  area: z.enum(AREAS),
  outcome: z.string().optional(),
  next_action: z.string().optional(),
  notes: z.string().optional(),
  system_slug: z.string().optional(), // the system this project builds/iterates (project ≡ system build)
  provenance: z.custom<Provenance>().optional(),
});

// Register a new system stub (status 'emerging') when a build move is committed. The maturity
// ladder + registry stewardship from there is Boris's (agentic-systems); this just declares the build.
export const RegisterSystem = z.object({
  name: z.string().min(1),
  purpose: z.string().optional(),
  goal_id: z.string().uuid().optional(),
});

export const ProposeTask = z
  .object({
    project_id: z.string().uuid().nullable().optional(),
    title: z.string().min(1),
    importance: z.enum(["important", "not_important"]),
    urgency: z.enum(["urgent", "not_urgent"]),
    first_5_minutes: z.string().min(1, "every task needs a concrete first-5-minutes"),
    due: z.string().optional(),
    recurring: z.boolean().optional(),
    notes: z.string().optional(),
    allowOrphan: z.boolean().optional(),
    provenance: z.custom<Provenance>().optional(),
  })
  .refine((v) => v.project_id || v.allowOrphan, {
    message: "a task must belong to a project unless allowOrphan is set",
    path: ["project_id"],
  });

export const UpdateTaskStatus = z.object({
  task_id: z.string().uuid(),
  new_status: z.enum(["open", "completed", "dropped"]),
  completion_date: z.string().optional(),
});

export const UpdateProjectStatus = z.object({
  project_id: z.string().uuid(),
  new_status: z.enum(["active", "done", "dropped"]),
  closed_date: z.string().optional(),
});

export const SetWeeklyIntent = z
  .object({
    week_of: z.string(),
    client_engagement_pct: z.number().int().min(0).max(100),
    prospect_engagement_pct: z.number().int().min(0).max(100),
    infrastructure_pct: z.number().int().min(0).max(100),
    finance_pct: z.number().int().min(0).max(100),
    admin_pct: z.number().int().min(0).max(100),
    personal_pct: z.number().int().min(0).max(100),
    theme: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (v) => {
      const sum =
        v.client_engagement_pct +
        v.prospect_engagement_pct +
        v.infrastructure_pct +
        v.finance_pct +
        v.admin_pct +
        v.personal_pct;
      return sum >= 95 && sum <= 105;
    },
    { message: "area percentages must sum to ~100" },
  );

export const AddToConsider = z.object({
  title: z.string().min(1),
  relevance: z.string().optional(),
  when_tag: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
});

export const PromoteCaptureItem = z.object({
  item_id: z.string().uuid(),
  promoted_to: z.string().min(1, "promote must record the spine id it became"),
  note: z.string().optional(),
});

export const CloseCaptureItem = z.object({
  item_id: z.string().uuid(),
  status: z.enum(["deferred", "resolved", "dismissed"]),
  resolved_note: z.string().min(1, "closing an item requires a reason"),
});

export const LogConversation = z.object({
  session_id: z.string().uuid().optional(),
  title: z.string().min(1),
  summary: z.string().optional(),
  key_decisions: z.string().optional(),
  action_items: z.string().optional(),
  canon_refs: z.array(z.string()).optional(),
  asset_refs: z.array(z.string()).optional(),
  related_session_id: z.string().uuid().optional(),
  next_session_pointer: z.string().optional(),
  model: z.string().optional(),
});

/** Turn a ZodError into a single readable message; rethrow anything else. */
export function parseMove<T>(schema: z.ZodType<T>, input: unknown, move: string): T {
  const r = schema.safeParse(input);
  if (!r.success) {
    const issues = r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    throw new Error(`${move} rejected: ${issues}`);
  }
  return r.data;
}
