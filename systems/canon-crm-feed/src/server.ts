// Standalone serve handler so the Inngest dev server can discover the functions.
// Run: npx tsx src/server.ts  (then: inngest dev -u http://localhost:3939/api/inngest)
import "./lib/load-env.js"; // load .env (override) FIRST, before modules read process.env
import express from "express";
import { serve } from "inngest/express";
import { inngest } from "./client.js";
import { functions } from "./functions/index.js";

const app = express();
app.use(express.json());
app.use("/api/inngest", serve({ client: inngest, functions }));

const port = Number(process.env.PORT ?? 3939);
app.listen(port, () => console.log(`canon-crm-feed serving /api/inngest on :${port}`));
