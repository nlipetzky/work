import { getClient } from '@/lib/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ClustersPage() {
  const client = getClient();
  let clusters: Awaited<ReturnType<typeof client.clusters.list>>['clusters'] = [];
  let err: string | null = null;
  try {
    const res = await client.clusters.list();
    clusters = res.clusters;
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  return (
    <div>
      <h1 className="text-base font-semibold mb-6 text-gray-200">Clusters</h1>
      {err && <div className="text-red-400 mb-4 text-xs">{err}</div>}
      {clusters.length === 0 && !err && (
        <div className="text-gray-500 text-xs">No clusters yet.</div>
      )}
      <div className="flex flex-col gap-2 max-w-2xl">
        {clusters.map((c) => (
          <Link
            key={c.id}
            href={`/clusters/${c.id}`}
            className="block border border-gray-800 rounded p-3 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-200">{c.name}</span>
              <span className="text-xs text-gray-500">{c.visibility}</span>
            </div>
            {c.description && (
              <div className="text-xs text-gray-500 mt-1">{c.description}</div>
            )}
            {c.tags?.length > 0 && (
              <div className="flex gap-1 mt-2">
                {c.tags.map((t) => (
                  <span key={t} className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
