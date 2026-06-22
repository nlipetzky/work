import "server-only";

export function getAirtableKey(): string {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("Missing AIRTABLE_API_KEY");
  return key;
}

export const REVOPS_BASE_ID =
  process.env.AIRTABLE_REVOPS_BASE_ID ?? "appYBYH3aOHhTODAw";

export const COMPANIES_TABLE_ID =
  process.env.AIRTABLE_COMPANIES_TABLE_ID ?? "tblnj3YlOI3thjrXp";

export const CONTACTS_TABLE_ID =
  process.env.AIRTABLE_CONTACTS_TABLE_ID ?? "tblWJksRL1yKSUgrm";
