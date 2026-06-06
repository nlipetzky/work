# Handoff: Teknova ngAbs — Temp-Base-Driven Classifier + Site Classification

**Date:** 2026-06-04
**Supersedes the plumbing half of:** `ngabs-pipeline-handoff-2026-06-03.md` (the Supabase-router design described there was set aside; see §2).
**Practice:** n8n-practice (build). Engagement: Teknova (wind-down).
**Purpose:** Capture the current ngAbs company-qualification state and the two n8n workflows built this session so the next session resumes cold.

---

## 0. FIRST ACTIONS (verify before trusting anything below)

1. Read `practices/n8n-practice/CLAUDE.md` and this file.
2. `n8n_health_check` → confirm instance `https://instig8.app.n8n.cloud`.
3. Confirm the two workflows exist and their active state: `uDamISVK54GWGD9t` (ngAbs Classifier) and `jVKI801SeyPvaaHK` (NA ngAbs Site Classification). Both expected **inactive**.
4. **Do not edit a workflow while Nick has it open in the n8n UI.** Concurrent editing this session reset an Airtable match column and created a duplicate production row. Agree who is editing before touching a workflow; reload the editor after the other party saves.

---

## 1. Headline: company qualification is essentially DONE

The 420-row Clay run finished before credits expired. Of the **420 real companies** in the temp base:

- **85 confirmed**
- **2 needs_review**
- 35 excluded
- **298 pending** — broken down: **253 "not ngAbs", 41 "unclear", 4 blank, 0 "yes"**

Every company Clay judged to be an ngAbs developer already has a final verdict. The 298 "pending" are the rejects (gated out at the ngAbs step, so their NA-site/job checks were correctly skipped — that's why their deep columns are blank). **There is no hidden pile of qualified accounts to recover.** The only incremental target is the **41 unclear**, where a second look might promote a handful.

Practical conclusion: the two workflows below are insurance/cleanup, not a blocker. The outreach universe is the **85 confirmed** (+2 to review). Next real work is contacts → outreach.

---

## 2. Architecture (as actually built — temp-base-driven)

```text
Temp Airtable base (ngAbs Companies row)
  → Airtable automation POSTs { recordId } to an n8n webhook
  → n8n fetches that row from the temp base (Get a record, by recordId)
  → Claude (web search) does the research
  → write results back:
       W1 → RevOps Surface Companies (upsert on Domain) + run-log + temp-base mark
       W2 → temp base (NA Site Verdict + NA Sites Detail)
```

The earlier Supabase landing/router design (`clay_events_raw` / `clay_contacts_raw` + pg_net triggers) is NOT used by these two workflows. `public.clay_ngabs_staging` was created early this session and is **orphaned/unused — safe to drop.**

---

## 3. Data locations

| What | Base / ID | Table / ID | Notes |
|---|---|---|---|
| Temp working base | "Temp ngAbs" `app0zKYeY5dVKmuzj` | ngAbs Companies `tbl5yPX4n2AHC6ZJK` | **479 rows = 420 real + 59 contact-stubs** |
| " | " | ngAbs Contacts `tblKqreZRMCsK7bbc` | 859 contacts |
| Production surface | "RevOps Surface" `appYBYH3aOHhTODAw` | Companies `tblnj3YlOI3thjrXp` | upsert target (match on Domain) |
| Run log (W1) | RevOps Surface base | `tblEVSEqetmu4ScHe` | one row per classifier run |

**The 59 contact-stubs:** auto-created by the contacts import (linking a contact to a company name not among the 420 makes Airtable create a stub company row with only Name + Contacts link). They have **no Domain**. Exclude them from any trigger (gate on Domain not empty), or they break the classifier (blank domain). One is junk ("part of Maravai LifeSciences"); a few (Axsome, Inhibrx, Viking) are real and could be domain-backfilled later.

**NA Site Classification field caveat:** in the temp base this imported as a single-select that's just `Response` / blank — the actual Clay site detail (addresses, types) did NOT carry over as readable text. The *verdict* survived inside each company's G3 result; the underlying addresses are gone unless re-pulled (that is what W2 does).

---

## 4. W1 — ngAbs Classifier (`uDamISVK54GWGD9t`)

**Status: tested OK, inactive.** Test: Piramal → `yes` / high / role CDMO / ADC modality, matching Clay.

Nodes / flow (do NOT modify the Webhook node):
```text
Webhook (path 9282316a-…, recordId in query)
  → Get Company Record   Airtable get, temp base ngAbs Companies, id = {{ $json.query.recordId }}
  → Prep Company         Code: reads record fields (Company Name/Domain/Description), builds Claude request
  → Claude Classifier    HTTP POST api.anthropic.com/v1/messages, claude-sonnet-4-6, web_search tool
  → Parse Verdict        Code: parses JSON; ngAbs "no" → status excluded_g1, else classified
  → Create or update a record  Airtable UPSERT → RevOps Surface Companies, MATCH = Domain, typecast on
  → Create a enrichment record Airtable create → run-log tblEVSEqetmu4ScHe
  → Update record        Airtable → temp base row (marks processed)
```

RevOps fields W1 writes: Company Name, Domain, Biotech Role (cdmo→"CDMO service provider", platform→"platform company"), Biotech Modality Types, Company Research (narrative), Verification Verdict (yes→"Has ngAbs Program", no→"Not confirmed", unclear→"Needs review"), Classification Notes (ngAbs + confidence + evidence), Discovery Sources (clay_ngabs), Custom Classification Source (n8n_ngabs_classifier), Classification Run Date, Lifecycle State (classified), + firmographics (Industry, Employee Count, HQ State/City/Country, Company LinkedIn URL, Founded Year).

**Critical gotcha:** the RevOps upsert match column (`columns.matchingColumns`) is **Domain**. It silently reset to the default `id` once (after an edit / UI save), which created a duplicate Piramal row. If it ever reverts to `id`, every run duplicates. Re-verify it is `["Domain"]` after any edit to that node.

---

## 5. W2 — NA ngAbs Site Classification (`jVKI801SeyPvaaHK`)

**Status: built + validates clean (0 errors), NOT yet test-run, inactive.**

Nodes / flow (do NOT modify the Webhook node):
```text
Webhook (path 1369795c-…, recordId in query)
  → Get a record       Airtable get, temp base ngAbs Companies, id = {{ $json.query.recordId }}
  → Prep Site Input    Code: builds Nick's exact Clay site-classification prompt (run condition = Has ngAbs Program "yes")
  → Claude Site Research HTTP POST anthropic, claude-sonnet-4-6, web_search (max_uses 8), crawls /about,/facilities,/locations,…
  → Parse Sites        Code: parses { verdict, reasoning, sites[] }
  → Write Site Result  Airtable UPDATE → temp base, MATCH = record id ({{ $json.recordId }})
```

Writes two **new temp-base fields** (created this session on ngAbs Companies):
- **NA Site Verdict** (`fld1BEuGhCPKk6cRM`, single-select yes/no/unclear) — filterable verdict.
- **NA Sites Detail** (`fld2dT1IIkcCIm8nD`, long text) — full JSON: reasoning + each site's address, city, state, country, site_type (rnd_wetlab / process_dev / gmp_mfg / qc_analytical / sales_admin / unclear), evidence_url.

Existing "NA Site Classification" field was left untouched. Run condition lives in the prompt: non-eligible companies return verdict=no without a web search.

**Next:** fire ONE confirmed row (e.g. Piramal — expect Lexington, KY gmp_mfg → verdict yes), confirm NA Site Verdict + NA Sites Detail populate, then batch.

---

## 5b. W3 — Verify Email (`Lg0jRAb88PNo9REy`)

**Status: ACTIVE, tested + verified working.** This is a CONTACT-level enrichment (separate from W1/W2 which are company-level). Triggered per-contact from the temp base.

Flow (do NOT modify the Webhook node):
```text
Webhook (recordId in query)
  → Get a record   Airtable get → temp ngAbs Contacts (tblKqreZRMCsK7bbc), by recordId
  → Get a record1  Airtable get → temp ngAbs Companies (tbl5yPX4n2AHC6ZJK), by Company Table Data[0] (to get the company Domain)
  → Hunter         emailFinder (firstname/lastname from contact, domain from company) → email + score + verification.status
  → Compose Result Code: builds Validate Email label + appended run note + preserves Work Email
  → Update record  Airtable update → temp ngAbs Contacts, MATCH = record id
```

Writes back to the temp ngAbs Contacts row:
- **Work Email** ← Hunter's email (preserves existing if Hunter returns none — won't blank a good email)
- **Validate Email** ← `✅ Valid email` when Hunter `verification.status = valid`, else `❌ Invalid email`
- **Triggers** ← `done` (records the run)
- **Enrichment Run Notes** ← timestamped line, e.g. `2026-06-04 11:43 — verify email: valid (email, score 98)`. **Appends** on re-run (reads existing notes, concatenates) rather than overwriting.

Trigger: temp-base automation fires the webhook for contact rows with `Triggers = "verify email"`.

Verified: Leslie Wolfe (`recNYbRB0K2Mhxh6P`), execution `138055` — all four fields landed correctly.

**Fail-soft:** `Hunter` has `onError = continueRegularOutput`. If Hunter rejects a contact (e.g. initials-only last name → `400 invalid_last_name`), the run no longer crashes — Compose Result detects it and writes blank `Validate Email`, `Triggers = done`, and an `error: <message>` line in Enrichment Run Notes. Every triggered contact gets a recorded outcome (valid / invalid / error).

**Caveat (cost us 3 clobbers this session):** an open n8n editor tab on this workflow re-saves its stale copy and reverts API-side edits. Keep the tab closed when not actively editing. Also note `Hunter` uses **emailFinder** (finds + verifies), not emailVerifier — it returns a `verification` sub-object we read for the label.

**Known data edge:** contacts at non-ngAbs companies (e.g. BlueRock, `Has ngAbs Program = no`) and initials-only names still get triggered if you fire them — gating the trigger to confirmed/ngAbs=yes contacts is deferred (Nick triggers manually for now).

---

## 6. Credentials (n8n)

- Anthropic: **"Anthropic account"** `r9qiVWC40Dj3jbwM`
- Airtable: **"may 26 all bases"** `FYqJQqdXIQkmT715`
- Supabase: **"Teknova Supabase (revops-engine-dev)"** `SkkATsETAg0ELkoJ` (only relevant if the orphaned staging table is revisited)
- n8n REST (read-only checks): URL + key in `practices/n8n-practice/.mcp.json`

---

## 7. Open items

1. **Activate + trigger.** Both workflows inactive. Point a temp-base automation at each webhook; gate on **Domain not empty** (W2 also on Has ngAbs Program = "yes"). Workflows must be active for the production webhook.
2. **W2 one-company test** before any batch.
3. **Decide whether to batch at all.** Qualification is effectively done (§1). Running W1/W2 across the temp base mainly re-pushes existing data + resolves the 41 unclear. Low yield; optional.
4. **Contacts → outreach** is the real next phase (859 contacts, ~251 at confirmed companies). Not started.
5. **Cleanup:** drop `public.clay_ngabs_staging`; W1's "Create a enrichment record" counts write 0 (cosmetic); the single junk stub row "part of Maravai LifeSciences" can be deleted.

---

## 8. Gotchas / learnings (carry forward)

- **Concurrent editing is destructive.** It reset W1's match column to `id` → duplicate production row. Coordinate; reload editor after the other party saves.
- **Airtable upsert match column can silently revert to `id`** after an edit. Always re-verify `matchingColumns` after touching an Airtable create/update node.
- **Contact imports auto-create company stubs** for unmatched company names (no Domain). Gate triggers on Domain.
- **The webhook from Airtable sends only `recordId` in the query string** (`$json.query.recordId`), not the record fields — the workflow must fetch the row.
- **Single-select fields lose rich text on import** (NA Site Classification collapsed to `Response`).
- Output discipline: full file paths, no person names in systems, no dollar costs in client-facing artifacts.
