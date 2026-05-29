# Inventory — Last Week's Work vs. Live Registry State (2026-05-26)

**Purpose:** Reconcile everything built/touched May 18 to May 22 against the System Registry (base `apppQjlZiktpbO4aX`). Produced as the input to (a) updating Assets/Roadmap rows, (b) defining this week's execution plan.

**Live registry snapshot (this session):**
- Systems: 3 — `revops-engine` (platform, building, emerging), `expert-liaison` (platform, building, emerging), `teknova-enrichment` (client, operating, forming).
- All three systems' `Last Reconciled` = 2026-05-18. **Stale by 8 days.**
- Assets: 26 rows (mix of workflows, bases, tickets-as-docs, principles docs).
- Roadmap: 16 rows.

---

## Section 1 — n8n workflows touched or built last week

For each: status in registry, what to change.

### A. In registry, state still accurate
| Asset row | n8n ID | Registry state | Reality | Action |
|---|---|---|---|---|
| `rechbYFXTwtYmFklt` L1 Capture (clinicaltrials.gov) | `9gcmEjq1lvOY2jZS` | running, reconciled | active, last big run May 20 | Refresh `Last Verified` only |
| `recwoTDBZDajuJVBH` L2 Classify (v4 R5) | `rXKuqfDwqX7TYzxK` | deployed, reconciled | unchanged | None |
| `recucsqVb4uCPGUoL` Step 9 Verify (R5) | `2rTMeD7SB3SBNZZE` | deployed, reconciled | unchanged | None |
| `recoBYDu1hdm2dCbF` AAV Trade Press Signals - Perplexity | `wIyuFELxzXMgHCDV` | built, reconciled | unchanged | None |
| `recjmFH66m9aprqBP` Contact Sourcing + ICP Gate | `bYZ0sAzyUvU60wMZ` | built (no reconciled flag) | **running, output quality wrong** (persona drift) | Update Lifecycle to `running`, add Note "output quality wrong — see HANDOFF-contact-sourcing-icp-gate-2026-05-21.md"; new Roadmap item exists already (`recqrraScO8CwGrZh`) |

### B. In registry as workflow row, missing fields
| Asset row | What's missing | Action |
|---|---|---|
| `recLmCErEM7sLAwDT` LinkedIn Role Status Verify Live | External ID, file path, Reconciled flag, Last Verified | Add `lIhgJKw4ij1d0O4U`, path = `practices/revops/workflows/HANDOFF-linkedin-verification-workflow-2026-05-22.md` until canonical path exists, set `built` (not yet run end-to-end), Write Owner = workflows lane |

### C. Built last week, NOT in registry at all
| Workflow | n8n ID | Why it matters | Action |
|---|---|---|---|
| Airtable AAV Mover (Wave 1 Ellie review) | `hjXfpABgHM0zjnda` | **Critical-path deliverable for Ellie**, 9 nodes, one node ("Search AAV Events Per Company") broken | NEW Asset under `teknova-enrichment`, Lifecycle = `built` (not running), Reconciled = false, External ID = `hjXfpABgHM0zjnda`, file path = `accounts/clients/teknova/HANDOFF-airtable-mover-aav-companies-state-2026-05-21.md`, Write Owner = workflows |
| Companies Enrichment (Explorium → Airtable) | `Z6RROKx5omdfvhtn` | Domain resolver shipped May 20, active. 92 Active AAV rows now flowing through it. | NEW Asset under `teknova-enrichment` (or `revops-engine`? — see open question), Lifecycle = `running`, External ID, file path = `practices/agentic-systems/HANDOFF-companies-enrichment-domain-resolver-2026-05-20.md` |
| AAV Relevance Scan | `bBq5nIO3i5XpQKn9` | Mentioned in handoffs as active. Need to locate file path. | NEW Asset; system TBD — looks like `revops-engine` since it gates intake. Lifecycle = `running`. Reconciled = false until file path resolved. |
| L1 Event Evidence | (ID not captured in handoff — needs pull) | Last full run wrote 93 companies / 199 trials / 199 events. Ticket (`recrYBFGUm8J9vPyx`) exists as "doc/built"; actual workflow is separate. | NEW Asset under `revops-engine`. Or upgrade `recrYBFGUm8J9vPyx` Asset Type from `doc` to `n8n workflow` if Nick prefers one row per capability. |
| PubMed Publication Capture (AAV-filtered) | (need to pull n8n ID) | Deployed, last manual run `82595` succeeded May 20. Not activated. Ticket asset `recYW8nXfi8NBszIZ` is doc only. | Same pattern: NEW Asset (or upgrade ticket) with External ID, Lifecycle = `deployed` (built, run, not on schedule). |
| Get Contacts (Apollo-first sourcing v2) | `0gWOTnVnVs8y1S7L` | Built end-to-end May 21 evening. 10 contacts created for Pfizer. Companion to LinkedIn verify. | NEW Asset under `teknova-enrichment`. Lifecycle = `running` (real execs landed). External ID, file path = `practices/agentic-systems/HANDOFF-linkedin-verification-workflow-2026-05-22.md` (cross-ref). |
| SF Contact Summary ("Get SF contact history") | `TQsQ7iVtgat0LQsB` | Live, processed 395 of 484 contacts. Writes 3 fields back to RevOps Surface Contacts. | NEW Asset under `revops-engine` (uses SF mirror, writes to RevOps Surface) **or** `teknova-enrichment` (consumes Teknova-specific opt-outs). My call: `revops-engine`. Lifecycle = `running`. External ID, file path = `accounts/clients/teknova/artifacts/HANDOFF-sf-contact-summary-workflow-2026-05-22.md`. |

### D. Tickets registered as "built doc" — workflow status unclear
These rows were created May 20 as PROMPT.md spec assets. Whether the actual n8n workflow shipped is not captured in the registry. Need a per-ticket reality check.

| Ticket Asset | PROMPT path | n8n workflow shipped? |
|---|---|---|
| `recrYBFGUm8J9vPyx` L1 Discovery: event evidence write | `practices/revops/workflows/L1-event-evidence/PROMPT.md` | YES — confirmed via builder handoff |
| `recYW8nXfi8NBszIZ` PubMed capture | `practices/revops/workflows/pubmed-capture/PROMPT.md` | YES — confirmed via handoff |
| `recdZJGTBtOggJaHq` Companies Enrichment event writes | `practices/revops/workflows/explorium-direct/companies-enrichment-event-writes/PROMPT.md` | Probably folded into `Z6RROKx5omdfvhtn` |
| `recSbS86GBkHv3swY` Contact Sourcing event writes | `practices/revops/workflows/explorium-direct/contact-sourcing-event-writes/PROMPT.md` | Probably folded into `bYZ0sAzyUvU60wMZ` |
| `recg2bn440bxBctI0` SF Sync event writes | `practices/revops/workflows/sf-sync-event-writes/PROMPT.md` | UNKNOWN — needs check |
| `recMKqQiewKdkL9Uh` Conference Attendee capture | `practices/revops/workflows/conference-attendee-capture/PROMPT.md` | UNKNOWN |
| `recJ93V777934bA0b` SEC EDGAR capture | `practices/revops/workflows/sec-edgar-capture/PROMPT.md` | UNKNOWN |
| `rechrZdnb4G9TEvNR` NIH RePORTER capture | `practices/revops/workflows/nih-reporter-capture/PROMPT.md` | UNKNOWN |
| `reczsE3vi9lU7wpxm` FDA Designations capture | `practices/revops/workflows/fda-designations-capture/PROMPT.md` | UNKNOWN |
| `recZxMhWlB44ZCdoa` Verify event integrity | `practices/revops/workflows/verify-event-integrity/PROMPT.md` | UNKNOWN |
| `recaj5jvkqi9C9NxD` USPTO capture | `practices/revops/workflows/uspto-patent-capture/PROMPT.md` | Deferred — confirmed |

**Recommendation:** add a `Reconciled Against Reality = false` to the unknown ones, then schedule the reconciliation job to flip them.

---

## Section 2 — Loose docs / artifacts last week (not workflows)

| File | Type | Where it belongs | Currently in registry? |
|---|---|---|---|
| `practices/agentic-systems/AUDIT-revops-surface-companies-2026-05-21.md` | Audit doc | `revops-engine` Asset (Asset Type = doc), Lifecycle = verified | NO |
| `practices/agentic-systems/AUDIT-teknova-outreach-companies-2026-05-21.md` | Audit doc | `teknova-enrichment` Asset (doc) | NO |
| `practices/agentic-systems/INVENTORY-state-for-ellie-2026-05-21.md` | Snapshot | `teknova-enrichment` Asset (doc) | NO |
| `practices/agentic-systems/DESIGN-offer-framework-2026-05-22.md` | Architecture | New System? `konstellation-catalog` (platform, emerging). Or `agentic-systems` system if you'd rather. | NO — and possibly implies a new system row |
| `practices/agentic-systems/system-registry-operating-manual.md` | Operating manual | Already pointed to by base; could be its own Asset for cleanliness | Not as a row |
| `practices/agentic-systems/reference/build-operating-system.md` | Operating doc | Asset on a meta-system, or kept as reference-only | NO |
| `practices/agentic-systems/reference/weekly-client-update-template.md` | Template | Asset on `expert-liaison` or platform meta | NO |
| `practices/agentic-systems/reference/revops-architecture-spec.md` | Architecture | Asset on `revops-engine` (doc, deployed) | NO |
| `accounts/clients/teknova/artifacts/audit-pfizer-contacts-2026-05-22.md` | Investigation | `teknova-enrichment` Asset (doc) | NO |
| `accounts/clients/teknova/artifacts/publication-signal-analysis-2026-05-22.md` | Investigation | `teknova-enrichment` Asset (doc) | NO |
| `accounts/clients/teknova/artifacts/teknova-outreach-airtable-field-gaps-2026-05-20.md` | Gap analysis | `teknova-enrichment` Asset (doc) | NO |
| `accounts/clients/teknova/artifacts/outreach-copy-examples-pfizer-2026-05-22.md` | Creative artifact | `teknova-enrichment` Asset (doc) — or out-of-scope for registry | NO |
| `accounts/clients/teknova/artifacts/airtable-ellie-view-fields-2026-05-22.md` | Spec | `teknova-enrichment` Asset (doc) | NO |
| `accounts/clients/teknova/artifacts/email-*.md` | Comms artifacts | Probably **out of scope** for registry — they're one-off emails, not system assets | NO (and stay NO) |

---

## Section 3 — Roadmap items: completed, advanced, surfaced

### Likely completable (have evidence)
- `recTix0NyXVivWDqm` "Close registry gaps (capture, contact-sourcing, sync)" — partly done: L1 Capture and Contact Sourcing both have External IDs and file paths. Supabase->Airtable Sync still `UNKNOWN n8n id`. Move to in-progress with smaller scope ("Supabase sync only").
- `recfy91Ux3ZGUUOhB` "L1 -> Company Events signals (currency rail, step 1)" — L1 Event Evidence handoff shows 199 clinical_trial_status and 199 target_classification events written. Probably **DONE**, need Evidence string (path to handoff + execution ID).
- `reciXojjnNA5L5GKV` "clinicaltrials.gov full capture + trial-as-signal projection" — likely **DONE** as a side-effect of the L1 Event Evidence build. Confirm and close.

### In progress, advanced
- `recG38TbAqKYZ0wNp` "Company lifecycle state + field provenance audit + reconciled cohort run" — Companies Enrichment Domain Resolver work and Companies Field Provenance Audit are both shipped (Asset `recKKLD4ZLlHj2vd8` is verified+reconciled). 92-row Active AAV cohort done. Status still `in progress` because final "one full cohort run end-to-end with every expert_ready row carrying its required fields" not yet checked off.
- `recUxBUa38VFyN0JX` "Build currency / status gate" — Trade press Perplexity signal is shipped (`recoBYDu1hdm2dCbF`); verdict-over-signals logic still pending. Stays `next`.
- `recqrraScO8CwGrZh` "Fix contact-sourcing enum hard-filter" — Last week's HANDOFF says output quality is still wrong (persona drift). Stays `next` with sharpened Done When.

### Blocked, unchanged
- `recoOhKiBbbtnSh3b` "First full L2 v4 R5 + currency production run" — blocked on currency gate. Unchanged.

### New roadmap items surfaced last week
1. **Fix AAV Mover broken node** — "Search AAV Events Per Company" returns empty. Critical-path blocker for Ellie. System: `teknova-enrichment`. Acts On Asset: AAV Mover (once registered).
2. **Process the remaining 89 SF Contact Summary contacts** — 395/484 done. System: `revops-engine`. Acts On Asset: SF Contact Summary (once registered).
3. **Verify DNC propagation with real overlap** — Logic correct by inspection, no real flip seen. System: `revops-engine`. Acts On: SF Contact Summary.
4. **n8n-mcp SDK friction investigation** — webhook URL rotation silently breaks Airtable automations on every `update_workflow`. System: `agentic-systems` (would need a new system row) or attach to `revops-engine` as platform debt. Doc: `HANDOFF-n8n-mcp-sdk-friction-2026-05-22.md`.
5. **Build LinkedIn Role Status Verify end-to-end run** — Workflow exists, no proven run, no contacts verified. System: `teknova-enrichment`. Acts On: LinkedIn Role Status Verify Live.
6. **Konstellation Offer Framework — operationalize** — Catalog hierarchy designed (Constellations → Clusters → Systems → Trajectory → Weekly Slot → Assets). Currently lives only as a doc. Decision needed: does the System Registry adopt this hierarchy as schema, or stay as-is? System: probably a new `konstellation-catalog` platform system.
7. **GeneCradle Inc stuck in `running` status** — Finding A from HANDOFF-companies-enrichment-domain-resolver. System: `teknova-enrichment`.
8. **Contact enrichment for 78-row enriched cohort** — Finding B from same handoff. System: `teknova-enrichment`.
9. **Work-history capture per system** — already on roadmap (`receXL2dm27K3sB0W`). No change needed.

### Hygiene roadmap items (housekeeping, low priority)
- Move loose HANDOFF/AUDIT files from `practices/agentic-systems/` root into a `handoffs/` subfolder.
- Delete `*-plain.txt` duplicates.
- Add `node-compile-cache/` to `.gitignore`.

---

## Section 4 — Decisions needed from Nick before I touch the base

1. **Asset-vs-Ticket model.** When a ticket (PROMPT.md) becomes a real workflow, do we:
   (a) Add a second Asset row for the workflow and keep the ticket as a doc Asset, **or**
   (b) Upgrade the ticket Asset's Type from `doc` to `n8n workflow` in place?
   My recommendation: (a) — one Asset per real thing. The ticket is its own artifact (spec); the workflow is a separate artifact (implementation). The Roadmap row is where intent lives, not the Asset.

2. **System assignment for cross-cutting workflows.**
   - SF Contact Summary uses an SF mirror (platform infra) but writes to RevOps Surface and is wired around Teknova opt-outs. `revops-engine` or `teknova-enrichment`?
   - Companies Enrichment (`Z6RROKx5omdfvhtn`) is a Teknova workflow today but the pattern is platform. Same question.
   - My defaults: SF Contact Summary → `revops-engine`. Companies Enrichment → `teknova-enrichment` until the second client engagement forces the split.

3. **Konstellation Offer Framework — does it become a new platform system?**
   The framework defines a Catalog hierarchy that *includes* the Systems concept the registry already uses. Adopting it likely means renaming or extending tables. Big surface area. Recommend: register `konstellation-catalog` as a new platform system with definition_maturity = `emerging`, leave the existing registry tables alone, schedule the schema decision as a roadmap item rather than executing it now.

4. **Where the master ROADMAP lives.** The Airtable Roadmap table is system-scoped; you mentioned wanting "the roadmap" to drive this week. Do you want me to (a) treat Airtable Roadmap as the single source of truth and add an Order/Owner-driven master view, **or** (b) generate a `ROADMAP.md` at project root that mirrors the top N items?
   My recommendation: (a). The base is already the canonical place. A markdown mirror just drifts.

---

## Section 5 — Proposed execution sequence

Once decisions above are made:
1. Create 7 new Assets (rows from Section 1.C).
2. Update fields on 1 existing Asset (LinkedIn row in Section 1.B).
3. Mark 2–3 Roadmap items done with evidence (Section 3).
4. Add 8 new Roadmap items (Section 3, "New roadmap items surfaced").
5. Update `Last Reconciled = 2026-05-26` on all 3 Systems.
6. (Hygiene, lower priority) Move loose files into `handoffs/` folder and `.gitignore` `node-compile-cache/`.
7. Surface the resulting top-of-roadmap items as this week's execution plan.

---

## Open n8n IDs I still need to pull

To finish reconciliation I still need to pull from n8n:
- L1 Event Evidence workflow ID (not in the builder handoff)
- PubMed capture workflow ID (handoff references it but not by ID)
- AAV Relevance Scan file path (workflow ID known: `bBq5nIO3i5XpQKn9`)
- Supabase → Airtable Sync workflow ID (registry says UNKNOWN)
