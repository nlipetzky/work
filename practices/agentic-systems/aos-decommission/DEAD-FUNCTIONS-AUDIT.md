# Dead / Orphaned Inngest Functions Audit — ARCHIVE/aos/workflows

Generated audit of the archived AOS Inngest workflow tree. Scope: `.ts` source only
under `/Users/nplmini/code/ARCHIVE/aos/workflows/`. `dist/`, `node_modules`, `.next`
excluded.

## Method

- **Registry** = `workflows/index.ts`, which spreads eight per-domain `*Workflows`
  arrays (`revops`, `sync`, `activation`, `sf`, `agent`, `canon`, `creative`, `ops`).
  These are served by `packages/inngest/src/server.ts` via
  `serve({ functions: [...functions, ...workflows] })`.
- A file containing `inngest.createFunction` whose exported symbol is **not** present
  in its domain's exported array = NOT REGISTERED (not served).
- Trigger extraction: `{ event: "..." }` / `{ cron: "..." }` per function.
- Producer extraction: `step.sendEvent` / `inngest.send` / `.send({ name })` across all
  source. NOTE: `revops/execution-plan-runner.ts` dispatches events **dynamically** via
  an `EVENT_TO_FUNCTION_ID` map plus `step.sendEvent('fire-${execStep.id}', ...)`. Most
  `*.requested` events are produced this way or by external UI Run buttons, so a static
  "consumed-but-not-statically-produced" result is NOT sufficient to call a function
  dead. Those go in UNCERTAIN.

## Summary

- **157** files contain `inngest.createFunction` in the audited tree.
- **155** are registered/served. **2** are defined-but-not-served.
- Confidently flagged as dead weight: **3** functions
  (2 not-registered + 1 registered-but-unreachable).
- Plus **3** scaffold functions that ARE served but live *outside* this tree (in
  `packages/inngest/src/functions/`) — noted for completeness.
- Everything else (large `*.requested` "orphan" list) is UNCERTAIN due to dynamic
  dispatch / external triggers — NOT flagged.

## NOT REGISTERED (defined but not served)

| Function | File | Evidence |
|---|---|---|
| `pearl-reevaluate` (`pearlReevaluate`) | `revops/pearl-reevaluate.ts` | Defines `createFunction({ id: "pearl-reevaluate" })` but `pearlReevaluate` is **not imported** in `revops/index.ts` and not in `revopsWorkflows`. It is still referenced as a target in `execution-plan-runner.ts` `EVENT_TO_FUNCTION_ID["revops/pearl.reevaluate"] = "pearl-reevaluate"` — so the runner can emit an event for a function that is **not served** (latent bug). |
| `gates-to-client` (`gatesToClient`) | `sync/gates-to-client.ts` | Defines `createFunction({ id: "sync-gates-to-client" }, { event: "sync/gates-to-client" })` but `gatesToClient` is **not imported** in `sync/index.ts` and not in `syncWorkflows`. Only stale doc-comment references remain (e.g. `scorecard-to-client.ts` comment "after gates-to-client at 6am"). |

## ORPHANED TRIGGERS (registered, but trigger can never fire)

| Function | Event | Evidence |
|---|---|---|
| `company-classify-from-research` (`companyClassifyFromResearch`) | `revops/company.classify-from-research.requested` | Registered in `revopsWorkflows`. Trigger is **event-only — no cron**. A whole-repo grep for the event name (`.ts`, excl dist/node_modules) returns **only its own definition file** — no `sendEvent`, no `event_name`, no `EVENT_TO_FUNCTION_ID` entry, no UI dispatcher. Nothing can ever fire it. Effectively dead. |

## SUPERSEDED VERSIONS

No confident kills here — the version variants coexist by design rather than replacing
each other. Documented so a human can decide.

| Candidate | "Replacement" | Verdict / Evidence |
|---|---|---|
| `company-classify` (v1, `revops/company-classify.ts`) | `company-classify-v2` (`revops/company-classify-v2.ts`) | **NOT superseded — both live.** v1 keeps its `cron: "0 6 * * *"` and is actively referenced by `wave-sourcing.ts`, `plan-generate.ts`, `wave-execution-ready.ts`, the runner map, QA (`execution-plan-qa.ts`), and review. v2 is a distinct Phase-2 classifier on event `revops/company.classify.v2.requested` (produced by `company-discover-exa.ts`, `ctgov-pipeline-scan.ts`, and self-fanout) + `cron: "0 9 * * *"`. Different pipelines. |
| `company-classify-from-research` | `company-classify-v2` | Likely the *intended* dead one (see ORPHANED above) — superseded by the v2 gather→classify chain, never wired to a producer. This is the strongest "superseded" candidate. |
| `company-type-classify` (`revops/company-type-classify.ts`) | `company-classify-v2` | **Keep — runs on `cron: "0 1 * * 0"`.** Its event `revops/company.type.classify` has no static producer, but the weekly cron keeps it alive. Overlaps v2 conceptually; flagged for human review, not killed. |

## SCAFFOLD / ONE-SHOT LEFTOVERS

| Function | File | Evidence |
|---|---|---|
| `helloWorld` | `packages/inngest/src/functions/hello-world.ts` | Inngest starter scaffold. **Served** via `server.ts` `[...functions, ...workflows]`. OUTSIDE the audited `workflows/` tree but reaches production registration — safe to delete. |
| `scheduledCheck` | `packages/inngest/src/functions/scheduled-check.ts` | Starter scaffold cron. Served. Outside audited tree. |
| `multiStepFlow` | `packages/inngest/src/functions/multi-step-flow.ts` | Starter scaffold. Served. Outside audited tree. |
| `backfillEmailClassification` | `canon/backfill-email-classification.ts` | One-shot backfill (`canon/emails.backfill-classification`), registered in `canonWorkflows`. Backfills are typically run-once; verify it is not still needed before removing. Listed as a leftover candidate, not a confident kill. |

Note: backfill *scripts* under `packages/revops-engine/src/scripts/` (`backfill-sf-ids.ts`,
`backfill-capture-gaps.ts`, `backfill-product-recs.ts`, `seed-workflow-registry.ts`) are
plain scripts, not Inngest functions — out of scope.

## UNCERTAIN (needs human judgment)

A static scan found ~90 registered functions whose trigger event is "consumed but never
statically produced." This is expected and does **not** imply dead, because:

1. `execution-plan-runner.ts` emits step events dynamically through
   `EVENT_TO_FUNCTION_ID` + `step.sendEvent('fire-${execStep.id}', { name: <variable> })`.
   The event name is a runtime variable, invisible to a name-literal grep. Any
   `*.requested` step event in a play/execution plan is reachable this way.
2. Many `*.requested` events are fired by external UI Run buttons / the Operations
   dispatcher (`operation-run-dispatcher.ts`) or by other services outside this tree.
3. Several functions are cron-only and don't need an event producer at all.

Therefore the following are **NOT** flagged dead and need a human (or a dynamic
trace / Inngest dashboard run-history check) to confirm reachability:

- All `sync/*-to-airtable` and `sync/*.requested` display syncs (UI/cron driven).
- All `revops/*.requested` enrichment/verify/score/signal functions whose only caller
  would be the runner's dynamic dispatch or a UI button (e.g. `linkedin-*`,
  `lead-score-calculate`, `fit-score-compute`, `signal-decay`, `routing-update`,
  `score-retune`, `drift-detection`, `quarterly-audit`, `monthly-hygiene`,
  `list-*-enforce`, `list-enrichment-run`, `modality-enrich`, `exposure-monitor`,
  `quality-remediation`, `completeness-snapshot`, etc.).
- `canon/*` ingestion + decomposition functions (transcript/email/document upload
  events originate from external uploaders/webhooks).
- `creative/*` (`creative/agent.invoke`, `content.sync.*`, deploy/verify) — UI/agent
  driven.
- `agent/*` (`exec8-*`, `approval-*`, `execute-tool-call`, `quality-director`,
  `company-brief*`, `classify-contacts`, `outreach-context`) — invoked by the agent
  layer / approvals UI.
- `company-type-classify` and `pearl.reevaluate`-style functions reachable only via
  cron or the runner map.

To resolve UNCERTAIN rigorously, cross-check against Inngest run history (last-run
timestamps) or instrument the runner's dynamic dispatch — static analysis alone cannot
close these.
