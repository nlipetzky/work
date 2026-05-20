# GUIDANCE — Contact Sourcing + ICP Gate (agentic-systems → workflows)

Date: 2026-05-18
From: agentic-systems folder (Boris)
Re: `HANDOFF-contact-sourcing-icp-2026-05-18.md`, 6 open items
Workflow: `bYZ0sAzyUvU60wMZ` — RevOps — Contact Sourcing + ICP Gate

## TL;DR

The 6 open items are not parallel. They are a 4-phase dependency chain, and the
ordering is forced by one constraint the handoff half-states but doesn't act on:
**MCP `update_workflow` wipes every credential on every node.** That single fact
reorders everything below. Do all structural work BEFORE any credential exists,
then attach credentials LAST. The handoff's "delete via UI, never MCP" rule is
correct only *after* credentials are attached — before that, MCP is the right
tool and the node surgery is cheap.

Second load-bearing point: the Explorium enrich node was built blind and is
wrong. Do not rewrite `Normalize Prospects` blind a second time. Probe the real
API with one prospect_id first, confirm the JSON shape, then write Normalize
against observed output. This is the same failure mode that produced the bug.

## Decisions on the 6 items

1. **Explorium enrich split — APPROVED.** Replace the single `Explorium Enrich
   Prospects` node with two parallel bulk-enrich nodes (profiles + contacts),
   batch prospect_ids in groups of 50, merge by `prospect_id`, rewrite
   Normalize. Assigned to the workflows build session. Constraint: probe before
   rewrite (see Phase A).

2. **Apify actor = harvestapi — CONFIRMED.** `harvestapi/linkedin-profile-scraper`,
   "Profile details no email ($4 per 1k)" mode. Q1 rationale is sound: email
   comes from Explorium/Apollo/Hunter, so the no-email tier is sufficient;
   cheaper and better rated. Finalize the `Apply LinkedIn Result` parser against
   harvestapi's dataset item shape — probe one profile first, same discipline as
   item 1.

3. **Classification Rules Play column — DO NOT ADD NOW.** Single-play for the
   first run. Reasons: (a) Classification Rules is a shared table another concern
   already owns (L2 classification); adding a column is a schema change to
   something this workflow only *reads*. (b) No second play needs persona rows
   yet — don't add schema for a hypothetical. Defer with a trigger condition:
   **add a Play column the moment a second play needs persona rows in this
   table.** Until then, persona_* rows are implicitly the active play's.

4. **Persona row authorship — NOT the workflow's job, NOT Boris's.** First (only)
   target: the active Teknova AAV play. Chain: revops practice authors/refreshes
   `revops-segment-<play-slug>.md` via the segment-criteria skill (source-
   agnostic, no column names) → a separate mechanical projection step writes the
   `persona_*` rows into Classification Rules. Keep these two steps distinct;
   the segment artifact is the authorable source, the rows are a derived
   projection. Author of the projection: workflows session or human, after the
   segment artifact exists. Do not let the workflow author ICP.

5. **Credentials — list confirmed, timing is the point.** `Explorium API`
   (header name MUST be `api_key`), `Apollo API`, `Hunter` (native cred),
   `Apify` (native cred), `anthropicApi`, `airtableTokenApi`. These get created
   and attached **last**, in the n8n UI, after all MCP structural edits are
   done. Attaching earlier means every later MCP edit silently wipes them.

6. **No run until 1–5 done — AGREED.** First run manual, 1–2 test companies,
   not scheduled. No autonomous paid runs (credits require explicit same-session
   approval; this handoff does not authorize spend).

## The actual execution order (this is the reframe)

### Phase A — Structural workflow changes, MCP-safe, NO credentials yet

Do all of this while the workflow has zero credentials attached. MCP edits are
safe and fast here. The handoff's "delete via UI only" rule does NOT apply yet —
it only applies once Nick has attached creds.

- A1. Probe Explorium for real response shapes. One `prospect_id`, both
  endpoints: `POST /v1/prospects/profiles/bulk_enrich` and
  `POST /v1/prospects/contacts_information/bulk_enrich`. Header `api_key`.
  Capture exact JSON. Do not skip this — building Normalize blind is what
  caused the original bug.
- A2. Replace `Explorium Enrich Prospects` with two parallel bulk-enrich HTTP
  nodes (profiles + contacts), ids batched ≤50, merged by `prospect_id`.
- A3. Rewrite `Normalize Prospects` against the A1-observed shapes. job_title/
  level/department from the fetch-prospects record; employer/tenure/location
  from profiles enrich (tenure derived from `start_date`, no months field);
  email/phone from contacts enrich (`emails[].type === "professional"`).
- A4. Delete the two duplicate HTTP nodes: `Apify LinkedIn Verify` (HTTP) and
  `Hunter Email Verify` (HTTP). Via MCP is fine right now — no creds to wipe.
  The native `Run an Actor` and `Hunter` nodes are already wired parallel.
- A5. Probe harvestapi for one profile's dataset-item shape. Finalize `Apply
  LinkedIn Result` and `Apply Email Verify` parsers against observed output.
- A6. `validate_workflow`. Then `publish_workflow` (MCP edits create a draft).

### Phase B — Persona data, parallel to Phase A

- B1. Confirm/refresh `revops-segment-<teknova-aav-slug>.md` (segment-criteria
  skill, revops practice).
- B2. Project it into `persona_*` rows in Classification Rules
  (`tbl1HFYzezFYs5C3k`, base `appYBYH3aOHhTODAw`), Active=true, one row per
  value: persona_seniority, persona_department, persona_title_include,
  persona_title_exclude, persona_residual, persona_min_score (default 60).

### Phase C — Credentials, Nick, n8n UI, LAST

Only after Phase A is published and validated. Create + attach all six creds in
the UI. After this point, the handoff's "never MCP edit, UI only" rule is in
force — any further structural change is a UI operation, because MCP will wipe
these. Also set in UI: `Hunter` node Email = `{{ $json.email }}`; `Run an
Actor` actor + input JSON per Q1.

### Phase D — Manual test run

1–2 test companies, manual trigger, inspect every node's output. Not scheduled.
No paid bulk run without explicit same-session approval from Nick.

## Two failure modes, named

- **Credential wipe.** Any MCP `update_workflow` after Phase C silently strips
  all six credentials. If a structural change is unavoidable post-C, it is a
  hand UI edit, not an MCP call. This is why all structure goes in Phase A.
- **Blind Normalize, take two.** The enrich node was wrong because it was built
  against an assumed API shape. A1/A5 (probe real responses first) is the
  non-negotiable fix for the fix. If the build session skips the probe and
  writes Normalize from the handoff's described shape, you will ship the same
  class of bug.
