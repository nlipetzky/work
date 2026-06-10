import { NextResponse } from "next/server";
import { loadRegistry } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = "/Users/nplmini/code/work/registry";

export async function GET() {
  const reg = loadRegistry(ROOT);
  const systems = reg.systems.map(({ record, warnings }) => ({
    name: record.name, slug: record.slug, home: record.home,
    clusters: record.clusters, class: record.class, lifecycle: record.lifecycle,
    autonomy: record.autonomy, flags: record.flags, stub: record.stub,
    outcome: record.outcome, warnings,
  }));
  return NextResponse.json({ count: systems.length, systems, errors: reg.errors });
}
