/**
 * Obligation register types.
 * From Knowledge Platform Contract v2, Section 3.
 *
 * Obligation registers are the primary operational interface between
 * the Canon Engine and execution systems (AOS, RevOps Engine, etc.).
 */

/** Priority levels for obligations */
export type ObligationPriority = "P1" | "P2" | "P3";

/** Obligation execution status */
export type ObligationStatus =
  | "not started"
  | "in progress"
  | "complete"
  | "blocked";

/** A single obligation within a register */
export interface Obligation {
  /** Sequential number within the register */
  number: number;
  /** Obligation name/title */
  name: string;
  /** Priority: P1 = highest */
  priority: ObligationPriority;
  /** Target week or date */
  target: string;
  /** Who executes this obligation */
  owner?: string;
  /** Meeting or decision that created this */
  source?: string;
  /** How we know it's done */
  acceptanceCriteria?: string;
  /** Current status */
  status: ObligationStatus;
  /** Optional context */
  notes?: string;
}

/** Engagement type for capacity tracking */
export type EngagementType = "retainer" | "project" | "internal";

/**
 * Parsed obligation register.
 *
 * Located at: canon/{org}/accounts/{account}/{account}-obligations.md
 *
 * The register is the AUTHORITATIVE source for what is owed to an account.
 * It supersedes any downstream system's stale copy.
 */
export interface ObligationRegister {
  /** Account name (derived from file path) */
  account: string;
  /** Weekly hour budget */
  weeklyBudget?: number;
  /** Engagement type */
  engagementType?: EngagementType;
  /** Active obligations */
  obligations: Obligation[];
}
