# Inventory — state of work for Ellie review (2026-05-21)

## What Ellie actually needs

A CSV of the ~91 Active AAV companies, with the fields she can verify/correct (verdict, segment, evidence). That's the deliverable. Everything else is upstream plumbing or future scope.

## Critical-path item: AAV Mover workflow

- **n8n workflow:** `hjXfpABgHM0zjnda` ("Airtable → Airtable mover for AAV Companies")
- **Target:** Teknova Outreach Companies (`appFoLY6hjroyA2KW` / `tblmd04rMsw3GE3pK`)
- **Goal:** populate a view `Ellie Review — AAV Wave 1` → download CSV → send to Ellie

### State
- 16 destination fields created in Teknova Outreach Companies ✓
- 8 nodes wired (Trigger → Search Companies → Search Events → Map → Upsert Companies → Build Signals → Upsert Signals → Clear Run Selected) ✓
- **NOT yet executed end-to-end.**
- **Broken:** `Search AAV Events Per Company` node. `filterByFormula` template-literal returns zero events. Two alternative expressions proposed in the handoff, neither tested. A simpler global-query fallback was also proposed and not tested.

### Decisions Nick already locked
- Most Advanced Phase mapping (Preclinical → Phase III collapsed to Ellie's vocabulary)
- Signals filter: only events with `Activity Status="active"` get written
- Companies upsert match key: `Website Domain`
- Signal Type / Source mappings; unmapped → drop
- Singleselect option mapping done in Code node, not at Airtable

## Upstream — already done, no action needed today

| Workflow | n8n ID | State |
|---|---|---|
| L1 CT.gov capture | `9gcmEjq1lvOY2jZS` | Active, writing Company Events with Intervention Detail |
| PubMed capture (AAV-filtered) | `poYzPN589ZK4zfO5` | Active, writing Company + Contact Events |
| AAV scanner | (separate) | Classified ~2000+ events; rollups populated on Companies |
| Companies Enrichment (Explorium) | `Z6RROKx5omdfvhtn` | 92 Active AAV rows; 78 enriched with ~227 explorium_* fields each |

### Carry-over loose ends (not blocking Ellie)
- GeneCradle Inc stuck in Enrichment Status = `running` (crash residue). One-row Airtable flip when convenient.
- 78-row contact enrichment paused pending Nick's eyes-on review.
- Explorium full column-extension pass owed once a broader exec sample exists.

## Where scope creep already happened (your meta-point)

The mover handoff from 2026-05-20 specs four things at once:
1. Sync 16 fields from RevOps Surface → Teknova Outreach Companies.
2. Compute a `Best Evidence` citation string per company by picking the "winning event."
3. Compute `Sample Intervention Name` and `AAV Event Sources` multi-select.
4. Also write a separate `Signals` table.

The broken node is the one doing #2 (per-company events query). The fact that we built the multi-table, multi-computed-field version before validating the simplest "move the 16 columns" version is exactly the pattern you're calling out.

A minimal mover would be: `Search Active AAV Companies → Map fields → Upsert to destination`. Three nodes. No event picking. No Best Evidence string. No Signals table. Ellie gets a CSV with the verdict/segment/status fields and can review.

The Best Evidence column is genuinely useful to her, but it can be computed in a separate pass once the base sync works.

## Files referenced
- `accounts/clients/teknova/HANDOFF-airtable-mover-aav-companies-state-2026-05-21.md` (latest)
- `accounts/clients/teknova/HANDOFF-airtable-mover-aav-companies-2026-05-20.md` (original scope)
- `practices/agentic-systems/HANDOFF-companies-enrichment-domain-resolver-2026-05-20.md`
- `practices/agentic-systems/HANDOFF-revops-engine-quality-pass-2026-05-20.md`
- `practices/revops/workflows/HANDOFF-pubmed-capture-2026-05-21.md`
- `practices/revops/workflows/L1-event-evidence/HANDOFF-revops-to-agentic-systems-2026-05-21.md`
- `practices/revops/workflows/explorium-direct/HANDOFF-capture-all-explorium-fields-2026-05-20.md`
