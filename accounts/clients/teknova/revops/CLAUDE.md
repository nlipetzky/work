# Teknova: RevOps work

This session is doing RevOps-practice work for Teknova. Load `~/code/work/practices/revops/CLAUDE.md` for the operator role, pipeline stages, and artifact conventions.

Engagement context lives in the parent `clients/teknova/CLAUDE.md`.

## Quick reference (do not explore -- use these directly)

**Supabase project:** `mrmnyscurmkfppicqqhk`

**Play membership tables:**
- Companies in a play: `SELECT c.* FROM companies c JOIN play_company_membership pcm ON c.id = pcm.company_id WHERE pcm.play_id = '<play_id>'`
- Contacts in a play: `SELECT ct.* FROM contacts ct JOIN play_contact_membership pcm ON ct.id = pcm.contact_id WHERE pcm.play_id = '<play_id>'`
- PLAY-006 ID: query `plays` table for the AAV gene therapy play

**Key artifact paths (read these, do not search for them):**
- Enrichment spec: `clients/teknova/artifacts/revops-enrichment-spec-aav-gene-therapy-ellie-outreach.md`
- Provider mapping: `practices/revops/skills/enrichment-providers/SKILL.md`
- Segment criteria: `clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`
- Operations inventory: `clients/teknova/artifacts/teknova-operations-inventory.md`
- Quality report: `clients/teknova/artifacts/revops-quality-report-play006-2026-05-07.md`
- Discovery results: `clients/teknova/artifacts/revops-discovery-aav-gene-therapy-ellie-outreach.csv`
- Spec-to-column mapping: `clients/teknova/artifacts/revops-companies-spec-mapping-2026-05-07.md`
- Next sessions pickup: `clients/teknova/revops/context/play006-next-sessions.md`

**Airtable base:** `appFoLY6hjroyA2KW` (Teknova Outreach). Companies table: `tblmd04rMsw3GE3pK`.

**Provider API keys:** `clients/teknova/revops/.env` -- contains HUNTER_API_KEY, APIFY_API_TOKEN, ZEROBOUNCE_API_KEY, EXA_API_KEY, SERPER_API_KEY, SUPABASE_SERVICE_ROLE_KEY. Read this file to get keys for HTTP API calls. Do not hardcode keys in scripts or artifacts.

**Known column name differences from the enrichment spec:**
- Contacts table uses `email_verified_status` not `email_verification_status`
- Contacts table uses `seniority_level` (legacy) alongside `seniority` (spec). Write to `seniority`.
- Companies table uses `country` not `hq_country`
- Contacts table has no `data_freshness_status` column
- Contacts `source` column is NOT NULL -- always include it (use `explorium` or `hunter` or `manual`)

**CHECK constraint values (use these exactly, do not query for them):**
- `company_type_primary`: `biopharma` | `cdmo` (lowercase only)
- `company_status`: `active` | `acquired` | `defunct`
- `enrichment_status` (companies): `enrichment_complete` | `enrichment_incomplete` | `disqualified` | `held_for_review` | `cadence_ready`
- `enrichment_status` (contacts): same values
- `enrichment_level`: `fully_enriched` | `basic_enriched`
- `seniority`: `senior_scientist` | `director` | `senior_director` | `head_of` | `vp` | `svp` | `c_suite_small_biotech`
- `function_classification`: `process_dev` | `manufacturing` | `cmc` | `cso` | `other_excluded`
- `opt_out_status`: `clear` | `opted_out` | `bounced` | `dnc` | `known`
- `employment_status`: `active` | `ended` | `open_to_work` | `retired` | `unknown`
- `salesforce_engagement_status`: `engaged_last_6mo` | `lapsed_6mo_to_2yr` | `lapsed_2yr_plus` | `no_record` | `unknown`
- `existing_customer`: `current_customer` | `historical_customer` | `never`
- `data_freshness_status`: `fresh` | `aging` | `stale` | `manual_override`

**Do not:** explore the filesystem looking for files. Do not run discovery queries against Supabase to find tables. Do not query `information_schema` for CHECK constraints -- they are listed above. The paths and queries above are authoritative. If something is not listed here, check the operations inventory.

## Enrichment system

Enrichment runs through this agentic system (Claude Code sessions using provider tools directly). There is no legacy orchestration layer, no wave/recipe engine, no AOS pipeline. Do not reference `revops-engine-dev`, Supabase wave tables, recipe execution, or gate scoring. Those are from a prior architecture that is not in use for this client.

When enriching a list for a play, read the enrichment spec artifact at `clients/teknova/artifacts/revops-enrichment-spec-<play-slug>.md`. That document is the complete instruction set: every field, every source priority, every verification rule, every anti-pattern. Follow it literally.

### Provider stack (current)

Read `practices/revops/skills/enrichment-providers/SKILL.md` for the complete field-to-provider mapping. Summary:

- **Explorium** -- primary for company data AND contact discovery. MCP tools: `fetch-businesses` (FREE), `fetch-prospects`, `enrich-prospects`, `match-business`, `match-prospects`, `fetch-prospects-events`. 1,703 credits available (verified 2026-05-07).
- **Hunter** -- email finding + verification. HTTP API, 1 credit per successful find. 7,469 credits (verify before spending).
- **Exa** -- semantic web search. Company discovery, modality verification, pipeline page fetching. Subscription.
- **Perplexity** -- research queries, list validation, free-source searching. Subscription.
- **Apollo** -- waterfall fallback for email finding + contact creation. MCP tools available. Currently exhausted -- use only when credits replenish.
- **Free sources** -- clinicaltrials.gov, PubMed, Google News, conference lists, company websites. No cost.
- **Do not use:** Clay. All enrichment runs through direct provider APIs. Clay is not in this stack.

### Enrichment sequencing

Run providers in this order to minimize spend:

1. **Exa company verification** -- fetch pipeline/platform pages, search for AAV literal strings. FREE. Kills modality false positives before spending any credits.
2. **Explorium `fetch-prospects`** -- contact discovery at verified companies. Filter by job title, department, seniority, geography.
3. **Explorium `enrich-prospects`** -- profile data, current employer verification, tenure. Catches stale employment before spending on email.
4. **Hunter email** -- only on contacts who passed step 3. Waterfall: Explorium contacts email -> Hunter -> Apollo (when available).
5. **Free sources** -- clinicaltrials.gov, PubMed, conference lists for why-now signals. No cost, run in parallel with everything.

This order uses free tools first, then Explorium for discovery + verification, then Hunter only on verified contacts.

### Cost tracking and the $5 rule

Every session that spends provider credits must:
1. Check live credit balances before starting. Do not trust cached numbers.
2. Estimate total session cost across all providers before running.
3. **If estimated spend exceeds $5, stop and get Nick's approval.** Present: providers, credits, estimated cost, what you get.
4. Report a cost summary after every run: credits consumed per provider, credits remaining, what was produced.
5. Update the operations inventory with new balances.

This is not optional. The $5 threshold applies to total session spend, not per-provider.
