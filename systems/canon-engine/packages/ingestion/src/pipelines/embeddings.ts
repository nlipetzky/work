/**
 * @aos/pipelines — Embedding generation for Supabase pgvector.
 *
 * Uses OpenAI text-embedding-3-small (1536 dimensions) to generate
 * embeddings for chunk text before inserting into the chunks table.
 *
 * Replaces Pinecone's integrated embedding — we now embed explicitly.
 */

export interface EmbeddingClient {
  /** Generate embeddings for one or more texts. Returns one vector per input. */
  embed(texts: string[]): Promise<number[][]>;
}

/**
 * Create an embedding client using the OpenAI embeddings API.
 */
export function createEmbeddingClient(apiKey: string): EmbeddingClient {
  return {
    async embed(texts: string[]): Promise<number[][]> {
      if (texts.length === 0) return [];

      // OpenAI supports batching up to 2048 inputs per request.
      // For safety, batch in groups of 100.
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < texts.length; i += 100) {
        const batch = texts.slice(i, i + 100);
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: batch,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`OpenAI embeddings API error (${response.status}): ${text}`);
        }

        const data = (await response.json()) as {
          data: Array<{ embedding: number[]; index: number }>;
        };

        // Sort by index to maintain order
        const sorted = data.data.sort((a, b) => a.index - b.index);
        for (const item of sorted) {
          allEmbeddings.push(item.embedding);
        }
      }

      return allEmbeddings;
    },
  };
}

/**
 * Format a vector for Supabase pgvector insertion.
 * pgvector expects a string like '[0.1,0.2,0.3]'.
 */
export function formatVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
