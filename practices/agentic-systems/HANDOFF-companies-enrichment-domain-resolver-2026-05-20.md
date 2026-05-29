# HANDOFF — Companies Enrichment domain resolver + final cohort state (2026-05-20, evening)

**For:** a fresh Boris session. Read this first. Surface-verify against live n8n + Airtable before acting; agent narration is hypothesis until checked.

## Where things stand

**Active AAV cohort: 92 companies. 78 enrichment_complete (85%).** The Companies Enrichment workflow (`Z6RROKx5omdfvhtn`) now produces clean Explorium firmographics on the vast majority of the cohort. The remaining 14 are split across `disqualified` (6), `archived_out_of_industry` (7), and `running` (1, stuck).

Today's session focused on the long tail — rows that previously fell into `needs_data_quality_review` because the Domain field on the Airtable row pointed at the wrong company. We built a domain resolver (Exa-based, web-grounded), added a parent-company enrichment bypass for subsidiary/M&A-artifact rows, and triaged the remainder.

## Workflow state

| Workflow | ID | Latest versionId | Status |
|---|---|---|---|
| L1 — Canonical AAV Discovery (CT.gov) | `9gcmEjq1lvOY2jZS` | unchanged this session | `active: true` |
| Companies Enrichment (Explorium → Airtable) | `Z6RROKx5omdfvhtn` | `ff9f58c7-49fd-4fef-8d5b-1389740db585` | `active: true` |
| AAV Relevance Scan | `bBq5nIO3i5XpQKn9` | unchanged | active |

**n8n active-runtime cache caveat:** when an active workflow is PUT'd via raw REST, the runtime caches the OLD compiled version for ~5 minutes. After every patch, deactivate → wait 5s → reactivate before triggering. This was observed multiple times today.

## Changes shipped to `Z6RROKx5omdfvhtn` today

1. **Active AAV scanner bypass in Qualify Company** — Active AAV companies skip the biotech + geography filter. The scanner's CT.gov + PubMed verdict at the Company Events grain is the higher-trust signal.
2. **Active AAV bypass in Check AAV Modality** — same companies skip the website vocabulary scan. The L2 Classify bypass that was already there now has a sibling for the scanner verdict.
3. **Pfizer 422 fix in Map Enriched Fields** — `foldExplorium` helper clips every cell to 95K chars. Pfizer's 428KB `business_intent_topics` was crashing the batch.
4. **Domain resolver nodes** — `Resolve Domain` (HTTP → Exa) + `Apply Resolved Domain` (Code) inserted between Mark Running and Prepare for Match. Started with Claude Haiku 4.5 (`@n8n/n8n-nodes-langchain.anthropic`); replaced with Exa after Claude hallucinated `shire.com` for "Baxalta now part of Shire" and produced wrong data on the row.
5. **Match Business input rewire** — was reading `$('Get Unenriched Companies').item.json.fields.Domain` directly, bypassing the resolver. Now reads `$json.name` and `$json.domain` from Prepare for Match's output.
6. **Hostname parser rewrite** — `URL` constructor doesn't work in n8n's Code-node sandbox (throws silently). Replaced with regex-based parsing.
7. **Directory-domain filter** — Exa often returns Crunchbase / LinkedIn / SEC / press releases first. The resolver skips ~40 known directory/news domains to find the actual corporate URL.
8. **Domain-verified bypass in Qualify Company** — when Exa resolved a domain AND Explorium's matched record uses the same domain, trust the match even if the matched company name diverges from the input. This enables parent-company enrichment for subsidiaries / M&A artifacts. The earlier distinctive-token check was removed in favor of trusting domain agreement.
9. **Name-similarity threshold** — bumped from `<0.5` to `<0.6` early in the session for fallback path; current behavior favors domain-verified bypass over threshold tuning.

## Live cohort state (Active AAV: 92 rows)

| Enrichment Status | Count | Notes |
|---|---|---|
| `enrichment_complete` | **78** | The outbound-ready set |
| `disqualified` | 6 | 5 Chinese biotechs with no clean English web presence + AskBio Inc |
| `archived_out_of_industry` | 7 | Explorium has no record OR no AAV signal on website |
| `running` | 1 | GeneCradle Inc — stuck from a crash |

**The 6 `disqualified`:** Shanghai Xinzhi BioMed, Shanghai Mianyi Biopharmaceutical, Innostellar Biotherapeutics, Chengdu Origen Biotechnology, Guangzhou Jiayin Biotech, AskBio Inc.

**The 7 `archived_out_of_industry`:** Nanoscope Therapeutics, Adrenas Therapeutics, Spur Therapeutics, Unlimited Biotechnology, Elisigen, GenSight Biologics, Bionic Sight LLC.

## Notable enrichments via domain-verified bypass

Several rows enriched with **parent-company data** because Exa resolved the right operating entity even when the row's company name was a subsidiary/legacy entity. These are all functionally correct for outbound:

- **Baxalta now part of Shire** → Takeda firmographics (acquired via Shire→Takeda)
- **Brain Neurotherapy Bio** → AskBio firmographics (wholly-owned subsidiary)
- **Janssen Pharmaceutical K.K.** → Johnson & Johnson Janssen firmographics
- **Gyroscope Therapeutics** → Novartis firmographics (acquired/folded by Novartis). Manually flipped to enrichment_complete after workflow wrote data but mislabeled the row.
- **Novotech (Australia)** → global Novotech firmographics

## Findings to action in the fresh session

### Finding A — GeneCradle Inc stuck in `running` status (Active AAV cohort)

GeneCradle (`rec399GxEhUZGsoYf`) has Enrichment Status = `running`. This is residue from a workflow crash between Mark Running (flips status to running at start) and the terminal Update node (flips to final status). n8n has no transactional rollback.

**Immediate action:** Flip GeneCradle to a sensible terminal state (probably blank or `needs_data_quality_review`), then flip Run Selected = true to let it process cleanly on the next trigger. One Airtable update.

**Permanent fix to build:** A "stuck-state reaper." Either a scheduled workflow that finds records with `Enrichment Status = running` and `Last Enriched At` older than, say, 30 minutes, and resets them to blank. OR a check at the start of Companies Enrichment that does the same reset before processing. Without this, every workflow crash permanently corrupts state on the affected row.

### Finding B — Contact enrichment for the 78-row enriched cohort

Nick paused this in tonight's session. He wants to inspect the 78 rows with his own eyes before committing to a contact-enrichment pipeline.

**What's needed when he's ready:**
- Audit the existing contact pipelines on the n8n instance. Saw several Apollo-related workflows + Hunter credentials earlier. Need to determine: which workflow takes a Company row as input, what title criteria are configured, and whether it can be pointed at the 78-row cohort or if we need a new variant.
- Confirm the title list for the AAV play. Likely something like process development, CMC, vector production, gene therapy program leads. May exist in a Segment Criteria artifact at `clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` (haven't verified).
- Check whether a Contacts table linked to Companies exists. Surface-verify the schema.
- Decide: people-by-company (enrich N targets per row) vs people-by-list (specific named contacts).

**Do not start this until Nick says so.** He wants to look at the cohort first.

### Finding C — Disqualified rows may want a more specific status later

We reused the existing `disqualified` enum value to mark the 5 Chinese biotechs + AskBio Inc as out-of-scope. If Nick later wants to distinguish reasons (e.g., `geo_deprioritized`, `out_of_scope_for_play`, `under_investigation`), that requires adding new options to the Enrichment Status singleSelect field. Not urgent. Mention only if he brings it up.

### Finding D — AskBio Inc was already disqualified before this session

Nick asked about this. We flipped it to disqualified again (no-op confirming intent) but never traced who/what originally set it. The Classification Notes field on AskBio's row should show evidence if any workflow wrote a reason. Worth a 5-minute inspection if Nick wants to know. Otherwise leave it.

## Engineering principles applied this session (carry forward)

- **Surface verification, not narration.** Every "this worked" was confirmed by GET-ing the live workflow + Airtable row. Multiple times the n8n API said the data was written when it wasn't (`$json` referencing wrong upstream in splitInBatches loops, URL constructor failing silently, Match Business reading from the wrong source node).
- **n8n active-runtime cache.** After every PUT, deactivate → 5s wait → activate. Observed at least 3x this session.
- **The Code node sandbox is not full Node.js.** The `URL` constructor doesn't work — throws silently. Use regex-based URL parsing. Suspect other globals may also be missing.
- **`$json` in splitInBatches loops is fragile.** Explicitly reference upstream nodes by `$('NodeName').item.json` to guarantee you read the right data.
- **`update_workflow` via MCP requires SDK reconstruction.** Use raw REST PUT instead — it preserves credentials and only requires the JSON workflow structure. `n8n_mcp_credentials_preserved.md` memory documents this.
- **Domain agreement beats name similarity.** When the resolver and Explorium both agree on a domain, trust the match even if the company names diverge. This is what unlocked parent-enrichment for subsidiaries.
- **Exa beats LLM resolvers for company-name → domain.** Exa is web-grounded; Claude hallucinated for ambiguous names (Baxalta → shire.com is the canonical example).
- **Parent-company enrichment is the right semantic for subsidiary rows.** CT.gov trial sponsors are often subsidiaries / legacy entities. The operating company today is what's useful for outbound. Brain Neurotherapy Bio → AskBio enrichment is correct, not a bug.

## Memories saved this session

| File | Type | Purpose |
|---|---|---|
| `n8n_mcp_credentials_preserved.md` | user | update_workflow via REST does NOT wipe creds in Nick's setup |
| `feedback_no_gate_jargon.md` | feedback | drop "Gate 1/2/v1.9.0" language; describe filters by what they do |
| `user_ellie_is_client.md` | user | Ellie is Teknova client, NOT teammate; never assign Ellie tasks |
| `feedback_no_puzzle_outputs.md` | feedback | lead with diagnosis, not tables with hedge phrasing |

Located in `/Users/nplmini/.claude/projects/-Users-nplmini-code-work/memory/`.

## Resume point — first actions for fresh session

1. **Read this file and the memories listed above.** Then read the prior handoff at `practices/agentic-systems/HANDOFF-revops-engine-quality-pass-2026-05-20.md` for context on the engine principles and earlier-session findings.
2. **Confirm workflow state.** GET `Z6RROKx5omdfvhtn` and verify versionId is `ff9f58c7-49fd-4fef-8d5b-1389740db585` or later. Verify all 9 credentialed nodes (8 Airtable + 1 — formerly Anthropic, removed when switching to Exa HTTP — actually now 9 Airtable, since Resolve Domain went from Anthropic credential to inline-API-key HTTP).
3. **Wait for Nick.** He's planning to inspect the 78 enriched rows with his own eyes. Do not start contact enrichment, do not propose new work. The system is in a clean checkpoint state.
4. **If Nick raises the GeneCradle stuck-state issue:** flip its Enrichment Status to blank + Run Selected = true. Then propose the reaper as a separate small build (Finding A above).
5. **If Nick raises contact enrichment:** start by auditing the existing Apollo/Hunter workflows on the instance. Don't build a new pipeline until you understand what's already there.

## Out of scope for fresh session

- Don't touch the 5 disqualified Chinese rows. Done.
- Don't touch AskBio Inc unless Nick asks for the Finding D inspection.
- Don't add new Enrichment Status enum options unless Nick requests it.
- Don't propose the stuck-state reaper as a build unless GeneCradle becomes a recurring problem.
- Don't build contact enrichment until Nick explicitly says so.

Idle-waiting on Nick's instruction is the correct state. The system is in a clean checkpoint. Don't invent work.

## Key references

- **Exa API key:** `470e14ee-bbe8-49cc-ad5d-8c8008bd7d05` (currently inline in the Resolve Domain HTTP node headers; sourced from Nick's `.claude.json` websets MCP URL)
- **n8n API URL:** `https://instig8.app.n8n.cloud/api/v1`
- **n8n API key:** in `~/.claude.json` under `n8n-mcp` env block
- **Airtable base:** `appYBYH3aOHhTODAw` (RevOps Surface)
- **Airtable Companies table:** `tblnj3YlOI3thjrXp`
- **Key field IDs:**
  - Enrichment Status: `fldyfIr4H4lSIYZdC`
  - Run Selected: `fldf1hOrwdRPJjLFD`
  - Domain: `fldEqSb37DpGNeKVt`
  - AAV Status (derived): `flddzxqtLU6gJwep7` (formula, returns "Active AAV" / "Former AAV" / "Not AAV")
  - Last Enriched At: `fldCVsgnVpsr2bz7m` (Last Modified Time scoped to Enrichment Status)
