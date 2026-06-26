# Ranking formula — the one next action

The daily protocol's step 3 surfaces **one** next action. This is the spec for how it's computed.
It is the riskiest judgment-to-code translation in the runner (DEFINE §8.2), so it's pinned here and
proven by eyeballing the ranked list over the real task set before any UI rides on it.

Implementation: `systems/projection-ui/lib/ranking.mjs` (pure), surfaced via
`lib/queries/ranking.ts`. Eyeball it with `node scripts/rank-eyeball.mjs`.

## Candidate set

Open tasks only (`tasks.status = 'open'`), each laddered through its project to a goal. **Recurring
tasks are excluded** (`tasks.recurring = true`) — they're routines, not the lever. Orphan tasks (no
project, or project with no goal) still rank, but carry no leverage signal (multiplier 1.0) and are
flagged for laddering.

## Score

```
score = base × leverage_mult × wealth_mult × area_mult × time_mult
```

**base = importance × urgency** (the Eisenhower core):

| value | importance | urgency |
|-------|-----------|---------|
| high  | `important` = 2 | `urgent` = 2 |
| low   | `not_important` = 1 | `not_urgent` = 1 |
| null  | 1 | 1 |

→ base ∈ {1, 2, 4}.

**leverage_mult** — from the goal the task ladders to (`goals.leverage`). This is the lever that lets
a not-urgent compounding task outrank an urgent errand (methodology §3a):

| leverage | mult |
|----------|------|
| code, media | 1.5 |
| capital | 1.3 |
| labor | 1.15 |
| none, null | 1.0 |

**wealth_mult** — `goals.wealth_test`: `asset` = 1.2, `rented_time` = 1.0, null = 1.0. Favors work
that earns while Nick sleeps over capped rented time.

**area_mult** — alignment to the current week's declared allocation. The task's area (project.area,
falling back to its goal's area) maps to the matching `weekly_intent` percentage:

```
area_mult = 1.0 + (declared_pct / 100) × 0.5      → 0% ⇒ 1.0, 40% ⇒ 1.2, 100% ⇒ 1.5
```

No current intent row ⇒ 1.0. **Honest limit:** this rewards *alignment to the declared plan*, not
*remaining capacity* — there is no per-area actual-spend signal wired yet, so the runner cannot dampen
an over-spent area. Treat like runway below: a named gap, not faked.

**time_mult** — due-date proximity (the calendar/time signal we can compute today):

| due | mult |
|-----|------|
| overdue (`due < today`) | 1.4 |
| within 2 days | 1.3 |
| within 7 days | 1.15 |
| later / no due date | 1.0 |

## Tie-break

Equal score → lower leverage-rank first (code/media < capital < labor < none), then earlier `due`
(nulls last), then `important` before `not_important`.

## Output

Tasks sorted by score descending. The top row is **the one next action**; the rest is the ordered
backlog. Each scored task carries its factor breakdown so the surface can explain the rank. When the
top action is *not* do-first (importance+urgency both high) yet outranks a do-first task, the result
flags `overrodeUrgent` + the task it beat — that's the "why this is the lever, not the loudest thing"
explanation the methodology requires.

## Not in the score (named gaps, not faked)

- **runway** — no financial signal is wired; the methodology's "favor revenue when runway is short"
  cannot be computed yet. Documented, not approximated.
- **remaining weekly capacity** — see area_mult limit above; needs per-area actual-activity tracking.
- **calendar-event linkage** — time_mult uses due-date proximity only; boosting a task because an
  imminent meeting depends on it is future work (requires event→project linkage).

The model never produces the score. The score is deterministic code; the model only *phrases* the
rationale + first-5-min from the top row (Phase 2). AI is a called function, not the ranker.
