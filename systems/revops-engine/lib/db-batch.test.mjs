// Pure tests for the batched-write SQL builder — NO database, NO API load.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBatchUpdate, flushBatched } from "./db-batch.mjs";

test("empty rows → null (nothing to flush)", () => {
  assert.equal(buildBatchUpdate("staging.companies_x", "id", ["prep_verdict"], []), null);
});

test("single-column update builds one VALUES row, casts the key", () => {
  const sql = buildBatchUpdate("staging.companies_x", "id", ["prep_verdict"], [{ id: "u1", prep_verdict: "IN" }]);
  assert.match(sql, /update staging\.companies_x as dst set "prep_verdict" = src\."prep_verdict"/);
  assert.match(sql, /\('u1', 'IN'\)/);
  assert.match(sql, /as src\("id", "prep_verdict"\)/);
  assert.match(sql, /where dst\."id" = src\."id"::uuid;/);
});

test("multi-column, multi-row builds one statement", () => {
  const sql = buildBatchUpdate("staging.companies_x", "id", ["a", "b"], [
    { id: "u1", a: "x", b: "y" },
    { id: "u2", a: "p", b: "q" },
  ]);
  assert.equal((sql.match(/update /g) || []).length, 1);       // ONE statement for two rows
  assert.match(sql, /\('u1', 'x', 'y'\),/);
  assert.match(sql, /\('u2', 'p', 'q'\)/);
});

test("escapes single quotes and nulls", () => {
  const sql = buildBatchUpdate("staging.t", "id", ["note"], [{ id: "u1", note: "O'Brien" }, { id: "u2", note: null }]);
  assert.match(sql, /'O''Brien'/);
  assert.match(sql, /, null\)/);
});

test("flushBatched chunks rows and counts flushed", async () => {
  const calls = [];
  const fakeRun = async (sql) => calls.push(sql);
  const rows = Array.from({ length: 60 }, (_, i) => ({ id: `u${i}`, v: String(i) }));
  const n = await flushBatched(fakeRun, "staging.t", "id", ["v"], rows, { chunk: 25 });
  assert.equal(n, 60);
  assert.equal(calls.length, 3);                               // 25 + 25 + 10 = 3 API calls, not 60
});
