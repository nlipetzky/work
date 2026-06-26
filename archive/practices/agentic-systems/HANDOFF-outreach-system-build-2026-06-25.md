# HANDOFF — Build the offer-first outreach system (System M) — 2026-06-25

**To start the new session, paste this:**
> Read and execute this handoff: `/Users/nplmini/code/work/practices/agentic-systems/HANDOFF-outreach-system-build-2026-06-25.md`

Approved plan (full detail, authoritative): `/Users/nplmini/.claude/plans/read-and-execute-this-velvety-stroustrup.md`
(The plan below is embedded here so this handoff is self-contained; if the two ever differ, the plan file wins.)

---

## The thesis this build proves (read first — it's why we're doing it this way)
The AI alone cannot build a system; **encoded expertise has to shape it.** A real system = a fixed
**input contract** + a fixed **deterministic process**, with the LLM called only at gated points where a
**doctrine (real expertise) is the standard.** Do NOT hand-produce copy or offers in chat — build the
machine that produces them. (Nick corrected this hard, twice, this session — see memories
`feedback_build_systems_not_chat_outputs`, `feedback_every_system_interactive_surface`.)

Offer-first: **create the offer (ladder) first; everything written hinges on it.**

## What already exists (committed to `main` @ `c6cde9a`)
- **Expert Liaison system, end to end:** curation ledger (`source_assessments`), experts registry
  (`experts`, Will + Nick seeded), `expert_exchanges`, the autonomous assessor (`assess-sources.mjs`,
  launchd `com.nick.el-assessor`), and the `/expert-liaison` console (Asks&Needs w/ inline answer+guide,
  Initiate, ledger, experts). The Artifact Assembler (`govern-artifacts.mjs`) produces governed context
  artifacts. CIPO has 6 approved artifacts incl. `offer-architecture-and-pricing` (the CORE retainer).
- The reusable producer pattern = `systems/canon-engine/scripts/govern-artifacts.mjs` (code-driven loop,
  AI as called function, rules-gate → LLM-judge → propose RPC, INSUFFICIENT_SOURCE no-fabrication).
- Branch `expert-liaison-curation-ledger` == `main`. Nothing pushed to remote.

## The realization that reorders everything
The approved CIPO offer is the **core retainer** (Scout/Shield/Arsenal $2.5/5/10k). Per the cold-email
methodology you do NOT pitch the retainer cold — you lead with a **front-end offer** (loss-leader /
Trojan-horse / reverse-lead-magnet) that opens the door and ladders to the retainer. **That front-end
offer for CIPO does not exist.** So copy has nothing certified to hinge on yet. Offer first, then copy.

The expertise is already ours: NotebookLM **"Cold Email"** notebook (`a50bacaf-2622-4b27-b0a9-f2a24995449f`)
= the **Lead Gen Jay** cold-email course (offer-first; references Hormozi). The existing
`practices/revops/reference/cold-email-doctrine.md` + `linkedin-outreach-doctrine.md` extracted the copy
*form*; they did NOT extract the **offer-construction** method (offer-killers; the 3 front-end strategies;
the ladder). That's Phase 1.

## The build — three phases, offer-first (each phase = a governed, surfaced artifact, never a chat output)

### Phase 1 — Extract the offer-construction doctrine
NEW `practices/revops/reference/outreach-offer-doctrine.md`, distilled from the Lead Gen Jay notebook
source (query it via NotebookLM MCP; source id `67895d46-6d7a-46d1-85fc-f802107d7d7b`) + optionally index
Hormozi $100M Offers: offer-killers (boring/competitive/absurd/complex → spam), front-end-offer strategies
(loss-leader / Trojan-horse / reverse-lead-magnet), the front-end→core ladder, blue-ocean targeting.
Reference artifact, no code. This is the sourced standard the offer producer's gates enforce.

### Phase 2 — Define the CIPO cold-outreach offer ladder (THE HINGE; needs Will/Nick)
Register `outreach-offer-ladder` in `canon_artifact_types` + a CIPO `canon_artifact_manifest` row whose
`standard_rules`/`standard_rubric` = the Phase-1 doctrine. Produce it via the **existing**
`govern-artifacts.mjs` (no new driver), hinging on: approved core `offer-architecture-and-pricing` +
`sme-credibility` (medical-device/biotech = primary segment) + the offer doctrine. It proposes front-end-
offer options (e.g. a reverse-lead-magnet "custom IP-exposure read," a loss-leader discrete FTO) laddering
to the retainer. Surfaced on the `/expert-liaison` console for **Will/Nick to choose + approve** — front-
end-offer choice is theirs; **no pricing committed without Will** (faithfulness-constraints). Approved
ladder = the certified hinge.

### Phase 3 — System M: the copy producer (only AFTER the offer ladder is approved)
LinkedIn module, v0 = a *template* sequence (merge fields), not per-prospect personalization.
- **Store:** NEW migration `009_outreach_sequences.sql` — `outreach_sequences(id, engagement_type,
  engagement_id, play, channel, sender_expert_slug, steps jsonb [{order, action_type, delay_hours, copy,
  char_count, source_map[]}], note_variants jsonb {noted,noteless}, status draft|approved, flags jsonb,
  version, metadata, timestamps)`. RLS service-role + `fn_set_updated_at`; `record_outreach_sequence` /
  `confirm_outreach_sequence` SECURITY DEFINER RPCs, service-role-locked.
- **Driver:** NEW `systems/canon-engine/scripts/produce-sequence.mjs` (forks `govern-artifacts.mjs`).
- **Surface (own tab per the surface mandate):** NEW `app/outreach/{page.tsx, OutreachSurface.tsx}` +
  `lib/queries/outreachSequences.ts` + `app/api/outreach/{produce,confirm}/route.ts`; EDIT
  `components/Nav.tsx`. Renders steps + per-line source map + doctrine-compliance checklist + flag list +
  Produce + read-before-approve. (Mirror the `/expert-liaison` build.)
- **Register** System M in `canon.systems` (owner Kepler, outreach constellation, depends_on
  demand-context, beta) + a `system_triggers` row (manual Produce now).

## THE DETERMINISTIC MACHINE (this is the part Nick most wants right — inputs + process)
Same machine for the offer producer (Phase 2) and the copy producer (Phase 3); shown for the copy producer.

**Input contract — required inputs, each with a role; BLOCK + name the gap if any is missing/unapproved
(never fabricate):**
- HINGE = approved `outreach-offer-ladder` (what the copy leads with).
- SUBSTANCE = customer-problem-model, mechanism-of-action, icp-and-disqualifiers.
- VOICE = sme-voice (+ refused-phrasings blacklist), sme-credibility (proof-per-segment), sme-identity
  (credentials), sme-hot-takes (hooks + their cold-copy-approval flags).
- HARD RULES = faithfulness-constraints (no "attorney/lawyer/counsel"; no pricing; hard exclusions).
- FORM = linkedin-outreach-doctrine + the Phase-1 offer doctrine.
- SELECTOR = the target segment (decides which proof the credibility map yields).
- (later) per-prospect research snippet (2-8 words) from System A.

**Process — deterministic pipeline (AI is a called function ONLY at steps 2 and 4):**
0. (code) Load + validate the input contract → missing/unapproved = block, name the gap.
1. (code) Select — front-end offer (angle) from the ladder; segment proof from credibility map; refused-
   phrasings blacklist; doctrine sequence shape. Pure lookups.
2. (AI, gated by doctrine) Produce each touch of the doctrine-shaped sequence from ONLY the loaded inputs,
   in the SME voice, each line source-tagged. INSUFFICIENT_SOURCE rather than invent.
3. (code) Rules-gate (doctrine as machine checks): note ≤300 / no-pitch / no-link; sequence shape present
   (connect + weighted post-accept DM + profile-visit stack + follow-up + breakup); ≥3h delays; no refused
   phrasings; no "attorney"; no pricing; every line source-tagged; reading-level. Fail → loop to 2.
4. (AI, gated by rubric) Judge: voice fidelity; note-aims-at-reply-not-accept; no invented POV; low-
   resistance CTA; concrete-visual-falsifiable. Fail → loop to 2.
5. (code) Assemble sequence object + line-by-line source map + flag list.
6. (code) Propose via RPC as a draft (governed checkpoint).
7. (human) Approve on the console; flags route to Will via an `expert_exchanges` row. Nothing sends unapproved.

## Scope guard (NOT in this build)
Per-prospect personalization (System A integration); the email module + Systems I/O/F; the HeyReach
send-wire (System O — but shape `steps` to map to HeyReach's 7-step model); demand-context buyer-language
(GAP — v0 substance = the approved certified CIPO artifacts, not a guess).

## Verification (per phase)
1. Phase 1 doctrine reads as real method (offer-killers, 3 front-end strategies, the ladder), sourced.
2. `govern-artifacts run venture konstellation-cipo --artifact outreach-offer-ladder` → draft on console →
   Will/Nick approve the front-end offer.
3. `apply_migration` 009 (advisors clean) → `produce-sequence.mjs venture konstellation-cipo linkedin` →
   doctrine-compliant sequence hinging on the approved offer → renders on `/outreach` (:4180 launchd — do
   NOT start a 2nd dev server; restart via `launchctl kickstart -k gui/$(id -u)/com.nick.projection-ui`)
   with source map + doctrine checklist + flags → Will approves.

## Read on start
- This plan's source docs: `practices/revops/reference/{cold-outreach-system-design.md,
  linkedin-outreach-doctrine.md, cold-outreach-context-substrate.md, cold-email-doctrine.md}`.
- The reusable producer: `systems/canon-engine/scripts/govern-artifacts.mjs`.
- The console pattern to mirror: `systems/projection-ui/app/expert-liaison/*`.
- NotebookLM "Cold Email" (`a50bacaf…`) for the offer methodology; "KAI Offers" (`9597dc22…`) may inform
  the CIPO front-end offer.
- Memories: `feedback_build_systems_not_chat_outputs` ⭐, `feedback_every_system_interactive_surface` ⭐,
  `project_curation_ledger`, `feedback_systems_first_first_5`, `project_deterministic_systems_produce_work`,
  `kai_brand_website_store` (CIPO), `project_expert_liaison_vision`.

## Note
A hand-freestyled `accounts/ventures/konstellation-cipo/artifacts/copy-cipo-linkedin-will-v0.md` exists on
disk — it's the amateur output Nick rejected (kept only for its source-map format as reference). The
SYSTEM (Phase 3) produces the real one; do not treat that file as the deliverable.
