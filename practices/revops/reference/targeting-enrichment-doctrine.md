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
