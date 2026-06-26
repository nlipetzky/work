# Drafting source — segment-criteria (CIPO)

Assembled from the doctrine + approved canon + sibling artifacts + the latest craft critique + expert
notes. This is the producer's only input; the governed segment-criteria is distilled FROM this.

TASK: Produce the account-level segment criteria for CIPO's cold-outreach list (source-agnostic; declare a Source Mode per §7).

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

## 8. The discovery recipe (signal → qualified leads pipeline)

The four artifacts above define WHO/WHAT to target. The **recipe** is the synthesis: the ordered,
signal-driven pipeline that turns a live signal into qualified leads in a database. It is the executable
shape of the build, and the worked example a future recipe-authoring agent learns from. It is designed to
RUN CONTINUOUSLY (a standing watch), not as a one-shot list pull.

A recipe is a named, ordered sequence of steps. Each step states: what it does, the **source / tool** it
uses (a named commercial provider OR a §6 custom authoritative source), the **keying method** (how the
prior step's output becomes this step's input, e.g. patent assignee → company-name normalization), and the
**expected hit-rate / cost** (so the funnel is sized honestly). The canonical shape:

1. **Signal watch** — the standing query against the strongest signal for the segment (e.g. USPTO
   PatentsView for new filings in our tech classes; ClinicalTrials.gov for phase changes). States the
   query, the cadence, and what counts as a fresh signal. This is the continuous trigger.
2. **Signal → company resolution** — resolve the signal to a company (assignee / sponsor → company),
   with the normalization + dedup against companies already in the pipeline.
3. **Company enrichment + segment screen** — enrich firmographics, apply the segment-criteria hard
   filters / disqualifiers (Source Mode per §7), count-first sizing.
4. **Contact discovery + enrichment** — find the icp-titles personas at qualified companies; the
   verified-work-email waterfall + catch-all policy (§7.7) as a hard reachability gate.
5. **Qualify** — apply list-qualification to produce the qualified / edge / not verdict; qualified records
   land in the database (the Prospect spine).
6. **Hand-off to outreach** — qualified cohort → System M (offer + copy, in the sender expert's name).

A recipe must: name a concrete signal (not "find good companies"); have every step buildable per §7 (no
unsourced step); be honest about funnel shrinkage at each stage; and define its output contract (what a
"qualified lead" row contains). It does NOT invent providers or capabilities not in the doctrine or the
deepline craft docs. The recipe is the unit the flywheel runs and the recipe-authoring agent will later
compose from an intent.


---

## ICP + DISQUALIFIERS (approved v2)

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

## CUSTOMER PROBLEM (approved v1)

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

## MECHANISM / what fit looks like (approved v2)

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

## OFFER (approved v1)

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

## OFFER LADDER (what the list receives) (approved v1)

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

## HINGE — ICP TITLES (contact personas) (draft v2)

# ICP Titles / Persona Tiers — CIPO / Konstellation (Cold Outreach)

Contact-level targeting for the cold-outreach list. The companion to segment-criteria (account-level, approved v1): that artifact decides which accounts are in-segment; this one decides which people at a qualified account to target, and how to tier them.

Source-agnostic and function-first: titles are expressed as observable function signals, not literal title text, so a real buyer is not excluded by a literal-string filter. A founder titled "Chief Scientific Officer" who owns IP decisions is the same persona as one titled "CEO" or "VP Technology" ... the function is what we target.

Derived from and consistent with: the approved ICP and its hard exclusion (icp-and-disqualifiers v2), the outreach offer ladder's shared-targeting and receptivity rungs (outreach-offer-ladder v1), the mechanism's CIPO-judgment overlay (mechanism-of-action v2), the customer-problem model (v1), the account-level segment criteria (segment-criteria v1), and the Targeting & Enrichment Doctrine §2.

The doctrine's order holds: the account qualifies first (segment-criteria), then its contacts are pulled and screened against the tiers below.

---

## Why these personas and not others

Two facts from the canon set the contact layer.

1. **The economic buyer is a founder or a senior technical/IP leader, not a procurement or legal-ops role.** At pre-seed through Series B (H5), the person who owns IP strategy and can authorize a $2,500–$10,000/mo retainer is the founder, the CEO, or the technical executive. The ICP names "the inventor or founder who believes 'my patent is infringed'" as the common entry signal and the person who feels the hourly-billing constraint.
2. **The offer ladder names a second receptivity rung: "newly-hired heads of IP / R&D leadership brought in to drive change."** This is the strongest non-founder champion ... a change-agent in an IP/R&D seat, mirrored at the account level by soft signal S2.

Everything below tiers off those two facts plus the one hard exclusion the ICP enforces without exception.

---

## Tier 1 — Decision-maker / economic buyer

The person who owns the IP problem and can authorize the retainer. Target first.

| # | Function signal (not literal title) | Why in | Evidence |
|---|---|---|---|
| DM1 | **Founder / co-founder of the operating product company** ... the person whose company and IP this is, regardless of literal title (CEO, founder, "Founder & CSO") | The ICP's common entry signal is "the inventor or founder." At this stage the founder owns IP strategy and feels the hourly-billing constraint that is the wedge. Authorizes spend. | ICP "common entry signal is the inventor or founder"; ICP fit signal "capital-constrained enough that hourly IP billing is a barrier" |
| DM2 | **Chief executive / top operating leader** where distinct from the founder | Owner of valuation and fundraise outcomes; IP materiality to the round is a CEO-level concern. Economic buyer for the retainer. | ICP fit signal "IP is material to valuation or defensibility"; offer ladder "investor-facing IP material" |
| DM3 | **Most senior technical executive** ... the person accountable for the technology that the IP protects (e.g. CSO, CTO, head of technology / engineering at a product company) | At a technology-differentiated company the technical executive often owns or co-owns IP direction and is the named inventor. Maps to the "technology-differentiated" fit framing. | ICP fit signal "technology-differentiated ... the product's edge is technical"; mechanism Step 1 "names its technology space" |

**Function test for Tier 1:** does this person own the IP/technology direction or the fundraise/valuation outcome, AND can they authorize a retainer? If yes, Tier 1.

---

## Tier 2 — Influencer / champion

Owns or drives the IP/technical function but typically co-signs rather than solely authorizes spend. Target as the entry point or the internal advocate, especially the change-agent hire the offer ladder calls out.

| # | Function signal (not literal title) | Why in | Evidence |
|---|---|---|---|
| IN1 | **Head of IP / intellectual property** ... the person accountable for the patent portfolio, by whatever title (Head of IP, VP IP, Director IP, IP Strategy lead, "VP Pipeline Strategy" where the pipeline is patents) | Owns the portfolio-management need underneath the entry signal. Strongest champion: feels the episodic-blind-spot problem directly. Reframe is exactly why function-not-title matters here. | Offer ladder receptivity rung "newly-hired heads of IP ... brought in to drive change"; account signal S2; customer-problem "the actual recurring need is portfolio management and ongoing IP strategy" |
| IN2 | **R&D leadership** ... the person directing research/product development and the filings that flow from it (VP R&D, Head of R&D, head of product development) | Drives filing momentum and FTO timing; champions the teardown and FTO offers internally. The "R&D leadership ... change" rung. | Offer ladder receptivity rung "R&D leadership brought in to drive change"; account signal S2; offer ladder Option B (FTO before launch) |
| IN3 | **Recently-appointed IP/R&D leader brought in to drive change** (any of the above, where the hire is recent) | The offer ladder's named strongest open: a change-agent has a mandate and a budget-to-prove. Highest-receptivity champion. | Offer ladder "newly-hired heads of IP / R&D leadership brought in to drive change"; account signal S2 (high weight) |

**Function test for Tier 2:** does this person own or drive the IP/technical function but likely needs a founder/CEO co-sign to authorize the retainer? If yes, Tier 2 ... open here, ladder to the Tier 1 economic buyer.

---

## Tier 3 — Disqualified roles

Out, regardless of how well the account scored. Two failure modes: the ICP's category exclusion, and roles with no IP-decision function.

| # | Function signal (not literal title) | Why out | Evidence |
|---|---|---|---|
| EX1 | **Any contact whose employer sells legal or IP services to others** ... patent attorney, IP counsel, or partner AT a law firm or IP-services firm | The ICP hard exclusion: "law firms and IP-services firms as buyers are not-fit. Always." No reframing unlocks it. Mirrors account filter H4 at the contact level ... catches an in-segment-looking person at an excluded employer. | ICP hard exclusion "Law firms and IP-services firms as buyers are not-fit. Always"; segment H4 |
| EX2 | **In-house legal counsel / general counsel** at the product company whose function is contracts and corporate legal, not IP strategy or the fundraise | This role buckets IP as opaque legal expense ... the cost-center framing the customer-problem names as the thing that perpetuates deferral. Not the economic buyer and not the champion of an R&D/valuation-framed engagement. | Customer-problem "IP ... gets bucketed as legal expense rather than as R&D and valuation-driving investment" |
| EX3 | **Procurement / finance / operations roles with no IP or technology mandate** | No function signal tying them to the IP problem, the technology direction, or the fundraise. Not a decision-maker and not a champion for this offer. | Doctrine §2 (tier by function signal); converse of DM/IN function tests |
| EX4 | **Buyer whose only expressed need is patent filing / prosecution, no advisory angle** ... regardless of seniority | The ICP not-fit signal: "wants pure patent prosecution or filing ... no margin there." Konstellation is intelligence plus CIPO advisory, not a filing shop. A filing-only contact is out even at an in-segment account. | ICP not-fit signal "wants pure patent prosecution or filing"; segment disqualifier D1 |

---

## Boundary notes

- **Function over literal title is load-bearing here.** The reframe the doctrine warns about applies directly: do not let a literal "Head of IP" filter exclude a "VP Pipeline Strategy," a "Chief Scientific Officer," or a "Founder & CTO" who holds the same function. Screen on the function signal, not the string.
- **Tier 1 vs Tier 2 is a co-sign distinction, not a relevance one.** At small early-stage companies the founder (DM1) is often also the IP owner, collapsing Tier 1 and Tier 2 into one person. When a distinct IP/R&D leader exists, treat them as the Tier 2 champion and the founder/CEO as the Tier 1 economic buyer; open with the champion, ladder to the buyer.
- **EX2 vs Tier 1/2 catches a real failure mode.** A "Head of Legal" at a product company is excluded (EX2), while a "Head of IP" is the strongest champion (IN1). The distinction is function ... corporate/contracts legal vs portfolio/IP strategy ... not seniority or department label.
- **The do-not-contact and burned-audience disqualifiers (segment D2, D4, D5) operate at the account/record level**, not as a persona tier; they are applied in qualification-logic, not re-stated here.
- **Where a seniority/function pattern would otherwise be a guess, it is cited.** The two receptivity rungs (newly-funded founder; newly-hired IP/R&D change-agent) are the offer ladder's stated, not inferred. No past-response evidence for a specific named person is available in the source; if such evidence exists, it belongs here and should override a guessed pattern.
- Per canon, the ICP cut and sub-segments are pending Will's certification; these persona tiers inherit that pending status.

---

## HINGE — ENRICHMENT SPEC (data points + qualify-gates) (draft v2)

# Enrichment Spec — CIPO / Konstellation (Cold Outreach)

Which data points to collect per account and per contact, and which are **qualify-gates** (used to decide in-scope vs out-of-scope) vs **enrich-only** (carried for later use, not a fit decision). Source-agnostic: data-point names, not provider columns or facets.

Derived from and consistent with: the Targeting & Enrichment Doctrine §3, the approved segment-criteria (v1), icp-titles (v1), icp-and-disqualifiers (v2), and the outreach-offer-ladder (v1). Inherits the pending-Will-certification status those carry.

Personalization-snippet fields (email opener / ideal-customers / past-clients) are deliberately excluded ... those are the copy layer's input, not enrichment.

---

## Group 1 — Identity / firmographic (account level)

Mostly enrich-only context, with the named hard-filter gates the segment-criteria artifact composes.

| Data point | Level | Gate? | Rule that uses it (for gates) | Observability |
|---|---|---|---|---|
| Company name | account | enrich-only | — | Company's own site / public profile |
| Primary domain | account | enrich-only | — | Company's own site |
| Industry / sector classification | account | qualify-gate | H1: must be medical-device or biotech (physical/clinical or life-science technology, not software-only or services). Enumerate validated taxonomy values; software/services carve-outs are row-level, not a broad-taxonomy filter | Stated industry classification, product description, or sector tag on the company's site / public profile |
| Line-of-business / what the company sells | account | qualify-gate | H4: must be an operating product company, NOT a law firm or IP-services firm (ICP hard exclusion as a category check) | The company's stated line of business: sells a technology product vs sells legal/IP services to others |
| Headcount / team size | account | qualify-gate + enrich-only | Used by S7 (lean headcount relative to funding stage = capital-constrained profile, low-weight soft signal); otherwise carried as context | Public headcount vs funding stage |
| Location | account | enrich-only | — | Company's public profile |
| Technologies / product description | account | enrich-only | Carried as context; feeds S3 fit signal in Group 3 | Product / technology language on the company's own materials |
| Business description | account | enrich-only | — | Company's own materials |

---

## Group 2 — Contact identity + reachability (contact level)

The reachability gate is hard: an unreachable contact is not a usable record.

| Data point | Level | Gate? | Rule that uses it (for gates) | Observability |
|---|---|---|---|---|
| Contact name | contact | enrich-only | — | Public profile |
| Contact title | contact | enrich-only | Carried as context; the function-signal screen (Group 4) reads it, but literal title is not itself the gate | Public profile / leadership listing |
| Public profile / professional listing | contact | enrich-only | — | Public professional profile |
| **Verified work email** | contact | **qualify-gate (reachability)** | Hard reachability gate: a contact must have a work email that passes a find-and-verify loop. An unreachable contact is not usable. Per icp-titles targeting order: if no reachable Tier 1, fall to Tier 2; no reachable contact at all = account not actionable | Email found and verified deliverable through an acquisition + verification waterfall, with a stated catch-all policy (early-stage <50-employee companies are the worst case for coverage) |

---

## Group 3 — Research / fit signals, account level (the qualifying shrink)

The company-context signals an AI judge uses to decide in-scope vs out-of-scope. Each names the value that qualifies. These map to the segment-criteria hard filters and soft signals; signals with no commercial facet are **derived** (post-discovery), routed to the named authoritative source, not specced as a search-time filter.

| Data point | Level | Gate? | Value that qualifies | Source mode |
|---|---|---|---|---|
| Funding status / institutional venture backing | account | qualify-gate | H2: has taken institutional venture funding OR is in an open round (named raise, lead investor, or "raising" status visible). Disqualified if no venture / fundraising signal | searchable (announced rounds); "raising-now" status is derived (press/web), per buildability rule 6 |
| Funding stage | account | qualify-gate | H5: pre-seed through Series B (Scout / Shield / Arsenal range); NOT late-stage / public / enterprise-mature | searchable |
| Patent / published-application holding | account | qualify-gate | H3: holds at least one patent or published application tied to the company / its founders (an IP-bearing entity, not pre-invention). Disqualified if no public filing exists | derived — route to the authoritative patent source (USPTO PatentsView API, keyed by assignee / company name with normalization); no commercial facet, post-discovery gate with an accepted hit-rate haircut |
| Recency of last raise | account | enrich-only (scored soft) | S1 (high weight): newly raised within ~6 months OR an open round visible now | searchable (dated announcement); open-round is derived |
| Recent IP/R&D leadership or technical-founder hire | account | enrich-only (scored soft) | S2 (high weight): a head of IP, R&D leader, or technical-founder change hired recently (a change-agent brought in to drive direction) | derived (hire/appointment announcement, updated leadership listing) |
| Technical differentiation of the product | account | enrich-only (scored soft) | S3 (high weight): the company describes a differentiated technology or platform, not just go-to-market / distribution | derived (row-level read of company materials) |
| Commercial-launch proximity | account | enrich-only (scored soft) | S4 (medium): approaching or recently past a clearance / first-product / market-entry milestone (the FTO-relevant moment) | derived (announced launch, regulatory submission, product-availability) |
| Patent filing momentum | account | enrich-only (scored soft) | S5 (medium): more than one filing in the trailing ~24 months (emerging portfolio) | derived — same authoritative patent source as the H3 gate, keyed by company |
| Competitor filing activity in the same space | account | enrich-only (scored soft) | S6 (medium): a named competitor is filing in the company's exact technology class (relevance hook for the teardown offer) | derived — authoritative patent source, keyed by competitor / technology class |
| IP-as-material public signal | account | enrich-only (scored soft) | S8 (low): the company names patents / IP as a moat in its own investor or press materials | derived (investor-facing / press statements) |

Null-handling per buildability rule 4: each scored soft signal carries an expected-coverage estimate and treats unknown as not-negative. A signal below a usable coverage threshold is dropped, not scored on mostly-null data.

---

## Group 4 — Research / fit signals, contact level

The modality/role signals the judge uses to keep a contact in-scope. Function signals, not literal title strings (per icp-titles).

| Data point | Level | Gate? | Value that qualifies | Source mode |
|---|---|---|---|---|
| Function signal: founder / company principal OR owner of IP/technical strategy | contact | qualify-gate | Tier 1: founder, co-founder, chief executive, named principal, OR the person responsible for patents / IP portfolio / R&D direction / technical defensibility (CIPO, Head of IP, VP R&D, CTO, CSO where the role carries IP ownership). Read the function the title implies, not the literal phrase | derived (role read from profile + leadership listing) |
| Function signal: influencer / champion | contact | enrich-only | Tier 2: senior technical/scientific staff who feel the competitor-filing threat but lack budget authority, OR operating/finance leadership who influence vendor/advisory spend at a stage with a separate IP owner. Carried as the route-in when no reachable Tier 1 | derived |
| Disqualifying contact signal: law-firm / IP-services employment | contact | qualify-gate | Tier 3 hard exclusion: any contact whose employer is a law firm or IP-services / patent-prosecution firm (attorney, patent agent, of-counsel, partner, IP-services account lead). Stop scoring. This should already have failed the H4 account gate | derived (employer line of business) |
| Disqualifying contact signal: filing-only / function-irrelevant role | contact | qualify-gate | Tier 3: a contact whose only need is "get this patent filed" with no portfolio/strategy dimension, OR a sales / marketing / HR / CS / general-admin role with no IP, technical, founder, or spend-authority signal | derived (stated need / role function) |

---

## Order and composition (reconciled to qualification-logic)

- **Company-first, contacts-second.** The account clears the Group 1 + Group 3 qualify-gates (H1–H5) and the H4 / law-firm exclusion before any contact is pulled.
- Per qualified account, pull Tier 1 first; the **verified-work-email reachability gate** (Group 2) decides usability. If no reachable Tier 1, fall to Tier 2. Screen out every Tier 3 contact.
- The qualify-gates above feed the qualification-logic verdict (hard filters + disqualifiers + soft-signal threshold → qualified / edge / not-qualified). Enrich-only points are carried for routing and later use, not for the in/out decision.

## Buildability notes

- **Source mode declared on every gate**: searchable (a provider facet exists) vs derived (row-level / post-discovery). The patent gates (H3, S5, S6) and all "raising-now" / live-status signals are **derived**, routed to the authoritative patent source or research per Doctrine §6–§7. They are never specced as search-time hard filters and never scraped where an authoritative API exists.
- **Email-acquisition waterfall + catch-all policy** is named up front for Group 2, because early-stage sub-50-employee companies are the worst case for coverage and deliverability.
- **Internal-list disqualifiers** (current customers, in-cycle CRM accounts, suppression / burned audiences, named-accounts-to-avoid) are required build inputs that the qualification-logic gate enforces (segment D2/D4/D5). They are not enrichment data points and are not specced here beyond noting the dependency; if the engagement has no existing customer base yet, that should be stated rather than omitted.

---

*Inherits pending Will certification: the ICP cut, the four sub-segments, and the patent / funding signals are Will's to confirm.*

---

## HINGE — LIST QUALIFICATION (the qualified/edge/not gate) (draft v2)

# Qualification Logic — CIPO / Konstellation (Cold Outreach)

The gate that turns a sourced + enriched record into a deterministic, explainable verdict: qualified / edge / not-qualified. It composes the account-level hard filters, disqualifiers, and weighted soft signals from segment-criteria (v1) with the enrichment qualify-gates, so a raw pull becomes a vetted cohort an agent can defend signal by signal.

Derived from and consistent with: segment-criteria (v1) §hard-filters / §soft-signals / §disqualifiers, icp-and-disqualifiers (v2), icp-titles (v1), the outreach offer ladder (v1), and the Targeting & Enrichment Doctrine §4. Every verdict here is explainable from named signals... there are no vibe gates.

---

## The two-level order (company first, contacts second)

This is the engine's actual build order, and it is not optional. The account qualifies first; only then are its contacts pulled and screened.

1. **Account gate.** Evaluate the account against the hard filters (H1-H5), the disqualifiers (D1-D6), and the soft-score threshold below. The account earns a verdict: qualified / edge / not-qualified.
2. **Contact pull (qualified accounts only).** Only for an account that lands qualified do we pull contacts, per the icp-titles targeting order: Tier 1 first (founder, then IP/R&D owner), Tier 2 as the route-in if no reachable Tier 1, every Tier 3 contact screened out.
3. **Contact reachability gate.** A pulled Tier 1/Tier 2 contact needs a verified work email (the find-and-verify reachability gate). An account with zero reachable in-tier contacts produces no usable record even though the account qualified... it routes to edge for a reachability retry, not into the live cohort.

An edge or not-qualified account never reaches the contact-pull step. We do not spend enrichment budget pulling contacts at an account that has not cleared its own gate.

---

## The account verdict (deterministic)

Evaluate in this fixed order. The first stopping condition wins.

### Step 1 — Hard exclusion / disqualifier check (stop conditions)

If ANY disqualifier fires, the account is **not-qualified**. Stop scoring. The relevant disqualifiers:

- **D2** — current customer or active sales cycle.
- **D3** — acquired or in announced acquisition within ~6 months.
- **D4** — burned / opted-out from a prior wave.
- **D5** — named account on the do-not-contact list.
- **D1** — entire visible ask is pure filing/prosecution, no intelligence/advisory angle.

Two of these are the ICP hard exclusion expressed at the account layer and must be checked before anything else:

- The law-firm / IP-services exclusion is enforced as hard filter **H4** (see Step 2). If H4 fails, the account is **not-qualified** with rationale "law firm / IP-services buyer, ICP hard exclusion, no further scoring." No reframing unlocks it.

**D6 is the one disqualifier that does not return not-qualified.** D6 (entry fixation "my patent is infringed" with zero portfolio / ongoing-strategy signal) routes the account to **edge**, per the ICP. It is the durable-need-unproven case... worth a human conversation, not a cold-list inclusion and not a hard discard.

### Step 2 — Hard filters (all must pass)

The account must match ALL of H1-H5:

- **H1** — operates in medical-device or biotech (physical/clinical/life-science product, not software-only or services).
- **H2** — has taken institutional venture funding OR is in an open round.
- **H3** — holds at least one patent or published application (IP-bearing entity).
- **H4** — operating product company, NOT a law firm / IP-services firm (the ICP hard exclusion as an account filter).
- **H5** — early-to-growth stage (pre-seed through Series B).

If any hard filter fails, the account is **not-qualified**, rationale naming the failed filter(s). H3 and H2 are derived gates (patent record, funding record) and depend on the enrichment qualify-gates resolving before this step can run... see "Composition with enrichment" below.

### Step 3 — Soft score (only for accounts that cleared Steps 1-2)

Score the eight soft signals with weighted points:

- **High weight (3 pts each):** S1 (newly raised / open round), S2 (recent IP/R&D leadership hire), S3 (explicitly technical product edge).
- **Medium weight (2 pts each):** S4 (commercial-launch milestone), S5 (active filing momentum), S6 (competitor filing activity in-space).
- **Low weight (1 pt each):** S7 (capital-constrained / lean-for-stage), S8 (public IP-as-material signal).

Maximum possible soft score: (3 × 3) + (3 × 2) + (2 × 1) = **17 points**.

**Null-handling:** an unknown signal scores zero, never negative. A signal whose coverage is below a usable threshold is not scored on mostly-null data... it is dropped from the denominator for that record, not counted against it.

### Step 4 — The verdict bands

For an account that has cleared all hard filters AND has no firing disqualifier (other than the D6 edge route):

- **Qualified:** soft score **≥ 6**. Rationale: clears all hard filters, no disqualifier, and lands at or above threshold... typically at least two high-weight receptivity rungs, or one high plus medium corroboration.
- **Edge (human review):** soft score **4-5** (the named edge band), OR the account hit the D6 route in Step 1, OR it cleared the account gate but produced zero reachable in-tier contacts at Step 3 of the contact pull. These are near-misses and unproven-durable-need cases that warrant a human look, not an auto-discard.
- **Not-qualified:** soft score **≤ 3** after clearing hard filters (too thin to justify a cold touch), OR any not-qualified stop condition fired in Steps 1-2.

The threshold (6) and the edge band (4-5) are named here so every band assignment is reproducible. Two accounts with the same signals always land in the same band.

---

## Composition with the enrichment qualify-gates

Several hard filters and soft signals are **derived** (post-discovery), not searchable, and depend on the enrichment-spec qualify-gates resolving first. The verdict cannot be issued until these gates have a value:

- **H3 (holds a patent)** and **S5 (filing momentum)** / **S6 (competitor filing)** resolve from the public patent record, keyed by company (the USPTO PatentsView authoritative source per doctrine §6). These are derived gates with an accepted hit-rate haircut, never search-time filters.
- **H2 (funding)** and **S1 (newly raised / open round)** resolve from the public funding record; the "raising now" live-status portion of S1 is research-derived, not provider-facetable.
- **D2 / D4 / D5** (current customer, burned audience, named-accounts-to-avoid) are **internal-list disqualifiers** and are required build inputs. If Will / Nick supply suppression and named-account lists, they block matching records. If the engagement has no existing customer base yet, that is stated explicitly... D2 returns empty rather than being silently skipped.

If a derived qualify-gate cannot resolve a value for a record (e.g. company-name normalization fails against the patent record), that signal is treated as unknown (scores zero, does not auto-fail), and the record routes to **edge** rather than not-qualified when the missing gate is a hard filter input... an unresolved H3 is a "verify before discard," not a silent drop.

---

## Explainability requirement (no vibe gates)

Every account verdict records a `prep_verdict` plus a rationale built only from named signals (H1-H5, S1-S8, D1-D6) and their resolved values. Examples:

- "Not-qualified. H4 failed... buyer is an IP-services firm. ICP hard exclusion, no further scoring."
- "Qualified. Cleared H1-H5; soft score 8 (S1 newly raised + S3 technical edge + S6 competitor filing nearby). Maps toward Shield by stage (H5 = Series A)."
- "Edge. Cleared H1-H5 but soft score 4 (S3 + S7 only); near-miss, route to human."
- "Edge. D6 fired... founder cites infringement but zero portfolio / ongoing-strategy signal. Durable need unproven, route to human."

"Looks like a fit" is not a rule. If a verdict cannot be reconstructed from named signals and their values, it is invalid and the record is held for review rather than shipped into the cohort.

---

## Boundary notes

- Tier assignment (Scout / Shield / Arsenal) is a downstream routing decision driven by stage (H5) and portfolio depth (S5), not a gate input. An account qualifies into the cohort first; its tier is named after.
- Contact-level screening (Tier 1 / Tier 2 / Tier 3, the verified-email reachability gate) runs only after the account qualifies and follows the icp-titles targeting order. The account gate and the contact gate are distinct steps, not one combined pass.
- Per canon, the ICP cut and sub-segments are pending Will's certification; this gate inherits that pending status, including the named threshold (6) and edge band (4-5), which Will may tune once the ~100-conversation model is confirmed.

---

## CRAFT REVIEW (deepline list-builder) — address these on this produce
Verdict: buildable-with-fixes. Sound source-mode discipline and authoritative-source routing; main risks are HF2/HF3 facet precision, a thin facetable subset that may under-size, and an unspecced email/catch-all waterfall for sub-50 targets.

1. [major] (searchable-filters) HF2 ('privately held, venture-backed') and HF3 ('latest round at/before Series B') are marked searchable, but the facetable subset really resolves to one provider's funding-stage + round-type facets. crustdata last_funding_round_type / employee growth and apollo funding dates exist, but 'privately held' and 'has an institutional investor on record' are not clean single facets — public/bootstrapped exclusion is partly derived. As specced, the count-first pass on HF1+HF2+HF3 may over-count (includes companies whose latest round is unknown/null) or silently empty if the round-type enum is over-constrained.
   FIX: Spec HF2/HF3 as: searchable on last_funding_round_type IN {pre-seed..Series B} via crustdata_companydb_autocomplete-validated enums, with public/bootstrapped exclusion moved to a row-level derived disqualifier. Treat funding-stage null as unknown≠negative and route to derived confirmation, not a hard drop at search time.
   PROVIDERS: crustdata_companydb_search (last_funding_round_type, autocomplete), apollo_company_search (funding dates)
2. [major] (empty-list-risk) The truly searchable subset is effectively HF1 (industry) + HF3 (funding stage) on a narrow med-device/biotech vertical at pre-seed–Series B. linkedin_industries is too broad and crunchbase_categories for device/diagnostic/therapeutic sub-segments are sparse for very early-stage companies that DB providers under-cover (the docs explicitly flag pre-revenue startups returning 0). Intersecting industry + early funding stage + small headcount can return a thin or empty structured pull.
   FIX: Run the count-first sizing pass with crunchbase_categories validated via autocomplete BEFORE committing; if structured counts are thin, route discovery to known-source extraction (VC med-device portfolios, biotech accelerator batches via parallel_extract) and exa_company_search concept search as primary discovery, with DB search as enrichment rather than the spine. Make this fallback explicit in build notes.
   PROVIDERS: crustdata_companydb_autocomplete, dropleads_get_lead_count, exa_company_search, parallel_extract (VC/accelerator portfolios)
3. [major] (deliverability) SS4 itself flags sub-50 early-stage as worst-case for email coverage, and the doc correctly defers the waterfall to enrichment-spec — but this artifact targets a buyer universe that is overwhelmingly sub-50. Dropleads has near-zero coverage <50 emp and hunter_email_finder is poor there, so the entire account layer risks low reachability. The spec defers but does not constrain — there is no named catch-all policy or fallback contact-discovery route here.
   FIX: Acceptable to defer mechanics, but add a one-line forward reference naming the expected fallback (exa_people_search for <50-emp contact discovery + a verify step) and assert that enrichment-spec MUST carry the waterfall + catch-all decision per doctrine §7.7. Flag that a meaningful fraction of qualified accounts may be unreachable and should drop at the contact gate, not inflate the account list.
   PROVIDERS: exa_people_search (tiny-startup contacts), hunter_email_finder, dropleads_search_people (low <50)
4. [minor] (enrichment-reality) SS2 (patents → USPTO PatentsView) and SS3 (trial stage → ClinicalTrials.gov) are correctly routed to doctrine §6 authoritative sources keyed by company name. These are BUILDABLE as derived gates, not blockers. The only real risk is name-normalization hit-rate: assignee names and trial sponsor names diverge from legal/brand names, so the accepted haircut must be quantified, not just asserted.
   FIX: Keep as derived gates (no change to status). Add an expected match-rate band and a normalization step (assignee/sponsor name + domain crosswalk) to the build notes so the haircut is a number the engine can budget against.
   PROVIDERS: USPTO PatentsView API, ClinicalTrials.gov API (doctrine §6 custom sources)
5. [minor] (scoring) SS1 and SS2 are both HIGH; SS5 is correctly LOW. But SS1 (live 'raising now') is research-derived per-row and will be mostly-null across a structured pull — doctrine §7.4 says a mostly-null signal is dropped, not scored. As the highest-weighted signal it cannot also be the most coverage-fragile without a stated coverage floor.
   FIX: State an expected coverage estimate for SS1 and a fallback: if live-raise coverage runs below the usable threshold, fall back to 'recently raised' (last_funding_round_date within N months, which IS facetable) as the scored proxy so the HIGH weight rests on observable data.
   PROVIDERS: crustdata last_funding_round_type/date, apollo funding dates; research/press for live status
6. [minor] (provider-coverage) SS5 (recently hired IP/R&D leadership) is derived with thin coverage and LOW weight — appropriately handled. No blocker. Minor note: there is no named source path for it beyond 'publicly announced role change'.
   FIX: Note the likely route (serper/exa for announced role changes, or LinkedIn job-change signals) so the engine doesn't treat it as unsourceable; keep LOW weight and unknown≠negative.
   PROVIDERS: serper_google_search, exa_search, apify linkedin actors
