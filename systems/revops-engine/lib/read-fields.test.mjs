import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveReadFields, DEFAULT_READ_FIELDS } from "./read-fields.mjs";

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), "rf-")); }

test("resolveReadFields returns the ngabs default when no read-fields.json exists", () => {
  const f = resolveReadFields(tmp());
  assert.deepEqual(f, DEFAULT_READ_FIELDS);
  assert.ok(f.includes("id") && f.includes("name"));
});

test("resolveReadFields reads a play's custom field list and guarantees id", () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, "read-fields.json"),
    JSON.stringify(["name", "industry", "company_description"]));
  const f = resolveReadFields(dir);
  assert.equal(f[0], "id"); // id always present for the SELECT + persist
  assert.ok(f.includes("industry") && f.includes("company_description"));
  assert.ok(!f.includes("biotech_modality_types")); // default not leaked in
});

test("resolveReadFields keeps id where the play already listed it", () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, "read-fields.json"), JSON.stringify(["id", "name", "industry"]));
  assert.deepEqual(resolveReadFields(dir), ["id", "name", "industry"]);
});

test("resolveReadFields throws on a malformed read-fields.json", () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, "read-fields.json"), "{ not json ]");
  assert.throws(() => resolveReadFields(dir), /read-fields/);
});

test("resolveReadFields throws on an empty array", () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, "read-fields.json"), "[]");
  assert.throws(() => resolveReadFields(dir), /non-empty array/);
});
