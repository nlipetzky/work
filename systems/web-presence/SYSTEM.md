# SYSTEM: web-presence

The machine that builds, deploys, instruments, and continuously optimizes the
standing web surfaces (sites + landing pages) for the studio's ventures and assets.
It owns the shared themeable component kit and propagates conversion wins across the
portfolio. It does not author positioning/voice/offer — that is the
`website-conversion-design` skill reading each venture's context registry. See
`DESIGN.md` for the full design.

## Output

A themed, deployed, instrumented web surface per venture/asset (a build artifact),
plus a shared component kit that carries portfolio-wide conversion learnings.

## Activities

- [ ] Maintain the shared themeable component kit (`packages/kit`) — human + automated
- [ ] Scaffold a new per-venture site app from the kit, wired to its context registry + style guide — automated
- [ ] Build a site from its `website-spec.md` (skill output) — Vega + automated
- [ ] Deploy + host each site (Vercel, per-site project + domain) — automated
- [ ] Instrument conversion events + per-page success metric — automated
- [ ] Run the optimization loop per site (one hypothesis, re-measure) — human + automated
- [ ] Promote winning variants into the kit + log to the pattern ledger — human
- [ ] Surface portfolio site state + pending kit upgrades in Projection UI — automated

## Depends on

- `capabilities/skills/website-conversion-design` — the method that produces each
  site spec from a venture's context registry. Referenced, never copied.
- `capabilities/agents/<vega>` — creative-director builder persona (reused).
- canon-engine (Supabase) — scale path for the optimization pattern ledger
  (experiment results), once volume warrants. v1 ledger is markdown in this folder.
- Vercel — hosting; git-connected to `github.com/nlipetzky/web-portfolio` (project
  `web-portfolio`, root dir `apps/cipo`), push `main` → deploy. Code repo is the
  system's build output, kept outside the work boundary.

## Depended on by

- Each venture/asset that needs a web surface (first: Konstellation CIPO).

## Surface

Projection UI tab: portfolio sites, per-page conversion metric, pending kit
upgrades, open optimization hypotheses. (To build.)

## Data contracts

- Per-site composition + theme tokens (in the site app repo).
- Per-venture `context/website-spec.md` + `context/style-guide.md`.
- Optimization pattern ledger (markdown v1 → canon table at scale). Detail in
  `schemas/` when the canon table is defined.

## Operator

Boris (architecture, the kit, the pipeline) + Vega (per-site build from the skill).
Expert-facing copy/voice sign-off routes through Hermes; domain/commercial
commitments through Polaris.

## Registry

Canon `systems.id`: unregistered (to register). Maturity: building.
