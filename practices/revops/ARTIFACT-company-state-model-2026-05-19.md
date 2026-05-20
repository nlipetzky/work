# Artifact sketch (v0) — Company Lifecycle State + Field Provenance Map

**Status:** v0 sketch for iteration. Owner system: `revops-engine` (legibility layer). Not locked.
**Purpose:** make trust readable, not inferred. Two parts: a single ordered lifecycle state on every company, and a per-field provenance map that exposes which fields actually have a populating mechanism. Together these answer "is this real?" without counting empty cells.

---

## Part A — Company Lifecycle State (one ordered column on Companies)

Every company carries exactly one state. The state is a **lower bound** — a company is only as advanced as its weakest satisfied gate. The column never claims more than the row's data backs (canon: built ≠ verified; reconciled=false=hypothesis). Transitions are gated on **observable conditions on the row** plus evidence; never a bare flag.

States, in order:

1. **`raw`** — discovered, not yet enriched.
   - Entry: row created by L1/discovery.
   - Writer: L1 discovery.
2. **`enriched`** — firmographic enrichment populated.
   - Entry: `Last Enriched At` set **AND** `Deep Enrichment Raw` not empty.
   - Writer: enrichment workflow.
3. **`classified`** — L2 has run.
   - Entry: `Verification Status` set, `Currency Status` set, `Classification Version` stamped, `Classification Run Date` set.
   - Writer: L2.
4. **`icp_validated`** — has ≥1 ICP-passing reachable contact.
   - Entry: ≥1 linked Contact with `Enrichment Status != icp_filtered_out` AND `Employer Match Confirmed=true` AND `Email Verified Status` ∈ {Verified, Catch-all (unconfirmed)} (honest-status rule).
   - Writer: contact gate workflow.
5. **`expert_ready`** — the domain expert at the client can act on it (client-agnostic name: Ellie at Teknova, an equivalent expert at the next client).
   - Entry: state was `icp_validated` AND no active suppression (`Account-Level DNC`=false, `Outbound Restricted`=false, `Stale Identity`=false; `Current Customer`/`SF Has Open Opp` cleared per the suppression rules) AND `SF Sync Timestamp` recent.
   - Writer: gate/final.

Terminal:

- **`excluded`** — discontinued, out-of-industry, archived, DNC, or any other disqualifier. Carries `Exclusion Reason`. A company is either progressing 1→5 or `excluded`. Never both. This is the rule that kills the Adrenas-style "surfaced AND archived_out_of_industry" contradiction we found today.

The state model is **data**. Views (what the expert sees, hidden vs visible, etc.) are owned by the operator in Airtable, not by this artifact. The data is correct; presentation is a downstream layer.

---

## Part B — Field Provenance Map

Every Companies field gets three attributes:

- **Purpose** — one line: why this field exists.
- **Writer** — which workflow / external source / manual populates it. Or NONE.
- **Mechanism Status** — one of:
  - `working` — declared writer, and that writer actually writes it in deployed workflows.
  - `orphaned` — no declared writer and not written by any deployed workflow. Dead weight on the row.
  - `drift` — declares a writer that does NOT actually write it. Worse than orphaned: it lies.
  - `manual-only` — intended to be human-set.
  - `under-documented` — has a real writer in deployed workflows but no description says so.

### Method (honest, programmatic — not by hand)

1. **Schema parse.** Companies has ~130 fields. Many self-declare their writer in their description (e.g. *"Sole writer: L1 (9gcmEjq1lvOY2jZS)"*, *"Written by L2"*, *"Written by the gate workflow"*, *"Migrated from text field on 2026-05-13"*). Extract declared writer per field.
2. **Workflow parse.** For each engine workflow (L1, L2, contact-sourcing, sync, Task B, future state-engine), pull the deployed node config from n8n; collect the field IDs each `update`/`upsert` node actually writes.
3. **Cross-reference.** declared ∩ actual = `working`. declared \ actual = `drift`. actual \ declared = `under-documented`. neither = `orphaned`. The remainder, by description, is `manual-only`.
4. **Output**: provenance table (one row per Companies field) + headline counts. The **orphan count is the single trust-restoring number** — it answers "how many of these fields cannot even be populated by the current system."

---

## Path to done (the convergence — not more workflow features)

Three bounded steps, in order. Each has an observable completion gate.

1. **Field provenance audit** — produces the provenance table + orphan/drift/working counts. Done when: every Companies field is classified; orphan list is published.
2. **Reconcile** — derive lifecycle state for all 122 companies from current observable data; resolve contradictions (Adrenas-style); clear stale strata; mark orphaned fields for retirement decision. Done when: every row carries a defensible state derived from its own data.
3. **One clean cohort run** — through the corrected pipeline (currency closed, contact-sourcing email + employment trust verified) producing a coherent surfaced set. Done when: every `expert_ready` row carries the required field set populated and a contact list with visible ICP reasoning.

That is the finish line. None of it requires new engine features.

---

## Decisions (Nick 2026-05-19)

- State name `ellie_ready` renamed to `expert_ready` (client-agnostic).
- **Orphaned fields = delete**, executed as the output of the audit (Step 1 of Path to Done). No blind deletion: the audit produces the orphan list, then those fields are removed.
- Views are not part of this artifact. The state model is data; presentation is owned by the operator in Airtable.
