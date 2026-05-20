# PROPOSAL — Persona-row projection, Teknova AAV (NOT yet written to Airtable)

Date: 2026-05-18
From: agentic-systems (Boris)
Source artifact (canonical, READ-ONLY here):
`/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`
(v4, Part 1 contact layer)
Target: Classification Rules table `tbl1HFYzezFYs5C3k`, base `appYBYH3aOHhTODAw`,
rows with `Rule Category` prefixed `persona_`, `Active=1`. Single-play (no Play
column — Boris ruling stands).

Status: WRITTEN 2026-05-18. Scoping calls 1–3 confirmed, blocker A resolved
(Explorium fixed enums supplied), blocker B confirmed. 19 rows created in
`tbl1HFYzezFYs5C3k` (`typecast:true`, new `Rule Category` singleSelect options
auto-created). v5 change-log entry appended to the canonical artifact. One item
deliberately NOT decided — see "Open: patient-facing disqualifier" below.

### Written row IDs (Classification Rules, base appYBYH3aOHhTODAw)

- persona_seniority: `reczbl1b2rBPTAvBo` director, `rec5vCTINNRMPuMx5`
  senior manager, `recMNLbrMc4F4iAas` vice president
- persona_department: `recbbAXWxSUTkLFDH` r&d, `recRT0sAFoAaR09bX`
  manufacturing
- persona_department_exclude: `reccGWca9sO0f9hm0` sales, `recvT42wldXzlvenp`
  marketing, `rec14tj4dDGGJYGDT` legal, `rec3gTCu5LtzyrH1Q` it,
  `reckjytwpTLNQgUjd` finance, `recFLmK1XTkERQCnT` human resources
- persona_title_include: `recad2Bnekzh5hiVI` viral vector, `rec9k3xgzg9YbqKSE`
  downstream processing, `recb2frRchGf38UqS` purification, `receo2RQ8gZKy1vcA`
  process development, `reco0zuBai27Aytrh` CMC, `rec53qxVtz6yR3bkg` process
  science
- persona_residual: `recF7Pxrr7nDzIQ2e`
- persona_min_score: `rec8mec3mSZQCZsdp` (= 60, calibration dial, labeled)

### Resolved values (as written)

- persona_seniority enum = `director`, `senior manager`, `vice president`
  (wide floor; VP retained at query layer — invariant 3).
- persona_department enum = `r&d`, `manufacturing`.
- persona_department_exclude (NEGATE) = `sales`, `marketing`, `legal`, `it`,
  `finance`, `human resources`. **Consumer gap:** `Build Sourcing Plan` does
  not yet apply this as a negative `job_department` filter — workflow code
  change required, flagged to the workflows session. Rows inert until wired.
- persona_title_include (job_title free-text) = the six precision anchors.
- persona_residual = single LLM-scored string carrying function-over-title,
  CSO-at-<200 include, VP+ exclude at >500 non-CDMO, ag/vet-background
  penalty, and Regulatory/PM/QC title exclusion.
- persona_min_score = 60, labeled CALIBRATION DIAL / zero artifact authority.

### Open: patient-facing disqualifier (NOT projected — needs your ruling)

v4 Part 1 line 144–148 disqualifies patient-facing clinical roles ("if it
says patients anywhere... they're not actually working on making the sauce").
The resolved contract routed excluded functions to `persona_department_exclude`
and Regulatory/PM/QC to residual, but is **silent on patient-facing**. I did
NOT add it — adding beyond the confirmed contract would be re-deriving, which
the contract forbids. But leaving it unprojected means the workflow will not
drop patient-facing contacts at all, against an explicit v4 hard disqualifier
that has already cost Ellie time. Flagging for your explicit ruling: fold a
patient-facing clause into `persona_residual` (`recF7Pxrr7nDzIQ2e`), or accept
the gap for first run. Not deciding this silently either way.

## What becomes a persona row (contact layer only)

### persona_seniority  (HARD filter, query-time)
Artifact source: Part 1 line 51–55 base range "Director, Senior Director, Head
of, VP, SVP".
Proposed values (PENDING blocker A — map each to Explorium `job_level`):
- Director            → `<EXPLORIUM_ENUM: director?>`
- Senior Director     → `<EXPLORIUM_ENUM: director? senior_director?>`
- Head of             → `<EXPLORIUM_ENUM: ?>`
- VP / SVP            → `<EXPLORIUM_ENUM: vp? vice_president?>`
NOTE: the VP-cap-at-large-biopharma exclusion and the CSO-at-<200 inclusion are
NOT here — they are conditional on company attributes (scoping call 3) → residual.

### persona_department  (HARD filter, query-time)
Artifact source: Part 1 line 45–49 "process development, manufacturing, or CMC".
Proposed values (PENDING blocker A — map to Explorium `job_department`):
- Process Development → `<EXPLORIUM_ENUM>`
- Manufacturing      → `<EXPLORIUM_ENUM>`
- CMC / Process Science → `<EXPLORIUM_ENUM>`

### persona_title_include  (HARD filter, query-time)
Artifact source: Part 1 line 48 verbatim title anchors. One row per value:
`process development`, `viral vector`, `downstream processing`, `purification`,
`vector manufacturing`, `gene therapy manufacturing`, `CMC`, `process science`

### persona_title_exclude  (HARD filter / post-fetch drop)
Artifact source: Part 1 line 150–154 (excluded function) + 144–148 (patient-
facing). One row per value:
`legal`, `sales`, `talent acquisition`, `recruiting`, `marketing`, `IT`,
`finance`, `regulatory`, `program management`, `QC`, `quality control`,
`patient`, `clinical coordinator`, `nurse`

### persona_residual  (LLM-scored, natural language)
The judgment calls Explorium enums cannot express. Proposed single residual
string (LLM scores fit 0–100):
> "Primary responsibility is owning, leading, or directly executing process
> development, manufacturing, or CMC for the company's AAV gene therapy program
> — function ownership matters more than exact title string. A CSO at a company
> under ~200 employees qualifies (at that size the CSO is the CMC function). At
> companies over ~500 employees that are not pure CDMOs, EXCLUDE VP-level and
> above (avoid burning BD-owned senior relationships). Penalize contacts whose
> career history is primarily agronomy, agricultural science, plant biology, or
> veterinary work without a documented pivot into human cell/gene therapy."
Artifact sources: line 48–49 (function-over-title), 51–55 (VP cap / CSO
shortcut), 156–160 (out-of-scope background).

### persona_min_score  (single row, integer)
Not artifact-derived (no upstream contact threshold exists). Proposed: `60`
(handoff default). First-run calibration dial, tune against the Phase D test.

## What deliberately does NOT become a persona row

| Artifact element | Why excluded | Who owns it |
|---|---|---|
| Company modality = AAV (L1 21–25) | Company gate, not contact | L2 detection node → `Outreach Eligible` |
| Company stage preclinical–PhaseII (27–31) | Company gate | L2 / company gate |
| Company size <2000 / CDMO waiver (33–37) | Company gate | L2 / company gate |
| Geography US/Canada (39–43) | Company gate (company HQ) | L2 / company gate |
| Contact-company alignment (57–61) | Already structural | workflow dual-source employer-verify node |
| All soft signals (67–114) | Not contact hard filter; scoring/personalization, several are company-level | scoring layer / not this projection |
| All disqualifiers except function/patient (120–166) | BD/cadence/email-status/company-status are relational or company state, not contact persona | BD suppression, cadence state, email status, L2 |

Projecting any of the above into persona rows double-implements a gate that
already lives upstream and desyncs the moment that upstream rule moves (e.g.
R5). That is the failure this proposal is structured to prevent.

## Closure (historical)

Unblock conditions, all met 2026-05-18: (1) scoping calls 1–3 confirmed;
(2) blocker A resolved — Explorium `job_level` / `job_department` supplied as
fixed enums from the fetch-prospects tool schema; (3) `persona_min_score = 60`
confirmed as a labeled calibration seed. Rows written, v5 logged. Remaining
follow-ups are the `persona_department_exclude` consumer gap (workflows session)
and the patient-facing ruling (Nick) — both tracked above.
