// Client-safe shared types + pure helpers for the /folder (judgment-units) surface.
// NO "server-only" here: client components ("use client") import the types and helpers
// from this module. The data-fetching functions live in ./expertFolder.ts (server-only),
// which re-exports everything here so existing server importers keep one import path.
//
// Backed by canon_engine (project mzzjvoiwughcnmmqzbxv): expert_folders, judgment_units,
// activity_options, library_recipes, and the v_folder_active_units / v_current_recipes views.

export type UnitKind = "recipe_edit" | "option" | "ruling";
export type RulingKind = "constraint" | "disqualifier" | "default" | "entity_rule";
export type Standing = "proposed" | "active" | "locked";
export type Provenance = "ai_originated" | "human_injected" | "human_corrected";
export type GatePosture = "push_to_veto" | "pull_to_approve";

export interface ExpertFolder {
  folder_slug: string;
  name: string | null;
  domain: string | null;
  parent_folder_slug: string | null;
  owning_system_slug: string | null;
  status: string | null;
}

export interface JudgmentUnit {
  id: string;
  folder_slug: string;
  kind: UnitKind;
  ruling_kind: RulingKind | null;
  target_activity_id: string | null;
  target_option_id: string | null;
  target_recipe_id: string | null;
  assertion: string;
  trigger: Record<string, unknown> | null;
  reasoning: string | null;
  provenance: Provenance;
  standing: Standing;
  gate_posture: GatePosture | null;
  proposed_by: string | null;
  ratified_by: string | null;
  ratified_at: string | null;
  supersedes_id: string | null;
  retired_at: string | null;
  motion_id: string | null;
  origin_session: string | null;
  origin_activity_run: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
}

export interface ActivityOption {
  id: string;
  activity_id: string | null;
  option_slug: string;
  folder_slug: string | null;
  kind: "source" | "tactic";
  name: string;
  when_to_use: string | null;
  config: Record<string, unknown>;
  priority: number | null;
  provenance: string | null;
  standing: string | null;
  created_at: string;
}

export interface LibraryRecipe {
  recipe_id: string;
  version: number | null;
  is_current: boolean;
  folder_slug: string | null;
  name: string | null;
  description: string | null;
  control_flow: Record<string, unknown> | null;
  layer: string | null;
  overrides_recipe_id: string | null;
  viewbox: Record<string, unknown> | null;
}

// Counts by standing for a folder's judgment units, plus retired. The /folder track-record chip.
export interface FolderTrackRecord {
  proposed: number;
  active: number;
  locked: number;
  retired: number;
}

// Rank standings for ordering: proposed < active < locked. Pure — client-safe.
export function standingRank(s: Standing): number {
  return s === "proposed" ? 0 : s === "active" ? 1 : 2;
}
