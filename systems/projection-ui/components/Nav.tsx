"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Primary surfaces — the daily-driver cockpit set (mirrors the /operate design's
// four-tab shell). Operate is the hinge; the rest of the system-specific views
// live under "Details" below as raw-data inspectors you can always jump to.
const PRIMARY = [
  { href: "/work", label: "Work" },
  { href: "/operate", label: "Operate" },
  { href: "/system", label: "System" },
  { href: "/records", label: "Records" },
];

// Detail surfaces — raw-data views. Kept as their own tabs (not cut) so there's
// always a place to go look at exactly what the underlying data looks like.
const DETAILS = [
  { href: "/build", label: "Build" },
  { href: "/demand", label: "Demand" },
  { href: "/targeting", label: "Targeting" },
  { href: "/prospects", label: "Prospects" },
  { href: "/runs", label: "Runs" },
  { href: "/duplicates", label: "Duplicates" },
  { href: "/gaps", label: "Gaps" },
  { href: "/staging", label: "Staging" },
  { href: "/context", label: "Context" },
  { href: "/expert-liaison", label: "Expert Liaison" },
  { href: "/outreach", label: "Outreach" },
];

export default function Nav() {
  const path = usePathname();

  const item = (l: { href: string; label: string }) => {
    const active = path.startsWith(l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        className={`rounded px-3 py-2 text-sm ${
          active ? "bg-ink-700 text-white" : "text-muted hover:bg-ink-800 hover:text-white"
        }`}
      >
        {l.label}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-1 p-3">
      <div className="px-2 pb-3 text-sm font-semibold tracking-wide text-muted">
        PROJECTION
        <div className="text-[10px] font-normal text-ink-600">revops-engine-dev</div>
      </div>

      {PRIMARY.map(item)}

      <div className="mt-4 flex items-center gap-2 px-3 pb-1 pt-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">
          Details · raw data
        </span>
        <span className="h-px flex-1 bg-ink-700" />
      </div>

      {DETAILS.map(item)}
    </nav>
  );
}
