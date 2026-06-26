# The anatomy of a system (standardized)

Date: 2026-06-23. Owner: Boris (agentic-systems). Purpose: the canonical list of everything that makes
up an agentic system, so every system can be described and *rendered* the same way. This is the data
model behind the standardized visual system view in projection-ui (`/system`).

Reconciled with the live canon schema: `public.systems` (rich), `public.activities` (the run layer),
`public.assets` (what it owns). Each part below notes where it already lives in canon and what's a gap.
Not every system has every part ... a pure deterministic system has no AI component, and that is a
*better* outcome, not a missing one (see the system-building methodology, §2a).

## The ten parts

### 1. Identity ... what it is and why it exists
- name, slug
- **purpose** ... the one line of what it *ensures* (not what it does)
- **ladders to** ... goal → vision (every system traces up, or it's a flag)
- **lifecycle** ... emerging → building → operating → archived
- **owner** ... the practice/persona accountable
- **type / class** ... its dominant architecture (code / workflow / agent) and registry class
- *Canon:* `systems.{name, system_slug, purpose, goal_id, status, owner, system_type, class, definition_maturity, constellation}`. Mostly present.

### 2. Trigger ... what starts it
- trigger type: schedule (cron) / event / webhook / manual / continuous
- trigger source (the cron, the webhook, the upstream event, the human)
- *Canon gap:* not modeled as a first-class field today. Add `trigger_type` + `trigger_source`.

### 3. The AI component ... the brain (only if the system uses a model)
The augmented LLM (per "Building Effective Agents" + context engineering). Decomposed:
- **model** + reasoning effort (e.g. claude-opus-4-8 / medium)
- **instructions** ... the role + task prompt, AND *where they live* (a CLAUDE.md, a SKILL.md, an n8n LLM-node prompt, an edge-function string)
- **context it receives** ... static (instructions, examples) + dynamic (retrieval, memory, prior state); the **context contract** (write / select / compress / isolate ... what enters the window each step and who curates it)
- **tools** ... the functions / MCP servers / APIs it may call (the agent-computer interface)
- **guardrails** ... what it may and may not do; validation; refusal handling
- **loop pattern / architecture** ... single call / prompt-chain / route / parallelize / orchestrator-workers / evaluator-optimizer / agent loop
- **output contract** ... the structured schema it must emit
- *Canon:* partially ... `systems.{loop_pattern, guardrails, ai_context_location}`. Gap: model, instructions-location, tools, context-contract, output-contract are not decomposed. This is the least-modeled part and the one Nick called out.

### 4. Logic ... the body (deterministic control flow)
- the **driver / control flow** ... the code path that orchestrates the run (AI is a *called function* inside it, not the driver ... the deterministic-engine doctrine)
- **code location** ... repo path / n8n workflow id / Inngest function / edge function
- transforms / business logic
- *Canon:* `systems.{process_state_location, startup_instructions, flow}`. Partial; no single "code location" field.

### 5. Data ... the memory
- **reads from** ... the source stores/tables it consumes
- **writes to** ... the output stores/tables it produces
- **state / checkpoints** ... how it persists across runs so nothing is missed or redone
- **context substrate** ... the vector/canon data it retrieves (the "memory" augmentation)
- **provenance / ledger** ... the runs + events log; the guarantee ledger (did it happen, did verification pass)
- **consume / emit contracts** ... the schemas of input and output
- *Canon:* `systems.{inputs, outputs, contract, process_state_location}`. Partial; the runs/events ledger lives elsewhere.

### 6. Connections ... the edges
- **upstream dependencies** ... systems it relies on (`depends_on`)
- **downstream consumers** ... what consumes its output
- **external integrations** ... third-party services and MCP servers (Apollo, n8n, Supabase, Voyage, etc.)
- *Canon:* `systems.depends_on[]` (upstream only). Gap: downstream consumers, external integrations list.

### 7. Activities ... the run layer it ensures
The leaves. Each activity carries:
- name, what it ensures
- **automation level** (manual → semi → fully → autonomous) + target
- **channel** (surface / email / queue / ping) ... if not autonomous
- **architecture** (code / single_call / workflow / agent)
- **AI's role** (the named judgment, or none = deterministic) and the **data/context role**
- **verification** ... how the guarantee is checked
- owner
- *Canon:* `public.activities` ... fully modeled (built this session).

### 8. Guarantee & observability ... the nervous system
- **what it guarantees** ... the reliability statement
- **verification** ... deterministic checks where checkable; binary evals for the judgment parts; run continuously
- **observability locations** ... logs, dashboards, the projection surface
- **failure handling** ... retries, dead-letter, graceful degradation
- **feedback / promotion loop** ... how an activity climbs the automation spectrum (earned, not declared)
- *Canon:* `systems.{key_metrics, success_criteria, observability_locations}`. Partial; feedback loop not modeled.

### 9. Human & authority ... the operator
- **owner** (practice/persona)
- **authority boundaries** ... what runs autonomously vs what needs human approval (the propose-then-confirm line)
- **channels / surfaces** where the human watches and intervenes
- *Canon gap:* authority boundaries not modeled as a field. Add.

### 10. Assets ... the concrete implementation inventory
The named, typed artifacts that actually constitute the system, plus what it owns. This is the
*implementation backing* for the engine parts above: the **Brain** is realized by `agent definition` +
`context artifact` + `prompt` assets; the **Logic** by `script` / `n8n workflow` / `inngest function` /
`edge function` / `cron` assets; the **Data** by `database` / `table` / `airtable base` assets. So "what
database, what workflows, n8n vs Inngest vs script" is answered here, concretely, per system.

- per asset: **type** (controlled vocabulary, below), **name**, **locator** (`source_path` / `url` /
  `external_id` ... e.g. the n8n workflow id), `deployed_version`, `write_owner`, `lifecycle_state`,
  `last_verified`, `reconciled_against_reality`, economics.
- **`activity_id`** ... the activity this asset implements. The run-layer ↔ implementation link
  (added 2026-06-23).
- **Controlled `asset_type` vocabulary** (CHECK-enforced as of 2026-06-23):
  `n8n workflow · inngest function · script · edge function · cron · database · table · airtable base ·
  mcp server · agent definition · prompt · schema/spec · context artifact`.
- *Canon:* `public.assets` ... 101 assets today (56 n8n workflows, 16 context artifacts, 9 scripts,
  9 agent definitions, 3 airtable bases, 3 databases, 2 schema/spec, 3 untyped).

> **Reconcile against live before trusting it on a surface.** The catalogue drifts. Live n8n is ground
> truth for which workflows exist and are active; same for Inngest functions and Supabase tables. The
> `reconciled_against_reality` flag exists for this. A reconciliation pass against the live systems is
> the gate before this inventory renders on `/system`.

## The standardized visual (where this is going)

The view renders these ten parts the same way for every system, so reading any system is one habit.
Proposed layout (a single panel, populated from the fields above):

- **Header band:** Identity (name, ladders-to, lifecycle, owner, type) + an autonomy gauge (share of
  ensured activities at autonomous).
- **The engine, left-to-right flow:** Trigger ▸ [Brain (model / instructions / context / tools /
  guardrails) + Logic (driver / code)] operating on the Data layer (reads · state · writes) ▸ Outputs
  (Activities · Assets).
- **Side bands:** Connections (upstream in, downstream out, external integrations).
- **Foot strip:** Guarantee & observability (what it guarantees, how it's verified, where it's watched)
  and Human & authority (what's autonomous vs needs approval).
- **Run-layer list:** the activities, led by "needs you" vs "runs without you" (same language as
  `/work`).

This becomes the `/system/[slug]` detail view in projection-ui, replacing the current flat field dump
with a standardized anatomy that reads the same for every system. The canon gaps noted above (trigger,
the decomposed AI component, downstream/external connections, authority) are the schema additions that
make the full view renderable.
