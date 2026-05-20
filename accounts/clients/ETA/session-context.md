# ETA Jets — Session Handoff (2026-04-28)

## What Was Done This Session

1. **Connected to NotebookLM** — queried the ETA Jets notebook (`5e88c36f-6df5-4206-83fa-88b67cadca55`, 15 sources) for full project context
2. **Mapped all 3 Airtable bases** using PAT authentication:
   - `appvBraG4OftrXwYA` — ETA Jets - Logistics Engine (core pipeline)
   - `apphMLvlrRnNbvdEj` — Creative Glu Instagram Automation (content pipeline)
   - `app9E0sTWJrN48OpC` — Creative Glu SmartLayer CRM (IG contacts/DM leads)
3. **Inspected all 9 n8n workflows** (4 active, 5 inactive) in Creative Glu project (`zUtXwwXkg6z00OLO`). Documented full node logic, webhook URLs, LLM prompts, and Google Drive folder IDs
4. **Wrote comprehensive PROJECT.md** at `/Users/nplmini/code/ETA/PROJECT.md`
5. **Analyzed email from Sam Feintech** (Creative Glu, 2026-04-21) — 4 questions about webhook sources, record IDs, SmartLayer CRM tables, and a workflow optimization suggestion

## Key Finding: Email Analysis

Sam's email asks about the system handoff. Here's the status:

| Question | Answer | Scope |
|----------|--------|-------|
| Where do webhooks get called from? | Airtable automations in Logistics Engine base (`appvBraG4OftrXwYA`). They may not be wired up yet. | **V1 scope** — should work before closeout |
| Whose Airtable do recordIds belong to? | Logistics Engine base (`appvBraG4OftrXwYA`) — Emails table and Flight Opportunities table | V1 scope — straightforward answer |
| What are Scenarios/Responses tables? | SmartLayer CRM scaffolding for DM intent classification. DM Listener workflow is inactive. Tables may be unused artifacts. | **Gray area** — could be new scope if they want it functional |
| Logistics Engine workflow appears unused | Correct — `4ovg5GUeDPa1PtUg` runs daily with 100% mock data. Safe to disable. | V1 cleanup |

## What Needs to Happen Next

1. **Reply to Sam's email** — Nick needs to respond with the answers above
2. **Decide on Airtable automation wiring** — the webhooks need Airtable automations to trigger them (on email ingest → call Ingestion webhook; on flight approval → call Content Gen webhook; on content approval → call Publisher webhook)
3. **Disable the Logistics Engine mock workflow** — agree with Sam's recommendation
4. **Clarify SmartLayer CRM scope** — decide if DM routing / Scenarios tables are V1 or new scope
5. **Instagram Publisher inspection** — workflow `LF3lCrcuXtwTdQn3` needs MCP enabled in n8n settings to see its full logic

## Files Created

- `/Users/nplmini/code/ETA/PROJECT.md` — Complete project reference (Airtable schemas, n8n workflows, integrations, workflow chain diagram)
- `/Users/nplmini/code/ETA/session-context.md` — This file

## Access Credentials Available

- **Airtable PAT:** Available (used successfully to pull all 3 base schemas)
- **n8n:** Creative Glu project on instig8.app.n8n.cloud, full read/write access
- **NotebookLM:** ETA Jets notebook accessible

## Context for Next Session

The next session should start by reading `/Users/nplmini/code/ETA/PROJECT.md` for full system architecture. The immediate priority is helping Nick craft a response to Sam's email and deciding which items are V1 closeout vs. new scope.
