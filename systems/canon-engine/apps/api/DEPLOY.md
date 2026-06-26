# Canon Engine API — Deploy Notes

## Architecture

The Hono app is exported from `src/app.ts`. `src/server.ts` is a thin wrapper that runs it under `@hono/node-server` for local development. Any deploy target imports `app` directly.

## Local dev

```bash
pnpm --prefix apps/api run dev
# API on http://localhost:3334
```

## Test the webhook locally (ngrok)

The cannon-bridge webhook (`POST /webhook/transcript`) is the most common reason to need a public URL. For a quick test:

```bash
# terminal 1: run the API
pnpm --prefix apps/api run dev

# terminal 2: expose it
brew install ngrok       # one-time
ngrok http 3334
# copy the https://...ngrok-free.app URL
```

Then point Supabase's `transcripts` table INSERT webhook at:

- **URL:** `https://<ngrok>.ngrok-free.app/webhook/transcript`
- **Header:** `x-supabase-webhook-secret: <value from apps/api/.env>`

ngrok URLs change on each restart — fine for testing, not durable.

## Production deploy options

The full canon-engine API has long-running routes (agent loops, ingestion, embedding pipelines) that can take 30s–several minutes per request. Pick a host that supports long-running Node servers.

### Recommended: Railway

```bash
brew install railway       # or npm i -g @railway/cli
railway login
railway init               # from canon-engine/ root
railway up                 # deploys
railway variables set CANON_SUPABASE_URL=...
# repeat for each var in .env.example
```

Railway runs Node servers without timeout caps, supports monorepos, and gives a stable `*.up.railway.app` URL.

### Alternative: Fly.io

```bash
brew install flyctl
fly auth login
fly launch                 # from apps/api/, generates fly.toml
fly secrets set CANON_SUPABASE_URL=...
fly deploy
```

### Limited fit: Vercel Functions

Vercel works ONLY for the lightweight routes (webhook, search). Function timeouts:
- Hobby: 10s default, 60s max
- Pro: 60s default, 300s max
- Enterprise: 900s max

Agent runs and ingestion routes will exceed these. Don't deploy the full API to Vercel without splitting long-running work onto a separate worker (e.g., Inngest, queue workers, or a Railway/Fly sidecar). If you do split, the Hono app already separates `/webhook/*` from `/api/canon/agents/*` — you can deploy them to different hosts.

## Required env vars in production

From `.env.example`:

- `CANON_SUPABASE_URL`, `CANON_SUPABASE_SERVICE_KEY` — Canon UKB Supabase
- `OPENAI_API_KEY` — embeddings
- `ANTHROPIC_API_KEY` — agents
- `VOYAGE_API_KEY`, `VOYAGE_RERANK_MODEL`, `VOYAGE_DAILY_BUDGET_USD` — reranking
- `CANON_API_KEY` — bearer auth for `/api/canon/*` clients (e.g., v3-ui)
- `CANNON_BRIDGE_WEBHOOK_SECRET` — must match the header value Supabase sends
- `GOOGLE_OAUTH_*` — only if running gws ingestion scripts in this environment
