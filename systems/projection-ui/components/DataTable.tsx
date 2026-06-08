"use client";

import { classifyValue } from "@/lib/validity";
import { toCell } from "@/lib/format";

export interface DataTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
  sort?: string;
  desc?: boolean;
  onSort?: (col: string) => void;
  onInspect?: (col: string) => void;
  onRowClick?: (row: Record<string, unknown>) => void;
  rowKey?: (row: Record<string, unknown>, i: number) => string;
  showRowNumbers?: boolean;
  startIndex?: number;
}

function Cell({ value }: { value: unknown }) {
  const v = classifyValue(value);
  if (v === "empty") return <span className="text-ink-600">—</span>;
  if (v === "placeholder") {
    return (
      <span className="text-warn" title="Placeholder sentinel — NOT real data. Naive checks miscount this as filled.">
        ⚠ {toCell(value)}
      </span>
    );
  }
  return <span className="cell-clip inline-block align-bottom">{toCell(value)}</span>;
}

export default function DataTable({
  columns,
  rows,
  sort,
  desc,
  onSort,
  onInspect,
  onRowClick,
  rowKey,
  showRowNumbers,
  startIndex = 0,
}: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink-700">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-ink-850">
          <tr>
            {showRowNumbers && (
              <th className="sticky left-0 z-20 border-b border-ink-700 bg-ink-850 px-3 py-2 text-right font-medium text-ink-600">
                #
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap border-b border-ink-700 px-3 py-2 text-left font-medium text-muted"
              >
                <span className="inline-flex items-center gap-1">
                  <button
                    className="hover:text-white"
                    onClick={() => onSort?.(c)}
                    title="Sort by this column"
                  >
                    {c}
                    {sort === c ? (desc ? " ↓" : " ↑") : ""}
                  </button>
                  {onInspect && (
                    <button
                      className="text-ink-600 hover:text-accent"
                      onClick={() => onInspect(c)}
                      title="Open the hood — how this column is produced"
                    >
                      ⌕
                    </button>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={rowKey ? rowKey(r, i) : (r.id as string) ?? i}
              className="cursor-pointer border-b border-ink-800 hover:bg-ink-800"
              onClick={() => onRowClick?.(r)}
            >
              {showRowNumbers && (
                <td className="sticky left-0 z-10 bg-ink-900 px-3 py-1.5 text-right text-ink-600">
                  {startIndex + i + 1}
                </td>
              )}
              {columns.map((c) => (
                <td key={c} className="whitespace-nowrap px-3 py-1.5">
                  <Cell value={r[c]} />
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (showRowNumbers ? 1 : 0)} className="px-3 py-8 text-center text-muted">
                No rows.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
