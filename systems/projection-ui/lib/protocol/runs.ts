import "server-only";
import { canonDb } from "@/lib/canon";
import type { ProtocolRun } from "@/lib/protocol/types";

// CRUD for the protocol_runs state row. Service-role; only the protocol API routes touch it.

export async function createRun(): Promise<ProtocolRun> {
  const { data, error } = await canonDb()
    .from("protocol_runs")
    .insert({ status: "running", step: null })
    .select("*")
    .single();
  if (error) throw new Error(`createRun failed: ${error.message}`);
  return data as ProtocolRun;
}

export async function getRun(id: string): Promise<ProtocolRun | null> {
  const { data, error } = await canonDb().from("protocol_runs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getRun failed: ${error.message}`);
  return (data as ProtocolRun | null) ?? null;
}

// The most recent run still in flight, so the surface can resume display after navigation.
export async function latestActiveRun(): Promise<ProtocolRun | null> {
  const { data, error } = await canonDb()
    .from("protocol_runs")
    .select("*")
    .in("status", ["running", "awaiting_triage", "awaiting_close"])
    .order("started", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`latestActiveRun failed: ${error.message}`);
  return (data as ProtocolRun | null) ?? null;
}

export async function updateRun(id: string, patch: Partial<ProtocolRun>): Promise<ProtocolRun> {
  const { data, error } = await canonDb()
    .from("protocol_runs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateRun failed: ${error.message}`);
  return data as ProtocolRun;
}
