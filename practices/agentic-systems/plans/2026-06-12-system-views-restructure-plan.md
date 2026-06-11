# System Views Restructure Implementation Plan

> **For agentic workers:** Execute task-by-task in order. Steps use checkbox (`- [ ]`) syntax. You are likely a fresh session with zero context — everything you need is in this document. Read the whole plan before starting.

**Goal:** Fix the no-scroll bug on the `/system` pages, make the constellation dashboard the landing view for the System nav, move the review queue to its own page, and add a full system-inventory view — all over the existing file-based registry.

**Architecture:** projection-ui (Next.js 15 app router) renders a file-based registry at `/Users/nplmini/code/work/registry/` through `lib/registry.ts` and three `/api/system/*` routes. This plan only moves/adds VIEW code and one small API route. No registry schema changes.

**Tech stack:** Next.js 15, TypeScript, Tailwind (dark "ink" theme), vitest.

---

## Environment — read carefully, these are hard rules

- Repo: `/Users/nplmini/code/work`. App dir: `systems/projection-ui/`. Work on a branch: `git checkout -b system-views-restructure` from `main`.
- The working tree contains UNRELATED uncommitted changes from another live session (staging page, loader, inngest files, CLAUDE.md, accounts/). **Stage ONLY the files this plan names. Never `git add -A` or `git add .`**
- The dev server runs on port 4180 under launchd (`com.nick.projection-ui`), with hot reload. **NEVER start a second dev server and NEVER run `npm run build` while it runs** — both corrupt the shared `.next` cache (this happened twice; symptom: phantom 404s/unstyled pages). If the server misbehaves: `cd systems/projection-ui && rm -rf .next && launchctl kickstart -k gui/$(id -u)/com.nick.projection-ui`, wait ~12s.
- `curl`/`wget` are BLOCKED in this environment. Verify HTTP with the context-mode sandbox tool: `ctx_execute(language: "javascript", code: "const r = await fetch('http://localhost:4180/...'); console.log(r.status)")`.
- Tests: `cd systems/projection-ui && npm test` → currently **15 passed** (vitest; includes a smoke test that the real registry parses clean — if you edit registry files, that test is the gate).
- Type check: `npx tsc --noEmit` must stay clean after every task.
- Commit messages: `projection-ui: <what>` style, ending with a blank line then `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Theme conventions (match them): dark ink palette — `bg-ink-900/850/800`, `border-ink-700`, `text-muted`, `text-ink-600`, accents `text-accent`, `bg-ok/15 text-ok`, `bg-warn/15 text-warn`, `bg-bad/15 text-bad`, links `text-sky-400`. Markdown bodies render with className `md-prose` (defined in globals.css) via `react-markdown` + `remark-gfm` (installed).

## Context — what exists today

- `app/layout.tsx` pins the viewport: `<div className="flex h-screen w-screen overflow-hidden">` with `<main className="flex-1 overflow-hidden">`. Pages must create their OWN scroll region (see `app/staging/page.tsx` for the pattern). The three `/system` pages don't — that's the scroll bug.
- `app/system/page.tsx` — currently the review surface (queue from `/api/system/review` + "Since your last review" diff feed + footer link to map).
- `app/system/map/page.tsx` — the constellation dashboard (attention strip with review/date/now chips, 8 constellation cards with lifecycle-colored system chips, legend). Fetches `/api/system/list` + `/api/system/review`.
- `app/system/[constellation]/[slug]/page.tsx` — per-system page (flow dashboard when the record declares `flow`, classic contract layout otherwise).
- API routes: `/api/system/list` (light view: name/slug/home/clusters/class/lifecycle/autonomy/flags/stub/outcome/warnings/dates/now), `/api/system/detail?constellation=&slug=` (full record + warnings + git history), `/api/system/review` (queue items from `registry/_review/*.md` + diff commits + errors).
- `lib/registry.ts` — parser. `SystemRecord` includes `assets: AssetRow[]` and `context: ContextRow[]`; rows have `{name, type?, version?, ownership?, status, verified_by, note?, path?}`. `loadRegistry(root)` returns `{systems: {record, warnings}[], errors, lastReviewed}`. Registry root: `/Users/nplmini/code/work/registry`.
- File links open via `/api/playfile?path=<ABSOLUTE path>` — registry `path` fields are relative to `/Users/nplmini/code/work/`, so prefix that before linking.

---

### Task 1: Fix the no-scroll bug on all three /system pages

**Files:**
- Modify: `app/system/page.tsx`
- Modify: `app/system/map/page.tsx`
- Modify: `app/system/[constellation]/[slug]/page.tsx`

- [ ] **Step 1:** In each of the three pages, every `return` that renders a `<main ...>` (including the early `Loading…`/error returns) gets wrapped so the page owns its scroll. Pattern — change:

```tsx
return (
  <main className="mx-auto max-w-screen-xl p-6">
    ...
  </main>
);
```
to:
```tsx
return (
  <div className="h-full overflow-y-auto">
    <main className="mx-auto max-w-screen-xl p-6">
      ...
    </main>
  </div>
);
```
For the early returns (`Loading…`, error), the wrapper is not needed — they're short — but it's harmless; leave them as-is unless trivial.

- [ ] **Step 2:** Verify: `npx tsc --noEmit` clean. Sandbox-fetch all three pages → 200: `/system`, `/system/map`, `/system/signal/signal-prospecting`.

- [ ] **Step 3:** Commit: `git add app/system/page.tsx app/system/map/page.tsx "app/system/[constellation]/[slug]/page.tsx"` → message `projection-ui: /system pages own their scroll region (shell is overflow-hidden)`.

---

### Task 2: Constellation dashboard becomes the landing; review queue gets its own page

**Files:**
- Create: `app/system/review/page.tsx` (content moves here from `app/system/page.tsx`)
- Modify: `app/system/page.tsx` (becomes the dashboard — content moves here from `app/system/map/page.tsx`)
- Modify: `app/system/map/page.tsx` (becomes a redirect)

- [ ] **Step 1:** Create `app/system/review/page.tsx` by MOVING the entire current contents of `app/system/page.tsx` (the review surface). Rename the component `SystemReview`. Two improvements while moving:
  1. Queue-item bodies currently render as a raw text wall. Render them with markdown + a collapse instead — replace the `<p className="mt-1 text-sm text-muted">{q.body}</p>` line with:
```tsx
<details className="mt-1">
  <summary className="cursor-pointer text-xs text-sky-400">details</summary>
  <div className="md-prose mt-2 max-w-3xl text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{q.body}</ReactMarkdown></div>
</details>
```
     and add the imports: `import ReactMarkdown from "react-markdown"; import remarkGfm from "remark-gfm";`
  2. The footer "Browse" row should link to `/system` labeled `Constellation dashboard` (instead of `/system/map`).

- [ ] **Step 2:** Replace `app/system/page.tsx` contents with the dashboard — MOVE the entire current contents of `app/system/map/page.tsx` here (component name `SystemDashboard`). Two changes while moving:
  1. In the header right side, replace the `review surface` link target text: `<Link href="/system/review" ...>review queue{queueCount > 0 ? ` (${queueCount})` : ""}</Link>` — the page already fetches `/api/system/review`, so derive `queueCount` from its `queue.length`.
  2. Add a second header link right after it: `<Link href="/system/inventory" className="text-sky-400 hover:underline">inventory</Link>` (built in Task 3).

- [ ] **Step 3:** Replace `app/system/map/page.tsx` with a redirect so old links keep working:
```tsx
import { redirect } from "next/navigation";
export default function MapRedirect() { redirect("/system"); }
```

- [ ] **Step 4:** Verify (sandbox fetch): `/system` → 200 and is the dashboard (response is a client shell — confirm by fetching and checking it compiles + the dev log shows no errors; then `/system/review` → 200; `/system/map` → 307/308 redirect or 200 landing on /system content. `npx tsc --noEmit` clean. `npm test` 15 passed.

- [ ] **Step 5:** Commit: `git add app/system/page.tsx app/system/review/page.tsx app/system/map/page.tsx` → `projection-ui: dashboard is the System landing; review queue on /system/review; /system/map redirects`.

---

### Task 3: Full system inventory view

**Files:**
- Create: `app/api/system/inventory/route.ts`
- Create: `app/system/inventory/page.tsx`

- [ ] **Step 1:** API route — full rows for every system:

```ts
import { NextResponse } from "next/server";
import { loadRegistry } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = "/Users/nplmini/code/work/registry";

export async function GET() {
  const reg = loadRegistry(ROOT);
  const systems = reg.systems.map(({ record, warnings }) => ({
    name: record.name, slug: record.slug, home: record.home, class: record.class,
    lifecycle: record.lifecycle, autonomy: record.autonomy, stub: record.stub,
    assets: record.assets, context: record.context, warnings,
  }));
  return NextResponse.json({ count: systems.length, systems, errors: reg.errors });
}
```

- [ ] **Step 2:** Inventory page. Job: "what do we actually have, under the hood" — every system's parts in one dense, filterable view, grouped by constellation. Build `app/system/inventory/page.tsx`:

Requirements (follow the established page pattern: `"use client"`, fetch with err state + `r.ok` check, scroll wrapper from Task 1):
- Header: h1 `Inventory`, right side: total parts count + `{n} exist · {m} to build` chips (to-build = status `to-build` or `to-write`), link back to `/system`.
- Filter row (client-side `useState`): buttons `all` / `to build` / `tested` / `shared` / `assets` / `context` — simple predicate filters over rows; active button styled `bg-ink-700 text-white`, inactive `border border-ink-700 text-muted`.
- Body grouped by constellation (fixed order: canon, compass, signal, forge, voice, pulse, guard, garden), each system that has any matching rows renders:
  - a system header line: name as `<Link href={/system/${home}/${slug}}>` (font-medium, white) + lifecycle chip + `{exists}/{total} parts` muted.
  - its rows in a dense list (one per line, `border-t border-ink-800`): `kind` tag (asset → the row's `type` e.g. `script`/`database`/`surface`/`sql`/`skill`; context rows → `context`), name (mono, sm; if `ownership` starts `shared:` add a sky chip `shared · {owner}`), status chip (reuse `StatusChip` from `@/components/system/Bits`), `verified_by` in `text-ok text-xs` when present, and if `path` present a `text-sky-400` link to `/api/playfile?path=${encodeURIComponent("/Users/nplmini/code/work/" + path)}` labeled with the filename.
  - row note in `text-ink-600 text-xs` on a second line when present.
- Empty filter result: muted "no parts match".

- [ ] **Step 3:** Verify: `npx tsc --noEmit` clean; sandbox fetch `/api/system/inventory` → 200, JSON has 25 systems and signal-prospecting shows ≥9 asset rows; `/system/inventory` → 200; dev log shows no compile errors.

- [ ] **Step 4:** Commit: `git add app/api/system/inventory/route.ts app/system/inventory/page.tsx` → `projection-ui: /system/inventory — every part of every system, filterable (exists vs to-build)`.

---

### Task 4: Registry record update + merge

- [ ] **Step 1:** Update the registry record that tracks this surface: `registry/compass/compass-course-correction/system.md` — in the `System pages` asset row's `note`, replace the description so it reads (keep YAML structure intact, multi-line quoted string style is already used in the file):
   `"landing = constellation dashboard (/system); /system/review = queue + diff; /system/inventory = every part of every system; per-system pages render the flow dashboard when the record declares flow"`

- [ ] **Step 2:** From `systems/projection-ui/`: `npm test` → 15 passed (the smoke test validates your registry edit).

- [ ] **Step 3:** Commit: `git add registry/compass/compass-course-correction/system.md` → `registry: compass-course-correction — surface routes updated (landing/review/inventory)`.

- [ ] **Step 4:** Merge: `git checkout main && git merge --ff-only system-views-restructure && git push origin main && git branch -d system-views-restructure`.

- [ ] **Step 5:** Final live verification (sandbox fetch, all should be 200): `/system`, `/system/review`, `/system/inventory`, `/system/signal/signal-prospecting`, `/staging`, `/api/system/inventory`. If anything 404s after the merge: `rm -rf systems/projection-ui/.next && launchctl kickstart -k gui/$(id -u)/com.nick.projection-ui`, wait, re-verify.

- [ ] **Step 6:** Report to the operator: list the URLs and ask him to verify in HIS browser that (a) pages scroll, (b) the System nav lands on the constellation dashboard, (c) the inventory filter buttons work. Scroll cannot be verified by fetch — the human check is the gate on Task 1.

---

## Self-review checklist for the executor

- Every page still 200; tsc clean; 15 tests green at every commit.
- No file outside the named lists staged. No second dev server started. No `npm run build` run.
- The review queue page renders queue bodies as collapsible markdown, not text walls.
- Old `/system/map` links land on the dashboard.
