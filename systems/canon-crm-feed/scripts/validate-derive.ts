// End-to-end validation: Canon read -> derive -> Motions write, for every tracked motion
// with a Canon Domain. Run: node --env-file=.env --import tsx scripts/validate-derive.ts
import { listTrackedMotions, updateMotionState } from "../src/lib/airtable.js";
import { fetchInteractions } from "../src/lib/canon.js";
import { derive } from "../src/lib/derive.js";

const DRY = process.argv.includes("--dry");

const motions = await listTrackedMotions();
console.log(`tracked motions: ${motions.length}${DRY ? "  (DRY RUN — no writes)" : ""}`);

for (const m of motions) {
  const interactions = await fetchInteractions(m.keys);
  const d = derive({ interactions, ownerIsPartner: m.ownerIsPartner, proposalSent: false });
  const latest = interactions[0];
  console.log(`\n${m.company}  [domain=${m.keys.domain}, ownerIsPartner=${m.ownerIsPartner}]`);
  console.log(`  motionId=${m.motionId}`);
  console.log(`  interactions=${interactions.length}  latest=${latest ? `${latest.date} ${latest.direction ?? "?"} "${latest.label ?? ""}"` : "none"}`);
  console.log(`  => Stage=${d.stage}  WaitingOn=${d.waitingOn}`);
  console.log(`  basis: ${d.basis}`);
  if (!DRY) {
    await updateMotionState(m.motionId, d.waitingOn, d.basis);
    console.log(`  written to Motions ✓`);
  }
}
console.log("\ndone");
