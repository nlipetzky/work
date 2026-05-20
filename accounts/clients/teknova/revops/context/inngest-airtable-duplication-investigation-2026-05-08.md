# Handoff: Investigate Inngest as Source of Airtable Contacts Duplication

**Created:** 2026-05-08
**For:** Fresh Claude Code session, run from a different project folder than `~/code/work/`
**Trust boundary note:** This investigation requires reading from `~/code/ARCHIVE/aos/` which is normally outside the trust boundary. That's the whole point — Inngest config and job definitions live there.

## The mystery in one paragraph

Yesterday afternoon (2026-05-07 ~15:24 UTC), 29 unique-email contacts were created in the Airtable Teknova Outreach Contacts table. Sometime between then and 2026-05-08 ~01:39 UTC, those 29 emails got duplicated into ~6,351 total rows (each email appearing ~220 times). At ~01:45 UTC, an n8n workflow run was canceled mid-flight. By ~14:30 UTC May 8, the table was back down to 29 unique rows. We confirmed via direct Airtable API queries that no n8n workflow created those duplicates — the only n8n workflow that touches the Contacts table is read+update only and was inactive when the duplicates appeared. **Nick's hypothesis: a previous-iteration Inngest job is still running somewhere and creating duplicate Airtable rows.**

## What you're trying to find

A scheduled or webhook-triggered Inngest function (or AWS Lambda, or any other job runner) that:
- Reads from Supabase `mrmnyscurmkfppicqqhk` (revops-engine-dev) `companies` and/or `contacts` tables
- Writes to Airtable base `appFoLY6hjroyA2KW` (Teknova Outreach), table `tblyDwJhW8NpsFGbL` (Contacts)
- Probably uses an `INSERT` or `CREATE_RECORD` operation rather than UPSERT (since dupes accumulated)
- Fires repeatedly (daily? hourly? on every Supabase write?)

## Where to start looking

Order of likelihood:

1. **`~/code/ARCHIVE/aos/packages/inngest/`** — This directory exists. Has its own `.env` and presumably function definitions. Look for:
   - Any function that imports Airtable SDK or uses fetch against `api.airtable.com`
   - Any function that targets baseId `appFoLY6hjroyA2KW` or tableId `tblyDwJhW8NpsFGbL`
   - Function schedules / triggers
   - Whether the function set is currently deployed and active

2. **Inngest dashboard.** Nick has Inngest credentials somewhere. Log in and check:
   - Active functions (which ones are still receiving events?)
   - Recent invocations in the last 24-48 hours
   - Function source code if visible

3. **Other AOS packages that might write to Airtable.** Grep `~/code/ARCHIVE/aos/` for:
   - `appFoLY6hjroyA2KW`
   - `tblyDwJhW8NpsFGbL`
   - `airtable.com/v0`
   - `AIRTABLE_API_KEY` env references

4. **Vercel / deployment side.** If the Inngest functions are deployed via Vercel, check Vercel projects under Nick's account for active deployments of any AOS package. Even archived code can be running in production if not undeployed.

## Confirmed facts (from today's investigation)

- **Live Airtable base:** `appFoLY6hjroyA2KW` (Teknova Outreach)
- **Live Contacts table:** `tblyDwJhW8NpsFGbL`
- **Backup Airtable base:** `appWeLzPkioTMnJQr` (Teknova Outreach (Copy)) — has 23,104 contacts, NOT the active workflow target
- **Both bases share the same table IDs** (Airtable's Duplicate Base copies the IDs)
- **Live Companies table:** `tblmd04rMsw3GE3pK`
- **Supabase project:** `mrmnyscurmkfppicqqhk` (revops-engine-dev)
  - URL: `https://mrmnyscurmkfppicqqhk.supabase.co`
  - Service role key in `~/code/ARCHIVE/aos/.env` line 6 (`REVOPS_SUPABASE_SERVICE_KEY`)
  - Has tables: `companies`, `contacts`, `plays`, `play_contact_membership`, `play_company_membership`, etc.
- **Active Salesforce play:** PLAY-006 (`e5327ea5-d9de-4e83-ab0f-e35ac1b8786d`), 174 contact memberships

## What to rule out

You can confirm-or-deny n8n by querying its API:
- Endpoint: `https://instig8.app.n8n.cloud/api/v1`
- API key in `~/.claude.json` under the `n8n-mcp-mms` MCP server config
- I already verified: only workflow `8n2oiwB2ZOHA0rSo` has any Airtable Contacts node; it's read+update only; was inactive during the duplication window. No n8n workflow created the duplicates.

You can confirm-or-deny Airtable Automations:
- Open the live base in Airtable UI
- Top-right "Automations" tab
- Look for any automation that creates records in the Contacts table

You can confirm-or-deny external integrations:
- Airtable base settings → Integrations
- Audit log of API key activity (paid feature; may not be available)

## Workflow built today that's affected by this

`Teknova — Supabase → Airtable Enrichment Sync` (n8n id `8n2oiwB2ZOHA0rSo`):
- Reads Supabase `contacts` filtered by active-play membership (174 records)
- Reads Airtable Contacts (29 records currently)
- Matches by email, updates Airtable rows with enrichment fields
- Currently INACTIVE pending this investigation
- Logic is correct; safe to activate AFTER duplication source is identified and killed

The handoff doc for that workflow: `clients/teknova/revops/context/n8n-supabase-airtable-sync-handoff-2026-05-07.md`

The other workflow we built: `Teknova — Companies SF Enrichment` (n8n id `9lHIriKSBaYId9Xd`) — already active, daily 06:00 CT, writes Companies fields. Not affected by this issue.

## Specific commands to run in the new session

```bash
# 1. Inventory Inngest functions
ls -la ~/code/ARCHIVE/aos/packages/inngest/
cat ~/code/ARCHIVE/aos/packages/inngest/.env
find ~/code/ARCHIVE/aos/packages/inngest -name "*.ts" -o -name "*.js" | head -50

# 2. Search for Airtable references across AOS
grep -rn "appFoLY6hjroyA2KW\|tblyDwJhW8NpsFGbL\|api.airtable.com" ~/code/ARCHIVE/aos/ 2>/dev/null

# 3. Check Inngest function definitions for contact/company sync logic
grep -rn "createRecord\|create_record\|AIRTABLE.*contact" ~/code/ARCHIVE/aos/packages/inngest/ 2>/dev/null

# 4. Check if any AOS function is deployed to Vercel
ls ~/code/ARCHIVE/aos/.vercel 2>/dev/null
cat ~/code/ARCHIVE/aos/.vercel/project.json 2>/dev/null
```

## Decision the new session needs to make

Three outcomes:

1. **Found the Inngest job, can stop it.** Disable/undeploy it. Verify duplicates stop appearing (re-check Airtable contacts table count over 24 hours). Then activate the n8n Supabase Sync workflow.

2. **Found the source, can't stop it (production dependency).** Document what it does. Decide whether the n8n Supabase Sync workflow needs to handle dupe-aware updates (e.g., update all matching rows but warn loudly when dupes exceed N).

3. **Couldn't find the source.** Don't activate the n8n Supabase Sync workflow. Set up an Airtable trigger/automation that emails Nick when Contacts row count exceeds 100 (early warning) or use n8n to monitor and alert.

## Key open question

**The 6,300 duplicates were ALSO cleaned up sometime between 01:45 UTC and 14:30 UTC May 8.** Who or what cleaned them? If it's a recurring auto-cleanup job, that's also unknown infrastructure that could break things. Worth asking Nick directly.

## Files for the new session to update when done

- This file (`inngest-airtable-duplication-investigation-2026-05-08.md`) — append findings + resolution
- `clients/teknova/revops/context/n8n-supabase-airtable-sync-handoff-2026-05-07.md` — update "Status" line to reflect activation decision
- The n8n practice CLAUDE.md (`~/code/work/practices/n8n-practice/CLAUDE.md`) — add a "External writers" section documenting any non-n8n process that writes to Teknova Airtable bases, so future n8n work knows the data hygiene risk
