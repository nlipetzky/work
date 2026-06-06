# Expert-to-Campaign Workflow

**Status:** Living document. Reflects what's actually built and what's been learned through 2026-05-29. Cross-practice canon. Stewarded by Boris (agentic-systems). Consumed by Hermes (expert-liaison), Kepler (sales-and-gtm), revops, automation, and content practices.

**Purpose:** A definitive, step-by-step description of how a new domain expert moves from "we have an interesting person" to "outbound under their name is generating conversations." Use as a checklist and as the source of truth for what each substrate component is for.

---

## Mental model

This is an **expert digitization system**. Cold outbound copy is one downstream projection of the expert template. Other projections (briefings, inbound chat, posts, vetting) consume the same substrate.

Five substrate units feed one outcome ... **booked conversations the expert would consider worth having**:

- **Expert** — the SME being monetized
- **Offer** — one slice of the expert's value × a specific market
- **Intent** — the operator goal for one outbound run
- **Prompt** — versioned projection rule (substrate → output)
- **List** — the actual cohort being contacted

Plus three governance / loop layers:

- **Draft Variants** — generated copy options awaiting expert approval
- **Exchanges** — Hermes-tracked asks/responses
- **Conversations** — recorded calls feeding the customer-discovery loop into Canon

Per Will Rosellini's framing: **the conversations are the primary product, not the lever toward sale.** Customer discovery is the value, revenue is the byproduct.

---

## Bases and substrates

- **Liaison base** (`appbFsdqrC5vnxuIR`) ... Experts, Expert Artifacts, Core Offers, Intents, Prompts, Draft Variants, Exchanges, System Artifacts, Copy Generation, Conversations. The relationship and projection substrate.
- **RevOps Surface base** (`appYBYH3aOHhTODAw`) ... Companies, Contacts, Enrichment Runs, Playbooks, Signal Drafts. The list-build and prospect-data substrate.
- **Filesystem** (`accounts/ventures/<venture>/artifacts/`) ... source-of-truth for artifact bodies. Liaison records point at file paths.
- **Canon** (Supabase project `mzzjvoiwughcnmmqzbxv`) ... bounded reality ontology, knowledge layer. Receives stabilized projection rules and signals.

---

## Phases

### Phase 0 — Onboard the expert

**Goal:** Establish the expert as a partner; create their record.

**Decisions to lock:**
- Equity / retainer / relationship structure (e.g. Will: 42% unit membership; Nick: 20% hedge-fund-manager position on incubated companies)
- Engagement assignment (Konstellation AI, future ventures)
- Time boundaries (hours/week the expert commits to approvals + conversations)

**Tables / systems:**
- Experts table (Liaison)

**Outputs:**
- One Experts record per expert with:
  - Expert Name, Core Title (multi-vector if applicable), Authority Vectors (one section per vector), Linguistic DNA (voice + refused phrasings summary), Expert Summary

**Failure modes seen:**
- Single-vector framing ("biotech operator" misses IP attorney + govt R&D + neuromorphic vectors → undercuts monetization options)
- Equity ambiguity surfaces mid-campaign

### Phase 1 — Capture the expert template (Expert Artifacts)

**Goal:** Decompose the expert across the 11 artifact types so any output under their name can be source-tagged.

**Artifact types (one record per type per expert):**

| Type | What it captures |
|---|---|
| voice | How they write and speak |
| identity | Who they say they are |
| credibility | Deals, exits, awards, verifiable public claims |
| hypotheses | What they think is happening in the market |
| decision-profile | How they make calls under pressure |
| war-stories | Specific prior cases with numbers |
| hot-takes | Strong public opinions they've voiced |
| patterns | What they keep observing across engagements |
| network | Who they know and trust |
| refusals | Phrases they won't use, claims they won't make |
| time-boundaries | When / how / for whom they engage |

**Source material:**
- Podcast transcripts (theirs and ones they were on)
- LinkedIn posts (last 12-24 months)
- Public bio + press
- Deal records (company, year, dollar figure, outcome)
- Direct interviews / SME extraction sessions (Hermes-facilitated)

**Tables / systems:**
- Expert Artifacts table (Liaison) — 11 records per expert, linked to Expert
- Filesystem at `accounts/<type>/<engagement>/artifacts/sme-<type>-<expert-slug>-v<n>-<date>.md`
- File Path field on each Expert Artifact record

**Outputs:**
- 11 Markdown files on disk
- 11 Expert Artifact records linked to the Expert

**Failure modes seen:**
- File on disk but Airtable record empty / draft (substrate-aware tooling thinks the artifact is empty)
- Single-domain bias when the expert is multi-vector (only biotech credibility populated, IP and AI systems missing)
- Refused-phrasings list left empty → constraint can't fire in prompts

### Phase 2 — Define the offer (Core Offers)

**Goal:** Productize one slice of the expert × market. Each offer is a specific monetization vector.

**Per offer, populate:**

| Field | Purpose |
|---|---|
| Offer Name | e.g. `KAI Medical Device Robotics`, `KAI AI Advisory + IP Retainer` |
| Delivery Environment | What gets delivered and how (retainer / one-time / success fee) |
| Diagnostic Gate | The 15-30 min call frame + what the expert diagnoses |
| The Pivot Script | How the conversation pivots from interest to engagement |
| Audience & List Criteria | Ideal cohort + adjacent + actual list filter (operator populates per campaign) |
| Missing Signals | Signals the list does NOT carry. Critical for catching assumption-based copy. |
| Experts Linked | Multi-record link to one or more Experts |

**Tables / systems:**
- Core Offers (Liaison) ... links to Experts and Copy Generation

**Failure modes seen:**
- Audience description in prose only, no actual filter spec → list-build mismatch (the 84-vs-16 incident)
- Missing Signals field empty → prompts anchor copy on signals that don't exist on the list (Series-A-funding hook on a list with no funding date)

**Open gaps:**
- No structured List Build Spec field yet (industry codes, title regex, revenue source, exclude rules) ... currently lives as prose

### Phase 3 — Define the intent (Intents)

**Goal:** State the operator goal for one specific outbound run. One intent per (vector × channel × audience) combination.

**Per intent, populate:**

| Field | Purpose |
|---|---|
| Name | Slug, e.g. `cold-outbound-medical-device-robotics-warm-reply` |
| Outcome | The state of the world we're aiming for |
| Success Criteria | Quantitative thresholds (reply rate, asset-request rate, zero-spam) |
| Constraints | Channel constraints, length limits, banned phrases, signal-anchoring rules |
| Target Persona | Who we're writing to (cohort) |
| Required Context Types | Which substrate types must be loaded (sme, offer, target, etc.) |
| Routing | operator, approval loop, send mechanic, sender identity, vector |
| Status | draft / active / archived |

**Tables / systems:**
- Intents (Liaison) ... currently 4 active intents for Will (medical device robotics, IP attorney, SBIR arbitrage, AI enterprise audit)

**Failure modes seen:**
- Channel baked into constraints (`Email 1 ≤ 120 words`) when channel is LinkedIn → catches at variant review
- Target Persona embedded vs offloaded to linked Offer → drift between intent and offer audience definitions

### Phase 4 — Define / fork the prompt (Prompts)

**Goal:** Versioned projection rule that the LLM uses to convert substrate into output. Fork on every material change.

**Per prompt:**

| Field | Purpose |
|---|---|
| Name | Family slug, e.g. `cold-outbound-sme-led` |
| Version | Integer, increments per fork |
| Body | Full prompt with `{{contexts}}`, `{{outcome}}`, `{{success_criteria}}` template variables |
| Parent Prompt ID | Self-reference for fork lineage |
| Status | draft / stable / superseded |
| Notes | What changed in this version |

**Current prompts:**
- v0: email-format (historical, kept for record)
- v1: LinkedIn DM aware + Missing-Signals aware (stable, used for variant generation)

**Tables / systems:**
- Prompts (Liaison)

**Failure modes seen:**
- Prompt body too generic (doesn't enforce Hard Rule 1 source-tagging) → fabricated claims slip through
- Prompt format mismatched to channel (Email N: Subject/Body) → variant labels wrong
- Prompt doesn't consult Missing Signals → anchors copy on unavailable signals

### Phase 5 — Build the contact list (Clay → RevOps Surface)

**Goal:** Build a cohort matching the Offer's Audience & List Criteria, sync to RevOps Surface for downstream use.

**Steps:**

1. Open Clay Find Companies surface.
2. Run a Sculptor prompt that translates the Audience criteria into queryable filters (industry codes, keywords, revenue, geography, exclusions). See `clay-sculptor-prompting` skill.
3. Validate Sculptor's interpretation on a sample before running full enrichment.
4. Enrich → Find People at those companies (filter by CEO/Founder/President titles).
5. Tag the resulting records with `Discovery Sources = clay_<offer_slug>` (e.g. `clay_mdr`).
6. Sync to RevOps Surface Companies + Contacts tables.

**Tables / systems:**
- Clay workbook
- RevOps Surface base (Companies, Contacts)
- `Discovery Sources` field as the campaign-cohort tag

**Failure modes seen:**
- Industry filter not enforced in Clay → cohort contaminated with providers (hospitals, clinics) when offer targets manufacturers (`clay_mdr` 50% provider contamination)
- Title filter applied at list-build time but not at sync-to-HeyReach time → wrong titles end up in campaign
- Sculptor interpretation drifts from intended Audience → silent miss

**Open gaps:**
- No automated audit between Clay → RevOps Surface and the Offer's Audience criteria

### Phase 6 — Filter and verify the list

**Goal:** Apply the Audience filter rigorously before pushing to HeyReach. **This is the audit gate we currently lack and must build.**

**Manual checks today (until automated):**

1. Pull all RevOps Surface Companies with `Discovery Sources = clay_<offer_slug>`.
2. Apply industry exclusion (e.g. exclude `Hospitals and Health Care` from `clay_mdr`).
3. For each surviving company, get linked Contacts.
4. Apply title filter (CEO/Founder/President).
5. Extract LinkedIn URLs.
6. Sample-classify ~15 contacts: do they actually match the offer's intended persona?
7. If fit rate < 80%, regenerate or refine the Clay query before proceeding.

**Tables / systems:**
- RevOps Surface Companies + Contacts
- Airtable MCP

**Failure modes seen:**
- Skipped this phase entirely → 84 wrong leads loaded into HeyReach campaign (resolved 2026-05-29 by pulling 16 right contacts via MCP)

**Open gaps:**
- No automated Boris-classify-against-Offer-criteria step. Highest-priority structural fix.

### Phase 7 — Generate draft variants

**Goal:** Produce N variant approaches against the same Intent × Offer × Expert × Prompt baseline. Different opening angles. Expert picks favorite(s).

**Variant angles to consider:**

| Angle | Lead | When it works |
|---|---|---|
| SME-credibility | Open with the expert's authority | Sophisticated buyer respects credentials |
| Hot-take | Open with strong expert opinion | Audience values intellectual provocation |
| Industry-pattern | Open with reframe of the buyer's bottleneck | Buyer hasn't named the pattern yet |
| Board-question / diagnostic | Open with question about the buyer's situation | Buyer reports to board, faces strategic questions |
| War-story-led | Open with specific prior case | Buyer-domain matches expert's prior case |
| Peer-acknowledgment | Open by naming what the prospect just did | Recent visible trigger event on the list |

**Per variant, populate:**
- Output Text (Connect Note + DM 1 + DM 2 + DM 3 for LinkedIn)
- Source Map (line-by-line trace to substrate)
- Flags (inferred claims, promised assets, structural concerns)
- Links: Expert, Offer, Intent, Prompt

**Tables / systems:**
- Draft Variants (Liaison)

**Failure modes seen:**
- Variant anchors hook on a signal in Offer's Missing Signals → expert catches at review (Series A close hook in V1 → expert review caught it)
- Promised assets in CTA ("the framework I'd send") without an actual asset to send → ship-blocker until asset exists

**Multi-variant generation option:** Workflow tool can fan out N variant agents in parallel, each writing back to Draft Variants. See workflow patterns documented in agentic-systems/reference.

### Phase 8 — Route to expert for approval (Hermes)

**Goal:** Expert reviews variants, confirms or red-lines [INFERRED] flagged lines, picks the variant(s) to ship.

**Steps:**

1. Compose review email (or whatever channel expert prefers — Will = email).
2. Include for each variant: full output text + flag list inline (don't make expert click into Airtable if they prefer email).
3. State recommendation (which variant to ship first) and why.
4. State explicit asks: confirm/fix flagged lines, decide on promised assets, pick variant(s).
5. Send.

**On expert reply:**

1. Update Draft Variants record's Output Text with expert's edits.
2. Update Will Response field with verbatim reply + flag resolutions.
3. Flip Status to `approved` / `rejected`.
4. Log routing in Exchanges table (channel, ask, sent, received, response).

**Tables / systems:**
- Draft Variants (Liaison) — update fields
- Exchanges (Liaison) — log the routing event
- Email or LinkedIn DM to the expert

**Failure modes seen:**
- Email asks expert to "go to Airtable" → friction, slows approval. Solution: paste full copy inline so expert can reply with edits.
- Boris promises an asset in DM CTA → ship-blocker pending expert confirmation that asset exists

**Open gaps:**
- No automated Gmail-label intake of expert responses yet. Manual paste-into-Airtable today. Worth building once a recurring approval pattern exists.

### Phase 9 — Build the HeyReach campaign

**Goal:** Operational outbound runtime configured with the approved copy and filtered list.

**Steps:**

1. **Create HeyReach lead list** via MCP (`create_empty_list`).
2. **Add filtered LinkedIn URLs to the list** via MCP (`add_leads_to_list_v2`).
3. **In HeyReach UI**: Open campaign, set sequence:
   - Connect Note → 10-day wait for accept
   - On Accept: 3 hours → DM 1 → 3 days → (if no reply) DM 2 → 7 days → (if no reply) DM 3 → End
   - All Replied branches → End
   - Strip Like Post, View Profile, and any engagement-nudge nodes
4. **Paste approved variant** (Connect Note + DM 1/2/3) from Airtable into the corresponding sequence nodes.
5. **Confirm sender** = expert's LinkedIn account (e.g. Will = account ID `158703`).
6. **Load credits** in the Konstellation AI workspace.
7. **Link campaign to new list** (UI-only; MCP can't reassign).

**Tables / systems:**
- HeyReach MCP (create_empty_list, add_leads_to_list_v2)
- HeyReach UI for sequence + list linkage
- Airtable Draft Variants record as copy source-of-truth

**Failure modes seen:**
- Template chosen with engagement nudges (Like Post, View Profile) Will wouldn't actually do → strip them
- Campaign linked to old/wrong list → confirm list ID matches new filtered list

### Phase 10 — Test send (small batch)

**Goal:** Confirm formatting, sender, and sequence behave correctly before scaling.

**Steps:**

1. Resume campaign limited to 3-5 contacts.
2. Verify connect notes go out under expert's name.
3. Verify length: connect ≤280 chars, DMs ≤120/80 words.
4. Verify no markdown formatting leaked into the actual sent message.
5. Watch for HeyReach errors (auth, rate, profile not found).
6. Pause if anything looks off.

**Failure modes seen:**
- Markdown headers (`### Connect Note`) accidentally pasted into the actual send → sequence has to be edited per node, not copy-pasted whole

### Phase 11 — Scale

**Goal:** Run the campaign at full list volume within LinkedIn's rate limits.

**Operating envelope:**
- LinkedIn caps: ~20-40 connection requests/day on Sales Navigator accounts.
- 50-contact list plays out over 3-5 days for connect-request phase.
- Follow-up DMs trickle accordingly.
- Full sequence (connect → DM 3) ~21 days from first touch.

**Tables / systems:**
- HeyReach campaign + MCP for monitoring (`get_overall_stats`, `get_leads_from_campaign`)
- Airtable Draft Variants record — flip Status to `sent` once initial sends are out

### Phase 12 — Capture conversations (the value loop)

**Goal:** Every reply, conversation, and call becomes a record that feeds Canon and informs offer iteration.

**Per conversation, log:**

| Field | Purpose |
|---|---|
| Name | `Expert × Prospect — Date` |
| Date, Participants | metadata |
| Source Type | sales_call / discovery_call / partner_meeting / advisory_call |
| Channel | phone / zoom / google_meet / in_person |
| Transcript Source | URL or file path to transcript |
| Recording Source | URL to recording |
| Signals Extracted | Bulleted signals derived from the conversation |
| Customer Discovery Insights | What we learned about the market |
| Market Pain Points Surfaced | Specific pains named by the prospect |
| Product Direction Implications | What this conversation suggests we should build / pivot toward |
| Linked Expert / Offer / Draft Variant | Provenance back to substrate |
| Status | scheduled / completed / transcript_pending / signals_extracted / archived |

**Tables / systems:**
- Conversations (Liaison)

**Per Will's framing:** 50 calls with zero revenue = "huge win" if signals are extracted. The conversation is the product.

### Phase 13 — Loop back

**Goal:** Feed conversation signals back into substrate to sharpen the next campaign.

**Updates triggered by Conversations:**

- **Offer's Audience & List Criteria** ... if conversations reveal a different cohort is responding, refine the audience.
- **Offer's Missing Signals** ... if conversations reveal signals we should have filtered for, add them.
- **Prompt fork** ... if a winning variant pattern emerges, codify it in a new prompt version.
- **Intent's Success Criteria** ... if positive_reply_rate calibration was off, update.
- **New Offer records** ... if conversations surface adjacent monetization vectors, draft them.
- **Expert Artifacts** ... if expert says something new and notable on a call, update voice/hot-takes/patterns artifacts.

**Tables / systems:**
- All Liaison substrate tables; Canon for the stabilized layer

**Outcome:** Each campaign run sharpens the substrate. Variant generation gets better. Offers get more specific. The expert's digital template becomes more useful across more projection surfaces.

---

## Failure modes catalogue (from real campaigns)

| Where | What went wrong | Lesson |
|---|---|---|
| Phase 2 | Series-A funding hook anchored on signal the list didn't have | Missing Signals field must be populated and Prompt must read it |
| Phase 3 | Intent constraints said "Email 1 ≤ 120 words" when channel was LinkedIn | Channel must be explicit in routing AND constraints |
| Phase 5 | Clay search pulled 50% hospitals/clinics into a manufacturer-targeted list | Industry filter must be enforced at Clay AND at sync-to-HeyReach |
| Phase 6 | List loaded to HeyReach without audit → 84 wrong leads | Audit gate must be built and run before HeyReach push |
| Phase 7 | Variant promised an asset the expert didn't have to send | Promised-asset CTAs require expert pre-confirmation |
| Phase 8 | Boris over-indexed on EF-framework prompt vocabulary | Use plain-language task-focused prompts; EF is architecture frame, not LLM frame |
| Phase 9 | Default HeyReach template included engagement nudges | Strip Like Post / View Profile for direct-only sequences |

---

## Open gaps to build (in priority order)

1. **Pre-send list audit (Phase 6)** — automated LLM classification of a sample against Offer's Audience criteria, fit % reported, block if < threshold. Highest-priority because this gap caused the largest waste.
2. **Structured List Build Spec field on Core Offers** — NAICS, title regex, revenue source, exclude rules. Currently prose. Required for the audit step to know what "fit" means.
3. **Source-of-truth log of the Clay query** that produced each list. Stored on the resulting list record. Enables tracing failed lists to their query.
4. **Hermes Gmail intake** — labeled threads (`liaison/<expert>/approvals`, `/redlines`, `/questions`) sync into Exchanges. Removes manual paste step.
5. **Multi-variant generation workflow** — Workflow-tool script that fans out N variant agents in parallel against one (Intent × Offer × Expert × Prompt) baseline.
6. **Per-prospect personalization workflow** — pipeline that applies an approved variant to N prospects, writing to Copy Generation.
7. **Conversation signal extraction workflow** — given a transcript, agent fills Signals Extracted, Customer Discovery Insights, Market Pain Points, Product Direction Implications.
8. **Reply / booking feedback loop** — HeyReach webhook → Conversations table auto-population on reply.

---

## What this workflow is not

- Not a copywriting system. Copy is one downstream projection.
- Not Will-specific. The substrate generalizes; Will is the first expert through it.
- Not a one-shot template. Each campaign sharpens the next via Conversations → substrate updates.
- Not automated end-to-end. Manual gates at Phase 6 (list audit), Phase 8 (expert approval), Phase 9 (HeyReach UI sequence build) are intentional today; some will close as the gaps above get built.

---

## Reference

- **Liaison base:** `https://airtable.com/appbFsdqrC5vnxuIR`
- **RevOps Surface base:** `https://airtable.com/appYBYH3aOHhTODAw`
- **Filesystem artifacts:** `/Users/nplmini/code/work/accounts/<type>/<engagement>/artifacts/`
- **Canon Engine (Supabase):** project `mzzjvoiwughcnmmqzbxv`
- **HeyReach workspace:** Konstellation AI
- **Will's LinkedIn account in HeyReach:** ID `158703`, `linkedin.com/in/willrosellini`
