// Barrel export of revops-engine Inngest functions.
// Imported by systems/projection-ui/app/api/inngest/route.ts and registered with the serve handler.
//
// To add a new revops-engine workflow:
// 1. Create <name>.ts in this folder, importing the inngest client from capabilities/inngest/client.
// 2. Export the function from this file.
// 3. The projection-ui inngest route will pick it up automatically via the union export below.

export { syncCompaniesOnPromote, syncContactsOnPromote } from "./sync-on-promote";

import {
  syncCompaniesOnPromote,
  syncContactsOnPromote,
} from "./sync-on-promote";

export const revopsEngineFunctions = [
  syncCompaniesOnPromote,
  syncContactsOnPromote,
];
