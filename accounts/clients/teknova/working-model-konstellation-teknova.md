# How We Produce Lists You Can Trust

**For:** Jenn Henry, SVP Marketing, Teknova
**From:** Nick Lipetzky, Konstellation AI
**Date:** 2026-05-12

A proposal built from first principles. Data quality is the only thing that matters in this engagement. Everything else ... structure, cadence, meetings, visibility ... exists in service of it. This document starts there and works outward.

---

## The first principle

What Teknova actually pays for is lists you can deploy against, with contacts you can trust. Cadence does not produce that. Meetings do not produce that. Effort does not produce that. Only a specific kind of system produces it. The rest of this proposal is what that system requires, what it costs, and the levers you have over it.

---

## What quality actually requires

Six things have to be true for any list to be trustworthy. From first principles:

1. **Sources that label companies correctly.** If the database we pull from calls a peptide therapeutics company "AAV," we inherit that mistake no matter how clever the filters are downstream. Garbage in, garbage out.
2. **Criteria precise enough to recognize a real lead.** What counts as AAV in this play? What counts as in-scope at all? That is Ellie's domain. The criteria has to be sharp enough to apply consistently across hundreds of companies.
3. **Matching logic that confirms with evidence, not keywords.** A company is AAV because the regulatory record shows it filed an AAV intervention, not because the word appeared somewhere on their website. Evidence-based confirmation is what closes the gap between "keyword match" and "actually true."
4. **Feedback loops that turn Ellie's flags into permanent rules.** Every error she catches has to upgrade the system, not get fixed once and re-appear next batch. Without that, we run the same loop forever.
5. **A system that can re-run end-to-end.** When the rules change, the whole universe gets reclassified, not just the next batch. Without re-runnability, every rule change is a manual rework project.
6. **Diagnostic capacity when something is wrong.** When a list comes back with problems, we need to know whether it is a source problem, a criteria problem, or a matching problem. The fix depends on which layer broke.

Without all six, quality plateaus or backslides. With all six, quality compounds across every play we run.

---

## How my time gets applied to satisfy these requirements

Five areas of work. Each is a lever you can pull. The retainer is the budget; the five share it.

| Area | What it covers | Quality requirements it serves |
|---|---|---|
| **1. Designing what we run** | Defining plays, ICP, segments, criteria refinement | Requirement #2 |
| **2. Building the engine** | Sources, integrations, pipeline, matching logic, re-runnability | Requirements #1, #3, #5 |
| **3. Running plays** | A specific play end-to-end ... sourcing through send | All six in motion |
| **4. Staying in sync** | Meetings, written updates, ad-hoc syncs with you and the team | Requirement #4 (feedback loop) |
| **5. Improving how it works** | Diagnosing failures, finding better sources, refining rules, tightening quality | Requirements #4 and #6 |

Pulling on one area reduces another. You choose where the emphasis goes. I make the technical choices inside that emphasis.

---

## What goes wrong if any of this is starved

The temptation is always to push for volume and skip the parts that look invisible. Worth being explicit about the consequences:

- **Starve Building the engine** ... each new play gets built from scratch. Requirements #1, #3, and #5 are not met. Quality cannot compound.
- **Starve Improving how it works** ... the same mistakes repeat. Requirements #4 and #6 are not met. Ellie catches the same wrong companies every week.
- **Starve Designing what we run** ... existing plays carry everything. No expansion. Requirement #2 atrophies.
- **Overinvest in Staying in sync** ... time spent talking about work is time not spent on it. Output drops.
- **Overinvest in Running plays without Building the engine** ... volume goes up, quality regresses. Lists land but the contacts cannot be trusted.

The cadence proposed below is how you would see any of these patterns developing before they become a crisis.

---

## What a typical month produces

The five areas above add up to a finite amount of work per week. Worth being concrete about the shape of what that produces, so the rate of progress is not a mystery.

### Before the cycle can run: the complexity variable

Every play has two phases. The cycle described in the requirements section (source → classify → filter → review → fix) is the productized phase. Getting to a state where the cycle can run is its own phase, and it is where complexity lives.

Pre-cycle work means figuring out where the data for a given domain actually lives, how to recognize it, and how to match it with evidence rather than keywords. Complexity varies wildly by domain:

- **For AAV**, the obvious third-party sources label companies wrong, so pre-cycle work has been finding primary sources (clinical trials registry, patents, industry directories) and building matching logic that confirms with evidence. The vocabulary register problem (acronym vs. full term vs. serotype patterns vs. investor language) added another layer. This is heavy pre-cycle work, and it is where AAV has been for the last several weeks.
- **For a play in an adjacent gene therapy modality**, much of the pre-cycle work transfers. The engine already knows how to handle viral vectors and evidence-based matching; the new play needs domain-specific sources but inherits the matching logic. Lighter pre-cycle.
- **For a play in a completely new domain** (diagnostics, tools, a different therapeutic area), pre-cycle work starts closer to scratch.

Complexity cannot be fully known until we look. The first weeks of any new play are largely the work of figuring out what the complexity actually is. Once the path is mapped, the cycle can run at a known rate.

What this means for pace: a play in pre-cycle work may look quiet from the outside while the most important work is happening. The visible output (lists, contacts, sends) only starts once the path is mapped. AAV is in pre-cycle work right now. When it transitions into cycles, the rate of visible output will change noticeably.

### Through the cycle: production

In a typical month, once a play is past pre-cycle work:

- One active play moves forward through a couple of cycles of the loop.
- The engine gets meaningful additions that future plays inherit ... a new source connected, a class of rules captured, an integration tightened.
- The parking lot stays the parking lot unless we make an explicit decision to invest there.

Subsequent cycles in the same domain are much cheaper than the first. Sources are connected, rules accumulate, the engine handles more without my hands on it. Quality compounds with each cycle.

### Concurrency and shape

At any given moment, one or two plays are actively moving. A third does not start until the active ones reach a stable state, because attention split across more than that costs quality on all of them. This is especially true when a play is in pre-cycle work, which is the most attention-demanding phase.

If at some point you want a second play accelerating in parallel with the current work, that would be a real shift in shape. We would either need to slow the current play to make room, or change the size of what we are doing together. Worth raising as a question if it comes up, so the conversation is structural rather than reactive.

---

## How you see quality being produced

- **Weekly written update from me.** Lands Friday. What landed this week, what is in motion, what is blocked, where the time went. Each item tagged with which of the six quality requirements it served. You read on your schedule. No performance, just substance.
- **On-demand decision points.** When something genuinely needs your call, I bring it to you. Live, async, however works in the moment. Triggered by need.
- **Working sessions with Ellie and Christa.** 2x/week, as you proposed. Where criteria refinement and rule diagnosis actually happen. You are welcome but not expected.

On the Thursday WIP: I would propose replacing the standing slot with the cadence above. Keep the hold on the calendar for when we need to convene. Convene by need, not by calendar. The reason is honest: the pattern in that meeting has been costing us more than it gives us. I bring the week's work, the conversation produces new direction faster than it can be absorbed, and the next week starts over. The written update plus on-demand replaces the visibility without the cost.

---

## Decisions

**With you:** Which plays we run, in what order. The end-state goals (95% solid contacts, SF activity overlay, oversaturation control). When a play gets paused, resourced more, or killed. Where the bigger investments go ... building the engine vs. running plays vs. designing new ones. When to escalate.

**With me:** Architecture, tools, technical sequencing inside the priorities you set. When a piece of work is ready to surface for your review. When to flag a structural issue (like this proposal).

**With Ellie:** The rules and criteria that define a real lead. The voice and frame of outreach copy. Whether a list is ready to send.

**With Christa:** Scheduling, tracking, distribution of artifacts, follow-through.

---

## What's on the roadmap

**Now**
- AAV outreach play. Active rebuild of the sourcing layer through canonical sources. Pipeline construction underway with Ellie.

**Next**
- Apply the same pipeline pattern to one additional play (we choose which together).

**Parking lot**
- Lead scoring model
- Expanded SF activity overlay
- New play discovery from BD inbox signals
- Reporting layer for campaign-by-campaign performance

The roadmap stays live in this document.

---

## What I'd ask you to do with this

Read the six requirements first. If any are wrong, missing, or weighted differently in your view, that is the most important thing to surface. The rest of the proposal depends on agreement there.

Then react to how my time would be applied. If your priorities suggest a different weighting across the five areas, the proposal flexes to match.

Then react to the pace. The rate described above is what the current shape produces. If that rate does not match what Teknova needs, the engagement shape can flex two ways ... by reweighting the work within it, or by changing the size of what we do together. Either is fine. Both should be a deliberate choice rather than something we drift into.

The argument is: quality is the load-bearing thing, it has six specific requirements, and the working model has to produce all six at a pace we are both clear-eyed about. If we agree on that, the rest is allocation. If we do not agree on that, the rest does not matter and we should figure out what does.

Nick
