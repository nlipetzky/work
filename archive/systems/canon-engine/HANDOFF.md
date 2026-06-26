# Canon Engine — Session Handoff

**Last updated:** 2026-05-05 by forge_8 (closing AOS-rooted session, switching to canon-engine project folder)

> Read this first when starting a new session rooted at `/Users/nplmini/code/canon-engine/`. Append to the **Open Work** section as items resolve. Replace the **Last Session Summary** section at each session end.

---

## What Canon Engine Is

A standalone TypeScript monorepo for the canon corpus engine — meeting transcripts, emails, documents, canon docs — providing search (hybrid vector + FTS), clustering, ingestion pipelines, and an HTTP API consumed by the AOS v3-ui frontend via `@canon-engine/sdk`.

**Repo:** https://github.com/INSTIG8AI/canon-engine
**Local path:** `/Users/nplmini/code/canon-engine/`
**Package manager:** **pnpm** (NOT npm — different from sibling AOS repo)
**Branch:** `main` (current commit `4399beb`)

```
canon-engine/
├── apps/
│   └── api/                  ← Hono HTTP server (currently local-only)
│       ├── src/
│       │   ├── app.ts        ← Exported Hono app (deploy-portable)
│       │   ├── server.ts     ← Local dev wrapper around @hono/node-server
│       │   ├── routes/       ← search, clusters, agents, webhook, ingest
│       │   ├── pipelines/    ← 15 pipeline functions ported from Inngest
│       │   ├── agents/       ← Claude SDK agent loops (operator/ingester/curator/rerank-tuner)
│       │   └── middleware/
│       ├── DEPLOY.md         ← Deploy options: Railway / Fly / Vercel-with-caveats
│       ├── .env              ← Local secrets (gitignored)
│       └── .env.example      ← Variable documentation
├── packages/
│   ├── core/                 ← @canon-engine/core
│   ├── db/                   ← @canon-engine/db (Supabase client wrappers)
│   ├── ingestion/            ← @canon-engine/ingestion (gws fetch + ingest pipelines)
│   └── sdk/                  ← @canon-engine/sdk (HTTP client, PUBLISHED to npm)
├── pnpm-workspace.yaml
├── turbo.json
└── PHASE2-PLAN.md
```

---

## Current State (as of 2026-05-05)

### What's working
- `pnpm --prefix apps/api run typecheck` returns **0 errors**
- `pnpm --prefix packages/sdk run build` and `pnpm --prefix packages/ingestion run build` both clean
- All 15 pipeline functions ported from Inngest to plain async TypeScript
- Claude SDK agents wired (operator orchestrates ingester/curator/rerank-tuner)
- Cannon-bridge webhook endpoint (`POST /webhook/transcript`) implemented, awaiting public URL to wire from Supabase
- `@canon-engine/sdk@0.1.1` published to npm registry (https://www.npmjs.com/package/@canon-engine/sdk)
- AOS v3-ui consumes the SDK from npm (no longer via `file:` workspace link)

### What's deployed
**Nothing yet.** Canon-engine runs locally only. Local dev:
```bash
pnpm --prefix apps/api run dev     # Hono server on http://localhost:3334
```

### What's published
- `@canon-engine/sdk@0.1.1` on npm. Future versions: bump `packages/sdk/package.json` `version`, then from `packages/sdk/`:
  ```bash
  npm publish
  ```
  No OTP needed — `~/.npmrc` has a granular access token with bypass-2FA for the `canon-engine` org.

---

## Open Work

### 1. Webhook wiring (paused)

**Goal:** Supabase `transcripts` INSERT → `POST /webhook/transcript` on canon-engine. Triggers the cannon-bridge → Paperclip wake-up flow.

**Status:** Paused per Nick — canon-engine stays local until later.

**To resume:**
1. Pick a host. Read `apps/api/DEPLOY.md` for tradeoffs. **Recommended: Railway** (no timeout caps, supports monorepos via Turborepo, stable URL).
2. Set env vars on the host (list in `.env.example`). Critical: `CANNON_BRIDGE_WEBHOOK_SECRET` must match what Supabase sends in the `x-supabase-webhook-secret` header. Current dev value is in `apps/api/.env`.
3. In Supabase dashboard for the Canon UKB project (`mzzjvoiwughcnmmqzbxv`) → Database → Webhooks → create hook on `transcripts` INSERT, POST to `<host>/webhook/transcript` with the secret header.
4. Test: insert a row into `transcripts` and watch server logs for `POST /webhook/transcript`.

For a quick non-deploy test, see the ngrok recipe in `apps/api/DEPLOY.md`.

### 2. Broaden the published surface (open product question)

**From canon-engine's perspective, the extraction is complete.** The repo runs on its own pnpm workspace, has zero AOS or Inngest dependencies, and publishes `@canon-engine/sdk` to npm. Outside consumers (AOS, the agent_harness, anything else) consume that surface.

What's *not* yet published: `@canon-engine/ingestion` and `@canon-engine/db` are `workspace:*` only. AOS's Inngest workflows in `aos/workflows/canon/` still import `@aos/canon/{google, pipelines/*}` because no equivalent npm package exists for them to migrate to.

**Open question for canon-engine:** Should `@canon-engine/ingestion` (the gws fetchers + adapters + email/transcript/document enrichers) be published to npm too, so external consumers have a complete migration target? Or should canon-engine stay HTTP-API-first and tell external consumers to call the API rather than embed?

This is a canon-engine product decision, not an AOS coordination problem. AOS will decide on its own schedule whether to migrate its workflows, keep its parallel copy, or replace them with API calls into a deployed canon-engine.

### 3. Independence boundary (durable framing)

Canon-engine is independent of AOS. AOS is one consumer of `@canon-engine/sdk` (currently the main one). Future consumers — most notably the agent_harness — will use the same public surface. **Canon-engine sessions do not plan around AOS's internal cleanup, do not write to AOS-side handoff directories, and do not own AOS's `packages/canon/` deletion.** When external consumers ask for something, the answer is "we'll publish it" or "we'll expose it via the API," never "we'll cross-import."

### 4. npm token rotation (Nick's hands)

The token in `~/.npmrc` for `@canon-engine/*` was pasted in chat on 2026-05-05 — treat as compromised. At https://www.npmjs.com → Access Tokens → revoke `canon-engine` token, regenerate, paste new one into `~/.npmrc`. Future `npm publish` calls work transparently with the new token.

### 5. Ratification seam for the agent harness (design approved, build deferred)

Canon-engine will eventually be a consumer surface for the agent_harness's proposals API. Design is captured in `/Users/nplmini/.claude/plans/here-is-your-vision-vectorized-kay.md` (Workstream B). The shape Nick approved 2026-05-05: server-side SDK helpers (`commitCanonDocAmendment`, `commitCaptureItem`) plus thin HTTP mirror routes, so the harness's adapter calls canon-engine's published surface rather than reaching across DBs. Build comes after the deploy decision unfreezes.

---

## How to Do Common Things

| Task | Command |
|---|---|
| Start API locally | `pnpm --prefix apps/api run dev` |
| Typecheck API | `pnpm --prefix apps/api run typecheck` |
| Build SDK | `pnpm --prefix packages/sdk run build` |
| Publish new SDK version | bump `packages/sdk/package.json` → `cd packages/sdk && npm publish` |
| Build all packages | `pnpm -r run build` (or use turbo) |
| Install deps | `pnpm install` (NEVER `npm install` here) |
| Run gws ingestion | `pnpm --prefix packages/ingestion run fetch:emails` (etc.) |

Workspace dependencies use `workspace:*` protocol — pnpm resolves them, npm rejects. Don't run npm in this repo.

---

## Carryover Gotchas (validated through Phase 3)

- `apps/api/src/pipelines/deps.ts` is the workspace deps shim. Import as `./deps.js` from `pipelines/`, `../deps.js` from `clusters/`.
- `@canon-engine/db` CRUD objects take `CanonClient` (Supabase wrapper), NOT drizzle. Use `createCanonClient()`.
- `canon_config`, `ingestion_state`, `ingestion_errors` aren't in the generated Database types — cast `supabase as any` when querying them.
- `voyage_usage_log` has `request_count`, NOT `tokens_used`.
- Canon-engine uses `ai@4.3.0`. Hook validation warnings about "generateObject removed in v6" are **false positives** — ignore.
- Type errors involving `generateObject` returning `unknown` are caused by the zod v4 / ai-sdk-peer-zod-v3 mismatch. Cast through the inferred schema type at the call site (see `apps/api/src/pipelines/process-meeting-intelligence.ts:236` for the pattern).
- npm registry has CDN replication delay (~5 min) for newly created scoped packages. If `npm view` returns 404 right after publish but the tarball URL works, just wait or republish a patch version.

---

## Key Files for Orientation

Read these in order if you're picking up cold:

1. `HANDOFF.md` (this file)
2. `PHASE2-PLAN.md` — original Phase 2 plan (what got built)
3. `apps/api/DEPLOY.md` — deploy options reference
4. `apps/api/src/app.ts` — Hono app wiring (routes, middleware)
5. `apps/api/src/server.ts` — local dev wrapper
6. `packages/sdk/src/client.ts` — SDK client API surface
7. `apps/api/.env.example` — required environment variables

---

## Cross-Reference

The full Phase 3 session brief (commits, type errors fixed, file paths, decisions) lives in the AOS handoffs directory:
`/Users/nplmini/code/aos/handoffs/handoff-forge8-forge8-canon-engine-phase3-complete-2026-05-05.md`

The previous Phase 2 → Phase 3 handoff:
`/Users/nplmini/code/aos/handoffs/handoff-forge8-forge8-canon-engine-phase2-complete-2026-05-05.md`

---

## Last Session Summary

**2026-05-05 — Phase 3 close (forge_8 from AOS folder):**
- Fixed peer dep resolution (apps/api typecheck 23 errors → 0). Added `@supabase/supabase-js` and `youtube-transcript` to `apps/api/package.json`. Fixed two real type errors (`ingestTranscript` 2-arg signature; zod v4 `generateObject` cast).
- Made SDK publish-ready, published `@canon-engine/sdk@0.1.0` then republished `0.1.1` to force CDN refresh after npm metadata served 404 for ~5 min.
- Switched AOS v3-ui from `file:` workspace link to `^0.1.1` from npm registry.
- Extracted Hono app from `server.ts` to `app.ts` for deploy portability. Wrote `apps/api/DEPLOY.md`.
- Added `CANNON_BRIDGE_WEBHOOK_SECRET` to `apps/api/.env` (gitignored) and documented the variable in `.env.example`.

Commits: `2d36feb`, `3a04461`, `a73e6e1`, `4399beb`. All pushed.
