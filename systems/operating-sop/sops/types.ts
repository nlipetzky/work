// Three-layer work model — TypeScript interfaces for the hand-authored SOP
// definitions in this folder. Mirrors the object model described in
// `practices/agentic-systems/reference/three-layer-work-model.md`.
//
// Slice 1 hand-authors SOPs as TS. When the canon schema (SPEC §5:
// sops/sop_stages/workflows/activities + contracts + drift) lands, these
// interfaces become the row shapes.

// ─── State enums ───────────────────────────────────────────────────────────

// L1 stage conformance verdict (the SOP layer).
export type StageStatus =
  | "pending"      // not started
  | "in_progress"  // some L2 workflow is running for this stage
  | "done"         // a contracted workflow produced the required end state
  | "deviated"     // events arrived out of order vs the declared spine
  | "blocked";     // an L3 below it is blocked (system unwired)

// L2 workflow run state.
export type WorkflowStatus =
  | "open"         // running or partially complete
  | "closed"       // success
  | "failed"
  | "blocked";     // any contained L3 is blocked

// L3 activity execution state (OpenTelemetry-style: ok > error > unset).
// `blocked` is a slice-1 extension meaning "the runner/system is not wired."
export type ActivityStatus =
  | "unset"
  | "ok"
  | "error"
  | "blocked";

// L3 executor class — how the activity actually runs.
export type ExecutorClass =
  | "automated-tool"     // pure code / SQL / API call, no human or model in the loop
  | "agent-loop"         // AI in the loop (Claude or other LLM)
  | "human-in-the-loop"; // operator review / approval

// L2 control flow attribute — fixed pre-authored vs. agent chooses at runtime.
export type ControlFlow = "fixed" | "agent-driven";

// Supabase project ids that activities can bind to.
export type ProjectId =
  | "mzzjvoiwughcnmmqzbxv" // canon-engine
  | "mrmnyscurmkfppicqqhk"; // revops-engine

// ─── L3: Activity binding ──────────────────────────────────────────────────

export interface ActivityDataBinding {
  table: string;            // e.g. "canon.prospects" or "staging.companies_<batch>"
  project_id: ProjectId;
  columns?: string[];       // notable columns/predicates
}

export interface ActivityTrigger {
  type: "cron" | "manual" | "upstream-event" | "sql-rpc";
  detail: string;
}

export interface ActivityRunner {
  type: "node-script" | "sql-rpc" | "n8n-workflow" | "none";
  path?: string;            // absolute path for node-script; RPC name for sql-rpc
  args?: string[];          // PLAN-mode args (no `--execute`)
  cwd?: string;             // working directory for spawn (so .env loads correctly)
  // EXECUTE-mode flag conventions handled at the Run API route, not in data.
}

export interface ActivityAi {
  model: string;            // e.g. "claude-sonnet-4-6"
  prompt_path?: string;     // absolute path read server-side by the inspector
  prompt_path_note?: string; // explanation when the path is missing or templated
}

export interface ActivitySeeIt {
  surface: string;          // projection-ui URL, e.g. "/prospects"
  description?: string;
}

export interface ActivityChangeIt {
  file?: string;            // absolute path to the file to edit
  line?: number;            // specific line number
  note?: string;
}

export interface Activity {
  activity_id: string;
  name: string;
  what: string;             // one-line description for the inspector
  executor_class: ExecutorClass;
  owning_system: string;            // slug, e.g. "canon-engine"
  owning_system_folder: string;     // absolute path; used by Open-in-Claude-Code
  data: ActivityDataBinding;
  trigger: ActivityTrigger;
  runner: ActivityRunner;
  ai?: ActivityAi;
  reads: string[];
  writes: string[];
  see_it: ActivitySeeIt;
  change_it: ActivityChangeIt;

  // Static fallback when live compute is unavailable / not yet wired.
  // `blocked` always wins over live compute (slice-1 rule).
  static_status?: ActivityStatus;
  block_reason?: string;    // required when static_status === "blocked"

  // Slice-1 tag: gates EXECUTE-mode in the Run button. Credit-spenders show a
  // confirm panel before running.
  credit_spender?: boolean;
}

// ─── L2: Workflow ──────────────────────────────────────────────────────────

export interface WorkflowNode {
  node_id: string;          // stable slug, unique within a workflow
  activity_id: string;      // Contract B: workflow_activities binding (inline)
  label: string;            // node display label
  position: { x: number; y: number }; // fixed SVG layout for slice-1
}

export interface WorkflowEdge {
  from: string;             // node_id
  to: string;               // node_id
  branch?: "default" | "edge" | "fail";
  label?: string;           // edge label, e.g. "unreachable"
}

export interface Workflow {
  workflow_id: string;
  name: string;
  control_flow: ControlFlow;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];

  // SVG viewBox for slice-1 fixed layout. Phase C consumes this directly.
  viewbox: { width: number; height: number };
}

// ─── L1: SOP spine ─────────────────────────────────────────────────────────

export interface SopStage {
  stage_id: string;
  order: number;
  name: string;             // verbatim from the SOP markdown
  required_end_state: string; // declarative: what the stage produces
  gate_type?: "decision" | "approval" | "automated";

  // Contract A (L1↔L2): workflows that produce this stage's end state.
  // MANY-TO-MANY in canon; here a stage references zero or more workflows.
  // A stage with no workflow_ids is an L1-only stub in slice 1.
  workflow_ids: string[];
}

export interface Sop {
  sop_id: string;
  name: string;
  description: string;
  // Note: a Sop is venture-agnostic. Per-invocation context (which venture,
  // which engagement, when started) lives on a SopRun. The relationship is
  // ONE SOP : MANY runs — the SOP body never mentions a specific engagement.
  stages: SopStage[];
}

// ─── SopRun: one invocation of an SOP against a target ────────────────────

export interface SopRun {
  run_id: string;
  sop_id: string;
  target_engagement: string; // e.g. "konstellation-cipo"
  started_at: string;        // ISO timestamp
  // Status is derived from stage rollup, not stored.
}

// ─── Bundle: an authored SOP + its workflows + its activities + its runs ───

export interface SopBundle {
  sop: Sop;
  workflows: Workflow[];
  activities: Activity[];
  runs: SopRun[];            // slice 1: hand-authored; slice 2+: canon.sop_runs
}
