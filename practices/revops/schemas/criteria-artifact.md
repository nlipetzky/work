# Criteria Artifact Schema

The shape of a criteria artifact: the single canonical source of judgment for a play. It carries both the declarative target (who is in scope, in the client expert's language) and the operational detection logic (how a machine identifies that target). One artifact, one file. It supersedes and absorbs the older `segment-criteria` artifact.

**Output path:** `accounts/clients/<client>/artifacts/revops-segment-<play-slug>.md`

The filename keeps the `revops-segment-` prefix so the existing `segment-criteria` skill and pipeline references do not break. There is exactly one criteria artifact per play under this name. Do not create parallel taxonomy or rules files; their content lives here.

---

## Why this artifact exists

A play needs two things that used to live apart:

1. The **declarative target** ... what a good record looks like, in the client expert's words. Source-agnostic, provider-agnostic. This is what `segment-criteria` already captured.
2. The **operational detection logic** ... given an arbitrary entity, the testable rules that decide "in segment" vs "not." Positive signals, negative signals, disambiguation rules, working definitions, evidence hierarchy, confidence routing.

Stating the target without the detection logic is what produced confident garbage on the AAV play. The system knew the phrase "AAV gene therapy" and matched on terms. It did not know that "AAV" is also ANCA-Associated Vasculitis (a disease, not a vector), that a clinical-trial sponsor is the operating entity and not its holding company, or that trial evidence outranks marketing copy. Those are detection rules. They have a mandatory home here.

---

## One artifact, three consumers, two biases

The detection logic is read at three gates with different error costs. Every detection rule is tagged with the consumer(s) it serves and its bias.

| Consumer | Gate | Bias | Why |
|---|---|---|---|
| Sourcing | Sourcing Planner / Family 1 | recall | A wide net is cheap to narrow later. Never filter at ingestion. |
| Company verification | Family 2.2 Match-and-Verify | precision | A false certification is silent and expensive. |
| Contact validation | Family 3.3 Validate-Contact | precision | Same: wrong contact certified as right is unrecoverable without a human. |

A rule tagged `consumer: sourcing, bias: recall` is expanded toward synonyms and adjacent cases. The same underlying concept tagged `consumer: verification, bias: precision` is applied strictly. The artifact carries both expressions explicitly so the agent does not have to guess the bias.

---

## Template

````markdown
# Criteria Artifact: <play-slug>

**Client:** <client>
**Play:** <play-slug>
**Date:** <YYYY-MM-DD>
**Version:** <integer, starts at 1, bumps on every committed change>
**Offer (one sentence):** <what is being pitched, to whom, why now>

---

## Part 1 — Segment definition (declarative, client-expert language)

### Hard filters

Records must match all hard filters to enter the segment.

#### <Criterion name>
- **Type:** firmographic | technographic | demographic | behavioral | relational
- **Match:** hard filter
- **Observable signal:** <how someone verifies this, naming the signal not the source>
- **Description:** <the rule in business language>

(Repeat. Group by type if many.)

### Soft signals

Pass-through scoring inputs. Do not exclude.

#### <Criterion name>
- **Type:** behavioral | relational | technographic | demographic
- **Match:** soft signal
- **Weight:** high | medium | low
- **Observable signal:** <how someone verifies this>
- **Description:** <rule in business language; include time window if behavioral>

### Disqualifiers

Anti-list. Any match removes the record regardless of other matches.

#### <Criterion name>
- **Type:** firmographic | technographic | demographic | relational
- **Match:** disqualifier
- **Observable signal:** <how someone verifies this>
- **Description:** <rule in business language>

---

## Part 2 — Detection logic (operational, machine-consumable)

Mandatory. A criteria artifact without this part is incomplete and the engine does not run.

### Working definitions

The terms the play turns on, defined operationally. Each definition includes known collisions.

#### <Term>
- **Means:** <operational definition in the client expert's framing>
- **Does not mean:** <explicit exclusions, including homonyms and adjacent concepts>
- **Collision:** <known term ambiguity and how to resolve it. Example: "AAV" = Adeno-Associated Virus (in scope) vs ANCA-Associated Vasculitis (a disease, out of scope). Resolve by requiring a mechanism word; reject on the vasculitis term list.>

### Positive detection signals

#### <Signal name>
- **Consumer:** sourcing | verification | classification | (list one or more)
- **Bias:** recall | precision
- **Test:** <a rule a machine can apply. State the literal tokens, the boolean combination, the threshold. Example: literal token "AAV" present AND at least one of {capsid, serotype, transduction, vector, viral delivery}.>
- **Evidence source rank:** <which sources satisfy this and in what trust order>
- **Confidence:** how this maps to high | medium | low

### Negative / exclusion signals

#### <Signal name>
- **Consumer:** sourcing | verification | classification
- **Bias:** recall | precision
- **Test:** <machine-applicable rule. Example: trial conditions contain any term in the disease-AAV exclusion list.>
- **Action on hit:** reject | reroute:<target> | queue-for-review

### Disambiguation rules

Ordered. Higher rules win when rules conflict.

1. **<Rule name>** ... <condition> → <resolution>. Example: a clinical-trial sponsor is the operating entity; never resolve to its holding company.
2. **<Rule name>** ... Example: trial evidence (CT.gov intervention name) outranks website marketing copy. A commercial-stage company whose site dropped technical vocabulary still passes on trial evidence.
3. **<Rule name>** ... Example: a single most-recent trial older than N years is a graveyard, not an active pipeline.

### Evidence hierarchy

Source trust order, highest first. Used by the source-conflict tiebreaker.

1. <source> ... <why it ranks here>
2. <source>
3. <source>

### Confidence routing

What happens at each confidence level. This is the auto-pass vs queue-for-expert decision.

- **High** (e.g., confirmed by ≥2 independent sources, or by an authoritative registry): <auto-pass to next state>
- **Medium** (single trusted source): <queue for expert review before spend>
- **Low / no content / parent-company domain hit:** <route to data-quality review with a specific reason string>

---

## Part 3 — Provenance and versioning

The loop that maintains Parts 1 and 2:

open question → **evidence resolution** (close what data/tools can close, with provenance) → expert review pack (machine-resolved items to ratify + residue to answer) → synthesis → version bump → change log entry.

Evidence resolution is mandatory and runs before anything reaches the expert. Every open item is first attempted from tools and data. What reaches the expert is the residue plus a ratification summary of what was machine-resolved. The expert adjudicates the residue and ratifies the machine-resolved set; they do not do lookups the system could have done.

### Change log

Every committed change is one entry. Append-only. **This is the liability record.** Every rule that influences client-facing data traces here to either expert approval or evidence-plus-expert-ratification. It is also the regression-recovery record: if a later version performs worse, this is how you find what changed and revert.

| Version | Date | What changed | Why | Source / evidence | Resolution | Ratified by |
|---|---|---|---|---|---|---|
| <n> | <YYYY-MM-DD> | <the specific rule added/changed/removed> | <the reason> | <clinicaltrials.gov query / NotebookLM query / Ellie call DATE / gate-results observation> | machine-resolved \| expert-resolved | <expert name + how + date, or "pending ratification"> |

A `machine-resolved` entry is committed **pending ratification**: live but flagged, and surfaced in the next expert review pack for confirmation or override. It is not silently trusted because it shaped client data; the liability chain requires the domain authority to have seen and ratified it.

### Expert review queue

Signals are not instructions. Context surfaced from transcripts, emails, or documents that *might* change a rule is logged as a question, not applied. Two kinds reach the expert in the review pack:

**To ratify** (machine-resolved, default-accept on silence):
- **R<n>** (<date>, <evidence>): <what we concluded and the evidence behind it>. Status: pending | ratified | overridden.

**To answer** (expert judgment required, no data substitute):
- **Q<n>** (<date>, <source>): <the question, framed as "this sounds different from rule X, confirm or clarify">. Status: open | answered | dismissed.
````

---

## Field definitions

**Version.** Integer. Starts at 1. Bumps on every committed change. The running pipeline records which artifact version produced a given batch so performance can be attributed to a version and reverted.

**Part 1 fields.** Identical semantics to the `segment-criteria` schema (`practices/revops/schemas/segment-criteria.md`). Type, Match, Observable signal, Description carry the same rules. Description stays source-agnostic: no columns, tables, providers, or query syntax. That constraint applies to Part 1 only.

**Working definition.** The operational meaning of a term the play turns on, plus its known collisions. A term with a homonym (AAV the vector vs AAV the disease) without a stated collision and resolution is an incomplete definition and a flagged gap.

**Test (detection signals).** A rule a machine can apply without interpretation. State literal tokens, the boolean combination, and any threshold. "Mentions AAV" is not a test. `literal "AAV" AND one of {capsid, serotype, transduction, vector, viral delivery}` is a test. This is the part Part 1 forbids and Part 2 requires.

**Consumer and Bias.** Every detection signal names which gate(s) read it and at what bias. This is what lets the Sourcing Planner expand for recall while verification applies the same concept for precision, from one artifact, without guessing.

**Evidence hierarchy.** Explicit source trust order. The disambiguation rules and confidence routing reference it. Without it, conflicting sources resolve arbitrarily.

**Change log.** Not optional. Append-only. The liability record: every rule influencing client-facing data traces here to expert approval or evidence-plus-ratification. Also the audit trail and regression-recovery mechanism.

**Resolution method.** Every change-log entry is `machine-resolved` (closed from tools/data with an evidence trail) or `expert-resolved` (closed by domain judgment). Machine-resolved entries are committed pending ratification and surfaced in the next review pack. The method is recorded so a later audit can see who or what decided each rule.

**Evidence resolution.** The mandatory stage before expert escalation. Each open item is first attempted from tools and data. The expert receives the residue plus a ratification summary, never a raw open-question dump. Protects the expert's attention without breaking the traceability chain.

**Expert review queue.** The intake discipline. Extracted signal lands as a question, not a rule. Machine-resolved items go to the "to ratify" list (default-accept on silence); irreducible judgment goes to the "to answer" list. Nothing changes a rule until evidence resolution has run and a human has approved.

---

## The dual constraint

A criteria artifact is simultaneously:

- **Human-approvable.** The client expert reads Part 1 and the working definitions in their own terms and approves or corrects. They never see provider syntax.
- **Machine-consumable.** Part 2 is structured so the Sourcing Planner, verification, and classification agents apply it without a human in the path at runtime.

If a rule cannot be expressed so a machine applies it without interpretation, it is not done. If the expert cannot read and approve the segment definition in their language, it is not done. Both must hold.

---

## The synthesis loop and the liability chain

The expert's attention is the scarcest input in the system. Two failure modes bracket it:

- **Over-asking.** Routing questions to the expert that tools and data could answer. This taxes the one resource the architecture exists to protect, and is what made prior client reviews "too much, too complex."
- **Over-trusting.** Resolving things ourselves and not surfacing them, buying productivity by severing traceability. The outbound is real contact with real people on behalf of the client; liability for that data traces back through the domain expert's authority.

Evidence resolution sits between the two. It closes every closable item from tools and data with a logged evidence trail, then presents the expert a complete picture: the residue to answer, and the machine-resolved set to ratify or override. The expert's role shifts from labor to adjudication. Productivity rises; the accountability chain stays intact because every rule that shaped client data is in the change log, attributed, and ratifiable.

This is why machine-resolved entries are committed *pending ratification* rather than silently. Confidence is not the bar. Traceability is. The change log is the contract that lets the client's data point directly back to what the domain authority approved.

**The expert is an optimizer, not a gate.** The loop runs on a cadence. Each cycle ships at current quality. Expert input raises the floor for subsequent cycles; expert non-response never halts production. A delivered list goes out under pending-ratification status and is corrected retroactively if the expert later overrides... the traceability holds either way because every decision is logged. The only time client response legitimately gates production is the initial setup phase of a new account, where the client expects to be configuring. Steady state is push-forward: the absence of a reply costs a flat quality curve, never a stopped line.

---

## Relationship to other artifacts

This artifact absorbs three things that were separate on the AAV play:

- `segment-<play-slug>.md` (the old segment criteria) → becomes Part 1.
- `revops-modality-taxonomy-<play-slug>.md` (detection vocabulary, re-route map, tiebreaker) → becomes Part 2.
- The hardcoded detection node (`node-check-aav-modality.js`) → its logic is the machine-readable encoding *derived from* Part 2, not a parallel source of truth. The node is generated from the artifact, never the reverse.

After migration, grep the play's workflow folder for the domain term (e.g. "AAV"). The detection node references the artifact; the literals live in the artifact. If domain literals are still in the node, the absorption is incomplete.
