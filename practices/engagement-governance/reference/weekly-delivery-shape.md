# Weekly Delivery Protocol

Internal operating protocol for one client engagement, one week. Defines artifacts, transitions, decision rules, and failure modes. Reference for running the cadence — not for showing to clients.

---

## Artifacts (the data model)

### Roadmap

- **File:** `accounts/<type>/<name>/artifacts/roadmap-<name>.md`
- **Owner:** operator
- **Updated:** every Thursday afternoon, after the working session
- **Fields per item:**
  - Item name (verb-led, short)
  - Status: `Backlog` | `Next` | `This Week` | `Shipped` | `Deferred` | `Killed`
  - Size: `small` (≤1 slot) | `medium` (1 slot) | `large` (must be decomposed before pickup)
  - Sponsor priority: `1=must` | `2=should` | `3=nice`
  - Dependencies (other item IDs, or blank)
  - Date added
  - Date status last changed
  - Notes

### This Week's Slot

A roadmap item with status `This Week`. Exactly one per engagement tier slot (1 for Solo, 2 for Multi, 3+ for Full). Locked Thursday afternoon. Cannot change until next Thursday.

### Weekly Update

- **File:** `accounts/<type>/<name>/artifacts/weekly-updates/YYYY-MM-DD.md`
- **Owner:** operator
- **Delivered:** Friday by EOD, in sponsor's channel
- **Fields:**
  - Date
  - This week's slot (link to roadmap item)
  - What shipped
  - What's in flight or blocked
  - Next week's slot (per Thursday decision)
  - Bottleneck: `ours` | `sponsor` | `expert` | `none`, with one-sentence reason
  - Open scope-change items

### Scope-Change Notification

- **File:** `accounts/<type>/<name>/artifacts/scope-change-YYYY-MM-DD-<slug>.md`
- **Owner:** operator
- **Delivered:** within 48 hours of qualifying request
- **Fields:**
  - Request as written
  - Whether it fits current roadmap (yes → add and sequence; no → continue below)
  - Estimated size in slots
  - Three options for sponsor: add and re-price, defer to future month, decline
  - Decision deadline: 48 hours from delivery

### Portfolio row

Lives in `practices/engagement-governance/state/portfolio.md`. One row per active engagement. Updated Monday morning.

Fields: engagement | sponsor + channel | Trajectory status | this week's slot + owner | last Weekly Update date | open scope-changes | bottleneck

---

## Weekly protocol

### Monday AM

- Open `portfolio.md`
- For each engagement: verify this week's slot is locked, owner is assigned
- If a slot is unlocked or missing: do not start work; escalate via email to sponsor citing the missed Thursday decision

### Monday – Wednesday

- Execute this week's slot per engagement
- Log progress as notes on the roadmap item daily
- Async in-scope (conceptual) questions: answered within 48 hours
- Async out-of-scope (operational) questions: trigger Scope-Change Notification within 48 hours; do not answer

### Thursday

**T-30 min — prep:**

- Pull this week's slot status (shipped / in flight / blocked)
- Pull current roadmap, ordered by priority
- Identify top 3 candidate slots for next week (dependency-ready, sized to fit)
- Pull any pending scope-change items needing decision

**Session — 60 min fixed agenda:**

1. Status: what shipped this week (5 min)
2. Roadmap review: order, additions, removals (15 min)
3. Next-week slot decision (10 min)
4. Open scope-changes: surface for decision (15 min)
5. Buffer / outstanding (15 min)

**T+2 hr — close:**

- Mark shipped items, lock next week's slot, add new items, reorder per session
- Update portfolio row

### Friday

- Send Weekly Update by EOD
- Verify open scope-changes have a decision deadline and a delivery date

---

## Decision rules

| Trigger | Action |
|---|---|
| Verbal or Slack request from sponsor | If fits roadmap: add at Thursday session. If exceeds standard week shape: Scope-Change Notification within 48 hours. |
| Sponsor no-shows Thursday | Default next week's slot to last week's continuation; send Weekly Update with "no session held; next slot defaults to [X]; reply by Monday EOD to override" |
| No decision on Scope-Change in 48 hours | Treat as deferred; surface in Weekly Update; do not absorb |
| Slot can't ship this week | Move to `in flight`; carry over only if sponsor agrees in Thursday session; never silently roll over |
| Two priorities conflict mid-week | Sponsor decides at Thursday session; if no decision, default to roadmap priority order |
| Build hits unknown dependency | Mark item blocked; surface in Friday Update; queue alternative slot from roadmap for next week |
| Sponsor sends urgent ask mid-week | Acknowledged, queued for Thursday session; not started before Monday unless tier > Solo or it's a Scope-Change with same-day pricing |

---

## Failure modes

| Failure | Recovery |
|---|---|
| Thursday session skipped 3+ weeks running | Trajectory marked `Stale` on portfolio; escalation: explicit cadence-commitment conversation with sponsor |
| Slot shipped 0 times in a month | Audit: capacity, dependency, or sponsor-priority churn? Surface diagnosis to sponsor in next Weekly Update |
| Same scope-change comes back 3x without decision | Treat as implicit rejection; drop from active list; requires new written request to re-enter |
| Sponsor cancels Trajectory mid-month | Closeout Trajectory drafted per `methodology.md` |
| Sponsor exceeds slot count expectation repeatedly | Surface in Weekly Update with overage hours; second occurrence triggers Scope-Change Notification proposing tier upgrade |

---

## Always out of standard cadence

These trigger Scope-Change Notification when requested, regardless of tier:

- Additional meetings beyond the Thursday session
- Same-day turnaround
- More than the tier's slot count per week
- Live operational support: debugging on sponsor's side, walkthroughs, screen-shares, joining sponsor team calls
- Documentation, training, or knowledge transfer for sponsor team
- Configuration on sponsor's infrastructure
- After-hours availability

---

## Tier mechanics

| Tier | Slots / week | Thursday session | Roadmap structure |
|---|---|---|---|
| Solo | 1 | 60 min | One roadmap |
| Multi | 2 | 90 min | Two parallel roadmaps or one with two slot tracks |
| Full | 3+ | 90 min + 30 min mid-week sync | Multiple roadmaps; custom System dev tracked separately |

---

## Operator checks (run weekly)

- [ ] Every active engagement has a locked slot for the current week
- [ ] Every active engagement has a Weekly Update from last Friday
- [ ] Every open scope-change has a decision deadline
- [ ] Portfolio row updated Monday for every engagement
- [ ] Roadmap status counts match Weekly Update content
- [ ] No engagement running without an approved Trajectory
