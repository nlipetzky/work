// Deterministic triage: does a contact need a daily touch, and with what intent?
// Shared by the function and the validator so they agree.
import type { Contact } from "./airtable.js";

export type Intent = "advance" | "nurture" | "none";

export function assess(c: Contact): { attn: boolean; intent: Intent; daysSince: number } {
  const last = c.recent[0];
  const daysSince = last ? Math.floor((Date.now() - new Date(last.date).getTime()) / 86_400_000) : 999;
  // Ball in our court -> we owe them a move.
  if (c.waitingOn === "Us") return { attn: true, intent: "advance", daysSince };
  // Gone quiet -> nudge if there's an open item, otherwise a warm/insightful touch.
  if (daysSince > 5) return { attn: true, intent: c.nextAction ? "advance" : "nurture", daysSince };
  return { attn: false, intent: "none", daysSince };
}
