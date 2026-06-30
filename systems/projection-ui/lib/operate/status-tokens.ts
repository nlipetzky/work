// Single source of truth for status colors across the /operate cockpit.
//
// Keyed by the union of ActivityStatus ("unset"|"ok"|"error"|"blocked") and
// StageStatus ("pending"|"in_progress"|"done"|"deviated"|"blocked"). Spine dots,
// node-card borders, run badges, and the activity header all read from here so
// the palette never drifts between surfaces.
//
// FILL  = solid fill / dot color.   STROKE = border / text color.   LABEL = display word.
// DOT   = convenience for the spine + card status dots.

export type AnyStatus =
  | "unset"
  | "ok"
  | "done"
  | "in_progress"
  | "error"
  | "blocked"
  | "deviated"
  | "pending";

export const FILL: Record<string, string> = {
  ok: "#3fb950",
  done: "#3fb950",
  in_progress: "#5b9dff",
  error: "#f85149",
  blocked: "#f85149",
  deviated: "#d29922",
  unset: "#1d2430",
  pending: "#1d2430",
};

export const STROKE: Record<string, string> = {
  ok: "#3fb950",
  done: "#3fb950",
  in_progress: "#5b9dff",
  error: "#f85149",
  blocked: "#f85149",
  deviated: "#d29922",
  unset: "#2a3342",
  pending: "#2a3342",
};

export const LABEL: Record<string, string> = {
  ok: "ok",
  done: "done",
  in_progress: "running",
  error: "error",
  blocked: "blocked",
  deviated: "deviated",
  unset: "unset",
  pending: "pending",
};

export function fillFor(status: string): string {
  return FILL[status] ?? FILL.unset;
}

export function strokeFor(status: string): string {
  return STROKE[status] ?? STROKE.unset;
}

export function labelFor(status: string): string {
  return LABEL[status] ?? status;
}
