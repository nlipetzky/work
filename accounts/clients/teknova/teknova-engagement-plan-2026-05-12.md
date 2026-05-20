# Teknova AAV Program — Direction and Working Model

**For:** Jenn, Ellie, Mika
**From:** Nick
**Updated:** 2026-05-12

This is the source of truth for where the AAV program is going and how the work gets done. It's intended to be the durable answer to "what's happening" and "what's next," so we don't have to keep recovering it in real time.

---

## Where the program is

The AAV outreach play is the active program. The previous approach to sourcing produced inaccurate output because it pulled from general firmographic databases that can't reliably distinguish AAV gene therapy companies from adjacent vectors, modalities, or autoimmune disease trials sharing the AAV acronym. The current build is a rebuild, not a tweak — source-first instead of filter-first, with the classification logic visible and editable rather than buried in code.

**Current state, end of week of 2026-05-12:**

- L1 capture (clinicaltrials.gov): live. Pulls every AAV-related interventional study, extracts industry sponsors. 263 trials → 103 unique companies in the most recent run.
- L2 classify: live. Applies the classification rules to each captured company. 32 surfaced as confirmed AAV by canonical indication match, 65 borderline pending judgment, 6 rejected automatically as ANCA-Vasculitis false positives.
- The first canonical list and the classification rules are in Ellie's hands today for approve-or-adjust review.

---

## What's being built next

In rough order of priority, dependent on Ellie's verification cycle clearing each layer:

### Near-term (next 2-4 weeks)
- **Additional capture sources alongside clinicaltrials.gov.** Each surfaces AAV companies from a different angle:
  - USPTO patent filings (AAV-specific patent classification codes) — captures companies investing in the platform but not yet running registered trials
  - Industry directories (ARM Atlas, ASGCT exhibitor and member lists) — pre-classified by modality at the directory level
  - Existing Teknova Salesforce accounts already tagged AAV — closes the loop on companies you already work with
- **Enrichment for verified-AAV companies.** Firmographics, recent funding, leadership hires, IND filings, conference presence. Only applied to companies Ellie has confirmed as AAV — we don't spend enrichment effort on uncertain rows.

### Medium-term (next 4-8 weeks)
- **L3 filter.** Applies the segment criteria (US/Canada HQ, headcount under 2,000, contact function and seniority for outreach, BD activity checks) to the enriched-and-verified universe. Output: outreach-eligible list.
- **PubMed scientific literature** as a fourth capture source, particularly for academic spinouts and preclinical companies that haven't filed trials yet.
- **Contact sourcing** for verified companies — PD, manufacturing, CMC leaders at each.

### Longer-term (next 2-3 months)
- The same three-layer pattern (capture → classify → filter) extended to other Teknova plays beyond AAV.
- Signal-triggered outreach: funding events, leadership hires, IND filings as triggers for cadence entry.
- Multi-source confidence ranking so each company in the universe has provenance from multiple independent sources.

---

## How the work moves

There are three different kinds of decisions in this program, and each runs on its own track. The point of separating them is to make sure each decision goes to the right person without forcing everyone into one meeting.

### Decision 1: Program direction (Jenn)
What gets built, in what order, what gets prioritized or paused. The roadmap above is the current answer. I propose changes via email or this doc; you approve or adjust. Ad-hoc as needed; weekly updates baked into the Wednesday status email.

### Decision 2: What counts as the right data (Ellie)
Classification rules, segment criteria, vocabulary lists. These ship as standalone "approve or adjust" documents — Ellie reviews on her own timeline and marks them up. Once she approves a set, the rules govern the next run. The AAV classification rules doc going out today is the first one in this shape.

### Decision 3: Whether a specific list is ready to use (Ellie)
Each output list goes to Ellie with the data she needs to verify it. Per-row AAV / not AAV / not sure. She returns it on her own timeline. Confirmed rows move forward into enrichment and outreach.

Three decisions, three async loops. No live meetings required for any of them.

### How weekly priority gets set

Sitting on top of these three decisions is the question of *what gets worked on this week* — which of many possible items from the build roadmap, the active play, or new directions should be the operator's focus. That direction lives in the **priority surface**: a one-page doc, shared with you in your Drive folder, with a single ACTIVE item, a QUEUED NEXT item I pre-populate as the default, an AVAILABLE menu of focus areas, and an OFF-MENU section for anything outside the menu.

Every Wednesday status email opens with the current surface state and invites you to confirm the queued item or pick a different one from AVAILABLE. You direct by editing the surface or replying in writing — verbal asks in passing don't move items, because direction needs to be captured in writing for the operator to act on it consistently. Off-menu requests trigger a written scope conversation, not silent work. The surface is the proof of what you're getting this week and what's queued next.

---

## The weekly Wednesday email

Every Wednesday EOD, you get an email from me with:

- **Shipped this week** — what went out, with links to anything you'd want to see
- **In Ellie's queue** — what's pending her review, with the doc/list link
- **Blocked** — anything stuck and the specific reason
- **Coming next week** — what I'm building and when you'll see it
- **Decisions I need** — anything I need from Jenn or Ellie, with a clear deadline if there is one

The point of this email is that it carries the full picture of the program's current state every week, without you having to ask. By Thursday morning, you've already seen everything I would have brought to a meeting.

---

## The Thursday slot

The standing Thursday meeting remains on the calendar. Whether to use it is your call:

- If the Wednesday email surfaces something you'd rather discuss live, that's what the slot is for.
- If everything in the email is clear and there's nothing live to work through, no need to meet.
- I'll be available at the standard time either way; you don't have to commit in advance.

When a meeting is genuinely the right call:
- A strategic pivot affecting multiple plays
- Scoping a new offer or new play together
- Something that requires several people in the same room to resolve

Otherwise, email.

---

## How to reach me between updates

If something needs an answer before the Wednesday email, send a note. I'll reply same-day or surface it in the next status email if it's not blocking. Same on my side — if I need a decision from you, you'll get an email with the question, the context, and a deadline if there is one. Nothing waits on a meeting to come up.

---

## What this document is for

This doc is the durable description of the program. It changes when the program changes, not weekly. The Wednesday email is the weekly snapshot of where things are within this frame. If something in here is wrong or missing, mark it up or send a note and I'll update it.
