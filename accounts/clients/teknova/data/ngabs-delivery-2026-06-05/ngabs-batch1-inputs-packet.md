# Batch #1 Inputs Packet — ngAbs Contacts (128)

**For:** the agentic-systems engine session (on-rails ingest → canonical → records-to-client).
**From:** RevOps session. **Batch:** ngAbs contacts, batch #1 of the reusable pipeline.
**Date:** 2026-06-05. RevOps session is standing down on the engine build after this packet.

---

## 1. Final dataset

- **Path:** `/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05/ngabs-contacts-revops-surface-import-2026-06-05.csv`
- **Rows:** 128.
- **This is real data, not the collapsed Clay export.** These contacts were sourced live this
  session: Apollo (people search + people match) for discovery + identity, Apify LinkedIn for
  employment verification, Hunter for email deliverability. The "Response" placeholder collapse
  affected the **companies** table's Clay AI columns only — it never touched these contacts.
- **Already corrected:** the 4 contacts LinkedIn confirmed as departed were removed (132 → 128).
- Fuller source file if raw columns are preferred (132 rows, includes departed + a `Deliver
  Status` column): `…/ngabs-new-contacts-2026-06-05.csv`.

## 2. Column mapping (source CSV → Supabase `contacts` field)

| Source column (CSV) | `contacts` field | Notes |
|---|---|---|
| First Name | `first_name` | |
| Last Name | `last_name` | |
| Full Name | — | No canonical column; decompose to first/last. **No direct home.** |
| Title | `title` | |
| Email | `email` | |
| LinkedIn URL | `linkedin_url` | |
| Company Domain | → resolve to `company_id` | No `company_domain` column on contacts; used for company linkage during promotion. **Not stored directly.** |
| Company Name | → resolve to `company_id` | Same linkage. `company_location`/`company_description` exist but no `company_name` column. **Not stored directly.** |
| Email Verified Status (`valid`/`catchall`/blank) | `email_verified_status` | Direct match. |
| Employment Verification Status (`verified`/`pending`) | `employment_status` | (`employment_verified_at` for timestamp.) |
| Function (`Process/Manufacturing`,`R&D/Science`,`Procurement`) | `function_classification` | (or `role_segment` — engine's call) |
| City | `city` | |
| State/Region | `state_region` | |
| Discovery Sources (`apollo_ngabs`) | `source` | Distinguishes these from the existing Clay-sourced contacts. |

**Data-quality flags:**
- **Personal-email domains (rejected by the data-quality trigger): 0.** All 128 use corporate domains.
- **No email at all: 13 contacts.** Email-required checks may reject/hold these — decide whether to load or exclude.
- **Catch-all email domains: 22 contacts** — email present but unverifiable (`email_verified_status = catchall`); not rejected, lower confidence.

## 3. Airtable target (delivery destination for the Inngest sync)

`account_airtable_config` is currently **empty (0 rows)** — these IDs must be written there
before `records-to-client` can resolve the ngAbs target (no hardcoding).

- **RevOps Surface base (authoritative — per Nick, the master the Outreach base links to):**
  `appYBYH3aOHhTODAw`
  - Contacts table: `tblWJksRL1yKSUgrm`
  - Companies table: `tblnj3YlOI3thjrXp`
- **Teknova Outreach base (Pearl / Ellie's review surface — linked view of the above):**
  `appFoLY6hjroyA2KW`
  - ngAbs Contacts: `tblJrUoGbmbXDwfY3`
  - ngAbs Companies: `tblb75cq02g2Jnb35`

**Confirm:** which base `records-to-client` writes to (the `account_airtable_config` schema
separates `engine_monitor_*` from `pearl_*` table slots — the contacts likely land in the
`pearl_*` slots).

## 4. Scope IDs

- **engine_account_id:** `00000000-0000-0000-0000-000000000001` (Teknova; single-tenant — all 25,978 engine contacts carry this)
- **account_id:** `00000000-0000-0000-0000-000000000010`
- **Segment (this is the ngAbs scope):** "Next-Gen Antibodies" → `9cf46bf5-0aa5-4247-8800-713bd3e5404e`
- **Playbook:** "Teknova Q2 Outbound" → `bbffa680-ec23-4935-a244-24bb7649d847`
- **Play:** no dedicated ngAbs play row exists. Closest is "Teknova Pearl Outreach — No Waves
  (needs RevOps_8)" → `c0e59a0a-40be-42d7-9906-f72eb6509423`. **Confirm:** attach the 128 to the
  "Next-Gen Antibodies" segment directly, or create a dedicated ngAbs play.

---

## Company linkage note (for `company_id` resolution)

The 128 contacts belong to **22 companies**, all within the 77 ngAbs-confirmed set. Company
records (and their G3 wet-lab-site evidence) live in Supabase `clay_events_raw` (72 of 77) and
the ngAbs Companies Airtable tables above. Domain is the join key for `company_id` resolution
during promotion.
