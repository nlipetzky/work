// SOP registry — slice-1 hand-authored.
//
// Adds new SOPs by importing their bundle and appending to `SOPS` below.
// The projection-ui /operate route enumerates this list.

import { launchOutboundForVentureSop } from "./launch-outbound-for-venture";
import type { SopBundle } from "./types";

export const SOPS: SopBundle[] = [
  launchOutboundForVentureSop,
];

// Index by sop_id for fast lookup from the detail route.
export const SOPS_BY_ID: Record<string, SopBundle> = Object.fromEntries(
  SOPS.map((b) => [b.sop.sop_id, b]),
);

export type { SopBundle } from "./types";
export * from "./types";
