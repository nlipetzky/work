import "server-only";
import { canonDb } from "@/lib/canon";

// The standardized "anatomy of a system" read model. One system resolved by slug,
// plus its run layer (activities) and typed implementation inventory (assets), all
// from canon_engine. Mirrors practices/agentic-systems/reference/system-anatomy.md.

export interface SystemRow {
  id: string;
  system_slug: string;
  name: string;
  status: string | null;
  system_type: string | null;
  class: string | null;
  constellation: string | null;
  definition_maturity: string | null;
  purpose: string | null;
  owner: string | null;
  client: string | null;
  inputs: string | null;
  outputs: string | null;
  key_metrics: string | null;
  process_state_location: string | null;
  ai_context_location: string | null;
  loop_pattern: string | null;
  guardrails: string | null;
  observability_locations: string | null;
  success_criteria: string | null;
  depends_on: string[] | null;
  startup_instructions: string | null;
  runs_surface: string | null;
  goal_id: string | null;
  last_reconciled: string | null;
}

export interface SysActivity {
  id: string;
  name: string;
  description: string | null;
  current_automation_level: string | null;
  target_automation_level: string | null;
  channel: string | null;
  architecture: string | null;
  ai_role: string | null;
  context_contract: string | null;
  ensured: boolean | null;
  verification: string | null;
  owner: string | null;
}

export interface SysAsset {
  id: string;
  name: string | null;
  asset_type: string | null;
  lifecycle_state: string | null;
  external_id: string | null;
  source_path: string | null;
  url: string | null;
  deployed_version: string | null;
  last_verified: string | null;
  write_owner: string | null;
  reconciled_against_reality: boolean | null;
  notes: string | null;
  activity_id: string | null;
}

export interface TriggerRoute {
  id: string;
  target_type: string;
  target_name: string;
  target_locator: string | null;
  action: string | null;
  autonomous: boolean;
}
export interface SysTrigger {
  id: string;
  name: string;
  event_type: string;
  source: string | null;
  condition: string | null;
  status: string;
  executor: string | null;
  schedule: string | null;
  last_fired_at: string | null;
  routes: TriggerRoute[];
}

export interface WorkspacePoll {
  account_email: string;
  last_polled_at: string | null;
  processed_count: number;
  updated_at: string | null;
}

export interface SystemAnatomy {
  system: SystemRow;
  goalTitle: string | null;
  activities: SysActivity[];
  assets: SysAsset[];
  triggers: SysTrigger[];
  workspacePolls: WorkspacePoll[];
}

const SYS_COLS =
  "id, system_slug, name, status, system_type, class, constellation, definition_maturity, purpose, owner, client, inputs, outputs, key_metrics, process_state_location, ai_context_location, loop_pattern, guardrails, observability_locations, success_criteria, depends_on, startup_instructions, runs_surface, goal_id, last_reconciled";

export async function getSystemAnatomy(slug: string): Promise<SystemAnatomy | null> {
  const db = canonDb();
  const { data: sys, error } = await db.from("systems").select(SYS_COLS).eq("system_slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!sys) return null;
  const system = sys as SystemRow;

  const [goalRes, actsRes, assetsRes, trigRes] = await Promise.all([
    system.goal_id
      ? db.from("goals").select("title").eq("id", system.goal_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    db
      .from("activities")
      .select("id,name,description,current_automation_level,target_automation_level,channel,architecture,ai_role,context_contract,ensured,verification,owner")
      .eq("system_id", system.id)
      .order("name"),
    db
      .from("assets")
      .select("id,name,asset_type,lifecycle_state,external_id,source_path,url,deployed_version,last_verified,write_owner,reconciled_against_reality,notes,activity_id")
      .eq("system_id", system.id)
      .order("asset_type", { ascending: true, nullsFirst: false })
      .order("name"),
    db
      .from("system_triggers")
      .select("id,name,event_type,source,condition,status,executor,schedule,last_fired_at")
      .eq("system_id", system.id)
      .order("status"),
  ]);
  if (actsRes.error) throw new Error(actsRes.error.message);
  if (assetsRes.error) throw new Error(assetsRes.error.message);
  if (trigRes.error) throw new Error(trigRes.error.message);

  const trigBase = (trigRes.data ?? []) as Omit<SysTrigger, "routes">[];
  let routesByTrigger: Record<string, TriggerRoute[]> = {};
  if (trigBase.length > 0) {
    const { data: routeData, error: rErr } = await db
      .from("trigger_routes")
      .select("id,trigger_id,target_type,target_name,target_locator,action,autonomous")
      .in("trigger_id", trigBase.map((t) => t.id))
      .order("sort");
    if (rErr) throw new Error(rErr.message);
    routesByTrigger = (routeData ?? []).reduce<Record<string, TriggerRoute[]>>((acc, r) => {
      const { trigger_id, ...route } = r as TriggerRoute & { trigger_id: string };
      (acc[trigger_id] ??= []).push(route);
      return acc;
    }, {});
  }
  const triggers: SysTrigger[] = trigBase.map((t) => ({ ...t, routes: routesByTrigger[t.id] ?? [] }));

  // Upstream poll health: only meaningful when this system has a Workspace-poll trigger.
  // Sourced live from canon_transcript_state (the poller's own state), so cadence and
  // per-account coverage are real, not described.
  let workspacePolls: WorkspacePoll[] = [];
  const hasWorkspacePoll = triggers.some((t) => t.event_type === "schedule" && /workspace/i.test(t.source ?? ""));
  if (hasWorkspacePoll) {
    const { data: pollData, error: pErr } = await db
      .from("canon_transcript_state")
      .select("account_email,last_polled_at,processed_transcripts,updated_at")
      .order("last_polled_at", { ascending: false, nullsFirst: false });
    if (pErr) throw new Error(pErr.message);
    workspacePolls = (pollData ?? []).map((r) => {
      const row = r as { account_email: string; last_polled_at: string | null; processed_transcripts: unknown[] | null; updated_at: string | null };
      return {
        account_email: row.account_email,
        last_polled_at: row.last_polled_at,
        processed_count: Array.isArray(row.processed_transcripts) ? row.processed_transcripts.length : 0,
        updated_at: row.updated_at,
      };
    });
  }

  return {
    system,
    goalTitle: (goalRes.data as { title: string } | null)?.title ?? null,
    activities: (actsRes.data ?? []) as SysActivity[],
    assets: (assetsRes.data ?? []) as SysAsset[],
    triggers,
    workspacePolls,
  };
}
