# Source-Mining Doctrine: capture for personalization, not just qualification

Status: reference standard. Companion to `targeting-enrichment-doctrine.md`.

When we pull data on a company or contact from ANY source (NIH RePORTER, USPTO, Apollo, Hunter,
Crunchbase, a scraper, a CSV), we mine it in **three passes, not one**. Most pipelines stop at pass 1
and throw away the rest of the response. That is the mistake this doctrine exists to prevent.

## The three passes

1. **Qualify** — does this fit the ICP? The gate. (Hard filters, disqualifiers, soft signals.)
2. **Personalize** — what is the most *specific, true, verifiable* detail that proves "I actually looked
   at YOU"? The fuel that makes a cold message read 1:1.
3. **Trigger** — what is the "why now"? The timing hook that earns the send today rather than someday.

A source pass that produced a verdict but no personalization fuel and no trigger left most of its value
on the table.

## Two rules that make it work

- **Capture the raw specific, not the label.** Store "closed-loop tonic motor activation therapy for
  restless legs," not "neuro device." Store the award end date, not "late-stage." Copy needs concrete,
  falsifiable tokens (see the copy-draft skill's concrete-visual-falsifiable check); categories are vibes.
  Labels are derivable from specifics later; specifics are not recoverable from labels.
- **Bias the harvest toward what the OFFER cares about.** The same source yields a different harvest
  depending on what you sell. For an IP/CIPO offer, the gold is anything about the science (→ patentable
  subject matter), the stage (→ FTO/IP urgency), and the money/timeline (→ the next raise). Decide the
  offer's "fuel types" first, then go mine for them.

## The capture contract

- **Everything captured is stored in Supabase, associated with the right entity** — company-level facts on
  the company record, person-level facts on the contact record. Nothing of value stays only in a transient
  API response or a chat message.
- **Provenance travels with the datum** — source + captured_at (+ verified_at/verified_by for reachability
  fields), so any copy line can be traced to a real fact.
- **The copywriter consumes the fuel, not the operator.** Capture is the data layer's job (this doctrine).
  Turning fuel into attributed copy is the `copy-draft` skill's job, which source-tags every line and
  routes expert-judgment flags to Hermes (expert liaison). Hermes does NOT write outreach copy.

## Worked example — NIH RePORTER → CIPO

| Pass | Field | Hook it enables |
|---|---|---|
| Qualify | activity_code R41-R44, small-business awardee | SBIR/STTR ICP gate |
| Personalize | `phr_text` (public-health relevance), `abstract_text` | the specific science, in their words / the patentable-claims map |
| Personalize | `principal_investigators` (full list) | founder + co-founders, by name |
| Trigger | `project_end_date` | "your Phase II wraps Q3 2025 — IP positioning for the raise belongs now" |
| Trigger | award trajectory (all org awards) | "from your 2021 Phase I to a $1.3M Phase II — the commercialization inflection" |
| Offer-fit | TABA ceiling (derived from phase) | "up to $50K of non-dilutive TABA earmarked for exactly this" |

## Checklist for any new source

1. List every field the source returns — not just the ones you filter on.
2. Tag each as qualify / personalize / trigger / discard.
3. For personalize + trigger, name the hook and write one example line.
4. Store all kept fields on the company or contact, with provenance.
5. Hand the fuel to the copy layer; never let it die in the response body.
