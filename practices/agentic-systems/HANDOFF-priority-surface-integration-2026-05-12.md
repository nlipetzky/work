# Handoff: Priority Surface as an Operating Pattern

**Date:** 2026-05-12
**For:** Agentic systems practice — operating procedure integration
**Purpose:** Document the priority surface pattern and integrate it into the agentic-systems operating procedure. The Teknova engagement is the first instance; this handoff describes both the pattern and the Teknova-specific implementation.

---

## The pattern

A single one-page surface controls what the operator works on each week for a client engagement. The client directs focus by writing in the surface. Verbal asks do not move items. Off-menu requests queue or trigger a scope conversation.

The surface has four sections:

1. **ACTIVE THIS WEEK** — one item, dated, sourced from the client's last written direction.
2. **QUEUED NEXT** — one item, pre-populated by the operator as a default for the following week.
3. **AVAILABLE** — the menu of focus areas the operator can be directed to take on.
4. **OFF-MENU** — anything the client requests outside the menu; triggers a scope conversation, not work.

Only one item is ACTIVE at a time. Items move between sections by the client's written direction.

The surface solves the dynamic where ad-hoc client asks fragment the operator's week. Instead, one written direction at a time shapes focus, and the client always sees what they are getting and what they are queued for next.

---

## How it integrates with the weekly cadence

The weekly status email (the Wednesday update in Teknova's case) includes the priority surface near the top of the email body:

- Shows the current ACTIVE item with the date of the client's direction
- Shows QUEUED NEXT (the operator's pre-populated default)
- Invites the client to confirm the queued item or pick a different item from AVAILABLE
- Logs any new OFF-MENU items the client raised that week
- References the optional standing meeting slot for live discussion if needed

The client confirms or redirects in writing — either by replying to the email or editing the surface in the shared Drive folder.

---

## Teknova-specific integration (the first instance)

Files to create or update:

1. **Create** the priority surface in Teknova's shared Drive folder (and a mirror at `accounts/clients/teknova/teknova-priority-surface.md` for version control). Initial ACTIVE item: current AAV play work. Initial QUEUED NEXT: to be set by Nick before the first send.
2. **Update** `accounts/clients/teknova/teknova-weekly-status-template.md` to include a priority surface section at the top of the email body.
3. **Update** `accounts/clients/teknova/teknova-engagement-sop-2026-05-12.md`:
   - §1 Operating principles: add "Priority direction lives in the priority surface, captured in writing."
   - §6 Weekly cadence: Wednesday status email now includes the priority surface section.
   - §8.6 Weekly status email: agent assembly pulls the current ACTIVE, QUEUED NEXT, and any new OFF-MENU items into the template.

The current Teknova menu (AVAILABLE section, version 1):

- Run an active play
- Build a new play (new segment)
- Improve data quality on existing data
- Activate outreach (Salesforce write side + cadence setup + messaging flow)
- Onboard a new data source
- Build a reporting or analytics view
- Build an integration or one-off automation

The menu is engagement-shaping, not play-enumerating. Specific plays live in the per-play config and the roadmap.

---

## Pattern-level integration (agentic-systems practice)

The priority surface is a reusable pattern across client engagements, not Teknova-specific. To integrate into the practice operating procedure:

- Document the pattern in the agentic-systems reference materials (architecture notes or a new pattern document) so future client engagements can adopt it.
- Reference it in the standard client engagement operating model as the default mechanism for priority management.
- Consider a process automation (likely n8n) that pulls surface state into the weekly status template for any client using the pattern.

The pattern's reusable elements:

- The four-section structure (ACTIVE / QUEUED NEXT / AVAILABLE / OFF-MENU)
- The "one ACTIVE item at a time" rule
- The "verbal asks do not move items" rule
- The integration into the weekly status email as the channel for confirm-or-redirect
- The off-menu-as-scope-conversation rule

The variable elements per engagement:

- The contents of the AVAILABLE menu (specific to each client's scope)
- The cadence (weekly is the default; some engagements may use bi-weekly)
- The optional meeting slot tied to it

---

## Definition of done

- Priority surface exists for Teknova and is populated with current state.
- Weekly status template includes the surface section.
- Teknova SOP reflects the surface as a first-class part of the operating procedure.
- The first Wednesday email under the new procedure includes the surface, with a pre-populated QUEUED NEXT and an explicit invitation to the client to confirm or redirect.
- The pattern is documented at the practice level so it can be applied to future engagements.

---

## Note for the picking-up session

The priority surface only works if it consistently appears in the weekly cadence and the client treats it as the place where direction lands. The first few weeks are the test:

- If the client engages with the surface (confirming or redirecting in writing), the routine has taken hold and the engagement structure works.
- If the client refuses to engage and continues with ad-hoc verbal asks, that is the structural signal that the engagement is failing. The operator (Nick in this case) should escalate or consider termination.

The surface is both the operating mechanism and the test. Treat it as both.
