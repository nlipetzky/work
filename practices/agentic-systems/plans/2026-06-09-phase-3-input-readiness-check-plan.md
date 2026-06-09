# Phase 3 — Input Readiness Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Before a prep run, print a plain-English readiness report of which of the play's declared input documents are present vs missing (now vs later), and proceed by default; `--strict` stops on a missing "now" input.

**Architecture:** A new pure module `lib/readiness.mjs` (`checkReadiness` + `formatReadiness`) reads an optional `inputs` array from the play's `prep-recipe.json` and reports presence (file exists and is non-empty). `run-prep.mjs` prints the report after validating stages and before seeding the run; it only stops when `--strict` is passed and a "now" input is missing. It is a report, not a gate — zero new hard stops by default.

**Tech Stack:** Node ESM (`.mjs`), Node built-in test runner (`node --test`, no deps).

Spec: `/Users/nplmini/code/work/practices/agentic-systems/specs/2026-06-09-phase-3-input-readiness-check-design.md`

---

### Task 1: Readiness module (`checkReadiness` + `formatReadiness`)

**Files:**
- Create: `/Users/nplmini/code/work/systems/revops-engine/lib/readiness.mjs`
- Test: `/Users/nplmini/code/work/systems/revops-engine/lib/readiness.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `/Users/nplmini/code/work/systems/revops-engine/lib/readiness.test.mjs`:

```javascript
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
  assert.match(out, /Missing for this run: segment\. Proceeding anyway — add --strict/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nplmini/code/work/systems/revops-engine && node --test lib/readiness.test.mjs`
Expected: FAIL — cannot find module `./readiness.mjs`.

- [ ] **Step 3: Write minimal implementation**

Create `/Users/nplmini/code/work/systems/revops-engine/lib/readiness.mjs`:

```javascript
// readiness.mjs — checks which of a play's declared input documents are present and renders a
// plain-English readiness report. This is a REPORT, not a gate: run-prep prints it and proceeds.
// Only --strict turns a missing "now" input into a stop.
//
// A recipe's optional `inputs` array declares the documents that should back the play:
//   { name, path (relative to playDir), when: "now" | "later" }   (when defaults to "now")
// "now"   = backs a stage in the current run (enforced only under --strict)
// "later" = informational, for the outreach/activation funnel that doesn't run yet.
// "present" = the file exists AND is non-empty (size > 0). No stub/placeholder detection.

import fs from "fs";
import path from "path";

function isPresent(absPath) {
  try {
    return fs.statSync(absPath).size > 0;
  } catch {
    return false; // missing file
  }
}

// recipe.inputs may be absent → returns an empty, all-now-present report.
export function checkReadiness(recipe, playDir) {
  const declared = Array.isArray(recipe.inputs) ? recipe.inputs : [];
  const items = declared.map((i) => ({
    name: i.name,
    path: i.path,
    when: i.when === "later" ? "later" : "now",
    present: isPresent(path.join(playDir, i.path)),
  }));
  const missingNow = items.filter((i) => i.when === "now" && !i.present);
  return { items, missingNow, allNowPresent: missingNow.length === 0 };
}

// Render the report as plain English. No acronyms, no gate numbers.
export function formatReadiness(report, playName) {
  const now = report.items.filter((i) => i.when === "now");
  const later = report.items.filter((i) => i.when === "later");
  const lines = [`Play readiness — ${playName}`];

  if (now.length) {
    lines.push("  Ready for this run:");
    for (const i of now) {
      lines.push(i.present
        ? `    ✓ ${i.name.padEnd(18)} ${i.path}`
        : `    ✗ ${i.name.padEnd(18)} (no file: ${i.path})`);
    }
  }
  if (later.length) {
    lines.push("  Not yet (needed for outreach, not this run):");
    for (const i of later) {
      lines.push(i.present
        ? `    ✓ ${i.name.padEnd(18)} ${i.path}`
        : `    — ${i.name.padEnd(18)} (no file)`);
    }
  }
  if (!report.items.length) {
    lines.push("  (no inputs declared in this recipe)");
  } else if (report.allNowPresent) {
    lines.push("  All inputs for this run are present. Proceeding.");
  } else {
    const names = report.missingNow.map((i) => i.name).join(", ");
    lines.push(`  Missing for this run: ${names}. Proceeding anyway — add --strict to stop on missing inputs.`);
  }
  return lines.join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/nplmini/code/work/systems/revops-engine && node --test lib/readiness.test.mjs`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/nplmini/code/work
git add systems/revops-engine/lib/readiness.mjs systems/revops-engine/lib/readiness.test.mjs
git commit -m "revops-engine: input readiness check (report, not gate) + tests"
```

---

### Task 2: Add the `inputs` list to the ngAbs recipe

**Files:**
- Modify: `/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/prep-recipe.json`

- [ ] **Step 1: Add the `inputs` array**

Edit `/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/prep-recipe.json` to insert an `inputs` array between `configDir` and `stages` (keep `stages` exactly as-is). The full file becomes:

```json
{
  "system": "revops-engine",
  "configDir": "classifier",
  "inputs": [
    { "name": "offer",              "path": "../../artifacts/revops-offer-ngabs.md",        "when": "now" },
    { "name": "segment",            "path": "../../artifacts/revops-segment-ngabs.md",      "when": "now" },
    { "name": "screening criteria", "path": "classifier/classifier-prompt.md",              "when": "now" },
    { "name": "client guidance",    "path": "client-guidance.md",                           "when": "now" },
    { "name": "contact titles",     "path": "../../artifacts/revops-icp-titles-ngabs.md",   "when": "later" },
    { "name": "sender voice",       "path": "../../artifacts/revops-sender-voice-ngabs.md", "when": "later" },
    { "name": "outreach copy",      "path": "../../artifacts/revops-copy-ngabs.md",         "when": "later" }
  ],
  "stages": [
    { "stage": "stage1",          "entity": "companies", "config": "stage1-deterministic.sql" },
    { "stage": "classify",        "entity": "companies" },
    { "stage": "dedup",           "entity": "companies", "config": "dedup-rules.json" },
    { "stage": "route",           "entity": "contacts",  "config": "routing-rules.json" },
    { "stage": "contacts_screen", "entity": "contacts",  "config": "contacts-screen-rules.json" }
  ]
}
```

- [ ] **Step 2: Validate the readiness report against real files**

Run from `/Users/nplmini/code/work/systems/revops-engine`:
```bash
node --input-type=module -e "import {loadRecipe} from './lib/recipe.mjs'; import {checkReadiness,formatReadiness} from './lib/readiness.mjs'; const d='/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies'; const r=loadRecipe(d); console.log(formatReadiness(checkReadiness(r,d),'ngabs'));"
```
Expected: the four `now` inputs all show `✓` (offer, segment, screening criteria, client guidance — these files exist), the three `later` inputs show `—` (no file yet), and the closing line is `All inputs for this run are present. Proceeding.`

- [ ] **Step 3: Commit**

```bash
cd /Users/nplmini/code/work
git add accounts/clients/teknova/plays/ngabs-next-gen-antibodies/prep-recipe.json
git commit -m "ngabs: declare input documents (inputs list) in prep-recipe"
```

---

### Task 3: Wire the readiness report into run-prep + `--strict`

**Files:**
- Modify: `/Users/nplmini/code/work/systems/revops-engine/run-prep.mjs`

- [ ] **Step 1: Add the import**

In `/Users/nplmini/code/work/systems/revops-engine/run-prep.mjs`, add this import after the existing `import { loadRecipe, resolveStages } from "./lib/recipe.mjs";` line:

```javascript
import { checkReadiness, formatReadiness } from "./lib/readiness.mjs";
```

- [ ] **Step 2: Parse the `--strict` flag**

Immediately after the existing line `const flag = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };`, add:

```javascript
const strict = argv.includes("--strict");
```

- [ ] **Step 3: Print readiness before seeding the run**

In `/Users/nplmini/code/work/systems/revops-engine/run-prep.mjs`, find this block:

```javascript
const recipe = loadRecipe(playDir);
const stages = resolveStages(recipe, playDir); // throws on a malformed recipe (fail fast, before any run)
const runId = randomUUID();
```

Replace it with:

```javascript
const recipe = loadRecipe(playDir);
const stages = resolveStages(recipe, playDir); // throws on a malformed recipe (fail fast, before any run)

const readiness = checkReadiness(recipe, playDir);
console.log(formatReadiness(readiness, path.basename(playDir)));
if (strict && !readiness.allNowPresent) {
  console.error("--strict: an input needed for this run is missing — stopping.");
  process.exit(1);
}

const runId = randomUUID();
```

(`path` is already imported at the top of the file.)

- [ ] **Step 4: Behavioral verification — readiness prints, run proceeds**

Run from `/Users/nplmini/code/work/systems/revops-engine`: `node run-prep.mjs ngabs_2026_06_05`
Expected: the readiness report prints first (4 `now` ✓, 3 `later` —, closing `All inputs for this run are present. Proceeding.`), then the funnel runs and ends `complete (5/5)`.

Note: the DB (Supabase project `mrmnyscurmkfppicqqhk`) occasionally returns HTTP 544 during cron-refresh windows. If a stage's DB write fails with 544, just re-run — it's transient infra, not a code bug.

- [ ] **Step 5: Behavioral verification — missing "now" input warns but proceeds**

Temporarily edit `/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/prep-recipe.json`: change the `segment` input's `path` to `../../artifacts/does-not-exist.md`. Run `node run-prep.mjs ngabs_2026_06_05`.
Expected: report shows `✗ segment (no file: ...)` and closing line `Missing for this run: segment. Proceeding anyway — add --strict to stop on missing inputs.`, then the run still completes `(5/5)`.
Then verify `--strict` stops it: `node run-prep.mjs ngabs_2026_06_05 --strict`.
Expected: prints the report, then `--strict: an input needed for this run is missing — stopping.` and exits non-zero BEFORE the funnel starts (no `=== stage1 ===` line).
Then restore the recipe: `cd /Users/nplmini/code/work && git checkout accounts/clients/teknova/plays/ngabs-next-gen-antibodies/prep-recipe.json`. Confirm `segment` points back at `../../artifacts/revops-segment-ngabs.md`.

- [ ] **Step 6: Commit**

```bash
cd /Users/nplmini/code/work
git add systems/revops-engine/run-prep.mjs
git commit -m "revops-engine: run-prep prints input readiness; --strict stops on missing inputs"
```
Before committing, run `git status` and confirm `prep-recipe.json` is NOT modified (restored in Step 5) — only `run-prep.mjs` is staged.

---

## Notes

- After all three tasks, the Phase 3 `Done when` is met: a run reports (in plain English) which input documents are present/missing and proceeds, with `--strict` available to stop on a missing needed input. Flip Phase 3 to `done` in `/Users/nplmini/code/work/practices/agentic-systems/ROADMAP.md` and move the resume pointer to Phase 4.
- This honors `feedback_no_blocker_overbuild`: zero new default hard-stops, plain-English output, no invented acronyms, the contract visible in the recipe.
