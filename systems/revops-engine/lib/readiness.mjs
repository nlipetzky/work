// readiness.mjs — checks which of a play's declared input documents are present and renders a
// plain-English readiness report. This is a REPORT, not a gate: run-prep prints it and proceeds.
// Only --strict turns a missing "now" input into a stop.
//
// A recipe's optional `inputs` array declares the documents that should back the play:
//   { name, path (relative to playDir), when: "now" | "later" }   (when defaults to "now")
// "now"   = backs a stage in the current run (enforced only under --strict)
// "later" = informational, for the outreach/activation funnel that doesn't run yet.
// "present" = the file exists AND is non-empty (size > 0). No stub/placeholder detection.

import fs from "fs";
import path from "path";

function isPresent(absPath) {
  try {
    return fs.statSync(absPath).size > 0;
  } catch {
    return false; // missing file
  }
}

// recipe.inputs may be absent → returns an empty, all-now-present report.
export function checkReadiness(recipe, playDir) {
  const declared = Array.isArray(recipe.inputs) ? recipe.inputs : [];
  const items = declared.map((i) => ({
    name: i.name,
    path: i.path,
    when: i.when === "later" ? "later" : "now",
    present: isPresent(path.join(playDir, i.path)),
  }));
  const missingNow = items.filter((i) => i.when === "now" && !i.present);
  return { items, missingNow, allNowPresent: missingNow.length === 0 };
}

// Render the report as plain English. No acronyms, no gate numbers.
export function formatReadiness(report, playName) {
  const now = report.items.filter((i) => i.when === "now");
  const later = report.items.filter((i) => i.when === "later");
  const lines = [`Play readiness — ${playName}`];

  if (now.length) {
    lines.push("  Ready for this run:");
    for (const i of now) {
      lines.push(i.present
        ? `    ✓ ${i.name.padEnd(18)} ${i.path}`
        : `    ✗ ${i.name.padEnd(18)} (no file: ${i.path})`);
    }
  }
  if (later.length) {
    lines.push("  Not yet (needed for outreach, not this run):");
    for (const i of later) {
      lines.push(i.present
        ? `    ✓ ${i.name.padEnd(18)} ${i.path}`
        : `    — ${i.name.padEnd(18)} (no file)`);
    }
  }
  if (!report.items.length) {
    lines.push("  (no inputs declared in this recipe)");
  } else if (report.allNowPresent) {
    lines.push("  All inputs for this run are present. Proceeding.");
  } else {
    const names = report.missingNow.map((i) => i.name).join(", ");
    lines.push(`  Missing for this run: ${names}.`);
  }
  return lines.join("\n");
}
