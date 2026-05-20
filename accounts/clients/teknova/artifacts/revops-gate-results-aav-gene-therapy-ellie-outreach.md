# Gate results: AAV outreach play

**Where the live results live:** Airtable base "RevOps Surface" (`appYBYH3aOHhTODAw`), table **Enrichment Runs** (`tblEVSEqetmu4ScHe`).

**Operating taxonomy:** [modality taxonomy](revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md)
**Operating sourcing rules:** [sourcing rules](revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md)

---

## How a run gets recorded

Every time the qualify gate runs, the workflow writes one row to the Enrichment Runs table:

| Field | Holds |
|---|---|
| Name | Human-readable run label, e.g. "PLAY-006 gate run — 2026-05-11" |
| Run Date | When the run completed |
| Play | `aav-gene-therapy-ellie-outreach` |
| Gate Version | Version stamp from the taxonomy doc's change log |
| Companies Evaluated | Total count fed into the gate |
| Passed (AAV) | Count routed to deep enrichment |
| Re-routed | Count tagged non-AAV biotech with detected modality |
| Archived | Count disqualified (out of industry, subsidiary, wrong geography, etc.) |
| Markdown Report | The full narrative report, rendered as markdown |
| Status | Run lifecycle (planned / running / complete / failed) |
| Notes | Free-form annotations |

The Markdown Report field is the narrative version Ellie reads. It includes the pass / re-route / archive breakdown, edge cases worth her eyes, and a feedback section.

## Per-company classification

The per-company classification doesn't live in the run report. It lives on each company's row in the Companies table (same base). Fields populated by the gate:

- `Modality` — detected primary modality bucket
- `Modality Source` — which signal confirmed it (website / Exa / Salesforce / Explorium)
- `Modality Confidence` — high / medium / low
- `Detected Keywords` — what the gate actually saw
- `Classification Run ID` — pointer back to the Enrichment Runs row that produced this classification
- `Gate Version` — taxonomy version in effect at classification time

You can pivot any way: by run, by company, or by modality. The Classification Run ID links the two.

## How Ellie reviews and gives feedback

1. Open the Enrichment Runs table.
2. Open the most recent row.
3. Read the Markdown Report field. It groups the run into pass / re-route / archive / edge cases.
4. Annotate in the Notes field, or filter the Companies table by Classification Run ID to comment on specific records.
5. Feedback gets translated into edits to the taxonomy or sourcing doc. The change log entry references the run ID that prompted it.

## Why Airtable, not a static markdown file

Ellie already lives in Airtable. The runs are reviewable, filterable, and shareable without leaving the tool. Each run is a row, so history is automatic. The markdown body still exists for the narrative view, but the structured columns let us chart trends (pass rate over time, archive rate by modality, etc.) without re-parsing the markdown.

The disk-based markdown artifacts (the two operating docs) hold the rules. The Airtable table holds what the rules produced.
