# Konstellation Offer Framework — design (2026-05-22)

Status: **design only, not built.** Locks the architecture for how Konstellation defines, prices, sells, and delivers agentic systems. Will Rosellini sells from this; Nick builds against it; future operators and contractors execute through it.

> **REVISED 2026-05-27.** The architecture in §1 and §2.3 of this document has been superseded. Current architecture lives in `reference/catalog.md` (five-layer model, read bottom-up: Assets → Systems → Clusters → Constellations → Trajectory). Key changes: Slot dropped from the catalog as a layer (it is delivery cadence); Assets elevated to atomic deliverable; Systems redefined as bundles of Assets (the SKU); Clusters reframed as sales bundles only (not integration architecture); Constellations reframed as integration architecture (not just functional primitives); Trajectory expanded to include responsibility allocation between Konstellation and the client. This document is preserved as the alignment-arc record. Sections 0, 2.1, 2.2 (with revision noted inline), 3, 4, 5, 6, 7, 8, 9, 10 remain valid.

Companion docs:
- `/Users/nplmini/code/work/practices/agentic-systems/system-registry-operating-manual.md` (the registry that tracks what exists once built)
- `/Users/nplmini/code/work/practices/agentic-systems/reference/weekly-client-update-template.md` (the recap artifact)
- `/Users/nplmini/code/work/practices/agentic-systems/reference/build-operating-system.md` (the asset lifecycle gates)

## 0. The philosophical foundation

The sky is constant. The constellations are interpretations that change as the perceiver changes.

The capability stars — Signal, Canon, Compass, Voice, Pulse, Forge, Guard, Garden — are the underlying reality of what any organization fundamentally does. Twentieth-century organizations could only see the groupings their perception apparatus (departments, org charts, Porter's value chain) let them see. "RevOps" was visible to them because they had the functional categories to group those stars that way.

Agentic perception is a different telescope. It reveals different groupings. **Clusters** are the new constellations — how an agentic-capable observer maps the same sky.

Three load-bearing consequences:

1. **Operated (DFY) is the default delivery mode.** Most organizations are still using the old telescope. They need an operator who can see the new constellations and point them out. Most clients will never fully transition their perception — and that's fine. They're paying for the operator's perception, not just the build.
2. **Phased absorption is the only honest delivery model.** You can't show a client the whole new sky at once. You show them one constellation that overlaps with what they already recognize, then widen the field of view from there. The Trajectory is a guided observation sequence.
3. **The pitch writes itself.** "Your organization is looking at the sky with old constellations. Here's what the new map shows. We introduce one new constellation at a time, at the pace your org can absorb. We usually start with one you already half-recognize." No agentic-architecture lecture required.

Every other section of this doc derives from these three.

## 1. The Konstellation Catalog (REVISED 2026-05-27)

Original six-layer model superseded. Current model has five layers, read bottom-up: atoms compose into SKUs, SKUs group two ways (sales-facing and architectural), the per-client Trajectory sequences SKUs over time and allocates responsibility for each one.

```
Konstellation Catalog
    ├── Assets             (atomic deliverables ... the inventory)
    ├── Systems            (the SKU ... bundles of Assets)
    ├── Clusters           (sales bundles of Systems ... legacy buyer lens)
    ├── Constellations     (integration architecture across Systems ... agentic lens)
    └── Trajectory         (per-client sequence + responsibility allocation)
```

**Clusters and Constellations are not parallel groupings.** A Cluster is a sales convenience ... a bundle of Systems a buyer recognizes by name. A Constellation is deeper: the Systems within it share data, infrastructure, and operating logic. Constellations describe how the agentic company actually integrates. Clusters describe how 20th-century buyers shop.

**Slot is no longer a catalog layer.** Slot is delivery cadence — one weekly Asset bundle shipping against a Trajectory. See §2.3.

**Assets elevated to atomic deliverable.** Workflow, database, context engineering spec, content/context docs, Surface. The unit of cost and reuse.

### 1.1 The eight Constellations

Derived from first principles — the eight things every organization, regardless of industry, must do to exist and grow. Constellations are an **integration architecture**: the Systems inside a Constellation share data, infrastructure, and operating logic. Forward-facing; the agentic-company lens.

| Constellation | What it does |
|---|---|
| **Canon** | Knows what the business knows |
| **Compass** | Decides what the business does next |
| **Signal** | Finds opportunities outside the business |
| **Forge** | Builds new capabilities and content |
| **Voice** | Speaks and listens on the business's behalf |
| **Pulse** | Moves the business's transactions and operations |
| **Guard** | Protects compliance, security, and reliability |
| **Garden** | Grows existing relationships and assets |

**Not Constellations:**
- **Agent Hub** — the orchestration layer. Not its own Constellation; it's the executive engine routing between them.
- **Infrastructure** — not its own Constellation. It's the platform substrate (Agent Hub + Canon + technical backbone) that all Constellations run on. Konstellation provides it; clients never own it.

### 1.2 Clusters (sales bundles, legacy lens)

A Cluster is a pre-bundled group of Systems sold under a buyer-recognizable name. Clusters exist because buyers still think in 20th-century functional terms; they ask for "RevOps," not for "Signal + Compass + Voice + Pulse + Canon."

A Cluster is **not** an integration architecture. The Systems inside it don't necessarily share infrastructure. They share a sales context. Clusters solve the perception-gap problem at the point of sale; Constellations solve the integration problem in the build.

Initial Clusters in the catalog (composition listed at Constellation level, since canonical System-level SKUs are not yet enumerated — see §1.3 known gap):

| Cluster | Constellations touched | What the buyer hears |
|---|---|---|
| **RevOps Cluster** | Signal, Compass, Voice, Pulse, Canon | "Full-stack revenue intelligence and outbound execution" |
| **Customer Expansion Cluster** | Garden, Canon, Voice | "Grow existing accounts without adding headcount" |
| **Strategic Planning Cluster** | Compass, Canon, Signal | "Executive decision-support with continuous market awareness" |
| **Compliance Cluster** | Guard, Canon, Compass | "Stay current on regulatory risk; audit-ready by default" |
| **Hiring Cluster** | Signal, Voice, Garden | "Source, screen, onboard, develop" |

Additional Clusters form as buyer perception evolves. The Cluster layer grows over time without restructuring anything underneath.

### 1.3 Systems (the SKU)

A System is a coherent bundle of Assets sold as a single unit. The smallest thing a client can buy. What Will quotes.

Each System has:
- A canonical, buyer-recognizable name ("AI SDR that knows your offer and books meetings")
- The Assets it bundles
- A scope-of-work shape (what gets built, what doesn't)
- A deployment time (typically 1–4 weeks)
- Pricing variants for each Engagement Mode (see §3)
- A home Constellation (its primary integration architecture)
- Optional Cluster memberships (the sales bundles it appears in)

A System lives in only one Constellation but may appear in multiple Clusters.

**Known gap (2026-05-27):** Canonical, buyer-facing System SKUs are not yet enumerated. The studio's System Registry (Airtable base `apppQjlZiktpbO4aX`) tracks operating Systems (platforms + client instances like RevOps Engine, Expert Liaison, Teknova Enrichment), not Catalog Systems (buyer-facing SKUs). The SKU layer needs to be defined before Cluster compositions can be expressed at System granularity. Until then, Cluster composition is rendered at the Constellation level.

### 1.4 Assets

Atomic deliverables. The inventory unit. The unit of cost and reuse.

An Asset is one of:
- An automation workflow (n8n or equivalent)
- A database or data structure (Airtable, Supabase, vector store)
- A context engineering specification
- The content and context engineering documents themselves
- A Surface where applicable (the human interface)

Tracked in Airtable base `apppQjlZiktpbO4aX`. Buyers do not shop at the Asset level. Systems bundle Assets and are what get sold.

## 2. The Engagement Lifecycle

```
GTM Survey  →  Engagement Plan (Trajectory)  →  Delivery (Operated default)  →  Optional Adoption Track  →  Optional Transfer to Owned
```

### 2.1 GTM Survey (the productized Diagnostic)

A paid, time-boxed engagement (~2 weeks) that precedes any build. Outputs:

- **System Design** — which Constellations the client needs, which Clusters are recommended, which Systems land in v1.
- **Readiness Score** — honest assessment along defined dimensions: process clarity, decision authority, data hygiene, change capacity, internal operator presence. Determines whether Adoption Track is viable or whether Operated is the only sustainable mode.
- **Data Architecture Audit** — current tech stack mapping, system-of-record identification, integration points, gaps. This is non-negotiable; without it scope is unbid-able.
- **Recommended Trajectory** — the named, sequenced Plan of Systems through the first 6–12 months.
- **Cost Comparison** — for prospects who say they want to build internally, an honest priced comparison of Operated vs. building-it-yourself (FTEs, training, ramp, tooling, expertise gap).

**Modular output structure.** The Survey's findings split into:
- **Operator-level findings** — decision rights, parent-org tech stack, stated goals. Reusable if the operator pivots between business units.
- **Business-unit findings** — GTM motion, ICP, process state. Specific to the unit surveyed.

This matters: a single operator may have multiple business units (Shawn has both faith and education). The Survey is scoped per business unit; the Trajectory is per business unit. Will's first qualifying question on any engagement: "Which business unit are we surveying?"

### 2.2 Engagement Plan (the Trajectory)

The signed scope contract.

**The Trajectory does two things (revised 2026-05-27):**
1. **Sequences Systems over time** — System order, readiness gates between Systems, success criteria, termination criteria. Sequencing respects Constellation dependencies (Canon before Voice, etc.).
2. **Allocates implementation responsibility for each System** — names who owns each piece of work: Konstellation as provider, the client as owner of their side, or shared with explicit handoff points. The Trajectory is the forum where accountability gets defined between both parties, not punted to delivery.

Source-of-truth artifact, with three rendered views:

| View | Audience | What it contains |
|---|---|---|
| **Proposal View** | Prospect (Will sells from this) | Scope, trajectory, pricing, what's included, success criteria. No registry pointers, no build paths, no internal lifecycle. |
| **Client Operating View** | Active client (read weekly) | Current state of their installed Systems + next-week commitment + assets in flight. Feeds the weekly client update template. |
| **Contractor Brief** | Delegation target | System definition + this week's slot + build file paths + asset registry rows to update + lifecycle gates. |

The source-of-truth fields:
- System Catalog references (which Systems are in scope)
- Engagement Mode per System (see §3)
- Pricing tier and cadence rule (see §4)
- Initial scope (v1 lockdown — concrete trajectory for the first 90 days)
- Trajectory backlog (named Systems beyond v1, in priority order)
- Inputs / Outputs / Key Metrics (matches the registry's emit contract)
- Surface description (Operated mode) and/or Adoption Track plan (transitional mode)
- Success criteria and termination criteria

### 2.3 Delivery cadence (REVISED 2026-05-27)

Inside an active engagement, work ships weekly. Each week names one delivery slot per engagement — the specific Asset bundle going out against the Trajectory. The Weekly Client Update template (see companion doc) reports against the slot.

**Slot is no longer modeled as a catalog layer.** It is delivery cadence, not architecture. The "Slot" word is still in use for the weekly Asset bundle name; it just doesn't appear in the layer hierarchy.

## 3. Engagement Modes (the SKUs)

Three SKUs, plus a rare premium fourth.

### 3.1 Operated (the default)

You build, you operate. The client sees a Surface; you run the underlying System. Retainer covers all third-party costs, your operating time, weekly delivery cadence.

The **platform** never transfers. RevOps Engine infrastructure, Agent Hub, Canon platform, standardized workflows — these stay in your operating environment. The client consumes outputs via the Surface.

The **bespoke layer** — workflows custom to the client, their Airtable, their prompts, their data — is technically theirs but operated by you.

Stickiness by design. Most clients will land here and stay here. That is not a failure mode; it is the right physics for most organizations.

### 3.2 Adoption Track (optional add-on, gated)

A milestone-driven program to transfer ownership of the bespoke layer. **Platform never transfers, regardless.**

Has named deliverables:
- Process documentation
- Role definitions and decision rights
- Internal operator hire/train (named person on the client side)
- Runbooks
- Weekly handoff sessions with clear exit criteria

Priced separately from Operated retainer.

**Calibrated, not all-or-nothing.** A common shape: client commits one named operator to spend N hours/week becoming the System's steward. We never train the whole org. The named steward is the receiver.

Has a real possibility of not completing. If the milestones are missed, the engagement converts back to Operated, indefinitely, by mutual agreement at signing. This is named upfront so no one is surprised.

### 3.3 Owned (the destination, not a starting mode)

Reached only by successfully completing an Adoption Track. Client takes possession of the bespoke layer; platform stays with Konstellation under a continuing platform license / operating retainer.

There is no "Owned at signing." DWY is a destination, not a starting state.

### 3.4 Implementation Bootcamp (rare premium SKU)

For prospects who explicitly want capability transfer rather than operations — "teach my team to be Nick." This is coaching, not building. Priced at coaching rates, time-boxed, capped hours, explicit exit.

Will and Nick agree case-by-case on whether to offer this. Default posture: refuse, redirect to Operated. The GTM Survey's cost-comparison output usually does the redirection for them.

## 4. Pricing-determines-cadence

Pricing sets cadence, not the other way around.

A retainer tier determines how many Weekly Delivery Slots fire per week. Examples (placeholders — Nick + Will set real numbers):

| Tier | Slots / week | What clients get |
|---|---|---|
| **Solo Cluster** | 1 | One Cluster under operation; one new asset bundle per week |
| **Multi-Cluster** | 2 | Two concurrent Clusters; one asset bundle per Cluster per week |
| **Full-sky** | 3+ | Multiple Clusters + custom System development concurrent |

The tier and cadence are named in the Engagement Plan. Slots that don't fire in a week roll forward or convert to optimization work; they do not stack indefinitely.

## 5. The Platform / Instance separation

Already a registered principle in the System Registry. Restated here because it is load-bearing for the offer model.

- **Platform systems** (shared infrastructure across engagements) are Konstellation IP. Examples: RevOps Engine, Canon platform, Agent Hub orchestration. These never transfer to a client, regardless of Engagement Mode. They are the basis of Konstellation's repeatability and margin.
- **Client / engagement systems** (one instance per client business unit) are bespoke. These may transfer through an Adoption Track to Owned mode.

A single operator may have multiple client instances of the same platform (Shawn's faith + education would each be an instance consuming the same RevOps platform). The registry tracks this with `System Type` and `Depends On`.

## 6. Konstellation Catalog v1 — what's offerable today

Honest scoping of what Konstellation can sell on day one vs. what is roadmap.

### 6.1 Constellation readiness

| Constellation | Status | Notes |
|---|---|---|
| Canon | Production-ready (partial) | Transcript Decomposition + Vector Knowledge Base built; deeper canon work is custom build |
| Compass | Production-ready (within RevOps context) | ICP gate, persona scoring, decision verdicts proven at Teknova; standalone Compass Systems custom build |
| Signal | Production-ready (GTM context) | Public-source signal capture proven at Teknova; non-GTM Signal Systems custom build |
| Voice | Production-ready (outbound) | Email sequence + Outreach Surface proven; inbound Voice Systems roadmap |
| Pulse | Production-ready (CRM sync) | Salesforce + HubSpot sync battle-tested; broader operational Pulse Systems roadmap |
| Forge | Partial | Microsite/Proposal Gen System sellable; broader Forge Systems case-by-case |
| Garden | Partial | Expansion intel sellable for Shawn; broader Garden Systems form as engagement grows |
| Guard | Roadmap | Future strength in regulated industries |

### 6.2 Cluster readiness

| Cluster | Status | Notes |
|---|---|---|
| RevOps Cluster | Production-ready (full) | Battle-tested at Teknova; complete Signal + Compass + Voice + Pulse + Canon pipeline |
| Customer Expansion Cluster | Production-ready (assembled) | Components exist across Garden + Canon + Voice; first full assembly = Shawn's engagement |
| Strategic Planning Cluster | Partial | Compass + Canon foundations present; full Cluster custom build |
| Compliance Cluster | Roadmap | Guard Constellation not yet built; high value in regulated verticals |
| Hiring Cluster | Roadmap | Components could be assembled from Signal + Voice + Garden; no client demand yet |

This is the source of truth for "what can Will sell this week." It is updated as new Systems and Clusters land production-ready.

## 7. First instantiation — Shawn (BAND, faith business)

The first execution of this framework is the GTM Survey for Shawn Boom's faith business unit (not the education business, which he initially indicated and then pivoted away from).

This is the dogfood test. It will:
- Validate the GTM Survey deliverable shape against a real prospect.
- Produce the first Engagement Plan / Trajectory artifact.
- Surface the gaps in the framework that need a v0.1.

Will leads commercial terms. Nick builds. The Survey output is the artifact Will quotes price from.

Expected first-Trajectory shape based on Shawn's stated priorities in the meeting transcript:
- **v1 (first 90 days):** Customer Expansion Cluster targeting top 50 accounts. Components draw from Garden (account intel, expansion signals) + Canon (transaction history, customer cube) + Voice (rep enablement briefings).
- **v2:** RevOps Cluster (signal monitoring for new MQLs from external sources).
- **v3+:** Canon Constellation expansion (transcript decomposition, vector knowledge, AI briefings).

Engagement Mode: Operated default. Adoption Track unlikely to succeed (Shawn explicitly said his team can't take it on, his head of marketing is the named steward but capped on hours). Operated retainer is the right physics here.

## 8. Open questions resolved by the first execution

- Real System names inside each Constellation (vs. current placeholders).
- Real pricing for each tier and each System.
- Survey duration and cost calibration.
- Render-spec for the three Trajectory views (proposal / client operating / contractor brief).
- Whether the Adoption Track has a standardized scope or is custom per engagement.
- How the Weekly Client Update template auto-feeds from Slots + registry.

These are deliberately left open. They are answered by doing, not by designing.

## 9. What this design replaces

- Ad hoc proposals reconstructed from memory each prospect.
- Implicit pricing that doesn't separate platform from instance from advisory.
- Invisible service work (strategy, change mgmt, training) eaten by Nick.
- Reactive scope creep with no named termination criteria.
- Mode ambiguity between DFY and DWY at signing.

## 10. What this design does NOT do

- Automate the GTM Survey itself. It remains a human-led engagement, paid, productized.
- Eliminate scope changes. Trajectories are revisable, but revisions are named events with their own decision moments.
- Make Konstellation a SaaS company. The product is operated systems with a perception layer; not self-serve software.
- Prevent bad-fit prospects. The Readiness Score in the Survey is the filter; some prospects will fail it and that's correct.

---

## Resume pointer

After approval of this design, the next two artifacts in order:

1. The **GTM Survey artifact for Shawn (faith business)** — first dogfood instantiation. Drives Will's pricing conversation this week.
2. The **System Catalog v1.0** as a public-facing document — refines the placeholder System names against Nick's real inventory; this becomes Will's working menu.

The framework's reliability comes from execution, not design. Run it on Shawn, fix what breaks, then formalize v0.1.
