# Client: Teknova

## Operations inventory

Read `artifacts/teknova-operations-inventory.md` before starting any work. It lists every active system, workflow, sync path, provider, and artifact for this client. If your session changes any of these (activates a workflow, runs a migration, exhausts a provider, ships a play), update the inventory before ending the session.

## Practice skills

This client uses skills from the studio's RevOps practice. Practice skills live at `~/code/work/practices/revops/skills/`. Available skills include:

- `offer-extract` — extracts a structured offer for a play
- `segment-criteria` — defines segment criteria for a play
- `company-discovery` — finds the full universe of companies matching a play's segment criteria

When a skill is referenced, read the skill's SKILL.md from the practice path and execute it in this client's context.

## Engagement scope

Structured transformation program currently in Phases 3-4. Nick is running the enrichment pipeline, segment building, and outreach operations. Phase 3: opt-out/suppression architecture (Salesforce sync + Airtable checkbox). Phase 4: campaign readiness and send governance.


Out of scope: Salesforce admin, email platform infrastructure.

The Negative Response Architecture (Phase 3) commitment is not fulfilled until SF opt-out sync is live and validated. Do not treat it as done.

## Context source

NotebookLM notebook: Teknova Events

## Active plays

- **AAV gene therapy - Ellie Outreach** -- offer design stage. One event (name TBD), personalized offer, 3-touch sequence. Sending from Ellie's inbox. Weekly reporting to Jenn Henry.

## Voice and tone

Professional, outcome-focused, evidence-based. External copy should be confident and decisive -- not apologetic, not promotional. The frame is: diagnosis, pivot, solution. No re-litigation of past results.

Internal updates to Jenn: operational detail for working contacts, executive summary for leadership. Weekly cadence.

## Named accounts

- **Jenn Henry** -- primary client contact, final approver
- **Ellie** -- outreach inbox owner, approves sends
- **Sasha** -- LP asset work, routes into campaign asset library
- **Ma** -- marketing team member

## ICP

Companies: biopharma + CDMOs in cell therapy (allogeneic/autologous), gene therapy (AAV), ADCs. 50-2,000 employees. US and Canada primary. Stage: preclinical through Phase II.

Primary contacts (1-2 per account): VP/Director Process Development, VP/Director Manufacturing, Head of CMC.
Secondary: Senior Scientists (Process Dev), Manufacturing Leads, Tech Ops Leads.

Max 3-5 contacts per company per wave.

## Exclusions

**Roles:** Legal, Sales, Talent Acquisition, Marketing, IT, Finance, Regulatory, Program Management, QC.

**Large pharma filter:** Companies >500 employees require US/Canada location, tenure >= 5 years, and research publication history.

**Relationship state:** Exclude contacts flagged opted_out, bounced, DNC, or known.

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
