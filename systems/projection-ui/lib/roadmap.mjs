// Pure roadmap helpers — the planning layer's deterministic ordering, computed from evidenced
// state. No DB, no server-only. Maps each project (a system-build) to a mode and orders the work
// foundation-first within a goal. See practices/operator-os/reference/studio-roadmap.md.

// What is this project DOING to its system, from the system's evidenced rung?
// build = not live yet (stub/emerging/building) · iterate = live-but-unverified (beta) · run = operating.
export function modeFromState(state) {
  if (state === "operating") return "run";
  if (state === "beta") return "iterate";
  return "build"; // stub, emerging, building, or unknown
}

// Least-built first — the foundational/unstarted work surfaces before the near-done.
const RUNG_ORDER = { stub: 0, emerging: 1, building: 2, beta: 3, operating: 4 };
export function rungOrder(state) {
  return RUNG_ORDER[state] ?? 0;
}

/**
 * Split a goal's projects into system-builds (linked to a system, with evidenced state) and
 * residual human work (no system), and order the builds foundation-first (by evidenced rung asc,
 * then by name for stability).
 * @param {Array} projects each: { system_slug, evidenced_state, name, ... }
 */
export function splitAndOrder(projects) {
  const systemBuilds = projects
    .filter((p) => p.system_slug)
    .sort((a, b) => rungOrder(a.evidenced_state) - rungOrder(b.evidenced_state) || a.name.localeCompare(b.name));
  const humanWork = projects.filter((p) => !p.system_slug).sort((a, b) => a.name.localeCompare(b.name));
  return { systemBuilds, humanWork };
}
