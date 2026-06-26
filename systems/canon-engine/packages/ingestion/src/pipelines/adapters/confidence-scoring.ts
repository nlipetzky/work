/**
 * Canon Engine — Confidence scoring for enrichment.
 * Roadmap item X3. The "Bouncer" pattern from Second Brain notebook.
 *
 * Adds 0-1 confidence scores to enrichment outputs. Items below
 * threshold are flagged for human review instead of being auto-filed.
 *
 * "A missing record is better than an incomplete one."
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfidenceScores {
  /** Overall confidence in the enrichment quality (0-1) */
  overall: number;
  /** Per-field confidence scores */
  fields: {
    summary: number;
    keyDecisions: number;
    actionItems: number;
    topics: number;
  };
}

export interface EnrichmentWithConfidence<T> {
  /** The enrichment data */
  enrichment: T;
  /** Confidence scores for the enrichment */
  confidence: ConfidenceScores;
  /** Whether this passes the confidence threshold */
  passesThreshold: boolean;
  /** If below threshold, the reason for flagging */
  reviewReason?: string;
}

export interface ConfidenceConfig {
  /** Minimum overall confidence to auto-file (default: 0.6) */
  threshold: number;
  /** Minimum per-field confidence — any field below this flags review */
  fieldThreshold: number;
}

const DEFAULT_CONFIG: ConfidenceConfig = {
  threshold: 0.6,
  fieldThreshold: 0.4,
};

// ---------------------------------------------------------------------------
// Confidence evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate confidence of an enrichment result.
 *
 * Uses heuristics to estimate confidence when the LLM doesn't
 * self-report confidence (which is the current state of our enrichers).
 *
 * Heuristics:
 * - Empty fields → 0.0 confidence for that field
 * - Very short summaries (< 50 chars) → low confidence
 * - No topics extracted → low confidence
 * - Action items / key decisions empty → moderate (may legitimately be empty)
 */
export function evaluateConfidence(
  enrichment: {
    summary: string;
    keyDecisions: string;
    actionItems: string;
    topics: string[] | string;
  },
  config: ConfidenceConfig = DEFAULT_CONFIG,
): EnrichmentWithConfidence<typeof enrichment> {
  const scores: ConfidenceScores = {
    overall: 0,
    fields: {
      summary: scoreSummary(enrichment.summary),
      keyDecisions: scoreOptionalField(enrichment.keyDecisions),
      actionItems: scoreOptionalField(enrichment.actionItems),
      topics: scoreTopics(enrichment.topics),
    },
  };

  // Overall = weighted average (summary and topics matter most)
  scores.overall =
    scores.fields.summary * 0.35 +
    scores.fields.topics * 0.25 +
    scores.fields.keyDecisions * 0.2 +
    scores.fields.actionItems * 0.2;

  // Check thresholds
  const belowOverall = scores.overall < config.threshold;
  const belowField = Object.values(scores.fields).some(
    (s) => s < config.fieldThreshold,
  );

  let reviewReason: string | undefined;
  if (belowOverall) {
    reviewReason = `Overall confidence ${scores.overall.toFixed(2)} below threshold ${config.threshold}`;
  } else if (belowField) {
    const lowFields = Object.entries(scores.fields)
      .filter(([, s]) => s < config.fieldThreshold)
      .map(([f]) => f);
    reviewReason = `Low confidence in fields: ${lowFields.join(', ')}`;
  }

  return {
    enrichment,
    confidence: scores,
    passesThreshold: !belowOverall && !belowField,
    reviewReason,
  };
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function scoreSummary(summary: string): number {
  if (!summary || summary.trim().length === 0) return 0;
  if (summary.trim().length < 50) return 0.3;
  if (summary.trim().length < 100) return 0.6;
  return 0.9;
}

function scoreOptionalField(field: string): number {
  // These fields may legitimately be empty (no decisions/actions in a meeting)
  if (!field || field.trim().length === 0) return 0.5; // neutral — absence is acceptable
  if (field.trim().length < 20) return 0.4;
  return 0.85;
}

function scoreTopics(topics: string[] | string): number {
  const arr = Array.isArray(topics) ? topics : (topics || '').split(',').filter(Boolean);
  if (arr.length === 0) return 0.1;
  if (arr.length === 1) return 0.4;
  if (arr.length >= 2 && arr.length <= 6) return 0.9;
  return 0.7; // too many topics might indicate low quality
}
