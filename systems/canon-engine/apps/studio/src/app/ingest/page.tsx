'use client';

import { useState } from 'react';

type Source = 'emails' | 'transcripts' | 'documents' | 'all';

interface TriggerResult {
  source: Source;
  triggered: boolean;
  pid: number;
  error?: string;
}

export default function IngestPage() {
  const [results, setResults] = useState<TriggerResult[]>([]);
  const [loading, setLoading] = useState<Source | null>(null);

  async function trigger(source: Source) {
    setLoading(source);
    try {
      const res = await fetch(`/api/ingest/${source}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResults((prev) => [
        { source, triggered: data.triggered, pid: data.pid },
        ...prev.filter((r) => r.source !== source),
      ]);
    } catch (e) {
      setResults((prev) => [
        { source, triggered: false, pid: 0, error: e instanceof Error ? e.message : String(e) },
        ...prev.filter((r) => r.source !== source),
      ]);
    } finally {
      setLoading(null);
    }
  }

  const SOURCES: { key: Source; label: string; desc: string }[] = [
    { key: 'emails', label: 'Emails', desc: 'Fetch + ingest Gmail threads' },
    { key: 'transcripts', label: 'Transcripts', desc: 'Fetch + ingest Meet transcripts from Drive' },
    { key: 'documents', label: 'Documents', desc: 'Fetch + ingest Drive documents' },
    { key: 'all', label: 'All sources', desc: 'Run all three ingest pipelines' },
  ];

  return (
    <div>
      <h1 className="text-base font-semibold mb-2 text-gray-200">Ingest</h1>
      <div className="text-xs text-gray-500 mb-6">
        Trigger GWS ingest pipelines. Runs execute asynchronously in the background.
      </div>
      <div className="flex flex-col gap-3 max-w-md">
        {SOURCES.map(({ key, label, desc }) => {
          const result = results.find((r) => r.source === key);
          return (
            <div key={key} className="border border-gray-800 rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-200 text-xs font-medium">{label}</div>
                  <div className="text-gray-600 text-xs">{desc}</div>
                </div>
                <button
                  onClick={() => trigger(key)}
                  disabled={loading !== null}
                  className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 px-3 py-1.5 rounded transition-colors"
                >
                  {loading === key ? 'Triggering...' : 'Trigger'}
                </button>
              </div>
              {result && (
                <div className={`text-xs mt-2 ${result.error ? 'text-red-400' : 'text-green-400'}`}>
                  {result.error
                    ? `Error: ${result.error}`
                    : `Triggered · pid ${result.pid}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
