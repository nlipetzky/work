"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Item = { path: string; rel: string };
type TreeNode = { name: string; path?: string; children: Record<string, TreeNode> };

function buildTree(items: Item[]): TreeNode {
  const root: TreeNode = { name: "", children: {} };
  for (const it of items) {
    const parts = it.rel.split("/");
    let node = root;
    parts.forEach((p, i) => {
      if (!node.children[p]) node.children[p] = { name: p, children: {} };
      node = node.children[p];
      if (i === parts.length - 1) node.path = it.path;
    });
  }
  return root;
}

const pretty = (name: string) => name.replace(/\.md$/i, "");

function Tree({
  node, depth, open, toggle, onSelect, selected,
}: {
  node: TreeNode; depth: number;
  open: Set<string>; toggle: (k: string) => void;
  onSelect: (path: string, label: string) => void; selected?: string;
}) {
  const entries = Object.values(node.children).sort((a, b) => {
    const af = !!a.path, bf = !!b.path;
    if (af !== bf) return af ? 1 : -1; // folders before files
    return a.name.localeCompare(b.name);
  });
  return (
    <ul>
      {entries.map((child) => {
        const isFolder = !child.path;
        const key = depth + "/" + child.name + (child.path ?? "");
        const isOpen = open.has(key);
        return (
          <li key={key}>
            {isFolder ? (
              <button
                onClick={() => toggle(key)}
                className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm text-muted hover:bg-ink-800 hover:text-white"
                style={{ paddingLeft: depth * 12 + 8 }}
              >
                <span className="text-ink-600">{isOpen ? "▾" : "▸"}</span>
                <span className="truncate">{child.name}</span>
              </button>
            ) : (
              <button
                onClick={() => onSelect(child.path!, pretty(child.name))}
                className={`flex w-full items-center rounded px-2 py-1 text-left text-sm ${
                  selected === child.path
                    ? "bg-ink-700 text-white"
                    : "text-muted hover:bg-ink-800 hover:text-white"
                }`}
                style={{ paddingLeft: depth * 12 + 22 }}
              >
                <span className="truncate">{pretty(child.name)}</span>
              </button>
            )}
            {isFolder && isOpen && (
              <Tree node={child} depth={depth + 1} open={open} toggle={toggle} onSelect={onSelect} selected={selected} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function ContextPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | undefined>();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    fetch("/api/context/list")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch((e) => setErr(String(e)));
  }, []);

  const tree = useMemo(() => buildTree(items), [items]);

  const toggle = (k: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const select = (path: string) => {
    setSelected(path);
    setContent("");
    setErr("");
    setLoading(true);
    fetch(`/api/playfile?path=${encodeURIComponent(path)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.text();
      })
      .then(setContent)
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex h-full">
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-ink-700 bg-ink-850 p-2">
        <div className="px-2 pb-2 pt-1 text-xs font-semibold tracking-wide text-muted">
          CONTEXT
          <div className="text-[10px] font-normal text-ink-600">accounts/ — {items.length} docs</div>
        </div>
        <Tree node={tree} depth={0} open={open} toggle={toggle} onSelect={(p) => select(p)} selected={selected} />
      </aside>
      <main className="flex-1 overflow-y-auto">
        {!selected && !err && (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Select a document to read.
          </div>
        )}
        {err && !selected && <div className="p-6 text-sm text-bad">{err}</div>}
        {selected && (
          <div className="px-8 py-8">
            <div className="mx-auto mb-5 max-w-[74ch] border-b border-ink-700 pb-2 text-xs text-ink-600">
              {selected.replace("/Users/nplmini/code/work/", "")}
            </div>
            {loading ? (
              <div className="mx-auto max-w-[74ch] text-sm text-muted">Loading…</div>
            ) : err ? (
              <div className="mx-auto max-w-[74ch] text-sm text-bad">{err}</div>
            ) : (
              <article className="md-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </article>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
