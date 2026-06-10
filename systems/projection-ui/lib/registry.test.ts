import { describe, it, expect } from "vitest";
import { parseSystemMd, validateRecord, loadRegistry } from "./registry";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const VALID = `---
name: Demand context
slug: demand-context
home: signal
clusters: [revops]
class: core
lifecycle: defined
flags: []
autonomy: manual
outcome: >
  Outbound plays run on evidenced demand understanding, never a guessed ICP.
contract:
  inputs:
    - {name: Expert transcripts, status: manual}
  outputs:
    - {name: Observations, status: off}
  metrics:
    - {name: Claims traceable to evidence, value: null}
  stopping: All signal extracted with provenance.
assets:
  - {name: Observation store, type: database, ownership: own, status: to-build, verified_by: null}
  - {name: Canon corpus, type: database, ownership: "shared:canon-ingestion", status: connected, verified_by: null}
context:
  - {name: Extraction skill, version: null, status: to-write, verified_by: null}
---

Body prose here.
`;

describe("parseSystemMd", () => {
  it("parses a valid record", () => {
    const r = parseSystemMd(VALID, "registry/signal/demand-context/system.md");
    expect(r.slug).toBe("demand-context");
    expect(r.home).toBe("signal");
    expect(r.clusters).toEqual(["revops"]);
    expect(r.contract?.inputs[0]).toEqual({ name: "Expert transcripts", status: "manual" });
    expect(r.assets?.[1].ownership).toBe("shared:canon-ingestion");
    expect(r.body).toContain("Body prose");
  });

  it("throws naming the file on a missing required field", () => {
    const broken = VALID.replace("slug: demand-context\n", "");
    expect(() => parseSystemMd(broken, "registry/x/system.md"))
      .toThrow(/registry\/x\/system\.md.*slug/);
  });

  it("throws on an unknown lifecycle value", () => {
    const broken = VALID.replace("lifecycle: defined", "lifecycle: shipping");
    expect(() => parseSystemMd(broken, "f")).toThrow(/lifecycle/);
  });

  it("defaults optional sections", () => {
    const minimal = `---\nname: X\nslug: x\nhome: canon\nclass: core\nlifecycle: defined\nautonomy: manual\noutcome: does x\n---\n`;
    const r = parseSystemMd(minimal, "f");
    expect(r.clusters).toEqual([]);
    expect(r.assets).toEqual([]);
    expect(r.context).toEqual([]);
    expect(r.flags).toEqual([]);
  });
});

describe("validateRecord", () => {
  it("warns when a row claims tested/evaled without verified_by", () => {
    const r = parseSystemMd(VALID.replace("status: to-build", "status: tested"), "f");
    const w = validateRecord(r);
    expect(w.some((m) => m.includes("Observation store") && m.includes("verified_by"))).toBe(true);
  });

  it("warns when lifecycle is operating without runs_surface", () => {
    const r = parseSystemMd(VALID.replace("lifecycle: defined", "lifecycle: operating"), "f");
    const w = validateRecord(r);
    expect(w.some((m) => m.includes("runs"))).toBe(true);
  });

  it("no warnings on a clean defined record", () => {
    expect(validateRecord(parseSystemMd(VALID, "f"))).toEqual([]);
  });
});

describe("loadRegistry", () => {
  it("walks constellation dirs, collects records, errors and meta", () => {
    const root = mkdtempSync(path.join(tmpdir(), "reg-"));
    writeFileSync(path.join(root, "_meta.yml"), "last_reviewed: 2026-06-09T17:54:00-05:00\n");
    mkdirSync(path.join(root, "signal", "demand-context"), { recursive: true });
    writeFileSync(path.join(root, "signal", "demand-context", "system.md"), VALID);
    mkdirSync(path.join(root, "canon", "broken"), { recursive: true });
    writeFileSync(path.join(root, "canon", "broken", "system.md"), "---\nname: B\n---\n");
    const reg = loadRegistry(root);
    expect(reg.systems).toHaveLength(1);
    expect(reg.systems[0].record.slug).toBe("demand-context");
    expect(reg.errors).toHaveLength(1);
    expect(reg.errors[0]).toMatch(/broken/);
    expect(reg.lastReviewed).toBe("2026-06-09T17:54:00-05:00");
  });
});
