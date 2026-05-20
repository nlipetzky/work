# How we work together going forward

**For:** Ellie
**From:** Nick
**Last updated:** 2026-05-12

A short note on the shape of our partnership now that the AAV outreach system is live. The short version: you own the rules, we run the system, the line between the two is clearer than it was a month ago.

---

## What you own

The rules for who we target.

You know this space cold... what makes an AAV company a real lead vs. a borderline one, which indications matter, which big pharmas to exclude, what counts as a strong vs. weak buying signal. That knowledge belongs in your head, but it also needs to live somewhere we can act on without coming back to you every week.

So the system holds the rules in two Airtable tables you can edit directly:

- **Classification Rules** — the criteria the system uses to decide if a company is an AAV target, what modality bucket they fit, what disqualifies them, and what signals make them stronger or weaker prospects.
- **Sources** — the places we look for new companies (clinicaltrials.gov, pharma pipelines, etc.) and how much we trust each one.

When something needs to change... a new indication you want to include, a competitor you want to exclude, a signal you want to weight higher... you edit a row. That's it. No emails, no meetings, no waiting on us.

## What we own

The system that turns your rules into a list.

We run three workflows, in this order:

1. **Capture.** Pull companies from every source you've defined. No judgment, no filtering. Keep everything.
2. **Classify.** Apply your classification rules to label every captured company. Modality bucket, vector evidence, verification status. Re-runnable: when you change the rules, we re-classify the full universe in one run.
3. **Filter.** Apply your segment criteria... hard filters first, then weighted soft signals... to produce the outreach-ready list.

The point: nothing here is hardcoded. When your rules change, we re-run. We don't rebuild.

## How this is different from before

Before, when you said "actually, exclude CDMOs," we'd open the workflow, edit code, redeploy, and the change would land days later. Half the time we'd miss an edge case because we were translating your intent into our code.

Now, you edit a row in Airtable. We re-run. The change is in the list within an hour. You see the rule next to the result.

This means the system can keep up with how you actually think about this market, which is the only way outbound that doesn't go stale.

## What I'd ask from you

1. **Pass through the Classification Rules table once it's populated.** I'll have it ready for your eyes shortly. You're looking for anything that's wrong, missing, or weighted off. Edit freely; nothing is sacred.
2. **Tell me what's wrong with the Sources list.** If there are databases or signals you wish we were pulling from that we're not, those belong in Sources. You don't have to know how to query them; just tell me they exist.
3. **Disagreements are the most useful thing you can give me.** If you see a rule and think "no, that's wrong," tell me. Every disagreement is a rule we should write. The goal is not to get the rules right on the first pass... it's to have them visible enough that we can argue productively.

That's the working relationship I want to build. You see and own the rules. We run the system. Together we tune.
