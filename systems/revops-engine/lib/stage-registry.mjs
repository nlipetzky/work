// stage-registry.mjs — maps a prep-funnel stage NAME to its runner script and how to build that
// runner's argv. A recipe can only name a known stage type, never an arbitrary executable. This is the
// safety boundary that lets a recipe be handed to an agent later.
//
// buildArgs receives ctx: { batchId, entity, configDir (abs dir), configPath (abs file | null) }
// and returns the positional/flag argv that runner expects (matches each runner's current parser).

export const STAGES = {
  stage1: {
    runner: "run-stage1.mjs",
    buildArgs: (c) => [c.batchId, c.entity, c.configPath],
  },
  classify: {
    runner: "classify-runner.mjs",
    buildArgs: (c) => [c.batchId, c.entity, "--play", c.configDir],
  },
  dedup: {
    runner: "dedup-runner.mjs",
    buildArgs: (c) => [c.batchId, c.entity, c.configPath],
  },
  route: {
    runner: "route-runner.mjs",
    buildArgs: (c) => [c.batchId, c.entity, c.configPath],
  },
  contacts_screen: {
    runner: "contacts-screen-runner.mjs",
    buildArgs: (c) => [c.batchId, c.entity, c.configPath],
  },
};

export function getStage(name) {
  const def = STAGES[name];
  if (!def) {
    throw new Error(`unknown stage "${name}" — not in stage registry (known: ${Object.keys(STAGES).join(", ")})`);
  }
  return def;
}
