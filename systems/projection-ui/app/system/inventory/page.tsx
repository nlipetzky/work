"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusChip, LifecycleChip } from "@/components/system/Bits";

const TO_BUILD = new Set(["to-build", "to-write"]);
const ORDER = ["canon", "compass", "signal", "forge", "voice", "pulse", "guard", "garden"];
const WORK_ROOT = "/Users/nplmini/code/work/";

type Row = {
  name: string; type?: string; ownership?: string;
  status: string; verified_by: string | null; note?: string; path?: string;
};

type InvSystem = {
  name: string; slug: string; home: string; class: string;
  lifecycle: string; autonomy: string; stub: boolean;
  assets: Row[]; context: Row[]; warnings: string[];
};

type InvData = { count: number; systems: InvSystem[]; errors: string[] };

type Filter = "all" | "to build" | "tested" | "shared" | "assets" | "context";

const FILTERS: Filter[] = ["all", "to build", "tested", "shared", "assets", "context"];

function rowMatches(row: Row, kind: "asset" | "context", filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "to build") return TO_BUILD.has(row.status);
  if (filter === "tested") return row.status === "tested";
  if (filter === "shared") return !!row.ownership?.startsWith("shared:");
  if (filter === "assets") return kind === "asset";
  if (filter === "context") return kind === "context";
  return true;
}

function filename(path: string): string {
  return path.split("/").pop() ?? path;
}

export default function SystemInventory() {
  const [data, setData] = useState<InvData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/system/inventory")
      .then(async (r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<InvData>; })
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <main className="p-6 text-red-400">{err}</main>;
  if (!data) return <main className="p-6 text-muted">Loading…</main>;

  // totals for header chips
  const allRows = data.systems.flatMap((s) => [...s.assets, ...s.context]);
  const totalParts = allRows.length;
  const existCount = allRows.filter((r) => !TO_BUILD.has(r.status)).length;
  const toBuildCount = allRows.filter((r) => TO_BUILD.has(r.status)).length;

  // group by constellation in fixed order
  const byHome = new Map<string, InvSystem[]>();
  for (const s of data.systems) {
    if (!byHome.has(s.home)) byHome.set(s.home, []);
    byHome.get(s.home)!.push(s);
  }

  // check if filter returns any results at all
  const anyMatch = data.systems.some((s) =>
    [...s.assets.map((r) => ({ r, kind: "asset" as const })),
     ...s.context.map((r) => ({ r, kind: "context" as const }))]
      .some(({ r, kind }) => rowMatches(r, kind, filter))
  );

  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto max-w-screen-xl p-6">
        {/* header */}
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-semibold text-white">Inventory</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted">{totalParts} parts</span>
            <span className="rounded bg-ok/15 px-2 py-0.5 text-ok">{existCount} exist</span>
            <span className="rounded bg-bad/15 px-2 py-0.5 text-bad">{toBuildCount} to build</span>
            <Link href="/system" className="ml-2 text-sky-400 hover:underline">← dashboard</Link>
          </div>
        </div>

        {data.errors.length > 0 && (
          <div className="mb-3 rounded border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
            {data.errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        {/* filter row */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1 text-xs ${
                filter === f
                  ? "bg-ink-700 text-white"
                  : "border border-ink-700 text-muted hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* body */}
        {!anyMatch && (
          <p className="text-sm text-muted">no parts match</p>
        )}

        {ORDER.map((home) => {
          const systems = byHome.get(home) ?? [];
          const visibleSystems = systems.filter((s) => {
            const rows = [
              ...s.assets.map((r) => ({ r, kind: "asset" as const })),
              ...s.context.map((r) => ({ r, kind: "context" as const })),
            ];
            return rows.some(({ r, kind }) => rowMatches(r, kind, filter));
          });
          if (!visibleSystems.length) return null;

          return (
            <div key={home} className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-600 capitalize">{home}</h2>
              <div className="space-y-4">
                {visibleSystems.map((s) => {
                  const assetRows = s.assets.filter((r) => rowMatches(r, "asset", filter));
                  const contextRows = s.context.filter((r) => rowMatches(r, "context", filter));
                  const matchCount = assetRows.length + contextRows.length;
                  const totalCount = s.assets.length + s.context.length;

                  return (
                    <div key={s.slug} className="rounded border border-ink-700 bg-ink-900">
                      {/* system header */}
                      <div className="flex items-center gap-2 px-4 py-2.5">
                        <Link
                          href={`/system/${s.home}/${s.slug}`}
                          className="font-medium text-white hover:underline"
                        >
                          {s.name}
                        </Link>
                        <LifecycleChip value={s.lifecycle} />
                        <span className="text-xs text-muted">
                          {matchCount}/{totalCount} parts
                        </span>
                      </div>

                      {/* asset rows */}
                      {[
                        ...assetRows.map((r) => ({ r, kind: "asset" as const })),
                        ...contextRows.map((r) => ({ r, kind: "context" as const })),
                      ].map(({ r, kind }, i) => (
                        <div
                          key={`${kind}-${r.name}-${i}`}
                          className="border-t border-ink-800 px-4 py-2"
                        >
                          <div className="flex items-center gap-2">
                            {/* kind tag */}
                            <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-600">
                              {kind === "asset" ? (r.type ?? "asset") : "context"}
                            </span>

                            {/* name */}
                            <span className="font-mono text-sm text-white truncate">{r.name}</span>

                            {/* shared chip */}
                            {r.ownership?.startsWith("shared:") && (
                              <span className="shrink-0 rounded bg-sky-900/60 px-1.5 py-0.5 text-xs text-sky-300">
                                shared · {r.ownership.slice(7)}
                              </span>
                            )}

                            {/* status */}
                            <span className="ml-auto shrink-0"><StatusChip value={r.status} /></span>

                            {/* verified */}
                            {r.verified_by && (
                              <span className="shrink-0 text-xs text-ok">{r.verified_by}</span>
                            )}

                            {/* path link */}
                            {r.path && (
                              <a
                                href={`/api/playfile?path=${encodeURIComponent(WORK_ROOT + r.path)}`}
                                className="shrink-0 text-xs text-sky-400 hover:underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {filename(r.path)}
                              </a>
                            )}
                          </div>

                          {/* note */}
                          {r.note && (
                            <p className="mt-0.5 pl-16 text-xs text-ink-600">{r.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
