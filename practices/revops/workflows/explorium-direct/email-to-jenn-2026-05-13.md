# Email to Jenn

**To:** Jenn Henry
**Cc:** Ellie Oleson, Christa Plon, Sasha Laing
**Subject:** AAV play update + operating model

---

Hi Jenn,

Wanted to circle back on your May 7 note about cadence, anchored to where the AAV play is after this week. Short version: the engagement is structured to hit the three end-of-month goals you laid out, and the operating model getting us there is mostly async with deliberate written checkpoints.

## Your three end-of-month goals

**Pulling lists where 95% of contacts are solid.** This maps to the Cohort Quality framework I documented last month, the operational standard for measurable list quality. Every record gets scored at company scope and contact scope across four dimensions (data hygiene, ICP fit, suppression state, signal and intent), then sorts into Tier A, B, or C. The cohort tier is the lower of the two scopes. Failure on any absolute check at either scope excludes the record outright.

The commitment: every record in the activated cohort has cleared the Tier A bar at both scopes. Company-side that means domain canonical, identity confirmed, in-segment on industry, modality, stage, geography, and headcount, and clean on all seven suppression checks. Contact-side it means deliverable email AND identity-confirmed (not catch-all, not role account), employment verified active within 30 days, accurate title, function and seniority match, no DNC or hard bounce, and no active outbound on the channel.

What I can't commit to is Tier A cohort *size*. That depends on what the segment yields. Some segments produce hundreds of Tier A records; others produce twenty. The framework is the standard the work runs against; the cohort is the result of running the framework against what's actually out there. The AAV play is the first cohort measured end-to-end against this framework, and the Tier A count there is the answer for that segment specifically. Worth a separate conversation about how to frame the metric externally, because "95% solid at the list level" is not a measurable number on its own.

**Clear overlay of SF activity data.** The Companies table already has the field structure to absorb SF state. Open opportunity flag, closed-won, last account-level contact date, account-level DNC. The sync layer that populates those fields is on the roadmap. Sequenced after the AAV play proves the pipeline.

**Air-traffic control on outreach.** Two layers. The framework already enforces a "no active outbound cadence on this channel" suppression check at the contact level, which prevents a person from entering a new sequence while they're in one elsewhere. The cross-campaign visibility layer (which records are in which campaign at any moment, viewable across all plays) is the second piece and gets built after the AAV play proves the pipeline.

All three are achievable by end of month. The AAV play is the proving ground.

## What the engagement looks like in motion

This week made the operating model concrete. ClinicalTrials.gov sourcing ran, 97 companies surfaced, Ellie reviewed, returned segmentation feedback that built on her April CDMO point, plus 18 missing companies and field-level notes. I'm implementing five concrete changes in response: a segmentation classifier, ingest of her 18 companies, click-driven review UX inside Airtable, a recall-gap diagnosis on the trial sources, and a roadmap for the next four sources (ASGCT exhibitor directory, USPTO patents, ARM Atlas, PubMed). None of that required a meeting. Written specs, workflow runs, Ellie's async review, system changes within hours of her feedback landing.

## On cadence

A different shape than 2x/week, but the goals stay yours.

- **Thursday WIP at 30 min**, as you proposed. Status, blockers, and decisions that need all three of us live.
- **No second standing meeting.** Replace with a weekly written progress note from me, plus async pings when a specific decision needs you, Sasha, or Ellie.
- **Ellie reviews inside Airtable on her own time.** Her last review came back in two days. The system absorbed it and shipped changes within the same day.
- **Christa runs project management async.** Tasks, deadlines, dependencies are visible in the workflow itself. She doesn't have to gather status; the system surfaces it.

If we want more formality on how progress reports out, I'll draft a weekly written update template and we can iterate on it. Lower friction than a second standing meeting.

## Role split, observed

The pattern that's working: you set direction and ICP, Ellie verifies what's in the market and what messaging will land, I build the system that turns both into delivered cohorts. When one of those swims into another lane, the work slows down. The Groundhog Day pattern from a few weeks ago was mostly that. The current pattern is staying in lane with clean handoffs, and the AAV play this week is the evidence it works.

Happy to talk through any of this in Thursday's WIP. I'd rather propose a shape and adjust than default to more meeting time.

Nick
