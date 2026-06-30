// Launch Outbound for a Venture — hand-authored slice-1 SOP definition.
//
// VENTURE-AGNOSTIC. The L1 spine + L2 workflow + L3 activities never mention
// a specific engagement. Per-invocation context lives on a SopRun. One SOP :
// many runs.
//
// Slice-2 refactor (2026-06-29): collapsed canon.prospects → revops. The
// canon→revops bridge that this design forced was unbuilt for months because
// the abstraction wasn't earning its keep — so the prospects table now lives
// in revops-engine (project mrmnyscurmkfppicqqhk). Signal-watch + enrich
// scripts write/read revops directly. The "bridge" node is gone, and the SOP
// is back to 15 stages.
//
// Workflow span note: the build-the-list workflow contributes to stages 1, 4,
// 5, 8, 9 (signal-watch, enrich, prep-funnel, promote-companies, build-list).
// Slice 1 binds it only to stage 9 (the build-the-list anchor) to avoid the
// "same workflow shown under many stages" UX confusion. The drift reconciler
// (slice 2+) refines bindings.

import type { Activity, Sop, SopBundle, SopRun, Workflow } from "./types";

// ─── L3 Activities ─────────────────────────────────────────────────────────
//
// Runner args use `<engagement>` placeholders that operate-runs.ts substitutes
// from the active SopRun.target_engagement at spawn time.

const SIGNAL_BATCH: Activity = {
  activity_id: "signal-batch",
  name: "signal batch",
  what: "Land raw companies into the prospects table from external signal sources (e.g. ClinicalTrials.gov + USPTO).",
  executor_class: "automated-tool",
  // The runner script currently lives in canon-engine/scripts/ even though the
  // data destination is revops. Slice-3 cleanup: move the script files to
  // revops-engine. Slice 1: owning_system tracks the script's *folder* (for
  // Open-in-Claude-Code), data tracks the destination.
  owning_system: "canon-engine",
  owning_system_folder: "/Users/nplmini/code/work/systems/canon-engine",
  data: {
    table: "public.prospects",
    project_id: "mrmnyscurmkfppicqqhk",
    columns: ["stage", "company_name", "signal (jsonb)", "engagement_id"],
  },
  trigger: {
    type: "cron",
    detail: "launchd daily 08:00 (com.nick.signal-watch, RunAtLoad=false)",
  },
  runner: {
    type: "node-script",
    path: "/Users/nplmini/code/work/systems/canon-engine/scripts/watch-signals.mjs",
    args: ["venture", "<engagement>", "--since-days", "3"],
    cwd: "/Users/nplmini/code/work/systems/canon-engine",
  },
  reads: [
    "ClinicalTrials.gov v2 API",
    "USPTO api.uspto.gov (A61 classes)",
  ],
  writes: [
    "revops public.prospects (via record_prospect RPC; dedup on engagement_type+engagement_id+source+source_ref)",
  ],
  see_it: {
    surface: "/prospects",
    description: "live prospects landed today",
  },
  change_it: {
    file: "/Users/nplmini/code/work/systems/canon-engine/launchd/com.nick.signal-watch.plist",
    note: "Hour/Minute schedule + --since-days flag; reload via `launchctl unload+load`. The runner script (watch-signals.mjs) lives in canon-engine but writes to revops since the 2026-06-29 collapse.",
  },
  static_status: "ok",
  credit_spender: true,
};

const CLASSIFY: Activity = {
  activity_id: "classify-segment-screen",
  name: "classify / segment screen",
  what: "Stage-1 semantic classification of the company batch against play criteria (C1-C3 in-scope, N1-N4 disqualifiers, F1 narrow).",
  executor_class: "agent-loop",
  owning_system: "revops-engine",
  owning_system_folder: "/Users/nplmini/code/work/systems/revops-engine",
  data: {
    table: "staging.companies_<batch>",
    project_id: "mrmnyscurmkfppicqqhk",
    columns: ["prep_verdict", "prep_confidence", "prep_criteria (jsonb)", "prep_rationale"],
  },
  trigger: {
    type: "manual",
    detail: "node classify-runner.mjs <batch> companies [--play <dir>] [--model <id>] [--limit N]",
  },
  runner: {
    type: "node-script",
    path: "/Users/nplmini/code/work/systems/revops-engine/classify-runner.mjs",
    args: ["<batch>", "companies"],
    cwd: "/Users/nplmini/code/work/systems/revops-engine",
  },
  ai: {
    model: "claude-sonnet-4-6",
    prompt_path:
      "/Users/nplmini/code/work/accounts/clients/teknova/plays/mrna-therapeutics/classifier/classifier-prompt.md",
    prompt_path_note:
      "SUBSTITUTION: per-play; CIPO's own play not yet authored. Inspector shows teknova's mrna-therapeutics classifier-prompt as the canonical example until each play writes its own.",
  },
  reads: [
    "staging.companies_<batch> rows",
    "<play>/classifier/classifier-prompt.md",
    "<play>/classifier/read-fields.json",
    "practices/revops/reference/targeting-enrichment-doctrine.md",
  ],
  writes: ["staging.companies_<batch>.prep_* columns"],
  see_it: { surface: "/staging" },
  change_it: {
    file: "/Users/nplmini/code/work/systems/revops-engine/classify-runner.mjs",
    line: 43,
    note: "model flag default at line 43; prompt at <play>/classifier/classifier-prompt.md; read fields at read-fields.json",
  },
  static_status: "ok",
  credit_spender: true,
};

const EVIDENCE_GATE: Activity = {
  activity_id: "evidence-gate-verify",
  name: "evidence gate (qualify companies)",
  what: "Stage-2 evidence verification: fetch the company website (~14 pages), classify NA sites by function (rnd_wetlab / process_dev / gmp_mfg / qc), reconfirm program fit.",
  executor_class: "agent-loop",
  owning_system: "revops-engine",
  owning_system_folder: "/Users/nplmini/code/work/systems/revops-engine",
  data: {
    table: "staging.companies_<batch>",
    project_id: "mrmnyscurmkfppicqqhk",
    columns: ["prep_verify (jsonb)", "prep_qualified (bool)"],
  },
  trigger: {
    type: "manual",
    detail: "node verify-runner.mjs <batch> companies [--limit N]",
  },
  runner: {
    type: "node-script",
    path: "/Users/nplmini/code/work/systems/revops-engine/verify-runner.mjs",
    args: ["<batch>", "companies"],
    cwd: "/Users/nplmini/code/work/systems/revops-engine",
  },
  ai: {
    model: "claude-sonnet-4-6",
    prompt_path:
      "/Users/nplmini/code/work/accounts/clients/teknova/plays/mrna-therapeutics/classifier/verify-prompt.md",
    prompt_path_note:
      "SUBSTITUTION: same caveat as classify — teknova's mrna-therapeutics verify-prompt is the example until each play writes its own.",
  },
  reads: [
    "staging rows from classify step",
    "<play>/classifier/verify-prompt.md",
    "company websites (~14 pages each)",
  ],
  writes: [
    "staging.companies_<batch>.prep_verify (jsonb)",
    "staging.companies_<batch>.prep_qualified (bool)",
  ],
  see_it: { surface: "/staging" },
  change_it: {
    file: "/Users/nplmini/code/work/systems/revops-engine/verify-runner.mjs",
    line: 32,
    note: "model flag default at line 32; prompt at <play>/classifier/verify-prompt.md",
  },
  static_status: "ok",
  credit_spender: true,
};

const PROMOTE_COMPANIES: Activity = {
  activity_id: "promote-companies",
  name: "promote companies → Records",
  what: "Promote qualified company rows from staging to public.companies (idempotent by key); append a ledger row to public.staging_promotions.",
  executor_class: "automated-tool",
  owning_system: "revops-engine",
  owning_system_folder: "/Users/nplmini/code/work/systems/revops-engine",
  data: {
    table: "public.companies",
    project_id: "mrmnyscurmkfppicqqhk",
    columns: ["+ ledger public.staging_promotions"],
  },
  trigger: {
    type: "sql-rpc",
    detail: "promote_staging_batch(<batch>, 'companies')",
  },
  runner: {
    type: "sql-rpc",
    path: "promote_staging_batch",
    args: ["<batch>", "companies"],
  },
  reads: ["staging.companies_<batch> (where prep_qualified)"],
  writes: ["public.companies", "public.staging_promotions"],
  see_it: { surface: "/records" },
  change_it: {
    file: "/Users/nplmini/code/work/systems/revops-engine/supabase/migrations/0004_promote_verdict_gate.sql",
    note: "RPC definition",
  },
  static_status: "ok",
  credit_spender: false,
};

const FIND_CONTACTS: Activity = {
  activity_id: "find-icp-contacts",
  name: "find ICP-title contacts",
  what: "Resolve ICP-title contacts at promoted companies (prospects stage transition: signal → resolved).",
  executor_class: "agent-loop",
  // Script lives in canon-engine but the data destination is revops. Slice-3
  // cleanup: move the script to revops-engine.
  owning_system: "canon-engine",
  owning_system_folder: "/Users/nplmini/code/work/systems/canon-engine",
  data: {
    table: "public.prospects",
    project_id: "mrmnyscurmkfppicqqhk",
    columns: ["stage (signal → resolved)"],
  },
  trigger: {
    type: "manual",
    detail: "node enrich-prospects.mjs <type> <id> --limit N --execute",
  },
  runner: {
    type: "node-script",
    path: "/Users/nplmini/code/work/systems/canon-engine/scripts/enrich-prospects.mjs",
    args: ["venture", "<engagement>", "--limit", "100"],
    cwd: "/Users/nplmini/code/work/systems/canon-engine",
  },
  reads: ["revops public.prospects (qualified companies)"],
  writes: ["revops public.prospects (resolved contact rows)"],
  see_it: { surface: "/prospects" },
  change_it: {
    file: "/Users/nplmini/code/work/systems/canon-engine/scripts/enrich-prospects.mjs",
    line: 64,
    note: "wire deepline people_search at line 64+; currently a gated stub. Script writes to revops since the 2026-06-29 collapse; consider moving the file to revops-engine.",
  },
  static_status: "ok",
  credit_spender: true,
};

const VERIFY_EMAIL: Activity = {
  activity_id: "verify-work-email",
  name: "verify work email",
  what: "Verify a contact's work email via the findymail/prospeo → hunter → zerobounce waterfall.",
  executor_class: "automated-tool",
  owning_system: "canon-engine",
  owning_system_folder: "/Users/nplmini/code/work/systems/canon-engine",
  data: {
    table: "public.prospects",
    project_id: "mrmnyscurmkfppicqqhk",
    columns: ["email", "verified_email", "stage (→ qualified)"],
  },
  trigger: {
    type: "manual",
    detail: "currently a gated stub; --execute returns no-op",
  },
  runner: {
    type: "node-script",
    path: "/Users/nplmini/code/work/systems/canon-engine/scripts/enrich-prospects.mjs",
    args: [],
    cwd: "/Users/nplmini/code/work/systems/canon-engine",
  },
  reads: ["revops public.prospects (contact rows missing verified_email)"],
  writes: [
    "revops public.prospects.email",
    "revops public.prospects.verified_email",
  ],
  see_it: { surface: "/prospects" },
  change_it: {
    file: "/Users/nplmini/code/work/systems/canon-engine/scripts/enrich-prospects.mjs",
    note: "wire findymail/prospeo → hunter → zerobounce with BYO keys in .env (HUNTER_API_KEY, ZEROBOUNCE_API_KEY); doctrine §7.7.",
  },
  static_status: "blocked",
  block_reason:
    "Email waterfall is not built; BYO keys (HUNTER_API_KEY, ZEROBOUNCE_API_KEY, FINDYMAIL_API_KEY) not wired through to enrich-prospects.mjs. Doctrine §7.7. This is the SOP's current build pause.",
  credit_spender: true,
};

const PROMOTE_CONTACTS: Activity = {
  activity_id: "promote-contacts",
  name: "promote contacts → Records",
  what: "Promote qualified contact rows from staging to public.contacts (idempotent by key).",
  executor_class: "automated-tool",
  owning_system: "revops-engine",
  owning_system_folder: "/Users/nplmini/code/work/systems/revops-engine",
  data: {
    table: "public.contacts",
    project_id: "mrmnyscurmkfppicqqhk",
  },
  trigger: {
    type: "sql-rpc",
    detail: "promote_staging_batch(<batch>, 'contacts')",
  },
  runner: {
    type: "sql-rpc",
    path: "promote_staging_batch",
    args: ["<batch>", "contacts"],
  },
  reads: ["staging.contacts_<batch> (where verified_email is not null)"],
  writes: ["public.contacts", "public.staging_promotions"],
  see_it: { surface: "/records" },
  change_it: {
    file: "/Users/nplmini/code/work/systems/revops-engine/supabase/migrations/0004_promote_verdict_gate.sql",
    note: "RPC definition (same RPC, entity='contacts')",
  },
  static_status: "unset",
  credit_spender: false,
};

const ROUTE_EDGE: Activity = {
  activity_id: "route-unreachable-edge",
  name: "unreachable → edge",
  what: "Route contacts that cannot be reached (no verified email) to prep_routed='edge' — kept, not discarded.",
  executor_class: "automated-tool",
  owning_system: "revops-engine",
  owning_system_folder: "/Users/nplmini/code/work/systems/revops-engine",
  data: {
    table: "staging.contacts_<batch>",
    project_id: "mrmnyscurmkfppicqqhk",
    columns: ["prep_routed='edge'"],
  },
  trigger: {
    type: "manual",
    detail: "node route-runner.mjs <batch>",
  },
  runner: {
    type: "node-script",
    path: "/Users/nplmini/code/work/systems/revops-engine/route-runner.mjs",
    args: [],
    cwd: "/Users/nplmini/code/work/systems/revops-engine",
  },
  reads: ["staging contact rows without verified_email"],
  writes: ["staging.contacts_<batch>.prep_routed='edge'"],
  see_it: { surface: "/staging" },
  change_it: {
    file: "/Users/nplmini/code/work/systems/revops-engine/route-runner.mjs",
  },
  static_status: "unset",
  credit_spender: false,
};

const ACTIVITIES: Activity[] = [
  SIGNAL_BATCH,
  CLASSIFY,
  EVIDENCE_GATE,
  PROMOTE_COMPANIES,
  FIND_CONTACTS,
  VERIFY_EMAIL,
  PROMOTE_CONTACTS,
  ROUTE_EDGE,
];

// ─── L2 Workflow: "build the list" ─────────────────────────────────────────
// 8 nodes (bridge removed in 2026-06-29 collapse). Branch from verify-work-email
// drops down to the unreachable-edge node.

const BUILD_THE_LIST: Workflow = {
  workflow_id: "wf-build-the-list",
  name: "build the list",
  control_flow: "fixed",
  viewbox: { width: 1000, height: 320 },
  nodes: [
    { node_id: "n1", activity_id: "signal-batch",            label: "signal batch",       position: { x:  60, y: 120 } },
    { node_id: "n2", activity_id: "classify-segment-screen", label: "classify",           position: { x: 200, y: 120 } },
    { node_id: "n3", activity_id: "evidence-gate-verify",    label: "evidence gate",      position: { x: 340, y: 120 } },
    { node_id: "n4", activity_id: "promote-companies",       label: "promote companies",  position: { x: 480, y: 120 } },
    { node_id: "n5", activity_id: "find-icp-contacts",       label: "find contacts",      position: { x: 620, y: 120 } },
    { node_id: "n6", activity_id: "verify-work-email",       label: "verify email",       position: { x: 760, y: 120 } },
    { node_id: "n7", activity_id: "promote-contacts",        label: "promote contacts",   position: { x: 900, y: 120 } },
    { node_id: "n8", activity_id: "route-unreachable-edge",  label: "unreachable → edge", position: { x: 760, y: 240 } },
  ],
  edges: [
    { from: "n1", to: "n2", branch: "default" },
    { from: "n2", to: "n3", branch: "default" },
    { from: "n3", to: "n4", branch: "default" },
    { from: "n4", to: "n5", branch: "default" },
    { from: "n5", to: "n6", branch: "default" },
    { from: "n6", to: "n7", branch: "default" },
    { from: "n6", to: "n8", branch: "edge", label: "unreachable" },
  ],
};

const WORKFLOWS: Workflow[] = [BUILD_THE_LIST];

// ─── L1 SOP spine ──────────────────────────────────────────────────────────
// 15 stages — venture-agnostic procedure. Specific engagements (e.g.
// konstellation-cipo) are SopRun targets, not properties of the SOP itself.
//
// Workflow bindings (Contract A): the build-the-list workflow is bound only
// to stage 9 (the build-the-list anchor) in slice 1. The workflow honestly
// contributes to stages 1, 4, 5, 8 too; the drift reconciler refines this.

const SOP: Sop = {
  sop_id: "launch-outbound-for-venture",
  name: "Launch outbound for a venture",
  description:
    "Standard procedure for launching an outbound campaign on behalf of a venture. 15 stages from signal-watch through send. Reusable: invoked once per venture as a SopRun. Slice-1 expansion: the build-the-list workflow (stage 9).",
  stages: [
    {
      stage_id: "s1-signal-watch",
      order: 1,
      name: "Signal watch lands raw companies",
      required_end_state:
        "The prospects landing table has a current daily batch of raw company signals from configured signal sources.",
      gate_type: "automated",
      workflow_ids: [],
    },
    {
      stage_id: "s2-discovery-recipe",
      order: 2,
      name: "Discovery recipe governs the signal→lead pipeline shape",
      required_end_state:
        "The discovery recipe artifact is ratified and references the venture's targeting contract.",
      gate_type: "approval",
      workflow_ids: [],
    },
    {
      stage_id: "s3-targeting-contract",
      order: 3,
      name: "Targeting artifacts (WHO/WHAT) approved as the qualification contract",
      required_end_state:
        "WHO + WHAT artifacts are signed off; the classifier reads them as ground truth.",
      gate_type: "approval",
      workflow_ids: [],
    },
    {
      stage_id: "s4-enrich-qualify",
      order: 4,
      name: "Enrich + qualify prospects (firmographics → ICP contacts → verified email → verdict)",
      required_end_state:
        "Prospects have firmographics, ICP-title contacts, verified email, and a qualification verdict.",
      gate_type: "automated",
      workflow_ids: [],
    },
    {
      stage_id: "s5-prep-funnel",
      order: 5,
      name: "RevOps prep funnel: deterministic + semantic classification",
      required_end_state:
        "Each company has prep_verdict + prep_qualified set; rationale captured.",
      gate_type: "automated",
      workflow_ids: [],
    },
    {
      stage_id: "s6-crm-suppression",
      order: 6,
      name: "CRM suppression + existing-customer gate (deterministic)",
      required_end_state:
        "Suppressed companies (existing customers, recent activity, do-not-contact) are flagged out of the batch.",
      gate_type: "automated",
      workflow_ids: [],
    },
    {
      stage_id: "s7-flag-resolve",
      order: 7,
      name: "Flag-resolve: operator review of novel flags",
      required_end_state:
        "All flagged-novel rows have an operator verdict; rationale captured for future rules.",
      gate_type: "decision",
      workflow_ids: [],
    },
    {
      stage_id: "s8-promote-companies",
      order: 8,
      name: "Promote qualified companies to Core",
      required_end_state:
        "Qualified companies appear in public.companies with a ledger row in public.staging_promotions.",
      gate_type: "automated",
      workflow_ids: [],
    },
    {
      stage_id: "s9-build-the-list",
      order: 9,
      name: "Source + screen contacts at promoted companies",
      required_end_state:
        "Each promoted company has at least one ICP-title contact with a verified work email, or is routed to 'edge'.",
      gate_type: "automated",
      workflow_ids: ["wf-build-the-list"],
    },
    {
      stage_id: "s10-promote-contacts",
      order: 10,
      name: "Promote contacts to Core + export the qualified list",
      required_end_state:
        "Qualified contacts appear in public.contacts; export artifact (CSV or Airtable payload) is ready.",
      gate_type: "automated",
      workflow_ids: [],
    },
    {
      stage_id: "s11-offer-ladder",
      order: 11,
      name: "Offer ladder approved (HINGE that unblocks copy)",
      required_end_state:
        "The offer ladder artifact is signed off; copy can reference its rungs.",
      gate_type: "approval",
      workflow_ids: [],
    },
    {
      stage_id: "s12-produce-sequence",
      order: 12,
      name: "Produce the cold sequence (System M): rules-gate + LLM-judge",
      required_end_state:
        "Cold sequence draft exists and passes rules-gate + LLM-judge.",
      gate_type: "automated",
      workflow_ids: [],
    },
    {
      stage_id: "s13-expert-certifies",
      order: 13,
      name: "Expert certifies the copy (sign-off)",
      required_end_state:
        "The venture's expert has signed off on the copy in their voice; refused-phrasings list updated.",
      gate_type: "approval",
      workflow_ids: [],
    },
    {
      stage_id: "s14-operator-signs-off",
      order: 14,
      name: "Operator signs off on targeting + send strategy",
      required_end_state:
        "Operator has approved targeting + send window + sender identity.",
      gate_type: "approval",
      workflow_ids: [],
    },
    {
      stage_id: "s15-send-sequence",
      order: 15,
      name: "Send the sequence on the expert's channel",
      required_end_state:
        "Sequence is sent on the expert's channel (LinkedIn / email); first replies routed for capture.",
      gate_type: "automated",
      workflow_ids: [],
    },
  ],
};

// ─── SopRuns (slice-1 hand-authored) ───────────────────────────────────────

const KONSTELLATION_CIPO_RUN: SopRun = {
  run_id: "run-konstellation-cipo-initial",
  sop_id: "launch-outbound-for-venture",
  target_engagement: "konstellation-cipo",
  started_at: "2026-06-29T00:00:00Z",
};

// ─── Bundle export ─────────────────────────────────────────────────────────

export const launchOutboundForVentureSop: SopBundle = {
  sop: SOP,
  workflows: WORKFLOWS,
  activities: ACTIVITIES,
  runs: [KONSTELLATION_CIPO_RUN],
};
