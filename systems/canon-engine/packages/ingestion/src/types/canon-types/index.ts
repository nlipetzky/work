/**
 * @instig8/canon-types
 *
 * Shared type definitions for the Canon Engine Knowledge Platform Contract v2.
 * This package is the code manifestation of the contract at:
 *   canon/instig8/architecture/knowledge-platform-contract.md
 *
 * Both the Canon Engine and consumer systems (AOS, RevOps Engine, etc.)
 * depend on this package to ensure agreement on data shapes.
 */

export { CONTRACT_VERSION } from "./contract.js";

export type {
  CanonDocumentType,
  CanonType,
  ArtifactType,
  SpecType,
  CanonStatus,
  Volatility,
} from "./document-types.js";

export type {
  CanonFrontmatter,
  CanonFrontmatterRequired,
  CanonFrontmatterOptional,
} from "./frontmatter.js";

export type {
  CanonFileEntry,
  ChangeType,
  CanonChange,
  CanonChangeSet,
} from "./changes.js";

export type {
  Obligation,
  ObligationPriority,
  ObligationStatus,
  ObligationRegister,
  EngagementType,
} from "./obligations.js";
