# Konstellation Catalog ... locked architecture

**Status:** Locked 2026-05-22, revised 2026-05-27 (collapsed Slot, elevated Asset, separated Cluster/Constellation by depth, expanded Trajectory to include responsibility allocation). Do not re-litigate without explicit cause.

**Companion docs:**
- KAI brand context and "where to look": `../CLAUDE.md`
- Pitch narrative and voice rules: `narrative.md`
- Locked decisions: `locked-decisions.md`
- Original design doc with full rationale: `../DESIGN-offer-framework-2026-05-22.md`
- Alignment arc evidence: `../HANDOFF-konstellation-offer-framework-alignment-2026-05-22.md`
- Source of truth (authoritative, queryable): NotebookLM `KAI Offers` ... `9597dc22-56db-4291-a59e-4363b700e3f6`

## The Catalog (five layers)

Read bottom-up. Atoms compose into SKUs. SKUs group two ways (sales-facing and architectural). The per-client Trajectory sequences SKUs over time and allocates responsibility for each one.

```
Konstellation Catalog
    ├── Assets             (atomic deliverables ... the inventory)
    ├── Systems            (the SKU ... bundles of Assets)
    ├── Clusters           (sales bundles of Systems ... legacy buyer lens)
    ├── Constellations     (integration architecture across Systems ... agentic lens)
    └── Trajectory         (per-client sequence + responsibility allocation)
```

Each layer does one job. Do not collapse layers or use a term from one layer to describe another.

Clusters and Constellations are **not** parallel groupings. A Cluster is a sales convenience ... a bundle of Systems a buyer recognizes by name. A Constellation is deeper: the Systems within it share data, infrastructure, and operating logic. Constellations describe how the agentic company actually integrates. Clusters describe how 20th-century buyers shop.

## Assets (atomic deliverables)

The inventory. The unit of cost and reuse. An Asset is any one of:
- An automation workflow (n8n or equivalent)
- A database or data structure (Airtable, Supabase, vector store)
- A context engineering specification
- The content and context engineering documents themselves
- A Surface where applicable (the human interface)

Tracked in Airtable base `apppQjlZiktpbO4aX`. Assets are how the studio costs work and how the same building block gets reused across multiple Systems. Buyers do not shop at the Asset level.

## Systems (the SKU)

A System is a coherent bundle of Assets sold as a single unit. The smallest thing a client can buy. What Will quotes.

Each System has:
- A canonical, buyer-recognizable name ("AI SDR that knows your offer and books meetings")
- The Assets it bundles
- A scope-of-work shape (what gets built, what doesn't)
- A deployment time (typically 1–4 weeks)
- Pricing variants per Engagement Mode (see below)
- A home Constellation (its primary integration architecture)
- Optional Cluster memberships (the sales bundles it appears in)

A System lives in only one Constellation but may appear in multiple Clusters.

## Clusters (sales bundles, legacy lens)

A Cluster is a pre-bundled group of Systems sold under a name that 20th-century buyers already recognize ... "RevOps," "Lead Intake," etc. Clusters exist because buyers ask for legacy functional categories, not for agentic primitives.

A Cluster is **not** an integration architecture. The Systems inside it do not necessarily share infrastructure. They share a sales context.

**Vocabulary rule:** Cluster, not Play. Play already means campaign in the operator vocabulary.

Current named Clusters:
- **RevOps Cluster** ... the Systems a buyer would expect under "RevOps"
- **Customer Expansion Cluster** ... the Systems a buyer would expect under "Expansion"

Additional Clusters form as buyer perception evolves. The Cluster layer grows over time without restructuring anything underneath.

## Constellations (integration architecture, agentic lens)

A Constellation is a group of Systems that **share data, infrastructure, and operating logic** ... the architecture of the agentic company. Systems within a Constellation are designed to work as an integrated capability, not just to be sold together.

Constellations are forward-facing. They organize the company for the AI agent as primary actor, not for the human function as primary actor. This is what makes them deeper than Clusters: a Cluster says "these things sell together," a Constellation says "these things are built together and operate together."

The eight Constellations (derived from first principles):
1. **Canon** ... knows what the business knows
2. **Compass** ... decides what the business does next
3. **Signal** ... finds opportunities outside the business
4. **Forge** ... builds new capabilities and content
5. **Voice** ... speaks and listens on the business's behalf
6. **Pulse** ... moves transactions
7. **Guard** ... protects compliance
8. **Garden** ... grows what exists

Expanding past eight requires first-principles proof, not preference.

## Trajectory (per-client plan + responsibility allocation)

The Trajectory is the per-client sequenced plan of Systems over the first 6–12 months. Output of the GTM Survey.

It does two things:

**1. Sequences Systems over time.** Names the System order, the readiness gates between Systems, the success criteria, and the termination criteria. Sequencing respects Constellation dependencies (Canon before Voice, etc.). Without a Trajectory, clients chase the shiny System first and the foundations collapse.

**2. Allocates responsibility for each deliverable.** For every System in the plan, names who owns the implementation work ... KAI (as provider), the client (as owner of their side), or shared with explicit handoff points. The Trajectory is the forum where accountability gets defined between both parties. This is what makes it more than a roadmap ... it is the contract for who does what, when.

A signed Trajectory produces:
- A multi-quarter capital plan, not a single SOW. The artifact a credentialed expert can show an accountant or board.
- Readiness gates that protect the client from premature scaling.
- Termination criteria that protect both parties from drift.
- A defensible "no" mechanism when stakeholders chase off-plan work.
- Continuity for Operated engagements ... a named plan with markers, not "we'll figure it out."

---

## Delivery cadence

Inside an active engagement, work ships weekly. Each week names one delivery slot per engagement: the specific Asset bundle going out against the Trajectory. The Weekly Client Update reports against the slot. This is delivery rhythm, not a catalog layer.

## Engagement Modes (how a System is delivered)

Three modes, plus a rare premium fourth. Pricing varies per Mode per System.

### Operated (the default)

KAI builds, KAI operates. The client sees a Surface; the underlying System runs in the studio's environment.

- Retainer covers all third-party costs, operating time, weekly delivery cadence.
- The platform never transfers. RevOps infrastructure, Agent Hub, Canon platform, standardized workflows all stay in the studio's operating environment.
- The bespoke layer (client-specific workflows, their Airtable, their prompts) is technically theirs but operated by KAI.
- Most clients stay here indefinitely. Correct physics, not a downgrade.

### Adoption Track

Transitional mode for clients moving toward Owned. Phased absorption ... not all at once.

### Owned

Client takes operational ownership of the bespoke layer. Platform infrastructure still does not transfer. Rare. Requires a Readiness Score in the Survey that supports it.

### Implementation Bootcamp (rare premium)

For prospects who insist on learning to do it themselves. Coaching rates, time-boxed, capped hours. Default posture is to refuse and redirect to Operated.

## The sale (how it works)

1. **Sell a paid, time-boxed GTM Survey.** ~2 weeks, productized. Output: system design, readiness score, data architecture audit, and the proposed Trajectory. The Survey is itself a revenue event, not a free discovery cost.
2. **Survey output drives the Trajectory.** Will quotes price from this artifact. Responsibility allocation between KAI and the client is settled here, not later.
3. **Delivery begins.** Default mode: Operated. Weekly slots ship Assets against the Trajectory.
4. **Optional Adoption Track.** If the client's Readiness Score supports it and they want to move toward Owned.
5. **Optional Transfer to Owned.** Bespoke layer only; platform never transfers.

## What this solves

- **Sweetheart-pricing-and-invisible-service-work doesn't repeat.** The Survey makes data architecture, change management, and strategy work explicit and priced.
- **Buyers who want DWY but can't operate get filtered honestly.** The Readiness Score in the Survey reroutes most to Operated.
- **Accountability is settled before delivery, not after.** The Trajectory names who owns each piece. Surprises get caught at planning, not at handoff.
- **Selling does not require the builder in the room.** Cluster names and the orbit narrative carry the pitch. The Survey deliverable carries credibility. Will runs the calls.
