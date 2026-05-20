# Handoff: Engagement Operations Tracker — Airtable v1

**Date:** 2026-05-12
**For:** A fresh Claude Code session, started from `/Users/nplmini/code/work/practices/agentic-systems/`
**Mission:** Build the first iteration of an Airtable base that lets the operator (Nick) see at any moment where the Teknova engagement is — what's pending, what's approved, what's next. Simple, first iteration. Not the full SOP automation.

---

## What you're inheriting from today's session

A complete operating model for the Teknova RevOps engagement, defined as a 6-doc set plus a practice-level pattern. The session that produced these is closed; what follows is the artifact set you build against.

**Operating documents (filesystem; markdown is authoritative)**

- Engagement Plan (client-facing direction): `/Users/nplmini/code/work/accounts/clients/teknova/teknova-engagement-plan-2026-05-12.md`
- Engagement SOP v1.4 (internal process spec): `/Users/nplmini/code/work/accounts/clients/teknova/teknova-engagement-sop-2026-05-12.md`
- Build Roadmap (internal backlog): `/Users/nplmini/code/work/accounts/clients/teknova/teknova-build-roadmap.md`
- Engagement Manifest (current-state inventory): `/Users/nplmini/code/work/accounts/clients/teknova/teknova-engagement-manifest.md`
- Priority Surface instance (Teknova): `/Users/nplmini/code/work/accounts/clients/teknova/teknova-priority-surface.md`
- Weekly Status Template: `/Users/nplmini/code/work/accounts/clients/teknova/teknova-weekly-status-template.md`

**Practice-level pattern (engagement-agnostic)**

- Priority Surface Pattern: `/Users/nplmini/code/work/practices/agentic-systems/reference/priority-surface-pattern.md`

**Client-facing mirrors (Google Drive, do not edit from this session)**

- Folder: `https://drive.google.com/drive/folders/11J-KWYPIghlnGFsuwOUKz3d60bXjjcfX`
- Live docs: Working Agreement, Roadmap, ICP & Reference, AAV Play Brief, Priority Surface, Weekly Update, AAV classification rules, CT AAV Discovery

**Memory entries that constrain how you work**

- `/Users/nplmini/.claude/projects/-Users-nplmini/memory/feedback_priority_surface_pattern.md`
- `/Users/nplmini/.claude/projects/-Users-nplmini/memory/feedback_client_rules_approval_doc.md`
- `/Users/nplmini/.claude/projects/-Users-nplmini/memory/feedback_dont_echo_internal_coaching.md`
- `/Users/nplmini/.claude/projects/-Users-nplmini/memory/project_teknova_decision_authority.md`
- `/Users/nplmini/.claude/projects/-Users-nplmini/memory/project_provider_status.md`

Read the SOP first. Especially §3 (play components), §4 (output attributes), §7 (deliverable state machine), §8 (process steps), §10 (integrations register), and §11 (build roadmap summary). The state machine in §7 is the schema spec for the Deliverables table you'll build.

---

## What we're NOT doing in this session

This is explicitly NOT the "automate the whole SOP" build. You are not:

- Building n8n workflows that execute SOP steps
- Building agents that compose the Wednesday email
- Connecting Salesforce
- Auto-detecting Ellie's return-doc markup
- Wiring Explorium firmographics
- Implementing any P0 / P1 / P2 workflow or integration item from the Build Roadmap

Those are downstream builds. This session is the first layer of infrastructure — the operational tracking that the heavier automations hook into later.

---

## What we ARE doing

Build a working Airtable base that lets the operator answer four questions at a glance:

1. What's currently in flight across the engagement?
2. What's pending Ellie's review, and for how long?
3. What's pending Jenn's decision, and by when?
4. What should I (Nick) be doing next?

For v1, scope is the Teknova engagement and the minimum set of tables that answers those four questions. Two tables, four views.

### Proposed schema (start here, propose to Nick before building)

**Table 1: Deliverables**

Tracks every artifact moving through the SOP state machine (SOP §7).

Fields:
- Title (single line text, primary)
- Type (single select: rules doc, discovery list, partnership doc, status email, scope-conversation response, other)
- Engagement (single select: Teknova [for now], future-proof for multi-engagement)
- Recipient (single select: Jenn, Ellie, both, internal)
- State (single select: DRAFTED, SENT, AWAITING, RETURNED, APPLIED, CLOSED, TIMED_OUT, NUDGE_SENT, ESCALATED)
- Sent date (date)
- Due date (date)
- Last update date (date)
- Days outstanding (formula: today − sent date, when state = AWAITING)
- Artifact link (URL — Drive doc, sheet, or filesystem path)
- Notes (long text)
- Priority (single select: P0, P1, P2, P3)

**Table 2: Decisions**

Tracks every decision request to a client stakeholder (per SOP §11 "Decisions ledger" build item).

Fields:
- Question (long text, primary)
- Engagement (single select)
- Target (single select: Jenn, Ellie)
- Asked date (date)
- Deadline (date)
- Status (single select: open, answered, expired)
- Context link (URL)
- Response (long text — filled when answered)
- Closed date (date)
- Notes (long text)

### Views to build immediately

- **In Ellie's queue** — Deliverables filtered to state=AWAITING and recipient=Ellie, sorted by days outstanding descending
- **Pending Jenn decision** — Decisions filtered to status=open and target=Jenn, sorted by deadline ascending
- **My next action** — Deliverables in state=DRAFTED or RETURNED, sorted by priority then due date
- **Recently closed** — Deliverables in state=CLOSED with last update date in the last 14 days, sorted by date descending

---

## Open questions for Nick during the session

Decide these as you go; don't block on perfection.

1. **New base or new tables in RevOps Surface?** New base ("Engagement Operations" or similar) keeps engagement-level operational metadata separate from play data. Same base avoids sprawl. Default: new base unless Nick prefers otherwise.

2. **Multi-engagement-ready from v1?** Add an Engagement column from day one. Low cost, future-proof. Default: yes.

3. **Build Roadmap items in Airtable, or stay in markdown?** The Build Roadmap is read-mostly with infrequent updates. Default: stay in markdown for v1. Reconsider when the second engagement onboards.

4. **Should each Wednesday status email be a Deliverable row?** Treats the email as a recurring artifact with state=SENT every week. Default: yes; creates an audit trail of cadence.

5. **How to seed initial state?** Manual population. Two deliverables in Ellie's queue right now (AAV list + classification rules), plus the priority surface state. Don't auto-sync from Drive or Gmail in v1.

---

## How to instantiate

1. Read the SOP, particularly §7 (state machine) and §8 (process steps).
2. Read the Manifest §3 (current plays) and §7 (artifacts) — these tell you what state to seed.
3. Propose schema to Nick in chat (don't create until he confirms).
4. Create the base via the Airtable MCP (`mcp__997baadc-8d4d-4759-89f5-2c784d9162bb__*` tools).
5. Populate with current Teknova state (the two in-flight deliverables, the priority surface).
6. Build the four views.
7. Update the Manifest §4.1 (Airtable) to add the new base.
8. Update the Build Roadmap: mark "Deliverables tracking table" and "Decisions ledger table" as `live` with shipped date.
9. Update the SOP §11 Build Roadmap summary noting that operational tracking is now live.

---

## Tools and access

- **Airtable MCP** (`mcp__997baadc-8d4d-4759-89f5-2c784d9162bb__*`) — base, table, field, and record creation. Primary tool for this session.
- **Filesystem** (Read, Write, Edit) — for the operating docs.
- **claude-mem search** — for past context if needed.
- **n8n MCP** — not needed in this session.
- **Google Drive MCP** — not needed in this session (don't touch the client folder).

---

## Voice and constraints

Persona: Boris, agentic systems practice. Peer-engineer voice with Nick. Same constraints from his global CLAUDE.md — no em dashes (use ellipses), no emojis, no preambles, short sentences fine, disagreement fine.

Nick directives that apply specifically to this build:

- **"Keep it simple."** Two tables, four views. Don't propose a 12-table schema. Iterate from there.
- **"First iteration."** Don't try to be complete. Start working, then improve.
- **Approve-or-adjust on schemas.** Propose in chat before creating in Airtable.
- **Full absolute paths when announcing file creates/edits.** No markdown link shorthand.
- **Don't echo internal coaching into client-facing artifacts.** This base is operator-facing only; the client never sees it.

---

## Definition of done for this session

- A working Airtable base exists with Deliverables and Decisions tables, plus the four operator views.
- Current Teknova state populated (at minimum: AAV list and classification rules deliverables in Ellie's queue, priority surface state captured).
- Manifest updated to reflect the new base (§4.1).
- Build Roadmap updated: Deliverables and Decisions ledger items marked `live`.
- SOP §11 Build Roadmap summary updated to note operational tracking is live.

---

## What comes after this session (do not start now)

Once Nick has used the base for a week or two and the schema has been stress-tested:

- Auto-population of Deliverables from Drive folder activity (Drive watcher → Airtable webhook)
- Auto-state-transition when an email reply lands (Gmail webhook → Airtable update)
- Status email assembly that reads the base for the five Wednesday email sections
- The heavier integrations from the Build Roadmap (Salesforce, Explorium, contact enrichment, L3 filter, etc.)

These are NOT for this session.

---

## Starting prompt suggestion (use or rephrase)

> Read this handoff. Then read the SOP at /Users/nplmini/code/work/accounts/clients/teknova/teknova-engagement-sop-2026-05-12.md, particularly §7 and §8. Propose the schema for the Engagement Operations base — two tables, four views, as scoped in the handoff. Don't create anything until I confirm. Once confirmed, build it via the Airtable MCP and populate with current Teknova state.
