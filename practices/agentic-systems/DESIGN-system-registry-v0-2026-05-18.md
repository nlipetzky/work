# System Registry v0 — schema design (2026-05-18)

Base: `apppQjlZiktpbO4aX` (System Registry). Status: **design only, not built.**

## Principles baked in (the three load-bearing things)

1. **Stable system identity.** `System ID` is a human-readable slug (e.g. `teknova-aav-enrichment`), the primary field of Systems, and the join key every other row references. Not an autonumber — slugs survive exports, rebuilds, and cross-references; autonumbers don't.
2. **One roadmap, segmented by view.** A single Roadmap table; every row linked to a System. "Master roadmap" and "Teknova roadmap" are the same table with different filters. No per-system roadmap tables — that's the anti-pattern that doesn't scale.
3. **Registration requires a declared emit contract.** A System row is incomplete until it declares inputs, outputs, key metrics, and where its process-state lives. The dashboard is then a consequence of registration, not future work.

**Cross-cutting (Nick's requirement):** the registry never replaces the markdown/file architecture. It *indexes* it. Every table has a file-path field pointing at the canonical local doc. Files stay the source; the base is the surface over them.

**Reliability note:** v0 ships the schema, not the reconciliation automation. But the fields that make reconciliation possible (`External ID`, `Reconciled Against Reality`, `Last Reconciled`) are in v0 so the binding mechanism can be added later without a migration. A row is only trustworthy once reconciled against reality — same canon principle as "built is not run."

---

## Table 1 — Systems (the spine)

One row per system. Identity, lifecycle, the emit contract, pointers to canonical docs.

| Field | Type | Why it exists |
|---|---|---|
| System ID | Single line (primary) | Stable slug. The join key. |
| Name | Single line | Human label. |
| Status | Single select: proposed / building / operating / paused / retired | Lifecycle of the system as a whole. |
| Purpose | Long text | One or two sentences: what this system is for. |
| Owner | Single line | Who owns it. |
| Client / Context | Single line | e.g. Teknova. Its own table later if needed. |
| Inputs | Long text | Declared. What goes in. Part of the emit contract. |
| Outputs | Long text | Declared. What comes out. |
| Key Metrics | Long text | Declared. What it must emit to be observable. |
| Process State Location | URL / single line | Where "where is it now" lives (today: the Play Steps view; later: the system's Surface). |
| Canonical Docs | Long text | File paths to authoritative markdown (criteria, process docs). One per line. |
| Last Reconciled | Date | When this row was last diffed against reality. |

## Table 2 — Assets (what's built)

One row per built thing inside a system: n8n workflow, Airtable base/table, key script or doc. This absorbs and retires `REGISTRY.md`.

| Field | Type | Why it exists |
|---|---|---|
| Asset Name | Single line (primary) | Human label. |
| System | Link → Systems | The foreign key. |
| Asset Type | Single select: n8n workflow / Airtable base / Airtable table / markdown doc / script / other | What kind of thing. |
| External ID | Single line | n8n workflow id, Airtable base id, etc. Enables reconciliation against reality. |
| Lifecycle State | Single select: built / verified / deployed / running / archived | Canon's build≠verified≠run made structural, not prose. |
| Source / Build File Path | Single line | Local path to the build file or doc. Nick's file-path requirement. |
| Deployed Version | Single line | versionId where relevant. |
| Last Verified | Date | Backs freshness. |
| Write Owner | Single line | Which session/lane may write this asset. The single-writer rule from parallel-build canon, made a field. |
| Reconciled Against Reality | Checkbox | True only when last diff vs the live system passed. Untrusted until checked. |
| Notes | Long text | Tombstone reasons, gotchas. |

## Table 3 — Roadmap (what we'll do to it)

One row per work item. The change backlog. System-scoped; optionally targets an asset.

| Field | Type | Why it exists |
|---|---|---|
| Item | Single line (primary) | Short title. |
| System | Link → Systems | FK. Drives per-system vs master views. |
| Acts On Asset | Link → Assets (optional) | When the item targets a specific asset. |
| Type | Single select: build / iterate / optimize / fix / debt | Nick's words: build, iteration, optimization. |
| Status | Single select: proposed / next / in progress / blocked / done / dropped | Work state. |
| Done When | Long text | The observable condition that proves completion. Not a checkbox — the completion gate. |
| Evidence | Single line | Path / exec id / link proving Done When was met. |
| Order | Number | Priority within a system. |
| Owner | Single line | Who's doing it. |
| Context Path | Single line | File path to the handoff/spec/design doc for this item. |

---

## First registered system (seed, on approval)

- **Systems:** one row — `teknova-aav-enrichment`, status `operating`, emit contract filled from the snapshot, Canonical Docs = the v5 criteria artifact + cohort-production-process.
- **Assets:** seed from `REGISTRY.md` (L2, Verify, archived smoke-variant) **plus the two unregistered ones** (capture `9gcmEjq1lvOY2jZS`, contact sourcing `bYZ0sAzyUvU60wMZ`) + the two bases.
- **Roadmap:** seed from the snapshot's "what's left": currency layer, contact-sourcing fix, first full classify run, registry gaps, fixture reconciliation.

`REGISTRY.md` becomes a tombstone pointing at the base once Assets is seeded.
