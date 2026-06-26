import { getClient } from '@/lib/client';

export const dynamic = 'force-dynamic';

export default async function DocsPage() {
  const client = getClient();
  let docs: Awaited<ReturnType<typeof client.search>>['results'] = [];
  let err: string | null = null;

  try {
    const res = await client.search({ query: '', limit: 50, sourceTypes: ['canon_doc'] });
    docs = res.results;
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  return (
    <div>
      <h1 className="text-base font-semibold mb-2 text-gray-200">Canon Docs</h1>
      <div className="text-xs text-gray-500 mb-6">
        Governance protocols, architecture decisions, obligation registers.
      </div>
      {err && <div className="text-red-400 text-xs mb-4">{err}</div>}
      {docs.length === 0 && !err && (
        <div className="text-gray-500 text-xs">No canon docs found.</div>
      )}
      <div className="flex flex-col gap-2 max-w-2xl">
        {docs.map((doc) => (
          <div key={doc.chunk_id} className="border border-gray-800 rounded p-3">
            <div className="text-gray-300 text-xs font-medium mb-0.5">{doc.title}</div>
            <div className="text-xs text-gray-500 leading-relaxed">
              {doc.chunk_text.slice(0, 200)}
              {doc.chunk_text.length > 200 && '...'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
