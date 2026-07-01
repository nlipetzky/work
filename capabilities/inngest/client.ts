import "server-only";
import { Inngest } from "inngest";

// Shared Inngest client for the studio runtime. One client per serving endpoint;
// projection-ui is the endpoint (~/code/work/systems/projection-ui/app/api/inngest/route.ts).
// Functions live in each system's workflows/ folder and import this client.
export const inngest = new Inngest({ id: "projection-ui" });
