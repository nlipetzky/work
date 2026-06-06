# Discovery Snapshot — Absolute Mechanical

Instance of `practices/sales-and-gtm/reference/discovery-snapshot-template.md`.
Pre-filled from Larry's "AI Opportunity Brief" in `inbox/`. Not yet validated with the client.

**Opportunity:** Absolute Mechanical ... commercial HVAC contractor
**Channel / partner:** Larry (Lawrence Tweed); future Larry+Nick entity (separate from KAI)
**Decision-maker:** Chris Kellner (owner). Office/ops lead: Carrie.
**Status:** Discovery
**Last updated:** 2026-06-04

## Business context & volume

~30 employees, 150+ active projects. Mix of construction, service, and preventive maintenance.
Owner asked for "Gen AI"; the real pain is scattered operational context.

## Systems & tech stack

| System | System of record for | Users | Notes |
| --- | --- | --- | --- |
| TeamUp | Scheduling / status updates | Office, field | Depends on people remembering to update |
| Dropbox / server | Drawings, photos, files | Office, field | Plus paper folders |
| QuickBooks Desktop | Accounting, billing | Office/accounting | Off-limits phase one |
| Microsoft 365 | Email, docs | All | Mostly desktop usage |
| Paper folders | Job records | Field, office | Tribal / physical |

## Data & sources of truth

Context is scattered across systems, paper, and memory. Duplicate manual entry across journal /
Excel / QuickBooks / TeamUp. Photos and notes live in one place but not another. Follow-ups sit
in email, text, paper, or someone's head. Shared credentials in use.

## Core workflows

- Service call: phone/text/email → journal → Excel → QuickBooks → TeamUp → paper folder →
  tech assignment → (sometimes) Dropbox/server.
- Preventive maintenance: Excel list → monthly setup → journal → QuickBooks → paper → TeamUp →
  filter vendor coordination → tech completion/report.
- Construction job: GC bid invite → walkthrough → sketch → Bluebeam → estimate/proposal →
  award → job number → server folder → QuickBooks → paper → PM coordination → field.
- Repair follow-up: tech diagnosis → parts quote → supply house → office proposal → customer
  follow-up → approved repair → schedule → billing.

## Bottlenecks

Field/office users searching multiple places to assemble current job context. Status depends on
manual TeamUp updates. Repair follow-ups and parts quotes fall through cracks.

**Highest-impact bottleneck:** <NOT YET ISOLATED. Larry's brief proposed a broad visibility
portal across all of the above ... that is a custom-software scope, not a single bottleneck.
Needs to be narrowed to the ONE highest-impact friction before this is build-ready.>

## Proposed first intervention

<OFF-MODEL AS CURRENTLY SCOPED. Larry's brief recommends building a custom field-operations
portal. That is bespoke software, not managed agentic capacity at a bottleneck. Re-scope: what
single agentic intervention (e.g. bid-invite extraction from email, or tech-notes-to-draft) hits
one bottleneck and delivers a promised result without building a whole portal?>

**The promise:** <TBD once the bottleneck is isolated and the intervention re-scoped.>

## Guardrails / out of scope

No QuickBooks Desktop, payroll, banking, margin, or customer pricing in phase one. AI assists
approved workflows only; never the source of truth, never auto-sends customer-facing comms.

## Constraints

Mostly desktop-based today; field is mobile. Adoption/change-management risk is real (the brief
flags it). Budget posture: TBD via commercial lead.

---

## Definition of Ready  (the gate)

- [ ] Single highest-impact bottleneck named. ← **blocked: brief is portal-wide, not one bottleneck**
- [ ] Smallest first intervention defined, with a concrete promised result. ← **blocked**
- [x] Systems of record involved identified.
- [x] Guardrails / off-limits named.
- [ ] Offer shape confirmed = managed agentic capacity, not custom software. ← **fails: brief is custom software**
- [ ] Decision-maker identified and interested in proceeding. (Chris known; interest in an
      agentic intervention vs a portal not yet confirmed.)

**Gate verdict:** NOT READY. Two things to resolve, both Larry's to carry: isolate the single
bottleneck, and re-scope from "build a portal" to "managed agents at that bottleneck." Route the
steering ask to Larry through Hermes.

## Work-toward target (for Larry)

The thing Larry works toward to move Absolute to Ready. He owns this; it does not come back to
Nick until the gate is satisfied.

1. **Isolate the single highest-impact bottleneck.** Of all the friction in the snapshot (field
   context assembly, manual status updates, repair follow-up, bid intake), name the ONE that,
   if removed, frees the most. One conversation with Chris/Carrie should settle it.
2. **Re-scope to a managed-agent intervention.** Replace "build a field-ops portal" with the
   smallest agentic intervention that hits that one bottleneck (e.g. bid-invite extraction from
   email, or tech-notes-to-draft), plus a concrete promised result.
3. **Confirm Chris would proceed** with a small managed intervention rather than a full build.

Done when: the snapshot's six Definition-of-Ready boxes are all checked.

**Routing:** Larry is a prospective partner and this redirects his own polished recommendation,
so the framing of this ask goes through Hermes ... Boris/Kepler do not deliver it directly.
Hermes also shapes the partner-conversion frame: Larry is the SME who guides the system; Nick
builds it. (Motion 3, not "Larry resells an AI portal.")
