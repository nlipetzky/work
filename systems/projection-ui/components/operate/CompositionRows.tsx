"use client";

import { useEffect, useState } from "react";
import type { AccentTokens, ModeFeatures, OperateMode } from "@/lib/operate/mode-features";
import type {
  ActivityComposition,
  AvailableSkill,
  Draft,
  DraftMutators,
  SkillRef,
} from "@/lib/operate/composition-draft";
import { SectionHeading } from "@/components/operate/SectionHeading";

// Composition section: Function / Trigger / Schemas / Adapters + a Skills
// sub-section. RUN renders a read grid; ITERATE/BUILD render inputs + the
// skill swap/add panels. Honest-state everywhere a canon column is NULL.

const inputCls =
  "w-full rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs font-mono text-white focus:outline-none";
const miniBtnCls =
  "rounded border border-ink-700 bg-ink-800 px-2 py-0.5 text-[10px] text-muted hover:text-white cursor-pointer";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-baseline gap-x-3 gap-y-1 border-b border-ink-700 py-2.5 last:border-b-0">
      <div className="text-[10px] uppercase tracking-wide text-ink-600">{label}</div>
      <div className="text-xs text-white">{children}</div>
    </div>
  );
}

export function CompositionRows({
  composition,
  draft,
  mode,
  features,
  accent,
  mutators,
  available,
  availableErr,
  requestAvailable,
  onView,
}: {
  composition: ActivityComposition;
  draft: Draft;
  mode: OperateMode;
  features: ModeFeatures;
  accent: AccentTokens;
  mutators: DraftMutators;
  available: AvailableSkill[] | null;
  availableErr: string | null;
  requestAvailable: () => void;
  onView: () => void;
}) {
  const editable = features.composition_editable;
  const swapEnabled = features.skill_swap_enabled;
  const createEnabled = features.skill_create_new;

  const [adapterDraft, setAdapterDraft] = useState("");
  const [swapOpenForSlug, setSwapOpenForSlug] = useState<string | null>(null);

  const skillRefBySlug = new Map<string, SkillRef>();
  for (const s of composition.skills) skillRefBySlug.set(s.slug, s);

  return (
    <div className="rounded border border-ink-700 bg-ink-900 p-3">
      {/* ── Function ──────────────────────────────────────────────── */}
      <Row label="Function">
        {editable ? (
          <input
            className={inputCls}
            value={draft.functionPath ?? ""}
            placeholder="systems/<sys>/workflows/<fn>.ts"
            onChange={(e) => mutators.setField("functionPath", e.target.value || null)}
          />
        ) : composition.functionPath ? (
          <span className="break-all font-mono">{composition.functionPath}</span>
        ) : (
          <span className="italic text-muted">none</span>
        )}
      </Row>

      {/* ── Trigger ───────────────────────────────────────────────── */}
      <Row label="Trigger">
        {editable ? (
          <input
            className={inputCls}
            value={draft.triggerEvent ?? ""}
            placeholder="namespace/event.name"
            onChange={(e) => mutators.setField("triggerEvent", e.target.value || null)}
          />
        ) : composition.triggerEvent ? (
          <code className="rounded bg-ink-800 px-1 py-0.5 font-mono">
            {composition.triggerEvent}
          </code>
        ) : (
          <span className="italic text-muted">none registered</span>
        )}
      </Row>

      {/* ── Schemas ───────────────────────────────────────────────── */}
      <Row label="Schemas">
        {editable ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink-600">in</span>
              <input
                className={inputCls}
                value={draft.schemaIn}
                placeholder="some.schema.json"
                onChange={(e) => mutators.setField("schemaIn", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink-600">out</span>
              <input
                className={inputCls}
                value={draft.schemaOut}
                placeholder="some.schema.json"
                onChange={(e) => mutators.setField("schemaOut", e.target.value)}
              />
            </div>
          </div>
        ) : (
          <>
            {composition.schemas?.in ? (
              <div>
                in: <code className="font-mono">{composition.schemas.in}</code>
              </div>
            ) : (
              <div className="italic text-muted">in: none</div>
            )}
            {composition.schemas?.out ? (
              <div>
                out: <code className="font-mono">{composition.schemas.out}</code>
              </div>
            ) : (
              <div className="italic text-muted">out: none</div>
            )}
          </>
        )}
      </Row>

      {/* ── Adapters ──────────────────────────────────────────────── */}
      <Row label="Adapters">
        {editable ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1">
              {draft.adapters.length === 0 && (
                <span className="italic text-muted">none</span>
              )}
              {draft.adapters.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-1 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] font-mono"
                >
                  {a}
                  <button
                    onClick={() => mutators.removeAdapter(a)}
                    className="cursor-pointer text-muted hover:text-bad"
                    aria-label={`remove adapter ${a}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <input
                className={inputCls}
                value={adapterDraft}
                placeholder="provider-slug"
                onChange={(e) => setAdapterDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = adapterDraft.trim();
                    if (v) {
                      mutators.addAdapter(v);
                      setAdapterDraft("");
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const v = adapterDraft.trim();
                  if (v) {
                    mutators.addAdapter(v);
                    setAdapterDraft("");
                  }
                }}
                className={miniBtnCls}
              >
                + add
              </button>
            </div>
          </div>
        ) : composition.adapters.length === 0 ? (
          <span className="italic text-muted">none</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {composition.adapters.map((a) => (
              <code
                key={a}
                className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] font-mono"
              >
                {a}
              </code>
            ))}
          </div>
        )}
      </Row>

      {/* ── Skills ────────────────────────────────────────────────── */}
      <div className="pt-3">
        <div className="mb-2 flex items-baseline gap-2">
          <div className="text-[10px] uppercase tracking-wide text-ink-600">Skills</div>
          <div className="text-[11px] text-muted">
            {editable
              ? createEnabled
                ? "swap / remove / create new"
                : "swap, remove, or add"
              : "called inside this activity"}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {editable ? (
            <>
              {draft.skills.length === 0 && (
                <span className="text-xs italic text-muted">
                  No skills bound — this activity runs as a pure function.
                </span>
              )}
              {draft.skills.map((slug) => {
                const ref = skillRefBySlug.get(slug);
                const isSwapping = swapOpenForSlug === slug;
                return (
                  <div key={slug} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2 rounded border border-ink-700 bg-ink-800 px-2.5 py-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-mono text-xs text-white">{slug}</span>
                        {ref?.path && (
                          <span className="truncate text-[10px] text-muted">{ref.path}</span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {swapEnabled && (
                          <button
                            className={miniBtnCls}
                            onClick={() => {
                              setSwapOpenForSlug((s) => (s === slug ? null : slug));
                              requestAvailable();
                            }}
                            style={
                              isSwapping
                                ? { background: accent.bg, borderColor: accent.border, color: accent.text }
                                : undefined
                            }
                          >
                            {isSwapping ? "close" : "swap"}
                          </button>
                        )}
                        <button className={miniBtnCls} onClick={onView}>
                          {createEnabled ? "view" : "edit"}
                        </button>
                        <button
                          className="rounded border border-bad/40 bg-transparent px-2 py-0.5 text-[10px] text-bad hover:bg-bad/10"
                          onClick={() => {
                            mutators.removeSkill(slug);
                            setSwapOpenForSlug((s) => (s === slug ? null : s));
                          }}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                    {isSwapping && (
                      <SkillPicker
                        title={`swap ${slug} ⇄ pick a replacement`}
                        accent={accent}
                        excludeSlugs={draft.skills}
                        available={available}
                        availableErr={availableErr}
                        actionLabel="use"
                        onPick={(newSlug) => {
                          mutators.swapSkill(slug, newSlug);
                          setSwapOpenForSlug(null);
                        }}
                      />
                    )}
                  </div>
                );
              })}
              <AddSkillRow
                accent={accent}
                createEnabled={createEnabled}
                currentSkills={draft.skills}
                available={available}
                availableErr={availableErr}
                requestAvailable={requestAvailable}
                onAdd={(slug) => mutators.addSkill(slug)}
                onCreate={onView}
              />
            </>
          ) : composition.skills.length === 0 ? (
            <span className="text-xs italic text-muted">
              none bound · skills sync via canon.public.skills
            </span>
          ) : (
            composition.skills.map((s) => (
              <ReadSkill key={s.slug} skill={s} accent={accent} onView={onView} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RUN: expandable skill row showing SKILL.md frontmatter ────────────────

function ReadSkill({
  skill,
  accent,
  onView,
}: {
  skill: SkillRef;
  accent: AccentTokens;
  onView: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded border border-ink-700 bg-ink-800">
      <button
        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          <span className="text-[10px] text-muted">{open ? "▾" : "▸"}</span>
          <span className="font-mono text-xs text-white">{skill.slug}</span>
          {skill.title && skill.title !== skill.slug && (
            <span className="text-[11px] text-muted">· {skill.title}</span>
          )}
        </span>
      </button>
      {open && (
        <div className="border-t border-ink-700 px-3 py-2.5">
          {skill.description && (
            <p className="text-[11px] leading-relaxed text-muted">{skill.description}</p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate font-mono text-[10px] text-ink-600">{skill.path}</span>
            <button
              className="cursor-pointer text-[11px] font-semibold"
              style={{ color: accent.text }}
              onClick={onView}
            >
              View full SKILL.md ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── "+ add existing skill" (and "+ create new" in BUILD) ──────────────────

function AddSkillRow({
  accent,
  createEnabled,
  currentSkills,
  available,
  availableErr,
  requestAvailable,
  onAdd,
  onCreate,
}: {
  accent: AccentTokens;
  createEnabled: boolean;
  currentSkills: string[];
  available: AvailableSkill[] | null;
  availableErr: string | null;
  requestAvailable: () => void;
  onAdd: (slug: string) => void;
  onCreate: () => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) requestAvailable();
  }, [open, requestAvailable]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded border border-dashed border-ink-700 px-2.5 py-1 text-[11px] text-muted hover:text-white"
        >
          {open ? "close" : "+ add existing skill"}
        </button>
        {createEnabled && (
          <button
            onClick={onCreate}
            className="rounded border border-dashed px-2.5 py-1 text-[11px]"
            style={{ borderColor: accent.border, color: accent.textSoft, background: accent.bg }}
          >
            + create new skill (invokes skill-creator)
          </button>
        )}
      </div>
      {open && (
        <SkillPicker
          title="add a skill from canon.skills"
          accent={accent}
          excludeSlugs={currentSkills}
          available={available}
          availableErr={availableErr}
          actionLabel="add"
          onPick={(slug) => {
            onAdd(slug);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Shared candidate-list panel (swap + add) ──────────────────────────────

function SkillPicker({
  title,
  accent,
  excludeSlugs,
  available,
  availableErr,
  actionLabel,
  onPick,
}: {
  title: string;
  accent: AccentTokens;
  excludeSlugs: string[];
  available: AvailableSkill[] | null;
  availableErr: string | null;
  actionLabel: string;
  onPick: (slug: string) => void;
}) {
  if (availableErr) {
    return (
      <div className="rounded border border-bad/40 bg-bad/10 p-2 text-[11px] text-bad">
        {availableErr}
      </div>
    );
  }
  if (!available) {
    return (
      <div className="rounded border border-ink-700 bg-ink-800 p-2 text-[11px] text-muted">
        loading candidates from canon.skills…
      </div>
    );
  }
  const others = available.filter((s) => !excludeSlugs.includes(s.slug));
  return (
    <div className="rounded border bg-ink-800 p-2" style={{ borderColor: accent.border }}>
      <div className="mb-1.5 text-[10px] uppercase tracking-wide" style={{ color: accent.text }}>
        {title}
      </div>
      {others.length === 0 ? (
        <div className="p-2 text-center text-[11px] italic text-muted">
          no other candidates in canon.skills
        </div>
      ) : (
        <ul className="flex max-h-60 flex-col gap-1 overflow-auto">
          {others.map((s) => (
            <li
              key={s.slug}
              className="flex items-start justify-between gap-2 rounded border border-ink-700 bg-ink-900 p-1.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-mono text-[11px] text-white">{s.slug}</span>
                  <SkillStatusTag status={s.status} />
                </div>
                <div className="truncate text-[10px] text-muted">
                  {s.ownerSystemSlug ?? "capabilities"} · {s.path}
                </div>
                {s.description && (
                  <div className="mt-0.5 line-clamp-2 text-[10px] text-muted">{s.description}</div>
                )}
              </div>
              <button
                onClick={() => onPick(s.slug)}
                className="shrink-0 cursor-pointer rounded border px-2 py-0.5 text-[10px]"
                style={{ background: accent.bg, borderColor: accent.border, color: accent.textSoft }}
              >
                {actionLabel}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SkillStatusTag({ status }: { status: AvailableSkill["status"] }) {
  const color =
    status === "active"
      ? { bg: "rgba(74,222,128,0.15)", border: "rgba(74,222,128,0.40)", text: "rgb(74,222,128)" }
      : status === "draft"
        ? { bg: "rgba(220,150,0,0.15)", border: "rgba(220,150,0,0.40)", text: "rgb(220,150,0)" }
        : { bg: "rgba(120,120,120,0.15)", border: "rgba(120,120,120,0.30)", text: "rgb(170,170,170)" };
  return (
    <span
      className="rounded-sm border px-1 py-px text-[9px] uppercase tracking-wide"
      style={{ background: color.bg, borderColor: color.border, color: color.text }}
    >
      {status}
    </span>
  );
}
