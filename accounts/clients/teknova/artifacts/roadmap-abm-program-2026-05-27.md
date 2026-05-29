# AAV Program — Architecture Roadmap for ABM-Style Outreach

**Prepared for:** Teknova
**Date:** 2026-05-27
**Author:** Nick Lipetzky, Konstellation AI

---

## Context

This document outlines what would be required to evolve the AAV lead-generation program from its current outbound-base architecture into a true account-based marketing (ABM) operating model.

Over the past few months, the AAV program has been operated with progressively more account-level scrutiny per contact: corporate-lineage verification, manufacturing footprint validation, asset-stage analysis, parent-subsidiary resolution. The team's review patterns indicate the program has shifted from outbound (high-volume cohort engagement, response-rate filtering) to ABM (named-account evaluation, per-account research, vendor-authority resolution).

The underlying enrichment system was built for outbound. It produces ranked cohorts against ICP criteria, with engagement as the filter for fit. The system has been adapted to support ABM-style evaluation through additional verification layers (live LinkedIn checks, Salesforce contact verdict, opt-out propagation), but these are layered on top of an outbound architecture, not foundational to ABM.

This roadmap describes what would be required to operate the AAV program as a true ABM motion, with the system designed for that purpose.

---

## The architectural predicate shift

The current system answers the question: **"Is there a live AAV program here?"**

The question the team has been actually asking is: **"Does procurement authority for that program sit inside this entity?"**

Same surface, different predicate. Every per-account critique surfaced in recent reviews (subsidiaries that fail North America manufacturing, M&A artifacts that resolve to the wrong parent, programs whose vendor decisions sit at the CDMO rather than the sponsor, terminated assets cited as active) traces back to this predicate gap.

A system designed for the second predicate looks structurally different from one designed for the first.

---

## Three sub-systems required for ABM-mode

### 1. Procurement-Authority Resolution

For each candidate account, determine where the vendor decision actually sits. Three account types:

- **Sponsor in-house.** Sponsor controls manufacturing decisions; outreach targets sponsor CMC.
- **Sponsor locked to CDMO.** Vendor authority has moved to the manufacturing partner; outreach must redirect.
- **CDMO platform.** The CDMO itself is the buyer across multiple programs; different sales motion entirely.

This is a new sub-system, not a feature added to the existing pipeline. Effort: 2-3 weeks for an initial production version, with ongoing tuning as edge cases surface.

### 2. Corporate-Tree Resolution

Resolve ownership graphs beyond domain matching. The current enrichment layer catches subsidiaries that share a domain with the parent. It misses structural ownership: Brain Neurotherapy Bio belongs to AskBio belongs to Bayer; Prevail belongs to Lilly; Gyroscope contacts now sit at Novartis post-acquisition.

This requires an explicit ownership-graph data source plus a resolution layer that walks the tree at the time of the program reference. Effort: 3-5 days for a v1 integration; ongoing data-source cost.

### 3. CDMO Platform Targeting

The CDMO is structurally different from the sponsor as a buyer:

| Dimension | Sponsor | CDMO |
|---|---|---|
| Buyer role | CMC / process development at the sponsor | Process development / supply chain at the CDMO |
| Offer | Asset-specific reagent fit | Multi-program standardization, volume contracts |
| Data source | Clinical pipeline trackers | CDMO directories (ARM, BIOIA) |
| Sales motion | Asset-aligned, episodic | Supplier qualification, stickier post-win |

A CDMO-targeted program is essentially a separate sales motion. Forge Biologics, Catalent, Viralgen, and the rest of the AAV CDMO landscape would be the universe. This is a separate program, not a re-segmentation of the sponsor track. Effort: 3-4 weeks to design and stand up.

---

## What is already in good shape

These conventions are already in the existing system or applied per delivery cycle; they would carry forward into an ABM-mode upgrade without modification:

- **Geography filter** applied upstream to reduce enrichment cost on disqualified entities.
- **Asset-status freshness** verified per delivery against current trial registries and program announcements.
- **Asset-to-avoid annotation** as a copy convention preventing outreach from referencing programs that should not be discussed (approved assets, partnered programs).

---

## What this means for ongoing list work

Modality lists across AAV, cell therapy, mRNA, and lentiviral can continue to run on the existing outbound system. The lists will produce cohorts of varying volume depending on each modality's population characteristics and how the underlying data sits in public sources.

Where a modality's structure makes per-account scrutiny essential (AAV is the clearest example), the ABM-mode sub-systems above would materially reduce the manual review burden and improve hit rate. Without them, AAV lists will continue to require the level of per-account review the team has been performing.

---

## Sequencing if invested

| Phase | Work | Effort |
|---|---|---|
| 1 | Discovery and design confirmation against current AAV criteria | 1 week |
| 2 | Procurement-Authority Resolution sub-system installed | 2-3 weeks |
| 3 | Corporate-Tree Resolution sub-system installed | 3-5 days |
| 4 | CDMO Platform Targeting program designed and stood up (optional, dependent on whether CDMO is a target buyer class) | 3-4 weeks |
| 5 | First production cycle with the full ABM-mode stack | 1 week |

Total: roughly 6-9 weeks for the full stack, less if CDMO targeting is not pursued.

---

## Commercial structure

ABM-mode operation requires a different commercial frame from outbound:

- Sub-system installs are project work (one-time fees), separate from any ongoing retainer.
- Ongoing operation is at a higher retainer tier because each delivery cycle absorbs more validation effort.
- Data-source costs (M&A trackers, CDMO directories) are passed through or built into the retainer.

A retainer sized for outbound is not sized for ABM-mode operation. Continued ABM-style work at the current arrangement would require revisiting the commercial frame.

---

## Decision point

This roadmap is informational. It outlines what AAV would require if the team wants to continue with ABM-style operation as a designed motion rather than as an adaptation on top of an outbound system.

The alternative path is to operate other modalities (cell therapy, mRNA, lentiviral) where the underlying market structure is more amenable to outbound and per-account review burden is naturally lower.

Both directions are valid. The right choice depends on your strategic priorities and team capacity. Happy to walk through either direction in detail when we meet.
