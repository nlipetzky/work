# web-presence Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the web-presence machine end-to-end with Konstellation CIPO as the first tenant — a shared themeable component kit and a CIPO site composed from it, deployed to a staging preview (not a public domain, no public pricing).

**Architecture:** A pnpm/Turborepo monorepo under `~/code/web-portfolio/`. `packages/kit` holds tenant-agnostic conversion blocks themed entirely by design tokens. `apps/cipo` composes those blocks per CIPO's `website-spec.md` (produced by the `website-conversion-design` skill from the venture's context registry) with a provisional, refusal-safe theme. Each app deploys independently on Vercel. Conversion learnings later flow back into the kit as versioned variants (separate plan).

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind (token-driven theme), pnpm workspaces, Turborepo, Vitest + Testing Library (render tests), Vercel (deploy).

**Source of truth for CIPO content:** the context registry digest at `accounts/ventures/konstellation-cipo/context/` (see the input digest). Hard rule: never invent positioning/voice/proof/offer; every load-bearing line traces to a registry artifact or is a marked decision gate.

---

## Scope & decomposition

This plan covers the **foundation vertical slice** only:
- Phase 0: CIPO content + conversion spec (the skill output).
- Phase 1: monorepo + tooling.
- Phase 2: the themeable kit (blocks + token contract).
- Phase 3: `apps/cipo` composed from the spec, provisional theme, staging-safe copy.
- Phase 4: staging deploy + instrumentation.

**Out of scope — separate follow-on plans (do NOT build here):**
- `plans/<date>-optimization-propagation.md` — kit versioning, variant adoption, the pattern ledger.
- `plans/<date>-projection-surface.md` — the projection-ui portfolio tab.

## Launch gates (non-code; block go-LIVE, not the build)

The staging build proceeds without these. The site does NOT go to a real domain or show public pricing until all clear, each routed to the owning practice:
1. **Domain + brand fork** — KonstellationAI.com takeover vs CIPO's own domain. Owner: Polaris (sponsor) + Will. CLAUDE.md open question.
2. **Visual identity** — CIPO defines its own (it CANNOT inherit KAI's "constellation" frame; Will's controlled-lexicon refuses constellation/orbit/star). Owner: Hermes routes a visual-direction approval to Will.
3. **Copy + public pricing sign-off** — generated site copy and any public price figures route to Will via Hermes before launch (faithfulness-constraint #3).

Track these as capture items to Atlas's inbox; do not block the build on them.

---

## Phase 0 — CIPO content + conversion spec

### Task 0.1: Produce CIPO's website-spec via the skill

**Files:**
- Modify: `accounts/ventures/konstellation-cipo/context/website-spec.md` (currently a "not started" stub)

- [ ] **Step 1: Run `website-conversion-design`** against the CIPO context registry. Inputs: the 10 sourced registry artifacts in the digest's "Files ready for skill consumption" list. Objective: lead-gen primary, engagement secondary.
- [ ] **Step 2: Spec must contain**, per the skill's process:
  - IA: page list + the path each ICP segment walks to the conversion action ("2-minute research call" / "1-page IP exposure read" — interest-based, no calendar).
  - Per-page conversion structure (promise + CTA, proof under promise, objection/how-it-works, capture).
  - Copy briefs routed to creative-copy (hero/identity) and copy-draft (Will-voiced lines, with source map). NO final pricing figures — mark as `[PRICING: route to Will]`.
  - Visual direction → marked DECISION GATE (visual identity undefined; refusal-safe constraints noted).
  - Instrumentation: primary conversion event, capture fields, the one success metric per page.
  - Decision gates section: domain, visual identity, pricing sign-off.
- [ ] **Step 3:** The spec's block list becomes the kit's block inventory for Phase 2. Confirm it maps to: Hero, Proof, HowItWorks/Mechanism, Objection, CTA, Capture (add/remove per spec).
- [ ] **Step 4: Commit** the spec to the work repo.

**Verification:** every load-bearing claim in the spec cites a registry artifact; no pricing figures in copy; decision gates explicit.

---

## Phase 1 — Monorepo + tooling

### Task 1.1: Initialize the monorepo

**Files:**
- Create: `~/code/web-portfolio/` (pnpm-workspace.yaml, turbo.json, package.json, tsconfig.base.json, .gitignore)

- [ ] **Step 1:** `mkdir -p ~/code/web-portfolio && cd ~/code/web-portfolio && git init && pnpm init`
- [ ] **Step 2:** Write `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

- [ ] **Step 3:** Add Turborepo: `pnpm add -D turbo -w`. Write `turbo.json` with `build`, `dev`, `lint`, `test` pipelines (build depends on `^build`).
- [ ] **Step 4:** Write `tsconfig.base.json` (strict: true, moduleResolution bundler, paths for `@kit/*`).
- [ ] **Step 5:** `.gitignore`: node_modules, .next, .turbo, dist, .vercel, .env*.
- [ ] **Step 6: Commit** "chore: init web-portfolio monorepo".

---

## Phase 2 — The themeable kit (`packages/kit`)

### Task 2.1: Define the theme token contract

**Files:**
- Create: `~/code/web-portfolio/packages/kit/src/theme/tokens.ts`
- Test: `packages/kit/src/theme/tokens.test.ts`

- [ ] **Step 1: Write the token contract** (this is the per-site branding surface — the ONLY thing a site overrides to re-brand):

```typescript
export interface ThemeTokens {
  color: {
    bg: string; surface: string; fg: string; muted: string;
    accent: string; accentFg: string; border: string;
  };
  font: { heading: string; body: string };
  radius: { sm: string; md: string; lg: string };
  space: { tight: string; base: string; loose: string };
  maxWidth: string;
}
export function tokensToCssVars(t: ThemeTokens): Record<string, string> { /* impl */ }
```

- [ ] **Step 2:** Test `tokensToCssVars` maps each token to a `--kit-*` CSS var. Run `pnpm test`, expect fail → implement → pass.
- [ ] **Step 3: Commit.**

### Task 2.2: Build each conversion block

For EACH block in the Phase 0 spec inventory (Hero, Proof, HowItWorks, Objection, CTA, Capture):

**Files:**
- Create: `packages/kit/src/blocks/<Block>.tsx`
- Test: `packages/kit/src/blocks/<Block>.test.tsx`

- [ ] **Step 1:** Define the block's prop interface — content in, no hardcoded copy. Example (Hero):

```typescript
export interface HeroProps {
  promise: string;          // the one thing (from spec, sourced)
  subhead?: string;
  primaryCta: { label: string; href: string };
  proofStrip?: string[];    // sourced proof points
}
```

- [ ] **Step 2:** Write a render test: renders props, asserts promise + CTA present, no hardcoded brand words, uses `--kit-*` vars only (no literal colors).
- [ ] **Step 3:** Implement the component to the interface. Route visual/layout choices to `ui-ux-pro-max` (fed the provisional theme); components consume tokens, never literal styles.
- [ ] **Step 4:** Test passes. **Commit** per block.

### Task 2.3: Kit barrel + preview

- [ ] **Step 1:** `packages/kit/src/index.ts` exports all blocks + theme.
- [ ] **Step 2:** Minimal preview route (Storybook or a Next demo) rendering each block under a sample theme. **Commit.**

---

## Phase 3 — `apps/cipo`

### Task 3.1: Scaffold the CIPO app

**Files:**
- Create: `~/code/web-portfolio/apps/cipo/` (Next.js App Router, depends on `@kit`)

- [ ] **Step 1:** `cd ~/code/web-portfolio/apps && pnpm create next-app cipo --ts --app --tailwind --no-src-dir --import-alias "@/*"`. Add `@kit` workspace dep.
- [ ] **Step 2:** Wire Tailwind to consume `--kit-*` CSS vars. **Commit.**

### Task 3.2: Provisional theme (refusal-safe)

**Files:**
- Create: `apps/cipo/theme.ts` (a `ThemeTokens` value)
- Mirror: `accounts/ventures/konstellation-cipo/context/style-guide.md` (provisional, flagged)

- [ ] **Step 1:** Define a clean, credible, professional provisional theme. HARD constraint: NO astronomical/constellation motifs, naming, or imagery (Will's refusal list). Neutral authoritative palette. Mark the file header `PROVISIONAL — pending visual-identity decision (gate #2)`.
- [ ] **Step 2: Commit.**

### Task 3.3: Compose pages from the spec

**Files:**
- Create: `apps/cipo/app/(site)/...` per the Phase 0 IA
- Create: `apps/cipo/content/*.ts` — sourced copy values fed to kit blocks

- [ ] **Step 1:** For each page in the spec, compose kit blocks in the spec's order, passing sourced copy from `content/`.
- [ ] **Step 2:** Copy values come from the spec's briefs. Every value carries a source comment (registry artifact). Pricing: render a `[pricing pending]` placeholder component, NOT figures (gate #3). Mark all copy `DRAFT — pending Will sign-off`.
- [ ] **Step 3:** Render tests: each page mounts, conversion CTA present, no refused vocabulary, no pricing figures. **Commit per page.**

### Task 3.4: Capture + instrumentation

**Files:**
- Create: `apps/cipo/app/api/capture/route.ts`, `apps/cipo/lib/analytics.ts`

- [ ] **Step 1:** Capture form posts to the route (interest-based: name, email, company, the one IP question). Store target: TBD per spec (Supabase or a form provider) — pick per spec, wire the simplest that records the lead.
- [ ] **Step 2:** Fire the primary conversion event + per-page success metric (analytics shim; Vercel Analytics or PostHog per spec). **Commit.**

---

## Phase 4 — Staging deploy

### Task 4.1: Deploy to Vercel preview

- [ ] **Step 1:** Create a Vercel project for `apps/cipo`, root directory `apps/cipo`, monorepo build settings (turbo). Deploy to a `*.vercel.app` preview URL — NOT a custom domain (gate #1).
- [ ] **Step 2:** Verify the preview renders, capture works, events fire. Smoke-test on mobile + desktop.
- [ ] **Step 3:** Record the preview URL + the open launch gates in the system's runbook. Route the gates to Atlas's inbox as capture items.

**Done when:** a CIPO staging preview is live on a Vercel URL, built from the shared kit + provisional theme, copy sourced and marked draft, no public pricing, with the three launch gates tracked. The kit is reusable by the next tenant.

---

## Self-review notes

- Spec coverage: Phases map to DESIGN.md (kit ✓, theming ✓, per-site composition ✓, deploy ✓, surface + propagation → follow-on plans, called out). 
- The "no public pricing / copy gated to Will" rule is enforced in Tasks 0.1, 3.3 (placeholder pricing, draft copy).
- Refusal-safety (no constellation) enforced in Tasks 3.2, 3.3 tests.
- Block interfaces (Task 2.2) are content-in/token-themed — consistent with the per-site composition + propagation model.
