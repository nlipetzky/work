import "server-only";
import { inngest } from "../../../capabilities/inngest/client";
import { canonDb } from "../../projection-ui/lib/canon";

// Phase 4 — follow-up persistence (autonomous leg). Hourly cron that finds expert_motions whose
// next-action clock has fired (status='active' AND next_action_due < now()) and advances each via
// the advance_motion RPC with reason 'sweep_due'. The RPC flips ball_in_court → 'operator' and sets
// the owed next_action_kind; the sweep NEVER writes motion state directly. The deterministic mirror
// of this is the daily-protocol sweep (projection-ui/lib/queries/{expertLiaison,ranking}.ts), which
// surfaces the now-operator-ball motion as a ranked next action.

type DueMotionRow = { id: string; next_action_due: string | null };

export const motionFollowUpSweep = inngest.createFunction(
  {
    id: "expert-motion-follow-up-sweep",
    triggers: [{ cron: "0 * * * *" }],
    retries: 4,
    // One sweep at a time — overlapping runs would re-advance the same motions.
    concurrency: { limit: 1 },
  },
  async ({ step }) => {
    const due = (await step.run("load-due-motions", async () => {
      const { data, error } = await canonDb()
        .from("expert_motions")
        .select("id, next_action_due")
        .eq("status", "active")
        .lt("next_action_due", new Date().toISOString())
        .order("next_action_due", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    })) as DueMotionRow[];

    for (const m of due) {
      await step.run(`advance-${m.id}`, async () => {
        const { error } = await canonDb().rpc("advance_motion", {
          p_motion_id: m.id,
          p_event: "sweep_due",
          p_payload: {},
        });
        if (error) throw new Error(error.message);
        return { advanced: m.id };
      });
    }

    return { swept: due.length };
  },
);
