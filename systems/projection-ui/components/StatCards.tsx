"use client";

export interface Stat {
  label: string;
  value: string | number;
  tone?: "default" | "ok" | "warn" | "bad";
}

const TONE: Record<string, string> = {
  default: "text-white",
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
};

export default function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="min-w-[140px] flex-1 rounded-lg border border-ink-700 bg-ink-800 px-4 py-3"
        >
          <div className="text-xs text-muted">{s.label}</div>
          <div className={`mt-1 text-2xl font-semibold ${TONE[s.tone ?? "default"]}`}>
            {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
