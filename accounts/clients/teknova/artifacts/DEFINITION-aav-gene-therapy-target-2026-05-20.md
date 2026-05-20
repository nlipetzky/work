# Definition: AAV Gene Therapy Target

**Client:** Teknova
**Play:** aav-gene-therapy-ellie-outreach
**Date:** 2026-05-20
**Status:** Definitive plain-English description. Derived from the canonical criteria artifact (`revops-segment-aav-gene-therapy-ellie-outreach.md` v4) and the implemented engine logic. Read and share freely.

> **Engine-vs-play note (added 2026-05-20):** this document conflates two layers that the engine principles require to be separate — (a) the **universal Target Definition** for an AAV gene therapy company (modality + active clinical program; reusable across any play in this category) and (b) the **Teknova-specific Play Filter** (geography, headcount, subsidiary status, suppression flags). They should be split into two artifacts under the two-layer target model. See `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md` (Principle 6). Split deferred; this file remains canonical for the play until refactored.

---

## What we mean by "AAV gene therapy target"

A target company is one that develops, manufactures, or contract-manufactures **adeno-associated virus (AAV) vectored therapeutics for human disease**, and is at a clinical stage where reagent and process-development decisions are actively being made.

"AAV" means the virus used as a delivery vehicle for a gene therapy. It is not the same as ANCA-associated vasculitis, an autoimmune disease that shares the abbreviation — that is the single most common false-positive trap in this space, and the engine handles it explicitly.

The buyer Teknova wants to reach is the operator inside that company who owns the transition from research-grade to GMP-grade reagents — typically a Director through SVP in Process Development, Manufacturing, or CMC. The contact-level definition is documented separately. This document defines the **company** that holds those buyers.

---

## A company qualifies if all of the following are true

These are the hard filters. Every one must pass.

### 1. The company actually does AAV gene therapy work

We accept any one of these as proof:

- **Salesforce account already tagged AAV** at Teknova. Highest-trust evidence; auto-qualifies.
- **A clinical trial sponsored by the company on clinicaltrials.gov** that passes a three-part test:
  - It is an interventional study (not observational, not seroprevalence, not natural history).
  - The conditions include a known AAV-treated disease (the canonical 29-indication list Ellie ratified — Hemophilia A/B, Duchenne, SMA, Pompe, OTC deficiency, LCA, etc.) AND none of the vasculitis-disease variants.
  - At least one intervention is a genuine gene-therapy product — named with terms like "AAV", "-parvovec", "adeno-associated", or "gene therapy" — AND is not standard-of-care, placebo, sham, device, or "other".
- **The company website** explicitly describes AAV vector work, capsid platforms, viral vector manufacturing, or AAV-based pipeline programs.

The clinical trial evidence outranks the website. A company whose website has dropped technical vocabulary but still runs an AAV trial still qualifies (Spark, BioMarin are examples).

### 2. The program is currently active

A trial that passes the AAV test is only sufficient if it is still alive:

- **Recruiting, active-not-recruiting, or enrolling-by-invitation** counts as current.
- **Completed within the last five years** counts as current.
- **Terminated, withdrawn, or suspended** does not. Those companies get routed to manual review rather than surfaced.
- **No trial activity in five years** (a "dormant" sponsor) is also not enough. Tacere, Avigen, Ceregene, Neurologix are examples.

When trade press (read via Perplexity) reports a program ended even though clinicaltrials.gov hasn't updated yet, the trade press signal wins. Pfizer's Beqvez discontinuation is the canonical example — trade press caught it before CT.gov did.

### 3. The company is the right scale

- Headcount under 2,000 full-time employees, OR the company is an AAV-named CDMO (Forge Biologics, Andelyn, Resilience, AGC Biologics, etc.).
- The company is not a wholly-owned subsidiary of a top-20 global pharma operating under that parent's CMC supply chain. AveXis under Novartis is the model exclusion. Independent CDMOs are included regardless of headcount.

### 4. The company is in scope geographically

Headquarters in the United States or Canada. EMEA and APAC are out of scope for this play.

### 5. The company has at least one clinical-stage program

Pure discovery-only shops with no IND-anchored work are out of scope. So are companies with all programs already past Phase II at commercial scale — that's a different conversation and different reagent products.

---

## A company is disqualified if any of the following are true

These are hard removes regardless of how well a company scores on everything else.

- **Active BD engagement at Teknova in the last six months.** Cold outreach into accounts BD is actively working creates internal conflict.
- **Active Salesforce opportunity.** Same reason.
- **Account-level do-not-contact** or any account where outreach is restricted by legal, client carve-out, or DNC.
- **Acquired or operationally abandoned.** Domain redirects to a parent, LinkedIn marked inactive, leadership all departed for an acquirer.
- **In the alt-modality pool.** If the company is clearly a lentiviral, peptide, small-molecule, RNA-editing, autologous-cell, or non-viral delivery shop with no AAV program, it goes to the appropriate alt-play pool. Not an AAV target.
- **Vasculitis-disease sponsor only.** A trial whose only "AAV" reference is ANCA-Associated Vasculitis is not gene therapy evidence.

---

## What we explicitly do NOT use to qualify a company

The following are common temptations that have produced false positives in past runs. The engine ignores them.

- **NAICS code / industry tag alone.** Generic "biotech" or "pharmaceutical preparations" does not establish AAV modality. Explorium's industry classification cannot distinguish AAV from any other modality.
- **"Gene therapy" branded language alone.** Without an AAV-specific anchor or a qualifying trial, gene-therapy branding routes to manual review, not auto-qualify.
- **Disease keyword only.** A trial that mentions Duchenne or Hemophilia is not proof — the trial must also be interventional and must use a gene-therapy product, not a standard-of-care therapy in the same disease.
- **Company size alone.** Big companies are not categorically disqualified, and small companies are not categorically qualified. The headcount filter is one of several gates, not the primary one.
- **Past AAV experience by an employee.** That's a contact-level concern, evaluated separately and not used to qualify the company.

---

## The data we use, by source

Every qualifying decision is back-traceable to one of these sources.

| Source | What it tells us |
|---|---|
| Teknova Salesforce (synced to Airtable) | Whether the company is already tagged AAV; whether there's an active opp, BD engagement, customer status, or DNC. |
| Clinicaltrials.gov (queried live on every classification run) | Sponsor's trial portfolio: trial NCT IDs, interventions, conditions, study type, overall status, start and last-update dates. |
| Perplexity (trade press wrapper) | Whether a program has been ended in trade press (BioPharma Dive, Fierce, Endpoints) — used to override stale CT.gov status. |
| Explorium (firmographic enrichment) | Headcount, headquarters, parent / ultimate parent, public/private status, funding history, founded year, NAICS, ticker, SEC CIK. Establishes scale and structure, never modality. |
| Company website (optional, secondary) | Public positioning. Used as corroboration on borderline cases, never alone. |

The Classification Rules table inside Airtable holds the canonical AAV indication list, the vasculitis-disease variant list, the alt-modality token list, the dormancy-confirmed list, and the gene-therapy-branded fallback phrases. Those rules are editable by Ellie or Nick without touching the workflow.

---

## What the verdict looks like on a company row

After classification, each company carries:

- **Verification Status** — `surfaced`, `borderline`, or `rejected`.
- **Vector Evidence Clause** — which test clause passed (currently always R5 when surfaced).
- **Custom Classification Source** — the rule path that produced the verdict.
- **Currency Status** — `current`, `dormant`, `discontinued`, or `unknown`.
- **Currency Evidence** — plain-language explanation: which NCT carried the verdict, what its status was, what dates supported it.
- **Classification Notes** — full audit trail with the rule version, run ID, and the cited evidence.
- **Classification Version** — the segment artifact version + rule revision used.

Every verdict can be opened and read. Nothing is opaque.

---

## Where this is implemented

- **Discovery (L1):** workflow `9gcmEjq1lvOY2jZS` — pulls AAV-relevant trials from clinicaltrials.gov and writes per-trial signal rows.
- **Enrichment:** workflow `Z6RROKx5omdfvhtn` — Explorium business match + deep enrichment.
- **Classification (L2):** workflow `rXKuqfDwqX7TYzxK` — the 3-clause AAV trial test, dormancy check, currency check, trade-press override.
- **Currency trade-press source:** workflow `wIyuFELxzXMgHCDV` — Perplexity-driven program-status signal capture.
- **Rules:** Classification Rules table inside base `appYBYH3aOHhTODAw` (RevOps Surface).

This document is the human-readable definition. The canonical machine-readable criteria, with full rationale and the operational detection logic, is in `accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`.
