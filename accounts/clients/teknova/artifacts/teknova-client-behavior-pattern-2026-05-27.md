# Teknova Engagement — Client-Side Behavior Pattern

**Compiled:** 2026-05-27
**Purpose:** Reconstruct how Teknova managed their side of the engagement — week-to-week asks, focus shifts, decision behavior, and the lead-up to the 2026-05-26 cancellation — so the Closeout Trajectory can be drafted against the realistic posture of the sponsor, not the contractual one alone.
**Source:** NotebookLM notebook "Teknova Events" (id `6a18ae7c-f596-4dc7-80f2-3c1e0b72575a`), 28 sources covering meeting transcripts Jan 28 through May 18.

---

## 1. Chronological focus by week

### Phase 1 — Plumbing (Jan–early March 2026)

Focus: getting n8n connected to Salesforce, mapping fields, opening the sandbox.

- **Jan 28 (Sandbox + N8N):** David Pezzulo, Logan West attended. Connected n8n to SF Sandbox. Logan/David committed to providing Sandbox ID and confirming `Email Opt Out` is the suppression flag. Delivered same-call.
- **Feb 26 (Ellie working session, via email PDF):** Ellie raised messy data complaints — names with "PhD" suffixes, ALL CAPS company names, internal Salesforce tags polluting fields, SF overriding our LinkedIn URLs. Committed to working session.
- **Early March (SF sync work session):** Mika, Ashley, Logan, Ellie. Clarified Lead vs. Contact mapping. Mika asked for Company Snapshots → SF Accounts. Ashley committed to replicating Contact fields onto Lead object. Bi-directional sync unresolved.

### Phase 2 — Data quality (mid-March)

Focus: cleaning the master database, getting field mappings right.

- **Mar 12 (Review):** Ellie, Jenn, Mika, Sasha. Ellie raised that her biggest bottleneck is **inside Teknova** ("within Salesforce"). Mika questioned the Allogeneic list's integrity (dupes, lost Big Pharma).
- **Mar 18 (Ashley 15-min):** Troubleshoot broken oAuth blocking write-to-production. Ashley committed to setting up an external client app to bypass Active Directory / Duo. **Direct SF write remained partially blocked by Teknova IT through April.**
- **Mar 19 (Weekly):** Jenn, Mika, Sasha (Ellie PTO). Jenn pushed hard for scraping walled-garden conference apps (BPI West, Terrapin, Informa). Quoted: "I just spent $20,000 on an event and want the attendee list." Provided her personal login credentials. Pushed using hiring/funding signals as "diagnostics" not as outreach triggers.
- **Mar 26 (Weekly):** Ellie, Mika, Sasha. Mika clarified Big Pharma exclusion is at the VP-contact level, not account-level. Ellie asked for layoff/job-change tracking. Ellie committed to manual final scrub.

### Phase 3 — Velocity panic (April)

Focus shifts from data perfection to "why aren't we shipping campaigns."

- **Apr 2 (Weekly):** Ellie + Sasha + Nick. **Ellie explicitly asked to bypass Airtable entirely** — "I will probably download CSV files or lists." Asked for negative-keyword filtering on LinkedIn (exclude "patients" / clinical staff).
- **Apr 9 (Weekly morning, then Jenn 1:1 afternoon):** Critical inflection point.
  - **Morning (group):** Jenn saw only 132 contacts had passed the "Pearl" data gate. Demanded "loosen the reins."
  - **Afternoon (1:1):** Jenn explicit quote: *"I just spent $80,000 to build this thing and I found 132 fucking people to talk to... we've been working on this for nine months. What the fuck? why aren't we right?"* And the cancellation warning: *"I can defend that for another April. but then I'm done. if this thing is not going... then I have to go back and figure out, okay, what are we doing here?"*
  - Jenn asked Nick to "step into the front seat" with Ellie, bypassing Teknova's internal bottlenecks. Also noted **Mika rolls off end of April**.
- **Apr 10 (Ellie 1:1):** Ellie demanded "Company-First" search logic — verify company does AAV before sourcing contacts. Asked for CDMO-vs-therapeutic-developer separation (different sales pitch).
- **Apr 16 (Weekly):** Ellie reiterated the CSV-not-Airtable request. Noted CRM admin uploads take 2-3 days. Pushed back on automated micro-sites (would overwhelm prospects).
- **Apr 23 (Weekly):** Sasha asked for landing-page integration into Teknova's web architecture. Ellie asked for AI-identified topical biotech conversations so she can engage as "voice of customer." Stalled on privacy/compliance.
- **Apr 30 (Weekly):** Jenn requested an "automation layer" to relieve Ellie of manual SF data entry. Requested a LinkedIn thought-leadership agent for Ellie. Ellie committed to Loom recording her manual SF click-path.

### Phase 4 — Last asks (May)

Focus: bolt-on tools, give up on integration ambitions.

- **May 6 (RB2B):** Christa, Ellie. Connect RB2B website visitor tracking. Map RB2B API to avoid CSVs. High-value-page scoring.
- **May 7 (Weekly):** Christa, Ellie, Jenn, Sasha. Ellie reviewed 46 AAV targets and rejected 26 because employment data was 6-month-to-3-years stale or BD team already heavily engaged. Demanded a pre-list SF-activity check.
- **May 18 (Ellie session):** Ellie revealed the defining AAV attribute is **temporal** — companies abandon AAV without updating federal registries. Asked for current-status parsing on ClinicalTrials.gov.

---

## 2. Recurring requests that appeared multiple times

| Ask | Asked by | Meetings | Resolution |
|---|---|---|---|
| Give me CSVs, keep me out of Airtable | Ellie | Apr 2, Apr 16, May 18 | Resolved — Nick agreed to send spreadsheets |
| Fix Ellie's manual SF click bottleneck | Ellie + Jenn | SF Sync, Apr 16, Apr 30 | **Unresolved** at cancellation |
| Cross-check BD activity before outreach | Ellie + Jenn | Apr 10, May 7 | Partially via manual checks; structurally unresolved |
| Company-first modality verification | Ellie | Apr 9, Apr 10 | Resolved — Nick rebuilt logic |

---

## 3. Focus shifts over the engagement

| Period | Defining concern | What "success" meant |
|---|---|---|
| Jan–March | Data plumbing | Clean fields mapped correctly into SF |
| April | Volume + ROI | Campaigns leaving the building, not perfect data |
| Late Apr–May | Workflow automation + internal capability | Relieve Ellie's manual SF entry; build internal-friendly tools |

The shift from "perfect database" to "any campaigns at all" happened on Apr 9. From that point, Jenn was protecting her budget defense, not investing in the system.

---

## 4. Teknova side commitments that did not land

- **Full SF API access + field mapping:** Ashley + Logan promised Jan 28. Ashley on maternity leave. Duo/Active Directory blocked write access through April. Bi-directional sync never reached full automation.
- **CRM admin list uploads:** Ellie's approved lists waited 2-3 days for SF admin upload (Apr 16). Persistent friction.
- **Landing page integration:** Sasha promised Apr 23 to look at integrating AI micro-sites with Teknova web architecture. Stalled on privacy + lack of dynamic content.
- **Mika continuity:** Marketing consultant rolled off end of April. No replacement named for the marketing-side coordination role Mika filled.

---

## 5. Signals about how they viewed the relationship

**Jenn's frustration was bidirectional**, but increasingly internal:

> *"I'm grumpy with you today, I'm grumpy with Ellie, I'm grumpy with Ma, I'm grumpy with me... Ellie, every time we talk, you're like, I'm just spending so much time in there ticking a box... we will never get to any of this fun cool stuff if we can't figure out a solution."* (Apr 9 / Apr 30)

**Jenn's view of Nick:** competent but too deep in the architecture; wanted him to operate the team, not explain the system:

> *"Nick, we've been working together long enough now when you're like, 'Hey, go into Air Table.' I don't want us to be the Airtable experts on this stuff... I kind of look to you to tell me what we should do."* (Mar 19, May 7)

**Ellie's view:** the system risked her credibility if she sent before the BD-overlap check existed. She gatekept actual sends regardless of what Jenn demanded.

---

## 6. Telegraphed signals of cancellation

| Date | Signal |
|---|---|
| Apr 9 | Jenn explicitly: "I can defend that for another April. but then I'm done." |
| Apr 9 | Mika rolling off end of April — first contractor exit |
| Apr 16 | Ellie reiterating CSV-not-Airtable — narrowing the surface they want to interact with |
| Apr 30 | Jenn's automation requests are about relieving Ellie's manual SF work, not extending the AI engine |
| May 7 | 26 of 46 AAV targets rejected — final blow to the "executable volume" justification |
| May 26 | 30-day notice |

**The cancellation was visible 7 weeks before it landed.** Not surprising, not sudden.

**No transcript evidence Jenn ever discussed taking the engine in-house, transferring the tool, or training her team to operate it before her May 26 email.** Her stated cancellation reason ("take it in a different direction we can support internally") is net-new framing — likely the convenient external story for a decision driven by their inability to operate the system at all.

---

## 7. The "playbooks" pivot

- **When:** Nick introduced "Plays" / "Playbooks" in early-to-mid April (Apr 9, Apr 16) as a response to the database being too noisy to operationalize.
- **Why:** Cleaning a 26,000-contact master DB was impossible. Pivot: define a Play (AAV Gene Therapy), define the offer, enrich only contacts for that Play.
- **Reception:** Jenn liked it — actionable bite-sized lists. Ellie partially adopted: worked off the AAV Playbook spreadsheet (58 → 46 → 26 contacts), but couldn't reach the "Signal-to-Action" automation because the BD-overlap check didn't exist.
- **Status at cancellation:** Operationally partial. Aspirationally unfulfilled.

---

## 8. Decision-makers on the Teknova side

| Domain | Decider | Notes |
|---|---|---|
| Data definitions | Ellie | Domain expert; her rules are the rules |
| Campaign launches | Ellie | Final gatekeeper regardless of Jenn's pressure |
| Priorities | Jenn | Budget owner, macro direction |
| Strategic direction | Jenn (constrained by SF + internal team) | Wanted to move fast; legacy infra kept derailing |

---

## 9. Net read

Teknova was **highly engaged but structurally unprepared** to absorb what they bought. They purchased a futuristic RevOps engine and tried to bolt it onto a legacy Salesforce maintained by an overworked admin team without SOPs. Every advanced capability hit their internal capability ceiling.

**Cancellation was predictable from April 9.** Jenn's $80K budget defense had a runway and she said so out loud. Volume never materialized, because Ellie wouldn't send without a BD-overlap check that Teknova couldn't build infrastructure to support.

**Cancellation rationale ("we'll support it internally") is incoherent with observed behavior.** They could not maintain SF field mappings, could not get past their own Duo authentication for an API connection, could not coordinate Lead-vs-Contact mapping between marketing and SF admin teams, and Ellie was drowning in CRM clicks doing the simplest tasks. There is zero evidence in any transcript that the internal team has the capability to operate n8n + Airtable + Supabase + Smartlead + Hunter + Explorium on their own. The "internal direction" framing is a convenient external story.

---

## 10. Implications for the Closeout Trajectory

1. **The "transition the tool" ask in Jenn's May 26 email follows the engagement's entire behavioral arc.** Every prior request was a variant of "make this less work for us" or "do it for us." The transition ask is the same pattern at the closeout stage. If we accept transition as scope, the next 30 days become a sequence of escalating "how do we configure X" requests.

2. **Bound the support window tightly.** Based on 5 months of behavior, ad-hoc questions during the wind-down will be operational, not conceptual. Every "how does this work" will rapidly become "can you configure it for me." Anchor the scope to: contracted weekly deliverables continue, JSON drop satisfies the Phase 3 documentation obligation, no operational support.

3. **The wind-down is a budget-defense exit for Jenn, not a technical disagreement.** Don't argue the rationale. Don't re-litigate why the engagement underdelivered. Frame the closeout artifacts as a clean professional close that lets her move on.

4. **Ellie is not the decision-maker on the closeout.** Jenn is. Any Ellie-specific work in the final 30 days (the modality list ask) ships because Jenn requested it, not because Ellie did.

5. **Mika's end-of-April rolloff is a precedent.** That was a clean contractor exit with limited handoff scope. Use that frame: this is a contractor relationship ending on 30-day notice, not a system handover.

6. **The contract's "no work without written request" clause is the operational defense.** Given the pattern of verbal/Slack ad-hoc asks across all 9+ weekly meetings, the written-request requirement is the right gate for every new ask in the 30-day window.
