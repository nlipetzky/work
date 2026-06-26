/**
 * Canon document status lifecycle enforcement.
 * From Knowledge Platform Contract v2, Section 9.1.
 *
 * Lifecycle state machine:
 *   draft → in-review → accepted → superseded
 *                     ↘ rejected (terminal)
 *
 * Rules:
 * - Only valid transitions are allowed
 * - 'rejected' and 'superseded' are terminal — no transitions out
 * - A document can go from 'accepted' to 'superseded' (when replaced)
 * - Self-transitions (same status) are allowed (idempotent updates)
 */

import type { CanonStatus } from '../types/canon-types/index.js';

// ---------------------------------------------------------------------------
// Transition matrix
// ---------------------------------------------------------------------------

/**
 * Valid status transitions. Key = current status, Value = set of allowed next statuses.
 * Self-transitions are implicitly allowed (not in the map).
 */
const VALID_TRANSITIONS: ReadonlyMap<CanonStatus, ReadonlySet<CanonStatus>> = new Map([
  ['draft', new Set<CanonStatus>(['in-review'])],
  ['in-review', new Set<CanonStatus>(['accepted', 'rejected'])],
  ['accepted', new Set<CanonStatus>(['superseded'])],
  ['superseded', new Set<CanonStatus>([])],  // terminal
  ['rejected', new Set<CanonStatus>([])],     // terminal
]);

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface LifecycleValidationResult {
  valid: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/**
 * Validate a status transition for a Canon document.
 *
 * @param currentStatus - The document's current status (from previous sync or null for new docs)
 * @param newStatus - The proposed new status (from frontmatter)
 * @param filePath - Vault-relative path (for error context)
 * @returns Validation result with error message if invalid
 */
export function validateStatusTransition(
  currentStatus: CanonStatus | null,
  newStatus: CanonStatus,
  filePath: string,
): LifecycleValidationResult {
  // New document — any valid status is allowed (typically 'draft')
  if (currentStatus === null) {
    return { valid: true };
  }

  // Self-transition — always allowed (idempotent)
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  const allowed = VALID_TRANSITIONS.get(currentStatus);
  if (!allowed) {
    return {
      valid: false,
      error: `Unknown current status '${currentStatus}' for ${filePath}`,
    };
  }

  if (!allowed.has(newStatus)) {
    const allowedList = allowed.size > 0 ? [...allowed].join(', ') : '(none — terminal status)';
    return {
      valid: false,
      error: `Invalid status transition '${currentStatus}' → '${newStatus}' for ${filePath}. Allowed from '${currentStatus}': ${allowedList}`,
    };
  }

  return { valid: true };
}

/**
 * Check if a status is terminal (no further transitions allowed).
 */
export function isTerminalStatus(status: CanonStatus): boolean {
  return status === 'rejected' || status === 'superseded';
}
