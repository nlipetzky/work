# Canon Engine Roadmap

> *Last touched: 2026-05-06. Active focus: Phase 1 (publishing surface decision).*

### Phase 0 — Baseline *(done)*
**Done when:** Repo extracted from AOS with own pnpm workspace; all packages and `apps/api` typecheck clean; `@canon-engine/sdk@0.1.1` published to npm; v3-ui consumes the SDK from the registry.
- Repo extracted from AOS; own pnpm workspace
  - → Canon-engine used to be a folder inside a bigger codebase. We pulled it out into its own repo so changes here can't accidentally break things over there.
- 4 packages: `core`, `db`, `ingestion`, `sdk`
  - → The repo is split into four reusable libraries. Think of them as Lego pieces — `sdk` is what other apps install; the other three are internal building blocks.
- 1 Hono API app (`apps/api`), runs locally on `:3334`
  - → There's a small web server that exposes canon-engine's functionality over HTTP. Right now it only runs on your laptop.
- 15 pipelines ported from Inngest to plain async
  - → The work that processes meeting transcripts, emails, etc. used to depend on a third-party tool (Inngest). It now runs as plain JavaScript inside canon-engine — fewer moving parts.
- 4 Claude SDK agents wired (operator → ingester / curator / rerank-tuner)
  - → There are four AI agents inside canon-engine: one boss agent that delegates to three workers (one ingests data, one organizes it, one tunes how things rank in search).
- `@canon-engine/sdk@0.1.1` published; exports `CanonClient`, `assembleContext`, `recordSignal`
  - → Other apps can now `npm install @canon-engine/sdk` and talk to canon. Three main tools available: a client for queries, a function that pulls layered context, and one that records signals.
- Typecheck clean across all packages
  - → No type errors. Everything lines up. Healthy starting point.

### Phase 1 — Decide publishing surface *(open question)*
**Done when:** Decision made and documented (in HANDOFF.md or as a Canon entry) on whether to publish `@canon-engine/ingestion` (and possibly `@canon-engine/db`) to npm, or commit to HTTP-API-first.
**Model hint:** Opus — product decision with multi-year downstream consequences for every external consumer. Worth thinking carefully through tradeoffs.
- **Choice:** publish `@canon-engine/ingestion` + `@canon-engine/db` to npm, or commit to HTTP-API-first
  - → Right now only the lightweight client is published. We decide whether to also publish the heavier ingestion + database packages, or keep those internal and force outside apps to talk to canon over the network.
- Sets the shape of the product: embeddable library set vs. service consumers call over the wire
  - → Library route = anyone can install canon-engine pieces and run them in their own process. Service route = canon-engine is a server you call. Different products. Pick one before going further.
- Blocks downstream because every external consumer's migration path depends on the answer
  - → AOS, the harness, and anything else built later all need to know which path to plan around.

### Phase 2 — Deploy the API *(deferred, unfreezes when Nick's ready)*
**Done when:** canon-engine API is deployed at a stable public URL with all env vars from `.env.example` configured, and a smoke-test request to a known endpoint returns 200.
- Recommended host: **Railway** (no timeout caps, pnpm + Turborepo support, stable URL)
  - → Pick where canon-engine lives on the public internet. Railway is the suggestion because it handles long-running processes well and works with this kind of monorepo out of the box.
- Set env vars from `apps/api/.env.example`
  - → Configure the secrets and connection strings the deployed server needs. There's already a template listing them.
- Critical var: `CANNON_BRIDGE_WEBHOOK_SECRET` — must match Supabase webhook header
  - → One specific shared password between canon-engine and Supabase, so canon-engine knows webhook calls are real and not from a stranger.
- Host URL becomes the canonical canon-engine endpoint
  - → Once deployed, that one URL is what everything else points at. The single front door.
- Until this ships, all later phases are blocked
  - → No deployment, no integrations. The webhook can't fire, the harness can't connect, nothing real happens until canon-engine is reachable.

### Phase 3 — Wire the Supabase webhook *(blocked on Phase 2)*
**Done when:** Inserting a row into the `transcripts` table in Canon UKB triggers a `POST /webhook/transcript` on the deployed canon-engine API, and a corresponding `pipeline_runs` row appears.
- Canon UKB project: `mzzjvoiwughcnmmqzbxv` → Database → Webhooks
  - → Open the Supabase dashboard and find the section that lets the database call out when something changes.
- Hook on `transcripts` INSERT, POST to `<host>/webhook/transcript`
  - → Tell Supabase: every time a new transcript row appears, ping canon-engine.
- Send `x-supabase-webhook-secret` header
  - → Include the shared password from Phase 2 so canon-engine knows the call is legit.
- Verify by inserting a transcript row and tailing logs
  - → Manually create a test transcript and watch canon-engine's logs to confirm the ping arrived.
- Makes ingestion *live*: meeting hits Supabase → canon-engine wakes → pipeline produces signals + assertions
  - → After this, the system runs on its own: a meeting transcript shows up, canon notices, processes it, and produces structured outputs. Hands-off.

### Phase 4 — Write the seam contract *(design approved)*
**Done when:** `apps/api/SEAM.md` exists at the repo root, lists all four guarantees (supersession chain, `canon_events` channel, `capture_items` promotion lifecycle, `pipeline_runs` triage buckets), and the agent_harness session has acknowledged the contract via a hand-off note.
**Model hint:** Opus — the contract has to anticipate future schema changes; getting the abstractions right matters more than writing it quickly.
- New file: `apps/api/SEAM.md`
  - → A markdown document inside the repo that spells out the public promises canon-engine makes to outside consumers.
- Documents 4 guarantees consumers can rely on
  - → Four specific behaviors that won't change without notice. Outside systems can build on these without fear.
- `canon_docs.supersedes_id / superseded_by_id` — version history + rollback
  - → When a doc is updated, the old version stays in the database with a pointer to the new one. Lets us see history and undo changes by clearing one field.
- `canon_events` with `status_change` / `governance_scan` types — cross-engine wake channel
  - → A shared event log. When something important happens in canon, other systems get notified through this channel.
- `capture_items` with `promoted` lifecycle + `promoted_to`
  - → A spot where decisions and questions get parked, then explicitly "promoted" forward when someone acts on them. No silent disappearing.
- `pipeline_runs.assertions_in_review / clarification` — assertion triage buckets
  - → When canon's pipelines produce outputs, they land in three buckets: auto-applied, needs human review, or needs clarification. Clear separation of confidence levels.
- This is the *defended interface* — internals refactor freely; this surface stays stable
  - → We can rebuild canon's guts later without breaking anything that depends on it, as long as these four behaviors stay the same.

### Phase 5 — Build seam helpers in SDK *(design approved, build deferred)*
**Done when:** `@canon-engine/sdk@0.2.0` is published with `commitCanonDocAmendment` and `commitCaptureItem` exported under `@canon-engine/sdk/server`, with a passing roundtrip integration test.
- New server-side functions:
  - → Two new tools in the SDK that only run on a server (not in browsers).
- `commitCanonDocAmendment` — supersession dance + `canon_events` emission *(Opus)*
  - → A one-call function that updates a canon doc correctly — creates the new version, links it to the old one, and announces the change. The first implementation needs careful design because the supersession invariants must hold; subsequent maintenance is mechanical.
- `commitCaptureItem` — insert with proposal id in metadata
  - → A one-call function for adding a captured decision/question/idea to canon's inbox, with a link back to the proposal that produced it.
- Ship as sub-export: `@canon-engine/sdk/server` (browser bundle stays clean)
  - → Server-only code stays in a separate import path so it doesn't bloat browser apps that only need the lightweight client.
- Bump SDK to `0.2.0`, republish
  - → New version of the npm package goes out.
- Principle: subsidiarity — canon owns its own write primitives
  - → Canon decides how its own data gets written. Outside systems shouldn't be reaching in and doing it themselves; they ask canon to do it on their behalf.

### Phase 6 — Mirror helpers as HTTP routes *(design approved, build deferred)*
**Done when:** `POST /api/canon/commit-amendment` and `POST /api/canon/commit-capture` exist on the deployed API, authenticated by `HARNESS_RATIFY_SECRET`, and an end-to-end test from a harness adapter succeeds.
- `POST /api/canon/commit-amendment`
  - → Same `commitCanonDocAmendment` function from Phase 5, but exposed as an HTTP endpoint anyone can call over the network.
- `POST /api/canon/commit-capture`
  - → Same idea for capturing items.
- Auth: shared-secret header (`HARNESS_RATIFY_SECRET`)
  - → Callers prove they're allowed to do this with a shared password. Simple, works.
- Lets consumers ratify without holding canon's DB URL — clean credential separation
  - → Outside systems no longer need direct database access to canon. They just call the API. Smaller blast radius if their credentials leak.

### Phase 7 — Hand off to the agent harness *(sequenced after Phase 6)*
**Done when:** `agent_harness/integrations.json` has the deployed canon-engine URL; `agent_harness/src/canon/proposals-adapter.ts` has been migrated to thin-wrap the SDK helpers; a hand-off note exists in `agent_harness/docs/handoffs/`.
- Give the harness session: deployed canon-engine URL + SDK `0.2.0` version
  - → Tell the harness team where canon lives now and which version of the SDK to depend on.
- Harness's `src/canon/proposals-adapter.ts` shrinks to a thin wrapper around the SDK helpers
  - → The harness currently has its own bespoke code for writing to canon. After this, that code becomes a one-line call into canon's SDK. Less duplication.
- Write hand-off note in `agent_harness/docs/handoffs/`
  - → Document what shipped, what changed, what to expect — so the next harness session has the context.
- From here on, canon schema changes don't touch the harness
  - → If we rearrange canon's database tables later, the harness keeps working. The seam absorbs the change.

### Phase 8 — Long-range threads *(open-ended)*
**Model hint:** Opus — exploratory architectural threads with multi-system implications; reach for Opus when work on any of these begins.
- **INS-19 readiness** — if Canon tables ever consolidate into `aos-internal.canon`, the SEAM contract is what survives the move
  - → There's a possible future where canon's data moves into a different schema in a different database. As long as the four guarantees from Phase 4 hold, the move is invisible to consumers.
- **Version pinning** — consumers declare which `canon_docs` version they read; ratified amendments don't invalidate pinned slices instantly
  - → Outside systems can say "I'm reading version 5 of this doc" and keep using it even after a new version exists. Lets old work continue under its rule-of-origin instead of breaking the moment something changes.
- **`governance_scan` back-pressure** — engines emit events when pinned versions conflict with newer ratified state; harness surfaces them for deliberation
  - → If an outside system notices its pinned version is now out of date and the difference matters, it raises a flag back to the harness. Humans deliberate on the conflict instead of letting it accumulate quietly.
- Closes the loop: canon proposes downward, engines propose upward, no silent drift in either direction
  - → Communication flows both ways. Canon tells consumers when things change; consumers tell canon when changes are causing them problems. Neither side accumulates surprises.
