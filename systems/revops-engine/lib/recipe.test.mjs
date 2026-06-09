import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRecipe, resolveStages, DEFAULT_RECIPE } from "./recipe.mjs";

const PLAY = "/tmp/__nonexistent_play_dir__";

test("loadRecipe falls back to DEFAULT_RECIPE when no prep-recipe.json exists", () => {
  const r = loadRecipe(PLAY);
  assert.equal(r._source, "default");
  assert.equal(r.stages.length, 5);
});

test("resolveStages expands DEFAULT_RECIPE into ordered descriptors with abs config paths", () => {
  const stages = resolveStages(DEFAULT_RECIPE, "/play");
  assert.equal(stages.length, 5);
  assert.deepEqual(stages.map((s) => s.order), [1, 2, 3, 4, 5]);
  assert.equal(stages[0].stage, "stage1");
  assert.equal(stages[0].runner, "run-stage1.mjs");
  assert.equal(stages[0].configPath, "/play/classifier/stage1-deterministic.sql");
  assert.equal(stages[1].stage, "classify");
  assert.equal(stages[1].configPath, null); // classify takes no config file
});

test("resolveStages throws on an unknown stage", () => {
  const bad = { configDir: "classifier", stages: [{ stage: "bogus", entity: "companies" }] };
  assert.throws(() => resolveStages(bad, "/play"), /unknown stage "bogus"/);
});

test("resolveStages throws when a stage is missing entity", () => {
  const bad = { configDir: "classifier", stages: [{ stage: "stage1" }] };
  assert.throws(() => resolveStages(bad, "/play"), /missing "entity"/);
});

test("resolveStages throws on an empty stage list", () => {
  assert.throws(() => resolveStages({ stages: [] }, "/play"), /no stages/);
});
