# PLAN — Salesforce status summary for Ellie (mirror-backed)

**Owner lane:** Workflows. **Status:** plan, not started. **Builder executes via this file; agentic-systems surface-verifies every step.**
Supersedes the earlier live-SF-pull draft of this plan. Architecture is now settled: **no live Salesforce API calls.**

## Purpose (what Ellie needs)

When Ellie reviews a target company in the RevOps Surface, she must instantly see whether Teknova's Salesforce already shows that company as active/engaged with another Teknova salesperson — so she knows whether to **avoid making contact**. Output is a short, plain status summary on the company record, including **when it was last contacted** and the relevant narrative.

## Data sources (settled)

Salesforce data already lives in the Schema Map base `app5wdHwgM1SPNxcx`, kept current by the native Salesforce↔Airtable sync. Salesforce labels a company two ways; we read both:

- **Account** → `ME_Account_Mirror` (`tblUgxKdATinoBMcR`). Key fields: `Account ID`, `Account Name`, `Account Owner`, `Last Activity` (date), `Type`, `Rating`, `Last Modified Date`.
- **Opportunity** → `ME_Opportunity_Mirror` (`tbli8VKcXxc5qF7US`). Key fields: `Account Name`, `Account ID`, `Opportunity Owner`, `Stage`, `Amount`, `Close Date`, `Created Date`, `Closed` (checkbox), `Last Modified Date`, `Next Step`.

Scope is **Account + Opportunity only**, per Nick. `ME_Contact_Mirror` is explicitly out of v1 (possible later enrichment, not now — do not expand scope).

## Target (where the summary lands)

RevOps Surface base `appYBYH3aOHhTODAw`, Companies table `tblnj3YlOI3thjrXp`. Update the existing company row (no new rows). This is the source the review surface syncs from — never write Ellie's Outreach base directly.

## Gate 1 — investigation, before building anything (builder does this first, reports refs)

1. Confirm `ME_Account_Mirror` and `ME_Opportunity_Mirror` are the native-synced record tables (populated, recent `Last Modified Date`). Report row counts + newest Last Modified as references.
2. On Surface Companies `tblnj3YlOI3thjrXp`, report the exact existing SF-related fields and their field IDs (seen so far: `SF Has Open Opp`, `SF Has Closed Won`, `Current Customer`, `Account-Level DNC`) and whether the table carries an **SF Account ID** or a **website/domain** field. This decides the match key. Do not assume — report what exists.

Stop after Gate 1 and report. agentic-systems confirms the match key and field targets before build.

## The match (load-bearing — the real risk)

Surface company → SF mirror rows. No guaranteed shared key. Deterministic, in priority order:
1. If Surface Companies already carries an SF `Account ID` → exact join on `Account ID`. Best case.
2. Else website/domain exact match if both sides have it.
3. Else normalized company-name match (same normalization family as the L1 dedup / employer-norm work: lowercase, strip `holdings|holding|plc|group|limited|international|inc|llc|corp`, collapse whitespace).
Record a **match confidence** (`exact_id` / `domain` / `name` / `none`). A `name`-only match with multiple SF accounts of similar name → mark `ambiguous`, do NOT pick one silently; write the ambiguity into the summary so Ellie sees it. No match → explicit "No Salesforce record found" (a real, useful answer for her).

## Derivation rules (deterministic — facts are NOT model-generated)

From the matched mirror rows, compute deterministically and write to the existing Surface Companies fields:
- `Current Customer` = true if a matching Account exists with any `Closed Won` opportunity.
- `SF Has Open Opp` = true if any matched Opportunity has `Closed` = false.
- `SF Has Closed Won` = true if any matched Opportunity `Stage` is Closed Won.
- `Account-Level DNC` = true if the mirror exposes an account DNC/opt-out (confirm field in Gate 1; if none, leave untouched, do not invent).
- **SF Last Touch** (new field if absent — confirm in Gate 1): most recent of Account `Last Activity` and any matched Opportunity `Last Modified Date`.
- **SF Status Summary** (new short-text field): see below.

## The summary (recommended deterministic, not LLM)

Recommendation: build the summary as a **deterministic template string**, not an Anthropic node. This session has repeatedly been burned by LLMs fabricating facts (invented opp amounts, fake people). A template over the derived facts is trustworthy and filterable. Example shapes:

- `No Salesforce record found.`
- `Active: owned by {Account Owner}; 1 open opportunity "{Opp Name}" at {Stage}, ${Amount}, close {Close Date}. Last touch {SF Last Touch}. Avoid outbound — an AE is engaged.`
- `Known account (no open opp); prior Closed Won {date}. Owner {Account Owner}. Last touch {SF Last Touch}.`
- `Account exists, no opportunities, last activity {date}.`
- Ambiguous: `Multiple Salesforce accounts match "{name}" — needs human disambiguation.`

If Nick wants prose synthesis beyond a template, an Anthropic node is allowed **only** fed the already-derived facts, explicitly forbidden from adding any fact not in its input. Default to template; escalate to LLM only on Nick's call.

## Trigger / idempotency / selective-run (engine standard)

- Manual trigger only. Workflow stays `active = false` (the standing schedule-trigger incident rule).
- Idempotent: update the matched company row's fields in place; re-runs overwrite, never duplicate.
- Selective-run: honor the `Run Selected` checkbox + a **static** Airtable filter formula (never a dynamic n8n expression — that is a known live failure). Default scope when nothing selected: companies missing an `SF Last Touch` / summary, or all surfaced companies — confirm with Nick at Gate 1.

## Decisions (settled by Nick 2026-05-19)

1. **Recency window = 90 days** on `SF Last Touch` for "active/engaged" wording. Settled.
2. **Deterministic template summary.** No Anthropic node. Settled.
3. **Default scope when nothing is selected = re-derive ALL surfaced companies.** Rationale: the source is local Airtable mirror data (zero API cost to re-run), and SF state changes — an opportunity can open or close between runs. A stale "safe to contact" is actively dangerous for Ellie, so every run must re-derive, not skip already-summarized rows. `Run Selected` only narrows the set; absence of selection = full surfaced re-derive. (Proposed; Nick to confirm.)

## Build phases (each ends with builder reporting refs; agentic-systems verifies)

- **P1:** Gate-1 investigation. Report mirror table state + Surface SF field inventory + match-key availability. STOP.
- **P2:** Build match + deterministic derivation + template summary. Deploy inactive. Report workflow/version IDs + node config refs.
- **P3:** Selective test on 3–5 known companies (at least one expected open-opp, one no-record). Report execution ID + the exact written field values. agentic-systems independently re-pulls and verifies the summary matches the mirror rows.
- **P4:** On clean verify, ready for selective/broader run on Nick's go.

## Folder rationale

Workflows lane. It feeds the Surface base and Ellie's review, same as contact-sourcing and the engine workflows. Explorium-Direct is the discovery/classify/currency lane specifically; this is not that. A dedicated folder for one workflow would over-structure ahead of reality. Keep here.
