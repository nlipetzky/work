# Workflows ticket — contact-sourcing: employment-currency trust + capture-wide (BOUNDED SCOPE)

**Workflow:** `bYZ0sAzyUvU60wMZ`. **Owner:** Workflows. **agentic-systems surface-verifies against the DoD, then this closes.**
The earlier 3-change email-trust scope closed. A real defect surfaced via a human LinkedIn spot-check: a contact marked employer-confirmed who left the company in April 2026. This ticket is the bounded fix for that and the directly-coupled problems. Do exactly the five items. No topology refactor, no new providers, no other scope.

## Why (grounded in surface, exec 80827 + the 8 MeiraGTx rows)

- `Employer Match Confirmed = true` on every record incl. Girish Chitnis, who per LinkedIn left MeiraGTx ~April 2026. The logic sets confirmed when Explorium and/or Apollo's *last-known* employer == target; when both agree it sets `sourceCount=2` and **skips** the LinkedIn freshness check — trusting stale agreement most in the highest-risk case. Tenure/end-date not captured (fields ~0/empty). "Confirmed" asserts more certainty than the data supports — same disease as catch-all emails and dead-company currency.
- 8 rows = 5 people. Upsert is keyed on **email**; email changes between runs (Explorium guess → Hunter) so re-runs spawn NEW rows instead of updating. The 3 "missing domain" rows Nick flagged are the stale Explorium duplicates.
- New workflow writes **no opt-out/DNC field**. Teknova requires opt-out. It must be carried and the field retained.

## Scope — exactly these five

### 1. Capture-wide for ALL third-party sources (canon: capture wide, derive narrow)
Explorium (fetch/profiles/contacts), Apollo, Hunter, Apify/LinkedIn: persist the **full raw provider payload** per prospect, not just the currently-mapped subset. We keep discovering we discarded the field we needed (employment end-date, tenure, position history). Never filter at ingestion; narrowing happens downstream. This is load-bearing for item 2 — the currency signals live in fields currently being dropped. Ref: canon `capture-wide-derive-narrow`, `feedback_keep_all_captured_data`.

### 2. Employment-currency verification (the serious one)
`Employer Match Confirmed` must mean **currently employed**, established from a current-employment signal (LinkedIn current position present and not ended, via the Apify/LinkedIn path), NOT provider last-known-employer agreement. The LinkedIn currency check must run **especially when Explorium+Apollo agree** — do not skip it on `sourceCount=2`. Capture start/end/tenure so the decision is auditable.

### 3. Honest employment status for Ellie
Add an explicit employment-verification status field, honest states only — e.g. `Employed (current, verified)` / `Not currently employed` / `Employer unconfirmed` / `No signal`. Surfaced for Ellie like the email status. Never read "confirmed" without a current signal. Mirror the email-trust principle exactly.

### 4. Fix the duplicate-row defect
Re-key the contact upsert on a **stable per-person identifier** (LinkedIn URL is present and stable on all rows — or an external person ID), not email. Re-runs must update the person, not create a new row. Reconcile the existing duplicates already produced for the 5 MeiraGTx people down to one row each.

### 5. Preserve opt-out
Carry an opt-out/DNC field through the contact write. Retain the field (do not delete it). Populate from provider data when available; explicit empty/unknown otherwise — never silently absent. Teknova compliance requirement.

## Constraints (non-negotiable)

- n8n PUT/MCP wipes credentials; `validate_workflow` misses Airtable corruption. Capture full workflow JSON first; after deploy raw read-back every node credential + node/connection counts; report as references. Do not assert "credentials preserved."
- No autonomous spend. Deploy inactive. Verification = bounded MeiraGTx size:5 real run, Nick same-session go. No pinned/simulated runs.
- Output contract: references only — workflow/version IDs, execution ID, record IDs, per-node counts from the cited execution. No narrative, no "verified/working/ready." agentic-systems decides pass/fail by re-reading the surface.
- Scope is exactly the five above. Anything else (merge-topology cleanup, new providers) is out of scope.

## Definition of done (agentic-systems verifies on a bounded MeiraGTx size:5 run)

1. **Regression oracle — Girish Chitnis:** his record must NOT read employer-confirmed; employment status must be `Not currently employed` (or `Employer unconfirmed`), driven by the LinkedIn currency signal, not provider agreement. This is the decisive test — he is known-departed (~April 2026).
2. Raw provider payloads persisted per prospect — stored data includes provider fields beyond the old mapped subset (employment history / tenure / dates where the provider returned them).
3. Employment status field present with honest states; no record reads "confirmed" without a current-position signal.
4. Re-running the bounded test produces no duplicate rows per person (stable key); the existing 5 MeiraGTx people are reconciled to one row each.
5. Opt-out field present, written by the workflow, retained in schema.

All five on the surface = contact-sourcing meets Ellie's standard and closes. Nothing else in scope.
