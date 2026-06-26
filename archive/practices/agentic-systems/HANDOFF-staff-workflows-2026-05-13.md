# Handoff: Staff Layer — Phase 1 Workflows

**Date:** 2026-05-13
**Session:** Fixed email body truncation in import-gmail; activated Apply Approval + Apply Revision; corrected FYI option; wired instig8 inbox into import chain.

## What changed today

### import-gmail (v0uc0qJ07dzZ4bIB) — restructured, verified

The body truncation bug is fixed. Root cause: the workflow was reading `$json.snippet` (~200 chars) from Gmail's simplified getAll output. Fix: added a Gmail `get` node after getAll to fetch the full message, which returns `$json.text` (full plain body).

**New node chain:**
```
[Triggers] → Get many messages Nick KAI ─┐
                                           ├→ Get Full Body (KAI creds) → Derive Fields → Upsert Email Row → Log to Events
[Triggers] → Get many messages Nicks instig8 → Get Full Body (instig8 creds) ┘
```

Nick added a second `Get Full Body` node for the instig8 path in the UI (cleaner than the fan-in approach I had coded -- each Gmail account has its own fetch node with the right credentials).

**Derive Fields now uses only `$json` from Get Full Body output** (no node back-references). Field mappings:
- `Subject` ← `$json.subject` (lowercase from get node)
- `From` ← `$json.from.text`
- `DateISO` ← `new Date($json.date).toISOString()`
- `bodyTruncated` ← `($json.text || '').slice(0, 10000)`
- `labels` ← hardcoded `['AOS/Ingest']` (filter guarantees label, ID→name mapping not available from get node)
- `id`, `threadId` ← `$json.id`, `$json.threadId`

**Upsert Email Row** updated: `Date` now uses `$json.DateISO` (was `new Date(parseInt($json.internalDate)).toISOString()`), `Labels` now uses `$json.labels` directly (was `.map(l => l.name)`).

**Verified:** Manual execution confirmed KAI inbox messages import with full body. instig8 inbox has no AOS/Ingest label applied yet — that path fires but returns no results, which is expected.

### Apply Approval (GZQAmWJgjMhy6i8y) + Apply Revision (UpRZjgHxBCusa5Fo) — activated

Nick reattached credentials and activated both workflows. Both are now `active: true`.

### FYI Classification option — fixed

Email table Classification field had both `FYI` (all caps, canonical) and `fyi` (auto-created lowercase). The lowercase duplicate was deleted. triage-inbound writes `FYI` and will now match correctly.

## Pending Nick actions (carried forward + new)

1. **Triage Inbound prompt fix** — edit the Classify Email node in the n8n UI to enforce exact casing (`FYI`, `approval`, `revision request`, etc.). Not done yet.
2. **instig8 Gmail label** — apply the AOS/Ingest label filter to the instig8 inbox when ready to activate that path.

## Known issues / open Roadmap items (unchanged from last session)

- **note-drive-activity filter** — doesn't exclude empty `Last Modified By`, creates noisy Tasks.
- **Notified dedup** on Teknova — manual reset needed in edge case (see prior handoff).
- **SDK `update_workflow` wipes credentials** — every MCP update replaces node IDs and drops credentials. Expect a manual reattach pass after every programmatic update.

## Architecture decisions still standing

- Airtable is the v1 operator surface. NocoDB + Supabase planned for v2.
- Inngest is the planned durable runtime for agent code that doesn't fit n8n. Not yet engaged.
- Every workflow writes to Events table. Every autonomous action creates a verify Task.

## Next workflows in plan (not started)

1. **draft-nudge** — daily, find Teknova awaiting >3 days, Claude drafts polite nudge, save to Gmail Drafts, create review Task.
2. **note-calendar-activity** — mirror of note-drive-activity for Calendar table.
3. **draft-weekly-status** — Wed 7am, compose Wednesday status email (5 sections), save to Gmail Drafts.

## Resume pointer

- n8n project: https://instig8.app.n8n.cloud/projects/ZGB13pwEWgJszDaK
- Airtable Work base: https://airtable.com/appz7I91uNxWBnly8

Natural next move: fix the triage-inbound prompt casing (quick UI edit), then build `draft-nudge`.
