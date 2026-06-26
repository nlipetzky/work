/**
 * Change detection types for Canon vault snapshots.
 * From Knowledge Platform Contract v2, Sections 4.1–4.3.
 *
 * Extracted from AOS packages/pipelines/src/canon-watcher.ts
 */

/**
 * A single file entry in a vault snapshot.
 * Each entry contains the file path and a content hash for change detection.
 */
export interface CanonFileEntry {
  /** Vault-relative path (e.g., "/instig8/governance/three-tiered-architecture.md") */
  filePath: string;
  /** SHA-256 content hash, truncated to 16 hex chars */
  contentHash: string;
  /** Optional: full file content for supersession detection */
  content?: string;
}

/** Types of changes between vault snapshots */
export type ChangeType = "added" | "modified" | "deleted" | "superseded";

/**
 * A single change event.
 * Emitted when Canon content changes between snapshots.
 */
export interface CanonChange {
  type: ChangeType;
  /** Vault-relative file path */
  filePath: string;
  /** Present only for 'superseded' type — vault-relative path of the replacing document */
  supersededBy?: string;
}

/**
 * Complete change set between two vault snapshots.
 * Categorized by change type for consumer convenience.
 */
export interface CanonChangeSet {
  added: CanonChange[];
  modified: CanonChange[];
  deleted: CanonChange[];
  superseded: CanonChange[];
}
