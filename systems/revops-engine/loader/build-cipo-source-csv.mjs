// One-off: turn the Apollo org-search result (firmographics only — no description field) into a
// loadable CSV for the patent-portfolio-mgmt motions batch. Derives a coarse industry label from
// NAICS/SIC + name and a factual company_description from what Apollo returned (sector + founded +
// revenue). Nothing is invented; thin rows stay thin and will (correctly) land as NEEDS_REVIEW.
//
// Usage: node build-cipo-source-csv.mjs <outCsvPath>

import fs from "fs";

// [name, domain, naics0, sic0, founded, revenuePrinted]  (rows with no usable domain dropped already)
const ROWS = [
  ["Open Robotics", "openrobotics.org", "513210", "3571", 2012, ""],
  ["RBW Consulting", "rbwconsulting.com", "", "7380", 2007, "1.1M"],
  ["TechCrunch", "techcrunch.com", "519", "7375", 2005, "525M"],
  ["Mammoth Biosciences", "mammoth.bio", "541714", "8731", 2017, "42.2M"],
  ["Wyss Institute at Harvard University", "wyss.harvard.edu", "", "", 2009, ""],
  ["Candela Medical", "candelamedical.com", "", "5047", 1970, "520M"],
  ["Locus Robotics", "locusrobotics.com", "54133", "3589", 2014, "110M"],
  ["Biotechnology Innovation Organization", "bio.org", "54171", "8731", 1993, "103.2M"],
  ["WIRED", "wired.com", "519", "2711", 1993, "30.7M"],
  ["Hai Robotics", "hairobotics.com", "33392", "3589", 2016, "15M"],
  ["Genetic Engineering & Biotechnology News", "genengnews.com", "513120", "2834", 1981, "99.9M"],
  ["Y Combinator", "ycombinator.com", "54171", "6799", 2005, "300M"],
  ["Miso Robotics", "misorobotics.com", "33324", "3589", 2016, "384K"],
  ["DEKA Research & Development", "dekaresearch.com", "339112", "5047", 1982, "45M"],
  ["IEEE Robotics and Automation Society", "ieee-ras.org", "54171", "8731", 1987, "5.9M"],
  ["DeepLearning.AI", "deeplearning.ai", "61131", "8299", 2017, "8.6M"],
  ["Gecko Robotics", "geckorobotics.com", "33313", "3531", 2013, "43.8M"],
  ["Onward Robotics", "onwardrobotics.com", "", "", 2012, "51.2M"],
  ["Ghost Robotics", "ghostrobotics.io", "33661", "3589", 2015, "4M"],
  ["Neuroscience News", "neurosciencenews.com", "519", "2731", 2001, "3.5M"],
  ["Click Therapeutics, Inc.", "clicktherapeutics.com", "", "2836", 2012, "13.5M"],
  ["Modern Healthcare", "modernhealthcare.com", "519", "2711", 1976, "13.9M"],
  ["Path Robotics", "path-robotics.com", "33351", "3599", 2014, "79.2M"],
  ["Carbon Robotics", "carbonrobotics.com", "33311", "3829", 2018, "165.9M"],
  ["techolution", "techolution.com", "54151", "7375", 2015, "10.0M"],
];

function industryLabel(naics, sic, name) {
  const n = naics || "";
  if (n.startsWith("5415")) return "IT / software services";
  if (n.startsWith("5413")) return "Engineering services";
  if (n.startsWith("5417")) return "Scientific R&D / professional org";
  if (n.startsWith("339")) return "Medical / precision manufacturing";
  if (n.startsWith("334")) return "Electronics / medical device manufacturing";
  if (n.startsWith("333")) return "Industrial machinery / robotics";
  if (n.startsWith("336")) return "Transportation / defense equipment";
  if (n.startsWith("513") || n.startsWith("519") || n.startsWith("516")) return "Media / publishing / information";
  if (n.startsWith("611")) return "Education";
  if (n.startsWith("5239")) return "Investment / accelerator";
  // SIC fallback
  if (sic === "7380" || sic === "7375") return "Business / IT services";
  if (sic === "5047") return "Medical device / equipment";
  if (sic === "2836" || sic === "2834") return "Biotech / pharmaceutical";
  if (sic === "8299") return "Education";
  // name heuristic fallback
  const ln = name.toLowerCase();
  if (ln.includes("robotics")) return "Robotics / industrial automation";
  if (ln.includes("institute") || ln.includes("university")) return "Academic research institute";
  if (ln.includes("therapeutics") || ln.includes("bio")) return "Biotech / pharmaceutical";
  return "Unknown";
}

const csvField = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const header = ["Company Name", "Domain", "Industry", "company_description", "keywords"];
const lines = [header.join(",")];
for (const [name, domain, naics, sic, founded, rev] of ROWS) {
  const label = industryLabel(naics, sic, name);
  const desc = `${label}. Founded ${founded || "n/a"}. Revenue ${rev || "n/a"}.`;
  lines.push([name, domain, label, desc, label].map(csvField).join(","));
}

const out = process.argv[2];
fs.writeFileSync(out, lines.join("\n") + "\n");
console.log(`wrote ${ROWS.length} rows to ${out}`);
