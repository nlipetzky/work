// Per-mode feature flags for /operate.
//
// Single source of truth for what each mode renders, edits, and acts on. The
// cockpit page + every sub-component reads from this table so adding a new
// feature row touches one file. Component-level conditionals like
// `if (mode === 'build') ...` should be replaced by `if (FEATURES[mode].x)`.
//
// Slice 2A.2 establishes the table + the visible affordances (toggle, hint,
// label color). The detail-panel flags (composition_editable, runs_history_visible,
// etc.) are honored by Inspector + future sub-components as slice 2B/2C lands
// the editable affordances.

export type OperateMode = "run" | "iterate" | "build";

export type ModeFeatures = {
  label: string;
  // Short sentence shown next to the toggle.
  hint: string;
  // Accent color (Tailwind class fragments + a hex for inline styles).
  accent: "blue" | "amber" | "purple";

  // ── SOP spine ─────────────────────────────────────────────
  spine_reorderable: boolean;
  spine_add_stage: boolean;

  // ── Workflow grid ─────────────────────────────────────────
  workflow_reorderable: boolean;
  workflow_add_activity: boolean;

  // ── Activity detail panel ─────────────────────────────────
  composition_editable: boolean;
  skill_swap_enabled: boolean;
  skill_create_new: boolean; // "+ Create new skill" → spawns skill-creator
  provenance_editable: boolean;
  embedded_system_view_visible: boolean;
  runs_history_visible: boolean;
  evals_authoring: boolean; // false = read; true = add fixtures
  sopwriter_banner_visible: boolean;

  // ── Action bar ────────────────────────────────────────────
  // Each action key maps to a button shown / hidden in the inspector action row.
  actions: {
    run_plan: boolean;
    run_execute: boolean;
    open_claude: boolean; // every mode shows this; payload differs per mode
    save_iteration: boolean;
    run_after_save: boolean;
    discard_iteration: boolean;
    validate: boolean;
    save_draft: boolean;
    publish: boolean;
    discard_draft: boolean;
  };
};

export const FEATURES: Record<OperateMode, ModeFeatures> = {
  run: {
    label: "RUN",
    hint: "read-only on structure · fire activities · daily cockpit",
    accent: "blue",

    spine_reorderable: false,
    spine_add_stage: false,

    workflow_reorderable: false,
    workflow_add_activity: false,

    composition_editable: false,
    skill_swap_enabled: false,
    skill_create_new: false,
    provenance_editable: false,
    embedded_system_view_visible: true,
    runs_history_visible: true,
    evals_authoring: false,
    sopwriter_banner_visible: false,

    actions: {
      run_plan: true,
      run_execute: true,
      open_claude: true,
      save_iteration: false,
      run_after_save: false,
      discard_iteration: false,
      validate: false,
      save_draft: false,
      publish: false,
      discard_draft: false,
    },
  },

  iterate: {
    label: "ITERATE",
    hint: "single-activity edit · swap skills / tweak prompts / change schemas · no structural change",
    accent: "amber",

    spine_reorderable: false,
    spine_add_stage: false,

    workflow_reorderable: false,
    workflow_add_activity: false,

    composition_editable: true,
    skill_swap_enabled: true,
    skill_create_new: false, // create new = BUILD
    provenance_editable: false, // structural = BUILD
    embedded_system_view_visible: true, // read-only in iterate
    runs_history_visible: true,
    evals_authoring: true, // add fixture from a recent failure
    sopwriter_banner_visible: false,

    actions: {
      run_plan: false,
      run_execute: false,
      open_claude: true,
      save_iteration: true,
      run_after_save: true,
      discard_iteration: true,
      validate: false,
      save_draft: false,
      publish: false,
      discard_draft: false,
    },
  },

  build: {
    label: "BUILD",
    hint: "structural edit · add/remove/reorder stages, nodes, skills · scaffold new files · publish a new version",
    accent: "purple",

    spine_reorderable: true,
    spine_add_stage: true,

    workflow_reorderable: true,
    workflow_add_activity: true,

    composition_editable: true,
    skill_swap_enabled: true,
    skill_create_new: true,
    provenance_editable: true,
    embedded_system_view_visible: false, // hidden in build
    runs_history_visible: false, // no runs for a draft
    evals_authoring: true,
    sopwriter_banner_visible: true,

    actions: {
      run_plan: false,
      run_execute: false,
      open_claude: true,
      save_iteration: false,
      run_after_save: false,
      discard_iteration: false,
      validate: true,
      save_draft: true,
      publish: true,
      discard_draft: true,
    },
  },
};

// Accent tokens for inline styles. Values match the locked Operate.dc.html
// design palette (lighter than the slice-2A placeholders): `text` is the
// primary accent ink, `textSoft` the lighter on-accent ink used on filled
// chips/buttons, `bg` the subtle fill, `bgStrong` the stronger fill for active
// segments, `border` the accent hairline. Structural colors (card bg, hairlines,
// body text) stay on the app's Tailwind ink-* tokens — only the mode accent
// rotates here.
export type AccentTokens = {
  bg: string;
  bgStrong: string;
  text: string;
  textSoft: string;
  border: string;
};

export const ACCENT_TOKENS: Record<ModeFeatures["accent"], AccentTokens> = {
  blue: {
    bg: "rgba(91,157,255,0.16)",
    bgStrong: "rgba(91,157,255,0.26)",
    text: "#7eb0ff",
    textSoft: "#aecdff",
    border: "rgba(91,157,255,0.50)",
  },
  amber: {
    bg: "rgba(240,176,55,0.15)",
    bgStrong: "rgba(240,176,55,0.24)",
    text: "#f3b53f",
    textSoft: "#ffd277",
    border: "rgba(240,176,55,0.48)",
  },
  purple: {
    bg: "rgba(150,110,245,0.17)",
    bgStrong: "rgba(150,110,245,0.27)",
    text: "#b694f7",
    textSoft: "#d0baff",
    border: "rgba(150,110,245,0.52)",
  },
};

export function parseMode(value: string | null | undefined): OperateMode {
  if (value === "iterate" || value === "build" || value === "run") return value;
  return "run";
}
