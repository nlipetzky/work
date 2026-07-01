import "server-only";
import { canonDb } from "@/lib/canon";
import type {
  ExpertFolder, JudgmentUnit, ActivityOption, LibraryRecipe, FolderTrackRecord,
  UnitKind, RulingKind, Standing, Provenance, GatePosture,
} from "./expertFolder-shared";

// Client-safe types + pure helpers live in ./expertFolder-shared (no server-only) so "use client"
// components can import them. Re-export here so existing server importers keep one import path.
export * from "./expertFolder-shared";

// Reads for the /folder (judgment-units) surface. Pure-canon: everything reads from
// canon_engine (project mzzjvoiwughcnmmqzbxv) via the service-role client. Active units read
// the v_folder_active_units view (standing in active,locked AND retired_at is null); proposed
// units read the base judgment_units table directly.
//
// The canon migrations roll out separately from the UI, so every reader MUST degrade gracefully
// when a table/view doesn't exist yet: "relation does not exist" / schema-cache errors → [] / null.

// Missing-table errors come in three shapes:
//   - Postgres raw: code === "42P01" ("undefined_table")
//   - PostgREST schema-cache: code === "PGRST205" ("Could not find the table ... in the schema cache")
//   - Plain message: "... does not exist" (some pg drivers strip codes)
// Catch all three so reads degrade to null/[] until the migration lands.
function isMissingTable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  if (typeof e.message === "string" && /does not exist|schema cache/i.test(e.message)) return true;
  return false;
}

// snake_case row → JudgmentUnit, (col as T) ?? fallback per field.
type UnitRow = Record<string, unknown>;
function mapUnit(u: UnitRow): JudgmentUnit {
  return {
    id: u.id as string,
    folder_slug: u.folder_slug as string,
    kind: u.kind as UnitKind,
    ruling_kind: (u.ruling_kind as RulingKind | null) ?? null,
    target_activity_id: (u.target_activity_id as string | null) ?? null,
    target_option_id: (u.target_option_id as string | null) ?? null,
    target_recipe_id: (u.target_recipe_id as string | null) ?? null,
    assertion: (u.assertion as string) ?? "",
    trigger: (u.trigger as Record<string, unknown> | null) ?? null,
    reasoning: (u.reasoning as string | null) ?? null,
    provenance: (u.provenance as Provenance) ?? "human_injected",
    standing: (u.standing as Standing) ?? "proposed",
    gate_posture: (u.gate_posture as GatePosture | null) ?? null,
    proposed_by: (u.proposed_by as string | null) ?? null,
    ratified_by: (u.ratified_by as string | null) ?? null,
    ratified_at: (u.ratified_at as string | null) ?? null,
    supersedes_id: (u.supersedes_id as string | null) ?? null,
    retired_at: (u.retired_at as string | null) ?? null,
    motion_id: (u.motion_id as string | null) ?? null,
    origin_session: (u.origin_session as string | null) ?? null,
    origin_activity_run: (u.origin_activity_run as string | null) ?? null,
    metadata: (u.metadata as Record<string, unknown> | null) ?? {},
    created_at: u.created_at as string,
    updated_at: (u.updated_at as string | null) ?? null,
  };
}

const UNIT_COLS =
  "id, folder_slug, kind, ruling_kind, target_activity_id, target_option_id, target_recipe_id, assertion, trigger, reasoning, provenance, standing, gate_posture, proposed_by, ratified_by, ratified_at, supersedes_id, retired_at, motion_id, origin_session, origin_activity_run, metadata, created_at, updated_at";

// ─── Folders ─────────────────────────────────────────────────────────────────

export async function getFolders(): Promise<ExpertFolder[]> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("expert_folders")
      .select("folder_slug, name, domain, parent_folder_slug, owning_system_slug, status")
      .order("name", { ascending: true });
    if (error) { if (isMissingTable(error)) return []; throw error; }
    if (!data) return [];
    return data.map((f) => ({
      folder_slug: f.folder_slug as string,
      name: (f.name as string | null) ?? null,
      domain: (f.domain as string | null) ?? null,
      parent_folder_slug: (f.parent_folder_slug as string | null) ?? null,
      owning_system_slug: (f.owning_system_slug as string | null) ?? null,
      status: (f.status as string | null) ?? null,
    }));
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
}

export async function getFolder(slug: string): Promise<ExpertFolder | null> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("expert_folders")
      .select("folder_slug, name, domain, parent_folder_slug, owning_system_slug, status")
      .eq("folder_slug", slug)
      .maybeSingle();
    if (error) { if (isMissingTable(error)) return null; throw error; }
    if (!data) return null;
    return {
      folder_slug: data.folder_slug as string,
      name: (data.name as string | null) ?? null,
      domain: (data.domain as string | null) ?? null,
      parent_folder_slug: (data.parent_folder_slug as string | null) ?? null,
      owning_system_slug: (data.owning_system_slug as string | null) ?? null,
      status: (data.status as string | null) ?? null,
    };
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}

// ─── Judgment units ──────────────────────────────────────────────────────────

// Active + locked, non-retired units for a folder — from the view (matches canon def:
// v_folder_active_units = standing in (active,locked) AND retired_at is null).
export async function getActiveUnits(folderSlug: string): Promise<JudgmentUnit[]> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("v_folder_active_units")
      .select(UNIT_COLS)
      .eq("folder_slug", folderSlug)
      .order("created_at", { ascending: false });
    if (error) { if (isMissingTable(error)) return []; throw error; }
    if (!data) return [];
    return data.map(mapUnit);
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
}

// Proposed units awaiting ratification — base table, standing='proposed', not retired.
export async function getProposedUnits(folderSlug: string): Promise<JudgmentUnit[]> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("judgment_units")
      .select(UNIT_COLS)
      .eq("folder_slug", folderSlug)
      .eq("standing", "proposed")
      .is("retired_at", null)
      .order("created_at", { ascending: false });
    if (error) { if (isMissingTable(error)) return []; throw error; }
    if (!data) return [];
    return data.map(mapUnit);
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
}

// Active rulings only (kind='ruling') — from the active view, so active+locked non-retired.
export async function getRulings(folderSlug: string): Promise<JudgmentUnit[]> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("v_folder_active_units")
      .select(UNIT_COLS)
      .eq("folder_slug", folderSlug)
      .eq("kind", "ruling")
      .order("created_at", { ascending: false });
    if (error) { if (isMissingTable(error)) return []; throw error; }
    if (!data) return [];
    return data.map(mapUnit);
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
}

// ─── Options ─────────────────────────────────────────────────────────────────

export async function getOptions(folderSlug: string): Promise<ActivityOption[]> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("activity_options")
      .select("id, activity_id, option_slug, folder_slug, kind, name, when_to_use, config, priority, provenance, standing, created_at")
      .eq("folder_slug", folderSlug)
      .order("priority", { ascending: true, nullsFirst: false });
    if (error) { if (isMissingTable(error)) return []; throw error; }
    if (!data) return [];
    return data.map((o) => ({
      id: o.id as string,
      activity_id: (o.activity_id as string | null) ?? null,
      option_slug: (o.option_slug as string) ?? "",
      folder_slug: (o.folder_slug as string | null) ?? null,
      kind: (o.kind as "source" | "tactic") ?? "source",
      name: (o.name as string) ?? "",
      when_to_use: (o.when_to_use as string | null) ?? null,
      config: (o.config as Record<string, unknown> | null) ?? {},
      priority: (o.priority as number | null) ?? null,
      provenance: (o.provenance as string | null) ?? null,
      standing: (o.standing as string | null) ?? null,
      created_at: o.created_at as string,
    }));
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
}

// ─── Recipes ─────────────────────────────────────────────────────────────────

// Current recipe versions for a folder — from the v_current_recipes view (is_current rows).
export async function getRecipes(folderSlug: string): Promise<LibraryRecipe[]> {
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("v_current_recipes")
      .select("recipe_id, version, is_current, folder_slug, name, description, control_flow, layer, overrides_recipe_id, viewbox")
      .eq("folder_slug", folderSlug)
      .order("name", { ascending: true });
    if (error) { if (isMissingTable(error)) return []; throw error; }
    if (!data) return [];
    return data.map((r) => ({
      recipe_id: r.recipe_id as string,
      version: (r.version as number | null) ?? null,
      is_current: (r.is_current as boolean) ?? true,
      folder_slug: (r.folder_slug as string | null) ?? null,
      name: (r.name as string | null) ?? null,
      description: (r.description as string | null) ?? null,
      control_flow: (r.control_flow as Record<string, unknown> | null) ?? null,
      layer: (r.layer as string | null) ?? null,
      overrides_recipe_id: (r.overrides_recipe_id as string | null) ?? null,
      viewbox: (r.viewbox as Record<string, unknown> | null) ?? null,
    }));
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
}

// ─── Track record ────────────────────────────────────────────────────────────

// Counts by standing (proposed/active/locked) + retired for a folder's judgment units.
// Reads the base table so retired rows are counted. Degrades to all-zeros pre-migration.
export async function getTrackRecord(folderSlug: string): Promise<FolderTrackRecord> {
  const empty: FolderTrackRecord = { proposed: 0, active: 0, locked: 0, retired: 0 };
  const db = canonDb();
  try {
    const { data, error } = await db
      .from("judgment_units")
      .select("standing, retired_at")
      .eq("folder_slug", folderSlug);
    if (error) { if (isMissingTable(error)) return empty; throw error; }
    if (!data) return empty;
    const rec = { ...empty };
    for (const row of data) {
      if (row.retired_at != null) { rec.retired += 1; continue; }
      const s = row.standing as Standing | null;
      if (s === "proposed") rec.proposed += 1;
      else if (s === "active") rec.active += 1;
      else if (s === "locked") rec.locked += 1;
    }
    return rec;
  } catch (e) {
    if (isMissingTable(e)) return empty;
    throw e;
  }
}
