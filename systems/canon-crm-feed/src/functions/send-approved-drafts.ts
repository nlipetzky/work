// Sends approved outbound email drafts as nick@konstellationai.com, then flips the Event to Sent.
// retries:0 on purpose ... a retry after a successful send (but failed mark) would double-send.
// Idempotency for v1 = markSent flips Status off "Drafted", so the next run won't re-pick it.
// Harden later with a pre-send dedupe key if volume grows.
import { inngest } from "../client.js";
import { listApprovedDrafts, markSent } from "../lib/airtable.js";
import { sendEmail } from "../lib/gmail.js";

export const sendApprovedDrafts = inngest.createFunction(
  { id: "send-approved-drafts", name: "Send approved outbound drafts", retries: 0, concurrency: { limit: 1 } },
  [{ event: "crm/draft.approved" }, { cron: "*/5 * * * *" }],
  async ({ step }) => {
    const drafts = await step.run("list-approved-drafts", () => listApprovedDrafts());
    const results: Array<Record<string, unknown>> = [];
    for (const d of drafts) {
      if (!d.toEmail) {
        results.push({ id: d.id, skipped: "no recipient email on linked prospect" });
        continue;
      }
      const from = d.from ?? process.env.GMAIL_SEND_AS!;
      const messageId = await step.run(`send-${d.id}`, async () => {
        const id = await sendEmail(from, d.toEmail!, d.subject, d.body);
        await markSent(d.id, id); // same step as send to minimize the resend window
        return id;
      });
      results.push({ id: d.id, from, to: d.toEmail, messageId });
    }
    return { processed: drafts.length, results };
  },
);
