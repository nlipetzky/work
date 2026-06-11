"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StatusChip, LifecycleChip, Section } from "@/components/system/Bits";

const TO_BUILD_STATUSES = new Set(["to-build", "to-write"]);
const AMBER_STATUSES = new Set(["building", "drafted", "built"]);

type Row = {
  name: string; type?: string; version?: string | null; ownership?: string;
  status: string; verified_by: string | null; note?: string; path?: string;
};
type FlowNode = { node: string; assets: string[]; impl?: string; kind?: string };
type IO = { name: string; status: string };
type Detail = {
  record: {
    name: string; slug: string; home: string; clusters: string[]; class: string;
    lifecycle: string; autonomy: string; outcome: string; stub: boolean;
    runs_surface: string | null;
    contract: null | {
      inputs: IO[]; outputs: IO[];
      metrics: { name: string; value: string | number | null }[];
      stopping?: string; failure?: string; escalation?: string[];
      cost_envelope?: Record<string, string>;
    };
    assets: Row[]; context: Row[]; body: string;
    flow?: FlowNode[];
    flow_inputs?: IO[];
    flow_outputs?: IO[];
    now?: string[];
  };
  warnings: string[];
  history: { hash: string; date: string; subject: string }[];
};

// ─── helpers ────────────────────────────────────────────────────────────────

const WORK_ROOT = "/Users/nplmini/code/work/";

function nodeState(node: FlowNode, allRows: Row[]): "red" | "amber" | "green" | "neutral" {
  if (!node.assets.length) return "neutral";
  const matched = allRows.filter((r) => node.assets.includes(r.name));
  if (!matched.length) return "neutral";
  if (matched.some((r) => TO_BUILD_STATUSES.has(r.status))) return "red";
  if (matched.some((r) => AMBER_STATUSES.has(r.status))) return "amber";
  return "green";
}

const NODE_STATE_CLASSES: Record<string, string> = {
  red: "border-red-500/40 bg-red-950/20",
  amber: "border-amber-500/40 bg-amber-950/20",
  green: "border-emerald-500/40 bg-emerald-950/20",
  neutral: "border-ink-700 bg-ink-900",
};

function ioStatusClass(status: string): string {
  if (status === "live" || status === "operating" || status === "connected" || status === "tested" || status === "defined") {
    return "bg-emerald-900/60 text-emerald-300";
  }
  if (status === "manual" || status === "handmade" || status === "building" || status === "drafted" || status === "built") {
    return "bg-amber-900/60 text-amber-300";
  }
  if (TO_BUILD_STATUSES.has(status) || status === "unwired" || status === "off") {
    return "bg-red-900/60 text-red-300";
  }
  return "bg-ink-800 text-muted";
}

function rowExistsLabel(row: Row): string {
  if (TO_BUILD_STATUSES.has(row.status)) return "to build";
  if (row.status === "tested" && row.verified_by) return "tested ✓";
  return "exists";
}

function rowExistsClass(row: Row): string {
  if (TO_BUILD_STATUSES.has(row.status)) return "bg-red-900/60 text-red-300";
  return "bg-emerald-900/60 text-emerald-300";
}

/** Parse markdown body for lines starting with - **next** / **later** / **active** / **dated...** */
function parseNextItems(body: string): { tag: string; text: string }[] {
  const results: { tag: string; text: string }[] = [];
  for (const line of body.split("\n")) {
    const m = line.match(/^\s*[-*]\s+\*\*(next|later|active|dated[^*]*)\*\*\s*[—–-]?\s*(.*)/i);
    if (m) {
      const rest = m[2].replace(/\*\*/g, "").trim();
      results.push({ tag: m[1].toLowerCase(), text: rest.length > 70 ? rest.slice(0, 70) + "…" : rest });
      if (results.length >= 4) break;
    }
  }
  return results;
}

// ─── sub-components ──────────────────────────────────────────────────────────

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

function IOChips({ items }: { items: IO[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((io) => (
        <span key={io.name} className={`rounded px-2.5 py-1 text-xs font-medium ${ioStatusClass(io.status)}`}>
          {io.name}
        </span>
      ))}
      {items.length === 0 && <span className="text-xs text-muted">none declared</span>}
    </div>
  );
}

function ImplPanel({ node, allRows, onClose }: { node: FlowNode; allRows: Row[]; onClose: () => void }) {
  const matched = allRows.filter((r) => node.assets.includes(r.name));
  return (
    <div className="mt-2 rounded border border-ink-700 bg-ink-850 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">{node.node} — implementation</span>
        <button onClick={onClose} className="text-xs text-muted hover:text-white">✕</button>
      </div>
      {matched.length === 0 && (
        <p className="text-xs text-muted">No matched inventory rows for this node.</p>
      )}
      {matched.map((r) => (
        <div key={r.name} className="flex items-start gap-2 border-t border-ink-700 py-2 first:border-0">
          <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${rowExistsClass(r)}`}>
            {rowExistsLabel(r)}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-xs text-white">{r.name}</p>
            {r.note && <p className="text-[10px] text-muted">{r.note}</p>}
            {r.path && (
              <a
                href={`/api/playfile?path=${encodeURIComponent(WORK_ROOT + r.path)}`}
                className="text-[10px] text-sky-400 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {r.path}
              </a>
            )}
            {r.verified_by && (
              <p className="text-[10px] text-emerald-400">verified: {r.verified_by}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FlowBand({
  flow,
  flowInputs,
  flowOutputs,
  allRows,
}: {
  flow: FlowNode[];
  flowInputs: IO[];
  flowOutputs: IO[];
  allRows: Row[];
}) {
  const [openNode, setOpenNode] = useState<string | null>(null);

  return (
    <div className="mb-4 rounded border border-ink-700 bg-ink-850 p-4">
      {/* inputs row */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Inputs</p>
        <IOChips items={flowInputs} />
      </div>

      {/* down arrow */}
      <p className="mb-3 text-center text-sm text-muted">↓</p>

      {/* pipeline nodes */}
      <div className="flex flex-wrap items-stretch gap-1 overflow-x-auto">
        {flow.map((node, idx) => {
          const state = nodeState(node, allRows);
          const isOpen = openNode === node.node;
          return (
            <div key={node.node} className="flex items-center">
              {idx > 0 && <span className="mx-1 text-sm text-muted">→</span>}
              <button
                onClick={() => setOpenNode(isOpen ? null : node.node)}
                className={`rounded border px-3 py-2 text-left transition-colors hover:opacity-80 ${NODE_STATE_CLASSES[state]}`}
                style={{ minWidth: "7rem" }}
              >
                <p className="text-sm font-medium text-white">{node.node}</p>
                {node.impl && <p className="font-mono text-[10px] text-muted">{node.impl}</p>}
                {(node.kind || state !== "neutral") && (
                  <p className="text-[10px] text-muted">
                    {node.kind ? `${node.kind} · ` : ""}
                    <span className={
                      state === "red" ? "text-red-400" :
                      state === "amber" ? "text-amber-400" :
                      state === "green" ? "text-emerald-400" : "text-muted"
                    }>
                      {state === "red" ? "to build" : state === "amber" ? "building" : state === "green" ? "built" : "—"}
                    </span>
                  </p>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* impl panel for open node */}
      {openNode && (() => {
        const node = flow.find((n) => n.node === openNode);
        if (!node) return null;
        return <ImplPanel node={node} allRows={allRows} onClose={() => setOpenNode(null)} />;
      })()}

      {/* down arrow */}
      <p className="my-3 text-center text-sm text-muted">↓</p>

      {/* outputs row */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Outputs</p>
        <IOChips items={flowOutputs} />
      </div>
    </div>
  );
}

function BottomPanels({
  record,
  history,
}: {
  record: Detail["record"];
  history: Detail["history"];
}) {
  const allRows = [...record.assets, ...record.context];

  // decisions banked: context rows with a version, sorted desc, max 4
  const banked = [...record.context]
    .filter((r) => r.version)
    .sort((a, b) => (b.version ?? "").localeCompare(a.version ?? ""))
    .slice(0, 4);

  // next items from body
  const nextItems = parseNextItems(record.body ?? "");

  // moving now
  const nowItems = record.now ?? [];

  const lastCommit = history[0];

  // suppress allRows unused warning — it's used in the DECISIONS section for context
  void allRows;

  return (
    <div className="mb-6 grid gap-3 md:grid-cols-3">
      {/* MOVING NOW */}
      <div className="rounded border border-ink-700 bg-ink-900 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white">Moving now</p>
        {nowItems.length > 0 ? (
          <ul className="space-y-1">
            {nowItems.map((item, i) => (
              <li key={i} className="text-xs text-muted">▶ {item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">Nothing flagged.</p>
        )}
        <p className="mt-3 text-[10px] text-ink-600">
          last commit: {lastCommit ? `${lastCommit.date} — ${lastCommit.subject.slice(0, 60)}${lastCommit.subject.length > 60 ? "…" : ""}` : "—"}
        </p>
      </div>

      {/* DECISIONS BANKED */}
      <div className="rounded border border-ink-700 bg-ink-900 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white">Decisions banked</p>
        {banked.length > 0 ? (
          <ul className="space-y-1">
            {banked.map((r) => (
              <li key={r.name} className="text-xs text-muted">
                {r.name} <span className="text-ink-600">({r.version})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">None banked yet.</p>
        )}
      </div>

      {/* NEXT */}
      <div className="rounded border border-ink-700 bg-ink-900 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white">Next</p>
        {nextItems.length > 0 ? (
          <ul className="space-y-1">
            {nextItems.map((item, i) => (
              <li key={i} className="text-xs text-muted">
                <span className={item.tag === "active" ? "text-sky-400" : "text-ink-500"}>{item.tag}</span> {item.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">No next items in roadmap.</p>
        )}
        <a href="#roadmap" className="mt-3 block text-[10px] text-sky-400 hover:underline">
          Full roadmap →
        </a>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

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
  const hasFlow = Array.isArray(r.flow) && r.flow.length > 0;
  const allRows = [...r.assets, ...r.context];

  // build gap
  const toBuild = allRows.filter((row) => TO_BUILD_STATUSES.has(row.status)).length;
  const existing = allRows.filter((row) => !TO_BUILD_STATUSES.has(row.status)).length;

  // io lists with fallbacks
  const flowInputs: IO[] = r.flow_inputs?.length ? r.flow_inputs : (r.contract?.inputs ?? []);
  const flowOutputs: IO[] = r.flow_outputs?.length ? r.flow_outputs : (r.contract?.outputs ?? []);

  return (
    <main className="mx-auto max-w-3xl p-6">
      {/* breadcrumb */}
      <p className="mb-1 text-xs text-ink-600">
        <Link href="/system/map" className="hover:underline">map</Link> / {r.home}
        {r.clusters.length > 0 && <span> · sells under: {r.clusters.join(", ")}</span>}
      </p>

      {/* header row */}
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold text-white">{r.name}</h1>
        <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-muted">{r.class}</span>
        <LifecycleChip value={r.lifecycle} />
        <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-muted">autonomy: {r.autonomy}</span>

        {/* build gap chips — only when flow present */}
        {hasFlow && (
          <>
            {existing > 0 && (
              <span className="rounded bg-ok/15 px-2 py-0.5 text-xs text-ok">
                {existing} part{existing !== 1 ? "s" : ""} exist
              </span>
            )}
            {toBuild > 0 && (
              <span className="rounded bg-bad/15 px-2 py-0.5 text-xs text-bad">
                {toBuild} to build
              </span>
            )}
          </>
        )}

        {/* roadmap link — only when flow present */}
        {hasFlow && r.body && (
          <a
            href="#roadmap"
            className="ml-auto rounded border border-ink-700 bg-ink-800 px-3 py-1 text-xs text-muted hover:text-white"
          >
            Full roadmap →
          </a>
        )}
      </div>

      {/* outcome */}
      <p className="mb-4 text-sm text-muted"><span className="text-white">One outcome:</span> {r.outcome}</p>

      {/* flow band — gated on flow presence */}
      {hasFlow && (
        <FlowBand
          flow={r.flow!}
          flowInputs={flowInputs}
          flowOutputs={flowOutputs}
          allRows={allRows}
        />
      )}

      {/* warnings */}
      {data.warnings.length > 0 && (
        <div className="mb-4 rounded border border-amber-800 bg-amber-900/30 p-3 text-sm text-amber-300">
          {data.warnings.map((w) => <div key={w}>⚠ {w}</div>)}
        </div>
      )}

      {/* bottom three panels — gated on flow */}
      {hasFlow && <BottomPanels record={r} history={data.history} />}

      {/* emit contract */}
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
          <div id="roadmap" className="md-prose text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.body}</ReactMarkdown>
          </div>
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
