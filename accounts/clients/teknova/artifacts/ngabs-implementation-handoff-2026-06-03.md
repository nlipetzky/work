# ngAbs Sprint 1 -- Implementation Handoff

**Date:** 2026-06-03
**Source decisions:** Expert checkpoint response (2026-06-02) + operator ruling (2026-06-03)
**Consuming practice:** Boris / automation layer
**Blocker status:** Changes 1-4 unblock the bulk run. Change 5 (bulk-run approval) still requires expert sign-off.

---

## Change 1: Playbook v2 -- G1 gate, fragment exclusion

**File:** `sources/teknova-ngabs-playbook-v1-2026-05-29.md` --> produce `teknova-ngabs-playbook-v2-2026-06-03.md`

**Current G1 pass condition:**
> Organization is actively working on ngAbs therapeutics - bispecific ADCs and/or multispecifics (antibody-based biologics). Verified via pipeline, platform pages, press, publications, or clinicaltrials.gov.

**Updated G1 pass condition:**
> Organization is actively working on bispecific, ADC, and/or multispecific antibody therapeutics. Verified via pipeline, platform pages, press, publications, or clinicaltrials.gov. Standalone antibody fragment work (scFv, Fab, VHH/nanobody, BiTE) does not independently satisfy G1. Fragments qualify only when co-occurring with bispecific, ADC, or multispecific development at the same organization.

---

## Change 2: Playbook v2 -- Section 2.4, fragment language

**Same file as Change 1.**

**Current Section 2.4 framing:** Fragments listed as an in-scope adjacent format with a workflow profile (microbial culture media, dry powders, antibiotic solutions).

**Updated Section 2.4 framing:** Add the following note at the top of the fragment entry:

> Fragments are adjacent only when paired with a qualifying modality (bispecific, ADC, or multispecific) at the same organization. Fragment-only organizations do not qualify for Sprint 1 and should be excluded at G1. Do not use the workflow profile below to pass a fragment-only company.

The workflow profile (microbial expression line) stays for reference -- it applies when fragments co-occur with a qualifying modality.

---

## Change 3: Classifier prompt -- AI-only shops, hard exclusion

**Current behavior:** Classifier returns "unclear" for pure computational/AI antibody shops with no wet-lab presence.

**Required behavior:** Hard "no." AI-only and computational-only shops are already excluded by both the Section 3 exclusion list and G4 ("excludes purely computational/no-wet-lab orgs"). The classifier should not hedge on this class.

**Operator ruling (no expert input required):** We do not want AI-only shops. Treat as deterministic exclusion, not an edge case.

**Classifier change:** Add explicit instruction to the classifier prompt:
> If a company's primary activity is computational antibody design, AI-driven discovery, or in silico modeling with no evidence of wet-lab or process development operations, classify as ngAbs=no. Do not return "unclear" for this class. Absence of wet-lab evidence combined with computational-primary framing is sufficient for a hard no.

**Test case:** Insilico Medicine -- expected result after change: ngAbs=no.

---

## Change 4: Classifier -- acquired company email-domain routing rule

**Trigger:** Company in source list has been absorbed by a larger entity (e.g., Seagen --> Pfizer).

**New rule:**
- Check contact email domain, not company name on web presence.
- If contact email is `@acquirer.com` --> route contact under acquirer entity (e.g., Pfizer Oncology), not the acquired company row.
- If contact email is still `@acquired.com` --> keep under the acquired company row.
- If both email domains present in source --> flag row for review; default to acquirer if CRM correspondence already shows acquirer email.

**Data requirement:** Email domain must be available at classification time. If not present, row gets flagged rather than auto-routed.

**Apply immediately to:** Seagen rows in source list. CRM confirmation: existing Seagen correspondence uses Pfizer emails --> those contacts route to Pfizer Oncology.

**General pattern:** Document this rule in the playbook as the acquired-company handling standard. It will recur across the 400+ rows.

---

## Change 5: Bulk-run approval (still open -- do not proceed without this)

**Q4 from checkpoint email was not answered** -- expert did not reach it before the email was cut off.

Before running the classifier on the remaining 400+ unclassified rows, get explicit approval from the expert. The ask: any companies in the source list she'd want reviewed before the batch runs?

**Next touchpoint:** Include this in the follow-up after Changes 1-4 are implemented, or surface it separately if the bulk run is time-sensitive.

---

## Summary of artifacts to produce

| Artifact | Action |
|---|---|
| `teknova-ngabs-playbook-v2-2026-06-03.md` | New version -- G1 updated, Section 2.4 updated, acquired-company rule added |
| Classifier prompt (in system/workflow) | Update: fragment-only = no at G1, AI-only = hard no, email-domain routing added |
| Seagen rows in source list | Apply email-domain rule, route to Pfizer Oncology |
| Hovione row | Re-evaluate against updated G1 -- expected result: excluded from Sprint 1 |
