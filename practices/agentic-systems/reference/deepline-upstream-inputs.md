# Deepline Upstream Inputs

**Document type:** Reference (what must exist before Deepline can execute)
**Pairs with:** `deepline-methodology.md`, `deepline-user-experience.md`, `deepline-tactical-execution-discipline.md`
**Subject:** The complete set of strategic, operational, runtime, and system inputs Deepline needs to be handed before its tactical execution discipline can produce useful work
**Owner:** Nick Lipetzky
**Created:** 2026-06-08
**Purpose:** Definitive checklist of upstream inputs. The tactical discipline doc explains what Deepline DOES; this doc explains what Deepline must be GIVEN. Use as a pre-flight checklist before triggering any Deepline run.

---

## 0. Frame ... the input contract

Deepline's responsibility is tactical execution. It does not produce strategic GTM decisions ... it consumes them. Every Deepline session implicitly assumes a set of upstream decisions have already been made and codified somewhere the agent can reference.

When those upstream inputs are missing, weak, or contradictory, three failure modes emerge:

1. **The agent improvises** ... it guesses at criteria, picks providers without context, and produces output that looks done but solves the wrong problem
2. **The operator gets dragged into upstream work mid-session** ... what was supposed to be an execution task becomes a strategy task in chat, breaking the framework's role separation
3. **The approval gate becomes meaningless** ... if the operator hasn't pre-decided what "good" looks like, they can't evaluate whether the pilot output meets the bar

The studio's existing practice skills (`offer-extract`, `segment-criteria`, `creative-brief`, `copy-draft`) exist precisely to produce these upstream inputs in artifact form. The KAI play artifact, ICP-titles artifact, and execution plan artifact are the venture-level instantiation of that upstream layer.

This doc enumerates every input Deepline needs. For each, it specifies: what the input is, why Deepline needs it, where it should come from, what format it should take, what "good" looks like, what happens if it's missing, and an example from the KAI Medical Device Robotics play.

---

## 1. The complete input inventory

Twenty-four inputs across four categories. Strategic and operational inputs are set per play or per engagement; runtime and system inputs are per session or global.

### Strategic inputs (set per play, codified in play artifacts)

| # | Input | Studio source |
| --- | --- | --- |
| 1 | Offer definition | `offer-extract` skill → offer artifact |
| 2 | Segment definition (industry, geo, size, stage) | `segment-criteria` skill → segment artifact |
| 3 | Hard disqualifiers / exclusion rules | `segment-criteria` skill (within segment artifact) |
| 4 | Sub-segment tagging logic | Play artifact |
| 5 | Title / persona list with tier sequencing | `segment-criteria` skill → ICP-titles artifact |
| 6 | Sender identity + credential | Play artifact + expert-liaison loop |
| 7 | Proof points / what's allowed in cold copy | `creative-brief` skill → creative brief artifact |
| 8 | Channel selection (LinkedIn vs email) | Play artifact |
| 9 | Volume target | Play artifact or execution plan |
| 10 | Personalization rule + hook sources | `creative-brief` skill + `copy-draft` skill |
| 11 | Cold copy / sequence (the actual messages) | `copy-draft` skill → sequence artifact |

### Operational inputs (set per engagement, codified in CLAUDE.md + setup artifacts)

| # | Input | Studio source |
| --- | --- | --- |
| 12 | Activation destination (HeyReach campaign, etc.) | Engagement CLAUDE.md |
| 13 | CRM landing schema (Airtable base + tables) | Engagement CLAUDE.md |
| 14 | Working directory convention | Operator convention |
| 15 | Cost budget (per-run cap, monthly cap) | Engagement governance |
| 16 | Approval authority | Engagement governance |
| 17 | Success criteria | Play artifact (per-play) |
| 18 | Termination criteria | Play artifact (per-play) |

### Runtime inputs (per Deepline session)

| # | Input | Source |
| --- | --- | --- |
| 19 | Triggering natural-language request | Operator |
| 20 | Input CSV (if task starts from a list) | Operator |
| 21 | Do-not-contact list | Existing-contact suppression artifact |
| 22 | Schedule / cadence | Operator |

### System inputs (set once globally)

| # | Input | Source |
| --- | --- | --- |
| 23 | Provider credentials | Deepline account setup |
| 24 | Deepline CLI + skill library install | Operator one-time setup |

---

## 2. Strategic input deep-dive

### 2.1 Offer definition

**What it is:** What is being sold, to whom, why now. The diagnostic gate. The outcome promised. The price posture (sketched, not committed for KAI; locked for billed clients).

**Why Deepline needs it:** Without the offer, the agent cannot judge whether a row "fits" the play. The offer is what makes "medical device manufacturer with $50M revenue" become "qualified prospect for the Diagnostic gate." It also shapes the personalization hook ... the hook must point at a pain the offer solves.

**Where it comes from:** `offer-extract` skill produces a markdown artifact at `clients/<client>/artifacts/revops-offer-<play-slug>.md` (or `ventures/<venture>/artifacts/` for ventures). For KAI's medical robotics play, the offer is implicit in the play artifact + the catalog's Diagnostic shape.

**Required format:**
- One-line outcome statement (e.g., "more warm leads for your salespeople")
- Named diagnostic gate (what the prospect must do to engage)
- Explicit list of "what we are NOT pitching cold" (architectural concepts, pricing, case studies)
- Explicit list of "what we ARE using as proof" (Will's credential, etc.)

**What "good" looks like:** Tight enough that a stranger reading it could draft a one-line cold-copy hook. Specific enough that an agent classifying a company can say "this company has the pain the offer addresses" or "this company doesn't."

**What happens if missing:** Agent improvises offer language in personalization hooks. Will gets cold copy that misrepresents the diagnostic. Replies misread the offer and the conversation derails.

**KAI example:** The offer lives in `accounts/ventures/konstellation-ai/artifacts/kai-internal-play-medical-device-robotics-v0-2026-05-26.md` Section "Offer hypothesis." Concrete shape: outcome = "more warm leads for your salespeople," gate = "you have to do the audit and the assessment," proof = Will's first US AI medical device approval credential.

---

### 2.2 Segment definition

**What it is:** The targeting rules in source-agnostic language. Industry, geography, size, stage, technology profile, signals.

**Why Deepline needs it:** This is the input to Phase 1 (Build the company universe). Without a precise segment definition, the agent cannot configure provider filters. With a vague segment definition, the agent burns credits on the wrong universe.

**Where it comes from:** `segment-criteria` skill produces `accounts/<type>/<name>/artifacts/revops-segment-<play-slug>.md`. Source-agnostic ... no column names, no provider names, no SQL.

**Required format:**
- Industry (taxonomy-mappable, not free text)
- Geography (country + region/state if relevant)
- Revenue band (with explicit floor and ceiling)
- Employee count band (if used; remember `feedback_company_size_not_a_gate.md` ... label, don't filter)
- Stage qualifier (post-revenue, pre-enterprise, etc.)
- Technology profile (if applicable)
- Hiring/funding/news signals (if applicable, as label-don't-filter)

**What "good" looks like:** Specific enough to map to provider filters without interpretation. Loose enough on size to label-not-filter (per studio rule).

**What happens if missing:** Agent pulls a too-broad or too-narrow universe. Too broad burns classification credits; too narrow misses qualified accounts. Either failure is invisible until reply data lands.

**KAI example:** From the play's Section "Target accounts" ... medical device manufacturers whose product IS a robot (surgical, rehab, diagnostic, imaging, delivery), $10M-$100M revenue, US + Canada, post-revenue + pre-enterprise. Explicit exclusion of RPA-serves-medtech.

---

### 2.3 Hard disqualifiers

**What it is:** The list of "never include these" rules. Categories of companies that fail the play regardless of how well they match the positive segment criteria.

**Why Deepline needs it:** Disqualifiers are the negative half of the targeting logic. They shape both the upstream provider filters AND the classifier prompts. Some disqualifiers are easy to encode as provider filters (geography); others need classifier logic (law firm vs medical device firm).

**Where it comes from:** Embedded in the segment artifact, with category labels:
- Geography disqualifiers (filter-encodable)
- Industry disqualifiers (filter-encodable for clean categories; classifier-encodable for fuzzy ones)
- Size disqualifiers (filter-encodable)
- Relationship disqualifiers (require a do-not-contact list ... see input #21)
- Sub-industry disqualifiers (often classifier-encodable)

**Required format:** Enumerated list with rationale for each. Rationale matters because the agent encoding it as a classifier rule needs to know what counts as "law firm" vs "law-adjacent legal tech."

**What "good" looks like:** Exhaustive. Categorized by how they get enforced (provider filter vs classifier vs DNC list).

**What happens if missing:** Disqualified companies leak into the activation list. Will sends a LinkedIn opener to a company he advises. Trust damage.

**KAI example:** From play Section "Disqualifiers": enterprise (>$100M revenue), law/IP firms, non-NA, companies Will has current advisory/board/commercial relationships with. Note the fourth one requires Will to produce a list ... it's a runtime DNC input, not a static rule.

---

### 2.4 Sub-segment tagging logic

**What it is:** Rules for tagging each qualified row with a sub-cohort label, when the segment spans multiple sub-categories that may have different reply patterns or sequencing.

**Why Deepline needs it:** Sub-segment tagging enables downstream prioritization, reply-rate analysis by sub-cohort, and v1 segment refinement. Without it, the play's "let reply data inform v1 prioritization" goal is unrecoverable.

**Where it comes from:** Play artifact. Should be a single enum with explicit "other" + null cases.

**Required format:**
- Enum values (e.g., surgical / rehab / diagnostic / imaging / delivery / other)
- Decision rule for each (what makes a row "surgical")
- Tiebreaker rule (when multiple apply, pick by ...)

**What "good" looks like:** Clean enum with non-overlapping categories. The "other" bucket exists so the agent doesn't force-fit.

**What happens if missing:** Reply data lands undifferentiated. Sub-cohort patterns are invisible. The play's learning loop loses one of its highest-value inputs.

**KAI example:** Play Section "Sub-segment open question" defines the enum but defers prioritization. Default: tag all five, let reply data inform v1.

---

### 2.5 Title / persona list with tier sequencing

**What it is:** The titles to target, in tiered priority order. Plus the rule for which tier runs first and what triggers Tier B activation.

**Why Deepline needs it:** This is the input to Phase 3 (contact discovery). The agent uses the title list as the people-search filter. Tier sequencing determines which contacts get pulled first.

**Where it comes from:** Separate `revops-icp-titles-<play-slug>.md` artifact, produced by the `segment-criteria` skill or by play decomposition. Lives at `accounts/<type>/<name>/artifacts/`.

**Required format:**
- Tier A titles (run first) ... explicit list, not "leadership"
- Tier B titles (run second, conditional)
- Tier C / skip list (do not pull)
- Sequencing rationale (why Tier A first)
- Activation condition for Tier B (e.g., "after message validation from Tier A")

**What "good" looks like:** Title strings that map cleanly to provider title filters. No ambiguous role labels ("leader," "head of"). Tier sequencing tied to a measurable trigger (e.g., "after 20 Tier A calls run").

**What happens if missing:** Agent pulls everyone matching a vague seniority filter. Tier A and B get blasted simultaneously. Reply data is uninterpretable because you can't tell what worked for which persona.

**KAI example:** `kai-internal-icp-titles-v0-2026-05-26.md`. Tier A = Founders/CEOs at $10-30M companies; Tier B = CCOs/VP Sales at $30-100M; Tier B activates after Tier A message validation.

---

### 2.6 Sender identity + credential

**What it is:** Who the outbound is attributed to, what their public credential is, and what voice rules apply to writing as them.

**Why Deepline needs it:** Sender identity drives the activation handoff (which HeyReach account, which LinkedIn profile). The credential drives what proof can appear in cold copy. Voice rules drive the personalization hook framing.

**Where it comes from:** Play artifact (the named sender) + creative brief artifact (the voice rules) + SME Voice artifact (the refused-phrasings list, per `copy-draft` skill).

**Required format:**
- Named sender (full name + role + company affiliation)
- Public credential (1-2 sentences, verifiable)
- LinkedIn profile URL + title (must match the credential)
- Voice rules: do/don't lists for tone, vocabulary, references
- Refused phrasings list (things the sender will never say)

**What "good" looks like:** Specific enough that a copy draft would be flagged if it violated voice rules. Credential tight enough that proof-point use in copy is unambiguous.

**What happens if missing:** Cold copy reads generic. Personalization hooks invent the sender's POV (the `copy-draft` skill explicitly flags this as a ship-blocker). Sender reputation damaged.

**KAI example:** Sender = Will Rosellini personally. Credential = first US AI medical device approval, commercialization + IP background. LinkedIn title updated by Will to "agentic AI strategist." Voice rules pending ... should be locked in a `kai-internal-sender-voice-v0.md` artifact before copy drafts run.

---

### 2.7 Proof points / cold copy constraints

**What it is:** The explicit list of what can and cannot appear in cold copy attributed to the sender. The negative list is as important as the positive.

**Why Deepline needs it:** When the agent (or the `copy-draft` skill) generates personalization hooks or sequence drafts, it must know what proof to lean on and what to avoid. Without this, the agent invents proof (the cardinal `copy-draft` sin).

**Where it comes from:** `creative-brief` skill produces a creative brief artifact. KAI's play artifact has this inline in "What we are NOT pitching cold" / "What we are using as proof in cold copy."

**Required format:**
- Allowed proof points (with source for each ... credential, public credential, prior artifact)
- Disallowed claims (with rationale)
- Pricing posture (almost always: "no numbers in cold copy")
- Case-study posture (almost always for new plays: "no case studies yet")

**What "good" looks like:** Every proof point has a verifiable source. The disallowed list explicitly names common over-reach patterns (architecture jargon, hypothetical case studies, unverifiable client outcomes).

**What happens if missing:** Cold copy includes invented proof points, architectural jargon the prospect doesn't understand, or pricing the sender hasn't committed to.

**KAI example:** Play Section "What we are using as proof in cold copy": Will's personal credential + updated LinkedIn title. Section "What we are NOT pitching cold": architectural concepts (Constellations, Clusters, Systems), pricing, case studies (no usable cold proof point yet).

---

### 2.8 Channel selection

**What it is:** Which outbound channel(s) the play uses, in what sequence, with what dependencies.

**Why Deepline needs it:** Channel selection drives activation routing. LinkedIn-first means push to HeyReach; email-first means push to a sequencer (Lemlist, Smartlead, Instantly). Sequencing rules determine whether multi-channel is parallel or staged.

**Where it comes from:** Play artifact Section "Channels."

**Required format:**
- Primary channel (launch first)
- Secondary channel (launch second, with dependency named)
- Tool for each (HeyReach, Lemlist, etc.)
- Sender account status (warmed, ready, dependent on warm-up)
- Domain warming status (for email channels)

**What "good" looks like:** Channel decisions paired with infrastructure readiness checks. Email-second with "Nick owns domain warming" is correct because it names the blocker.

**What happens if missing:** Agent picks the wrong activation provider. List ends up in HeyReach when it should have gone to Lemlist. Or worse, list gets pushed before sender infrastructure is ready and replies fall into a void.

**KAI example:** Play Section "Channels": LinkedIn first (HeyReach, Will's account active), email second (TBD tool, dependent on Nick's domain warming + LinkedIn reply data).

---

### 2.9 Volume target

**What it is:** The numeric target for delivered contacts in HeyReach (or equivalent activation destination). Drives over-provision math.

**Why Deepline needs it:** Without a number, the agent can't apply the over-provision-then-filter rule. It also can't size pilot expectations or estimate full-run credit cost.

**Where it comes from:** Play artifact (success metrics section) or execution plan.

**Required format:**
- Target N delivered contacts
- Pipeline multiplier guidance (1.4x for simple, 2x for full personalization pipeline)
- Stretch target (optional)

**What "good" looks like:** Numeric, not "as many as possible." Tied to a downstream metric (e.g., "50 contacts to land ~30 conversations at typical LinkedIn reply rates").

**What happens if missing:** Agent over-pulls (burns credits) or under-pulls (fails the volume goal). Approval message has no spend cap basis.

**KAI example:** Play Section "Success metrics" references "30 calls run with the template (Phase 6 milestone)" but doesn't name a contact-count target. Execution plan defaults: pull 70 enriched contacts to land 50 in HeyReach to net ~30 conversations.

---

### 2.10 Personalization rule + hook sources

**What it is:** The rule for what data Deepline should pull per contact to enable personalized outreach. Plus the source-tagging discipline.

**Why Deepline needs it:** Personalization is Phase 5 in the execution plan. The agent needs to know: scope (company-level vs person-level), what signals matter (funding, hiring, product launch, clinical milestone), what NOT to use, and what source-tagging rules apply.

**Where it comes from:** `creative-brief` skill (scope + signal list) + `copy-draft` skill (source-tagging discipline).

**Required format:**
- Scope (company-level only, person-level only, both)
- Signal taxonomy (funding event, hiring signal, product launch, clinical milestone, leadership hire, etc.)
- Allowed source types (verifiable URL required, no fabrication)
- Output shape (one hook + one source URL per contact)
- Strict source-tagging rule (per `copy-draft` skill: every line cites a source or is flagged as ship-blocker)

**What "good" looks like:** Specific signal types named. Source URLs required. Hook output shape is structured (one sentence + URL), not freeform.

**What happens if missing:** Agent invents hooks. Cold copy includes claims with no source. Replies catch the fabrication and trust collapses.

**KAI example:** Execution plan Phase 5: scope = company-level, signals = funding event / clinical milestone / FDA action / GTM leadership hire, output = one-sentence hook + source URL. Source-tagging discipline inherited from `copy-draft`.

---

### 2.11 Cold copy / sequence

**What it is:** The actual messages that will be sent. LinkedIn connect note + DM sequence; or email cadence; or both.

**Why Deepline needs it:** Deepline doesn't write the copy ... `copy-draft` skill does. But the copy must exist before activation (Phase 6), because the agent needs to push contacts into a HeyReach campaign that's already loaded with the sequence.

**Where it comes from:** `copy-draft` skill → sequence artifact at `accounts/<type>/<name>/artifacts/<play-slug>-sequence-v<n>.md`. Sequence goes through Hermes (expert-liaison) loop for sender approval before activation.

**Required format:**
- Per message: subject (email only) + body
- Per message: line-by-line source map (every line cites SME quote, credential, prior artifact, or generic-frame)
- Flag list for Hermes routing (any unsourced lines)
- Personalization variables explicitly named (e.g., `{first_name}`, `{hook}`, `{company}`)

**What "good" looks like:** Every line is sourced. Personalization variables match what Deepline's enrichment will produce. Sender has approved the sequence verbatim.

**What happens if missing:** Activation phase blocks. Or worse, agent pushes contacts into an empty campaign and HeyReach sits idle.

**KAI example:** Sequence is pending. Phase 6 cannot run until the copy passes through `copy-draft` + Hermes loop.

---

## 3. Operational input deep-dive

### 3.1 Activation destination

**What it is:** The exact target the enriched list gets pushed to. Campaign ID, list ID, or sequencer endpoint.

**Why Deepline needs it:** Phase 6 (activation handoff) requires a specific destination. "Push to HeyReach" is not enough ... which campaign? Under whose account? With what tags?

**Where it comes from:** Engagement CLAUDE.md or play artifact. Should include:
- HeyReach campaign ID (for LinkedIn)
- HeyReach sender account ID (which LinkedIn profile is sending)
- Sequencer ID + account (for email)
- Required tags for each lead (e.g., `play=<slug>`, `tier=<A|B>`, `cohort=<sub-segment>`)

**Required format:** Concrete IDs. Not "Will's HeyReach campaign for medrobotics" but `cmp_abc123` (or whatever HeyReach uses).

**What "good" looks like:** Destination is pre-configured with the sequence loaded. Tags are agreed upfront so cross-run filtering works later.

**What happens if missing:** Activation either fails or lands leads in the wrong campaign. Cross-run analysis breaks because tags are inconsistent.

**KAI example:** Per play, HeyReach campaign that Will has set up. Campaign ID needs to be captured in the play artifact or execution plan once it exists.

---

### 3.2 CRM landing schema

**What it is:** The Airtable base (or Salesforce object, or Supabase table) where post-activation events land. Plus the column mapping for what Deepline outputs feed which fields.

**Why Deepline needs it:** Phase 7 (event capture loop) requires a target schema. Without it, the agent can't wire the webhook → CRM workflow correctly. Schema drift between Deepline output columns and CRM expected columns is a common failure.

**Where it comes from:** Engagement CLAUDE.md. For KAI: Airtable base `app5tsy6zjfA8H3rx`, tables Prospects / Events / Artifacts / Learnings.

**Required format:**
- Base ID + table names
- Per-table column list with types
- Mapping from Deepline output CSV columns to CRM fields
- Required vs optional columns
- Unique-key / dedupe column (typically linkedin_url or email)

**What "good" looks like:** Schema documented in the engagement CLAUDE.md. Column-mapping artifact lives in the engagement folder. Schema validated against actual Deepline output shape before Phase 7 wiring.

**What happens if missing:** Webhook fires, payload arrives at Airtable, fails to insert because columns don't match. Silent data loss until someone notices replies aren't showing up.

**KAI example:** Per play Section "CRM and operational landing": Airtable base + 4 tables identified. Column mapping NOT yet documented ... flagged in execution plan Section "Context gaps named" as needing a schema-check pass before Phase 7.

---

### 3.3 Working directory convention

**What it is:** The naming convention for Deepline working directories within the project. Determines where intermediate CSVs land and how the operator finds them later.

**Why Deepline needs it:** Per the working directory discipline (tactical doc Section 2), the agent must use `deepline/data/<descriptive-slug>/`. The slug pattern needs to be agreed so multiple operators or sessions don't collide.

**Where it comes from:** Operator convention. Could be codified in the engagement CLAUDE.md.

**Required format:**
- Base path (always `deepline/data/`)
- Slug pattern (suggested: `<client-or-venture>-<play-slug>-<version>`, e.g., `kai-medrobotics-v0`)
- Version increment rule (when does v0 become v1)

**What "good" looks like:** Predictable slugs. Operator can find any prior run's output in <10 seconds.

**What happens if missing:** Slugs collide or become random. Operator can't find files. The "find last week's enrichment" question becomes a 20-minute archaeology dig.

**KAI example:** Execution plan specifies `deepline/data/kai-medrobotics-v0/`. Pattern: `<venture-slug>-<play-slug>-<version>`.

---

### 3.4 Cost budget

**What it is:** The per-run spend cap and the monthly cap. The agent's hard ceiling for any single approval.

**Why Deepline needs it:** Every approval message includes a spend cap. The agent needs to know what cap to commit to. Without a documented budget, the agent guesses (usually low, which then requires re-approval; or high, which the operator may reject).

**Where it comes from:** Engagement governance. For KAI (a venture, not a billed client), the budget is whatever Nick decides per run. For a billed client, it should be in the engagement scope.

**Required format:**
- Per-run cap (USD or credits)
- Monthly cap (USD or credits)
- Approval threshold (under what cap is auto-approve okay; above what cap is escalation required)

**What "good" looks like:** Documented. Tied to engagement scope. Reviewed monthly.

**What happens if missing:** Agent picks arbitrary caps. Operator gets surprised by spend. Worst case: hits Deepline's monthly cap mid-run and gets blocked.

**KAI example:** Not yet documented. Should be added to KAI venture CLAUDE.md before scaling Deepline use.

---

### 3.5 Approval authority

**What it is:** Who has the authority to approve paid Deepline runs. Single operator, or multi-stakeholder?

**Why Deepline needs it:** The approval gate names a person (implicitly). If approval requires Will's sign-off in addition to Nick's, the agent needs to know that or the gate becomes meaningless.

**Where it comes from:** Engagement governance. For KAI, Nick has operational approval; commercial output approvals route to Will via Hermes loop.

**Required format:**
- Who approves operational spend (Nick, typically)
- Who approves commercial output (sender-facing artifacts, copy, activation)
- Routing path for commercial approval (Hermes loop, async email, etc.)

**What "good" looks like:** Clear roles. No ambiguity at the approval gate.

**What happens if missing:** Agent stalls at the gate ("who am I asking?") or runs without proper approval ("Nick said yes but Will hasn't reviewed").

**KAI example:** Per CLAUDE.md, Nick = operational; Will = commercial output via Hermes. Execution plan tasks separated by approval owner.

---

### 3.6 Success criteria

**What it is:** What defines a successful Deepline run for this play. Both during a single run and across the campaign.

**Why Deepline needs it:** Without success criteria, the agent can't tell the operator "the pilot looks bad, abort." It also can't propose v1 improvements after a run.

**Where it comes from:** Play artifact (campaign-level) + execution plan (per-run).

**Required format:**
- Per-run criteria: enrichment completeness threshold, deliverable contact count, quality bar
- Campaign-level criteria: reply rate floor, meeting-booked target, qualification rate
- Failure thresholds (when to pivot)

**What "good" looks like:** Numeric. Time-bounded. Tied to a decision (pivot vs continue).

**What happens if missing:** Bad runs ship anyway. Good runs go unrecognized. v1 refinement has no basis.

**KAI example:** Play Section "Success metrics": 30 calls run, demand signal validated, at least one paid client signed. Stretch: 5 clients at $5k/mo.

---

### 3.7 Termination criteria

**What it is:** The explicit conditions under which the play stops and the team pivots.

**Why Deepline needs it:** Termination triggers should fire automatically based on run data. Without them, dead plays consume credits indefinitely.

**Where it comes from:** Play artifact Section "Termination criteria."

**Required format:**
- Volume-based trigger (e.g., "30 calls run with no demand signal → pivot")
- Reply-rate trigger (e.g., "below ~1% from first 200 contacts → re-test channel before pivoting segment")
- Sponsor-redirect trigger (engagement-governance event)

**What "good" looks like:** Specific numeric thresholds. Tied to an action (re-test, pivot, escalate).

**What happens if missing:** Plays that should die get extended on hope. Credits burn on a broken segment.

**KAI example:** Play Section "Termination criteria" lists three triggers. Execution plan doesn't currently surface these to Deepline directly ... worth wiring into the analytics pass (Phase 8) so triggers fire automatically.

---

## 4. Runtime input deep-dive

### 4.1 Triggering natural-language request

**What it is:** The chat message that starts a Deepline session.

**Why Deepline needs it:** It's the seed. Without it, no session starts. The phrasing also shapes which skill the agent routes through (`build-tam` vs `linkedin-url-lookup` vs ad-hoc enrichment).

**Where it comes from:** The operator types it.

**Required format:** Natural language, but specific enough to route. "Find me CTOs" is too vague; "Find me 25 CTOs at NYC fintech startups with verified emails and LinkedIn URLs" is routable.

**What "good" looks like:** Names the target (who/where), the scope (how many), the deliverable (what fields), and ideally the activation destination.

**What happens if missing/vague:** Agent asks clarifying questions before posting plan. Or worse, agent improvises and routes to the wrong skill.

**KAI example:** For Phase 1 of execution plan: "Build the company universe for the KAI medrobotics play ... medical device manufacturers where the robot IS the device, $10-100M revenue, US + Canada. Pull from Apollo, Crustdata, Vibe Prospecting. Output to `deepline/data/kai-medrobotics-v0/companies-raw.csv`."

---

### 4.2 Input CSV (when applicable)

**What it is:** A starting list, when the task is enrichment rather than discovery.

**Why Deepline needs it:** Phases 4 (enrichment), 5 (personalization), and 7 (CRM sync) all operate on existing CSVs. Without a starting CSV, those phases have nothing to act on.

**Where it comes from:** The previous phase's output, an operator-provided list, or a CRM export.

**Required format:** CSV with explicit columns. At minimum: a unique identifier column (linkedin_url, email, domain, or company_id). Often: name, company, title, domain.

**What "good" looks like:** Has the columns subsequent enrichment expects. Has `_metadata` lineage if it came from a prior Deepline run.

**What happens if missing:** Discovery phases can run, but enrichment can't.

**KAI example:** Phase 3 takes `companies-classified.csv` (output of Phase 2) as input. Phase 4 takes `contacts-tier-a-raw.csv` (output of Phase 3) as input. Lineage flows through `_metadata`.

---

### 4.3 Do-not-contact list

**What it is:** Companies and contacts that must never appear in the output, regardless of other criteria.

**Why Deepline needs it:** Applied in Phase 2 (filtering) as a post-classifier suppression step. Without it, disqualified contacts (e.g., Will's existing advisory clients) leak into the activation list.

**Where it comes from:** Operator-maintained list. For KAI, Will must produce a list of companies he has relationships with. For mature engagements, this comes from existing CRM (Airtable Prospects table flagged as DNC).

**Required format:**
- CSV with one column at minimum: `dnc_key` (domain, linkedin_url, or email)
- Optional: `reason` column for audit
- Optional: `effective_until` for temporary suppressions

**What "good" looks like:** Maintained. Recent. Has a clear source of truth (e.g., "this is exported from Airtable view `dnc_active`").

**What happens if missing:** Disqualified contacts get pushed to HeyReach. Sender reputation damaged.

**KAI example:** Will's no-contact list flagged as pending in execution plan. Must be provided before Phase 6 (activation).

---

### 4.4 Schedule / cadence

**What it is:** Whether this is a one-shot run or a recurring workflow.

**Why Deepline needs it:** One-shot uses standard `deepline enrich`. Recurring uses cloud workflows (the `workflows-hello-world` recipe pattern). They have different execution shapes, different deliverables, and different observability surfaces.

**Where it comes from:** Operator decides per task.

**Required format:**
- One-shot: no schedule needed
- Recurring: cron expression OR webhook trigger description
- Recurring: idempotency rules (what counts as "already processed")

**What "good" looks like:** Schedule matches the source's update frequency. Idempotency rules prevent duplicate downstream activations.

**What happens if missing:** Operator runs the same enrichment manually every week. Or sets up cloud workflow without idempotency and floods activation with duplicates.

**KAI example:** Phase 1-6 are one-shot for v0. Phase 7 (event capture) is the only recurring workflow ... cloud workflow listening to HeyReach webhook.

---

## 5. System input deep-dive

### 5.1 Provider credentials

**What it is:** Authenticated accounts for every provider Deepline routes to (Apollo, Crustdata, Hunter, Findymail, HeyReach, Snowflake, etc.).

**Why Deepline needs it:** Without credentials, every provider call fails. Credentials are managed centrally by Deepline (you don't hand keys to the CLI per call), but the underlying provider accounts must exist and be funded.

**Where it comes from:** Operator provisions provider accounts and links them to the Deepline account at signup.

**Required format:** All provider auth handled by Deepline. Operator concern is just: which providers are funded and which aren't.

**What "good" looks like:** Audit list of provider accounts + balance status. Updated monthly.

**What happens if missing:** Provider calls fail with 401/403. Agent falls back to next provider in waterfall, which may also be unfunded. Worst case: all providers in a waterfall fail and the row gets nothing.

**KAI example:** Studio's provider status documented in MEMORY's `project_provider_status.md` ... worth syncing this with Deepline's provider list to confirm parity.

---

### 5.2 Deepline CLI + skill library install

**What it is:** The `deepline` binary and the skill library (`~/.claude/skills/deepline-gtm/` + shim skills).

**Why Deepline needs it:** Self-evident. Without the CLI, no execution. Without the skills, the agent has no framework to operate by.

**Where it comes from:** One-time install per machine:

```bash
curl -s "https://code.deepline.com/api/v2/cli/install" | bash
```

Plus skill installation from `getaero-io/gtm-eng-skills` into `~/.claude/skills/`.

**Required format:** Latest CLI version. All relevant skills present.

**What "good" looks like:** `deepline billing balance` returns a number. Skill list shows `deepline-gtm` plus the shims you care about.

**What happens if missing:** CLI commands fail. Agent has no skill to invoke. Session can't start.

**KAI example:** Confirmed installed in this session. `deepline-gtm` and 8 shims present. `deepline-sdk` and `niche-signal-discovery` not installed (noted as optional in methodology doc).

---

## 6. Input-to-phase mapping

Which inputs are required at which phase of the execution plan. Use this to identify upstream gaps before triggering each phase.

| Phase | Required inputs (by # from §1) |
| --- | --- |
| Pre-flight | 14, 15, 16, 23, 24 |
| Phase 1: Build company universe | 2, 3, 19 |
| Phase 2: Classify and filter | 2, 3, 4, 21 |
| Phase 3: Tier A contact discovery | 5, 9, 20 (from Phase 2) |
| Phase 4: Contact enrichment waterfall | 20 (from Phase 3) |
| Phase 5: Personalization research | 1, 7, 10, 20 (from Phase 4) |
| Phase 6: Activation handoff | 6, 8, 11, 12, 21, 20 (from Phase 5) |
| Phase 7: Event capture loop | 13, 22 |
| Phase 8: Analytics + Learning | 17, 18 |

Reading this: before Phase 1 runs, you need inputs 2 (segment), 3 (disqualifiers), and 19 (the trigger request). If 2 isn't yet documented, Phase 1 cannot start. If 3 is partial, Phase 2's classifier will leak disqualified rows.

---

## 7. Studio practice → Deepline input flow

The studio's practice skills produce these inputs as artifacts. The flow:

```
offer-extract        → offer artifact          → input #1
segment-criteria     → segment artifact        → inputs #2, #3, #4
segment-criteria     → ICP-titles artifact     → input #5
creative-brief       → creative brief artifact → inputs #7, #10
copy-draft           → sequence artifact       → input #11
Play artifact        → integrates above        → inputs #6, #8, #9, #17, #18
Engagement CLAUDE.md → operational config      → inputs #12-#16
Operator (live)      → session-time inputs     → inputs #19-#22
Deepline setup       → system config           → inputs #23, #24
```

This means the studio's existing skill stack covers inputs #1, #2, #3, #4, #5, #7, #10, #11. The play artifact integrates and adds #6, #8, #9, #17, #18. Engagement CLAUDE.md handles operational. Operator brings runtime inputs.

The remaining gaps (typically #12 activation destination IDs, #13 CRM schema mapping, #15 cost budget, #21 do-not-contact list) are the ones that get forgotten and block execution.

---

## 8. Pre-flight checklist

Before triggering any Deepline session, walk this checklist:

### Strategic readiness
- [ ] Offer artifact exists and is current (input #1)
- [ ] Segment artifact exists with no open authoring questions (input #2)
- [ ] Hard disqualifiers enumerated and categorized by enforcement mechanism (input #3)
- [ ] Sub-segment tagging logic decided (input #4)
- [ ] ICP-titles artifact exists with tier sequencing (input #5)
- [ ] Sender identity + credential + voice rules documented (input #6)
- [ ] Cold copy constraints documented (input #7)
- [ ] Channel decision made with infrastructure readiness confirmed (input #8)
- [ ] Volume target numeric (input #9)
- [ ] Personalization rule + sources documented (input #10)
- [ ] Sequence artifact exists and sender-approved (input #11) ... required before Phase 6 only

### Operational readiness
- [ ] Activation destination IDs captured (input #12) ... required before Phase 6 only
- [ ] CRM landing schema validated against expected Deepline output (input #13) ... required before Phase 7 only
- [ ] Working directory slug decided (input #14)
- [ ] Cost budget documented in engagement governance (input #15)
- [ ] Approval authority clear (input #16)
- [ ] Success criteria numeric and tied to decisions (input #17)
- [ ] Termination criteria specified (input #18)

### Runtime readiness
- [ ] Triggering request drafted with specifics (input #19)
- [ ] Input CSV exists or starting-from-discovery is confirmed (input #20)
- [ ] Do-not-contact list provided (input #21)
- [ ] Schedule decided (one-shot vs recurring) (input #22)

### System readiness
- [ ] Provider accounts funded for the providers this run will use (input #23)
- [ ] Deepline CLI version current + skill library installed (input #24)

If any checkbox is unchecked, identify whether it's a blocker for the specific phase being triggered. Strategic inputs #1-#11 should be fully checked before the play even reaches the execution plan stage. Operational inputs #12-#18 should be locked before Phase 1 runs. Runtime inputs are per-session.

---

## 9. The composability claim

The deeper observation behind this input inventory: Deepline is a substrate that consumes well-defined upstream artifacts. The studio's practice skills are the upstream layer that produces those artifacts. Together they form a complete GTM execution system.

If you've ever wondered "what's the difference between Deepline and a complete GTM operating system" ... this doc IS that difference. Deepline provides tactical discipline; the studio provides strategic discipline; the play artifact is the seam where they meet.

For any engagement, the question "are we ready for Deepline" is the same as "have we filled in all 24 inputs above." When the answer is yes, Deepline runs cleanly. When the answer is "mostly," Deepline runs with gaps that surface as bad approval messages or low-quality outputs. When the answer is "we figured we'd work it out in chat," Deepline becomes a strategic-thinking surface instead of an execution surface, which is the failure mode.

The pre-flight checklist (§8) is the operational version of this thesis. Run it before every play that hands off to Deepline.
