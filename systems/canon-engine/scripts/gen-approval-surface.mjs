#!/usr/bin/env node
/**
 * gen-approval-surface.mjs — render ONE self-contained HTML approval surface for the CIPO cohort.
 *
 * Pulls the qualified cohort + contacts + the session's new personalization (NIH science/PHR, award-end
 * timing, funding trajectory, TABA ceiling) and the offer, and emits a clean, single-file HTML doc that
 * shows everything needing sign-off: the offer + lead magnet, the message template + the 5 open flags,
 * the cohort with a per-company personalized preview, and an approval checklist. Self-contained (opens
 * in any browser, shareable with Will). PII inside -> writes to gitignored exports/.
 *
 * Usage: node scripts/gen-approval-surface.mjs [engagement_type] [engagement_id] [--out PATH]
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
const OUT = flag("out", `${WORK_ROOT}/accounts/ventures/${EID}/exports/cipo-approval-surface.html`);

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n) => n == null ? "" : "$" + Number(n).toLocaleString();
const dshort = (s) => (s || "").slice(0, 7); // YYYY-MM
const titleCase = (s) => (s || "").replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());

async function load() {
  const out = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("prospects")
      .select("company_name, domain, signal, enrichment").eq("engagement_type", ET).eq("engagement_id", EID)
      .eq("verdict", "qualified").range(from, from + PAGE - 1);
    if (error) { console.error(error.message); break; }
    out.push(...(data ?? [])); if (!data || data.length < PAGE) break;
  }
  return out;
}

function sciencePhrase(c) {
  let t = c.enrichment?.nih?.project_title || c.signal?.projectTitle || "";
  t = t.replace(/^(development of|developing|design of|a |an |the |novel )/i, "").trim();
  return t.length > 78 ? t.slice(0, 78) + "…" : t;
}
function primaryContact(c) {
  const cs = c.enrichment?.contacts || [];
  return cs.find((x) => x.role === "principal_investigator") || cs.find((x) => x.tier === 1) || cs[0] || {};
}
// auto-assembled PREVIEW (not final copy) — demonstrates the new personalization tokens woven in
function preview(c) {
  const pc = primaryContact(c);
  const first = pc.first || "there";
  const phase = c.signal?.phase || c.enrichment?.nih?.activity_code || "II";
  const end = dshort(c.enrichment?.nih?.project_end_date);
  const taba = money(c.enrichment?.taba?.ceiling_usd);
  const sci = sciencePhrase(c);
  const tok = (s) => `<mark>${esc(s)}</mark>`;
  const note = `${esc(first)}, your team's NIH-funded work on ${tok(sci)} stood out. With your Phase ${tok(phase)} award running to ${tok(end)} — and up to ${tok(taba)} in TABA you can put toward IP — I'd value comparing notes on your patent position.`;
  const touch = `I'd put together a ${tok("competitor patent-filing teardown")} for ${tok(c.company_name)} — where a competitor's already boxing in your space, and the white space, before your next raise. <b>Just reply ${tok("'yes'")} and I'll get to work — nothing needed from you.</b>`;
  return { note, touch };
}

const companies = (await load()).sort((a, b) =>
  (b.enrichment?.nih?.trajectory?.total_nih_funding || 0) - (a.enrichment?.nih?.trajectory?.total_nih_funding || 0));

const SITE = "https://web-portfolio-seven-tawny.vercel.app/";
// ---- offer (from the locked offer artifacts) ----
const OFFER = {
  leadMagnet: { name: "Competitor Filing Teardown (Option A — Reverse Lead Magnet)", status: "Locked — matches the live site",
    body: "A custom, company-specific teardown of one named competitor's recent patent filings in the prospect's exact technology space — what they've filed, where they're building a wall, and where the white space sits. Reads as 1:1 work spent on them, and surfaces the 'am I exposed?' urgency that pulls them onto a call." },
  variants: [
    { name: "Option B — Single FTO on Lead Product (Loss Leader)", body: "One freedom-to-operate analysis on the lead product, priced to shock vs. a traditional firm." },
    { name: "Option C — IP Velocity Score Read-Out (Trojan Horse)", body: "A single IP Velocity Score (one number across five axes), framed as a benchmarking/diagnostic touch." },
  ],
  core: "IP-intelligence subscription + fractional Chief-IP-Officer advisory — Scout ($2.5K/mo), Shield ($5K/mo), Arsenal ($10K/mo).",
  taba: "Every Phase II NIH awardee has up to $50K of Technical & Business Assistance (TABA) earmarked for outside IP/commercialization help — non-dilutive money that pays for exactly this.",
};
const FLAGS = ["Copy approval (overall voice + claims)", "FDA device claim — needs device/company/year or cut",
  "Hourly-rate anchor ($500–800/hr) — confirm", "Subscription-vs-hourly framing — confirm", "Target-segment lock (deep-tech/biotech primary?)"];
const APPROVALS = [
  { item: "Lead magnet = Competitor Teardown (Option A) — locked, matches site", owner: "Nick", status: "locked" },
  { item: "Offer alignment — email + site both lead with the Teardown", owner: "—", status: "done" },
  { item: "Cold copy v0 + 5 open flags", owner: "Will", status: "pending" },
  { item: "TABA framing — lead with the ~$50K wedge", owner: "Will", status: "pending" },
  { item: "Pricing / tiers (public use)", owner: "Will", status: "pending" },
  { item: "Target cohort (113 companies / 190 contacts)", owner: "Nick", status: "review" },
  { item: "Tier calibration (advisory — Arsenal over-assigned)", owner: "Nick", status: "advisory" },
  { item: "Copy redraft to weave in new personalization", owner: "Copy layer → Hermes flags", status: "todo" },
  { item: "Auto-response copy (the 'after yes' follow-through)", owner: "Copy layer → Hermes flags", status: "todo" },
  { item: "Booking + delivery flow on the site (Shadow CIPO)", owner: "Nick", status: "review" },
];

// ---- channel readiness ----
let nContacts = 0, nEmail = 0, nLi = 0, nBoth = 0;
for (const c of companies) for (const ct of (c.enrichment?.contacts || [])) {
  const e = ct.email && /valid|accept_all/i.test(ct.verif || ""); const l = !!ct.linkedin;
  if (!e && !l) continue; nContacts++; if (e) nEmail++; if (l) nLi++; if (e && l) nBoth++;
}

const pill = (txt, cls) => `<span class="pill ${cls}">${esc(txt)}</span>`;
function renderCompany(c) {
  const n = c.enrichment?.nih || {}, q = c.enrichment?.qualify || {}, tr = n.trajectory || {}, taba = c.enrichment?.taba || {};
  const pv = preview(c);
  const contacts = (c.enrichment?.contacts || []).map((ct) => {
    const e = ct.email && /valid|accept_all/i.test(ct.verif || ""); const ch = e && ct.linkedin ? "both" : e ? "email" : ct.linkedin ? "linkedin" : "none";
    const roleTag = ct.role === "principal_investigator" ? pill("PI", "pi") : ct.role === "co_principal_investigator" ? pill("co-PI", "pi") : ct.tier === 1 ? pill("T1", "t1") : pill("T2", "t2");
    return `<tr>
      <td>${esc([ct.first, ct.last].filter(Boolean).join(" "))} ${roleTag}</td>
      <td>${esc(ct.position || "")}</td>
      <td>${ct.email ? `${esc(ct.email)} ${pill(ct.verif || "?", /valid/i.test(ct.verif||"") ? "ok" : "warn")}` : "<span class='muted'>—</span>"}</td>
      <td>${ct.linkedin ? `<a href="${esc(ct.linkedin)}" target="_blank">in/</a>` : "<span class='muted'>—</span>"}</td>
      <td>${pill(ch, ch)}</td></tr>`;
  }).join("");
  return `<div class="co" data-name="${esc(c.company_name.toLowerCase())}" data-tier="${esc(q.tier||"")}">
    <div class="co-head" onclick="this.parentNode.classList.toggle('open')">
      <div class="co-id"><b>${esc(c.company_name)}</b> <span class="muted">${esc(c.domain||"")}</span></div>
      <div class="co-meta">${pill(q.tier||"—", "tier")} ${pill((n.institute?.abbr||c.signal?.ic||"NIH"), "inst")} ${pill("Phase "+(c.signal?.phase||"?"), "phase")} ${pill("TABA "+money(taba.ceiling_usd), "taba")}</div>
    </div>
    <div class="co-body">
      <div class="grid2">
        <div><div class="lbl">Science (NIH)</div><div class="sci">${esc(n.project_title || c.signal?.projectTitle || "")}</div>
          <div class="phr">${esc((n.phr||"").slice(0,260))}${(n.phr||"").length>260?"…":""}</div></div>
        <div><div class="lbl">Signals</div>
          <ul class="sig">
            <li><b>Award ends</b> ${esc(dshort(n.project_end_date)||"—")} <span class="muted">(timing hook)</span></li>
            <li><b>Trajectory</b> ${esc(tr.total_awards||"?")} NIH awards · ${money(tr.total_nih_funding)} since ${esc(tr.first_fiscal_year||"?")}</li>
            <li><b>TABA</b> up to ${money(taba.ceiling_usd)} non-dilutive for IP</li>
            <li><b>Publications</b> ${esc(n.publications?.count ?? 0)}</li>
          </ul></div>
      </div>
      <div class="verdict"><b>Qualified · ${esc(q.tier||"")}</b> <span class="muted">(${esc(q.entity_type||"")})</span> — ${esc(q.rationale||"")}</div>
      <div class="lbl">Personalized preview <span class="muted">— auto-assembled from captured data; NOT final copy</span></div>
      <div class="msg"><div class="msg-t">LinkedIn connect (Will):</div><p>${pv.note}</p><div class="msg-t">First touch:</div><p>${pv.touch}</p></div>
      <div class="lbl">Contacts</div>
      <table class="ct"><thead><tr><th>Name</th><th>Title</th><th>Email</th><th>LI</th><th>Ch</th></tr></thead><tbody>${contacts}</tbody></table>
    </div></div>`;
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Konstellation CIPO — Outreach Approval (Draft v1)</title><style>
:root{--ink:#1c2433;--mut:#6b7689;--line:#e6e9ef;--bg:#f7f8fa;--card:#fff;--accent:#2d3f6b;--amber:#b7791f;--green:#2f855a;--blue:#2b6cb0}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg)}
a{color:var(--blue)}.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header{background:var(--accent);color:#fff;padding:22px 0}header h1{margin:0;font-size:20px;font-weight:650}
header .sub{opacity:.85;font-size:13px;margin-top:3px}
.hdr-top{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}
.sitebtn{display:inline-flex;align-items:center;gap:8px;background:#f3a93c;color:#1c2433;font-weight:700;font-size:14.5px;padding:13px 22px;border-radius:10px;text-decoration:none;box-shadow:0 3px 12px rgba(0,0,0,.22);white-space:nowrap;transition:background .15s,transform .15s}
.sitebtn:hover{background:#ffc16b;transform:translateY(-1px)}
.stats{display:flex;gap:26px;margin-top:14px;flex-wrap:wrap}.stat b{font-size:22px;display:block}.stat span{font-size:12px;opacity:.85}
nav{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--line);z-index:5}
nav .wrap{display:flex;gap:6px;padding:8px 20px}nav a{padding:8px 14px;border-radius:8px;color:var(--ink);text-decoration:none;font-weight:550;font-size:14px}
nav a:hover{background:var(--bg)}
section{padding:30px 0;border-bottom:1px solid var(--line)}h2{font-size:16px;margin:0 0 14px;letter-spacing:.02em;text-transform:uppercase;color:var(--mut)}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px;margin-bottom:12px}
.card h3{margin:0 0 6px;font-size:15px}.card p{margin:6px 0;color:#2c3647}
.pill{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#eef1f6;color:#475067;vertical-align:middle}
.pill.amber,.pill.pending,.pill.warn{background:#fdf1dd;color:var(--amber)}.pill.green,.pill.ok,.pill.both,.pill.locked,.pill.done{background:#e4f4ec;color:var(--green)}
.pill.tier,.pill.t1,.pill.pi{background:#e9edf7;color:var(--accent)}.pill.email{background:#e3eefb;color:var(--blue)}.pill.linkedin{background:#e9e7fb;color:#5a4bd1}
.pill.review,.pill.advisory,.pill.todo{background:#eef1f6;color:#475067}
.flags li,.appr li{margin:6px 0}.flow{margin:0;padding-left:20px}.flow li{margin:8px 0}.appr{list-style:none;padding:0}.appr li{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:9px 0}
.tools{display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap}.tools input{flex:1;min-width:200px;padding:9px 12px;border:1px solid var(--line);border-radius:8px;font-size:14px}
.fbtn{padding:7px 12px;border:1px solid var(--line);background:#fff;border-radius:8px;cursor:pointer;font-size:13px}.fbtn.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.co{background:#fff;border:1px solid var(--line);border-radius:10px;margin-bottom:8px;overflow:hidden}
.co-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;cursor:pointer}.co-head:hover{background:#fafbfc}
.co-meta{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}
.co-body{display:none;padding:4px 16px 16px;border-top:1px solid var(--line)}.co.open .co-body{display:block}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:12px 0}@media(max-width:680px){.grid2{grid-template-columns:1fr}}
.lbl{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--mut);margin:12px 0 5px;font-weight:600}
.sci{font-weight:550}.phr{color:#475067;font-size:13.5px;margin-top:4px}.sig{margin:0;padding-left:16px;font-size:13.5px}.sig li{margin:3px 0}
.verdict{background:#f3f6fb;border-radius:8px;padding:10px 12px;font-size:13.5px;margin:6px 0}
.msg{background:#fbfbfd;border:1px dashed #d6dbe6;border-radius:8px;padding:12px 14px}.msg p{margin:4px 0 12px}.msg-t{font-size:11px;color:var(--mut);font-weight:600}
mark{background:#fff3cd;padding:0 2px;border-radius:3px}
table.ct{width:100%;border-collapse:collapse;font-size:13px;margin-top:4px}table.ct th{text-align:left;color:var(--mut);font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:1px solid var(--line);padding:6px 8px}
table.ct td{padding:6px 8px;border-bottom:1px solid #f0f2f6}.muted{color:#9aa4b5}
.note{background:#fdf1dd;border:1px solid #f0dcb6;color:#7a5512;border-radius:8px;padding:10px 14px;font-size:13.5px;margin-bottom:14px}
</style></head><body>
<header><div class="wrap"><div class="hdr-top"><div><h1>Konstellation CIPO — Cold Outreach Approval <span style="opacity:.6;font-weight:400">· Draft v1</span></h1>
<div class="sub">Everything to sign off before send · Generated ${esc(new Date().toISOString().slice(0,10))} from live data.</div></div>
<a class="sitebtn" href="${SITE}" target="_blank">🔗 View the Live Site — Shadow CIPO →</a></div>
<div class="stats"><div class="stat"><b>${companies.length}</b><span>qualified companies</span></div>
<div class="stat"><b>${nContacts}</b><span>reachable contacts</span></div>
<div class="stat"><b>${nEmail}</b><span>email-ready</span></div>
<div class="stat"><b>${nLi}</b><span>LinkedIn-ready</span></div>
<div class="stat"><b>${nBoth}</b><span>both channels</span></div></div></div></header>
<nav><div class="wrap"><a href="#offer">Offer</a><a href="#message">Message</a><a href="#follow">Follow-through</a><a href="#cohort">Cohort</a><a href="#approve">Approvals</a></div></nav>
<div class="wrap">
<section id="offer"><h2>The Offer</h2>
<div class="card"><h3>${esc(OFFER.leadMagnet.name)} ${pill(OFFER.leadMagnet.status,"green")}</h3><p>${esc(OFFER.leadMagnet.body)}</p></div>
${OFFER.variants.map((v)=>`<div class="card"><h3>${esc(v.name)} ${pill("variant","")}</h3><p>${esc(v.body)}</p></div>`).join("")}
<div class="card"><h3>Core offer (ladders up to)</h3><p>${esc(OFFER.core)}</p></div>
<div class="card"><h3>TABA wedge ${pill("new this session","green")}</h3><p>${esc(OFFER.taba)}</p></div></section>

<section id="message"><h2>The Message</h2>
<div class="note"><b>Copy status:</b> the existing v0 predates this session's data — it does <b>not</b> include the personalization below. The per-company previews in the cohort are auto-assembled to show what's now available; the real copy redraft is a separate task and routes its flags to Hermes for Will.</div>
<div class="card"><h3>Template (tokens filled per company below)</h3>
<div class="msg"><div class="msg-t">LinkedIn connect (Will):</div><p>{first}, your team's NIH-funded work on <mark>{science}</mark> stood out. With your Phase <mark>{phase}</mark> award running to <mark>{award_end}</mark> — and up to <mark>{taba}</mark> in TABA you can put toward IP — I'd value comparing notes.</p>
<div class="msg-t">First touch:</div><p>I'd put together a <mark>competitor patent-filing teardown</mark> for <mark>{company}</mark> — where a competitor's already boxing in your space, and the white space, before your next raise. <b>Just reply <mark>'yes'</mark> and I'll get to work — nothing needed from you.</b></p></div></div>
<div class="card"><h3>Open flags on copy v0 ${pill("pending Will","amber")}</h3><ul class="flags">${FLAGS.map((f)=>`<li>${esc(f)}</li>`).join("")}</ul></div></section>

<section id="follow"><h2>Follow-Through · what happens after "yes"</h2>
<div class="note"><b>Offer locked:</b> the email, the live site, and this flow all lead with the <b>Competitor Teardown</b> (Option A). The flow below is written around it.</div>
<div class="card"><h3>The ask is one word</h3><p>Every message closes with a single-word reply — <mark>"yes"</mark>. No links to click, no forms, no scheduling friction. Lowest possible commitment: the recipient just replies, and everything else is on us.</p></div>
<div class="card"><h3>Present it live — don't email the report</h3><p>This is a high-ticket, expert-led offer — it closes in a conversation, not an inbox. Email the finished teardown and you get a "thanks" and a ghost: value spent, no path to the sale, and the CIPO judgment (the actual product) never lands. So the teardown's job is to <b>earn the meeting</b>. The guardrail: we still do real work first and prove it with a specific finding, so it's never "book a call to get a mystery freebie."</p></div>
<div class="card"><h3>On "yes" — the flow</h3>
<ol class="flow">
<li><b>Auto-response in minutes</b> (Will's voice): "On it — I'll pull where competitors are already boxing in {company}'s IP." <b>No homework</b> — we don't ask them for a thing.</li>
<li><b>We produce the teardown from data we already hold</b> — their technology + the patent landscape. Zero input required from them; doing the work for them is the whole advantage of the agentic layer.</li>
<li><b>We come back with one specific, real finding</b> (proof the work is real) + a single CTA: 15 minutes to walk the full teardown. The complete analysis, the white space, and Will's read are presented <i>on the call</i> — not emailed.</li>
<li><b>On the call:</b> present it, Will turns the data into "here's what to do before your raise," then transition to the retainer (Scout / Shield / Arsenal).</li>
</ol></div>
<div class="card"><h3>Sample messages <span class="muted">— draft preview, not final copy</span></h3>
<div class="msg"><div class="msg-t">Auto-ack on "yes":</div><p>Thanks <mark>{first}</mark> — on it. I'll pull where competitors are already crowding <mark>{company}</mark>'s IP space and come back with what I find. Nothing needed from you.</p>
<div class="msg-t">Proof + the one CTA (after we do the work):</div><p><mark>{first}</mark> — went through the recent filings around <mark>{company}</mark>'s space. Found a few that crowd your lane, and <mark>one that looks like a real blocking risk</mark> before your next raise. Rather than send a PDF you'll skim, let me walk you through it and the white space — 15 minutes here: <mark>[book link]</mark>.</p></div>
<p class="muted">Booking + the live walkthrough; the site backs it up — <a href="${SITE}" target="_blank">Shadow CIPO ↗</a>.</p></div></section>

<section id="cohort"><h2>The Cohort · ${companies.length} companies</h2>
<div class="tools"><input id="q" placeholder="Search company…" oninput="filt()">
<button class="fbtn on" data-t="" onclick="setT(this)">All</button>
<button class="fbtn" data-t="Scout" onclick="setT(this)">Scout</button>
<button class="fbtn" data-t="Shield" onclick="setT(this)">Shield</button>
<button class="fbtn" data-t="Arsenal" onclick="setT(this)">Arsenal</button></div>
<div id="list">${companies.map(renderCompany).join("")}</div></section>

<section id="approve"><h2>Approval Checklist</h2><ul class="appr">
${APPROVALS.map((a)=>`<li><span>${esc(a.item)}</span><span>${pill(a.owner,"")} ${pill(a.status,a.status)}</span></li>`).join("")}
</ul></section>
</div>
<script>
var T="";
function filt(){var q=(document.getElementById('q').value||'').toLowerCase();
 document.querySelectorAll('.co').forEach(function(el){var okN=el.getAttribute('data-name').indexOf(q)>-1;var okT=!T||el.getAttribute('data-tier')===T;el.style.display=(okN&&okT)?'':'none';});}
function setT(b){T=b.getAttribute('data-t');document.querySelectorAll('.fbtn').forEach(function(x){x.classList.remove('on')});b.classList.add('on');filt();}
</script></body></html>`;

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, html, "utf8");
console.log(`\n▸ approval surface: ${companies.length} companies · ${nContacts} contacts · ${(html.length/1024).toFixed(0)} KB`);
console.log(`  written: ${OUT}\n`);
