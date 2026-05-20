# Data Sources: AAV Gene Therapy Target

**Client:** Teknova
**Play:** aav-gene-therapy-ellie-outreach
**Date:** 2026-05-20
**Companion to:** `DEFINITION-aav-gene-therapy-target-2026-05-20.md`

> **Engine-vs-play note (added 2026-05-20):** the engine principles say evidence-capture is the value and verdict-writing is commodity. This document organizes data sources around "qualifying / disqualifying criteria" — useful framing, but the engine treats every source as an **evidence-capture lane** that writes raw content to per-source columns, with qualification computed at view time. Re-read against `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md` (Principles 1, 3, 5). The source list and connection status here are accurate; the framing is play-specific, not engine-canonical.

For every criterion in the target definition, this lists exactly where the data comes from, where it lands on the company row, and what workflow puts it there. If a source is not connected yet, that's called out.

---

## Qualifying criteria

### Criterion 1 — Does the company actually do AAV gene therapy work?

We will accept any one of three independent proofs.

**Proof A — Salesforce account tagged AAV at Teknova**
- **Source:** Teknova Salesforce
- **How we read it:** Native Salesforce → Airtable sync into the Schema Map base (`app5wdHwgM1SPNxcx`), then daily SF Enrichment workflow joins the tagged Account into the Companies table on the RevOps Surface base.
- **Lands in:** `SF Account ID`, `SF Account Status Summary` (the AAV tag is read from the synced Account record).
- **Writer:** SF Enrichment workflow (the one that copies SF mirror → RevOps Surface).
- **Status:** connected.

**Proof B — A clinicaltrials.gov trial that passes the 3-clause test**
- **Source:** clinicaltrials.gov public API, queried live on every classification run.
- **How we read it:** L1 Discovery workflow (`9gcmEjq1lvOY2jZS`) pulls AAV-relevant trials by canonical indication keywords; L2 Classify workflow (`rXKuqfDwqX7TYzxK`) re-fetches each cited NCT directly via `https://clinicaltrials.gov/api/v2/studies/{NCT_ID}` and applies the 3-clause R5 test (interventional + canonical condition + AAV/gene-therapy intervention).
- **Lands in:** `CT.gov NCT IDs`, `CT.gov Indications`, `Most Advanced Phase`, `Trial Count`, `Most Recent Trial Date`, `Active Recruiting` (L1), then `Verification Status`, `Vector Evidence Clause`, `Custom Classification`, `Classification Notes` (L2).
- **Writer:** L1 for the trial inventory; L2 for the verdict.
- **Status:** connected.

**Proof C — Company website explicitly describes AAV work**
- **Source:** Company website (Domain field), fetched via plain HTTP.
- **How we read it:** Companies Enrichment workflow (`Z6RROKx5omdfvhtn`) — `Fetch Pages` nodes + `Check AAV Modality` code node. Looks for AAV anchor tokens (`aav`, `adeno-associated`, `adeno-associated viral`) plus a vector mechanism word (`vector`, `capsid`, `transduction`, `serotype`).
- **Lands in:** `Custom Classification`, `Custom Classification Source`, `Custom Classification Confidence`, `Custom Classification Detected Keywords`.
- **Writer:** Companies Enrichment workflow.
- **Status:** connected.

---

### Criterion 2 — Is the program currently active?

**Proof A — Trial status from CT.gov**
- **Source:** clinicaltrials.gov (same API call as Criterion 1 Proof B).
- **What we use:** `overallStatus`, `startDate`, `lastUpdatePostDate`.
- **Rule:** RECRUITING / ACTIVE_NOT_RECRUITING / ENROLLING_BY_INVITATION = current. COMPLETED with activity in last 5 years = current. TERMINATED / WITHDRAWN / SUSPENDED = discontinued. No activity in 5 years = dormant.
- **Lands in:** `Currency Status`, `Currency Evidence`, `Currency Checked At`.
- **Writer:** L2 Classify workflow.
- **Status:** connected.

**Proof B — Trade press override (program ended)**
- **Source:** Perplexity (which wraps BioPharma Dive, Fierce, Endpoints, STAT News, etc.).
- **How we read it:** Task B workflow (`wIyuFELxzXMgHCDV`) queries Perplexity per surfaced company asking whether the AAV program has been discontinued, then writes `program_status` event rows to the Company Events table with `Vitality` = ended / active / unknown.
- **Lands in:** Company Events table (`tblnzX2b2kqNGzW6r`). L2 Classify reads the latest `Is Latest=1 AND Event Type=program_status` row per company; if `Vitality=ended` and within 5-year window, overrides CT.gov "current" to "discontinued."
- **Writer:** Task B (program-status signal capture).
- **Status:** connected.

---

### Criterion 3 — Is the company the right scale?

**Headcount under 2,000 OR AAV CDMO**
- **Source:** Explorium (firmographic enrichment) for headcount; hardcoded constant for AAV-named CDMOs.
- **What we use:** Explorium `number_of_employees` / `employee_range` fields; the workflow constant `KNOWN_CDMOS` (forge biologics, andelyn biosciences, catalent, resilience, charles river, probio, thermo fisher, brammer bio, lonza, agc biologics, aavnergene, etc.).
- **Lands in:** `Employee Count`, `Employee Range`, `Company Type`.
- **Writer:** Companies Enrichment workflow (`Z6RROKx5omdfvhtn`), `Map Enriched Fields` code node.
- **Status:** connected.

**Not a wholly-owned subsidiary of a top-20 pharma**
- **Source:** Explorium parent / ultimate-parent fields.
- **What we use:** `parent_company_name`, `ultimate_parent_name`.
- **Lands in:** `Parent Company`, `Ultimate Parent`, `Subsidiary Status`.
- **Writer:** Companies Enrichment workflow.
- **Status:** connected. (The top-20 pharma list itself is a hardcoded check in the AAV Segment classifier — refinement candidate if needed.)

---

### Criterion 4 — Is the company in scope geographically (US/Canada)?

- **Source:** Explorium HQ fields.
- **What we use:** `company_country_code`, `company_region` (state), `company_city`.
- **Lands in:** `HQ Country`, `HQ State`, `HQ City`.
- **Writer:** Companies Enrichment workflow.
- **Status:** connected.

---

### Criterion 5 — Does the company have at least one clinical-stage program?

- **Source:** clinicaltrials.gov (same trial portfolio as Criterion 1 Proof B + 2 Proof A).
- **What we use:** trial phase (`phases` field from CT.gov), `overallStatus`, `lastUpdatePostDate`.
- **Lands in:** `Most Advanced Phase`, `Trial Count`, `Most Recent Trial Date`, `Active Recruiting`.
- **Writer:** L1 Discovery.
- **Status:** connected.

---

## Disqualifying criteria

### Active BD engagement at Teknova in the last six months

- **Source:** Teknova Salesforce (Activity history — Tasks, Events, Calls).
- **How we read it:** SF Activity Summary daily job summarizes recent activity on each Account.
- **Lands in:** `SF Account Status Summary`, `Last Account-Level Contact Date`, `Last BD Outcome`, `BD Follow-up Window Opens`.
- **Writer:** SF Enrichment workflow.
- **Status:** connected.

### Active Salesforce opportunity

- **Source:** Teknova Salesforce (Opportunity records on the Account).
- **What we use:** Open Opportunity status, stage.
- **Lands in:** `SF Has Open Opp` (checkbox), `SF Opp Stage`.
- **Writer:** SF Enrichment workflow.
- **Status:** connected.

### Account-level do-not-contact / outbound restricted

- **Source:** Manual entry in Airtable. No automated source.
- **Lands in:** `Account-Level DNC` (checkbox), `Outbound Restricted` (checkbox), `Outbound Restriction Reason` (text).
- **Writer:** Manual (Ellie / Nick / AE).
- **Status:** fields exist; currently unpopulated. **Action needed:** populate the 122 existing rows.

### Acquired or operationally abandoned

- **Source:** Three sources combined.
  - Explorium `acquired_by` / parent change fields (firmographic-level).
  - Manual `Stale Identity` checkbox + `M&A Status` enum on Companies.
  - Salesforce Account status (if SF has the company flagged inactive).
- **Lands in:** `Stale Identity`, `M&A Status`, `Subsidiary Status`, `Parent Company`, `Ultimate Parent`.
- **Writer:** Companies Enrichment workflow writes the Explorium-derived parent/ultimate fields; Stale Identity and M&A Status are manual.
- **Status:** Explorium pieces connected; manual flags unpopulated.

### In the alt-modality pool (wrong modality detected)

- **Source:** CT.gov condition text + Classification Rules table.
- **How we read it:** L2 Classify scans the CT.gov indications text for wrong-modality tokens (lentiviral, peptide, small molecule, RNA editing, autologous cell, non-viral, etc.) paired with context words (therapeutic, pipeline, platform, etc.).
- **Lands in:** `Verification Status` = rejected, `Enrichment Status` = rerouted_wrong_modality, `Custom Classification` = (the detected modality), `Rejection Reason`.
- **Writer:** L2 Classify.
- **Status:** connected.

### Vasculitis-disease sponsor only (ANCA-Associated Vasculitis homonym)

- **Source:** CT.gov condition text + Classification Rules table disease-variant list.
- **How we read it:** L2 Classify normalizes condition text (lowercase, strip HTML entities, collapse whitespace) and checks against the variant list (`ANCA Associated Vasculitis`, `Granulomatosis With Polyangiitis`, `Wegener's Granulomatosis`, the missing-space `EosinphilicGranulomatosis`, etc.).
- **Lands in:** `Verification Status` = rejected, `Rejection Reason` = (disease variant matched), `Custom Classification Source` = `L2:disease_aav_exclusion`.
- **Writer:** L2 Classify.
- **Status:** connected.

---

## Sources we explicitly do NOT trust on their own

| Source | Why we don't trust it alone |
|---|---|
| NAICS code / Explorium industry tag | Too generic — "biotech" or "pharmaceutical preparations" cannot distinguish AAV from any other modality. |
| Generic "gene therapy" web copy without AAV anchors | Routes to manual review, never auto-qualifies. |
| Disease keyword in a trial without intervention check | A trial in Duchenne or Hemophilia that uses standard-of-care or placebo is not AAV evidence. |
| Past AAV experience by a single employee | Person-level signal cannot qualify a company. |
| Company size alone | Headcount filter is one gate of five, not the primary one. |

---

## Connected sources not yet wired for AAV use

These are in the Data Sources registry (`apppQjlZiktpbO4aX` / `tblut8xIt9MgMO892`) with `available-not-wired` status, plus connections that exist but aren't routed into the AAV play yet.

| Source | What it would add |
|---|---|
| USPTO / PatentsView / Google Patents | Direct AAV vector / capsid / manufacturing IP. Would populate the existing `Patent Count` field that has no writer. |
| NIH RePORTER | Early-stage academic-spinout AAV grants (pre-clinical companies invisible to CT.gov). |
| SEC EDGAR | 10-K / 10-Q / 8-K disclosures for public AAV companies (pipeline detail beyond CT.gov). Already have `SEC CIK` from Explorium as the join key. |
| ASGCT | American Society of Gene & Cell Therapy — directly AAV-relevant conference. Would populate `Conference Attendance 12mo Count`. |
| BioProcess International | CMC-specific conference. Same purpose. |
| Citeline / Pharmaprojects (paid) | Structured pipeline / modality / mechanism-of-action data — more curated than CT.gov. Only if CT.gov + L2 prove insufficient. |
| FDA (general) | Designations (fast-track, orphan, RMAT, breakthrough), advisory committee actions. Strong gene-therapy program milestone signal. |
| Teknova internal (orders / customer history) | Strongest "is this an existing customer / what do they buy" signal. Separate from SF. Not exposed to the engine yet. |

---

## Where the configuration lives

- **Canonical AAV indication list (29 diseases):** Classification Rules table, base `appYBYH3aOHhTODAw`, table `tbl1HFYzezFYs5C3k`, rule name `canonical_aav_indications`.
- **Vasculitis-disease exclusion variants:** same table, rule name `disease_aav_exclusion`.
- **Wrong-modality tokens + reroute map:** same table, category `disqualifier_modality` + rule `modality_to_alt_play_map`.
- **Dormancy confirmed list:** same table, rule `dormancy_rule`.
- **Gene-therapy branded fallback phrases:** same table, rule `clause_b_gene_therapy_branded_fallback`.
- **AAV CDMO known list:** hardcoded in Companies Enrichment workflow `Map Enriched Fields` node (constant `KNOWN_CDMOS`).
- **Currency staleness threshold (5 years):** hardcoded in L2 Classify `Apply Rules` node (`STALENESS_YEARS = 5`).

All of these are editable. The Airtable-resident rules are editable by Ellie or Nick without engineering. The hardcoded constants require an Explorium-Direct or Workflows ticket.
