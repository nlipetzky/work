// Dry by default: verifies impersonation for BOTH sender identities (no mail sent) and lists
// what's approved. Real send only with --send. Run: node --env-file=.env --import tsx scripts/validate-send.ts
import "../src/lib/load-env.js";
import { verifyImpersonation, sendEmail } from "../src/lib/gmail.js";
import { listApprovedDrafts, markSent } from "../src/lib/airtable.js";

const SEND = process.argv.includes("--send");
const SENDERS = ["nick@konstellationai.com", "nick@instig8.ai"];

console.log("1) verifying impersonation for each sender (no mail sent):");
for (const who of SENDERS) {
  try {
    const got = await verifyImpersonation(who);
    console.log(`   ${who} -> ${got} ${got === who ? "OK" : "(unexpected)"}`);
  } catch (e: any) {
    console.log(`   ${who} -> FAILED: ${e?.response?.data?.error_description ?? e?.message}`);
  }
}

console.log("2) approved drafts ready to send:");
const drafts = await listApprovedDrafts();
if (!drafts.length) console.log("   none");
for (const d of drafts) {
  const from = d.from ?? process.env.GMAIL_SEND_AS;
  console.log(`   - ${d.id} | from ${from} -> ${d.toEmail ?? "(no recipient)"} | "${d.subject}"`);
  if (SEND && d.toEmail) {
    const mid = await sendEmail(from!, d.toEmail, d.subject, d.body);
    await markSent(d.id, mid);
    console.log(`     SENT (message id ${mid})`);
  }
}
console.log(SEND ? "done (LIVE SEND)" : "done (DRY — no mail sent)");
