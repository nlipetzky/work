/**
 * Canon Engine — Concrete TranscriptEnricher using Claude API.
 *
 * Implements the TranscriptEnricher DI interface from transcript-ingest.ts.
 * Sends transcript text + context to Claude and extracts structured LLMEnrichment.
 */

import type { TranscriptEnricher, LLMEnrichment } from '../transcript-ingest.js';

interface LLMClient {
  completeJSON(params: {
    system: string;
    user: string;
    maxTokens: number;
  }): Promise<any>;
}

const SYSTEM_PROMPT = `You are an expert meeting analyst. Given a transcript, extract structured information.

Return a JSON object with exactly these fields:
- summary: A 2-4 sentence summary of the meeting's key points and outcomes.
- keyDecisions: A bullet-pointed list of decisions made (or empty string if none).
- actionItems: A bullet-pointed list of action items with owners if mentioned (or empty string if none).
- topics: An array of 2-6 topic tags (lowercase, short phrases) that categorize this meeting.

Return ONLY valid JSON, no markdown fences or extra text.`;

function buildUserPrompt(
  transcriptText: string,
  context: {
    client: string;
    participants: string[];
    meetingType: string;
  },
): string {
  const lines = [
    `Meeting type: ${context.meetingType}`,
    `Client: ${context.client}`,
    `Participants: ${context.participants.join(', ')}`,
    '',
    'Transcript:',
    transcriptText.slice(0, 12_000), // Cap to avoid token overflow
  ];
  return lines.join('\n');
}

/**
 * Create a TranscriptEnricher backed by a ClaudeClient.
 *
 * Note: ClaudeClient is expected to match the LLMClient interface.
 */
export function createTranscriptEnricher(claude: LLMClient): TranscriptEnricher {
  return {
    async enrich(
      transcriptText: string,
      context: {
        client: string;
        participants: string[];
        meetingType: string;
      },
    ): Promise<LLMEnrichment> {
      const result = await claude.completeJSON({
        system: SYSTEM_PROMPT,
        user: buildUserPrompt(transcriptText, context),
        maxTokens: 1024,
      });

      // Validate shape
      return {
        summary: result.summary ?? '',
        keyDecisions: result.keyDecisions ?? '',
        actionItems: result.actionItems ?? '',
        topics: Array.isArray(result.topics) ? result.topics : [],
      };
    },
  };
}
