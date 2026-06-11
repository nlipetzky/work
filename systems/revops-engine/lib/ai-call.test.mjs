// Pure tests for the shared AI-call parse helpers — NO network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { textFromContent, countToolUses, parseJsonLoose } from "./ai-call.mjs";

test("textFromContent joins text blocks, ignores tool-use", () => {
  const j = { content: [{ type: "text", text: "a" }, { type: "server_tool_use", name: "web_search" }, { type: "text", text: "b" }] };
  assert.equal(textFromContent(j), "a\nb");
});

test("textFromContent tolerates null/empty", () => {
  assert.equal(textFromContent(null), "");
  assert.equal(textFromContent({}), "");
});

test("countToolUses counts server_tool_use blocks", () => {
  const j = { content: [{ type: "server_tool_use" }, { type: "text", text: "x" }, { type: "server_tool_use" }] };
  assert.equal(countToolUses(j), 2);
});

test("parseJsonLoose prefers a fenced block", () => {
  assert.deepEqual(parseJsonLoose('here:\n```json\n{"verdict":"yes"}\n```\ndone'), { verdict: "yes" });
});

test("parseJsonLoose falls back to outermost braces", () => {
  assert.deepEqual(parseJsonLoose('prose {"a":1,"b":2} trailing'), { a: 1, b: 2 });
});

test("parseJsonLoose returns null when unparseable", () => {
  assert.equal(parseJsonLoose("no json here"), null);
  assert.equal(parseJsonLoose("{ not valid }"), null);
});
