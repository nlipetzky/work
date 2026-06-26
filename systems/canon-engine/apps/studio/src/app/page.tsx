import { getClient } from '@/lib/client';

async function getStats() {
  const client = getClient();
  const [clustersRes, voyageUsage] = await Promise.allSettled([
    client.clusters.list(),
    client.voyage.usage(),
  ]);
  return {
    clusterCount: clustersRes.status === 'fulfilled' ? clustersRes.value.clusters.length : null,
    voyage: voyageUsage.status === 'fulfilled' ? voyageUsage.value : null,
  };
}

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="border border-gray-800 rounded p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg text-white">{value ?? '—'}</div>
    </div>
  );
}

export default async function OverviewPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-base font-semibold mb-6 text-gray-200">Overview</h1>
      <div className="grid grid-cols-2 gap-4 max-w-lg mb-8">
        <Stat label="Clusters" value={stats.clusterCount} />
        <Stat
          label="Voyage today"
          value={stats.voyage ? `$${stats.voyage.today_spend_usd.toFixed(4)}` : null}
        />
        <Stat
          label="Voyage budget"
          value={stats.voyage ? `$${stats.voyage.daily_budget_usd}` : null}
        />
        <Stat
          label="Budget exhausted"
          value={stats.voyage ? (stats.voyage.budget_exhausted ? 'YES' : 'no') : null}
        />
      </div>
      <div className="text-xs text-gray-600">
        Canon Engine API → {process.env.CANON_API_URL ?? 'http://localhost:3334'}
      </div>
    </div>
  );
}
