# Wind-down sizing brief for Polaris

**From**: Boris (agentic-systems)
**To**: Polaris (engagement-governance)
**Date**: 2026-05-27
**Re**: Sizing + feasibility + architecture call on the six AAV system-update candidates

## Context

Teknova engagement terminating 2026-06-25. Closing month has 3-4 sprint weeks committed to modality lists per the Jenn email plan. Six system-update candidates surfaced from Ellie's AAV list review (see diagnosis upstream). Polaris asked for sizing, wind-down feasibility, an architecture call on #2, and a Learnings artifact.

## Sizing table

| # | Fix | Type | Effort | Ship in closing month? |
|---|---|---|---|---|
| 1 | Procurement-authority resolution | new sub-system | 2-3 weeks v1, ongoing tuning | No |
| 2 | CDMO-as-platform-account | new System Registry entry | 3-4 weeks v1 | No |
| 3 | Corporate-tree resolution | tune + new data source | 3-5 days v1 integration | Marginal. Pulls sprint focus. |
| 4 | Asset-status freshness | tune existing | 1-2 days | No as a system fix. Handle manually per sprint. |
| 5 | Geography filter upstream | tune existing | half-day | Yes. Cheap. Ship it. |
| 6 | Asset-to-avoid annotation | copy-practice convention | hours | Yes as convention. Not a system change. |

## Wind-down feasibility, per item

- **#1**: No. Forward-looking canon only. The schema work alone (procurement-authority flag, routing logic, downstream consumers) needs a full sprint cycle clean of list-production pressure.
- **#2**: No as a built system. Optionally Ellie can have one sprint week scoped as a manual CDMO ABM mini-pass (Forge + 2-3 other AAV CDMOs). That gives her something to test the lens against without committing to system build.
- **#3**: Don't ship. One data source could land in a side window, but it will degrade the modality sprint Polaris is already managing. The next engagement gets the clean v1.
- **#4**: Apply manually during sprints. No system change.
- **#5**: Ship it. Half-day. Reduces enrichment cost on every remaining sprint, including any non-AAV modality work.
- **#6**: Document the convention. Apply by hand in closing-month copy. The copy practice owns formalizing it.

**Net**: closing-month shippable is #5 + #6 + sprint outputs. #1-#3 are canon-only deliverables for the next life-sci client.

## Architecture call on #2

**New System Registry entry, not a flag inside Teknova Enrichment System.**

Re-segmentation fails the four tests:

| Dimension | Sponsor outbound | CDMO platform |
|---|---|---|
| Buyer persona | CMC / clinical lead | Process development, supply chain |
| Offer shape | Asset-specific, science-first | Multi-program standardization, qualification fit |
| Data source | Clinical pipeline trackers | CDMO directories (ARM, BIOIA), facility data |
| Trajectory | Asset-bound, faster open | Slower qualification, stickier post-win |

Working name: **CDMO Platform Enrichment System**. Shares infrastructure with Teknova Enrichment System (Clay, BQ, orchestration) but segment criteria, offer, copy, and trajectory are independent. Do not build for Teknova. Register the slot now so the next life-sci client inherits a named target.

## Pointer to Learnings artifact

Banked at: `/Users/nplmini/code/work/practices/agentic-systems/learnings/teknova-enrichment-aav-procurement-authority-2026-05-27.md`

Covers:
- Meta-canon: the predicate fix (live-program-vs-procurement-authority)
- #1 procurement-authority resolution (full canon)
- #2 CDMO Platform System recommendation (full canon)
- #3 corporate-tree resolution (full canon)
- Lower-priority observations (#4, #5, #6 logged for tuning)
- Open questions to test in the next engagement

## Recommended split for the two parallel roadmaps

**Closing month roadmap (Teknova)**:
- Sprint cadence per Jenn email plan, modality decided this afternoon with Ellie + Christa.
- Bake #5 (geography upstream) into the pipeline before sprint 1.
- Apply #4 and #6 manually inside each sprint.
- Optional: one sprint becomes a CDMO ABM mini-pass if Ellie wants the #2 lens tested.
- JSON workflow handoff Jun 25 per existing commitment.

**ABM-mode system design roadmap (next life-sci client)**:
- Phase 1: procurement-authority schema + routing (#1).
- Phase 2: corporate-tree resolution (#3) — feeds phase 1 with accurate ownership data.
- Phase 3: CDMO Platform Enrichment System stand-up (#2) — new Registry entry.
- Each phase produces its own canon update against the Registry.

## Note on judgment calls flagged here

The "no" on shipping #1-#3 inside the closing month is a judgment call based on sprint capacity. If Ellie or Christa push hard for one of them this afternoon, the constraint moves and so does the answer. Hold this loosely.
