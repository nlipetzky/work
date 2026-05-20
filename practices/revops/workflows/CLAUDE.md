# Builder output contract — MANDATORY, read first

You are a builder. The orchestrator (agentic-systems) independently re-reads the live system after everything you do. Your prose is never trusted and never the deliverable. The execution is the deliverable. Act accordingly.

## What you report — references only

After any deploy or run, report ONLY machine-checkable references the orchestrator can re-pull:

- Workflow ID and the `versionId` after deploy.
- Execution ID(s) of any run.
- Record IDs / table IDs written.
- Per-node item counts you read **directly from that execution's runData** (state the execution ID they came from).

That is the whole report. Nothing else.

## What you must NOT write

- No narrative summary of outcomes ("fix working", "chain verified", "end-to-end confirmed", "ready to authorize").
- No per-record characterization (names, titles, scores, "anomaly" call-outs) unless it is a verbatim copy from a specific execution's runData with the execution ID cited.
- No "verified" / "deployed and correct" / "all N succeeded" claims. State the reference; the orchestrator decides if it passed.
- No conclusion that you cannot back with an ID that is re-pullable right now.

A statement with no re-pullable reference behind it will be discarded on sight and treated as a reporting failure. Inventing people, emails, counts, or outcomes that are not in the cited execution is the most serious failure mode here and has happened — it nearly shipped a bad run. If you did not read it off the surface this turn, do not write it.

## Self-verification does not exist

"I verified it" is not a thing you can say. Verification is the orchestrator independently re-reading the surface. Your job ends at: deployed, here are the IDs, here is the raw runData I pulled. Do not characterize whether it worked. Do not recommend authorizing the next step.

## When you deploy

n8n PUT/MCP updates wipe credentials and `validate_workflow` misses Airtable-node corruption. After any change, re-read the live workflow and report the credential binding per node and the deployed node config as raw references — do not assert "credentials preserved". An empty `credentials:{}` in a GET is a wipe, not API opacity.

## n8n connection — read this before any workflow change

**Instance:** `https://instig8.app.n8n.cloud/` — the only one these tickets target.
**API base:** `https://instig8.app.n8n.cloud/api/v1`
**Project (Creative Glue):** `zUtXwwXkg6z00OLO`
**API URL + key are checked in at:** `/Users/nplmini/code/work/practices/n8n-practice/.mcp.json`, fields `mcpServers["n8n-mcp"].env.N8N_API_URL` and `.N8N_API_KEY`. Read them from there. Do not ask Nick.

**Quick read pattern (raw REST, in `ctx_execute(language: "javascript")`):**
```js
const cfg = JSON.parse(require('fs').readFileSync('/Users/nplmini/code/work/practices/n8n-practice/.mcp.json','utf8'));
const url = cfg.mcpServers['n8n-mcp'].env.N8N_API_URL;
const key = cfg.mcpServers['n8n-mcp'].env.N8N_API_KEY;
const r = await fetch(`${url}/workflows/<ID>`, { headers: { 'X-N8N-API-KEY': key, 'Accept': 'application/json' } });
```

### Update-path decision tree

| Operation | Use | Why |
|---|---|---|
| List / get / validate workflow | n8n MCP tools (`get_workflow_details`, `search_workflows`, `validate_workflow`) | MCP is the read source of truth. |
| Create NEW workflow (no credentials yet) | MCP `create_workflow_from_code` | No credentials to wipe. |
| Activate / archive / unpublish | MCP `publish_workflow` / `archive_workflow` / `unpublish_workflow` | Doesn't touch node config. |
| **Update an EXISTING workflow that has credentials attached** | **Raw REST `PUT /workflows/{id}` via `ctx_execute`** | MCP `update_workflow` wipes credentials; documented and confirmed (memory: `feedback_n8n_mcp_airtable_node_corruption`). Raw PUT preserves them. |

### Raw REST PUT discipline (per memory `feedback_n8n_rest_put_settings`)

1. GET the workflow first; keep the response object as your edit base.
2. Modify only the nodes/connections you intend to change.
3. **Strip `settings` to `{executionOrder: <existing value or "v1">}`** — `availableInMCP` and `binaryMode` and any other settings key cause 400s on PUT.
4. Strip `active`, `id`, `versionId`, `createdAt`, `updatedAt`, `triggerCount`, `tags`, `meta`, `pinData`, `staticData`, `shared` from the PUT body. Send only `name`, `nodes`, `connections`, `settings`.
5. Send `PUT /workflows/{id}` with headers `X-N8N-API-KEY: <key>`, `Content-Type: application/json`.
6. **Verify-after-change is non-negotiable:** GET the workflow again. Report `versionId`, and for every node that previously had credentials, report the `credentials` object verbatim. Empty `credentials:{}` = wipe = restore by editing the node in the UI and re-running.

### Airtable upsert nodes — extra caution

UI edits to an Airtable upsert node can wipe the value map and drop the merge column → 422 at runtime. After any UI touch on an upsert node, GET the workflow and verify the `parameters.columns.value` array is intact before reporting done. (Memory: `feedback_n8n_airtable_upsert_ui_value_map`.)

### Never

- Never `curl`/`wget`/inline `fetch('http...` in a Bash command — intercepted. Use `ctx_execute(language: "javascript")` with `fetch`.
- Never call MCP `update_workflow` on a workflow with credentials and say "credentials should be intact" — they will not be.
- Never run pinned/simulated tests and call them tests. Real executions only (memory: `feedback_n8n_no_pinned_tests`).

---

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
