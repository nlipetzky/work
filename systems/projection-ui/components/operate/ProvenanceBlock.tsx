"use client";

import type { AccentTokens, ModeFeatures, OperateMode } from "@/lib/operate/mode-features";
import type { ActivityComposition } from "@/lib/operate/composition-draft";
import { SectionHeading } from "@/components/operate/SectionHeading";

// Provenance: what the activity consumes → writes. RUN shows the trail (or
// honest "unset" when the canon columns are NULL). ITERATE shows a read-only
// note (provenance is structural → BUILD). BUILD shows editable inputs (inert
// stub this slice; real wiring lands with the artifact-contract migrations).

function Box({ label, value }: { label: string; value: string[] }) {
  return (
    <div className="flex min-w-[140px] flex-col gap-0.5 rounded border border-ink-700 bg-ink-800 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wide text-ink-600">{label}</span>
      {value.length === 0 ? (
        <span className="text-xs italic text-muted">unset</span>
      ) : (
        value.map((v) => (
          <span key={v} className="font-mono text-xs text-white">
            {v}
          </span>
        ))
      )}
    </div>
  );
}

export function ProvenanceBlock({
  composition,
  mode,
  features,
  accent,
  notify,
}: {
  composition: ActivityComposition;
  mode: OperateMode;
  features: ModeFeatures;
  accent: AccentTokens;
  notify: (msg: string) => void;
}) {
  return (
    <div>
      <SectionHeading
        tail={features.provenance_editable ? "(editable)" : undefined}
        accent={accent}
      >
        Provenance
      </SectionHeading>

      {features.provenance_editable ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded border border-ink-700 bg-ink-800 p-3">
            <div className="mb-2 text-[10px] uppercase tracking-wide text-ink-600">Consumes</div>
            <input
              className="w-full rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs font-mono text-white focus:outline-none"
              defaultValue={composition.provenanceConsumes.join(", ")}
              placeholder="source.table"
            />
            <button
              className="mt-2 rounded border border-ink-700 bg-ink-800 px-2 py-0.5 text-[10px] text-muted hover:text-white"
              onClick={() => notify("Edit provenance contract — wiring lands with the artifact migrations")}
            >
              + source
            </button>
          </div>
          <div className="rounded border border-ink-700 bg-ink-800 p-3">
            <div className="mb-2 text-[10px] uppercase tracking-wide text-ink-600">Writes</div>
            <input
              className="w-full rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs font-mono text-white focus:outline-none"
              defaultValue={composition.provenanceWrites.join(", ")}
              placeholder="target.table"
            />
            <button
              className="mt-2 rounded border border-ink-700 bg-ink-800 px-2 py-0.5 text-[10px] text-muted hover:text-white"
              onClick={() => notify("Edit provenance contract — wiring lands with the artifact migrations")}
            >
              + target
            </button>
          </div>
        </div>
      ) : mode === "iterate" ? (
        <div className="rounded border border-dashed border-ink-700 bg-ink-800 px-3 py-3 text-xs italic text-muted">
          Read-only in ITERATE. Changing what an activity consumes / writes is
          structural — switch to BUILD mode.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          <Box label="consumes" value={composition.provenanceConsumes} />
          <span className="text-muted">›</span>
          <Box label="writes" value={composition.provenanceWrites} />
        </div>
      )}
    </div>
  );
}
