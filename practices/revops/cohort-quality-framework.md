# Cohort Quality
## A framework for evaluating outbound lists

**Nick Lipetzky · Konstellation AI**

*Formerly the Contact Quality framework. Renamed to Cohort Quality on 2026-05-13 when the framework was extended to score companies and contacts at separate scopes.*

---

## What this document is

Outbound list quality is often described as a single number ("X% solid"). In practice, list quality is a composite measured across four dimensions at two scopes. Every cohort is built of accounts and the people inside them. Both scopes must be measured against the framework for the cohort to be defensible.

This document defines those dimensions, how they are measured at each scope, and how records sort into tiers. It is the standard the work runs against.

## Scope: company-level and contact-level

Every record in a cohort carries two scopes:

- **Company scope.** The account itself: is it real, in segment, reachable without conflict, and is there a reason to engage now.
- **Contact scope.** The person at the account: is the record accurate, is it the right person on this channel, can we reach them without conflict, and is there a reason to engage them specifically.

The same four dimensions apply at both scopes. Most disagreements with the framework — from clients, from SMEs, from sales — happen at the company scope. The contact scope tends to be where data services compete; the company scope is where defensibility lives.

A record carries a company tier (A/B/C or excluded) and a contact tier (A/B/C or excluded). The cohort tier is the lower of the two. Exclusion at either scope excludes the record from the cohort outright.

## The framework is multichannel

A contact can be Tier A reachable on email and Tier C reachable on LinkedIn, or the reverse. Company-level checks are channel-agnostic. Contact-level hygiene (email deliverable, LinkedIn URL valid, phone verified) and one contact-level suppression check (active outbound cadence) are channel-specific.

Where a play targets a primary channel, the contact tier is the score on that channel. Where a play is multichannel, the contact carries a tier per channel.

## The four dimensions

### Data hygiene

Whether the record is accurate at the moment of measurement. Tests record accuracy, not fit.

**Company-level checks.**

- **Domain canonical.** The domain on the record is the company's own canonical site (not a parent-company tools-vendor domain, not a parked domain, not a registrar holding page). Resolves and returns content.
- **Company name matches the canonical site.** The name on the record matches what the company calls itself on its website today.
- **HQ location accurate.** Country, region, and city match the company's stated headquarters.
- **Headcount fresh.** The headcount band on the record was refreshed within the dimension's freshness window.
- **Identity confirmed.** This entity is the operating entity, not a parent shell, not an inactive subsidiary, not a rebranded successor. Distinct from "domain canonical" — a domain can resolve to a parent-company page; the entity behind it is a different question.
- **Operational status active.** Not acquired-and-rebranded, not defunct, not stealth-without-substance.

**Contact-level checks.**

- **Email deliverable.** Validated by a verification service. Channel-specific to email.
- **Identity confirmed.** The email belongs to the named person at the named company. Catch-all domains, role accounts (info@, sales@), and shared inboxes are not identity-confirmed even when they verify as deliverable. Distinct from deliverable.
- **Employment current.** The contact is still at the named company. Two modes:
  - *Passive freshness:* the data provider refreshed the employment field within the last 60 days.
  - *Active freshness:* we re-verified employment within the last 30 days at cohort-assembly time (LinkedIn scrape plus cross-source check).
  - Tier A requires active. Tier B may pass on passive.
- **Title field accurate.** The title on the record matches what the contact's current public profile says today.
- **LinkedIn URL valid.** Channel-specific to LinkedIn.
- **Phone verified.** Channel-specific to phone.

Hygiene checks at both scopes carry a measured_at timestamp. Stale records re-verify before activating.

### ICP fit

Whether the record is the right kind of account and the right person inside it. Tests fit, not accuracy.

**Company-level checks.**

- **Industry / vertical match.** The company's industry classification fits the segment's industry scope.
- **Modality / technology match.** The company's modality or technology stack matches the segment's required modality. This is the gate output where modality precision matters; for non-modality plays, replace with the equivalent technology or capability requirement.
- **Stage match.** Clinical phase, funding stage, or commercial maturity fits the segment's stage band.
- **Headcount band match.** Headcount fits the segment's company-size band.
- **Geography match.** HQ geography fits the segment's geographic scope.

**Contact-level checks.**

- **Function match.** The contact's function fits the segment's buyer definition. Function is what the person owns and decides on, not what their title text says.
- **Seniority match.** The contact's seniority fits the segment's buyer band.
- **Tenure sufficient.** At least 9 months in the buyer function at the current company. In-company promotions count toward tenure (a director promoted from manager three months ago keeps the function tenure they had as manager). Out-of-company moves do not. Recently moved or "open to work" status disqualifies.
- **Company segment fit inherited.** The contact's company must itself be in segment. Inherited from the company-level fit checks; cannot be independently true.

Fit is binary per check.

### Suppression state

Whether the record is reachable without conflict. Both scopes have absolute and conditional checks.

**Company-level suppression (absolute).** Any failure excludes the record from the cohort outright.

- **No current customer relationship.** The account is not a current customer of the client.
- **No active inbound conversation.** No reply-in-progress to marketing email, no demo scheduled, no active inbound MQL at the account.
- **Account not in active churn or red CS status.** If CS is actively saving the account, outbound to other contacts there will undermine the save.
- **Account not in M&A transition with outbound restrictions.** Acquired or divesting companies often carry legal restrictions on outbound; respect them.
- **No account-level DNC.** Some accounts have requested suppression at the company level, not contact level.
- **Outbound not otherwise restricted.** Client-imposed carve-outs, legal hold, or other top-down rules.
- **Not a stale identity.** The entity is not defunct, rebranded into a different successor, or otherwise no longer trading under this identity.

**Company-level suppression (conditional).** Record stays in the cohort only if the condition clears.

- **Active SF opportunity at the account.** Suppress unless the AE has cleared the contact for outreach or the play is explicitly multi-threading. Default to suppress; require explicit clearance to override.

**Contact-level suppression (absolute).** Any failure excludes the contact from the cohort outright (but the company may remain qualified for other contacts).

- **No DNC, hard-bounce, or opt-out flag.** Includes jurisdiction-specific consent: GDPR opt-out for EU contacts, CASL non-consent for Canadian contacts, any documented "do not contact" request.
- **No active outbound cadence on this channel.** Per channel, per contact.

**Contact-level suppression (conditional).**

- **Recent BD activity.** Behavior depends on the prior outcome:
  - *No-reply within last 90 days:* suppress.
  - *Polite no with stated follow-up window:* suppress until the stated window opens.
  - *Interest expressed, no follow-up taken:* not suppressed. Flag as a re-engagement candidate.

Suppression flags at both scopes must be no more than 7 days old at the moment of activation. Re-check before sending.

### Signal and intent

Whether there is a reason to reach out now. Signals carry recency windows; a signal outside its window is not a signal.

**Company-level events.**

- *Funding event:* within the last 90 days.
- *IND filing, trial registration, regulatory event:* within the last 180 days.
- *Office opening or geographic expansion:* within the last 120 days.
- *Major partnership or M&A close:* within the last 90 days.
- *Product launch:* within the last 90 days.
- *Leadership hire in a relevant function:* within the last 90 days.
- *Conference presence:* attending within the next 90 days (forward-looking).

**Prospect-level events.**

- *Role change or company change:* within the last 120 days.
- *Promotion at current company:* within the last 90 days.
- *Content publication or LinkedIn post on a relevant topic:* within the last 30 days.
- *Web visit, content engagement, or ad click:* within the last 30 days.

Optional attribute for Tier A records:

- **Source confirmation count.** How many independent sources confirm the record. At the company level: how many sources confirm the modality and segment fit. At the contact level: how many sources confirm email, employment, and title. Multi-source confirmation lifts confidence but is not required to qualify.

## Operational test for structural signal unavailability

The test runs at the company level. A signal is structurally unavailable for a company only if ALL of the following are true:

- Headcount under 50.
- Not publicly traded.
- No clinical trials registered in the segment's regions (where applicable to the segment).
- No funding events in the last 12 months.
- Fewer than 3 press mentions in the last 12 months.
- No conference presence on the segment's named conferences in the last 12 months.

If all six return null, signal-unavailable is granted for that company and contacts there can sort into Tier A on fit alone. If any returns data, signal is not unavailable; the operator just didn't find one, and contacts there cannot use the unavailability allowance.

The test is falsifiable. Running it has to be able to return "no, signal is available."

## How records sort into tiers

Each record carries a company tier, a contact tier (per channel where the play is multichannel), and a cohort tier that is the lower of the two.

### Company tier

- **Company Tier A.** All six company-level hygiene checks pass. All five company-level fit checks pass. All seven company-level suppression checks pass. Company-level signal present within its window, OR signal structurally unavailable per the operational test.
- **Company Tier B.** Five of six hygiene checks pass; the failing check is HQ location or headcount freshness, not domain canonical and not operational status. All fit checks pass. All suppression checks pass. Signal partial (a company-level signal exists but is at the older edge of its window).
- **Company Tier C.** Domain canonical, operational status active, and identity confirmed all pass on hygiene (the others may be partial). Industry, modality, and segment fit checks pass; stage or geography may be partial. All suppression checks pass. Signal absent and not structurally unavailable.

A record failing any absolute company-level suppression check is excluded outright. It does not enter a company tier.

### Contact tier

- **Contact Tier A.** All applicable contact-level hygiene checks pass with active freshness mode. All four contact-level fit checks pass. All contact-level suppression checks pass. A prospect-level signal is present within its window OR the company-level signal carries (a strong recent funding round, for example, justifies outreach to contacts at the account even without a per-contact signal).
- **Contact Tier B.** Three of four core hygiene checks pass (deliverability and employment-current must be among the passing checks; identity confirmation or title accuracy may be the failure). All fit checks pass. All suppression checks pass. Signal is partial.
- **Contact Tier C.** Deliverability and employment-current pass. Function and segment fit pass; seniority or tenure may be partial. All suppression checks pass. Signal absent and not structurally unavailable on the account.

A record failing any absolute contact-level suppression check is excluded outright (but the company may remain qualified for other contacts at the same account).

### Cohort tier

The cohort tier is the lower of the company tier and the contact tier.

- A Tier A contact at a Tier C company is Tier C in the cohort. The contact data is excellent, but the account is borderline; the cohort inherits the weaker side.
- A Tier C contact at a Tier A company is Tier C in the cohort. The account is qualified, but this is not yet the right person on this channel; flag for ABM expansion to find better contacts at the same account.
- Exclusion at either scope excludes the record outright. A Tier A company with no qualified contacts is an ABM expansion target, not a cohort entry.

## Freshness expectations per dimension

| Dimension | Scope | Max staleness before re-check |
|---|---|---|
| Hygiene checks, passive mode | both | 60 days |
| Hygiene checks, active mode | both | 30 days |
| Suppression flags | both | 7 days |
| Company-level signal data | company | per signal-type window above |
| Prospect-level signal data | contact | per signal-type window above |

Any record older than its dimension's max staleness re-checks before activation.

## Optional: graduated email states

For plays operating under tight credit budgets, two email confidence states can be tracked separately at the contact level:

- **email_known_to_exist.** A provider returned a hashed email or domain-match for this person but the address has not been verified or identity-confirmed. Cheap.
- **email_verified_belongs.** Verified by an email-verifier service AND identity-confirmed (not a catch-all, not a role account). More expensive.

Contact Tier A requires email_verified_belongs. Tier B may activate on email_known_to_exist for high-priority records. Tier C may not.

## What this means in practice

Every record in a delivered list has been scored against this framework at both scopes. The cohort is built by passing records through the dimensions in sequence at the company scope first, then at the contact scope. A record that fails a required dimension at either scope is tiered lower or excluded.

A list described as "X% solid at the list level" is not a meaningful measurement on its own. The question is which records pass which dimensions, at which scope, where they sort, and on which channels.

When a client pushes back on the cohort, the framework lets the operator and the client argue at the right scope. "This company is wrong" is a company-tier dispute and points at company-level dimensions. "This person is wrong" is a contact-tier dispute and points at contact-level dimensions. Most pushback is at the company scope; the framework makes that legible.

## What can be controlled, and what cannot

What the system controls is the rigor of the work: enrichment running cleanly, suppression checks running absolutely, classification rules documented and versioned, every record carrying its evidence trail and its timestamps at both scopes.

What the system does not control is what the data ecosystem yields. Some segments produce hundreds of viable Tier A accounts; others produce twenty. The framework determines what gets activated. The universe determines how many records there are to activate.

This is why Tier A cohort size is an estimate, not a target. The framework is the standard the work runs against. The cohort is the result of running the framework against what is actually out there.
