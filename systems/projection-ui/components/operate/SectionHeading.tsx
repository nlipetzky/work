"use client";

import type { AccentTokens } from "@/lib/operate/mode-features";

// The repeated uppercase section label in the activity-detail card. Optional
// `tail` (e.g. "(editable)", "· learn from past") renders in the mode accent.

export function SectionHeading({
  children,
  tail,
  accent,
}: {
  children: React.ReactNode;
  tail?: string;
  accent?: AccentTokens;
}) {
  return (
    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-600">
      {children}
      {tail && (
        <span className="ml-1.5 font-normal" style={{ color: accent?.text }}>
          {tail}
        </span>
      )}
    </h3>
  );
}
