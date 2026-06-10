import type { ReactNode } from "react";

const TONE: Record<string, string> = {
  live: "bg-emerald-900/60 text-emerald-300", operating: "bg-emerald-900/60 text-emerald-300",
  connected: "bg-emerald-900/60 text-emerald-300", tested: "bg-emerald-900/60 text-emerald-300",
  evaled: "bg-emerald-900/60 text-emerald-300", defined: "bg-emerald-900/60 text-emerald-300",
  manual: "bg-amber-900/60 text-amber-300", handmade: "bg-amber-900/60 text-amber-300",
  building: "bg-amber-900/60 text-amber-300", drafted: "bg-amber-900/60 text-amber-300",
  built: "bg-sky-900/60 text-sky-300",
  unwired: "bg-red-900/60 text-red-300", off: "bg-red-900/60 text-red-300",
  "to-build": "bg-red-900/60 text-red-300", "to-write": "bg-red-900/60 text-red-300",
};

export function StatusChip({ value }: { value: string }) {
  const tone = TONE[value] ?? "bg-ink-800 text-muted";
  return <span className={`rounded px-2 py-0.5 text-xs whitespace-nowrap ${tone}`}>{value}</span>;
}

const LIFE_TONE: Record<string, string> = {
  defined: "bg-ink-800 text-muted", designed: "bg-sky-900/60 text-sky-300",
  architected: "bg-sky-900/60 text-sky-300", engineering: "bg-amber-900/60 text-amber-300",
  operating: "bg-emerald-900/60 text-emerald-300",
};

export function LifecycleChip({ value }: { value: string }) {
  return <span className={`rounded px-2 py-0.5 text-xs ${LIFE_TONE[value] ?? "bg-ink-800 text-muted"}`}>{value}</span>;
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-white">
        {title} {hint && <span className="ml-1 font-normal text-ink-600">{hint}</span>}
      </h2>
      {children}
    </section>
  );
}
