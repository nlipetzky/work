/**
 * Canon document frontmatter schema.
 * From Knowledge Platform Contract v2, Sections 1.1 and 1.2.
 *
 * Extracted from AOS packages/pipelines/src/canon-sync.ts
 */

import type { CanonDocumentType, CanonStatus, Volatility } from "./document-types.js";

/** Required fields — every Canon document must have these */
export interface CanonFrontmatterRequired {
  title: string;
  type: CanonDocumentType;
  status: CanonStatus;
  workspace_account: string;
}

/** Optional fields — may be present on any document */
export interface CanonFrontmatterOptional {
  client?: string;
  project?: string;
  owner?: string;
  volatility?: Volatility;
  confidence?: number;
  source_events?: string[];
  source_context?: string;
  created?: string;
  updated?: string;
  superseded_by?: string;
  tags?: string[];
}

/**
 * Full Canon frontmatter interface.
 *
 * Consumers MUST reject documents missing required fields.
 * Consumers SHOULD accept documents with unknown optional fields (forward compatibility).
 * Consumers MUST NOT invent fields not in this schema when writing.
 */
export interface CanonFrontmatter extends CanonFrontmatterRequired, CanonFrontmatterOptional {}
