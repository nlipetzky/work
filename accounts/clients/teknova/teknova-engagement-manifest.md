# Teknova Engagement Manifest

**Purpose:** Single inventory of everything currently deployed for the Teknova engagement. Real-time state across people, systems, data, workflows, and artifacts. Answers "what exists right now" — not what's planned (see Build Roadmap) and not how we work (see SOP).

**Last updated:** 2026-05-12
**Update cadence:** Friday process review; opportunistic when material state changes
**Future:** sections marked with 🔧 are candidates for auto-population from underlying systems (Airtable, n8n, Drive) as automation lands.

---

## 1. Engagement metadata

| Attribute | Value |
|---|---|
| Client | Teknova |
| Engagement type | RevOps outbound — canonical-source-driven discovery, classification, enrichment, and activation |
| Active plays | AAV gene therapy (`aav-gene-therapy-ellie-outreach`) |
| Engagement start | ~2026-02 |
| Status | Active |
| Primary delivery channel to client | Email + Google Drive (Sheets/Docs) |
| Standing meeting | Thursday slot, optional per §11 SOP framing |
| Internal home | `/Users/nplmini/code/work/accounts/clients/teknova/` |

---

## 2. Stakeholders and access

### 2.1 — Client side

| Person | Role | Decision authority | Primary channel |
|---|---|---|---|
| Jenn Henry | VP Marketing | Program direction, prioritization, ship/no-ship | Email (Wednesday status), optional Thursday slot |
| Ellie Oleson | SDR / outreach owner | Output approval, rule approval, AAV verification | Email + Google Doc/Sheet markup, async |

### 2.2 — Internal

| Role | Owner | Notes |
|---|---|---|
| Engagement lead | Nick | Single point of accountability |
| Operator agents | Boris (agentic-systems), Agent_8 AI, claude-mem agents | Build and operate workflows |
| External dependencies | Teknova SF admin (for SF integration), Teknova email infra | TBD per integration |

### 2.3 — Credentials and access (high-level only; details in secrets store)

| System | Access type | Held by | Status |
|---|---|---|---|
| Airtable RevOps Surface base | Personal Access Token | Nick + workflow service accounts | Live |
| n8n Cloud (instig8.app.n8n.cloud) | Account login | Nick | Live |
| Google Workspace (Drive/Sheets/Docs/Gmail) | OAuth | Nick | Live |
| Teknova Salesforce | OAuth or API token | TBD (pending Teknova SF admin) | Planned |
| Exa, Perplexity, other enrichment providers | API keys | Nick | Live where keyed; planned otherwise |

---

## 3. Plays — current state

### Play: aav-gene-therapy-ellie-outreach

| Attribute | Value |
|---|---|
| Status | Active |
| Maturity stage (per SOP §3) | M1 — Universe defined; components A and C delivered |
| Offer artifact | `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-offer-aav-gene-therapy-ellie-outreach.md` (if present) |
| Segment criteria | `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` |
| Classification rules | `/Users/nplmini/code/work/accounts/clients/teknova/ellie-aav-classification-rules-2026-05-12.md` + Airtable Classification Rules table |
| Sourcing rules | `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md` |
| Modality taxonomy | `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md` |
| Most recent L1 run | 2026-05-12 17:14 UTC — 263 trials → 103 unique industry sponsors |
| Most recent L2 run | 2026-05-12 17:44 UTC — 32 surfaced / 65 borderline / 6 rejected |
| Rules version in last run | `2026-05-12-v1` |
| Pending client review | First AAV list + classification rules (sent to Ellie 2026-05-12) |

---

## 4. Data systems

### 4.1 — Airtable

| Base | Base ID | Purpose | Status |
|---|---|---|---|
| RevOps Surface | `appYBYH3aOHhTODAw` | Primary operational data store for plays | Live |
| Teknova Outreach (synced) | `appFoLY6hjroyA2KW` | Client-side synced base; read-only from our side | Live (synced from RevOps Command per feedback memory) |
| Teknova Clay Sheets | `app1vuBKY7t2jI2Gb` | Legacy Clay-based outputs | Legacy / wind-down |
| Teknova Smart Layer | `appM4aemhMsWsEoyv` | Older operational base | Legacy / wind-down |

**RevOps Surface base — tables in scope for current play:** 🔧

| Table | Table ID | Purpose | Approx row count |
|---|---|---|---|
| Companies | `tblnj3YlOI3thjrXp` | Captured + classified account universe | ~9,150 total; 103 with current AAV play discovery |
| Contacts | `tblWJksRL1yKSUgrm` | Verified contact list (per play, per company) | (TBD — populated during enrichment) |
| Enrichment Runs | `tblEVSEqetmu4ScHe` | Run log for every capture/classify/filter execution | Growing per run |
| Classification Rules | `tbl1HFYzezFYs5C3k` | Rule values (vocabulary, evidence, modality, indication, hard_filter, soft_signal, disqualifier) | 48 rows, Rules Version `2026-05-12-v1` |
| Sources | `tblqjVzI6LRnc2paA` | Active and deprecated capture sources | 9 rows (5 active + 4 deprecated) |
| Sync Runs | `tbllwfj2qEiqY1sdm` | Supabase → Airtable sync log | Operational, growing |
| Play | `tbli5DqoRR8jpHuo6` | Play-level metadata | 1 row for AAV |

### 4.2 — Supabase

| Project | Project ID | Purpose | Status |
|---|---|---|---|
| revops-engine-dev | `mrmnyscurmkfppicqqhk` | Operational backend (mirror of Airtable for engine workflows) | Live |

### 4.3 — Google Drive

| Folder | Purpose | Status |
|---|---|---|
| Teknova client folder (TBD path) | Client-facing deliverables (Sheets and Docs shared with Ellie/Jenn) | TBD — to be standardized |

### 4.4 — Internal filesystem (this repo)

| Path | Purpose |
|---|---|
| `/Users/nplmini/code/work/accounts/clients/teknova/` | All client docs, deliverables, drafts, manifest |
| `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/` | Reusable client artifacts (offer, segment, sourcing rules, taxonomy) |
| `/Users/nplmini/code/work/practices/revops/workflows/canonical-aav-discovery/` | Internal design docs, phase plans, change logs for the AAV pipeline |

---

## 5. Integrations (live + planned)

(Detailed register in SOP §10; current snapshot here.)

| System | Direction | Status | Last verified | Notes |
|---|---|---|---|---|
| clinicaltrials.gov | Inbound | Live | 2026-05-12 | L1 capture, weekly schedule |
| Airtable | Internal | Live | Continuous | Operational data store |
| n8n | Internal | Live | Continuous | Workflow orchestration |
| Google Drive / Sheets / Docs | Outbound | Live | 2026-05-12 | Client delivery channel |
| Gmail | Bidirectional | Live | Continuous | Client communication |
| **Explorium** | Inbound | **Live (primary firmographics enrichment provider)** | 2026-05-11 | Account-level enrichment (HQ, size, funding stage, revenue range). The strategic firmographics integration going forward. |
| Exa | Inbound | Live | 2026-05-12 | Web-grounded enrichment, verification, URL resolution |
| Perplexity | Inbound | Live | Recently | Web-grounded enrichment (quota issue logged 2026-05-12) |
| Supabase | Internal | Live | Continuous | Operational mirror |
| Salesforce (Teknova) | Bidirectional | Planned (P0) | n/a | Gates Known/Unknown + CRM activity status |
| USPTO PatentsView | Inbound | Planned (P2) | n/a | Patent-based discovery source |
| ARM Atlas / ASGCT | Inbound | Planned (P2) | n/a | Industry directory source |
| PubMed | Inbound | Planned (P2) | n/a | Literature-based discovery source |
| Contact enrichment provider (Apollo / Hunter / equivalent) | Inbound | Planned (P2) | n/a | Contact sourcing + email verification |
| Cadence platform (TBD) | Bidirectional | Planned (P2) | n/a | Outbound delivery + tracking |
| **Clay** | Inbound | **Deprecating — moving away from** | n/a | Being replaced by Explorium for firmographics enrichment. Any remaining Clay-based outputs are legacy. |

---

## 6. Workflows / automations (n8n) 🔧

### Live

| Workflow | ID | Purpose | Trigger | Last execution |
|---|---|---|---|---|
| Canonical AAV Discovery - ClinicalTrials.gov | `9gcmEjq1lvOY2jZS` | L1 capture from CT.gov | Schedule Mon 6am + manual | 2026-05-12 17:14 UTC (manual; first execution after Phase 3 refactor) |
| Canonical AAV Discovery - L2 Classify | `rXKuqfDwqX7TYzxK` | L2 classification: applies Classification Rules to needs_verification rows | Manual | 2026-05-12 17:44 UTC |

### Deprecated / legacy (to confirm and clean up)

| Workflow | ID | Original purpose | Status |
|---|---|---|---|
| AAV sourcing list (older) | `Z6RROKx5omdfvhtn` | Pre-Phase-3 AAV pipeline | To audit; likely deprecated by current L1+L2 setup |

### Planned

See Build Roadmap, §"In flight or next up" and "Medium-term" — items for L3 filter, packaging automation, status email assembly, additional capture sources.

---

## 7. Documents and artifacts

### 7.1 — Operating documents (internal + cross-engagement)

| Document | Path | Audience |
|---|---|---|
| Engagement plan | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-engagement-plan-2026-05-12.md` | Client (Jenn primary) |
| SOP (v1.4) | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-engagement-sop-2026-05-12.md` | Internal |
| Weekly status template | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-weekly-status-template.md` | Internal |
| Build roadmap | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-build-roadmap.md` | Internal |
| **Priority surface** | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-priority-surface.md` + Drive mirror | Client (Jenn primary) |
| Priority surface pattern (practice-level) | `/Users/nplmini/code/work/practices/agentic-systems/reference/priority-surface-pattern.md` | Internal (reusable across engagements) |
| Engagement manifest (this doc) | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-engagement-manifest.md` | Internal |
| Engagement CLAUDE.md | `/Users/nplmini/code/work/accounts/clients/teknova/CLAUDE.md` | Internal (agent context) |
| Partnership doc | `/Users/nplmini/code/work/accounts/clients/teknova/ellie-rules-partnership.md` | Client (Ellie) |

### 7.2 — Per-play artifacts (current play: aav-gene-therapy-ellie-outreach)

| Artifact | Path | Audience |
|---|---|---|
| Segment criteria | `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md` | Internal + client (Ellie) |
| Sourcing rules | `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-sourcing-rules-aav-gene-therapy-ellie-outreach.md` | Internal + client (Ellie) |
| Modality taxonomy | `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-modality-taxonomy-aav-gene-therapy-ellie-outreach.md` | Internal + client (Ellie) |
| Classification rules (client-facing approve-or-adjust) | `/Users/nplmini/code/work/accounts/clients/teknova/ellie-aav-classification-rules-2026-05-12.md` | Client (Ellie) |
| Most recent discovery CSV | `/Users/nplmini/code/work/accounts/clients/teknova/ellie-aav-discovery-2026-05-12.csv` | Client (Ellie via Google Sheet) |
| Email draft for current handoff | `/Users/nplmini/code/work/accounts/clients/teknova/ellie-email-2026-05-12-aav-discovery-list.md` | Internal (Nick to send) |
| Canonical CT.gov summary | `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/canonical-aav-clinicaltrials-summary-2026-05-12.md` | Internal |

### 7.3 — Workflow design and handoff docs (internal)

| Document | Path |
|---|---|
| Three-layer pipeline handoff | `/Users/nplmini/code/work/practices/revops/workflows/HANDOFF-three-layer-pipeline-2026-05-12.md` |
| Pipeline design doc | `/Users/nplmini/code/work/practices/revops/workflows/canonical-aav-discovery/DESIGN.md` |
| Phase 2 plan + rules draft | `/Users/nplmini/code/work/practices/revops/workflows/canonical-aav-discovery/PHASE-2-REVISED-PLAN.md`, `PHASE-2-RULES-DRAFT.md` |
| Phase 3 change instructions | `/Users/nplmini/code/work/practices/revops/workflows/canonical-aav-discovery/PHASE-3-CHANGES.md`, `PHASE-3-INSTRUCTIONS.md` |
| Validation handoff (legacy) | `/Users/nplmini/code/work/accounts/clients/teknova/HANDOFF-aav-sourcing-workflow-validation-2026-05-12.md` |

---

## 8. Operational state — most recent measurements

🔧 Auto-populate target.

### 8.1 — Pipeline output

| Metric | Value | As of |
|---|---|---|
| Companies captured (current play) | 103 unique industry sponsors | 2026-05-12 |
| Surfaced (confirmed AAV) | 32 | 2026-05-12 |
| Borderline (needs human review) | 65 | 2026-05-12 |
| Rejected (disease-AAV collision) | 6 | 2026-05-12 |
| Records with NCT IDs populated | 93 (10-record gap with reported 103 — under investigation) | 2026-05-12 |

### 8.2 — Process state

| Metric | Value |
|---|---|
| Active deliverables in Ellie's queue | 2 (AAV list + classification rules; both sent 2026-05-12, awaiting response) |
| Open decisions for Jenn | 0 |
| Workflows in `live` state | 2 (L1 capture, L2 classify) |
| Workflows in `planned` state | Multiple — see Build Roadmap |

---

## 9. Open items, risks, known issues

| Item | Type | Severity | Notes |
|---|---|---|---|
| Salesforce integration not built | Gating dependency | High | Gates Known/Unknown protocol and CRM-sourced enrichment attributes (§4.5, §4.6 of SOP) |
| 5 ANCA-Vasculitis false positives in borderline | Quality | Low–Med | Amgen, Novartis Pharma, Tanabe, Fate, Nkarta — flagged in Ellie's review materials; vocabulary expansion queued |
| 10-record gap (L1 reported 103 vs Companies with NCT IDs 93) | Quality / audit | Low | Likely silent upsert errors in batched splitInBatches; revisit during Phase 4 |
| Z6RROKx5omdfvhtn workflow status unclear | Cleanup | Low | Need to confirm deprecation vs. retention |
| Client-side Google Drive folder for deliverables not standardized | Process | Low | Today: ad-hoc; should be a single shared folder going forward |
| Cadence platform for activation TBD | Planning | Med | Depends on what Teknova standardizes on; gates M5 activation |

---

## 10. Notes on this manifest (for the scaling question)

This manifest is the inventory layer for one engagement. For scaling to multiple clients:

- **The structure is the standard.** Each engagement gets its own manifest at `accounts/clients/<client>/<client>-engagement-manifest.md` with the same 9 sections. Copy this file as the template for the next engagement.
- **Manual maintenance for now, automation later.** Sections marked 🔧 are candidates for auto-population once the patterns repeat across engagements. Friday process review (per SOP §8.10) is the natural touch point to keep this current.
- **The manifest references; it doesn't duplicate.** Detail lives in the SOP (process), engagement plan (direction), build roadmap (backlog), and per-play artifacts. The manifest tells you *where to find* each, with current status — it's the table-of-contents-with-state for an entire engagement.
- **Agent operability.** Once a manifest exists for an engagement, an agent can answer "what's the current state of this engagement?" by reading this single doc. No spelunking through Airtable bases or n8n workflows. That makes a new engineer, contractor, or agent onboardable in minutes.
- **For scale beyond manual:** as the second and third engagements come online, the patterns in this manifest become a literal template, and the 🔧 sections become candidates for an `engagement-manifest-refresh` automation that queries Airtable, n8n, and Drive APIs to keep itself current.
