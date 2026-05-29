# PLAY-006 Handoff — 2026-05-08 (Session 2)

**Session focus:** Enrichment proof-of-concept test run -- 3 companies, full pipeline, no Clay.

---

## What was done this session

### Test enrichment: 3 companies end-to-end

Ran the full Explorium + Exa enrichment pipeline on 3 representative PLAY-006 companies. All companies were already in Supabase with `enrichment_status = null` and `modality_confirmed = false`.

**Companies enriched:**

| Company | Domain | Supabase ID | Test role |
|---------|--------|-------------|-----------|
| Latus Bio | latusbio.com | 75510aaf-f810-4102-80bb-5ea9924862ce | Multi-source, happy path |
| Myrtelle | myrtellegtx.com | dbbb9652-a127-42e9-bc1b-5b245113ba4c | Single-source, thin data |
| Apertura Gene Therapy | aperturagtx.com | 8c30e4fe-0ea9-4513-a90c-dbe5428dd57c | Expected struggle |

**All 3 companies:** modality_confirmed = true, enrichment_status = 'enrichment_complete', hq_state updated, last_enriched_at set.

**Domain fix:** Apertura had wrong domain in Supabase (`aperturatx.com`). Corrected to `aperturagtx.com`.

### Contacts written to Supabase

| Contact | Company | Title | Email | Status |
|---------|---------|-------|-------|--------|
| Jang-Ho Cha | Latus Bio | CSO & CMO | j.cha@latus.bio | Updated (was existing) |
| Debaditya Bhattacharya, PhD | Myrtelle | VP, CMC Dev & External Mfg | dbhattacharya@myrtellegtx.com | Inserted (new) |
| Joshua Merritt, PhD | Myrtelle | SVP, Head of Technical Operations | jmerritt@myrtellegtx.com | Inserted (new) |
| Jorge Santiago-Ortiz, PhD | Apertura | VP, CMC & Regulatory Affairs | jsantiagoortiz@aperturagtx.com | Updated (was existing) |

All 4 contacts: email_verified_status = 'valid' (Explorium internal validation), source = 'explorium'. Hunter verification not run -- API key not found in project env files.

### Credit spend

27 Explorium credits. Breakdown confirmed per-call:
- `match-business`: 0 credits (FREE)
- `fetch-businesses` / `fetch-businesses-statistics`: 0 credits (FREE)
- `fetch-prospects`: 0 credits (FREE)
- `fetch-prospects-events`: 0 credits (FREE)
- `enrich-business` (firmographics): 1 credit / company
- `enrich-prospects` (profiles): 1 credit / contact
- `enrich-prospects` (contacts): 5 credits / contact

Explorium remaining: **1,676 / 7,500** credits.
Hunter: ~7,469 (untouched -- key not found).

Operations inventory updated with per-call pricing and new balances.

---

## Key findings for the next session

### What works (scales to 49 companies)

- Full Exa → Explorium → Supabase pipeline works end-to-end in-session
- Free operations handle company matching, contact discovery, and employment change detection
- Profile data is rich: full employment history, LinkedIn URLs, seniority, skills
- Explorium's `professional_email_status: valid` is a reliable initial email signal
- Modality verification via Exa is fast and decisive -- AAV literal string check works

### Gaps to resolve before full run

1. **Hunter API key location unknown.** The enrichment spec says `HUNTER_API_KEY` in `.env` but the key is not in any env file under `~/code/work/accounts/clients/teknova/`. Must locate before full run. Email verification step is currently blocked.

2. **Drop `has_email: true` from `fetch-prospects`.** The current filter restricts discovery to contacts already indexed with email by Explorium. Better approach: fetch all contacts at the right seniority/department, then run `enrich-prospects` contacts to get emails (waterfall to Hunter for gaps). Will find more contacts per company.

3. **`function_classification` column mapping.** The enrichment spec defines function_classification but the contacts table uses `role_segment`. Need to agree on valid `role_segment` values and write mapping logic before full run writes that field.

4. **`company_type_primary` check constraint.** Attempted to write 'Biopharma' -- violates constraint. Valid values appear to include 'Biotech'. Need to check constraint definition before writing this field at scale.

5. **Contacts enrichment cost at scale.** 49 companies × avg 3 contacts × 5 credits/contact (contacts enrichment) = 735 credits. Plus profiles (1 credit each): ~147 credits. Plus enrich-business (1 credit each): 49 credits. Total estimate: ~931 credits for the full 49-company run. 931 / 1,676 remaining = 56% of remaining balance. **Recommend confirming per-credit dollar rate on Explorium dashboard before full run.**

### Supabase schema issues hit this session

- `company_type_primary` has a CHECK constraint -- 'Biopharma' is invalid. Skipped this field.
- `contacts.engine_account_id` is NOT NULL -- must supply sentinel values (`00000000-0000-0000-0000-000000000001` / `...0010`) when inserting new contacts.

---

## Next session priorities (in order)

1. **Find Hunter API key.** Check `~/code/aos/.env` or similar. Do not start full enrichment run without it.
2. **Run full 49-company Explorium enrichment** using the proven pipeline. Drop `has_email: true` from `fetch-prospects`.
3. **Resolve `function_classification` → `role_segment` mapping.** Check constraint values, add to write logic.
4. **Update discovery summary** with enrichment completion as companies move through the pipeline.
5. **Why-now signal fill** -- funding/leadership/conference signals still 0/44 on existing companies (from prior work). Can run in parallel with new company enrichment using Perplexity + Exa (free).

---

## Explorium business IDs (for reference)

| Company | Explorium business_id |
|---------|-----------------------|
| Latus Bio | b93f374da4b9d48d2932e64368a87f89 |
| Myrtelle | bbe0a4a134f062e09c7d5d3ec27b945f |
| Apertura Gene Therapy | e8b36d273dbeb36c55db7e0ab9645fcd |
