import { describe, it, expect } from "vitest";
import { modeFromState, rungOrder, splitAndOrder } from "./roadmap.mjs";

describe("modeFromState", () => {
  it("not-live rungs are build", () => {
    for (const s of ["stub", "emerging", "building"]) expect(modeFromState(s)).toBe("build");
  });
  it("beta is iterate, operating is run", () => {
    expect(modeFromState("beta")).toBe("iterate");
    expect(modeFromState("operating")).toBe("run");
  });
});

describe("splitAndOrder", () => {
  const projects = [
    { name: "Z build", system_slug: "z", evidenced_state: "building" },
    { name: "A stub", system_slug: "a", evidenced_state: "stub" },
    { name: "LLC paperwork", system_slug: null, evidenced_state: null },
    { name: "Beta system", system_slug: "b", evidenced_state: "beta" },
    { name: "Bank accounts", system_slug: null, evidenced_state: null },
  ];

  it("separates system-builds from human work", () => {
    const { systemBuilds, humanWork } = splitAndOrder(projects);
    expect(systemBuilds.map((p) => p.name)).toEqual(["A stub", "Z build", "Beta system"]); // rung asc
    expect(humanWork.map((p) => p.name)).toEqual(["Bank accounts", "LLC paperwork"]); // name asc
  });

  it("orders builds foundation-first (least-built rung first)", () => {
    const { systemBuilds } = splitAndOrder(projects);
    expect(systemBuilds.map((p) => rungOrder(p.evidenced_state))).toEqual([0, 2, 3]);
  });
});
