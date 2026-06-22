# Deepline Tactical Execution Discipline

**Document type:** Reference (deep-dive on Deepline's operational discipline)
**Pairs with:** `deepline-methodology.md`, `deepline-user-experience.md`
**Subject:** The complete set of rules, primitives, and command patterns that constitute Deepline's tactical execution layer
**Owner:** Nick Lipetzky
**Created:** 2026-06-08
**Purpose:** Definitive reference for the operational discipline Deepline imposes. The methodology doc explains the architecture; the UX doc explains what the operator sees; this doc explains the rules the framework enforces during execution.

---

## 0. What "tactical execution discipline" means here

Deepline's responsibility scope is bounded. It does not define your offer, ICP, segment, messaging, or campaign theory ... those belong upstream in the studio's strategic layer (`offer-extract`, `segment-criteria`, `creative-brief`, `copy-draft`).

Deepline's domain is what happens **after** a GTM task has been well-defined and **before** the output lands in an activation tool (HeyReach, Salesforce, Airtable, etc.). Within that bounded scope, the framework enforces 14 distinct disciplines. Each is documented below with the rules, the rationale, the command shapes, and the violation/recovery patterns.

A "discipline" here means: a rule the framework expects the agent to follow without prompting, with explicit consequences for violating it. Most violations are silent ... the framework doesn't error, but the outcome degrades (credit blowout, garbage data, context-window flood, lost work).

---

## 1. Documentation discipline

**Rule:** Before any execution, read the relevant docs in the correct hierarchical order.

### The order

1. **Meta-skill SKILL.md** ... `/Users/nplmini/.claude/skills/deepline-gtm/SKILL.md`. Routing decisions only. Always loaded.
2. **Phase doc** ... one of `finding-companies-and-contacts.md`, `enriching-and-researching.md`, `writing-outreach.md`. Pick by task type.
3. **Recipe** ... `recipes/<task>.md`. Read if the task matches a named playbook.
4. **Provider playbook** ... `provider-playbooks/<provider>.md`. Read for any provider whose behavior, pricing, or payload shape matters.

The framework states: **"READING MULTIPLE DOCS IS A GREAT IDEA AND OFTEN SUPER ESSENTIAL. JUST READ MORE."**

### Why this exists

The docs encode hard-won knowledge from hundreds of real runs. They contain validated parameter schemas, correct filter syntax, parallel execution patterns, tested sample payloads, and known pitfalls. Reading a doc for 5 seconds saves you from 10 failed tool calls, wasted credits, and garbage output. The cost of skipping is non-obvious: agents that try to "figure it out" from first principles re-discover the same failure modes that are already solved in the docs.

### What violation looks like

- Agent calls `deepline tools execute` with guessed parameters → provider returns error or garbage
- Agent picks wrong provider for a task → wastes credits on a non-fit
- Agent runs sequentially what should be parallel → wastes wall-clock time
- Agent skips the recipe and improvises → re-derives the same wrong answers other agents already learned to avoid

### Recovery

Restart the task. Read the docs. The framework will not catch this for you ... it is enforced by convention and by the skill's explicit instructions.

---

## 2. Working directory discipline

**Rule:** Before any file write, set up a descriptive project-local working directory.

### The pattern

```bash
WORKDIR="deepline/data/<descriptive-task-slug>" && mkdir -p "$WORKDIR" && echo "$WORKDIR"
```

### Three sub-rules

1. **Never `/tmp/`** ... system wipes on reboot. Permanent loss of paid enrichment work. This is the framework's #1 data-loss risk.
2. **Never `mktemp`-style random names** ... the operator must be able to find the files later.
3. **Slug must describe the task** ... `kai-medrobotics-v0`, `acme-email-waterfall`, `yc-cmo-outbound`. Not `run1`, `test`, `data`.

### Why this exists

Paid enrichment output represents the most valuable artifact a session produces. The framework's design assumption is that *every* enrichment CSV is worth keeping and findable later. Random temp paths break both.

### What violation looks like

- Files written to `/tmp/enrich-output.csv` → gone after reboot
- Files written to working directory but with non-descriptive names → operator can't find them next week

### Recovery

If the agent has already written to `/tmp`, copy the files to a proper `WORKDIR` immediately before the system reboots. Then enforce the rule on the next task.

---

## 3. Session UI plan discipline

**Rule:** Post the execution plan to the Session UI before running any provider command. This is step zero of every task.

### The contract

```bash
deepline session start \
  --steps '["Inspect CSV","Search providers","Pilot rows 0:1","Approval gate","Full enrichment","Validate","Deliver"]' \
  --user-prompt "Original user request verbatim"
```

Then immediately mark the first step running:

```bash
deepline session start --update 0 --status running
```

### Step status states

Valid statuses for any step: `pending`, `running`, `completed`, `error`, `skipped`.

### Live sub-step messages

For emergent work that the original plan couldn't predict:

```bash
deepline session status --message "Extracting company domains from Apollo response"
deepline session status --message "LeadMagic returned no results, falling back to ZeroBounce"
deepline session status --message "Validating 23 catch-all emails"
```

Each new status message marks the previous one as done and appears as the active sub-step. Lightweight ... use freely.

### Anti-patterns

- **Don't re-post `--steps` at the end to mark completion.** `--steps` is a full `set_plan` replace and wipes incremental step/sub-step history. Use `--update <i> --status completed` instead.
- **Don't re-post `--steps` mid-run unless plan structure truly changes.** Wipes history.
- **Don't skip `--user-prompt` if you know the original ask.** It preserves opted-in prompt telemetry for product improvement.

### Recovery from `step_index not found (0 steps)`

If `--update` fails with that error, the plan was lost. Recover by posting `--steps` once, then resume `--update` calls normally.

### Why this exists

The Session UI is the operator's live visibility surface. Without the plan posted, the UI is blank and the operator has no way to know what the agent is doing. The framework treats operator visibility as a hard requirement, not a nice-to-have.

---

## 4. Pre-execution data inspection discipline

**Rule:** When given a CSV, inspect its shape before doing anything else.

### The pattern

```bash
deepline csv show --csv <path> --summary
```

Returns row count, column list, sample values. Free, fast, safe.

For a deeper sample:

```bash
deepline csv show --csv <path> --rows 0:2
```

Returns two rows with full field values. Still safe.

### Hard prohibition

**NEVER use the `Read` tool on a large CSV.** This is the framework's most-emphasized rule. Reading CSV rows into the conversation window exhausts context and produces zero output. It is the single most common failure mode the framework documents.

### Approved alternatives for "I need to understand this CSV"

| Use case | Tool |
| --- | --- |
| Shape, columns, sample | `deepline csv show --summary` |
| Two-row inspection | `deepline csv show --rows 0:2` |
| Ad-hoc analysis (counts, filters, distributions) | `ctx_execute` with shell or python in sandbox |
| "What's in this CSV" question | Spawn Explore subagent ... raw data stays in subprocess |
| Row-by-row processing | `deepline enrich` (the entire point of the platform) |

### Why this exists

CSVs in this domain routinely contain thousands of rows with many columns. A single Read call on a 500-row CSV can consume 50KB+ of context, and a 5000-row CSV can consume the entire window. The framework's design assumption is that the agent must reason about the CSV without holding it in the conversation.

### What violation looks like

- Agent calls Read on `companies.csv` → conversation window dies mid-task
- Agent calls Grep on a large CSV without sandbox → same outcome
- Output of `cat large.csv` or `head -n 100 large.csv` in Bash → context flooded

### Recovery

Start a fresh session. Insist the agent use approved alternatives.

---

## 5. Provider selection discipline

**Rule:** Use `deepline tools search` to find providers. Do not guess.

### The pattern

```bash
# Broad search by intent
deepline tools search investor

# Narrow by category
deepline tools search --categories company_search --search_terms "investors,funding"
deepline tools search --categories people_search --search_terms "title filters,linkedin"

# Find tools by provider prefix
deepline tools search investor --prefix crustdata
```

Always run **2-4 synonyms in parallel** for the same intent. Don't search once and assume the first result is best.

### Category vocabulary (12 categories)

| Category | Purpose |
| --- | --- |
| `company_search` | Account/company discovery |
| `people_search` | People/contact discovery |
| `company_enrich` | Enrichment on known companies |
| `people_enrich` | Enrichment on known people |
| `email_finder` | Email lookup/discovery |
| `email_verify` | Email deliverability validation |
| `phone_finder` | Phone lookup/discovery |
| `research` | Web research, ad intel, technographics, job search |
| `automation` | Workflow-style tools, browser/actor runs, batch automation |
| `outbound_tools` | Lemlist/Smartlead/Instantly/HeyReach actions |
| `autocomplete` | Canonical filter value discovery before search |
| `admin` | Credits, monitoring, logs, schemas |

### Search-term ranking hints

`--search_terms` accepts hints like `structured filters`, `title filters`, `api native`, `autocomplete`, `bulk`.

### Anti-patterns

- `deepline tools search stuff` ... too generic
- `deepline tools search search across filters` ... nonsensical query
- Calling `deepline tools execute <provider>` directly without searching first ... guesses the provider

### Why this exists

50+ providers wrapped behind a unified interface. The catalog changes (new providers, deprecated ones, renamed tools). Hard-coding provider names from memory leads to wrong-tool selection. Search is the source of truth.

---

## 6. The `deepline enrich` primitive ... the central execution surface

**Rule:** For any row-by-row processing (5+ rows), use `deepline enrich`. For one-offs (under 5 rows), `deepline tools execute` is acceptable.

### Why `enrich` is the default

The framework lists six reasons:

1. **Row-safe** ... each pass is explicit and traceable
2. **UI-safe** ... progress, errors, outputs visible in Session UI/Playground; operator can interject
3. **Retry-safe** ... rerun from a known pass, not full actor chains
4. **Scale-safe** ... large results stay in CSV lineage, easy to inspect/filter
5. **Auto-batches + rate-limit safe** ... most providers have rate limits you don't know about; enrich manages them for you
6. **Lower risk** ... fewer custom orchestration scripts and hidden assumptions

### Column types (the enrich "step shape" vocabulary)

A `deepline enrich` column is a JSON object with three required keys plus optional payload:

```json
{
  "alias": "first_name",
  "tool": "run_javascript",
  "payload": { "code": "return (row[\"fullName\"]||\"\").trim().split(\" \")[0]||null;" }
}
```

Tool types:

| Tool | When to use |
| --- | --- |
| `run_javascript` | Deterministic transforms, template logic, coalescing, field extraction. Non-AI. |
| `aiinference` | General classification or structured reasoning. AI, no web access. |
| `deeplineagent` | Context gathering, web research, signal extraction. AI with tool access. |
| `extract_js` | Parse a structured response into specific fields. |
| Provider tool (e.g. `hunter_email_finder`) | Direct provider call with the row's fields as inputs. |

### Runtime contract for `run_javascript`

The current row is auto-injected as `row` at runtime. You do NOT pass `row` yourself in payload. Put JS in `payload.code` as a string.

### CSV file safety rules

- **Never enrich a source CSV in-place.** Always use `--output` on the first pass.
- **`--in-place` is for iterating on your own prior outputs only.** Never on source files.
- **For reruns:** successful cells persist by default. Use `--with-force <alias>` only for targeted recompute.

### Pilot pattern

```bash
deepline enrich --input source.csv --output worked.csv --rows 0:1 ...
```

Always end-exclusive ranges. `0:1` is one row (row 0). `0:5` is five rows (rows 0-4).

### One-row pilot is mandatory before scaled run

The framework states: **"Must run a real pilot on the exact CSV for full run."** No exceptions. If the pilot fails, fix it and re-run until successful before asking for approval. Approval messages with no real pilot are framework violations.

---

## 7. Coalescing and waterfall discipline

**Rule:** When multiple providers can produce the same field (email, LinkedIn URL, phone), run a waterfall and coalesce.

### Pattern

Multiple `--with` columns, each calling a different provider, then a final `run_javascript` column that picks the first non-empty value:

```bash
deepline enrich --input contacts.csv --output enriched.csv \
  --with '{"alias":"email_hunter","tool":"hunter_email_finder","payload":{...}}' \
  --with '{"alias":"email_findymail","tool":"findymail_search","payload":{...}}' \
  --with '{"alias":"email_prospeo","tool":"prospeo_finder","payload":{...}}' \
  --with '{"alias":"email_leadmagic","tool":"leadmagic_b2b","payload":{...}}' \
  --with '{"alias":"email","tool":"run_javascript","payload":{"code":"return row.email_hunter || row.email_findymail || row.email_prospeo || row.email_leadmagic || null;"}}'
```

### Default waterfall orders

- **Email finder:** Hunter → Findymail → Prospeo → Leadmagic
- **LinkedIn URL:** Apify LinkedIn actor → PeopleDataLabs (PDL) → Crustdata
- **Email verification:** Leadmagic first, then ZeroBounce for catch-alls
- **Job-change recovery:** Crustdata person enrichment or PDL before Leadmagic fallbacks

### Quality-first vs cost-first

- **High-stakes outreach (named senders, executive lists):** Start with quality providers (Crustdata, PDL). Use cheap providers as fallback only.
- **Volume discovery (TAM, prospecting):** Start with cheap broad providers (Apollo, Findymail). Use quality providers to fill gaps.

### Never single-source for high-value outreach

The framework states: **"Never treat one provider response as single-source truth for high-value outreach."** Always corroborate across at least two providers when the cost of a wrong record is high.

---

## 8. Approval gate discipline ... the framework's central safety primitive

**Rule:** Every paid full-run waits on an explicit user approval. No exceptions.

### The four-section template (verbatim)

```markdown
Assumptions
- <intent assumption 1>
- <intent assumption 2>
- <intent assumption 3>

CSV Preview (ASCII)
<verbatim output from deepline enrich --rows 0:1>

Credits + Scope + Cap
- Provider: <name>
- Estimated credits: <value or range>
- Full-run scope: <rows/items>
- Spend cap: <cap>
- Pilot summary: <one short paragraph>

Approval Question
Approve full run?
```

### Strict format contract (blocking)

The framework explicitly states:

1. Use the **exact four section headers**: Assumptions, CSV Preview (ASCII), Credits + Scope + Cap, Approval Question.
2. If any required section is missing, remain in `AWAIT_APPROVAL` and do not run paid/cost-unknown actions.
3. Only transition to `FULL_RUN` after explicit user confirmation.

### Required content checklist

Every approval must include:

1. **Provider(s)** ... which APIs will be called
2. **Pilot summary** ... what the 1-row pilot showed
3. **Intent-level assumptions** (3-5 one-line bullets) ... what the agent inferred from the request
4. **CSV preview from a real pilot** ... `deepline enrich --rows 0:1` ASCII output, verbatim
5. **Credits estimate** ... range or specific value
6. **Full-run scope size** ... how many rows or items
7. **Max spend cap** ... hard ceiling the agent commits to
8. **Approval question** ... literally "Approve full run?"

### Alert the Session UI before asking

```bash
deepline session alert --message "Approval needed: run enrichment on N rows (~X credits)"
```

This pings the operator's Session UI so they know to check the chat. Without it, the operator may not notice the approval is waiting.

### Mandatory pilot

The pilot is not negotiable:

- Must run a real pilot on the exact CSV for the full run
- Must use `--rows 0:1` (or appropriate small slice)
- Must include the ASCII preview verbatim in the approval
- If pilot fails, fix and re-run until successful before asking

### State machine

| State | What's allowed |
| --- | --- |
| `AWAIT_APPROVAL` | No paid actions. Agent waits indefinitely. |
| `FULL_RUN` | Paid action proceeds at the approved scope, capped at the stated max spend. |

There is no implicit transition. The agent must wait for an explicit "yes" from the operator before transitioning to `FULL_RUN`.

---

## 9. Cost discipline

**Rule:** Treat credits as a hard resource. Never depend on monthly caps as risk control.

### The framework's cost primitives

1. **Pilot first** ... every paid action gets a 1-row dry run
2. **TAM-sizing hack** ... most providers return total-match counts even when `limit: 1`. Pull 1 row to size the universe without paying for the full set.
3. **Over-provision then filter** ... see Section 10
4. **Provider preference by billing model** ... prefer providers that charge on returned results or successful hits over per-attempt billing when coverage is uncertain. Per-attempt billing burns credits on misses.
5. **Stop on bad pilot** ... if first rows show low usable coverage, wrong-person/company matches, missing getters, or high cost per usable row, change route/provider order before scaling.
6. **Spend cap in approval message** ... every approval commits to a hard ceiling.

### Live cost commands

```bash
deepline billing balance   # Current credit balance
deepline billing usage     # Recent activity and grouped recent usage
deepline billing limit     # Current monthly billing cap
```

When credits hit zero: top up at `https://code.deepline.com/dashboard/billing`.

### Pricing

**10 credits = 1 USD.** Common per-row costs:

- Serper search: 0.02 credits
- Firecrawl scrape: 0.05 credits
- Crustdata enrichment: 0.40 credits
- Apollo person search: variable (per-result)
- Email validation (Leadmagic): ~0.01-0.05 credits per email

A 1000-row contact enrichment with full waterfall typically lands in the 50-200 credit range ($5-$20).

### Reruns

Successful cells persist by default. Reruns only re-fire what's missing or what's force-flagged. This means:

- Re-running an enrichment is cheap (only retries failed cells)
- Forcing a column refresh costs full credits on every row
- The framework optimizes for "iterate on the same CSV many times" over "run from scratch each time"

---

## 10. Over-provision-then-filter discipline

**Rule:** When the user asks for N rows, start with ~1.4×N. Filter at the end. Never chase missing rows.

### The pipeline

1. Pull more candidates than needed at the top of funnel (e.g., 35 for 25 target)
2. Run the full pipeline (contacts → emails → outbound)
3. At the end, filter to the best N complete rows
4. Drop incomplete rows ... don't retry or manually patch

### Why this is counterintuitive but correct

The instinct is to chase missing data: "we needed 25 but only got 22, let me try a fallback provider for the missing 3." The framework explicitly forbids this:

- Provider coverage is a property of the company, not something effort overcomes
- Tiny startups (5 employees) often have zero coverage across all providers ... no amount of retrying helps
- Each retry costs credits and rarely changes the outcome
- Per-pipeline-phase falloff is predictable: contact search misses 15-20%, email waterfall misses 5-10%

### What NOT to do

- Trim results to exactly N before running the pipeline (no buffer for falloff)
- Spend turns retrying failed lookups with fallback providers
- Run broad `deeplineagent` research passes just to fill gaps in a few rows
- Manually patch incomplete rows post-hoc

### Sizing math

For a target of N delivered rows:

| Pipeline shape | Multiplier |
| --- | --- |
| Discovery → enrichment | 1.4×N |
| Discovery → enrichment → outbound activation | 1.5-2×N |
| Discovery → enrichment → personalization → outbound | 2×N |

The multiplier grows with each phase that introduces falloff.

---

## 11. Output discipline

**Rule:** Outputs must be findable, registered to the Session UI, and reported with exact paths.

### Sub-rules

1. **Single final CSV path** ... declare it explicitly: `FINAL_CSV="${WORKDIR}/<requested_filename>.csv"`
2. **Lineage columns preserved end-to-end** ... especially `_metadata`. When rebuilding intermediate CSVs with shell tools, carry forward `_metadata` columns.
3. **Source CSVs never edited in place** ... first pass uses `--output`; subsequent passes can use `--in-place` on your own prior outputs only.
4. **Register external CSVs to Session UI** ... if you created a CSV outside `deepline enrich`, register it so a table card appears:
   ```bash
   deepline session output --csv <path> --label "My Results"
   ```
5. **Final message reports exact paths** ... `FINAL_CSV` path + Playground URL. No vague references like "the output file."
6. **Don't paste CSV rows into chat** ... send paths, not pasted data, unless explicitly requested.

### Post-run inspection

Before declaring done, run the post-run inspection script pattern from `enriching-and-researching.md`. Verify row counts, column completeness, and any flagged anomalies in one pass.

### Backend shutdown

When execution work is complete:

```bash
deepline backend stop --just-backend
```

Unless the operator asked to keep it running for follow-up work. Without explicit shutdown, the backend continues to consume resources.

---

## 12. Context-window discipline

**Rule:** Keep raw data out of the conversation window. Process in sandboxes; print only summaries.

### The hierarchy of safe operations

1. **`ctx_batch_execute(commands, queries)`** ... runs multiple commands, auto-indexes output, returns search results. One call replaces 30+ individual calls. Use as default for any multi-command gathering.
2. **`ctx_search(queries: [...])`** ... query previously-indexed content. Batch all questions in one call.
3. **`ctx_execute(language, code)` / `ctx_execute_file(path, language, code)`** ... sandbox execution. Only stdout enters context.
4. **`ctx_fetch_and_index(url, source)`** then **`ctx_search(queries)`** ... fetch web content, chunk, index, query. Raw HTML never enters context.

### Hard prohibitions

- **No `curl`/`wget` in Bash** ... blocked. Use `ctx_fetch_and_index` or `ctx_execute(language: "javascript")` with `fetch`.
- **No `WebFetch`** ... blocked. Use `ctx_fetch_and_index`.
- **No inline HTTP in Bash** ... `fetch('http`, `requests.get`, `requests.post`, `http.get`, `http.request` are all intercepted.
- **No `Read` on large files for analysis** ... only for files you're about to Edit.
- **No `Grep` with large output to Bash** ... use `ctx_execute(language: "shell", code: "grep ...")`.

### What "Bash is for" within Deepline workflows

Bash is approved only for:

- `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`
- `npm install`, `pip install`
- Other short-output commands

Anything that produces >20 lines of output should route through `ctx_execute` or `ctx_batch_execute`.

---

## 13. Subagent discipline

**Rule:** When spawning subagents for parallel work, the routing block is auto-injected.

### What this means in practice

If you spawn a Task/Agent subagent for any GTM work, the system automatically:

1. Injects the context-mode routing block into the subagent's prompt
2. Upgrades Bash-only subagents to `general-purpose` so they have MCP tool access
3. Inherits the framework's discipline rules in the subagent's context

You do NOT need to manually instruct subagents about context-mode, working directory rules, or the approval gate. They inherit it.

### When to spawn parallel subagents

- **Coverage completion at scale** ... e.g., "find contacts at these 50 companies" → spawn 5 subagents, 10 companies each
- **Multi-provider discovery** ... e.g., search Apollo + Crustdata + PDL in parallel for the same company set
- **Independent enrichment phases** ... when phase B doesn't depend on phase A's output, run them concurrently

### When NOT to spawn parallel subagents

- Single-task linear pipelines (use one agent, run sequentially)
- Tasks where each row needs different logic (the parallelism is in `deepline enrich`'s row-level batching, not in subagents)

The framework's `finding-companies-and-contacts.md` doc has the subagent orchestration patterns explicitly named.

---

## 14. Apify actor selection discipline

**Rule:** When using Apify actors, follow the framework's canonical selection policy.

### Selection sequence

1. **If user provides actor ID/name/URL:** use it directly. No discovery search.
2. **If not:** check `deepline tools get apify_run_actor_sync` for the actor ID, or try `deepline tools search`.
3. **If not present:** run discovery search via `apify_list_store_actors`.
4. **Avoid rental-priced actors.**
5. **Pick high rating + high usage/run count.** Tie-breaker: best evidence-quality/price balance.
6. **Honor `operatorNotes` over public ratings when conflicting.**

### Hard preferences

- **LinkedIn post scraping:** prefer `supreme_coder/linkedin-post` for generic posts/search URLs; `harvestapi/linkedin-post-reactions` when the goal is engagers/reactions.
- **Avoid:** `silentflow/linkedin-posts-scraper-ppr` and `alizarin_refrigerator-owner/linkedin-post-scraper` unless the user explicitly asks.

### Sites requiring auth

If the target site needs login: **do not use Apify.** Tell the user to use Claude in Chrome or guide them through Inspect Element to get a curl command with headers (user is non-technical). Apify cannot handle authenticated sessions reliably.

### Discovery + schema lookup pattern

```bash
deepline tools execute apify_list_store_actors \
  --payload '{"search":"linkedin company employees scraper","sortBy":"relevance","limit":20}'

deepline tools execute apify_get_actor_input_schema \
  --payload '{"actorId":"bebity/linkedin-jobs-scraper"}'
```

Always inspect the input schema before running. Apify actors have wildly varying parameter shapes.

---

## 15. Feedback discipline

**Rule:** Send feedback proactively when meaningful failures occur. Don't wait for the operator to ask.

### Triggers

- A provider/tool call fails repeatedly
- Output is clearly wrong for the requested task
- A CLI/runtime bug blocks completion
- You needed a significant workaround to finish

### The command

```bash
deepline provide-feedback "Goal: <goal>. Tool/provider/model: <details>. Failure: <what broke>. Error: <exact message>. Repro attempted: <steps>."
```

### Cadence rules

- One feedback per issue cluster ... don't spam multiple reports for the same root cause
- Include enough detail to reproduce: workflow goal, tool/provider/model, failure point, exact error, steps tried

### End-of-session consent gate

At the end of every completed run, the agent must ask exactly one question:

*"Would you like me to send this session activity to the Deepline team so they can improve the experience? (Yes/No)"*

- **Yes** → `deepline session send --current-session`
- **No** → do not send

Ask once per completed run. Do not nag.

---

## 16. Rate-limit and CLI health discipline

**Rule:** Use `deepline enrich` for heavy work (auto-handled). For homegrown scripts, assume no automatic rate-limit handling.

### What enrich handles automatically

- Adaptive retries with backoff
- Per-provider rate-limit awareness
- Auto-batching at provider-appropriate sizes
- Concurrency tuning

### What homegrown `run_javascript` blocks do NOT get

If you write your own JS that calls provider APIs directly (via `fetch`), you are NOT inheriting `enrich`'s rate-limit handling. You must implement backoff yourself or you will hit 429s at scale.

### Recovery: reinstall the CLI

If enrichment or CLI behavior is unstable:

```bash
curl -s "https://code.deepline.com/api/v2/cli/install" | bash
```

The installer ensures the latest CLI and client wiring are in place. Run this first before debugging mysterious behavior.

---

## 17. Definitions and defaults discipline

**Rule:** When user input is absent, apply documented defaults. Always disclose active defaults as assumptions in the approval message.

### Time windows (from `enriching-and-researching.md`)

The phase doc defines canonical interpretations for fuzzy GTM terms ... what "recent" means, what "active" means, what "growing" means. The agent must use these definitions and disclose them when they're load-bearing.

### Override rule

User-specified values always override defaults. If the user says "find people who changed jobs in the last 90 days," that overrides the default 180-day "recent job change" window.

### Disclosure in approval messages

The Assumptions section of every approval message lists active defaults:

```text
Assumptions
- "Recent funding" interpreted as last 12 months (default)
- "Growing companies" interpreted as >10% headcount growth YoY (default)
- "Senior leadership" defined as VP+ titles (default)
- Geography restricted to US/Canada (user-specified)
```

This protects the operator from silent assumption drift.

---

## 18. The execution lifecycle ... putting it all together

A complete Deepline task follows this sequence. Each step references the discipline section above.

1. **Read docs** (§1) ... meta-skill, then phase doc, then recipe, then provider playbook
2. **Set up working directory** (§2) ... `deepline/data/<task-slug>/`
3. **Post Session UI plan** (§3) ... `deepline session start --steps ... --user-prompt ...`
4. **Mark step 0 running** (§3) ... `deepline session start --update 0 --status running`
5. **Inspect input CSV** (§4) ... `deepline csv show --summary`
6. **Search for providers** (§5) ... `deepline tools search ...` in parallel
7. **Run 1-row pilot** (§6, §8) ... `deepline enrich --rows 0:1 --output pilot.csv ...`
8. **Alert Session UI** (§8) ... `deepline session alert --message "Approval needed: ..."`
9. **Compose 4-section approval message** (§8) ... post to chat
10. **Wait for approval** (§8) ... hold in `AWAIT_APPROVAL` state
11. **Run full enrichment** (§6, §9, §10) ... `deepline enrich --output final.csv ...` with over-provisioning
12. **Update Session UI as work progresses** (§3) ... per-step status, sub-step messages
13. **Register output** (§11) ... `deepline session output --csv <path> --label "..."`
14. **Post-run inspection** (§11) ... verify row counts, column completeness
15. **Report final paths + Playground URL** (§11)
16. **Ask end-of-session consent** (§15) ... session send Yes/No
17. **Stop backend** (§11) ... `deepline backend stop --just-backend`

Every task. Every time. The discipline is the framework.

---

## 19. Violation patterns and recovery

Common violations the framework cannot prevent (because they're agent-side discipline failures), and how to recover.

### Violation: Agent skipped the pilot

**Symptom:** Approval message has no CSV Preview section, or has fabricated/placeholder content.
**Recovery:** Refuse the approval. Ask for a real pilot with verbatim preview.

### Violation: Agent ran paid action without approval

**Symptom:** Credits consumed without a 4-section approval message in chat.
**Recovery:** Check `deepline billing usage` to confirm spend. Stop the agent. Insist on framework adherence on the next task.

### Violation: Agent loaded large CSV with Read

**Symptom:** Conversation window dies, agent becomes unresponsive or starts producing degraded output.
**Recovery:** Start a fresh session. Insist on `deepline csv show` or Explore subagent.

### Violation: Agent chased missing rows instead of over-provisioning

**Symptom:** Multiple turns spent on fallback providers for a small number of missing contacts; total credit spend bloated.
**Recovery:** Stop the chase. Accept the incomplete rows. Over-provision next time.

### Violation: Agent wrote to `/tmp/`

**Symptom:** Output files in `/tmp/` instead of `deepline/data/<task-slug>/`.
**Recovery:** Copy files to a proper WORKDIR immediately. Enforce rule on next task.

### Violation: Agent re-posted `--steps` to mark completion

**Symptom:** Session UI step history wiped; sub-step messages lost.
**Recovery:** Future steps must use `--update <i> --status completed`. The lost history is gone.

### Violation: Agent treated single-provider response as truth for high-value outreach

**Symptom:** Final list has emails from one provider only with no corroboration.
**Recovery:** Run a verification pass (Leadmagic) before activation. Future runs must coalesce across 2+ providers.

### Violation: Agent guessed provider parameters without searching

**Symptom:** Provider returns errors, wrong-shape output, or unexpected fields.
**Recovery:** Restart the task. Use `deepline tools search` first.

---

## 20. Quick-reference checklist

Print or pin this. Every Deepline task should hit every item.

### Before execution
- [ ] Read meta-skill SKILL.md
- [ ] Read relevant phase doc
- [ ] Read relevant recipe (if applicable)
- [ ] Read relevant provider playbook (if behavior matters)
- [ ] Set up `WORKDIR="deepline/data/<descriptive-slug>"`
- [ ] Post Session UI plan with `--user-prompt`
- [ ] Mark step 0 running

### During discovery / setup
- [ ] Inspect input CSV with `deepline csv show --summary` (don't Read it)
- [ ] Search providers with `deepline tools search` (2-4 parallel queries)
- [ ] Pick provider based on category + cost + quality, not memory

### Before paid action
- [ ] Run 1-row pilot with `--rows 0:1`
- [ ] Verify pilot output quality
- [ ] Alert Session UI of pending approval
- [ ] Compose 4-section approval message (Assumptions, CSV Preview, Credits+Scope+Cap, Approval Question)
- [ ] Wait for explicit user confirmation

### During full run
- [ ] Update Session UI step statuses
- [ ] Send sub-step messages for emergent work
- [ ] Don't chase failed rows (over-provision protects you)
- [ ] Coalesce across providers for high-value data

### After completion
- [ ] Register output CSVs via `deepline session output`
- [ ] Run post-run inspection
- [ ] Report exact FINAL_CSV path
- [ ] Report exact Playground URL
- [ ] Ask end-of-session consent question
- [ ] Stop backend with `deepline backend stop --just-backend`

---

## 21. The discipline-as-product thesis

Deepline's value proposition, stripped of marketing, is **codified tactical discipline**. The 14 disciplines above are what you'd write down if you'd burned $50k in Clay credits over two years and were forced to document what you learned. The framework converts that tacit knowledge into agent-enforceable rules.

The implication for adoption: Deepline is most valuable when:

- You run GTM tasks frequently (the discipline amortizes)
- You've previously had credit blowouts or garbage outputs (the safety primitives prevent recurrence)
- You want runs to be reproducible across operators or sessions (the standardization enables this)
- You're delegating execution to AI agents (the framework gives the agent guardrails)

Deepline is least valuable when:

- You run one-off lookups (the overhead exceeds the benefit)
- You're doing interactive exploration (Clay's UX is better)
- Your real bottleneck is upstream (offer, ICP, message) ... discipline downstream doesn't fix that

The studio's use case (repeated client engagements, AI-agent-driven execution, high cost of credit waste, value on reproducibility) maps cleanly to where Deepline's discipline pays off.
