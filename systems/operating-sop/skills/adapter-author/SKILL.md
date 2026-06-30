---
name: adapter-author
description: Use this skill when a BUILD-mode session needs a thin, typed wrapper around ONE external provider's API ... an adapter at systems/<sys>/adapters/<provider>.ts that reads its key from env (BYO-keys discipline), exposes only the one or two methods the calling activity actually needs, and returns typed results. Trigger on "write the adapter for <provider>", "wrap the <provider> API", "we need a thin client for <provider>", "draft adapters/<provider>.ts". It produces a code-draft artifact via govern-artifacts, never a direct file write. Do NOT use for: the activity that calls the adapter (use activity-binder); the function/step orchestration around it (use function-scaffolder); the schema or envelope the adapter's output conforms to (use schema-author).
status: DRAFT
---

# adapter-author

## Purpose
Draft a thin provider wrapper ... a narrow, typed surface over one external API so the rest of the system depends on a stable local contract, not the raw provider SDK. One adapter, one provider, only the methods an activity needs.

## When to use
- A BUILD session has an activity that needs to call an external provider and no adapter exists yet.
- The operator names a provider to wrap ("write the adapter for Exa", "wrap Hunter").
- An existing adapter needs a new method added for a downstream activity.

## What it does
- Confirms the provider, the env var its key comes from, and the exact method(s) the consuming activity needs.
- Drafts adapters/<provider>.ts: env-based auth, one or two narrow async methods, typed inputs and returns, errors surfaced not swallowed.
- Keeps the surface minimal ... no speculative methods, no provider features the activity does not consume.
- Emits the file content as a code-draft artifact for governance, with the target path and provider named.

## Reads
- The consuming activity's needs (which calls, which fields) ... from the operator or the activity-binder draft.
- practices/agentic-systems/reference/vertical-system-pattern.md (adapters live in the owning system's adapters/).
- BYO-keys discipline: provider keys come from env (Nick's own paid keys), never hardcoded.

## Writes
- A code-draft artifact via systems/canon-engine/scripts/govern-artifacts.mjs propose_artifact (RULES-GATE -> JUDGE -> PROPOSE -> CONFIRM). Never writes adapters/<provider>.ts to disk directly.
- If the provider, env var, or required methods are unspecified, emits INSUFFICIENT_SOURCE instead of inventing an API surface.

## Do NOT use for
- The activity that calls the adapter (use activity-binder).
- The function/step orchestration around the call (use function-scaffolder).
- The schema or event envelope the output conforms to (use schema-author).
