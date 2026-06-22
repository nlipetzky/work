import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { syncCompaniesOnPromote, syncContactsOnPromote } from "@/lib/inngest/functions";

export const runtime = "nodejs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncCompaniesOnPromote, syncContactsOnPromote],
});
