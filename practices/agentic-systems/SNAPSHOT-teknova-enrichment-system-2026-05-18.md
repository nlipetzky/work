# Teknova Enrichment System — full snapshot (2026-05-18)

One index of every moving part. Plain language. "Current system" = the pipeline we are finishing. "Legacy" = 2025-era workflows/bases still in the accounts but not part of this build.

---

## 1. The pipeline, in order (what the system does)

1. **Find** — pull companies running AAV gene-therapy trials from clinicaltrials.gov.
2. **Classify** — decide whether each company is genuinely doing AAV gene therapy (vs a name collision like the vasculitis homonym).
3. **Verify** — independently re-check the classifier against the actual trial record, and write client-presentable proof.
4. **(Next) Currency** — decide whether the AAV work is *still active and worth Teknova's time* (the unbuilt layer).
5. **Source contacts** — find the right people (process dev / manufacturing / CMC) at the surviving companies.
6. **Enrich** — fill in emails, verify employment, score fit.
7. **Sync** — push the finished cohort to the outreach database.

## 2. n8n workflows

### Current system (the registry is authoritative — `practices/revops/workflows/REGISTRY.md`)

| Plain name | n8n ID | State | Notes |
|---|---|---|---|
| Step 1 — Find / capture (CT.gov) | `9gcmEjq1lvOY2jZS` | live, runs | Sole writer of "Most Recent Trial Date" + "Active Recruiting". **Not in REGISTRY — gap.** |
| Step 2 — Classify (L2 v4 R5) | `rXKuqfDwqX7TYzxK` | deployed, **never run in prod** | Live company data is still the 2026-05-15 v3 vintage. Held for the currency layer. |
| Step 3 — Verify | `2rTMeD7SB3SBNZZE` | deployed, smoke-passed | Writes only the 3 Verification fields. Modality-only. |
| Contact sourcing + ICP gate | `bYZ0sAzyUvU60wMZ` | built, inactive, 23 nodes | Live-tested; enum hard-filter bug found. **Not in REGISTRY — gap.** |
| Supabase → Airtable sync | (id TBD) | exists | Pushes source-of-truth into the outreach base. Logged in "Sync Runs" table. |
| L2 smoke-variant (scratch) | `3ba5obhDdKcKc5Hs` | **archived** by Nick | Tombstone. Do not recreate. |

### Legacy (2025, not this system — listed so you know they exist)

~19 workflows named "Teknova *" (Segmentation, Offer Creation, Reply Webhook, Companies/Leads Import, Salesforce, Meeting Agent, SmartLead Reply, Contact Explorium Enrichment, etc.), last touched Sep–Dec 2025. Two are still `active` (Offer Creation `ElYa3WGL7IHILWzt`, Reply Webhook `CyGoRL8oibT7L7zO`). None are part of the current pipeline. Cleanup is a separate decision.

## 3. Airtable bases

### Current system

- **RevOps Surface** — `appYBYH3aOHhTODAw` — the source of truth. 11 tables:
  - **Companies** (121 rows) — the company set + all classification/verification/currency fields.
  - **Contacts** — people, enrichment, suppression, tiering.
  - **Classification Rules** — *the live rulebook L2/L3 read at runtime.* Change behavior here, not in workflow code.
  - **Sources** — *the live capture config Step 1 reads* (which sources, queries, trust, refresh).
  - **Play Steps** — "where are we" state tracker (authoritative for status).
  - **Enrichment Runs** — run log / receipts.
  - **Sync Runs** — Supabase→Airtable sync log.
  - **Playbook** — play definitions. **Company Events** — signal events. **Teknova** — a Google-Drive file index. **(Contacts dup fields marked for deletion.)**
- **Teknova Outreach** — `appFoLY6hjroyA2KW` — downstream synced copy the client/outreach tooling reads. Never written to directly.

### Legacy / clutter (not this system)

Teknova Clay Sheets, Campaign Navigator, Smart Layer (+2 backups), Project Tracker, Growth OS (Copy), Teknova Outreach (Copy), Konstellation Governance OS. 2025-era or backups. Out of scope; flagged only so they're not mistaken for live.

## 4. Where the rules / context live

Three places, by type:

- **Runtime rules (machine-read every run):** in Airtable — the **Classification Rules** and **Sources** tables. This is what actually governs behavior.
- **Canonical criteria (human source of truth):** `accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` — **version 5**. Never re-author; propose changes as R/Q items. Classification Rules is a projection of this.
- **Process + build context (markdown):**
  - Process: `practices/revops/cohort-production-process.md`, `ENGAGEMENT-PROCESS.md`, `cohort-quality-framework.md`, `cohort-data-model.md`.
  - Build/spec: `practices/revops/workflows/explorium-direct/.build/` (L2/Verify build files, R5 logic, oracle).
  - Operating model + registry + canon: `practices/agentic-systems/reference/build-operating-system.md`, `practices/revops/workflows/REGISTRY.md`, `practices/agentic-systems/canon/`.
  - Currency-gate design + parallel-build map: the two 2026-05-18 docs in `practices/agentic-systems/`.

## 5. What's actually left to finish

1. **Currency layer** (step 4) — not built. The one real feature gap.
2. **Contact-sourcing enum-filter fix** — diagnosed, not applied.
3. **One full classify run** — L2 v4 R5 has never run in prod; data is still old vintage. Runs once, with currency.
4. **Registry gaps** — Step 1 (capture) and contact-sourcing workflows aren't registered.
5. **Fixture reconciliation** — leftover test state in Companies before any prod run.
