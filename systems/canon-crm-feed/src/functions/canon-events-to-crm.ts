// Canon → CRM projection. Mirrors the archived house pattern:
// dual trigger (event + cron catch-up), step shape fetch -> derive -> write,
// idempotent (only writes on change), basis stamped for audit.
import { inngest } from "../client.js";
import { fetchInteractions } from "../lib/canon.js";
import { derive } from "../lib/derive.js";
import { listTrackedMotions, updateMotionState } from "../lib/airtable.js";

export const canonEventsToCrm = inngest.createFunction(
  { id: "canon-events-to-crm", name: "Canon → CRM state projection", retries: 2, concurrency: { limit: 2 } },
  [
    // PRIMARY: the repurposed canon_events trigger forwards an Inngest event (to wire next).
    { event: "canon/event.received" },
    // FALLBACK: catch-up reconcile so state stays true even if an event is missed.
    { cron: "*/15 * * * *" },
  ],
  async ({ step }) => {
    const motions = await step.run("list-tracked-motions", () => listTrackedMotions());

    const results: Array<{ company: string; stage: string; waitingOn: string | null }> = [];
    for (const m of motions) {
      const derived = await step.run(`derive-${m.motionId}`, async () => {
        const interactions = await fetchInteractions(m.keys);
        // proposalSent: TODO wire to Artifacts table (type=Proposal, status sent). v1 = false.
        return derive({ interactions, ownerIsPartner: m.ownerIsPartner, proposalSent: false });
      });

      await step.run(`write-${m.motionId}`, () =>
        updateMotionState(m.motionId, derived.waitingOn, derived.basis),
      );
      results.push({ company: m.company, stage: derived.stage, waitingOn: derived.waitingOn });
    }
    return { updated: results.length, results };
  },
);
