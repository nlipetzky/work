# Teknova Priority Surface

**Engagement:** Teknova RevOps
**Source of truth:** This document (and its mirror in the Teknova shared Drive folder)
**Cadence:** Weekly. Mirrored into the Wednesday status email; edits happen here in the Drive doc.
**Pattern reference:** `/Users/nplmini/code/work/practices/agentic-systems/reference/priority-surface-pattern.md`
**Last updated:** 2026-05-12

---

## How this surface works

This is the one-page surface that controls what gets worked on each week for Teknova. The rules:

- **Exactly one item is ACTIVE at a time.** That's what's being worked on this week.
- **Direction lives in writing.** Verbal asks don't move items — either edit this doc, or reply to the Wednesday status email confirming a redirect.
- **QUEUED NEXT** is pre-populated by Nick each week as the default for the following week. Confirm it or pick something else from AVAILABLE.
- **OFF-MENU** is for anything outside the AVAILABLE menu. Off-menu requests trigger a written scope conversation that ends in: accepted into menu, bounced as out of scope, or queued for future scope expansion.

---

## ACTIVE THIS WEEK

**Item:** Ellie's verification pass on the first canonical AAV list + approval of classification rules

**Set by:** Nick, 2026-05-12 (sent to Ellie for review)

**What this means in concrete output:** 97 surfaced + borderline rows in the AAV discovery Google Sheet for Ellie to mark AAV / not AAV / not sure per row; classification rules Google Doc for her to approve or adjust.

---

## QUEUED NEXT

**Item:** Wire Explorium firmographics enrichment into the per-account enrichment workflow

**Set by:** Nick, 2026-05-12 (default — confirm or redirect)

**What this means in concrete output:** Once Ellie confirms surfaced AAV companies, each gets HQ location, size, funding stage, revenue range, NAICS, industry classification automatically populated. Required to reach M2 maturity per the engagement plan. Explorium is the strategic firmographics provider (replacing Clay) and is already keyed; this is wiring it into the workflow that fires after Ellie's verification.

**To redirect:** pick any item from AVAILABLE below, or raise something OFF-MENU.

---

## AVAILABLE

The menu of focus areas. Pick one for QUEUED NEXT, or confirm the current default. The specific play, project, or build inside each item lives in the engagement plan and build roadmap.

### Production

- **Run / iterate on the active AAV play** (the default ACTIVE state when nothing else is selected)
- **Process Ellie's returned classifications** and re-run with updated rules

### Strategic

- **Build a new play** (new segment / new offer beyond AAV)
- **Expand classification rules** to cover new modalities or vocabulary variants surfaced by Ellie's review

### Foundational

- **Wire Explorium firmographics** into the per-account enrichment workflow *(currently QUEUED NEXT)*
- **Build the Salesforce read sync** (Known/Unknown protocol, BD activity, open pipeline, marketing engagement)
- **Onboard a new data source** (USPTO patents, ARM Atlas / ASGCT, PubMed)
- **Build the L3 filter workflow** (hard filters + soft signal scoring → outreach-eligible list)
- **Resolve data quality issues** (e.g., the 10-record gap between L1 reported and Companies with NCT IDs)

### Analytics

- **Build an output-quality dashboard** showing the SOP §4 attributes per run
- **Build a process metrics view** per SOP §12 (cycle time, queue depth, decision response time)

---

## OFF-MENU

Items the client has raised that aren't in AVAILABLE. Each gets a written scope conversation that ends in: accepted into menu, bounced as out of scope, or queued for future scope expansion.

*(Empty as of 2026-05-12.)*

---

## Change log

| Date | ACTIVE set to | QUEUED NEXT set to | OFF-MENU added | Set by |
|---|---|---|---|---|
| 2026-05-12 | Ellie's verification pass on first AAV list + rules approval | Wire Explorium firmographics into enrichment workflow | — | Nick |
