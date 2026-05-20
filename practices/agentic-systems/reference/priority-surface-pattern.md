# Priority Surface Pattern

**Status:** Production pattern, default for all client engagements
**First instance:** Teknova engagement (2026-05-12)
**Originating handoff:** `/Users/nplmini/code/work/practices/agentic-systems/HANDOFF-priority-surface-integration-2026-05-12.md`

---

## Purpose

A one-page mechanism that controls what an operator works on each week for a client engagement, driven by the client's written direction.

## Why it exists

Engagements fragment when client direction comes in verbally — mid-meeting, in hallway conversations, over chat. The operator produces work based on prior conversations, the conversations evolve, work gets re-scoped or never lands. The priority surface replaces that with a single written artifact the client edits to direct focus.

## What the client gets

Focused weeks. Visible direction. Never wondering what's getting done. The surface is also the proof: at any moment, the client sees what they're getting this week and what's queued for next.

---

## The pattern

**Headline rule: exactly one item is ACTIVE at a time.** This is the load-bearing constraint. Everything else in the pattern exists to enforce it.

**Operating rule: verbal asks do not move items.** Direction lives in writing — either the client edits the priority surface, or replies to the weekly email confirming a redirect. Verbal asks in meetings or chat get noted but don't move items until they land in writing.

The surface has four sections:

1. **ACTIVE THIS WEEK** — one item, dated, sourced from the client's last written direction
2. **QUEUED NEXT** — one item, pre-populated by the operator as the default for the following week
3. **AVAILABLE** — the menu of focus areas the operator can be directed to
4. **OFF-MENU** — anything the client requests outside the menu; triggers a written scope conversation, not work

---

## Single source of truth

The surface is canonical in a single document in the client's shared Drive folder. That document is the source of truth. The weekly status email mirrors current state for visibility but does not get edited there — edits happen in the Drive doc, and a version-controlled mirror lives at `accounts/clients/<client>/<client>-priority-surface.md`.

This prevents the most common failure mode: two surfaces (email + doc) drifting out of sync as the client edits one and the operator updates the other.

---

## How the surface integrates with the weekly cadence

The weekly status email (Wednesday EOD in the default cadence) opens with a Priority Surface section that mirrors the current state of the Drive doc:

- Shows ACTIVE with the date of the client's direction
- Shows QUEUED NEXT (operator's pre-populated default)
- Lists any OFF-MENU items raised this week
- Includes an explicit "confirm or redirect" prompt

The client confirms or redirects by:

- Editing the Drive doc (preferred — direct edit to source of truth), OR
- Replying to the email (operator then updates the Drive doc to reflect)

The Wednesday cadence creates a weekly forcing function: by every Wednesday EOD, the client has the latest snapshot of where their priority sits. By the following Monday at latest, the client has either confirmed the queued item or redirected.

---

## The AVAILABLE menu structure

The menu is engagement-shaping, not play-enumerating. It defines what KIND of work the operator can be directed to. Within each kind, the specific play, project, or item is identified separately (in the engagement plan, per-play config, or build roadmap).

Default tiered structure (adapt per engagement):

| Tier | Examples |
|---|---|
| **Production** | Run / iterate on an active play |
| **Strategic** | Build a new play; new offer; new segment |
| **Foundational** | Data quality work; integration build; infrastructure improvement |
| **Analytics** | Reporting view; measurement framework; dashboard |

A menu of 6–8 items across these tiers is typical. Fewer feels under-scoped; more feels like the client is picking from a catalog rather than directing focus.

---

## Off-menu and scope conversations

When the client asks for something outside the AVAILABLE menu, the operator:

1. Logs the request in OFF-MENU on the surface
2. Names it in the next Wednesday email as an off-menu item requiring a scope conversation
3. Responds in writing (in the email or a follow-up doc) naming whether the request changes scope, by how much, and what trade-off it implies if anything is being displaced

A **scope conversation** is a written exchange — not a meeting — that ends with exactly one of three outcomes:

- **Accepted into menu**, with a note on which tier and whether any existing menu item is being deprecated to make room
- **Bounced as out of scope**, with a brief written explanation
- **Queued for future scope expansion**, with a target window for revisiting

The point is to make scope renegotiation a deliberate written act, not a verbal "sure, we can do that too."

---

## Variable elements per engagement

What changes engagement-to-engagement:

- The contents of the AVAILABLE menu (per-client scope)
- The cadence (weekly is default; some engagements may use bi-weekly)
- The optional standing meeting slot tied to it
- The location of the canonical Drive doc

What stays fixed:

- The four-section structure
- The "one ACTIVE at a time" headline rule
- The "verbal asks do not move items" operating rule
- The Drive-doc-as-source-of-truth, email-as-mirror split
- The off-menu = written scope conversation pattern

---

## How to instantiate for a new engagement

1. Create the canonical surface doc in the client's shared Drive folder
2. Mirror it at `accounts/clients/<client>/<client>-priority-surface.md` for version control
3. Populate AVAILABLE with the engagement's specific menu (4 tiers, 6–8 items)
4. Set initial ACTIVE based on current scope of work
5. Set QUEUED NEXT as the operator's reasonable default for next week
6. OFF-MENU starts empty
7. Add the Priority Surface section to that engagement's weekly status template (top of email body)
8. Add the priority-direction principle to that engagement's SOP §1
9. Reference the surface in §3 component A of the SOP (operating documents)
10. Add the surface as an artifact in that engagement's manifest

---

## The pattern as its own diagnostic

The surface is both the operating mechanism and the test for whether the engagement structure is working.

**If the client engages with the surface** — confirming, redirecting, raising off-menu items in writing — the routine has taken hold and the structure works. The operator gets focused weeks, the client gets visibility and steering.

**If the client refuses to engage** and reverts to ad-hoc verbal asks despite the mechanism, that is the structural signal the engagement is failing. The operator should escalate (renegotiate scope, re-establish the cadence in writing) or consider termination.

Treat the surface as both the mechanism and the test.

---

## Instances

| Engagement | Path | Status |
|---|---|---|
| Teknova | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-priority-surface.md` | Active (first instance, 2026-05-12) |
