"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/demand", label: "Demand" },
  { href: "/records", label: "Records" },
  { href: "/runs", label: "Runs" },
  { href: "/duplicates", label: "Duplicates" },
  { href: "/gaps", label: "Gaps" },
  { href: "/staging", label: "Staging" },
  { href: "/context", label: "Context" },
  { href: "/expert-liaison", label: "Expert Liaison" },
  { href: "/outreach", label: "Outreach" },
  { href: "/system", label: "System" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      <div className="px-2 pb-3 text-sm font-semibold tracking-wide text-muted">
        PROJECTION
        <div className="text-[10px] font-normal text-ink-600">revops-engine-dev</div>
      </div>
      {LINKS.map((l) => {
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
      })}
    </nav>
  );
}
