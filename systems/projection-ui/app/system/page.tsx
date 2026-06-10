"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type QueueItem = { file: string; type: string; system: string | null; evidence: string | null; proposed: string; created: string; body: string };
type Commit = { hash: string; date: string; subject: string };
type Review = { lastReviewed: string | null; queue: QueueItem[]; diff: Commit[]; errors: string[] };

export default function SystemHome() {
  const [data, setData] = useState<Review | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/system/review")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <main className="p-6 text-red-400">{err}</main>;
  if (!data) return <main className="p-6 text-muted">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-white">Agentic System</h1>
        <span className="text-xs text-ink-600">
          last reviewed {data.lastReviewed ?? "never"}
        </span>
      </div>

      {data.errors.length > 0 && (
        <div className="mb-4 rounded border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
          {data.errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold text-white">
        Awaiting your review <span className="font-normal text-ink-600">({data.queue.length})</span>
      </h2>
      <div className="mb-8 space-y-2">
        {data.queue.length === 0 && <p className="text-sm text-muted">Queue is empty.</p>}
        {data.queue.map((q) => (
          <div key={q.file} className="rounded border border-ink-700 bg-ink-900 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-white">{q.proposed}</p>
              <span className="text-xs text-ink-600">{q.created}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{q.body}</p>
            <p className="mt-2 text-xs text-ink-600">
              {q.type}{q.system ? ` · ${q.system}` : ""}{q.evidence ? ` · evidence: ${q.evidence}` : ""}
              <span className="ml-2 text-ink-700">resolve in a Claude Code session — v0 is read-only</span>
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-white">Since your last review</h2>
      <div className="mb-8 border-l-2 border-ink-700 pl-4">
        {data.diff.length === 0 && <p className="text-sm text-muted">No registry changes.</p>}
        {data.diff.map((c) => (
          <div key={c.hash} className="py-1.5">
            <p className="text-sm text-white">{c.subject}</p>
            <p className="text-xs text-ink-600">{c.date} · {c.hash}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 border-t border-ink-800 pt-4 text-sm">
        <span className="text-muted">Browse:</span>
        <Link href="/system/map" className="text-sky-400 hover:underline">Constellation map</Link>
      </div>
    </main>
  );
}
