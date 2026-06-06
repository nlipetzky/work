---
title: System Registry — Operating Manual
bound_base: apppQjlZiktpbO4aX
bound_base_name: System Registry
binding: bidirectional — this manual and the base's "Operating Model" table are two halves of one thing; change one, update the other in the same turn
last_synced: 2026-06-04
---

# System Registry — Operating Manual

This is the context half of the System Registry. The other half is the structured state in Airtable base `apppQjlZiktpbO4aX`. Neither stands alone:

- The **base** is where state lives — queryable, viewable, reconcilable against reality.
- **This manual** is where intent lives — what the registry is, why it exists, how to operate it, what not to do.
- They are **bound bidirectionally**: the base's `Operating Model` table points at this file; this file points at the base. If you change the model, change both in the same turn or they drift, and a drifted pair is worse than either alone.

## Why this exists (the principle we paid for)

A schema does not explain itself. Two failure modes:

- **The SaaS trap:** structure with no embedded intent. A cold agent crawls the tables and reverse-engineers an operating model — usually a plausible, generic CRUD one — and is subtly, confidently wrong.
- **The inert-doc trap:** intent with no structure. A narrative nobody is forced to read drifts into fiction. (This is why the old `practices/revops/workflows/REGISTRY.md` was frozen — not because markdown is bad, but because an unbound doc rots.)

The agentic form is **self-describing structure**: the structured surface carries, at the point of access, the context that explains it, and that context is pinned to the structure both ways. Structured data and context are not opposed. The error is letting either one impersonate the whole.

## How an agent should enter this system

1. If pointed at the base with no other context: read the **Operating Model** table top to bottom (it is described as READ-FIRST), then this manual. Do not infer from `Systems`/`Assets`/`Roadmap` schema.
2. If pointed at this manual first: read it, then open the base's Operating Model table to confirm nothing has drifted, then the live tables.
3. Only after both: act.

## The three load-bearing principles

1. **Stable system identity.** `System ID` is a human-readable slug and the join key. Everything in `Assets` and `Roadmap` belongs to a system by that slug's record. Never key off `Name` or record IDs.
2. **One roadmap, system-scoped.** A single `Roadmap` table. "Teknova's roadmap" and "the master roadmap" are the same table, different filters. Never a per-system roadmap table — that is the anti-pattern that fails at scale.
3. **Registration requires a declared emit contract.** A system is not fully registered until `Inputs`, `Outputs`, `Key Metrics` are filled. The eventual per-system dashboard is a *consequence* of that contract, not separate future work.

## Classification: the five layers (aligned to the Konstellation Catalog, 2026-06-04)

The studio is itself an agentic organization, so the registry uses the SAME architecture KAI sells: the locked five-layer Konstellation Catalog (`/Users/nplmini/code/work/accounts/ventures/konstellation-ai/reference/catalog.md`, "do not re-litigate"). The deep research (`reference/agentic-system-definition-research-2026-06-04.md`) does not replace it; it sharpens the System/Asset boundary. Full rubric: `reference/system-classification.md`.

Read bottom-up: Asset → System → {Cluster (sales lens), Constellation (architecture lens)} → Trajectory. Cluster and Constellation are NOT parallel groupings — a Cluster is how buyers shop, a Constellation is how the company integrates.

- **Asset** — atomic deliverable (workflow, DB, context spec, surface); no standalone emit contract; unit of cost/reuse; one write owner.
- **System** — a coherent capability with an emit contract (`Inputs` / `Outputs` / `Key Metrics` + stopping condition), one outcome, operated/sold as one unit. ONE home Constellation, MANY Clusters. Agency is orthogonal; never split a System by human role/SOP (a verified failure mode).
- **Cluster** — a sales bundle of Systems in legacy buyer language ("RevOps", "Customer Expansion"). Packaging, not integration. A System appears in many.
- **Constellation** — the integration architecture: Systems that share data, infrastructure, and operating logic. EIGHT, fixed, first-principles: Canon, Compass, Signal, Forge, Voice, Pulse, Guard, Garden. A System has ONE home. GUARDRAIL (keeps us consistent with conventional wisdom): a Constellation is a real shared-substrate integration boundary, not a theme — Systems share a Constellation because they share substrate, not because the name fits.
- **Trajectory** — a per-engagement sequence of Systems over time. An engagement (client/venture) HAS a Trajectory; it is NOT a Constellation.

A **segment / play is a configuration of a system, not a new system.** Never spawn a system per segment, and never encode a foreseeable variant axis (segment, region, product line, signal source) into the immutable `System ID` slug — that guarantees a forbidden rename. `teknova-enrichment` runs AAV as its first segment; it is not `teknova-aav-enrichment`.

`Definition Maturity` (emerging / forming / stable) is orthogonal to operational `Status`. A system can be `building`/`operating` while its definition is still `emerging`. Emerging is a legitimate, registrable state — registration tracks evolving understanding, it does not gate on finished understanding. Add only structure reality has demanded; modeling ahead of reality is the rigidity failure mode.

Migration note (2026-06-04, realigned): the base is mid-migration on an earlier wrong 3-tier model. Pending corrections: Canon → Constellation (currently a System row); RevOps / GTM → Clusters (currently Constellation rows); Teknova / KAI → engagements with Trajectories (currently Constellation rows); each System gets a home Constellation. See `PLAN-registry-classification-migration-2026-06-04.md`.

## What the tables are (and are not)

- **Systems** — one row per living, operated system. Identity, lifecycle, emit contract, pointers to canonical docs, pointer to where its process-state lives.
- **Assets** — what is built inside a system. `Lifecycle State` keeps built / verified / deployed / running / archived distinct (deployed-but-never-run is a real, common state). `Reconciled Against Reality = false` means the row is a hypothesis until verified against the live system. Exactly one `Write Owner` per asset.
- **Roadmap** — the change backlog: what we intend to do *to* a system. `Done When` + `Evidence` gate completion; a bare status flip is not done.
- **Process state is NOT in this base.** "Where is the running system right now" lives at each system's `Process State Location` (today: the Play Steps table in RevOps Surface; later: the system's own Surface/dashboard). Registry = what exists + what's planned. Process state = what's happening now. Different layers, deliberately.

## Hard rules

- This base **indexes** the local folder/file architecture; it never replaces it or holds system content. File paths in `Canonical Docs` / `Source / Build File Path` / `Context Path` are the link.
- One Write Owner per asset. Parallel sessions do not write the same asset.
- Never silently delete. Retire as a tombstone with a reason.
- The base is **visible** now but only **reliable** immediately after a reconcile, until the registry↔reality reconciliation job exists (Roadmap item, system `teknova-aav-enrichment`).

## Pointers

- Base: `apppQjlZiktpbO4aX` — tables: Operating Model `tbljPzQuvxDti10yc`, Systems `tbldwCzbavBcOlP2C`, Assets `tblu5JBzOxbEHLQmP`, Roadmap `tblt6pQ3Snu7qkMGb`, Constellations `tblCCPj7Sm9md86y3`.
- Design rationale: `practices/agentic-systems/DESIGN-system-registry-v0-2026-05-18.md`.
- Canon principle: `practices/agentic-systems/canon/canon-log.md` — "Structured data must be self-describing at the point of access" (2026-05-18).
- Frozen predecessor (tombstone, do not edit): `practices/revops/workflows/REGISTRY.md`.
