# Handoff: Teknova ngAbs Clay→Supabase→Airtable Pipeline + Web-Research Build

**Date:** 2026-06-03
**Purpose:** Continue the ngAbs sourcing pipeline in a new session. Immediate next build: an **n8n web-research replacement for Clay's NA Site Classification** (Clay credits are exhausted, so remaining company site-classification must run code-side). Also captures full system state so the new session can resume cold.
**Practice:** n8n-practice (build) + revops/agentic-systems (architecture). Engagement: Teknova (wind-down).

---

## 0. FIRST ACTIONS in the new session (verify before building)

Do NOT trust the IDs below blindly — confirm live state first:
1. Read `practices/n8n-practice/CLAUDE.md`, `accounts/clients/teknova/CLAUDE.md` + `STATE.md`, and the companion docs (§8).
2. `n8n_health_check` → confirm instance `https://instig8.app.n8n.cloud`.
3. `n8n_list_workflows` → confirm the 4 live workflows (§3) and their active state.
4. Supabase `list_tables` on project `mrmnyscurmkfppicqqhk` → confirm `public.clay_events_raw` + `public.clay_contacts_raw` and the two `pg_net` triggers exist.
5. Confirm Clay credits are still exhausted (no Clay enrichment available) — the web-research build assumes this.

---

## 1. Architecture (dual pipeline, both live + autonomous)

```text
Clay (enrichment only)
  → HTTP dispatcher column → n8n capture webhook → Supabase landing table (hash-dedup)
  → pg_net trigger on INSERT → n8n router webhook
       → resolve/upsert company or contact in Airtable + fan out events
       → mark landing row processed
```
Two parallel instances: COMPANIES and CONTACTS. Principle (validated by research, see §8): Clay does enrichment; n8n owns routing/governance/state; Supabase is the landing + governance layer; Airtable is the operator surface.

---

## 2. Supabase — project `revops-engine-dev` (ref `mrmnyscurmkfppicqqhk`, us-east-1)

- `public.clay_events_raw` — company landing. Cols: id, client, source, event_type, dedupe_key, company_ref(jsonb), payload(jsonb), payload_hash (generated md5, unique per client), captured_at, received_at, processing_status, processed_at, error_message.
- `public.clay_contacts_raw` — contact landing. Same shape + contact_ref(jsonb), entity.
- Triggers (pg_net, fire-and-forget POST to router webhooks on INSERT):
  - `trg_clay_events_raw_router` → fn `clay_events_raw_notify_router` → POSTs to company router webhook.
  - `trg_clay_contacts_raw_router` → fn `clay_contacts_raw_notify_router` → POSTs to contacts router webhook.
- **Backfill technique:** re-fire existing landing rows by looping `net.http_post(...)` over the table in SQL — router re-upserts idempotently. Used repeatedly this session.

---

## 3. n8n workflows (instance instig8.app.n8n.cloud; workflows seen in project "INSTIG8 AI" Pj1xUgbrL58T1CS1 — verify)

| Role | Name | ID | Webhook (production) |
|---|---|---|---|
| Company capture | Clay → Supabase Landing (Capture) | `iIGeBi3XEZvZLY8c` | `/webhook/clay-events-landing` |
| Company router | Supabase JSON to Airtable | `02zC263K3iYpwaef` | `/webhook/94bb3d60-b459-4062-8e63-f792bc92c405` |
| Contacts capture | Clay → Supabase Landing (Contacts Capture) | `IraPGafM2EcimJrY` | `/webhook/clay-contacts-landing` |
| Contacts router | Supabase Contacts → Airtable (Router) | `4P5WntXET58oEKRo` | `/webhook/contacts-router-in` |
| LIKELY SUPERSEDED | Clay Events Fan-Out (Airtable-triggered, original) | `F1JB32W26ISDlXRY` | (user-added webhook) |

- `F1JB32W26ISDlXRY` was the first (Airtable-trigger) fan-out, replaced by the Supabase router. Verify it's not still firing; archive if orphaned.
- **HARD RULE:** do NOT modify webhook nodes the user created, and do NOT rename their workflows. (Memory: `feedback_teknova_fanout_webhook_no_touch`.)
- Router internals: Webhook → Resolve Company (Airtable search by Domain, alwaysOutputData) → Build Row (Code) → fan out / upsert → Mark Processed (Supabase update, executeOnce). Contacts router has an IF (Has Email) → Upsert on Email / fallback Upsert on LinkedIn URL.

### Credentials (n8n)
- Airtable: **"may 26 all bases"** id `FYqJQqdXIQkmT715`
- Supabase: **"Teknova Supabase (revops-engine-dev)"** id `SkkATsETAg0ELkoJ`

---

## 4. Airtable — base "RevOps Surface" `appYBYH3aOHhTODAw`

| Table | ID |
|---|---|
| Companies | `tblnj3YlOI3thjrXp` |
| Company Events | `tblnzX2b2kqNGzW6r` |
| Sync Errors | `tblTSS0uY2ngJIaw7` |
| Contacts | `tblWJksRL1yKSUgrm` |
| Contact Events | `tblDYItHaNcT2gnwi` |

- Companies link by **Domain**. Company router writes scalars + counts + `Discovery Sources` (union `clay_ngabs`) + `Outreach Eligible = true` (only when `g3_verdict == confirmed`).
- Contacts: dedupe on **Email primary, LinkedIn URL fallback**. Router writes identity + seniority/function/DMU (derived) + verification + parsed LinkedIn profile fields + `Discovery Sources = clay_ngabs` (field added this session, `fldUqto3tcIGGZOVS`) + `LinkedIn Verification Status` (`verified→Match`, `stale_mismatch→Mismatch`, `no_profile→No Profile`).
- Wet-lab sites land as **Company Events** rows with `event_type = wet_lab_site` (NOT a single field). "Missing NA site classification" = company has no wet_lab_site Company Events.
- Vestigial: early `*_json` / `*_hash` fields on Companies (from the original Airtable-trigger fan-out). Likely unused now — verify before relying on or removing.

---

## 5. Locked decisions

- **D1 — CRM suppression timing:** store raw Salesforce `last_activity_date` at sourcing; compute suppress/eligible at a **send-time gate** (180-day window from now). NOT yet wired (needs SF credential + `Last CRM Activity Date` field on Contacts). Phase 2b.
- **D2 — Contact dedupe:** Email primary, LinkedIn URL fallback.
- **Outreach gating:** company dispatcher fires for `confirmed` + `needs_review`; `pending`/`excluded` never enter the DB. `Outreach Eligible = true` only for `confirmed`. `needs_review` = review queue (filter Companies `Verification Verdict = needs_review`).
- **Source tag:** `clay_ngabs` in `Discovery Sources` on BOTH Companies and Contacts (same field name → one filter spans both).
- **Brand-domain rule:** company sourced domain may differ from operating subsidiary (FUJIFILM `fujifilm.com` vs FUJIFILM Diosynth `fujifilmdiosynth.com`). LinkedIn-verify matches on brand family; router links contacts by the sourced domain.

---

## 6. NEXT BUILD — n8n web-research NA Site Classification (the reason for this handoff)

**Why:** Clay credits exhausted before NA Site Classification finished for all confirmed companies. Replace Clay's Claygent web research with a code-side web-capable LLM.

**Spec:**
- **Trigger/input:** Airtable Companies where `Verification Verdict = confirmed` AND no `wet_lab_site` Company Events exist (i.e., NA sites not yet classified). Pull Company Name + Domain.
- **Research step:** web-capable model with the adapted prompt (see `clay-json-spec-company-events.md` and the prompt the user supplied 2026-06-03 — it returns `{verdict, reasoning, sites:[{address,city,state,country,site_type,evidence_url}]}` with site_type ∈ rnd_wetlab/process_dev/gmp_mfg/qc_analytical/sales_admin/unclear). Options for the web tool (decide in new session):
  - Claude API with web search (claude-api skill; Anthropic web search tool) — best fidelity, returns real evidence URLs.
  - Exa MCP (connected) — search + contents.
  - Explorium MCP (connected) — business data; may not give site-level wet-lab classification.
  - Deepline (installed) — code-first enrichment CLI.
- **Output path (preferred — reuse proven router):** build a `clay_events_raw`-shaped payload with `wet_lab_site = {sites:[...], verdict, reasoning}` + company scalars + `company_domain`, set `source = "n8n_web_research"`, INSERT into `public.clay_events_raw`. The existing trigger + company router fan it out to Company Events and update the company. Idempotent (hash-dedup + dedupe_composite_key).
- **Throttle:** web research is slow + rate-limited — Loop Over Items + Wait; batch; validate on 1–2 companies first (same validate-first discipline that caught the job/trial + brand-domain issues).
- **Trigger mechanism:** schedule (poll Companies for confirmed-missing-sites) OR manual batch run. Schedule is cleaner.

**Validate-first:** run one company, confirm Company Events `wet_lab_site` rows appear with correct site_type + evidence URLs, then batch.

---

## 7. Open items / Phase 2b (GTM, not plumbing)

1. **Web-research NA Site backfill** (§6) — the immediate build.
2. **Send-time CRM suppression gate** (D1) — SF `last_activity_date` capture in routers + send-time eligibility gate. Needs SF credential + `Last CRM Activity Date` field.
3. **Contact Events fan-out** — contact-level signals (role change, promotion, publication, recent post) → Contact Events table. Define Clay/web signal source, extend contacts router.
4. **Phone + Apollo enrichment** for Contacts — optional, separate enrichments (Clay credits gone → code-side).
5. **needs_review queue** — review Seagen etc.; promoting to `confirmed` + reprocess flips Outreach Eligible.
6. **Outreach** — sequenced copy through Hermes (expert-liaison); not started.
7. Archive `F1JB32W26ISDlXRY` if confirmed superseded.

---

## 8. Companion docs (read these)

- `accounts/clients/teknova/artifacts/phase2-contacts-sourcing-decision.md` — contact architecture + locked decisions
- `accounts/clients/teknova/artifacts/clay-json-spec-contacts.md` — contacts dispatcher + screening + router mapping
- `accounts/clients/teknova/artifacts/clay-json-spec-company-events.md` — company signal JSON spec
- `practices/agentic-systems/reference/clay-to-airtable-router-pattern.md` — the architecture decision
- `practices/agentic-systems/reference/clay-clunkiness-expert-patterns-research-2026-06-02.md` — research backing the split
- `accounts/clients/teknova/artifacts/n8n-airtable-triggered-fanout-design.md` — original design
- `practices/n8n-practice/workflows/teknova-clay-events-fanout-brief.md` — original build brief
- Source playbook: `Teknova ngAbs Outreach Playbook v1 (2026-05-29)` — ICP, titles, gates G1-G5, screening, required output fields

---

## 9. Known gotchas (carry forward)

- n8n Airtable nodes (trigger/get/upsert, v2.2) nest fields under `$json.fields` — router Code normalizes with `record.fields || record`.
- Clay AI columns output wrapper objects (`{inScope, reason, ...}` / `{employmentVerified, ...}`) — parse, don't assume bare values.
- pg_net is fire-and-forget: if a router is down, that row stays `pending` (no auto-retry). A periodic "reprocess pending" sweep (SQL net.http_post over pending rows) recovers.
- Use `n8n_update_partial_workflow` + validate after every change. Build inactive, test, then activate. Webhook triggers need the workflow active + method POST.
- Airtable upserts use `typecast: true` so select/multiselect options auto-create; `autoMapInputData` avoids clobbering unmapped fields. Routers retry 3x/2s backoff, onError continueRegularOutput.
- Output discipline: full file paths, no person-names-in-systems, no dollar costs in client-facing artifacts (see MEMORY).
