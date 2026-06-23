// Focus surface — spec-work-focus-surface.md 2026-06-22 (Boris build)
// R1: ranked by Importance×Urgency; leverage axis pending (no task.leverage field yet)
// R2: ladder visible (task→project→goal→vision) in the hero card
// R3: active projects drill down to their open tasks
// R4: honest gap count — triage system not yet wired
// R5: autonomy metric beside area-allocation bar
// R6: Start → is a working anchor to the first-5-minutes panel

import { listProjects, type Project } from "@/lib/queries/projects";
import { listOpenTasks, isDoFirst, type Task } from "@/lib/queries/tasks";
import { latestWeeklyIntent, type WeeklyIntent } from "@/lib/queries/intent";
import {
  listActivities,
  autonomyGradient,
  type Activity,
  type AutonomyGradient,
} from "@/lib/queries/activities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Studio thesis one-liner. Lives above goals in the §3 spine.
const VISION = "Autonomous revenue-generating environment";

const AREA_COLORS: Record<string, string> = {
  "Client engagement": "#5b9dff",
  "Prospect engagement": "#8957e5",
  Infrastructure: "#d29922",
  Finance: "#3fb950",
  Admin: "#7d8590",
  Personal: "#db61a2",
};

function AreaDot({ area }: { area: string | null }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: (area && AREA_COLORS[area]) || "#7d8590" }}
    />
  );
}

// Run-layer language: translate internal levels into what they mean for Nick.
// "Runs without you" = the system handles it end to end (scheduled automation or
// self-correcting). "Needs you" = a human is still in the loop (manual / half-automated).
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
      return "shows up in your review queue";
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

function intentRows(w: WeeklyIntent) {
  return [
    { area: "Client engagement", pct: w.client_engagement_pct ?? 0 },
    { area: "Prospect engagement", pct: w.prospect_engagement_pct ?? 0 },
    { area: "Infrastructure", pct: w.infrastructure_pct ?? 0 },
    { area: "Finance", pct: w.finance_pct ?? 0 },
    { area: "Admin", pct: w.admin_pct ?? 0 },
    { area: "Personal", pct: w.personal_pct ?? 0 },
  ];
}

// R1: Do-First tasks rise; within that, earlier due date wins.
// Leverage sub-sort not yet wired — needs task.leverage field.
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

// R2: activity → project → goal → vision
function Ladder({ task }: { task: Task }) {
  const goal = task.project?.goal;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
      <span className="text-[#cdd9e5]">{task.project?.name ?? "no project"}</span>
      {goal && (
        <>
          <span className="text-ink-600">→</span>
          <span>{goal.title}</span>
        </>
      )}
      <span className="text-ink-600">→</span>
      <span className="italic text-ink-500">{VISION}</span>
    </div>
  );
}

export default async function WorkPage() {
  let projects: Project[] = [];
  let tasks: Task[] = [];
  let intent: WeeklyIntent | null = null;
  let activities: Activity[] = [];
  let autonomy: AutonomyGradient = { autonomous: 0, ensured: 0, pct: 0 };
  let error: string | null = null;
  try {
    [projects, tasks, intent, activities, autonomy] = await Promise.all([
      listProjects(),
      listOpenTasks(),
      latestWeeklyIntent(),
      listActivities(),
      autonomyGradient(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const activeProjects = projects.filter((p) => p.status === "active");
  const ranked = rankTasks(tasks);
  const doFirst = ranked.filter(isDoFirst);
  const topTask = doFirst[0] ?? null;
  const weeksStale =
    intent
      ? Math.floor((Date.now() - new Date(intent.week_of).getTime()) / (7 * 86400000))
      : null;

  // R3: group tasks by project id for drill-down
  const tasksByProject = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.project?.id ?? "__none__";
    (acc[key] ??= []).push(t);
    return acc;
  }, {});
  const unlinkedCount = tasksByProject["__none__"]?.length ?? 0;

  // Run layer: group activities by their system name (order preserved from query).
  const activitiesBySystem = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    const key = a.system?.name ?? "Unassigned";
    (acc[key] ??= []).push(a);
    return acc;
  }, {});
  const systemNames = Object.keys(activitiesBySystem);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <div className="mb-6 flex gap-1 text-sm">
          <a href="/work" className="rounded-md bg-ink-700 px-3 py-1.5 font-medium text-white">
            Focus
          </a>
          <a
            href="/work/goals"
            className="rounded-md px-3 py-1.5 text-muted hover:bg-ink-800 hover:text-white"
          >
            Goals
          </a>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Today</h1>
          <div className="mt-1 text-sm text-muted">start here, not in ten tabs</div>
        </div>

        {error ? (
          <div className="rounded-xl border border-bad/40 bg-bad/5 p-5 text-sm text-bad">
            canon_engine: {error}
          </div>
        ) : (
          <>
            {/* R1 + R2: ONE NEXT ACTION */}
            <section className="mb-8 rounded-xl border border-accent/40 bg-ink-800 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-accent">
                  One next action
                </div>
                {topTask && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                    Important · Urgent
                  </span>
                )}
              </div>
              {topTask ? (
                <>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.1fr_1fr]">
                    <div>
                      <div className="text-lg font-semibold text-white">{topTask.title}</div>
                      <div className="mt-1 text-xs text-muted">
                        {topTask.due ? (
                          <span className="text-warn">due {topTask.due}</span>
                        ) : (
                          "no due date"
                        )}
                      </div>
                      {/* R2: the ladder */}
                      <Ladder task={topTask} />
                    </div>
                    <div className="rounded-lg border border-ink-700 bg-ink-850 p-4">
                      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                        First 5 minutes
                      </div>
                      <p className="text-sm leading-relaxed text-[#cdd9e5]">
                        {topTask.first_5_minutes ??
                          "Not set — ask Atlas to draft the first 5 minutes for this task."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-ink-700 pt-3 text-xs text-ink-500">
                    Ranked by Importance × Urgency. Leverage scoring and recurring-activity
                    detection pending <code>task.leverage</code> field + triage system.
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted">
                  Nothing in Do-First. Declare your day, or ask Atlas what to start.
                </div>
              )}
            </section>

            {/* THIS WEEK + R5: autonomy metric */}
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  This week
                </h2>
                {weeksStale !== null && weeksStale >= 1 ? (
                  <span className="rounded-full bg-warn/15 px-2.5 py-0.5 text-xs text-warn">
                    intent {weeksStale}w stale · refresh
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
                {/* Area allocation */}
                <div className="rounded-xl border border-ink-700 bg-ink-800 p-5">
                  {intent ? (
                    <>
                      {intent.theme ? (
                        <p className="mb-4 text-sm text-[#cdd9e5]">{intent.theme}</p>
                      ) : null}
                      <div className="flex h-3 w-full overflow-hidden rounded-full">
                        {intentRows(intent).map((a) => (
                          <div
                            key={a.area}
                            style={{ width: `${a.pct}%`, background: AREA_COLORS[a.area] }}
                            title={`${a.area} ${a.pct}%`}
                          />
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                        {intentRows(intent).map((a) => (
                          <span
                            key={a.area}
                            className="flex items-center gap-1.5 text-xs text-muted"
                          >
                            <AreaDot area={a.area} /> {a.area}{" "}
                            <span className="text-white">{a.pct}%</span>
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted">
                      No weekly intent. Ask Atlas to run the Monday ritual.
                    </div>
                  )}
                </div>

                {/* R5: autonomy metric — the vision gradient, computed from the run layer */}
                <div className="rounded-xl border border-ink-700 bg-ink-800 p-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    Autonomy
                  </div>
                  {autonomy.ensured > 0 ? (
                    <>
                      <div className="text-3xl font-bold text-white">{autonomy.pct}%</div>
                      <div className="mt-1 text-xs text-muted">
                        {autonomy.autonomous} / {autonomy.ensured} activities autonomous
                      </div>
                      <div className="mt-3 text-xs text-ink-500">
                        Share of ensured activities that run without routing to Nick&apos;s
                        plate. The vision gradient.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-white">—</div>
                      <div className="mt-1 text-xs text-muted">no activities ensured yet</div>
                      <div className="mt-3 text-xs text-ink-500">
                        Nothing in the run layer is verified to exist yet. Decompose systems
                        into activities and mark them ensured.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* RUN LAYER: what runs without you, and what still needs you */}
            <section className="mb-8">
              <div className="mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Systems · what&apos;s running for you
                </h2>
                <p className="mt-1 text-sm text-[#cdd9e5]">
                  The ongoing work your systems keep handled. Whatever still needs you is the next
                  thing worth automating.
                </p>
              </div>
              {activities.length === 0 ? (
                <div className="rounded-lg border border-ink-700 bg-ink-800 p-4 text-sm text-muted">
                  No systems decomposed yet ... nothing here until a system is broken into activities.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {systemNames.map((systemName) => {
                    const acts = activitiesBySystem[systemName];
                    const goalTitle = acts[0]?.system?.goal?.title ?? null;
                    const needsYou = acts.filter((a) => !runsWithoutYou(a.current_automation_level));
                    const handled = acts.filter((a) => runsWithoutYou(a.current_automation_level));
                    return (
                      <div key={systemName} className="rounded-xl border border-ink-700 bg-ink-800 p-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div>
                            <span className="text-base font-semibold text-white">{systemName}</span>
                            {goalTitle && (
                              <span className="ml-2 text-xs text-ink-500">→ {goalTitle}</span>
                            )}
                          </div>
                          <span className="text-xs text-muted">
                            {handled.length} run{handled.length === 1 ? "s" : ""} without you
                            {needsYou.length > 0 && (
                              <>
                                {" · "}
                                <span className="text-warn">
                                  {needsYou.length} need{needsYou.length === 1 ? "s" : ""} you
                                </span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Needs you — the only part that's actionable */}
                        <div className="mt-4">
                          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-warn">
                            Needs you
                          </div>
                          {needsYou.length === 0 ? (
                            <div className="text-sm text-muted">
                              Nothing ... this whole system runs without you.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {needsYou.map((a) => (
                                <div
                                  key={a.id}
                                  className="rounded-lg border border-warn/30 bg-warn/5 p-3"
                                >
                                  <div className="text-sm font-medium text-white">{a.name}</div>
                                  <div className="mt-0.5 text-xs text-muted">
                                    {channelLabel(a.channel)} ·{" "}
                                    {automationLabel(a.current_automation_level)} today
                                    {a.target_automation_level &&
                                      a.target_automation_level !== a.current_automation_level && (
                                        <> · aiming for {automationLabel(a.target_automation_level)}</>
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Runs without you — reassurance, not a to-do */}
                        {handled.length > 0 && (
                          <div className="mt-4">
                            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                              Runs without you
                            </div>
                            <div className="flex flex-col gap-1">
                              {handled.map((a) => (
                                <div key={a.id} className="flex items-center gap-2 text-sm">
                                  <span className="text-ok">✓</span>
                                  <span className="text-[#cdd9e5]">{a.name}</span>
                                  <span className="text-xs text-ink-500">
                                    {automationLabel(a.current_automation_level)}
                                    {architectureLabel(a.architecture) && (
                                      <> ({architectureLabel(a.architecture)})</>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
              {/* R3: DO FIRST — ranked queue */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
                  Do first{" "}
                  <span className="font-normal normal-case text-ink-500">
                    ({doFirst.length})
                  </span>
                </h2>
                {doFirst.length === 0 ? (
                  <div className="rounded-lg border border-ink-700 bg-ink-800 p-4 text-sm text-muted">
                    Nothing important + urgent open right now.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {doFirst.map((t, i) => (
                      <div
                        key={t.id}
                        className={`rounded-lg border bg-ink-800 p-4 ${
                          i === 0 ? "border-accent/30" : "border-ink-700"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-ink-600" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white">{t.title}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                              {t.project ? (
                                <span>{t.project.name}</span>
                              ) : (
                                <span className="text-warn">no project</span>
                              )}
                              {t.due ? (
                                <>
                                  <span className="text-ink-600">·</span>
                                  <span className="text-warn">due {t.due}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* R3: ACTIVE PROJECTS with task drill-down */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
                  Active projects
                </h2>
                <div className="flex flex-col gap-3">
                  {activeProjects.map((p) => {
                    const projectTasks = tasksByProject[p.id] ?? [];
                    return (
                      <div
                        key={p.id}
                        className="rounded-lg border border-ink-700 bg-ink-800"
                      >
                        <div className="flex items-start gap-2 p-4 pb-2">
                          <AreaDot area={p.area} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white">{p.name}</div>
                            {p.goal && (
                              <div className="mt-0.5 text-xs text-ink-500">{p.goal.title}</div>
                            )}
                          </div>
                        </div>
                        <div className="border-t border-ink-700 px-4 pb-3 pt-2">
                          {projectTasks.length === 0 ? (
                            <div className="text-xs text-ink-500">no open tasks</div>
                          ) : (
                            <>
                              {projectTasks.slice(0, 3).map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center gap-2 py-1 text-xs"
                                >
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-600" />
                                  <span
                                    className={
                                      isDoFirst(t) ? "text-[#cdd9e5]" : "text-muted"
                                    }
                                  >
                                    {t.title}
                                  </span>
                                </div>
                              ))}
                              {projectTasks.length > 3 && (
                                <div className="mt-1 pl-3.5 text-xs text-ink-500">
                                  +{projectTasks.length - 3} more
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* R4: HONEST GAPS — what this surface does not know */}
            <section className="mt-8 rounded-xl border border-ink-700 bg-ink-800/40 p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                What this surface does not know
              </div>
              <div className="flex flex-col gap-2 text-sm text-muted">
                {unlinkedCount > 0 && (
                  <div>
                    <span className="text-warn">{unlinkedCount}</span> task
                    {unlinkedCount !== 1 ? "s" : ""} with no project — unlinked obligations
                    not counted in Do First.
                  </div>
                )}
                <div>
                  Triage inbox: not yet wired. Un-processed email and obligations are not
                  counted here.
                </div>
                <div>
                  Run layer: only 1 of ~40 systems is decomposed into activities. Repeating work in
                  the rest is still on Nick&apos;s plate and may be surfacing as a task.
                </div>
              </div>
            </section>
          </>
        )}

        <div className="mt-8 text-center text-xs text-ink-600">
          live · canon_engine · tasks, projects, goals, systems, activities, weekly intent
        </div>
      </div>
    </div>
  );
}
