# Explorium Process Synthesis -- Draft v0.1

Source: Explorium NotebookLM (15 sources, course material + n8n masterclasses + Explorium x n8n templates), queried 2026-05-13.

This doc compresses what Explorium themselves teach into a single process. It's intentionally provider-flavored and not yet adapted to our RevOps pipeline. The adaptation step comes next.

---

## 1. The core philosophy (3 lines)

- Your agent is only as good as your data. Clean, harmonized, refreshed.
- Always get IDs first, then enrich. Match/Fetch returns IDs; Enrich/Events consumes them.
- Narrow-responsibility agents beat do-everything agents. Split research from writing. Split qualify from enrich.

## 2. The canonical pipeline (Explorium's prescription)

```
Trigger -> Match/Fetch (get IDs) -> Gate (IDs not empty?)
       -> Light Enrich (firmographics) -> Qualify (ICP fit)
       -> Deep Enrich (technographics, events, competitive)
       -> Find prospects at qualified accounts
       -> Enrich prospect contacts
       -> Research agent -> Email writer agent
       -> Output as DRAFT (human-in-the-loop)
```

### Stage 1 -- Trigger
- Inbound: new CRM lead, form submission, free-trial signup.
- ABM: high-scoring account from the inbound agent.
- Meeting prep: Google Calendar event, filtered to external attendees.
- Outbound: natural-language query from a chat surface.
- Always pull initial trigger data via native n8n nodes / HTTP, not the AI agent.

### Stage 2 -- Match / Fetch (free or cheap, get IDs)
- **Match** if you already know the company/person. Returns one ID. Costs zero credits for the match itself.
  - Business: domain alone is enough; name+domain is stronger.
  - Prospect: needs business_id + (email OR LinkedIn URL OR name). Name alone is insufficient.
- **Fetch** if you're discovering net-new. Returns a paginated list of IDs.
  - Business filters: country, state, employee count, revenue range, NAICS/SIC, category.
  - Prospect filters: business_ids, job level, department, job title, has_email, has_phone.
- **Statistics** (run before Fetch): aggregated TAM sizing. Confirms market size before you spend credits.

### Stage 3 -- Validity gate (cheap insurance)
- IF node immediately after Match: business_id is not empty? else skip the loop.
- Same gate after prospect Match.
- This is non-negotiable in their templates. Saves credits on enrichment.

### Stage 4 -- Light enrich + qualify
- Enrich business with firmographics + technographics first. These are cheap signals that decide whether the rest of the credits are worth spending.
- AI agent reads the enriched record + scoring criteria, outputs `hot | nurture | cold` + a structured reason.
- IF node routes only `hot` (or hot+nurture) into the deep path.
- Explicit anti-pattern: don't use a simple point-based lead score. Use an LLM that reads the enriched bundle and reasons.

### Stage 5 -- Deep enrich (high-priority only)
- Add competitive landscape, strategic insights, workforce trends, business events.
- Business events specifically -- product launches, funding, office openings, partnerships -- are the "hot now" signal that justifies cold outreach.
- Events default window: last quarter / last 3 months.

### Stage 6 -- Prospect discovery (per qualified account)
- Fetch Prospects with business_id + role filters (job level, department).
- Turn on auto-pagination so each contact becomes a separate item.
- Validity gate again on prospect_id.
- Enrich prospect: contact info (email + phone), professional profile, LinkedIn posts.

### Stage 7 -- Two-agent message generation
- **Research agent**: takes the enriched bundle + Explorium MCP, supplements with any missing context, produces a research note (pain points, tech stack, recent activity).
- **Email writer agent**: takes the research note, drafts a single message. References role, company context, soft CTA. Outputs structured JSON (subject, body, recipient_email).
- Pass through `Loop Over Items` with batch size 1. AI agent nodes do not auto-paginate.

### Stage 8 -- Draft, never send
- Output node creates a Gmail / Outlook / Lemlist / Outreach **draft**.
- Human reviews and sends.
- Graduate toward autopilot only after the agent has earned trust on the specific motion.

## 3. The five canonical agents Explorium ships

| Agent | Trigger | Output |
|---|---|---|
| Slack AI Agent | Slack message | Natural-language query against Explorium data |
| Inbound GTM Agent | New CRM lead | Qualified Salesforce task with talking points |
| ABM Expansion Agent | High-scoring account | Additional contacts at that account in the CRM |
| Meeting Prep Agent | Calendar event | Prep brief to Slack the morning of the meeting |
| Outbound GTM Agent | Natural-language prompt | Personalized cold-email drafts in inbox |

All five share the Match -> Validity Gate -> Enrich -> Agent -> Draft skeleton. They differ only in the trigger and the final output node.

## 4. Anti-patterns Explorium explicitly warns against

1. **One do-everything agent.** Black box, undebuggable, brittle. Split by responsibility.
2. **Match without a validity gate.** Wastes credits and breaks downstream nodes when a domain doesn't resolve.
3. **Skipping the light-enrich qualify step.** Pulling deep enrichments on unqualified accounts burns money.
4. **AI agent without a `Loop Over Items` wrapper.** Agents don't auto-paginate; you'll process item 1 and silently drop the rest.
5. **Auto-send outreach.** Always draft, always human-review.
6. **Trusting LLM-generated API calls without validation.** Use an IF node + code node to validate filter values against the allowed schema; loop bad calls back to the LLM.

## 5. What Explorium does NOT teach (gaps we need to fill)

- Cadence structure, sequencing, deliverability, suppression lists, reply routing. Explorium said these are covered in their live hackathons, not in the course.
- Parent/subsidiary handling (Apple vs. Apple Films, Thermo Fisher vs. its sub-brands).
- Deduplication mechanics across multi-source enrichment.
- Source attribution / provenance per enriched field.
- What to do with the "matched but no AAV signal" type bucket. Their qualify step is binary; ours is multi-bucket.

These gaps are exactly where our RevOps pipeline already adds value over the vendor's prescription.

---

## Open questions for the synthesis -> our process step

1. Where does our existing 5-stage pipeline (Offer -> Segment -> Discovery -> Enrichment -> Handoff) absorb Explorium's templates, and where does it diverge?
2. Do we adopt their narrow-responsibility agent split inside our enrichment stage, or treat it as a separate stage?
3. The validity gate + light/deep enrich split is already implicit in our Teknova workflow (gate v1.5.0). Should we promote that to a documented standard for all clients?
4. The "Statistics-first TAM check" is essentially our Discovery stage. Confirm.
5. The five canonical agents map cleanly to plays. Treat each as a playbook template.
