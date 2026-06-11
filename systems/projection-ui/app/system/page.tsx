"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ---- types ------------------------------------------------------------------

type DatedItem = { date: string; label: string };
type Sys = {
  name: string; slug: string; home: string; class: string;
  lifecycle: string; autonomy: string; stub: boolean; outcome: string;
  warnings: string[]; dates: DatedItem[]; now: string[];
};
type List = { count: number; systems: Sys[]; errors: string[] };

type QueueItem = {
  file: string; type: string; system: string | null;
  proposed: string; created: string;
};
type Review = { queue: QueueItem[]; errors: string[] };

// ---- constants --------------------------------------------------------------

const ORDER = ["canon", "compass", "signal", "forge", "voice", "pulse", "guard", "garden"];

const LIFE_CLS: Record<string, string> = {
  operating:   "bg-ok/15 text-ok",
  engineering: "bg-warn/15 text-warn",
  designed:    "bg-accent/15 text-accent",
  architected: "bg-accent/15 text-accent",
  defined:     "bg-ink-800 text-muted",
};

// ---- helpers ----------------------------------------------------------------

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---- small chips ------------------------------------------------------------

function ReviewChip({ item }: { item: QueueItem }) {
  const label = item.system ?? item.type;
  return (
    <Link href="/system/review"
      className="rounded bg-warn/15 px-2 py-0.5 text-xs text-warn hover:bg-warn/25">
      review: {label} — {trunc(item.proposed, 60)}
    </Link>
  );
}

function DateChip({ date, label }: { date: string; label: string }) {
  const past = date <= today();
  return (
    <span className={`rounded bg-accent/15 px-2 py-0.5 text-xs text-accent ${past ? "font-medium" : ""}`}>
      📅 {date}: {trunc(label, 60)}
    </span>
  );
}

function NowChip({ sysName, entry }: { sysName: string; entry: string }) {
  return (
    <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-muted">
      ▶ {sysName}: {trunc(entry, 50)}
    </span>
  );
}

// ---- system chip ------------------------------------------------------------

function SysChip({ s, reviewSlugs }: { s: Sys; reviewSlugs: Set<string> }) {
  const cls = LIFE_CLS[s.lifecycle] ?? "bg-ink-800 text-muted";
  const hasNow = s.now.length > 0;
  const hasReview = reviewSlugs.has(s.slug);
  const hasDates = s.dates.length > 0;
  const hasWarn = s.warnings.length > 0;
  return (
    <Link href={`/system/${s.home}/${s.slug}`}
      className={`flex w-full items-center justify-between rounded px-2 py-1 text-xs ${cls} hover:opacity-80`}>
      <span className="truncate">{s.name}</span>
      <span className="ml-2 flex shrink-0 items-center gap-1 text-xs">
        {s.stub && <span className="text-ink-600 opacity-60">stub</span>}
        {hasNow    && <span title={s.now.join("\n")}>●</span>}
        {hasReview && <span title="awaiting review">◌</span>}
        {hasDates  && <span title={s.dates.map((d) => `${d.date}: ${d.label}`).join("\n")}>📅</span>}
        {hasWarn   && <span title={s.warnings.join("\n")}>⚠</span>}
      </span>
    </Link>
  );
}

// ---- main -------------------------------------------------------------------

export default function SystemDashboard() {
  const [list, setList]     = useState<List | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [err, setErr]       = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/system/list").then(async (r) => { if (!r.ok) throw new Error(`list HTTP ${r.status}`); return r.json() as Promise<List>; }),
      fetch("/api/system/review").then(async (r) => { if (!r.ok) throw new Error(`review HTTP ${r.status}`); return r.json() as Promise<Review>; }),
    ])
      .then(([l, rv]) => { setList(l); setReview(rv); })
      .catch((e) => setErr(String(e)));
  }, []);

  if (err)    return <main className="p-6 text-bad">{err}</main>;
  if (!list)  return <main className="p-6 text-muted">Loading…</main>;

  // group systems by constellation
  const byHome = new Map<string, Sys[]>();
  for (const s of list.systems) {
    if (!byHome.has(s.home)) byHome.set(s.home, []);
    byHome.get(s.home)!.push(s);
  }

  // review-queue slugs for ◌ markers
  const reviewSlugs = new Set<string>(
    (review?.queue ?? []).map((q) => q.system).filter(Boolean) as string[]
  );

  const queueCount = review?.queue.length ?? 0;

  // all dated items across systems, sorted ascending
  const allDates: { date: string; label: string }[] = list.systems
    .flatMap((s) => s.dates)
    .sort((a, b) => a.date.localeCompare(b.date));

  // all now entries across systems
  const allNow: { sysName: string; entry: string }[] = list.systems
    .filter((s) => s.now.length > 0)
    .flatMap((s) => s.now.map((entry) => ({ sysName: s.name, entry })));

  // combined errors
  const allErrors = [...(list.errors ?? []), ...(review?.errors ?? [])];

  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto max-w-6xl p-6">
        {/* header */}
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold text-white">Agentic System</h1>
          <span className="text-xs text-muted">
            {list.count} systems · live from registry/{" "}
            <Link href="/system/review" className="text-sky-400 hover:underline">
              review queue{queueCount > 0 ? ` (${queueCount})` : ""}
            </Link>
            {" · "}
            <Link href="/system/inventory" className="text-sky-400 hover:underline">inventory</Link>
          </span>
        </div>

        {/* error banner */}
        {allErrors.length > 0 && (
          <div className="mb-3 rounded border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
            {allErrors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        {/* attention strip */}
        {(review?.queue.length || allDates.length || allNow.length) ? (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {(review?.queue ?? []).map((q) => (
              <ReviewChip key={q.file} item={q} />
            ))}
            {allDates.map((d, i) => (
              <DateChip key={i} date={d.date} label={d.label} />
            ))}
            {allNow.map((n, i) => (
              <NowChip key={i} sysName={n.sysName} entry={n.entry} />
            ))}
          </div>
        ) : null}

        {/* constellation grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ORDER.map((home) => (
            <div key={home} className="rounded border border-ink-700 bg-ink-900 p-3">
              <h2 className="mb-2 text-sm font-semibold capitalize text-white">{home}</h2>
              <div className="space-y-0.5">
                {(byHome.get(home) ?? []).map((s) => (
                  <SysChip key={s.slug} s={s} reviewSlugs={reviewSlugs} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* legend */}
        <p className="mt-4 text-xs text-ink-600">
          green operating · amber engineering · blue designed · gray defined · ● active work · ◌ awaiting review · 📅 dated · ⚠ gate warning
        </p>
      </main>
    </div>
  );
}
