import { describe, it, expect } from "vitest";
import {
  ProposeProject,
  ProposeTask,
  SetWeeklyIntent,
  CloseCaptureItem,
  PromoteCaptureItem,
  parseMove,
} from "./schemas";

const UUID = "00000000-0000-4000-8000-000000000000";

describe("enforced move validation", () => {
  it("proposeProject rejects a missing goal link", () => {
    expect(() => parseMove(ProposeProject, { name: "x", area: "Infrastructure" }, "proposeProject")).toThrow(/goal/i);
  });

  it("proposeProject accepts a valid project", () => {
    expect(parseMove(ProposeProject, { name: "x", goal_id: UUID, area: "Infrastructure" }, "proposeProject").goal_id).toBe(UUID);
  });

  it("proposeTask rejects a missing first-5-minutes", () => {
    expect(() =>
      parseMove(ProposeTask, { title: "t", project_id: UUID, importance: "important", urgency: "urgent", first_5_minutes: "" }, "proposeTask"),
    ).toThrow(/first-5-minutes/i);
  });

  it("proposeTask rejects an orphan unless allowOrphan is set", () => {
    const base = { title: "t", importance: "important", urgency: "urgent", first_5_minutes: "go" };
    expect(() => parseMove(ProposeTask, base, "proposeTask")).toThrow(/project/i);
    expect(() => parseMove(ProposeTask, { ...base, allowOrphan: true }, "proposeTask")).not.toThrow();
  });

  it("setWeeklyIntent rejects allocations that do not sum to ~100", () => {
    const bad = { week_of: "2026-06-22", client_engagement_pct: 10, prospect_engagement_pct: 10, infrastructure_pct: 10, finance_pct: 10, admin_pct: 10, personal_pct: 10 };
    expect(() => parseMove(SetWeeklyIntent, bad, "setWeeklyIntent")).toThrow(/sum/i);
    expect(() => parseMove(SetWeeklyIntent, { ...bad, personal_pct: 50 }, "setWeeklyIntent")).not.toThrow();
  });

  it("closeCaptureItem requires a reason", () => {
    expect(() => parseMove(CloseCaptureItem, { item_id: UUID, status: "dismissed", resolved_note: "" }, "closeCaptureItem")).toThrow(/reason/i);
  });

  it("promoteCaptureItem requires the spine id it became", () => {
    expect(() => parseMove(PromoteCaptureItem, { item_id: UUID, promoted_to: "" }, "promoteCaptureItem")).toThrow(/spine id/i);
  });
});
