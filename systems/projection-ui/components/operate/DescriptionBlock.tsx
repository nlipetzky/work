"use client";

import type { AccentTokens } from "@/lib/operate/mode-features";
import { SectionHeading } from "@/components/operate/SectionHeading";

// Description section. Read-only <p> in RUN; bound <textarea> in ITERATE/BUILD.
// `what` is the activity's one-liner (always shown as the source of truth);
// `description` is the longer editable field (canon.sop_activities.description,
// often null today → honest "no description authored yet").

export function DescriptionBlock({
  what,
  value,
  editable,
  accent,
  onChange,
}: {
  what: string;
  value: string;
  editable: boolean;
  accent: AccentTokens;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <SectionHeading tail={editable ? "(editable)" : undefined} accent={accent}>
        Description
      </SectionHeading>
      {editable ? (
        <textarea
          className="w-full resize-y rounded border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:outline-none"
          style={{ borderColor: accent.border, minHeight: 64 }}
          value={value}
          placeholder={what || "Describe what this activity does…"}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : value ? (
        <p className="text-sm leading-relaxed text-white">{value}</p>
      ) : (
        <p className="text-sm leading-relaxed text-muted">
          {what || <span className="italic">no description authored yet</span>}
        </p>
      )}
    </div>
  );
}
