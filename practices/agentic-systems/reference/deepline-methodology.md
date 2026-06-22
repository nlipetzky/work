# Deepline Methodology, Framework, and Process

**Document type:** Reference (external-tool study)
**Subject:** Deepline ... GTM execution platform (`getaero-io/gtm-eng-skills`)
**Owner:** Nick Lipetzky
**Created:** 2026-06-08
**Purpose:** Definitive reference for what Deepline is, how it organizes itself, and how to reason about when to use it. Source-of-truth document for studio-level decisions about Deepline adoption across engagements.

---

## 1. What Deepline is

Deepline is a CLI-driven GTM execution platform with three concrete layers:

1. **A CLI** (`deepline` binary) that wraps 50+ third-party data providers (Apollo, Crustdata, Clay, Hunter, HeyReach, Snowflake, etc.) behind a unified row-by-row enrichment model.
2. **A skill library** (Claude Code skills published at `getaero-io/gtm-eng-skills`) that gives an agent the routing, guardrails, and playbooks to operate the CLI without exhausting credits or producing garbage output.
3. **A Session UI / Playground** ... a live web surface where the operator watches enrichment runs row-by-row, can interject, re-run specific cells, and approve scaled spend.

The whole thing is built around one core primitive: **`deepline enrich`** ... a row-by-row processor over a CSV that calls providers, runs JS transforms, runs AI classifications, and writes results back to the CSV with full lineage. Everything else is scaffolding around that primitive.

The framework's design thesis is that GTM work is inherently row-shaped (per company, per contact, per signal), the failure modes are well-known (provider rate limits, identity false-positives, credit blowouts, context-window floods), and a disciplined CLI plus a documented skill library can convert tacit operator knowledge into reproducible runs.

---

## 2. The documentation hierarchy (the framework)

Deepline's skills are organized in four levels. This hierarchy IS the methodology.

### Level 1: The meta-skill (`deepline-gtm`)

Single file: `/Users/nplmini/.claude/skills/deepline-gtm/SKILL.md` (~14 KB).

This is the brain. It contains:
- Decision model for routing (what kind of task → which sub-doc)
- Safety gates (the approval-message contract, the pilot-first rule)
- Provider defaults and quality heuristics
- The "discovery order: companies first, then people" rule
- Hard-coded prohibitions (never `Read` a large CSV, never write to `/tmp`)
- The Session UI mandatory-plan requirement

It does not execute work. It governs the session that executes work.

### Level 2: Phase docs

Three deep workflow docs that sit next to the meta-skill:

- `finding-companies-and-contacts.md` ... discovery patterns, parallel execution, provider filter schemas, role-based search rules
- `enriching-and-researching.md` ... `deepline enrich` syntax, waterfall patterns, coalescing, `run_javascript` / `deeplineagent` routing, multi-pass pipelines
- `writing-outreach.md` ... cold email/LinkedIn copy, scoring, personalization, qualification frameworks

Plus `prompts.json`, a structured catalog of prompt templates the phase docs reference.

The meta-skill tells you "for this task, read this phase doc." You then load the phase doc, which contains the actual execution knowledge.

### Level 2.5: Recipes

Located at `/Users/nplmini/.claude/skills/deepline-gtm/recipes/`. Seven files:

| Recipe | Size | Purpose |
| --- | --- | --- |
| `account-orgchart.md` | 26.4 KB | Map org structure around a target person/company |
| `build-tam.md` | 1.1 KB | Build a TAM list from ICP criteria |
| `clay-to-deepline.md` | 23.9 KB | Convert Clay table to Deepline scripts |
| `linkedin-url-lookup.md` | 8.2 KB | Resolve LinkedIn URL with identity validation |
| `portfolio-prospecting.md` | 3.7 KB | Investor/accelerator portfolio prospecting |
| `small-business-prospecting.md` | 0.9 KB | Maps-style local-business prospecting |
| `workflows-hello-world.md` | 18.1 KB | Cloud workflow on cron or webhook |

A recipe is a step-by-step playbook for a specific named workflow. It encodes sequencing and provider choices that took many iterations to discover. The meta-skill explicitly instructs: **"trust recipes over generic guidance or your own intuition."**

### Level 3: Provider playbooks

Located at `/Users/nplmini/.claude/skills/deepline-gtm/provider-playbooks/`. 52 files, one per provider. Each documents that provider's quirks, cost shape, payload conventions, fallback behavior.

You open a provider playbook only when provider-specific behavior matters. The meta-skill's routing table gets you to the right one.

### Level 4 (implicit): `references/`

Cross-cutting reference material, currently 4 files. The most load-bearing is `references/cloud-workflow-builder.md` ... the schema spec for building persisted cloud workflows with triggers.

---

## 3. Skills vs recipes ... resolving the confusion

This is the single most confusing thing about Deepline's architecture, so it gets its own section.

A **skill** is the unit the Claude Code Skill tool discovers and invokes. It has YAML frontmatter with a name, description, and trigger phrases. Skills live in `~/.claude/skills/<skill-name>/`.

A **recipe** is a workflow playbook inside `deepline-gtm/recipes/`. It has no frontmatter, is not directly invocable by the Skill tool, and is read by the agent only after the meta-skill routes to it.

Several names appear in BOTH the skill list and the recipe list. That's because Deepline ships **shim skills** ... thin (~1 KB) wrapper skills whose only job is to make a recipe discoverable from a trigger phrase. Every shim does the same three things:

1. Invoke the `deepline-gtm` meta-skill
2. Tell the session to follow the meta-skill's routing
3. Additionally read the specific recipe at `../deepline-gtm/recipes/<recipe>.md`

So `build-tam` (the skill) is a 1 KB shim that delegates to `recipes/build-tam.md` (the actual 1.1 KB recipe). Same for `clay-to-deepline`, `linkedin-url-lookup`, `portfolio-prospecting`, `workflow-hello-world`.

Two recipes exist WITHOUT a wrapper shim: `account-orgchart` and `small-business-prospecting`. You can only reach them by being inside `deepline-gtm` and reading the recipe table. This is fine ... the meta-skill knows about them.

**Why this matters:** when you see a Deepline skill name, you're seeing the entry point, not the content. The content lives in the recipe, the phase docs, and the provider playbooks. Don't evaluate Deepline by reading the skill file ... read the recipe and phase docs.

---

## 4. The full skill inventory (11 skills total in the repo)

Published at `https://github.com/getaero-io/gtm-eng-skills/tree/main/skills`:

| Skill | Type | Installed locally? |
| --- | --- | --- |
| `deepline-gtm` | Meta-skill | Yes |
| `build-tam` | Shim | Yes |
| `clay-to-deepline` | Shim | Yes |
| `linkedin-url-lookup` | Shim | Yes |
| `portfolio-prospecting` | Shim | Yes |
| `workflow-hello-world` | Shim | Yes |
| `deepline-analytics` | Standalone (Snowflake/semantic layer) | Yes |
| `deepline-quickstart` | Standalone (demo recipe) | Yes |
| `deepline-feedback` | Standalone (bug/feedback channel) | Yes |
| `niche-signal-discovery` | Standalone (Won/Lost differential analysis) | No |
| `deepline-sdk` | Standalone (programmatic SDK usage) | No |

The two not installed locally are worth noting:
- **`niche-signal-discovery`** ... ICP analysis using Laplace-smoothed lift scoring on website + jobs text. Pulls Serper (search), Firecrawl (multi-page scrape), Crustdata (job listings). ~0.47 credits per company. Ships with three Python analysis scripts (no pip deps, stdlib only).
- **`deepline-sdk`** ... programmatic SDK usage path. Not reviewed in this study.

---

## 5. The process (the discipline)

The methodology is enforced through six process rules that the meta-skill makes mandatory.

### 5.1 Working directory FIRST

Before any file write, set up a descriptive project-local working directory:

```bash
WORKDIR="deepline/data/<descriptive-task-slug>" && mkdir -p "$WORKDIR"
```

Never write to `/tmp/` (system wipes on reboot ... permanent data loss for paid enrichment). Slugs must describe the task so the operator can find files later. Random `mktemp` names are forbidden.

### 5.2 Session UI plan BEFORE execution

Every task starts with publishing a plan to the Session UI:

```bash
deepline session start --steps '["Inspect CSV","Pilot rows 0:1","Approval gate","Full enrichment","Validate","Deliver"]' --user-prompt "Original ask"
```

Then step status updates as work progresses (`--update <i> --status running|completed|error`). Live sub-step messages via `deepline session status --message "..."` show what the agent is currently doing.

The operator monitors the Session UI in real time. Without the plan posted, the UI shows nothing and the operator has no visibility. This is non-negotiable in the methodology.

### 5.3 Pilot → approval → full run

Every paid action follows this sequence:

1. Run a 1-row pilot: `deepline enrich --rows 0:1 ...`
2. Compose the approval message using the strict 4-section template
3. Wait for explicit user confirmation
4. Run at full scope

The approval template:

```text
Assumptions
- <intent assumption 1>
- <intent assumption 2>

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

If any of the four sections is missing, the framework holds in `AWAIT_APPROVAL` state. No paid action runs.

### 5.4 Over-provision, then filter

When the user asks for N rows, start with ~1.4×N at the top of funnel. Every pipeline phase has natural falloff (contact search misses 15-20%, email waterfall misses 5-10%). Fighting to complete the hard rows wastes credits. Pull more, run the full pipeline, filter to the best N at the end. Drop incomplete rows without retrying.

This is one of the framework's most counterintuitive rules. The instinct is to chase missing data. The methodology says: provider coverage is a property of the company, not something effort overcomes.

### 5.5 Never load large CSVs into context

The single biggest failure mode the framework calls out: **never use the `Read` tool on a CSV with more than a handful of rows**. It exhausts the context window and produces zero output.

Approved alternatives:
- `deepline csv show --summary` (shape only)
- `deepline csv show --rows 0:2` (sample only)
- `deepline enrich` for any row-by-row work
- `ctx_execute` for ad-hoc CSV analysis in a sandbox
- Spawn an Explore subagent to answer questions about data without loading it

### 5.6 Output discipline

- Source CSVs are never edited in place. First pass uses `--output`. Subsequent passes can use `--in-place` on your own prior outputs only.
- Final output paths are explicit: `FINAL_CSV="${WORKDIR}/<name>.csv"`
- Any CSV created outside `deepline enrich` must be registered with the Session UI via `deepline session output --csv <path> --label "<label>"` so it appears as a table card.
- Lineage columns (especially `_metadata`) are preserved end-to-end.
- Final message reports exact `FINAL_CSV` and exact Playground URL.

---

## 6. The provider routing model

Deepline wraps 50+ providers and routes between them based on intent. The routing logic lives in the phase docs, not in the meta-skill.

Provider categories (used as `--categories` filters in `deepline tools search`):

- `company_search` ... account discovery
- `people_search` ... contact discovery
- `company_enrich` ... enrichment on known companies
- `people_enrich` ... enrichment on known people
- `email_finder` ... email discovery
- `email_verify` ... deliverability validation
- `phone_finder` ... phone discovery
- `research` ... web research, ad intel, technographics
- `automation` ... workflow/actor runs, browser automation
- `outbound_tools` ... Lemlist/Smartlead/Instantly/HeyReach actions
- `autocomplete` ... canonical filter value discovery
- `admin` ... credits, monitoring, schemas

Routing heuristics (selected):
- Broad discovery first via direct tool calls, then quality pass via AI-column orchestration
- Email finder waterfall default order: Hunter → Findymail → Prospeo → Leadmagic
- LinkedIn URL resolution: Apify actors are best; PDL as backup
- Email verification: Leadmagic primary, ZeroBounce for catch-alls
- Job-change recovery: Crustdata or PDL before Leadmagic fallbacks
- `deeplineagent` only after the direct discovery path is exhausted

The 52 provider playbooks cover the per-provider quirks. Read the playbook for any provider whose behavior, pricing, or payload shape matters to the task.

---

## 7. Cost discipline

10 credits = 1 USD. The framework's cost-control primitives:

1. **Pilot first**: 1-row pilots before any scaled run
2. **TAM-sizing hack**: most providers return total-match counts even when `limit: 1` ... pull 1 row to size the universe without paying for the full set
3. **Over-provision then filter** (not "retry until complete") avoids paying for the same failure at scale
4. **Spend cap in every approval message**: explicit max-spend the agent commits to not exceed
5. **`deepline billing balance` / `usage` / `limit`**: live cost tracking
6. **Reruns are idempotent**: successful cells persist by default; only `--with-force <alias>` triggers targeted recompute

The framework explicitly states: **"Do not depend on monthly caps as a hard risk control."** The pilot-and-approval gate is the real safeguard.

---

## 8. Output surfaces (where work shows up)

| Surface | What it's for |
| --- | --- |
| **CSV files in `WORKDIR`** | Lineage, intermediate state, final deliverable |
| **Playground sheet** | Live row-by-row visualization during a run; operator can re-run cells, inspect errors |
| **Session UI** | Plan steps, sub-step status, table cards, alerts. The "what is the agent doing right now" surface |
| **Snowflake / semantic layer** (`deepline-analytics`) | Long-term funnel + revenue analytics |

These compose: enrich writes to CSV, registers to Session UI for visibility, surfaces a Playground URL for live inspection, optionally feeds Snowflake for analytics.

---

## 9. Comparison to alternative systems

### vs Clay

| Dimension | Clay | Deepline |
| --- | --- | --- |
| Primary surface | Spreadsheet UI | CLI + CSV + Playground |
| Cost control | Soft (per-column credit display) | Hard (pilot-then-approval gate) |
| Reproducibility | Table-state, manual to fork | CSV lineage, scriptable, idempotent reruns |
| AI columns | Built-in Sculptor + AI columns | `deeplineagent` / `aiinference` blocks in enrich |
| Outbound activation | HeyReach via integration | HeyReach via provider call |
| Best for | Interactive exploration, operator-driven runs | Scripted, auditable, large-batch runs |
| Skill ceiling | Lower (it's a UI) | Higher (it's a CLI methodology) |

### vs n8n

n8n is a workflow runtime; Deepline is a data-processing methodology. They're orthogonal. n8n handles event-driven orchestration (webhooks, schedulers, integrations). Deepline handles row-by-row data work. The natural composition: n8n triggers Deepline runs (or Deepline cloud workflows) and routes their outputs into Airtable / Salesforce / Slack.

### vs custom Python/Node scripts

Deepline is "what you'd build if you wrote that custom script ten times." The framework's value is the discipline (pilot gates, lineage, rate-limit handling, session visibility), not the underlying calls.

---

## 10. When to use Deepline

**Strong fit:**
- Row-by-row enrichment at scale (>50 rows)
- Multi-provider waterfalls (email, LinkedIn URL, phone)
- ICP classification across a list (the play-criteria use case)
- Repeated playbook execution where reproducibility matters
- Anything where credit blowout would hurt and pilot-gates are valuable
- Operator wants live visibility into a long-running batch

**Weak fit / use something else:**
- One-off lookups under ~5 rows (use direct MCP tool call)
- Real-time event-driven workflows (n8n handles this better)
- Interactive exploration where you want to "see the table and click around" (Clay is better)
- Single-shot LLM-over-a-whole-table questions (not a Deepline primitive; write a `ctx_execute` script)

---

## 11. How Deepline composes with the studio's existing OS

The studio's current GTM stack:
- **Clay** for interactive exploration and operator-driven enrichment
- **n8n** for orchestration and event-driven flows (webhooks, schedulers, Airtable sync)
- **Airtable** as the observable control plane (Prospects, Events, source of truth post-activation)
- **HeyReach** for LinkedIn outbound execution
- **Salesforce** as CRM of record (Teknova engagement)
- **Supabase** for AOS runtime state

Deepline's natural slot:
- Replace Clay for **scripted, scaled, reproducible** enrichment passes where credit discipline matters
- Sit upstream of HeyReach as the "build the enriched contact CSV" layer
- Sit downstream of an n8n trigger when batch enrichment is the work
- Feed Airtable post-enrichment (pre-push) so Airtable remains the observable surface for the operator
- `deepline-analytics` plugs into Snowflake; complementary to Metabase if used

**What does NOT change:** Airtable remains the source of truth for engagement state. Deepline's CSV is interim. The skill's `_metadata` column preservation makes the handoff to Airtable clean.

---

## 12. Risks and frictions

1. **CLI methodology = high skill ceiling.** An operator who doesn't internalize the pilot-gate discipline can still burn credits if they bypass the framework.
2. **CSV-as-state vs Airtable-as-state.** The studio's existing rule is "Airtable is the observable surface." Deepline introduces a competing pre-activation surface (CSV + Playground). The composition rule must be explicit per engagement: where does data become "observable" and who owns that view.
3. **Two AI orchestrators (Clay AI columns and `deeplineagent`).** Avoid running both in the same engagement on the same data. Pick one per pipeline phase.
4. **Shim skills add noise to the skill list.** Eleven skills published, but only one (`deepline-gtm`) does the routing. Operators new to Deepline may try to invoke a shim and miss that the real content lives in recipes.
5. **No cross-table reasoning primitive.** Deepline cannot natively answer "tell me about this whole table." Aggregate questions require a row-level classifier + a separate aggregate pass. Worth knowing before reaching for it on the wrong kind of question.

---

## 13. Adoption recommendation for the studio

Use Deepline for the KAI Internal Medical Device Robotics play (Phase 1-6) as the dogfood test. Success criteria (worth writing down before Phase 1 runs):

- **Credit efficiency:** total spend per qualified contact lower than equivalent Clay run
- **Time-to-list:** time from "approved play" to "list in HeyReach" measurable and competitive
- **Operator satisfaction:** does Nick prefer the Session UI + Playground surface over Clay's spreadsheet for batch work
- **Error rate:** % of rows requiring manual cleanup post-enrichment

If Deepline wins on credit efficiency and reproducibility but loses on interactive exploration, the adoption pattern becomes: **Clay for design and small-batch iteration, Deepline for scaled execution.** That split is probably correct regardless of how the bake-off comes out.

`deepline-analytics` is independently useful for any engagement with Snowflake access ... add to the studio's analytics toolkit without needing to settle the Clay-vs-Deepline question first.

`niche-signal-discovery` is the right tool for ICP refinement after the play has generated Won/Lost data ... install when the KAI play reaches its first Won/Lost split.

---

## 14. Quick reference ... canonical paths

| Thing | Path |
| --- | --- |
| Meta-skill | `/Users/nplmini/.claude/skills/deepline-gtm/SKILL.md` |
| Phase doc: discovery | `/Users/nplmini/.claude/skills/deepline-gtm/finding-companies-and-contacts.md` |
| Phase doc: enrichment | `/Users/nplmini/.claude/skills/deepline-gtm/enriching-and-researching.md` |
| Phase doc: outreach | `/Users/nplmini/.claude/skills/deepline-gtm/writing-outreach.md` |
| Recipes directory | `/Users/nplmini/.claude/skills/deepline-gtm/recipes/` |
| Provider playbooks (52) | `/Users/nplmini/.claude/skills/deepline-gtm/provider-playbooks/` |
| Cross-cutting references | `/Users/nplmini/.claude/skills/deepline-gtm/references/` |
| Skill repo (source) | `https://github.com/getaero-io/gtm-eng-skills` |
| CLI install / reinstall | `curl -s "https://code.deepline.com/api/v2/cli/install" \| bash` |
| Billing dashboard | `https://code.deepline.com/dashboard/billing` |
