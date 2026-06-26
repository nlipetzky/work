import "server-only";
import { canonDb } from "@/lib/canon";
import { structuredCall, MODELS } from "@/lib/ai";
import { listSystemsForRouting } from "@/lib/queries/systems";
import { normalizeIntent, reconcileMoves, hasRealSurface, type SystemRef } from "@/lib/planning/guards";
import { systemStates } from "@/lib/queries/systemState";
import { isRunnable } from "@/lib/systemState";
import type { PlanProposal, PlanMove, ProposedIntent } from "@/lib/planning/types";

// Plan Intake driver — Nick's plain-language intent → run/iterate/build moves against systems.
// ONE model call (AI as a called function), wrapped in deterministic guards. READ-ONLY.

const SCHEMA = {
  type: "object" as const,
  properties: {
    weekly_intent: {
      type: ["object", "null"],
      description: "A weekly allocation ONLY if the text implies priorities for the week; else null. Six integer percentages summing to ~100.",
      properties: {
        client_engagement_pct: { type: "number" }, prospect_engagement_pct: { type: "number" }, infrastructure_pct: { type: "number" },
        finance_pct: { type: "number" }, admin_pct: { type: "number" }, personal_pct: { type: "number" },
        theme: { type: "string" }, rationale: { type: "string" },
      },
    },
    moves: {
      type: "array",
      items: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["build", "iterate", "run"], description: "run an existing live system, iterate one, or build a new one." },
          system_name: { type: "string", description: "the system this is about (existing from the inventory, or a new one to build)." },
          system_slug: { type: ["string", "null"], description: "the existing system's slug from the inventory, or null if it's a new system to build." },
          what_it_does: { type: ["string", "null"], description: "for a build: what the new system does, one line (the 'does Y')." },
          foundational: { type: "boolean", description: "true if this is the foundation everything else depends on (usually the system that produces the inputs others need)." },
          ladder_goal_id: { type: ["string", "null"] },
          area: { type: ["string", "null"], enum: ["Client engagement", "Prospect engagement", "Infrastructure", "Finance", "Admin", "Personal", null] },
          steps: { type: "array", items: { type: "string" }, description: "for build/iterate: the build steps (become tasks). for run: the operating action(s)." },
          surface: { type: ["string", "null"], description: "for run: where the live system is operated." },
          dedupe_note: { type: ["string", "null"] },
          rationale: { type: "string" },
        },
        required: ["mode", "system_name", "foundational", "steps", "rationale"],
      },
    },
  },
  required: ["moves"],
};

const SYSTEM = `You are Atlas, Nick's chief of staff. Nick's ENTIRE workload is three things, always against a SYSTEM:
RUN an existing live system, ITERATE an existing system, or BUILD a new system. Plus a little irreducible human work (a decision, relationship, approval).
Given a plain-language intent + Nick's live systems and spine, return moves:
- Resolve the intent to systems. For each need, decide: does a LIVE system already do this (run/iterate it), or does none exist (build it)?
- FOUNDATION FIRST: the foundational move is the system whose OUTPUT everything else depends on. If that system isn't live, the foundational move is to BUILD it. A downstream system whose inputs don't exist yet is NOT the next move, however urgent it looks. (e.g. a 'demand-context' system that produces the offer/copy/TAM/targeting is foundational; a 'website' is a downstream output.)
- HONESTY: a system is runnable ONLY if it has a real surface (shown above). NEVER propose a 'run' move for a system marked NO SURFACE, and never imply Nick can open something that doesn't exist. If the work needs a system that has no surface or isn't built, it is a BUILD move (build the system AND its surface).
- A build/iterate move's steps are the build steps (they become the project's tasks). The project IS the system build. Don't invent manual deliverables — frame the work as building the system that produces the output.
- Ladder each move to an existing active goal (ladder_goal_id) — never invent ids. DEDUPE against existing projects/systems (set dedupe_note).
- Also propose weekly_intent (six %s + theme) if the text implies priorities, else null.
Be terse. Only as many moves as the intent warrants.`;

interface ModelOut { weekly_intent: ProposedIntent | null; moves: PlanMove[] }

export async function proposePlan(text: string): Promise<PlanProposal> {
  const db = canonDb();
  const [{ data: goals }, { data: projects }, systems, states, { data: intent }] = await Promise.all([
    db.from("goals").select("id, title, area, leverage, why_it_matters").eq("status", "active").order("rank"),
    db.from("projects").select("name, system_slug").eq("status", "active"),
    listSystemsForRouting(),
    systemStates(),
    db.from("weekly_intent").select("week_of, theme").order("week_of", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const goalsById = new Map((goals ?? []).map((g: any) => [g.id, g.title]));
  const runnableOf = (slug: string) => { const st = states.get(slug); return st ? isRunnable(st) : false; };
  const refOf = (s: { system_slug: string; status: string | null; runs_surface: string | null }): SystemRef =>
    ({ slug: s.system_slug, status: s.status, surface: s.runs_surface, runnable: runnableOf(s.system_slug) });
  const systemsBySlug = new Map<string, SystemRef>(systems.map((s) => [s.system_slug, refOf(s)]));
  const systemsByName = new Map<string, SystemRef>(systems.map((s) => [s.name.trim().toLowerCase(), refOf(s)]));

  const context =
    `ACTIVE GOALS (ladder to the one whose PURPOSE fits):\n${(goals ?? []).map((g: any) => `- ${g.id} :: ${g.title} [${g.area ?? "?"}] — ${(g.why_it_matters ?? "").slice(0, 160)}`).join("\n")}\n\n` +
    `SYSTEMS — the bracket shows the EVIDENCED state (computed from real activities/assets/triggers), NOT the self-reported label. Most are stubs (planned, not built). Run/iterate only beta+operating systems; BUILD everything else:\n${systems.map((s) => `- ${s.system_slug} :: ${s.name} [${states.get(s.system_slug)?.state ?? "stub"}] ${hasRealSurface(s.runs_surface) ? `surface: ${s.runs_surface}` : "NO SURFACE"} — ${(s.purpose ?? "").slice(0, 80)}`).join("\n")}\n\n` +
    `ACTIVE PROJECTS (system builds in flight): ${(projects ?? []).map((p: any) => `${p.name}${p.system_slug ? ` →${p.system_slug}` : ""}`).join("; ")}\n\n` +
    `CURRENT WEEKLY INTENT: ${intent ? `${intent.week_of} — "${intent.theme}"` : "none"}`;

  const out = await structuredCall<ModelOut>({
    model: MODELS.judgment,
    system: SYSTEM,
    schemaName: "plan_proposal",
    schema: SCHEMA,
    maxTokens: 2600,
    prompt: `${context}\n\nNICK'S INTENT:\n${text}\n\nReturn weekly_intent (or null) and the run/iterate/build moves, foundation first.`,
  });

  return {
    weekly_intent: normalizeIntent(out.weekly_intent ?? null),
    moves: reconcileMoves(out.moves ?? [], goalsById, systemsBySlug, systemsByName),
  };
}
