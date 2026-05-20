# Handoff: Design Autonomous Enrichment Routine

**From:** Agentic Systems practice (Boris)
**To:** Next Boris session
**Date:** 2026-05-08
**Priority:** High -- this is the automation layer that removes Nick from the enrichment loop

## What we're building

A Claude Desktop Routine running on Nick's Mac Mini (always-on) that autonomously processes enrichment batches without Nick orchestrating each session. The routine fires on a schedule, reads the enrichment state from Supabase, processes the next batch of companies/contacts, writes results back, and exits. Nick checks results when he wants.

## What's been validated

On 2026-05-08, we ran a 3-company proof of concept and a 10-company batch through the enrichment-providers skill with no Clay. Results:

- **Provider stack works:** Explorium (company data + contact discovery via MCP), Hunter (email via HTTP API), Exa (modality verification via MCP), free sources (clinicaltrials.gov, PubMed). All connected.
- **Credit costs are known:** Explorium match/fetch = FREE, enrich-business = 1 credit, enrich-prospects profiles = 1 credit, enrich-prospects contacts = 5 credits. Hunter email-finder = 1 credit.
- **Context usage:** 10 companies consumed ~38% of Sonnet's 200K context window in ~4 minutes. Batches of 10-15 per session are sustainable.
- **Enrichment spec is complete:** `clients/teknova/artifacts/revops-enrichment-spec-aav-gene-therapy-ellie-outreach.md` defines every field, every procedure, every verification rule.
- **Provider skill is complete:** `practices/revops/skills/enrichment-providers/SKILL.md` maps every field to a specific provider and tool call.
- **API keys are in place:** `clients/teknova/revops/.env` has Hunter, Apify, ZeroBounce, Exa, Serper, Supabase service role key.

## What the routine needs to do

Each run:
1. Query Supabase for the next batch of unenriched companies in the active play (where `enrichment_status IS NULL`)
2. Pick 10 companies (or fewer if less than 10 remain)
3. Run the enrichment sequence per the enrichment-providers skill (Exa modality -> Explorium match -> Explorium enrich-business -> Explorium fetch-prospects -> Explorium enrich-prospects profiles -> Hunter email -> write to Supabase)
4. Apply the 9-check completeness gate per the enrichment spec
5. Compute scores per the scoring section in the enrichment spec
6. Update the operations inventory with credit balances
7. Write a short log entry: how many companies processed, how many contacts found, credits consumed, any errors
8. Exit cleanly

If fewer than 10 companies remain unenriched, process whatever is left and mark the play's enrichment as complete.

## Design decisions needed

1. **Claude Desktop Routine vs /loop vs /schedule:**
   - Desktop Routine is the current recommendation. Persistent, survives restarts, fires on schedule, runs locally with full MCP access.
   - Need to confirm: does a Desktop Routine have access to Claude Code's MCP tools (Explorium, Exa, etc.)? Or is it limited to Desktop's tool set?
   - If Desktop Routines can't access MCP tools, fall back to: a `/loop` command in a Claude Code session on the Mac Mini, or a `/schedule` remote trigger if MCP servers are cloud-reachable.

2. **Batch size:** 10 is safe for context. Could we push to 15? The 10-company test used 38% context. 15 might use ~55-60%, leaving room for error handling.

3. **Schedule frequency:** The enrichment is not time-critical. Every 2 hours during business hours (8am-6pm CT) would process 50 companies/day. Every hour would do 100. What pace does Nick want?

4. **Cost guardrails in autonomous mode:** The $5 rule requires Nick's approval. In autonomous mode, the routine can't ask Nick. Options:
   - Set a per-run credit cap (e.g., 50 Explorium credits per run = ~10 companies with contacts). If the cap is hit, stop and log the reason.
   - Set a per-day credit cap (e.g., 200 Explorium credits/day).
   - Pre-approve a total budget for the play ("spend up to 500 Explorium credits on this play").

5. **Error handling:** What happens when a provider call fails mid-batch? Options:
   - Skip the failed company, log it, continue to the next
   - Retry once, then skip and log
   - Stop the entire run and log for manual review

6. **State management:** The routine needs to know where it left off. Current approach: query Supabase for `enrichment_status IS NULL` each run. This is self-healing -- if a run crashes mid-batch, the next run picks up whatever wasn't written. No separate state file needed.

7. **Logging:** Where do run logs go? Options:
   - A Supabase table (`enrichment_run_log`: timestamp, companies_processed, contacts_found, credits_consumed, errors)
   - A markdown file appended per run (`clients/teknova/revops/context/enrichment-run-log.md`)
   - Both

## Key files to read

- `practices/revops/skills/enrichment-providers/SKILL.md` -- the provider mapping
- `clients/teknova/artifacts/revops-enrichment-spec-aav-gene-therapy-ellie-outreach.md` -- the enrichment spec (fields, procedures, scoring, completeness gate)
- `clients/teknova/revops/CLAUDE.md` -- quick reference with Supabase queries, play ID, file paths
- `clients/teknova/artifacts/teknova-operations-inventory.md` -- current system state, credit balances
- `clients/teknova/revops/.env` -- API keys
- `~/code/work/reference/apify-actors-b2b-enrichment.md` -- Apify actor reference (fallback for LinkedIn if Explorium gaps appear)
- `practices/agentic-systems/reference/clay-replacement-research-2026-05-08.md` -- research on why we dropped Clay

## Context from today's session

- The enrichment system was built in a single day (2026-05-07) and validated on 2026-05-08
- 53 contacts were marked cadence-ready for PLAY-006 before the Clay-free system was built
- The discovery run found 107 total companies (49 net new). Most are not yet enriched.
- Nick's primary frustration: having to sit in the loop orchestrating each batch. This routine is the fix.
- Perplexity quota is exhausted as of 2026-05-08. Use Exa for web search until it resets.

## Option D: n8n workflow with Explorium MCP + Claude

Discovered 2026-05-08: an n8n template exists that connects Explorium MCP directly to n8n via SSE (`mcp.explorium.ai/sse`), uses Claude as the AI agent for per-record reasoning, and processes records in a batch loop. Template saved at `practices/revops/skills/enrichment-providers/n8n-explorium-template.json`.

This eliminates the context window problem entirely. n8n handles the orchestration loop (no context limit), Claude handles the judgment calls per-record (is this AAV? does this contact match the ICP?), and Explorium MCP provides the data. Could process 500 companies in one run.

**Evaluate alongside Options A-C.** The tradeoff: more robust and scalable, but requires building and maintaining an n8n workflow instead of running the enrichment spec directly in a Claude session. Nick already has n8n infrastructure (instig8 instance) and experience building workflows.

## What success looks like

Nick starts the routine. He walks away. He comes back hours later and the Supabase tables have enriched companies and contacts with scores, provenance, and verified emails. The operations inventory is updated with credit balances. A log tells him what happened. No intervention required.
