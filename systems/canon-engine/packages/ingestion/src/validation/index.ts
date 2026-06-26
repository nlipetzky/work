/**
 * Canon Engine — Validation module.
 *
 * Enforces the Knowledge Platform Contract v2 governance rules:
 * - Frontmatter schema validation (required fields, valid values)
 * - Status lifecycle enforcement (valid transitions only)
 * - Governance invariant checking (6 invariants from Contract Section 9)
 */

export { validateFrontmatter } from './frontmatter-validator.js';
export type { ValidationError, ValidationResult } from './frontmatter-validator.js';

export { validateStatusTransition, isTerminalStatus } from './lifecycle-validator.js';
export type { LifecycleValidationResult } from './lifecycle-validator.js';

export {
  checkDocumentInvariants,
  runInvariantSuite,
  checkNoCanonEnrichment,
  checkAuthorshipLineage,
  checkAccountBinding,
  checkSupersessionChain,
} from './invariant-checker.js';
export type { InvariantViolation, InvariantCheckResult } from './invariant-checker.js';

export {
  runGovernanceScan,
  findStaleDrafts,
  findBrokenSupersessionChains,
  findMissingRegisters,
  findOverdueObligations,
} from './governance-scanner.js';
export type { GovernanceFinding, ScanResult, ScanConfig } from './governance-scanner.js';
