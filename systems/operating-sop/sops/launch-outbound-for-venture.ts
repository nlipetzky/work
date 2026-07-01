// Launch Outbound for a Venture — hand-authored SOP definition.
//
// VENTURE-AGNOSTIC. The L1 spine + L2 workflow + L3 activities never mention a
// specific engagement. Per-invocation context lives on a SopRun. One SOP : many runs.
//
// 2026-06-30 REWRITE — reverse-engineered from the first real end-to-end run
// (konstellation-cipo). The prior 15-stage spine was built around a Teknova-style
// prep-funnel (purchased-list screen: staging → classify → evidence-gate → promote)
// and assumed ClinicalTrials.gov as the signal and a *blocked* email waterfall.
// The CIPO run validated a leaner, signal-driven path and proved several stages the
// old spine never had. This SOP now encodes the validated path. The purchased-list
// prep-funnel (classify/evidence-gate/promote_staging_batch) is a SEPARATE play that
// lives with revops-engine; it is not part of a signal-driven venture launch.
//
// PRINCIPLES learned on the CIPO run (apply at every run, not just CIPO):
//  P1  The signal source must select FOR the ICP, not against it. ClinicalTrials.gov
//      *sponsors* skew big-pharma; NIH SBIR/STTR awardees are small-business by law.
//      Before committing a source, run a targetability probe on a ~20-row sample
//      (resolve domains + classify entity type) and confirm the hit rate.
//  P2  Mine every source in 3 passes — qualify + PERSONALIZE + TRIGGER — and store the
//      raw specifics on the company/contact (practices/revops/reference/source-mining-doctrine.md).
//  P3  Free / BYO-key providers before paid (Apollo/Hunter/Serper/ZeroBounce in .env;
//      no Deepline). Each enrich stage: --execute-gated, verify on a small --limit
//      sample before the wide run.
//  P4  Follow-through is deliver-first: one-word reply CTA, do the work from data we
//      already hold (no homework), prove it, present the result live (high-ticket
//      closes in a conversation, not an inbox).
//  P5  Cold copy under the expert's name is sourced to the expert's real material,
//      never invented; ships with a source map + a flag list routed to Hermes.

import type { Activity, Sop, SopBundle, SopRun, Workflow } from "./types";

// ─── L3 Activities ─────────────────────────────────────────────────────────
// Runner args use `<engagement>` placeholders that operate-runs.ts substitutes
// from the active SopRun.target_engagement at spawn time. All scripts in
// canon-engine/scripts/; data destination is revops (project mrmnyscurmkfppicqqhk).

const CE = "/Users/nplmini/code/work/systems/canon-engine";
const PID = "mrmnyscurmkfppicqqhk" as const;
const EL = "/Users/nplmini/code/work/systems/expert-liaison-engine";
const CANON = "mzzjvoiwughcnmmqzbxv" as const;

const SIGNAL_WATCH: Activity = {
  activity_id: "signal-watch",
  name: "signal watch (land prospects)",
  what: "Land raw companies into public.prospects from ICP-selecting signal sources. PRIMARY: NIH RePORTER SBIR/STTR awardees (R41-R44, small-business by law). SECONDARY: USPTO small/micro-entity A61 filings. ClinicalTrials.gov is OFF by default (lead-sponsor field skews big-pharma) behind --include-trials. Academic/nonprofit/foreign applicants are dropped at ingest.",
  executor_class: "automated-tool",
  owning_system: "canon-engine",
  owning_system_folder: CE,
  data: { table: "public.prospects", project_id: PID, columns: ["stage='signal'", "company_name", "signal (jsonb)", "recipe_name", "engagement_id"] },
  trigger: { type: "cron", detail: "launchd daily (com.nick.signal-watch). Source must pass the P1 targetability probe before first run." },
  runner: { type: "node-script", path: `${CE}/scripts/watch-signals.mjs`, args: ["venture", "<engagement>", "--since-days", "30"], cwd: CE },
  reads: ["NIH RePORTER v2 API (no key)", "USPTO api.uspto.gov (A61, entityStatusData)", "ClinicalTrials.gov v2 (opt-in)"],
  writes: ["revops public.prospects (record_prospect RPC; dedup on engagement+source+source_ref)"],
  see_it: { surface: "/prospects" },
  change_it: { file: `${CE}/scripts/watch-signals.mjs`, note: "Add/swap signal sources here; each new source gets a disqualifier pass + the P1 probe." },
  static_status: "ok",
  credit_spender: false,
};

const RESOLVE: Activity = {
  activity_id: "resolve-domains",
  name: "resolve domains (slice 1)",
  what: "Resolve each prospect company_name → domain. Local-first (free join vs public.companies) → Apollo org-search (cleaned name) → Serper Google fallback with name-validation. Advances signal → resolved.",
  executor_class: "automated-tool",
  owning_system: "canon-engine",
  owning_system_folder: CE,
  data: { table: "public.prospects", project_id: PID, columns: ["domain", "enrichment.resolve", "stage (signal → resolved)"] },
  trigger: { type: "manual", detail: "node enrich-prospects.mjs venture <engagement> --limit N --execute (PLAN mode free; --execute spends)" },
  runner: { type: "node-script", path: `${CE}/scripts/enrich-prospects.mjs`, args: ["venture", "<engagement>", "--limit", "300", "--execute"], cwd: CE },
  reads: ["public.prospects (stage=signal)", "public.companies (local-first match)", "Apollo mixed_companies/search", "Serper google/search"],
  writes: ["public.prospects.domain", "public.prospects.enrichment.resolve"],
  see_it: { surface: "/prospects" },
  change_it: { file: `${CE}/scripts/enrich-prospects.mjs`, note: "Resolver order = local → Apollo → Serper. Apollo needs a CLEANED name (legal suffix stripped). Serper hit must pass name-validation." },
  static_status: "ok",
  credit_spender: true,
};

const FIND_CONTACTS: Activity = {
  activity_id: "find-contacts",
  name: "find persona contacts + PI (slice 2)",
  what: "Hunter domain-search → filter to the icp-titles personas (Tier 1 buyer / Tier 2 IP-R&D). PLUS first-class capture of the named Principal Investigator from the NIH award (the scientific founder). Writes enrichment.contacts; advances resolved → contacted.",
  executor_class: "automated-tool",
  owning_system: "canon-engine",
  owning_system_folder: CE,
  data: { table: "public.prospects", project_id: PID, columns: ["enrichment.contacts[]", "stage (resolved → contacted)"] },
  trigger: { type: "manual", detail: "node find-contacts.mjs venture <engagement> --limit N --execute" },
  runner: { type: "node-script", path: `${CE}/scripts/find-contacts.mjs`, args: ["venture", "<engagement>", "--limit", "300", "--execute"], cwd: CE },
  reads: ["public.prospects (stage=resolved)", "Hunter domain-search + email-finder (for the PI)"],
  writes: ["public.prospects.enrichment.contacts (name/title/email/linkedin/role/tier/source)"],
  see_it: { surface: "/prospects" },
  change_it: { file: `${CE}/scripts/find-contacts.mjs`, note: "TIER1/TIER2/EXCLUDE persona regexes; PI parsed from signal.pi (role=principal_investigator, source=nih-award)." },
  static_status: "ok",
  credit_spender: true,
};

const VERIFY_REACH: Activity = {
  activity_id: "verify-and-linkedin",
  name: "verify email + backfill LinkedIn",
  what: "Hunter email-verifier on each contact email (stamps verif/deliverable/accept_all + provenance verified_at/verified_by). Serper site:linkedin.com/in backfill for contacts missing a LinkedIn URL, with mandatory name-validation (refuse same-name strangers).",
  executor_class: "automated-tool",
  owning_system: "canon-engine",
  owning_system_folder: CE,
  data: { table: "public.prospects", project_id: PID, columns: ["enrichment.contacts[].verif/verified_at/verified_by/linkedin"] },
  trigger: { type: "manual", detail: "node verify-contacts.mjs venture <engagement> --limit N --execute" },
  runner: { type: "node-script", path: `${CE}/scripts/verify-contacts.mjs`, args: ["venture", "<engagement>", "--limit", "300", "--execute"], cwd: CE },
  reads: ["public.prospects (stage=contacted)", "Hunter email-verifier", "Serper (LinkedIn lookup)"],
  writes: ["public.prospects.enrichment.contacts (verification + linkedin)"],
  see_it: { surface: "/prospects" },
  change_it: { file: `${CE}/scripts/verify-contacts.mjs`, note: "Catch-all (accept_all) = usable-but-flagged. LinkedIn name-validation: last exact/substring + first exact/3+prefix/nickname." },
  static_status: "ok",
  credit_spender: true,
};

const DEEP_PERSONALIZE: Activity = {
  activity_id: "deep-personalize",
  name: "deep personalization capture (3-pass)",
  what: "Pull EVERYTHING the source exposes for personalization, stored on the company/contact (source-mining doctrine P2): public-health-relevance + abstract (the science / patentable map), award END date (the 'why now'), full funding TRAJECTORY, publications, the full PI list, + a derived TABA ceiling (Phase II = $50K, Phase I = $6.5K).",
  executor_class: "automated-tool",
  owning_system: "canon-engine",
  owning_system_folder: CE,
  data: { table: "public.prospects", project_id: PID, columns: ["enrichment.nih", "enrichment.taba", "enrichment.contacts (+ co-PIs)"] },
  trigger: { type: "manual", detail: "node enrich-nih.mjs venture <engagement> --limit N --execute" },
  runner: { type: "node-script", path: `${CE}/scripts/enrich-nih.mjs`, args: ["venture", "<engagement>", "--limit", "300", "--execute"], cwd: CE },
  reads: ["public.prospects (nih-reporter)", "NIH RePORTER projects + publications (by org)"],
  writes: ["public.prospects.enrichment.nih (phr/abstract/dates/trajectory/publications/PIs)", "enrichment.taba"],
  see_it: { surface: "/prospects" },
  change_it: { file: `${CE}/scripts/enrich-nih.mjs`, note: "Generalize per source: every source pass captures qualify + personalize + trigger fields, not just the gate." },
  static_status: "ok",
  credit_spender: false,
};

const QUALIFY: Activity = {
  activity_id: "qualify-accounts",
  name: "qualify (AI judge vs ICP)",
  what: "Account gate: an LLM judge reads the captured science + trajectory + phase against the ICP rubric → verdict (qualified/edge/not_qualified) + tier + entity_type + rationale. The trajectory data separates real product startups from research-shops/SBIR-mills. Writes qualified/verdict; advances contacted → qualified/edge/disqualified.",
  executor_class: "agent-loop",
  owning_system: "canon-engine",
  owning_system_folder: CE,
  data: { table: "public.prospects", project_id: PID, columns: ["qualified (bool)", "verdict", "enrichment.qualify (tier/entity_type/reasons/rationale)"] },
  trigger: { type: "manual", detail: "node qualify-prospects.mjs venture <engagement> --limit N --execute" },
  runner: { type: "node-script", path: `${CE}/scripts/qualify-prospects.mjs`, args: ["venture", "<engagement>", "--limit", "300", "--execute"], cwd: CE },
  ai: { model: "claude-haiku-4-5-20251001", prompt_path: `${CE}/scripts/qualify-prospects.mjs`, prompt_path_note: "Rubric is the RUBRIC const in-script; pin to the venture's ICP. Tier from real stage signals, not grant-volume (known v1 weakness — Arsenal over-assigns on SBIR $)." },
  reads: ["public.prospects (stage=contacted, enrichment.nih)", "Anthropic Messages API (tool-use judge)"],
  writes: ["public.prospects.qualified / verdict / enrichment.qualify"],
  see_it: { surface: "/prospects" },
  change_it: { file: `${CE}/scripts/qualify-prospects.mjs`, note: "RUBRIC + SCHEMA consts; edge band routes to human review." },
  static_status: "ok",
  credit_spender: true,
};

const EXPORT_LIST: Activity = {
  activity_id: "export-send-list",
  name: "export channel-ready send list",
  what: "One row per reachable contact (valid/accept_all email OR LinkedIn) at a qualified company, with personalization columns. Channel-segmented (email / linkedin / both). Writes a gitignored CSV to the engagement's exports/ (PII; Supabase is source of truth).",
  executor_class: "automated-tool",
  owning_system: "canon-engine",
  owning_system_folder: CE,
  data: { table: "public.prospects (verdict=qualified)", project_id: PID },
  trigger: { type: "manual", detail: "node export-send-list.mjs venture <engagement>" },
  runner: { type: "node-script", path: `${CE}/scripts/export-send-list.mjs`, args: ["venture", "<engagement>"], cwd: CE },
  reads: ["public.prospects (verdict=qualified)"],
  writes: ["accounts/ventures/<engagement>/exports/cipo-send-list.csv (gitignored)"],
  see_it: { surface: "/prospects" },
  change_it: { file: `${CE}/scripts/export-send-list.mjs` },
  static_status: "ok",
  credit_spender: false,
};

const APPROVAL_SURFACE: Activity = {
  activity_id: "build-approval-surface",
  name: "build the one approval surface",
  what: "Generate ONE self-contained HTML doc (offer · message · follow-through · cohort · approvals) from live data, with a per-company personalized preview. The single surface the expert + operator sign off before send. Writes to gitignored exports/.",
  executor_class: "automated-tool",
  owning_system: "canon-engine",
  owning_system_folder: CE,
  data: { table: "public.prospects (verdict=qualified)", project_id: PID },
  trigger: { type: "manual", detail: "node gen-approval-surface.mjs venture <engagement>" },
  runner: { type: "node-script", path: `${CE}/scripts/gen-approval-surface.mjs`, args: ["venture", "<engagement>"], cwd: CE },
  reads: ["public.prospects (verdict=qualified, enrichment.*)", "offer artifacts", "live destination site URL"],
  writes: ["accounts/ventures/<engagement>/exports/cipo-approval-surface.html (gitignored)"],
  see_it: { surface: "exports/cipo-approval-surface.html" },
  change_it: { file: `${CE}/scripts/gen-approval-surface.mjs`, note: "OFFER/FLAGS/APPROVALS consts + the preview() personalization template." },
  static_status: "ok",
  credit_spender: false,
};

const PROMOTE_TO_CORE: Activity = {
  activity_id: "promote-to-core",
  name: "promote qualified → Core (Records)",
  what: "Promote qualified prospects (companies + their contacts, carried in enrichment) into public.companies / public.contacts as the durable Core. The intended end-state; NOT exercised on the CIPO run (the prospect rows carried everything in enrichment jsonb). Wire when the Core join is needed downstream.",
  executor_class: "automated-tool",
  owning_system: "revops-engine",
  owning_system_folder: "/Users/nplmini/code/work/systems/revops-engine",
  data: { table: "public.companies + public.contacts", project_id: PID },
  trigger: { type: "sql-rpc", detail: "promote_staging_batch (needs a prospects→staging shim) — not yet wired for the signal-driven path" },
  runner: { type: "sql-rpc", path: "promote_staging_batch", args: ["<batch>", "companies"] },
  reads: ["public.prospects (verdict=qualified)"],
  writes: ["public.companies", "public.contacts", "public.staging_promotions"],
  see_it: { surface: "/records" },
  change_it: { file: "/Users/nplmini/code/work/systems/revops-engine/supabase/migrations/0004_promote_verdict_gate.sql" },
  static_status: "unset",
  credit_spender: false,
};

const SEND: Activity = {
  activity_id: "send-sequence",
  name: "send on the expert's channels",
  what: "Load the approved copy + the qualified list into the channels and send: HeyReach (LinkedIn, under the expert's account) + the email sequencer (warmed burner domains). Multi-channel. Replies route to the deliver-first follow-through.",
  executor_class: "automated-tool",
  owning_system: "canon-engine",
  owning_system_folder: CE,
  data: { table: "public.prospects (verdict=qualified)", project_id: PID },
  trigger: { type: "manual", detail: "Gated on the s13 expert-signoff motion reaching achieved for this engagement (copy approved). Warmed domains + Will's HeyReach are ready." },
  runner: { type: "none", path: "HeyReach campaign + email sequencer", args: [] },
  reads: ["the approved copy artifact", "the send-list export"],
  writes: ["HeyReach / email sequencer", "reply capture"],
  see_it: { surface: "HeyReach + sequencer dashboards" },
  change_it: { file: "n/a (channel config)" },
  static_status: "unset",
  credit_spender: true,
};

// ─── L3 Activities: the expert sign-off loop (bound to expert-liaison-engine) ──
// The five leaves of the reusable wf-expert-signoff workflow. Each runs on the
// expert-liaison-engine (canon), via its sanctioned RPCs. This formalizes what was a
// Hermes-routed manual gate into an orchestrated, persistent motion.

const EL_RECORD_REQUEST: Activity = {
  activity_id: "el-record-request",
  name: "record the sign-off request",
  what: "A producer (the copy build) hands the engine a request: this copy needs the expert's decision on its flagged lines. Idempotent on source_ref. Lands in the Inbound lane.",
  executor_class: "automated-tool",
  owning_system: "expert-liaison-engine",
  owning_system_folder: EL,
  data: { table: "public.expert_requests", project_id: CANON, columns: ["request_type='approval'", "concerning_system='cold-outreach'", "source_ref", "payload (copy ref + flags)"] },
  trigger: { type: "upstream-event", detail: "Fired when s12 drafts copy with a flag list (produce-sequence emit, or the one-shot request-copy-signoff for existing copy)." },
  runner: { type: "sql-rpc", path: "record_expert_request", args: ["approval", "<engagement>"] },
  reads: ["the drafted copy artifact", "the flag list / Hermes brief"],
  writes: ["canon public.expert_requests"],
  see_it: { surface: "/expert-liaison" },
  change_it: { file: `${EL}/CLAUDE.md`, note: "Emit contract = record_expert_request. Producers call it and stop." },
  static_status: "ok",
  credit_spender: false,
};

const EL_TRIAGE_OPEN_MOTION: Activity = {
  activity_id: "el-triage-open-motion",
  name: "triage → open the motion (project flags into decisions)",
  what: "Hermes triages the request into a persistent motion whose goal_predicate line-items ARE the flagged decisions (e.g. Will's 5: FDA claim, founder-peer open, TABA wedge, segment, approval mechanism). The motion drives follow-up until every decision resolves.",
  executor_class: "agent-loop",
  owning_system: "expert-liaison-engine",
  owning_system_folder: EL,
  data: { table: "public.expert_motions", project_id: CANON, columns: ["goal_predicate.line_items[] = the decisions", "ball_in_court", "next_action_due"] },
  trigger: { type: "manual", detail: "On the Inbound lane: Open motion (triage_expert_request with p_goal_predicate = the projected decisions)." },
  runner: { type: "sql-rpc", path: "triage_expert_request", args: [] },
  reads: ["canon public.expert_requests (status=open)"],
  writes: ["canon public.expert_motions"],
  see_it: { surface: "/expert-liaison" },
  change_it: { note: "The projection of flags → line_items is Hermes's translation step." },
  static_status: "ok",
  credit_spender: false,
};

const EL_COMPOSE_ASK: Activity = {
  activity_id: "el-compose-ask",
  name: "compose the ask to the expert",
  what: "Hermes composes ONE prioritized communication (the decisions + the defaults we'd ship on 'your call'), threaded to the motion, in the expert's channel. Batches many decisions into one touch (minimal-burden).",
  executor_class: "agent-loop",
  owning_system: "expert-liaison-engine",
  owning_system_folder: EL,
  data: { table: "public.expert_exchanges", project_id: CANON, columns: ["motion_id", "subject/body", "status drafted→sent"] },
  trigger: { type: "manual", detail: "On the Motions board: Compose (compose_motion_exchange) → the exchange lands in the Packets tab for send." },
  runner: { type: "sql-rpc", path: "compose_motion_exchange", args: [] },
  reads: ["canon public.expert_motions", "the copy + flags"],
  writes: ["canon public.expert_exchanges"],
  see_it: { surface: "/expert-liaison" },
  change_it: { note: "The compose primitive links the exchange to a goal_predicate line_item." },
  static_status: "ok",
  credit_spender: false,
};

const EL_RESOLVE_ANSWER: Activity = {
  activity_id: "el-resolve-answer",
  name: "capture the expert's answer",
  what: "The expert decides (approve / accept defaults / revise). Their verdict lands on the exchange; advance_motion recomputes the motion. Partial answers narrow the remaining ask; the follow-up clock nudges until every decision is in. The expert never touches the system.",
  executor_class: "human-in-the-loop",
  owning_system: "expert-liaison-engine",
  owning_system_folder: EL,
  data: { table: "public.expert_motions", project_id: CANON, columns: ["expert_exchanges.metadata.verdict", "satisfaction none→partial→full", "status→achieved"] },
  trigger: { type: "manual", detail: "Record the expert's reply (record_packet_answer / advance_motion)." },
  runner: { type: "sql-rpc", path: "advance_motion", args: [] },
  reads: ["the expert's reply in their channel"],
  writes: ["canon public.expert_exchanges (verdict)", "canon public.expert_motions (state)"],
  see_it: { surface: "/expert-liaison" },
  change_it: { note: "Verdict is single-sourced on the exchange; line_items only point." },
  static_status: "ok",
  credit_spender: false,
};

const EL_BIND_BACK: Activity = {
  activity_id: "el-bind-back",
  name: "bind the decision back → clear the send gate",
  what: "On the motion reaching achieved, the verdict is stamped emitted-for-consumption; the cold-outreach consumer applies it (copy approved) and the s16 send stage's gate clears. Traceable: engine output ← the expert's motion.",
  executor_class: "automated-tool",
  owning_system: "expert-liaison-engine",
  owning_system_folder: EL,
  data: { table: "public.expert_motions", project_id: CANON, columns: ["bind_target", "meta.binding_status emitted→consumed", "bound_at"] },
  trigger: { type: "sql-rpc", detail: "apply_motion_binding fires on achieved; the cold-outreach consumer reads expert_binding_for_system('cold-outreach') and marks consumed." },
  runner: { type: "sql-rpc", path: "apply_motion_binding", args: [] },
  reads: ["canon public.expert_motions (status=achieved)"],
  writes: ["canon public.expert_motions (bound_at, binding_status)", "unblocks s16 send-sequence"],
  see_it: { surface: "/expert-liaison" },
  change_it: { file: `${CE}/scripts/apply-copy-approvals.mjs`, note: "The cold-outreach consumer (mirrors revops apply-expert-verdicts)." },
  static_status: "ok",
  credit_spender: false,
};

const ACTIVITIES: Activity[] = [
  SIGNAL_WATCH, RESOLVE, FIND_CONTACTS, VERIFY_REACH, DEEP_PERSONALIZE,
  QUALIFY, EXPORT_LIST, APPROVAL_SURFACE, PROMOTE_TO_CORE, SEND,
  EL_RECORD_REQUEST, EL_TRIAGE_OPEN_MOTION, EL_COMPOSE_ASK, EL_RESOLVE_ANSWER, EL_BIND_BACK,
];

// ─── L2 Workflow: "build + enrich + qualify the list" ──────────────────────
// The deterministic pipeline that turns landed signals into a qualified, enriched,
// channel-ready cohort. Each node is --execute-gated and verified on a sample first.

const BUILD_THE_LIST: Workflow = {
  workflow_id: "wf-build-the-list",
  name: "build + enrich + qualify the list",
  control_flow: "fixed",
  viewbox: { width: 1100, height: 200 },
  nodes: [
    { node_id: "n1", activity_id: "signal-watch",       label: "signal watch",      position: { x:  60, y: 100 } },
    { node_id: "n2", activity_id: "resolve-domains",    label: "resolve domains",   position: { x: 200, y: 100 } },
    { node_id: "n3", activity_id: "find-contacts",      label: "find contacts + PI",position: { x: 340, y: 100 } },
    { node_id: "n4", activity_id: "verify-and-linkedin",label: "verify + LinkedIn", position: { x: 480, y: 100 } },
    { node_id: "n5", activity_id: "deep-personalize",   label: "deep personalize",  position: { x: 620, y: 100 } },
    { node_id: "n6", activity_id: "qualify-accounts",   label: "qualify",           position: { x: 760, y: 100 } },
    { node_id: "n7", activity_id: "export-send-list",   label: "export list",       position: { x: 900, y: 100 } },
  ],
  edges: [
    { from: "n1", to: "n2", branch: "default" },
    { from: "n2", to: "n3", branch: "default" },
    { from: "n3", to: "n4", branch: "default" },
    { from: "n4", to: "n5", branch: "default" },
    { from: "n5", to: "n6", branch: "default" },
    { from: "n6", to: "n7", branch: "default" },
  ],
};

// ─── L2 Workflow: "expert sign-off" (REUSABLE) ─────────────────────────────
// The expert-liaison loop as an L2 workflow: record → triage/open motion → compose ask
// → resolve/answer → bind-back, bound to the expert-liaison-engine. REUSABLE across SOPs —
// any stage needing an expert decision references workflow_ids: ["wf-expert-signoff"].
// Extract to sops/workflows/ when a 2nd SOP references it (capabilities-promotion rubric).

const EXPERT_SIGNOFF: Workflow = {
  workflow_id: "wf-expert-signoff",
  name: "expert sign-off (EL loop)",
  control_flow: "agent-driven",
  viewbox: { width: 900, height: 200 },
  nodes: [
    { node_id: "e1", activity_id: "el-record-request",     label: "record request",  position: { x:  70, y: 100 } },
    { node_id: "e2", activity_id: "el-triage-open-motion",  label: "triage → motion", position: { x: 240, y: 100 } },
    { node_id: "e3", activity_id: "el-compose-ask",         label: "compose ask",     position: { x: 410, y: 100 } },
    { node_id: "e4", activity_id: "el-resolve-answer",      label: "resolve answer",  position: { x: 580, y: 100 } },
    { node_id: "e5", activity_id: "el-bind-back",           label: "bind back",       position: { x: 750, y: 100 } },
  ],
  edges: [
    { from: "e1", to: "e2", branch: "default" },
    { from: "e2", to: "e3", branch: "default" },
    { from: "e3", to: "e4", branch: "default" },
    { from: "e4", to: "e5", branch: "default" },
    { from: "e4", to: "e3", branch: "edge", label: "partial — re-ask" },
  ],
};

const WORKFLOWS: Workflow[] = [BUILD_THE_LIST, EXPERT_SIGNOFF];

// ─── L1 SOP spine ──────────────────────────────────────────────────────────
// 16 stages — the validated signal-driven procedure. Engagements (e.g.
// konstellation-cipo) are SopRun targets, not properties of the SOP.

const SOP: Sop = {
  sop_id: "launch-outbound-for-venture",
  name: "Launch outbound for a venture",
  description:
    "Validated procedure for launching signal-driven outbound for a venture: from picking an ICP-selecting signal source through a qualified, enriched, personalized cohort, a locked offer + sourced copy, one approval surface, and multi-channel send. 16 stages. Reusable: one SopRun per venture. Reverse-engineered from the konstellation-cipo run (2026-06-30).",
  stages: [
    { stage_id: "s1-offer-icp", order: 1, name: "Offer + ICP defined (precondition)",
      required_end_state: "The offer ladder, ICP, segment criteria, icp-titles, and faithfulness constraints exist as ratified artifacts.", gate_type: "approval", workflow_ids: [] },
    { stage_id: "s2-choose-signal", order: 2, name: "Choose an ICP-selecting signal source (P1)",
      required_end_state: "A signal source is chosen and PASSES the targetability probe (≥~20-row sample resolves to ICP-shaped companies). Sources that select against the ICP (e.g. CT.gov sponsors → big-pharma) are rejected.", gate_type: "decision", workflow_ids: [] },
    { stage_id: "s3-signal-watch", order: 3, name: "Signal watch lands prospects",
      required_end_state: "public.prospects holds a current batch of ICP-shaped companies; academic/nonprofit/foreign applicants dropped at ingest.", gate_type: "automated", workflow_ids: ["wf-build-the-list"] },
    { stage_id: "s4-resolve", order: 4, name: "Resolve domains",
      required_end_state: "Each prospect has a domain (local-first → Apollo → Serper), or is marked unresolved.", gate_type: "automated", workflow_ids: [] },
    { stage_id: "s5-contacts", order: 5, name: "Find persona contacts + the PI",
      required_end_state: "Each company has its icp-titles personas and its first-class Principal Investigator captured.", gate_type: "automated", workflow_ids: [] },
    { stage_id: "s6-verify", order: 6, name: "Verify email + backfill LinkedIn",
      required_end_state: "Contact emails carry a verification verdict + provenance; LinkedIn URLs backfilled where confidently matched.", gate_type: "automated", workflow_ids: [] },
    { stage_id: "s7-personalize", order: 7, name: "Deep personalization capture (3-pass)",
      required_end_state: "Every company carries its personalization fuel (science, award-end timing, trajectory, TABA, publications) stored on the row — not just the qualify signal.", gate_type: "automated", workflow_ids: [] },
    { stage_id: "s8-qualify", order: 8, name: "Qualify the accounts (AI judge vs ICP)",
      required_end_state: "Each company has a verdict (qualified/edge/not) + tier + explainable rationale; research-shops/mills filtered out.", gate_type: "automated", workflow_ids: [] },
    { stage_id: "s9-export", order: 9, name: "Export the channel-ready send list",
      required_end_state: "A channel-segmented (email/linkedin/both) export of the qualified cohort exists.", gate_type: "automated", workflow_ids: [] },
    { stage_id: "s10-lock-offer", order: 10, name: "Lock the offer to the destination (HINGE)",
      required_end_state: "The cold offer matches the live destination site (same lead magnet); divergence resolved.", gate_type: "approval", workflow_ids: [] },
    { stage_id: "s11-follow-through", order: 11, name: "Design the follow-through",
      required_end_state: "The after-reply flow is defined: one-word CTA, deliver-first (no homework), prove a real finding, present live.", gate_type: "decision", workflow_ids: [] },
    { stage_id: "s12-draft-copy", order: 12, name: "Draft the cold copy (sourced to the expert)",
      required_end_state: "Cold sequence + follow-through messages drafted via the copy-draft discipline: source-tagged, refused-words honored, ships with a flag list.", gate_type: "automated", workflow_ids: [] },
    { stage_id: "s13-route-flags", order: 13, name: "Route the copy flags to the expert (Hermes)",
      required_end_state: "The flag list is packaged and routed to the expert via Hermes for the decisions only they can make.", gate_type: "approval", workflow_ids: ["wf-expert-signoff"] },
    { stage_id: "s14-approval-surface", order: 14, name: "Build the one approval surface",
      required_end_state: "A single surface (offer/message/follow-through/cohort/approvals) is generated for expert + operator sign-off.", gate_type: "automated", workflow_ids: [] },
    { stage_id: "s15-sign-off", order: 15, name: "Expert + operator sign off",
      required_end_state: "Expert has certified the offer + copy in their voice (flags cleared); operator approved targeting + send window + sender identity.", gate_type: "approval", workflow_ids: [] },
    { stage_id: "s16-send-measure", order: 16, name: "Send (multi-channel) + measure → iterate",
      required_end_state: "Sequence sent on the expert's channels (LinkedIn + email); replies routed to the follow-through; reply data feeds the next version. (Promote qualified → Core when the downstream join is needed.)", gate_type: "automated", workflow_ids: [] },
  ],
};

// ─── SopRuns ───────────────────────────────────────────────────────────────

const KONSTELLATION_CIPO_RUN: SopRun = {
  run_id: "run-konstellation-cipo-initial",
  sop_id: "launch-outbound-for-venture",
  target_engagement: "konstellation-cipo",
  started_at: "2026-06-29T00:00:00Z",
  // 2026-06-30: this run reached stage 15 (sign-off). Stages 1-14 done: 113 qualified
  // companies, 190 reachable contacts, offer locked (Teardown), copy v1 drafted, flags
  // routed to Hermes, approval surface built. Stage 16 (send) gated on Will's sign-off.
};

// ─── Bundle export ─────────────────────────────────────────────────────────

export const launchOutboundForVentureSop: SopBundle = {
  sop: SOP,
  workflows: WORKFLOWS,
  activities: ACTIVITIES,
  runs: [KONSTELLATION_CIPO_RUN],
};
