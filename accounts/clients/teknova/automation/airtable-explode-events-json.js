// Airtable Automation script: Explode Events JSON to Company Events
//
// Base: RevOps Surface (appYBYH3aOHhTODAw)
// Trigger table: Companies (tblnj3YlOI3thjrXp)
// Trigger condition: "Events JSON Pending" is not empty
// Action: Run script (this file's contents pasted into the script step)
//
// Input variables to configure on the Automation script step:
//   - recordId  →  Airtable record ID of the triggering Companies row
//
// What it does:
//   1. Reads the triggering company's Events JSON Pending field.
//   2. Parses the JSON array.
//   3. For each event, finds-or-creates a Company Events record with the Company link populated.
//   4. Dedupes against existing events for the same company on (Event Type + Event Date + Event Title).
//   5. Clears Events JSON Pending on the parent so the trigger doesn't re-fire.
//
// Expected JSON payload shape (array of event objects):
//   [
//     {
//       "type": "press" | "funding" | "hiring" | "trial" | "conference",
//       "date": "2026-04-12",
//       "title": "Piramal launches expanded ADC manufacturing capacity",
//       "source_url": "https://...",
//       "trial_phase": "Phase II",        // optional, trial events
//       "indication": "HER2+ breast",     // optional, trial events
//       "funding_amount_usd": 50000000     // optional, funding events
//     },
//     ...
//   ]

// ============================================================
// CONFIG -- adjust if Company Events field names differ
// ============================================================
const COMPANIES_TABLE = "Companies";
const EVENTS_TABLE = "Company Events";
const PENDING_FIELD = "Events JSON Pending";

const EVENTS_FIELDS = {
    eventId: "Event ID",                 // primary text, used as dedupe key
    company: "Company",                   // multipleRecordLinks → Companies
    type: "Event Type",                   // singleSelect (press / funding / hiring / trial / conference)
    date: "Event Date",                   // singleLineText holding an ISO date string
    title: "Title",                       // singleLineText (NOT "Event Title" — table uses bare "Title")
    sourceUrl: "Source URL",              // url
    trialPhase: "Trial Phase",            // singleLineText, populated for trial events only
    indication: "Conditions",             // multilineText, repurposed for trial indication (NOT a separate "Indication" field)
    fundingAmount: "Funding Amount USD",  // currency, populated for funding events only
};

// ============================================================
// SCRIPT
// ============================================================

const inputConfig = input.config();
const recordId = inputConfig.recordId;
if (!recordId) {
    throw new Error("Automation script step is missing the 'recordId' input variable.");
}

const companiesTable = base.getTable(COMPANIES_TABLE);
const eventsTable = base.getTable(EVENTS_TABLE);

const companyQuery = await companiesTable.selectRecordsAsync({ fields: [PENDING_FIELD] });
const companyRecord = companyQuery.getRecord(recordId);
if (!companyRecord) {
    throw new Error(`Company record ${recordId} not found.`);
}

const pendingRaw = companyRecord.getCellValue(PENDING_FIELD);
if (!pendingRaw) {
    console.log("No pending events JSON; exiting.");
    return;
}

let events;
try {
    events = JSON.parse(pendingRaw);
} catch (e) {
    throw new Error(`Failed to parse Events JSON Pending: ${e.message}`);
}
if (!Array.isArray(events)) {
    throw new Error("Events JSON Pending must be a JSON array at the top level.");
}

function normalizeKey(type, date, title) {
    const t = (type && typeof type === "object" ? type.name : type || "").toString().toLowerCase().trim();
    const d = (date || "").toString().slice(0, 10);
    const ti = (title || "").toString().toLowerCase().trim();
    return `${t}|${d}|${ti}`;
}

// Pre-load existing events for this company to dedupe.
const existingQuery = await eventsTable.selectRecordsAsync({
    fields: [
        EVENTS_FIELDS.eventId,
        EVENTS_FIELDS.company,
        EVENTS_FIELDS.type,
        EVENTS_FIELDS.date,
        EVENTS_FIELDS.title,
    ],
});

const existingKeys = new Set();
for (const rec of existingQuery.records) {
    const linked = rec.getCellValue(EVENTS_FIELDS.company) || [];
    if (!linked.some((c) => c.id === recordId)) continue;
    const key = normalizeKey(
        rec.getCellValue(EVENTS_FIELDS.type),
        rec.getCellValue(EVENTS_FIELDS.date),
        rec.getCellValue(EVENTS_FIELDS.title),
    );
    existingKeys.add(key);
}

const toCreate = [];
let duplicates = 0;
for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const key = normalizeKey(ev.type, ev.date, ev.title);
    if (existingKeys.has(key)) {
        duplicates++;
        continue;
    }
    existingKeys.add(key);

    const fields = {
        [EVENTS_FIELDS.eventId]: `${recordId}-${key}`.slice(0, 250),
        [EVENTS_FIELDS.company]: [{ id: recordId }],
    };
    if (ev.type) fields[EVENTS_FIELDS.type] = { name: String(ev.type) };
    if (ev.date) fields[EVENTS_FIELDS.date] = String(ev.date).slice(0, 10);
    if (ev.title) fields[EVENTS_FIELDS.title] = String(ev.title);
    if (ev.source_url) fields[EVENTS_FIELDS.sourceUrl] = String(ev.source_url);
    if (ev.trial_phase) fields[EVENTS_FIELDS.trialPhase] = String(ev.trial_phase);
    if (ev.indication) fields[EVENTS_FIELDS.indication] = String(ev.indication);
    if (typeof ev.funding_amount_usd === "number") {
        fields[EVENTS_FIELDS.fundingAmount] = ev.funding_amount_usd;
    }

    toCreate.push({ fields });
}

// Airtable createRecordsAsync limit is 50 per call.
let created = 0;
for (let i = 0; i < toCreate.length; i += 50) {
    const batch = toCreate.slice(i, i + 50);
    await eventsTable.createRecordsAsync(batch);
    created += batch.length;
}

// Clear pending field so the trigger doesn't re-fire.
await companiesTable.updateRecordAsync(recordId, {
    [PENDING_FIELD]: "",
});

console.log(`Created ${created} new Company Events; ${duplicates} duplicates skipped.`);
