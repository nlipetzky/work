# HANDOFF: AOS Inngest Function Decommission

Date: 2026-06-22
For: Boris (Agentic-Systems)
Status: BLOCKED on one input (run-volume data). Inventory complete and verified live.

## Intent

Nick wants to decommission dead weight in the `aos` Inngest deployment. The goal
is a defensible keep / turn-off / delete decision for every function currently
running, organized in one location under Agentic-Systems so it can be executed
as a controlled teardown (not a guess from stale code).

This is a Boris-class job: the live deployment is the source of truth, the repo
was archived without tearing the cloud app down, and the gap between
"what's on disk" and "what's actually running and firing" is exactly the
observability/reconciliation problem Boris owns.

## What is actually running (verified, not inferred)

The live app is `aos`, deployed on Vercel and registered in Inngest Cloud
(account INSTIG8, Production environment).

- Vercel project: `aos-platform` (`prj_Q38438YhO1LhC1R8L0W9QNLlWriQ`, org `team_S4ONt5QMfBX0SuTrcdABNBMx`)
- Serve endpoint: `https://aos-platform.vercel.app/api/inngest`
- Inngest client id: `aos`
- Source (archived, but IS the deployed code): `/Users/nplmini/code/ARCHIVE/aos`
- Inngest client/server: `packages/inngest/src/{client.ts,server.ts}`
- Function definitions: `workflows/**` + `packages/inngest/src/functions/**`

Verification done this session: GET on the serve endpoint returns
`{"function_count":158,"mode":"cloud","has_signing_key":true,"has_event_key":true}`.
That 158 reconciles exactly against source: 160 `createFunction` files on disk
minus 2 defined-but-not-served = 158 registered. Numbers tie out.

### Count by domain (158 served)

```
revops            102
sync               17
canon              15   (13 + 2 clusters)
agent              12
creative            5
ops                 5
sf                  1
scaffold            3   (helloWorld, scheduledCheck, multiStepFlow)
                  ----
                  158   (80 cron-triggered, 80 event-triggered)
```

## Artifacts produced (the "one location" starts here)

All in `/Users/nplmini/code/ARCHIVE/aos/workflows/`:

- `LIVE-FUNCTION-INVENTORY.md` — all 158 live functions, id + trigger, grouped by
  domain. Generated from the served registry, count-verified against the live
  endpoint. This is the authoritative running list.
- `DEAD-FUNCTIONS-AUDIT.md` — earlier static audit (registry diff, orphan-trigger
  and superseded-version analysis). Useful as the static layer; superseded on a
  couple of points by the live check (see below).

Boris: if you want these under Agentic-Systems instead of inside the archived
repo, copy them into a `aos-decommission/` subfolder here and treat
ARCHIVE/aos as read-only source.

## Confirmed safe kills (no run-volume data required)

These are dead by structure, not by activity, so they can be removed regardless
of metrics:

- `helloWorld`, `scheduledCheck`, `multiStepFlow` — Inngest starter-template
  functions in `packages/inngest/src/functions/`. Pure scaffold, live in prod
  for no reason.
- `company-classify-from-research` — registered and served, but its trigger
  event (`revops/company.classify-from-research.requested`) has zero producers
  anywhere in the app. It can never fire. (Note: the static audit originally
  guessed this might be the only orphan; the live env confirms all three
  company-classify variants are registered, so this is the clean orphan, not the
  others.)
- `pearl-reevaluate`, `gates-to-client` — defined on disk but NOT in the served
  array (these are the 2 of 160 that don't reach the 158). Not running; just
  delete the source. WATCH: the runner's `EVENT_TO_FUNCTION_ID` map still routes
  `revops/pearl.reevaluate` to `pearl-reevaluate`, so the system can emit an
  event for a function nothing serves. That mapping should be cleaned up in the
  same pass — it is a latent bug, not just dead code.

## The blocker

The serve endpoint gives the function LIST and registration state but NOT
per-function run history. Volume / failure-rate / last-fired lives only in
Inngest Cloud's metrics behind the dashboard. Without it we cannot rank the
remaining ~150 functions into "fired in last 30/90d" vs "dormant," which is the
core of the kill list.

Two ways to unblock (Nick to choose):

1. Inngest API key (dashboard -> account settings -> keys). With it, pull run
   metrics programmatically and rank all 158 by activity, unattended.
2. Dashboard Functions view, window set to 30 days (NOT the default 24h, which
   hides every weekly/monthly cron), sorted by Volume. Screenshot it; parse it.

Note from the 24h screenshot already seen: `company-brief-pipeline` was at
100% failure rate over 24h with volume 1 — that is broken-and-live, a different
bucket from dead. Flag for fix-or-kill, not silent delete.

## Important context / traps

- The Inngest MCP available in-session (`inngest-dev`) points at a LOCAL dev
  server (`127.0.0.1:8288`) and only sees 2 unrelated `projection-ui` functions.
  It cannot see Cloud. Do not trust it for the `aos` app. The reliable read is
  the serve-endpoint GET (done via in-sandbox fetch per the context-mode routing
  rules; curl/wget/WebFetch are blocked in this environment).
- `projection-ui` and `canon-crm-feed` (under `/code/work/systems/`) are SEPARATE
  live Inngest apps, not part of `aos`. Don't conflate them with this teardown.
- AgentKit (github.com/inngest/agent-kit) was loaded this session and is indexed
  in the context-mode KB under source label `inngest-agent-kit`. It is the
  canonical pattern for the `aos` agent-layer functions (revops-strategist,
  quality-director, exec8-orchestrator, etc.). Open question Nick raised but did
  not resolve: is this decommission purely a dead-function sweep (#1), or the
  first step of re-architecting the agent layer onto AgentKit (#2)? If #2, the
  12 `agent/` functions should be judged by "does an AgentKit network replace
  this," not by run volume. This decision gates how the agent-domain functions
  are classified.

## Recommended next steps for Boris

1. Decide scope with Nick: dead-sweep only, or AgentKit re-architecture of the
   agent layer. This changes how the 12 agent functions are triaged.
2. Get the run-volume input (API key preferred for repeatability).
3. Produce the keep / turn-off / delete table for all 158, layering live volume
   on top of `LIVE-FUNCTION-INVENTORY.md`.
4. Execute teardown as a controlled pass: remove confirmed-dead source, clean the
   `EVENT_TO_FUNCTION_ID` mapping, redeploy, re-verify the serve-endpoint count
   drops to the expected number. Repo is source of truth; reconcile actual-vs-
   registry at close-out per the build-asset-lifecycle discipline.
5. Fix-or-kill `company-brief-pipeline` (100% failure) explicitly.

## Resume pointer

Everything is verified up to the inventory. The single next action is choosing
the run-volume source (API key or 30-day dashboard export). Once that lands, the
kill list is a mechanical merge against `LIVE-FUNCTION-INVENTORY.md`.
