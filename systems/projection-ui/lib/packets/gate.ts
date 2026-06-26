import "server-only";
import { CONSOLIDATION_BUDGET } from "./doctrine";

// The deterministic rules-gate. Runs FIRST, before any model call (the robust verification tier,
// mirroring govern-artifacts.mjs checkRules). If it fails, the producer does NOT call the model:
// we report what's missing rather than packaging junk.

export interface PacketMemberInput {
  id: string;
  subject: string | null;
  body: string | null;
  kind: string | null;
  artifact_id: string | null;
  sequence_id: string | null;
  status: string;
}

export interface PacketGateInput {
  expertName: string;
  expertEmail: string | null;
  members: PacketMemberInput[];
}

export interface GateResult {
  pass: boolean;
  checklist: { rule: string; pass: boolean; detail?: string }[];
  failures: string[];
}

export function checkPacketRules(input: PacketGateInput): GateResult {
  const checklist: GateResult["checklist"] = [];
  const { members, expertEmail } = input;

  const hasMembers = members.length >= 1;
  checklist.push({ rule: "has_members", pass: hasMembers, detail: `${members.length} pending ask(s)` });

  const allDrafted = members.every((m) => m.status === "drafted");
  checklist.push({
    rule: "all_drafted",
    pass: allDrafted,
    detail: allDrafted ? undefined : "one or more members already sent/answered",
  });

  const bodiesOk = members.every((m) => (m.subject ?? "").trim() && (m.body ?? "").trim());
  checklist.push({
    rule: "members_have_ask",
    pass: bodiesOk,
    detail: bodiesOk ? undefined : "a member is missing a subject or body",
  });

  const hasEmail = !!(expertEmail ?? "").trim();
  checklist.push({
    rule: "expert_has_email",
    pass: hasEmail,
    detail: hasEmail ? undefined : `set ${input.expertName}'s contact email in Experts first`,
  });

  const withinBudget = members.length <= CONSOLIDATION_BUDGET;
  checklist.push({
    rule: "within_consolidation_budget",
    pass: withinBudget,
    detail: withinBudget ? undefined : `${members.length} > ${CONSOLIDATION_BUDGET}; split into themed packets`,
  });

  const failures = checklist.filter((c) => !c.pass).map((c) => `${c.rule}${c.detail ? `: ${c.detail}` : ""}`);
  return { pass: failures.length === 0, checklist, failures };
}
