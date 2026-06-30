// Pure types + helpers for the activity-composition editable path.
//
// Shared by ActivityDetail (owns the draft state machine) and CompositionRows
// (renders + mutates it). No React, no fetch — just the shapes the
// /api/operate/composition payload returns and the draft-diff logic that powers
// dirty-detection + the /api/operate/iterate save body.

export type SkillRef = {
  slug: string;
  title: string;
  description: string | null;
  path: string;
};

export type ActivityComposition = {
  activityId: string;
  version: number;
  name: string;
  what: string;
  description: string | null;
  executorClass: string;
  ownerSystemSlug: string;
  functionPath: string | null;
  triggerEvent: string | null;
  schemas: { in?: string; out?: string } | null;
  adapters: string[];
  skills: SkillRef[];
  routeComponent: string | null;
  reads: string[];
  writes: string[];
  provenanceConsumes: string[];
  provenanceWrites: string[];
};

export type ActivityRunRow = {
  runId: string;
  status: string;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  costUsd: number;
};

export type ActivityEvalsSummary = {
  totalFixtures: number;
  passedLastRun: number;
  passRatePct: number;
  lastRunAt: string | null;
  staleCount: number;
};

export type CompositionPayload = {
  composition: ActivityComposition;
  runs: ActivityRunRow[];
  evals: ActivityEvalsSummary | null;
};

export type AvailableSkill = {
  slug: string;
  title: string;
  description: string | null;
  path: string;
  ownerSystemSlug: string | null;
  status: "active" | "draft" | "deprecated";
};

// The editable working copy of a composition (ITERATE/BUILD).
export type Draft = {
  description: string;
  functionPath: string | null;
  triggerEvent: string | null;
  schemaIn: string;
  schemaOut: string;
  adapters: string[];
  skills: string[]; // slugs
};

export function fromComposition(c: ActivityComposition): Draft {
  return {
    description: c.description ?? "",
    functionPath: c.functionPath,
    triggerEvent: c.triggerEvent,
    schemaIn: c.schemas?.in ?? "",
    schemaOut: c.schemas?.out ?? "",
    adapters: [...c.adapters],
    skills: c.skills.map((s) => s.slug),
  };
}

export function draftToPostBody(d: Draft) {
  const schemas =
    d.schemaIn || d.schemaOut
      ? {
          ...(d.schemaIn ? { in: d.schemaIn } : {}),
          ...(d.schemaOut ? { out: d.schemaOut } : {}),
        }
      : null;
  return {
    description: d.description || null,
    functionPath: d.functionPath || null,
    triggerEvent: d.triggerEvent || null,
    schemas,
    adapters: d.adapters,
    skills: d.skills,
  };
}

export function draftsEqual(a: Draft, b: Draft): boolean {
  if (a.description !== b.description) return false;
  if (a.functionPath !== b.functionPath) return false;
  if (a.triggerEvent !== b.triggerEvent) return false;
  if (a.schemaIn !== b.schemaIn) return false;
  if (a.schemaOut !== b.schemaOut) return false;
  if (a.adapters.length !== b.adapters.length) return false;
  if (a.adapters.some((x, i) => x !== b.adapters[i])) return false;
  if (a.skills.length !== b.skills.length) return false;
  if (a.skills.some((x, i) => x !== b.skills[i])) return false;
  return true;
}

// Mutators bundle passed from ActivityDetail down to CompositionRows.
export type DraftMutators = {
  setField: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
  swapSkill: (oldSlug: string, newSlug: string) => void;
  addSkill: (slug: string) => void;
  removeSkill: (slug: string) => void;
  addAdapter: (name: string) => void;
  removeAdapter: (name: string) => void;
};
