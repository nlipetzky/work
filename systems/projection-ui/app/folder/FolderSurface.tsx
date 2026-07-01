"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ExpertFolder, JudgmentUnit, ActivityOption, LibraryRecipe, FolderTrackRecord,
} from "@/lib/queries/expertFolder-shared";

type Tab = "recipes" | "options" | "rulings" | "proposed" | "track-record";

// Default routing target when handing a proposed unit to an expert. v1 = the CIPO venture.
const DEFAULT_ENGAGEMENT_TYPE = "ventures";
const DEFAULT_ENGAGEMENT_ID = "konstellation-cipo";

export default function FolderSurface({
  folderSlug, folder, recipes, options, rulings, proposed, trackRecord,
}: {
  folderSlug: string;
  folder: ExpertFolder | null;
  recipes: LibraryRecipe[];
  options: ActivityOption[];
  rulings: JudgmentUnit[];
  proposed: JudgmentUnit[];
  trackRecord: FolderTrackRecord;
}) {
  // Proposed queue is where the operator acts, so open there when there's anything to triage.
  const [tab, setTab] = useState<Tab>(proposed.length ? "proposed" : "recipes");
  const title = folder?.name ?? folderSlug;

  return (
    <div className="h-full overflow-y-auto font-mono">
      <main className="mx-auto max-w-screen-lg px-8 pb-16 pt-8">
        <p className="mb-3 text-xs text-ink-600">folder · canon · the judgment library</p>
        <div className="mb-5 rounded-xl border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900 p-5">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#cdd9e5]">
            The accumulated judgment for this folder: the recipes and options the system runs, the rulings
            that constrain them, and the proposed units awaiting your ratify / veto / route.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-ink-700 pt-3 text-xs text-muted">
            <span><span className="font-semibold text-white">{recipes.length}</span> recipes</span>
            <span><span className="font-semibold text-white">{options.length}</span> options</span>
            <span><span className="font-semibold text-white">{rulings.length}</span> rulings</span>
            <span><span className="font-semibold text-white">{proposed.length}</span> proposed{proposed.length > 0 ? <span className="text-warn"> (triage)</span> : null}</span>
            {folder?.domain && <span>domain <span className="font-semibold text-white">{folder.domain}</span></span>}
          </div>
        </div>

        <div className="mb-4 flex gap-1 border-b border-ink-800">
          {([
            ["proposed", `Proposed (${proposed.length})`],
            ["recipes", `Recipes (${recipes.length})`],
            ["options", `Options (${options.length})`],
            ["rulings", `Rulings (${rulings.length})`],
            ["track-record", "Track record"],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm ${tab === t ? "border-b-2 border-accent text-white" : "text-muted hover:text-white"}`}>{label}</button>
          ))}
        </div>

        {tab === "proposed" && <ProposedQueue proposed={proposed} folderSlug={folderSlug} />}
        {tab === "recipes" && <Recipes recipes={recipes} />}
        {tab === "options" && <Options options={options} />}
        {tab === "rulings" && <Rulings rulings={rulings} />}
        {tab === "track-record" && <TrackRecord trackRecord={trackRecord} />}
      </main>
    </div>
  );
}

// generic POST helper -> any console endpoint, then refresh
function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  async function run(url: string, payload: Record<string, unknown>, okMsg?: string) {
    setBusy(true); setErr(null); setOk(null);
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!j.ok) { setErr(j.error ?? "failed"); return false; }
      if (okMsg) setOk(okMsg);
      router.refresh();
      return true;
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); return false; }
    finally { setBusy(false); }
  }
  return { run, busy, err, ok };
}

// ── shared chip helpers (reuse the ExpertLiaisonSurface token vocabulary) ──────

// provenance → tone. ai_originated=accent (a machine proposal), human_*=ok (a person put it there).
function provenanceTone(p: string): string {
  return p === "ai_originated" ? "bg-accent/15 text-accent" : "bg-ok/15 text-ok";
}

// standing → tone. proposed=warn (needs action), active=ok, locked=ok-strong.
function standingTone(s: string): string {
  return s === "locked" ? "bg-ok/20 text-ok" : s === "active" ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn";
}

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`rounded px-2 py-0.5 text-[11px] ${tone}`}>{children}</span>;
}

function MicroChip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${tone}`}>{children}</span>;
}

// ── Proposed queue: the ratify / veto / route-to-expert triage ─────────────────
function ProposedQueue({ proposed, folderSlug }: { proposed: JudgmentUnit[]; folderSlug: string }) {
  if (!proposed.length)
    return <p className="text-sm text-muted">Nothing proposed. New AI-originated or human-injected units land here for ratify / veto / route before they enter the active library.</p>;
  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-relaxed text-ink-600">
        Each unit is a proposed judgment for the <span className="text-[#cdd9e5]">{folderSlug}</span> folder. Ratify to move it into the active library,
        veto to retire it, or route it to an expert for a call you can&apos;t make yourself.
      </p>
      <div className="space-y-3">{proposed.map((u) => <ProposedCard key={u.id} u={u} />)}</div>
    </div>
  );
}

function ProposedCard({ u }: { u: JudgmentUnit }) {
  const { run, busy, err, ok } = useAction();
  const [routing, setRouting] = useState(false);
  const [engType, setEngType] = useState(DEFAULT_ENGAGEMENT_TYPE);
  const [engId, setEngId] = useState(DEFAULT_ENGAGEMENT_ID);
  const [expertSlug, setExpertSlug] = useState("");
  const U = "/api/folder";

  return (
    <section className="rounded-lg border border-ink-700 bg-ink-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 px-4 py-2.5">
        <MicroChip tone="bg-ink-800 text-muted">{u.kind}</MicroChip>
        {u.ruling_kind && <MicroChip tone="bg-accent/10 text-accent">{u.ruling_kind}</MicroChip>}
        <MicroChip tone={provenanceTone(u.provenance)}>{u.provenance}</MicroChip>
        {u.gate_posture && <MicroChip tone="bg-warn/15 text-warn">{u.gate_posture.replace(/_/g, " ")}</MicroChip>}
        <span className="ml-auto text-[10px] uppercase tracking-wider text-ink-600">{u.standing}</span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[12px] leading-relaxed text-[#cdd9e5]">{u.assertion}</p>
        {u.reasoning && <p className="mt-1.5 text-[11px] leading-relaxed text-ink-600">{u.reasoning}</p>}
        {u.proposed_by && <p className="mt-1.5 text-[10px] text-ink-600">proposed by {u.proposed_by}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-ink-800 px-4 py-2.5">
        <button onClick={() => run(U, { action: "ratify", id: u.id }, "ratified — now active")} disabled={busy}
          className="rounded border border-ok/40 bg-ok/10 px-2.5 py-1 text-[11px] text-ok hover:bg-ok/20 disabled:opacity-40">
          {busy ? "…" : "Ratify"}
        </button>
        <button onClick={() => run(U, { action: "veto", id: u.id }, "vetoed — retired")} disabled={busy}
          className="rounded border border-warn/40 bg-warn/15 px-2.5 py-1 text-[11px] text-warn hover:bg-warn/20 disabled:opacity-40">
          Veto
        </button>
        <button onClick={() => setRouting((v) => !v)} disabled={busy}
          className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-40">
          {routing ? "Cancel route" : "Route to expert"}
        </button>
        {ok && <span className="text-[10px] text-ok">{ok}</span>}
        {err && <span className="text-[10px] text-bad">{err}</span>}
      </div>

      {routing && (
        <div className="border-t border-ink-800 bg-ink-850 px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Route to an expert for a ruling</div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-wider text-ink-600">engagement type</span>
              <input value={engType} onChange={(e) => setEngType(e.target.value)}
                className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-[11px] text-[#cdd9e5] outline-none focus:border-accent" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-wider text-ink-600">engagement id</span>
              <input value={engId} onChange={(e) => setEngId(e.target.value)}
                className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-[11px] text-[#cdd9e5] outline-none focus:border-accent" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-wider text-ink-600">expert slug (optional)</span>
              <input value={expertSlug} onChange={(e) => setExpertSlug(e.target.value)} placeholder="e.g. will-rosellini"
                className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-[11px] text-[#cdd9e5] outline-none focus:border-accent" />
            </label>
            <button
              onClick={() => run(U, {
                action: "route_to_expert", unit_id: u.id, engagement_type: engType,
                engagement_id: engId, expert_slug: expertSlug || undefined,
              }, "routed to expert")}
              disabled={busy || !engType || !engId}
              className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 disabled:opacity-40">
              {busy ? "…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Recipes: the current library recipe set ────────────────────────────────────
function Recipes({ recipes }: { recipes: LibraryRecipe[] }) {
  if (!recipes.length) return <p className="text-sm text-muted">No recipes yet. This folder&apos;s library is empty.</p>;
  return (
    <div className="space-y-2.5">
      {recipes.map((r) => (
        <section key={r.recipe_id} className="rounded-lg border border-ink-700 bg-ink-900 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">{r.name ?? r.recipe_id}</span>
            {r.layer && <MicroChip tone="bg-accent/10 text-accent">{r.layer}</MicroChip>}
            {r.version != null && <span className="text-[10px] text-ink-600">v{r.version}</span>}
            {r.overrides_recipe_id && <span className="text-[10px] text-warn">overrides {r.overrides_recipe_id}</span>}
          </div>
          {r.description && <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{r.description}</p>}
        </section>
      ))}
    </div>
  );
}

// ── Options: the active source / tactic options ────────────────────────────────
function Options({ options }: { options: ActivityOption[] }) {
  if (!options.length) return <p className="text-sm text-muted">No options yet.</p>;
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-850">
      {options.map((o, i) => (
        <div key={o.id} className={`px-4 py-2.5 ${i > 0 ? "border-t border-ink-800" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            <MicroChip tone={o.kind === "source" ? "bg-accent/10 text-accent" : "bg-ok/10 text-ok"}>{o.kind}</MicroChip>
            <span className="text-[12px] font-semibold text-[#cdd9e5]">{o.name}</span>
            <span className="font-mono text-[10px] text-ink-600">{o.option_slug}</span>
            {o.priority != null && <span className="ml-auto text-[10px] text-ink-600">priority {o.priority}</span>}
          </div>
          {o.when_to_use && <p className="mt-1 text-[11px] leading-relaxed text-ink-600">{o.when_to_use}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Rulings: the active constraint / disqualifier / default / entity_rule set ───
function Rulings({ rulings }: { rulings: JudgmentUnit[] }) {
  if (!rulings.length) return <p className="text-sm text-muted">No active rulings. When you ratify a ruling-kind unit it appears here.</p>;
  return (
    <div className="space-y-2.5">
      {rulings.map((u) => (
        <section key={u.id} className="rounded-lg border border-ink-700 bg-ink-900 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {u.ruling_kind && <MicroChip tone="bg-accent/10 text-accent">{u.ruling_kind}</MicroChip>}
            <Chip tone={standingTone(u.standing)}>{u.standing}</Chip>
            <MicroChip tone={provenanceTone(u.provenance)}>{u.provenance}</MicroChip>
            {u.gate_posture && <MicroChip tone="bg-warn/15 text-warn">{u.gate_posture.replace(/_/g, " ")}</MicroChip>}
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[#cdd9e5]">{u.assertion}</p>
          {u.reasoning && <p className="mt-1.5 text-[11px] leading-relaxed text-ink-600">{u.reasoning}</p>}
        </section>
      ))}
    </div>
  );
}

// ── Track record: standing counts ──────────────────────────────────────────────
function TrackRecord({ trackRecord }: { trackRecord: FolderTrackRecord }) {
  const cells: [string, number, string][] = [
    ["proposed", trackRecord.proposed, "text-warn"],
    ["active", trackRecord.active, "text-ok"],
    ["locked", trackRecord.locked, "text-ok"],
    ["retired", trackRecord.retired, "text-ink-600"],
  ];
  const total = trackRecord.proposed + trackRecord.active + trackRecord.locked + trackRecord.retired;
  if (!total) return <p className="text-sm text-muted">No judgment units yet. Counts appear here once units start landing.</p>;
  return (
    <div>
      <div className="mb-2 text-[11px] text-ink-600">{total} unit{total === 1 ? "" : "s"} total, by standing</div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {cells.map(([label, n, tone]) => (
          <div key={label} className="rounded-lg border border-ink-700 bg-ink-900 p-4">
            <div className={`text-2xl font-semibold ${tone}`}>{n}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-600">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
