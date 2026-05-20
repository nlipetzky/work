# Criterion Types

The six types every segment criterion is classified into. Used by `segment-criteria` and any downstream skill that reads its output.

---

## Firmographic

Company-level attributes: industry, headcount, revenue, geography, funding stage, ownership structure, business model.

**Examples:**
- B2B SaaS, headquartered in North America
- 200 to 2,000 employees
- Series B or later, last raise within 24 months

**Common pitfall:** treating revenue and headcount as interchangeable proxies for size. They diverge at high-margin SaaS and low-margin services firms. Pick the one that actually predicts fit and say why.

---

## Technographic

Tools, platforms, and tech stack. Often enrichment-dependent.

**Examples:**
- Uses Salesforce or HubSpot as primary CRM
- Runs Snowflake as primary data warehouse
- Has implemented a customer data platform in the last 18 months

**Common pitfall:** treating "uses tool X" as evidence of fit when "uses tool X actively" is what matters. A company with a dormant Salesforce instance is not the same as a company running its revenue motion through Salesforce. Spell out the activity signal where possible.

---

## Demographic

Person-level attributes: title, seniority, function, tenure, location, career history.

**Examples:**
- Director, head, or VP of demand generation
- Tenure under 12 months in current role
- Held a comparable role at a former customer of ours

**Common pitfall:** strict title pattern matching. Real titles are messy. Write observable signals that handle function, not just title text (e.g., "owns demand generation outcomes, evidenced by stated responsibilities").

---

## Behavioral / intent

Time-bounded actions or events. The time window is part of the criterion, not optional.

**Examples:**
- Posted a job for an SDR or BDR role in the last 90 days
- Published a thought-leadership piece on ABM in the last 6 months
- Announced a leadership change in the last 60 days

**Common pitfall:** unbounded behavioral signals ("has hired SDRs"). Without a time window, the signal becomes meaningless or evergreen-true. Always bound.

---

## Relational

Who they know, work with, or are connected to: customers, competitors, advisors, investors, alumni networks.

**Examples:**
- First-degree connection to a current customer
- Former employee of a known reference account
- Investor overlap with a portfolio company we have already sold

**Common pitfall:** treating relational signals as hard filters. They almost always belong as soft signals. The exception is displacement campaigns ("must be a current competitor customer"); even then, defend the choice.

---

## Disqualifier

Explicit exclusions: current customers, competitors, banned industries, accounts owned by another rep, recent acquisitions.

**Examples:**
- Currently a customer of [client]
- In an active sales cycle with [client] within the last 60 days
- Acquired or merged within the last 90 days

**Common pitfall:** duplicating hard filters in the disqualifier list. If a hard filter already excludes a record, listing the same exclusion as a disqualifier adds noise. Disqualifiers should remove things hard filters miss.
