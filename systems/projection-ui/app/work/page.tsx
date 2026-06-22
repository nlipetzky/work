// Focus surface — now reading LIVE from canon_engine: tasks, weekly intent, projects.
// Right Now = top Do-First task. This Week = latest intent (with staleness nudge).
// Do First = open important+urgent tasks. Active Projects = active projects.

import { listProjects, type Project } from "@/lib/queries/projects";
import { listOpenTasks, isDoFirst, type Task } from "@/lib/queries/tasks";
import { latestWeeklyIntent, type WeeklyIntent } from "@/lib/queries/intent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AREA_COLORS: Record<string, string> = {
  "Client engagement": "#5b9dff",
  "Prospect engagement": "#8957e5",
  Infrastructure: "#d29922",
  Finance: "#3fb950",
  Admin: "#7d8590",
  Personal: "#db61a2",
};

function AreaDot({ area }: { area: string | null }) {
  return <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: (area && AREA_COLORS[area]) || "#7d8590" }} />;
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

export default async function WorkPage() {
  let projects: Project[] = [];
  let tasks: Task[] = [];
  let intent: WeeklyIntent | null = null;
  let error: string | null = null;
  try {
    [projects, tasks, intent] = await Promise.all([listProjects(), listOpenTasks(), latestWeeklyIntent()]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const activeProjects = projects.filter((p) => p.status === "active");
  const doFirst = tasks.filter(isDoFirst);
  const rightNow = doFirst[doFirst.length - 1] ?? doFirst[0] ?? null;
  const weeksStale = intent ? Math.floor((Date.now() - new Date(intent.week_of).getTime()) / (7 * 86400000)) : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <div className="mb-6 flex gap-1 text-sm">
          <a href="/work" className="rounded-md bg-ink-700 px-3 py-1.5 font-medium text-white">Focus</a>
          <a href="/work/goals" className="rounded-md px-3 py-1.5 text-muted hover:bg-ink-800 hover:text-white">Goals</a>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Today</h1>
          <div className="mt-1 text-sm text-muted">start here, not in ten tabs</div>
        </div>

        {error ? (
          <div className="rounded-xl border border-bad/40 bg-bad/5 p-5 text-sm text-bad">canon_engine: {error}</div>
        ) : (
          <>
            {/* RIGHT NOW */}
            <section className="mb-8 rounded-xl border border-accent/40 bg-ink-800 p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">Right now · your one next action</div>
              {rightNow ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.1fr_1fr]">
                  <div>
                    <div className="text-lg font-semibold text-white">{rightNow.title}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {rightNow.project ? <><span>{rightNow.project.name}</span><span className="text-ink-600">·</span></> : null}
                      <span className={rightNow.due ? "text-warn" : ""}>{rightNow.due ? `due ${rightNow.due}` : "no due date"}</span>
                    </div>
                    <button className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-accent-dim">Start →</button>
                  </div>
                  <div className="rounded-lg border border-ink-700 bg-ink-850 p-4">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">First 5 minutes</div>
                    <p className="text-sm leading-relaxed text-[#cdd9e5]">
                      {rightNow.first_5_minutes ?? "Not set yet — ask Atlas to draft the first 5 minutes for this task."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted">Nothing in the Do-First quadrant. Declare your day, or ask Atlas what to start.</div>
              )}
            </section>

            {/* THIS WEEK */}
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">This week</h2>
                {weeksStale !== null && weeksStale >= 1 ? (
                  <span className="rounded-full bg-warn/15 px-2.5 py-0.5 text-xs text-warn">intent set {weeksStale} weeks ago · refresh it</span>
                ) : null}
              </div>
              {intent ? (
                <div className="rounded-xl border border-ink-700 bg-ink-800 p-5">
                  {intent.theme ? <p className="mb-4 text-sm text-[#cdd9e5]">{intent.theme}</p> : null}
                  <div className="flex h-3 w-full overflow-hidden rounded-full">
                    {intentRows(intent).map((a) => (
                      <div key={a.area} style={{ width: `${a.pct}%`, background: AREA_COLORS[a.area] }} title={`${a.area} ${a.pct}%`} />
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                    {intentRows(intent).map((a) => (
                      <span key={a.area} className="flex items-center gap-1.5 text-xs text-muted">
                        <AreaDot area={a.area} /> {a.area} <span className="text-white">{a.pct}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-ink-700 bg-ink-800 p-5 text-sm text-muted">No weekly intent declared. Ask Atlas to run the Monday ritual.</div>
              )}
            </section>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
              {/* DO FIRST */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Do first</h2>
                {doFirst.length === 0 ? (
                  <div className="rounded-lg border border-ink-700 bg-ink-800 p-4 text-sm text-muted">Nothing important + urgent open right now.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {doFirst.map((t) => (
                      <div key={t.id} className="rounded-lg border border-ink-700 bg-ink-800 p-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-ink-600" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white">{t.title}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                              {t.project ? <span>{t.project.name}</span> : <span className="text-ink-600">no project</span>}
                              {t.due ? <><span className="text-ink-600">·</span><span className="text-warn">due {t.due}</span></> : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ACTIVE PROJECTS */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Active projects</h2>
                <div className="flex flex-col gap-2">
                  {activeProjects.map((p) => (
                    <div key={p.id} className="rounded-lg border border-ink-700 bg-ink-800 p-4 hover:border-ink-600">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <AreaDot area={p.area} /> {p.name}
                      </div>
                      {p.next_action ? <div className="mt-1.5 pl-4 text-xs text-muted"><span className="text-ink-600">next:</span> {p.next_action}</div> : null}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        <div className="mt-10 text-center text-xs text-ink-600">
          live · canon_engine — tasks, weekly intent, projects. (Commitments / rails come with canon extraction.)
        </div>
      </div>
    </div>
  );
}
