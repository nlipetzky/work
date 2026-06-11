# Client: Teknova

> This engagement's plays execute on the revops-engine system. Its context is imported here:
> @../../../systems/revops-engine/CLAUDE.md

## READ STATE.md FIRST

Before producing ANY client-facing artifact (email draft, status update, meeting brief, scope note, list, plan), read `/Users/nplmini/code/work/accounts/clients/teknova/STATE.md`. The active commitments, hard rules, and read-list there override default behavior. STATE.md is the session-bootstrapping file.

## Operations inventory

Read `artifacts/teknova-operations-inventory.md` before starting any work. It lists every active system, workflow, sync path, provider, and artifact for this client. If your session changes any of these (activates a workflow, runs a migration, exhausts a provider, ships a play), update the inventory before ending the session.

## Ground truth hierarchy (inventory docs are snapshots)

The inventory docs (`teknova-operations-inventory.md`, `teknova-n8n-workflow-inventory-*.md`) are dated snapshots and WILL disagree with each other and with reality. The hierarchy:

1. **Live n8n is ground truth** for workflow existence and active/inactive state. Check it via n8n-mcp (read-only) before relying on any doc's claim about a workflow.
2. **Live Supabase schema is ground truth** for what tables/fields exist and hold data.
3. Inventory docs are orientation aids, newest date wins between them.

**Hard rule: never declare a data source unavailable, missing, or a blocker based on a doc.** "Unavailable" claims require a live check first. Known trap this rule exists for: the SF read-path (account history, contact history, last-contacted, active-opportunity → Revops Surface) is live even though older docs marked SF sync workflows inactive — the inactive ones are the write-back direction only.

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

- **ngAbs (next-generation antibodies) -- Sprint 1** -- offer + segment artifacts derived from Ellie's playbook v1 (2026-05-29). Target: NA-based bispecific ADC, multispecific, and adjacent antibody-format developers. Open items before copy: CTA, pricing frame, soft-scoring vs gate-only.
- **AAV gene therapy - Ellie Outreach** -- closing out as the AAV chapter winds down. Survivor filter pass to land before AAV is fully retired.

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

## Expert and sponsor interactions route through their respective practices

Any operator working in this engagement defers human-facing interaction to the appropriate practice. Do not draft approval asks, choose channels, or send artifacts directly to Ellie or Jenn from inside this folder.

- **Ellie is the expert** ... AAV target verdicts, persona criteria, classification rules, ICP. Route through Hermes (the expert-liaison practice): `/Users/nplmini/code/work/practices/expert-liaison/CLAUDE.md`.
- **Jenn is the sponsor** ... engagement scope, Trajectory, weekly delivery cadence, scope-change conversations. Route through Polaris (engagement-governance): `/Users/nplmini/code/work/practices/engagement-governance/CLAUDE.md`.

Produce the underlying artifact, hand it to the right practice with a clear ask, reference the approval signature once it comes back.

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
