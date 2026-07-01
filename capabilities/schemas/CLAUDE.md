# Capability: Schemas

Shared schema primitives, event envelopes, and identity fragments used by more than one system. Each system owns its own assembled contracts in `systems/<name>/schemas/`; this folder holds the *fragments* those contracts compose from.

## Why this passes the rubric

1. Used by ≥2 systems (event envelope crossing canon-engine + revops-engine + projection-ui; identity fragments crossing canon + revops).
2. No system-specific business policy ... just shape.
3. Versions independently (schema versions bump on their own cadence).
4. Pure contract, no runtime.

## What belongs here

- Event envelope shape (the wrapper every Inngest event uses: trigger, ids, provenance, timestamps).
- Identity fragments (canonical id types: `account_id`, `system_slug`, `session_id`, etc.).
- Cross-system primitives (`artifact_ref`, `engagement_ref`, `canon_ref`).
- Versioned base types both backend (Postgres) and frontend (zod) consume.

## What does NOT belong here

- A system's own request/response shapes (those live in `systems/<name>/schemas/`).
- One-shot RPC payloads (live with the RPC definition).
- Airtable field maps (system-specific config; live in the consuming system).

## Current state

Empty. First real candidates:

- The Inngest event envelope (currently the trigger names are scattered; an envelope schema would let validators run at send + receive).
- The `capture_items` shape (it lives in canon.public.capture_items but every persona that drops items would benefit from a shared TypeScript type or zod schema).

Promotion criterion: when projection-ui, canon-engine, and at least one other system independently define the same shape, promote the primitive here and have them all import it.
