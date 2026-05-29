# Meeting prep — Jenn / transition kickoff
**Date:** 2026-05-28, ~9:50am CDT
**Attendees (expected):** Jenn Henry, Nick. Possibly Will.
**Trigger:** Jenn's May 26 termination notice. 30-day clock running.

---

## What Jenn said (May 26)

- 30-day notice. Taking the project in-house.
- Wants to "discuss how to transition the tool over to Teknova, and what that would look like."
- Wants "a few more modality-focused lists" created for Ellie before the end.
- Tone: warm, decisive, appreciative. Not adversarial.

## What Nick said back (May 27)

- Agreed. Clean close.
- Offered tools + workflows in a shared GDrive folder by ~June 25.
- Surfaced the structural tension: the pipeline was built for high-volume outbound; Ellie has run an ABM-style account-by-account pass. AAV is small + sparse. Cell therapy / mRNA produce more naturally in the outbound model.
- Asked Jenn: how do you want me to guide list-quality conversations with Ellie given the ABM-vs-outbound trade-off?

## Open loop he hasn't closed

- **Christa's ask (May 22):** "finalized AAV list EOD Tuesday May 26." Termination dropped the same day. Status of that deliverable is ambiguous. Clarify in meeting.
- **Ellie's Airtable review (May 22):** ~30+ companies got @-mention comments in the `Translated Body (from Signal Drafts)` column. Silence = keeper. **Nick has not yet read those comments.** Open Airtable before meeting if at all possible.

  Link: https://airtable.com/appFoLY6hjroyA2KW/tblNl6y8hC4bu5HAR/viwChDE93NXYX3ebe?blocks=hide

  Companies visible in Gmail notifications (incomplete, screenshot was scrolling): Biogen, Exegenesis Bio, Prevail Therapeutics, Tern Therapeutics, Janssen Pharma K.K., Novotech, Myrtelle, Excision BioTherapeutics, Janssen R&D, Sardocor, Biocad, AbbVie, Life Biosciences, Brain Neurotherapy Bio, NGGT Inc., NGGT Suzhou, AskBio France, MeiraGTx, Elpida, Baxalta, Eli Lilly, Regeneron, ORA, IVIEW.

---

## Meeting agenda (Nick-side, not for sharing)

### 1. Frame the close (2 min)
- Don't re-litigate. Don't sell back in.
- "Glad we can use this time to set you up to keep running."

### 2. Define "transition complete" (5 min)
- What does Jenn actually need handed over?
  - Airtable assets (she has access already)
  - n8n workflow exports + README per workflow
  - Provider credentials list (Apollo, Hunter, Explorium, LinkedIn scraper, Salesforce connection) — names and what they cost, not the secrets
  - Persona / ICP / classification prompts as text
  - Runbook for the weekly pipeline cycle
- Who on her side is taking it over? Name the person. That changes the handoff format (engineer vs. ops vs. marketer).
- Confirm or push back on June 25 packaging deadline.

### 3. Modality lists Jenn wants for Ellie (10 min) — biggest unknown
Ask, in order:
- Which modalities? (Cell therapy, mRNA, ADC, others?)
- Priority order — which one is most useful to Ellie in the 30 days remaining?
- How many companies / contacts per modality is "enough"?
- Same ICP rules apply (Director+, process dev / CMC / manufacturing functions, US/CA), or different?
- Does she want the same per-company qualification depth that AAV got, or a faster lighter pass?

Lock scope here. Don't leave the meeting vague on this.

### 4. The ABM-vs-outbound question (5 min)
Surface it once. Get her verdict so the internal team inherits a clear setting.
- "AAV ran ABM-style because the universe is small and Ellie went company-by-company. For cell therapy and mRNA the universe is bigger — do you want Ellie to keep the per-contact approval pattern, or move toward higher volume with response rate as the qualifier?"
- This answer shapes how the modality lists are sized and how the handoff doc reads.

### 5. Ellie's AAV comments (3 min)
- "Ellie left comments on the AAV list Friday. I'm going to work through those with her on the next list-quality session and either reclassify or drop. The companies she didn't comment on stand."
- Do not commit to a re-shipped "finalized AAV list" unless she asks for it. The modality pivot probably supersedes Christa's Tuesday ask.

### 6. Cadence for the remaining 30 days (3 min)
- Weekly update email continues (Friday)
- List-quality sessions with Ellie as needed, scheduled by Christa
- Final handoff session in week 4 with whoever inherits the system

### 7. Soft close
- "Anything that would make the next 30 days feel like a win on your side?"
- Listen. Don't fill silence.

---

## Things to NOT do
- Don't volunteer scope. Let Jenn name what she wants.
- Don't apologize for the structural choices. The system was built to spec, the spec evolved.
- Don't propose new playbooks or future engagements. Not the meeting.
- Don't quote dollar figures or refund discussion. She didn't raise it.

## Risks to watch for
- Jenn pushes the modality-list scope wider than 30 days can absorb. Counter: ask which one matters most and sequence.
- Inheriting team has no infra ownership. Counter: ask who's accountable, raise the credential / cost-pass-through implication.
- Ellie is left without an operator partner mid-30-days. Counter: confirm cadence with Christa stays.

## After meeting
- Send a short recap email: what was agreed (modalities + sequence, handoff format + date, cadence).
- Update `clients/teknova/CLAUDE.md` engagement-scope section to reflect transition mode.
- Update operations inventory with planned handoff items and dates.
