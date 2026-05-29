# Teknova Closing-Month Roadmap

**Drafted:** 2026-05-27
**Sponsor:** Jenn Henry
**Expert:** Ellie
**End date:** 2026-06-25
**Companion docs:**
- Trajectory: `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/trajectory-teknova-closeout-2026-05-27.md`
- Sponsor email plan: `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/email-jenn-closing-month-plan-negotiator-2026-05-27.md`
- Boris sizing brief: `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/wind-down-sizing-brief-polaris-2026-05-27.md`
- Learnings canon: `/Users/nplmini/code/work/practices/agentic-systems/learnings/teknova-enrichment-aav-procurement-authority-2026-05-27.md`

---

## Purpose

What ships to Teknova in the 4 remaining sprint weeks. This roadmap covers only in-engagement deliverables. Forward-looking canon (procurement-authority resolution, CDMO Platform Enrichment System, corporate-tree resolution) lives in the ABM-mode system design roadmap, not here.

## Constraints

- 3-4 realistic sprint weeks plus contractual floor (existing automated cadences + standing Thursday session)
- Each sprint requires Friday-prior inputs from Ellie: modality named + ICP documented in full
- No new architecture builds inside the engagement window
- JSON workflow handoff by Jun 25 is a hard date

## What ships

### System-level changes (cheap, ship early)

| Item | Action | Sprint | Effort |
|---|---|---|---|
| Geography filter upstream (Boris #5) | Move geography check from post-enrichment to pre-enrichment to reduce credit spend on disqualified entities | Sprint 1 | Half-day |
| Asset-to-avoid annotation convention (Boris #6) | Add `avoid-mentioning` field to contact records; document copy-practice convention for outbound | Sprint 1 | Hours |

### Manual conventions (applied per sprint, no system change)

| Item | Action | Owner |
|---|---|---|
| Asset-status freshness (Boris #4) | Operator manually verifies "last referenced as active" before pushing companies to enrichment for any given sprint | Operator |
| Corporate-tree resolution (Boris #3) | Operator flags ownership-graph issues in Friday status update when a list reveals them; client decides whether to redirect outreach | Operator + Sponsor |
| Forge Biologics / CDMO carve-out | If Ellie wants the CDMO lens tested in one sprint, consume that sprint with a manual mini-pass (Forge + 2-3 other CDMOs); not built as system, just produced as a list | Operator + Expert |

### Sprint deliverables

| Sprint | Week | Output | Dependencies |
|---|---|---|---|
| 1 | Jun 1-5 | First modality list per Ellie's pick + Boris #5 ship | Ellie names modality + ICP by Fri May 29 |
| 2 | Jun 8-12 | Second modality list OR CDMO mini-pass | Ellie's call by Fri Jun 5 |
| 3 | Jun 15-19 | Third modality (if capacity permits) OR additional refinement on prior sprint | Ellie's call by Fri Jun 12 |
| 4 | Jun 22-25 | JSON workflow handoff + system state snapshot + final Slot Report | Slots 1-3 complete |

## What's deferred / banked (NOT in this roadmap)

These live in the ABM-mode system design roadmap, captured as forward-looking canon in the Learnings doc, but do not ship to Teknova:

- Procurement-authority resolution (Boris #1) — 2-3 weeks v1, too large
- CDMO Platform Enrichment System (Boris #2) — separate System Registry entry; 3-4 weeks v1
- Corporate-tree resolution sub-system (Boris #3) — 3-5 days but pulls focus from sprints

## Decision points for the Ellie meeting

1. **Sprint 1 modality + ICP** — Ellie names by Friday May 29. AAV pivot or different modality (cell therapy, mRNA, lentiviral)?
2. **Sprint 2 use** — Modality #2 OR CDMO mini-pass (Forge + 2-3 others)?
3. **Sprint 3 use** — Modality #3 OR refinement on prior?

## Decision points for the Jenn meeting (Thursday)

1. Confirm sprint cadence and modality decision protocol
2. Confirm JSON drop scope (workflows only, one-line READMEs, no runbooks)
3. Confirm post-Jun-25 grace period and bounded-question rule

## Risks

| Risk | Mitigation |
|---|---|
| Ellie misses Friday input deadline | Sprint shifts a week; surfaces in Slot Report; Trajectory says we lose a sprint, not absorb the delay |
| Jenn adds new priorities mid-sprint | Queue for next sprint; do not swap; surface in Slot Report |
| CDMO mini-pass requested but produces thin list | Status update at Thursday; surface the structural finding (CDMO buyer is a different motion); option to fold into the ABM-mode canon |
| JSON drop reveals workflows tightly coupled to operator-side infra | Note in system snapshot under "not portable as-is"; do not invest in making portable |

## Governance items

- **System Registry update needed:** the Teknova Enrichment System row in Airtable should reference the Learnings file path so the canon survives the engagement termination. Action: confirm registry convention with Boris in next session; update row before Jun 25.
- **Slot Reports each Friday** name what shipped against this roadmap; bottleneck honestly identified.
- **Sponsor approval on this roadmap** captured via the Thursday session and confirmed in the Friday Slot Report.

---

## Out of scope (any of these = scope-change)

- Runbooks or documentation beyond one-line JSON READMEs and the one-page system snapshot
- Walkthroughs, training, screen-shares for Teknova staff
- Operational configuration on Teknova's n8n / SF / Airtable / provider instances
- Live debugging support during or after transition
- Any new build that would produce output past 2026-06-25
- Modality lists beyond the 2-3 named above
- Building any of Boris #1, #2, or #3 inside this engagement
