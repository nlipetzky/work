import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// AI as a CALLED FUNCTION (doctrine): the protocol driver is deterministic code; it calls the
// model only for judgment (triage verdicts, the next-action rationale, the mirror summary).
// Structured output via forced tool-use so the return is always a validated JSON object.

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY in .env.local (protocol driver judgment calls).");
  _client = new Anthropic({ apiKey });
  return _client;
}

// Latest models per this environment. Quality work (rationale, mirror) → opus; the per-item
// triage loop → sonnet (cheaper at volume, plenty for classify+ladder).
export const MODELS = { judgment: "claude-opus-4-8", triage: "claude-sonnet-4-6" } as const;

type JsonSchema = { type: "object"; properties: Record<string, unknown>; required?: string[] };

// One structured call. Forces the named tool so `content` always carries the typed object.
export async function structuredCall<T>(opts: {
  system: string;
  prompt: string;
  schemaName: string;
  schema: JsonSchema;
  model?: string;
  maxTokens?: number;
}): Promise<T> {
  const msg = await client().messages.create({
    model: opts.model ?? MODELS.judgment,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    tools: [{ name: opts.schemaName, description: "Return the result in this shape.", input_schema: opts.schema as Anthropic.Tool.InputSchema }],
    tool_choice: { type: "tool", name: opts.schemaName },
    messages: [{ role: "user", content: opts.prompt }],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("model returned no structured output");
  return block.input as T;
}
