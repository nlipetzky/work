# HANDOFF: Week Planning + System Admin

**Date:** 2026-06-01
**Persona:** Boris (agentic-systems)
**Purpose:** Hand the next session a clean planning prompt. The prior session shipped a live campaign and surfaced several structural gaps. This handoff sets up an admin-focused session to triage gaps, update the system registry, monitor the live campaign, and plan Nick's week.

---

## What the prior session produced

In short: the expert-to-campaign workflow ran end-to-end for the first time, surfaced real gaps, and put 16 manufacturer CEOs into Will Rosellini's LinkedIn outbound. Two definitive workflow docs were written. Liaison base substantially expanded.

Full session summary in chat transcript. Don't re-do that work. Use this handoff and the two reference docs below.

## Read these first

1. `/Users/nplmini/code/work/practices/agentic-systems/reference/expert-to-campaign-workflow.md`
2. `/Users/nplmini/code/work/practices/agentic-systems/reference/revops-engine-workflow.md`

Both have an "Open gaps in priority order" section at the bottom. Those are the structural items to plan against.

---

## State at session end

### Live

- **Campaign `449970` "Med Device Robotics"** in HeyReach, status `IN_PROGRESS`. Sender = Will (account `158703`). Uses list `699666` (16 verified manufacturer CEOs).
- 17-hour metrics: 16 connect requests sent, 1 accepted (Ken Manning, formerly MedAcuity, now Insight Principles), 1 DM auto-sent, 0 replies.
- Will's LinkedIn auth valid, Sales Navigator active.

### Paused

- **Campaign `448510`** (84 wrong leads). Don't resume. Old list `697304` should be archived but not deleted (record of what was wrong).
- **Campaign `337687` "Teknova Large Pharma"** (734 leads, paused since Feb 2026). Out of scope for this planning session; revisit only if Teknova engagement decisions surface.

### Approved and shipped

- **Draft Variant C** (`recEhOWoEvdLATq0Q`) ... approved by Will with edits, copy live in HeyReach sequence. Variants B and D held as `pending_will_review`.

### Substrate state (Liaison base `appbFsdqrC5vnxuIR`)

- 10 tables (3 original + 7 added: Experts, Core Offers, Intents, Prompts, Draft Variants, Copy Generation, Conversations).
- Will Rosellini populated across 4 vectors.
- 5 Core Offers active: Medical Device Robotics, AI Advisory + IP Retainer, AI Enterprise Audit, RevOps Engine, Govt R&D Arbitrage Advisory.
- 4 Intents active (1 per offer-relevant vector).
- Prompts v0 (historical email) + v1 (LinkedIn DM, Missing-Signals-aware).
- 4 Draft Variants logged (1 historical email + 3 medical device robotics LinkedIn).
- Conversations table empty (no calls logged yet).

---

## Decisions needed this week

### Monitoring cadence for live campaign

- Pull stats at 72-hour mark (Tuesday EOD). Target: connection acceptance rate, DM reply rate.
- Decide thresholds: at what acceptance rate do we declare the cohort warm? At what reply rate do we move to scaling? At what point do we kill and rebuild?
- Decide what to do with Ken Manning's DM 1: he accepted, the message went, he's no longer at MedAcuity. Worth a personalized human follow-up from Will or let auto-sequence finish?

### Three role-changes detected

The HeyReach lead enrichment surfaced role changes on at least 3 of 16 leads:
- Russell Singleton ... was Medrobotics President, now Russ Singleton Consulting (independent)
- Marty Emerson ... was Monteris CEO, now Nuwellis Board (less active)
- Ken Manning ... was MedAcuity, now Insight Principles

These were ~19% of the list. Decide whether the connect notes that went out are still useful given the role changes, or whether to manually stop those leads.

### Variants B and D fate

Hold, send Will another review email, or rebuild against the corrected list? B and D both have promised-asset CTAs that need either Will building the asset or rewording the CTA.

### Old campaign `448510` and old list `697304`

Archive or delete? Recommend archive (keep as record of what bad-list looks like; useful for the audit-step build).

---

## Structural gaps in priority order (for week planning)

From the two workflow docs, ranked by impact:

### Tier 1 ... build this week if possible

1. **Pre-send list audit**. The 84-bad-leads incident validated this gap is real. Automated Boris-classify-against-Offer-Audience criteria. Without this, next campaign repeats the failure. Highest-impact build.

2. **Pre-send role-freshness check**. Surfaced by the Ken Manning / Singleton / Emerson observations. A lightweight script that re-verifies current LinkedIn position vs stored company name. Decide hold / personalize / send anyway per lead.

### Tier 2 ... worth scoping this week, building next

3. **Structured List Build Spec field on Core Offers**. NAICS codes, title regex, revenue source, exclude rules. Without this, the audit step has nothing to classify against. Foundational for Tier 1 #1.

4. **Source-of-truth Clay query log on each list**. Stored on the list record. Lets us trace failed lists to their query and fix the criteria. Foundational for Tier 1 #1.

5. **Documented schema for revops-engine-dev Supabase project**. revops-engine-workflow.md has multiple **[INFERRED]** sections that need this. Without it, the RevOps Engine doc is half-built.

### Tier 3 ... defer

6. Hermes Gmail intake (labeled threads → Exchanges). Manual paste works for now.
7. Multi-variant Workflow-tool script for parallel variant generation. Manual is fine until volume justifies.
8. Per-prospect personalization workflow (Copy Generation auto-population).
9. Conversation signal extraction workflow.
10. HeyReach webhook → Conversations auto-population on reply.

---

## System registry candidates

The prior session summary named these. Update the KAI System Registry (Airtable Assets table) with the rationale captured in the summary:

1. **Liaison Base v2 (expanded substrate)** ... already in registry; add a version note covering the 7 new tables and the customer-discovery loop role.
2. **expert-to-campaign-workflow.md** ... new entry. Parallel to the Expert Liaison Methodology already registered.
3. **revops-engine-workflow.md** ... new entry, paired with #2.
4. **Conversations table** ... captured as a sub-entity of Liaison Base v2; don't register standalone.
5. **HeyReach MCP user-scope install** ... register as vendor connection; every venture / client engagement can now operate HeyReach from any Claude Code session.

For each entry: name, category (platform / methodology / vendor / data substrate), owner, location, status, version.

---

## Suggested agenda for the new session

```
Phase A (15 min) ... orient
- Read this handoff + scan the two workflow docs' open-gap sections.
- Pull current campaign 449970 stats via HeyReach MCP. If acceptance rate has moved, note it.

Phase B (30 min) ... decisions
- Decide on Variants B and D fate.
- Decide on old campaign / list archival.
- Decide on Ken Manning DM 1 follow-up + the 3 role-changes.
- Decide monitoring cadence and thresholds.

Phase C (45 min) ... registry update
- Open KAI System Registry.
- Add the 4 new entries per the candidates list.
- Update Liaison Base entry with v2 notes.

Phase D (60 min) ... gap prioritization + week plan
- Walk the Tier 1 and Tier 2 gaps.
- For each, estimate effort and decide go / defer.
- Slot the chosen gaps into specific days this week.
- Identify any blockers (Will availability, vendor accounts, missing data).

Phase E (15 min) ... close
- Write a new HANDOFF if any items roll forward.
- Schedule any monitoring tasks (use the schedule skill for 72-hour HeyReach pull).
```

---

## What NOT to do in the new session

- Don't generate new copy variants. Wait for current campaign signal first.
- Don't expand the Liaison base schema. The current shape is right; what's missing is the audit step.
- Don't touch the lab bench HTML or experts.html files. They're abandoned in favor of Airtable surfaces.
- Don't restart any paused campaigns without conscious decision.
- Don't add new offers unless a real conversation surfaces a new vector.

---

## Pickup pointer

Launch from `/Users/nplmini/code/work/practices/agentic-systems/`. Invoke Boris. Read this handoff. Run the agenda above. Most of the work is decisions and registry updates, not new code.

If the new session expands scope (e.g. decides to build the list audit step), that's its own focused session ... write a fresh handoff before starting the build.
