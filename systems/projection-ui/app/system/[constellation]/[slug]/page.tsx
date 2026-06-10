"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StatusChip, LifecycleChip, Section } from "@/components/system/Bits";

type Row = { name: string; type?: string; version?: string | null; ownership?: string; status: string; verified_by: string | null; note?: string };
type Detail = {
  record: {
    name: string; slug: string; home: string; clusters: string[]; class: string;
    lifecycle: string; autonomy: string; outcome: string; stub: boolean;
    runs_surface: string | null;
    contract: null | {
      inputs: { name: string; status: string }[];
      outputs: { name: string; status: string }[];
      metrics: { name: string; value: string | number | null }[];
      stopping?: string; failure?: string; escalation?: string[];
      cost_envelope?: Record<string, string>;
    };
    assets: Row[]; context: Row[]; body: string;
  };
  warnings: string[];
  history: { hash: string; date: string; subject: string }[];
};

function RowList({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded border border-ink-700 bg-ink-900">
      {rows.map((r, i) => (
        <div key={r.name} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-ink-800" : ""}`}>
          <div className="min-w-0">
            <p className="text-sm text-white">
              {r.name}
              {r.ownership?.startsWith("shared:") && (
                <span className="ml-2 rounded bg-sky-900/60 px-1.5 py-0.5 text-xs text-sky-300">
                  shared · {r.ownership.slice(7)}
                </span>
              )}
            </p>
            <p className="text-xs text-ink-600">
              {[r.type, r.version ? `v:${r.version}` : null, r.note].filter(Boolean).join(" · ")}
              {r.verified_by && <span className="text-emerald-500"> · verified: {r.verified_by}</span>}
            </p>
          </div>
          <StatusChip value={r.status} />
        </div>
      ))}
      {rows.length === 0 && <p className="px-4 py-2.5 text-sm text-muted">None declared.</p>}
    </div>
  );
}

export default function SystemPage() {
  const { constellation, slug } = useParams<{ constellation: string; slug: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/system/detail?constellation=${constellation}&slug=${slug}`)
      .then(async (r) => { if (!r.ok) throw new Error((await r.json()).error); return r.json(); })
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, [constellation, slug]);

  if (err) return <main className="p-6 text-red-400">{err}</main>;
  if (!data) return <main className="p-6 text-muted">Loading…</main>;
  const r = data.record;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <p className="mb-1 text-xs text-ink-600">
        <Link href="/system/map" className="hover:underline">map</Link> / {r.home}
        {r.clusters.length > 0 && <span> · sells under: {r.clusters.join(", ")}</span>}
      </p>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-white">{r.name}</h1>
        <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-muted">{r.class}</span>
        <LifecycleChip value={r.lifecycle} />
        <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-muted">autonomy: {r.autonomy}</span>
      </div>
      <p className="mb-4 text-sm text-muted"><span className="text-white">One outcome:</span> {r.outcome}</p>

      {data.warnings.length > 0 && (
        <div className="mb-4 rounded border border-amber-800 bg-amber-900/30 p-3 text-sm text-amber-300">
          {data.warnings.map((w) => <div key={w}>⚠ {w}</div>)}
        </div>
      )}

      {r.contract ? (
        <Section title="Emit contract">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded border border-ink-700 bg-ink-900 p-3">
              <p className="mb-1 text-xs text-ink-600">Inputs</p>
              {r.contract.inputs.map((x) => (
                <div key={x.name} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted">{x.name}</span><StatusChip value={x.status} />
                </div>
              ))}
            </div>
            <div className="rounded border border-ink-700 bg-ink-900 p-3">
              <p className="mb-1 text-xs text-ink-600">Outputs</p>
              {r.contract.outputs.map((x) => (
                <div key={x.name} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted">{x.name}</span><StatusChip value={x.status} />
                </div>
              ))}
            </div>
            <div className="rounded border border-ink-700 bg-ink-900 p-3">
              <p className="mb-1 text-xs text-ink-600">Key metrics</p>
              {r.contract.metrics.map((m) => (
                <div key={m.name} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted">{m.name}</span>
                  <span className="text-xs text-ink-600">{m.value ?? "not yet measured"}</span>
                </div>
              ))}
            </div>
            <div className="rounded border border-ink-700 bg-ink-900 p-3 text-sm">
              <p className="mb-1 text-xs text-ink-600">Stopping · failure · escalation · cost</p>
              {r.contract.stopping && <p className="text-muted">{r.contract.stopping}</p>}
              {r.contract.failure && <p className="mt-1 text-muted">{r.contract.failure}</p>}
              {r.contract.escalation && r.contract.escalation.length > 0 &&
                <p className="mt-1 text-xs text-ink-600">escalation: {r.contract.escalation.join(" · ")}</p>}
              {r.contract.cost_envelope &&
                <p className="mt-1 text-xs text-ink-600">cost: {Object.values(r.contract.cost_envelope).join(" · ")}</p>}
            </div>
          </div>
          {r.runs_surface && <p className="mt-2 text-xs text-emerald-500">runs visible: {r.runs_surface}</p>}
        </Section>
      ) : (
        <p className="mb-6 rounded border border-ink-700 bg-ink-900 p-3 text-sm text-muted">
          No emit contract yet — this is a stub. Defining the contract is how it stops being one.
        </p>
      )}

      <Section title="Inventory" hint="what makes this system work">
        <RowList rows={r.assets} />
      </Section>

      <Section title="Agent context" hint="what the agent knows">
        <RowList rows={r.context} />
      </Section>

      {r.body && (
        <Section title="Notes & roadmap">
          <div className="md-prose text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{r.body}</ReactMarkdown></div>
        </Section>
      )}

      <Section title="History">
        <div className="border-l-2 border-ink-700 pl-4">
          {data.history.map((c) => (
            <div key={c.hash} className="py-1">
              <p className="text-sm text-muted">{c.subject}</p>
              <p className="text-xs text-ink-600">{c.date} · {c.hash}</p>
            </div>
          ))}
          {data.history.length === 0 && <p className="text-sm text-muted">No commits touch this system yet.</p>}
        </div>
      </Section>
    </main>
  );
}
