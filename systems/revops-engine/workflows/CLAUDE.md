# revops-engine / workflows

Inngest functions owned by revops-engine. Each `.ts` file in this folder defines one or more Inngest functions; `index.ts` re-exports them as a barrel + a `revopsEngineFunctions` array.

These functions are SERVED by projection-ui's `/api/inngest` route, but they are OWNED by revops-engine. The vertical-ownership rule: the system whose durable responsibility the workflow represents owns the file. RevOps staging → promotion → downstream sync is revops-engine's domain.

## Inventory

- **`sync-on-promote.ts`** — Triggered by `revops/batch.promoted`. Two functions (companies + contacts) that read staging promotions and upsert canonical records to Airtable. Shared concurrency keyed on the Airtable base ceiling.

## How a new workflow gets added

1. Create `<name>.ts` in this folder.
2. Import the client: `import { inngest } from "../../../capabilities/inngest/client"`.
3. Cross-system reads (Supabase, Airtable libs) currently use relative paths back to `projection-ui/lib/*`. When those libs migrate to capabilities/, update the imports.
4. Export your function from `index.ts` AND add it to the `revopsEngineFunctions` array.
5. Restart the projection-ui dev server (or rebuild) and the function picks up automatically.

## Why these files aren't in projection-ui

They were until 2026-06-29. Moving them here closes a category error: projection-ui is the SERVING endpoint, not the OWNER of revops-domain logic. Each system owns its own workflows; projection-ui just unions and serves them.

See `practices/agentic-systems/reference/folder-architecture-decision.md` for the broader pattern.
