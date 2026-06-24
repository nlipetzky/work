"use client";

// The integrated Work surface: Focus · Projects · Goals, three tabs switched in
// place (client state) exactly like the Claude Design export. Fed real canon_engine
// data via props from the server page. Pure-presentation; no data fetching here.

import { useState } from "react";
import type { Project } from "@/lib/queries/projects";
import type { Task } from "@/lib/queries/tasks";
import type { WeeklyIntent } from "@/lib/queries/intent";
import type { Activity } from "@/lib/queries/activities";
import type { Goal } from "@/lib/queries/goals";
import type { NorthStar } from "@/lib/queries/northStar";
import type { CalendarEvent } from "@/lib/queries/calendar";

const AREA_COLORS: Record<string, string> = {
  "Client engagement": "#5b9dff",
  "Prospect engagement": "#8957e5",
  Infrastructure: "#d29922",
  Finance: "#3fb950",
  Admin: "#7d8590",
  Personal: "#db61a2",
};

// ---- pure helpers (duplicated from server modules so this stays client-safe) ----
function isDoFirst(t: Task): boolean {
  return t.importance === "important" && t.urgency === "urgent";
}
function runsWithoutYou(level: string | null): boolean {
  return level === "fully" || level === "autonomous";
}
function automationLabel(level: string | null): string {
  switch (level) {
    case "autonomous":
      return "runs itself";
    case "fully":
      return "automated";
    case "semi":
      return "half-automated";
    case "manual":
      return "manual";
    default:
      return "unset";
  }
}
function architectureLabel(arch: string | null): string {
  switch (arch) {
    case "code":
      return "code";
    case "single_call":
      return "AI";
    case "workflow":
      return "AI workflow";
    case "agent":
      return "AI agent";
    default:
      return "";
  }
}
function channelLabel(channel: string | null): string {
  switch (channel) {
    case "queue":
      return "lands in your review queue";
    case "email":
      return "comes to you by email";
    case "surface":
      return "shows up on this surface";
    case "ping":
      return "pings you";
    default:
      return "no channel wired yet";
  }
}
function rankTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aDF = isDoFirst(a) ? 0 : 1;
    const bDF = isDoFirst(b) ? 0 : 1;
    if (aDF !== bDF) return aDF - bDF;
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return new Date(a.due).getTime() - new Date(b.due).getTime();
  });
}
function fiveMinuteSteps(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}
function fmtDue(due: string | null): string | null {
  if (!due) return null;
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return due;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Short label → used for the chips so long area names don't blow out the row.
const AREA_LABELS: Record<string, string> = {
  "Client engagement": "Client",
  "Prospect engagement": "Prospect",
  Infrastructure: "Infra",
};

// ---- shared style tokens ------------------------------------------------------
const eyebrow: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: "#7d8590",
  fontWeight: 600,
};
const sectionCard: React.CSSProperties = {
  border: "1px solid #1d2430",
  background: "#151a23",
  borderRadius: 12,
  padding: "18px 20px",
};
const upTag: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontWeight: 700,
};

function LadderChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "8px 11px",
        borderRadius: 8,
        background: accent ? "rgba(91,157,255,0.08)" : "#0f141d",
        border: `1px solid ${accent ? "rgba(91,157,255,0.3)" : "#1d2430"}`,
      }}
    >
      <span style={{ fontSize: 9, letterSpacing: "0.12em", color: accent ? "#5b9dff" : "#5c6470" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12.5,
          color: accent ? "#8fbcff" : "#e6edf3",
          fontStyle: accent ? "italic" : "normal",
        }}
      >
        {value}
      </span>
    </div>
  );
}
const Arrow = () => <span style={{ alignSelf: "center", color: "#2a3342" }}>→</span>;

interface Props {
  projects: Project[];
  tasks: Task[];
  intent: WeeklyIntent | null;
  activities: Activity[];
  goals: Goal[];
  northStar: NorthStar | null;
  events: CalendarEvent[];
  error: string | null;
}

export default function WorkSurface({ projects, tasks, intent, activities, goals, northStar, events, error }: Props) {
  const [tab, setTab] = useState<"focus" | "projects" | "goals">("focus");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [areaFilter, setAreaFilter] = useState<string>("all");

  // Vision read from canon (north_star). No canon row → honest gap, never design copy.
  const visionLabel = northStar?.statement ?? "not declared in canon";

  // ---- derived ----
  const openTasks = tasks.filter((t) => t.status === "open");
  const ranked = rankTasks(openTasks);
  const doFirst = ranked.filter(isDoFirst);
  const topTask = doFirst[0] ?? null;
  const restDoFirst = doFirst.slice(1);
  const importantNotUrgent = ranked.filter(
    (t) => t.importance === "important" && t.urgency !== "urgent",
  );
  const thenInOrder = [...restDoFirst, ...importantNotUrgent];

  const tasksByProject = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.project?.id ?? "__none__";
    (acc[key] ??= []).push(t);
    return acc;
  }, {});
  const unlinkedCount = (tasksByProject["__none__"] ?? []).filter((t) => t.status === "open").length;

  const activitiesBySystem = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    const key = a.system?.name ?? "Unassigned";
    (acc[key] ??= []).push(a);
    return acc;
  }, {});
  const systemNames = Object.keys(activitiesBySystem);
  const systemCount = systemNames.length;

  const runningCount = activities.filter((a) => runsWithoutYou(a.current_automation_level)).length;
  const totalActivities = activities.length;
  const autonomyPct = totalActivities === 0 ? 0 : Math.round((runningCount / totalActivities) * 100);
  const allGreen = activities.length > 0 && activities.every((a) => a.ensured === true);

  const intentRows = intent
    ? [
        { area: "Client engagement", pct: intent.client_engagement_pct ?? 0 },
        { area: "Prospect engagement", pct: intent.prospect_engagement_pct ?? 0 },
        { area: "Finance", pct: intent.finance_pct ?? 0 },
        { area: "Infrastructure", pct: intent.infrastructure_pct ?? 0 },
        { area: "Admin", pct: intent.admin_pct ?? 0 },
        { area: "Personal", pct: intent.personal_pct ?? 0 },
      ].filter((r) => r.pct > 0)
    : [];
  const weeksStale = intent
    ? Math.floor((Date.now() - new Date(intent.week_of).getTime()) / (7 * 86400000))
    : null;
  const intentDeclared = intent
    ? new Date(intent.week_of).toLocaleDateString("en-US", { weekday: "short" })
    : null;

  const today = new Date();
  const dateLine = today
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .replace(",", " ·");

  const tabBtn = (id: "focus" | "projects" | "goals", label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        borderRadius: 7,
        padding: "6px 14px",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        border: "none",
        fontFamily: "inherit",
        background: tab === id ? "#1d2430" : "transparent",
        color: tab === id ? "#fff" : "#7d8590",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "#0b0e14",
        color: "#e6edf3",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 14,
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 40px 64px" }}>
        {/* sub-nav tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 26 }}>
          {tabBtn("focus", "Focus")}
          {tabBtn("goals", "Goals")}
          {tabBtn("projects", "Projects")}
        </div>

        {error ? (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(248,81,73,0.4)",
              background: "rgba(248,81,73,0.05)",
              padding: 20,
              fontSize: 14,
              color: "#f85149",
            }}
          >
            canon_engine unavailable: {error}
          </div>
        ) : tab === "focus" ? (
          renderFocus()
        ) : tab === "projects" ? (
          renderProjects()
        ) : (
          renderGoals()
        )}
      </div>
    </div>
  );

  // ============================================================ FOCUS
  function renderFocus() {
    return (
      <>
        {/* interpretive header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5c6470", marginBottom: 8 }}>
              {dateLine}
            </div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
              One thing this morning.
            </h1>
            <div style={{ marginTop: 8, fontSize: 14, color: "#7d8590" }}>
              Everything under it is either handled or honestly flagged. Start at the top — don&apos;t go reading the table.
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #1d2430", background: "#151a23", borderRadius: 999, padding: "6px 13px" }}>
              <span className="animate-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: allGreen ? "#3fb950" : "#d29922" }} />
              <span style={{ fontSize: 12, color: "#cdd9e5" }}>
                {allGreen ? "system green · " : ""}
                {runningCount} {runningCount === 1 ? "thing" : "things"} running for you
              </span>
            </div>
          </div>
        </div>

        {/* HERO */}
        <section
          style={{
            marginBottom: 30,
            border: "1px solid rgba(91,157,255,0.45)",
            borderRadius: 14,
            background: "linear-gradient(180deg,#161d29 0%,#141a24 100%)",
            padding: "22px 24px",
            boxShadow: "0 0 0 1px rgba(91,157,255,0.06), 0 18px 40px -28px rgba(91,157,255,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#5b9dff", fontWeight: 700 }}>
              Do this next
            </span>
            {topTask && (
              <span style={{ fontSize: 11, color: "#8fbcff", background: "rgba(91,157,255,0.1)", border: "1px solid rgba(91,157,255,0.2)", borderRadius: 999, padding: "4px 11px" }}>
                highest leverage · not a recurring chore
              </span>
            )}
          </div>

          {topTask ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 26, alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: 23, lineHeight: 1.25, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
                    {topTask.title}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12.5, color: "#7d8590" }}>
                    {fmtDue(topTask.due) ? <span style={{ color: "#d29922" }}>due {fmtDue(topTask.due)}</span> : <span>no due date set</span>}
                  </div>

                  <div style={{ marginTop: 16, borderLeft: "2px solid #5b9dff", padding: "2px 0 2px 14px" }}>
                    <div style={{ fontSize: 10.5, letterSpacing: "0.13em", textTransform: "uppercase", color: "#5c6470", marginBottom: 6 }}>
                      Why this is the lever
                    </div>
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "#7d8590", fontStyle: "italic" }}>
                      Ranked top by importance × urgency. No written rationale on this task yet — that field isn&apos;t captured in canon.
                    </p>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: "0.13em", textTransform: "uppercase", color: "#5c6470", marginBottom: 10 }}>
                      Where it ladders up to
                    </div>
                    <div style={{ display: "flex", alignItems: "stretch", gap: 8, flexWrap: "wrap" }}>
                      <LadderChip label="ACTIVITY" value={topTask.title} />
                      <Arrow />
                      <LadderChip label="PROJECT" value={topTask.project?.name ?? "no project"} />
                      <Arrow />
                      <LadderChip label="GOAL" value={topTask.project?.goal?.title ?? "no goal"} />
                      <Arrow />
                      <LadderChip label="VISION" value={visionLabel} accent />
                    </div>
                  </div>
                </div>

                {/* first 5 minutes — interactive */}
                <div style={{ border: "1px solid #1d2430", background: "#0f141d", borderRadius: 11, padding: "16px 16px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 10.5, letterSpacing: "0.13em", textTransform: "uppercase", color: "#7d8590", fontWeight: 600 }}>
                      First 5 minutes
                    </span>
                    {topTask.first_5_minutes && <span style={{ fontSize: 11, color: "#5c6470" }}>tap to check</span>}
                  </div>

                  {topTask.first_5_minutes ? (
                    (() => {
                      const steps = fiveMinuteSteps(topTask.first_5_minutes);
                      const doneN = steps.filter((_, i) => checked[i]).length;
                      return (
                        <>
                          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                            {steps.map((s, i) => {
                              const on = !!checked[i];
                              return (
                                <div
                                  key={i}
                                  onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                                  style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}
                                >
                                  <span
                                    style={{
                                      width: 16,
                                      height: 16,
                                      flexShrink: 0,
                                      marginTop: 1,
                                      borderRadius: 4,
                                      border: `1px solid ${on ? "#3fb950" : "#2a3342"}`,
                                      background: on ? "#3fb950" : "transparent",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 10,
                                      color: "#0b0e14",
                                    }}
                                  >
                                    {on ? "✓" : ""}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      lineHeight: 1.45,
                                      color: on ? "#5c6470" : "#cdd9e5",
                                      textDecoration: on ? "line-through" : "none",
                                    }}
                                  >
                                    {s}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ marginTop: 14, paddingTop: 11, borderTop: "1px solid #1d2430", fontSize: 12, color: doneN === steps.length ? "#3fb950" : "#5c6470" }}>
                            {doneN === 0
                              ? `${steps.length} ${steps.length === 1 ? "step" : "steps"} to start`
                              : doneN === steps.length
                                ? "All done — ship it."
                                : `${doneN} of ${steps.length} done`}
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#7d8590" }}>
                      No first-5-minutes captured on this task yet.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 13, borderTop: "1px solid #1d2430", fontSize: 11.5, color: "#5c6470" }}>
                Ranked across every open obligation by importance × urgency. Recurring chores are excluded by design.
              </div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: "#7d8590" }}>
              Nothing in Do-First right now. Declare the day, or ask Atlas what to start.
            </div>
          )}
        </section>

        {/* CALENDAR — canon.calendar_events (gws calendar pipeline) */}
        <section style={{ ...sectionCard, marginBottom: 30 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: events.length ? 14 : 0 }}>
            <div>
              <span style={eyebrow}>Calendar</span>
              <span style={{ fontSize: 13, color: "#7d8590", marginLeft: 10 }}>This week</span>
            </div>
            <span style={{ fontSize: 11, color: "#5c6470", whiteSpace: "nowrap" }}>
              {events.length > 0 ? `${events.length} upcoming` : "no upcoming events"}
            </span>
          </div>
          {events.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {events.map((e) => {
                const d = e.start_ts ? new Date(e.start_ts) : null;
                const day = d ? d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—";
                const time = e.all_day || !d ? "all day" : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const cal = e.account_email.includes("konstellationai") ? "KAI" : "INST";
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "baseline", gap: 12, fontSize: 14 }}>
                    <span style={{ width: 124, flexShrink: 0, color: "#7d8590", fontSize: 12 }}>{day}</span>
                    <span style={{ width: 64, flexShrink: 0, color: "#7d8590", fontSize: 12 }}>{time}</span>
                    <span style={{ color: "#cdd9e5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title ?? "(untitled)"}</span>
                    <span style={{ fontSize: 10, color: "#5c6470", border: "1px solid #2a3342", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>{cal}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* THIS WEEK + AUTONOMY */}
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18, marginBottom: 30 }}>
          <section style={sectionCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={eyebrow}>This week</span>
              {weeksStale !== null && weeksStale >= 1 ? (
                <span style={{ fontSize: 11, color: "#d29922" }}>intent {weeksStale}w stale · refresh</span>
              ) : (
                <span style={{ fontSize: 11, color: "#5c6470" }}>declared {intentDeclared ?? "—"} · current</span>
              )}
            </div>
            {intent ? (
              <>
                {intent.theme ? <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.55, color: "#cdd9e5" }}>{intent.theme}</p> : null}
                <div style={{ display: "flex", height: 10, width: "100%", borderRadius: 999, overflow: "hidden" }}>
                  {intentRows.map((a) => (
                    <div key={a.area} style={{ width: `${a.pct}%`, background: AREA_COLORS[a.area] ?? "#7d8590" }} title={`${a.area} ${a.pct}%`} />
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginTop: 13 }}>
                  {intentRows.map((a) => (
                    <span key={a.area} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#7d8590" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: AREA_COLORS[a.area] ?? "#7d8590" }} />
                      {a.area} <span style={{ color: "#e6edf3" }}>{a.pct}%</span>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "#7d8590" }}>No weekly intent declared. Ask Atlas to run the Monday ritual.</div>
            )}
          </section>

          <section style={{ ...sectionCard, display: "flex", flexDirection: "column" }}>
            <span style={eyebrow}>Autonomy</span>
            {totalActivities > 0 ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 8 }}>
                  <span style={{ fontSize: 42, fontWeight: 700, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em" }}>{autonomyPct}%</span>
                </div>
                <div style={{ marginTop: 7, fontSize: 12.5, color: "#7d8590" }}>
                  {runningCount} of {totalActivities} repeating {totalActivities === 1 ? "activity runs" : "activities run"} without you.
                </div>
                <div style={{ marginTop: "auto", paddingTop: 14, fontSize: 12, lineHeight: 1.5, color: "#5c6470" }}>
                  Share of your recurring work that happens whether or not you open this page. The rest is the next thing worth automating.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 42, fontWeight: 700, color: "#fff", lineHeight: 1, marginTop: 8 }}>—</div>
                <div style={{ marginTop: 7, fontSize: 12.5, color: "#7d8590" }}>No activities in the run layer yet.</div>
                <div style={{ marginTop: "auto", paddingTop: 14, fontSize: 12, lineHeight: 1.5, color: "#5c6470" }}>
                  Decompose a system into activities to start tracking autonomy.
                </div>
              </>
            )}
          </section>
        </div>

        {/* SYSTEMS */}
        <section style={{ marginBottom: 30 }}>
          <div style={{ marginBottom: 14 }}>
            <span style={eyebrow}>Systems · what&apos;s running for you</span>
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#cdd9e5" }}>
              Whatever&apos;s flagged <span style={{ color: "#d29922" }}>needs you</span>. Everything else is off your plate — that&apos;s the point.
            </p>
          </div>
          {activities.length === 0 ? (
            <div style={{ ...sectionCard, fontSize: 14, color: "#7d8590" }}>No systems decomposed into activities yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {systemNames.map((systemName) => {
                const acts = activitiesBySystem[systemName];
                const goalTitle = acts[0]?.system?.goal?.title ?? null;
                const needsYou = acts.filter((a) => !runsWithoutYou(a.current_automation_level));
                const handled = acts.filter((a) => runsWithoutYou(a.current_automation_level));
                return (
                  <div key={systemName} style={{ border: "1px solid #1d2430", background: "#151a23", borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{systemName}</div>
                        {goalTitle && <div style={{ fontSize: 11, color: "#5c6470", marginTop: 2 }}>→ {goalTitle}</div>}
                      </div>
                      <span style={{ fontSize: 11, whiteSpace: "nowrap", color: needsYou.length > 0 ? "#7d8590" : "#3fb950" }}>
                        {needsYou.length > 0 ? (
                          <>
                            <span style={{ color: "#d29922" }}>{needsYou.length} need{needsYou.length === 1 ? "s" : ""} you</span> · {handled.length}{" "}
                            {handled.length === 1 ? "doesn't" : "don't"}
                          </>
                        ) : (
                          "fully hands-off"
                        )}
                      </span>
                    </div>
                    <div style={{ ...upTag, color: needsYou.length > 0 ? "#d29922" : "#5c6470", marginBottom: 8 }}>Needs you</div>
                    {needsYou.length === 0 ? (
                      <div style={{ border: "1px dashed #1d2430", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: "#7d8590" }}>
                        Nothing — this whole system runs without you.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {needsYou.map((a) => (
                          <div key={a.id} style={{ border: "1px solid rgba(210,153,34,0.3)", background: "rgba(210,153,34,0.06)", borderRadius: 8, padding: "10px 12px" }}>
                            <div style={{ fontSize: 13, color: "#fff" }}>{a.name}</div>
                            <div style={{ fontSize: 11.5, color: "#7d8590", marginTop: 3 }}>
                              {channelLabel(a.channel)} · {automationLabel(a.current_automation_level)} today
                              {a.target_automation_level && a.target_automation_level !== a.current_automation_level && (
                                <>, aiming for {automationLabel(a.target_automation_level)}</>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ ...upTag, color: "#5c6470", margin: "14px 0 8px" }}>Runs without you</div>
                    {handled.length === 0 ? (
                      <div style={{ fontSize: 12.5, color: "#5c6470" }}>Nothing handled end-to-end yet.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {handled.map((a) => (
                          <div key={a.id} style={{ display: "flex", gap: 8, fontSize: 12.5 }}>
                            <span style={{ color: "#3fb950" }}>✓</span>
                            <span style={{ color: "#b6c2cf" }}>{a.name}</span>
                            {architectureLabel(a.architecture) && <span style={{ fontSize: 11, color: "#5c6470" }}>({architectureLabel(a.architecture)})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* THEN IN ORDER + ACTIVE PROJECTS */}
        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 24, marginBottom: 30 }}>
          <section>
            <div style={{ marginBottom: 12 }}>
              <span style={eyebrow}>Then, in order</span>
              <span style={{ fontSize: 11, color: "#5c6470", marginLeft: 8 }}>after the one above</span>
            </div>
            {thenInOrder.length === 0 ? (
              <div style={{ ...sectionCard, borderRadius: 9, fontSize: 14, color: "#7d8590" }}>Nothing else important is open right now.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {thenInOrder.map((t, i) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 11, border: "1px solid #1d2430", background: "#151a23", borderRadius: 9, padding: "12px 14px" }}>
                    <span style={{ fontSize: 12, color: "#5c6470", width: 14, marginTop: 1 }}>{i + 2}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: "#e6edf3" }}>{t.title}</div>
                      <div style={{ fontSize: 11.5, color: "#7d8590", marginTop: 3 }}>
                        {t.project ? <span>{t.project.name}</span> : <span style={{ color: "#d29922" }}>no project</span>}
                        {fmtDue(t.due) ? (
                          <>
                            {" · "}
                            <span style={{ color: "#d29922" }}>due {fmtDue(t.due)}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div style={{ marginBottom: 12 }}>
              <span style={eyebrow}>Active projects</span>
            </div>
            {projects.filter((p) => p.status === "active").length === 0 ? (
              <div style={{ ...sectionCard, borderRadius: 10, fontSize: 14, color: "#7d8590" }}>No active projects.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects
                  .filter((p) => p.status === "active")
                  .map((p) => {
                    const open = (tasksByProject[p.id] ?? []).filter((t) => t.status === "open");
                    return (
                      <div key={p.id} style={{ border: "1px solid #1d2430", background: "#151a23", borderRadius: 10, padding: "13px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: (p.area && AREA_COLORS[p.area]) || "#7d8590" }} />
                          <span style={{ fontSize: 13.5, color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                            {p.name}
                          </span>
                          <span style={{ fontSize: 11, color: "#5c6470", marginLeft: "auto", whiteSpace: "nowrap" }}>{open.length} open</span>
                        </div>
                        {open.length > 0 && (
                          <div style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid #1d2430", display: "flex", flexDirection: "column", gap: 5 }}>
                            {open.slice(0, 3).map((t) => (
                              <div key={t.id} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: isDoFirst(t) ? "#d29922" : "#2a3342", marginTop: 6, flexShrink: 0 }} />
                                <span style={{ color: isDoFirst(t) ? "#cdd9e5" : "#7d8590" }}>{t.title}</span>
                              </div>
                            ))}
                            {open.length > 3 && <div style={{ fontSize: 11, color: "#5c6470", paddingLeft: 13 }}>+{open.length - 3} more</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        </div>

        {/* WHAT THIS SURFACE DOESN'T KNOW */}
        <section style={{ border: "1px solid #1d2430", background: "rgba(21,26,35,0.5)", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <span style={eyebrow}>What this surface doesn&apos;t know</span>
            <span style={{ fontSize: 11, color: "#5c6470" }}>— trust comes from the gaps, not the polish</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            <div style={{ borderLeft: "2px solid #2a3342", paddingLeft: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#d29922" }}>—</div>
              <div style={{ fontSize: 12, color: "#7d8590", marginTop: 3, lineHeight: 1.45 }}>
                emails un-triaged. The inbox isn&apos;t wired in, so obligations sitting in mail aren&apos;t counted here.
              </div>
            </div>
            <div style={{ borderLeft: "2px solid #2a3342", paddingLeft: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#d29922" }}>{unlinkedCount}</div>
              <div style={{ fontSize: 12, color: "#7d8590", marginTop: 3, lineHeight: 1.45 }}>
                open task{unlinkedCount !== 1 ? "s" : ""} with no project. Unlinked, so they never make it into the ranking above.
              </div>
            </div>
            <div style={{ borderLeft: "2px solid #2a3342", paddingLeft: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#d29922" }}>{systemCount}</div>
              <div style={{ fontSize: 12, color: "#7d8590", marginTop: 3, lineHeight: 1.45 }}>
                system{systemCount !== 1 ? "s" : ""} decomposed into activities. Everything not yet decomposed is still on your plate.
              </div>
            </div>
          </div>
        </section>

        <div style={{ marginTop: 26, textAlign: "center", fontSize: 11, color: "#2a3342" }}>
          live · canon_engine · tasks · projects · goals · systems · activities · weekly intent
        </div>
      </>
    );
  }

  // ============================================================ PROJECTS
  function renderProjects() {
    const shown = projects.filter((p) => p.status === "active" || p.status === "paused");
    const sorted = [...shown].sort((a, b) => (a.status === b.status ? 0 : a.status === "active" ? -1 : 1));
    const filtered = sorted.filter((p) => areaFilter === "all" || p.area === areaFilter);
    const openTaskTotal = shown.reduce((n, p) => n + (tasksByProject[p.id] ?? []).filter((t) => t.status === "open").length, 0);
    // Chips derived from canon areas present on shown projects (+ "All").
    const projectAreas = Array.from(
      new Set(shown.map((p) => p.area).filter((a): a is string => !!a)),
    ).sort();
    const chips: [string, string][] = [
      ["all", "All"],
      ...projectAreas.map((a) => [a, AREA_LABELS[a] ?? a] as [string, string]),
    ];

    return (
      <>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>Projects</h1>
            <div style={{ marginTop: 8, fontSize: 14, color: "#7d8590" }}>
              Active work, grouped by project — what each is for, what &apos;done&apos; looks like, and the next move.
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, fontSize: 12, color: "#5c6470" }}>
            {shown.length} project{shown.length !== 1 ? "s" : ""} · {openTaskTotal} open task{openTaskTotal !== 1 ? "s" : ""}
          </div>
        </div>

        {/* area filter */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
          {chips.map(([val, label]) => {
            const on = areaFilter === val;
            return (
              <button
                key={val}
                onClick={() => setAreaFilter(val)}
                style={{
                  cursor: "pointer",
                  fontSize: 12,
                  borderRadius: 999,
                  padding: "5px 13px",
                  fontFamily: "inherit",
                  background: on ? "#1d2430" : "transparent",
                  color: on ? "#fff" : "#7d8590",
                  border: `1px solid ${on ? "#2a3342" : "#1d2430"}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div style={{ ...sectionCard, fontSize: 14, color: "#7d8590" }}>No projects in this area.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map((p) => {
              const all = tasksByProject[p.id] ?? [];
              const open = all.filter((t) => t.status === "open");
              const done = all.filter((t) => t.status === "done");
              const total = all.length;
              const pct = total === 0 ? 0 : Math.round((done.length / total) * 100);
              const paused = p.status === "paused";
              const areaColor = (p.area && AREA_COLORS[p.area]) || "#7d8590";
              const ordered = [...done, ...rankTasks(open)];
              return (
                <div key={p.id} style={{ border: "1px solid #1d2430", background: "#151a23", borderRadius: 12, padding: "18px 20px", opacity: paused ? 0.72 : 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: areaColor, marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{p.name}</div>
                        {p.goal ? <div style={{ fontSize: 11, color: "#5c6470", marginTop: 3 }}>→ {p.goal.title}</div> : <div style={{ fontSize: 11, color: "#d29922", marginTop: 3 }}>not tied to a goal</div>}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        whiteSpace: "nowrap",
                        borderRadius: 999,
                        padding: "3px 10px",
                        color: paused ? "#7d8590" : "#3fb950",
                        background: paused ? "#10141c" : "rgba(63,185,80,0.1)",
                        border: `1px solid ${paused ? "#1d2430" : "rgba(63,185,80,0.2)"}`,
                      }}
                    >
                      {p.status}
                    </span>
                  </div>

                  {p.outcome && (
                    <div style={{ marginTop: 11, fontSize: 12.5, color: "#7d8590" }}>
                      <span style={{ color: "#5c6470" }}>Done when</span> — {p.outcome}
                    </div>
                  )}

                  {p.next_action && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, borderLeft: "2px solid #5b9dff", background: "rgba(91,157,255,0.05)", padding: "8px 12px", borderRadius: "0 8px 8px 0" }}>
                      <span style={{ fontSize: 9, letterSpacing: "0.13em", textTransform: "uppercase", color: "#5b9dff", fontWeight: 700 }}>Next</span>
                      <span style={{ fontSize: 13, color: "#e6edf3" }}>{p.next_action}</span>
                    </div>
                  )}

                  {ordered.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 4, borderTop: "1px solid #1d2430" }}>
                      {ordered.map((t) => {
                        const isDone = t.status === "done";
                        const df = !isDone && isDoFirst(t);
                        return (
                          <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0" }}>
                            <span
                              style={{
                                width: 15,
                                height: 15,
                                flexShrink: 0,
                                marginTop: 1,
                                borderRadius: 4,
                                background: isDone ? "#3fb950" : "transparent",
                                border: isDone ? "none" : `1px solid ${df ? "#d29922" : "#2a3342"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                color: "#0b0e14",
                              }}
                            >
                              {isDone ? "✓" : ""}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 13, color: isDone ? "#5c6470" : "#fff", textDecoration: isDone ? "line-through" : "none" }}>
                                {t.title}
                              </span>
                              {df && (
                                <span style={{ fontSize: 10, color: "#d29922", border: "1px solid rgba(210,153,34,0.3)", background: "rgba(210,153,34,0.08)", borderRadius: 4, padding: "1px 6px", marginLeft: 8, letterSpacing: "0.04em" }}>
                                  DO FIRST
                                </span>
                              )}
                              {!isDone && fmtDue(t.due) && <span style={{ fontSize: 11.5, color: "#d29922", marginLeft: 8 }}>due {fmtDue(t.due)}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid #1d2430", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 999, background: "#10141c", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#3fb950" }} />
                    </div>
                    <span style={{ fontSize: 11.5, color: "#7d8590", whiteSpace: "nowrap" }}>
                      {done.length} / {total} done · {open.length} open
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  // ============================================================ GOALS
  function renderGoals() {
    const projForGoal = (id: string) => projects.filter((p) => p.goal_id === id);
    const activeProjectCount = projects.filter((p) => p.status === "active").length;

    return (
      <>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>Goals</h1>
            <div style={{ marginTop: 8, fontSize: 14, color: "#7d8590" }}>
              Ranked by leverage on the vision. Each one says why it exists and what it ladders up to.
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, fontSize: 12, color: "#5c6470" }}>
            {goals.length} active goal{goals.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* vision apex */}
        <div style={{ marginBottom: 22, border: "1px solid rgba(91,157,255,0.4)", borderRadius: 14, background: "linear-gradient(180deg,#161d29 0%,#141a24 100%)", padding: "20px 24px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#5b9dff", fontWeight: 700 }}>
            The vision · what every goal ladders up to
          </div>
          <div style={{ fontSize: 23, fontWeight: 600, color: northStar ? "#fff" : "#7d8590", marginTop: 9, letterSpacing: "-0.01em", fontStyle: northStar ? "normal" : "italic" }}>
            {northStar ? northStar.statement : "No vision declared in canon yet."}
          </div>
          {northStar?.description && (
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "#cdd9e5", marginTop: 9, maxWidth: "62ch" }}>
              {northStar.description}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(91,157,255,0.18)" }}>
            <span style={{ fontSize: 12.5, color: "#7d8590" }}>
              <span style={{ color: "#fff", fontWeight: 600 }}>{autonomyPct}%</span> autonomous
            </span>
            <span style={{ fontSize: 12.5, color: "#7d8590" }}>
              <span style={{ color: "#fff", fontWeight: 600 }}>{goals.length}</span> active goals
            </span>
            <span style={{ fontSize: 12.5, color: "#7d8590" }}>
              <span style={{ color: "#fff", fontWeight: 600 }}>{activeProjectCount}</span> active projects
            </span>
            <span style={{ fontSize: 12.5, color: "#5c6470" }}>MRR · runway · clients not wired</span>
          </div>
        </div>

        {goals.length === 0 ? (
          <div style={{ ...sectionCard, fontSize: 14, color: "#7d8590" }}>No active goals in canon.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {goals.map((g, i) => {
              const drivers = projForGoal(g.id);
              const areaColor = (g.area && AREA_COLORS[g.area]) || "#7d8590";
              return (
                <div key={g.id} style={{ border: "1px solid #1d2430", background: "#151a23", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 13, color: "#2a3342", fontWeight: 700, marginTop: 4 }}>
                        {String(g.rank ?? i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ width: 9, height: 9, borderRadius: "50%", background: areaColor, flexShrink: 0 }} />
                          <span style={{ fontSize: 17, fontWeight: 600, color: "#fff" }}>{g.title}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: "#5c6470", marginTop: 4 }}>
                          {g.area ?? "no area"}
                          {g.horizon ? <> · horizon {g.horizon}</> : null}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#3fb950", background: "rgba(63,185,80,0.1)", border: "1px solid rgba(63,185,80,0.2)", borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
                      {g.status}
                    </span>
                  </div>

                  {g.why_it_matters && (
                    <p style={{ margin: "13px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#cdd9e5" }}>{g.why_it_matters}</p>
                  )}

                  {g.target && (
                    <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c6470" }}>Target</span>
                      <span style={{ fontSize: 12.5, color: "#cdd9e5", textAlign: "right" }}>{g.target}</span>
                    </div>
                  )}

                  {drivers.length > 0 && (
                    <div style={{ marginTop: 15, paddingTop: 13, borderTop: "1px solid #1d2430", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#5c6470" }}>Driven by</span>
                      {drivers.map((p) => (
                        <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #1d2430", background: "#10141c", borderRadius: 6, padding: "3px 10px", fontSize: 11.5, color: "#cdd9e5" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: (p.area && AREA_COLORS[p.area]) || "#7d8590" }} />
                          {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 26, textAlign: "center", fontSize: 11, color: "#2a3342" }}>
          live · canon_engine · goals · projects
        </div>
      </>
    );
  }
}
