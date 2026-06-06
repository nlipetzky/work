// The core guard. "Filled" must never mean "is not null".
//
// A Clay export once collapsed rich columns to the literal strings "Response" /
// "Running…" / "10 Results Found". A naive non-null check counts those as filled, and an
// agent then reports "76 of 77 enriched" — false. This module is the single, shared
// definition of what counts as REAL data. The UI renders from it; any agent reads from it.
// There is no second definition.

export type Validity = "real" | "empty" | "placeholder";

// Known placeholder sentinels. Build-time confirmation from Nick can extend this list;
// these are the ones observed in the wild so far.
const SENTINELS: RegExp[] = [
  /^response$/i,
  /^running\s*…$/i,
  /^running\.{0,3}$/i,
  /^\d[\d,]*\s+(results?\s+found|result|results)$/i, // "10 Results Found"
  /^n\/?a$/i,
  /^pending$/i,
  /^processing$/i,
  /^tbd$/i,
  /^—$/,
];

export function classifyValue(v: unknown): Validity {
  if (v === null || v === undefined) return "empty";

  if (typeof v === "string") {
    const s = v.trim();
    if (s === "") return "empty";
    if (SENTINELS.some((re) => re.test(s))) return "placeholder";
    return "real";
  }

  if (Array.isArray(v)) return v.length > 0 ? "real" : "empty";

  if (typeof v === "object") {
    return Object.keys(v as object).length > 0 ? "real" : "empty";
  }

  // numbers (incl. 0), booleans (incl. false) are real values
  return "real";
}

export function isReal(v: unknown): boolean {
  return classifyValue(v) === "real";
}

// Coverage tally for a single column across many rows. Used by the column inspector
// and stat cards so "how full is this column" can never be asserted off placeholders.
export interface Coverage {
  total: number;
  real: number;
  placeholder: number;
  empty: number;
}

export function tallyColumn(values: unknown[]): Coverage {
  const cov: Coverage = { total: values.length, real: 0, placeholder: 0, empty: 0 };
  for (const v of values) {
    cov[classifyValue(v)]++;
  }
  return cov;
}
