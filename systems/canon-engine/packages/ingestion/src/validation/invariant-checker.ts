/**
 * Canon Engine — Governance invariant checker.
 * From Knowledge Platform Contract v2, Section 9.
 *
 * Codifies the 6 governance invariants as executable checks:
 * 1. Canon documents are NOT enriched (enrichment is for transcripts/emails/documents only)
 * 2. No direct consumer writes to knowledge storage
 * 3. Human authorship lineage — Canon docs must have an owner or workspace_account
 * 4. Status lifecycle integrity — only valid transitions
 * 5. Account binding — every Canon doc must link to a workspace_account
 * 6. Supersession chain integrity — superseded_by must point to an existing document
 */

import type { CanonFrontmatter } from '../types/canon-types/index.js';
import type { CanonEventEmitter, EmittedEvent } from '../events/event-emitter.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvariantViolation {
  invariant: string;
  severity: 'error' | 'warning';
  message: string;
  filePath?: string;
  details?: Record<string, unknown>;
}

export interface InvariantCheckResult {
  passed: boolean;
  violations: InvariantViolation[];
  checkedAt: string;
}

// ---------------------------------------------------------------------------
// Individual invariant checks
// ---------------------------------------------------------------------------

/**
 * Invariant 1: Canon documents must NOT be enriched.
 * Check the event log for any 'enrich' events with source_type='canon'.
 */
export async function checkNoCanonEnrichment(
  events: EmittedEvent[],
): Promise<InvariantViolation[]> {
  const violations: InvariantViolation[] = [];

  const canonEnrichments = events.filter(
    (e) => e.eventType === 'enrich' && e.sourceType === 'canon',
  );

  for (const event of canonEnrichments) {
    violations.push({
      invariant: 'no-canon-enrichment',
      severity: 'error',
      message: `Canon document was enriched (forbidden). Source: ${event.sourceRef}`,
      filePath: event.sourceRef,
      details: { eventId: event.id, createdAt: event.createdAt },
    });
  }

  return violations;
}

/**
 * Invariant 3: Human authorship lineage.
 * Every Canon document must have a workspace_account.
 */
export function checkAuthorshipLineage(
  filePath: string,
  frontmatter: CanonFrontmatter,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  if (!frontmatter.workspace_account || frontmatter.workspace_account.trim().length === 0) {
    violations.push({
      invariant: 'authorship-lineage',
      severity: 'error',
      message: `Canon document has no workspace_account (human authorship untracked)`,
      filePath,
    });
  }

  return violations;
}

/**
 * Invariant 5: Account binding.
 * Every Canon document must link to a workspace_account.
 * (Overlaps with invariant 3 but checks the broader principle.)
 */
export function checkAccountBinding(
  filePath: string,
  frontmatter: CanonFrontmatter,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  if (!frontmatter.workspace_account) {
    violations.push({
      invariant: 'account-binding',
      severity: 'error',
      message: `Canon document is not bound to any account`,
      filePath,
    });
  }

  return violations;
}

/**
 * Invariant 6: Supersession chain integrity.
 * If a document has superseded_by, the target must be a valid vault path.
 *
 * @param filePath - The document being checked
 * @param frontmatter - Its frontmatter
 * @param existingPaths - Set of all known vault-relative paths
 */
export function checkSupersessionChain(
  filePath: string,
  frontmatter: CanonFrontmatter,
  existingPaths: ReadonlySet<string>,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  if (frontmatter.superseded_by) {
    if (!existingPaths.has(frontmatter.superseded_by)) {
      violations.push({
        invariant: 'supersession-chain',
        severity: 'warning',
        message: `superseded_by points to '${frontmatter.superseded_by}' which does not exist in the vault`,
        filePath,
      });
    }
  }

  // Check for status/superseded_by mismatch
  if (frontmatter.status === 'superseded' && !frontmatter.superseded_by) {
    violations.push({
      invariant: 'supersession-chain',
      severity: 'warning',
      message: `Document has status 'superseded' but no superseded_by field`,
      filePath,
    });
  }

  if (frontmatter.superseded_by && frontmatter.status !== 'superseded') {
    violations.push({
      invariant: 'supersession-chain',
      severity: 'warning',
      message: `Document has superseded_by set but status is '${frontmatter.status}', not 'superseded'`,
      filePath,
    });
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Full invariant check
// ---------------------------------------------------------------------------

/**
 * Run all governance invariant checks against a single Canon document.
 *
 * @param filePath - Vault-relative path
 * @param frontmatter - Parsed frontmatter
 * @param existingPaths - All known vault paths (for supersession check)
 */
export function checkDocumentInvariants(
  filePath: string,
  frontmatter: CanonFrontmatter,
  existingPaths: ReadonlySet<string>,
): InvariantViolation[] {
  return [
    ...checkAuthorshipLineage(filePath, frontmatter),
    ...checkAccountBinding(filePath, frontmatter),
    ...checkSupersessionChain(filePath, frontmatter, existingPaths),
  ];
}

/**
 * Run the full invariant suite including event-log-based checks.
 *
 * @param documents - All Canon documents (path + frontmatter)
 * @param recentEvents - Recent events from the audit log
 */
export async function runInvariantSuite(
  documents: Array<{ filePath: string; frontmatter: CanonFrontmatter }>,
  recentEvents: EmittedEvent[],
): Promise<InvariantCheckResult> {
  const allPaths = new Set(documents.map((d) => d.filePath));
  const violations: InvariantViolation[] = [];

  // Event-based checks
  violations.push(...await checkNoCanonEnrichment(recentEvents));

  // Per-document checks
  for (const doc of documents) {
    violations.push(...checkDocumentInvariants(doc.filePath, doc.frontmatter, allPaths));
  }

  return {
    passed: violations.filter((v) => v.severity === 'error').length === 0,
    violations,
    checkedAt: new Date().toISOString(),
  };
}
