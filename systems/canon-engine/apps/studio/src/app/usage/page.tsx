import { getClient } from '@/lib/client';

export const dynamic = 'force-dynamic';

export default async function UsagePage() {
  const client = getClient();
  let usage: Awaited<ReturnType<typeof client.voyage.usage>> | null = null;
  let err: string | null = null;

  try {
    usage = await client.voyage.usage();
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  const pct = usage
    ? Math.min(100, (usage.today_spend_usd / usage.daily_budget_usd) * 100)
    : 0;

  return (
    <div>
      <h1 className="text-base font-semibold mb-2 text-gray-200">Voyage Usage</h1>
      <div className="text-xs text-gray-500 mb-6">Daily embedding + rerank spend.</div>

      {err && <div className="text-red-400 text-xs mb-4">{err}</div>}

      {usage && (
        <div className="max-w-sm">
          <div className="border border-gray-800 rounded p-4 mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Today</span>
              <span>${usage.today_spend_usd.toFixed(4)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2">
              <div
                className={`h-1.5 rounded-full ${usage.budget_exhausted ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Budget: ${usage.daily_budget_usd}</span>
              <span>Remaining: ${usage.remaining_usd.toFixed(4)}</span>
            </div>
          </div>

          {usage.budget_exhausted && (
            <div className="text-xs text-red-400 border border-red-900 rounded p-2">
              Budget exhausted — rerank calls will fail-open (unranked results returned).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
