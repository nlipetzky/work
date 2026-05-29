# Teknova AAV Persona — pulled from NotebookLM (Teknova Events)

**Date:** 2026-05-21
**Source notebook:** Teknova Events (`6a18ae7c-f596-4dc7-80f2-3c1e0b72575a`, 28 sources)
**Query intent:** Who does Ellie want to talk to for the AAV gene therapy outreach play?

## TL;DR

Persona is matrixed on company size. Inside the right departments, the seniority floor is consistent (manager / lead / director), but the ceiling moves with company size:

- **Small biotech (<200 employees):** floor = manager, ceiling = CSO / c-suite
- **Mid-sized biopharma:** floor = manager, ceiling = VP
- **Large biopharma:** floor = manager, ceiling = director (NO VP, NO c-suite)

Then, regardless of seniority, the person has to actually be making the sauce. Title keywords matter more than department names because Ellie's exclusions are surgical.

## 1. Target functions / departments

Three core functions, all on the "making the drug" side:

- **Process Development** (the dominant function — directly tied to purification pain)
- **Clinical Manufacturing**
- **R&D** (specifically R&D-to-IND transition phase)

Ellie's framing: target teams transitioning therapies "all the way from the R&D phase into right when they actually are ready to go clinical."

Maps to Explorium enum: `r&d`, `manufacturing`.

## 2. Target seniority (matrixed on company size)

| Company size | Floor | Ceiling | Notes |
|---|---|---|---|
| <50 employees | scientist / manager | c-suite | Ellie explicitly asked to "open it up to those under 50 employees, getting newbies even just to get an introduction" |
| 50-200 employees | manager | c-suite (CSO) | "chief scientific officer, smaller biotech, I would say under 200 employees" |
| 200-1000 | manager | VP | Mid-sized — VPs still in scope |
| 1000+ | manager | director | "Excluding VP roles for large Biopharma" |

Maps to Explorium `job_level` enum: `manager`, `senior manager`, `director`, plus conditionally `vice president`, `c-suite` (and possibly `president`, `founder` for small biotechs).

The current Rule Category table sets seniority as `director, senior manager, vice president` flat. That's wrong — it loses manager-level (which is the floor) and applies VP uniformly (which is excluded at large biopharma).

## 3. Target title keywords (the real filter)

When asked what titles to look for, Ellie's exact words: **"Anything with viral vector downstream processing purification are going to be the two big ones."**

The keyword set:

- viral vector
- downstream processing
- purification
- process development
- clinical manufacturing
- process science
- CMC
- chief scientific officer (small biotech only)

These are the signals that someone is "actually working on making the sauce." A director in "manufacturing" without any of these keywords is a weaker signal than a scientist whose title contains "downstream processing."

## 4. Explicit exclusions

**Departments / functions to exclude entirely:**

- Legal
- Sales
- Talent Acquisition (recruiters)
- Marketing
- Regulatory (Ellie: "no regulatory employees")
- IT
- Finance (implied)

**Title patterns to exclude even at right company:**

- Anything containing "patient" — "you're dealing directly with patients and you're not actually working on making the sauce"
- BD / business development / commercial / contracts — "sometimes they're working on contracts and the commercial side, but their title doesn't necessarily say that" (requires manual catch)
- Agronomy / agriculture backgrounds — "agriculture people aren't good cell therapy fit"
- VPs at large biopharma (size-conditional)

**Behavioral exclusion:**

- Already in active BD conversation — "he wasn't the main contact but he was CC'd on emails with everybody else, So I'm like clearly they're very involved already with BD so it wouldn't make sense for me to reach out"

**Geography:**

- US and Canada only

## 5. Buying context (the "why")

Two distinct pitch tracks depending on company type:

**Therapeutic developers (the dominant target):**

> "any struggles they're having or challenges with their current processes whether that is cost or downstream processing is going to be the big one because that's where we help out with the purification part and simplifying that, streamlining it."

Pain = purification bottleneck. Teknova's value = simplification + cost on the downstream side.

**CDMOs:**

> "for CDMO specifically, that's where it's all scale up and capabilities with that because they're doing it on the much larger scale. The drug's already vetted, we're ready to run it into a larger scale production process… selling the fact that we can do all the way from RUO to GMP."

Pain = scale-up capability. Teknova's value = RUO-to-GMP continuum.

**Conversation trigger:** IND filing window. From the email sequence: "Before {company} locks in reagent suppliers for IND." Catching them before they commit to a reagent partner.

## 6. Company-size sensitivity (restated as a rule)

This is the most important non-obvious rule:

> A CSO at a 50-person biotech is the perfect target.
> A CSO at a 2000-person biopharma is wrong.

The matrix in section 2 is the operational version. Any sourcing logic that filters seniority without also looking at company size will pull the wrong people.

## 7. Personas to avoid even at right company

Beyond department exclusions, Ellie flags these as common mistakes during manual review:

- Patient-facing clinical roles (anything with "patient" in title or scope)
- Contract / commercial people whose title doesn't say so (manual catch needed)
- Scientists from agriculture / agronomy backgrounds
- People already CC'd on BD emails

## Implications for the current contact sourcing workflow

The current `Build Sourcing Plan` Code node in workflow `bYZ0sAzyUvU60wMZ` is wrong in three ways relative to this:

1. **Seniority list is flat** — currently `director, senior manager, vice president`. Should be `manager, senior manager, director` floor with conditional `vice president`, `c-suite`, `president`, `founder` based on company size.
2. **No title keyword filter** — Ellie's #1 actual filter ("anything with viral vector / downstream processing / purification") isn't applied anywhere except the LLM scorer.
3. **No company-size branch** — the same seniority filter is sent regardless of whether the target is a 30-person startup or a 5000-person biopharma.

The Rule Category table also doesn't capture company-size-conditional rules. Either the table schema needs to grow (per-size-band rule rows) or the rules need to be computed at sourcing time from a single matrix.

## References

All quotes are Ellie's. Pulled via NotebookLM query 2026-05-21. Conversation ID: `8526cf72-f564-43a1-95f9-06dc815ccbfc` (can be resumed for follow-ups).
