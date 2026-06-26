/**
 * Canon frontmatter validation.
 * From Knowledge Platform Contract v2, Section 4.
 *
 * Validates that Canon documents have all required frontmatter fields
 * and that field values are valid members of their respective unions.
 * Rejects documents with missing or invalid required fields instead of
 * silently defaulting — "a missing record is better than an incomplete one."
 */

import type {
  CanonFrontmatter,
  CanonDocumentType,
  CanonStatus,
} from '../types/canon-types/index.js';

// ---------------------------------------------------------------------------
// Valid value sets (must stay in sync with @instig8/canon-types)
// ---------------------------------------------------------------------------

const VALID_CANON_TYPES: ReadonlySet<string> = new Set<CanonDocumentType>([
  'constraint', 'decision', 'protocol', 'anti-pattern', 'commitment',
  'framework', 'glossary', 'schema', 'agent-role', 'principle',
  'artifact', 'report', 'deliverable', 'analysis',
  'implementation-spec', 'migration-spec',
]);

const VALID_STATUSES: ReadonlySet<string> = new Set<CanonStatus>([
  'draft', 'in-review', 'accepted', 'superseded', 'rejected',
]);

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  /** The validated frontmatter — only present if valid */
  frontmatter?: CanonFrontmatter;
}

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/**
 * Validate raw parsed frontmatter against the Canon schema.
 *
 * Required fields (Contract Section 4): title, type, status, workspace_account.
 * Consumers MUST reject documents missing required fields.
 * Consumers SHOULD accept documents with unknown optional fields (forward compat).
 *
 * @param raw - The raw key-value object from YAML frontmatter parsing
 * @param filePath - Vault-relative path (for error context)
 * @returns ValidationResult with errors or validated frontmatter
 */
export function validateFrontmatter(
  raw: Record<string, unknown>,
  filePath: string,
): ValidationResult {
  const errors: ValidationError[] = [];

  // --- Required fields ---

  const title = raw.title;
  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: `Missing or empty required field 'title' in ${filePath}` });
  }

  const type = raw.type;
  if (typeof type !== 'string' || type.trim().length === 0) {
    errors.push({ field: 'type', message: `Missing or empty required field 'type' in ${filePath}` });
  } else if (!VALID_CANON_TYPES.has(type)) {
    errors.push({ field: 'type', message: `Invalid document type '${type}' in ${filePath}. Valid: ${[...VALID_CANON_TYPES].join(', ')}` });
  }

  const status = raw.status;
  if (typeof status !== 'string' || status.trim().length === 0) {
    errors.push({ field: 'status', message: `Missing or empty required field 'status' in ${filePath}` });
  } else if (!VALID_STATUSES.has(status)) {
    errors.push({ field: 'status', message: `Invalid status '${status}' in ${filePath}. Valid: ${[...VALID_STATUSES].join(', ')}` });
  }

  // workspace_account can come from either 'workspace_account' or 'org' field
  const workspaceAccount = raw.workspace_account ?? raw.org;
  if (typeof workspaceAccount !== 'string' || workspaceAccount.trim().length === 0) {
    errors.push({ field: 'workspace_account', message: `Missing or empty required field 'workspace_account' (or 'org') in ${filePath}` });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // --- Build validated frontmatter ---

  const frontmatter: CanonFrontmatter = {
    title: (title as string).trim(),
    type: type as CanonDocumentType,
    status: status as CanonStatus,
    workspace_account: (workspaceAccount as string).trim(),
    client: typeof raw.client === 'string' ? raw.client : undefined,
    project: typeof raw.project === 'string' ? raw.project : undefined,
    owner: typeof raw.owner === 'string' ? raw.owner : undefined,
    volatility: undefined, // optional, validated below
    confidence: typeof raw.confidence === 'number' ? raw.confidence : undefined,
    source_events: Array.isArray(raw.source_events) ? raw.source_events as string[] : undefined,
    source_context: typeof raw.source_context === 'string' ? raw.source_context : undefined,
    created: typeof raw.created === 'string' ? raw.created : undefined,
    updated: typeof raw.updated === 'string' ? raw.updated : undefined,
    superseded_by: typeof raw.superseded_by === 'string' ? raw.superseded_by : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags as string[] : undefined,
  };

  // Optional: volatility (validate if present)
  if (raw.volatility !== undefined) {
    const vol = raw.volatility as string;
    if (['stable', 'low', 'moderate', 'high'].includes(vol)) {
      frontmatter.volatility = vol as CanonFrontmatter['volatility'];
    }
    // Silently ignore invalid optional values (forward compat)
  }

  return { valid: true, errors: [], frontmatter };
}
