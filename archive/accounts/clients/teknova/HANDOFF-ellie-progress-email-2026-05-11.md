# Handoff: draft progress email to Ellie

**Date:** 2026-05-11
**Open this in:** a fresh Claude Code session from `~/code/work/accounts/clients/teknova/`
**Mission:** draft an email from Nick to Ellie that shows concrete progress, links the artifacts she can review async, and starts moving the relationship from meeting-heavy to artifact-driven.

## What's been built (last 24-48 hours)

Three operating docs in this folder's `artifacts/`:

- [revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md](artifacts/revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md) — the live taxonomy and gate rules that classify companies as AAV-pass, re-route, or archive. Plain English. Each rule has a "how to change this" path.
- [revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md](artifacts/revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md) — what queries and sources we use to find candidate companies, what we dropped, why.
- [revops-gate-results-aav-gene-therapy-ellie-outreach.md](artifacts/revops-gate-results-aav-gene-therapy-ellie-outreach.md) — pointer doc explaining how to read the live results in Airtable.

An n8n workflow (`Z6RROKx5omdfvhtn`) is deployed that runs companies through a qualify gate before deep enrichment. First gate-stage (industry/NAICS) is live. Second stage (AAV-modality verification via Exa) is the next build.

Results land in Airtable: base `appYBYH3aOHhTODAw` ("RevOps Surface"), table `Enrichment Runs`. Each run is a row with counts and a full markdown report. Per-company classifications live on the Companies table with `Modality`, `Modality Source`, `Modality Confidence`, `Detected Keywords` fields, linked back to the run by `Classification Run ID`.

## Where Ellie fits in this system

Ellie is the domain authority on taxonomy and edge cases. The system runs with our best-effort rules today, produces results, and her feedback reshapes the rules for the next run. She does NOT approve rules before they run. She reacts to data.

## The relationship state Nick is dealing with

Teknova has been meeting-heavy. Multiple meetings booked. Nick has been ignoring emails because he's been heads-down building the actual system. He has not yet replied to several meeting requests. Nick will paste the recent emails into the session that picks this up — read those before drafting.

The email's job is to flip the dynamic. Right now Ellie is asking for meetings to get progress updates. After this email, the artifacts are the progress, and meetings become for decisions only.

## Goals of the email

1. **Show concrete progress.** Specific artifacts, specific Airtable table, specific workflow ID. Not "we've been working hard," but "here's the deployed system, here's where you read the output, here's how your feedback flows back in."
2. **Reframe the cadence.** Async review of artifacts becomes the default. Meetings are for decisions that can't be made on a doc.
3. **Make her first move easy.** Point her at one specific thing to look at and react to (the most recent run in Enrichment Runs once it's populated, or the taxonomy doc if no run has happened yet).
4. **Don't apologize for the email silence.** Nick has been building. The deliverable is the apology. Acknowledge the meetings exist, propose which to keep vs which to handle async.

## What to include in the email

- One-sentence framing of what's been built
- Link to the three docs (or a high-level explanation if Ellie won't follow links)
- Pointer to the Airtable Enrichment Runs table for results review
- A specific ask: which meeting on the calendar is the one we keep this week, the rest move to async
- Sign-off that respects her time

## What NOT to do

- Don't dump technical stack details (n8n, Explorium, NAICS, Exa). Ellie cares about classifications and outcomes, not workflow nodes.
- Don't ask for taxonomy approval upfront. The rules are running. She influences via reaction.
- Don't propose more meetings to "walk her through" the docs. The docs walk themselves through.
- Don't write a status update. Write a peer email. Nick to Ellie.
- No em dashes. Use ellipses if needed. (Nick's house style.)

## Tone

Direct. Peer to peer. Short paragraphs. Nick has been silent for a few days; the email should land like he's been heads-down on substance, not like he's apologizing for ghosting.

## What Nick brings into the next session

The recent Teknova emails from the last few days. Read them before drafting so the email responds to specifics (which meeting is most important, which thread Ellie is most active on, any unanswered questions from her that the docs answer).

## Artifact paths for quick copy-paste into the email

- Taxonomy doc: `accounts/clients/teknova/artifacts/revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md`
- Sourcing rules: `accounts/clients/teknova/artifacts/revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md`
- Results pointer: `accounts/clients/teknova/artifacts/revops-gate-results-aav-gene-therapy-ellie-outreach.md`
- Airtable base: RevOps Surface (`appYBYH3aOHhTODAw`)
- Airtable table: Enrichment Runs (`tblEVSEqetmu4ScHe`)
- n8n workflow: `Z6RROKx5omdfvhtn`

If Ellie isn't already in the RevOps Surface Airtable base, confirm her access before sending the email. Linking her to a base she can't open is the worst possible first impression.

## When this handoff is complete

The picking-up session produces a drafted email in this folder (`accounts/clients/teknova/drafts/email-to-ellie-2026-05-11.md` or similar), Nick reviews, edits, sends. The handoff itself can be deleted or archived once the email is out.
