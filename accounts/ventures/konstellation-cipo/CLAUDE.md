# Venture: Konstellation CIPO

**New and provisional (2026-06-23).** Stood up as its own venture so it is not
welded to `konstellation-ai` (which is locked around the agentic-systems catalog).
Nothing here is locked. Structure is held loosely until the open questions below
are answered.

## Partner
Will Rosellini ... domain expert and credentialed authority on the IP / patent
side (patent monetization, enforcement, fractional Chief-IP-Officer work). His SME
profile, voice, and credibility artifacts currently live under
`../konstellation-ai/artifacts/` (sme-identity / sme-voice / sme-credibility /
sme-war-stories). They describe Will the person and are reusable here; whether to
reference them in place or copy them is an open question (below).

## Thesis
KonstellationAI.com (or this venture's own surface) sells the legal / IP services
Will leads. Provisional read of the offering: fractional-CIPO + patent-portfolio /
enforcement, on the asset-owner side where Will's name carries weight. To be
confirmed with Will, not assumed.

## Equity / structure
Placeholder. Relationship to the `konstellation-ai` venture is open (peer venture
vs. CIPO superseding the public brand). Do not assume.

## Stage
Exploration.

## Practices used
- `practices/agentic-systems/` ... system architecture.
- `capabilities/skills/website-conversion-design` ... the reusable site-design
  skill (engagement-agnostic; not owned by any one venture).
- Copy/offer/segment skills as needed (creative-copy, offer-extract, segment-criteria).

## What Nick is responsible for
Infrastructure, systems, the website build, operations.

## What the partner is responsible for
Domain expertise, the legal/IP offering definition, credentialing, liability,
client-facing commercial work and pricing.

## Context registry
This venture's full context (what its agents act from) lives in `context/`,
organized by owning agent: `canon/` (intent + governance), `revops/` (reality),
`creative/` (expression). Start at `context/REGISTRY.md`. The 11 spine artifacts are
scaffolded; the rest accrete when needed. Vega (creative director) reads this whole
registry to build the site.

## Active milestones
1. Resolve the open structural questions below.
2. Define the CIPO offering with Will (offer-extract), so the site has something
   real to sell. This unblocks every `gap`-marked registry artifact.
3. Then design KonstellationAI.com via the website-conversion-design skill, reading
   this venture's `context/` registry. Build output → `~/code/konstellation-cipo-site/`.

## Open questions (do not assume answers)
- Is Konstellation CIPO a peer venture to `konstellation-ai`, or does it take over
  the public `KonstellationAI.com` brand/domain?
- Does this venture get its own domain, or share KonstellationAI.com?
- Will's SME artifacts: reference in place under `konstellation-ai/`, or copy them
  here as this venture's own?
- Does this venture inherit any of KAI's voice/narrative, or define its own from scratch?

## Expert and sponsor interactions route through their respective practices
Defer human-facing interaction to the appropriate practice. Do not draft approval
asks, choose channels, or send artifacts directly to Will from inside this folder.

- **Expert-side asks** (offer, ICP, voice / copy direction, domain judgment) →
  Hermes: `/Users/nplmini/code/work/practices/expert-liaison/CLAUDE.md`.
- **Sponsor-side asks** (scope, cadence, commitments) → Polaris:
  `/Users/nplmini/code/work/practices/engagement-governance/CLAUDE.md`.

Will is both expert and sponsor ... same human, two interface flows. Keep the asks separate.

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
