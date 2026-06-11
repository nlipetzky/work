// db-batch.mjs — batched UPDATE for the per-row-write wall (§6.1 of the mRNA handoff).
//
// The scaling break: classify/verify/loaders write one row at a time via the Supabase Management
// API, which 429-rate-limits over a ~500-row batch. The fix is one UPDATE per ~25 rows using a
// VALUES list, cutting API calls ~25x:
//
//   UPDATE staging.<t> AS dst
//   SET col_a = src.col_a, col_b = src.col_b
//   FROM (VALUES ('<id1>','a1','b1'), ('<id2>','a2','b2')) AS src(id, col_a, col_b)
//   WHERE dst.id = src.id::uuid;
//
// buildBatchUpdate is a PURE function (no DB) — testable in isolation. flushBatched is the thin
// executor that chunks rows and calls a caller-supplied runSql. Staging columns are text; the key
// is cast (default ::uuid). Adopt in classify-runner/verify-runner/gates AFTER the live run frees
// the engine — do not hot-swap a runner mid-batch.

const sqlLit = (v) => v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`;

/**
 * Build one UPDATE … FROM (VALUES …) statement.
 * @param {string} table      schema-qualified, e.g. "staging.companies_x"
 * @param {string} keyCol     row key column, e.g. "id"
 * @param {string[]} cols     columns to set (text)
 * @param {object[]} rows     each row has keyCol + every col in `cols`
 * @param {string} keyCast    SQL cast for the key in VALUES, default "uuid"
 * @param {object} casts      optional per-column SQL cast for the SET, e.g. {prep_criteria:"jsonb"}.
 *                            VALUES literals are always text; a cast coerces them into the dst type
 *                            (jsonb/boolean/int). Omitted columns stay text. Default {}.
 * @returns {string|null}     SQL, or null when rows is empty
 */
export function buildBatchUpdate(table, keyCol, cols, rows, keyCast = "uuid", casts = {}) {
  if (!rows || rows.length === 0) return null;
  const setClause = cols.map((c) => `"${c}" = src."${c}"${casts[c] ? "::" + casts[c] : ""}`).join(", ");
  const values = rows.map((r) =>
    `(${sqlLit(r[keyCol])}, ${cols.map((c) => sqlLit(r[c])).join(", ")})`
  ).join(",\n    ");
  const srcCols = [keyCol, ...cols].map((c) => `"${c}"`).join(", ");
  const keyRef = keyCast ? `src."${keyCol}"::${keyCast}` : `src."${keyCol}"`;
  return `update ${table} as dst set ${setClause}
  from (values
    ${values}
  ) as src(${srcCols})
  where dst."${keyCol}" = ${keyRef};`;
}

/**
 * Chunk rows and flush each chunk as one UPDATE via a caller-supplied async runSql(sql).
 * Returns the number of rows flushed. runSql should already carry the 429 retry-backoff.
 */
export async function flushBatched(runSql, table, keyCol, cols, rows, { chunk = 25, keyCast = "uuid", casts = {} } = {}) {
  let n = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const sql = buildBatchUpdate(table, keyCol, cols, slice, keyCast, casts);
    if (sql) { await runSql(sql); n += slice.length; }
  }
  return n;
}
