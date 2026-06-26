// Pure ranking engine for the daily-protocol "one next action" (DEFINE §3, step 3).
// Spec: practices/operator-os/reference/ranking-formula.md.
//
// PURE — no DB, no "server-only", no env. Imported by both the app
// (lib/queries/ranking.ts) and the eyeball script (scripts/rank-eyeball.mjs).
// Types live alongside in ranking.d.ts.

export const LEVERAGE_MULT = { code: 1.5, media: 1.5, capital: 1.3, labor: 1.15, none: 1.0 };
export const WEALTH_MULT = { asset: 1.2, rented_time: 1.0 };
// lower = ranked first on a score tie
const LEVERAGE_RANK = { code: 0, media: 0, capital: 1, labor: 2, none: 3 };

// Maps a spine Area label to the weekly_intent percentage column.
const AREA_TO_INTENT_PCT = {
  "Client engagement": "client_engagement_pct",
  "Prospect engagement": "prospect_engagement_pct",
  Infrastructure: "infrastructure_pct",
  Finance: "finance_pct",
  Admin: "admin_pct",
  Personal: "personal_pct",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** @param {string|null|undefined} importance @param {string|null|undefined} urgency */
function baseScore(importance, urgency) {
  const i = importance === "important" ? 2 : 1;
  const u = urgency === "urgent" ? 2 : 1;
  return i * u;
}

/** Days from `today` (UTC midnight) to a YYYY-MM-DD due date; null if no due. */
function daysUntilDue(due, today) {
  if (!due) return null;
  const d = Date.parse(due);
  if (Number.isNaN(d)) return null;
  return Math.round((d - today) / MS_PER_DAY);
}

function timeMult(daysOut) {
  if (daysOut === null) return 1.0;
  if (daysOut < 0) return 1.4; // overdue
  if (daysOut <= 2) return 1.3;
  if (daysOut <= 7) return 1.15;
  return 1.0;
}

/** area_mult from declared weekly allocation; 1.0 when no intent / no area. */
function areaMult(area, intent) {
  if (!area || !intent) return 1.0;
  const col = AREA_TO_INTENT_PCT[area];
  const pct = col ? intent[col] : null;
  if (typeof pct !== "number" || pct <= 0) return 1.0;
  return 1.0 + (Math.min(pct, 100) / 100) * 0.5;
}

/**
 * Score one rankable task. Returns the score and the factor breakdown for explanation.
 * @param {import("./ranking").RankInput} t
 * @param {import("./ranking").WeeklyIntentLike|null} intent
 * @param {number} today  UTC-midnight epoch ms (injected so the fn stays pure/testable)
 * @returns {import("./ranking").ScoredTask}
 */
export function scoreTask(t, intent, today) {
  const leverage = t.leverage ?? "none";
  const wealth = t.wealth_test ?? null;
  const base = baseScore(t.importance, t.urgency);
  const lev = LEVERAGE_MULT[leverage] ?? 1.0;
  const wlt = wealth ? WEALTH_MULT[wealth] ?? 1.0 : 1.0;
  const ar = areaMult(t.area, intent);
  const daysOut = daysUntilDue(t.due, today);
  const tm = timeMult(daysOut);
  const score = base * lev * wlt * ar * tm;
  return {
    ...t,
    score: Math.round(score * 1000) / 1000,
    isDoFirst: t.importance === "important" && t.urgency === "urgent",
    factors: { base, leverage_mult: lev, wealth_mult: wlt, area_mult: Math.round(ar * 1000) / 1000, time_mult: tm, days_until_due: daysOut },
  };
}

/**
 * Rank the candidate tasks. Excludes recurring; returns scored list (desc) plus the
 * top action and an `overrodeUrgent` explanation when the lever beats the loudest thing.
 * @param {import("./ranking").RankInput[]} tasks
 * @param {import("./ranking").WeeklyIntentLike|null} intent
 * @param {number} [todayMs]  defaults to now's UTC midnight
 * @returns {import("./ranking").RankResult}
 */
export function rankNextActions(tasks, intent, todayMs) {
  const today = todayMs ?? (() => { const n = new Date(); return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()); })();
  const scored = tasks
    .filter((t) => !t.recurring)
    .map((t) => scoreTask(t, intent, today))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const la = LEVERAGE_RANK[a.leverage ?? "none"] ?? 3;
      const lb = LEVERAGE_RANK[b.leverage ?? "none"] ?? 3;
      if (la !== lb) return la - lb;
      const da = a.due ? Date.parse(a.due) : Infinity;
      const db = b.due ? Date.parse(b.due) : Infinity;
      if (da !== db) return da - db;
      return (b.isDoFirst ? 1 : 0) - (a.isDoFirst ? 1 : 0);
    });

  const top = scored[0] ?? null;
  let overrodeUrgent = null;
  if (top && !top.isDoFirst) {
    const beaten = scored.find((t) => t.isDoFirst && t.score < top.score);
    if (beaten) overrodeUrgent = { topId: top.id, beatId: beaten.id, beatTitle: beaten.title };
  }
  return { top, ranked: scored, overrodeUrgent };
}
