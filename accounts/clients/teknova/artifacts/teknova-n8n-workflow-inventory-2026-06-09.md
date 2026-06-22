# Teknova n8n Workflow Inventory

**Pulled live from instig8 (`https://instig8.app.n8n.cloud/`) on 2026-06-09.**
**Source of truth:** the n8n API. This supersedes the workflow list in `teknova-operations-inventory.md`, which is stale and wrong on active-state and on what exists.

## How "associated with Teknova" is defined here

Two overlapping signals, unioned:
1. **Tag `Teknova`** (tag id `L1jqDLGQ7nS5xWs1`) — 37 workflows, spanning multiple n8n projects.
2. **Sitting in the Teknova project** (`TfzE1Ve7GCz0XRpa`) — 28 workflows; 13 of these are untagged and only appear via the project.

Union = **50 workflows**. Note the tag is overloaded: it covers genuine client workflows, your `revops-engine` platform tooling, and dead experiments. The `revops-engine`-tagged ones touch Supabase and are internal — not for client handoff.

**Live state summary:** 10 active, 5 archived, 35 inactive-but-not-archived.

Disposition column is my *proposed* classification for your review, inferred from names/tags/state — not authoritative. Override freely.
- **KEEP** = client-facing SF/Airtable, candidate for the handoff
- **HIDE** = your platform/internal tooling (Supabase-touching); must not go to Teknova
- **KILL** = archived / duplicate / scratch / cruft
- **REVIEW** = ambiguous, needs your call

---

## Active (running now) — 10

| Workflow | ID | Nodes | Tags | Proposed |
|----------|-----|-------|------|----------|
| SF Lead_Contact Sync | `TaFA7YOoT0H0BHMg` | 9 | Teknova | KEEP |
| Get Teknova SF account history -> Revops Surface | `JiDI5fJcDyW3Kru7` | 16 | revops-engine, Teknova | HIDE |
| Get SF contact history | `TQsQ7iVtgat0LQsB` | 18 | revops-engine, Teknova | HIDE |
| Get Teknova Outreach base SF account history | `uDflPbg6KsTX7ALJ` | 8 | revops-engine, Teknova | HIDE |
| Get contacts Tier + Reason | `MY172ZwZrVCcqm85` | 6 | revops-engine, Teknova | HIDE |
| AAV Companies Enrichment (Explorium → Airtable) | `Z6RROKx5omdfvhtn` | 35 | revops-engine, enrich, Explorium, Teknova | HIDE |
| AAV Relevance Scan | `bBq5nIO3i5XpQKn9` | 6 | revops-engine, Qualify, Teknova | HIDE |
| Canonical AAV Discovery - L1 ClinicalTrials.gov | `9gcmEjq1lvOY2jZS` | 15 | revops-engine, sourcing, Teknova | HIDE |
| Get SF Schema | `PVvgKx2julLXly0C` | 4 | (untagged, project) | KILL (utility) |
| Schema | `xs6drzbSdND5EfMd` | 6 | (untagged, project) | KILL (utility) |

## Client-facing SF / Airtable — inactive (KEEP candidates) — 4

| Workflow | ID | Nodes | Tags | Proposed |
|----------|-----|-------|------|----------|
| SF Account Sync | `nYnpliJqX2fGHcC2` | 11 | Teknova | KEEP |
| Teknova — Companies SF Enrichment | `9lHIriKSBaYId9Xd` | 18 | Teknova | KEEP |
| Teknova — Supabase → Airtable Enrichment Sync | `8n2oiwB2ZOHA0rSo` | 21 | (untagged, project) | HIDE (named/uses Supabase) |
| One-Way Airtable to Salesforce Data Sync | `Ep74sPBHHYE2m4ka` | 20 | (untagged, project) | REVIEW |

## revops-engine platform / discovery pipeline (HIDE) — inactive — 8

| Workflow | ID | Nodes | Tags | Proposed |
|----------|-----|-------|------|----------|
| Canonical AAV Discovery - L2 Classify | `rXKuqfDwqX7TYzxK` | 27 | revops-engine, Teknova | HIDE |
| Canonical AAV Discovery - Step 9 Verify | `2rTMeD7SB3SBNZZE` | 9 | revops-engine, Teknova | HIDE |
| ngAbs Classifier | `uDamISVK54GWGD9t` | 8 | revops-engine, Teknova | HIDE |
| NA ngAbs Site Classification | `jVKI801SeyPvaaHK` | 6 | revops-engine, Teknova | HIDE |
| USPTO + PatentsView Patent Capture | `1PorXD6WcENcXUow` | 13 | revops-engine, Teknova | HIDE |
| PubMed Publication Capture | `poYzPN589ZK4zfO5` | 20 | revops-engine, sourcing, Teknova | HIDE |
| AAV Trade Press Signals - Perplexity | `wIyuFELxzXMgHCDV` | 8 | revops-engine, Teknova | HIDE |
| Teknova Contact Explorium AI Enrichment | `IckreR0fX6GFccmX` | 22 | Teknova | HIDE |

## Legacy outreach / play workflows — inactive — 9

| Workflow | ID | Nodes | Tags | Proposed |
|----------|-----|-------|------|----------|
| Teknova Segmentation | `5clzdeqdmVmpT9qG` | 11 | Teknova | REVIEW |
| Teknova Offer Creation | `ElYa3WGL7IHILWzt` | 23 | Teknova | REVIEW |
| Teknova Search Business Prospects | `FPE1Gpu1flOUqOED` | 15 | Teknova | REVIEW |
| Teknova Leads Import | `dgebsIKoLoG9wB6P` | 26 | Teknova | REVIEW |
| Teknova Companies Import | `xPgWtkiKdCBnFR17` | 10 | Teknova | REVIEW |
| Teknova Reply Webhook | `CyGoRL8oibT7L7zO` | 10 | Teknova | REVIEW |
| Teknova SmartLead Reply | `dfymo4CKfrdOk5Fa` | 10 | Teknova | REVIEW |
| Teknova Email Campaign | `xeyEKN9Y6zNi4lz0` | 81 | Teknova | REVIEW |
| Teknova Company Enrich | `2sbPCgCyKiMyCe7C` | 15 | (untagged, project) | REVIEW |

## SF↔Airtable sync legacy & duplicates (mostly KILL) — 8

| Workflow | ID | Nodes | State | Proposed |
|----------|-----|-------|-------|----------|
| Teknova Salesforce | `ZjkWXL2lERORfxFs` | 41 | inactive | REVIEW |
| Teknova Salesforce Snyc | `wxjQymFxMbf7N1Zq` | 43 | inactive | KILL (dup) |
| Daily Salesforce to Airtable Snyc | `JuetPadcgYjt1h59` | 73 | inactive | KILL (dup) |
| Sanbox Salesforce to Airtable Snyc | `Jzrx5e6iIjeffnD4` | 73 | inactive | KILL (dup) |
| OLD Teknova Salesforce Synchronizer | `QICeJPHZosrDMl7g` | 41 | ARCHIVED | KILL |
| Teknova Salesforce Account Import | `S7FRLG51TFGwhTa8` | 10 | inactive | KILL |
| SF Lead_Contact Sync copy | `AbV27DazLFusUryh` | 12 | inactive (tag: backup) | KILL (backup) |
| SF Sync | `no6MfyUpVVdsevNp` | 3 | ARCHIVED | KILL |

## Intake / transcript / misc — 5

| Workflow | ID | Nodes | State | Proposed |
|----------|-----|-------|-------|----------|
| Teknova Transcript → Airtable Intake | `JYzJdu66Q8eKCXk2H9ah2` | 19 | inactive | REVIEW |
| Teknova Transcript → Airtable Intake (empty) | `7Rw6EfRQUYzj_-qZ13ViS` | 0 | inactive | KILL (empty) |
| Mapping SF Contacts with Master table | `qeR6EehRhRsOoDTq` | 11 | inactive | REVIEW |
| Normalize Secondary Modality (Airtable → AI → Airtable) | `54WIhawCS3EcVWXo` | 8 | inactive | REVIEW |
| Job Focus Area | `0MOzpZGWVGCYyXIk9XBq3` | 9 | inactive | REVIEW |

## Archived experiments & scratch (KILL) — 4

| Workflow | ID | Nodes | State | Proposed |
|----------|-----|-------|-------|----------|
| Teknova Offer Copywriter WIP | `1ghXB6KDtnWdCcEx` | 23 | ARCHIVED | KILL |
| Canonical AAV Discovery - L2 SMOKE-VARIANT v4 R5 (6-row) | `3ba5obhDdKcKc5Hs` | 27 | ARCHIVED | KILL |
| Canonical AAV Discovery - L2 Classify dupe | `HUpkdwNTBcDutT8o` | 8 | ARCHIVED | KILL |
| Enrichment Ledger Updater | `cvmBvynR176fj4tV` | 5 | inactive | KILL |
| My workflow 6 | `LVLHLyOEPGjsoZAr` | 2 | inactive | KILL (scratch) |
| Sandbox creds | `p1q6VY6rik9zHiho` | 2 | inactive | KILL (scratch) |

---

## Key reconciliation flags vs. the ops inventory

- **`SF Lead_Contact Sync` is the ONLY active client-facing sync.** `SF Account Sync` and `Teknova — Companies SF Enrichment` are both **inactive** — the ops inventory described them as running on schedules.
- **`Teknova — Supabase → Airtable Enrichment Sync` exists** (21 nodes) — the ops inventory said "not yet built."
- **Most active workflows are `revops-engine` platform tooling**, not client deliverables. They carry the Teknova tag but are your engine and touch Supabase.
- **Heavy duplication** in the SF↔Airtable sync lineage: at least 6 overlapping/legacy variants, two of them 73 nodes.
