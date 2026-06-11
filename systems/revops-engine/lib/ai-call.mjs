// ai-call.mjs — the single Anthropic "AI as a called function" path for the engine.
//
// verify-runner (evidence gate, no tools) and gate-ai-research (soft gates, web_search) both call
// Claude one row at a time. They used to each hand-roll their own client + 429/529 retry loop +
// JSON-fence parse — two AI-call paths that drift apart. This is the one path: same client, same
// backoff, same loose-JSON parse. The deterministic program still orchestrates; the AI judges one
// row at a time. (classify-runner can adopt this too; it kept its own loop only to avoid an edit
// mid-batch.)

const API = "https://api.anthropic.com/v1/messages";

/**
 * One Anthropic Messages call with shared rate-limit/overload backoff (429/529).
 * @param {object} o
 * @param {string} o.apiKey
 * @param {string} o.model
 * @param {string} [o.system]
 * @param {object[]} o.messages
 * @param {number} [o.maxTokens=1500]
 * @param {object[]} [o.tools]      e.g. the web_search tool block
 * @returns {Promise<object>}       the parsed response JSON (throws on non-ok after retries)
 */
export async function anthropicMessages({ apiKey, model, system, messages, maxTokens = 1500, tools }) {
  const body = { model, max_tokens: maxTokens, messages };
  if (system) body.system = system;
  if (tools) body.tools = tools;
  const payload = JSON.stringify(body);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: payload,
    });
    if ((res.status === 429 || res.status === 529) && attempt < 8) {
      await new Promise((r) => setTimeout(r, Math.min(30000, 2000 * Math.pow(1.7, attempt))));
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`anthropic ${res.status}: ${text.slice(0, 200)}`);
    return JSON.parse(text);
  }
}

/** Join the text blocks of a response (ignores tool-use blocks). */
export function textFromContent(j) {
  return ((j && j.content) || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

/** Count server tool uses (e.g. web searches) in a response. */
export function countToolUses(j) {
  return ((j && j.content) || []).filter((b) => b.type === "server_tool_use").length;
}

/**
 * Loose JSON extraction from model text: prefer a fenced ```json block, else the outermost {...}.
 * @returns {object|null} parsed object, or null when nothing parseable is found.
 */
export function parseJsonLoose(text) {
  const fenced = String(text).match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : String(text);
  const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
  if (s < 0 || e < 0) return null;
  try { return JSON.parse(raw.slice(s, e + 1)); } catch { return null; }
}
