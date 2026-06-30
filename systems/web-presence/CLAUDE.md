# System: web-presence

The machine that builds, deploys, instruments, and continuously optimizes the
studio's standing web surfaces (sites + landing pages) for ventures and assets.

Read `SYSTEM.md` for the contract and `DESIGN.md` for the architecture before doing
work here.

## What this is

- It owns the **shared themeable component kit** + the build/deploy/instrument/
  optimize pipeline + the projection surface.
- It does NOT author positioning, voice, proof, or offer. That is the
  `capabilities/skills/website-conversion-design` skill, reading each venture's
  `accounts/ventures/<name>/context/` registry. This system references that skill,
  never copies it.
- Site code lives in a monorepo under `~/code/` (working name `web-portfolio/`):
  `packages/kit` + `apps/<venture>`. That is deployable app code, outside the
  operator-OS boundary by design.

## Hard rules

- Never bake engagement-specific assumptions into the system or the kit. Per-venture
  truth lives in the venture's context registry; branding is per-site theme tokens.
- No person names in the system or the shared kit.
- Never invent copy. Every load-bearing claim is pulled from a venture's brand store
  or a sourced SME artifact; any gap is a marked decision gate, not a guess.
- Conversion wins propagate via versioned kit variants with **opt-in** per-site
  adoption. Never force lockstep across sites.
- Expert-facing decisions (voice sign-off, bio approval, copy review) → Hermes.
  Domain + commercial commitments → Polaris.

## Operator

Boris (architecture, kit, pipeline) + Vega (per-site build from the skill).
