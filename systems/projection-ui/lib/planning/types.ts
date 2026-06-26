// Shared types for Plan Intake (descent-side: Nick's stated intent → run/iterate/build moves
// against systems). Pure — no server-only — so the surface imports them freely.
//
// The model: all work is RUN / ITERATE / BUILD a system. A build/iterate move becomes a project
// (project ≡ the system build); its steps become the project's tasks. A run move is operating a
// live system on its surface. See practices/operator-os/reference/planning-method.md.

export type SpineArea = "Client engagement" | "Prospect engagement" | "Infrastructure" | "Finance" | "Admin" | "Personal";
export type PlanMode = "build" | "iterate" | "run";

export interface ProposedIntent {
  client_engagement_pct: number;
  prospect_engagement_pct: number;
  infrastructure_pct: number;
  finance_pct: number;
  admin_pct: number;
  personal_pct: number;
  theme: string;
  rationale: string;
}

// One run/iterate/build move against a system.
export interface PlanMove {
  mode: PlanMode;
  system_name: string; // the system this move is about (existing, or a new one to build)
  system_slug: string | null; // existing system's slug; null = new system to build
  system_status: string | null; // existing status, or null for a new build
  what_it_does: string | null; // for build: the "does Y" → project outcome + system purpose
  foundational: boolean; // is this the foundation everything else depends on?
  rationale: string;
  ladder_goal_id: string | null;
  ladder_goal_title: string | null;
  area: SpineArea | null; // the project's area (build/iterate)
  steps: string[]; // build/iterate steps → tasks; run → the operating action(s)
  surface: string | null; // where a live system is run
  dedupe_note: string | null;
}

export interface PlanProposal {
  weekly_intent: ProposedIntent | null;
  moves: PlanMove[]; // foundation-first, then ordered by dependency
}

// What the surface sends to commit: approved/edited intent + moves.
export interface PlanDecision {
  weekly_intent: ProposedIntent | null;
  moves: PlanMove[]; // approved moves only
}

export interface CommittedMove {
  mode: PlanMode;
  system_name: string;
  project_id: string | null; // build/iterate create a project
  task_ids: string[];
  registered_system_slug: string | null; // a new system stub, if a build registered one
}
