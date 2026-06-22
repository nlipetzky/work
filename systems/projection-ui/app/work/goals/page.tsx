// The Goals view, reading LIVE from canon_engine: goals + the projects that
// link up to them, plus the unaligned-projects flag (active projects with no goal).

import { listGoals, type Goal } from "@/lib/queries/goals";
import { listProjects, type Project } from "@/lib/queries/projects";

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

const STATE_COLOR: Record<string, string> = {
  active: "#5b9dff",
  done: "#3fb950",
  paused: "#d29922",
  dropped: "#7d8590",
};

function AreaDot({ area }: { area: string | null }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: (area && AREA_COLORS[area]) || "#7d8590" }}
    />
  );
}

function Tabs() {
  return (
    <div className="mb-6 flex gap-1 text-sm">
      <a href="/work" className="rounded-md px-3 py-1.5 text-muted hover:bg-ink-800 hover:text-white">Focus</a>
      <a href="/work/goals" className="rounded-md bg-ink-700 px-3 py-1.5 font-medium text-white">Goals</a>
    </div>
  );
}

function ProjectRow({ p }: { p: Project }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-ink-850">
      <span className="flex min-w-0 items-center gap-2 text-sm text-white">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATE_COLOR[p.status] ?? "#7d8590" }} />
        <span className="truncate">{p.name}</span>
      </span>
      <span className="shrink-0 text-xs text-muted">
        {p.status === "done" ? (
          <span className="text-ok">done</span>
        ) : p.next_action ? (
          <><span className="text-ink-600">next:</span> {p.next_action}</>
        ) : (
          <span className="text-ink-600">no next action</span>
        )}
      </span>
    </div>
  );
}

function GoalCard({ g, projects }: { g: Goal; projects: Project[] }) {
  const active = projects.filter((p) => p.status === "active").length;
  const done = projects.filter((p) => p.status === "done").length;
  return (
    <section className="rounded-xl border border-ink-700 bg-ink-800 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AreaDot area={g.area} />
          <h2 className="text-lg font-semibold text-white">{g.title}</h2>
        </div>
        {g.horizon ? (
          <span className="shrink-0 rounded-full border border-ink-600 px-2 py-0.5 text-[11px] text-muted">{g.horizon}</span>
        ) : null}
      </div>

      {g.why_it_matters ? <p className="mt-1.5 text-sm text-muted">{g.why_it_matters}</p> : null}

      {g.target ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2">
          <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-ok">target</span>
          <span className="text-sm text-[#cdd9e5]">{g.target}</span>
        </div>
      ) : null}

      {projects.length > 0 ? (
        <div className="mt-4">
          <div className="mb-1.5 text-xs text-muted">
            {active} active{done ? <span className="text-ok"> · {done} done</span> : null}
          </div>
          <div className="flex flex-col gap-1">
            {projects.map((p) => <ProjectRow key={p.id} p={p} />)}
          </div>
        </div>
      ) : (
        <div className="mt-3 text-xs text-ink-600">no projects linked yet</div>
      )}
    </section>
  );
}

export default async function GoalsPage() {
  let goals: Goal[] = [];
  let projects: Project[] = [];
  let error: string | null = null;
  try {
    [goals, projects] = await Promise.all([listGoals(), listProjects()]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const byGoal = (id: string) => projects.filter((p) => p.goal_id === id);
  const unaligned = projects.filter((p) => p.goal_id === null && p.status === "active");

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-8 py-8">
        <Tabs />

        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Goals</h1>
            <div className="mt-1 text-sm text-muted">the few outcomes that matter this season</div>
          </div>
          <span className="text-xs text-muted">{goals.length} active</span>
        </div>

        {error ? (
          <div className="rounded-xl border border-bad/40 bg-bad/5 p-5 text-sm text-bad">
            Couldn&apos;t read from canon_engine: {error}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {goals.map((g) => <GoalCard key={g.id} g={g} projects={byGoal(g.id)} />)}
            </div>

            {unaligned.length > 0 && (
              <section className="mt-6 rounded-xl border border-warn/30 bg-warn/5 p-5">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warn">
                  Not tied to a goal · why are we doing these?
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {unaligned.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-white">
                        <AreaDot area={p.area} /> {p.name}
                      </span>
                      <span className="text-xs text-muted">
                        {p.next_action ? <><span className="text-ink-600">next:</span> {p.next_action}</> : <span className="text-ink-600">{p.area}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-10 text-center text-xs text-ink-600">
          live · canon_engine.public.goals + projects
        </div>
      </div>
    </div>
  );
}
