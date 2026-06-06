# ngAbs Learnings Capture -- 2026-06-03

**Source:** Expert response to checkpoint email (2026-06-02)
**Approved by:** Expert (Market Development)
**Applied against:** `teknova-ngabs-playbook-v1-2026-05-29.md`
**Status:** Two decisions locked. Two questions still open (Q3, Q4 -- email cut off).

---

## Decision 1: Acquired company routing rule

**Judgment call:** Route by email domain, not company name.

- Contact has `@pfizer` email --> file under Pfizer Oncology, not Seagen
- Contact still on `@seagen` email --> keep as standalone Seagen row
- Expert confirms: CRM correspondence with Seagen's location is already on Pfizer emails

**Engineering ask (flagged for classifier):** Build email-domain screening into the model. When a company has been acquired, the contact's email domain determines which parent entity they route to, not the company name on the web presence.

**Downstream work:**
- [ ] Classifier update: add email-domain field as a routing input for acquired entities
- [ ] Apply rule to Seagen rows in source list
- [ ] Document rule in playbook as general acquired-company handling pattern (will recur across the 400+)

---

## Decision 2: Fragment-only developers excluded from G1

**Judgment call:** Tighten G1. Standalone antibody fragments do not independently qualify.

New G1 logic:
- Requires at least one of: bispecific, multispecific, ADC
- Standalone antibody fragments = out-of-scope
- Exception: fragments co-occurring with bispecific/ADC/multispecific work still qualify ("adjacent only when paired")

**Playbook update required:**
- G1 gate: add explicit exclusion for fragment-only; add co-occurrence exception language
- Section 2.4: change "adjacent / lower priority" to "adjacent only when paired" -- fragments do not independently qualify for Sprint 1

**Downstream work:**
- [ ] Playbook v2: update G1 definition + Section 2.4 language
- [ ] Classifier prompt update: enforce fragment-only = "no" unless co-occurring
- [ ] Re-evaluate Hovione against updated G1 (expected result: excluded from Sprint 1)

---

## Still open (Q3 and Q4 -- not yet answered)

**Q3:** Insilico Medicine / AI-only shops -- tighten classifier to hard "no" or let wet-lab gate handle it?

**Q4:** Bulk-run approval -- any companies to eyeball before the full batch runs?

**Next step:** Follow up once we have Q1 and Q2 changes implemented; include Q3 and Q4 in that touchpoint or surface separately if the bulk run is time-sensitive.
