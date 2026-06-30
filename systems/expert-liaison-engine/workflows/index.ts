// Barrel export of expert-liaison-engine Inngest functions.
// Imported by systems/projection-ui/app/api/inngest/route.ts and registered with the serve handler.
//
// To add a new expert-liaison-engine workflow:
// 1. Create <name>.ts in this folder, importing the inngest client from capabilities/inngest/client.
// 2. Export the function from this file.
// 3. The projection-ui inngest route will pick it up automatically via the union export below.

export { motionFollowUpSweep } from "./motion-follow-up-sweep";

import { motionFollowUpSweep } from "./motion-follow-up-sweep";

export const expertLiaisonEngineFunctions = [
  motionFollowUpSweep,
];
