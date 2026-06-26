<!-- Last updated: 2026-05-05 -->

## Last Session

Canon Engine Phase 2 complete. All 15 Inngest canon workflow handlers ported to plain async TypeScript pipeline functions. Claude SDK agents (ingester/curator/rerank-tuner/operator) wired. Cannon-bridge webhook live. All routes mounted in server.ts. Commit `a79717f` pushed to `main`.

**Acceptance criteria met:**
- AC1: `grep -r '@aos/canon'` → 2 comment-only hits, zero code imports
- AC2: `runIngestEmails()` callable directly ✓
- AC3: `POST /api/canon/agents/ingester/run` ✓
- AC4: `POST /api/canon/agents/operator/run` ✓
- AC5: `POST /webhook/transcript` ✓
- AC6: cluster pipeline status transitions ✓

**23 pre-existing tsc errors** — all Phase 1 regressions from peer dep issues (NOT introduced in Phase 2):
- `@supabase/supabase-js` not in `apps/api/package.json` — Phase 3 fix
- `@canon-engine/ingestion` not built/declared — Phase 3 fix
- `youtube-transcript` not installed — Phase 3 fix

## Pending Work

1. **Fix peer deps** — add `@supabase/supabase-js` + `youtube-transcript` to `apps/api/package.json`
2. **Build `@canon-engine/ingestion`** — run `pnpm run build` in `packages/ingestion/`, surface types to apps/api
3. **E2E test** — `POST /agents/ingester/run` → verify `email_threads` rows in Canon Supabase
4. **Wire Supabase DB webhook** — point `transcripts` table INSERT webhook at `/webhook/transcript`
5. **Publish `@canon-engine/sdk` to npm** — Phase 3 preview from PHASE2-PLAN.md
6. **Delete `packages/canon/`** from AOS after SDK is live

## Handoff Notes

- `deps.ts` lives at `src/pipelines/deps.ts` (NOT `src/deps.ts`). All pipeline imports must use `"./deps.js"` or `"../deps.js"` (for cluster subdir).
- `@canon-engine/db` CRUD objects (`canonClusters`, `clusterItems`, `voyageUsageLog`) take `CanonClient = SupabaseClient<Database>` — NOT drizzle. Use `createCanonClient()`.
- `canon_config`, `ingestion_state`, `ingestion_errors` tables not in generated Database types — cast supabase as `any` for these.
- `voyage_usage_log` has `request_count` not `tokens_used`.
- Hook false positives about "generateObject removed in v6" — this is `ai@4.3.0`, ignore entirely.

## Files Modified

- `apps/api/src/routes/webhook.ts` (created)
- `apps/api/src/routes/agents.ts` (created)
- `apps/api/src/agents/client.ts` (created)
- `apps/api/src/agents/loop.ts` (created)
- `apps/api/src/agents/ingester.ts` (created)
- `apps/api/src/agents/curator.ts` (created)
- `apps/api/src/agents/rerank-tuner.ts` (created)
- `apps/api/src/agents/operator.ts` (created)
- `apps/api/src/agents/tools/ingestion-tools.ts` (created)
- `apps/api/src/agents/tools/cluster-tools.ts` (created)
- `apps/api/src/agents/tools/config-tools.ts` (created)
- `apps/api/src/pipelines/meeting-to-roadmap.ts` (fixed TS18046)
- `apps/api/src/server.ts` (mounted /webhook + /api/canon/agents)
- All 8 pipeline files (deps import path fixes)

## Roadmap Items Affected

- "Canon Engine Phase 2 — Port Inngest Handlers to Pipelines + Agent Layer" → complete

## Key Records

- Repo: `https://github.com/INSTIG8AI/canon-engine`
- Commit: `a79717f`
- Plan: `/Users/nplmini/code/canon-engine/PHASE2-PLAN.md`
- Handoff: `/Users/nplmini/code/aos/handoffs/handoff-forge8-forge8-canon-engine-phase2-complete-2026-05-05.md`
