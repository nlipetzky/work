// Types for the pure roadmap helpers (roadmap.mjs).

export function modeFromState(state: string | null | undefined): "build" | "iterate" | "run";
export function rungOrder(state: string | null | undefined): number;
export function splitAndOrder<T extends { system_slug: string | null; evidenced_state: string | null; name: string }>(
  projects: T[],
): { systemBuilds: T[]; humanWork: T[] };
