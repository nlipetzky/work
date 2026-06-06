# Phase 2 Decision: Contact Sourcing Architecture & Targeting

**Date:** 2026-06-03
**Status:** Design locked, build pending (capture + router to be built to spec, validated against a real blob).
**Grounding:** deep-research run 2026-06-03 (verified, 105 agents) + clay-com skill + Phase 1 company pipeline.
**Companion spec:** `clay-json-spec-contacts.md` (the Clay dispatcher contract).

---

## The question

Companies are sourced/qualified in Clay and flowing to Airtable (Companies + Company Events) via the live capture → Supabase → router loop. Now we source the PEOPLE at those companies. Three decisions: (1) who to target, (2) how many + which Clay method, (3) where contact blobs land.

## Decision 1 — Who to source (buying committee)

Selling lab/process-development and antibody-manufacturing services. Source the **technical committee at Director level and above**; two independent CDMO-selection sources agree on composition.

**Active technical buyers + champions (primary):**
- Process Development / Process Sciences
- Manufacturing Sciences & Technology (MSAT)
- CMC
- Bioprocessing / Bioprocess (Upstream, Downstream)
- Analytical Development / Analytical Sciences
- Technical Operations / Tech Ops
- Cell Line Development, Drug Product / Formulation

**ngAbs-specific champions (judgment add — sources were NOT modality-specific):**
For ADC / bispecific / multispecific targets, add: Conjugation Chemistry / Bioconjugation, Payload / Linker, Developability / Protein Engineering, Analytical Characterization. This is Teknova-ICP reasoning, not in the verified sources — treat as a hypothesis to test.

**Economic-buyer gate:**
- Procurement / Strategic Sourcing / Outsourcing
- Executive: VP/SVP Operations, COO, CSO, CTO, Head of Manufacturing

**Do NOT over-source** QA, Regulatory, Finance/Legal. They gate full-CDMO outsourcing decisions but disengage for standalone lab/process services — the committee compresses. (Verified caveat.)

**Decision-map:** CMC / Operations owns process-dev/scale-up needs = primary technical buyer. Process Dev / MSAT / Bioprocessing / Analytical = champions and requirement-definers. Procurement + Exec = economic gate.

## Decision 2 — How many + which method

- **Method: account-anchored.** Because we already have a qualified company list, use Clay's **"Find People at These Companies"** with title filters, NOT a standalone people search. Keeps contacts linked to accounts (critical for the Company link in Airtable). Standalone "Find People" is only for when you have no company list. (Clay self-doc, but correct for our case.)
- **Number: start ~5 contacts/company across 2 departments (technical + economic), scale toward ~9** across 2-3 departments. Benchmark is ~9/account (6sense 2026 BDR data); treat as central tendency, not a target. Smaller biotechs run leaner committees (functions collapse into 1-2 people) — size the count to company size.
- **Clay knob:** "Find People at Company" returns 10 full profiles/row by default — plenty. Skip "reduce data for more results" mode (name+LinkedIn only); we want full profiles for a committee.

## Decision 3 — Data architecture

**Separate `clay_contacts_raw` landing table + own trigger + own contacts router.** Built (table live in revops-engine-dev).

The research cited GitLab's table-per-entity standard, but that's a **relational foreign-key argument that does NOT transfer** to a schemaless JSON landing layer with no FKs (verified caveat). So ignore the stated reason. The conclusion still holds for us on different grounds:
- Contact payloads are a totally different shape (name/title/email/linkedin) — zero shared parsing with the company fan-out.
- Different targets (Contacts + Contact Events), different dedupe key (LinkedIn URL / Email vs Domain).
- Decoupling: the working company router stays untouched; the contact router evolves independently.

A single table + entity discriminator only wins if the two shared shape/target/logic. They don't. Marginal cost of "separate" is low — we clone the proven pattern (hash dedup, pg_net trigger, router).

## Architecture (mirrors Phase 1)

```text
Companies Clay table
  → "Find People at These Companies" (title filters = committee)
  → Send Table Data → Contacts Clay table (new)
       → HTTP dispatcher column → contacts capture webhook
  → land in Supabase clay_contacts_raw (hash dedup)
  → pg_net trigger on INSERT → contacts router webhook
       → Resolve Company (by domain) → link
       → Upsert Contact (dedupe on LinkedIn URL / Email) → Contacts table
       → Fan Out contact signals → Contact Events
       → Mark Processed
```

## Build sequence (next)

1. Clay: add "Find People at These Companies" + title filters + Send Table Data → Contacts table + HTTP dispatcher (per `clay-json-spec-contacts.md`).
2. n8n: contacts capture workflow (webhook → land in clay_contacts_raw). User creates the webhook node.
3. n8n: contacts router (webhook → Resolve Company → Upsert Contact → Fan Out Contact Events → Mark Processed). Built to spec, validated against one real blob before activating (same discipline that caught the job/trial field-name mismatches in Phase 1).
4. Supabase: pg_net trigger on clay_contacts_raw → contacts router URL.

## Update 2026-06-03 — Playbook integration + architecture correction

Folded in `Teknova ngAbs Outreach Playbook v1`. Two consequences:

1. **People must be rows in Clay, not an array-in-cell.** Email enrichment + verification run per person and Clay enriches per row. So we use "Find people at these companies" as a SOURCE (one row per person), NOT the "push the people array to Supabase and fan out in n8n" approach (that was briefly considered and rejected — Clay can't per-person-enrich an array-in-cell). `clay_contacts_raw` lands one row per person; the router upserts one Contact per row (no array fan-out).

2. **Screening split (from Playbook Sections 4-8):**
   - **Clay:** title screen (approved/excluded keyword lists, short-circuit to save credits), LinkedIn current-role verify, email enrichment (waterfall), email verification. Clay's strength; keep here.
   - **n8n router:** company link, dedupe upsert, CRM 6-month suppression (Salesforce query — needs CRM state, time-sensitive), final status tagging. Governance/state/version-controlled logic; keep in the pipeline.
   - Company gates G1-G5 already satisfied upstream (only qualified companies feed the people source).
   - All 7 required output fields (Playbook 8) map to existing Contacts columns. Status fields (Role Status, Email Verified Status, DMU Tier, etc.) already exist in the schema.

Detail and the title keyword lists live in `clay-json-spec-contacts.md`.

### Decisions locked 2026-06-03

- **D1 — CRM suppression timing:** store the raw Salesforce `last_activity_date` on the Contact at sourcing (router queries SF by email, then name+company); compute suppress/eligible at a **send-time gate** (`eligible = activity null or > 180 days from today`). Keeps the trailing-180-day window accurate at send. Requires a small Contacts schema add: `Last CRM Activity Date` (date).
- **D2 — Contact dedupe key:** **Email primary, LinkedIn URL fallback.** Avoids duplicating SF-sourced contacts that lack a LinkedIn URL.

## Verified-but-don't-cite (refuted in research)

5-archetype Champion/Economic/Technical/Blocker model; "13 stakeholders" as a target; UserGems 2-3 contacts / 6X win-rate; 44/28 department win-rate split. These failed verification.

## Open gaps (flagged, not resolved)

- No source was ngAbs-modality-specific — the conjugation/payload/developability title adds are a hypothesis.
- No source segmented the contacts-per-account benchmark by technical/scientific B2B (vs cross-industry).
- Dedupe-on-LinkedIn-URL vs Email vs Person Key needs validation against existing Contacts data (avoid clobbering SF-sourced contacts) before activating the upsert.
