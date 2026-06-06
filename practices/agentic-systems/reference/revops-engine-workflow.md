# RevOps Engine Workflow

**Status:** Living document. v0 written 2026-05-29. **More inferential than its sibling** ([expert-to-campaign-workflow.md](./expert-to-campaign-workflow.md)) because much of the deep substrate detail (revops-engine-dev Supabase schema, Playbook + Play Steps internals, client-by-client operating history) wasn't loaded into the session that produced this. Treat as scaffold to be sharpened in subsequent revops-focused sessions. Sections marked **[INFERRED]** need direct grounding before they're treated as canon.

**Purpose:** Definitive workflow for going from a new client (SME wanting RevOps help) to a fully running outbound and pipeline operation under the productized RevOps Engine model. Cross-practice canon stewarded by Boris (agentic-systems), executed by revops + automation + sales-and-gtm practices, and consumed by Polaris (engagement-governance) for sponsor-side governance.

---

## Mental model

The RevOps Engine is a **productized service**, not a custom consulting engagement. Its leverage comes from a hard separation between two layers:

- **Standardized layer** ... reusable across all clients. Lead enrichment, signal scoring, baseline outbound sequence patterns, pipeline reporting, CRM hygiene primitives. Marginal cost approaches zero per additional client.
- **Bespoke layer** ... per-client customization. Specific ICP, vertical-specific signals, copy customized to the client's voice, integration with the client's existing stack. Real cost per client but bounded by the engagement scope.

**Operator-level rule** (from Nick, locked in memory):
> Client Systems in the registry exist for bespoke workflows; platforms own the generic workflows; layer customization on top.

The Pivot Script for the offer addresses the failure mode this rule was built to prevent:

> Automation alone gives you a bad result unless we do an assessment first. We'll deliver an assessment with what's actually wrong. You agree with the diagnosis, we build it. If not, we part ways.

This frames the **assessment as the qualification gate** ... avoiding the endless-scope death spiral that nearly happened with Teknova.

The unit of work in the RevOps Engine is the **conversation a prospect has with the client**, not the message sent. Outbound activity is the cost; pipeline conversations and meetings are the product.

---

## Substrate units

Mapped from the expert-to-campaign substrate for parallelism, but the entities differ:

| Expert-to-campaign | RevOps Engine | Note |
|---|---|---|
| Expert | **Client** | A company engagement, not a person |
| Expert Artifacts | **Voice + Brand Artifacts** | Client's public material, prior copy, customer language |
| Core Offer | **Engagement Scope** | Standardized + bespoke layers + pricing + timeline |
| Intent | **Playbook** | The standardized workflow + bespoke configuration |
| Prompt | **Sequence Templates** | Per-step copy templates (often with SME if expert-led) |
| List | **Audience** | Same role: who's being contacted, plus signal-scoring layer |
| Draft Variants | **Sequence Variants** | A/B/C variants per playbook step |
| Conversations | **Replies + Booked Meetings** | The primary outcome; feed back to client |
| Exchanges | **Client Reviews** | Recurring touchpoints with client decision-maker |

Plus two RevOps-specific entities:

- **Assessment** ... the diagnostic finding produced before any build. What's broken in the client's current funnel, what's standardized-able, what's bespoke.
- **Reports** ... operational visibility delivered back to the client weekly or monthly. Without this, the client doesn't see value and churns.

---

## Bases and substrates

- **revops-engine-dev** (Supabase project `mrmnyscurmkfppicqqhk`) ... backend for the standardized layer. Schema details **[INFERRED, needs verification next session]**: likely holds Playbook definitions, Play Steps, Sources, Source Fields, Sync Runs across clients.
- **RevOps Surface** (Airtable base `appYBYH3aOHhTODAw`) ... operational data layer. 12 tables: Companies (296 fields), Contacts (160 fields), Enrichment Runs, Playbook, Play Steps, Sync Runs, Classification Rules, Sources, Source Fields, Company Events, Contact Events, Signal Drafts.
- **Per-client Airtable** ... if the bespoke layer needs a client-facing surface (e.g. Teknova has its own base). Synced from RevOps Surface where overlap exists.
- **Canon** (Supabase `mzzjvoiwughcnmmqzbxv`) ... receives stabilized playbook patterns, market signals, and client-discovery insights after they've proven across multiple clients.
- **Filesystem** at `accounts/clients/<client>/` ... per-client artifacts, assessments, weekly reports.

---

## Phases

### Phase 0 — Qualify the client

**Goal:** Determine whether this client fits the productized model before sinking time.

**Decisions to lock:**
- Revenue range fit ($1M-$20M anchor per the KAI RevOps Engine offer)
- Sales motion is outbound-dependent (vs PLG, enterprise-relational, channel)
- Founder or CEO is the chief seller (or recently was)
- No in-house RevOps function competing for ownership
- Willing to accept the assessment-first frame

**Tables / systems:**
- Engagements record (filesystem at `accounts/clients/<client>/CLAUDE.md` per the studio convention)
- System Registry entry if not already there

**Failure modes:**
- Client wants pure automation buy-in without assessment → Pivot Script applies; if they refuse, walk
- Client has internal "RevOps person" who'll fight the standardized layer → scope conflict by month 2
- Revenue too low (<$1M) → standardized overhead isn't justified
- Revenue too high (>$20M) → they need enterprise-RevOps, not productized

### Phase 1 — Diagnostic gate (the assessment)

**Goal:** Produce an assessment that names what's actually broken in the client's funnel and what scope of work would fix it.

**Steps:**

1. 30-60 minute call. Nick (technical) or Will (strategic) hosts depending on what the client is asking.
2. Walk the client through their current state: tooling, sources, sequences, signals, follow-up, attribution, reporting.
3. Diagnose where the funnel breaks. Common patterns **[INFERRED from prior sessions]**:
   - Data quality (lists built without filter rigor, missing enrichment)
   - Signal extraction (no scoring, treating all contacts equal)
   - Sequence quality (one-size-fits-all, no variants, weak hooks)
   - Follow-up gaps (no automation past first touch)
   - Attribution (can't tell what's working)
4. Produce a written Assessment artifact: diagnosis + standardized fixes + bespoke fixes + pricing range.
5. Client either agrees with the diagnosis and engages, or doesn't and parts ways. **Assessment is the qualification gate.**

**Tables / systems:**
- Assessment artifact stored at `accounts/clients/<client>/artifacts/assessment-v<n>-<date>.md`
- Linked from a System Artifacts row if Hermes is involved (rare for revops)

**Failure modes seen:**
- Skipping the assessment to land the deal faster → endless bespoke scope, Teknova-style
- Assessment too vague (no specific diagnosis) → client can't agree or disagree, drift continues
- Assessment includes everything the client said they want → no diagnostic value, just an order-taking doc

### Phase 2 — Scope the engagement

**Goal:** Convert the assessment into a specific work order with standardized + bespoke breakdown.

**Decisions to lock:**
- Which standardized modules are turned on (enrichment, signal scoring, sequence build, pipeline reporting, CRM sync, attribution)
- Which bespoke modules are scoped (custom ICP, vertical signals, integration work, custom reporting)
- Pricing: standardized base + bespoke setup + ongoing
- Engagement length and review cadence
- Client decision-maker who'll approve drafts and review reports

**Tables / systems:**
- Engagement Scope record (per-client artifact at `accounts/clients/<client>/artifacts/engagement-scope-v<n>-<date>.md`)
- KAI RevOps Engine Core Offer record (Liaison base `recRD2RbvcTcK6tFG`) updated with this engagement's variant

**Failure modes seen:**
- Bespoke layer scope creep mid-engagement → boundary breached, reset via change-order
- Bespoke layer is actually standardized work in disguise → operator drift, promote to standardized next cycle (Rule 2)

### Phase 3 — Set up the client substrate

**Goal:** Provision the data, tooling, and Airtable workspace for this client.

**Steps:**

1. **Create per-client Airtable workspace or surface** if needed (some clients have their own base; some run on RevOps Surface with a `Client` filter field).
2. **Connect data sources** ... CRM (HubSpot, Salesforce, Pipedrive), email sender accounts (Instantly, Smartlead), LinkedIn (HeyReach), any client-specific data sources.
3. **Configure auth** for each integration. Save credentials in 1Password or wherever the studio convention is.
4. **Provision Supabase rows** for this client in revops-engine-dev **[INFERRED schema, needs verification]**: an Engagement row, a Playbook row, source configurations.
5. **Create per-client n8n / Inngest workflows** that run on the client's data. Anchor each workflow to a Playbook step.

**Tables / systems:**
- revops-engine-dev (Supabase) ... Engagement, Playbook, Sources, Source Fields tables
- RevOps Surface (Airtable) ... Companies, Contacts scoped to this client
- n8n project for client-specific workflows
- Inngest for orchestration **[possibly deprecated for KAI per Will's "going to zero" framing; reconsider per-client]**

**Failure modes:**
- Per-client substrate built but not documented → next operator on the engagement (or future Nick) can't find what was wired
- Auth credentials in personal accounts instead of studio-owned → operator-leaving risk

### Phase 4 — Configure data sources

**Goal:** Wire up the enrichment + signal sources that feed this client's funnel.

**Per source, decide:**
- Which vendor (Clay, Apollo, Explorium, Websets, custom scraper, client's own data)
- What query / filter set
- Discovery Sources tag (so cohorts are traceable, e.g. `clay_<client>_<segment>`)
- Refresh cadence

**Common sources by use case:**

| Use case | Vendor | Note |
|---|---|---|
| Cold list build by ICP filter | Clay (via Sculptor prompts) | Industry codes + title + revenue + exclusions |
| Contact enrichment | Apollo, Explorium | Verify emails, LinkedIn URLs, titles |
| Intent / firmographic signals | Explorium, Websets | Funding, hiring, news triggers |
| LinkedIn-specific signals | HeyReach (post-engagement) | Connection state, prior outreach |

**Failure modes seen:**
- Source query not documented → next refresh produces a different cohort
- Vendor change mid-engagement → signal continuity broken
- Same Discovery Sources tag reused across cohorts → trace fails

### Phase 5 — Define playbooks

**Goal:** Per-playbook, define the outbound choreography. One playbook per (segment × channel × intent) combination.

**Per playbook, populate** **[schema INFERRED from Airtable RevOps Surface Playbook + Play Steps tables]**:

- Playbook name
- Segment (which audience subset)
- Channel (LinkedIn DM, cold email, multi-channel)
- Intent (book demo, asset-request reply, qualified meeting)
- Standardized layer modules turned on
- Bespoke configuration overrides
- Steps (each Play Step has: order, channel, copy template, delay, branch conditions)

**Steps in a typical playbook:**

1. Pre-touch enrichment + signal verification
2. First touch (connect note, or first email)
3. If accepted/opened, second touch with value content
4. Third touch with low-friction CTA
5. Final touch with break-up message
6. Replied/booked → human handoff to client

**Tables / systems:**
- Playbook table (RevOps Surface, 10 fields)
- Play Steps table (RevOps Surface, 16 fields)

**Failure modes:**
- Playbook copied from prior client without re-deriving ICP → wrong tone, wrong hooks
- Standardized + bespoke modules not separated → can't reuse anything next client
- Steps defined but not linked to actual sender accounts → silent failure at runtime

### Phase 6 — Build and audit the list

**Goal:** Build the contact cohort matching the playbook's segment definition, audit before sending.

**Same audit logic as expert-to-campaign Phase 6**, repeated here because RevOps Engine clients usually have multiple cohorts running simultaneously and each needs its own audit:

1. Run the configured Clay / Apollo / Explorium query.
2. Sync to RevOps Surface Companies + Contacts with Discovery Sources tag.
3. Apply per-playbook exclusion filters (industry, title, geography, recent-engagement-with-client).
4. Sample-classify ~15 contacts against the playbook's segment definition. Fit rate must clear threshold (suggest 80%).
5. If fit rate fails, refine the source query before proceeding.

**Failure modes seen:**
- 84-wrong-leads incident on KAI's own clay_mdr campaign → list audit step was skipped → 50% provider contamination went unnoticed until HeyReach pull
- Multiple cohorts in flight, audit happens to one, others ship without → silent quality drift

**Open gap:** Pre-send list audit is not automated. Same gap flagged in expert-to-campaign-workflow.md. Same fix proposed: Boris-classify-against-segment-criteria.

### Phase 7 — Generate sequence variants

**Goal:** Produce N variants per playbook step that the client (or their SME, if expert-led) reviews.

**Modes:**

- **Client voice mode** ... client provides voice samples / prior copy / brand guidelines; variants written in client's voice. Used for clients where the founder is the sender.
- **SME-led mode** ... when the engagement includes an expert (e.g. KAI's RevOps Engine could include Will as an SME for medical device clients), variants are generated under the expert's identity using the full expert-to-campaign flow.
- **Generic professional mode** ... when neither founder voice nor SME is available, use a calibrated professional tone matching the segment. Lowest leverage but operationally simplest.

**Tables / systems:**
- Per-client copy variants (location depends on client; either per-client Airtable or Liaison base if SME-led)
- Sequence Templates / Play Steps for the standardized layer

**Failure modes seen:**
- Variants written before voice is established → generic copy that the client red-lines anyway
- Promised assets in CTA without confirming the asset exists → ship-blocker (same as expert-to-campaign)

### Phase 8 — Client review and approval

**Goal:** Client decision-maker reviews variants, confirms or red-lines, picks variant(s) to ship.

**Steps:**

1. Compose review email (or whatever channel the client prefers) with full sequence inline.
2. State recommendation: which variant to ship first and why.
3. Specific asks: confirm voice / red-line phrasings / approve sender identity / pick variant.
4. Send.
5. On reply: update sequence templates, flip status to approved, log in Client Reviews table.

**Tables / systems:**
- Client Reviews record (per-client artifact)
- Sequence Templates with approved versions

**Failure modes seen:**
- Client review takes weeks → momentum lost. Mitigate by setting review SLA in the engagement scope.
- Client edits substantially diverge from the playbook's standardized framing → playbook drift, document the divergence as a bespoke override.

### Phase 9 — Build the operational runtime

**Goal:** Wire HeyReach / Instantly / Smartlead / n8n to actually send.

**Steps:**

1. **HeyReach** for LinkedIn: create lead list (via MCP), add contacts, build sequence in HeyReach UI matching Play Steps.
2. **Instantly or Smartlead** for cold email: import contacts (CSV or API), build sequence templates, wire warmup pools.
3. **n8n** for any cross-tool orchestration (e.g. reply detected → enrich contact → push to CRM → notify client).
4. **CRM sync** so client sees pipeline activity in their own system of record.
5. **Reporting dashboard** ... where client gets visibility (could be Airtable view, Looker, Retool, or a per-client Vercel-deployed dashboard).

**Tables / systems:**
- HeyReach (LinkedIn outbound)
- Instantly / Smartlead (cold email)
- n8n (orchestration)
- Client's CRM (HubSpot / Salesforce / Pipedrive)
- Per-client reporting surface

**Failure modes seen:**
- Sender account not warmed up → emails land in spam
- HeyReach sequence builds the connect request from a profile that doesn't have Sales Navigator → rate limit hits faster
- n8n workflows not error-handled → silent failures, no one notices until client asks for report

### Phase 10 — Test send

**Goal:** Confirm copy, sender identity, and sequence behave correctly before scaling.

**Steps:**

1. 3-5 test contacts.
2. Verify each channel sends correctly.
3. Verify reporting surface shows the test activity.
4. Pause if anything looks off.

### Phase 11 — Scale

**Goal:** Run at full cohort volume within channel rate limits.

**Operating envelope:**
- LinkedIn: ~20-40 connection requests/day on Sales Nav accounts.
- Cold email: depends on warmed pool; conservative 50-100/day per inbox.
- Multi-inbox setups can scale email further.

**Failure modes:**
- Sender domain reputation tanked by aggressive ramp → reset takes weeks
- Client added new ICP segment mid-flight → cohort logic gets muddled

### Phase 12 — Report back to client

**Goal:** Recurring visibility so client sees value and provides direction.

**Standard report cadence:** weekly. Per Nick's memory note: *every active client gets a weekly update following the canonical template; pipeline activity footer required, never cite dollar costs.*

**Report contents:**

- Pipeline activity since last update
- Meetings booked / replies / qualified leads
- Cohort health (size, fit rate, exhaustion rate)
- Sequence performance per playbook step
- One open question or decision needed from client
- Pipeline activity footer

**Tables / systems:**
- Weekly report artifact at `accounts/clients/<client>/updates/weekly-<date>.md`
- Email or Slack delivery to client decision-maker

**Failure modes:**
- Missed week → client notices, trust hit
- Report buries the lede in noise → client doesn't read it, can't direct

### Phase 13 — Iterate

**Goal:** Feed conversation outcomes and playbook performance back into the engine to sharpen for this client AND for the standardized layer.

**Updates triggered by conversation outcomes:**

- **Per-client playbook** ... if a sequence variant outperforms, promote it to that client's default.
- **Standardized layer** ... if a pattern wins across 2+ clients (Rule 2 promotion), promote to the standardized library so the next client gets it for free.
- **Source query refinement** ... if certain signals correlate with reply, tighten the source query.
- **Pricing / scope adjustments** ... if the bespoke layer is taking more than scoped, change-order or absorb.
- **Canon update** ... market signals derived from conversations feed back into Canon, available to other engagements.

**Outcome:** Each client run sharpens the standardized layer. Next client gets onboarded faster because more patterns are already wired.

---

## Failure modes catalogue (cross-client, from real and inferred sessions)

| Where | What went wrong | Lesson |
|---|---|---|
| Phase 0 | Client qualified by Nick wanting to land the deal, not by fit → endless bespoke | Assessment-first gate is non-negotiable |
| Phase 1 | Assessment too vague to disagree with → no qualification value | Diagnosis must be specific and contestable |
| Phase 2 | Bespoke scope creep → engagement profitability tanks | Change-order discipline; promote-or-absorb at month boundary |
| Phase 3 | Per-client n8n flow built without documentation → next operator can't pick up | Every per-client wiring needs a CLAUDE.md or equivalent README in the client folder |
| Phase 4 | Vendor change mid-engagement → signal continuity broken | Lock vendor per engagement; revisit at next scope review |
| Phase 5 | Playbook copied without re-derivation → wrong cohort, wrong tone | Playbooks are per-segment, not per-client |
| Phase 6 | List audit skipped → wrong cohort goes live | Same as expert-to-campaign: audit gate must run |
| Phase 7 | Generic professional mode shipped when client expected founder voice | Match mode to engagement; agree upfront |
| Phase 8 | Client review delayed → momentum lost | SLA on review in engagement scope |
| Phase 9 | Sender domain not warmed → spam folder → reputation reset | Warmup is mandatory pre-launch |
| Phase 10 | Test send skipped under deadline pressure → catastrophic first send | Test send is non-negotiable |
| Phase 12 | Weekly report missed → client trust hit | Calendar-blocked recurring task; never skip |
| Phase 13 | Standardized layer never gets promoted → operator stays a bottleneck | Rule 2 applied to playbook patterns: 2 wins → promote to standardized library |

---

## Open gaps to build (in priority order)

1. **Pre-send list audit (Phase 6)** ... same gap as expert-to-campaign, doubly important because RevOps Engine runs multiple cohorts simultaneously across multiple clients. Automated Boris-classify-against-playbook-segment-criteria.
2. **Documented schema of revops-engine-dev Supabase project** ... currently inferential; needs a session to walk through tables and document. Without this, Phases 3-5 are partially guesswork.
3. **Playbook + Play Steps table semantics** in RevOps Surface ... 10 + 16 fields each, but their exact use is undocumented. Needs a walkthrough to canon-ize.
4. **Per-client CLAUDE.md template** ... per-client wirings and substrate need documented context handoff. Template would standardize what every client folder must contain.
5. **Standardized vs bespoke promotion mechanism** ... a real process for promoting a bespoke pattern that won twice into the standardized layer. Memory note exists; mechanism doesn't.
6. **Client-facing reporting surface** ... currently ad-hoc per client. A reusable template (Airtable view, Retool, or Vercel app) would cut per-client setup time.
7. **Reply / booking signal extraction to Conversations** ... same as expert-to-campaign, applied to per-client replies, feeding playbook performance + Canon market signals.

---

## What this workflow is not

- Not a generic sales automation playbook. It's a productized service architecture with a specific standardized + bespoke split.
- Not a single-client doc. It describes how the engine handles N clients, not how it serves one.
- Not automated end-to-end. The Assessment phase and Client Review phase are intentionally human-gated. Several other phases will close as the gaps above get built.

---

## Reference

- **Sibling document:** [`expert-to-campaign-workflow.md`](./expert-to-campaign-workflow.md)
- **revops-engine-dev Supabase:** project `mrmnyscurmkfppicqqhk`
- **RevOps Surface base:** `https://airtable.com/appYBYH3aOHhTODAw`
- **KAI RevOps Engine offer (Liaison):** record `recRD2RbvcTcK6tFG`
- **Per-client folders:** `accounts/clients/<client>/`
- **revops practice folder:** `practices/revops/` (persona + skills lived there as of last visit)

---

## Next-session priorities to sharpen this doc

1. Walk the revops-engine-dev Supabase schema and replace **[INFERRED]** sections with verified table / column descriptions.
2. Document the Playbook + Play Steps semantics from real records in RevOps Surface.
3. Pull a real client's full journey end-to-end (Teknova or KAI's own RevOps run) and validate the 13-phase scaffold against it. Refine where the scaffold doesn't match reality.
4. Capture failure-mode catalogue entries from real sessions instead of inference.
