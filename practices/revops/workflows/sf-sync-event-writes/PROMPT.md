# Workflows ticket — SF Daily Sync: write SF events to Company Events

**Write-owned by:** Workflows builder
**Workflow target:** `JuetPadcgYjt1h59` (Daily Salesforce to Airtable Sync) — sole owner of edits; do not touch other SF workflows
**Working scope:** this folder (`practices/revops/workflows/sf-sync-event-writes/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Workflows (builder)
**Status:** SPEC. Read fully before any workflow edit.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`

## Directive

The daily Salesforce → Airtable sync currently collapses SF activity into a single summary string on the Companies row. Extend it so that **every discrete SF observation** writes one event row to Company Events, with the full source content. The existing summary string field remains as a derived rollup, not the source of truth.

## Scope

- **Workflow ID:** `JuetPadcgYjt1h59`
- **Workflow name:** Daily Salesforce to Airtable Sync (canonical; retire `wxjQymFxMbf7N1Zq` and `Jzrx5e6iIjeffnD4` as duplicates per the audit)
- **Target table:** Company Events (`tblnzX2b2kqNGzW6r`)
- **Provider value:** `salesforce` (auto-creates on first write via typecast)

## Event types to write

| SF source | Event Type | When to write |
|---|---|---|
| SF Account custom tag (e.g. AAV) | `sf_account_tag` | On every sync, write one row per tag currently set; Is Latest=true on the freshest |
| SF Activity (Task/Event/Call) | `sf_activity` | One row per discrete activity record. External ID = SF Activity ID. |
| SF Opportunity stage change | `sf_opportunity_change` | One row per stage transition observed. External ID = Opportunity ID + stage. |

## Field-write rules per event row

- `Event Type` — from the table above
- `Event Date` — the SF record's activity/created/stage-change date
- `Provider` — `salesforce`
- `Company` — link to the matching Companies row by SF Account ID
- `Detail` — short narrative (e.g. "Email sent by Rep X to Contact Y" or "Opp moved to Negotiation")
- `Source URL` — direct SF record URL (`https://teknova.lightning.force.com/lightning/r/.../view`)
- `External ID` — SF record ID
- `Raw Reference` — `salesforce:<sf_object>:<sf_record_id>`
- `Detected At` — sync run timestamp
- `Is Latest` — true on the freshest observation per External ID; flip prior rows to false
- `Raw Payload` — full SF record content stringified (cap at 95K, mark truncation in Detail)
- `Title` — for activities, the SF Subject; for opportunities, the Opp Name
- `Names` — for activities, the WhoId/WhatId resolved names

## What to do

1. Pull the deployed SF sync workflow JSON via raw API. Verify which credentials are attached.
2. Add a node (or extend existing nodes) that writes the three event-row types above to Company Events, in addition to current writes to the Companies row.
3. **Keep** the existing writes to Companies (`SF Account Status Summary`, `Last Account-Level Contact Date`, `SF Has Open Opp`, `SF Opp Stage`, `SF Has Closed Won`, `SF Account Ownership`, `SF Activity Summary`, `SF Sync Timestamp`). These remain valid as rollups; do not remove.
4. Deploy via credential-preserving REST PUT.
5. Read back JSON and verify all credentials intact.
6. **Decide and document**: archive or delete the duplicate workflows `wxjQymFxMbf7N1Zq` (Teknova Salesforce Snyc) and `Jzrx5e6iIjeffnD4` (Sanbox Salesforce to Airtable Snyc). They were flagged for retirement in the registry audit. Do not delete blindly; confirm canonical workflow is `JuetPadcgYjt1h59` first.

## Hard rules

- **REST PUT wipes credentials.** Capture + read-back per the n8n protocol.
- **Don't double-write.** If the same SF Activity record has been written before (External ID match), update the existing event row in place rather than creating a new one; or write a new row with Supersedes pointing to the prior.
- **Honor SF API limits.** The sync runs daily; large batches are fine, but per-record rate limiting must be respected.
- **Do not autonomously delete duplicate workflows** without explicit Nick approval. Flag them in your handoff.

## Verification gate

Single-account test:
- Pick one SF Account (e.g. an existing AAV-tagged one) and run the sync.
- A `sf_account_tag` event row exists with the AAV tag in Detail.
- One or more `sf_activity` event rows exist if the account has recent activity.
- A `sf_opportunity_change` event row exists if any open opp.
- The Companies row's existing SF fields still update correctly.
- Workflow credentials intact post-deploy.

## Handoff

`practices/revops/workflows/HANDOFF-sf-sync-event-writes-2026-05-20.md`. Include the duplicate-workflow disposition recommendation.

## Out of scope

- Schema-Map base (`app5wdHwgM1SPNxcx`) modifications. The sync should continue to read from the mirror as it does today.
- Renaming SF columns on the Companies row (Phase-2 vocab audit).
- New SF objects beyond Account / Activity / Opportunity (Phase-2).
