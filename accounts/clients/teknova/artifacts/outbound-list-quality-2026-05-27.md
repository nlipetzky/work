# Outbound List Quality — How to Read What You're Getting

**Drafted:** 2026-05-27
**Purpose:** Frame what to expect from outbound lead-generation lists, how to evaluate them at the right altitude, and what the current system was designed to do.

---

## What an outbound list is, and what it isn't

An outbound list is a **population to engage**, not a pre-qualified buyer set. Each contact on the list is a candidate for a sequence (typically three touches across email and LinkedIn). The act of engagement is what separates the in-market subset from the rest. You cannot determine who's interested by inspecting the list before sending. You determine it by sending and watching what comes back.

A useful outbound list has four properties:

1. Targets the right companies (matches the ICP at the company level)
2. Targets the right people inside those companies (matches the operator persona)
3. Has fresh data (current employer, current role, valid email)
4. Has enough volume to run a real campaign

If all four hold, the list ships. Individual contact variability inside a shipped list is expected. Even strong lists have a tail of contacts who turn out to be off, recently moved, marginally fit, or simply uninterested. That distribution is normal. The campaign is what surfaces the qualified subset.

---

## The two altitudes of list feedback

There are two ways to evaluate a list. They produce very different outcomes.

**Cohort-level feedback — useful.** Patterns visible across the list that suggest the underlying criteria need tuning. Examples:

- "Most of these are scientific advisors, not process operators. The title filter needs tightening."
- "This segment is heavy on CDMOs. CDMOs need different copy than therapeutic developers, so they should run as a separate sequence."
- "Half these companies are series-A. We should push to series-B and later for the right operator concentration."
- "This entire modality cohort is thin. We should test a different modality before scrubbing this one further."
- "The Pfizer publication signal surfaces clinical and analytical scientists, not process-dev or CMC people, because process IP doesn't publish. We should source contacts via persona-led search, not via publication co-authorship."

Cohort-level feedback can be acted on. It tunes the next sourcing run and improves the whole pipeline.

**Per-contact feedback — low value.** Individual contacts evaluated as if each were a named-account opportunity:

- "Contact #47 might have left this company."
- "Contact #23 looks like the wrong title."
- "Not sure if Contact #12 is senior enough."

Per-contact feedback at scale doesn't improve the campaign. It delays it. Job-change detection, employer-mismatch detection, and seniority verification are exactly what the automated verification layers handle (LinkedIn live verification, the SF Contact Summary verdict, opt-out propagation). If a contact's data is off, the verification layer flags it and the system either auto-corrects or marks it for exclusion. Manual contact-by-contact review duplicates that work and slows down the campaign without improving the outcome.

---

## When a modality cohort runs thin

If a modality is producing a small or borderline cohort, the answer is rarely to scrub the list harder. The answer is usually one of:

- **Pivot to a different modality** with broader population characteristics
- **Run multiple modalities in parallel** and double down on whichever produces engagement
- **Test a different operator persona** within the same modality (CMC vs process development vs manufacturing vs supply chain)

Modalities differ structurally in what the public record holds. AAV gene therapy is a small global population with sparse operator-level signal, heavy private-company concentration, and lots of program churn the public record doesn't reflect. Cell therapy is larger and better-documented. mRNA and LNP delivery is larger still. Production tools have broader operator pools than end-applications. Treating a single modality's volume as a referendum on the system misreads the diagnostic. The signal is "this modality is what it is," not "the system isn't working."

The portfolio play is to source across multiple modalities, sequence across all of them, and let the response data tell you where to invest the next quarter.

---

## What the system was originally designed for

This is important context for how to interpret what you have.

The system was built for **high-volume outbound** in the RevOps Legion mold — the unit of work is a large enriched cohort fed into a sequenced campaign, and the qualifying signal is response rate. The whole architecture (signal capture, ICP filter, enrichment, LinkedIn verification, Salesforce sync, opt-out hygiene) is calibrated for volume with acceptable false-positive tolerance. The expected workflow is: source broadly, filter via criteria, send, measure response, refine.

It is not built for **account-based marketing**, where the unit of work is a named target list of 20-100 accounts with per-account research, sales-marketing coordination, and multi-channel personalized touches across each. ABM evaluates lists differently because the operating model is different: each contact is hand-curated and worth deep scrutiny, because each represents a meaningful percentage of the campaign.

These are different motions. Both are legitimate. They require different operating assumptions and different evaluation criteria.

Over the past few weeks I have built additional layers on top of the original architecture to compensate where ABM-leaning evaluation patterns have collided with the volume-outbound design: live LinkedIn verification per contact, SF Contact Summary verdicts before send, opt-out propagation safety rails, domain resolver for subsidiaries and acquisitions. These additions narrow the false-positive surface considerably. They do not change the underlying fact that the system optimizes for cohort production, not for hand-curated named-account lists.

If the goal going forward is true ABM, that's a different program with a different operating model. The current system can serve as a feeder into ABM (sourcing the universe of named-account candidates), but it isn't the ABM program itself.

---

## A practical scorecard for evaluating a list

Three numbers, all evaluated at the cohort level:

| Dimension | Question | Acceptable threshold |
|---|---|---|
| **Targeting accuracy** | Sample 10 contacts. Do they match the ICP at company AND person level? | 8 of 10 pass |
| **Freshness** | What % of contacts have a current Match status from live verification? | 75%+ |
| **Volume** | Is the cohort large enough to run a 3-touch sequence with meaningful reply-rate signal? | 30-50 contacts per modality minimum |

If all three pass, the list ships. If targeting is low, tune the criteria upstream. If freshness is low, audit the verification layer. If volume is low, expand the modality or run additional segments in parallel.

This is the altitude at which list quality should be debated, decided, and signed off on. Per-contact scrutiny below this layer tends to slow the campaign without improving outcomes.

---

## Summary

| Concept | What it means |
|---|---|
| What an outbound list is | A population to engage, not a buyer set |
| How to evaluate it | Cohort-level: targeting, freshness, volume |
| How not to evaluate it | Per-contact scrutiny in the ABM style |
| When volume runs thin | Pivot or run a parallel modality, not scrub harder |
| Why this matters here | The current system optimizes for cohort production, not curated named accounts |
