/**
 * Canon document type classifications.
 * From Knowledge Platform Contract v2, Section 1.3.
 */

/** Canon types — governance content */
export type CanonType =
  | "constraint"
  | "decision"
  | "protocol"
  | "anti-pattern"
  | "commitment"
  | "framework"
  | "glossary"
  | "schema"
  | "agent-role"
  | "principle";

/** Artifact types — execution output */
export type ArtifactType = "artifact" | "report" | "deliverable" | "analysis";

/** Implementation spec types — build instructions */
export type SpecType = "implementation-spec" | "migration-spec";

/** All valid document types */
export type CanonDocumentType = CanonType | ArtifactType | SpecType;

/**
 * Document lifecycle status.
 * From Knowledge Platform Contract v2, Section 6.1.
 *
 * Lifecycle: draft → in-review → accepted → superseded
 *                              ↘ rejected (terminal)
 */
export type CanonStatus = "draft" | "in-review" | "accepted" | "superseded" | "rejected";

/** Change frequency classification */
export type Volatility = "stable" | "low" | "moderate" | "high";
