# System: operating-sop (run-tracker)   [provisional name]

This folder is a system repository for the Operating SOP system. It holds what the
system is and how it is built. Launching Claude Code here loads this context and points
the operator at THIS system.

## Operator

Atlas (operator-os) ... this is Nick's run-tracking substrate. Boris (agentic-systems)
builds it. Nick gatekeeps and ratifies.

## What this system ensures

Every recurring output needed to RUN the business has one live checklist of the
system-activities that produce it, with status and the next action ... and any step
whose system is not operational is shown as a build pause, not a silent wait.

## Where it lives

- Spec / design: `./SPEC.md` (10-part anatomy) + `./SYSTEM.md` (contract)
- Slice-1 hand-authored SOP defs: `./sops/`
  - `types.ts` — L1/L2/L3 + SopRun TypeScript interfaces
  - `launch-outbound-for-venture.ts` — the one SOP (15 stages; one workflow
    "build the list" with 8 nodes; one SopRun for konstellation-cipo)
  - `index.ts` — SOPS registry + SOPS_BY_ID lookup
  - (The full canon three-layer schema per SPEC §5 is slice-2.)
- Canon registry: `canon_engine.public.systems` row `operating-sop` (Compass /
  Supporting / status=building / definition_maturity=emerging)
- Surface: projection-ui `/operate` (control surface + SOP detail + grounded inspector)
- Query layer: `systems/projection-ui/lib/queries/operatingSop.ts` (compute-on-read)
- Inspector UI: `systems/projection-ui/components/operate-inspector.tsx`
- Run mechanism + allowlists: `systems/projection-ui/lib/operate-runs.ts`
- API routes: `systems/projection-ui/app/api/operate/{list,prompt,open-folder,run}/...`

## Status

building ... Nick ratified the spec 2026-06-29 (Define → Go, `system-building-method.md`
§3.1 / §4). **Slice 1 SHIPPED 2026-06-29:** /operate route is live; control surface
lists the one SOP; clicking lands on the 15-stage detail view; the build-the-list
workflow renders as an SVG with 8 nodes; the grounded inspector shows live counts
(197 prospects from revops), full prompts inline, blocked-reason explanations, and
working Run (PLAN safe runners only) + Open-in-Claude-Code (osascript → Terminal).
The PLAN/EXECUTE gate is enforced server-side; credit-spenders are visible but
EXECUTE returns 501.

**Architectural move during the build:** canon.prospects → revops collapsed.
The 197 CIPO prospects live in `revops.public.prospects` now, not canon. The
"Bridge canon → revops" stage and node are gone from the SOP. See memory
[[feedback_canon_revops_prospects_collapse]] for the why.

Slice 2+ open items: the canon three-layer schema (sops/sop_stages/workflows
tables + drift view), generalize `prep_run_status` to an operating-sop-owned
`run_ledger`, EXECUTE confirm flow for credit-spenders, the AUTHORING half
(slice 1 only OPERATES), refine workflow-to-stage bindings (binding the workflow
only to stage 9 is a slice-1 simplification — it honestly contributes to
stages 1/4/5/8 too).

## Two-surface rule

Run it in the UI (`/operate`). Come here only to build or repair it.

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |
