import { voyageUsageLog } from '@canon-engine/db';
import type { CanonClient } from '@canon-engine/db';

const RERANK_ENDPOINT = 'https://api.voyageai.com/v1/rerank';
const DEFAULT_MODEL = 'rerank-2.5';
const TIMEOUT_MS = 3000;
// Voyage rerank-2.5 pricing placeholder (update when exact rate is published)
const COST_PER_RESULT_USD = 0.0001;

export interface RerankOptions {
  consumer?: string;
  accountId?: string;
  topK?: number;
}

export interface RerankResult {
  indices: number[];
  reranked: boolean;
  reason?: 'timeout' | 'error' | 'budget_exhausted';
}

export async function rerankDocuments(
  db: CanonClient,
  query: string,
  documents: string[],
  opts: RerankOptions = {},
): Promise<RerankResult> {
  const passThrough: RerankResult = {
    indices: documents.map((_, i) => i),
    reranked: false,
  };

  if (documents.length === 0) return passThrough;

  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    console.warn('[voyage] VOYAGE_API_KEY not set — skipping rerank');
    return { ...passThrough, reason: 'error' };
  }

  const model = process.env.VOYAGE_RERANK_MODEL ?? DEFAULT_MODEL;
  const budget = parseFloat(process.env.VOYAGE_DAILY_BUDGET_USD ?? '5');

  // Pre-call budget guard
  const spent = await voyageUsageLog.todaySpend(db);
  if (spent >= budget) {
    console.warn(`[voyage] daily budget exhausted ($${spent.toFixed(4)} / $${budget})`);
    await voyageUsageLog.insert(db, {
      endpoint: 'rerank',
      model,
      result_count: 0,
      request_count: 0,
      cost_usd: 0,
      consumer: opts.consumer ?? null,
      account_id: opts.accountId ?? null,
    });
    return { ...passThrough, reason: 'budget_exhausted' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resp = await fetch(RERANK_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        query,
        documents,
        top_k: opts.topK ?? documents.length,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!resp.ok) {
      throw new Error(`Voyage rerank HTTP ${resp.status}: ${await resp.text()}`);
    }

    const json = (await resp.json()) as {
      results: { index: number; relevance_score: number }[];
    };

    const indices = json.results.map((r) => r.index);
    const resultCount = indices.length;
    const costUsd = resultCount * COST_PER_RESULT_USD;

    await voyageUsageLog.insert(db, {
      endpoint: 'rerank',
      model,
      result_count: resultCount,
      request_count: 1,
      cost_usd: costUsd,
      consumer: opts.consumer ?? null,
      account_id: opts.accountId ?? null,
    });

    return { indices, reranked: true };
  } catch (err) {
    clearTimeout(timer);
    const reason: RerankResult['reason'] =
      err instanceof Error && err.name === 'AbortError' ? 'timeout' : 'error';
    console.warn(`[voyage] rerank fail-open (${reason}):`, err instanceof Error ? err.message : err);
    return { ...passThrough, reason };
  }
}
