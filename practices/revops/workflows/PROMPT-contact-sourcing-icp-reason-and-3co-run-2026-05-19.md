# Workflows ticket — persist ICP reason + bounded 3-company diagnostic run

**Workflow:** `bYZ0sAzyUvU60wMZ`. **Owner:** Workflows. **agentic-systems surface-verifies.**
Nick-authorized this session: a build change + a bounded paid run on three named companies. Scope is exactly the two items below. Nothing else (no merge-topology, no sourcing-query redesign — the sourcing-doesn't-target-the-persona defect is acknowledged and explicitly OUT of scope; this run is the diagnostic that tells us if that's the problem).

## Item 1 — persist the ICP score reason (explainability fix)

Today the Anthropic scorer produces a per-contact rationale (e.g. "C-suite, BD-owned, not a CMC owner") but **no Contacts field stores it** — the score lands, the why evaporates. Fix:

- Add a Contacts (`tblWJksRL1yKSUgrm`) field **`ICP Score Reason`** (multilineText).
- Carry the model's per-contact rationale from `Residual ICP Score` → `Apply Score + Map` → `Prepare Contacts Upsert` and write it onto every scored contact, pass **or** fail.
- A score with no stored reason is the defect; every scored row must carry its reason after this.

## Item 2 — bounded paid run, exactly these 3 companies

Voyager Therapeutics · Lexeo Therapeutics · Solid Biosciences Inc.

These are focused AAV/genetic-medicine companies — chosen to answer the real open question: **can this workflow ever yield an ICP-qualified contact (score ≥60) Ellie should talk to, with a visible reason?** Every run so far has only ever correctly *rejected*.

### Preconditions (STOP-and-report if any fails — do not improvise)

1. Confirm each of the 3 exists in the Target Companies table. If a row is missing, STOP and report — do not create it.
2. Confirm/fill `Domain` for each (Hunter-first hard-depends on it; the MeiraGTx run was blocked precisely because its Target Companies row had no domain). Report the exact domain used per company. If a domain is missing and not confidently determinable, STOP and report — do not run a Hunter-starved company.
3. Scope strictly to these 3 via the selective mechanism — `Run Selected` on exactly these rows, **static Airtable formula only, never a dynamic n8n expression** (known live-failure). Restore the production state after. Keep `size:5`/company (≈15 prospects max). Do not change size.

## Constraints (non-negotiable)

- Credential-wipe hazard: capture full workflow JSON before any edit; after deploy, raw read-back of every node credential + node/connection counts; `validate_workflow` does NOT catch Airtable corruption. Report bindings as references; do not assert "preserved."
- No spend beyond this bounded 3-company run. Deploy inactive; manual trigger only.
- Output contract: references only — new field id, workflow/version IDs, execution ID, per-node counts from the cited execution, and the per-company numbers below. No narrative, no "verified/working." agentic-systems decides pass/fail by re-reading the surface.

## Report (references only)

Per company: domain used; prospects sourced; count scored ≥60 (ICP pass) vs `icp_filtered_out`; and confirm `ICP Score Reason` is populated on each scored row. Plus: the new field id, execution ID, post-deploy versionId, credential bindings.

## Definition of done (agentic-systems verifies on surface)

1. `ICP Score Reason` field exists and is populated for **every** scored contact in the run (pass and fail).
2. All 3 companies sourced with a real domain (Hunter not starved — no all-`Unverifiable`-because-null-domain repeat).
3. Per-company pass/fail counts present, and the decisive fact answered explicitly: **did any contact across the 3 score ≥60**, and if so its persisted reason is visible. This tells us whether the workflow can deliver Ellie a usable person at all, or whether sourcing-targeting is the confirmed next defect.
