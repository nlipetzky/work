# Teknova Build Roadmap

**Purpose:** The living backlog of every infrastructure build for the Teknova engagement — integrations, source workflows, process automations, and schema/data-model changes. Companion to the SOP's §10 Integrations register and §11 Build roadmap summary.

**Last updated:** 2026-05-12
**Owner:** Nick

This is an internal doc, not client-facing. It tracks how the data plumbing and automation that powers plays gets built and in what order.

---

## How this doc works

Every build item has:

- **Name** — short identifier
- **Category** — Integration / Source workflow / Process automation / Schema change
- **Description** — what gets built
- **Why now** — what attribute or step is gated by it
- **Effort** — rough estimate (XS/S/M/L/XL or hour bands)
- **Dependencies** — what else has to land first
- **Status** — `planned` / `in-build` / `in-test` / `live` / `deprecated`
- **Priority** — `P0` (blocking outreach launch) / `P1` (high-impact, next up) / `P2` (improves quality) / `P3` (nice to have)
- **Owner** — Nick by default; otherwise named
- **Target / Notes** — when, current status notes

Items move through the status lifecycle. When `live`, the build is reflected in the SOP (added to §10 register or referenced in §8 steps) and the item gets a "shipped" date here.

---

## Currently live

| Name | Category | Description | Status | Shipped |
|---|---|---|---|---|
| clinicaltrials.gov L1 capture (workflow `9gcmEjq1lvOY2jZS`) | Source workflow | Scheduled weekly pull of AAV trials, sponsor extraction, upsert to Companies | live | 2026-05-12 |
| L2 classify (workflow `rXKuqfDwqX7TYzxK`) | Process automation | Reads Classification Rules, applies disease-AAV + canonical indication checks, writes verification status back | live | 2026-05-12 |
| Classification Rules table | Schema | Airtable table holding all rule values (vocabulary lists, evidence patterns, modality buckets) consumed by L2 at runtime | live | 2026-05-12 |
| Sources table | Schema | Airtable table cataloging active capture sources, trust ranks, refresh cadences, auto-add thresholds | live | 2026-05-12 |
| Deliverable schema fields on Companies | Schema | CT.gov NCT IDs, CT.gov Indications, Vector Evidence Clause, Verification Status, Rejection Reason, Classification Version, Classification Run Date | live | 2026-05-12 |

---

## In flight or next up (P0–P1)

| Name | Category | Description | Why now | Effort | Dependencies | Status | Priority |
|---|---|---|---|---|---|---|---|
| **Salesforce read sync (account level)** | Integration | Read account match status, stage, customer flag, last-contact date, open opportunities, marketing engagement into Companies | Gates §4.5 E1-E4 (enrichment coverage), §4.5 E3 (BD activity check), the entire Known/Unknown protocol | M | Teknova SF admin access, field mapping spec | planned | P0 |
| **Salesforce read sync (contact level)** | Integration | Read contact match status, owner, email engagement history, cadence enrollment into Contacts | Gates §4.6 K5–K7 (contact disqualifier flags) and all of component F | M | Above + contact-level permissions | planned | P0 |
| **Auto-package client deliverable** | Process automation | After L2 or list update, generate CSV, upload to client's Google Drive, set sharing, return link, log Deliverables row | Removes the manual CSV → Sheet → share step every time a list goes out | S | Drive API access to client folder | planned | P1 |
| **Weekly status email assembly** | Process automation | Query state machine for the five status sections (shipped, in-Ellie's-queue, blocked, coming, decisions needed), render into template, deliver to Nick for review/send | Cuts the Wednesday assembly to a 10-min review-and-send | S | Deliverables table (below) | planned | P1 |
| **Deliverables tracking table** | Schema | Airtable table tracking every artifact's state through DRAFTED → CLOSED, deadlines, who's holding it | The state machine in §7 has nowhere to live operationally; this is it | XS | None | planned | P1 |
| **Decisions ledger table** | Schema | Airtable table tracking every decision request to Jenn or Ellie, deadline, status, outcome | Closes the audit-trail gap; powers §11 process metrics for decision-cycle health | XS | None | planned | P1 |

---

## Medium-term (P2)

| Name | Category | Description | Why | Effort | Dependencies | Status | Priority |
|---|---|---|---|---|---|---|---|
| USPTO PatentsView L1 capture | Source workflow | Patent-classification-code-based discovery, surfaces companies investing in platform before they file trials | Expands D1 (active sources) and D3 (cross-source confidence) | M | None | planned | P2 |
| ARM Atlas / ASGCT directory L1 | Source workflow | Industry directory scraping; pre-classified by modality at source | Expands D1 / D3 | M | None | planned | P2 |
| PubMed L1 capture | Source workflow | Scientific literature surfacing academic and preclinical companies | Expands D1 / D3 | M | None | planned | P2 |
| L3 filter workflow | Process automation | Applies segment hard filters + weighted soft signals to enriched accounts, produces Outreach Eligible flag | Required for M2 maturity and §4.4 (filter accuracy) attributes | L | Account-level enrichment live; segment criteria approved by client | planned | P2 |
| Firmographics enrichment (Explorium-based) | Integration | Account-level enrichment from Explorium — HQ, size, funding stage, revenue range, NAICS, industry classification. Provider already in toolkit; this build wires it into the per-account enrichment workflow that fires after Ellie verifies AAV. | Gates §4.5 E1 (firmographics coverage). Explorium is the strategic firmographics provider going forward; Clay is being deprecated. | M | None (provider already keyed) | planned | P1 |
| Contact sourcing + email verification | Integration | Contact-level enrichment producing component F | Required for M4 maturity | M | Provider selection | planned | P2 |
| Salesforce write sync | Integration | Write new leads, cadence enrollment, activity logging back to SF | Required for M5 activation; closes the loop on outbound activity | M | SF read sync live; field mapping spec | planned | P2 |
| Ellie return-doc parser | Process automation | Auto-detect Ellie's replies/Drive edits, extract markup, present diffs to Nick for routing | Cuts the return-doc cycle by ~30 min per return | M | Deliverables table live | planned | P2 |
| Nudge automation | Process automation | Auto-draft polite follow-up emails when deliverables time out; Nick approves+sends from a whitelist | Removes calendar-watching overhead from §8.9 | S | Deliverables table live | planned | P2 |

---

## Longer-term (P3)

| Name | Category | Description | Why | Status |
|---|---|---|---|---|
| Multi-source dedup + provenance orchestrator | Process automation | Once 3+ sources are live, schedules and sequences them, dedupes accounts, records provenance per source | Required to surface §4.2 D3 (cross-source confidence) | planned |
| Signal-triggered cadence | Integration + automation | When funding event / hire / IND filing detected, surface for Ellie's signal-anchored outreach | Powers signal-anchored outreach at scale | planned |
| Post-activation metrics dashboard | Integration + schema | Pull reply/meeting/opp conversion from cadence platform back into Airtable for §4.8 attributes | Required at M6 maturity | planned |
| Cadence platform integration (read + write) | Integration | Outbound cadence platform (Apollo / Outreach / Salesloft / etc.) | Required at M5 maturity | planned (depends on Teknova platform choice) |

---

## Recently completed (rolling window)

(Will populate as items ship.)

---

## Notes on prioritization

- P0 items (Salesforce read sync) are gating outreach activation. Until they're live, the play stays at M1 (universe defined) and can't reach M4 (contactable) or M5 (activated).
- P1 items are the highest-ROI internal automations that compound across every weekly cycle.
- P2 items expand sourcing breadth and enable L3 / enrichment / activation.
- P3 items are scale-and-polish — needed at maturity but not blocking first outreach.

The order P0 → P1 → P2 → P3 is the build sequence. Within a priority band, the items can run in parallel where dependencies allow.

---

## How this doc gets updated

- When a new build is proposed (in conversation, in the Friday review, surfaced by a quality gap in §5), it gets a row here with `planned` status.
- When work starts, status moves to `in-build` with target date.
- When testing begins, `in-test`.
- When live, `live` with shipped date, and the item is added to the SOP's §10 Integrations register (if an integration) or referenced in §8 process steps (if it changed how a step works).
- Deprecated builds get `deprecated` and a note explaining what replaced them.
- The "Currently live" table at the top is the running summary of what's operational.

Updates happen during the Friday process review (§8.10) and anytime a build status changes.
