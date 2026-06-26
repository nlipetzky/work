import { getClient } from '@/lib/client';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; rerank?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const query = sp.q?.trim() ?? '';
  const rerank = sp.rerank === '1';
  const sourceType = sp.type ?? '';

  type ChunkResult = Awaited<ReturnType<ReturnType<typeof getClient>['search']>>['results'][number];
  let results: ChunkResult[] = [];
  let err: string | null = null;
  let reranked = false;

  if (query) {
    try {
      const client = getClient();
      const res = await client.search({
        query,
        limit: 20,
        rerank,
        sourceTypes: sourceType ? [sourceType] : undefined,
      });
      results = res.results;
      reranked = res.reranked;
    } catch (e) {
      err = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <div>
      <h1 className="text-base font-semibold mb-4 text-gray-200">Search</h1>
      <form className="flex gap-2 mb-6 max-w-2xl" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search canon knowledge..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
        />
        <select
          name="type"
          defaultValue={sourceType}
          className="bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-gray-400 text-xs"
        >
          <option value="">All types</option>
          <option value="email">email</option>
          <option value="transcript">transcript</option>
          <option value="document">document</option>
          <option value="canon_doc">canon_doc</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
          <input type="checkbox" name="rerank" value="1" defaultChecked={rerank} />
          Rerank
        </label>
        <button
          type="submit"
          className="bg-gray-700 hover:bg-gray-600 text-gray-200 rounded px-3 py-1.5 text-xs transition-colors"
        >
          Search
        </button>
      </form>

      {err && <div className="text-red-400 text-xs mb-4">{err}</div>}

      {query && results.length === 0 && !err && (
        <div className="text-gray-500 text-xs">No results for &quot;{query}&quot;</div>
      )}

      {results.length > 0 && (
        <div className="text-xs text-gray-600 mb-3">
          {results.length} results {reranked ? '(reranked)' : '(by RRF)'}
        </div>
      )}

      <div className="flex flex-col gap-3 max-w-2xl">
        {results.map((r) => (
          <div key={r.chunk_id} className="border border-gray-800 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-300 text-xs font-medium">{r.title || r.source_id}</span>
              <span className="text-xs text-gray-600">{r.source_type}</span>
            </div>
            <div className="text-xs text-gray-400 leading-relaxed">
              {r.chunk_text.slice(0, 300)}
              {r.chunk_text.length > 300 && '...'}
            </div>
            <div className="text-xs text-gray-700 mt-1.5">
              score {r.rrf_score.toFixed(4)}
              {r.meeting_date && ` · ${r.meeting_date}`}
              {r.speaker && ` · ${r.speaker}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
