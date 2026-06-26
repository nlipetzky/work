import { describe, it, expect } from "vitest";
import { normalizeIntent, reconcileMoves, type SystemRef } from "./guards";
import type { PlanMove, ProposedIntent } from "./types";

const intent = (over: Partial<ProposedIntent> = {}): ProposedIntent => ({
  client_engagement_pct: 10, prospect_engagement_pct: 65, infrastructure_pct: 10, finance_pct: 5, admin_pct: 10, personal_pct: 0,
  theme: "t", rationale: "r", ...over,
});

const GOALS = new Map([["g1", "Engine goal"]]);
// demand-context: not runnable, no surface; prep-runs: runnable + real surface;
// signal-prospecting: has a surface but is a STUB (not runnable) — the key case.
const BY_SLUG = new Map<string, SystemRef>([
  ["demand-context", { slug: "demand-context", status: "emerging", surface: null, runnable: false }],
  ["prep-runs", { slug: "prep-runs", status: "operating", surface: "projection-ui /runs", runnable: true }],
  ["signal-prospecting", { slug: "signal-prospecting", status: "operating", surface: "projection-ui /runs", runnable: false }],
]);
const BY_NAME = new Map<string, SystemRef>([
  ["demand context", { slug: "demand-context", status: "emerging", surface: null, runnable: false }],
  ["prep runs", { slug: "prep-runs", status: "operating", surface: "projection-ui /runs", runnable: true }],
  ["signal prospecting", { slug: "signal-prospecting", status: "operating", surface: "projection-ui /runs", runnable: false }],
]);

const move = (over: Partial<PlanMove> = {}): PlanMove => ({
  mode: "build", system_name: "X", system_slug: null, system_status: null, what_it_does: null,
  foundational: false, rationale: "r", ladder_goal_id: "g1", ladder_goal_title: null, area: "Infrastructure",
  steps: [], surface: null, dedupe_note: null, ...over,
});

describe("normalizeIntent", () => {
  it("keeps ~100, drops otherwise", () => {
    expect(normalizeIntent(intent())).not.toBeNull();
    expect(normalizeIntent(intent({ personal_pct: 50 }))).toBeNull();
  });
});

describe("reconcileMoves", () => {
  it("nulls an invented goal id", () => {
    expect(reconcileMoves([move({ ladder_goal_id: "ghost" })], GOALS, BY_SLUG, BY_NAME)[0].ladder_goal_id).toBeNull();
  });

  it("resolves an existing system by name → slug + status", () => {
    const out = reconcileMoves([move({ mode: "run", system_name: "Demand Context" })], GOALS, BY_SLUG, BY_NAME)[0];
    expect(out.system_slug).toBe("demand-context");
    expect(out.system_status).toBe("emerging");
  });

  it("a new build (no matching system) stays slug=null", () => {
    expect(reconcileMoves([move({ mode: "build", system_name: "Brand New System" })], GOALS, BY_SLUG, BY_NAME)[0].system_slug).toBeNull();
  });

  it("downgrades run of a non-existent system to build", () => {
    expect(reconcileMoves([move({ mode: "run", system_name: "Does Not Exist" })], GOALS, BY_SLUG, BY_NAME)[0].mode).toBe("build");
  });

  it("downgrades run of a real-but-surfaceless system to build (you can't open what has no surface)", () => {
    const out = reconcileMoves([move({ mode: "run", system_name: "Demand Context" })], GOALS, BY_SLUG, BY_NAME)[0];
    expect(out.mode).toBe("build");
    expect(out.surface).toBeNull();
  });

  it("keeps run + carries the real surface when the system is runnable", () => {
    const out = reconcileMoves([move({ mode: "run", system_name: "Prep Runs" })], GOALS, BY_SLUG, BY_NAME)[0];
    expect(out.mode).toBe("run");
    expect(out.surface).toBe("projection-ui /runs");
  });

  it("downgrades run of a surface-bearing STUB to build (signal-prospecting)", () => {
    expect(reconcileMoves([move({ mode: "run", system_name: "Signal Prospecting" })], GOALS, BY_SLUG, BY_NAME)[0].mode).toBe("build");
  });

  it("orders foundational moves first", () => {
    const out = reconcileMoves(
      [move({ system_name: "downstream", foundational: false }), move({ system_name: "foundation", foundational: true })],
      GOALS, BY_SLUG, BY_NAME,
    );
    expect(out[0].system_name).toBe("foundation");
  });

  it("strips empty steps", () => {
    expect(reconcileMoves([move({ steps: ["real", "", "  "] })], GOALS, BY_SLUG, BY_NAME)[0].steps).toEqual(["real"]);
  });
});
