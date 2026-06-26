/**
 * Canon Engine — Concrete EmailEnricher using Claude API.
 *
 * Implements the EmailEnricher DI interface from email-ingest.ts.
 */

import type { EmailEnricher, EmailMessage, EmailEnrichment } from '../email-ingest.js';
import type { LLMClient } from './claude-client.js';

const SYSTEM_PROMPT = `You are an expert email analyst for a consulting firm. Given email thread messages, extract structured information.

Return a JSON object with exactly these fields:
- threadSummary: A 2-3 sentence summary of the email thread's purpose and current status.
- topics: An array of 2-5 topic tags (lowercase, short phrases) that categorize this thread.
- keyDecisions: A bullet-pointed list of decisions made or agreed upon (or empty string if none).
- actionItems: A bullet-pointed list of action items with owners if mentioned (or empty string if none).
- urgency: A number from 0 to 1 indicating time-sensitivity. 1.0 = needs response today, 0.7 = this week, 0.4 = eventually, 0.0 = no time pressure at all.
- importance: A number from 0 to 1 indicating consequence to revenue, relationships, or strategic goals. 1.0 = deal-critical or relationship-defining, 0.7 = meaningful business impact, 0.4 = routine but relevant, 0.0 = noise or irrelevant.
- classificationRationale: A single sentence explaining why you rated urgency and importance this way.

Return ONLY valid JSON, no markdown fences or extra text.`;

function buildUserPrompt(messages: EmailMessage[], existingSummary?: string): string {
  const lines: string[] = [];

  if (existingSummary) {
    lines.push(`Existing thread summary: ${existingSummary}`, '');
  }

  lines.push('Email messages:');
  for (const msg of messages) {
    lines.push(
      `From: ${msg.from}`,
      `To: ${msg.to.join(', ')}`,
      `Subject: ${msg.subject}`,
      `Date: ${msg.date}`,
      `Body:\n${msg.bodyText.slice(0, 3000)}`,
      '---',
    );
  }

  return lines.join('\n');
}

export function createEmailEnricher(claude: LLMClient): EmailEnricher {
  return {
    async enrichThread(messages: EmailMessage[], existingSummary?: string): Promise<EmailEnrichment> {
      const result = (await claude.completeJSON({
        system: SYSTEM_PROMPT,
        user: buildUserPrompt(messages, existingSummary),
        maxTokens: 1280,
      })) as Record<string, unknown>;

      return {
        threadSummary: (result.threadSummary as string) ?? '',
        topics: Array.isArray(result.topics) ? (result.topics as string[]) : [],
        keyDecisions: (result.keyDecisions as string) ?? '',
        actionItems: (result.actionItems as string) ?? '',
        urgency: typeof result.urgency === 'number' ? Math.max(0, Math.min(1, result.urgency)) : 0.5,
        importance: typeof result.importance === 'number' ? Math.max(0, Math.min(1, result.importance)) : 0.5,
        classificationRationale: (result.classificationRationale as string) ?? '',
      };
    },
  };
}
