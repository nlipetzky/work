#!/usr/bin/env node
/**
 * export-send-list.mjs — package the QUALIFIED prospects into a channel-ready send list.
 *
 * One row per reachable contact (has a verified-ish email OR a LinkedIn URL) at a verdict='qualified'
 * company, with the personalization columns the copy layer / HeyReach / email tool consume. Writes a
 * CSV to the engagement's exports/ folder and prints channel-readiness counts. Supabase stays the
 * source of truth; this is a load-ready snapshot. CONTAINS CONTACT PII — keep exports/ gitignored.
 *
 * Usage: node scripts/export-send-list.mjs [engagement_type] [engagement_id] [--out PATH]
 */
import { createClient } from "@supabase/supabase-js";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const WORK_ROOT = "/Users/nplmini/code/work";
for (const line of (await readFile(path.join(WORK_ROOT, ".env"), "utf8")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.REVOPS_SUPABASE_URL, process.env.REVOPS_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ET = argv[0] && !argv[0].startsWith("--") ? argv[0] : "venture";
const EID = argv[1] && !argv[1].startsWith("--") ? argv[1] : "konstellation-cipo";
const OUT = flag("out", `${WORK_ROOT}/accounts/ventures/${EID}/exports/cipo-send-list.csv`);

const csv = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

async function load() {
  const out = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("prospects")
      .select("company_name, domain, signal, enrichment, verdict")
      .eq("engagement_type", ET).eq("engagement_id", EID).eq("verdict", "qualified")
      .range(from, from + PAGE - 1);
    if (error) { console.error(error.message); break; }
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

const cols = ["company", "domain", "tier", "taba_ceiling_usd", "award_end_date", "nih_institute",
  "project_title", "total_nih_awards", "contact_name", "title", "role", "persona_tier",
  "email", "email_status", "email_score", "linkedin", "channel"];
const rows = [cols.join(",")];
let companies = 0, contacts = 0, emailReady = 0, liReady = 0, both = 0;

for (const p of await load()) {
  companies++;
  const q = p.enrichment?.qualify || {}, nih = p.enrichment?.nih || {}, taba = p.enrichment?.taba || {};
  for (const c of (p.enrichment?.contacts || [])) {
    const emailOk = c.email && /valid|accept_all/i.test(c.verif || "");
    const liOk = !!c.linkedin;
    if (!emailOk && !liOk) continue;
    const channel = emailOk && liOk ? "both" : emailOk ? "email" : "linkedin";
    contacts++; if (emailOk) emailReady++; if (liOk) liReady++; if (emailOk && liOk) both++;
    rows.push([
      p.company_name, p.domain, q.tier, taba.ceiling_usd, (nih.project_end_date || "").slice(0, 10),
      nih.institute?.abbr, nih.project_title || p.signal?.projectTitle, nih.trajectory?.total_awards,
      [c.first, c.last].filter(Boolean).join(" "), c.position, c.role || "", c.tier,
      c.email, c.verif, c.email_score, c.linkedin, channel,
    ].map(csv).join(","));
  }
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, rows.join("\n"), "utf8");
console.log(`\n▸ send-list export: ${companies} qualified companies · ${contacts} reachable contacts`);
console.log(`  email-ready (valid/accept_all): ${emailReady} · LinkedIn-ready: ${liReady} · both channels: ${both}`);
console.log(`  written: ${OUT}\n`);
