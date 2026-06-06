# Draft: Ellie email -- ngAbs Sprint 1 checkpoint

**Date:** 2026-06-02
**Channel:** Email
**Purpose:** Four expert judgment calls needed before bulk run on 405 rows
**Approval gate:** Nick reviews before send

---

**Subject:** ngAbs target list -- 4 quick calls before we run the rest

Hi Ellie,

Checking in on the ngAbs target work. We're working through over 400 companies and verifying each against your criteria with wet-lab site evidence: facility pages, active job postings for relevant scientific roles, and pipeline data that distinguishes hands-on antibody work from computational or licensing-only activity. Your criteria are specific enough that this takes real sourcing work per company -- which is the right approach and is producing clean, citable signal. A few classification edge cases came up that need your call before we continue.

1. **Seagen:** Pfizer absorbed them and the standalone Seagen web presence is mostly gone -- web research returns incomplete address and site data. Keep Seagen as a separate target, or shift the relevant contacts under Pfizer Oncology? (Same question will come up for other acquired companies in the 405.)

2. **Fragment-only developers:** Hovione qualifies under your criteria but only on antibody fragments, no bispecific, ADC, or multispecific work. Your playbook rates fragments as adjacent / lower priority. Do you want fragment-only shops in the Sprint 1 send list, or hold them for a later wave focused on bispecifics, ADCs, and multispecifics?

3. **AI-only shops:** Insilico Medicine is a pure computational company -- no wet-lab antibody work. Your playbook excludes them but the classifier returned "unclear" rather than a hard no. Preference: tighten the rule so AI-only shops get rejected outright, or let the wet-lab evidence gate handle it?

4. **Bulk-run approval:** The validation pattern is solid. Any companies in the source list you'd want us to take a closer look at before we run the full batch?

Happy to take any of these on a quick call if easier.

---

**Hermes notes (not for send):**

- Do not attach the classifier validation log or the Airtable view. Detail lives in the operator system.
- If Nick wants to add context on timeline or volume, add one sentence after paragraph 1 -- do not expand the judgment-call bullets.
- Questions 1 and 2 may generate a policy update to the playbook. Log her response as a Learning against `teknova-ngabs-playbook-v1-2026-05-29.md`.
- Question 3: if she says "tighten the classifier," that's a classifier prompt update (Boris / automation layer). Flag it.
- Question 4: her response is the approval signature for the bulk run. Record it with date.
