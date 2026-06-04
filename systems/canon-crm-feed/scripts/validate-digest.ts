// Dry: show who'd get a daily touch draft, the intent, and the composed body. Creates nothing.
// Run: node --env-file=.env --import tsx scripts/validate-digest.ts
import "../src/lib/load-env.js";
import { listActiveMotions } from "../src/lib/airtable.js";
import { assess } from "../src/lib/attention.js";
import { composeBody } from "../src/lib/compose.js";

const contacts = await listActiveMotions();
console.log(`active motions: ${contacts.length} | LLM: ${process.env.ANTHROPIC_API_KEY ? "on" : "off (brief mode)"}\n`);
for (const c of contacts) {
  if (!c.email) { console.log(`SKIP  ${c.name || c.company} (no email)`); continue; }
  const { attn, intent, daysSince } = assess(c);
  if (!attn) { console.log(`ok    ${c.name || c.company} | waiting=${c.waitingOn ?? "-"} daysSince=${daysSince} -> no touch`); continue; }
  const { subject, body } = await composeBody(c, intent);
  console.log(`DRAFT ${c.name || c.company} [${intent}] -> ${c.email}`);
  console.log(`      subj: ${subject}`);
  console.log(body.split("\n").map((l) => "      " + l).join("\n"));
  console.log("");
}
console.log("done (DRY — no drafts created)");
