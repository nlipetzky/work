# Drafting source — icp-titles (CIPO)

Assembled from APPROVED canon + the targeting doctrine. This is the producer's raw input; the
governed icp-titles artifact is distilled FROM this. Do not treat this file as the deliverable.

TASK: Produce the contact-level ICP titles / persona tiers for CIPO (function signals, not literal titles; tiered).

---

## STANDARD: Targeting & Enrichment Doctrine

# Targeting & Enrichment Doctrine

Status: reference standard. No code.
Sources (distilled, not invented): the `segment-criteria` skill
(`practices/revops/skills/segment-criteria/SKILL.md` + its `criterion-types.md` / schema), the engine's
enrichment column set + `practices/revops/reference/cold-email-clay-column-map.md`, and
`practices/revops/reference/cold-outreach-system-design.md`.

## What this is

The standard the **list-build input producers** are graded against. The marketing artifacts (offer, ICP,
mechanism, value-prop) say WHO we serve and WHY. This doctrine governs the artifacts that turn that into a
**buildable, enrichable, qualifiable list**: the targeting definition + the enrichment spec + the
qualification gate. It is source-agnostic (no provider names, no column names, no SQL) ... a separate
downstream step (the `revops-engine`) compiles these into Apollo/Explorium/Clay config and runs the build.

It is the certified standard for four governed artifacts, each produced by the existing
`govern-artifacts.mjs` machine (produce → rules-gate → judge → approve), hinging on the approved marketing
canon: `segment-criteria`, `icp-titles`, `enrichment-spec`, `qualification-logic`.

## 1. Segment criteria (account-level: who to target)

Every criterion is classified on three axes (from the segment-criteria skill):
- **Type** — firmographic / technographic / demographic / behavioral / relational / disqualifier.
- **Match** — hard filter / soft signal / disqualifier.
- **Observability** — "how would someone verify this?" Name the signal, not the source. If a person
  could not verify it without inside information, it is a **vibe** and is rejected ("innovative companies,"
  "growth-minded leaders," "decision makers" are vibes ... convert to a concrete signal or to confidence-gaps).

Rules:
- **Hard filters**: a record must match all. Use sparingly ... 5-6 is normal, more than ~10 returns an
  empty list. Behavioral/relational hard filters are uncommon; default those to soft signals.
- **Soft signals**: scored after hard filters, weighted high / medium / low (use the buckets with
  discrimination, not all-medium).
- **Disqualifiers**: an explicit anti-list that earns its keep by removing what hard filters miss ...
  current customers, accounts in active sales cycles, recent acquisitions, burned/over-fished audiences,
  named-accounts-to-avoid. A disqualifier must NOT duplicate a hard filter. A segment with no
  disqualifiers is rare and suspicious.
- Keep **company-level and person-level criteria distinct** ("buys software" is a company; "evaluates
  software" is a person). Person-level titles belong in icp-titles (§2), not here.
- Blue-ocean discipline (from the offer doctrine + system design): the segment is a defensible,
  under-fished target consistent with the approved ICP's hard exclusions, not an abused red-ocean list.

## 2. ICP titles / persona tiers (contact-level: who at the account)

The contact layer the segment-criteria skill deliberately keeps separate.
- Express titles as **observable function signals, not literal title text**. "Director of Demand
  Generation" must not exclude a real buyer titled "VP Pipeline Strategy" ... write the function/
  responsibility the title implies.
- **Tier the personas**: decision-maker (the economic buyer / owner of the problem) vs influencer/
  champion vs disqualified-role. Each tier names its function signals and why it's in or out.
- Reconcile against the approved ICP and any play-criteria title rules (e.g. role exclusions). Where a
  named person's seniority/function pattern is the rule, cite the past-response evidence, don't guess.

## 3. Enrichment spec (the "enrich properly" artifact)

What data points to collect per account and per contact, and ... critically ... which are **qualify-gates**
(used to decide fit) vs **enrich-only** (carried for later use). Source-agnostic data-point names, not
columns. Grouped by function (from the clay-column-map → engine-stage mapping):
- **Identity / firmographic** (account): name, domain, industry, size/headcount, location, technologies,
  business description. Mostly enrich-only context + a few hard-filter gates.
- **Contact identity + reachability**: name, title, profile, and a **verified work email** (the
  find-and-verify loop is a hard reachability gate ... an unreachable contact is not a usable record).
- **Research / fit signals** (the qualifying shrink): the company-context + modality/role signals an AI
  judge uses to decide in-scope vs out-of-scope. These are the qualify-gate data points; name each and
  what value qualifies.
- For each data point state: account or contact level; qualify-gate or enrich-only; and (for gates) the
  rule that uses it. Do NOT include personalization-snippet fields (Email Opener / Ideal Customers / Past
  Clients) ... those are the copy layer's input, not enrichment.

## 4. Qualification logic (the gate: raw list → vetted cohort)

How a sourced + enriched record becomes qualified / edge / not-qualified, so a raw pull becomes a cohort:
- Compose the §1 hard filters + §1 disqualifiers + a §1 soft-signal threshold + the §3 qualify-gates into
  a deterministic verdict: pass all hard filters AND no disqualifier AND soft-score ≥ threshold → qualified;
  near-miss → edge (human review); else not-qualified. Name the threshold and the edge band.
- State the two-level order: account qualifies first, then its contacts are pulled and screened (company-
  first, contacts-second ... the engine's actual order).
- Every verdict must be explainable from named signals (the engine records `prep_verdict` + rationale);
  "looks like a fit" is not a rule.

## 5. The gates each artifact becomes (for the producers)

Deterministic rules-gate (only the primitives `checkRules` implements ... min_length / no_markers /
cites_source):
- `min_length` (a real spec, not a stub) · `no_markers:TODO,gap,empty —` · `cites_source` (must reference
  the approved marketing artifacts / this doctrine it hinges on).

LLM-judge rubric (the fuzzy quality), per artifact:
- **segment-criteria**: criteria carry Type+Match+Observability; no vibes; hard filters ≤ ~10 and account-
  level; soft signals weighted with discrimination; disqualifiers present and non-duplicative; consistent
  with the approved ICP's exclusions; blue-ocean, not red-ocean.
- **icp-titles**: function signals not literal titles; tiered (decision-maker / influencer / excluded) with
  the in/out reason each; reconciled to the ICP.
- **enrichment-spec**: each data point tagged account/contact + qualify-gate/enrich-only; a verified-email
  reachability gate present; fit/research signals named with their qualifying values; no personalization
  fields; nothing a provider can't actually observe.
- **qualification-logic**: a deterministic, explainable verdict composed from §1+§3; named threshold + edge
  band; company-first-then-contact order; no vibe gates.

## 6. Custom authoritative sources (when no commercial provider has a facet)

The most decision-relevant signal in a segment often has NO facet in any commercial enrichment provider
(Apollo / Crustdata / PDL / the deepline stack). A craft critic bounded by those providers will call such
a signal "not searchable" and want to scrape or drop it. That is the wrong move. The list-builder's move
is to connect the **authoritative public source directly, keyed by company**, as a first-class enrichment
source alongside the commercial providers. This is where domain expertise supplies a source the commercial
stack lacks ... it is the operator's value, and it belongs in the standard.

First-class authoritative sources for this studio's segments:
- **Patent / IP activity → USPTO PatentsView API** (plus assignment / PAIR data). Key by assignee /
  company-name (with normalization). Answers: holds-a-patent, filing velocity, recent filings, classes,
  competitor filings. This is the authoritative answer to any IP-centric hard filter.
- **Clinical-trial stage → ClinicalTrials.gov API.** Key by sponsor / company. Answers: trial phase,
  indication, recent starts. Precedent: the engine already ships a working connector at
  `systems/revops-engine/research/research-clinicaltrials.mjs` (built for a prior client engagement).
- **Gov R&D / non-dilutive funding → NIH RePORTER, SBIR.gov.** Key by company. Answers: grant activity,
  awards, technical maturity.
- General pattern: when a hard filter or qualify-gate depends on a signal with no commercial facet, name
  the authoritative API + the keying method + the expected match-rate. The signal becomes a **derived
  (post-discovery) enrichment gate**, not a search facet (see §7). New authoritative sources are added
  here as the studio learns them ... this section is how an operator's "I know where that data lives"
  becomes permanent system knowledge.

## 7. Buildability rules (from craft review)

A targeting spec is only as good as it is buildable with real sources. These rules (surfaced by the
Deepline list-builder craft critic) gate every artifact so it doesn't ship a beautiful, unbuildable spec:

1. **Declare a Source Mode on every hard filter and qualify-gate: `searchable`** (a named provider facet
   exists) **vs `derived`** (requires row-level enrichment). A derived signal must not be specced as a
   search-time hard filter.
2. **Signals with no commercial facet (patents, IP, live "raising now" status) are `derived`** ... route
   them to the §6 authoritative sources (USPTO for patents) or to research, as a post-discovery gate, with
   an accepted hit-rate haircut and a per-row cost budget. Never as a search filter; never scraped when an
   authoritative API exists.
3. **No segment ships without a count-first sizing pass** on the facetable hard-filter subset (a
   `limit:1` / count query) ... five intersected hard filters on a narrow vertical risks an empty list.
4. **Every scored soft signal carries an expected coverage estimate + a null-handling rule** (unknown ≠
   negative). A signal whose coverage is below a usable threshold is dropped, not scored on mostly-null data.
5. **Industry / vertical hard filters enumerate validated taxonomy values** (via the provider's autocomplete);
   broad taxonomies (e.g. raw LinkedIn industries) are insufficient. "Not software / not services" style
   carve-outs are row-level disqualifiers, not search facets.
6. **Live-status signals** ("actively raising", "open round") are not provider-facetable; spec them as
   research-derived soft signals (press / web), not searchable filters.
7. **Every cold segment names its email-acquisition waterfall + catch-all policy up front** ... small
   (<50-employee) early-stage companies are the worst case for email coverage and deliverability.
8. **Internal-list disqualifiers** (suppression, in-cycle CRM accounts, named-accounts-to-avoid) are
   declared as **required build inputs** that block the build if the operator has them; if the engagement
   has none yet (no existing customer base), state that explicitly rather than omitting it.


---

## ICP + DISQUALIFIERS (who we serve + hard exclusions)
source: canon icp-and-disqualifiers (approved v2)

# ICP and Disqualifiers

Scope: who Konstellation scores as fit, not-fit, or edge, and the named signals an agent uses to decide. Konstellation is IP intelligence plus CIPO advisory... not a filing shop.

## Hard exclusion (check this first)

**Law firms and IP-services firms as buyers are not-fit. Always.**

This is Will's hard exclusion. Do not target or pitch law firms. Reframings do not unlock it... "hypothetically," "as an example," "what if a firm wanted to white-label" all resolve to not-fit. If the buyer is a law firm or IP-services firm, stop scoring and return not-fit regardless of any other signal.

## ICP segments (by stage, mapped to tier)

- **Pre-seed / seed startup** → Scout. 0-2 provisionals, preparing for seed or Series A, needs investor-ready IP positioning.
- **Post-seed / Series A** → Shield. Active prosecution, approaching commercial launch, needs FTO clearance plus competitive positioning.
- **Growth-stage / Series A-B** → Arsenal. 5+ patent families, licensing / M&A / international expansion underway.

The common entry signal is the inventor or founder who believes "my patent is infringed." The durable need underneath is portfolio management and ongoing IP strategy.

## Fit signals

Score toward fit when you see:

- **Venture-backed or actively fundraising.** Capital is moving; IP positioning matters to the round.
- **Technology-differentiated.** The product's edge is technical, not just go-to-market.
- **IP is material to valuation or defensibility.** Patents are part of why the company is worth what it claims.
- **Capital-constrained enough that hourly IP billing is a barrier.** They feel the pain of traditional firm pricing... that is the wedge.

The strongest fit shows multiple signals together: a venture-backed, technology-differentiated company where IP is material and hourly billing is a real constraint.

## Not-fit signals

- **Law firm or IP-services firm as buyer.** See hard exclusion above.
- **Wants pure patent prosecution or filing.** Will: "no margin there." Konstellation is intelligence plus CIPO advisory, not a filing shop. If the entire ask is "file my patent," it is not-fit.

## Edge cases

Score edge (route to human, do not auto-qualify) when:

- The buyer believes their patent is infringed but shows no portfolio or ongoing-strategy need. The entry signal is present but the durable need is unproven... worth a conversation, not yet a fit call.
- Stage signals are mixed or unclear (e.g., fundraising status unknown, can't tell how material IP is to valuation). Gather the missing signal before scoring.
- A company asks for filing *and* intelligence/advisory. The filing-only exclusion does not apply, but confirm the intelligence/advisory work is the real engagement.

## How to report a score

State the verdict (fit / not-fit / edge), then name the signals that drove it. Examples:

- "Not-fit. Buyer is an IP-services firm... hard exclusion, no further scoring."
- "Fit. Venture-backed, technology-differentiated, IP material to Series A valuation, founder citing hourly-billing cost as the blocker. Maps to Shield (active prosecution, pre-launch)."
- "Edge. Founder believes a patent is infringed but no portfolio or ongoing-strategy signal yet. Route to human to test for durable need."

---

*Pending Will's certification: the ICP cut and the four sub-segments are Will's to confirm or refine. He holds the ~100 conversations behind this model.*

---

## CUSTOMER PROBLEM (the pain)
source: canon customer-problem-model (approved v1)

# Customer Problem Model

## The problem

Early-stage companies systematically under-invest in IP strategy until it is too late to matter. Not because founders are careless, but because the structure of IP consulting makes deferral the rational choice. By the time the cost of that deferral comes due, remediation dwarfs what proactive strategy would have cost.

## The mechanism (cause and effect)

Three reinforcing dynamics produce the outcome:

**1. Hourly billing kills trust, which drives deferral.**
IP attorneys quote $500-800/hr with no ceiling. Under capital constraint, the rational founder response to unbounded, unpredictable cost is to defer. Deferral compounds: last-minute provisionals, skipped freedom-to-operate analysis, blocking patents discovered only when a competitor sends a cease-and-desist.

**2. Episodic engagements create blind spots.**
Project-based consulting delivers one report, then silence. There is no continuous intelligence layer. Meanwhile competitors keep filing and the landscape keeps shifting, so the startup's IP position erodes without anyone noticing. The blind spot is structural, not accidental... it is what episodic engagement produces by design.

**3. The pricing perpetuates the framing.**
Because IP is priced like litigation (opaque hourly, unpredictable scope), it gets bucketed as legal expense rather than as R&D and valuation-driving investment. The cost-center framing then justifies further deferral, which closes the loop back to dynamic one.

## What it costs the customer

The cost is paid later, and larger. Deferred IP work produces a weak portfolio. A weak portfolio means lower valuation, a weaker fundraise, and direct exposure to blocking patents and litigation. The expense the founder avoided up front returns as remediation cost that exceeds what proactive strategy would have run.

## Why it persists

The structure has no actor positioned to break it:

- The firms that could give strategic IP guidance price themselves out of the startup market entirely.
- Self-service patent tools are affordable but have no strategic or advisory layer.
- Nobody has combined agentic analysis with human CIPO judgment at a startup-accessible price.

There is also a demand-side distortion that keeps the real problem hidden. Inventors fixate on the acute, visible event... "my patent's infringed." The actual recurring need is portfolio management and ongoing IP strategy, which is exactly the continuous layer that episodic, hourly-billed consulting cannot deliver. So the market keeps buying the wrong thing, the structural problem stays unsolved, and the blind spot persists until the bill arrives.

---

## MECHANISM (the differentiator / what fit looks like)
source: canon mechanism-of-action (approved v2)

# Mechanism of Action

How input becomes outcome at Konstellation, traced through named causal steps.

## The trace: input to outcome

**Step 1 — Client defines the space.**
A client onboards to a subscription tier (or buys credits) and names two things: its technology space and its competitors. This is the input that scopes every downstream workflow. Nothing runs until the space is named.

**Step 2 — The agentic intelligence layer runs the analysis.**
Roughly 20 autonomous, methodology-driven workflows execute structured IP analysis on demand: FTO, patentability, prior-art, invalidity/validity, claim mapping, landscapes, portfolio strategy, valuation, licensing, competitor monitoring, trade-secret ID. Each workflow follows a documented SOP, cites its sources, and classifies findings with standardized frameworks. The causal payoff: deliverables in hours that traditionally take days or weeks. The structure is what produces the speed... these are methodology engines, not open-ended prompts.

**Step 3 — Continuous monitoring keeps the picture current.**
The system tracks competitor filings, publications, grants, and regulatory submissions on an ongoing basis. Clients receive monthly digests, with escalation alerts when something crosses a threshold that warrants attention sooner. This converts a one-time analysis into a live signal.

**Step 4 — The CIPO advisory overlay turns data into decisions.**
Will, as CIPO, interprets the agentic output into board guidance, investor prep, and prosecution strategy. This is the load-bearing distinction: the AI produces data, the CIPO produces judgment. The analytical engine does not replace professional judgment... it feeds it.

**Step 5 — The IP Velocity Score makes progress visible.**
The portfolio's strength, momentum, and positioning compose into one monthly metric across five inputs: depth, competitive position, prosecution velocity, commercial alignment, and risk. It is reviewed on advisory calls, which makes progress trackable month over month and presentable to investors.

## Why it holds up under pressure

The rigor is built into the deliverable, not added afterward. Every output carries:

- documented search parameters,
- source citations,
- the 18-month publication-lag disclaimer (acknowledging that recently filed patents are not yet public),
- CIPO review before the client ever sees it.

That is why the chain holds. The workflows are structured methodology engines rather than free-form generation, and the human review at Step 4 is the gate, not a formality. The agentic layer is an analytical engine. It is not a replacement for professional judgment, and the mechanism is designed so that judgment always sits between the analysis and the decision.

---

*Certification note: the workflow set, the SOPs, and the disclaimer/review language are Will's domain and require CIPO confirmation for accuracy.*

---

## OFFER (what we sell)
source: canon offer-architecture-and-pricing (approved v1)

# Offer Architecture & Pricing

Internal canonical record. Tiers and figures here are Will's own (sourced from the IP Intelligence Platform pricing doc, 2026-05-19). Final public-facing pricing routes through Will. This document exists so an agent can explain why the price is the price, not just quote it.

## The core model

We sell IP intelligence delivered by an agentic layer with a CIPO on top. The pricing is built on one structural fact: the agentic layer collapses cost-to-deliver. An FTO that costs $4,000-8,000 in a traditional firm costs us ~$200-500 to produce. That drives 80-90% gross margin and lets one CIPO serve 30-50 clients instead of the traditional 8-12.

Everything downstream... the tiers, the credits, the success fees... is a way of capturing that margin against different buyer situations.

## Subscription tiers

### Scout... $2,500/mo
For pre-seed/seed.
- 2 agentic deliverables/mo
- Competitor monitoring (up to 5)
- Monthly intel digest
- 1×30-min CIPO advisory call

### Shield... $5,000/mo
For Series A.
- 5 deliverables/mo (full menu, including FTO)
- Monitoring (up to 10)
- Bi-weekly updates
- Quarterly portfolio review
- 2 advisory calls
- Investor IP-deck prep

### Arsenal... $10,000/mo
For growth stage.
- Unlimited deliverables (20-workflow suite)
- Unlimited monitoring
- Weekly briefings + CIPO calls
- Board memos
- M&A IP due diligence
- Licensing/monetization strategy

Annual prepay = 10% discount across all tiers.

## À la carte credits

$500/credit, mapped to deliverables:
- Prior Art Search... 2cr
- FTO... 5cr
- IP Valuation... 8cr
- Capital Strategy... 10cr

Packs of 10/25/50 at 10/20/30% off. Credits never expire and are shared across an org.

Credits are a gateway, not a destination. They remove commitment friction for buyers not ready to subscribe. Roughly 40-60% of credit buyers convert to a subscription within 6 months.

## Outcome-aligned layer (optional, on top of subscription)

Success fees:
- Licensing... 5-10% of deal value
- M&A... 1-3% of IP-attributed value
- Investor uplift... 2%
- Gov't grant IP... 5%

Revenue Participation Agreement: perpetual 0.5-1.5% royalty on revenue from IP Konstellation helped develop. Offered to Arsenal clients, traded for reduced or waived upfront fees.

## Why each price holds

**Why these numbers and not lower.** The anchor is hourly IP billing at $350-800/hr, which startups defer precisely because it is unpredictable and expensive. Against that, a $2,500/mo subscription that delivers continuous coverage reads as cheap, not expensive. We are not competing on being the lowest line item... we are competing against the work going undone.

**Why the margin justifies the tier spread.** Cost-to-deliver is roughly flat regardless of tier (the agentic layer does the work). So the tier price tracks the value to the buyer and their ability to pay at that stage, not our cost. That is why Arsenal at $10k delivers unlimited work without breaking the margin... the marginal deliverable costs us $200-500.

**Why credits exist at all.** They convert hesitation into a small yes. A buyer who will not commit $2,500/mo will buy a single FTO for $2,500 in credits. The pricing is deliberately set so that subscribing is the better deal at any meaningful volume, which is what drives the 40-60% conversion.

**Why outcome fees are offered.** They are a confidence signal and an incentive-alignment tool. We only earn the success fee if the client wins, which lets us price upfront fees softer (the RPA trade) and tells the buyer we believe the work pays for itself.

## Which tier fits whom

- Pre-seed/seed, needs basic coverage and monitoring, can't justify a CIPO retainer... **Scout**.
- Series A, raising or recently raised, needs FTO and investor-facing IP material... **Shield**.
- Growth stage, real portfolio, M&A or licensing in view, wants a CIPO on call... **Arsenal**, plus the outcome layer where a deal is in motion.
- Not ready to commit, has one discrete need... **credits**, with the subscription as the intended next step.

## Certification required before public use

Tiers and numbers are Will's and must be confirmed before any public-facing use. All branding to be re-pointed from PatentVest to Konstellation.

---

## OFFER LADDER (the front-end offer the list will receive)
source: canon outreach-offer-ladder (approved v1)

# Outreach Offer Ladder (CIPO / Konstellation)

## What this is

Three front-end COLD offers for Will and Nick to choose between. Each one is a single, hyper-specific deliverable... not the umbrella service... designed to open the door with a medical-device / biotech founder and ladder up to the named core retainer (Scout / Shield / Arsenal). None of these is the retainer. Each is the foot in the door, not the close.

The job of the cold touch is one thing: get a raised hand... "I'm a fit, tell me more." We are not selling the subscription cold. We are buying trust on the first transaction.

## The core offer these ladder up to

The named core is the IP-intelligence subscription with a CIPO advisory overlay:

- **Scout** ... pre-seed / seed coverage and monitoring.
- **Shield** ... Series A, FTO plus investor-facing IP material.
- **Arsenal** ... growth stage, real portfolio, M&A / licensing in view.

Every front-end offer below proves a slice of that engine, then transitions to the retainer on an exploratory call. (Pricing on every option routes through Will. No figure is committed here.)

## Shared targeting (blue ocean, not red ocean)

We do NOT target the abused red-ocean segments (agency owners, generic "doctors," "lawyers" in Apollo). We target a defensible blue ocean: venture-backed, technology-differentiated medical-device / biotech companies where IP is material to valuation and where unpredictable hourly billing is a real constraint. Strong receptivity rung: newly-raised or actively-raising founders, and newly-hired heads of IP / R&D leadership brought in to drive change.

Hard exclusion holds on every option: **never target law firms or IP-services firms as buyers.** No reframing unlocks it.

---

## Option A ... Reverse Lead Magnet: "Competitor Filing Teardown"

**Strategy: reverse lead magnet (RLM).**

**The front-end offer.** A custom, company-specific teardown of one named competitor's recent patent filings in the prospect's exact technology space... what they've filed, where they're building a wall, and where the white space sits. The ask itself is the magnet: "I'd like to spend the time researching your top competitor's filings and put this together for you specifically... is that okay if I send it over?"

**Why it opens the door.** It spikes perceived value because the prospect believes we are spending our own time on 1:1 work for them. Up-market buyers don't want to consume a generic PDF... they want the problem solved. This reads as effort spent on them, not a download. It also lands directly on the founder's acute, visible fixation ("is a competitor boxing me in?") rather than the abstract "portfolio strategy" they defer.

**Mechanism it proves.** This is Step 2 of the mechanism (the agentic intelligence layer running structured competitor / landscape analysis) plus Step 3 (continuous monitoring), delivered as a one-time slice. Real work, cited sources, the 18-month publication-lag disclaimer, CIPO review before they see it. That rigor is the differentiator that makes it not-boring and not-commodity.

**The ladder up:**
1. **Open the door** ... the teardown earns the reply and the trust. No margin expected.
2. **Prove competence** ... deliver it and knock it out of the park: real white-space they didn't know about, CIPO-reviewed.
3. **Ascend to core** ... "this was one competitor, one snapshot. The system monitors all of them continuously and turns it into board / investor guidance." That is the Shield or Arsenal retainer, depending on stage.

---

## Option B ... Loss Leader: "Single FTO on Your Lead Product"

**Strategy: loss leader.**

**The front-end offer.** One freedom-to-operate analysis on the prospect's lead product / device, priced to shock against what a traditional firm quotes for the same work. The exact high-value sub-deliverable the Series A buyer already knows they need before commercial launch... sold as a one-time thing, not bundled into a retainer. (The shock price is Will's to set... no figure stated here.)

**Why it opens the door.** FTO is the deliverable a pre-launch medical-device / biotech founder defers precisely because hourly billing makes it unpredictable and expensive. Offering that one specific, high-desire outcome at a price that makes them ask "how is that even possible?" is the loss-leader move. It is not the umbrella "IP intelligence" service... it is the single bullet they want most.

**Mechanism it proves.** The agentic layer collapses cost-to-deliver on exactly this workflow, which is what lets the price shock without being absurd... the mechanism IS the stated "how." No empty guarantee: the credibility is the documented SOP, the citations, the lag disclaimer, and CIPO review. That keeps it clear of the absurd-guarantee offer-killer.

**The ladder up:**
1. **Open the door** ... the one FTO earns the first yes and removes commitment friction.
2. **Prove competence** ... deliver a CIPO-reviewed FTO in hours-to-days, not weeks, with sources cited.
3. **Ascend to core** ... "the landscape you just cleared keeps shifting as competitors file. The subscription keeps it cleared continuously and gives you the investor-facing material for the round." Maps to Shield, with credits as the intermediate rung for a buyer not ready to subscribe.

---

## Option C ... Trojan Horse: "IP Velocity Score Read-Out"

**Strategy: trojan horse.**

**The front-end offer.** A single IP Velocity Score read-out on the prospect's portfolio: one number across five inputs (depth, competitive position, prosecution velocity, commercial alignment, risk), framed not as a sales pitch but as a benchmarking / diagnostic touch... "we score early-stage medical-device portfolios on five axes; here's where yours lands and the two inputs dragging it down."

**Why it opens the door.** The frame is a diagnostic, not a service pitch, so it sidesteps the immediate sales-defense reflex. It hands the founder something investors will ask about... a defensible, presentable metric... which is high-desire for anyone raising. The honest transition is built in: the score is genuinely ours, and the read-out genuinely shows where they stand. No bait-and-switch.

**Mechanism it proves.** This is Step 5 of the mechanism (the IP Velocity Score) surfaced as the entry deliverable, backed by Step 4 (CIPO judgment turning data into a decision the founder can act on). It demonstrates the exact thing episodic, hourly consulting cannot give them: a trackable, month-over-month metric.

**The ladder up:**
1. **Open the door** ... the one-time score read-out earns the conversation.
2. **Prove competence** ... the read-out names two specific weak inputs and what they imply, CIPO-reviewed.
3. **Ascend to core** ... "this is a snapshot. The score is reviewed every month on advisory calls and tracked toward your raise." That is the recurring advisory in Scout / Shield / Arsenal by stage.

---

## How the three compare (for the choice)

- **Option A (RLM)** ... strongest for spiking perceived value up-market and for the founder fixated on a specific competitor. Best when we want the offer to feel like custom 1:1 work.
- **Option B (loss leader)** ... strongest when the prospect already knows they need FTO before launch and the constraint is purely price/predictability. Most concrete, most direct path to Shield.
- **Option C (trojan horse)** ... strongest for the actively-raising founder who wants an investor-facing number and is most allergic to a direct pitch.

All three avoid the four offer-killers: none is boring (each is a specific, named deliverable), none is commodity (each is grounded in the agentic-plus-CIPO mechanism no filing shop offers), none makes an absurd guarantee (the mechanism is the stated "how"), and none is complex (each is one deliverable, stated in a sentence).

All three aim at the raised hand, not the cold close. The recommendation between them is Will's and Nick's call. Final pricing on whichever is chosen routes through Will.

---

## SEGMENT CRITERIA (account-level targeting)
source: canon segment-criteria (approved v1)

# Segment Criteria — CIPO / Konstellation (Cold Outreach)

Account-level targeting for the cold-outreach list. Source-agnostic: no provider or column names. Person-level titles are deferred to icp-titles. This artifact decides which accounts are in or out of the segment from named, observable signals.

Derived from and consistent with: the approved ICP and its hard exclusions (icp-and-disqualifiers v2), the outreach offer ladder's shared-targeting block (outreach-offer-ladder v1), the customer-problem model (v1), and the Targeting & Enrichment Doctrine §1.

The defensible blue ocean per the offer ladder: venture-backed, technology-differentiated medical-device / biotech companies where IP is material to valuation and unpredictable hourly billing is a real constraint. Explicitly NOT the abused red-ocean segments (agency owners, generic "doctors," "lawyers").

---

## Hard filters (account-level; a record must match ALL)

Used sparingly. Each is a binary check against a signal a person could verify from public sources, not a judgment call.

| # | Criterion | Type | Match | Observability |
|---|-----------|------|-------|---------------|
| H1 | Company operates in medical-device or biotech (its product is a physical/clinical or life-science technology, not a software-only or services play) | firmographic | hard filter | Stated industry classification, product description, or sector tag on the company's own site / public profile |
| H2 | Company has taken institutional venture funding OR is in an open round (a named raise, lead investor, or "raising" status is visible) | firmographic | hard filter | Public funding record: announced round, named investors, or an actively-raising signal the company itself publishes |
| H3 | Company holds at least one patent or published patent application (it is an IP-bearing entity, not pre-invention) | technographic | hard filter | A published filing or grant tied to the company / its founders in the public patent record |
| H4 | The buyer is an operating product company, NOT a law firm or IP-services firm (this is the ICP hard exclusion, expressed as an account filter; it is a category check, not a judgment call) | disqualifier-as-filter | hard filter | The company's stated line of business: does it sell a technology product, or does it sell legal/IP services to others? |
| H5 | Company is early-to-growth stage (pre-seed through Series B, mapping to Scout / Shield / Arsenal), not late-stage / public / enterprise-mature | firmographic | hard filter | Most recent funding stage as stated in the public funding record |

Note on H4: the ICP hard exclusion ("law firms and IP-services firms as buyers are not-fit, always") is enforced here as an account-level filter AND restated as a disqualifier below, because the two catch different failure modes (a misclassified industry tag vs. a hybrid entity). This is the doctrine's one sanctioned overlap, flagged so it is not read as accidental duplication.

---

## Soft signals (scored after hard filters; weighted with discrimination)

| # | Criterion | Type | Match | Weight | Observability |
|---|-----------|------|-------|--------|---------------|
| S1 | Newly raised within the last ~6 months, OR an open round visible now | behavioral | soft signal | high | Dated funding announcement or a current "raising" post / page |
| S2 | A head of IP, R&D leadership, or technical-founder change hired recently (a person brought in to drive IP/technical direction) | relational | soft signal | high | A recent hire / appointment announcement or updated leadership listing |
| S3 | Product edge is explicitly technical (the company describes a differentiated technology or platform, not just go-to-market / distribution) | firmographic | soft signal | high | Product / technology language on the company's own materials |
| S4 | Approaching or recently past a commercial-launch milestone (clearance, first product, market entry) ... the FTO-relevant moment | behavioral | soft signal | medium | Announced launch, regulatory submission, or product-availability signal |
| S5 | Active patent filing momentum (more than one filing in the trailing ~24 months, suggesting an emerging portfolio) | technographic | soft signal | medium | Multiple dated filings in the public patent record |
| S6 | Competitor patent activity is visible in the company's exact space (a named competitor is filing nearby) ... relevance hook for the teardown offer | behavioral | soft signal | medium | Competitor filings in the same technology class in the public patent record |
| S7 | Small team / capital-constrained profile where unpredictable hourly billing would bite (lean headcount relative to stage) | firmographic | soft signal | low | Public headcount vs. funding stage |
| S8 | Public signal the company treats IP as material (mentions patents in investor / press materials, names IP as a moat) | behavioral | soft signal | low | The company's own investor-facing or press statements |

Weighting logic: the high-weight signals (S1, S2, S3) are the receptivity rungs the offer ladder calls out ... a newly-funded, technically-differentiated company with a change-agent in an IP/R&D seat is the strongest open. Medium signals (S4, S5, S6) raise relevance and arm specific front-end offers (FTO / teardown). Low signals (S7, S8) corroborate fit but do not move an account on their own.

---

## Disqualifiers (the anti-list; removes what hard filters miss)

Non-duplicative of the hard filters above. Each removes a record that could otherwise pass.

| # | Criterion | Type | Match | Observability |
|---|-----------|------|-------|---------------|
| D1 | The entire visible ask / need is pure patent filing or prosecution with no intelligence/advisory angle ("just file my patent") | disqualifier | disqualifier | The company's stated need or any inbound context names filing-only, with no portfolio/strategy interest |
| D2 | Current Konstellation customer or account already in an active sales cycle | disqualifier | disqualifier | Internal CRM / pipeline record |
| D3 | Acquired or in announced acquisition within the last ~6 months (IP decisions now sit with the acquirer, not the target) | disqualifier | disqualifier | Public M&A announcement |
| D4 | Previously contacted in a prior outreach wave and went cold / opted out (burned audience) | disqualifier | disqualifier | Internal outreach / suppression record |
| D5 | A named account on the do-not-contact list (e.g. an existing partner, a referral relationship, or an account Will / Nick reserve) | disqualifier | disqualifier | Internal named-accounts-to-avoid list maintained by Will / Nick |
| D6 | Buyer shows the entry fixation ("my patent is infringed") but no portfolio or ongoing-strategy signal at all ... per the ICP, this is edge, not in-segment | disqualifier | disqualifier | Inbound or research context shows only the acute infringement framing with zero durable-need signal |

D1 is distinct from the H4 exclusion: H4 removes law firms / IP-services firms (a category of buyer); D1 removes an in-category buyer whose only need is filing (a need shape). D6 routes ICP edge cases out of the cold list rather than auto-including them; per the ICP these go to human review, not into the segment.

---

## Boundary notes

- Person-level title and persona-tier criteria (decision-maker / influencer / excluded role) are out of scope here and live in icp-titles.
- "IP is material to valuation," "technology-differentiated," and "capital-constrained" appear in the ICP as fit framings; each has been converted here into an observable account signal (S3, S5/S8, S7) rather than carried as a vibe.
- Tier assignment (Scout / Shield / Arsenal) is a downstream routing decision driven by stage (H5) plus portfolio depth (S5), not a segment-inclusion gate.
- Per canon, the ICP cut and sub-segments are pending Will's certification; these criteria inherit that pending status.
