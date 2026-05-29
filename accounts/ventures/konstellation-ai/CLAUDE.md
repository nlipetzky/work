# Venture: Konstellation AI (KAI)

This is the engagement folder for Konstellation AI ... the partnership business Nick Lipetzky and Will Rosellini are commercializing together. LLC formed, bank account live, agreement in place. Not aspirational anymore.

KAI is a venture that consumes the studio's operator practices ... primarily `practices/sales-and-gtm/` for offer and pipeline work, `practices/revops/` for engine infrastructure, and `practices/agentic-systems/` for system architecture review. When a practice persona (Kepler, the revops operator, Boris) starts work for KAI, this file plus the `reference/` docs are the authoritative context for KAI's brand, vocabulary, voice, and locked decisions.

## What KAI sells

AI systems that manage the pipeline around a domain expert ... so the expert's time goes to the high-value work only they can do, and the organization gets the output of a team without hiring one.

**Buyer:** credentialed domain experts whose deep expertise is bottlenecked by manual sales, marketing, or research work. Biotech specialists, IP attorneys, founders, technical operators.

**Default delivery mode:** Operated (DFY). Most clients stay here indefinitely. This is correct physics, not a downgrade.

## Who's who

**Nick Lipetzky** ... build, ops, system design, service delivery. Owns the technical layer and the catalog. Wants to avoid excessive client meetings; prefers async work from clear inputs.

**Will Rosellini** ... commercial side and go-to-market execution. Will is a domain expert in entrepreneurship, commercialization, scaling businesses, and capital allocation. He owns:
- The SDR motion and sales calls
- Pricing decisions and terms
- Pressure-testing the offer framework
- Client-facing commercial conversations

Pricing routes through Will. Always. Kepler can sketch tier shapes; Will commits numbers.

## Where to look

Brand and architecture, in order of priority when a fresh session starts:

1. **`reference/catalog.md`** ... the locked five-layer Konstellation Catalog, read bottom-up: Assets, Systems, Clusters, Constellations, Trajectory. Architecture source of truth. Read first if you're designing, writing, or selling.
2. **`reference/narrative.md`** ... the orbit/sky pitch, KAI-specific voice rules, the astronomical metaphor frame.
3. **`reference/locked-decisions.md`** ... five decisions that came out of a 12-turn alignment arc with Nick. Do not re-litigate.
4. **`DESIGN-offer-framework-2026-05-22.md`** ... the original full design doc with rationale. Historical reference.
5. **`HANDOFF-konstellation-offer-framework-alignment-2026-05-22.md`** ... the alignment arc evidence. Documents how the locked decisions were derived so future sessions don't redo the 12 turns.
6. **NotebookLM ... `KAI Offers`** (id `9597dc22-56db-4291-a59e-4363b700e3f6`) ... the authoritative external source. 13 sources covering transcripts with Will, overview decks, design doc, and prospect context. Query it when reference docs don't have the answer.

Artifacts ship under `artifacts/` with dated filenames. Overview decks, Survey deliverables, proposals all live there.

## Vocabulary discipline

These words have specific meanings here. Do not let them drift.

- **Asset** ... an atomic deliverable (workflow, database, context engineering spec, content/context docs, Surface). The inventory unit. How work gets costed and reused. Not the SKU.
- **System** ... a coherent bundle of Assets sold as a single unit. The SKU. The smallest thing a client can buy. What Will quotes.
- **Cluster** ... a sales bundle of Systems organized by a legacy functional category buyers recognize (RevOps, Intake, etc.). Not an integration architecture. Not "Play." Play already means campaign in the operator vocabulary.
- **Constellation** ... an integration architecture across Systems that share data, infrastructure, and operating logic. The agentic-company lens. One of eight: Canon, Compass, Signal, Forge, Voice, Pulse, Guard, Garden. Deeper than a Cluster, not parallel to it.
- **Trajectory** ... per-client sequenced plan of Systems over 6–12 months **and** the responsibility-allocation contract between KAI and the client for each deliverable. Output of the Survey.
- **Delivery slot** ... the weekly Asset bundle shipping against a Trajectory. Cadence, not a catalog layer.
- **Operated** / **Adoption Track** / **Owned** ... the three Engagement Modes. Default is Operated.
- **Survey** ... the paid time-boxed GTM Survey. The first revenue event. Not "discovery call."

When a draft uses one of these wrong, fix it before anything else.

## How KAI relates to the rest of the OS

- KAI is a **venture**, registered under `~/code/work/accounts/ventures/konstellation-ai/`.
- Practices serve KAI the same way they serve clients. KAI becomes "the engagement" when a practice does work for it.
- KAI's AI SDR agentic system lives architecturally in `practices/revops/` or `practices/sales-and-gtm/` workflows ... not in this venture folder. This folder holds catalog, voice, decisions, and KAI-facing artifacts only.
- KAI is also a buyer-facing product. Clients who buy a Cluster from KAI ... they're clients of KAI, and they get their own `~/code/work/accounts/clients/<client-name>/` folder. KAI's own internal pipeline (Will's SDR motion targeting prospects for KAI itself) is run from this venture folder.

## Current state (as of 2026-05-26)

- Catalog architecture: **locked**.
- Voice and narrative: **locked**.
- First instantiation (Shawn faith business GTM Survey): **next in queue**, pending GTM Survey explainer doc.
- Pricing: **open**. Will lands.
- Internal AI SDR Engine for KAI's own pipeline: **not yet built**. Tracked under sales-and-gtm.

## Expert interaction routes through Hermes

Any operator working in this venture defers expert-facing interaction to Hermes (the expert-liaison practice). Channel, format, approval-ask shape, and translation-to-artifact are Hermes's job, not the practice you're operating as.

Specifically for KAI: Will is both expert and sponsor. Same human, two roles, two interface flows.
- **Expert flow** (Hermes): offer iteration, pricing instincts (sketched, not committed), persona / ICP, voice and copy direction.
- **Sponsor flow** (Polaris / engagement-governance): Trajectory approval, Weekly Slot reports, scope-change conversations.

Keep the asks separate even though they land in the same inbox. Different artifact, different approval cadence, different conversation.

See `/Users/nplmini/code/work/practices/expert-liaison/CLAUDE.md` and `/Users/nplmini/code/work/practices/engagement-governance/CLAUDE.md`.

## What you do not do here

- You do not produce KAI-facing copy that violates the voice rules in `reference/narrative.md`. Read them before writing.
- You do not invent new Constellations or Clusters. The eight Constellations are derived from first principles; expanding requires proof, not preference.
- You do not quote pricing in KAI-facing materials. Sketch tier shapes if needed; Will commits.
- You do not let "Play" be used where "Cluster" belongs, or vice versa.
- You do not slip the astronomical narrative when on-brand voice is required. It is the pitch frame, not optional flavor.

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
