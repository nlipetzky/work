// Daily touch generator: for everyone in the CRM who needs attention (partners AND prospective
// partners), drafts a message addressed to them ... "advance" if there's an open item, else a warm
// "nurture" touch. Drafts only; nothing sends without the approval checkbox + the send function.
import { inngest } from "../client.js";
import { listActiveMotions, draftExistsToday, createDailyDraft } from "../lib/airtable.js";
import { assess } from "../lib/attention.js";
import { composeBody } from "../lib/compose.js";

export const dailyPartnerDigest = inngest.createFunction(
  { id: "daily-partner-digest", name: "Daily partner/prospect touch drafts", retries: 1, concurrency: { limit: 1 } },
  [{ event: "crm/digest.run" }, { cron: "0 13 * * *" }], // ~8am CDT
  async ({ step }) => {
    const contacts = await step.run("list-active-motions", () => listActiveMotions());
    const today = new Date().toISOString().slice(0, 10);
    const seen = new Set<string>(); // one touch per contact/day even with multiple motions
    const made: Array<Record<string, unknown>> = [];
    for (const c of contacts) {
      if (!c.email) continue;
      const { attn, intent } = assess(c);
      if (!attn) continue;
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      const exists = await step.run(`dedupe-${c.id}`, () => draftExistsToday(c.id, today));
      if (exists) continue;
      const { subject, body } = await step.run(`compose-${c.id}`, () => composeBody(c, intent));
      await step.run(`draft-${c.id}`, () => createDailyDraft(c, intent, subject, body));
      made.push({ id: c.id, name: c.name, intent });
    }
    return { drafted: made.length, made };
  },
);
