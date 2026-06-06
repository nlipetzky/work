"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import Drawer from "@/components/Drawer";
import ColumnInspector from "@/components/ColumnInspector";
import StatCards from "@/components/StatCards";
import type { Entity, ListResult, RecordDetail, ColumnInspectorResult } from "@/lib/types";

export default function RecordsPage() {
  const [entity, setEntity] = useState<Entity>("companies");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("updated_at");
  const [desc, setDesc] = useState(true);

  const [data, setData] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [drawer, setDrawer] = useState<{ loading: boolean; detail: RecordDetail | null }>({
    loading: false,
    detail: null,
  });
  const [inspector, setInspector] = useState<{ loading: boolean; data: ColumnInspectorResult | null }>({
    loading: false,
    data: null,
  });
  const [inspectorOpen, setInspectorOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams({
        entity,
        search: debounced,
        page: String(page),
        pageSize: "50",
        sort,
        desc: String(desc),
      });
      const res = await fetch(`/api/records?${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "load failed");
      setData(json);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, [entity, debounced, page, sort, desc]);

  useEffect(() => {
    load();
  }, [load]);

  const openDrawer = async (row: Record<string, unknown>) => {
    setDrawer({ loading: true, detail: null });
    try {
      const res = await fetch(`/api/records/detail?entity=${entity}&id=${row.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDrawer({ loading: false, detail: json });
    } catch {
      setDrawer({ loading: false, detail: null });
    }
  };

  const openInspector = async (column: string) => {
    setInspectorOpen(true);
    setInspector({ loading: true, data: null });
    try {
      const res = await fetch(`/api/records/columns?entity=${entity}&column=${encodeURIComponent(column)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setInspector({ loading: false, data: json });
    } catch {
      setInspector({ loading: false, data: null });
      setInspectorOpen(false);
    }
  };

  const onSort = (col: string) => {
    if (col === sort) setDesc((d) => !d);
    else {
      setSort(col);
      setDesc(true);
    }
    setPage(0);
  };

  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 50;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Records</h1>
        <div className="flex overflow-hidden rounded border border-ink-700">
          {(["companies", "contacts"] as Entity[]).map((e) => (
            <button
              key={e}
              onClick={() => {
                setEntity(e);
                setPage(0);
                setSort("updated_at");
              }}
              className={`px-3 py-1 text-sm ${
                entity === e ? "bg-accent text-black" : "bg-ink-800 text-muted hover:text-white"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <StatCards
        stats={[
          { label: `Total ${entity} (exact)`, value: total },
          { label: "Columns shown", value: data?.columns.length ?? 0 },
          { label: "Showing", value: `${from}–${to}` },
          { label: "Page", value: `${page + 1} / ${totalPages}` },
        ]}
      />

      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder={`Search ${entity}…`}
          className="w-80 rounded border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        {loading && <span className="text-xs text-muted">loading…</span>}
        {err && <span className="text-xs text-bad">{err}</span>}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded border border-ink-700 px-2 py-1 disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            disabled={to >= total}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-ink-700 px-2 py-1 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {data && (
          <DataTable
            columns={data.columns}
            rows={data.rows}
            sort={sort}
            desc={desc}
            onSort={onSort}
            onInspect={openInspector}
            onRowClick={openDrawer}
          />
        )}
      </div>

      <Drawer
        detail={drawer.detail}
        loading={drawer.loading}
        onClose={() => setDrawer({ loading: false, detail: null })}
      />
      {inspectorOpen && (
        <ColumnInspector
          data={inspector.data}
          loading={inspector.loading}
          onClose={() => {
            setInspectorOpen(false);
            setInspector({ loading: false, data: null });
          }}
        />
      )}
    </div>
  );
}
