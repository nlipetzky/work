# Nick's Operating Rhythm

The daily and weekly structure that binds intent across time. Reviewed when the rhythm stops serving.

**Last reviewed:** 2026-05-13.

## Daily template (time-blocked)

| Block | Time | Purpose |
|---|---|---|
| Morning check-in | 8–9 AM | Read morning digest. Daily rituals: 1 prospecting action + client inbox skim. Pick today's Do First. |
| Deep work | 9 AM–12 PM | Primary theme of the day. No meetings, no Slack drift, no unbounded AI sessions. |
| Lunch | 12–1 PM | Break. |
| Afternoon | 1–5 PM | Meetings cluster here. Lighter tasks. Responsive work. |
| Wrap | 5–6 PM | Mark completions. Read evening mirror. Set up tomorrow. |

**Hard rules:**

- **No meetings before 12 PM.** Mornings are thinking work. Non-negotiable.
- **No new builds Mon–Thu.** Capture the urge in writing for Friday.
- **No AI session longer than 60 min without check.** Past 60 min, ask: is this still on today's theme?

## Day themes (morning deep-work primary focus)

| Day | Theme |
|---|---|
| Monday | Planning + week setup. Write the Weekly Intent. Review Projects, Stalled view, Roadmap. |
| Tuesday | Client execution (Teknova). |
| Wednesday | Client execution + weekly status drafting. |
| Thursday | Flex / open. Client work, new offer development, or whatever's hot. |
| Friday | Tinkering + content + experiments. AI projects, social, agentic exploration. |

Friday is the pressure-release valve. The system-building urge gets a home so it doesn't leak into Tue–Thu.

## Daily rituals (every day, regardless of theme)

- **Prospecting (15–30 min):** one outbound action. The bar is contact, not conversion.
- **Client management (variable):** scan client signals (Gmail, Teknova table). Respond to flagged items.

Both are non-negotiable. The evening mirror flags days with zero of either.

## Weekly cadence

- **Monday morning:** Write the Weekly Intent (cool-state allocation).
- **Wednesday morning:** Draft Teknova Wednesday status email before lunch.
- **Friday afternoon:** Optional retro — what worked, what didn't.
- **Sunday evening (optional):** Pre-read next week's commitments.

## How the system supports this

- **Morning digest** (`compose-daily-digest`, fires AM): today's theme, open Do First, awaiting approvals, daily rituals.
- **Evening mirror** (`daily-evening-mirror`, fires 6 PM CT): today's completed work by Area, week-to-date vs. Weekly Intent, no-movement Projects, tomorrow's theme.
- **Weekly Intent table** (Airtable): cool-state declaration of where time should go this week. Evening mirror reads it.

## Resume pointer

Read alongside `nick-strategic-intent.md` and `executive-function-as-a-system.md`.
