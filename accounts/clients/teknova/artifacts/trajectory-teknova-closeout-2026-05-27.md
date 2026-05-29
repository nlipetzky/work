# Teknova Closeout Trajectory — 4-Week Wind-Down

**Drafted:** 2026-05-27
**Sponsor:** Jenn Henry
**Expert:** Ellie
**Channel:** email
**Notice received:** 2026-05-26
**End date:** 2026-06-25
**Tier:** Solo (1 slot / week)
**Protocol reference:** `practices/engagement-governance/reference/weekly-delivery-shape.md`
**Contract baseline reference:** `accounts/clients/teknova/artifacts/teknova-contractual-obligations-2026-05-27.md`

---

## Engagement state

- Operative contract: TKNO Marketing SPA Konstellation AI (signed 2025-09-30) + Exhibit A SOW
- 30-day notice clause invoked by sponsor 2026-05-26
- Final billable month: $8,000 retainer for the period 2026-05-26 → 2026-06-25
- Trajectory status: `Approved-Pending-Sponsor-Confirmation` (pending Jenn's reply to closeout email)

---

## Contractual floor (continues automatically each week)

These run without consuming slot capacity. They are the SPA Exhibit A weekly cadences:

| Cadence | Source | Status |
|---|---|---|
| Data Engine — Airtable refresh logs + outputs | §1(b)(i) | Operational; automated |
| Salesforce sync — campaign activity weekly | §1(b)(ii) | Operational; automated |
| Monday reporting snapshot | §1(b)(vi)(3) | Operational; automated |
| Weekly joint review meeting (60 min, Thursday) | §1(d)(iii) | 4 occurrences remaining |
| Outreach via Smartlead | §1(b)(iv) | Operational; running |
| SF Contact Summary workflow (live as of 2026-05-22) | Built in-scope | Operational |

**Operator hours estimate:** 4–6 hours/week for the contractual floor (oversight + meeting + Weekly Update).

---

## Slot capacity for the wind-down

4 weeks × 1 slot/week (Solo tier) = **4 slots total**.

---

## Roadmap (slot sequence)

| # | Item | Status | Size | Priority | Dependencies |
|---|---|---|---|---|---|
| 1 | Modality-focused list for Ellie (#1) | `This Week` (Week 1) | small | 1 | Ellie names the modality |
| 2 | JSON export — all Teknova-specific n8n workflows | `Next` (Week 2) | small | 1 | None |
| 3 | One-page system state snapshot bundled with JSON drop | `Next` (Week 3) | small | 1 | Slot #2 complete |
| 4 | Closeout package finalization + final Weekly Update | `Next` (Week 4) | small | 1 | Slots #1–3 complete |
| 5 | Modality list #2 (if capacity) | `Deferred` | small | 3 | Capacity available after slot #4 |

---

## Per-week plan

### Week 1 — May 28 (Thu session) → Jun 3

- **Slot:** Modality list for Ellie
  - Input needed from Ellie: which modality (decided in Thursday session or by email within 48 hours)
  - Output: ranked list delivered in CSV/spreadsheet (per Ellie's stated preference, not Airtable)
  - Acceptance: list delivered; Ellie's review optional
- **Thursday session (May 28):** First closeout session. Agenda: lock Trajectory, confirm modality choice, surface Jenn's other transition asks for scope-change handling
- **Weekly Update (May 29):** sent Friday EOD
- **In scope this week:** slot + contractual floor + conceptual answers to questions (48hr SLA)
- **Out of scope this week:** anything requiring a written request that hasn't arrived

### Week 2 — Jun 4 (Thu session) → Jun 10

- **Slot:** JSON export of all Teknova-specific n8n workflows
  - Output: JSON files exported, dropped in a shared Google Drive folder, one-line README per file ("this captures X; rewire Airtable nodes to your base")
  - Acceptance: files visible to Jenn in shared folder
- **Thursday session (Jun 4):** Status, decide whether modality list #2 enters roadmap, surface any in-scope questions for next week
- **Weekly Update (Jun 5):** sent Friday EOD
- **Out of scope:** writing setup instructions, runbooks, or training material; configuring n8n on Teknova's side

### Week 3 — Jun 11 (Thu session) → Jun 17

- **Slot:** One-page system state snapshot
  - Output: single-page doc bundled with the JSON drop, naming each workflow's trigger, what it reads/writes, credential source, and dependencies
  - Acceptance: file dropped in same Drive folder as Week 2
- **Thursday session (Jun 11):** Status, confirm closeout package contents, surface anything still ambiguous before Week 4
- **Weekly Update (Jun 12):** sent Friday EOD

### Week 4 — Jun 18 (Thu session) → Jun 24

- **Slot:** Closeout package finalization
  - Output: final shared Drive folder containing all JSONs + system snapshot + brief index + final Weekly Update preview
  - Acceptance: link sent to Jenn
- **Thursday session (Jun 18):** Final working session. Review closeout package contents. Confirm what ships on Jun 25.
- **Weekly Update (Jun 19):** sent Friday EOD; previews the closeout deliverables landing on Jun 25

### Closeout day — Jun 25 (Thu)

- **Final delivery:**
  - JSON drop + one-page system snapshot link sent to Jenn
  - Final Weekly Update sent (framed as closeout report)
  - Confidential Information return/destruction certification (if requested by Teknova)
- **No Thursday session held** — replaced by the closeout email
- **Engagement formally closed at EOD**

---

## Out of scope across all weeks (defaults to Scope-Change Notification)

Any of these, regardless of who asks or how urgent it sounds, returns a Scope-Change Notification within 48 hours:

- Additional meetings beyond the 4 Thursday sessions
- Written runbooks, documentation, or setup guides beyond the one-page system snapshot
- Live walkthroughs, training calls, screen-shares
- Configuring n8n on Teknova's instance
- Rewiring Airtable nodes, Salesforce credentials, or any provider connection on Teknova's side
- Live debugging on Teknova's side
- Knowledge-transfer sessions with Teknova staff
- Any new build that would produce output past 2026-06-25
- Lists beyond the one modality list named in slot #1 (and optionally slot #5 if capacity)

---

## Scope-change protocol for this Trajectory

Per SPA Exhibit A §4: *"will not begin work on any given project unless written request has been provided by Service Requester."*

Operating rule for the wind-down:
- Verbal or Slack ask from Jenn, Ellie, Christa, or anyone on the Teknova team → acknowledge, request it in writing within 24 hours
- Written request received → Scope-Change Notification delivered within 48 hours with three options (add and re-price, defer, decline)
- 48-hour decision window on every Scope-Change Notification; no decision = deferred; surface in next Weekly Update

---

## Failure modes specific to this closeout

| Failure | Recovery |
|---|---|
| Ellie doesn't name a modality for slot #1 by Wed Jun 3 | Slot #1 converts to "advance JSON packaging" (pull forward slot #2 work); surface in Friday update; modality list deferred to slot #5 contingent on Ellie naming the modality by Jun 10 |
| Thursday session no-show by sponsor | Hold last-decided slot for next week; send Weekly Update with default; do not absorb |
| Jenn requests "transition support" verbally during a Thursday session | Acknowledge in session; request written specification within 48 hours; Scope-Change Notification follows with sizing |
| Ellie or Jenn requests additional lists during Thursday session | Surface in real time: "fits slot #5 if capacity permits, else scope-change." Decision in session. |
| JSON export reveals a workflow tightly coupled to Konstellation-side infrastructure that cannot be cleanly transferred | Note in one-page system snapshot under "operator notes — not portable as-is"; do not invest in making it portable (out of scope) |
| Sponsor invokes "you said you would document X" referencing the SOW Phase 3 obligation | The one-page system snapshot + JSON READMEs satisfy this; do not extend documentation beyond the snapshot |

---

## Post-Day-30 protocol

- Active workflows on Konstellation infrastructure: **paused, not deleted**, through 2026-07-25 (30-day grace)
- Grace-period support: zero proactive engagement; one bounded clarification question accepted in writing; anything else is a paid engagement requiring new SOW
- 2026-07-25: paused workflows archived; credentials revoked; provider costs (Hunter, Explorium, n8n, etc.) attributable to Teknova halted
- MDNA confidentiality continues to bind through 2028-09-12 per its terms

---

## Operator weekly checks during wind-down (Mondays)

- [ ] This week's slot is locked
- [ ] Last Friday's Weekly Update was sent
- [ ] No open scope-change items past 48-hour decision deadline
- [ ] No verbal/Slack asks have been silently absorbed in the past week
- [ ] Contractual floor (3 cadences + Thursday meeting) running

---

## Final delivery checklist (Jun 25)

- [ ] Modality list #1 shipped (delivered Week 1 or as rescoped)
- [ ] JSON export of all Teknova-specific n8n workflows in shared Drive folder
- [ ] One-page system state snapshot in same folder
- [ ] One-line README per JSON file in same folder
- [ ] Final Weekly Update sent (closeout report framing)
- [ ] If requested: written certification of Confidential Information return/destruction per MDNA §[X]
- [ ] Modality list #2 if capacity permitted (optional, not committed)

---

## Sponsor approval

This Trajectory takes effect when Jenn confirms scope in writing (email reply acceptable). Until then, the engagement runs against the prior informal understanding plus the SPA Exhibit A weekly cadences. Confirmation request goes out with the closeout email accompanying this Trajectory.
