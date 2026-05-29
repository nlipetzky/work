# ABM-Mode System Design — Forward-Looking Canon

**Drafted:** 2026-05-27
**Status:** Reference architecture for ABM-leaning life-sci engagements
**Source canon:** `/Users/nplmini/code/work/practices/agentic-systems/learnings/teknova-enrichment-aav-procurement-authority-2026-05-27.md`

---

## Purpose

When a life-sci client buys outbound but evaluates lists in ABM fashion (per-account scrutiny, named-account intent, procurement-authority sensitivity), the standard outbound system underperforms. This roadmap defines what to install in addition to the outbound base for ABM-mode engagements.

Use this as the architectural reference when:

- A prospect indicates ABM-style evaluation in pre-sale diagnostics (per `practices/engagement-governance/reference/client-onboarding-playbook.md` Step Zero)
- An existing outbound engagement drifts into ABM territory and we re-contract for the transition
- Will positions a "high-touch enrichment" tier in the offer catalog

## The load-bearing canon insight

The outbound system answers the predicate: **"Is there a live program here in our segment?"**

ABM-mode life-sci engagement requires the predicate: **"Does procurement authority for that program sit inside this entity?"**

Every architectural fix below derives from that predicate shift. Surface this in any future client kickoff where ABM-mode is in scope.

## The three forward-looking sub-systems

### 1. Procurement-Authority Resolution (Boris #1)

**Function.** For each candidate account, determine whether the entity controls vendor selection for the active program, or whether authority sits with a parent company / CDMO partner / acquirer.

**Schema additions.**
- `account_type` flag: `sponsor-in-house` | `sponsor-locked-to-CDMO` | `CDMO-platform` | `unresolved`
- `procurement_authority_entity`: the legal entity that holds the vendor decision for this program
- `outreach_redirect`: if procurement authority is not the program owner, the redirect target

**Effort.** 2-3 weeks for v1, ongoing tuning. Treat as a build-tier sub-system, not a feature toggle.

**Install when.** Any engagement where buyer is sensitive to who controls vendor selection. Standard for biotech reagent / GMP-input / clinical-service motions.

### 2. CDMO Platform Enrichment System (Boris #2)

**Status.** Separate System Registry entry. Not a re-segmentation of Teknova Enrichment System. Working name: **CDMO Platform Enrichment System**.

**Why separate.** Re-segmentation fails the four-test for distinct System status:

| Test | Sponsor-track | CDMO-track |
|---|---|---|
| Buyer | Sponsor CMC | CDMO process development / supply chain |
| Offer | Asset-specific reagent fit | Multi-program standardization, audit-ready volume contracts |
| Data source | Clinical pipeline trackers (CT.gov, PubMed) | CDMO directories (ARM, BIOIA, BioPlan) |
| Trajectory shape | Asset-aligned, episodic | Supplier qualification, slower entry, stickier post-win |

**Infrastructure shared with Teknova Enrichment System.** Clay, BigQuery, orchestration patterns. Independent at: segment criteria, offer, copy, Trajectory.

**Effort.** 3-4 weeks for v1.

**Install when.** Client's go-to-market includes selling to CDMOs as a distinct buyer class. Often a parallel motion to sponsor outreach.

### 3. Corporate-Tree Resolution (Boris #3)

**Function.** Resolve ownership graphs beyond domain matching. Catches the cases the existing domain resolver misses: Brain Neurotherapy Bio → AskBio → Bayer, Prevail → Lilly, Gyroscope → Novartis, etc.

**Implementation.** New data source integration (Crunchbase API or similar M&A tracker) plus an ownership-graph lookup layer that resolves to the operating company at the time of the program reference.

**Effort.** 3-5 days for v1 integration, with ongoing data-source cost.

**Install when.** Any engagement targeting clinical-stage biotech where M&A and parent-subsidiary structure routinely obscures the operating company. Standard for life-sci.

## What stays in the standard outbound system

These do NOT require new sub-systems. They're conventions/tunings to apply at install:

- **Geography filter upstream (Boris #5):** move geography from post-enrichment to pre-enrichment in standard install. Reduces credit spend on disqualified entities. Half-day tune.
- **Asset-status freshness (Boris #4):** apply manually per sprint via the existing weekly review. Operator surfaces in status updates when an asset's "active" framing is questionable.
- **Asset-to-avoid annotation (Boris #6):** copy-practice convention. Add `avoid-mentioning` field to contact records; copy-gen reads it. Hours of work.

## Pre-sale identification: when ABM-mode is in scope

Per the onboarding playbook Step Zero, the diagnostic for ABM-mode:

- Does the buyer evaluate lists at the account level rather than the cohort level?
- Is the buyer's sales motion ABM, multi-thread, or named-account?
- Does the buyer's procurement decision depend on resolving authority across complex ownership trees?
- Is the buyer category sensitive to wrong-target outreach (regulated industries, scientific/medical, narrow-vendor B2B)?

If two or more are yes, install the ABM-mode sub-systems alongside the outbound base.

## Sequencing for new client install

| Phase | Work | Effort |
|---|---|---|
| Pre-sale | Identify ABM-mode requirement; price accordingly | Sales conversation |
| Phase 1 (kickoff) | Standard outbound base installed; geography upstream tune; asset-to-avoid convention documented | Half-week |
| Phase 2 | Procurement-Authority Resolution sub-system designed and installed | 2-3 weeks |
| Phase 3 | Corporate-Tree Resolution sub-system installed | 3-5 days |
| Phase 4 (optional) | CDMO Platform Enrichment System installed if client's GTM includes CDMO targeting | 3-4 weeks |
| Phase 5 | First production sprint with full ABM-mode stack | 1 week |

## Commercial implications

ABM-mode engagements should be priced differently from standard outbound:

- Sub-system installs are project work (one-time fees), not retainer
- Ongoing operation is higher-tier retainer (Multi or Full per the engagement-governance methodology) because sprints absorb more validation effort
- Data-source costs (Crunchbase, M&A trackers, CDMO directories) are pass-through or padded into the retainer per Trajectory model

If a prospect wants ABM evaluation at outbound-base pricing, that's the Teknova trap. Decline or restructure.

## Registry implications

- The Teknova Enrichment System registry entry should be tagged "outbound-base, ABM-augmented during operation, terminated 2026-06-25" and reference the Learnings file.
- The CDMO Platform Enrichment System should be registered as a separate entry (slot reserved, not yet built).
- Procurement-Authority Resolution should be a registered sub-system attachable to any operating System Registry entry.

## What this roadmap does NOT cover

- Pricing specifics (defer to Will + offer catalog)
- Sub-system implementation details (these are architecture-level, not engineering-level specs)
- Specific data-source vendor selection (Crunchbase vs PitchBook vs etc.)
- Copy / offer artifacts for the CDMO play (lives in copy practice)

## Next actions

- Boris confirms System Registry slot for CDMO Platform Enrichment System
- Boris confirms registry attachment convention for Learnings file
- Will reviews commercial implications before the next ABM-leaning prospect conversation
- Polaris adds ABM-mode identification to the onboarding playbook Step Zero diagnostic
