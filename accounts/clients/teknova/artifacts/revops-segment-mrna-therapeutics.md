# Segment Criteria: mrna-therapeutics

**Client:** teknova
**Play:** mrna-therapeutics
**Date:** 2026-06-11
**Offer (one sentence):** RUO-through-GMP custom reagent, buffer, and water supply across the full mRNA production workflow — plasmid template, IVT, purification/TFF, LNP formulation and fill-finish, and cryopreservation/storage — for North American developers of mRNA therapeutics (conventional mRNA, saRNA, circRNA, and mRNA vaccines) running active process development or manufacturing.
**Source:** `plays/mrna-therapeutics/Teknova_mRNA_Outreach_Playbook_v1 2026.06.10.md` (Ellie, 2026-06-10)

---

## Entity resolution (normalize step — runs BEFORE gates, not a per-row question)

Applied automatically during the normalize stage; the operator is not asked row-by-row.

### Acquired / renamed entity → resolve to the live parent, then screen
- **Rule:** when a company has been acquired, renamed, or folded into a parent, resolve it to the **live operating entity** first, then apply all gates and the size rule to that live entity. Detect via name strings ("now part of X", "a/an X company", "formerly Y"), a domain that redirects to or belongs to a different parent, or an acquired/defunct standalone whose domain now resolves to the acquirer.
- **Then screen the parent:** the resolved live entity runs G1–G5, the size rule, and the large-diversified flag. If the live parent is a large diversified player, it stays in (no size cutoff) and is flagged `large_diversified_flag` (per client SME 2026-06-11); it is not dropped and not sent back as a per-row question.
- **Worked examples from the pilot batch** (illustrative, resolve at screen time): "Precision NanoSystems is now part of Cytiva" → resolve to the Cytiva/Danaher entity; "RaNA Therapeutics" on domain `translate.bio` (Translate Bio, acquired by Sanofi) → resolve to the live parent. Acquired-company *contact* routing (which email domain is live) is handled in the contact routing rules.
- **Provenance:** record both the source name and the resolved live entity on the staging row; never silently overwrite — the resolution is a labeled transform, reviewable on the surface.

---

## Hard filters

Records must match all hard filters to enter the segment. These are the playbook's company gates G1–G5 (§4) in schema form.

### Company size — NO hard size filter (intentional, play-specific)
- **Type:** firmographic
- **Match:** not a filter (recorded here so the absence is explicit)
- **Rule:** this play has **no employee-count cutoff.** The mRNA playbook §3.1 ("no hard cutoff") and the client SME decision (2026-06-11, "keep + flag large diversified pharma") **supersede the standing engagement ICP's 50–2,000 / large-pharma filter for `mrna-therapeutics` only** (operator decision 2026-06-11). The engagement ICP is unchanged for other plays. Large players are handled by the `large_diversified_flag` (see soft signals / contact-level review), **not** by exclusion. Headcount is still enriched and recorded — it informs the flag and prioritization, it does not gate.

### Active mRNA program (G1 — Modality)
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** Company has at least one disclosed messenger-RNA therapeutic program — conventional mRNA, self-amplifying RNA (saRNA), circular RNA (circRNA), or an mRNA-based vaccine/immunotherapy — verifiable via pipeline page, peer-reviewed publication, clinical trial listing, press/funding, or job posts referencing mRNA/IVT/LNP.
- **Description:** Company is actively working on mRNA therapeutics. Reject if the only modality is non-mRNA (antibody, small molecule, AAV, siRNA/ASO-only).

### North American lab footprint (G2 — Geography)
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** Company operates at least one physical production OR R&D lab in the United States, Canada, or Mexico. HQ abroad is acceptable only if a confirmed NA wet-lab/manufacturing site exists; an HQ-only or virtual address does not qualify.
- **Description:** Reagent consumption and qualification timelines require a NA wet-lab site as the consumption point.

### Runs physical labs (G3 — Lab/operations)
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** Confirmed wet-lab or manufacturing operations — process development, IVT, formulation, or QC. Reject purely computational/AI, IP-licensing, or holding entities.
- **Description:** Physical process work is the precondition for reagent demand.

### Reagent fit (G4 — Reagent fit)
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** Company's disclosed mRNA process work plausibly consumes Teknova-type inputs — IVT/biological buffers, salts and nucleotide additives, chromatography/TFF buffers, LNP formulation and sucrose/citrate buffers, WFI-quality water, or cryopreservation media. Implied by G1 + G3 (mRNA process work ⇒ buffers, salts, water, formulation media). An existing-customer/billing flag in CRM is the strongest possible evidence and overrides website inference.
- **Description:** mRNA process activity at a physical NA lab is taken as reagent demand. Billing history beats scraped data.

### In-scope organization type (G5 — Not excluded)
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** Company maps to at least one of the playbook §2 types: (a) mRNA/RNA therapeutics developer (biotech/pharma with in-house mRNA/saRNA/circRNA pipeline PD or GMP labs in NA); (b) CDMO/CMO with an explicit mRNA or LNP manufacturing line in NA (not generic biologics); (c) LNP/delivery-technology company running formulation wet labs on mRNA payloads (not pure IP/licensing); (d) mRNA vaccine developer with an active NA process/clinical site; (e) IVT-enzyme/nucleotide/capping-reagent producer that *also* runs in-house process/QC labs (existing-account flag overrides "competitor" inference — see disqualifier note); (f) academic/non-profit translational center running mRNA process development with a GMP/translational core.
- **Description:** Filters out disqualified types (§2 exclusions). An existing-customer flag short-circuits the "reagent maker = competitor" inference; such accounts are not excluded under G5 but still must pass G1 and the CRM activity rule.

---

## Soft signals

Records that pass hard filters get scored by soft signals. Soft signals do not exclude. **Status: confirmed.** The playbook §4 reads gate-only ("deterministic gates, not scores"), but the client SME confirmed (2026-06-11, via operator) that ranking IS wanted. This soft-signal layer is therefore retained as the prioritization/ranking layer on top of the gates.

### Conventional-mRNA / vaccine / LNP-formulation focus
- **Type:** firmographic
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** Pipeline emphasizes mRNA/saRNA/circRNA therapeutics or vaccines with in-house LNP formulation, versus an RNA program that is early-discovery or outsourced.
- **Description:** Highest-fit accounts run IVT + purification + LNP formulation in-house — the broadest Teknova reagent/water/buffer pull.

### In-house process development or manufacturing function
- **Type:** firmographic
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** Company has a named PD, bioprocessing, MSAT/manufacturing-sciences, drug-substance, or LNP/formulation group — from org-chart signals, hiring, conference presentations, or publications.
- **Description:** Orgs that own PD/manufacturing in-house buy process reagents directly and value supply continuity.

### Clinical/commercial-stage mRNA assets in scale-up or tech transfer
- **Type:** firmographic
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** At least one mRNA program in Phase I/II/III or active tech transfer from PD to GMP, per clinical-trial registry entries or company disclosures within the last 18 months.
- **Description:** Programs at this stage consume the most reagent volume and feel scale-up reagent bottlenecks acutely; clinical-scale tech transfer pulls WFI water in single-use bag formats.

### Existing Teknova account flag
- **Type:** relational
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** An existing-customer/billing flag in CRM for the account.
- **Description:** Per §4 G4/G5, billing history is the strongest fit evidence and overrides website inference — especially decisive for IVT-enzyme/nucleotide producers that would otherwise read as competitors.

### CDMO/CMO with explicit mRNA/LNP line
- **Type:** firmographic
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** A contract manufacturer that states an mRNA or LNP service line with GMP capacity in NA (not generic biologics CDMO language).
- **Description:** High-volume, repeat GMP-grade and custom-formulation demand when the mRNA/LNP capability is explicit.

### Recent financing or partnership tied to the modality
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** Financing round, partnership, or milestone within the last 18 months explicitly referencing mRNA/saRNA/circRNA/LNP programs or capacity.
- **Description:** Fresh capital tied to the modality predicts near-term reagent purchasing.

### NA mRNA/LNP capacity expansion
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** Announced new NA manufacturing facility, mRNA/LNP capacity expansion, or PD-site investment in the last 18 months.
- **Description:** Capacity expansion creates a near-term reagent-qualification window.

### Hiring for PD, IVT, formulation, or MSAT roles
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** Open job postings for Process Development, IVT/Drug Substance, LNP/Formulation, Downstream/Upstream, or MSAT roles in the last 90 days.
- **Description:** Hiring in these functions signals program activity and an open door for technical-supply conversations.

### Recent mRNA-relevant publication or conference presentation
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** low
- **Observable signal:** Company personnel authored a publication or presented at a relevant conference (e.g. TIDES, mRNA-focused tracks, BPI, PEGS-RNA) on mRNA process/formulation work in the last 18 months.
- **Description:** Lower weight because publication lag means the work may predate the trigger window.

---

## Hard filters at the contact level

These apply once a qualifying company is identified (playbook §3.2 and §5).

### In-scope title or function
- **Type:** demographic
- **Match:** hard filter
- **Observable signal:** Contact's current title maps to one of three approved functions per §3.2: (a) **Process / Manufacturing** — VP/Head of Process Development, Director Process Development, VP/Director Bioprocessing, Head of Manufacturing / MSAT, Director Downstream Processing, Director Upstream Processing, Director/Head mRNA Production, Manager Manufacturing Sciences (MSAT)/Tech Transfer, Principal/Senior Scientist (Process Development, Upstream/Downstream, or LNP Formulation), Lab/Operations Manager at a relevant PD or GMP site; (b) **R&D / Science** — CSO, VP R&D, VP/Director mRNA Platform/Technology, Head of RNA / Nucleic Acid Sciences, Director LNP/Formulation Development, Director IVT/Drug Substance, Director Analytical Development, CMC Lead/Director, Principal Scientist RNA/mRNA, Scientist/Associate Scientist (Bioprocessing, IVT, Formulation, Analytical Development); (c) **Procurement / Supply** — Director Procurement (R&D/GMP materials), Strategic Sourcing Manager Raw Materials, Supply Chain Lead Bioprocess, Materials Management. A Tier-4 or off-list title at a strongly-qualified account may still pass if it is the best available contact (flag for review).
- **Description:** Hard match on current title against the approved title set; normalize synonyms, abbreviations, and seniority.

### Title-exclusion keywords absent
- **Type:** demographic
- **Match:** hard filter
- **Observable signal:** Contact's current title does not contain any of the playbook §3.2 excluded keywords (User, CX, UX, Business, Sales, Territory, Strategy, Strategic, Forecast, Forecasting, Field, Learning, Medical Affairs, Global Head, Talent Acquisition, Recruiter, Recruiting, Finance, Advertising, Quality Assurance, QA, QA/RA, Regulatory, Communications, IT, Information Technology, Technology, Data Science, Data, Digital, Informatics, Intelligence, Marketing, Market, Support, Patient, Account Manager, HR, Human Resources, Portfolio, Project Manager, Project Management, Customer, Consumer, Brand Manager, Brand, Analytics, Engagement, Statistics, Franchise, Safety, Change Readiness, Legal, Counsel, Policy, Product, Accounting, Payer, Payroll, Economics, Collaborations, Biometrics, Scouting, Reimbursement, Access, Planner, Compliance, Liaison, Thought Leader Liaison, Enablement, Patent) on a case-insensitive **word-boundary** match — UNLESS the title also contains an approved Procurement/Supply term tied to lab/GMP raw-materials purchasing.
- **Description:** Excludes out-of-scope functions while preserving legitimate buyers like "Strategic Sourcing Manager, Raw Materials." Word-boundary matching prevents false positives (e.g. "Data" must not strike "Data-driven Process Scientist" when an approved term is present). When in doubt, exclude and flag for review.

### Current employer = qualified company (LinkedIn verification)
- **Type:** relational
- **Match:** hard filter
- **Observable signal:** A LinkedIn profile is **not required**. When one is present, the contact's MOST RECENT position must match the company in the record (current employer, not a past role) and the current title must match or be a reasonable synonym of the record title. On match: linkedin_verified = true, capture verification date + profile URL. On mismatch (moved companies, changed roles, stale title): linkedin_verified = false, route to human review — do not auto-include. If no profile exists: linkedin_verified = **null** (distinct from false) and the contact remains eligible on other criteria.
- **Description:** Per §5.2. Stale/moved-on contacts are removed; absence of a profile is not a disqualifier.

---

## Disqualifiers

Explicit anti-list. A record matching any disqualifier is removed regardless of other matches.

### Recent CRM activity (180 days) — hard suppression
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** Contact OR account has any logged CRM activity within the trailing 180 days (from run date) — outbound/inbound email logged to the contact, membership in any active or recent outreach campaign/sequence, a documented meeting/call/demo, or any other logged touch (task, engagement-tied note, opportunity activity). Match by email first, then full-name-plus-company fallback. Ambiguous matches default to SUPPRESS and flag for human review.
- **Description:** Per §5.3, a hard suppression rule protecting live engagements from a cold sprint. Both contact and account are checked.

### Discovery-only or computational-only RNA shop
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** Company's public materials indicate purely computational/AI RNA-design or discovery-only operations with no disclosed wet-lab or process-reagent consumption anywhere in the org.
- **Description:** No physical reagent consumption means no addressable demand (§2 exclusion).

### Non-mRNA modality only
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** Company's only disclosed modality is unrelated to mRNA — small-molecule-only, antibody-only, AAV/gene-therapy with no RNA program, or diagnostics-only.
- **Description:** Wrong modality fit (§2 exclusion).

### siRNA / ASO / oligonucleotide-only
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** Company's only nucleic-acid program is siRNA, ASO, or other oligonucleotide therapeutics with no messenger-RNA therapeutic program present.
- **Description:** Different chemistry and workflow; out of scope unless an mRNA program is also present (§2 exclusion).

### No North American lab footprint
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** Company has no production OR R&D lab physically located in the US, Canada, or Mexico (HQ-only address does not qualify).
- **Description:** NA footprint is a hard prerequisite (§4 G2).

### Distributor, reseller, or reagent-irrelevant CRO
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** Company's primary business is distribution/resale of research tools or reagents with no internal mRNA pipeline, OR it is a CRO whose services do not include mRNA PD, IVT, purification, or formulation wet-lab work that consumes Teknova inputs.
- **Description:** Distributors and reagent-irrelevant CROs do not consume reagents at PD/manufacturing volumes (§2 exclusion). A CRO descriptor alone is not disqualifying — relevant mRNA process service lines qualify under the in-scope org-type filter.

### Profile mismatch flag
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** Contact's LinkedIn profile shows they have moved to a different company, changed to an out-of-scope role, or shows no current role. (Routes to human_review:linkedin_conflict rather than silent drop, per §6 step 4.)
- **Description:** Stale or moved-on contacts are routed out of the active list pending review.

---

## Confidence and gaps

- **Assumptions made:**
  - Soft-signal weights assigned from the playbook's framing (in-house IVT+purification+LNP = highest reagent pull; existing-account flag as decisive). No weighting was prescribed.
  - Geography includes Mexico per §3.1/§4 G2 ("US/Canada/Mexico"), broader than the ngabs play's effective US/Canada working set.
  - Contact title set and exclusion keywords taken verbatim from §3.2; the 180-day CRM window taken verbatim from §5.3.
- **Client SME decisions (2026-06-11, via operator — current iteration, see `client-guidance.md` §0):**
  - **Ranking confirmed.** The playbook §4 reads gate-only; the SME confirmed soft-scoring/ranking is wanted. The soft-signals layer is retained. (Resolves the play's biggest open question.)
  - **Oligonucleotide-only OUT, LNP/delivery IN.** siRNA/ASO/RNA-editing/AOC platforms are OUT even when self-described as "RNA therapeutics"; LNP/delivery-tech with formulation wet labs are IN even without their own mRNA program.
  - **Competitors (reagent/IVT-enzyme makers) and large diversified pharma: KEEP and FLAG, not disqualified.** These stay in the segment carrying a review flag (`competitor_flag` / `large_diversified_flag`) rather than being removed. An existing-account flag overrides the competitor read.
  - **No company-size cutoff for this play** (operator decision 2026-06-11). The playbook §3.1 "no hard cutoff" + the keep-and-flag-large-pharma call supersede the standing engagement ICP's 50–2,000 / large-pharma filter **for `mrna-therapeutics` only**; the engagement ICP is untouched for other plays. Large players are flagged, not excluded. See the Entity-resolution and Company-size sections above.
  - **Acquired/renamed entities resolve to the live parent, then screen** (operator decision 2026-06-11) — a written normalize rule, not a per-row operator question. See the Entity-resolution section above.
- **Decisions against the brief:**
  - Kept all three persona columns (Process/Manufacturing, R&D/Science, Procurement/Supply) in scope. If the first wave should be narrowed to one function (e.g. PD-led), that's a one-line tightening of the title hard filter.
  - Encoded the §3.2 procurement carve-out (an excluded-keyword title still passes if it also carries an approved raw-materials-procurement term) as a conditional in the title-exclusion filter.
  - Encoded the §4 existing-customer override (billing history beats "reagent-maker = competitor") as both a G5 note and a high-weight soft signal.
- **Open questions:**
  - ~~Gate-only or soft-scoring~~ — RESOLVED 2026-06-11: ranking wanted.
  - ~~Oligo / LNP / competitor / large-pharma scope~~ — RESOLVED 2026-06-11 (see SME decisions above).
  - Narrow the first wave to one function, or run all three personas in parallel?
  - **Existing-customer / active-deal suppression list** — STILL OPEN, and the load-bearing delivery blocker. Also what would let the competitor/large-diversified flags resolve instead of routing to review.
  - Is the LinkedIn-mismatch disposition strict-remove or route-to-review? Playbook §5.2/§6 reads as route-to-human-review (not silent removal) — encoded that way; confirm.
- **Signals not yet observable:**
  - CRM existing-customer flag and 180-day activity — require a Salesforce/CRM cross-walk wired into this play. Without it, G4's billing override and the §5.3 suppression cannot be applied deterministically. **This is the load-bearing gap for delivery.**
  - Verified GMP-vs-RUO purchasing intent at the company level — would sharpen prioritization.
  - Reagent-spend size by program — would let soft scoring prioritize high-volume buyers explicitly.
