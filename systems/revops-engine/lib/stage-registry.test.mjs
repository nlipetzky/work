import { test } from "node:test";
import assert from "node:assert/strict";
import { getStage, STAGES } from "./stage-registry.mjs";

test("getStage returns a runner + buildArgs for a known stage", () => {
  const def = getStage("stage1");
  assert.equal(def.runner, "run-stage1.mjs");
  assert.deepEqual(
    def.buildArgs({ batchId: "b1", entity: "companies", configDir: "/cfg", configPath: "/cfg/stage1.sql" }),
    ["b1", "companies", "/cfg/stage1.sql"],
  );
});

test("classify builds --play <configDir> and takes no config file", () => {
  const def = getStage("classify");
  assert.deepEqual(
    def.buildArgs({ batchId: "b1", entity: "companies", configDir: "/cfg", configPath: null }),
    ["b1", "companies", "--play", "/cfg"],
  );
});

test("all five stage types are registered", () => {
  assert.deepEqual(
    Object.keys(STAGES).sort(),
    ["classify", "contacts_screen", "dedup", "route", "stage1"],
  );
});

test("getStage throws on an unknown stage name", () => {
  assert.throws(() => getStage("nope"), /unknown stage "nope"/);
});
