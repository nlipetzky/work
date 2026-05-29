# Teknova Engagement — Contractual Obligations

**Compiled:** 2026-05-27
**Purpose:** Organize what Konstellation AI is contractually obligated to do for Teknova, so the Closeout Trajectory can be drafted against a defensible scope baseline.
**Source:** NotebookLM notebook "Teknova Contracts" (id `26687564-3db9-4c22-aabf-9499567453eb`), 7 sources.

---

## 1. Document hierarchy

| Document | Date | Signed? | Status |
|---|---|---|---|
| **TKNO Marketing SPA Konstellation AI** | 2025-09-30 | **Signed** by Nick Lipetzky and Jennifer Henry | **OPERATIVE.** Entire agreement clause supersedes all prior. |
| **Exhibit A (SOW) inside the SPA** | 2025-09-30 | Bundled with signed SPA | **OPERATIVE.** Defines deliverables. |
| **Mutual NDA (MDNA)** | 2025-09-12 | Signed | **In force.** Confidentiality survives 3 years from effective date. |
| Teknova Konstellation SOW | 2025-09-04 | Unsigned | Superseded by SPA Exhibit A. Not binding. |
| Original Teknova Agreement | Mar–Jun 2025 | Unsigned | Superseded. Not binding. |

**Bottom line:** Only the SPA (with its Exhibit A) and the MDNA govern. The earlier docs do not bind.

---

## 2. What Konstellation is obligated to deliver

All from **TKNO Marketing SPA Konstellation AI signed.pdf, Exhibit A**:

| Deliverable | Section | Cadence | Acceptance criteria (verbatim) |
|---|---|---|---|
| **Data Engine (Airtable Master Database)** — auto full + incremental refreshes; "Refresh Now" control | §1(b)(i), §1(e)(i) | Weekly refresh logs + outputs | "Database refreshes run automatically, logged, and visible in Airtable." |
| **Salesforce Integration** — campaign-results sync; positive-reply lead handoff | §1(b)(ii), §1(e)(ii) | Weekly | "Campaign results sync successfully into Salesforce with field mapping intact." |
| **External List Ingestion** — intake, normalization, enrichment, validation, dedup of external CSVs | §1(b)(iii), §1(e)(iii) | Ongoing / on-demand | "External lists are uploaded, processed, and only activated after Teknova approval." |
| **Outreach Campaigns** — multi-step Smartlead sequences; reply tagging; Attach Rate Dashboard | §1(b)(iv), §1(e)(iv) | Ongoing | "Outreach campaigns run through Smartlead with Teknova-selected audiences and messaging." |
| **Offer & Messaging Framework** — Airtable fields for offer inputs; approval workflows | §1(b)(v), §1(e)(v) | Ongoing / quarterly expansion | "Offers and copy require Teknova approval before being scheduled." |
| **Reporting & Command Center** — live KPI dashboard; weekly Monday snapshot; board-ready summaries; exposure monitoring | §1(b)(vi), §1(e)(vi) | Live + weekly | "Weekly dashboards, system-generated reports, and board summaries are consistently produced and accessible to Teknova." |
| **Profile Cheat Sheets** | (Exhibit A) | One-time / ongoing | (per Exhibit A) |

**Recurring cadence obligations summarized:**

- Weekly automated Monday summary snapshot
- Live KPI dashboard (sends, opens, replies, deliverability)
- Weekly Salesforce sync
- **Weekly joint review meetings of campaign results**
- Quarterly (every 90 days) joint optimization review
- Board-ready summaries
- Ad-hoc reporting

---

## 3. SOW phasing — what's in scope per phase

The SOW (Exhibit A) is phased. The relevant Phase 3 obligation for the wind-down:

> Phase 3 includes an ongoing obligation to **"Document integrations and workflows so Teknova can independently operate and extend the system."** [SOW Exhibit A]

**This is the only contractual basis for any handoff documentation.** It is in scope under the original SOW, not termination-triggered. If we have been delivering under Phase 3, that documentation is owed. If we have not reached Phase 3 — or if Phase 3 documentation was being produced incrementally and the engagement is ending before completion — the obligation is ambiguous and defensible either way.

**Decision Nick needs to make:** has the engagement reached Phase 3? If yes, packaging the JSON files with a one-page system snapshot likely satisfies "document integrations and workflows" at a minimum-viable level. If no, even that may be more than required.

---

## 4. Out of scope (explicit) and silent areas

**Explicit out of scope:**

- **Apollo API licensing and cost.** "If enabled by Teknova" / "once licensed by Teknova." Teknova's responsibility, not Konstellation's.
- **Work without written request.** "Service Provider will not begin work on any given project unless written request has been provided by Service Requester." This is the contractual hook for refusing ad-hoc verbal asks during the wind-down.

**Silent in the contract (no obligation):**

- Training sessions or live walkthroughs
- Screen-shares or working-session handoffs
- Configuring n8n on Teknova's instance
- Rewiring credentials or providers on Teknova's side
- Live debugging after the engagement ends
- Knowledge transfer sessions with Teknova staff
- Salesforce administration
- Email platform infrastructure

**Critically:** "System Handover / Knowledge Transfer: Silent. There are no special training or knowledge transfer clauses explicitly triggered by the act of termination itself."

---

## 5. Commercial terms

- **Retainer:** $8,000 / month
- **SPA general term:** 3 years (through ~2028-09-30)
- **Exhibit A SOW authorized window:** "the equivalent of six (6) months' work, starting October 1, 2025" → original window expired ~2026-03-31
- **Payment terms:** Billed to Teknova or Upwork; payable within 30 days of invoice receipt; only bill for actual hours/time spent up to amount approved
- **Milestone payments:** Silent
- **Expense reimbursement:** Silent (except "undisputed fees and expenses shall be payable" at termination)

**Open question for Nick:** the original 6-month Exhibit A SOW expired ~2026-03-31. We are two months past that. Either (a) the work was implicitly extended on monthly retainer under the 3-year SPA umbrella, or (b) a refreshed SOW was agreed verbally and never captured. If (a), the scope baseline still anchors to the original Exhibit A deliverables. If (b), you need to recall what was actually agreed for the post-March period.

---

## 6. Termination and notice provisions (verbatim)

**Notice clause:**

> "Either party may terminate this Agreement upon thirty (30) days' written notice to the other party at the addresses set forth above."

Jenn's 2026-05-26 email is a valid invocation. End date: **2026-06-25**.

**Post-termination obligations (verbatim):**

> "At the time of termination, all undisputed fees and expenses shall be payable by Service Requester and Service Provider will promptly return to Service Requester or destroy all Confidential Information. Notwithstanding the foregoing, the provisions of this Agreement that, by their nature and content, must survive the termination or expiration of this Agreement in order to achieve the fundamental purposes of this Agreement, shall so survive and continue to bind the parties."

**Data handling (verbatim):**

> "Service Provider shall use Materials and Data solely for performance of the Services and shall destroy Materials and Data once Services have been completed."

**NDA (verbatim, MDNA):**

> "On Disclosing Party's request, Recipient shall, promptly return to Disclosing Party or destroy all Confidential Information in its and its Representatives' possession other than Notes, and shall destroy all Notes, and at Disclosing Party's written request certify in writing the destruction of such Confidential Information..."

**NDA survival:** 3 years from effective date (2025-09-12 → 2028-09-12), longer for trade-secret material.

---

## 7. What Konstellation must do at termination

Only two contractual obligations are triggered by termination itself:

1. **Receive payment** for undisputed fees and expenses through the notice period.
2. **Return or destroy** Teknova's Confidential Information and any Materials/Data provided for the Services.

That's it. No transition support, no training, no documentation specifically required at termination.

---

## 8. Defensible Closeout Trajectory baseline

Based on the operative SPA + Exhibit A:

**In-scope through 2026-06-25 (because the retainer is paid through then):**

- Continue the contracted weekly cadence: Data Engine refreshes, Salesforce sync, outreach campaigns, weekly snapshot, weekly review meeting, ad-hoc reporting
- Continue producing list outputs as part of normal operations (any modality list for Ellie fits this)
- Final weekly summary and review meeting before end date

**At termination (2026-06-25):**

- Settle outstanding fees
- Return or destroy Teknova's Confidential Information
- **Optional but defensible under Phase 3 if reached:** JSON packaging of workflows + one-page system snapshot as the "document integrations and workflows so Teknova can independently operate and extend the system" deliverable

**Not owed under any reading of the contract:**

- Training, walkthroughs, screen-shares, live debugging, knowledge-transfer sessions, configuring anything on Teknova's side, written runbooks beyond the Phase 3 documentation interpretation above

---

## 9. Operational implications for the wind-down

1. **Jenn's two asks** from the 2026-05-26 email need to be sized against the contract:
   - **"More modality-focused lists for Ellie"** — fits within ongoing in-scope deliverables. Producing a list is part of the Data Engine + External List Ingestion + Offer & Messaging Framework deliverables. One or two lists in the wind-down is contract-consistent.
   - **"Transition the tool to Teknova"** — not in scope as a discrete deliverable. The closest contractual hook is the Phase 3 "document integrations and workflows" obligation, which JSON drop + one-page snapshot satisfies at the floor. Anything more (training, walkthroughs, debugging support) is a scope change.

2. **The "no work without written request" clause** is the cleanest rejection language for verbal asks during the wind-down. Every new ask gets: "please send a written request describing the scope; I'll respond with whether it fits the current Exhibit A or is a scope-change requiring re-pricing."

3. **The 6-month Exhibit A window expired ~2026-03-31.** Worth being precise internally about whether we've been operating under (a) implied extension of the original SOW, or (b) a verbally agreed continuation. Affects how we frame "what we owe through 2026-06-25" if it gets contested.

---

## 10. Open items for Nick to confirm

1. Did the engagement actually reach Phase 3, or are we still in Phase 1/2 per the SOW phasing? Determines whether the "document integrations and workflows" obligation has triggered.
2. Was there any verbal or email-based agreement to extend the original 6-month Exhibit A SOW past 2026-03-31? If yes, what scope was named?
3. Is the live KPI dashboard / board-ready summary deliverable being satisfied today, or is it a known gap? Relevant if Jenn raises "you never delivered X" during the wind-down.
4. The MDNA's "return or destroy and certify in writing" language — does Teknova want a written certification at termination, or is silent compliance acceptable?
