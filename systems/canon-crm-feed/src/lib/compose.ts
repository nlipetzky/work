// Composes the daily touch message. LLM-optional:
//  - with ANTHROPIC_API_KEY: writes a real, grounded draft in Nick's voice.
//  - without: returns a short brief for Nick to finish (no fabricated content).
// Partner-facing, so voice rules are strict and grounding is mandatory.
import Anthropic from "@anthropic-ai/sdk";
import type { Contact } from "./airtable.js";
import type { Intent } from "./attention.js";

const VOICE =
  'Write as Nick Lipetzky, peer-to-peer, warm, brief. HARD RULES: no em dashes or en dashes (use "..."), ' +
  'no emojis, no agency-speak ("circle back", "touch base", "synergy", "unlock value", "hope this finds you"). ' +
  "GROUNDING (critical): use ONLY facts explicitly in the context. Never reference a deal, project, event, " +
  "person, or outcome that is not in the context. Do NOT open with assumptions about unmentioned events " +
  '(no "hope X went well"). If you have nothing specific, keep the opener neutral. ' +
  '3 to 6 sentences. Sign off "Nick".';

// LLMs ignore "no em dash" instructions, so enforce it deterministically.
function clean(s: string): string {
  return s.replace(/[—–]/g, " ... ").replace(/ {2,}/g, " ").replace(/ +\n/g, "\n").trim();
}

export async function composeBody(c: Contact, intent: Intent): Promise<{ subject: string; body: string }> {
  const ctx = {
    name: c.name, company: c.company, type: c.type, stage: c.stage,
    waitingOn: c.waitingOn, nextAction: c.nextAction, notes: c.notes, recent: c.recent, intent,
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      subject: intent === "advance" ? `Next step with ${c.company || c.name}` : "Quick note",
      body:
        `[DRAFT BRIEF -- no ANTHROPIC_API_KEY set, so write this one yourself]\n` +
        `Intent: ${intent}\nWaiting on: ${c.waitingOn ?? "n/a"}\n` +
        `Open item: ${c.nextAction || "none recorded"}\nLast touch: ${c.recent[0]?.date ?? "none"}\n\n` +
        `Write a short ${intent} message to ${c.name || c.company}.`,
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
  const sys =
    `${VOICE}\nIntent guide: "advance" = move the specific open item forward. ` +
    `"nurture" = share one genuinely useful, generic-but-relevant insight or question, not filler. ` +
    `Return ONLY JSON: {"subject": "...", "body": "..."}.`;
  const res = await client.messages.create({
    model, max_tokens: 700, system: sys,
    messages: [{ role: "user", content: JSON.stringify(ctx) }],
  });
  const text = res.content.map((b: any) => (b.type === "text" ? b.text : "")).join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { subject: "Quick note", body: clean(text) };
  const parsed = JSON.parse(m[0]);
  return { subject: clean(parsed.subject ?? "Quick note"), body: clean(parsed.body ?? "") };
}
