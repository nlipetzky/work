import { serve } from "inngest/next";
import { inngest } from "../../../../../capabilities/inngest/client";
import { revopsEngineFunctions } from "../../../../revops-engine/workflows";
import { expertLiaisonEngineFunctions } from "../../../../expert-liaison-engine/workflows";

// Studio Inngest endpoint. Unions every system's workflows/ exports and serves them via Inngest's
// Next.js serve handler. Each system owns the function definitions in its own folder; this route
// only registers them. To add a new system: import its `<system>EngineFunctions` array below and
// concat it into the functions list.
//
// Local dev: `inngest dev -u http://localhost:4180/api/inngest`

export const runtime = "nodejs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [...revopsEngineFunctions, ...expertLiaisonEngineFunctions],
});
