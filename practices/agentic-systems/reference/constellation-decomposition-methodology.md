# Constellation Definition & Decomposition Methodology

How to DEFINE a constellation (a key domain of business value) and DECOMPOSE it into the Systems that
produce that value. Repeatable; apply once per constellation. Grounded in established prior art
(Business Capability Mapping, DDD, microservice decomposition, Wardley, ODI) with a narrow
agentic-first overlay. Validated by deep research 2026-06-04 (sources at bottom).

The order matters: **definition first, decomposition second.** A constellation doc that leads with a
slogan and then lists systems is hollow. Lead with what the capability *is* and *how you'd know it's
working*; the systems fall out of that and are lighter weight in the doc (live status lives in the
base).

## What this is (and the prior art it stands on)

A constellation is a Level-1 **business capability**; its Systems are the sub-capabilities/services
that realize it; Assets are the implementation. This is **capability mapping + DDD subdomains**, with
the agentic overlay from our system research. We adapt a well-trodden method, not invent one.

Threaded principle: **decompose by stable value, never by the org chart or a human SOP.** Capability is
"what, not how" (BIZBOK). If the decomposition mirrors who-does-what or the steps a human takes, it's
wrong (Conway / inverse Conway). Same anti-SOP rule as the system research.

## The method

### 1. Define the value (the thesis)
Not a slogan. Develop the capability so a reader deeply understands it. Cover, concretely and
specific to THIS business:
- **The name + load-bearing word.** One present-tense sentence (the catalog name), and the word that
  carries the hidden requirements (Canon: "knows," not "knew"; Compass: "decides," it commits).
- **Scope.** What it actually encompasses — the inputs, forms, situations, who it serves.
- **Stakes.** Why it's a key component of the business: what breaks without it, what it unlocks, why
  it earns one of the eight slots.
- **Essence.** The genuinely hard part, the crux (Canon: keeping it true + retrievable, not storage).
- **Boundary.** What it is NOT, versus the adjacent constellations.
Abstract capability-speak ("the nerve center of organizational intelligence") is just a fancier
platitude. Stay concrete.
[BIZBOK noun-not-verb; Richardson "capability generates value, stable"; ODI job-not-product; ODI
fundamental-goal + stability tests]

### 2. State what good looks like (the bridge)
Observable, falsifiable signs of value: **"we know it's working when X, Y, Z."** Present tense,
specific, testable. Plus the **absence tell** ("you feel it missing when..."). This is NOT the
systems' Key Metrics (those measure the machinery) — it's the value as you'd experience it.
Two jobs: it is a **fitness test** for the live constellation, and it is **what you decompose backward
from** in step 3. If you can't state what good looks like, you don't understand the value yet — go
back to step 1.

### 3. Decompose two passes, backward from the signs of value
- **Forward (domain):** enumerate what the domain structurally comprises — its purpose, the data/
  objects it touches, the obvious sub-capabilities.
- **Backward (value):** for each sign of value to hold *continuously*, what has to happen? Derive the
  moves from the signs, not the slogan. (This is the correction the signs-of-value step makes
  possible: the backward pass is now anchored to concrete success, so the systems fall out rigorously.)
Reconcile the two lists; the gap between them is signal.
[Richardson purpose/structure/processes/domain-objects; Wardley beneficiary→value→capability; value-stream]

### 4. Form the Systems (granularity tests)
Each move that is a coherent capability with one outcome and an emit contract = a System. Tie each to
the sign of value it produces. Apply:
- **SRP** — one reason to change / one outcome per System.
- **CCP (common closure)** — things that change together belong in one System; a feeder that always
  changes with its consumer is an Asset of it, not its own System.
- **MECE** — mutually exclusive (no overlap), collectively exhaustive (cover the whole value).
- **Agentic split (additive):** single vs several by context isolation, never by role/SOP. Recursive
  task-splitting *inside* a System at runtime is a different level from the stable "what."
[SRP/CCP from OOD; microservice granularity; our system research; Google Cloud agentic patterns]

### 5. Tag each System Core / Supporting / Generic
Core = differentiates (build/invest); Supporting = necessary, not differentiating (build simply);
Generic = commodity (buy/adopt). Drives build-vs-buy and where to spend. [DDD subdomain classification]

### 6. Check the integration boundary
Confirm the Systems share data, infrastructure, and operating logic (the bounded-context test). If one
doesn't, it belongs to a different constellation. Keeps a constellation a real integration boundary,
not a theme. [DDD bounded context]

### 7. Heatmap the gap
Rate each System HAVE / PARTIAL / MISSING. The MISSING-or-weak **Core** Systems are the priority
roadmap. Name the single headline gap — the missing System that most blocks the value. [BIZBOK
capability heatmap]

### 8. Name cross-constellation dependencies
What this constellation draws from others, and who consumes it. These become `Depends On` edges. [DDD
context mapping]

## The authority artifact (doc shape)

Each constellation gets one definitive file: `constellations/<slug>.md`, bound bidirectionally to its
Constellations row via Context Path. Order of weight, heaviest first:
1. **What it is** (step 1 — carries the doc)
2. **What good looks like** (step 2 — the signs of value + absence tell)
3. **Systems** (steps 4-7 — a slim table tying each system to the "good" it produces; live coverage/
   gap live in the base, not the doc)
4. **Dependencies** (step 8)
5. **Authority & deeper docs**, then **Decisions & residual**
Exemplar: `constellations/canon.md`.

## Don't
- Don't lead with a slogan and call it a definition.
- Don't let systems/coverage/gap crowd out what the capability is.
- Don't impose a fixed universal step-template (ODI's eight job steps are NOT fixed — refuted).
- Don't assume one System per sub-domain; a bounded context maps to one System or a set.
- Don't let the org chart, team structure, or a human SOP shape the boundaries.

## Worked example — Canon ("knows what the business knows")
- Definition: the business's memory and current awareness; foundational because an agent is only as
  good as the context it can reach; the hard part is keeping it true + retrievable, not storage.
- What good looks like: any agent pulls prior context without a human re-explaining; past decisions
  findable with rationale + what superseded them; corpus reflects reality fast; new agent/operator
  productive immediately; human and agent get the same true answer.
- Systems: Ingestion (Supporting/Have), Context Service (Core/Partial), Currency (Core/Missing).
- Headline gap: Currency — the difference between "knew" (archive) and "knows" (live).
See `constellations/canon.md` for the full form.

## Sources
microservices.io decompose-by-business-capability / by-subdomain (Richardson); BIZBOK / TOGAF business-
capability planning; DDD subdomains/bounded-contexts; Wardley mapping; ODI / Customer-Centered
Innovation Map; inverse Conway (Thoughtworks); Google Cloud "choose a design pattern for your agentic
AI system" (2026-05-28). Research reports: tasks wwmk3mdk7 and wa25gtk54 (ephemeral).
