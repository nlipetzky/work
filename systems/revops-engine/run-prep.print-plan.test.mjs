import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENGINE = path.dirname(fileURLToPath(import.meta.url));
const PLAY = "/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies";
const MARKER = "--- PLAN JSON ---";

test("run-prep --print-plan emits a parseable plan and exits 0", () => {
  const res = spawnSync("node", ["run-prep.mjs", "TESTBATCH", "--play", PLAY, "--print-plan"], {
    cwd: ENGINE, encoding: "utf8",
  });
  assert.equal(res.status, 0, res.stderr);
  const i = res.stdout.indexOf(MARKER);
  assert.ok(i >= 0, "plan marker present in stdout");
  const plan = JSON.parse(res.stdout.slice(i + MARKER.length).trim());
  assert.equal(plan.length, 5);
  assert.equal(plan[0].stage, "stage1");
  assert.equal(plan[0].order, 1);
  assert.ok(plan[0].command.startsWith("node run-stage1.mjs TESTBATCH companies "));
  // the readiness report is printed too (a non-empty human block, before the marker)
  assert.ok(res.stdout.slice(0, i).trim().length > 0, "readiness report printed before plan");
});
