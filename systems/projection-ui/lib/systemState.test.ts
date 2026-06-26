import { describe, it, expect } from "vitest";
import { evidencedState, isRunnable, type SystemEvidence } from "./systemState";

const ev = (over: Partial<SystemEvidence> = {}): SystemEvidence => ({
  claimed_status: "emerging", spec_defined: false, has_surface: false,
  activities: 0, ensured: 0, verified: 0, unrouted: 0, last_ensured_days: null,
  assets: 0, assets_reconciled: 0, triggers: 0, triggers_wired: 0, last_reconciled_days: null,
  ...over,
});

describe("evidencedState — ladder gates", () => {
  it("0/0/0 with no spec is a stub", () => {
    expect(evidencedState(ev()).state).toBe("stub");
  });

  it("0/0/0 with a spec body is emerging", () => {
    expect(evidencedState(ev({ spec_defined: true })).state).toBe("emerging");
  });

  it("a system claiming operating but 0/0/0 (signal-prospecting, even with a surface) reads stub + diverges", () => {
    const r = evidencedState(ev({ claimed_status: "operating", has_surface: true }));
    expect(r.state).toBe("stub");
    expect(r.claim_diverges).toBe(true);
  });

  it("asset-rich / activity-poor (teknova: 58 assets, 0 activities) is BUILDING, never beta", () => {
    const r = evidencedState(ev({ claimed_status: "operating", assets: 58, assets_reconciled: 58, activities: 0 }));
    expect(r.state).toBe("building");
    expect(r.gaps.some((g) => /0 activities/.test(g))).toBe(true);
    expect(r.claim_diverges).toBe(true);
  });

  it("ensured activity + reconciled assets + surface, not yet continuously verified → beta", () => {
    const r = evidencedState(ev({ activities: 6, ensured: 6, verified: 0, assets: 9, assets_reconciled: 9, has_surface: true, triggers: 4, triggers_wired: 2 }));
    expect(r.state).toBe("beta");
  });

  it("full evidence — all ensured verified, wired trigger, recent, surfaced → operating", () => {
    const r = evidencedState(ev({ claimed_status: "operating", activities: 6, ensured: 6, verified: 6, last_ensured_days: 2, assets: 9, assets_reconciled: 9, has_surface: true, triggers: 4, triggers_wired: 2 }));
    expect(r.state).toBe("operating");
    expect(r.claim_diverges).toBe(false);
  });

  it("stale verification drops operating to beta", () => {
    const r = evidencedState(ev({ activities: 6, ensured: 6, verified: 6, last_ensured_days: 40, assets: 9, assets_reconciled: 9, has_surface: true, triggers_wired: 2 }));
    expect(r.state).toBe("beta");
  });

  it("unreconciled assets keep a system out of beta (building) and surface the gap", () => {
    const r = evidencedState(ev({ activities: 3, ensured: 3, assets: 10, assets_reconciled: 4, has_surface: true, triggers_wired: 1 }));
    expect(r.state).toBe("building");
    expect(r.gaps.some((g) => /6\/10 assets unreconciled/.test(g))).toBe(true);
  });

  it("claim_diverges only fires downward (claimed building, evidence building → false)", () => {
    expect(evidencedState(ev({ claimed_status: "building", assets: 1 })).claim_diverges).toBe(false);
  });

  it("isRunnable only for beta/operating", () => {
    expect(isRunnable(evidencedState(ev({ claimed_status: "operating", has_surface: true })))).toBe(false); // stub
    expect(isRunnable(evidencedState(ev({ activities: 3, ensured: 3, assets: 1, assets_reconciled: 1, has_surface: true })))).toBe(true); // beta
  });
});
