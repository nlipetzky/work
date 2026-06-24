// Standardized "anatomy of a system" detail view — the 10-part template from
// practices/agentic-systems/reference/system-anatomy.md, rendered the same way for
// every system from canon (systems + activities + assets). Server component reading
// canon directly. Canon gaps (trigger, decomposed brain, downstream/external
// connections, authority boundaries) render as honest stubs, never fabricated.

import Link from "next/link";
import { getSystemAnatomy, type SysActivity, type SysAsset } from "@/lib/queries/systemAnatomy";
import { getNorthStar } from "@/lib/queries/northStar";
import { getGovernedArtifacts, type GovernedArtifacts } from "@/lib/queries/governedArtifacts";
import { RunButton, ArtifactChip } from "./AssemblerActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- run-layer language (same as /work) ----
function runsWithoutYou(level: string | null) {
  return level === "fully" || level === "autonomous";
}
function automationLabel(level: string | null) {
  switch (level) {
    case "autonomous": return "runs itself";
    case "fully": return "automated";
    case "semi": return "half-automated";
    case "manual": return "manual";
    default: return "unset";
  }
}
function architectureLabel(a: string | null) {
  switch (a) {
    case "code": return "code";
    case "single_call": return "AI call";
    case "workflow": return "AI workflow";
    case "agent": return "AI agent";
    default: return a ?? "—";
  }
}
function channelLabel(c: string | null) {
  switch (c) {
    case "queue": return "review queue";
    case "email": return "email";
    case "surface": return "this surface";
    case "ping": return "ping";
    default: return "no channel";
  }
}

function Part({ n, title, ensures, children }: { n: number; title: string; ensures?: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-lg border border-ink-700 bg-ink-900">
      <div className="flex items-baseline gap-2.5 border-b border-ink-800 px-4 py-2.5">
        <span className="font-mono text-[11px] text-ink-600">{String(n).padStart(2, "0")}</span>
        <span className="text-sm font-semibold text-white">{title}</span>
        {ensures && <span className="text-xs text-ink-600">{ensures}</span>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
function Stub({ children }: { children: React.ReactNode }) {
  return <span className="text-xs italic text-ink-600">{children}</span>;
}
function Field({ label, value, stub }: { label: string; value: string | null | undefined; stub?: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">{label}</div>
      {value ? <p className="text-sm leading-relaxed text-[#cdd9e5]">{value}</p> : <Stub>{stub ?? "not captured in canon yet"}</Stub>}
    </div>
  );
}

export default async function SystemAnatomyPage({ params }: { params: Promise<{ constellation: string; slug: string }> }) {
  const { slug } = await params;
  let anatomy: Awaited<ReturnType<typeof getSystemAnatomy>> = null;
  let vision: string | null = null;
  let error: string | null = null;
  try {
    const [a, ns] = await Promise.all([getSystemAnatomy(slug), getNorthStar()]);
    anatomy = a;
    vision = ns?.statement ?? null;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) return <main className="p-6 text-sm text-bad">canon_engine: {error}</main>;
  if (!anatomy) return <main className="p-6 text-sm text-muted">No system <span className="font-mono">{slug}</span> in canon.</main>;

  const { system: s, goalTitle, activities, assets, triggers, workspacePolls } = anatomy;

  // Governance roster: only the Artifact Assembler governs the artifact corpus.
  let governed: GovernedArtifacts | null = null;
  if (s.system_slug === "artifact-assembler") {
    try { governed = await getGovernedArtifacts(); } catch { governed = null; }
  }

  const wiredTriggers = triggers.filter((t) => t.status === "wired");
  const gapTriggers = triggers.filter((t) => t.status !== "wired");

  const now = Date.now();
  function ago(iso: string | null): string {
    if (!iso) return "never";
    const d = Math.floor((now - new Date(iso).getTime()) / 86400000);
    if (d <= 0) return "today";
    if (d === 1) return "yesterday";
    if (d < 7) return `${d}d ago`;
    if (d < 60) return `${Math.floor(d / 7)}w ago`;
    return `${Math.floor(d / 30)}mo ago`;
  }
  function pollHealth(iso: string | null, count: number): { label: string; tone: "ok" | "warn" | "bad" } {
    const days = iso ? (now - new Date(iso).getTime()) / 86400000 : Infinity;
    if (days > 7) return { label: "stale", tone: "bad" };
    if (count === 0) return { label: "polled · 0 ingested", tone: "warn" };
    return { label: "active", tone: "ok" };
  }
  const pollTrigger = triggers.find((t) => t.event_type === "schedule");
  // group poll accounts by workspace domain
  const pollsByWorkspace = workspacePolls.reduce<Record<string, typeof workspacePolls>>((acc, p) => {
    const dom = p.account_email.split("@")[1] ?? "?";
    (acc[dom] ??= []).push(p);
    return acc;
  }, {});

  const runsWO = activities.filter((a) => runsWithoutYou(a.current_automation_level));
  const needsYou = activities.filter((a) => !runsWithoutYou(a.current_automation_level));
  const autonomyPct = activities.length ? Math.round((runsWO.length / activities.length) * 100) : null;
  const usesAI = !!(s.loop_pattern || s.guardrails || s.ai_context_location || activities.some((a) => a.ai_role));

  const assetsByType = assets.reduce<Record<string, SysAsset[]>>((acc, a) => {
    const k = a.asset_type ?? "untyped";
    (acc[k] ??= []).push(a);
    return acc;
  }, {});
  const assetTypes = Object.keys(assetsByType);
  const verifiedAssets = assets.filter((a) => a.reconciled_against_reality === true).length;

  return (
    <div className="h-full overflow-y-auto font-mono">
      <main className="mx-auto max-w-screen-lg px-8 pb-16 pt-8">
        {/* breadcrumb */}
        <p className="mb-3 text-xs text-ink-600">
          <Link href="/system" className="hover:underline">system</Link>
          {s.constellation && <> / {s.constellation}</>} / <span className="text-muted">{s.system_slug}</span>
        </p>

        {/* ===== 01 IDENTITY / header band ===== */}
        <div className="mb-5 rounded-xl border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{s.name}</h1>
            {s.status && <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-muted">{s.status}</span>}
            {s.system_type && <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-muted">{s.system_type}</span>}
            {s.class && <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-muted">{s.class}</span>}
          </div>

          {s.purpose ? (
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-[#cdd9e5]">
              <span className="text-ink-600">Ensures: </span>{s.purpose}
            </p>
          ) : (
            <p className="mt-3"><Stub>No purpose statement — define what it ensures.</Stub></p>
          )}

          {/* ladder + owner + autonomy */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-700 pt-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="text-ink-600">ladders to</span>
              <span className="text-[#cdd9e5]">{goalTitle ?? "no goal"}</span>
              <span className="text-ink-600">→</span>
              <span className="italic text-accent">{vision ?? "no vision"}</span>
            </span>
            <span className="text-muted"><span className="text-ink-600">owner</span> {s.owner ?? "—"}</span>
            <span className="ml-auto text-muted">
              {autonomyPct === null ? (
                <Stub>run layer not decomposed</Stub>
              ) : (
                <><span className="font-semibold text-white">{autonomyPct}%</span> autonomous · {runsWO.length} of {activities.length} run without you</>
              )}
            </span>
          </div>
        </div>

        {/* ===== ENGINE FLOW: 02 trigger ▸ 03 brain ▸ 04 logic ▸ output ===== */}
        <div className="mb-4 rounded-lg border border-ink-700 bg-ink-850 p-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted">The engine · trigger ▸ brain ▸ logic ▸ output</div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
            {/* trigger */}
            <div className="rounded border border-ink-700 bg-ink-900 p-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">▸ Trigger</div>
              {triggers.length === 0 ? (
                <Stub>nothing listens yet</Stub>
              ) : (
                <div className="space-y-1 text-xs">
                  {wiredTriggers.length > 0 && <p className="text-ok">{wiredTriggers.length} wired ✓</p>}
                  {gapTriggers.length > 0 && <p className="text-warn">{gapTriggers.length} not wired</p>}
                </div>
              )}
            </div>
            {/* brain */}
            <div className="rounded border border-ink-700 bg-ink-900 p-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">▸ Brain (AI)</div>
              {usesAI ? (
                <div className="space-y-1 text-xs text-[#cdd9e5]">
                  {s.loop_pattern ? <p>loop: {s.loop_pattern}</p> : <p className="text-ink-600">loop: <Stub>n/a</Stub></p>}
                  {s.ai_context_location ? <p className="truncate" title={s.ai_context_location}>ctx: {s.ai_context_location}</p> : null}
                  {s.guardrails ? <p>guardrails set</p> : <p className="text-ink-600">model · tools · contracts <Stub>not decomposed</Stub></p>}
                </div>
              ) : (
                <p className="text-xs text-ok">No AI component — deterministic by design.</p>
              )}
            </div>
            {/* logic */}
            <div className="rounded border border-ink-700 bg-ink-900 p-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">▸ Logic (code)</div>
              {s.process_state_location || s.startup_instructions ? (
                <div className="space-y-1 text-xs text-[#cdd9e5]">
                  {s.process_state_location && <p className="truncate" title={s.process_state_location}>{s.process_state_location}</p>}
                  {s.startup_instructions && <p className="truncate" title={s.startup_instructions}>{s.startup_instructions}</p>}
                </div>
              ) : (
                <Stub>no driver / code location recorded</Stub>
              )}
            </div>
            {/* output */}
            <div className="rounded border border-ink-700 bg-ink-900 p-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">▸ Output</div>
              <div className="space-y-1 text-xs text-[#cdd9e5]">
                <p>{activities.length} activit{activities.length === 1 ? "y" : "ies"}</p>
                <p>{assets.length} asset{assets.length === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>

          {/* data band */}
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-3">
            <div className="rounded border border-ink-800 bg-ink-900 p-3"><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Data · reads</div>{s.inputs ? <p className="text-xs leading-relaxed text-[#cdd9e5]">{s.inputs}</p> : <Stub>none declared</Stub>}</div>
            <div className="rounded border border-ink-800 bg-ink-900 p-3"><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Data · state</div>{s.process_state_location ? <p className="text-xs leading-relaxed text-[#cdd9e5]">{s.process_state_location}</p> : <Stub>none declared</Stub>}</div>
            <div className="rounded border border-ink-800 bg-ink-900 p-3"><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Data · writes</div>{s.outputs ? <p className="text-xs leading-relaxed text-[#cdd9e5]">{s.outputs}</p> : <Stub>none declared</Stub>}</div>
          </div>
        </div>

        {/* ===== ARTIFACTS UNDER GOVERNANCE (Artifact Assembler only) ===== */}
        {governed && (
          <section className="mb-4 rounded-lg border border-ink-700 bg-ink-900">
            <div className="flex flex-wrap items-baseline gap-2.5 border-b border-ink-800 px-4 py-2.5">
              <span className="text-sm font-semibold text-white">Artifacts under governance</span>
              <span className="text-xs text-ink-600">what this system produces and governs</span>
              <span className="ml-auto font-mono text-[11px] text-muted">
                {governed.totalApproved}/{governed.total} approved · {governed.engagements.length} engagement{governed.engagements.length === 1 ? "" : "s"} ·{" "}
                <span className={governed.keyReady ? "text-ok" : "text-warn"}>AI key {governed.keyReady ? "ready ✓" : "missing ✗"}</span>
              </span>
            </div>
            <div className="p-4">
              {governed.engagements.length === 0 ? (
                <Stub>no manifests yet — no engagement owes artifacts</Stub>
              ) : (
                <div className="space-y-5">
                  {governed.engagements.map((e) => {
                    const needs = e.items.filter((it) => it.state === "gap");
                    return (
                    <div key={`${e.engagement_type}:${e.engagement_id}`}>
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{e.engagement_type} · {e.engagement_id}</span>
                        <span className={`text-[11px] ${e.approved === 0 ? "text-warn" : "text-ink-600"}`}>{e.approved}/{e.total} approved</span>
                        {e.missingSource > 0 && <span className="text-[11px] text-warn">· {e.missingSource} missing source</span>}
                        <span className="ml-auto"><RunButton engagementType={e.engagement_type} engagementId={e.engagement_id} /></span>
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {e.items.map((it) => {
                          if (it.artifact_id && (it.state === "draft" || it.state === "approved")) {
                            return <ArtifactChip key={it.artifact_type} artifactId={it.artifact_id} label={it.artifact_type} version={it.version} state={it.state} />;
                          }
                          const tone = it.source_present ? "bg-accent/10 text-accent border-accent/30" : "bg-ink-800 text-ink-600 border-ink-700";
                          return (
                            <span key={it.artifact_type} className={`rounded border px-2 py-0.5 text-[11px] ${tone}`}
                              title={it.source_present ? "source ready — Run can draft this" : "no source material yet"}>
                              {it.source_present ? "○" : "·"} {it.artifact_type}
                            </span>
                          );
                        })}
                      </div>
                      {needs.length > 0 && (
                        <div className="rounded border border-ink-800 bg-ink-850 p-2.5">
                          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-warn">Inputs · {needs.filter((n) => !n.source_present).length} need source · {needs.filter((n) => n.source_present).length} source-ready (Run drafts these)</div>
                          <div className="space-y-1.5">
                            {needs.map((it) => (
                              <div key={it.artifact_type} className="text-[11px] leading-snug">
                                <span className={it.source_present ? "text-accent" : "text-warn"}>{it.source_present ? "○ source ready" : "· needs source"}</span>
                                <span className="ml-1.5 text-[#cdd9e5]">{it.artifact_type}</span>
                                {it.required_expertise.length > 0 && <span className="ml-1.5 rounded bg-accent/10 px-1 text-[9px] uppercase tracking-wider text-accent">sign-off: {it.required_expertise.join(" · ")}</span>}
                                {it.done_when && <span className="ml-1.5 text-ink-600">— {it.done_when}</span>}
                                <div className="pl-3 font-mono text-[10px] text-ink-600">{it.source_path}</div>
                                {it.needs && (
                                  <div className="mt-1 ml-3 border-l-2 border-warn/30 pl-2.5">
                                    {it.needs.summary && <div className="text-[10px] text-warn">Assembler needs: {it.needs.summary}</div>}
                                    {it.needs.questions.length > 0 && (
                                      <ul className="mt-0.5 space-y-0.5">
                                        {it.needs.questions.map((q, i) => <li key={i} className="text-[10px] text-[#cdd9e5]">? {q}</li>)}
                                      </ul>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                  <p className="text-[11px] text-ink-600">Operate: <span className="text-accent">Run</span> drafts every artifact whose source is ready; <span className="text-warn">Confirm</span> promotes a draft to approved.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== 02 TRIGGERS & ROUTING ===== */}
        <Part n={2} title="Triggers &amp; routing" ensures="what listens, and what it fires">
          {triggers.length === 0 ? (
            <p className="text-sm text-muted">Nothing listens. <Stub>events for this system aren&apos;t detected — they wait for a manual prompt.</Stub></p>
          ) : (
            <div className="space-y-3">
              {triggers.map((t) => {
                const wired = t.status === "wired";
                return (
                  <div key={t.id} className={`rounded-lg border p-3.5 ${wired ? "border-ok/30 bg-ok/5" : "border-warn/30 bg-warn/5"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-medium ${wired ? "text-white" : "text-[#cdd9e5]"}`}>{t.name}</span>
                      <span className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-muted">{t.event_type}</span>
                      <span className={`rounded px-2 py-0.5 text-[11px] ${wired ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"}`}>
                        {wired ? "wired ✓" : t.status === "none" ? "not wired" : t.status}
                      </span>
                      {t.schedule && <span className="font-mono text-[10px] text-ink-600">{t.schedule}</span>}
                    </div>
                    {t.source && <div className="mt-1 font-mono text-[11px] text-muted">on {t.source}</div>}

                    {wired ? (
                      t.routes.length === 0 ? (
                        <div className="mt-2"><Stub>fires, but no route recorded</Stub></div>
                      ) : (
                        <div className="mt-2.5 space-y-1.5 border-l-2 border-ink-700 pl-3">
                          {t.routes.map((r) => (
                            <div key={r.id} className="text-xs">
                              <span className="text-ink-600">→ </span>
                              <span className="text-[#cdd9e5]">{r.target_name}</span>
                              <span className="ml-1.5 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-muted">{r.target_type}</span>
                              {r.autonomous && <span className="ml-1.5 text-[10px] text-ok">autonomous</span>}
                              {r.action && <div className="mt-0.5 pl-3.5 text-[11px] text-ink-600">{r.action}</div>}
                              {r.target_locator && <div className="pl-3.5 font-mono text-[10px] text-ink-600">{r.target_locator}</div>}
                            </div>
                          ))}
                        </div>
                      )
                    ) : t.condition ? (
                      <div className="mt-2 text-xs leading-relaxed text-warn">{t.condition}</div>
                    ) : (
                      <div className="mt-2 text-xs text-warn">Nothing fires on this event yet ... it waits for a manual prompt. This is the gap to wire next.</div>
                    )}
                    {t.executor && wired && <div className="mt-2 font-mono text-[10px] text-ink-600">executor: {t.executor}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </Part>

        {/* ===== WORKSPACE INGESTION (cadence + coverage) ===== */}
        {workspacePolls.length > 0 && (
          <section className="mb-4 rounded-lg border border-ink-700 bg-ink-900">
            <div className="flex flex-wrap items-baseline gap-2.5 border-b border-ink-800 px-4 py-2.5">
              <span className="text-sm font-semibold text-white">Workspace ingestion</span>
              <span className="text-xs text-ink-600">how the data gets in, and from where</span>
              <span className="ml-auto font-mono text-[11px] text-muted">Google Workspace → canon corpus{pollTrigger?.schedule ? ` · ${pollTrigger.schedule}` : ""} · last run {ago(workspacePolls[0].last_polled_at)}</span>
            </div>
            <div className="p-4">
              <p className="mb-3 text-xs text-muted">
                A poller {pollTrigger?.executor ? <span className="font-mono text-[11px] text-ink-600">({pollTrigger.executor})</span> : null} authenticates as each account below and pulls Drive transcripts + Gmail into canon{pollTrigger?.schedule ? ` ${pollTrigger.schedule}` : ""}.
              </p>
              <div className="space-y-4">
                {Object.keys(pollsByWorkspace).sort().map((dom) => {
                  const accts = pollsByWorkspace[dom];
                  const totalIngested = accts.reduce((n, a) => n + a.processed_count, 0);
                  return (
                    <div key={dom}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{dom}</span>
                        <span className={`text-[11px] ${totalIngested === 0 ? "text-warn" : "text-ink-600"}`}>
                          {totalIngested === 0 ? "polled, but nothing ingested" : `${totalIngested} ingested`}
                        </span>
                      </div>
                      <div className="rounded border border-ink-700 bg-ink-850">
                        {accts.map((a, i) => {
                          const h = pollHealth(a.last_polled_at, a.processed_count);
                          const toneCls = h.tone === "ok" ? "bg-ok/15 text-ok" : h.tone === "warn" ? "bg-warn/15 text-warn" : "bg-bad/15 text-bad";
                          return (
                            <div key={a.account_email} className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${i > 0 ? "border-t border-ink-800" : ""}`}>
                              <div className="min-w-0">
                                <div className="font-mono text-[12px] text-[#cdd9e5]">{a.account_email}</div>
                                <div className="mt-0.5 text-[11px] text-ink-600">last polled {ago(a.last_polled_at)} · {a.processed_count} transcript{a.processed_count === 1 ? "" : "s"}</div>
                              </div>
                              <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] ${toneCls}`}>{h.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ===== 06 CONNECTIONS ===== */}
        <Part n={6} title="Connections" ensures="the edges">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Upstream (depends on)</div>
              {s.depends_on && s.depends_on.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {s.depends_on.map((d) => <span key={d} className="rounded border border-ink-700 bg-ink-800 px-2 py-0.5 text-xs text-[#cdd9e5]">{d}</span>)}
                </div>
              ) : <Stub>none declared</Stub>}
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Downstream consumers</div>
              <Stub>not modeled in canon yet</Stub>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600">External integrations</div>
              {workspacePolls.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded border border-ink-700 bg-ink-800 px-2 py-0.5 text-xs text-[#cdd9e5]">Google Workspace · Drive</span>
                  <span className="rounded border border-ink-700 bg-ink-800 px-2 py-0.5 text-xs text-[#cdd9e5]">Google Workspace · Gmail</span>
                  <span className="mt-0.5 w-full text-[11px] text-ink-600">see Workspace ingestion above for cadence + coverage</span>
                </div>
              ) : (
                <Stub>not modeled in canon yet</Stub>
              )}
            </div>
          </div>
        </Part>

        {/* ===== 07 ACTIVITIES / run layer ===== */}
        <Part n={7} title="Activities · the run layer" ensures="what it runs for you">
          {activities.length === 0 ? (
            <p className="text-sm text-muted">Not yet decomposed into activities. <Stub>the run layer is empty until this system is broken into the things it ensures.</Stub></p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-warn">Needs you</div>
                {needsYou.length === 0 ? (
                  <div className="rounded border border-dashed border-ink-700 px-3 py-2.5 text-xs text-muted">Nothing — this whole system runs without you.</div>
                ) : (
                  <div className="space-y-2">
                    {needsYou.map((a: SysActivity) => (
                      <div key={a.id} className="rounded border border-warn/30 bg-warn/5 px-3 py-2.5">
                        <div className="text-sm text-white">{a.name}</div>
                        <div className="mt-0.5 text-xs text-muted">
                          {channelLabel(a.channel)} · {automationLabel(a.current_automation_level)} today
                          {a.target_automation_level && a.target_automation_level !== a.current_automation_level && <>, aiming for {automationLabel(a.target_automation_level)}</>}
                        </div>
                        {a.verification && <div className="mt-1 text-[11px] text-ink-600">verify: {a.verification}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-600">Runs without you</div>
                {runsWO.length === 0 ? (
                  <div className="text-xs text-ink-600">Nothing handled end-to-end yet.</div>
                ) : (
                  <div className="space-y-2">
                    {runsWO.map((a: SysActivity) => (
                      <div key={a.id} className="rounded border border-ink-700 bg-ink-900 px-3 py-2.5">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-ok">✓</span>
                          <span className="text-[#b6c2cf]">{a.name}</span>
                          <span className="ml-auto text-[11px] text-ink-600">{architectureLabel(a.architecture)}</span>
                        </div>
                        {a.ai_role && <div className="mt-1 pl-5 text-[11px] text-ink-600">AI: {a.ai_role}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Part>

        {/* ===== 08 + 09 foot strip: guarantee/observability + human/authority ===== */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-lg border border-ink-700 bg-ink-900 p-4">
            <div className="mb-3 flex items-baseline gap-2.5">
              <span className="font-mono text-[11px] text-ink-600">08</span>
              <span className="text-sm font-semibold text-white">Guarantee &amp; observability</span>
            </div>
            <Field label="What it guarantees" value={s.success_criteria} stub="no success criteria declared" />
            <Field label="Key metrics" value={s.key_metrics} stub="no metrics declared" />
            <Field label="Watched at" value={s.observability_locations} stub="no observability location — where is this watched?" />
          </section>
          <section className="rounded-lg border border-ink-700 bg-ink-900 p-4">
            <div className="mb-3 flex items-baseline gap-2.5">
              <span className="font-mono text-[11px] text-ink-600">09</span>
              <span className="text-sm font-semibold text-white">Human &amp; authority</span>
            </div>
            <Field label="Owner" value={s.owner} stub="no owner assigned" />
            <div className="mb-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Autonomy split</div>
              {activities.length === 0 ? <Stub>run layer not decomposed</Stub> : (
                <p className="text-sm text-[#cdd9e5]">{runsWO.length} run without you · <span className="text-warn">{needsYou.length} still need you</span></p>
              )}
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Authority boundaries</div>
              <Stub>propose-vs-act line not modeled in canon yet</Stub>
            </div>
          </section>
        </div>

        {/* ===== 10 ASSETS inventory ===== */}
        <Part n={10} title="Assets · implementation inventory" ensures="what actually constitutes this system">
          {assets.length === 0 ? (
            <p className="text-sm text-muted">No assets catalogued for this system yet.</p>
          ) : (
            <>
              <div className="mb-3 text-xs text-ink-600">
                {assets.length} asset{assets.length === 1 ? "" : "s"} · {verifiedAssets} reconciled against live
                {verifiedAssets < assets.length && <span className="text-warn"> · {assets.length - verifiedAssets} unverified — catalogue is verified-present, not yet complete</span>}
              </div>
              <div className="space-y-4">
                {assetTypes.map((t) => (
                  <div key={t}>
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">{t} · {assetsByType[t].length}</div>
                    <div className="rounded border border-ink-700 bg-ink-900">
                      {assetsByType[t].map((a, i) => {
                        const locator = a.source_path || a.url || a.external_id;
                        return (
                          <div key={a.id} className={`flex items-start justify-between gap-3 px-3.5 py-2.5 ${i > 0 ? "border-t border-ink-800" : ""}`}>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-sm text-white">
                                {a.name ?? "(unnamed)"}
                                {a.deployed_version && <span className="text-[11px] text-ink-600">v{a.deployed_version}</span>}
                              </div>
                              {locator && <div className="mt-0.5 truncate font-mono text-[11px] text-muted" title={locator}>{locator}</div>}
                            </div>
                            <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] ${a.reconciled_against_reality ? "bg-ok/15 text-ok" : "bg-ink-800 text-ink-600"}`}>
                              {a.reconciled_against_reality ? "verified ✓" : "unverified"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Part>

        <p className="mt-6 text-center text-[11px] text-ink-600">
          live · canon_engine · systems · activities · assets · anatomy template
        </p>
      </main>
    </div>
  );
}
