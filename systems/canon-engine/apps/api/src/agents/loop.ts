/**
 * Generic Anthropic tool-use agent loop.
 * Handles the assistant↔tool_result message threading until end_turn.
 */
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "./client.js";

export interface AgentRunOptions {
  model: string;
  system: string;
  tools: Anthropic.Tool[];
  input: string;
  maxIterations?: number;
  handleTool: (name: string, input: Record<string, unknown>) => Promise<unknown>;
}

export interface AgentRunResult {
  result: string;
  iterations: number;
}

export async function runAgentLoop(opts: AgentRunOptions): Promise<AgentRunResult> {
  const { model, system, tools, handleTool, maxIterations = 20 } = opts;
  const client = getAnthropicClient();

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: opts.input },
  ];

  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      return { result: text, iterations };
    }

    if (response.stop_reason !== "tool_use") {
      return {
        result: `Agent stopped with reason: ${response.stop_reason}`,
        iterations,
      };
    }

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      try {
        const result = await handleTool(
          block.name,
          block.input as Record<string, unknown>,
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result, null, 2),
        });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          is_error: true,
          content: err instanceof Error ? err.message : String(err),
        });
      }
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  return { result: `Agent hit iteration limit (${maxIterations})`, iterations };
}
