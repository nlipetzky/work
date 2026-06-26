import Anthropic from '@anthropic-ai/sdk';
import { clusterChatTurns, canonClusters, fnClusterHybridSearch } from '@canon-engine/db';
import type { ClusterSearchRow } from '@canon-engine/db';
import { rerankDocuments } from '@canon-engine/core';
import { getDb } from '../lib/db.js';
import { embedQuery } from '../lib/embed.js';
import { makeRouter } from '../lib/router.js';

const app = makeRouter();

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_TOP_K = 10;
const DEFAULT_RETRIEVE = 60;

function ndjsonLine(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

function buildSystemPrompt(chunks: ClusterSearchRow[]): string {
  const blocks = chunks
    .map((ch, i) => {
      const meta = [ch.title, ch.source_type, ch.meeting_date].filter(Boolean).join(' · ');
      return `[${i + 1}] ${meta}\n${ch.chunk_text}`;
    })
    .join('\n\n---\n\n');

  return [
    'You are a knowledgeable assistant with access to organizational knowledge.',
    'Answer questions using ONLY the provided context below.',
    'If the answer is not in the context, say so clearly.',
    'When referencing information, mention the source title.',
    '',
    '## Context',
    blocks,
  ].join('\n');
}

// POST /api/canon/clusters/:id/chat
app.post('/', async (c) => {
  const clusterId = c.req.param('id')!;
  const consumer = c.req.header('X-Canon-Consumer') ?? 'unknown';

  const body = await c.req.json<{
    query: string;
    session_id?: string;
    top_k?: number;
    rerank?: boolean;
    model?: string;
  }>();

  if (!body.query?.trim()) {
    return c.json({ error: 'query is required' }, 400);
  }

  const db = getDb();

  const cluster = await canonClusters.get(db, clusterId);
  if (!cluster) {
    return c.json({ error: 'cluster not found' }, 404);
  }

  const sessionId = body.session_id ?? crypto.randomUUID();
  const topK = body.top_k ?? DEFAULT_TOP_K;
  const model = body.model ?? DEFAULT_MODEL;
  const shouldRerank = body.rerank ?? false;

  // Load prior turns + embed + retrieve — all can throw; catch here to return proper error
  let priorTurns: Awaited<ReturnType<typeof clusterChatTurns.listBySession>>;
  let chunks: ClusterSearchRow[];
  try {
    priorTurns = body.session_id
      ? await clusterChatTurns.listBySession(db, clusterId, sessionId)
      : [];

    const embedding = await embedQuery(body.query);
    chunks = await fnClusterHybridSearch(db, {
      clusterId,
      queryText: body.query,
      queryEmbedding: embedding,
      limit: shouldRerank ? Math.min(topK * 3, DEFAULT_RETRIEVE) : topK,
    });

    if (shouldRerank && chunks.length > 0) {
      const docs = chunks.map((ch) => ch.chunk_text);
      const { indices, reranked } = await rerankDocuments(db, body.query, docs, {
        consumer,
        topK,
      });
      if (reranked) {
        chunks = indices.slice(0, topK).map((i) => chunks[i]);
      }
    }
    chunks = chunks.slice(0, topK);
  } catch (err) {
    console.error('[chat] pre-stream error:', err);
    return c.json(
      { error: err instanceof Error ? err.message : JSON.stringify(err) },
      500,
    );
  }

  const systemPrompt = buildSystemPrompt(chunks);

  const messages: Anthropic.MessageParam[] = [
    ...priorTurns.map((t) => ({
      role: t.role as 'user' | 'assistant',
      content: t.content,
    })),
    { role: 'user' as const, content: body.query },
  ];

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Emit all context chunks as citations before streaming starts
        for (const ch of chunks) {
          controller.enqueue(
            ndjsonLine({
              type: 'citation',
              chunk_id: ch.chunk_id,
              title: ch.title,
              source_type: ch.source_type,
              source_id: ch.source_id,
            }),
          );
        }

        // Stream Claude response
        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;

        const claudeStream = anthropic.messages.stream({
          model,
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        });

        for await (const event of claudeStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullText += event.delta.text;
            controller.enqueue(ndjsonLine({ type: 'token', text: event.delta.text }));
          } else if (event.type === 'message_start') {
            inputTokens = event.message.usage.input_tokens;
          } else if (event.type === 'message_delta' && event.usage) {
            outputTokens = event.usage.output_tokens;
          }
        }

        controller.enqueue(
          ndjsonLine({ type: 'usage', input_tokens: inputTokens, output_tokens: outputTokens }),
        );

        // Persist both turns
        await clusterChatTurns.insert(db, {
          cluster_id: clusterId,
          session_id: sessionId,
          role: 'user',
          content: body.query,
          model,
        });

        const citationPayload = chunks.map((ch) => ({
          chunk_id: ch.chunk_id,
          title: ch.title,
          source_type: ch.source_type,
          source_id: ch.source_id,
        }));

        const assistantTurn = await clusterChatTurns.insert(db, {
          cluster_id: clusterId,
          session_id: sessionId,
          role: 'assistant',
          content: fullText,
          model,
          citations: citationPayload,
          token_usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        });

        controller.enqueue(
          ndjsonLine({ type: 'done', session_id: sessionId, turn_id: assistantTurn.id }),
        );

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[chat] stream error:', msg);
        controller.enqueue(ndjsonLine({ type: 'error', message: msg }));
        controller.close();
      }
    },
  });

  c.header('Content-Type', 'application/x-ndjson');
  c.header('X-Session-Id', sessionId);
  return c.body(readable);
});

// GET /api/canon/clusters/:id/chat/sessions
app.get('/sessions', async (c) => {
  const clusterId = c.req.param('id')!;
  const sessions = await clusterChatTurns.listSessions(getDb(), clusterId);
  return c.json({ sessions });
});

// GET /api/canon/clusters/:id/chat/sessions/:sessionId
app.get('/sessions/:sessionId', async (c) => {
  const clusterId = c.req.param('id')!;
  const sessionId = c.req.param('sessionId')!;
  const turns = await clusterChatTurns.listBySession(getDb(), clusterId, sessionId);
  return c.json({ turns });
});

// DELETE /api/canon/clusters/:id/chat/sessions/:sessionId
app.delete('/sessions/:sessionId', async (c) => {
  const clusterId = c.req.param('id')!;
  const sessionId = c.req.param('sessionId')!;
  await clusterChatTurns.deleteSession(getDb(), clusterId, sessionId);
  return c.json({ ok: true });
});

export default app;
