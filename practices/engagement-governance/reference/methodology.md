# Engagement Governance ... methodology and platform reference

**Registered as System:** `engagement-governance` (in base `apppQjlZiktpbO4aX`)
**Type:** platform (shared infrastructure reused across engagements)
**Status:** building / emerging
**Stewarded by:** Boris (agentic-systems) initially; may promote to its own practice when reality warrants.

## Why this exists

Every operated engagement has two distinct accountability axes on the client side. Conflating them produces "account management chaos" ... the failure mode where the client asks Nick to "deliver more" because there's no shared structure that tells them what's being built, where we are, or what's in scope.

| Question the client asks | Who answers it | What surface answers it |
|---|---|---|
| "Why don't we have results yet?" | **Engagement Governance** | The approved Trajectory + current-state projection ... we're at phase X, results come at phase Y, here's where we are. |
| "Why are results not high-quality?" | **Expert-Liaison** | The expert-approved artifact (criteria, persona, offer) drives engine output quality. Refine the artifact, refine the output. |

These are different conversations with different responsible parties. Engagement Governance handles the first; expert-liaison handles the second. Together they cover the full client-side relationship.

## Two roles on the client side

Engagements have two distinct human roles. They may be filled by the same person (Will is both sponsor and expert for KAI) or by different people (Jenn is sponsor at Teknova; Ellie is expert). The system distinguishes role-of-interaction, not identity.

- **Sponsor** ... steward of engagement scope, cadence, budget, and expectations. Approves the Trajectory up front. Sees Weekly Slot reports. Raises scope changes. Is the contractual relationship.
- **Expert** ... steward of artifact quality. Influences engine performance through approved artifacts. Owns the criteria, persona definitions, offer content, classification rules that drive engine output.

When the same person fills both roles, the system serves both interfaces ... different artifacts, different conversation shapes, same human.

## Three artifacts the platform produces

### 1. The Trajectory

The upfront-approved sequence of work for the engagement. Names the phases, the deliverables per phase, the dependencies between phases, the success and termination criteria. **Signed off by the sponsor before delivery begins.**

This is the contract. When new requests arrive mid-engagement, the question is "does this fit the Trajectory?" If yes, ship it. If no, it's a scope change requiring re-approval (and possibly re-pricing).

In the Konstellation Catalog, Trajectory is named explicitly ... "per-client sequence of Systems over time, output of the GTM Survey." The Survey produces it; the sponsor approves it; delivery runs against it.

For engagements that didn't originate from a Konstellation Survey (Teknova, for example), the Trajectory may need to be drafted retroactively and approved by the sponsor as a "here's where we've been, here's what's next" alignment artifact.

### 2. The Weekly Delivery Slot Report

One per week per active engagement. Names what shipped that week: which assets, which workflows deployed, which artifacts approved, which executions ran, which volumes processed. Tied to the Trajectory ... each shipped item maps to a Trajectory phase.

The Slot Report makes invisible infrastructure work visible to the sponsor. When sponsors say "what did you do this week?", the Slot Report answers in concrete units (workflows, executions, volumes, vendor costs, classifications). The pipeline-activity footer pattern in the Weekly Client Update template is the operational mechanism.

### 3. Scope-change notifications

When a sponsor request doesn't fit the active Trajectory, the system surfaces this explicitly. Not as "Nick is refusing" but as "this is a scope change; here's what fits the current Trajectory, here's what would shift if this is added, here's what re-approval looks like."

This converts scope-creep from a relational friction (the sponsor experiencing Nick as obstinate) into a structural artifact (the sponsor seeing the trade-off and choosing).

## How this relates to expert-liaison

Engagement Governance and expert-liaison are **sibling platforms**, not stacked. They handle different roles and different artifacts but share an underlying pattern:

- Both translate human input into engine-binding artifacts.
- Both make accountability structural by attaching ownership to artifacts.
- Both run on minimal-burden interfaces calibrated to the human's preferred form.
- Both prevent the failure mode where everything routes back to Nick.

The difference is in what they steward:

| | expert-liaison | engagement-governance |
|---|---|---|
| Steward role | Expert | Sponsor |
| Artifact type | Criteria, persona, ICP, offer copy, classification rules | Trajectory, Weekly Slot Report, scope-change notification |
| What it influences | Engine output **quality** | Engine output **existence** and **cadence** |
| Cadence | Iteration loops, often async | Up-front (Trajectory) + weekly (Slot) + on-event (scope) |

When the same person fills both roles, both platforms serve them but through different interfaces.

## How this relates to gtm-engine and revops-engine

Peers. gtm-engine produces offers and runs SDR motion ... it's the *selling* engine. revops-engine produces the operational infrastructure ... it's the *delivery* engine. engagement-governance is the *running-what-we-sold* layer that wraps around them.

The flow:

```
gtm-engine
   ↓ produces an offer and a Trajectory proposal (via Survey)
sponsor approves Trajectory  (engagement-governance starts here)
   ↓
revops-engine + expert-liaison + engagement-governance
   ↓ run the engagement together
weekly: Slot reports out; expert iterations in; scope checks bidirectional
   ↓
engagement evolves; Trajectory updates with sponsor approval
```

## Existing pieces this builds on

You're not inventing this from scratch:

- **System Registry Roadmap table** ... already engineering-facing per-system roadmaps with Done-When + Evidence gates. The Trajectory is a sponsor-facing projection of the Roadmap.
- **Weekly Client Update template** (`reference/weekly-client-update-template.md`) ... already has the pipeline-activity footer pattern. The Slot Report is built on this.
- **Konstellation Catalog** ... defines Trajectory and Weekly Slot as named concepts. The Catalog's vocabulary is consistent with this methodology.

The work is wiring these existing pieces into the platform machinery and applying it consistently across every engagement.

## Initial application targets

- **teknova-enrichment** ... the immediate test case. Jenn is sponsor; the missing artifact is an approved Trajectory she signs off on retroactively. Last week's example (new AAV workflows built but no client-visible results) would have been explainable via "we're at phase 3 of the Trajectory; results come at phase 5; here's what shipped toward phase 3."
- **konstellation-ai** ... applies internally. Nick + Will are mutually sponsor and expert. The Trajectory is the catalog evolution + dogfood plan + scale plan.
- **Future engagements that come from KAI sales** ... built in from day one via the GTM Survey output.

## Open design questions

Held loosely; resolve as reality demands:

1. **Trajectory granularity.** Phase-level (5–10 phases per engagement) or finer (every Asset or Roadmap item)? Too coarse loses navigation; too fine becomes a project plan no one reads.
2. **Slot Report format per sponsor.** Email, Notion page, Airtable view, meeting brief ... probably channel-adapted, but the structure is consistent. Same translation pattern as expert-liaison.
3. **Scope-change re-pricing mechanics.** Does engagement-governance touch pricing, or hand to gtm-engine / Will / sponsor lead? My lean: it surfaces the trade-off; pricing routes through the engagement's commercial lead.
4. **Trajectory drafting authority.** Boris drafts the first version per engagement; sponsor approves; expert-liaison may need to project expert inputs into the Trajectory too (e.g. Ellie's criteria evolution is a phase). Coordination shape between the two platforms TBD.
5. **The Nick-on-the-hook problem.** Engagement-governance only succeeds if the sponsor actually engages with the Trajectory and Slot Reports. If they ignore them, the system surfaces the trade-off (scope, cadence, expectations) but the sponsor still demands more without approving. The structural lineage helps but doesn't solve sponsor disengagement.
