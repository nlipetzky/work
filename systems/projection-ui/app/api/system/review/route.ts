import { NextResponse } from "next/server";
import { readdirSync, readFileSync, existsSync } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import matter from "gray-matter";
import { loadRegistry } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORK = "/Users/nplmini/code/work";
const ROOT = path.join(WORK, "registry");
const run = promisify(execFile);

export async function GET() {
  const reg = loadRegistry(ROOT);

  const queueDir = path.join(ROOT, "_review");
  const queueErrors: string[] = [];
  const queue = !existsSync(queueDir) ? [] :
    readdirSync(queueDir).filter((f) => f.endsWith(".md")).sort().flatMap((f) => {
      try {
        const { data, content } = matter(readFileSync(path.join(queueDir, f), "utf8"));
        return [{ file: f, type: data.type ?? "decision", system: data.system ?? null,
                  evidence: data.evidence ?? null, proposed: data.proposed ?? "",
                  created: String(data.created ?? ""), body: content.trim() }];
      } catch (e) {
        queueErrors.push(`_review/${f}: ${e instanceof Error ? e.message : String(e)}`);
        return [];
      }
    });

  let diff: { hash: string; date: string; subject: string }[] = [];
  if (reg.lastReviewed) {
    try {
      const { stdout } = await run(
        "git", ["log", `--since=${reg.lastReviewed}`, "--pretty=format:%h|%ad|%s",
                "--date=format:%Y-%m-%d %H:%M", "--", "registry/"],
        { cwd: WORK }
      );
      diff = stdout.split("\n").filter(Boolean).map((l) => {
        const [hash, date, ...s] = l.split("|");
        return { hash, date, subject: s.join("|") };
      });
    } catch { /* empty diff if git fails */ }
  }

  return NextResponse.json({ lastReviewed: reg.lastReviewed, queue, diff, errors: [...reg.errors, ...queueErrors] });
}
