import { getClient } from '@/lib/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ClusterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient();

  const [clusterRes, itemsRes] = await Promise.allSettled([
    client.clusters.get(id),
    client.clusters.items.list(id),
  ]);

  if (clusterRes.status === 'rejected') {
    return (
      <div className="text-red-400 text-xs">
        Failed to load cluster: {clusterRes.reason?.message}
      </div>
    );
  }

  const cluster = clusterRes.value.cluster;
  const items = itemsRes.status === 'fulfilled' ? itemsRes.value.items : [];

  return (
    <div>
      <div className="mb-1">
        <Link href="/clusters" className="text-xs text-gray-500 hover:text-gray-300">
          ← Clusters
        </Link>
      </div>
      <h1 className="text-base font-semibold mb-1 text-gray-200">{cluster.name}</h1>
      <div className="text-xs text-gray-500 mb-4">
        {cluster.slug} · {cluster.visibility}
        {cluster.description && ` · ${cluster.description}`}
      </div>

      {cluster.tags?.length > 0 && (
        <div className="flex gap-1 mb-4">
          {cluster.tags.map((t) => (
            <span key={t} className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">
              {t}
            </span>
          ))}
        </div>
      )}

      <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">
        Items ({items.length})
      </h2>

      {items.length === 0 && (
        <div className="text-gray-600 text-xs">No items in this cluster.</div>
      )}

      <div className="flex flex-col gap-2 max-w-2xl">
        {items.map((item) => (
          <div key={item.id} className="border border-gray-800 rounded p-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xs font-medium">{item.source_type}</span>
              <span className="text-xs text-gray-600">{item.status}</span>
            </div>
            {item.title && <div className="text-xs text-gray-400 mt-0.5">{item.title}</div>}
            {item.note && <div className="text-xs text-gray-500 mt-1 italic">{item.note}</div>}
            {item.pinned_excerpt && (
              <div className="text-xs text-gray-500 mt-2 border-l border-gray-700 pl-2">
                {item.pinned_excerpt.slice(0, 200)}
              </div>
            )}
            <div className="text-xs text-gray-700 mt-1">{item.added_at?.slice(0, 10)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
