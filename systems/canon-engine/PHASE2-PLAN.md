# Canon Engine Phase 2 — Pipeline Functions + Claude SDK Agents
<!-- Status: planning -->
<!-- Author: forge_8 — 2026-05-05 -->
<!-- Decision: No Inngest in canon-engine. Agent-orchestrated architecture. -->

## Context

Phase 1 complete (committed to main): Hono API (port 3334), Voyage rerank, cluster-chat streaming,
@canon-engine/sdk (19/19 smoke), Studio UI, AOS migration.

Phase 2 cuts the last code dependency on AOS: 15 Inngest functions in `workflows/canon/` still
import from `@aos/canon/*`. After Phase 2, canon-engine has zero imports from AOS.

---

## Source Inventory

**15 functions** in `workflows/canon/index.ts` → all export as `canonWorkflows`.

| Group | Functions | Canon DB? | AOS Operational? |
|-------|-----------|-----------|-----------------|
| Core ingestion | ingestEmails, ingestTranscripts, ingestDocuments, ingestUploadedTranscript, ingestAll | write | no |
| Intelligence | processMeetingIntelligence, meetingToRoadmap, emailToDecisionQueue | read | write |
| Signals | decomposeExtractionToSignals, decomposeEmailToSignals | read | write |
| Creative | vaultAutoDraft, proposeEmailReply | write | read |
| Backfill | backfillEmailClassification | read | write |
| Clusters | addClusterItem, extractClusterItem | write | no |

**Canon-bridge** (in v3-ui, not a workflow):
- `src/lib/cannon-bridge/route-transcript.ts` — pure routing logic
- `src/app/api/cannon/transcript-event/route.ts` — Next.js HTTP handler

**Dependency translation is mechanical:**
```
@aos/canon/pipelines/adapters/... → @canon-engine/ingestion/pipelines/adapters/...
@aos/canon/pipelines/embeddings   → @canon-engine/ingestion/pipelines/embeddings
@aos/canon/google                 → @canon-engine/ingestion/google
```
Package exports match exactly (both use `./google` and `./pipelines/*` paths).

---

## Architecture

No Inngest. The 15 AOS workflow functions are Inngest wrappers around pure pipeline logic.
Phase 2 strips the wrappers, keeps the bodies as plain async TypeScript, and exposes them to
Claude SDK agents as tools.

```
apps/api/src/
  pipelines/             ← plain async TypeScript (stripped from Inngest wrappers)
    deps.ts              # replaces lib.ts (createCanonDeps — @aos/canon → @canon-engine/ingestion)
    ingest-emails.ts
    ingest-transcripts.ts
    ingest-documents.ts
    ingest-uploaded-transcript.ts
    ingest-all.ts
    process-meeting-intelligence.ts
    meeting-to-roadmap.ts
    email-to-decision-queue.ts
    decompose-extraction-to-signals.ts
    decompose-email-to-signals.ts
    vault-auto-draft.ts
    propose-email-reply.ts
    backfill-email-classification.ts
    clusters/
      add-cluster-item.ts
      extract-cluster-item.ts
  agents/
    client.ts            # Anthropic SDK singleton
    tools/
      ingestion-tools.ts # tool definitions wrapping pipelines/ingest-*.ts
      cluster-tools.ts   # tool definitions wrapping pipelines/clusters/*.ts
      search-tools.ts    # tool definitions wrapping existing search routes
      config-tools.ts    # read/write canon_config rows
    operator.ts          # orchestrator — routes work to subagents
    ingester.ts          # ingestion subagent (emails, transcripts, docs)
    curator.ts           # cluster curation subagent
    rerank-tuner.ts      # Voyage param tuning subagent
  routes/
    agents.ts            # POST /agents/:agent/run — HTTP trigger for each agent
    webhook.ts           # POST /webhook/transcript — cannon-bridge (section 2.5)
    ingest.ts            # (update: replace spawn with direct pipeline calls)
```

**Scheduling** (replaces Inngest crons):
Pipeline functions are triggered via HTTP endpoints (`POST /agents/ingester/run`, etc.).
External scheduler fires them: pg_cron in Canon Supabase or Vercel Cron (Phase 3 deploy).
In local dev: trigger manually via Studio or `curl`.

**Agent invocation pattern:**
```typescript
// operator.ts
const response = await anthropic.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 4096,
  tools: [...ingestionTools, ...clusterTools, ...configTools],
  system: OPERATOR_SYSTEM_PROMPT,
  messages: [{ role: "user", content: input }],
});
// tool_use loop — call pipeline functions, feed results back
```

**Durability:** Pipeline functions handle their own idempotency (content hash dedup already exists
in ingest-uploaded-transcript.ts; ingestion-state.ts tracks last-seen cursors). No Inngest needed.

---

## Sections

### 2.2 — Pipeline Functions (strip Inngest wrappers)

For each of the 15 source files:
1. Remove Inngest imports (`import { inngest } from "../../client.js"`)
2. Remove `inngest.createFunction({ ... }, triggers, async ({ step, event }) => {` wrapper
3. Replace `step.run("label", async () => { ... })` with direct `await (async () => { ... })()`
   OR refactor as named function calls (preferred — improves readability + testability)
4. Change `from "@aos/canon/..."` → `from "@canon-engine/ingestion/..."`
5. Export a plain `async function runIngestEmails(opts?: {...})` etc.

Create `apps/api/src/pipelines/deps.ts` — near-verbatim copy of `workflows/canon/lib.ts` with
import prefix changed.

Intelligence workflows (cross-system) need `AOS_OPERATIONAL_URL` + `AOS_OPERATIONAL_SERVICE_KEY`
in `apps/api/.env`. Create `apps/api/src/lib/aos-operational.ts`.

### 2.3 — Cluster Pipeline Functions

Same strip-and-translate as 2.2 for:
- `clusters/add-cluster-item.ts`
- `clusters/extract-cluster-item.ts`

`extract-cluster-item.ts` uses `createEmbeddingClient` + `formatVector` from
`@canon-engine/ingestion/pipelines/embeddings` — verify export before copy.

### 2.4 — Agent Tools + Agents

**2.4a — Tool definitions** (`apps/api/src/agents/tools/`):
Each tool wraps a pipeline function. Shape:
```typescript
{ name: "ingest_emails", description: "...", input_schema: { ... } }
```
Tool handler calls `runIngestEmails(input)` and returns result.

**2.4b — Subagents:**
- `ingester.ts` — tools: ingest_emails, ingest_transcripts, ingest_documents, ingest_all
  System prompt: focused on ingestion, checks ingestion-state cursors, reports what was ingested.
- `curator.ts` — tools: list_clusters, check_cluster_item_status, remove_orphaned_items, score_cluster_quality
  System prompt: cluster hygiene, surfaces low-quality items for human review.
- `rerank-tuner.ts` — tools: read_voyage_usage_log, update_canon_config
  System prompt: budget governance, adjusts daily_budget_usd and model params based on usage.

**2.4c — Operator:**
`operator.ts` — tools: run_ingester, run_curator, run_rerank_tuner, read_canon_status
System prompt: lightweight orchestrator. Reads DB state, decides what work to do, delegates.

**2.4d — HTTP routes** (`apps/api/src/routes/agents.ts`):
```
POST /agents/operator/run    body: { input?: string }
POST /agents/ingester/run    body: { input?: string }
POST /agents/curator/run
POST /agents/rerank-tuner/run
```
Auth: same `x-api-key` middleware as existing routes.

### 2.5 — Canon-Bridge Webhook

Hono route `POST /webhook/transcript` in `apps/api/src/routes/webhook.ts`.
Ports `routeTranscriptEvent` + HTTP handler from v3-ui verbatim (no framework deps — pure fetch).
Env additions: `CANNON_BRIDGE_WEBHOOK_SECRET`, `PAPERCLIP_API_URL`, `PAPERCLIP_BRIDGE_API_KEY`,
`PAPERCLIP_BRIDGE_COMPANY_ID`.
After deploy: point Supabase DB webhook at canon-engine URL. Mark v3-ui route redundant.

---

## Sequencing

2.2 → 2.3 → 2.5 (parallel) → 2.4a → 2.4b → 2.4c → 2.4d

2.2 first: pipelines must exist before tools can wrap them. 2.5 is independent of agents.
2.4 builds bottom-up: tools → subagents → operator → HTTP routes.

---

## Acceptance Criteria

1. `grep -r '@aos/canon' apps/ packages/` returns zero hits
2. `runIngestEmails()` called directly → rows appear in Canon Supabase `email_threads`
3. `POST /agents/ingester/run` → agent runs email ingestion, returns structured result
4. `POST /agents/operator/run { "input": "run ingestion" }` → operator delegates to ingester
5. `POST /webhook/transcript` with valid payload → `{ kind: "wake_created" or "ignored" }`
6. `addClusterItem` pipeline → cluster_item status transitions `pending→ready`
7. AOS `packages/canon/README.md` DEPRECATED notice still present (delete in Phase 3)

---

## Phase 3 Preview (out of scope for now)

- Publish `@canon-engine/sdk` to npm → swap `file:` link in AOS v3-ui
- Delete `packages/canon/` from AOS
- Add `CLAUDE.md` + session protocol native to canon-engine repo
- Set up GitHub Actions CI for canon-engine
