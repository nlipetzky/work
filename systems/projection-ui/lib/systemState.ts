// System State — the honest evidenced state of a system, computed from EVIDENCE, never from the
// self-reported `status` label. Pure (no DB, no server-only): the single source of truth that the
// /system surface, the planner, and the runner all read. Per system-building-method.md §5
// ("status is a computed property read from live evidence"). The load-bearing rule: asset inventory
// NEVER advances maturity — the ladder climbs on ensured, verified ACTIVITIES.

export type EvidencedRung = "stub" | "emerging" | "building" | "beta" | "operating";

export interface SystemEvidence {
  claimed_status: string | null; // self-reported systems.status
  spec_defined: boolean; // a real spec body exists (not just a one-line purpose)
  has_surface: boolean; // a real, openable projection-UI surface
  activities: number;
  ensured: number; // ensured activities
  verified: number; // ensured activities carrying a verification
  unrouted: number; // non-autonomous activities with no channel
  last_ensured_days: number | null; // min days since an ensured activity was last confirmed
  assets: number;
  assets_reconciled: number;
  triggers: number;
  triggers_wired: number;
  last_reconciled_days: number | null; // null = never reconciled
}

export interface EvidencedState {
  state: EvidencedRung;
  claimed: string | null;
  claim_diverges: boolean; // evidenced rung is BELOW the claimed status rung
  gaps: string[]; // what's missing to advance, surfaced honestly
}

const RUNG: Record<string, number> = { stub: 0, emerging: 1, building: 2, beta: 3, operating: 4 };
const OPERATING_RECENCY_DAYS = 7;
const RECONCILE_STALE_DAYS = 14;

function isOperating(e: SystemEvidence): boolean {
  return (
    e.ensured > 0 &&
    e.verified >= e.ensured &&
    e.triggers_wired > 0 &&
    e.has_surface &&
    e.last_ensured_days !== null &&
    e.last_ensured_days <= OPERATING_RECENCY_DAYS
  );
}

function isBeta(e: SystemEvidence): boolean {
  // requires real run-layer (≥1 ensured activity), assets reconciled, and a way to run it.
  return e.ensured > 0 && (e.assets === 0 || e.assets_reconciled >= e.assets) && (e.has_surface || e.triggers_wired > 0);
}

function computeGaps(e: SystemEvidence): string[] {
  const gaps: string[] = [];
  if (e.activities === 0) gaps.push("no activities defined (the run layer)");
  // asset-rich / activity-poor is the shape that fakes progress — call it out explicitly.
  if (e.assets > 0 && e.activities === 0) gaps.push(`${e.assets} assets, 0 activities defined — inventory, not a run layer`);
  if (e.assets > 0 && e.assets_reconciled < e.assets) gaps.push(`${e.assets - e.assets_reconciled}/${e.assets} assets unreconciled vs live`);
  if (e.triggers_wired === 0) gaps.push("no trigger wired");
  if (e.ensured > 0 && e.unrouted > 0) gaps.push(`${e.unrouted} activit${e.unrouted === 1 ? "y" : "ies"} not routed to a channel`);
  if (!e.has_surface) gaps.push("no surface to run it");
  if (e.ensured > 0 && e.verified < e.ensured) gaps.push(`${e.ensured - e.verified}/${e.ensured} ensured activities have no verification`);
  if (e.assets > 0 && e.last_reconciled_days === null) gaps.push("never reconciled vs live");
  else if (e.last_reconciled_days !== null && e.last_reconciled_days > RECONCILE_STALE_DAYS) gaps.push(`last reconciled ${e.last_reconciled_days}d ago`);
  return gaps;
}

export function evidencedState(e: SystemEvidence): EvidencedState {
  const built = e.activities > 0 || e.assets > 0 || e.triggers > 0;
  let state: EvidencedRung;
  if (!built) state = e.spec_defined ? "emerging" : "stub";
  else if (isOperating(e)) state = "operating";
  else if (isBeta(e)) state = "beta";
  else state = "building"; // built but not yet beta — incl. asset-rich/activity-poor

  const claimedRung = RUNG[(e.claimed_status ?? "").toLowerCase()] ?? 0;
  return {
    state,
    claimed: e.claimed_status,
    claim_diverges: claimedRung > RUNG[state],
    gaps: computeGaps(e),
  };
}

/** Is this system actually runnable (live enough to operate)? Used by the planner/runner gate. */
export function isRunnable(s: EvidencedState): boolean {
  return s.state === "beta" || s.state === "operating";
}
