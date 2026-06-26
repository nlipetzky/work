/**
 * Canon Engine — Concrete DocumentEnricher using Claude API.
 *
 * Implements the DocumentEnricher DI interface from document-ingest.ts.
 * Sends document text to Claude and extracts structured DocumentEnrichment.
 *
 * Prompt source priority:
 *   1. EnrichmentConfig from Airtable (if provided and valid)
 *   2. Hardcoded SYSTEM_PROMPT / buildUserPrompt (fallback)
 */

import type { ClaudeClient } from './claude-client.js';
import type { DocumentEnricher, DocumentEnrichment } from '../document-ingest.js';
import { renderTemplate } from './enrichment-config.js';
import type { EnrichmentConfig } from './enrichment-config.js';

// ---------------------------------------------------------------------------
// Hardcoded fallback prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert document analyst. Given a document (PDF, text, or other format), extract structured information.

Return a JSON object with exactly these fields:
- summary: A 3-6 sentence summary of the document's purpose, content, and key takeaways.
- keyPoints: A bullet-pointed list of the most important points or findings.
- topics: An array of 2-6 topic tags (lowercase, short phrases) that categorize this document.
- title: A clean, descriptive title for the document (use the provided title if it is clear; otherwise infer one).

Return ONLY valid JSON, no markdown fences or extra text.`;

function buildUserPrompt(
  documentText: string,
  context: { title?: string; account?: string; fileType?: string },
): string {
  const parts: string[] = [];

  if (context.title) parts.push(`Document title: ${context.title}`);
  if (context.account) parts.push(`Account: ${context.account}`);
  if (context.fileType) parts.push(`File type: ${context.fileType}`);

  parts.push('');
  parts.push(documentText.slice(0, 18_000)); // Cap input length

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a DocumentEnricher backed by a ClaudeClient.
 *
 * @param claude  Claude API client
 * @param config  Optional Airtable-sourced enrichment config. When provided,
 *                its systemPrompt and userPromptTemplate override the hardcoded
 *                defaults. Falls back to hardcoded prompts if config is null/undefined.
 */
export function createDocumentEnricher(
  claude: ClaudeClient,
  config?: EnrichmentConfig | null,
): DocumentEnricher {
  return {
    async enrichDocument(
      documentText,
      context,
    ): Promise<DocumentEnrichment> {
      const systemPrompt = config?.systemPrompt ?? SYSTEM_PROMPT;

      let userPrompt: string;
      if (config?.userPromptTemplate) {
        userPrompt = renderTemplate(config.userPromptTemplate, {
          document: documentText.slice(0, config.maxInputTokens ?? 18_000),
          title: context?.title ?? '',
          account: context?.account ?? '',
          fileType: context?.fileType ?? '',
        });
      } else {
        userPrompt = buildUserPrompt(documentText, context ?? {});
      }

      const result = await claude.completeJSON<DocumentEnrichment>({
        system: systemPrompt,
        user: userPrompt,
        maxTokens: 1024,
      });

      const rawKeyPoints = result.keyPoints;
      const keyPoints = Array.isArray(rawKeyPoints)
        ? (rawKeyPoints as string[]).map((p: string) => `• ${p}`).join('\n')
        : (rawKeyPoints ?? '');

      return {
        summary: result.summary ?? '',
        keyPoints,
        topics: Array.isArray(result.topics) ? result.topics : [],
        title: result.title ?? context?.title ?? '',
      };
    },
  };
}
