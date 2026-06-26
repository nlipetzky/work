/**
 * Canon Engine — Claude API client adapter.
 *
 * Implements the LLMClient interface expected by enricher adapters.
 * Picks up ANTHROPIC_API_KEY from the environment automatically.
 */

import Anthropic from '@anthropic-ai/sdk';

/** Alias for backwards compatibility with document-enricher.ts and other adapters. */
export type ClaudeClient = LLMClient;

export interface LLMClient {
  completeJSON<T = unknown>(params: {
    system: string;
    user: string;
    maxTokens: number;
  }): Promise<T>;
}

export function createClaudeClient(): LLMClient {
  const anthropic = new Anthropic();

  return {
    async completeJSON({ system, user, maxTokens }) {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      });

      let text = message.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('');

      // Strip markdown code fences if Claude wraps the JSON in ```json ... ```
      text = text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }

      return JSON.parse(text);
    },
  };
}
