/**
 * @aos/pipelines — Text chunking utilities.
 *
 * Splits text into chunks of 500–800 tokens (approximated as words * 1.3).
 * Supports speaker-boundary aware splitting for transcripts.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChunkOptions {
  /** Target chunk size in tokens (approximate). Default: 600. */
  targetTokens?: number;
  /** Minimum chunk size in tokens. Default: 200. */
  minTokens?: number;
  /** Maximum chunk size in tokens. Default: 800. */
  maxTokens?: number;
  /** Number of overlap tokens between consecutive chunks. Default: 50. */
  overlapTokens?: number;
}

export interface TextChunk {
  text: string;
  index: number;
  /** Approximate token count. */
  tokenCount: number;
}

export interface SpeakerSegment {
  speaker: string;
  text: string;
}

export interface SpeakerChunk extends TextChunk {
  speaker: string;
}

// ---------------------------------------------------------------------------
// Token estimation
// ---------------------------------------------------------------------------

/**
 * Rough token count: ~1.3 tokens per word for English text.
 * Good enough for chunking; not for billing.
 */
export function estimateTokens(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.ceil(words * 1.3);
}

// ---------------------------------------------------------------------------
// Basic text chunker (paragraphs / sentences)
// ---------------------------------------------------------------------------

/**
 * Chunk plain text by paragraph boundaries, falling back to sentence splits.
 * Used for Canon documents and email bodies.
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {},
): TextChunk[] {
  const {
    targetTokens = 600,
    minTokens = 200,
    maxTokens = 800,
    overlapTokens = 50,
  } = options;

  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const chunks: TextChunk[] = [];
  let currentParts: string[] = [];
  let currentTokens = 0;

  const flush = () => {
    if (currentParts.length === 0) return;
    const chunkText = currentParts.join('\n\n');
    chunks.push({
      text: chunkText,
      index: chunks.length,
      tokenCount: estimateTokens(chunkText),
    });
    // Handle overlap: keep last paragraph if it's small enough
    if (overlapTokens > 0 && currentParts.length > 1) {
      const lastPart = currentParts[currentParts.length - 1];
      const lastTokens = estimateTokens(lastPart);
      if (lastTokens <= overlapTokens) {
        currentParts = [lastPart];
        currentTokens = lastTokens;
        return;
      }
    }
    currentParts = [];
    currentTokens = 0;
  };

  for (const paragraph of paragraphs) {
    const pTokens = estimateTokens(paragraph);

    // If a single paragraph exceeds maxTokens, split by sentences
    if (pTokens > maxTokens) {
      flush();
      const sentenceChunks = splitLongParagraph(paragraph, targetTokens, maxTokens);
      for (const sc of sentenceChunks) {
        chunks.push({
          text: sc,
          index: chunks.length,
          tokenCount: estimateTokens(sc),
        });
      }
      continue;
    }

    // Would adding this paragraph exceed target?
    if (currentTokens + pTokens > targetTokens && currentTokens >= minTokens) {
      flush();
    }

    currentParts.push(paragraph);
    currentTokens += pTokens;
  }

  flush();
  return chunks;
}

/**
 * Split a long paragraph into sentence-level chunks.
 */
function splitLongParagraph(
  text: string,
  targetTokens: number,
  maxTokens: number,
): string[] {
  // Split on sentence endings (.!?) followed by space or end
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
  const result: string[] = [];
  let current = '';
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sTokens = estimateTokens(sentence);

    if (currentTokens + sTokens > maxTokens && current.length > 0) {
      result.push(current.trim());
      current = '';
      currentTokens = 0;
    }

    current += sentence;
    currentTokens += sTokens;

    if (currentTokens >= targetTokens) {
      result.push(current.trim());
      current = '';
      currentTokens = 0;
    }
  }

  if (current.trim().length > 0) {
    result.push(current.trim());
  }

  return result;
}

// ---------------------------------------------------------------------------
// Speaker-aware chunker (transcripts)
// ---------------------------------------------------------------------------

/**
 * Parse transcript text into speaker segments.
 * Expects format: "Speaker Name: text" or "Speaker Name\ntext"
 */
export function parseSpeakerSegments(transcriptText: string): SpeakerSegment[] {
  const lines = transcriptText.split('\n');
  const segments: SpeakerSegment[] = [];
  let currentSpeaker = 'Unknown';
  let currentText = '';

  // Pattern: "Name:" at start of line (with optional timestamp)
  const speakerPattern = /^(?:\[[\d:]+\]\s*)?([A-Za-z][\w\s.'-]+):\s*(.*)$/;

  for (const line of lines) {
    const match = line.match(speakerPattern);
    if (match) {
      // Save previous segment
      if (currentText.trim().length > 0) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
      }
      currentSpeaker = match[1].trim();
      currentText = match[2] || '';
    } else {
      currentText += (currentText.length > 0 ? '\n' : '') + line;
    }
  }

  // Final segment
  if (currentText.trim().length > 0) {
    segments.push({ speaker: currentSpeaker, text: currentText.trim() });
  }

  return segments;
}

/**
 * Chunk transcript with speaker boundaries.
 * Tries to keep speaker turns together; splits when a single turn is too long.
 */
export function chunkTranscript(
  segments: SpeakerSegment[],
  options: ChunkOptions = {},
): SpeakerChunk[] {
  const {
    targetTokens = 600,
    minTokens = 200,
    maxTokens = 800,
  } = options;

  const chunks: SpeakerChunk[] = [];
  let currentParts: SpeakerSegment[] = [];
  let currentTokens = 0;
  let dominantSpeaker = '';

  const flush = () => {
    if (currentParts.length === 0) return;
    const text = currentParts
      .map((s) => `${s.speaker}: ${s.text}`)
      .join('\n\n');
    chunks.push({
      text,
      index: chunks.length,
      tokenCount: estimateTokens(text),
      speaker: dominantSpeaker,
    });
    currentParts = [];
    currentTokens = 0;
    dominantSpeaker = '';
  };

  for (const segment of segments) {
    const sTokens = estimateTokens(segment.text);

    // If a single segment exceeds maxTokens, split it
    if (sTokens > maxTokens) {
      flush();
      const subChunks = chunkText(segment.text, { targetTokens, maxTokens });
      for (const sc of subChunks) {
        chunks.push({
          ...sc,
          index: chunks.length,
          speaker: segment.speaker,
        });
      }
      continue;
    }

    if (currentTokens + sTokens > targetTokens && currentTokens >= minTokens) {
      flush();
    }

    currentParts.push(segment);
    currentTokens += sTokens;

    // Track dominant speaker (most text)
    if (!dominantSpeaker) {
      dominantSpeaker = segment.speaker;
    }
  }

  flush();
  return chunks;
}
