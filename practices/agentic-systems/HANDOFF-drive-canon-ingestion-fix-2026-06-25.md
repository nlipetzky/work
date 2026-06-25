# HANDOFF — Restore Drive→Canon document ingestion (2026-06-25)

Atlas inbox item: `capture_items` `b95b5db4-6e4b-4188-9d79-33dc06f68f89` (status open).
Owner: agentic-systems. This handoff is the `source_ref` for that item.

## Problem
The Google-Drive document leg of canon ingestion is stale — the document corpus hasn't
refreshed since ~April 2026. CIPO Drive docs are not in canon: e.g. Will's "PatentVest IP
Intelligence Platform" pricing doc (`1aGNRzFtiTRb9sH7DZTlKfzqz_CwdU1q9kgQO7lhjbog`) had to be
read by hand to source the offer-architecture artifact, because it never landed in the
`documents` / `canon_docs` / `chunks` tables. Any system that queries canon for document
context is working off a months-old snapshot.

## What we know (verify live before acting — docs lose to live state)
- The **transcript leg** was re-platformed to anarlog/Granola and is green (transcript-router
  files capture_items). Do NOT re-chase the dead Google Meet scope.
- The **email leg** is green: `systems/canon-engine/packages/ingestion/scripts/gws-fetch-emails.ts`
  runs on launchd (`com.canon-engine.fetch`). So Workspace OAuth works for at least one account.
- The **Drive document leg** is the gap. The launchd cron was narrowed to email-only during the
  2026-06-23 reliability fix, so whatever used to pull Drive docs is either not scheduled or not
  running. There is a "AOS Doc Intake folder" referenced in the original capture item — confirm
  the actual Drive folder(s) and the account that owns them.
- Known auth caveat: the external `konstellationai` GCP app hit 403s on a sensitive scope
  (unverified app, expired trial) for Meet. Drive read scope may differ — confirm which account +
  app the Drive read runs under before assuming it's blocked.

## Scope to investigate / build
1. Find the Drive-ingestion code path (likely a `gws-fetch-*` script + an `ingestDocument`
   pipeline in `packages/ingestion/src/pipelines/`) and whether it still exists / runs.
2. Confirm the target Drive folder(s) and the Workspace account with read access.
3. Restore the fetch → parse → chunk → embed → upsert into `documents` (+ `chunks`,
   `canon_document_state`) flow. Reconcile the stale backlog, not just net-new.
4. Put it back on the launchd cron alongside the email leg (or its own job), and record it as a
   `system_triggers` row so the /system surface shows it.
5. Verify: the CIPO pricing doc + other recent CIPO Drive docs appear in `documents` and are
   chunk-searchable.

## Done when
Recent CIPO Drive docs are queryable in canon (documents + chunks), the Drive leg runs on a
schedule, and the /system/canon page for the ingestion system shows the Drive trigger as wired.

## Provenance
Created by Boris (agentic-systems) this session at Nick's request; supersedes the bare
`b95b5db4` item by giving it a concrete brief. Related memory: `canon_ingestion_pipeline`.
