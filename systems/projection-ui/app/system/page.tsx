"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Sys = {
  name: string; slug: string; home: string; class: string;
  lifecycle: string; autonomy: string; stub: boolean; outcome: string;
  warnings: string[];
};
type List = { count: number; systems: Sys[]; errors: string[] };

const ORDER = ["canon", "compass", "signal", "forge", "voice", "pulse", "guard", "garden", "engagements"];

const LIFE_CLS: Record<string, string> = {
  operating:   "bg-ok/15 text-ok",
  engineering: "bg-warn/15 text-warn",
  designed:    "bg-accent/15 text-accent",
  architected: "bg-accent/15 text-accent",
  defined:     "bg-ink-800 text-muted",
};

function SysChip({ s }: { s: Sys }) {
  const cls = LIFE_CLS[s.lifecycle] ?? "bg-ink-800 text-muted";
  const hasWarn = s.warnings.length > 0;
  return (
    <Link
      href={`/system/${s.home}/${s.slug}`}
      className={`block w-full rounded px-2 py-1.5 text-xs ${cls} hover:opacity-80`}
    >
      <div className="flex items-center justify-between">
        <span className="truncate font-medium">{s.name}</span>
        <span className="ml-2 flex shrink-0 items-center gap-1 text-xs">
          {s.stub && <span className="text-ink-600 opacity-60">stub</span>}
          {hasWarn && <span title={s.warnings.join("\n")}>⚠</span>}
        </span>
      </div>
      {s.outcome && (
        <div className="mt-0.5 truncate text-[10px] opacity-70" title={s.outcome}>{s.outcome}</div>
      )}
    </Link>
  );
}

export default function SystemDashboard() {
  const [list, setList] = useState<List | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/system/list")
      .then(async (r) => { if (!r.ok) throw new Error(`list HTTP ${r.status}`); return r.json() as Promise<List>; })
      .then(setList)
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <main className="p-6 text-bad">{err}</main>;
  if (!list) return <main className="p-6 text-muted">Loading…</main>;

  const byHome = new Map<string, Sys[]>();
  for (const s of list.systems) {
    if (!byHome.has(s.home)) byHome.set(s.home, []);
    byHome.get(s.home)!.push(s);
  }
  const groups = [...ORDER, "unassigned"].filter((h) => (byHome.get(h)?.length ?? 0) > 0);

  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto max-w-6xl p-6 min-h-full flex flex-col">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold text-white">Agentic System</h1>
          <span className="text-xs text-muted">
            {list.count} systems · live from canon_engine{" "}
            <Link href="/system/inventory" className="text-sky-400 hover:underline">inventory</Link>
          </span>
        </div>

        {list.errors.length > 0 && (
          <div className="mb-3 rounded border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
            {list.errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        <div className="flex-1 grid grid-cols-2 gap-3 md:grid-cols-3">
          {groups.map((home) => (
            <div key={home} className="flex flex-col rounded border border-ink-700 bg-ink-900 p-3">
              <h2 className="mb-2 text-sm font-semibold capitalize text-white">{home}</h2>
              <div className="flex-1 space-y-1">
                {(byHome.get(home) ?? []).map((s) => <SysChip key={s.slug} s={s} />)}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-ink-600">
          green operating · amber engineering · blue designed · gray defined · ⚠ coverage gap · stub = not yet defined
        </p>
      </main>
    </div>
  );
}
