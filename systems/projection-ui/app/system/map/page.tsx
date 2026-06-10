"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LifecycleChip } from "@/components/system/Bits";

type Sys = { name: string; slug: string; home: string; class: string; lifecycle: string; autonomy: string; stub: boolean; outcome: string; warnings: string[] };
type List = { count: number; systems: Sys[]; errors: string[] };

const ORDER = ["canon", "compass", "signal", "forge", "voice", "pulse", "guard", "garden"];
const CLASS_LETTER: Record<string, string> = { core: "C", supporting: "S", generic: "G" };

export default function SystemMap() {
  const [data, setData] = useState<List | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/system/list")
      .then(async (r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);
  if (err) return <main className="p-6 text-red-400">{err}</main>;
  if (!data) return <main className="p-6 text-muted">Loading…</main>;

  const byHome = new Map<string, Sys[]>();
  for (const s of data.systems) {
    if (!byHome.has(s.home)) byHome.set(s.home, []);
    byHome.get(s.home)!.push(s);
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-white">Constellation map</h1>
        <span className="text-xs text-ink-600">{data.count} systems · <Link href="/system" className="text-sky-400 hover:underline">review surface</Link></span>
      </div>
      {data.errors.length > 0 && (
        <div className="mb-4 rounded border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
          {data.errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ORDER.map((home) => (
          <div key={home} className="rounded border border-ink-700 bg-ink-900 p-4">
            <h2 className="mb-2 text-sm font-semibold capitalize text-white">{home}</h2>
            {(byHome.get(home) ?? []).map((s) => (
              <Link key={s.slug} href={`/system/${s.home}/${s.slug}`}
                className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-ink-800">
                <span className="truncate text-muted">
                  {s.name} <span className="text-ink-600">{CLASS_LETTER[s.class]}</span>
                  {s.warnings.length > 0 && <span title={s.warnings.join("\n")} className="ml-1 text-amber-400">⚠</span>}
                </span>
                <span className="flex items-center gap-1.5">
                  {s.stub && <span className="text-xs text-ink-600">stub</span>}
                  <LifecycleChip value={s.lifecycle} />
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
