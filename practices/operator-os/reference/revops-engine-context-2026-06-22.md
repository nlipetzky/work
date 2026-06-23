# RevOps Engine + Audience-Needs Layer — Grounded Context (2026-06-22)

**Purpose:** Reality-check for an architecture conversation. Reads the engine (execution layer)
and the upstream "audience needs → engine inputs" layer as they actually exist in
`~/code/work/`, not from memory. Author: investigation session for Atlas (operator-os).

---

## (a) Engine current state + input contract

### Pipeline stages that actually exist and run

The engine is **code-driven, not agent-driven**. The spine is
`/Users/nplmini/code/work/systems/revops-engine/run-play.mjs` — a deterministic driver that
reads real DB state from `revops-engine-dev` (Supabase `mrmnyscurmkfppicqqhk`), verifies each
step's count from the surface, stops hard at gates, and prints every verification gate as
WIRED / NOT WIRED so it can never claim a screen it didn't run. The AI is a *component the
program calls* (classify, resolve, research), never the orchestrator.

Canonical flow (`run-play.mjs` STEPS, mirrored by
`/Users/nplmini/code/work/systems/revops-engine/RUNBOOK.md` and the registry record
`registry/signal/signal-prospecting/system.md`):

0. **Brief** — strategic bundle must exist + play brief approved (a gate, not a step).
1. **Load** — registered loader per provider (`load-apollo-to-staging.mjs`,
   `load-explorium-to-staging.mjs`, `load-companies-csv-to-staging.mjs`), play-folder-bound,
   full faithful capture → `staging.companies_<batchId>` + `staging_batch_meta`.
2. **Stage** — staging table + meta row (automatic in loader).
3. **Screen** — `run-prep.mjs` drives the recipe (stage1 → classify → dedup → route →
   contacts-screen). Free compute. Writes `prep_verdict/confidence/criteria/rationale`.
4. **Verification gates** (advisory truth panel) + **CRM suppression** —
   `gate-crm-suppression.mjs` (deterministic SF join, stamps `crm_status`), and the generic
   `gate-ai-research.mjs` + `gates/wetlab` (paid, operator-run). LinkedIn-presence gate is
   declared NOT WIRED.
5. **Flag-resolve** — `flags-v0.sql` writes work items; resolver is manual v0 today.
6. **Promote** — `promote_staging_batch()` RPC, on-rails, idempotent, provenance-stamped →
   Core `public.companies`.
7. **Contacts** — paid; people-at-company per ICP-titles, suppression check. Gated.
8. **Deliver** — validate against the play's `delivery-contract.md`, registered exporter
   (`export-staging-csv.mjs` / `export-airtable-payload.mjs`). Export waits for operator
   approval; expert-facing delivery routes through Hermes.

Out-of-chat autonomy exists: `run-play-all.mjs` + `com.nick.run-play-all.plist` (launchd every
15 min) discovers in-flight batches and runs the driver read-only, parking at gates.
Lifecycle = **engineering**; 2 plays proven end-to-end (mRNA, ngAbs). Spend gating (Phase 5)
not yet built — paid sourcing is currently UNGATED; the session is the spend gate.

### The exact INPUT CONTRACT the engine consumes for a play

Canonical definition:
`/Users/nplmini/code/work/practices/agentic-systems/reference/deepline-upstream-inputs.md`
(694 lines, owner Nick, created 2026-06-08). **24 inputs across four categories**; the 11
*strategic* inputs (set per play, codified in play artifacts) are the play-brief contract:

1. Offer definition — `offer-extract`
2. Segment definition (industry/geo/size/stage) — `segment-criteria`
3. Hard disqualifiers / exclusion rules — `segment-criteria` (embedded)
4. Sub-segment tagging logic — play artifact / `segment-criteria`
5. Title / persona list with tier sequencing — ICP-titles artifact (no skill)
6. Sender identity + credential — play artifact + expert-liaison loop
7. Proof points / what's allowed in cold copy — `creative-brief` (not built)
8. Channel selection (LinkedIn vs email) — play artifact
9. Volume target — play artifact / execution plan
10. Personalization rule + hook sources — `creative-brief` + `copy-draft`
11. Cold copy / sequence — `copy-draft`

Plus operational (12–18: activation destination, CRM schema, budget, approval authority,
success/termination criteria), runtime (19–22: NL request, input CSV, DNC list, cadence),
and system (23–24: provider creds, CLI install).

The **play brief** that indexes all of this is produced by the `lead-gen-strategist` skill and
conforms to `practices/revops/schemas/play-brief.md`. The brief is an *index + readiness
ledger*, not a copy of the inputs — it points at each input artifact, records each status
(`locked` / `operator-filled` / `gap` / `deferred` / `draft`), and renders a readiness verdict.

---

## (b) How inputs are authored today

**Almost entirely operator-driven human judgment, scaffolded by NotebookLM queries.** Nothing
is auto-derived from real demand data yet.

- `lead-gen-strategist` (`practices/revops/skills/lead-gen-strategist/SKILL.md`) is an
  **orchestrator persona**, not a transformer. It walks the operator through five passes
  (A offer → B segment → C ICP titles → D sender+proof → E channel/volume/personalization →
  F copy), delegating to sub-skills, and writes the brief.
- Only **3 of 11 strategic inputs have a shipped skill**: offer-extract (1), segment-criteria
  (2,3,4), copy-draft (11). Inputs 5,6,7,8,9,10 have **no skill** — operator fills them
  manually, stamped `operator-filled`, never `locked`.
- The shipped sub-skills (`offer-extract`, `segment-criteria`) derive content by having the
  **operator run 5 canonical NotebookLM queries** per skill and paste responses into
  `accounts/<type>/<name>/sources/`, then the skill drafts the artifact from that. So even the
  "automated" inputs are human-mediated NotebookLM retrieval + LLM drafting, reviewed by Nick.
- Real examples confirm this:
  `accounts/clients/teknova/artifacts/revops-offer-mrna-therapeutics.md`,
  `revops-segment-mrna-therapeutics.md`, `revops-play-brief-mrna-therapeutics.md`,
  `revops-icp-titles-mrna-therapeutics.md` (ICP-titles is a standalone file, i.e. input 5
  lifted out manually); and
  `accounts/ventures/konstellation-ai/artifacts/revops-play-brief-patent-portfolio-mgmt.md`
  + `revops-segment-patent-portfolio-mgmt.md`. These are hand-authored artifacts, not
  engine-generated.

---

## (c) Audience-needs / demand-side layer: what exists vs missing

This is the **suspected gap, and it is real.** The methodology and the registry record exist;
the running system does not.

### What EXISTS (conceptual + partial)

- **Methodology is locked.** `signal → observation → pattern → consuming artifact`, with
  verbatim + provenance + evidence grades, manual-first. Defined in the demand-context registry
  record and the resolved review doc
  `registry/_review/resolved/2026-06-10-demand-context-definition.md`.
- **Registry record:** `registry/signal/demand-context/system.md` — slug `demand-context`,
  cluster `revops`, lifecycle **defined**, autonomy **manual**. Outcome: "Outbound plays run on
  evidenced demand understanding, never a guessed ICP." Its contract is explicit that outputs
  (observations, patterns) are **`off`** and consuming artifacts are **`handmade`**; run-results
  feedback input is **`unwired`**. All four named assets (observation store, capture-event log,
  ingestion pipeline, context panel) are **`to-build`**. Extraction + synthesis skills are
  **`to-write`**.
- **One per-play demand-context folder exists, with exactly one signal:**
  `accounts/ventures/konstellation-ai/plays/patent-portfolio-mgmt/demand-context/signal-00-strategy-cmo-2026-06-10.md`
  — capture event #1 (Nick↔Will CMO strategy meeting), hand-extracted, with evidence grades
  (`decision` / `expert-believes`). Prospect transcripts (Signals #1–15) are noted as *incoming
  fuel that has not landed* — the real capture event is still blocked.
- **Expert-liaison loop (Hermes)** is the designed binding mechanism:
  `practices/expert-liaison/reference/methodology.md`. Its fourth pillar is **Learnings +
  gap-naming**, typed three ways: *update existing artifact*, *propose new artifact*, *context
  gap*. This is the conceptual path from real exposure → approved artifact change → engine
  binding with lineage. The Teknova `client-guidance.md` was a Hermes-style projection feeding
  the classifier.
- **Konstellation Learnings table** (Airtable `app5tsy6zjfA8H3rx`, table `tbl8NyDBTYZI8lum2`):
  **the mechanism is built and captured one batch — but nothing has flowed through it.**
  18 records, all from a single engagement (Shawn/Vanco, 2026-05-26), every one stamped
  Status = **`Raw`**. Records carry Learning Type (update existing / propose new / context gap),
  verbatim, and a linked Target Artifact (Pitch Sheet, Discovery Question Library, Diagnostic
  Proposal Template). But **zero are Approved**, and **no downstream artifact has actually been
  updated** by an approved learning. The loop's capture leg fired once; the approval+binding leg
  has never run.

### What is MISSING

- The observation store, capture-event log, ingestion pipeline, and context panel — all
  `to-build`.
- The extraction skill (signal → graded observations) and synthesis skill (observations →
  patterns → consuming artifacts) — both `to-write`.
- The **automated derivation of engine inputs from demand evidence** — does not exist.
  Consuming artifacts (ICP, segment, classifier config) are `handmade` today.
- The **feedback leg**: run results (qualified/rejected rows) flowing back to refute/confirm
  patterns — `unwired` (depends on signal-prospecting).
- The **approval→binding path** for Learnings — present as a schema/table but never exercised
  to completion.

### Where "audience needs" comes from today

From Nick's and the expert's heads, captured ad-hoc: NotebookLM query responses, one
hand-extracted strategy transcript, and 18 raw (unapproved) Learnings from one call. It is
then hand-authored into offer/segment/ICP artifacts. There is **no running pipeline** turning
demand signal into engine inputs.

---

## (d) Where the engine sits per Boris / agentic-systems

In the constellation/registry map, both systems live in the **`signal` home, `revops`
cluster**:

- **`signal-prospecting`** (the engine) — lifecycle **engineering**, autonomy **supervised**,
  runs-surface = projection-ui `/runs`. This is the execution layer described in (a). Its
  contract lists "Consuming artifacts from demand context" as an input with status
  **`handmade`** — i.e. the engine record itself acknowledges the upstream layer is hand-fed.
- **`demand-context`** (the audience-needs layer) — lifecycle **defined**, autonomy
  **manual**. The upstream sibling.

So the design intent is explicit and registered: demand-context is *the* designed system that
turns audience needs → engine inputs, and signal-prospecting consumes its output. The registry
record is essentially a one-page design+roadmap for the missing system. Direct quote of its
roadmap:

> v0 (active) — capture CMO intake by hand; first graded observations. Proves the extraction.
> v1 — observation schema + capture log become real; observations output turns on.
> v2 — synthesis turns on; consuming artifacts generated, not hand-made; metrics measurable.
> v3 — run-results input wired; the feedback leg closes (depends: signal-prospecting).

Related design: `PLAY-AGENT-BRIEF.md` (Boris, 2026-06-08) designs a *play-scoped data-prep
agent* that sits **downstream** of the inputs (orchestrates loaders/promote on a staged batch);
it is not the upstream demand system. It explicitly defers client-feedback ingestion to Hermes.

---

## (e) The precise gap + existing building blocks

**The gap, stated exactly:** There is a fully specified execution engine that consumes a precise
11-input play-brief contract, and there is a fully specified methodology + registry record for
turning audience demand evidence into those inputs — but **the connective system between them
does not run.** Today a human reads NotebookLM/transcripts/calls in their head and hand-writes
the offer, segment, ICP, and classifier artifacts. The "audience needs → engine inputs" path is
**conceptual + scaffolded, not built**: the schema exists, one capture happened per side
(1 demand signal, 18 raw Learnings), but no extraction, no synthesis, no approval-binding, and
no feedback leg has actually executed end to end.

**Building blocks that already exist and could compose into it:**

1. **The input contract** — `deepline-upstream-inputs.md` precisely defines the 11 targets the
   demand layer must produce. The destination is unambiguous.
2. **The methodology** — signal→observation→pattern→consuming-artifact, with grading rubric
   (locked 2026-06-10).
3. **The registry record + roadmap** — `demand-context/system.md` is a ready build spec
   (contract, assets, skills, v0–v3 sequence).
4. **Per-play demand-context folders** — the folder convention exists; one seeded signal proves
   the capture format.
5. **The Konstellation Learnings table** — a working Airtable schema (typed learnings, target
   artifact links, status enum) that already captured 18 records. Needs the approval+binding leg
   wired and connected to artifact files.
6. **Expert-liaison (Hermes) loop** — the designed 7-move + 4th-pillar mechanism for routing a
   typed learning to expert approval and binding it to an engine artifact with lineage. The
   accountability surface design is done.
7. **The sub-skills** — offer-extract, segment-criteria, copy-draft already turn pasted context
   into the contract's artifacts; a demand-synthesis output could feed them instead of (or
   alongside) NotebookLM paste.
8. **Canon corpus** — connected as a `bespoke read` on both records; transcripts/email_threads
   are the raw fuel source.
9. **The feedback substrate** — the engine already records qualified/rejected verdicts per row
   (`prep_verdict`, promotion ledger), so the v3 feedback leg has a real data source waiting.

The composition is essentially: wire capture (transcript/Learnings) → extraction skill →
observation store → synthesis skill → consuming artifacts → Hermes approval/binding → into the
play brief the engine already reads → close the loop with run verdicts. Every piece is named;
none of the middle is built.

---

## (f) Honest unknowns / what to confirm with Boris

- **Build state vs registry claims.** All "to-build / to-write / off / unwired" statuses above
  are read from the registry record, not verified against live DB schema. Whether *any*
  observation-store table or ingestion function was partially stood up since 2026-06-10 was not
  checked in the engine DB itself. Confirm with Boris / a live schema read.
- **Learnings table → artifact binding.** Confirmed 18 records, all `Raw`, none Approved. What
  is *intended* to happen on approval (does an approved learning auto-edit the linked artifact,
  or is it manual?) is not specified in any file I found — likely lives in Boris's head or an
  unwritten design.
- **Is `demand-context` still the live plan, or superseded?** Memory notes a "registry → canon
  consolidation" (2026-06-22) and that the registry is mid-migration into
  `canon_engine.public.systems`. Whether the filesystem `registry/signal/demand-context`
  record is still the authoritative design or has been re-scoped in canon is unconfirmed.
- **Relationship between the demand-context system and the play-prep agent.** Both are Boris
  designs; PLAY-AGENT-BRIEF explicitly puts client-feedback ingestion under Hermes. Whether
  Boris intends demand-context and the Hermes Learnings loop to be *one* system or two is not
  pinned down in the files.
- **`creative-brief` skill** (inputs 7 + 10) is referenced as the producer for proof/copy
  constraints but does not exist on disk. Whether it's planned, dropped, or folded into
  copy-draft is unconfirmed.
- **deepline-* naming.** The contract doc and several references use "Deepline" vocabulary for
  the engine/agent; how that maps onto the current "agentic system" / signal-prospecting naming
  is a terminology question for Boris.
