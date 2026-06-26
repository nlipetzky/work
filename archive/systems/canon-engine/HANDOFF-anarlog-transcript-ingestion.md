# HANDOFF: anarlog → Canon transcript ingestion (replace the dead Meet leg)

Date: 2026-06-23. For: a session building the new transcript ingestion path into canon_engine.
Decision (Nick): **anarlog is the PRIMARY meeting-transcript source.** The Google Meet / Drive pipeline
is demoted to **backup** (kept, not deleted). Granola is **parked** (revisit later; do not build for it now).

> **BUILD STATUS (2026-06-23): DONE + VERIFIED.** Watcher `packages/ingestion/scripts/anarlog-fetch-transcripts.ts`
> built, typechecks clean, verified end-to-end vs LIVE canon with a synthetic fixture (transcript row +
> embedded chunk; unchanged-skip + edit-in-place dedup confirmed; test data removed). launchd
> `com.canon-engine.anarlog-transcripts` loaded + green (no-op until anarlog writes a session). Canon
> reconciled. **What's LEFT (the go-live residual):** (1) install anarlog desktop_v1.0.47 + record one real
> meeting; (2) confirm the real `transcript.json`/`_meta.json` field names match the watcher's defensive
> parse (adjust if anarlog differs); (3) set `ANARLOG_SESSIONS_DIR` in the plist if auto-probe misses;
> (4) verify a real transcript flows + `capture_items` routes; (5) flip `systems.status` beta->operating
> only when green on the /system surface. The sections below are the original spec, kept for reference.

## Why this shape
The Meet leg died on an OAuth wall: the external `nick@konstellationai.com` account 403s the sensitive
`meetings.space.readonly` scope on an unverified, (formerly) free-trial-expired GCP app. anarlog sidesteps
the entire wall... it writes structured transcript files to local disk. No Google, no scopes, no billing.
See `canon-ingestion-pipeline` memory + `HANDOFF-restore-meet-transcripts.md` (the abandoned Meet attempt).

## The tool
- **anarlog** (formerly Hyprnote), by fastrepl. MIT, local-first, on-device Whisper + pyannote diarization.
- Install: download `desktop_v1.0.47` (signed, 18 Jun 2026):
  https://github.com/fastrepl/anarlog/releases/tag/desktop_v1.0.47 · changelog https://anarlog.so/changelog/1.0.47
- Bundle id `com.hyprnote.dev`. App-support dir likely `~/Library/Application Support/com.hyprnote.dev/`.
- Maintenance risk (accepted): the team's primary product is now char.com (closed); anarlog is the
  MIT split, "maintained" but second-priority. We self-support. This is why Meet/Drive stays as backup.

## The one job
Build a thin watcher that ingests anarlog's local transcript files into `canon_engine` through the
**existing** enrich→chunk→embed→insert pipeline, and schedule it via launchd. Everything below the canon
seam is already built and tested. Estimate: **one ~60-100 line watcher script + one launchd plist.**

---

## What anarlog writes to disk (the input artifact)
A meeting is a **directory**, not a file:
`<base>/sessions/<user-folders...>/<session-UUID>/`  (leaf folder name = the session UUID).
Inside each session dir (constants in `crates/fs-sync-core/.../session_content.rs`):

- **`transcript.json`** ← INGEST THIS. The verbatim transcript. Schema (`crates/fs-format`):
  ```
  TranscriptJson { transcripts: [ TranscriptWithData ] }
  TranscriptWithData { id, user_id, created_at, session_id, started_at(f64 ms), ended_at, memo_md, words[], speaker_hints[] }
  TranscriptWord { id?, text, start_ms, end_ms, channel, speaker?, metadata? }
  ```
  Word-level, ms timestamps, **per-word speaker label**. Reconstruct speaker-labeled text by grouping
  consecutive words by `speaker` (or `channel` if `speaker` null) into turns:
  `"<speaker>: <joined words>\n"`. This gives the chunker real speaker boundaries → higher-quality chunks
  than the old Drive transcripts.
- **`_meta.json`** ← READ for metadata. `SessionMetaData { id, user_id, created_at, title, event, event_id, participants[], tags[] }`.
- `_memo.md` — the AI summary note (YAML frontmatter + markdown). Does NOT contain the transcript.
  Canon runs its OWN Claude enrich, so `_memo.md` is OPTIONAL... ignore for v1; consider later as a
  second canon_docs row if useful.

VERIFY ON A REAL INSTALL before coding: record one test meeting, then inspect the actual on-disk tree
(`find ~ -path '*sessions*/transcript.json' 2>/dev/null` or under the app-support dir) to confirm the
default base path and the real field values. The schema above is from the serialization code + fixtures,
not a live capture. The default base dir is set by the desktop app and was NOT confirmed from source.

## The canon seam (already built — do NOT rebuild the pipeline)
Two entry points, in `/Users/nplmini/code/work/systems/canon-engine/`:

- High-level wrapper: `apps/api/src/pipelines/ingest-uploaded-transcript.ts` →
  `runIngestUploadedTranscript({ transcriptText, client, meetingDate, participants[], meetingType, originalFilename?, account? })`.
  It hashes the text (`upload-<sha256[:16]>`) as the dedup id and sets `sourceType:'uploaded_file'`.
- Lower seam: `packages/ingestion/src/pipelines/transcript-ingest.ts` → `ingestTranscript(input, deps)`,
  where `TranscriptInput` carries `sourceType` and the dedup id (the `google_drive_file_id` slot).

**USE THE LOWER SEAM.** Pass the anarlog **session UUID** as the dedup id (not a content hash), so a
re-export / edited note UPDATES in place instead of creating a duplicate row + orphaned chunks. This is
the single most important design decision in the build. (The high-level wrapper's content-hash dedup is
wrong for a file-watch source that re-writes files.) Confirm the exact `TranscriptInput` field name and
`ingestTranscript` signature at the file before wiring... the names above are reported, verify them.

### Insert contract (live schema, project `mzzjvoiwughcnmmqzbxv`)
- `transcripts`: upsert on UNIQUE `google_drive_file_id` (= the anarlog session UUID for our source).
  Fields written: `transcript_title`, `meeting_date` (timestamptz, ISO... parse from `_meta.json`/`started_at`,
  do NOT default to now), `account_name`, `participants` (comma string), `meeting_type`, `summary`,
  `key_decisions`, `action_items`, `topics`, `google_doc_url` (null), `google_drive_file_id`,
  `raw_transcript_text` (the reconstructed speaker-labeled text).
- `chunks`: `source_type='transcript'`, `source_id`=transcript uuid, `chunk_index`, `chunk_text`,
  `embedding` vector(1536), plus `title/meeting_date/participants/meeting_type/topics/speaker`.
- Enrich (reused as-is): Claude extracts `summary/key_decisions/action_items/topics`. Embed: OpenAI
  `text-embedding-3-small`, 1536 dims.
- Env required: `CANON_SUPABASE_URL`, `CANON_SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, Claude creds
  (`createClaudeClient()`). Reuse `packages/ingestion/.env`.

## Build steps
1. **Watcher script** (new), e.g.
   `/Users/nplmini/code/work/systems/canon-engine/packages/ingestion/scripts/anarlog-fetch-transcripts.ts`:
   - Resolve the anarlog base dir (env `ANARLOG_SESSIONS_DIR`, default to the confirmed app-support path).
   - Walk `**/<session-UUID>/transcript.json`. Keep a local cursor of processed session UUIDs + file mtime
     (a `anarlog-state.json` next to the email pipeline's state file; do NOT reuse `canon_transcript_state`).
   - For each new/changed session: read `transcript.json` + `_meta.json`, reconstruct speaker-labeled text,
     map metadata (UUID, ISO date, participants comma-string, title→`transcript_title`,
     `meeting_type` e.g. `'meeting'`), call the lower `ingestTranscript` seam with the UUID as dedup id.
   - Exit 0 on success, non-zero on error; log a one-line `Done: N ingested, M error(s)` like the email script.
2. **launchd plist** (new), `~/Library/LaunchAgents/com.canon-engine.anarlog-transcripts.plist`: copy the
   shape of the email job (`com.canon-engine.fetch`)... `npx tsx <watcher>`, WorkingDirectory =
   `.../packages/ingestion`, `StartInterval` 900 (15 min) or 300 to match the router, logs in
   `.../packages/ingestion/logs/`, `RunAtLoad`. `bootout` then `bootstrap`, kickstart, confirm exit 0 +
   empty error log.
3. **Downstream is automatic**: once a `transcripts` row lands, the existing `transcript-router`
   (`systems/projection-ui/scripts/transcript-router.mjs`, launchd `com.nick.transcript-router`, every
   5 min) files a `capture_items` action into the work spine. No work needed there.

## Meet / Drive BACKUP (do not delete)
- Keep `packages/ingestion/scripts/gws-fetch-transcripts.ts` + `gws-shared.ts` in place. They stay
  DEPRECATED-but-present (already marked so in canon assets). The gws Meet scope is restored for the
  internal `nick@instig8.ai` account; only the external konstellationai account is blocked.
- Re-enable path if anarlog fails: run `fetch:transcripts` manually, or (better) finish the Option-2
  Drive-search fallback from `HANDOFF-restore-meet-transcripts.md` (enumerate `"… - Transcript"` Docs in
  Drive folder `1T61oGZ_ihsGLJ35EDDcJkKUb_Uj8nAVP` via the already-working Drive scope) and feed the SAME
  `ingestTranscript` seam. The seam is source-agnostic, so backup and primary share all downstream code.
- Granola: parked. If revisited, first investigate Granola's local-cache/export surface (no facts gathered
  yet); then write a Granola watcher that targets the same seam.

## Verify (gate — read from LIVE state, do not narrate)
1. Record a real test meeting in anarlog. Run the watcher.
2. `select transcript_title, meeting_date::date, google_drive_file_id from transcripts order by created_at desc limit 3;`
   → the test meeting appears, keyed by session UUID.
3. `select count(*) from chunks where source_id = '<new transcript uuid>';` → > 0, embeddings present.
4. Edit/re-export the same meeting, re-run → SAME row updates (no duplicate), chunks refreshed.
5. Within 5 min, a `capture_items` row references the new `transcript_id`.
6. launchd job fires green (exit 0, empty error log).

## Then reconcile canon (project `mzzjvoiwughcnmmqzbxv`, system `canon-ingestion`)
- `assets`: add the new watcher (`asset_type 'script'`, source_path = watcher path,
  `reconciled_against_reality=true`) and the new cron (`asset_type 'cron'`). Flip the transcript-pipeline
  asset note from "DEPRECATED → Granola" to "BACKUP (Meet/Drive); primary is anarlog watcher".
- `system_triggers`: add a `schedule` trigger for the anarlog watcher (status `wired`, executor
  `launchd:com.canon-engine.anarlog-transcripts`). The `db_insert` transcript→router trigger needs no change.
- `systems.status`: only move `beta → operating` when a full transcript flow is verified green AND the
  launchd job fires green AND the `/system` surface shows it live (localhost:4180/system/Canon/canon-ingestion).
  Email-only does not earn operating; transcripts-via-anarlog working is what earns it.

## Discipline
Per `practices/agentic-systems/reference/system-building-method.md`: deterministic spine, verify is a gate
read from live state, "done" is a green surface not prose. A broken system was once mislabeled "operating"...
that is the failure this whole effort kills. Do not claim operating on assumption.

## References
- anarlog source map (this session): on-disk layout `crates/fs-sync-core`, transcript schema `crates/fs-format`,
  SQLite store `crates/db-core` (alt surface, DDL not enumerated), no export CLI / no local HTTP API,
  plugins are in-process UI scripts only.
- Canon seam map (this session): `runIngestUploadedTranscript` / `ingestTranscript`, insert contract above.
- Method: `/Users/nplmini/code/work/practices/agentic-systems/reference/system-building-method.md`
- Memory: `canon-ingestion-pipeline`, `projection-system-anatomy-triggers`, `system-building-method-v1`
