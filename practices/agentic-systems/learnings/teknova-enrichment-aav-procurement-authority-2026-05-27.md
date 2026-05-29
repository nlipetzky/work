# Learnings: Teknova Enrichment System — AAV procurement-authority lens

**Source**: Ellie's review of the AAV outbound list, captured 2026-05-22.
**Status**: Canon. Bank for next life-sciences engagement.
**Attached to**: Teknova Enrichment System (Registry entry, KAI Assets).
**Drafted**: 2026-05-27 by Boris in response to Polaris wind-down brief.

## Meta-canon (the predicate fix)

The Teknova Enrichment System was built to answer **"is there a live AAV program at this company?"** The actual buyer question is **"does procurement authority for that program sit inside this company?"** Same surface. Different predicate. Every system update below derives from this single shift.

A volume-shaped outbound list answers the first question. An ABM-shaped list answers the second. The cost of the predicate mismatch is paid by the reviewer doing manual ABM judgment on top of every list pass — which is exactly what Ellie's Friday review pass turned out to be.

---

## #1 — Procurement-authority resolution

**Canon**: The account is the entity that owns the *procurement decision* for the inputs being sold, not the entity that owns the program scientifically. When a sponsor selects a CDMO, the buyer for reagents shifts to the CDMO.

**Schema implication**: Each account carries a `procurement-authority` flag with values like:
- `sponsor-in-house` — sponsor runs process development internally; sponsor is the buyer.
- `sponsor-cdmo-locked` — sponsor has selected an external CDMO; CDMO is the buyer for reagents. Sponsor should be dropped or annotated, not outreached.
- `cdmo-platform` — a CDMO operating multiple programs; routed to the CDMO Platform Enrichment System (see #2).
- `academic` / `gov` — different motion entirely.

**Routing implication**: `sponsor-cdmo-locked` accounts redirect outreach to the named CDMO partner. The CDMO becomes the row; the sponsor becomes context.

**Evidence from the AAV list**:
- Myrtelle (sponsor) → Viralgen (CDMO). Reagent buyer is Viralgen.
- Elpida (sponsor) → Catalent (CDMO). Reagent buyer is Catalent.
- Life Biosciences (sponsor) → Forge Biologics (CDMO). Life Bio outsourced process decisions three years ago. Drop Life Bio.

**Why this was missed in v1**: pipeline filters surfaced any company with an active AAV program. "Active program" and "decides what reagents to buy" turned out to be different sets.

---

## #2 — CDMO-as-platform-account as a separate System

**Canon**: A CDMO running N programs in a modality is structurally higher-leverage than any single sponsor. One supplier qualification compounds across every program the CDMO hosts.

**Architecture call**: This is not a flag on the existing system. It fails the four tests for re-segmentation:

| Dimension | Sponsor outbound | CDMO platform |
|---|---|---|
| Buyer persona | CMC / clinical lead | Process development, supply chain |
| Offer shape | Asset-specific, science-first | Multi-program standardization, audit/qualification fit |
| Data source | Clinical pipeline trackers | CDMO directories (ARM, BIOIA), facility data |
| Trajectory | Faster open, asset-bound | Slower qualification, stickier post-win |

**Recommendation**: Stand up **CDMO Platform Enrichment System** as a separate Registry entry. Shares infrastructure (Clay, BigQuery, orchestration patterns) but the segment criteria, offer, copy, and trajectory artifacts are independent. Do not fold into Teknova Enrichment System.

**Evidence**:
- Forge Biologics (Columbus, OH). Ellie's net-new suggestion. Multiple AAV programs. Passes North America test.
- Viralgen, Catalent surface as adjacent patterns inside the existing list (currently buried as "the partner of a dropped sponsor").

---

## #3 — Corporate-tree resolution beyond domain

**Canon**: Domain matching catches obvious subsidiaries (shared domain or visible parent name) but misses ownership chains. The ultimate parent is a distinct enrichment step, not a side-effect of domain resolution.

**Schema implication**: Add an ownership-graph lookup between domain resolution and persona scoring. Store:
- `local_entity` — the directly named company.
- `ultimate_parent` — the controlling entity (e.g. Bayer for Brain Neurotherapy Bio).
- `corporate_path` — the chain, for context.
- `procurement_authority_at` — which level in the chain holds the decision (often the local entity, sometimes the parent, sometimes a sister company).

Segment logic can then ask either question depending on context.

**Data sources to evaluate**: BigPicture, GLEIF, SEC filings (10-K parent disclosures), Crunchbase parent fields, Pitchbook. None are complete on their own. Probably a layered lookup with confidence scoring.

**Evidence from the AAV list**:
- Brain Neurotherapy Bio → AskBio → Bayer. Domain resolver missed.
- AskBio France → US parent. Geography filter caught after enrichment cost paid.
- Prevail Therapeutics → Eli Lilly.
- Gyroscope Therapeutics — contacts now sit at Novartis post-acquisition.

---

## Lower-priority observations (not canon, logged for tuning)

- **Asset-status freshness**: pipeline surfaced terminated/divested/failed programs (Janssen R&D, Baxalta, Biogen ocular, Excision EBT-101). Confidence score on "is this program still alive," not a hard filter.
- **Geography filter placement**: filter runs post-enrichment. Most EU/UK/Asia drops should be filtered upstream to save enrichment cost.
- **Asset-to-avoid annotation**: per-account `avoid-mentioning` field. Regeneron and AbbVie keepers came with "lead with internal AAV science, do not pitch the approved/partnered asset" (Otarmeni, RGX-314). Lives in the copy practice, not the enrichment system.

---

## Open questions for next engagement

- Does `procurement-authority` map cleanly across modalities (cell therapy, mRNA, oligonucleotide), or is the sponsor-vs-CDMO split AAV-specific because of vector manufacturing economics?
- For corporate-tree, is the right anchor `ultimate_parent` or `decision-making-entity`? They diverge when parents leave acquired subsidiaries operationally independent.
- For the CDMO Platform Enrichment System, what counts as a qualifying CDMO — minimum program count? minimum facility footprint? Capability scope?

---

## Where this came from

- Ellie's review comments: `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/ellie-aav-list-review-comments-2026-05-22.md`
- Meeting prep that surfaced the volume-vs-ABM mismatch: `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/meeting-prep-ellie-christa-worksession-2026-05-28.md`
- Polaris wind-down brief (this exchange): see Teknova engagement-governance trail for closing month context.
