import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import nodePath from "node:path";
import { checkReadiness, formatReadiness } from "./readiness.mjs";

function tmpPlay() {
  return fs.mkdtempSync(nodePath.join(os.tmpdir(), "readiness-"));
}

test("checkReadiness with no inputs array → empty, all-now-present", () => {
  const r = checkReadiness({}, "/nowhere");
  assert.equal(r.items.length, 0);
  assert.equal(r.allNowPresent, true);
  assert.equal(r.missingNow.length, 0);
});

test("checkReadiness flags present / missing / empty; when defaults to now", () => {
  const dir = tmpPlay();
  try {
    fs.writeFileSync(nodePath.join(dir, "offer.md"), "real content");
    fs.writeFileSync(nodePath.join(dir, "empty.md"), ""); // empty file = missing
    const recipe = { inputs: [
      { name: "offer", path: "offer.md" },                  // no when → defaults to "now"
      { name: "segment", path: "missing.md", when: "now" },
      { name: "empty one", path: "empty.md", when: "now" },
      { name: "copy", path: "copy.md", when: "later" },
    ]};
    const r = checkReadiness(recipe, dir);
    const byName = Object.fromEntries(r.items.map((i) => [i.name, i]));
    assert.equal(byName["offer"].present, true);
    assert.equal(byName["offer"].when, "now");
    assert.equal(byName["segment"].present, false);
    assert.equal(byName["empty one"].present, false); // empty counts as missing
    assert.equal(byName["copy"].when, "later");
    assert.deepEqual(r.missingNow.map((i) => i.name).sort(), ["empty one", "segment"]);
    assert.equal(r.allNowPresent, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("formatReadiness renders now/later sections + all-present closing line", () => {
  const report = {
    items: [
      { name: "offer", path: "o.md", when: "now", present: true },
      { name: "copy", path: "c.md", when: "later", present: false },
    ],
    missingNow: [],
    allNowPresent: true,
  };
  const out = formatReadiness(report, "ngabs");
  assert.match(out, /Play readiness — ngabs/);
  assert.match(out, /Ready for this run:/);
  assert.match(out, /✓ offer/);
  assert.match(out, /Not yet \(needed for outreach, not this run\):/);
  assert.match(out, /— copy/);
  assert.match(out, /All inputs for this run are present\. Proceeding\./);
});

test("formatReadiness shows the missing closing line when a now input is absent", () => {
  const report = {
    items: [{ name: "segment", path: "s.md", when: "now", present: false }],
    missingNow: [{ name: "segment", path: "s.md", when: "now", present: false }],
    allNowPresent: false,
  };
  const out = formatReadiness(report, "ngabs");
  assert.match(out, /✗ segment/);
  assert.match(out, /Missing for this run: segment\./);
  assert.doesNotMatch(out, /Proceeding|--strict/); // the report states facts; run-prep states the action
});
