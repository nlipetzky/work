import "server-only";
import { structuredCall, MODELS } from "@/lib/ai";
import { PACKAGING_DOCTRINE, DOCTRINE_VERSION } from "./doctrine";
import { checkPacketRules, type PacketMemberInput, type GateResult } from "./gate";
export type { PacketMemberInput } from "./gate";

// The review-packet producer: a deterministic produce -> judge loop. CODE owns the loop; the
// model is a called function at produce + judge only (mirrors govern-artifacts.mjs). The
// deterministic gate runs FIRST. The judge scores against the packaging doctrine. No fabrication.

const MAX_REVISIONS = 3;

export interface ComposeInput {
  expertSlug: string;
  expertName: string;
  expertEmail: string | null;
  expertSummary: string | null; // who Hermes is to them / their role, for the context-first opening
  engagementType: string;
  engagementId: string;
  members: PacketMemberInput[];
}

export interface ComposedDraft {
  subject: string;
  body: string;
  item_order: string[];
  per_item: { exchange_id: string; one_line_ask: string }[];
}

export interface JudgeVerdict {
  pass: boolean;
  scores: Record<string, number>;
  feedback: string;
}

export interface ComposeResult {
  ok: boolean;
  gate: GateResult;
  draft: ComposedDraft | null;
  doctrineVersion: string;
  rulesPassed: GateResult;
  judgeNotes: { iterations: number; final: JudgeVerdict | null; history: JudgeVerdict[] };
  error?: string;
}

const PRODUCE_SCHEMA = {
  type: "object" as const,
  properties: {
    subject: { type: "string", description: "Subject line for the single email to the expert." },
    body: {
      type: "string",
      description:
        "The ONE communication body in markdown. Context-first opening, then each item decision-led and prioritized.",
    },
    item_order: {
      type: "array",
      items: { type: "string" },
      description: "Member exchange ids in the order presented (highest-leverage/blocking first).",
    },
    per_item: {
      type: "array",
      items: {
        type: "object",
        properties: {
          exchange_id: { type: "string" },
          one_line_ask: { type: "string", description: "The specific decision needed, one line." },
        },
        required: ["exchange_id", "one_line_ask"],
      },
    },
  },
  required: ["subject", "body", "item_order", "per_item"],
};

const JUDGE_SCHEMA = {
  type: "object" as const,
  properties: {
    pass: { type: "boolean" },
    scores: {
      type: "object",
      description: "1-5 per doctrine dimension.",
      properties: {
        consolidation: { type: "number" },
        context_opening: { type: "number" },
        decision_led: { type: "number" },
        cognitive_load: { type: "number" },
        no_fabrication: { type: "number" },
        faithful_coverage: { type: "number" },
      },
      required: ["consolidation", "context_opening", "decision_led", "cognitive_load", "no_fabrication", "faithful_coverage"],
    },
    feedback: { type: "string", description: "Specific, actionable. Empty if pass." },
  },
  required: ["pass", "scores", "feedback"],
};

function renderMembers(members: PacketMemberInput[]): string {
  return members
    .map((m, i) => {
      const link = m.artifact_id
        ? `linked artifact ${m.artifact_id}`
        : m.sequence_id
          ? `linked outreach sequence ${m.sequence_id}`
          : "no linked object";
      return [
        `--- ASK ${i + 1} (exchange_id: ${m.id}; kind: ${m.kind ?? "?"}; ${link}) ---`,
        `SUBJECT: ${m.subject ?? ""}`,
        `BODY:\n${m.body ?? ""}`,
      ].join("\n");
    })
    .join("\n\n");
}

async function produce(input: ComposeInput, priorFeedback: string | null): Promise<ComposedDraft> {
  const system =
    "You are Hermes, the expert-liaison operator. You compose ONE communication TO a domain " +
    "expert that bundles a collection of pending asks into a single, coherent, prioritized, " +
    "non-overwhelming message. You are a called function, not an agent.\n\n" +
    "Hard rules: invent NOTHING. Do not fabricate the expert's POV, facts, a verdict, or approval. " +
    "Every item's framing must trace to its source ask below. Cover every ask; you may reorder and " +
    "reframe for clarity but may not drop an ask or soften it. This is OUR message to them, not a " +
    "draft of their words.\n\n" +
    "FORMAT: output PLAIN TEXT only ... it is pasted straight into a Gmail compose window. NO " +
    "markdown of any kind: no # headers, no * or ** for bold/italic, no markdown bullets or links. " +
    "Use ordinary sentences, simple numbered points like '1.' '2.', and blank lines between them.\n\n" +
    PACKAGING_DOCTRINE;
  const user =
    `EXPERT: ${input.expertName} (${input.expertSlug})\n` +
    `WHO THEY ARE / ROLE: ${input.expertSummary ?? "(none on record)"}\n` +
    `ENGAGEMENT: ${input.engagementType}/${input.engagementId}\n\n` +
    `PENDING ASKS (the members to bundle):\n\n${renderMembers(input.members)}\n\n` +
    (priorFeedback ? `FIX THIS FEEDBACK FROM REVIEW:\n${priorFeedback}\n\n` : "") +
    "Compose the single communication. In the body, present each item decision-led (lead with the " +
    "specific decision needed) and prioritized. Reference detail rather than pasting it wholesale. " +
    "Reassure that nothing acts or sends without their say.";
  return structuredCall<ComposedDraft>({
    system,
    prompt: user,
    schemaName: "review_packet",
    schema: PRODUCE_SCHEMA,
    model: MODELS.judgment,
    maxTokens: 3000,
  });
}

async function judge(input: ComposeInput, draft: ComposedDraft): Promise<JudgeVerdict> {
  const system =
    "You are an adversarial reviewer scoring a review packet (one message bundling expert asks) " +
    "against the Hermes packaging doctrine. Be strict. Score only the fuzzy quality. Fail the " +
    "packet if it reads as stapled-together asks, buries the decision, paste-dumps detail, omits " +
    "or softens any source ask, or fabricates anything.\n\n" +
    PACKAGING_DOCTRINE;
  const user =
    `SOURCE ASKS (must all be covered, faithfully):\n\n${renderMembers(input.members)}\n\n` +
    `COMPOSED PACKET:\nSUBJECT: ${draft.subject}\n\nBODY:\n${draft.body}\n\n` +
    "Score 1-5 per dimension and set pass=true only if every dimension is >=4 and coverage is faithful.";
  return structuredCall<JudgeVerdict>({
    system,
    prompt: user,
    schemaName: "packet_review",
    schema: JUDGE_SCHEMA,
    model: MODELS.judgment,
    maxTokens: 1200,
  });
}

export async function composePacket(input: ComposeInput): Promise<ComposeResult> {
  const gate = checkPacketRules({
    expertName: input.expertName,
    expertEmail: input.expertEmail,
    members: input.members,
  });
  const base: Omit<ComposeResult, "ok" | "draft" | "error"> = {
    gate,
    doctrineVersion: DOCTRINE_VERSION,
    rulesPassed: gate,
    judgeNotes: { iterations: 0, final: null, history: [] },
  };
  if (!gate.pass) {
    return { ...base, ok: false, draft: null, error: `gate failed: ${gate.failures.join("; ")}` };
  }

  const history: JudgeVerdict[] = [];
  let feedback: string | null = null;
  let accepted: ComposedDraft | null = null;
  let lastDraft: ComposedDraft | null = null;
  let lastVerdict: JudgeVerdict | null = null;

  for (let rev = 1; rev <= MAX_REVISIONS; rev++) {
    const draft = await produce(input, feedback);
    lastDraft = draft;
    const verdict = await judge(input, draft);
    history.push(verdict);
    lastVerdict = verdict;
    if (verdict.pass) {
      accepted = draft;
      base.judgeNotes = { iterations: rev, final: verdict, history };
      break;
    }
    feedback = verdict.feedback;
    base.judgeNotes = { iterations: rev, final: verdict, history };
  }

  // If the judge never passed within the cap, surface the best (last) attempt for the human to
  // edit rather than blocking ... Nick/Hermes is the gate of record, the judge is advisory here.
  const draft = accepted ?? lastDraft;
  return {
    ...base,
    ok: !!draft,
    draft,
    judgeNotes: base.judgeNotes.final ? base.judgeNotes : { iterations: history.length, final: lastVerdict, history },
    error: accepted ? undefined : "judge did not pass within revision cap; surfacing best attempt for human edit",
  };
}
