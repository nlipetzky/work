"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ACCENT_TOKENS, FEATURES, type OperateMode } from "@/lib/operate/mode-features";

// Three-segment mode toggle for /operate. Writes ?mode= so the URL is the source
// of truth. The active accent rotates per mode (blue / amber / purple) so you
// always know which mode you're in without reading the toggle.

const MODES: OperateMode[] = ["run", "iterate", "build"];

export function ModeToggle({
  basePath,
  mode,
}: {
  basePath: string; // e.g. /operate/launch-outbound-for-venture
  mode: OperateMode;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const feat = FEATURES[mode];
  const accent = ACCENT_TOKENS[feat.accent];

  const setMode = useCallback(
    (m: OperateMode) => {
      if (m === mode) return;
      const params = new URLSearchParams(sp.toString());
      params.set("mode", m);
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    },
    [basePath, mode, router, sp],
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-md border border-ink-700 bg-ink-900 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-ink-600">Mode</div>
      <div className="inline-flex rounded-full border border-ink-700 bg-ink-800 p-[3px]">
        {MODES.map((m) => {
          const active = m === mode;
          const mAccent = ACCENT_TOKENS[FEATURES[m].accent];
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="cursor-pointer rounded-full px-4 py-1 text-xs font-medium transition-colors"
              style={
                active
                  ? { background: mAccent.bg, color: mAccent.text }
                  : { color: "#9aa3b2", background: "transparent" }
              }
            >
              {FEATURES[m].label}
            </button>
          );
        })}
      </div>
      <div className="text-[11px] text-ink-600" style={{ color: accent.text, opacity: 0.85 }}>
        {feat.hint}
      </div>
    </div>
  );
}
