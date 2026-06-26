import { fnCanonChunksHybridSearch } from '@canon-engine/db';
import { rerankDocuments } from '@canon-engine/core';
import { getDb } from '../lib/db.js';
import { embedQuery } from '../lib/embed.js';
import { makeRouter } from '../lib/router.js';

const app = makeRouter();

app.post('/', async (c) => {
  const body = await c.req.json<{
    query: string;
    limit?: number;
    sourceTypes?: string[];
    clusterId?: string;
    rerank?: boolean;
  }>();

  if (!body.query?.trim()) {
    return c.json({ error: 'query is required' }, 400);
  }

  const consumer = c.req.header('X-Canon-Consumer') ?? 'unknown';
  const limit = body.limit ?? 20;
  const shouldRerank = body.rerank ?? false;

  const embedding = await embedQuery(body.query);

  const results = await fnCanonChunksHybridSearch(getDb(), {
    queryText: body.query,
    queryEmbedding: embedding,
    limit: shouldRerank ? Math.min(limit * 3, 60) : limit,
    sourceTypes: body.sourceTypes,
  });

  if (shouldRerank && results.length > 0) {
    const docs = results.map((r) => r.chunk_text);
    const { indices, reranked, reason } = await rerankDocuments(getDb(), body.query, docs, {
      consumer,
      topK: limit,
    });

    if (reranked) {
      const rerankedResults = indices.slice(0, limit).map((i) => results[i]);
      return c.json({ results: rerankedResults, reranked: true, consumer });
    }

    console.warn(`[search] rerank fail-open: ${reason ?? 'unknown'}`);
  }

  return c.json({ results: results.slice(0, limit), reranked: false, consumer });
});

export default app;
