# HANDOFF — Continue the targeting flywheel (Deepline BYO keys → enrichment → conversation edge) — 2026-06-26

**To start the new session, paste this:**
> Read and execute this handoff: `/Users/nplmini/code/work/practices/agentic-systems/HANDOFF-targeting-flywheel-continue-2026-06-26.md`

Launch root: `/Users/nplmini/code/work/practices/agentic-systems` (loads Boris). North-star vision:
memory `project_targeting_flywheel_vision` (read it first). All work is on branch
`expert-liaison-curation-ledger`, committed + pushed through `40c5010`.

## The thesis (how everything here is built)
A system = a fixed **input contract** + a fixed **deterministic process**, with the LLM called only at
gated points where a **doctrine (real expertise) is the standard**. CODE owns the loop; AI is a *called
function* (never an autonomous agent driving). Every producer follows: load source → produce (AI) →
deterministic rules-gate → LLM-judge → propose → human-approve. Surfaces in projection-ui (`:4180`,
launchd `com.nick.projection-ui`, `npm run dev`, hot-compiles; do NOT start a 2nd dev server; restart via
`launchctl kickstart -k gui/$(id -u)/com.nick.projection-ui`). Canon = Supabase project `mzzjvoiwughcnmmqzbxv`.
All canon writes go through SECURITY DEFINER, service-role-locked RPCs. Scripts read env from
`/Users/nplmini/code/work/.env` and call the Anthropic API directly with `ANTHROPIC_API_KEY` (this is why
"runs" are billed API usage, not a chat session).

## Where the flywheel stands (4 of 5 pieces live)
The vision: an autonomous, self-optimizing prospect-discovery flywheel for CIPO. Signal watch → company →
enrich → contacts → qualify → DB → outreach (in Will's name) → Will's conversations → recorded → Canon →
fine-tune everything → loop.

- ✅ **Recipe object** (`discovery-recipe`, doctrine §8) — the worked-example pipeline shape, on `/targeting`.
- ✅ **Recipe-authoring agent** (`scripts/author-recipe.mjs`) — intent → discovers live deepline tools →
  composes a grounded pipeline → anti-fabrication check → records in `discovery_recipes`. Surfaced as the
  "Recipe library" on `/targeting`. Proven: authored "ip-leadership-hiring" from a novel intent.
- ✅ **Signal watch** (`scripts/watch-signals.mjs`) — free authoritative sources: ClinicalTrials.gov v2
  (no key, high volume) + USPTO Open Data Portal (`api.uspto.gov`, header `X-API-KEY=USPTO_API`, CPC A61*,
  low volume by ~18-mo publication lag). Lands companies in `prospects`. **DAILY CRON LIVE**: launchd
  `com.nick.signal-watch` (08:00, `--since-days 3`, idempotent; plist at `systems/canon-engine/launchd/`).
- ✅ **Prospect spine** (`prospects` table, mig 016) + `/prospects` surface. Holds ~197 real companies,
  growing daily on its own.
- ⏳ **Conversation → Canon feedback edge** — the LAST piece, not built. Record Will's prospect calls →
  Canon context → fine-tune the targeting artifacts / offer / copy / which signals to watch.

The enrichment/execution step (`scripts/enrich-prospects.mjs`) that turns the 197 signal-companies into
qualified leads with verified emails is BUILT but credit-gated: PLAN free (default), `--execute` spends
provider credits. On `/prospects` as "Plan enrichment" + "Execute (spends credits)".

## IMMEDIATE NEXT — in priority order

### 1. Deepline BYO keys (do this BEFORE any credit spend) — memory `feedback_deepline_byo_keys`
Nick already pays for providers; do NOT pay Deepline's markup for them. His keys are in `.env`:
`APOLLO_API_KEY`, `HUNTER_API_KEY`, `EXA_API_KEY`, `SERPER_API_KEY`, `ZEROBOUNCE_API_KEY`, `EXPLORIUM_API_KEY`.
Deepline's bring-your-own mechanism is `deepline secrets` ("manage play secrets without revealing values";
`deepline secrets check <NAME>`). Tasks: (a) confirm the exact BYO-provider-key flow (`deepline secrets`
+ any provider-key registration — read the `deepline-gtm` / `deepline-plays` skills and `deepline secrets
--help`); (b) wire Nick's 6 keys; (c) make `enrich-prospects.mjs` route through his keys (his Apollo for
company/people search, Hunter for email, ZeroBounce for verify, etc.). Deepline credits = fallback only.
He has 22.53 Deepline credits + an open Stripe checkout (1000 credits/~$96) but that's secondary to BYO.

### 2. Build out the enrichment execution (after BYO)
`enrich-prospects.mjs` is currently a gated stub (plan + a subscription probe). Build the real per-stage
execution using Nick's BYO providers: resolve company→domain, firmographics + segment screen
(segment-criteria), find icp-titles contacts, verified-email waterfall + catch-all (enrichment-spec §7.7),
qualify (list-qualification) → advance prospects to `enriched`/`qualified` via `advance_prospect`. The
approved `discovery-recipe` / the authored recipes name the exact tools/order. Run a tiny pilot first
(`--limit 2`) to validate before a batch. Qualified prospects then feed System M outreach (`/outreach`).

### 3. The conversation → Canon edge (closes the flywheel)
Record Will's prospect conversations → ingest into Canon as context → loop it back to tune the artifacts.
There's prior scaffolding: canon transcript-ingestion handoffs in `systems/canon-engine/` (HANDOFF-anarlog-
transcript-ingestion.md, HANDOFF-restore-meet-transcripts.md). This is Hermes-adjacent (expert interaction)
— route the expert-facing design to Hermes; Boris builds the data/edge.

## What was built this session (inventory)
Migrations (canon, `systems/canon-engine/supabase/migrations/`): `009` outreach-offer-ladder type, `010`
outreach_sequences, `011` targeting artifact types (segment-criteria, icp-titles, enrichment-spec,
list-qualification), `012` artifact_critiques, `013` artifact_operator_notes, `014` discovery-recipe type,
`015` discovery_recipes, `016` prospects spine. (Earlier session: 004-008 expert-liaison.)

Drivers (`systems/canon-engine/scripts/`): `govern-artifacts.mjs` (shared artifact engine — produce/gate/
judge; reviewer hardened this session), `produce-sequence.mjs` (outreach copy), `assemble-targeting-source.mjs`
(folds doctrine + canon + critique + notes into the producer source; produce route re-assembles first),
`critique-targeting.mjs` (the Deepline craft critic — buildability), `author-recipe.mjs` (recipe-authoring
agent), `watch-signals.mjs` (signal watch), `enrich-prospects.mjs` (gated execution).

Doctrine: `practices/revops/reference/targeting-enrichment-doctrine.md` — §1-5 method, §6 custom
authoritative sources (USPTO/ClinicalTrials/NIH/SBIR), §7 buildability rules, §8 the recipe standard.
Plus `outreach-offer-doctrine.md`, `linkedin-/cold-email-doctrine.md`.

Surfaces (projection-ui): `/outreach` (System M: offer ladder + LinkedIn/email copy + SME sign-off),
`/targeting` (the 4 input artifacts + reference recipe + Recipe library + Deepline critique + expert-input
notes), `/prospects` (the spine + run-watch + gated enrich), all on the Nav. Plus `/expert-liaison` (Hermes
packets — built by a parallel session). canon.systems registered: `outreach-producer`→/outreach,
`signal-targeting`→/targeting, `signal-monitoring`→/prospects.

## Open items / gotchas
- **MEMORY.md is >24KB (over the read limit)** — needs compaction (one line per entry, detail in topic
  files). A maintenance task for a fresh session with budget.
- USPTO patent watch is correct but LOW VOLUME (publication lag) — clinicaltrials is the volume source.
- `author-recipe.mjs` flags "ungrounded" tool ids (e.g. it named `serper_google_search`/`exa_search` not in
  the pulled catalog) — those are surfaced for human verify, not auto-trusted. Fine; could widen the catalog.
- CIPO `value-proposition-canon` is required in the manifest but never produced (a small marketing gap).
- The targeting artifacts + recipes are DRAFTS pending Nick's approval + Will's SME sign-off (the `/targeting`
  + `/outreach` approve + "Send to Will" lanes route to the `/expert-liaison` packets).
- Don't spend credits (Deepline or Anthropic) on a big run without Nick's explicit go; pilots first.

## Read on start
- Memories: `project_targeting_flywheel_vision` ⭐ (north star), `feedback_deepline_byo_keys` ⭐,
  `project_list_build_targeting_system`, `feedback_build_systems_not_chat_outputs`,
  `feedback_every_system_interactive_surface`, `feedback_boris_owns_architecture`.
- The doctrine: `practices/revops/reference/targeting-enrichment-doctrine.md`.
- The deepline skills (`~/.agents/skills/deepline-gtm/`, `deepline-plays`) for the enrichment execution.
