// Types for the pure ranking engine (ranking.mjs). Spec:
// practices/operator-os/reference/ranking-formula.md.

export type Leverage = "code" | "media" | "capital" | "labor" | "none";
export type WealthTest = "asset" | "rented_time";

/** One candidate task, flattened with the leverage signal from its goal. */
export interface RankInput {
  id: string;
  title: string;
  importance: string | null;
  urgency: string | null;
  due: string | null;
  first_5_minutes: string | null;
  recurring: boolean;
  /** spine Area (project.area, falling back to the goal's area) */
  area: string | null;
  /** from the goal this task ladders to */
  leverage: Leverage | null;
  wealth_test: WealthTest | null;
  project: { id: string; name: string; goal: { id: string; title: string } | null } | null;
}

export interface WeeklyIntentLike {
  client_engagement_pct: number | null;
  prospect_engagement_pct: number | null;
  infrastructure_pct: number | null;
  finance_pct: number | null;
  admin_pct: number | null;
  personal_pct: number | null;
}

export interface ScoreFactors {
  base: number;
  leverage_mult: number;
  wealth_mult: number;
  area_mult: number;
  time_mult: number;
  days_until_due: number | null;
}

export interface ScoredTask extends RankInput {
  score: number;
  isDoFirst: boolean;
  factors: ScoreFactors;
}

export interface RankResult {
  top: ScoredTask | null;
  ranked: ScoredTask[];
  overrodeUrgent: { topId: string; beatId: string; beatTitle: string } | null;
}

export const LEVERAGE_MULT: Record<Leverage, number>;
export const WEALTH_MULT: Record<WealthTest, number>;

export function scoreTask(t: RankInput, intent: WeeklyIntentLike | null, today: number): ScoredTask;
export function rankNextActions(
  tasks: RankInput[],
  intent: WeeklyIntentLike | null,
  todayMs?: number,
): RankResult;
