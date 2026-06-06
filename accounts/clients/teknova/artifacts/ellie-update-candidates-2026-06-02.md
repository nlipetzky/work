# Update Candidates for Ellie -- 2026-06-02

**Routing note:** per client CLAUDE.md, all Ellie-facing communication goes through Hermes (expert-liaison practice). This file is the raw input. Take it to /Users/nplmini/code/work/practices/expert-liaison/CLAUDE.md for the actual draft.

---

## What's new since the ngAbs playbook handoff (2026-05-29)

1. **Pilot Airtable upsert validated.** Piramal Pharma Solutions test record sync proved end-to-end. Architecture for the ~400-row batch is in place.

2. **Wet-lab verification column built.** Addresses the playbook's G3 gate (NA wet-lab / PD / GMP site presence) with AI research + cited evidence URLs, not just trusting HQ address. Validated on 4 companies so far -- Piramal, FUJIFILM Biotechnologies, AGC Biologics, Curia. All returned correct verdicts with real, citable sources.

3. **Discrimination check passed.** Curia returned 11 sites with all four activity tags used (R&D wet-lab, process development, GMP manufacturing, sales/admin). FUJIFILM correctly tagged its Cambridge MA office as admin-only vs. its Holly Springs / Morrisville / Thousand Oaks / College Station GMP sites. The classifier isn't lazy.

4. **Architecture for per-site / per-job / per-press evidence fan-out is locked.** Each company's evidence (sites, hiring, press, trials, conferences) will land as discrete child rows in Airtable, not buried in JSON. Build brief is in n8n-practice.

---

## Judgment calls that need Ellie's input (the actual value of the email)

These are domain-expert questions, not engineering questions. Surface them to her with one short sentence each.

1. **Seagen post-acquisition.** Standalone Seagen web presence is decaying since Pfizer absorbed them. Web research returned "unclear" -- not because Seagen isn't real, but because their own pages no longer have address detail. Question for her: do we keep Seagen as a standalone target, or shift the right Seagen contacts under Pfizer Oncology? Same question will apply to other acquired companies in the remaining 405 rows.

2. **Antibody fragments only.** Hovione qualifies as ngAbs=yes but only on antibody fragments (no bispecific, no ADC, no multispecific). Playbook puts fragments under "adjacent / lower priority." Does she want fragment-only developers in the Sprint 1 send list, or hold them for a later wave focused on bispecifics + ADCs + multispecifics?

3. **Insilico Medicine flagged "unclear."** Classifier hedged on a pure AI / computational shop the playbook explicitly excludes. Question for her: tighten the prompt to force a "no" verdict on AI-only shops, or let the wet-lab gate (which would correctly drop them) handle it?

4. **Approval to bulk-run on 405 unclassified rows.** Two more manual validation rows planned (Hovione, Summit Therapeutics) before bulk run. After that, 5/5 validation pass = proceed with full batch. Asking her to confirm: any companies in the source list she'd want eyeballed before they go through?

---

## What NOT to send

- Internals of the n8n / Airtable architecture (operator concern, not expert concern)
- The five hash columns, the Code node FIELD_MAP, the queue-mode requirement
- Per-job-type dedupe key strategy
- The prompt iteration on the wet-lab classifier

She cares about: did we pick right, did we pick fairly, what are we sending under her name. Keep the email to that.

---

## Suggested shape (for Hermes to refine)

- One paragraph: where we are (10 confirmed-qualified, validation in progress, wet-lab evidence layer added)
- Four bullets: the four judgment calls above
- One closing line: "Anything you'd want to see before we run on the rest?"

No attachments. The detail lives in the operator system; she gets the headline + the asks.
