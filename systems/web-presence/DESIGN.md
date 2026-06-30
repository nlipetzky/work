# web-presence — design

Status: approved 2026-06-30 (Nick). First tenant: Konstellation CIPO (KonstellationAI.com).

## Problem

Ventures and assets need standing web surfaces (homepages, landing pages, lead
magnets) engineered for lead-gen and engagement. The *method* already exists as a
shared skill (`capabilities/skills/website-conversion-design`) that turns a
venture's context registry into a site spec, and Vega builds from it. What is
missing is the *machine* that builds, deploys, instruments, and keeps optimizing
those sites — and lets a conversion win on one site propagate to the others. Today
nothing owns build → deploy → measure → iterate, so the skill's optimization loop
never runs and there is no surface showing portfolio site state.

This system is that machine. It does NOT re-implement the skill; it references it.

## Shape

One system, `systems/web-presence/` (doctrine), driving one code monorepo under
`~/code/` (the deployable app code, kept outside the operator-OS boundary like aos).

- **Method (shared, unchanged):** `capabilities/skills/website-conversion-design`
  reads a venture's `context/` registry → emits that venture's
  `context/website-spec.md`. Vega is the builder persona that runs it.
- **Machine (this system):** owns the kit, the scaffold, deploy/host runbooks,
  instrumentation, the optimization loop + pattern ledger, and the projection
  surface.
- **Output (per venture):** a themed, deployed, instrumented site — a build
  artifact — that consumes the shared kit and the venture's own context + theme.

## The shared kit (themeable, not lockstep)

A versioned component package (`packages/kit` in the monorepo). Conversion-tested
blocks: hero/promise, proof, how-it-works, objection, CTA, capture. Two layers keep
sharing compatible with brand independence:

- **Components are shared.** All sites consume the same block library.
- **Branding is a theme.** Each site supplies a style guide as design tokens
  (color, type, spacing, motion) that re-skins the same blocks. Branding
  modifications happen via tokens, never by forking a component.
- **Composition is per-site.** Each site declares its own IA — which blocks, in
  what order, copy sourced from its context registry. Different targets/pipelines
  get different compositions off one kit. Sites are never forced to match.

## Optimization propagation (the core requirement)

When a site learns what converts, the learning becomes available to the portfolio
without forcing lockstep:

1. Blocks are versioned and carry variants.
2. A site runs the skill's optimization loop on its own pages (one hypothesis,
   change one thing, re-measure).
3. A winning variant is promoted *into the kit* as a new/default variant (version
   bump).
4. Every other site then *sees* the upgrade available, with the evidence
   ("proof-block variant lifted booking +X% on site Y").
5. Adoption is **opt-in, per site** — the operator decides, because targets and
   pipelines differ. That is the "never completely lockstep" guarantee.

The pattern ledger records what-won-where so adoption decisions are informed.
v1: a markdown ledger in this folder + kit changelog. Scale path: a canon table
(`canon_engine`) once there is real experiment volume.

## Where things live

- **Doctrine** → `systems/web-presence/` (this folder): CLAUDE.md, SYSTEM.md,
  runbooks, scaffold, the pattern ledger, the projection-surface spec.
- **Code** → `github.com/nlipetzky/web-portfolio` (private), cloned at
  `~/code/web-portfolio`: `packages/kit` (shared themeable components) + `apps/<venture>`
  (one thin app per site). pnpm/Turborepo. **Git-connected to Vercel** (project
  `web-portfolio`, root dir `apps/cipo`): push `main` → Vercel builds + deploys. First
  tenant `apps/cipo` (Shadow CIPO). The old `~/code/konstellation-cipo-site/` scaffold
  is superseded by this repo (not migrated — it was an empty stub).
- **Per-venture spec + theme** → stays in the venture folder:
  `accounts/ventures/<name>/context/website-spec.md` (skill output) and a
  `context/style-guide.md` theme.
- **Deploy** → Vercel, one project per app (monorepo root-dir per app → independent
  per-site deploys, independent domains; shared kit, no lockstep deploy).

## Stack

Next.js (matches projection-ui, Vercel-native, supports dynamic capture forms +
instrumentation, one stack to maintain). Astro was the lighter alternative for
pure-static marketing; rejected for stack consistency and form/instrumentation
needs.

## Surface

A projection-ui tab: every portfolio site, its state, its per-page conversion
metric, pending kit upgrades, and open optimization hypotheses. Satisfies the
"every system needs an interactive surface" rule.

## Sequencing

Build the machine (system + kit + deploy pipeline + surface) with CIPO as the first
tenant. CIPO's real content is gated on its context registry actually carrying an
approved offer + public-ready copy + voice + proof + a confirmed domain (verified
before the site build, not assumed). If gaps exist, they are marked decision gates
in CIPO's site spec and designed around — never papered over with invented copy.

## Boundaries (inherited rules)

- Never bake engagement-specific assumptions into the system or the kit. Per-venture
  truth lives in the venture's context registry.
- No person names in the system or shared kit.
- Never invent positioning, voice, proof, or offer — pull from the brand store; any
  gap is a marked decision gate.
- Expert-facing decisions (voice sign-off, founder bio approval, copy review) route
  through Hermes. Domain/commercial commitments route through Polaris.
