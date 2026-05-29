# Asset Economics ... the unit economics model for the Konstellation Catalog

How we estimate, price, and plan capacity across every layer of the Catalog. Starts at the Asset (atomic unit) and rolls up through System → Cluster → Trajectory.

The framework's value comes from execution. Estimates land here as ranges first, then sharpen through real builds.

## The core principle: atomic assets, no monoliths

Every Asset is scoped to **one activity or one output**. If a piece of work requires more than that, it becomes multiple Assets ... not a bigger one.

Example: "AAV-target enrichment" is not one n8n workflow. It is:
- L1 Capture workflow (Asset)
- Companies Enrichment workflow (Asset)
- AAV Relevance Scan workflow (Asset)
- AAV Mover workflow (Asset)

Each does one thing. Each has its own owner, lifecycle, and economics. The composition produces the higher-level capability.

This discipline solves the granularity problem at the source. The Asset Type taxonomy stays flat (n8n workflow, Airtable base, doc, script, Supabase project, etc.) because every instance of every type is small enough to estimate consistently.

If an Asset's economics feel like a wide range, that is a signal to split it.

## The six dimensions of Asset economics

Every Asset Type carries reference economics (the range you'd quote a new build at) and every Asset Row accumulates actual economics (measured from real builds, used to sharpen the reference).

| Dimension | What it is | Used for |
|---|---|---|
| **Design time** | Hours to spec the Asset (PROMPT.md, schema lock, ICP definition, etc.) | Capacity planning at the design layer |
| **Build time** | Hours to implement the spec (developer hours) | Capacity planning at the build layer |
| **Buildable by** | `nick-only` / `nick-or-contractor` / `templated-contractor` | Delegation planning; who can take the work |
| **Third-party cost** | Per-vendor cost line (Apify, Apollo, Anthropic, Voyage, etc.); per-run or per-month | Margin calculation; cost to operate |
| **Ongoing operational cost** | Monthly operating cost at typical volume (compute, storage, API usage at expected QPS) | Retainer pricing; ongoing margin |
| **Failure rate / rework probability** | Likelihood the first build fails review or breaks in production within 30 days | Buffer multiplier on build time; QA planning |

Reference economics are stored per Asset Type with ranges. Actual economics are recorded per Asset Row at build completion and at 30-day reality check.

## The rollup math

Atomic estimates underprice the whole if summed naively. Coordination, integration, testing, expert-liaison setup, and runtime debugging are real costs that don't live in any single Asset.

The model uses integer multipliers at each layer above Asset:

```
Asset           (atomic, measured directly)
   ↓ × 1
System          = sum(its Assets) × 1.3
   ↓
Cluster         = sum(its Systems) × 1.2
   ↓
Trajectory      = sum(its Clusters over time) × 1.1
```

Multipliers chosen for v0:
- **1.3 at System** ... significant integration overhead. Asset-to-Asset wiring, test data, schema reconciliation, deploy choreography.
- **1.2 at Cluster** ... moderate. Clusters mostly stitch System outputs; less internal coupling.
- **1.1 at Trajectory** ... light. Trajectory is mostly sequencing; phase boundaries add some coordination cost.

These multipliers are placeholders. Sharpen through actual delivery. If real Systems consistently land at 1.5× their Asset sum, raise the multiplier.

## Platform vs instance: critical separation

**Platform assets** (RevOps Engine workflows, Canon ingestion pipeline, expert-liaison workflows, GTM Engine sourcing templates) are amortized across all engagements. They are NOT rebuilt per client.

**Instance assets** (a client's bespoke AAV criteria doc, their Trajectory, their specific Mover workflow) are built per engagement.

Trajectory cost = sum of **instance** asset economics rolled up via multipliers. Plus ongoing operational cost share for the platform assets the engagement consumes.

Without this separation, every Trajectory double-counts the platform and prices too high. Will needs this to quote correctly.

## How economics get populated

**Reference economics per Asset Type:**
- Initial seed: Nick's best estimate from existing inventory (use the recently-built workflows as data points).
- Sharpened by: every new Asset built. At build completion, record actual hours into the Asset Row. Quarterly: recompute the Asset Type reference range from the rows.

**Actual economics per Asset Row:**
- At build completion: design_time_actual, build_time_actual, third_party_cost_actual.
- At 30 days post-deploy: ongoing_operational_cost_actual, failure_30d (true/false), rework_required (true/false).
- These fields extend the existing registry Assets table OR live in a linked table.

## Where this lives

Two storage decisions, recommended landing:

1. **Reference economics per Asset Type:** new Airtable table `Asset Type Economics` in the System Registry base (`apppQjlZiktpbO4aX`). One row per type, fields for each economic dimension (ranges as min/max).
2. **Actual economics per Asset Row:** extend the existing Assets table with the actual-economics fields, OR add a linked table `Asset Economics Actuals` keyed on Asset.

For v0: extend the Assets table directly. Fewer joins, simpler to query. Promote to a linked table when the field count gets unwieldy.

Eventually both move into Canon (`canon_engine`) alongside `canon_artifacts` so the economics are queryable by engines doing capacity and pricing math at runtime.

## Who consumes this

- **Will** ... reads the rollup for a proposed Trajectory to quote pricing. Doesn't need to see Asset detail; needs the totals.
- **Nick** ... reads actuals to plan capacity and identify which Asset Types are underpriced (build_time_actual consistently exceeds the range).
- **Future operators / contractors** ... read reference economics for the Asset Types they're qualified to build, take on work matching their `buildable_by` level.
- **Engines (eventually)** ... query economics at runtime to estimate a Trajectory before it's quoted, suggest cheaper substitutions, flag scope creep automatically.

## Open questions (held loosely; resolve through use)

1. **Multiplier validation cadence.** Once / quarter? After every 5 Systems shipped? TBD.
2. **Currency for ongoing operational cost.** Per-month-at-typical-volume or per-run-actual? Lean per-month for simplicity, log per-run when known.
3. **Failure rate granularity.** Percent or qualitative bucket? Percent requires real data; bucket is workable from day one. Lean bucket (low / medium / high) for v0.
4. **Platform amortization model.** How do we attribute platform ongoing costs to engagements? Simple share-of-volume? Tiered by Cluster? TBD when real platform cost data exists.
5. **What counts as design vs build time.** Some Assets blur this (a doc IS its spec). For docs: design_time = time to think, build_time = time to write. For workflows: design_time = PROMPT.md, build_time = implementation.

## What this is NOT

- Not a perfect estimation system. Real software estimation is famously hard; this just makes the work deterministic enough to quote and plan.
- Not a substitute for judgment. Will and Nick still pressure-test rolled-up estimates against intuition.
- Not static. The reference economics are expected to drift as Asset Types mature, contractors get faster, and platform infrastructure absorbs work that used to be instance-level.
- Not separate from the artifact discipline. Every economic data point is itself an artifact ... when actuals get recorded, they go through the same approval-and-store pattern as any other artifact.

## Resume pointer

When ready to operationalize:
1. Create `Asset Type Economics` table in the registry with the six-dimension schema.
2. Seed it from Nick's best estimates against the current Asset inventory (~50 rows).
3. Extend the Assets table with the actuals fields.
4. Backfill actuals for the last 10 Assets shipped (the recent KAI + Teknova work) to validate the model and sharpen the initial multipliers.
5. Quote the next Trajectory using the model. Compare to Nick's intuition. Adjust.
