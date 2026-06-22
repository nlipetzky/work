# KAI Internal Execution Plan ... Medical Device Robotics

**Artifact type:** Execution plan (Deepline-native)
**Pairs with:** `kai-internal-play-medical-device-robotics-v0-2026-05-26.md`
**Version:** v0
**Status:** Draft (no execution authorized yet)
**Approver:** Nick Lipetzky (operational); Will Rosellini (commercial approvals on outputs)
**Owner:** Nick Lipetzky
**Created:** 2026-06-08
**Linked artifacts:**
- Play: `accounts/ventures/konstellation-ai/artifacts/kai-internal-play-medical-device-robotics-v0-2026-05-26.md`
- ICP titles: `accounts/ventures/konstellation-ai/artifacts/kai-internal-icp-titles-v0-2026-05-26.md`
- Trajectory: `accounts/ventures/konstellation-ai/artifacts/kai-internal-trajectory-v0-2026-05-26.md`
- CRM landing: Airtable base `app5tsy6zjfA8H3rx`
- Deepline skill: `/Users/nplmini/.claude/skills/deepline-gtm/`

---

## What this is

The Deepline-native execution plan for the approved KAI Internal play. The play defines who, what, why. This plan defines the row-by-row sequence Deepline runs to convert the segment definition into enriched Tier A contacts handed off to HeyReach. No paid action runs without a pilot-and-approval gate ... see Approval Gates below.

This is also the dogfood test: does Deepline (CSV-lineage, scripted, approval-gated) outperform Nick's current system (Clay + n8n + Airtable-as-surface) for this kind of work.

## Working directory

`deepline/data/kai-medrobotics-v0/`

All intermediate CSVs land here. Source CSVs never edited in place. Final outputs registered to the Session UI for visibility.

## Phase sequence

### Phase 1 ... Build the company universe

**Goal:** CSV of every NA medical-device-robotics company sized $10M-$100M revenue where the robot IS the device.

**Approach:**
1. `deepline tools search --categories company_search --search_terms "medical device,industry filters"` to confirm provider mix.
2. Parallel broad pulls from Apollo, Crustdata, and Vibe Prospecting (Explorium) against medical device industry codes + revenue band ($10M-$100M) + HQ filter (US, CA).
3. Keyword overlay: surgical robot, rehab robot, diagnostic robot, imaging robot, robotic delivery, robotic surgical system. Captured into a `keyword_match` column, not used as a hard filter (per `feedback_keep_all_captured_data.md`).
4. Dedupe across providers on domain.

**Output:** `deepline/data/kai-medrobotics-v0/companies-raw.csv`

**Gate:** Pilot pull with `limit: 1` per provider to confirm filter syntax + see total-match counts (TAM sizing hack). No approval needed for size-1 pulls.

---

### Phase 2 ... Classify and filter

**Goal:** Drop RPA-serves-medtech, component suppliers, distributors, and anything that doesn't fit "robot IS the device." Tag sub-segment.

**Approach:**
1. `deepline enrich --input companies-raw.csv --output companies-classified.csv` with a `deeplineagent` column.
2. Prompt: "Is this company's primary product a robot that operates as a medical device on patients? Yes/No, with one-line reasoning. If yes, classify sub-segment: surgical / rehab / diagnostic / imaging / delivery / other."
3. Filter: keep only Yes rows.
4. Apply hard disqualifiers from the play: drop >$100M revenue, drop law/IP firms, drop non-NA, drop Will's no-contact list (pending from Will).

**Output:** `deepline/data/kai-medrobotics-v0/companies-classified.csv`

**Gate:** Pilot `--rows 0:5` to confirm the classifier reasoning matches play intent before running on the full universe. Approval needed for full run (paid `deeplineagent` call per row).

---

### Phase 3 ... Tier A contact discovery

**Goal:** Founders and CEOs at companies sized $10M-$30M (Tier A first, per play sequencing).

**Approach:**
1. Filter `companies-classified.csv` to the $10-30M revenue slice.
2. Over-provision: target 1.4× the desired contact count (per skill's "over-provision then filter" rule).
3. `deepline enrich` with people-search step keyed on company_id, title filters: Founder, Co-Founder, CEO, Chief Executive Officer.
4. Provider mix: Apollo `mixed_people_api_search` primary, Crustdata person search as backup for misses.

**Output:** `deepline/data/kai-medrobotics-v0/contacts-tier-a-raw.csv`

**Gate:** Pilot `--rows 0:1` per provider to verify title-filter behavior + cost. Approval needed for full run.

---

### Phase 4 ... Contact enrichment waterfall

**Goal:** LinkedIn URL + verified email per contact.

**Approach:**
1. LinkedIn URL resolution: Apify LinkedIn lookup actor; fallback PDL person enrichment.
2. Email finder waterfall (`run_javascript` coalescing): Hunter → Findymail → Prospeo → Leadmagic. First non-empty wins.
3. Email validation: Leadmagic email validation. ZeroBounce only for catch-all dispositions.
4. Job-change check: PDL `peopledatalabs_person_enrich` to catch role-change misses before send.

**Output:** `deepline/data/kai-medrobotics-v0/contacts-tier-a-enriched.csv`

**Gate:** Pilot `--rows 0:1` to confirm waterfall ordering + email validation result shape. Approval needed for full run (most credit-intensive phase).

---

### Phase 5 ... Personalization research

**Goal:** One concrete hook per contact Will can riff on in the LinkedIn opener.

**Approach:**
1. `deepline enrich` adds a `deeplineagent` research column per contact.
2. Prompt scope: company-level only ... what robot they make, most recent funding event, recent clinical milestone or FDA action, recent leadership hire signaling GTM build-out.
3. Output a single-sentence hook + a source URL.
4. Strict source-tagging discipline (per `copy-draft` skill rules): no claim without a URL.

**Output:** `deepline/data/kai-medrobotics-v0/contacts-tier-a-ready.csv`

**Gate:** Pilot `--rows 0:3` so Will can sanity-check the hook quality before scaling. Approval needed for full run.

---

### Phase 6 ... Activation handoff

**Goal:** Tier A contacts loaded into HeyReach campaign Will runs under his identity.

**Approach:**
1. Filter `contacts-tier-a-ready.csv` down to the N best rows (per "filter at the end" rule).
2. `deepline tools execute heyreach_add_leads_to_campaign_v2` with the campaign ID Will has already created.
3. Tag every lead with `play=kai-medrobotics-v0` and `tier=A` for downstream filtering.

**Output:** Leads in HeyReach + audit row in `deepline/data/kai-medrobotics-v0/activation-log.csv`

**Gate:** Final review by Nick of the list before HeyReach push. No paid surprise here ... HeyReach push itself is free; the cost is Will's calendar.

---

### Phase 7 ... Event capture loop (cloud workflow)

**Goal:** Every HeyReach reply, connection, and meeting-booked event lands in Airtable base `app5tsy6zjfA8H3rx` Prospects/Events tables in near-real-time.

**Approach:**
Two viable paths ... pick one before this phase runs.

| Path | Pros | Cons |
| --- | --- | --- |
| **Deepline cloud workflow** (per `workflows-hello-world` recipe) | Stays in Deepline ecosystem; tests the cloud-workflow primitive | New surface for Nick; deploy/verify loop required |
| **n8n workflow** (existing pattern) | Nick already operates n8n confidently; Airtable nodes proven | Splits the GTM stack across two tools |

**Recommendation:** Deepline cloud workflow for v0 since the whole point is to evaluate Deepline end-to-end. If it underperforms, swap to n8n in v1.

**Output:** Cloud workflow ID + verified webhook delivery + Airtable Events rows.

**Gate:** Smoke-test with `execution_mode: smoke_test` before activating.

---

### Phase 8 ... Analytics + Learning Loop

**Goal:** Funnel visibility for the play's success criteria (30 calls, demand signal, 1 paid client).

**Approach:**
1. Airtable views handle short-term operator visibility (Will's working surface).
2. After ~10 conversations, run `deepline-analytics` against Snowflake semantic layer for reply-rate, meeting-rate, qualification-rate by sub-segment.
3. Output feeds Learning Questions Q1-Q7 in `accounts/ventures/konstellation-ai/reference/learning-questions.md`.
4. Approved Learnings update the play artifact (version increments per `feedback_never_reauthor_segment_artifact.md` ... derive, never re-author the play wholesale).

**Gate:** None for analytics queries (free). Learning-loop updates route through Hermes to Will.

---

## Approval gates summary

Five hard stops where paid action waits on explicit approval:

| Phase | What runs | Pilot scope | Why the gate |
| --- | --- | --- | --- |
| 2 | `deeplineagent` classifier across full universe | `--rows 0:5` | Reasoning quality check before scaling per-row cost |
| 3 | People-search on Tier A company slice | `--rows 0:1` per provider | Confirm title-filter behavior + cost shape |
| 4 | Full enrichment waterfall (LinkedIn + email + verify) | `--rows 0:1` | Most credit-intensive phase; verify each provider in the chain |
| 5 | `deeplineagent` personalization research | `--rows 0:3` | Will sanity-checks hook quality before scaling |
| 6 | HeyReach push | Final list review | Once in HeyReach, the sequence starts; Will's identity is on the line |

Each approval message uses the four-section template from the Deepline skill (Assumptions, CSV Preview, Credits + Scope + Cap, Approval Question). No exceptions.

---

## Where this differs from Nick's current system

1. **CSV lineage > Airtable-as-surface for mid-pipeline state.** Airtable still owns post-activation state (Prospects, Events, Artifacts, Learnings). Deepline owns pre-activation enrichment. Decide whether to mirror enriched contacts into Airtable Prospects pre-push or only post-push.
2. **Pilot-then-approval gate is enforced, not optional.** Different from the Clay model where you can accidentally run an expensive column across the whole table.
3. **Row-safe retries built in.** No homegrown rate-limit handling in `run_javascript` blocks.
4. **`deeplineagent` replaces manual Clay AI-column wiring.** Cleaner ergonomics, same model behavior.
5. **Playground sheet is the live observable surface during a run.** Operator can interject mid-run. Different muscle than refreshing an Airtable view.

---

## Open decisions before execution starts

1. **Sub-segment prioritization** ... Will to confirm whether one of surgical / rehab / diagnostic / imaging / delivery gets Phase 3 first, or run all flat (play default).
2. **No-contact list** ... Will to confirm companies he has current advisory/board/commercial relationships with. Drop these in Phase 2.
3. **Target contact count for v0** ... play references 30 calls as the Phase 6 milestone. Need a concrete number for Phase 3 over-provision math. Default: pull 70 enriched contacts to land 50 in HeyReach to net ~30 conversations at typical LinkedIn reply rates.
4. **Event capture path** ... Deepline cloud workflow vs n8n for Phase 7. Recommendation above is Deepline for v0.
5. **Airtable mirror timing** ... mirror enriched contacts into Airtable Prospects table pre-push (so Will sees the full enriched cohort) or only mirror on first response event.

---

## Context gaps named

1. **No Deepline-vs-current-system success criteria written down.** This plan executes the work but doesn't define what "Deepline outperformed" looks like. Worth a one-page rubric (credit efficiency, time-to-list, operator satisfaction, error rate) before Phase 1 runs.
2. **HeyReach campaign ID and copy not linked from this plan.** Phase 6 references a campaign Will set up; the campaign artifact should be linked once the copy passes through the `copy-draft` skill + Hermes loop.
3. **Airtable schema for Prospects/Events tables not validated against Deepline output columns.** Risk of column-name drift between what Deepline writes and what Airtable expects. Schema-check pass needed before Phase 7 wiring.

---

## Approval

Nick approves this plan to begin Phase 1 (free TAM-sizing pulls only). Each subsequent phase carries its own approval gate per the table above.
