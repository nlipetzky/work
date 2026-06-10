# System Registry & Evolving-State View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A repo-file registry of the studio's systems (emit contracts, asset/context inventories, lifecycle) rendered by three projection-ui views: review-surface home, constellation map, contract-first system page.

**Architecture:** Registry data lives at `/Users/nplmini/code/work/registry/` as `system.md` files with structured YAML frontmatter (spec: `practices/agentic-systems/specs/2026-06-10-system-registry-design.md`). A typed parser/validator (`lib/registry.ts`, vitest-tested) is the single reading path. Three Next.js API routes expose list/detail/review; three client pages render them following the existing Context-reader pattern (localhost-only, path-guarded, dark ink Tailwind theme).

**Tech Stack:** Next.js 15 (app router, existing projection-ui on port 4180), gray-matter (frontmatter), vitest (new devDep), git CLI via `child_process` for the diff feed.

**Environment notes for the executor:**
- projection-ui dir: `/Users/nplmini/code/work/systems/projection-ui/`. Dev server: `npm run dev` (port 4180).
- `curl`/`wget` are BLOCKED in this environment. Verify HTTP endpoints with the sandbox: `ctx_execute(language: "javascript", code: "const r = await fetch('http://localhost:4180/...'); console.log(await r.text())")`.
- Commit messages follow repo style: `projection-ui: ...` / `registry: ...` prefixes, end with the Claude co-author line.
- All paths below are absolute or relative to `/Users/nplmini/code/work/`.

---

### Task 1: Dependencies and test script

**Files:**
- Modify: `systems/projection-ui/package.json`

- [ ] **Step 1: Install deps**

```bash
cd /Users/nplmini/code/work/systems/projection-ui
npm install gray-matter
npm install -D vitest
```

- [ ] **Step 2: Add test script**

In `package.json` scripts, add:

```json
"test": "vitest run"
```

- [ ] **Step 3: Verify vitest runs (no tests yet)**

Run: `npx vitest run --passWithNoTests`
Expected: "No test files found" + exit 0.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "projection-ui: add gray-matter + vitest for system registry"
```

---

### Task 2: Registry parser — types and `parseSystemMd`

**Files:**
- Create: `systems/projection-ui/lib/registry.ts`
- Test: `systems/projection-ui/lib/registry.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// systems/projection-ui/lib/registry.test.ts
import { describe, it, expect } from "vitest";
import { parseSystemMd } from "./registry";

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
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run lib/registry.test.ts`
Expected: FAIL — cannot resolve `./registry`.

- [ ] **Step 3: Implement the parser**

```ts
// systems/projection-ui/lib/registry.ts
import matter from "gray-matter";

export type Lifecycle = "defined" | "designed" | "architected" | "engineering" | "operating";
export type Autonomy = "manual" | "assisted" | "supervised" | "autonomous";
export type SystemClass = "core" | "supporting" | "generic";

export interface ContractIO { name: string; status: string }
export interface Metric { name: string; value: string | number | null }
export interface Contract {
  inputs: ContractIO[];
  outputs: ContractIO[];
  metrics: Metric[];
  stopping?: string;
  failure?: string;
  escalation?: string[];
  cost_envelope?: Record<string, string>;
}
export interface AssetRow {
  name: string; type: string; ownership: string;
  status: string; verified_by: string | null; note?: string;
}
export interface ContextRow {
  name: string; version: string | null;
  status: string; verified_by: string | null; note?: string;
}
export interface SystemRecord {
  name: string; slug: string; home: string; clusters: string[];
  class: SystemClass; lifecycle: Lifecycle; flags: string[];
  autonomy: Autonomy; outcome: string; stub: boolean;
  runs_surface: string | null;
  contract: Contract | null;
  assets: AssetRow[]; context: ContextRow[];
  body: string; file: string;
}

const LIFECYCLES: Lifecycle[] = ["defined", "designed", "architected", "engineering", "operating"];
const AUTONOMY: Autonomy[] = ["manual", "assisted", "supervised", "autonomous"];
const CLASSES: SystemClass[] = ["core", "supporting", "generic"];
const REQUIRED = ["name", "slug", "home", "class", "lifecycle", "autonomy", "outcome"] as const;

function fail(file: string, msg: string): never {
  throw new Error(`${file}: ${msg}`);
}

export function parseSystemMd(content: string, file: string): SystemRecord {
  const { data, content: body } = matter(content);
  for (const k of REQUIRED) {
    if (data[k] === undefined || data[k] === null || data[k] === "")
      fail(file, `missing required field "${k}"`);
  }
  if (!LIFECYCLES.includes(data.lifecycle))
    fail(file, `unknown lifecycle "${data.lifecycle}" (allowed: ${LIFECYCLES.join(", ")})`);
  if (!AUTONOMY.includes(data.autonomy))
    fail(file, `unknown autonomy "${data.autonomy}" (allowed: ${AUTONOMY.join(", ")})`);
  if (!CLASSES.includes(data.class))
    fail(file, `unknown class "${data.class}" (allowed: ${CLASSES.join(", ")})`);

  const contract: Contract | null = data.contract
    ? {
        inputs: data.contract.inputs ?? [],
        outputs: data.contract.outputs ?? [],
        metrics: data.contract.metrics ?? [],
        stopping: data.contract.stopping,
        failure: data.contract.failure,
        escalation: data.contract.escalation ?? [],
        cost_envelope: data.contract.cost_envelope,
      }
    : null;

  return {
    name: String(data.name),
    slug: String(data.slug),
    home: String(data.home),
    clusters: data.clusters ?? [],
    class: data.class,
    lifecycle: data.lifecycle,
    flags: data.flags ?? [],
    autonomy: data.autonomy,
    outcome: String(data.outcome).trim(),
    stub: data.stub === true,
    runs_surface: data.runs_surface ?? null,
    contract,
    assets: (data.assets ?? []).map((a: AssetRow) => ({ verified_by: null, ...a })),
    context: (data.context ?? []).map((c: ContextRow) => ({ verified_by: null, version: null, ...c })),
    body: body.trim(),
    file,
  };
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run lib/registry.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/registry.ts lib/registry.test.ts
git commit -m "projection-ui: registry parser — typed system.md records"
```

---

### Task 3: Registry loader + frontier-gate warnings

**Files:**
- Modify: `systems/projection-ui/lib/registry.ts`
- Modify: `systems/projection-ui/lib/registry.test.ts`

- [ ] **Step 1: Write the failing tests** (append to `lib/registry.test.ts`)

```ts
import { validateRecord, loadRegistry } from "./registry";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

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
```

- [ ] **Step 2: Run tests, verify the new ones fail**

Run: `npx vitest run lib/registry.test.ts`
Expected: FAIL — `validateRecord`/`loadRegistry` not exported.

- [ ] **Step 3: Implement** (append to `lib/registry.ts`)

```ts
import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";

const NEEDS_PROOF = new Set(["tested", "evaled"]);

export function validateRecord(r: SystemRecord): string[] {
  const w: string[] = [];
  for (const row of [...r.assets, ...r.context]) {
    if (NEEDS_PROOF.has(row.status) && !row.verified_by)
      w.push(`"${row.name}" claims ${row.status} but has no verified_by (filled is not trusted)`);
  }
  if (r.lifecycle === "operating" && !r.runs_surface)
    w.push(`claims operating but no runs_surface — runs must be visible before a system is Operating`);
  return w;
}

export interface RegistryEntry { record: SystemRecord; warnings: string[] }
export interface Registry {
  systems: RegistryEntry[];
  errors: string[];
  lastReviewed: string | null;
}

export function loadRegistry(root: string): Registry {
  const systems: RegistryEntry[] = [];
  const errors: string[] = [];
  let lastReviewed: string | null = null;

  const metaPath = path.join(root, "_meta.yml");
  if (existsSync(metaPath)) {
    const m = readFileSync(metaPath, "utf8").match(/last_reviewed:\s*(\S+)/);
    if (m) lastReviewed = m[1];
  }

  for (const c of readdirSync(root, { withFileTypes: true })) {
    if (!c.isDirectory() || c.name.startsWith("_") || c.name.startsWith(".")) continue;
    const cDir = path.join(root, c.name);
    for (const s of readdirSync(cDir, { withFileTypes: true })) {
      if (!s.isDirectory()) continue;
      const file = path.join(cDir, s.name, "system.md");
      if (!existsSync(file)) continue;
      try {
        const record = parseSystemMd(readFileSync(file, "utf8"), file);
        systems.push({ record, warnings: validateRecord(record) });
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
  }
  systems.sort((a, b) => a.record.slug.localeCompare(b.record.slug));
  return { systems, errors, lastReviewed };
}
```

- [ ] **Step 4: Run tests, verify all pass**

Run: `npx vitest run lib/registry.test.ts`
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/registry.ts lib/registry.test.ts
git commit -m "projection-ui: registry loader + frontier-gate warnings (verified_by, runs-visibility)"
```

---

### Task 4: Seed registry — meta, demand-context (full), review queue item

**Files:**
- Create: `registry/_meta.yml`
- Create: `registry/signal/demand-context/system.md`
- Create: `registry/_review/2026-06-10-demand-context-definition.md`

- [ ] **Step 1: Write `registry/_meta.yml`**

```yaml
last_reviewed: 2026-06-09T17:54:00-05:00
registry_version: 1
```

- [ ] **Step 2: Write `registry/signal/demand-context/system.md`**

```markdown
---
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
runs_surface: null
contract:
  inputs:
    - {name: Expert transcripts (CMO intake), status: manual}
    - {name: Expert email threads, status: unwired}
    - {name: Play documents (offer, brief), status: live}
    - {name: Run results (qualified / rejected), status: unwired}
  outputs:
    - {name: Observations (graded, sourced), status: off}
    - {name: Patterns (durable claims), status: off}
    - {name: Consuming artifacts (ICP, segment, classifier), status: handmade}
  metrics:
    - {name: Artifact claims traceable to evidence, value: null}
    - {name: Observation freshness, value: null}
    - {name: Patterns confirmed vs refuted by runs, value: null}
  stopping: >
    Per capture event: all signal extracted to observations with provenance.
    Per play: consuming artifacts validated against play criteria, expert-approved.
  failure: >
    Missing input: proceed and report, no silent skip. Low-confidence extraction:
    grade it low, never drop the verbatim.
  escalation: ["spend -> approval gate", "expert boundary -> Hermes"]
  cost_envelope: {per_run: "LLM extraction only; no paid providers"}
assets:
  - {name: Observation store, type: database, ownership: own, status: to-build, verified_by: null,
     note: "Postgres schema — verbatim + provenance + evidence grade"}
  - {name: Capture-event log, type: database, ownership: own, status: to-build, verified_by: null,
     note: "one row per signal capture; event #1 = CMO intake 2026-06-10"}
  - {name: Ingestion pipeline, type: inngest-function, ownership: own, status: to-build, verified_by: null,
     note: "transcript lands -> extraction runs -> observations written"}
  - {name: Context panel, type: surface, ownership: own, status: to-build, verified_by: null,
     note: "projection-ui per-batch view of the context behind a list"}
  - {name: Canon corpus, type: database, ownership: "shared:canon-ingestion", status: connected, verified_by: null,
     note: "bespoke read — pulls capture events (transcripts, email_threads)"}
  - {name: Play bundles, type: filesystem, ownership: "shared:signal-prospecting", status: building, verified_by: null,
     note: "bespoke write — consuming artifacts land in per-play folders, hand-made today"}
context:
  - {name: Evidence-grading rubric, version: v1, status: defined, verified_by: null,
     note: "part of the demand-context methodology locked 2026-06-10"}
  - {name: Extraction skill, version: null, status: to-write, verified_by: null,
     note: "signal -> graded observations, verbatim preserved, provenance attached"}
  - {name: Synthesis skill, version: null, status: to-write, verified_by: null,
     note: "observations -> patterns -> consuming artifacts (ICP, segment, classifier)"}
  - {name: Demand knowledge base, version: null, status: to-write, verified_by: null,
     note: "the accumulated observations + patterns; seeds with capture event #1"}
---

Extracts data, information, and insight from transcripts and other demand-side sources so
outbound plays truly understand the marketing target. Methodology: signal -> observation ->
pattern -> consuming artifact, verbatim + provenance + evidence grades, manual first.

Roadmap (closes the contract gaps):
- **v0 (active)** — capture CMO intake by hand; first graded observations. Proves the extraction.
- **v1** — observation schema + capture log become real; observations output turns on.
- **v2** — synthesis turns on; consuming artifacts generated, not hand-made; metrics measurable.
- **v3** — run-results input wired; the feedback leg closes (depends: signal-prospecting).
```

- [ ] **Step 3: Write `registry/_review/2026-06-10-demand-context-definition.md`**

```markdown
---
type: artifact-approval
system: demand-context
evidence: registry/signal/demand-context/system.md
proposed: "Approve the emit contract -> lifecycle moves defined -> designed once decomposition is reviewed"
created: 2026-06-10
---

The demand-context system entered the registry at Defined with its emit contract drawn from the
methodology locked 2026-06-10. Approving confirms the contract (one outcome, inputs/outputs,
stopping, failure, escalation, cost envelope) as the build target.
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nplmini/code/work
git add registry/
git commit -m "registry: seed — meta, demand-context (full record), first review item"
```

---

### Task 5: Seed registry — signal-prospecting (full, the operating-adjacent example)

**Files:**
- Create: `registry/signal/signal-prospecting/system.md`

- [ ] **Step 1: Write the record**

```markdown
---
name: Signal Prospecting
slug: signal-prospecting
home: signal
clusters: [revops]
class: core
lifecycle: engineering
flags: []
autonomy: supervised
outcome: >
  More qualified opportunities than we can pursue — sourced, screened, and promoted
  with the work visible while it moves.
runs_surface: "projection-ui PrepRunStrip (/runs) over public.prep_run_status"
contract:
  inputs:
    - {name: Play bundle (recipe, criteria, classifier config), status: live}
    - {name: Source batches (Apollo / Explorium / CSV loaders), status: live}
    - {name: Consuming artifacts from demand context, status: handmade}
  outputs:
    - {name: Qualified rows promoted to Core, status: live}
    - {name: Per-batch prep plan artifact, status: live}
    - {name: Per-stage run status, status: live}
  metrics:
    - {name: Stage pass-through counts per batch, value: "per-run, on /runs"}
    - {name: Plays proven end-to-end, value: 2}
  stopping: >
    Per batch: every stage in the play recipe ran, qualifying rows promoted idempotently,
    approval stop before anything leaves the system.
  failure: >
    Stage error -> run status marks error with counts, batch halts, nothing promotes silently.
  escalation: ["spend -> approval gate (Phase 5, not yet built)", "criteria conflict -> operator"]
  cost_envelope: {per_run: "LLM classify stage; paid sourcing currently UNGATED — Phase 5 closes this"}
assets:
  - {name: Staging schema + promote_staging_batch, type: database, ownership: own, status: operating,
     verified_by: null, note: "Postgres staging.* + SECURITY DEFINER RPC (migration 0008)"}
  - {name: Prep runners (stage1, classify, dedup, route, contacts-screen), type: script, ownership: own,
     status: tested, verified_by: "systems/revops-engine test suite (21/21, node --test)",
     note: "recipe-driven, play-agnostic since Phase 4"}
  - {name: run-prep orchestrator + --print-plan, type: script, ownership: own, status: tested,
     verified_by: "systems/revops-engine/run-prep.print-plan.test.mjs"}
  - {name: prep_run_status + run-status CLI, type: database, ownership: own, status: operating,
     verified_by: null, note: "the observability spine (migration 0011)"}
  - {name: PrepRunStrip + /api/runs/status, type: surface, ownership: own, status: operating,
     verified_by: null, note: "the live progress bar over a prep run"}
  - {name: Source loaders (Apollo, Explorium, CSV), type: script, ownership: own, status: built,
     verified_by: null, note: "explorium pull needs industry filter before next real run"}
  - {name: Canon corpus, type: database, ownership: "shared:canon-ingestion", status: connected,
     verified_by: null, note: "bespoke read — engagement context for play sessions"}
context:
  - {name: play-prep skill (planner + executor), version: phase-4, status: drafted, verified_by: null,
     note: "agent drives the funnel via the status CLI; validated on two plays"}
  - {name: Per-play classifier prompts, version: null, status: drafted, verified_by: null,
     note: "hand-made today; demand context v2 generates these"}
  - {name: Play recipes (prep-recipe.json), version: phase-2, status: drafted, verified_by: null,
     note: "run-as-data; stage registry bounds what a recipe may name"}
---

The prep/screen funnel of the owned execution engine (systems/revops-engine + projection-ui).
Build phases 0-4 done; Phase 5 (approval gate) and Phase 6 (full funnel) pending — see
practices/agentic-systems/ROADMAP.md until those phases migrate here.

Roadmap:
- **next** — approval gate ahead of paid stages (ROADMAP Phase 5); closes the ungated-spend hole.
- **later** — full funnel beyond prep (ROADMAP Phase 6).
- **later** — consume generated artifacts from demand-context v2 instead of hand-made criteria.
```

- [ ] **Step 2: Commit**

```bash
git add registry/signal/signal-prospecting/
git commit -m "registry: seed — signal-prospecting full record (prep funnel, runs-visible)"
```

---

### Task 6: Seed registry — 23 stubs from the constellation docs

**Files:**
- Create: `registry/<constellation>/<slug>/system.md` × 23

- [ ] **Step 1: Generate stubs from the template and table**

Template (replace `<...>` per row; `outcome` is the "produces which good" line from the docs):

```markdown
---
name: <Name>
slug: <slug>
home: <constellation>
clusters: []
class: <class>
lifecycle: <lifecycle>
flags: []
autonomy: manual
outcome: >
  <outcome>
stub: true
---

Stub seeded 2026-06-10 from `practices/agentic-systems/constellations/<constellation>.md`.
Promote by completing the emit contract (see the spec's lifecycle gates).
```

Coverage→lifecycle mapping: Have → `operating`, Partial → `engineering`, Missing → `defined`.
(Operating stubs will show a runs-visibility warning. That is intended — the gate working.)

| constellation | name | slug | class | lifecycle | outcome |
|---|---|---|---|---|---|
| canon | Canon Ingestion | canon-ingestion | supporting | operating | nothing is lost; every source lands |
| canon | Canon Context Service | canon-context-service | core | engineering | context arrives where it's needed; same answer for human and agent |
| canon | Canon Currency | canon-currency | core | defined | the corpus stays true; nobody acts on stale truth |
| compass | Compass Intent | compass-intent | supporting | engineering | priorities traceable to intent; the shared answer to "why" |
| compass | Compass Planning | compass-planning | core | engineering | a committed plan; work traces to objectives; decided once |
| compass | Compass Course-Correction | compass-course-correction | core | defined | plan updates when reality changes; old direction retired |
| forge | Forge Design | forge-design | core | engineering | the right thing; solves the actual need |
| forge | Forge Production | forge-production | core | engineering | shipped fast and durable |
| forge | Forge Toolkit | forge-toolkit | supporting | engineering | reuses blocks; consistent quality; compounds |
| garden | CRM + Motions | crm-motions | core | engineering | nothing goes cold; each relationship is progressed |
| garden | Garden Expansion | garden-expansion | core | engineering | existing clients expand; revenue per account grows |
| garden | Garden Health | garden-health | core | defined | churn never a surprise; whole-book visibility |
| guard | Guard Policy | guard-policy | core | engineering | agents stay in the lines; expert never misrepresented |
| guard | Guard Oversight | guard-oversight | core | defined | nothing slips unnoticed; caught before damage |
| guard | Guard Data Protection | guard-data-protection | supporting | engineering | no leaks; privacy honored |
| pulse | Pulse Closing | pulse-closing | core | defined | yes -> signed, fast, no stall at the close |
| pulse | Pulse Billing | pulse-billing | generic | defined | gets paid; renewals on cadence |
| pulse | Pulse Ledger | pulse-ledger | supporting | defined | nothing slips; full commercial visibility |
| signal | Signal Targeting | signal-targeting | supporting | engineering | what's surfaced fits; point-it-at-a-new-segment |
| signal | Signal Monitoring | signal-monitoring | core | defined | surfaced while actionable; sees shifts early |
| voice | Voice Authoring | voice-authoring | core | engineering | sounds like the person; speak-as-a-persona faithfully |
| voice | Voice Delivery | voice-delivery | core | engineering | reaches the market at scale, consistently |
| voice | Voice Listening | voice-listening | core | defined | nothing unheard; conversations continue |

(Signal Prospecting is NOT stubbed — Task 5 made it a full record. Total: 25 systems.)

- [ ] **Step 2: Verify count**

Run: `find /Users/nplmini/code/work/registry -name system.md | wc -l`
Expected: 25

- [ ] **Step 3: Commit**

```bash
git add registry/
git commit -m "registry: seed — 23 system stubs from the constellation authority docs"
```

---

### Task 7: Real-registry smoke test

**Files:**
- Create: `systems/projection-ui/lib/registry.smoke.test.ts`

- [ ] **Step 1: Write the test**

```ts
// systems/projection-ui/lib/registry.smoke.test.ts
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
```

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: all pass (10 tests). If parse errors surface, fix the seeded YAML — the test is the gate.

- [ ] **Step 3: Commit**

```bash
git add lib/registry.smoke.test.ts
git commit -m "projection-ui: smoke test — the real registry must always parse clean"
```

---

### Task 8: API routes — list, detail (+history), review (queue + diff feed)

**Files:**
- Create: `systems/projection-ui/app/api/system/list/route.ts`
- Create: `systems/projection-ui/app/api/system/detail/route.ts`
- Create: `systems/projection-ui/app/api/system/review/route.ts`

- [ ] **Step 1: Write the list route**

```ts
// app/api/system/list/route.ts
import { NextResponse } from "next/server";
import { loadRegistry } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = "/Users/nplmini/code/work/registry";

export async function GET() {
  const reg = loadRegistry(ROOT);
  const systems = reg.systems.map(({ record, warnings }) => ({
    name: record.name, slug: record.slug, home: record.home,
    clusters: record.clusters, class: record.class, lifecycle: record.lifecycle,
    autonomy: record.autonomy, flags: record.flags, stub: record.stub,
    outcome: record.outcome, warnings,
  }));
  return NextResponse.json({ count: systems.length, systems, errors: reg.errors });
}
```

- [ ] **Step 2: Write the detail route** (full record + git history of the system dir)

```ts
// app/api/system/detail/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { parseSystemMd, validateRecord } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORK = "/Users/nplmini/code/work";
const ROOT = path.join(WORK, "registry");
const run = promisify(execFile);

export async function GET(req: NextRequest) {
  const constellation = req.nextUrl.searchParams.get("constellation") || "";
  const slug = req.nextUrl.searchParams.get("slug") || "";
  if (!/^[a-z0-9-]+$/.test(constellation) || !/^[a-z0-9-]+$/.test(slug))
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  const dir = path.join(ROOT, constellation, slug);
  const file = path.join(dir, "system.md");
  if (!file.startsWith(ROOT) || !existsSync(file))
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const record = parseSystemMd(readFileSync(file, "utf8"), file);
  const warnings = validateRecord(record);

  let history: { hash: string; date: string; subject: string }[] = [];
  try {
    const { stdout } = await run(
      "git", ["log", "-15", "--pretty=format:%h|%ad|%s", "--date=format:%Y-%m-%d %H:%M", "--", dir],
      { cwd: WORK }
    );
    history = stdout.split("\n").filter(Boolean).map((l) => {
      const [hash, date, ...s] = l.split("|");
      return { hash, date, subject: s.join("|") };
    });
  } catch { /* git unavailable: history stays empty */ }

  return NextResponse.json({ record, warnings, history });
}
```

- [ ] **Step 3: Write the review route** (queue items + commits since last_reviewed)

```ts
// app/api/system/review/route.ts
import { NextResponse } from "next/server";
import { readdirSync, readFileSync, existsSync } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import matter from "gray-matter";
import { loadRegistry } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORK = "/Users/nplmini/code/work";
const ROOT = path.join(WORK, "registry");
const run = promisify(execFile);

export async function GET() {
  const reg = loadRegistry(ROOT);

  const queueDir = path.join(ROOT, "_review");
  const queue = !existsSync(queueDir) ? [] :
    readdirSync(queueDir).filter((f) => f.endsWith(".md")).sort().map((f) => {
      const { data, content } = matter(readFileSync(path.join(queueDir, f), "utf8"));
      return { file: f, type: data.type ?? "decision", system: data.system ?? null,
               evidence: data.evidence ?? null, proposed: data.proposed ?? "",
               created: String(data.created ?? ""), body: content.trim() };
    });

  let diff: { hash: string; date: string; subject: string }[] = [];
  if (reg.lastReviewed) {
    try {
      const { stdout } = await run(
        "git", ["log", `--since=${reg.lastReviewed}`, "--pretty=format:%h|%ad|%s",
                "--date=format:%Y-%m-%d %H:%M", "--", "registry/"],
        { cwd: WORK }
      );
      diff = stdout.split("\n").filter(Boolean).map((l) => {
        const [hash, date, ...s] = l.split("|");
        return { hash, date, subject: s.join("|") };
      });
    } catch { /* empty diff if git fails */ }
  }

  return NextResponse.json({ lastReviewed: reg.lastReviewed, queue, diff, errors: reg.errors });
}
```

- [ ] **Step 4: Verify against the dev server**

Start if down: `cd systems/projection-ui && npm run dev` (background). Then sandbox-fetch
(curl is blocked):

```javascript
for (const u of ["list", "review", "detail?constellation=signal&slug=demand-context"]) {
  const r = await fetch(`http://localhost:4180/api/system/${u}`);
  const j = await r.json();
  console.log(u, r.status, JSON.stringify(j).slice(0, 200));
}
```

Expected: three 200s; list shows `count: 25, errors: []`; review shows 1 queue item; detail
returns the demand-context record.

- [ ] **Step 5: Commit**

```bash
git add app/api/system/
git commit -m "projection-ui: /api/system list + detail + review routes over the registry"
```

---

### Task 9: Shared UI bits + Nav link

**Files:**
- Create: `systems/projection-ui/components/system/Bits.tsx`
- Modify: `systems/projection-ui/components/Nav.tsx:6-13`

- [ ] **Step 1: Write the shared chips/cards**

```tsx
// components/system/Bits.tsx
const TONE: Record<string, string> = {
  // io + row statuses -> tailwind tones (dark theme)
  live: "bg-emerald-900/60 text-emerald-300", operating: "bg-emerald-900/60 text-emerald-300",
  connected: "bg-emerald-900/60 text-emerald-300", tested: "bg-emerald-900/60 text-emerald-300",
  evaled: "bg-emerald-900/60 text-emerald-300", defined: "bg-emerald-900/60 text-emerald-300",
  manual: "bg-amber-900/60 text-amber-300", handmade: "bg-amber-900/60 text-amber-300",
  building: "bg-amber-900/60 text-amber-300", drafted: "bg-amber-900/60 text-amber-300",
  built: "bg-sky-900/60 text-sky-300",
  unwired: "bg-red-900/60 text-red-300", off: "bg-red-900/60 text-red-300",
  "to-build": "bg-red-900/60 text-red-300", "to-write": "bg-red-900/60 text-red-300",
};

export function StatusChip({ value }: { value: string }) {
  const tone = TONE[value] ?? "bg-ink-800 text-muted";
  return <span className={`rounded px-2 py-0.5 text-xs whitespace-nowrap ${tone}`}>{value}</span>;
}

const LIFE_TONE: Record<string, string> = {
  defined: "bg-ink-800 text-muted", designed: "bg-sky-900/60 text-sky-300",
  architected: "bg-sky-900/60 text-sky-300", engineering: "bg-amber-900/60 text-amber-300",
  operating: "bg-emerald-900/60 text-emerald-300",
};

export function LifecycleChip({ value }: { value: string }) {
  return <span className={`rounded px-2 py-0.5 text-xs ${LIFE_TONE[value] ?? "bg-ink-800 text-muted"}`}>{value}</span>;
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-white">
        {title} {hint && <span className="ml-1 font-normal text-ink-600">{hint}</span>}
      </h2>
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Add the Nav link**

In `components/Nav.tsx`, add to `LINKS` after the `/context` entry:

```ts
  { href: "/system", label: "System" },
```

- [ ] **Step 3: Commit**

```bash
git add components/system/Bits.tsx components/Nav.tsx
git commit -m "projection-ui: system view shared chips + nav link"
```

---

### Task 10: `/system` — home review surface

**Files:**
- Create: `systems/projection-ui/app/system/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// app/system/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type QueueItem = { file: string; type: string; system: string | null; evidence: string | null; proposed: string; created: string; body: string };
type Commit = { hash: string; date: string; subject: string };
type Review = { lastReviewed: string | null; queue: QueueItem[]; diff: Commit[]; errors: string[] };

export default function SystemHome() {
  const [data, setData] = useState<Review | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/system/review")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <main className="p-6 text-red-400">{err}</main>;
  if (!data) return <main className="p-6 text-muted">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-white">Agentic System</h1>
        <span className="text-xs text-ink-600">
          last reviewed {data.lastReviewed ?? "never"}
        </span>
      </div>

      {data.errors.length > 0 && (
        <div className="mb-4 rounded border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
          {data.errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold text-white">
        Awaiting your review <span className="font-normal text-ink-600">({data.queue.length})</span>
      </h2>
      <div className="mb-8 space-y-2">
        {data.queue.length === 0 && <p className="text-sm text-muted">Queue is empty.</p>}
        {data.queue.map((q) => (
          <div key={q.file} className="rounded border border-ink-700 bg-ink-900 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-white">{q.proposed}</p>
              <span className="text-xs text-ink-600">{q.created}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{q.body}</p>
            <p className="mt-2 text-xs text-ink-600">
              {q.type}{q.system ? ` · ${q.system}` : ""}{q.evidence ? ` · evidence: ${q.evidence}` : ""}
              <span className="ml-2 text-ink-700">resolve in a Claude Code session — v0 is read-only</span>
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-white">Since your last review</h2>
      <div className="mb-8 border-l-2 border-ink-700 pl-4">
        {data.diff.length === 0 && <p className="text-sm text-muted">No registry changes.</p>}
        {data.diff.map((c) => (
          <div key={c.hash} className="py-1.5">
            <p className="text-sm text-white">{c.subject}</p>
            <p className="text-xs text-ink-600">{c.date} · {c.hash}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 border-t border-ink-800 pt-4 text-sm">
        <span className="text-muted">Browse:</span>
        <Link href="/system/map" className="text-sky-400 hover:underline">Constellation map</Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Sandbox-fetch `http://localhost:4180/system` — expect 200 and HTML containing
"Awaiting your review". Visual check in browser if available.

- [ ] **Step 3: Commit**

```bash
git add app/system/page.tsx
git commit -m "projection-ui: /system home — review queue + diff since last review"
```

---

### Task 11: `/system/map` — constellation grid

**Files:**
- Create: `systems/projection-ui/app/system/map/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// app/system/map/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LifecycleChip } from "@/components/system/Bits";

type Sys = { name: string; slug: string; home: string; class: string; lifecycle: string; autonomy: string; stub: boolean; outcome: string; warnings: string[] };
type List = { count: number; systems: Sys[]; errors: string[] };

const ORDER = ["canon", "compass", "signal", "forge", "voice", "pulse", "guard", "garden"];
const CLASS_LETTER: Record<string, string> = { core: "C", supporting: "S", generic: "G" };

export default function SystemMap() {
  const [data, setData] = useState<List | null>(null);
  useEffect(() => { fetch("/api/system/list").then((r) => r.json()).then(setData); }, []);
  if (!data) return <main className="p-6 text-muted">Loading…</main>;

  const byHome = new Map<string, Sys[]>();
  for (const s of data.systems) {
    if (!byHome.has(s.home)) byHome.set(s.home, []);
    byHome.get(s.home)!.push(s);
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-white">Constellation map</h1>
        <span className="text-xs text-ink-600">{data.count} systems · <Link href="/system" className="text-sky-400 hover:underline">review surface</Link></span>
      </div>
      {data.errors.length > 0 && (
        <div className="mb-4 rounded border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
          {data.errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ORDER.map((home) => (
          <div key={home} className="rounded border border-ink-700 bg-ink-900 p-4">
            <h2 className="mb-2 text-sm font-semibold capitalize text-white">{home}</h2>
            {(byHome.get(home) ?? []).map((s) => (
              <Link key={s.slug} href={`/system/${s.home}/${s.slug}`}
                className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-ink-800">
                <span className="truncate text-muted">
                  {s.name} <span className="text-ink-600">{CLASS_LETTER[s.class]}</span>
                  {s.warnings.length > 0 && <span title={s.warnings.join("\n")} className="ml-1 text-amber-400">⚠</span>}
                </span>
                <span className="flex items-center gap-1.5">
                  {s.stub && <span className="text-xs text-ink-600">stub</span>}
                  <LifecycleChip value={s.lifecycle} />
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Sandbox-fetch `http://localhost:4180/system/map` — expect 200, HTML contains "Constellation map".
Then in the JSON sanity check via `/api/system/list`: canon-ingestion (stub, operating) should
carry a runs-visibility warning — confirm the ⚠ logic has data to show.

- [ ] **Step 3: Commit**

```bash
git add app/system/map/page.tsx
git commit -m "projection-ui: /system/map — constellation grid over the registry"
```

---

### Task 12: `/system/[constellation]/[slug]` — contract-first system page

**Files:**
- Create: `systems/projection-ui/app/system/[constellation]/[slug]/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// app/system/[constellation]/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StatusChip, LifecycleChip, Section } from "@/components/system/Bits";

type Row = { name: string; type?: string; version?: string | null; ownership?: string; status: string; verified_by: string | null; note?: string };
type Detail = {
  record: {
    name: string; slug: string; home: string; clusters: string[]; class: string;
    lifecycle: string; autonomy: string; outcome: string; stub: boolean;
    runs_surface: string | null;
    contract: null | {
      inputs: { name: string; status: string }[];
      outputs: { name: string; status: string }[];
      metrics: { name: string; value: string | number | null }[];
      stopping?: string; failure?: string; escalation?: string[];
      cost_envelope?: Record<string, string>;
    };
    assets: Row[]; context: Row[]; body: string;
  };
  warnings: string[];
  history: { hash: string; date: string; subject: string }[];
};

function RowList({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded border border-ink-700 bg-ink-900">
      {rows.map((r, i) => (
        <div key={r.name} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-ink-800" : ""}`}>
          <div className="min-w-0">
            <p className="text-sm text-white">
              {r.name}
              {r.ownership?.startsWith("shared:") && (
                <span className="ml-2 rounded bg-sky-900/60 px-1.5 py-0.5 text-xs text-sky-300">
                  shared · {r.ownership.slice(7)}
                </span>
              )}
            </p>
            <p className="text-xs text-ink-600">
              {[r.type, r.version ? `v:${r.version}` : null, r.note].filter(Boolean).join(" · ")}
              {r.verified_by && <span className="text-emerald-500"> · verified: {r.verified_by}</span>}
            </p>
          </div>
          <StatusChip value={r.status} />
        </div>
      ))}
      {rows.length === 0 && <p className="px-4 py-2.5 text-sm text-muted">None declared.</p>}
    </div>
  );
}

export default function SystemPage() {
  const { constellation, slug } = useParams<{ constellation: string; slug: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/system/detail?constellation=${constellation}&slug=${slug}`)
      .then(async (r) => { if (!r.ok) throw new Error((await r.json()).error); return r.json(); })
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, [constellation, slug]);

  if (err) return <main className="p-6 text-red-400">{err}</main>;
  if (!data) return <main className="p-6 text-muted">Loading…</main>;
  const r = data.record;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <p className="mb-1 text-xs text-ink-600">
        <Link href="/system/map" className="hover:underline">map</Link> / {r.home}
        {r.clusters.length > 0 && <span> · sells under: {r.clusters.join(", ")}</span>}
      </p>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-white">{r.name}</h1>
        <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-muted">{r.class}</span>
        <LifecycleChip value={r.lifecycle} />
        <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-muted">autonomy: {r.autonomy}</span>
      </div>
      <p className="mb-4 text-sm text-muted"><span className="text-white">One outcome:</span> {r.outcome}</p>

      {data.warnings.length > 0 && (
        <div className="mb-4 rounded border border-amber-800 bg-amber-900/30 p-3 text-sm text-amber-300">
          {data.warnings.map((w) => <div key={w}>⚠ {w}</div>)}
        </div>
      )}

      {r.contract ? (
        <Section title="Emit contract">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded border border-ink-700 bg-ink-900 p-3">
              <p className="mb-1 text-xs text-ink-600">Inputs</p>
              {r.contract.inputs.map((x) => (
                <div key={x.name} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted">{x.name}</span><StatusChip value={x.status} />
                </div>
              ))}
            </div>
            <div className="rounded border border-ink-700 bg-ink-900 p-3">
              <p className="mb-1 text-xs text-ink-600">Outputs</p>
              {r.contract.outputs.map((x) => (
                <div key={x.name} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted">{x.name}</span><StatusChip value={x.status} />
                </div>
              ))}
            </div>
            <div className="rounded border border-ink-700 bg-ink-900 p-3">
              <p className="mb-1 text-xs text-ink-600">Key metrics</p>
              {r.contract.metrics.map((m) => (
                <div key={m.name} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted">{m.name}</span>
                  <span className="text-xs text-ink-600">{m.value ?? "not yet measured"}</span>
                </div>
              ))}
            </div>
            <div className="rounded border border-ink-700 bg-ink-900 p-3 text-sm">
              <p className="mb-1 text-xs text-ink-600">Stopping · failure · escalation · cost</p>
              {r.contract.stopping && <p className="text-muted">{r.contract.stopping}</p>}
              {r.contract.failure && <p className="mt-1 text-muted">{r.contract.failure}</p>}
              {r.contract.escalation && r.contract.escalation.length > 0 &&
                <p className="mt-1 text-xs text-ink-600">escalation: {r.contract.escalation.join(" · ")}</p>}
              {r.contract.cost_envelope &&
                <p className="mt-1 text-xs text-ink-600">cost: {Object.values(r.contract.cost_envelope).join(" · ")}</p>}
            </div>
          </div>
          {r.runs_surface && <p className="mt-2 text-xs text-emerald-500">runs visible: {r.runs_surface}</p>}
        </Section>
      ) : (
        <p className="mb-6 rounded border border-ink-700 bg-ink-900 p-3 text-sm text-muted">
          No emit contract yet — this is a stub. Defining the contract is how it stops being one.
        </p>
      )}

      <Section title="Inventory" hint="what makes this system work">
        <RowList rows={r.assets} />
      </Section>

      <Section title="Agent context" hint="what the agent knows">
        <RowList rows={r.context} />
      </Section>

      {r.body && (
        <Section title="Notes & roadmap">
          <div className="md-prose text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{r.body}</ReactMarkdown></div>
        </Section>
      )}

      <Section title="History">
        <div className="border-l-2 border-ink-700 pl-4">
          {data.history.map((c) => (
            <div key={c.hash} className="py-1">
              <p className="text-sm text-muted">{c.subject}</p>
              <p className="text-xs text-ink-600">{c.date} · {c.hash}</p>
            </div>
          ))}
          {data.history.length === 0 && <p className="text-sm text-muted">No commits touch this system yet.</p>}
        </div>
      </Section>
    </main>
  );
}
```

- [ ] **Step 2: Verify both a full record and a stub**

Sandbox-fetch `http://localhost:4180/system/signal/demand-context` (expect contract grid,
inventory with the shared Canon-corpus row) and `http://localhost:4180/system/pulse/pulse-closing`
(expect the stub notice). Both 200.

- [ ] **Step 3: Commit**

```bash
git add "app/system/[constellation]"
git commit -m "projection-ui: contract-first system page (inventory, agent context, history)"
```

---

### Task 13: Build check + front-door handoff

**Files:**
- Modify: `STATUS.md` (repo root)

- [ ] **Step 1: Production build must pass**

Run: `cd systems/projection-ui && npm run build`
Expected: build succeeds. (Known repo gotcha: a previous build failure came from importing
`Html` outside pages/_document — nothing in this plan imports from `next/document`.)

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 3: Point the front door at the registry**

At the top of `/Users/nplmini/code/work/STATUS.md`, under the header, add:

```markdown
> **The registry now exists**: `registry/` (source of truth) rendered at
> `localhost:4180/system` (review surface · map · system pages). Spec:
> `practices/agentic-systems/specs/2026-06-10-system-registry-design.md`.
> This file is now a consumer; new session-exit items go to `registry/_review/`, not here.
```

- [ ] **Step 4: Final commit**

```bash
cd /Users/nplmini/code/work
git add STATUS.md
git commit -m "studio: STATUS points at the system registry (review surface live)"
```
