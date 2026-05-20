# Explorium-Direct ticket — Contact Sourcing: write event rows to Contact Events

**Write-owned by:** Explorium-Direct builder
**Workflow target:** `bYZ0sAzyUvU60wMZ` (RevOps — Contact Sourcing + ICP Gate) — shared owner with the `capture-all-explorium-fields` ticket; coordinate via folder neighbor
**Working scope:** this folder (`practices/revops/workflows/explorium-direct/contact-sourcing-event-writes/`)

**Date:** 2026-05-20
**Issued by:** Boris (orchestrator) → Explorium-Direct (builder)
**Status:** SPEC. Companion to the existing capture-all-fields ticket.
**Plan reference:** `/Users/nplmini/.claude/plans/we-are-aligned-write-generic-platypus.md`
**Composes with:** `practices/revops/workflows/explorium-direct/PROMPT-capture-all-explorium-fields-2026-05-20.md`
**Engine principles:** `practices/revops/PRINCIPLES-revops-engine-2026-05-20.md`

## Directive

The existing capture-all-fields ticket adds per-field `explorium_*` columns to Contacts for every Explorium prospect field across `explorium.fetched`, `explorium.profile`, and `explorium.contacts`. **Extend the same workflow** to also write one event row per discrete contact-level observation — role change, promotion, employer change, publication mention, LinkedIn post — to the new Contact Events table with full source content.

## Scope

- **Workflow ID:** `bYZ0sAzyUvU60wMZ` (RevOps — Contact Sourcing + ICP Gate). Same workflow as the capture-all-fields ticket.
- **Provider values** (per source within the workflow): `explorium`, `apollo`, `linkedin_apify`, `hunter`.
- **Target table:** Contact Events (`tblDYItHaNcT2gnwi`).

## Event types to write

| Source observation | Our Event Type |
|---|---|
| Role change detected (new title at same company) | `role_change` |
| Promotion (rank-up at same company) | `promotion` |
| Employer change (new company) | `employer_change` |
| Publication credit (PubMed match from LinkedIn experience or Explorium publications) | `publication` |
| LinkedIn post (most recent activity if accessible) | `linkedin_post` |
| Conference appearance / speaker (cross-write with company-side capture) | `conference_speaker` |
| Web engagement with a tracked URL (placeholder for future) | `web_engagement` |
| Email status change (verified → bounced, etc.) | `email_status_change` |

## Per-event row mapping

| Event field | Source |
|---|---|
| Event Type | per the table above |
| Event Date | role start date / publication date / post date / etc. |
| Provider | source-specific (`explorium`, `apollo`, `linkedin_apify`, `hunter`) |
| Contact | linked Contacts row |
| Title | role title / publication title / post headline |
| Names | for publications: co-authors; for posts: tagged people |
| Categories / Tags | source tags (job seniority, MeSH terms, post topics) |
| Magnitude | tenure months / citation count / followers, as applicable |
| Magnitude Unit | `months`, `citations`, `followers` |
| Detail | short narrative |
| Source URL | LinkedIn URL of post, PubMed URL of publication, etc. |
| External ID | LinkedIn post ID / PMID / Apollo employment ID |
| Raw Reference | `<provider>:<external_id>` |
| Signal State (raw) | source-specific status string |
| Vitality | `active` for current role; `ended` for past role |
| Confidence | `high` for direct LinkedIn / Explorium / Apollo; `medium` for inferred |
| Detected At | run timestamp |
| Is Latest | true on most recent observation per External ID |
| Raw Payload | full source object for the event, capped at 95K |

## Specific event sources within the workflow

1. **Explorium prospect employment history** (`explorium.profile.experience[]`): write one `role_change` or `employer_change` event per past role with start/end dates.
2. **Apollo employment history**: same — write event rows for each historical employment record.
3. **LinkedIn (Apify) currentPosition + experience**: same; also write `linkedin_post` event(s) for the most recent post if accessible.
4. **Hunter email status changes**: if Hunter re-verifies and status changes since last observation, write `email_status_change` event.
5. **Cross-reference with PubMed capture workflow**: do not duplicate — that workflow owns `publication` events for contacts. This workflow writes employment-history events.

## What to do

1. Confirm the capture-all-fields ticket has shipped on `bYZ0sAzyUvU60wMZ`. Verify the `explorium_*` columns exist on Contacts.
2. Add a node (or extend the existing mapping nodes) that produces an array of event-row payloads per prospect, from each provider's response.
3. Write event rows to Contact Events with typecast=true.
4. Implement Is Latest latch per External ID.
5. Deploy via credential-preserving REST PUT. Verify credentials intact (this workflow has Explorium + Apollo + LinkedIn Apify + Hunter + Anthropic + Airtable creds — all must be checked).

## Hard rules

- **Do not bulk-trigger paid runs.** Smoke against saved historical execution data or one company with explicit Nick authorization.
- **REST PUT wipes credentials.** This workflow has 6+ credentialed nodes; full read-back is mandatory.
- **Don't compete with PubMed workflow.** This workflow's `publication` events are inferred from LinkedIn/Apollo; PubMed workflow's are authoritative. Use Supersedes to chain when both exist for the same contact + PMID.
- **Author disambiguation on publications inferred from LinkedIn** is unreliable. Flag with `Confidence = medium` and let the dedicated PubMed workflow supersede.

## Verification gate

Smoke on one company's contacts (use a saved execution from a recent contact sourcing run):
- One `role_change` or `employer_change` event row per historical employment in Explorium / Apollo data.
- Tenure months populated in Magnitude.
- LinkedIn URL in Source URL where available.
- Workflow credentials intact post-deploy on every node.

## Handoff

`practices/revops/workflows/explorium-direct/HANDOFF-contact-sourcing-event-writes-2026-05-20.md`. Include the smoke execution ID and a sample of event rows written.

## Out of scope

- PubMed publication events (separate ticket: `PROMPT-pubmed-capture-2026-05-20.md`).
- Conference speaker events as a primary write (PROMPT-conference-attendee-capture owns those; this workflow only cross-writes when the Explorium / LinkedIn payload already names a conference).
- Removing Contacts columns that now have event-row equivalents. Phase-2.
