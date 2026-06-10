import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { loadRegistry } from "./registry";

const ROOT = "/Users/nplmini/code/work/registry";

describe.skipIf(!existsSync(ROOT))("real registry", () => {
  it("parses clean with 25 systems", () => {
    const reg = loadRegistry(ROOT);
    expect(reg.errors).toEqual([]);
    expect(reg.systems).toHaveLength(25);
  });

  it("every home is one of the eight constellations", () => {
    const eight = ["canon", "compass", "signal", "forge", "voice", "pulse", "guard", "garden"];
    for (const { record } of loadRegistry(ROOT).systems)
      expect(eight, `${record.slug} home=${record.home}`).toContain(record.home);
  });
});
