# Example: Segment Criteria Output

A worked example for a fictional play. Pattern-match against this when writing real artifacts.

The example below is a complete `segment-<play-slug>.md` artifact... what the skill produces and saves to the client's artifacts folder.

---

# Segment Criteria: new-leader-abm-launch

**Client:** Pinpoint Software
**Play:** new-leader-abm-launch
**Date:** 2026-05-06
**Offer (one sentence):** ABM-in-a-box program for newly-hired demand gen leaders at mid-market B2B SaaS companies, helping them stand up a target-account motion within their first 90 days.

---

## Hard filters

### Industry: B2B SaaS
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** company self-describes as a software-as-a-service business in marketing materials, charges via subscription billing, and sells primarily to other businesses (not consumers).
- **Description:** the offer presupposes a B2B SaaS go-to-market motion. Pure-services firms, e-commerce, and consumer software do not fit the playbook.

### Company size: mid-market
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** headcount between 200 and 2,000 full-time employees as reported in the company's most recent public profile or last filing.
- **Description:** below 200 there is rarely a dedicated demand gen function; above 2,000 the buyer is typically a CMO running multiple demand programs and the offer's onboarding-window framing does not resonate.

### Geography: North America
- **Type:** firmographic
- **Match:** hard filter
- **Observable signal:** company headquarters in the United States or Canada.
- **Description:** the offer's pricing, time zone overlap for the 90-day program, and reference customers are all NA-anchored. EMEA and APAC are out of scope for this play.

### Function: owns demand generation
- **Type:** demographic
- **Match:** hard filter
- **Observable signal:** current role's primary responsibility is owning demand generation outcomes, evidenced by either: (a) title containing "demand," "pipeline," or "growth" at director level or above; or (b) stated responsibilities in the profile that include owning demand gen, pipeline generation, or marketing-sourced revenue.
- **Description:** the offer is sold to the operator who owns demand gen, not the CMO above them and not an SDR below them. Titles vary across companies; the function is the filter, with title-pattern matching as a secondary verifier.

---

## Soft signals

### Recent role start
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** high
- **Observable signal:** prospect's tenure in current role is six months or less, based on profile-stated start date or most recent role change.
- **Description:** the offer's "first 90 days" framing lands hardest with leaders still in their onboarding window. Tenure of 0 to 6 months is the hottest band; 6 to 12 months is workable.

### Company hiring outbound roles
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** company posted at least one open role for SDR, BDR, or AE in the last 90 days.
- **Description:** companies actively scaling outbound are more likely to be receptive to ABM tooling and methodology that supports the new headcount.

### Modern marketing stack present
- **Type:** technographic
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** company website and job postings indicate use of Salesforce or HubSpot as CRM, plus a marketing automation platform.
- **Description:** the offer integrates cleanly with these stacks. Companies on a fragmented or no-MAP setup require a pre-sale stack conversation that lengthens the cycle.

### Published thought leadership on pipeline or ABM
- **Type:** behavioral
- **Match:** soft signal
- **Weight:** medium
- **Observable signal:** prospect has published a post, podcast appearance, or article on ABM, pipeline strategy, or target-account motion in the last six months.
- **Description:** publicly committed thinking is a strong proxy for budget intent and reduces the cold-pitch problem.

### Mutual connection to a current customer or advisor
- **Type:** relational
- **Match:** soft signal
- **Weight:** low
- **Observable signal:** prospect shares a first-degree connection with a named Pinpoint customer, advisor, or investor, verifiable via mutual professional connection.
- **Description:** relational warmth is a tiebreaker, not a primary driver. Useful for prioritizing the top of the list once other signals have ranked it.

---

## Disqualifiers

### Current Pinpoint customer
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** company appears on the Pinpoint customer roster as of the play launch date.
- **Description:** existing customers should not receive net-new acquisition outreach. Expansion motion runs separately.

### Active sales cycle with Pinpoint
- **Type:** relational
- **Match:** disqualifier
- **Observable signal:** prospect or any contact at the prospect's company is in an open opportunity in Pinpoint's pipeline within the last 60 days.
- **Description:** parallel outreach during an active cycle creates owner conflict and confuses the prospect. Hold these accounts.

### Recent acquisition or merger
- **Type:** firmographic
- **Match:** disqualifier
- **Observable signal:** company announced an acquisition, merger, or change of control in the last 90 days.
- **Description:** post-deal, demand gen leaders are absorbed in integration work and the offer's 90-day framing is unwinnable. Revisit in the next play.

---

## Confidence and gaps

- **Assumptions made:** "recently-hired" is operationalized as tenure of six months or less. The play brief did not specify a window; six months reflects the typical onboarding-to-first-results horizon for a new marketing leader. If post-play analysis shows the 6-12 month band converts equally, weight should shift.
- **Decisions against the brief:** brief specified "newly-hired demand gen leaders" without defining "newly-hired"; operationalized as ≤6 months tenure. Brief also specified "B2B SaaS" without distinguishing pure-SaaS from SaaS-plus-services; restricted to companies whose primary revenue model is subscription, excluding hybrid services-heavy SaaS where the offer's playbook applies less cleanly.
- **Open questions:** should CMOs at companies without a dedicated demand gen function be included? Currently excluded by the function filter, but at companies of 200-400 employees the CMO often is the demand gen function. Confirm with sales before launch.
- **Signals not yet observable:** explicit first-party commitment to an ABM strategy (e.g., a quoted statement in the leader's hiring announcement or first quarterly update). We currently infer ABM intent from indirect signals; a direct signal would meaningfully sharpen the soft-signal layer.
