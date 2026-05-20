# Handoff: Staff Layer — Phase 1 Workflows

**Date:** 2026-05-12
**Session:** Built the first wave of autonomous workflows operating against the Work Airtable base (`appz7I91uNxWBnly8`).

## Foundational orientation

The system being built is named **Staff** — a fleet of autonomous agents that watch Nick's inbound signal stream (Gmail today, Drive + Calendar via Airtable sync), classify and act on it, and surface state changes as Tasks for Nick to verify. Boris (this agentic-systems persona) designs the fleet; Nick approves and redirects.

Invariants:
1. **Principal-and-staff.** Nick approves. Staff drafts and updates state, never sends or decides.
2. **Signal-driven, not prompt-driven.** Work begins when signals arrive (Gmail label, Drive edit, cron tick).
3. **Surface-agnostic core, swappable adapters.** Filesystem is canonical. Airtable is the current adapter. NocoDB + Supabase is the planned v2.
4. **Bounded autonomy.** Staff touches Nick's stuff. Never client systems without scoped task.

## Stack today

- **Filesystem (canonical):** the operator's repo, including this folder.
- **Airtable (projection):** the Work base `appz7I91uNxWBnly8`. Tables: Tasks, Opportunities, Consider, Email, Yap, Teknova (Drive sync), Roadmap, Events, Calendar (Calendar sync).
- **n8n (runtime):** workflows live in INSTIG8 project `ZGB13pwEWgJszDaK`. Trail of every run is visible in n8n execution log + Events table.
- **Claude (model):** Anthropic chat node in the langchain integration.
- **Gmail (inbound + outbound):** import via labeled filter; drafts saved to Gmail Drafts.

## Workflows shipped today

| Name | n8n ID | Status |
|---|---|---|
| import-gmail | v0uc0qJ07dzZ4bIB | Verified |
| triage-inbound | giiPYNuS4oBknV2j | Verified |
| apply-approval | GZQAmWJgjMhy6i8y | Built; needs cred reattach + activation |
| apply-revision | UpRZjgHxBCusa5Fo | Built; needs cred reattach + activation |
| compose-daily-digest | 1Ebw2kW1kuP67KQe | Verified |
| note-drive-activity | pPjJxj5AKd1hmg1C | Verified |
| draft-reply | VApoNpqhjGx4e6kn | Verified |

## Schema additions today

- Email table: renamed `Name`→`Subject`; added `From`, `Date`, `Body`, `Thread ID`, `Message ID`, `Labels` (multipleSelects), `Link`, `Classification` (singleSelect: approval, revision request, question, scheduling, FYI, other), `Notes`, `Applied` (checkbox), `Drafted` (checkbox).
- Teknova table: added `Approval`, `Notes`, `Notified` (checkbox).
- Tasks table: added `Notes` (multilineText).
- Events table: existed already with full schema; populated singleSelect options via typecast on first writes.
- Roadmap table: new table, seeded with build backlog including today's shipped workflows.

## Pending Nick actions (from this session)

1. **Apply Approval + Apply Revision:** reattach Airtable creds on 4 nodes each, then activate. (Latest SDK update applied the `{{ true }}` boolean fix for the Applied checkbox.)
2. **Triage Inbound prompt fix:** edit Classify Email node in the UI to enforce exact casing per the proposed prompt text.
3. **Delete duplicate `fyi` Classification option** in the Airtable Email table (the auto-created lowercase one).
4. **Optional Drive timezone fix:** workflows fire on UTC hour. 6am Chicago = 11 UTC (CDT). When CST kicks in (November), shift hour to 12 OR set workflow timezone to America/Chicago in n8n settings.

## Known issues / open Roadmap items

- **Email body truncation** (Roadmap `recvSpQL3oWi98gc0`): import-gmail uses Gmail simple mode which returns `snippet` (~200 chars) not full body. Claude hallucinated about cutoffs in draft-reply because the body it saw was genuinely cut off. Fix: switch to `simple: false` or add downstream `get message` Gmail call.
- **note-drive-activity filter** doesn't exclude empty `Last Modified By`. Created one noisy Task ("Doc returned: CT AAV Discovery — modified by "). Filter fix needed.
- **Notified dedup** on Teknova doesn't auto-reset after Nick edits the row then someone else edits the Drive doc again. Manual reset needed in that edge case until v2.
- **MCP `create_workflow_from_code` returns 500 errors that are actually successful creates** — caused 6 duplicate Triage Inbound workflows during build. Nick cleaned them up manually. If retrying creates on 500, search by name first before retrying.
- **SDK `update_workflow` wipes credentials inconsistently.** Some updates preserve creds; some wipe. Pattern unclear. Nick reattached multiple times.

## Architecture decisions still standing

- **Airtable is the v1 operator surface.** NocoDB + Supabase is the planned v2 (NocoDB already installed in Nick's Docker). We iterate on Airtable until the operating model is stable, then port.
- **Inngest is the planned durable runtime** for agent code that doesn't fit cleanly in n8n nodes. Not yet engaged.
- **Tangibility is non-negotiable.** Every workflow writes to Events table. Every autonomous action creates a verify Task in Eisenhower table. No background loops, no hidden state.

## Next workflows in plan (not started)

1. **draft-nudge** — daily, find Teknova awaiting >3 days, Claude drafts polite nudge, save to Gmail Drafts, create review Task.
2. **note-calendar-activity** — mirror of note-drive-activity for Calendar table; surface upcoming events as prep Tasks.
3. **draft-weekly-status** — Wed 7am, compose the Wednesday status email (5 sections), save to Gmail Drafts.

## Resume pointer

Open this base in Airtable to see current state: https://airtable.com/appz7I91uNxWBnly8

Open n8n project to see workflows: https://instig8.app.n8n.cloud/projects/ZGB13pwEWgJszDaK

Next session, the natural starting move is `draft-nudge` (closes the stale-deliverable loop with patterns already proven) or fix one of the known issues above.
