# Design Brief: Play-Scoped Data-Prep Agent

**Author:** Boris (agentic-systems), end of build session 2026-06-08.
**Purpose:** Capture the live context for building an AI agent that prepares a play's data for the
client by planning and executing against the play criteria + client guidance. This is a **design
brief, not an implementation plan** — the executing session runs its own brainstorm → spec →
plan → build from here, with a clean context window.

**First batch / proving ground:** the ngAbs (Next-Gen Antibodies) play for Teknova.

---

## 1. What this agent is

A **play-scoped operator** — not a generic agent. It takes three inputs and produces
client-ready data through a plan → execute → verify loop:

- **Inputs:** (1) the play **criteria** (the client's playbook), (2) the **client guidance**
  (the distilled, post-criteria refinements), (3) the **staged data** (a staging batch).
- **Output:** a prepared, client-ready batch — deduped, scope-filtered, normalized, classified
  against the criteria — sitting in the staging surface for human then client review.

### The loop
1. **Plan.** Read criteria + guidance, inspect the staged batch, emit a data-prep plan: which
   guidance rules apply to which records, what's a gap, what's ready. The plan is an artifact
   the operator (Nick) approves before anything runs.
2. **Execute on-rails.** The agent **orchestrates; it never free-hands.** Every mutation runs
   through the controlled functions/loaders that stamp provenance. This is the non-negotiable
   (see §4). If a change isn't visible in the surface with provenance, it didn't happen.
3. **Verify.** The prepared batch lands in the staging surface for Nick, then the client, to
   review — the checkpoint that already exists.

### Two trust principles (already built into the system, must be honored)
- **It reads the same context docs the human sees** — criteria + guidance files, linked on the
  batch metadata. No private/divergent context.
- **It proposes its plan for approval before executing** — the Promote-button discipline,
  generalized to the whole prep.

The **client guidance doc is the agent's executable instruction set.** That's why it was built.

---

## 2. What already exists that the agent MUST use (do not rebuild)

### The surface / harness
- `/Users/nplmini/code/work/systems/projection-ui/` — Next.js trust surface, port **4180**.
  Records / Runs / Duplicates / Gaps / **Staging** pages. The Staging page already: lists
  batches, previews rows, shows play + client-guidance links, has a Promote button, a show-all
  column toggle, entity-aware stats. This is where the agent's work becomes visible.
- **Validity guard:** `systems/projection-ui/lib/validity.ts` — the single shared definition of
  REAL vs EMPTY vs PLACEHOLDER (sentinels: "Response", "N Results Found", …). The agent and the
  human use this same definition of "done." Do not invent a second one.

### The staging → promote pipeline (the on-rails machinery)
- **Engine DB:** Supabase `revops-engine-dev`, project `mrmnyscurmkfppicqqhk`. RLS enabled on
  all tables; service role bypasses. Access token for the Management API is in
  `/Users/nplmini/code/work/.env` as `SupaBase_CLI_access_token`.
- **Loaders** (`systems/revops-engine/loader/`): `load-csv-to-staging.mjs` (contacts — embodies
  the deterministic prep: geo normalization, name normalization w/ credential-strip + email
  surname recovery, North-America filter, company_id resolution) and
  `load-companies-csv-to-staging.mjs` (full-export staging). They push to staging via the
  Management API so row data never enters an agent context. **These deterministic transforms are
  the agent's execution building blocks** — it orchestrates them, it doesn't reimplement them.
- **Staging convention:** `staging.<entity>_<batch_id>` (entity ∈ contacts|companies), each row
  carrying `id uuid`, `engine_account_id`, `account_id`, plus canonical-named columns.
- **`promote_staging_batch(p_batch_id text, p_entity text, p_promoted_by text)`** → returns
  `(promoted, inserted, updated, rejected, run_id)`. On-rails: declares recipe context, stamps
  per-field `field_provenance`, dedups by email/domain, idempotent, per-row subtransactions.
  Source: `systems/revops-engine/supabase/migrations/0001_promote_staging_batch.sql`.
- **Surface RPCs:** `list_staging_batches()`, `staging_batch_preview(table, limit)`. Batch→play
  context lives in `staging_batch_meta` (batch_id, segment_name, playbook_name, play_file_path,
  guidance_file_path).

### The play context bundle
- `/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/`
  - `playbook-v1-2026-05-29.md` — the criteria.
  - `client-guidance.md` — the distilled client guidance = the agent's rule set:
    in-scope conjugate subclasses (AOC/RDC/immunocytokine); require bispecific/multispecific/ADC,
    fragments adjacent-only-when-paired; four negative checks (fusion-protein-only,
    PEGylated-enzyme, CAR, AAV); acquired-company email-domain routing; fill-finish narrow fit;
    dedup/hierarchy; client-labeled ground truth.

### Current staged data (the agent's first working set)
- `staging.contacts_ngabs_2026_06_05` — 113 (NA-filtered, names+geo normalized).
- `staging.companies_ngabs_2026_06_05` — 82 (full 316-col RevOps Surface export).

---

## 3. The job, concretely (translate guidance → executable plan)

The agent's plan turns each guidance rule into an operation over the staged batch:
- **Scope classification:** apply require-bispecific/multispecific/ADC + in-scope conjugates +
  the four negative checks → label each record in/out/needs-review.
- **Dedup / hierarchy:** collapse LSNE→PCI, ProBio=GenScript ProBio, parent/child (SK↔KBI), etc.
- **Acquired-company routing:** route contacts by the live email domain (Seagen→Pfizer).
- **Normalization:** the deterministic geo/name steps the loaders already do.
- **Gap detection:** flag missing/placeholder fields (via the validity guard) for re-enrichment.
- **Promote** the prepared, in-scope set; leave out-of-scope visibly flagged, not silently dropped.

---

## 4. Guardrails (the agent is only trustworthy if these hold)

- **On-rails only.** Mutations go through loaders / `promote_staging_batch` / future controlled
  functions that stamp provenance. No ad-hoc SQL or scripts that write canonical data. (This is
  trust-break #2 from the founding session — the entire system exists to prevent it.)
- **Recipe context required.** Any enrichment-field UPDATE to `contacts`/`companies` is rejected
  by the `fn_enforce_enrichment_pipeline_*` trigger unless `my_app.recipe_id` is set.
  `promote_staging_batch` already does this; any new write path must too.
- **Human-in-the-loop.** Plan is approved before execution; prepared batch is reviewed in the
  surface before client delivery.
- **Same context as the human.** Reads criteria + guidance from the play folder via the batch
  metadata.
- **n8n note:** company writes currently fire `notify_n8n_companies_change` → an n8n webhook.
  Nick wants this replaced with an Inngest function. The agent should not depend on n8n.

---

## 5. What this agent is NOT

- Not a free-handing script writer. Not a system-of-record editor (writes go through functions).
- Not the client-communications agent — translating client natural-form input into artifacts is
  **Hermes (expert-liaison)** craft. The `client-guidance.md` was a Hermes-style projection;
  future client-feedback ingestion routes through Hermes.
- Not multi-play. Scoped to one play; the pattern generalizes per play.
- Not the identity-resolution engine. (Note: working→`canonical_*` resolution is engine code
  that exists only in the archive — a real gap, out of scope for this agent unless decided.)

## 6. Three decisions to settle (in the new session)

1. **Autonomy granularity:** approve-each-step, approve-plan-once-then-execute, or
   autonomous-with-post-review? *Boris lean: approve-plan-once, execute on-rails, review in
   surface — mirrors the Promote checkpoint.*
2. **Scope:** deterministic prep only (dedup, scope filters, normalization, exclusions), or also
   **gap re-enrichment** (re-running research to fill placeholder/missing fields)? *Boris lean:
   phase 1 deterministic; phase 2 re-enrichment.*
3. **Form / home:** a Claude Code skill, a sub-agent definition, a CLI play-runner in
   `systems/revops-engine/`, or Inngest functions? *Boris lean: start as a skill/sub-agent that
   orchestrates the existing loaders/RPCs; graduate the deterministic steps into Inngest.*

## 7. Required reading for the new session (in order)

1. This brief.
2. `/Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/client-guidance.md`
   and `playbook-v1-2026-05-29.md` (the rule set + criteria).
3. `/Users/nplmini/code/work/systems/revops-engine/supabase/migrations/0001_promote_staging_batch.sql`
   (the on-rails promotion contract).
4. `/Users/nplmini/code/work/systems/revops-engine/loader/load-csv-to-staging.mjs` (the
   deterministic prep building blocks).
5. `/Users/nplmini/code/work/systems/projection-ui/lib/validity.ts` (the shared "real" definition).
6. `/Users/nplmini/code/work/practices/agentic-systems/reference/observability-projection-pattern.md`
   (the trust spine).

## 8. First steps for the new session

1. Read the above; confirm the on-rails interfaces (don't re-derive them).
2. Run brainstorm → spec on the agent, settling the three decisions in §6 with Nick.
3. Write the plan; build the planner first (criteria + guidance + staged batch → an approvable
   prep plan), then the on-rails executor that calls the existing loaders/RPCs, then wire the
   verify step to the staging surface.
4. Prove it end-to-end on `ngabs_2026_06_05` (companies + contacts), reviewed in the surface.

## 9. Gotchas carried from this session

- **Env collision:** the shell profile exports a bare `SUPABASE_URL` for a *different* project;
  Next prioritizes OS env over `.env.local`. Namespace app env vars (`PROJECTION_*`).
- **enrichment_runs** requires list_id/recipe_id/target_account_id — promotion runs deliberately
  do NOT write it; they're audited via `staging_promotions` + `entity_activity_log`.
- **Two data layers:** working `contacts`/`companies` (system of record, what the surface + sync
  read) vs `canonical_*` (resolved identity, populated by archive-only engine code).
- **Person-name hygiene:** no person names in schemas/artifacts (the `Ellie *` columns are staged
  as `client_sme_*`).
