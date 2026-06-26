# HANDOFF: restore Meet-scope transcript ingestion (canon-engine)

Date: 2026-06-23. For: a fresh session continuing the Canon Ingestion repair. Decision (Nick): **Option 1
— restore the Meet scope** on the gws OAuth client so the existing Meet-based transcript discovery works
again. Do NOT do the Drive-search rewrite (Option 2, recorded at the bottom as fallback only).

## The one job
Add the Google Meet API scope to the gws OAuth client, re-auth, verify transcripts ingest, then complete
the gated path to move Canon Ingestion `beta → operating`. The transcript pipeline is the LAST broken leg;
email already works.

## Current state (verified 2026-06-23 — trust live state, re-verify before acting)
- Code is **cloned into the work boundary**: `/Users/nplmini/code/work/systems/canon-engine/` (a pnpm+turbo
  monorepo; original preserved at `/Users/nplmini/code/ARCHIVE/canon-engine/`). Builds 6/6, typechecks 10/10.
- Env wired at `/Users/nplmini/code/work/systems/canon-engine/packages/ingestion/.env` (Supabase + OPENAI +
  ANTHROPIC; git-ignored). gws CLI + profiles in `~/.config/gws-*` carry over.
- **Email ingestion is GREEN.** `pnpm --filter @canon-engine/ingestion fetch` ingests email, 0 errors. Three
  bugs were fixed this session in `packages/ingestion/scripts/gws-fetch-emails.ts` + `gws-shared.ts`
  (deleted-account removed from ACCOUNTS; `history_types` array rejection; stale-history self-heal).
- **Transcripts are BLOCKED.** `packages/ingestion/scripts/gws-fetch-transcripts.ts` discovers via the Meet
  API (`gwsWithParams(['meet','conferenceRecords','list'], …)`), which fails: `Request had insufficient
  authentication scopes`. The gws OAuth client has no Meet scope.
- Transcripts are Google **Docs** (`"… - Transcript"`) in the Meet-recordings Drive folder
  `1T61oGZ_ihsGLJ35EDDcJkKUb_Uj8nAVP`. The Meet API is the INDEX (which meetings exist + their transcript
  Drive-doc id); the text is exported from Drive either way. New transcripts are waiting unprocessed (e.g.
  "Will + Nick - 2026/06/23 13:15 CDT - Transcript"); canon's latest is 2026-06-10.

## The gws OAuth client (from `gws auth status`, konstellationai profile)
- Profile config dir: `~/.config/gws-konstellationai`  ·  user `nick@konstellationai.com`
- **GCP project: `instig8-aos-events`**  ·  client_id `78851785….com`
- Current scopes (6, NO Meet): `openid`, `email`, `userinfo.email`, `cloud-platform`, `drive`, `gmail.modify`.
- gws did NOT recognize `meet` as a `--services` shortcut, so the Meet scope must be passed explicitly via
  `--scopes` (full URL).

## The fix (Option 1), in order — interactive, needs Nick + a browser
1. **gcloud reauth** (setup uses gcloud and its token is stale): `gcloud auth login` as the **owner of
   `instig8-aos-events`** (likely `nick@instig8.ai`), then `gcloud config set project instig8-aos-events`.
2. **Enable the Meet API**: `gcloud services enable meet.googleapis.com --project instig8-aos-events`
   (or run `GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/gws-konstellationai gws auth setup`, the 6-step flow
   that enables APIs + configures the client — but it requires step 1 first).
3. **Add the Meet scope to the OAuth consent screen** (GCP Console → APIs & Services → OAuth consent screen
   → Scopes → add `https://www.googleapis.com/auth/meetings.space.readonly`). Meet artifact scopes can be
   sensitive/restricted: if the app is unverified you'll hit the "unverified app" consent warning — proceed
   via Advanced → Continue (testing mode), and add `nick@konstellationai.com` as a test user if needed.
4. **Re-auth gws WITH the Meet scope** (konstellationai profile):
   ```
   GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/gws-konstellationai gws auth login \
     --scopes https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/meetings.space.readonly
   ```
   If `conferenceRecords`/`transcripts` reject `meetings.space.readonly`, try `meetings.space.created` (or
   include both). Confirm with `… gws auth status` showing a `meetings.space` scope.
5. If INSTIG8 meetings also need transcripts, repeat 1–4 for the instig8 profile (`~/.config/gws`); check its
   own project via `gws auth status` (no config dir) — it may be a different GCP project.

## Verify (run it — do not narrate)
```
cd /Users/nplmini/code/work/systems/canon-engine/packages/ingestion
npx tsx scripts/gws-fetch-all.ts
```
PASS = transcripts ingested > 0, 0 errors (the waiting 2026-06-23 "Will + Nick" transcript lands). Confirm in
canon: `select max(meeting_date)::date, count(*) from transcripts` advances past 2026-06-10.

## Then complete the gated path to `operating`
1. **Repoint launchd** `com.canon-engine.fetch` (`~/Library/LaunchAgents/com.canon-engine.fetch.plist`).
   It currently runs `npx tsx ~/code/canon-engine/scripts/gws-fetch-all.ts` (a DEAD path — that's the
   original breakage). Point ProgramArguments + WorkingDirectory at
   `/Users/nplmini/code/work/systems/canon-engine/packages/ingestion` running `scripts/gws-fetch-all.ts`.
   `launchctl bootout gui/$(id -u)/com.canon-engine.fetch` then `bootstrap`; confirm a green run in
   `~/code/canon-engine/logs/fetch.log` (or move the log path to the new home).
2. **Reconcile canon** (project `mzzjvoiwughcnmmqzbxv`, system_slug `canon-ingestion`):
   - Pipeline assets (`assets`, asset_type `script`): `source_path` → the new home; `reconciled_against_reality=true`.
   - Upstream trigger (`system_triggers`, event_type `schedule`): `status` `none → wired`; update `executor`/`schedule`.
   - Cron asset `com.canon-engine.fetch`: clear the "BROKEN" note.
3. **Earn the gate**: only when a full fetch is clean AND the launchd fires green, set `systems.status`
   `beta → operating`. Verify on the `/system` surface read live (localhost:4180/system/Canon/canon-ingestion),
   never by assertion.

## Discipline
- Per `practices/agentic-systems/reference/system-building-method.md`: deterministic spine, verify is a gate
  read from live state, "done" is a green surface not prose. A broken system was once labeled "operating" —
  that's the failure this whole effort kills. Do not move to `operating` on assumption.

## References
- Method: `/Users/nplmini/code/work/practices/agentic-systems/reference/system-building-method.md`
- Mission/DoD: `/Users/nplmini/code/work/practices/agentic-systems/HANDOFF-system-building-mission.md`
- Memory: `canon-ingestion-pipeline`, `system-building-method-v1`
- FALLBACK ONLY (Option 2, NOT chosen): rewrite discovery to Drive — search for `"… - Transcript"` Docs in
  folder `1T61oGZ_ihsGLJ35EDDcJkKUb_Uj8nAVP` (Drive scope already granted), export → feed the existing
  parse/enrich/embed/insert pipeline. Use only if the Meet scope genuinely can't be restored.
