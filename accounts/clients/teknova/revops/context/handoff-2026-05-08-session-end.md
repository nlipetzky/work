# Session Handoff: 2026-05-08

**From:** Boris (agentic-systems practice)
**For:** Next session (n8n workflow build)
**Priority:** Get enrichment data from Supabase into Teknova Outreach Airtable base NOW

## What Nick wants to do next

Build an n8n workflow that syncs enrichment data from Supabase to the Teknova Outreach Airtable base (`appFoLY6hjroyA2KW`). Not a workspace base. Not a staging base. Directly to the client-facing base so the data is visible immediately.

The detailed handoff for this workflow is already written: `clients/teknova/revops/context/n8n-supabase-airtable-sync-handoff-2026-05-07.md`. It has every field mapped, match strategy, Airtable field types, and the workflow shape.

## Current state of PLAY-006

- **54 companies** in play (30 enrichment_complete, 9 incomplete, 15 disqualified)
- **222 contacts** in play (44 cadence_ready, ~195 with email)
- **All data is in Supabase** (`mrmnyscurmkfppicqqhk`)
- **None of the enrichment data is visible in Airtable yet** -- this is the blocker

## Critical context from this session

### Discovery companies were never inserted into Supabase
The discovery run found 107 companies (49 net new). Only 1 (Ambulero) was actually inserted into Supabase. The other 48 are in the CSV at `clients/teknova/artifacts/revops-discovery-aav-gene-therapy-ellie-outreach.csv` but never made it into the database or the play. The 3 enrichment batches ran against the original Salesforce-origin data, not the discovery results. This needs to be fixed, but NOT before getting current data to Airtable.

### Architecture decision made
```
Supabase (source of truth, always)
  ↑ AI writes here
  ↓ (Metabase reads directly -- Nick's operational view)
  ↓ (n8n pushes to Airtable -- client-facing surface)
Teknova Outreach Airtable (client sees this)
```

Nick also has Metabase installed and connected to Supabase. Three SQL queries for the Metabase dashboard were provided in this session (companies view, contacts view, summary). Not yet created in Metabase.

### Clay has been dropped
All enrichment runs through direct provider APIs: Explorium (MCP), Hunter (HTTP), Exa (MCP), Apify (HTTP, not yet connected). The enrichment-providers skill at `practices/revops/skills/enrichment-providers/SKILL.md` has the complete field-to-provider mapping. Clay is not in the stack.

### Second n8n handoff exists
`clients/teknova/revops/context/n8n-sf-enrichment-retarget-supabase-2026-05-07.md` -- retargets the existing SF enrichment workflow to write to Supabase instead of Airtable. Do this AFTER the sync workflow is built and verified. Not before.

## What was built in this session (2026-05-07 through 2026-05-08)

### Files created or significantly modified
- `practices/agentic-systems/CLAUDE.md` -- added meta-practice scope, downstream operator instructions
- `~/code/work/CLAUDE.md` -- added studio thesis reference
- `clients/teknova/revops/CLAUDE.md` -- enrichment system, provider stack (no Clay), cost tracking, quick-reference with Supabase queries and CHECK constraints, known column name differences
- `clients/teknova/artifacts/revops-enrichment-spec-aav-gene-therapy-ellie-outreach.md` -- complete enrichment spec with scoring, session log, handoff to cadence, cost tracking
- `practices/revops/skills/enrichment-providers/SKILL.md` -- field-to-provider mapping, email waterfall, Apify actors, Explorium credit costs
- `practices/revops/skills/company-discovery/SKILL.md` -- full company discovery skill with Perplexity validation step
- `clients/teknova/artifacts/teknova-operations-inventory.md` -- all systems, workflows, sync paths, providers
- `clients/teknova/revops/context/play006-enrichment-log.md` -- 4 batches of enrichment session logs
- `clients/teknova/revops/.env` -- all provider API keys
- `~/code/work/.gitignore` -- protects .env files
- `~/code/work/reference/apify-actors-b2b-enrichment.md` -- full Apify actor reference
- `practices/agentic-systems/reference/clay-replacement-research-2026-05-08.md` -- Clay replacement research
- `practices/agentic-systems/reference/autonomous-enrichment-routine-handoff-2026-05-08.md` -- design handoff for autonomous enrichment (not yet built)

### RevOps pipeline updated
1. Offer
2. Segment criteria
3. Company discovery
4. Enrichment
5. Handoff to cadence

### Schemas/migrations applied to Supabase
- Companies: 41 new columns + 2 type fixes + 6 CHECK constraints + 5 indexes
- Contacts: 5 new columns + CHECK constraints + trigger for opt_out_status
- Vocab alignment: seniority, function_classification, employment_status
- Score columns: company_score, contact_score

## Open work (prioritized)

1. **n8n Supabase→Airtable sync workflow** -- get data visible to client. Handoff ready.
2. **Insert 48 discovery companies into Supabase** -- they're in the CSV but never made it to the database.
3. **Enrich the 48 new companies** -- once inserted, run the enrichment sequence.
4. **Why-now signal fill** -- 41/44 active companies have 0 signals. Scores are flat.
5. **Autonomous enrichment routine** -- handoff written, not yet designed.
6. **Retarget SF enrichment workflow to Supabase** -- do after sync workflow is live.
7. **Hooks/plugins audit** -- Vercel plugin firing on every session, adding noise and tokens.

## Emotional context

Nick is frustrated. The discovery-to-enrichment gap (48 companies never inserted) wasted two days of enrichment work on old data. He needs visibility into what's happening -- that's why Metabase and the Airtable sync are priority. He explicitly said he can't trust a system where he can't see the state. Build for visibility first, automation second.

## Key files to read in next session
- `clients/teknova/revops/context/n8n-supabase-airtable-sync-handoff-2026-05-07.md` (the sync workflow spec)
- `clients/teknova/artifacts/teknova-operations-inventory.md` (current system state)
- `clients/teknova/revops/CLAUDE.md` (quick reference)
