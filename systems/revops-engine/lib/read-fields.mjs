// read-fields.mjs — which staging columns the semantic classifier sends to the model, per play.
//
// The classifier reads one company's self-describing fields + SME gold and sends only those to the
// model. ngabs's set is biotech-specific; any other play overrides by dropping a read-fields.json
// (a JSON array of column names) in its classifier dir. Absent file => the ngabs default, so the
// existing play is byte-for-byte unaffected. `id` is always included (the SELECT + persist need it).

import fs from "fs";
import path from "path";

export const DEFAULT_READ_FIELDS = [
  "id", "name", "biotech_modality_types", "biotech_role", "company_focus",
  "explorium_company_focus", "explorium_business_description",
  "explorium_company_product_development", "classification_notes",
  "client_sme_note", "strategic_notes",
];

export function resolveReadFields(classifierDir) {
  const p = path.join(classifierDir, "read-fields.json");
  if (!fs.existsSync(p)) return DEFAULT_READ_FIELDS;
  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    throw new Error(`invalid read-fields.json (${p}): ${e.message}`);
  }
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`read-fields.json must be a non-empty array of column names (${p})`);
  }
  return arr.includes("id") ? arr : ["id", ...arr];
}
