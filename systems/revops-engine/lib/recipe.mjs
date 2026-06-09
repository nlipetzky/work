// recipe.mjs — load + validate a play's prep-recipe.json into runnable stage descriptors.
//
// loadRecipe(playDir): reads <playDir>/prep-recipe.json, or returns DEFAULT_RECIPE if absent
//   (backward compatible — a play with no recipe runs today's five stages).
// resolveStages(recipe, playDir): validates structure + stage names against the registry and expands
//   each stage into { stage, entity, order, runner, buildArgs, configDir, configPath } with abs paths.
//   Pure (no fs) so it is unit-testable; throws on any malformed recipe (fail fast).

import fs from "fs";
import path from "path";
import { getStage } from "./stage-registry.mjs";

export const DEFAULT_RECIPE = {
  system: "revops-engine",
  configDir: "classifier",
  stages: [
    { stage: "stage1", entity: "companies", config: "stage1-deterministic.sql" },
    { stage: "classify", entity: "companies" },
    { stage: "dedup", entity: "companies", config: "dedup-rules.json" },
    { stage: "route", entity: "contacts", config: "routing-rules.json" },
    { stage: "contacts_screen", entity: "contacts", config: "contacts-screen-rules.json" },
  ],
};

export function loadRecipe(playDir) {
  const p = path.join(playDir, "prep-recipe.json");
  if (!fs.existsSync(p)) return { ...DEFAULT_RECIPE, _source: "default" };
  const recipe = JSON.parse(fs.readFileSync(p, "utf8"));
  return { ...recipe, _source: p };
}

export function resolveStages(recipe, playDir) {
  if (!Array.isArray(recipe.stages) || recipe.stages.length === 0) {
    throw new Error("recipe has no stages");
  }
  const configDir = path.join(playDir, recipe.configDir || "classifier");
  return recipe.stages.map((s, i) => {
    if (!s.stage) throw new Error(`recipe stage ${i} is missing "stage"`);
    if (!s.entity) throw new Error(`recipe stage "${s.stage}" is missing "entity"`);
    const def = getStage(s.stage); // throws on unknown stage type
    const configPath = s.config ? path.join(configDir, s.config) : null;
    return {
      stage: s.stage,
      entity: s.entity,
      order: i + 1,
      runner: def.runner,
      buildArgs: def.buildArgs,
      configDir,
      configPath,
    };
  });
}
