# Weekly Client Update — Canonical Template

**Cadence:** End of every week, for every active client engagement.
**Output:** Markdown artifact at `clients/<name>/artifacts/email-<recipient>-update-<YYYY-MM-DD>.md`.
**Audience:** The client's primary operator (e.g., Ellie at Teknova), with relevant stakeholders cc'd.

## Why this format

The client should leave each weekly update knowing three things without having to ask:

1. **What the system is doing on their behalf** (the pipeline, end to end, with vendor names and volumes — so the scale of paid third-party work is implicit context).
2. **What changed this week** (shipped work + findings).
3. **What lands next week** (specific, dated commitments).

The pipeline-activity footer at the bottom is non-optional. It is the load-bearing piece that quietly communicates the scope of paid data work without ever needing to discuss invoicing.

## Section structure

Use these sections in this order. Adapt section names per client but keep the structure.

### 1. Subject + header
- `**To:** <primary recipient>` and cc list
- `**Subject:** Update since <last touchpoint>... <one-line headline>`

### 2. Opener (1-2 lines, no preamble)
- State why this update exists. No "I hope you're well." No restating the prior conversation.
- Example: "Big week behind the scenes. Here's the full pipeline as it stands now, what shipped since Thursday, and what's next."

### 3. Pipeline overview, end to end
- Walk the client's pipeline stage by stage as it currently operates.
- For each stage: what it does, what third-party tools (named) are doing the work, what numeric volumes are flowing through.
- This is the longest section. It is also the section that does the work of contextualizing third-party data spend. Name vendors casually and in passing — never apologize for using them.
- The first time this section is written for a client, write it fully. In subsequent weeks, lead with "Pipeline state unchanged since last week" or describe deltas only.

### 4. Funnel recap, as a table with a data-layer column
- Show how the count narrows from raw signal at the top to outreach-ready (or production-ready) at the bottom.
- Columns: `Stage | Surviving count | Third-party work`
- This is where the cost story lands visually. The third-party-work column communicates volume of paid pulls per stage.

### 5. What shipped this week
- The new workflows / fields / corrections / findings landed since the last update.
- Specific. Concrete. Reference workflow IDs, field names, record counts.

### 6. Findings worth surfacing
- Pattern-level observations the client should know — data quality issues with sources (Apollo, Salesforce, etc.), structural insights about their domain, results from audits.
- One sentence per finding, then the supporting numbers. Link to long-form artifacts for the deep version.

### 7. Still on my list
- Numbered list of commitments for next week. Each item is specific and demonstrable.
- Avoid vague language ("explore", "look into"). Use "build", "ship", "verify", "add".

### 8. Pipeline activity footer (REQUIRED, every week)
- Single bolded line: `**Pipeline activity this week**`
- One paragraph below: comma-separated list of activities + named vendors + volumes.
- Format: `<volume> <activity> (<vendor>) · <volume> <activity> (<vendor>) · ...`
- Example: `3,035 signals captured (PubMed + ClinicalTrials.gov) · ~2,000 LLM classifications (Anthropic Claude Haiku) · 92 Explorium company enrichments · ...`

### 9. Sign-off
- First-name only. No corporate signature block.

## Voice and style rules

These match Nick's global preferences and apply to every client update:

- **No em dashes.** Use ellipses (`...`) if a pause is needed.
- **No emojis.** Unless the client uses one first.
- **No corporate hedging.** No "I hope this finds you well", no "Let me know if you have any questions."
- **No "we're covering this" language about costs.** The vendor list and volumes do the work. Saying it explicitly undercuts the message.
- **No dollar amounts.** Per-unit cost is OK if tossed off as an incidental fact about a workflow ("Apify pulls ~$0.004 each"). Never aggregate to a total spent.
- **No apologies for using paid tools.** State what was used.
- **Terminal-friendly markdown only.** No decorative tables, no horizontal rules as visual filler, no nested code fences.
- **Peer-to-peer tone.** Talk to the recipient as a smart colleague, not a customer.

## File-path conventions in the artifact

When referencing artifacts inside the email (publication analyses, segment criteria, prior handoffs), use absolute paths formatted as clickable markdown links where the visible link text is also the full absolute path:

```
[/Users/nplmini/code/work/.../foo.md](/Users/nplmini/code/work/.../foo.md)
```

This applies both inside the email body (for Nick's review) and any output to chat.

## How to invoke this template

When asked to draft a weekly update for client X:

1. Read this template first.
2. Read the client's CLAUDE.md and recent handoffs in `accounts/clients/<name>/` and any practice handoffs touching that client this week.
3. Pull current numbers from the client's Airtable / system of record.
4. Synthesize into the structure above. Do not skip the pipeline activity footer.
5. Save to `clients/<name>/artifacts/email-<recipient>-update-<YYYY-MM-DD>.md`.
6. Return only the absolute path (as a clickable markdown link) + 2-3 bullet summary of what's in it.

## Reference exemplar

The Teknova update at `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/email-ellie-update-2026-05-22.md` is the canonical example. Future updates should match its shape and tone.

## Not-yet-built: autonomous weekly cadence

This template assumes Nick invokes the weekly update manually. If he wants the cadence to run autonomously (e.g., Friday afternoon for every active client), use `CronCreate` or `/schedule` to fire a per-client trigger that opens a fresh session in the client's working directory and runs through the steps above. Worth proposing if the manual cadence slips.
