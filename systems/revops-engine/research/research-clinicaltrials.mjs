// research-clinicaltrials.mjs — research-lane function (ported off the n8n "Canonical AAV
// Discovery" workflow, re-pointed from by-modality discovery to by-SPONSOR verification).
//
// Pure evidence-fetcher: given a company name, query clinicaltrials.gov v2 for the studies it
// sponsors and return modality-bearing intervention text + citable NCT IDs. It does NOT classify
// or write to the DB — the classifier judges the evidence, the waterfall runner persists it with
// provenance. Row data never enters a Claude Code conversation; this runs in the runner's process.
//
// Why this exists: the structured `biotech_modality_types` field is an unverified enrichment that
// can be blank (Avidity = "none" but really AOC) or wrong (ImmunityBio = "immunocytokines" but
// really an IL-15 Fc-fusion). Trial interventions are primary-source evidence with a citation.
//
// Usage as a module:  import { researchClinicalTrials } from './research-clinicaltrials.mjs'
//   const ev = await researchClinicalTrials('Avidity Biosciences')
// Usage as a CLI (manual proving):  node research-clinicaltrials.mjs "Avidity Biosciences"

const API = 'https://clinicaltrials.gov/api/v2/studies';

const FIELDS = [
  'protocolSection.identificationModule.nctId',
  'protocolSection.identificationModule.briefTitle',
  'protocolSection.statusModule.overallStatus',
  'protocolSection.armsInterventionsModule.interventions',
].join(',');

// ngAbs modality vocabulary (play-specific; pass `opts.signals` to override for another play).
// These are SIGNALS to surface for the classifier, not a verdict.
const NGABS_SIGNALS = {
  C1_core:       /(bispecific|multispecific|antibody[- ]drug conjugate|\badc\b)/i,
  C2_conjugate:  /(\baoc\b|antibody oligonucleotide|oligonucleotide conjugate|radio-?conjugate|radioimmunoconjugate|\brdc\b|immunocytokine)/i,
  N1_fusion:     /(fc-?fusion|fusion protein|superagonist|il-?15)/i,
  N3_car:        /(\bcar-?t\b|chimeric antigen receptor)/i,
  N4_aav:        /(\baav\b|adeno-?associated|viral vector|gene therapy)/i,
};

export async function researchClinicalTrials(companyName, opts = {}) {
  const signals = opts.signals || NGABS_SIGNALS;
  const pageSize = opts.pageSize || 50;
  const url = `${API}?query.spons=${encodeURIComponent(companyName)}`
    + `&pageSize=${pageSize}&countTotal=true&fields=${encodeURIComponent(FIELDS)}`;

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    return { source: 'clinicaltrials.gov', company: companyName, ok: false,
             error: `HTTP ${res.status}`, trial_count: 0, evidence: [], signals: {}, cites: [] };
  }
  const data = await res.json();
  const studies = data.studies || [];

  const evidence = studies.map((s) => {
    const idm = s.protocolSection?.identificationModule || {};
    const interventions = (s.protocolSection?.armsInterventionsModule?.interventions || [])
      .map((i) => `${i.type}:${i.name}`);
    return {
      nct: idm.nctId,
      title: idm.briefTitle,
      status: s.protocolSection?.statusModule?.overallStatus,
      interventions,
      cite: idm.nctId ? `https://clinicaltrials.gov/study/${idm.nctId}` : null,
    };
  });

  // Surface which modality signals appear across all this sponsor's trials, with the NCTs that
  // carry them — the classifier reads these as evidence, not as a decision.
  const corpus = evidence.map((e) => `${e.title} ${e.interventions.join(' ')}`).join('  ').toLowerCase();
  const signalHits = {};
  for (const [name, re] of Object.entries(signals)) {
    if (re.test(corpus)) {
      signalHits[name] = evidence
        .filter((e) => re.test(`${e.title} ${e.interventions.join(' ')}`.toLowerCase()))
        .map((e) => e.nct)
        .slice(0, 5);
    }
  }

  return {
    source: 'clinicaltrials.gov',
    company: companyName,
    ok: true,
    trial_count: data.totalCount ?? studies.length,
    evidence,                                   // for the classifier to read
    signals: signalHits,                        // {C2_conjugate:[NCT...], N1_fusion:[NCT...]}
    cites: evidence.map((e) => e.cite).filter(Boolean),
    fetched_for: 'modality-verification',
  };
}

// CLI mode — manual proving only. Prints a compact summary; raw studies stay in this process.
if (import.meta.url === `file://${process.argv[1]}`) {
  const name = process.argv.slice(2).join(' ');
  if (!name) { console.error('usage: node research-clinicaltrials.mjs "<company name>"'); process.exit(1); }
  const ev = await researchClinicalTrials(name);
  console.log(`${ev.company}: ${ev.ok ? ev.trial_count + ' trials' : 'ERROR ' + ev.error}`);
  console.log('signals:', JSON.stringify(ev.signals));
  for (const e of ev.evidence.slice(0, 6)) {
    console.log(`  ${e.nct}  ${(e.title || '').slice(0, 64)}  [${e.interventions.slice(0, 3).join(' | ').slice(0, 80)}]`);
  }
}
