import { NextResponse } from "next/server";
import { canonDb } from "@/lib/canon";
import { SOPS } from "@/lib/sops";
import type { Sop, SopStage, Workflow, Activity } from "@/lib/sops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/operate/sync-canon
// Bootstraps canon.public.{sops,sop_stages,sop_stage_workflows,workflows,
// workflow_nodes,workflow_edges,sop_activities} from the in-code SOPS bundle.
// Idempotent: upserts version=1, is_current=true rows.
//
// This is a one-shot bootstrap. Once BUILD-mode publish lands, canon becomes
// the source-of-truth and this route can be retired (or kept as a re-seed for
// when the TS bundle is edited by hand during slice-2 transition).
//
// Loopback-only.

const LOOPBACK_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "localhost:4180",
  "127.0.0.1:4180",
]);

export async function POST(req: Request) {
  const host = req.headers.get("host") ?? "";
  if (!LOOPBACK_HOSTS.has(host)) {
    return NextResponse.json({ error: "loopback only" }, { status: 403 });
  }

  const db = canonDb();
  const counts = {
    sops: 0,
    sop_stages: 0,
    sop_stage_workflows: 0,
    workflows: 0,
    workflow_nodes: 0,
    workflow_edges: 0,
    sop_activities: 0,
  };
  const errors: string[] = [];

  for (const bundle of SOPS) {
    const sop: Sop = bundle.sop;

    // ── sops ───────────────────────────────────────────────────────────────
    {
      const { error } = await db.from("sops").upsert(
        {
          sop_id: sop.sop_id,
          version: 1,
          is_current: true,
          name: sop.name,
          description: sop.description,
          owning_system_slug: "operating-sop",
        },
        { onConflict: "sop_id,version" },
      );
      if (error) errors.push(`sops:${sop.sop_id}: ${error.message}`);
      else counts.sops++;
    }

    // ── sop_stages + sop_stage_workflows ───────────────────────────────────
    for (const stage of sop.stages as SopStage[]) {
      const { error: stErr } = await db.from("sop_stages").upsert(
        {
          stage_id: stage.stage_id,
          version: 1,
          is_current: true,
          sop_id: sop.sop_id,
          order_index: stage.order,
          name: stage.name,
          required_end_state: stage.required_end_state,
          gate_type: stage.gate_type ?? null,
        },
        { onConflict: "stage_id,version" },
      );
      if (stErr) errors.push(`sop_stages:${stage.stage_id}: ${stErr.message}`);
      else counts.sop_stages++;

      for (let i = 0; i < (stage.workflow_ids ?? []).length; i++) {
        const wfId = stage.workflow_ids[i];
        const { error: swErr } = await db.from("sop_stage_workflows").upsert(
          {
            sop_id: sop.sop_id,
            stage_id: stage.stage_id,
            workflow_id: wfId,
            version: 1,
            ordinal: i,
          },
          { onConflict: "sop_id,stage_id,workflow_id,version" },
        );
        if (swErr) errors.push(`sop_stage_workflows:${stage.stage_id}->${wfId}: ${swErr.message}`);
        else counts.sop_stage_workflows++;
      }
    }

    // ── workflows + nodes + edges ──────────────────────────────────────────
    for (const wf of bundle.workflows as Workflow[]) {
      const { error: wfErr } = await db.from("workflows").upsert(
        {
          workflow_id: wf.workflow_id,
          version: 1,
          is_current: true,
          name: wf.name,
          control_flow: wf.control_flow,
          viewbox: wf.viewbox ?? {},
        },
        { onConflict: "workflow_id,version" },
      );
      if (wfErr) errors.push(`workflows:${wf.workflow_id}: ${wfErr.message}`);
      else counts.workflows++;

      // wipe + reinsert nodes/edges for this (workflow_id, version) so
      // re-syncs reflect bundle changes without orphan rows.
      await db
        .from("workflow_nodes")
        .delete()
        .eq("workflow_id", wf.workflow_id)
        .eq("version", 1);
      for (const n of wf.nodes) {
        const { error: nErr } = await db.from("workflow_nodes").insert({
          workflow_id: wf.workflow_id,
          version: 1,
          node_id: n.node_id,
          activity_id: n.activity_id,
          label: n.label,
          position: n.position ?? {},
        });
        if (nErr) errors.push(`workflow_nodes:${wf.workflow_id}/${n.node_id}: ${nErr.message}`);
        else counts.workflow_nodes++;
      }

      await db
        .from("workflow_edges")
        .delete()
        .eq("workflow_id", wf.workflow_id)
        .eq("version", 1);
      for (const e of wf.edges) {
        const { error: eErr } = await db.from("workflow_edges").insert({
          workflow_id: wf.workflow_id,
          version: 1,
          from_node: e.from,
          to_node: e.to,
          branch: e.branch ?? null,
          label: e.label ?? null,
        });
        if (eErr) errors.push(`workflow_edges:${wf.workflow_id}/${e.from}->${e.to}: ${eErr.message}`);
        else counts.workflow_edges++;
      }
    }

    // ── sop_activities ─────────────────────────────────────────────────────
    for (const a of bundle.activities as Activity[]) {
      // Find which workflow + stage this activity sits under (loose text refs).
      let workflow_id: string | null = null;
      let stage_id: string | null = null;
      for (const wf of bundle.workflows) {
        const node = wf.nodes.find((n) => n.activity_id === a.activity_id);
        if (node) {
          workflow_id = wf.workflow_id;
          for (const s of sop.stages) {
            if ((s.workflow_ids ?? []).includes(wf.workflow_id)) {
              stage_id = s.stage_id;
              break;
            }
          }
          break;
        }
      }

      const { error: aErr } = await db.from("sop_activities").upsert(
        {
          activity_id: a.activity_id,
          version: 1,
          is_current: true,
          sop_id: sop.sop_id,
          stage_id,
          workflow_id,
          name: a.name,
          what: a.what,
          description: null,
          executor_class: a.executor_class,
          owning_system_slug: a.owning_system,
          owning_system_folder: a.owning_system_folder,
          data_binding: a.data,
          trigger: a.trigger,
          runner: a.runner,
          ai: a.ai ?? null,
          reads: a.reads ?? [],
          writes: a.writes ?? [],
          see_it: a.see_it,
          change_it: a.change_it,
          static_status: a.static_status ?? null,
          block_reason: a.block_reason ?? null,
          credit_spender: a.credit_spender ?? false,
          // Slice-2B redesign columns ... empty for now; populated as we author them.
          route_component: null,
          function_path: a.runner.path ?? null,
          trigger_event: a.trigger.type === "upstream-event" ? a.trigger.detail : null,
          schemas: null,
          adapters: null,
          skills: null,
          provenance_consumes: null,
          provenance_writes: null,
          concurrency: null,
          retry: null,
        },
        { onConflict: "activity_id,version" },
      );
      if (aErr) errors.push(`sop_activities:${a.activity_id}: ${aErr.message}`);
      else counts.sop_activities++;
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    counts,
    errors: errors.slice(0, 20),
    error_count: errors.length,
  });
}
