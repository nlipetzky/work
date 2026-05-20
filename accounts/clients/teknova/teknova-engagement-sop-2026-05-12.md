# Teknova Engagement — Standard Operating Procedure

**Version:** 1.4
**Effective:** 2026-05-12
**Owner:** Nick (delegating progressively to agents)
**Scope:** Production of *plays* for Teknova. A play is the unit of delivery; this SOP defines what a play contains (§3), the attributes that determine its quality (§4), how to diagnose a play that misses its targets (§5), and the weekly operating cycle that produces it (§6 onward).

This SOP is intended to serve three functions:

1. **Production manual** — the routine the team (Nick + agents) executes to produce a play.
2. **Quality framework** — when an output doesn't meet target, the attributes in §4 plus the diagnostic matrix in §5 tell us which step of the process to adjust.
3. **Client agreement** — §3 and §4 are the definition of what the client is buying. Agreement on the play spec is agreement on the process that produces it.

Automation status legend used throughout: **AGENT** is buildable into automation today; **HYBRID** needs Nick's judgment at one point in the loop; **NICK** is human-only for now.

---

## 1. Operating principles

| Principle | What it means in practice |
|---|---|
| **Email and docs are the primary channels.** | All client communication runs through these. No meeting is required to move work forward. |
| **Each deliverable has a state.** | Every doc, list, or rule set is in exactly one state at any time (see §4). State drives what action happens next. |
| **Decisions live in writing.** | Approvals, rejections, edits, redirections — all captured in docs or emails. Verbal-only doesn't count. |
| **Priority direction lives in the priority surface.** | One-page surface controls what's worked on each week. Exactly one item ACTIVE at a time. Verbal asks do not move items — the client edits the surface (or replies to the Wednesday email in writing) to redirect. Pattern at `/Users/nplmini/code/work/practices/agentic-systems/reference/priority-surface-pattern.md`. |
| **Ellie's async cycle is the primary throughput constraint.** | The SOP is designed around her review cadence, not around any meeting calendar. |
| **The weekly Wednesday email is the standing communication.** | Jenn gets full program visibility from it. No meeting required to recover the same content. |

---

## 2. Roles

| Role | Decision authority | Channel |
|---|---|---|
| **Nick** | Build, prioritize within direction, package for client | Email, docs, this SOP |
| **Agent (current + future)** | Execute scheduled and triggered workflows | n8n, Airtable, gmail/drive APIs |
| **Ellie (client)** | Output approval, rule approval, AAV verification | Email + Google Docs/Sheets markup |
| **Jenn (client)** | Program direction, prioritization, ship/no-ship | Email (status + ad-hoc), optional Thursday slot |

---

## 3. What a play contains — the output definition

A **play** is a complete, repeatable, quality-controlled outbound system targeting one defined segment with one defined offer. It's the unit of work this SOP produces.

A play is delivered iteratively (not as a single drop). Each component below is shipped when it's ready; the play reaches "minimum viable" when all components meet their attribute targets in §4.

**This SOP is play-agnostic.** It describes how to produce any play, regardless of segment, target modality, geography, buyer function, or industry vertical. The values that parameterize a specific play — target geography, size band, stage range, buyer function and seniority, classification vocabulary, exclusion lists, attribute targets — live in that play's own config artifacts (the segment criteria, classification rules, and sourcing rules listed in component A below). The SOP applies those values; it does not contain them.

### Components of a play

| Layer | Component | What it is |
|---|---|---|
| **A. Operating documents** | Priority surface | One-page surface controlling weekly focus. Single ACTIVE item, QUEUED NEXT, AVAILABLE menu, OFF-MENU log. Client edits in writing to direct. |
| | Segment criteria | Hard filters, soft signals (weighted), and disqualifiers defining who's in the segment |
| | Offer artifact | What we're pitching, to whom, anchored on which signal |
| | Classification rules | Vocabulary lists, category/modality buckets, evidence patterns, criteria lists — the rules that determine in-segment vs out-of-segment |
| | Sourcing rules | Active sources, query strings, trust ranks, auto-add thresholds |
| | Creative brief | Tone, proof points, anchors, voice |
| **B. Discovery layer** | Captured account universe | Multi-source raw company captures with provenance per record |
| | Run logs | Per-source captures: what came in, what was rejected, when |
| **C. Classified universe** | Verification status per account | `surfaced` / `borderline` / `rejected` with reason |
| | Modality classification | What therapeutic modality (e.g., AAV, mRNA-LNP, CAR-T) |
| | Delivery vehicle | How the therapy is delivered (AAV, LNP, lentiviral, etc.) |
| | Vector evidence clause | Which classification clause confirmed the AAV-positive call |
| **D. Filtered target list** | Hard-filter-passing accounts | Accounts that pass all 7 segment hard filters |
| | Soft-signal scores | Composite weighted score per account |
| | Outreach eligibility | Binary flag set by L3 filter |
| **E. Enriched account profiles** | Firmographics | HQ location, headcount, funding stage, revenue range |
| | Pipeline intelligence | Lead segment-relevant program details, recent advances |
| | Recent activity signals | Funding events, leadership hires, milestone events, conferences, publications |
| | **Existing-customer relationship (from client CRM)** | Whether account is a current customer; last order/purchase date; lifetime value if exposed |
| | **CRM activity status (from client CRM)** | Known/Unknown classification, last BD touchpoint, owning account team, recent meeting history |
| | **Open pipeline (from client CRM)** | Count of open opportunities, stages, total weighted value if exposed |
| | **Marketing engagement (from client CRM)** | Recent campaign engagement, MEL/MQL stage, content interactions |
| **F. Verified contact list** | Target function contacts | Segment-defined buyer function at each account |
| | Seniority-band contacts | Segment-defined seniority band |
| | Verified emails | Email status confirmed as verified |
| | Tenure data | Time-in-role per contact |
| | **CRM contact status (from client CRM)** | Existing record in client CRM (matched or new), record owner, last contacted date |
| | **Engagement history (from client CRM)** | Email sent / opened / replied / bounced history, meetings logged, prior cadence enrollments |
| | Disqualifying status flags | DNC, hard-bounce, opt-out, concurrent cadence, stale employment |
| **G. Activation artifacts** | Approved message sequences | Email sequence content matching offer + creative brief |
| | Cadence configuration | Sequence assignment per contact, tracking setup |
| | Tracking setup | UTMs, reply tracking, conversion attribution |
| **H. Quality dossier** | Attribute measurements | All attributes from §4, measured at delivery time |
| | Run history | Every capture, classification, filter, enrichment run logged |
| | Approved-rule version | Hash/version of rules approved by client at this run |

### Maturity stages of a play

Not every play is delivered at full completeness at once. A play moves through maturity stages, and the client knows which stage they're receiving.

| Stage | What's included | What the client can do with it |
|---|---|---|
| **M1 — Universe defined** | A, B, C | Verify the AAV classifications, approve rules |
| **M2 — List filtered** | A, B, C, D | See the outreach-eligible universe |
| **M3 — Enriched** | A through E | See signal context per account |
| **M4 — Contactable** | A through F | See the verified contact list ready for outreach |
| **M5 — Activated** | A through G | Launch cadences |
| **M6 — Live with feedback** | A through G + post-activation metrics | Iterate based on reply/meeting/opp conversion data |

**Per-play maturity state lives in the engagement plan and per-play tracking, not in this SOP.** This SOP defines the model; the engagement plan reports where each play sits within it.

---

## 4. Output attributes and acceptance criteria

These are the measurable quality attributes of a play. Each attribute has a definition, a measurement method, a target, and the SOP step that owns producing it. When an output doesn't meet target, §5 maps the attribute back to which step to investigate.

### 4.1 — Operating documents (component A)

| # | Attribute | Definition | Measurement | Target |
|---|---|---|---|---|
| A1 | Segment definition completeness | All 7 hard filters specified, all soft signals weighted, all disqualifiers enumerated | Doc inspection | 100% |
| A2 | Rules approved by client | Most recent rules version explicitly approved by Ellie | Approval date check | Approved within last 30 days |
| A3 | Offer alignment | Offer artifact references the segment criteria and creative brief | Cross-doc check | All three docs internally consistent |

### 4.2 — Discovery layer (components B and C)

| # | Attribute | Definition | Measurement | Target |
|---|---|---|---|---|
| D1 | Active sources count | Number of independent capture sources currently running | Count where `Sources.Active = true` | ≥3 at M4 maturity |
| D2 | Capture volume | Total unique accounts captured | Count of distinct companies | Depends on segment width; track over time |
| D3 | Cross-source confidence | % of accounts confirmed by ≥2 independent sources | (multi-source / total) × 100 | ≥30% at M3+ |
| D4 | Refresh recency per source | Days since last successful run per source | Median (today − Last Refreshed) | ≤30 days |
| D5 | Run log completeness | Every classification or capture run has an Enrichment Runs entry | (runs_with_log / total_runs) × 100 | 100% |

### 4.3 — Classification accuracy (component C)

| # | Attribute | Definition | Measurement | Target |
|---|---|---|---|---|
| C1 | Classification accuracy (true positive rate) | % of surfaced rows the client confirms as in-segment on review | (confirmed_in_segment / surfaced_reviewed) × 100 | ≥85% |
| C2 | False-negative rate (borderline) | % of borderline rows the client reclassifies as in-segment | (in_segment_in_borderline / borderline_reviewed) × 100 | <20% (trending down with each rule update) |
| C3 | False-rejection rate | % of rejected rows the client reclassifies as in-segment | (in_segment_in_rejected / rejected_reviewed) × 100 | <5% |
| C4 | Evidence clause coverage | % of surfaced rows with a populated evidence clause (the classification reason) | (with_clause / surfaced) × 100 | 100% |

### 4.4 — Filter accuracy (component D)

| # | Attribute | Definition | Measurement | Target |
|---|---|---|---|---|
| F1 | Geographic accuracy | % of filtered accounts with HQ in the segment-defined target geography | (in_target_geo / filtered) × 100 | ≥95% |
| F2 | Stage accuracy | % of filtered accounts in the segment-defined stage range | (in_target_stage / filtered) × 100 | ≥90% |
| F3 | Size accuracy | % of filtered accounts in the segment-defined size band | (in_target_size / filtered) × 100 | ≥95% |
| F4 | Parent-company exclusion accuracy | % of filtered accounts NOT on the segment-defined parent-company exclusion list | (independent / filtered) × 100 | ≥98% |

### 4.5 — Enrichment coverage (component E)

| # | Attribute | Definition | Measurement | Target |
|---|---|---|---|---|
| E1 | Firmographics coverage | % of accounts with HQ, size, and funding stage all populated | (complete / total) × 100 | ≥80% |
| E2 | Recent signal coverage | % of accounts with ≥1 signal (funding/hire/IND/conf/pub) in last 90 days | (with_signal / total) × 100 | ≥40% |
| E3 | BD activity check coverage | % of accounts cross-referenced against Salesforce for known/unknown | (with_SF_check / total) × 100 | 100% |
| E4 | Refresh recency (enrichment) | Median days since last enrichment per account | Median (today − Last Enriched At) | ≤45 days |

### 4.6 — Contact list quality (component F)

| # | Attribute | Definition | Measurement | Target |
|---|---|---|---|---|
| K1 | Function accuracy | % of contacts in the segment-defined buyer function | (in_function / total_contacts) × 100 | ≥90% |
| K2 | Seniority accuracy | % of contacts in the segment-defined seniority band | (in_seniority / total_contacts) × 100 | ≥90% |
| K3 | Verified email rate | % of contacts with email status = verified | (verified / total) × 100 | ≥80% |
| K4 | Tenure ≥12 months | % of contacts with start-date in role >12 months ago | (tenure_12mo / total) × 100 | ≥60% |
| K5 | DNC/opt-out exclusion | % of contacts checked against DNC, hard-bounce, opt-out lists | 100% | 100% |
| K6 | Concurrent-cadence exclusion | % of contacts checked for active cadence elsewhere | 100% | 100% |
| K7 | Stale-employment exclusion | % of contacts checked for active employment status (no "open to work," no retired notation) | 100% | 100% |

### 4.7 — Activation readiness (component G)

| # | Attribute | Definition | Measurement | Target |
|---|---|---|---|---|
| G1 | Message sequences approved | Cadences approved by client before launch | Approval check | 100% before cadence start |
| G2 | Tracking setup verified | UTM, reply, conversion tracking all wired and producing data | Live data check | 100% before cadence start |

### 4.8 — Post-activation (component H, M5–M6 only)

| # | Attribute | Definition | Measurement | Target |
|---|---|---|---|---|
| P1 | Reply rate | % of sent messages receiving a reply | (replies / sent) × 100 | Track; targets set per play by client |
| P2 | Meeting conversion | % of replies converting to scheduled meetings | (meetings / replies) × 100 | Track; targets set per play |
| P3 | Opportunity creation | % of meetings producing a Salesforce opportunity | (opps / meetings) × 100 | Track; targets set per play |
| P4 | Cadence completion rate | % of contacts who completed the full sequence (vs. removed mid-cadence) | (completed / started) × 100 | ≥80% (lower indicates list quality issues) |

### 4.9 — Acceptance: when is a play "minimum viable"?

A play is considered minimum viable for outreach launch when:

- All §4.1 attributes meet target (operating docs complete and approved)
- §4.2 D1 ≥ 3 (multi-source capture active)
- §4.3 C1 ≥ 85% (classification accuracy)
- §4.4 F1 through F4 all meet target (filter accuracy)
- §4.5 E3 = 100% (BD activity checked) and E1 ≥ 80%
- §4.6 K1, K2, K3 meet target; K5, K6, K7 = 100%
- §4.7 G1 and G2 = 100% before launch

Lower thresholds mean lower-confidence outreach; the play still runs but client is briefed on what's not met.

---

## 5. Diagnostic matrix — when an output misses target, where to look

This is the lookup table for quality investigation. When an attribute from §4 is below target, the entries here name the SOP step that owns producing that attribute and the artifact most likely to need adjustment.

| If this attribute is below target | Investigate this SOP step (§8.x) | Adjust this artifact |
|---|---|---|
| **A1** Segment definition completeness | Pre-play setup (TBD step) | Segment criteria doc |
| **A2** Rules approved by client | 8.4 Send Ellie approval doc + 8.5 process returns | Classification rules doc; nudge cadence |
| **A3** Offer alignment | Offer extraction (offer-extract skill) | Offer / brief / segment docs |
| **D1** Active sources count | 8.1 L1 capture (per source) | Sources table; build new source workflow |
| **D2** Capture volume | 8.1 L1 capture | Sources query strings, source coverage |
| **D3** Cross-source confidence | 8.1 L1 capture (orchestration across sources) | Multi-source dedup logic; provenance tracking |
| **D4** Refresh recency per source | 8.1 L1 capture (cadence) | Source schedule / cron settings |
| **D5** Run log completeness | 8.2 L2 classify (and 6.1) | Workflow Write Run Log nodes |
| **C1** Classification accuracy | 8.2 L2 classify | Classification rules — likely missing canonical-criteria coverage or category/modality bucket definitions |
| **C2** False-negative rate (borderline) | 8.2 L2 classify | Expand the canonical-criteria list; add evidence clauses for the segment's missing pattern types |
| **C3** False-rejection rate | 8.2 L2 classify | Tighten vocabulary_filter terms; check for over-matches |
| **C4** Evidence clause coverage | 8.2 L2 classify | Workflow output mapping (write the evidence clause field) |
| **F1** Geographic accuracy | L3 filter (TBD step) | Segment-defined geography rule + HQ enrichment quality |
| **F2** Stage accuracy | L3 filter | Segment-defined stage rule + stage-data quality |
| **F3** Size accuracy | L3 filter | Segment-defined size rule + size enrichment quality |
| **F4** Parent-company exclusion | L3 filter | Segment-defined parent-company exclusion list + subsidiary detection enrichment |
| **E1** Firmographics coverage | Enrichment (TBD step) | Enrichment workflow + provider coverage |
| **E2** Recent signal coverage | Signal enrichment (TBD step) | Signal sources, refresh cadence |
| **E3** BD activity check coverage | Known/Unknown enrichment (TBD step) | Salesforce sync; Known/Unknown protocol |
| **E4** Refresh recency (enrichment) | Enrichment cadence | Enrichment schedule, queue management |
| **K1–K2** Function/seniority accuracy | Contact sourcing (TBD step) | Contact sourcing config + segment-defined title/seniority pattern rules |
| **K3** Verified email rate | Email verification (TBD step) | Email verification provider; recapture stale |
| **K4** Tenure | Contact sourcing | LinkedIn enrichment; freshness check |
| **K5–K7** Exclusion checks | Various (DNC, cadence, employment) | Each requires its own enrichment/sync workflow |
| **G1** Sequences approved | Cadence approval cycle (TBD step) | Creative brief + sequence approval workflow |
| **G2** Tracking setup | Cadence setup (TBD step) | UTM template, reply-tracking config, attribution setup |
| **P1–P4** Post-activation metrics | Post-activation review cycle | Cadence design, list quality (loops back to upstream attributes) |

**How to use this matrix in practice:**

1. Pull the latest run's attribute measurements.
2. Identify attributes below target.
3. For each, look up the row in this matrix.
4. Open the named SOP step and the named artifact.
5. Apply the adjustment.
6. Re-run the relevant pipeline layer.
7. Re-measure.

The same matrix is what we show a client to say "here's how we self-correct when output quality slips." It's the meta-product: a self-diagnostic process.

---

## 6. Weekly cadence at a glance

| Day | Activity | Owner | Output | Automation |
|---|---|---|---|---|
| Mon AM | Check returned-from-Ellie queue | AGENT → NICK | Returned-item list with flagged edits | HYBRID |
| Mon | Process Ellie's returned edits | NICK | Rule updates committed, re-runs queued | HYBRID |
| Mon AM (auto) | L1 capture: clinicaltrials.gov scheduled run | AGENT | New raw company records in Companies | AGENT |
| Mon-Tue | L1 capture: other sources (patents, directories, etc.) as built | AGENT | New raw company records | AGENT |
| Mon-Tue | L2 classify: run against any new `needs_verification` rows | AGENT | Classifications written, run log created | AGENT |
| Tue | Package new outputs for client (CSV → Sheet, rules → Doc) | AGENT | Client-facing artifacts in Drive | AGENT |
| Tue-Wed | Send Ellie any new approval-needed docs | AGENT → NICK | Email to Ellie, item tracked in queue | HYBRID |
| Wed EOD | Send weekly status email to Jenn (opens with priority surface state: ACTIVE / QUEUED NEXT / OFF-MENU + confirm-or-redirect prompt) | NICK (compiles AGENT data) | Status email sent | HYBRID |
| Thu (slot) | Standing meeting time — optional, Jenn's call | NICK | Meeting if used, none if not | NICK |
| Fri | Review process metrics + lessons | NICK | SOP updates, memory entries, rule queue adjustments | NICK |
| Any day | Respond to Ellie's returns, Jenn's questions, ad-hoc decisions | NICK | Reply, state change, optional next-step queued | NICK (judgment) |

---

## 7. The deliverable state machine

Every client-facing artifact (rule doc, list, decision request) moves through these states. State is persisted in Airtable (Companies, Classification Rules, and a new `Deliverables` table — to be created).

```
DRAFTED → SENT → AWAITING ─┬→ RETURNED → APPLIED → CLOSED
                          │
                          └→ TIMED_OUT → NUDGE_SENT → AWAITING (loop, max 2 nudges)
                                                  ↓
                                                  ESCALATED (Nick decides)
```

| State | Meaning | Trigger to next state |
|---|---|---|
| DRAFTED | Artifact prepared, not yet sent | Nick reviews and approves for send |
| SENT | Delivered to client (link in email) | Send event logged |
| AWAITING | Waiting on client response | Calendar countdown begins |
| RETURNED | Client has marked up or replied with decision | Markup parsed into action queue |
| APPLIED | Rule update / re-run / list adjustment applied | Verification of update success |
| CLOSED | Deliverable lifecycle done | Archived in clients/teknova/closed/ |
| TIMED_OUT | No response in N days (default: 5 business days for Ellie, 3 for Jenn) | Nudge triggered |
| NUDGE_SENT | Polite follow-up email sent | Awaiting again |
| ESCALATED | Manual review — Nick decides whether to drop, change scope, or push harder | Nick action |

---

## 8. Process steps — detail

### 8.1 — L1 capture run

| Field | Value |
|---|---|
| Trigger | Schedule (Mon 6am CT.gov; weekly/monthly per source) OR manual trigger |
| Owner | AGENT (n8n workflow) |
| Action | Fetch from source, normalize sponsors, upsert to Companies with `Verification Status = needs_verification` |
| Output | New/updated rows in Companies, Enrichment Runs log entry |
| State change | New rows enter `needs_verification` state |
| Automation | AGENT (live for CT.gov; built per source as added) |

### 8.2 — L2 classify run

| Field | Value |
|---|---|
| Trigger | New rows in `needs_verification` state OR manual trigger after rules update |
| Owner | AGENT (n8n workflow) |
| Action | Read Classification Rules, apply to each candidate, write Verification Status + Vector Evidence Clause + Classification Notes |
| Output | Rows now in `surfaced` / `borderline` / `rejected` state; run log entry |
| State change | `needs_verification` → one of the three terminal classifications |
| Automation | AGENT (live) |

### 8.3 — Package output for client

| Field | Value |
|---|---|
| Trigger | New rows added to `surfaced` or `borderline` state AND >N rows since last delivery (default N=10) OR manual |
| Owner | AGENT (script: Airtable query → CSV → Google Sheets upload → share link) |
| Action | Query relevant rows, format columns per template, upload to client's Drive folder, generate share link |
| Output | Google Sheet with shareable link; Deliverables row created with state=DRAFTED |
| State change | Deliverable enters DRAFTED state, awaiting Nick's send approval |
| Automation | AGENT (Drive upload + Sheets format = buildable now; Nick's send approval = HYBRID) |

### 8.4 — Send approval-needed doc to Ellie

| Field | Value |
|---|---|
| Trigger | Deliverable in DRAFTED state, Nick approves send |
| Owner | AGENT (gmail API) or NICK |
| Action | Send email to Ellie with link, approve-or-adjust framing, deadline (default 5 business days) |
| Output | Email sent; Deliverables row state=SENT; calendar timer starts |
| State change | DRAFTED → SENT → AWAITING |
| Automation | HYBRID — agent drafts and queues, Nick clicks send (or auto-send for routine items per Nick's whitelist) |

### 8.5 — Process Ellie's returned doc

| Field | Value |
|---|---|
| Trigger | Reply email from Ellie OR Drive notification on shared doc edit |
| Owner | HYBRID — agent detects, Nick interprets, agent applies |
| Action | (a) Agent parses email/doc markup, surfaces edits to Nick. (b) Nick decides which edits are rule changes vs per-row overrides. (c) Agent writes changes back: rule updates → Classification Rules table; per-row overrides → Companies. (d) Trigger L2 re-run if rules changed. |
| Output | Updated Classification Rules row(s), updated Companies row(s), new classification run |
| State change | AWAITING → RETURNED → APPLIED → CLOSED (or back to DRAFTED for re-package if scope shifted) |
| Automation | HYBRID — markup parsing is automatable but Nick's judgment on rule-vs-row stays for now |

### 8.6 — Weekly status email to Jenn

| Field | Value |
|---|---|
| Trigger | Wednesday EOD (calendar) |
| Owner | HYBRID — agent assembles, Nick writes/sends |
| Action | (a) Agent reads the priority surface (Drive doc) for current ACTIVE, QUEUED NEXT, and any OFF-MENU items raised this week. (b) Agent queries state machine: what shipped this week, what's in client's queue, what's blocked, what's coming next, what decisions need the client. (c) Renders both the priority surface state and the status sections into the template. (d) Nick reviews, adjusts narrative tone, sends. |
| Output | Email sent to Jenn (Ellie cc'd) |
| State change | Logged in clients/teknova/weekly/teknova-weekly-status-YYYY-MM-DD.md |
| Automation | HYBRID — full automation requires agent voice that sounds like Nick; today, agent drafts, Nick edits/sends |

### 8.7 — Respond to Ellie's day-to-day questions

| Field | Value |
|---|---|
| Trigger | Email or chat message from Ellie outside the approval cycle |
| Owner | NICK (judgment-heavy) |
| Action | Reply same business day. If the question reveals a rule gap, queue a rule update. If it surfaces a missing field, queue an SOP update. |
| Output | Reply email, optional follow-up actions in the queue |
| State change | If new request → DRAFTED for next deliverable; otherwise none |
| Automation | NICK for now. Future: agent drafts response with citation, Nick approves. |

### 8.8 — Respond to Jenn's ad-hoc decision requests

| Field | Value |
|---|---|
| Trigger | Email from Jenn between Wednesday updates |
| Owner | NICK |
| Action | Reply with decision context, recommendation, and what action will follow once she answers. |
| Output | Reply email; if she decides, queue downstream action. |
| State change | Decision logged in decisions ledger (TBD: small table for tracking decision history) |
| Automation | NICK |

### 8.9 — Nudge / escalation

| Field | Value |
|---|---|
| Trigger | Deliverable in AWAITING state > N business days (5 for Ellie, 3 for Jenn) |
| Owner | AGENT triggers, NICK reviews |
| Action | Agent drafts polite nudge email referencing the original deliverable + deadline; Nick reviews and sends (or auto-sends from whitelist). After 2 nudges, escalate to NICK for judgment call. |
| Output | Nudge email sent OR escalation flag set |
| State change | AWAITING → NUDGE_SENT → AWAITING (max 2x) → ESCALATED |
| Automation | HYBRID |

### 8.10 — Friday process review

| Field | Value |
|---|---|
| Trigger | Friday afternoon |
| Owner | NICK |
| Action | Review: what's stuck and why. Which rules need expansion. Which deliverables timed out. Which patterns from this week become memory entries. |
| Output | SOP updates, memory entries, queue priority adjustments for next week |
| State change | None directly; influences next week's queue |
| Automation | NICK |

---

## 9. Artifacts and templates

| Artifact | Path | Audience | Update cadence |
|---|---|---|---|
| Engagement plan (program direction + working model) | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-engagement-plan-2026-05-12.md` | Client (Jenn primary) | When direction shifts |
| Priority surface (weekly focus mechanism) | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-priority-surface.md` + Drive mirror | Client (Jenn primary) | When client edits direction; mirrored every Wednesday |
| Priority surface pattern (practice-level reference) | `/Users/nplmini/code/work/practices/agentic-systems/reference/priority-surface-pattern.md` | Internal + reusable across engagements | When pattern evolves |
| This SOP | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-engagement-sop-2026-05-12.md` | Internal | When process changes |
| Weekly status email template | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-weekly-status-template.md` | Internal | When format evolves |
| Per-week status email (filled) | `/Users/nplmini/code/work/accounts/clients/teknova/teknova-weekly-status-YYYY-MM-DD.md` | Client (Jenn) | Weekly |
| Classification rules (current AAV play) | `/Users/nplmini/code/work/accounts/clients/teknova/ellie-aav-classification-rules-2026-05-12.md` + Airtable Classification Rules table | Client (Ellie) | When rules evolve |
| Discovery lists | `/Users/nplmini/code/work/accounts/clients/teknova/ellie-aav-discovery-YYYY-MM-DD.csv` | Client (Ellie) | Per capture/classify run |
| Decision requests | (TBD: ledger in Airtable or markdown) | Internal | Per request |

---

## 10. Integrations register

Every external system the engagement touches lives here: what data flows, in which direction, where it lands, and current operational status. When a new integration is proposed, it gets a row here as `planned`. When it's live, the status updates. This register is the single source of truth for "what does the data plumbing look like."

The integrations register is play-agnostic. A new play may use a subset of these integrations, or trigger a new integration to be added. Either way, the register is where the integration is described.

### 10.1 — Integrations table

| System | Purpose | Direction | Where data lands | Refresh | Status | Owner |
|---|---|---|---|---|---|---|
| **Client CRM (Salesforce)** | Existing account & contact intelligence, BD activity history, open pipeline, marketing engagement, outbound write-back of new leads and cadence enrollment | Bidirectional | Companies + Contacts (read); Salesforce native (write) | TBD per build (target: daily incremental + on-demand) | In build / planned | Nick + client SF admin |
| **clinicaltrials.gov** | Discovery source (regulatory-stage activity) | Inbound | Companies | Weekly | Live | Nick |
| **USPTO PatentsView** | Discovery source (platform investment signal) | Inbound | Companies | Monthly | Planned | Nick |
| **Industry directories (ARM Atlas, ASGCT, etc.)** | Discovery source (pre-classified by modality) | Inbound | Companies | Quarterly | Planned | Nick |
| **PubMed** | Discovery source (academic and preclinical) | Inbound | Companies | Monthly | Planned | Nick |
| **Explorium** | Primary firmographics enrichment provider — HQ, size, funding stage, revenue range, NAICS, industry classification | Inbound | Companies (enrichment fields) | Per-account monthly | Live (provider integration); workflow integration into pipeline planned | Nick |
| **Exa / Perplexity** | Web-grounded enrichment search (verification, descriptions, URL resolution) | Inbound | Companies (enrichment fields) | On-demand | Live | Nick |
| **Clay** | Legacy firmographics provider | Inbound | Companies (enrichment fields) | n/a | Deprecating — being replaced by Explorium | Nick |
| **Contact enrichment provider (Apollo / Hunter / equivalent)** | Contact sourcing + verified email + tenure data | Inbound | Contacts | Per-contact on-demand | Planned | Nick |
| **Email tracking / cadence platform** | Outbound delivery, open/reply/bounce tracking | Bidirectional | Engagement history (read); cadence platform (write) | Continuous | Planned (depends on which platform Teknova standardizes on) | Nick + Teknova |
| **Airtable (RevOps Surface base)** | Operational data store; the play's working substrate | Internal | All play data, runs, rules | Always live | Live | Nick |
| **n8n** | Workflow orchestration platform; runs all capture, classify, enrich, sync workflows | Internal | n/a (orchestration layer) | Always live | Live | Nick |
| **Google Drive / Sheets / Docs** | Client delivery channel; rules docs, lists, status reports | Outbound | Client's Google Workspace | Per deliverable | Live | Nick |
| **Gmail / email** | Client communication channel; status updates, decision requests, list delivery notifications | Bidirectional | Inbox / outbox | Continuous | Live | Nick |

### 10.2 — Salesforce specifically: what we expect from the integration

The client CRM (Salesforce) integration is large enough to deserve a dedicated paragraph. When operational, it provides for every account in the captured universe:

- **Match status:** is this account already in the client's CRM? (matched / new / fuzzy-match-flagged)
- **Account stage:** prospect / opportunity / customer / churned / inactive
- **Customer flag + history:** is this an existing customer? When was last order/purchase? What products?
- **BD activity:** last contacted date, owning rep, last meeting date, last logged activity
- **Open pipeline:** count of open opportunities, stages, value (if exposed)
- **Marketing engagement:** recent campaign engagement, MEL/MQL stage, last content interaction
- **Per-contact match:** is this contact already in the CRM? With which record owner? What's their email engagement history?
- **Per-contact cadence status:** are they enrolled in any active cadence? Were they enrolled historically?
- **Per-contact exclusion flags:** DNC, hard-bounce, opt-out

The integration writes back, for new leads we surface and the client decides to engage:

- New lead / contact records (with provenance: which play, which source, which classification run)
- Cadence enrollment events
- Activity logging (sends, replies, meetings booked)

**Status as of v1.3:** the Salesforce integration is in `planned` state for read-side and `planned` for write-side. The read side is the gating dependency for §4.5 E3 (BD activity check coverage), §4.5 E1–E4 (enrichment), and §4.6 K5–K7 (contact disqualifier flags) to reach target. Until it's live, those attributes are measured at lower confidence or skipped, and that's surfaced in the weekly status email.

### 10.3 — Integration health monitoring

Each integration listed here also has implicit health attributes that get monitored:

| Health attribute | What it measures | Where it surfaces |
|---|---|---|
| Last successful refresh date | Whether the integration is actually running | §11 process metrics + weekly status email if stale |
| Error rate | % of refresh attempts that error | §11 process metrics; auto-alert above threshold (TBD) |
| Record-throughput per refresh | How many records the integration processed | Run log per refresh |
| Coverage gap (records expected vs received) | Whether the integration is partially failing silently | Spot check; weekly summary if drift detected |

When an integration's health metric drops below an acceptable threshold, the diagnostic matrix in §5 routes the investigator to that integration's owner.

### 10.4 — When a new integration is needed

A new integration is added to this register when:

- A new data source is identified (e.g., a new discovery source for a new play)
- A client system needs to read or write that we haven't connected to (e.g., a different CRM, a marketing automation platform, a billing system)
- An existing data provider is replaced (e.g., switching enrichment providers)

The build process for a new integration (scoping, building, testing, deploying) lives in the separate Build Roadmap document at `/Users/nplmini/code/work/accounts/clients/teknova/teknova-build-roadmap.md`. This register tracks what exists or is planned; the Build Roadmap tracks how it gets built and in what order.

---

## 11. Build roadmap (summary)

This section is a one-page snapshot of what's currently in the build pipeline. The full backlog — with priorities, effort estimates, dependencies, status, and target dates — lives in:

`/Users/nplmini/code/work/accounts/clients/teknova/teknova-build-roadmap.md`

Build work is divided into four categories. Anything in flight or planned fits into one of them.

| Category | What it covers | Examples |
|---|---|---|
| **Integrations** | New external system connections (read, write, or bidirectional) | Salesforce sync, Drive/Sheets connector, new enrichment provider |
| **Source workflows** | New capture pipelines (typically n8n) | USPTO PatentsView, ARM Atlas, PubMed, industry directory scrapers |
| **Process automations** | Agent or workflow automations that take over a SOP step | Auto-packaging client deliverables, weekly status assembly, return-doc parsing, nudges, decisions ledger |
| **Schema and data-model changes** | Airtable schema additions, new tables, new field types | Deliverables tracking table, decisions ledger table, new attributes per play |

Each item in the Build Roadmap doc carries: name, category, priority, effort estimate, dependencies, status (planned / in-build / in-test / live / deprecated), owner, and current notes.

When the diagnostic matrix in §5 points to a capability that doesn't exist yet (e.g., "L3 filter step" or "enrichment workflow"), the corresponding build appears in the roadmap with its current status. The SOP never blocks on a missing build — it surfaces the gap, names it, and the build roadmap tracks how it gets closed.

---

## 12. Process metrics (operational health, complements §4 output quality)

Tracked weekly (in the Friday review):

| Metric | What it tells us | Target |
|---|---|---|
| Cycle time per deliverable (SENT → CLOSED) | How long the loop takes | <10 business days |
| Deliverables AWAITING > 5 days | Ellie's queue depth | <3 at any time |
| Deliverables ESCALATED | Where async is failing | 0 per week if healthy |
| Wednesday email sent on time | Cadence discipline | 100% |
| Decision requests open > 3 days | Jenn responsiveness | <2 at any time |
| Captures completed without intervention | Pipeline health | 100% |

---

## 13. When this SOP gets revised

- After every change to the operating model (e.g., new source added, new role engaged, new template)
- After any pattern emerges in the Friday review that should be encoded
- Quarterly review whether or not anything triggered it

When revising, bump the version number and date in the header, capture what changed in a brief changelog at the bottom.

---

## Changelog

- 2026-05-12 — v1.0 initial SOP defined after rebuild of AAV pipeline and shift to email-and-doc cadence with Jenn.
- 2026-05-12 — v1.1 added §3 (play output definition), §4 (output attributes + acceptance criteria), §5 (diagnostic matrix). SOP now functions as production manual, quality framework, and client agreement.
- 2026-05-12 — v1.2 made the SOP play-agnostic. Removed segment-, modality-, geography-, function-, and exclusion-specific values from the spec. Those values now live in each play's config artifact (segment criteria, classification rules, sourcing rules), and the SOP applies them generically. Added the play-agnostic statement to §3.
- 2026-05-12 — v1.3 added §10 Integrations register (with explicit treatment of client-CRM/Salesforce as the largest pending integration), expanded §3 components E and F to make CRM-sourced data explicit, and replaced the v1.0 agent-automation roadmap with §11 Build roadmap (summary), with the living backlog moved to a separate Build Roadmap doc.
- 2026-05-12 — v1.4 integrated the priority surface pattern: added the priority-direction principle to §1, added Priority surface as a component A operating document in §3, modified §6 Wednesday email row and §8.6 to pull priority surface state into the status email, and added the surface + practice-level pattern doc to §9 artifacts. Provider strategy updated in §10: Explorium as primary firmographics, Clay deprecating. Mika removed from cc lines.
