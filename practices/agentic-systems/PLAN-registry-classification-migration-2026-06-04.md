# Registry Migration to the Five-Layer Catalog Model (2026-06-04, realigned)

Migrate the System Registry to the locked Konstellation Catalog five layers
(`accounts/ventures/konstellation-ai/reference/catalog.md`): **Asset → System → Cluster →
Constellation → Trajectory**. Rubric: `reference/system-classification.md`. The base is currently
mid-migration on an earlier WRONG 3-tier model; this plan corrects it. Phased; destructive steps
gated.

**Base:** `apppQjlZiktpbO4aX`
**Tables:** Operating Model `tbljPzQuvxDti10yc` · Systems `tbldwCzbavBcOlP2C` · Assets `tblu5JBzOxbEHLQmP` · Roadmap `tblt6pQ3Snu7qkMGb` · Constellations `tblCCPj7Sm9md86y3` · Clusters (to create)
**Bound manual:** `practices/agentic-systems/system-registry-operating-manual.md` (update same turn as any model change).

## Current base state (WRONG, must be corrected)

```text
Constellations table tblCCPj7Sm9md86y3 holds 4 mis-modeled rows:
  GTM       recHpU4sX8JM4haA9   kind=domain      → should be a CLUSTER
  RevOps    reczJmlhTCFDdsvH7   kind=domain      → should be a CLUSTER
  Teknova   recN5olTlsqgmNQ9y   kind=engagement  → engagement w/ Trajectory, NOT a constellation
  KAI       recW2FBiSO6EJ3dt2   kind=engagement  → engagement w/ Trajectory, NOT a constellation
Systems table:
  Canon            recggwUTDke8Y7UMe  → should be CONSTELLATION #1, not a System
  CRM + Motions    recr3zmwA0E7xozN1  → System; needs a home Constellation (Voice or Garden)
```

Constellations field IDs: slug `flducpXu9ACtV50AJ` · Name `fldVNm9LxUOr20NrW` · Kind `fldqEPnRJH5Xsvr8c` · Purpose `fldpq9eoTsmaqVLpt` · Systems `fldUUPBoaPyC2B9Yf` · Context Path `fld9UNYffXQUXS7dq` · Owner `fldG0a9ZFx3dJ1cPo`.

## Target

The eight fixed Constellations are the only Constellation rows. Clusters are a separate table.
Engagements (Teknova, KAI) are clients/ventures with Trajectories, not Constellations. Every System
has one home Constellation and zero-or-more Cluster memberships.

---

### Phase 1 — Reset the Constellations table to the eight (GATED: deletes mis-modeled rows)

- [ ] On `tblCCPj7Sm9md86y3`: repurpose `Kind` (or drop it) — all rows are now the eight architecture constellations, not engagement/domain.
- [ ] Remove the four wrong rows (`recHpU4sX8JM4haA9` GTM, `reczJmlhTCFDdsvH7` RevOps, `recN5olTlsqgmNQ9y` Teknova, `recW2FBiSO6EJ3dt2` KAI). Their intent migrates to Clusters (Phase 2) and Trajectories (Phase 4). Tombstone, do not silently drop (manual hard rule).
- [ ] Create the eight Constellation rows with slugs: `canon`, `compass`, `signal`, `forge`, `voice`, `pulse`, `guard`, `garden`. Purpose = the one-line first-principles definition from the catalog (e.g. Canon = "knows what the business knows").

### Phase 2 — Add the Clusters table (additive)

- [ ] Create table `Clusters` in the base. Fields: `Name` (primary), `Cluster ID` (slug), `Buyer Label`, `Systems` (link → Systems `tbldwCzbavBcOlP2C`), `Notes`.
- [ ] Create rows from the catalog's named Clusters: `RevOps Cluster`, `Customer Expansion Cluster`. Carry the retired GTM/RevOps constellation purposes here.
- [ ] Add a `Clusters` link field on Systems (inverse auto-creates).

### Phase 3 — Canon: System row → Constellation (judgment-heavy)

- [ ] Canon (`recggwUTDke8Y7UMe`) is Constellation #1, not a System. Decompose its current assets (email ingestion, transcript ingestion, embedding, doc sync, agent-memory) into the Systems that live in the Canon constellation (candidates: `canon-ingestion`, `canon-retrieval`, `agent-memory`). Each gets its own emit contract.
- [ ] Reassign Canon's Asset rows to those Systems; set each System's home Constellation = `canon`.
- [ ] Retire the `Canon` System row as a tombstone pointing at the `canon` Constellation.

### Phase 4 — Engagements & Trajectories (judgment)

- [ ] Teknova and KAI are engagements, not constellations. Decide the mechanism: a lightweight `Trajectories` table (per-engagement sequence of Systems, per the catalog) OR reuse the existing client field on Systems + the `accounts/` folders. Recommend a `Trajectories` table keyed by engagement.
- [ ] Link `teknova-enrichment` (`recucdgQWLHf5bBno`) and the KAI systems (CRM+Motions `recr3zmwA0E7xozN1`, the Canon systems) to their engagement Trajectory.

### Phase 5 — Assign every System a home Constellation (judgment, with Nick)

- [ ] CRM + Motions → home `voice` (speaks/listens for the business) or `garden` (grows existing relationships) — Nick picks.
- [ ] teknova-enrichment, expert-liaison, engagement-governance, operator-os → assign each its home Constellation by where its data/infra/logic integrate (the integration guardrail, not the theme).
- [ ] Fill any missing emit contracts (Inputs/Outputs/Key Metrics) — a System is not registered without one.

### Phase 6 — Decompose the "engine" rows into Systems + Clusters

- [ ] `revops-engine` (`recbpvJNm8hVCYAPu`) and `gtm-engine` (`recJoKHnptxl0oK6Z`) are not Systems; they are buyer labels (Clusters) over several Systems. Create the constituent System rows (enrichment, contact-sourcing, discovery-capture, surface, sync, outreach for RevOps; offer-design, sdr, proposal for GTM), each with an emit contract and a home Constellation. Link them into the `RevOps Cluster` / `Customer Expansion Cluster`. Retire the engine rows as tombstones.

### Phase 7 — Deprecate `System Type` + final sync (GATED, destructive)

- [ ] Once Constellation + Cluster are the live grouping mechanism, retire `System Type` (`fldb2ZHathjyCJzki`) as a tombstone (rename `System Type (retired)`, clear values).
- [ ] Final manual + Operating Model sync; bump `last_synced`.

## Notes
- Phase 2 is additive (safe). Phases 1, 3, 6, 7 remove/retire rows — gated, tombstone don't delete.
- Keep slugs free of variant axes (segment, region, signal source). System slug `crm`, not `canon-crm-feed`.
- The integration guardrail governs home-Constellation assignment: a System's home is where it shares real data/infra/operating logic, not where the name fits.
