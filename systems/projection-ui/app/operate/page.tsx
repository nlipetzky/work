"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SopSummary } from "@/lib/queries/operatingSop";
import type { StageStatus } from "@/lib/sops";

type Resp = { count: number; sops: SopSummary[]; errors: string[] };

// Status → Tailwind class. Reuses existing color tokens (see tailwind.config.ts).
// Phase C swaps in the prototype-exact teal/coral if visibly off.
const STATUS_CLS: Record<StageStatus, string> = {
  done:        "bg-ok/70",
  in_progress: "bg-accent/80",
  blocked:     "bg-bad/80",
  deviated:    "bg-warn/80",
  pending:     "bg-ink-700",
};

const STATUS_LABEL: Record<StageStatus, string> = {
  done:        "done",
  in_progress: "running",
  blocked:     "blocked",
  deviated:    "deviated",
  pending:     "pending",
};

function StageBar({ stages }: { stages: SopSummary["stages"] }) {
  return (
    <div className="flex h-2 w-full gap-px overflow-hidden rounded-sm bg-ink-800">
      {stages.map((s) => (
        <div
          key={s.stage_id}
          className={`flex-1 ${STATUS_CLS[s.status]}`}
          title={`${s.order}. ${s.name} — ${STATUS_LABEL[s.status]}`}
        />
      ))}
    </div>
  );
}

function SopCard({ s }: { s: SopSummary }) {
  const blocked = s.rollup.blocked > 0;
  return (
    <Link
      href={`/operate/${s.sop_id}`}
      className="block rounded border border-ink-700 bg-ink-900 p-4 hover:border-accent/40"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">{s.name}</h2>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted">
          {s.active_run ? `run: ${s.active_run.target_engagement}` : "no active run"}
        </span>
      </div>

      <p className="mb-3 line-clamp-2 text-xs text-muted">{s.description}</p>

      <StageBar stages={s.stages} />

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted">
          {s.rollup.done}/{s.stage_count} done
          {s.rollup.in_progress > 0 && <span className="text-accent"> · {s.rollup.in_progress} running</span>}
          {s.rollup.blocked > 0 && <span className="text-bad"> · {s.rollup.blocked} blocked</span>}
        </span>
        <span className={blocked ? "text-bad" : "text-muted"}>{s.next_action}</span>
      </div>
    </Link>
  );
}

export default function OperatePage() {
  const [resp, setResp] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/operate/list")
      .then(async (r) => {
        if (!r.ok) throw new Error(`operate/list HTTP ${r.status}`);
        return r.json() as Promise<Resp>;
      })
      .then(setResp)
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <main className="p-6 text-bad">{err}</main>;
  if (!resp) return <main className="p-6 text-muted">Loading…</main>;

  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto min-h-full max-w-6xl flex-col p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold text-white">Operate</h1>
          <span className="text-xs text-muted">
            {resp.count} SOP{resp.count === 1 ? "" : "s"} · slice-1 static rollup
          </span>
        </div>

        {resp.errors.length > 0 && (
          <div className="mb-3 rounded border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
            {resp.errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {resp.sops.map((s) => (
            <SopCard key={s.sop_id} s={s} />
          ))}
        </div>

        <p className="mt-4 text-xs text-ink-600">
          green done · blue running · red blocked · amber deviated · grey pending · click an SOP to open
        </p>
      </main>
    </div>
  );
}
