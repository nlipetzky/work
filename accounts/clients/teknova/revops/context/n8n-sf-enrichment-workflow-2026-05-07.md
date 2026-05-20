# Handoff: Teknova SF Enrichment n8n Workflow

**Built:** 2026-05-07. **Status: ACTIVE** on instig8 daily 06:00 America/Chicago. Wet test verified by Nick on execution `41267` (2026-05-07 23:11 UTC). Activated by `n8n_update_partial_workflow` op `activateWorkflow` immediately after.

## What this gives you

Every Company in `Teknova Outreach (Pearl)` (`appFoLY6hjroyA2KW/tblmd04rMsw3GE3pK`) now has 11 Salesforce-derived fields refreshed daily, joining the prospecting base to live SF reality. A sales rep landing on a Company row sees: who at Teknova owns the SF account, when they last touched it, what's open, and a 2-4 sentence narrative summary of recent activity.

This solves Ellie's "already engaged" near-miss problem and the "did we already burn this account?" question.

## Companies table — full SF-derived field set

| Field | Source | Set by |
|---|---|---|
| `SF Record ID` | `ME_Account_Mirror.Account ID` (matched) | Build Updates Code node |
| `Last Contacted Date` | `ME_Account_Mirror.Last Activity` | Build Updates |
| `DNC / Opt-Out` | OR over `ME_Contact_Mirror.Do Not Call` and `Email Opt Out` for all contacts at the matched account | Build Updates |
| `Active SF Opportunity` | bool: any open opp in `ME_Opportunity_Mirror` for matched account | Build Updates |
| `SF Opportunity Stage` | Stage of most recently modified open opp | Build Updates |
| `Customer Status` | derived: Closed Won in last 12 months = Current; older = Historical; none = Never | Build Updates |
| `Active BD Engagement` | derived: open opp OR Last Activity ≤ 30d = Active; any past activity = Past; none = None | Build Updates |
| `SF Account Owner` | SF Account.Owner.Name (live SOQL) | Map SF Context |
| `SF Account Type` | SF Account.Type | Map SF Context |
| `Open Opp Next Step` | NextStep on most-recent open Opportunity | Map SF Context |
| `SF Activity Summary` | Anthropic claude-sonnet-4-5 summarizes recent Tasks/Events/Open Opps into 2-4 sentences | AI Summary + Append Summary |

`Salesforce Account ID` was a duplicate of `SF Record ID` and was removed during build. `Complaint History` is treated as manual notes only — workflow does not write to it.

## Workflow

**Name:** `Teknova — Companies SF Enrichment`
**Id:** `9lHIriKSBaYId9Xd`
**Project:** `TfzE1Ve7GCz0XRpa` (Teknova on instig8)
**URL:** https://instig8.app.n8n.cloud/workflow/9lHIriKSBaYId9Xd
**Trigger:** Schedule daily 06:00 America/Chicago + Manual Trigger for ad-hoc
**Credentials:** `All Teknova Konstellation Bases` (Airtable PAT, id `pJ4oVKlLQLrvp3Z9`), `Salesforce Production` (OAuth, id `qZN3s8Z20hEgdTdj`), `Teknova. Konstellation` (Anthropic, id `k6pMUap0iM92iLvi`)

### Data flow

```
Trigger (Manual or Schedule)
  ↓
List Accounts ──► Aggregate ──► List Opportunities ──► Aggregate ──► List Contacts ──► Aggregate ──► List Companies
  (all 4 read from Airtable mirrors / Pearl base)
  ↓
Build Updates (Code, runOnceForAllItems)
  • Builds bareDomain → account map and lowercase name → account map
  • For each of 219 Companies, attempts domain match first, then exact-name fallback
  • Refuses ambiguous matches (logged with reason)
  • Computes the 7 Section-4 derived fields per company
  • Emits 219 update items: 28 matched, 191 unmatched
  ↓
Plan SF Query (Code) — builds SOQL with WHERE Id IN (matched ids)
  ↓
Fetch SF Context (HTTP Request → SF /services/data/v59.0/query)
  • Returns Account record per matched id with Tasks (last 10), Events (last 5), open Opportunities subqueries
  ↓
Map SF Context (Code) — emits 1 item per matched company with _aiContext block + cheap fields (Owner/Type/NextStep)
  ↓
AI Summary (HTTP Request → Anthropic /v1/messages, claude-sonnet-4-5, max_tokens 350)
  ↓
Append Summary (Code, runOnceForEachItem) — extracts text from Anthropic response, attaches to upstream item
  ↓
Merge Enrichment (Code) — reads $('Build Updates').all() (219) and $('Append Summary').all() (28),
  merges 4 new fields into the matched 28, writes empty strings to the 191 unmatched
  ↓
Loop Over Companies (SplitInBatches 10/batch)
  ↓
Update Company (Airtable) — writes 11 fields to all 219 Company records
```

### Match strategy

Domain-first via bare-host normalization (`https://www.x.com/foo` → `x.com`). Name fallback uses lowercased exact match. Multi-match candidates are rejected — the workflow refuses to guess. As of build, 28 of 219 Pearl Companies match SF accounts; 191 are net-new prospects not yet in SF, which is expected.

### AI prompt

System: "You write 2-4 sentence sales context summaries for B2B sales reps deciding whether to pursue an account. Be specific and factual: reference dates, owner names, deal stages, and topics. Highlight risk signals (complaints, no-reply, stale activity) when present. No marketing language."

User template: account block + Recent Tasks list + Recent Events list + Open Opportunities list + final ask "Write a 2-4 sentence summary for a sales rep deciding whether to pursue this company today."

### Locked business rules

1. **Customer Status:** Closed Won within 12 months = Current; older win = Historical; no win = Never.
2. **Active BD Engagement:** open opp OR Last Activity ≤ 30 days = Active; any past activity = Past; no SF presence = None.
3. **Cadence:** daily 06:00 CT.
4. **Complaint History:** human-curated, workflow never touches.

## Other active workflows in the Teknova n8n project

These are running and you should know about them — they share infrastructure with the enrichment workflow.

| Workflow | Id | Trigger | Purpose |
|---|---|---|---|
| `SF Account Sync` | `nYnpliJqX2fGHcC2` | Webhook + Schedule (3 min) | Reads `Sync Queue` table in `app5wdHwgM1SPNxcx`, PATCHes Salesforce Account records via REST, verifies write, marks queue row synced/failed |
| `SF Lead_Contact Sync` | `TaFA7YOoT0H0BHMg` | Webhook | Same pattern but for SF Lead/Contact upserts |
| `Get SF Schema` | `PVvgKx2julLXly0C` | (utility) | Pulls SF object schema for reference |
| `Schema` | `xs6drzbSdND5EfMd` | (utility) | Pulls schema metadata for the schema map base |

**Inactive but live data infrastructure:**
- The SF mirror tables (`ME_Account_Mirror`, `ME_Contact_Mirror`, `ME_Lead_Mirror`, `ME_Opportunity_Mirror`) in `app5wdHwgM1SPNxcx` are populated by **Airtable's native Salesforce connector**, not by an n8n workflow. The two 73-node "Salesforce to Airtable Snyc" workflows in the project are inactive — they were superseded by Airtable's built-in sync.
- Mirror freshness depends on the connector's sync schedule (set in Airtable on each table's sync settings). Verify there before assuming "live data."

## How the SF auth is wired

n8n HTTP Request node, `authentication: "predefinedCredentialType"`, `nodeCredentialType: "salesforceOAuth2Api"`. Hardcoded instance host `teknova.my.salesforce.com`. API version `v59.0`. The OAuth credential auto-injects the bearer token; n8n does not auto-resolve the instance URL, so we hardcode it. This is the same pattern used by `SF Account Sync` and `SF Lead_Contact Sync`.

## Cost & runtime

- Per daily run: ~17,000 Airtable rows read (mirror tables), 1 SF SOQL call (28 accounts with subqueries), 28 Anthropic calls.
- Anthropic spend: <$0.30/day at current Sonnet pricing (~700-1500 input tokens, ~150 output per call).
- Runtime: ~5-7 minutes for full enrichment + write.
- SF API quota usage: trivial.

## Known limitations / open questions

1. **Mirror dependency.** Section-4 derived fields (Last Contacted Date, Active SF Opportunity, etc.) are sourced from the Airtable SF mirror, not directly from SF. If the Airtable native sync stales out, these go stale silently. The new SF Activity Summary fields use direct SF queries and are always live.

2. **Architectural redundancy (v3 candidate).** The current workflow pulls all 2,339 SF accounts + 4,236 opps + 10,000 contacts from Airtable mirrors just to find the 28 matches. We can replace those three reads with one SOQL `SELECT ... FROM Account WHERE Name IN (...) OR Website IN (...)` against the 219 Pearl Company names/domains, plus a follow-up query for DNC info on the matched contacts. Would cut workflow from 18 nodes to ~10, runtime from 5-7 min to 1-2 min, and remove the staleness risk. **Not built yet** — Nick raised the question during this session, decision was to verify v2 first.

3. **AI may report "no documented activity" when SF Tasks subquery returns empty.** Some SF Account records have a populated `LastActivityDate` but the underlying Tasks/Events aren't visible to our OAuth user (sharing rules). The AI flags this as "no documented engagement," which is actually useful — it means the rep can't see history either. But if you see Customer Status = Current on a record where AI says "dormant," the cause is sharing rules, not bad enrichment.

4. **Distributor relationships not specially handled.** Amici Procurement Solutions has Account Type = Prospect, has won opps in 2022 ($1,260 + $2,264), but is functionally a distributor (per their SF Description). Workflow tags them Customer/Active correctly, but the BD interpretation ("they sell our stuff, don't pursue as end-customer") is not captured. May want a v3 enhancement: distributor accounts get a different BD Engagement category, or a "Distribution Partner" Customer Status.

5. **Multi-match name dedup.** SOQL `WHERE Id IN (...)` with duplicate IDs (which can happen when two Pearl Companies match the same SF account by domain or name) returns the SF account once, but Map SF Context emits one item per Pearl Company so both get enriched correctly. No bug, but worth knowing if you see "27 records returned for 28 ids" in the logs.

## Useful operating commands

For RevOps Claude Code sessions (or anyone debugging):

- **Check workflow health:** `n8n_health_check` (n8n MCP)
- **Inspect last run:** `n8n_executions({action:"list", workflowId:"9lHIriKSBaYId9Xd", limit:3})` then `n8n_executions({action:"get", id:"<execId>", mode:"filtered", nodeNames:["Build Updates","Map SF Context","Append Summary","Merge Enrichment"]})`
- **Verify Airtable writes for a Company:** Airtable MCP `list_records_for_table` with `recordIds: ["<recId>"]`, `fieldIds: ["SF Record ID","SF Account Owner","SF Activity Summary",...]`
- **Re-run on demand:** click Manual Trigger in the n8n UI, or trigger via the Schedule Trigger's next 06:00 CT firing.
- **Pause:** `n8n_update_partial_workflow` op `deactivateWorkflow`. Resume with `activateWorkflow`.

## Files in this repo

- `~/code/work/practices/n8n-practice/CLAUDE.md` — n8n operator instructions (build/modify/validate protocol).
- `~/code/work/practices/n8n-practice/workflows/teknova-companies-sf-enrichment.json` — the v1 workflow JSON (predates v2 SF+AI extension; not authoritative for current state, see workflow id above for live).
- `~/.claude/plans/i-need-you-to-transient-wind.md` — full plan including v1 + v2 design, business rules, verification sequence.

## What to do next

1. ~~Verify Nick's wet test passed.~~ Done — `recBFDRzBQWUinHda` (Amici) confirmed.
2. ~~Activate the schedule.~~ Done — workflow active, first scheduled run fires at next 06:00 CT.
3. **Plan v3** if architectural cleanup is on the roadmap (drop Airtable mirror reads, go fully direct-SF). See "Known limitations" above. Estimated win: 18 nodes → ~10, 5-7 min → 1-2 min, removes mirror-staleness risk.
4. **Watch for AI prompt tuning needs.** First few production runs may surface tone/length issues that warrant prompt iteration via `patchNodeField` on the AI Summary node's `parameters.jsonBody` — the prompt is inline in there. Specifically watch for: dormancy false-positives (Tasks visible in SF UI but not via OAuth user), distributor-account framing (Amici-style), and verbosity creep beyond 4 sentences.
5. **Monitor first 7 daily runs** via `n8n_executions({action:"list", workflowId:"9lHIriKSBaYId9Xd", limit:10})`. If any fail, the no-error-output Airtable nodes will throw and the run will halt mid-stream. That hasn't been a problem in dry/wet tests but is worth a glance Monday morning.
