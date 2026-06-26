import { describe, it, expect } from "vitest";
import { rankNextActions, scoreTask } from "./ranking.mjs";

const TODAY = Date.UTC(2026, 5, 25); // 2026-06-25

function task(over: Partial<any> = {}): any {
  return {
    id: over.id ?? crypto.randomUUID(),
    title: over.title ?? "t",
    importance: over.importance ?? "not_important",
    urgency: over.urgency ?? "not_urgent",
    due: over.due ?? null,
    first_5_minutes: "do x",
    recurring: over.recurring ?? false,
    area: over.area ?? null,
    leverage: over.leverage ?? null,
    wealth_test: over.wealth_test ?? null,
    project: null,
    ...over,
  };
}

describe("scoreTask", () => {
  it("base = importance x urgency", () => {
    expect(scoreTask(task({ importance: "important", urgency: "urgent" }), null, TODAY).factors.base).toBe(4);
    expect(scoreTask(task({ importance: "important", urgency: "not_urgent" }), null, TODAY).factors.base).toBe(2);
    expect(scoreTask(task({ importance: "not_important", urgency: "not_urgent" }), null, TODAY).factors.base).toBe(1);
  });

  it("applies leverage and wealth multipliers from the goal", () => {
    const s = scoreTask(task({ importance: "important", urgency: "not_urgent", leverage: "code", wealth_test: "asset" }), null, TODAY);
    expect(s.score).toBeCloseTo(2 * 1.5 * 1.2, 3);
  });

  it("overdue beats far-future via time_mult", () => {
    const overdue = scoreTask(task({ due: "2026-06-20" }), null, TODAY);
    const future = scoreTask(task({ due: "2026-09-01" }), null, TODAY);
    expect(overdue.factors.time_mult).toBe(1.4);
    expect(future.factors.time_mult).toBe(1.0);
  });

  it("area_mult reflects declared weekly allocation", () => {
    const intent = { client_engagement_pct: 40, prospect_engagement_pct: 0, infrastructure_pct: 0, finance_pct: 0, admin_pct: 0, personal_pct: 0 };
    expect(scoreTask(task({ area: "Client engagement" }), intent, TODAY).factors.area_mult).toBeCloseTo(1.2, 3);
    expect(scoreTask(task({ area: "Finance" }), intent, TODAY).factors.area_mult).toBe(1.0);
  });
});

describe("rankNextActions", () => {
  it("excludes recurring tasks from the candidate set", () => {
    const r = rankNextActions([task({ id: "a", recurring: true }), task({ id: "b" })], null, TODAY);
    expect(r.ranked.map((t) => t.id)).toEqual(["b"]);
  });

  it("a high-leverage not-urgent task can outrank a low-leverage urgent one, and flags it", () => {
    const lever = task({ id: "lever", importance: "important", urgency: "not_urgent", leverage: "code", wealth_test: "asset", due: "2026-06-26" });
    const urgent = task({ id: "urgent", importance: "important", urgency: "urgent", leverage: "none" });
    // lever: 2*1.5*1.2*1*1.3(due tomorrow)=4.68 ; urgent: 4*1*1*1*1=4
    const r = rankNextActions([urgent, lever], null, TODAY);
    expect(r.top?.id).toBe("lever");
    expect(r.overrodeUrgent?.beatId).toBe("urgent");
  });

  it("does not flag overrodeUrgent when the top is itself do-first", () => {
    const r = rankNextActions([task({ id: "x", importance: "important", urgency: "urgent" })], null, TODAY);
    expect(r.overrodeUrgent).toBeNull();
  });
});
