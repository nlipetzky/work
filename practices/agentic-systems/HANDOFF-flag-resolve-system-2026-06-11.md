# HANDOFF — Flag-and-Resolve System (data-prep autonomy layer)

**From:** RevOps operator session (Ferris), on the Teknova **mrna-therapeutics** play.
**To:** Boris (agentic-systems / meta-practice).
**Date:** 2026-06-11.
**Type:** New-component architecture handoff. This is OS-design craft routed to the meta-practice per the operating doctrine (rule 8). The play is the proving ground; the component is reusable and should not live play-specific.

---

## 1. The ask

Own the architecture of a **flag-and-resolve layer** for the revops-engine data-prep funnel: row-level **flags as work items**, an **AI-first resolver** that tries to clear each flag, and a **confidence gate** that escalates only what AI can't confidently resolve to the client SME (via the orchestrator + Hermes today, directly later). Every SME answer becomes a **rule**, so the same flag stops reaching a human next time.

Pressure-test the design below, settle the open questions (§7), and define the build so it's a meta-practice component (pattern in the practice + registry; the play runs an instance).

---

## 2. Intent (the orchestrator's vision — capture verbatim in spirit)

The orchestrator (Nick) was explicit that this is a **system-creation problem, not a list problem**:

- "What we're trying to create here is a system, one that doesn't depend on me, especially when it comes to making a million different decisions every time we load data."
- "I need you to think about a systematic way to solve all these nit-picky things... rather than have you surface these things in the session, I need you to do it in a systematic way, probably in the staging table. Create fields on each row that flag questions or tell us that there is an issue with this data relative to the criteria."
- "The goal or vision here is to build another agent or skill or whatever to use AI to solve all of the issues, as much as it can. Only pull in the subject matter expert when it needs help from them... when the AI is unable to make a decision confidently, then it surfaces it to the SME via me today and eventually directly."
- "What I'm doing is building the system, which is my role. I want AI to make the decisions to the questions you're putting in front of me."

Endstate: the orchestrator (and eventually the SME) sees only the **residue** — the handful AI genuinely couldn't resolve — each arriving as a finished decision packet with the data already gathered, never a line-by-line puzzle. The rule library compounds; human input shrinks every cycle.

## 3. Where this surfaced

Running the mrna-therapeutics play, the operator session kept handing the orchestrator individual decisions (Moderna's headcount vs the ICP, a no-domain ambiguous row, competitor/large-pharma handling). Each was a chat puzzle he had to decode and answer. That's the anti-pattern. The doctrine already says "filled is not trusted; eligible is not qualified" and "the surface is the view" — this component operationalizes those into a self-clearing pipeline.

---

## 4. The component (design developed with the orchestrator)

### 4.1 A flag is a work item, not a marker

Each flag carries independent dimensions (the orchestrator confirmed he wants type + severity + owner; the resolver adds attempt + confidence + status):

- **type** — `data` / `evidence` / `decision`. Named by *what action clears it*: data → better data (re-enrich/re-source); evidence → research (fetch a source, re-screen); decision → a human judgment that becomes a rule.
- **severity** — `blocker` (row can't proceed) / `note` (annotation, row proceeds).
- **owner** — escalation target if AI can't resolve: `research-lane` / `operator` / `sme`. AI is always first-line; owner is who it escalates *to*.
- **ai_attempt** — what the resolver gathered, its tentative call, and its **confidence**.
- **status** — `open` → `ai_resolved` / `resolved_by_rule` / `escalated` / `sme_resolved`.
- Plus a scalar roll-up (`prep_attention` = open / informational / clear) for surface filtering.

### 4.2 The stepped pipeline

1. **Screen** (existing stage1 + classify) finds problems, writes flags.
2. **Resolver agent** works each flag: gathers the data the decision needs, attempts a resolution against the criteria + existing rules + fresh research.
3. **Confidence gate** — confident → resolve on the row with provenance, and if it generalizes, propose a rule. Not confident → escalate with a complete packet (row + question + evidence + tentative read + why-unsure).
4. **SME answer → rule** → next batch the resolver applies it autonomously.

### 4.3 The load protocol (gates around the above)

1. Load 10 → integrity check (loaded, row count, no errors).
2. **Field-coverage check** — systematic, not eyeballed: are the criteria-relevant fields populated? (e.g. "9/10 descriptions, 9/10 headcount, 1 no domain").
3. Screen → writes flags.
4. Resolver + surface review of the residue.
5. Scale to 100 with rules applied; only genuinely-new flags surface.

### 4.4 Two trust principles (non-negotiable, inherited from the system)

- **Nothing resolves silently.** A ruled flag stays visible with its rule reference. Provenance is the trust layer.
- **A rule-vs-evidence conflict is itself a flag** — the resolver raises a new flag rather than auto-siding with the rule. Rules are prior iterations, not law (doctrine rule 10).

### 4.5 The autonomy ratchet (grounded on the live 10)

- Moderna `large_player` → AI applies the existing keep-and-flag rule → `resolved_by_rule`, off the list.
- competitor (reagent maker) → AI checks the SF mirror for an existing account → customer override or note. Rarely human.
- acquired entity ("now part of Cytiva", translate.bio→Sanofi) → AI resolves to live parent via research.
- no-domain ambiguous row → AI runs research lane; oligo-only → OUT; unfindable → drops as data issue.
- a *novel* scope question with no rule → escalates to the SME with a packet.

Residue from these 10 after the resolver: ~0–1, and that one is a genuine novelty.

---

## 5. What it builds on (do NOT rebuild — extend)

- **revops-engine prep funnel** — `systems/revops-engine/`. Recipe-driven, on-rails: `run-prep.mjs` → stages `stage1` → `classify` → `dedup` → `route` → `contacts_screen` (`lib/stage-registry.mjs`, `lib/recipe.mjs`). DB: Supabase `revops-engine-dev`, project `mrmnyscurmkfppicqqhk`, Management-API path with `SupaBase_CLI_access_token` from `~/code/work/.env`.
- **Existing flag infrastructure** the classifier already writes (this is the seed): staging cols `prep_verdict`, `prep_confidence`, `prep_criteria` (jsonb), `prep_rationale`, `prep_stage`, `prep_evidence`; classifier JSON already emits `verdict / confidence / criteria / role / geography_na / existing_customer_flag / competitor_flag / large_diversified_flag / needs_evidence / evidence_wanted / source / rationale`. The new `prep_flags` consolidates these into uniform work items + adds data-issue flags from stage1/field-coverage + the status/rule_ref layer.
- **PLAY-AGENT-BRIEF.md** (`systems/revops-engine/PLAY-AGENT-BRIEF.md`) — the play-prep agent design (planner/executor, on-rails mandate, verification mandate "filled≠trusted"). The resolver is the next layer on this.
- **observability-projection-pattern** (`practices/agentic-systems/reference/observability-projection-pattern.md`) — records↔runs, per-field provenance, gaps-as-views. Flags are gaps made into work items.
- **projection-ui** (`systems/projection-ui/`, port 4180) — the staging surface where flags get reviewed. `lib/validity.ts` is the shared REAL/EMPTY/PLACEHOLDER definition (data-issue flags should use it, not a second definition).
- **operating-doctrine** (`practices/agentic-systems/reference/operating-doctrine.md`) — the 10 rules this all serves.

## 6. Guardrails

- **On-rails only** — flag/resolution writes go through controlled functions that stamp provenance, never ad-hoc SQL on canonical data. Recipe context required for enrichment writes (`my_app.recipe_id`).
- **No person names** in schemas/prompts/shared artifacts — role language (`client_sme_*`, not the SME's name).
- **SME interaction routes through Hermes** (expert-liaison). The escalation packet is a Hermes-style projection: a clean decision for the expert, not raw data. Sponsor-side routes through Polaris.
- **Spend gate** — any paid-provider resolution step (re-enrich, research via a paid API) halts for pilot → approval → run until a coded gate exists.
- **Surface is the view** — flags are reviewed on projection-ui, never re-narrated as chat tables.

---

## 7. Open design questions for Boris

1. **The confidence gate (the key one, put to the orchestrator, unsettled):** is resolve-vs-escalate a single self-set confidence cutoff the resolver picks, OR **rule-existence-gated** — the AI may auto-resolve anything a written rule covers, but anything with no rule yet *always* escalates the first time and becomes a rule, regardless of how confident it feels? The second builds the rule library faster and is more conservative. Recommend leaning that way; orchestrator to confirm.
2. **Flag axis schema** — orchestrator wants type + severity + owner, but wants to *see results on real rows before locking the schema*. So v0 should write all three dimensions on the 10 and let him react.
3. **Resolver home** — skill, sub-agent, or Inngest function? (PLAY-AGENT-BRIEF §6 left this open; same decision recurs here.) Lean: start as a sub-agent/skill orchestrating existing runners + a research lane; graduate deterministic resolutions into the engine.
4. **Escalation packet format + routing** — the Hermes projection shape for an SME decision (row + question + gathered evidence + tentative read + options). Define once, reuse.
5. **Rule homes + promotion path** — deterministic rules → stage1 SQL / config JSONs; judgment rules → classifier-prompt + `client-guidance.md §0` with dated cites. Define how a resolved escalation gets promoted into a rule (who writes it, where, how it's versioned).

## 8. Current concrete state (the live instance)

- Play bundle complete: `accounts/clients/teknova/plays/mrna-therapeutics/` (classifier/, prep-recipe.json, client-guidance.md, delivery-contract.md) + strategic artifacts at `accounts/clients/teknova/artifacts/revops-{offer,segment,icp-titles,play-brief}-mrna-therapeutics.md`.
- Pilot run end-to-end: 10 companies **sourced from Apollo** (1 credit) → enriched (Apollo bulk org enrich, descriptions + headcount, 9 credits) → screened. Verdicts: **8 IN / 1 NEEDS_REVIEW / 1 OUT**, in `staging.companies_mrna_pilot_2026_06_11` (visible at `localhost:4180/staging`).
- TAM sized at ~697 (Apollo, NA + mRNA keyword net). Scale target is 100, then the full pull.
- **Immediate next build:** the `prep_flags` work-item fields + field-coverage gate on these 10 (v0), so the orchestrator can see the type/severity/owner dimensions on real rows. Then the resolver, then the escalation packet.

## 9. One concrete fix to fold in

The companies loader stamps `source = <batchId>`, which names the *batch*, not the data origin. Per the orchestrator, `source` must name the **provider** (`apollo`) on every row, separate from the batch id. Fix in `systems/revops-engine/loader/load-companies-csv-to-staging.mjs` (and the convention generally): source = provider, batch = batch id.

## 10. Recommended first step

Build `prep_flags` + `prep_attention` + the field-coverage gate on the current 10, codify the rules already in hand (`large_player` ≥2000, `missing_domain`, the oligo-name pattern), and show it on the surface so the attention list visibly collapses to one row. Low reversal cost (additive columns + a flag-writing step), no re-enrichment, no spend. Then layer the resolver, then the escalation packet. Settle §7.1 (the confidence gate) before the resolver, since it sets the resolver's core control flow.
