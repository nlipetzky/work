# Segment Criteria: ngabs

**Client:** teknova
**Play:** ngabs
**Date:** 2026-06-01
**Offer (one sentence):** RUO-through-GMP custom reagent supply — mammalian cell-culture media, process and chromatography/TFF buffers, ADC conjugation and formulation buffer systems, cryopreservation media, water, and environmental-monitoring plates — for North American developers of next-generation antibodies (bispecific ADCs, multispecifics, and adjacent antibody-based formats) running active PD or manufacturing programs.

---

## Hard filters

Records must match all hard filters to enter the segment.

### Active ngAbs program
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** Company has at least one disclosed antibody-based next-generation-antibody program — bispecific antibody, multispecific antibody, antibody-drug conjugate, bispecific ADC, or adjacent antibody-based format (Fc-fusion, antibody fragment / scFv / Fab / VHH / BiTE, immunocytokine, radioimmunoconjugate, trispecific) — verifiable via pipeline disclosure, platform/technology page, press, peer-reviewed publication, or clinicaltrials.gov.
- **Description:** Company is actively developing an antibody-based ngAbs therapeutic. Excludes companies whose only modality is unrelated to antibody-based biologics.

### Live program (not abandoned)
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** Evidence the program is currently active: current pipeline listing, active clinical trial, ngAbs-relevant publication or conference presentation within the last 18 months, hiring for ngAbs-related roles, or program-tied financing.
- **Description:** The ngAbs program is in motion, not shelved or discontinued.

### North American lab footprint
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** Company operates at least one production OR R&D lab physically located in the United States, Canada, or Mexico. The site must be a confirmed wet-lab, process-development, or manufacturing location (HQ-only address does not qualify).
- **Description:** Reagent supply economics and qualification timelines require a NA wet-lab site as the consumption point.

### Reagent-relevant workflow
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** Company's disclosed work plausibly consumes Teknova-type inputs — mammalian cell-culture media, chromatography or TFF buffers, conjugation or formulation buffer systems, or cryopreservation reagents. Inferred from program type (any antibody-based biologic in PD or manufacturing) and operating mode (wet-lab or process-development activity, not purely computational).
- **Description:** Excludes purely in-silico, AI-only, or discovery-only shops with no wet-lab consumption.

### In-scope organization type
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** Company maps to at least one of: (a) clinical-stage biotech developing bispecific/multispecific antibodies or bispecific ADCs; (b) antibody-focused biopharma with dedicated ADC or multispecific platform; (c) mid-to-large biopharma with active ngAbs program and in-house bioprocessing; (d) CDMO or CMO with explicit antibody/ADC service line; (e) antibody-discovery/engineering platform company with wet-lab/PD operations; (f) academic or non-profit translational center running antibody process development.
- **Description:** Filters out distributors, pure research-tool resellers, and contract research orgs with no reagent consumption.

---

## Soft signals

Records that pass hard filters get scored by soft signals. Soft signals do not exclude.

### Conjugated- or multispecific-format focus
- **Type:** firmographic
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** Pipeline emphasizes bispecific ADCs, ADCs, or multispecific antibodies (the most reagent-intensive ngAbs workflows) versus simpler antibody fragments or Fc-fusions.
- **Description:** Highest-fit accounts run conjugation and/or chain-pairing workflows; these consume the broadest set of Teknova inputs.

### In-house process development or bioprocessing function
- **Type:** firmographic
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** Company has a named PD, bioprocessing, downstream, upstream, or MSAT/manufacturing-sciences group based on org-chart signals, hiring patterns, conference presentations, or publications.
- **Description:** Companies that own PD/bioprocessing in-house buy custom reagents directly and value supply continuity, versus pure-discovery shops that outsource everything.

### Clinical-stage assets in scale-up or tech transfer
- **Type:** firmographic
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** At least one ngAbs program is in Phase I, Phase II, or Phase III, or is in active tech transfer from PD to GMP manufacturing, evidenced by clinical trial registry entries or company disclosures within the last 18 months.
- **Description:** Programs at this stage consume the most reagent volume and feel scale-up bottlenecks acutely.

### Recent financing tied to the modality
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** Company announced a financing round, partnership, or milestone payment within the last 18 months that explicitly references ngAbs, bispecific, multispecific, or ADC programs.
- **Description:** Fresh capital tied to the modality predicts near-term reagent purchasing.

### Named ngAbs platform or technology
- **Type:** technographic
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** Company publicly names a proprietary ngAbs platform — bispecific scaffold, ADC linker-payload platform, multispecific format, or conjugation chemistry.
- **Description:** Platform companies run continuous PD across multiple programs, generating sustained reagent demand.

### NA manufacturing or PD capacity expansion
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** Company announced a new NA manufacturing facility, capacity expansion, or PD site investment in the last 18 months tied to antibody-based biologics.
- **Description:** Capacity expansion creates a near-term reagent-qualification window.

### Hiring for PD, bioprocessing, or MSAT roles
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** Company has open job postings for Process Development, Bioprocessing, Downstream/Upstream, MSAT, ADC/Conjugation, or Cell Line Development roles in the last 90 days.
- **Description:** Hiring in these functions signals program activity and an open door for technical-supply conversations.

### Recent ngAbs-relevant publication or conference presentation
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** low
- **Observable signal:** Company personnel authored a peer-reviewed publication or presented at a conference (PEGS, BPI, World ADC, AACR, ASH, or equivalent) on ngAbs work in the last 18 months.
- **Description:** Lower-weight signal because publication lag means the work it reflects may be older than the trigger window suggests.

---

## Hard filters at the contact level

These apply once a qualifying company is identified.

### In-scope title or function
- **Type:** demographic
- **Match:** hard filter
- **Observable signal:** Contact's current title maps to one of three functions: (a) Process / Manufacturing — VP/Head/Director Process Development, VP/Director Bioprocessing, Head of Manufacturing / MSAT, Director Downstream Processing, Director Upstream Processing, Manager Manufacturing Sciences / Tech Transfer, Principal / Senior Scientist (Process Dev, Downstream, Upstream, Formulation), Lab / Operations Manager at a PD or GMP site; (b) R&D / Science — CSO, VP R&D, VP/Director Antibody Engineering, Head of Biologics / Protein Sciences, Director ADC / Conjugation, Director Cell Line Development, CMC Lead / Director, Scientist / Associate Scientist (Bioprocessing, Cell Culture, Analytical Development); (c) Procurement / Supply — Director Procurement (R&D / GMP materials), Strategic Sourcing Manager Raw Materials, Supply Chain Lead Bioprocess.
- **Description:** Hard match on current title against the approved title set in the playbook.

### Title-exclusion keywords absent
- **Type:** demographic
- **Match:** hard filter
- **Observable signal:** Contact's current title does not contain any of the playbook's excluded keywords (User, CX, UX, Business, Sales, Territory, Strategy, Strategic, Forecast, Forecasting, Field, Learning, Medical Affairs, Global Head, Talent Acquisition, Recruiter, Recruiting, Finance, Advertising, Quality Assurance, QA, QA/RA, Regulatory, Communications, IT, Information Technology, Technology, Data Science, Data, Digital, Informatics, Intelligence, Marketing, Market, Support, Patient, Account Manager, HR, Human Resources, Portfolio, Project Manager, Project Management, Customer, Consumer, Brand Manager, Brand, Analytics, Engagement, Statistics, Franchise, Safety, Change Readiness, Legal, Counsel, Policy, Product, Accounting, Payer, Payroll, Economics, Collaborations, Biometrics, Scouting, Reimbursement, Access, Planner, Compliance, Liaison, Thought Leader Liaison, Enablement, Patent) on a case-insensitive word-boundary match — UNLESS the title also contains an approved Procurement/Supply term tied to lab/GMP raw-materials purchasing.
- **Description:** Excludes out-of-scope functions while preserving legitimate procurement buyers like "Strategic Sourcing Manager, Raw Materials." Word-boundary matching prevents false positives.

### Current employer = qualified company
- **Type:** relational
- **Match:** hard filter
- **Observable signal:** If a public profile (LinkedIn) exists for the contact, the contact's most recent role lists the qualifying ngAbs company as current employer with a matching in-scope title. If no public profile exists, the database record stands but is tagged lower-confidence.
- **Description:** Stale contacts (moved companies, changed roles out of scope) are removed. Absence of a LinkedIn profile is not a disqualifier — the contact proceeds with a lower-confidence flag.

---

## Disqualifiers

Explicit anti-list. A record matching any disqualifier is removed regardless of other matches.

### Recent CRM activity (180 days)
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** Contact has any logged CRM activity within the last 180 days — outbound or inbound email, membership in any active or recent campaign/sequence, documented meeting or call or demo, or other logged engagement touch (task, engagement-tied note, opportunity activity). Match by email first, then by full-name-plus-company fallback. Ambiguous matches default to disqualified.
- **Description:** Prevents double-touching live contacts. Per playbook Section 6.2, this is a hard suppression rule. Engaged contacts are not re-prospected from a cold sequence.

### Discovery-only or computational-only shop
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** Company's public materials indicate purely in-silico, AI-only, or discovery-only operations with no disclosed wet-lab, PD, or manufacturing footprint anywhere in the org.
- **Description:** No physical reagent consumption means no addressable demand.

### Non-antibody modality only
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** Company's only disclosed modality is unrelated to antibody-based biologics (e.g. small-molecule-only, gene-therapy-only with no antibody program, cell-therapy-only, diagnostics-only).
- **Description:** Wrong modality fit.

### No North American lab footprint
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** Company has no production OR R&D lab physically located in the United States, Canada, or Mexico (HQ-only address does not qualify).
- **Description:** NA footprint is a hard prerequisite per the playbook.

### Distributor or pure reseller
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** Company's primary business is distribution or resale of research tools or reagents, with no internal therapeutic development pipeline.
- **Description:** Distributors do not consume reagents at PD/manufacturing volumes for therapeutic programs.

### CRO with no relevant reagent consumption
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** Company is a contract research organization whose services do not include antibody PD, bioprocessing, ADC conjugation, or related wet-lab work that consumes Teknova inputs.
- **Description:** CRO descriptor alone is not disqualifying — antibody/ADC service lines qualify (per the in-scope organization type filter); only reagent-irrelevant CROs are excluded.

### Profile mismatch flag
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** Contact's public profile (LinkedIn) shows they have moved to a different company, changed to an out-of-scope role, or shows no current role.
- **Description:** Stale or moved-on contacts are routed out of the active list per playbook Section 6.1.

---

## Confidence and gaps

- **Assumptions made:**
  - Soft-signal weights (high/medium/low) were assigned based on the playbook's framing of bispecific ADCs and multispecifics as the most reagent-intensive ngAbs workflows, and on the playbook's emphasis on PD/bioprocessing functions as primary buyers. No weighting was prescribed in the playbook itself.
  - The "Live program (18-month window)" hard filter uses the playbook's 18-month signal language for active development.
  - Contact-level hard filters were derived from the playbook's Section 4.2 approved titles and Section 4.2 exclusion table. Word-boundary matching was specified by the playbook explicitly.
  - The 180-day CRM suppression window is taken verbatim from the playbook (Section 6.2).
- **Decisions against the brief:**
  - The playbook structures qualification as five gates (G1-G5) plus title screening plus CRM suppression. I converted these into the schema's hard-filter / soft-signal / disqualifier taxonomy. Soft signals (financing, capacity expansion, hiring, publications) are not in the playbook — these are additions that turn binary gates into a scorable segment. If Ellie wants strict gate-only behavior with no soft scoring, this needs to be stripped back.
  - The playbook treats Procurement as a parallel target column equal to PD/Manufacturing and R&D/Science. I kept all three in scope at the contact-level hard filter. If Ellie wants to narrow Sprint 1 to PD-led contacts only, that is a one-line tightening of the title hard filter.
  - The playbook explicitly carves out an exception for procurement-title contacts whose titles otherwise contain an excluded keyword (e.g. "Strategic Sourcing Manager, Raw Materials"). I encoded this as a conditional in the title-exclusion hard filter.
- **Open questions:**
  - Does Ellie want soft-signal scoring on top of the playbook's binary gates, or strict gate-only filtering?
  - For Sprint 1 specifically, should the contact pool be narrowed to a single function (e.g. PD-led only) for testing, or all three functions in parallel?
  - Are there named accounts (current customers, accounts in active sales cycles, recent acquisitions) Teknova wants excluded that aren't in the playbook?
  - Is the LinkedIn-mismatch disqualifier strict (any mismatch removes) or soft (flag for review)? The playbook reads as strict; confirm.
- **Signals not yet observable:**
  - Named-account exclusion list (current Teknova customers, accounts in active SF opportunities) — would need a CRM cross-walk that this play doesn't currently have wired in.
  - Verified GMP-vs-RUO purchasing intent at the company level — would sharpen prioritization between same-modality accounts.
  - Reagent-spend size estimates by program — would let soft scoring prioritize high-volume buyers explicitly.
