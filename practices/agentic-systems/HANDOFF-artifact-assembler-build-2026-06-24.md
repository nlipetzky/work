# HANDOFF — Artifact Assembler + Expert Liaison build (2026-06-24)

Fresh-session handoff for the "system that builds systems" work. Read this, then the
memories + conventions listed at the bottom.

## North star
Get Nick OUT of endless Claude Code chat and INTO deterministic workflows operated
from the Projection UI. Business = a collection of systems + activities that produce
value; create a system, evolve it toward autonomous. Chat = design/repair a system
(the exception). Projection UI = run it (the default). See
`reference/operating-protocol.md`.

## What's built and where

### 1. Artifact Assembler (the build engine) — BUILT, OPERATING
A deterministic meta-system that assembles a business's context artifacts from
sourced inputs, governs them draft→approved, versions them. AI is a called function
inside a code driver; never the driver.
- DB: canon_engine (Supabase project `mzzjvoiwughcnmmqzbxv`).
  - `canon_artifact_types` (33 artifact types as data: layer/owner_agent/done_when).
  - `canon_artifact_manifest` (per engagement+type: required, `standard_rules`
    [machine gate], `standard_rubric` [LLM-judge], `needs` jsonb {summary,questions},
    `required_expertise` text[] [marketing/legal/...]).
  - `canon_artifacts` (the governed store: content_md, version, status
    draft→approved→superseded→archived, approver, confirmed_by). Pre-existing
    constraint: status vocab is draft/approved/superseded/archived (NOT "proposed");
    approved requires approver+approval_date.
  - RPCs (SECURITY DEFINER, only sanctioned write path): `propose_artifact` (→draft),
    `confirm_artifact(id, by)` (draft→approved, supersedes prior approved).
- Driver: `systems/canon-engine/scripts/govern-artifacts.mjs`
  - commands: `status|run|confirm`; flags `--artifact <type>`, `--max-revisions N`,
    `--force` (re-produce even if already in canon).
  - loop: produce (AI) → rules-gate (deterministic, first) → LLM-judge vs rubric →
    propose; bounded revisions; single-threaded writes; INSUFFICIENT_SOURCE
    no-fabrication guard; on non-produce it calls `assessNeeds` and stores
    {summary,questions} on the manifest row (the "what I need" articulation).
  - reads source from `accounts/<type>s/<id>/context/<layer>/<artifact_type>.md`
    (engagement-type-aware).
  - Run it: `cd systems/canon-engine && set -a; . ~/code/work/.env; . ~/code/work/systems/projection-ui/.env.local; set +a; node scripts/govern-artifacts.mjs run venture konstellation-cipo`
    (env: CANON_SUPABASE_URL, CANON_SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY).
- Registered: `canon.systems` slug `artifact-assembler` (constellation **Canon**,
  class core, platform, beta, loop_pattern evaluator-optimizer).

### 2. Expert Liaison (the sourcing/curation system) — REGISTERED, NOT YET CODE
Persona = Hermes (`practices/expert-liaison/`). The SYSTEM (the expert→Canon
curation loop) is registered `canon.systems` slug `expert-liaison` (Canon, emerging),
depends_on artifact-assembler. The loop was PROVEN BY HAND this session: read Will
transcripts + the Drive offering doc → curated into source files → Assembler produced.
Its input contract = `canon_artifact_manifest.needs` (summary+questions) + engagement
+ the expert's identity/contact (the experts registry, not yet built). Two horizons:
(a) curate for artifacts now, (b) capture durable expert knowledge for future
domain-production systems (Will → automated legal-doc production). Curates from BOTH
transcripts and email (canon_engine.transcripts + email_threads/messages + chunks).

### 3. Projection UI (the operate surface) — port 4180
- Runs as launchd service `com.nick.projection-ui` (KeepAlive). NEVER kill the dev
  process (it respawns + killing mid-compile corrupts `.next` → bogus 404s /
  "module not found"). Restart ONLY via
  `launchctl kickstart -k gui/$(id -u)/com.nick.projection-ui`. If `.next` corrupt:
  `rm -rf .next` then kickstart. Second instances must set NEXT_DIST_DIR=.next-preview
  (next.config.mjs distDir guard; the worktree .claude/launch.json does this). Verify
  via ctx_execute fetch to localhost:4180 (sandbox can reach host localhost), not a
  second dev server.
- `/system/[constellation]/[slug]/page.tsx`: the Assembler's page (Canon/
  artifact-assembler) has the "Artifacts under governance" panel: AI-key status,
  per-engagement Run, per-artifact chips that open to READ then Approve (read-before-
  approve), a "Missing inputs" list (needs-source / source-ready + source path +
  the Assembler's recorded questions), and per-artifact `sign-off:` required_expertise.
- Routes: `app/api/system/artifact/{run,confirm,[id]}/route.ts`. Query:
  `lib/queries/governedArtifacts.ts`. Client actions:
  `app/system/[constellation]/[slug]/AssemblerActions.tsx`.

## CIPO pilot — current state (the proof engagement)
KonstellationAI.com sells Will's IP offering. Offering SOURCED this session from
Will's "PatentVest IP Intelligence Platform" pricing doc (Drive file
1aGNRzFtiTRb9sH7DZTlKfzqz_CwdU1q9kgQO7lhjbog) + 2 Will↔Nick transcripts (2026-06-09,
06-23) + Lexsy.ai comp. It's the subscription fractional-CIPO model (Scout/Shield/
Arsenal $2.5/5/10k + credits + IP Velocity Score + success fees + RPA), re-pointed
PatentVest→Konstellation. Site repo: `~/code/konstellation-cipo-site` (Next.js,
deploys to Vercel, content-driven).

Artifact state (of the 11 spine):
- APPROVED (5, human-certified in the UI): customer-problem-model, faithfulness-
  constraints v2 (CIPO ok / never "attorney" — lapsed license), icp-and-disqualifiers,
  mechanism-of-action, non-goals.
- DRAFT awaiting Nick (1): offer-architecture-and-pricing.
- GAP, needs input (5, questions recorded in manifest.needs): value-proposition-canon
  (needs the moat decision: Will-personally vs methodology), founding-thesis,
  tradeoff-hierarchy, controlled-lexicon, voice-codex (needs Will's sme-voice samples
  inlined; sme-voice file at konstellation-ai/artifacts/).

## Open work / next moves
1. Nick: read+approve `offer-architecture` draft in the UI.
2. The 5 gap artifacts need Will/Nick input. The questions are recorded
   (`canon_artifact_manifest.needs`). A first Will email (offering-definition
   questions) was drafted in chat but NOT sent — needs Will's email address +
   draft-not-auto-send (Gmail MCP create_draft). Bundle the recorded needs into it.
3. Build the **curation ledger** (Nick's repeated ask): a `source_assessments` table
   (source → assessed → valuable? → extracted snippet → fed-which-artifact) + a
   Projection-UI panel. This is Expert Liaison's surface; it makes "what was reviewed
   and what came out" visible so we don't rely on the agent remembering.
4. Build **Expert Liaison as code**: triggered on new transcript/email (canon
   system_triggers/trigger_routes; a transcript-router already exists) → assess
   relevance to artifacts → curate into source → feed Assembler. The orchestration
   layer Nick wants.
5. Fix **Drive→Canon doc ingestion** (Atlas inbox capture_item b95b5db4): the
   document corpus is stale since ~April; CIPO Drive docs aren't ingested.
6. Governance evolution (rail in place, engine deferred until expert loop is live):
   per-expertise certification (approved = each required_expertise certified) + the
   experts registry (who holds each role) + the authority-persona verifier + learning
   loop. Do NOT build ahead of proof.

## Hard rules learned (do not relearn)
- Boris DECIDES architecture/Claude-Code mechanics; ASKS Nick only business reality.
  Don't invert. Pattern-match Nick's existing conventions FIRST.
- An agent = a folder with a persona CLAUDE.md you launch into
  (`capabilities/agents/` or `practices/`); NEVER `.claude/agents/`.
- OS-owned artifacts stay INSIDE `~/code/work`.
- No fabrication: the Assembler emits INSUFFICIENT_SOURCE rather than invent; honor it.
- Standards are iterations: when the gate mis-fires (e.g. a stale rubric), tune the
  standard, don't fight the content.
- Frame before build (5 lines: what/size/where/whose-call/smallest-slice); smallest
  slice first; re-frame on growth; verify then report.

## Read on start
- `reference/operating-protocol.md`, `reference/studio-architecture-conventions.md`,
  `reference/system-building-method.md`, `reference/system-anatomy.md`,
  `reference/agent-harness-architecture-research-2026-06-24.md`.
- Memories (MEMORY.md): deterministic-systems-produce-work, operating-protocol,
  expert-liaison-vision, boris-owns-architecture, projection-ui-launchd-service,
  kai-brand-website-store (CIPO).
