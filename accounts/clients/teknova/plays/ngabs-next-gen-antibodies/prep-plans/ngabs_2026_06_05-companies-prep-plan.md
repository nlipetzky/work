# Prep Plan — ngabs_2026_06_05 (companies)

batch_id: `ngabs_2026_06_05` · entity: companies · rows: 82
play: Next-Gen Antibodies (Teknova Q2 Outbound)
playbook: /Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/playbook-v1-2026-05-29.md
guidance: /Users/nplmini/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/client-guidance.md
generated: 2026-06-08T20:54:01.837Z

## Processing ledger
- by stage: semantic=77, sql=5
- verdicts: IN=51 · NARROW=13 · OUT=12 · NEEDS_REVIEW=6
- **verified for play: 64/82** · needs-evidence (research-lane queue): 18

## Verdicts

### IN — promote (51)
- **AbCellera** — HIGH · ✓verified
  AbCellera is a developer with confirmed multispecific T-cell engager and ADC programs (Prelude collaboration); biotech_role field says 'CDMO' but company_focus and strategic notes clearly describe it as a clinical-stage developer — role field is misleading enrichment, not ground truth.
- **Absci** — MED · unverified · needs-evidence
  Absci's platform explicitly targets multispecific/multi-valency antibody design per strategic notes and modality field, supporting C1; confidence is MED rather than HIGH because the self-description reflects platform capability rather than confirmed clinical-stage multispecific drug candidates, and the biotech_modality_types enrichment field is unverified.
- **Abzena** — HIGH · ✓verified
  Full-service CDMO/CRO explicitly servicing ADC, bispecific, AOC, and RDC modalities — all in-scope; Fc-fusion presence does not trigger N1 exclusion given the breadth of in-scope modality services.
- **Aclaris Therapeutics, Inc.** — HIGH · ✓verified
  Aclaris is developing ATI-052, a confirmed anti-TSLP/anti-IL-4Rα bispecific antibody in clinical stage, directly satisfying C1; no disqualifying N* criteria apply.
- **Adimab** — HIGH · ✓verified
  Adimab is a discovery/engineering platform that directly generates multispecific antibodies, bispecifics, and ADC payloads-ready antibodies for partners — squarely in-scope on C1 and C2; CAR-T mention reflects partner applications, not Adimab's own modality, so N3 does not apply.
- **AGC Biologics** — HIGH · ✓verified
  Full-service CDMO with verified ADC (Proveo™ platform) and bispecific (Novelty Nobility NN4101 engagement) manufacturing capabilities; in-scope modalities confirmed from strategic notes, not just enriched field.
- **Alcami Corporation** — HIGH · ✓verified
  Full-service CDMO with verified ADC and multispecific antibody service capabilities confirmed by expansion press release; CGT/AAV services co-present but do not override in-scope CDMO classification.
- **Alloy Therapeutics, Inc.** — HIGH · ✓verified
  Alloy Therapeutics is a platform company that licenses and services bispecific/multispecific antibody discovery; C1 passes clearly from both structured fields and strategic_notes; no disqualifying N* criteria apply.
- **Ambrx** — HIGH · ✓verified
  Ambrx is a clinical-stage ADC developer with named clinical-stage ADC assets (ARX517, ARX788) and bispecific pipeline; all in-scope criteria satisfied with no disqualifying N* flags.
- **Avance Biosciences, Inc.** — MED · ✓verified
  Avance is a CRO/CTO providing CGMP/GLP analytical services; ADC testing is explicitly listed among supported modalities, qualifying as a real reagent/service customer for the ngAbs play; confidence is MED because the self-description is broad and depth of ADC-specific analytical work is not independently verified.
- **Avid Bioservices** — HIGH · ✓verified
  Full-service biologics CDMO with explicitly stated ADC manufacturing experience confirmed by World ADC 2025 presence; bispecific also claimed in enrichment field — qualifies IN as a real reagent customer for ngAbs play.
- **Avidity Biosciences, Inc.** — HIGH · ✓verified
  Avidity is a canonical AOC developer (C2); self-description is explicit and consistent across company focus and platform pages; no disqualifying N* criteria apply — this is the textbook AOC case flagged in known traps.
- **AVS Bio** — MED · ✓verified
  CDMO that explicitly manufactures bispecific, trispecific, and multispecific antibody formats per both modality fields and strategic notes; C1 passes; no N-rule conflicts; MED confidence because depth of bispecific manufacturing capability is self-described without third-party verification.
- **BigHat Biosciences** — HIGH · ✓verified
  AI-enabled antibody engineering platform with verified in-scope pipeline modalities (ADC BHB810, TCE bispecific BHB299) and explicit multispecific/conjugate focus; all negative criteria fail to apply.
- **Bionova Scientific** — HIGH · ✓verified
  Full-service biologics CDMO with verified ADC process development and manufacturing capability (downstream purification explicitly cited) plus bispecific antibody services; no disqualifying N* flags apply; F1 not triggered as scope extends well beyond fill-finish.
- **BWXT Medical** — HIGH · ✓verified
  BWXT Medical is a full-service radiopharmaceutical CDMO explicitly manufacturing radioimmunoconjugates/RDCs (Lu-177, Ac-225 targeted alpha therapies), qualifying under C2 with no disqualifying N-criteria; role as CDMO servicing RDC modalities makes it a real in-scope customer.
- **Celldex Therapeutics** — HIGH · ✓verified
  Celldex is a clinical-stage developer with a confirmed bispecific antibody (CDX-622) in its pipeline; C1 criterion is clearly satisfied with no disqualifying N-criteria present.
- **Curia** — HIGH · ✓verified
  Full-service CDMO with verified bispecific antibody engineering and ADC manufacturing services; as a real reagent/service customer for in-scope modalities, qualifies IN with no disqualifying N* criteria applying.
- **Cytovance Biologics** — MED · ✓verified
  Full-service CDMO explicitly servicing multispecific/bispecific antibodies per both structured fields and strategic notes; Fc-fusion presence does not disqualify because in-scope modalities co-occur; confidence MED because biotech_modality_types is unverified enrichment, but the strategic_notes corroborate multispecific manufacturing independently.
- **Eurofins CDMO Alphora** — HIGH · ✓verified
  Full-service CDMO with verified end-to-end ADC manufacturing capability (linker/warhead development through GMP biologics production); biotech_modality_types claim of ADC is corroborated by strategic notes, satisfying C1 with HIGH confidence.
- **Evergreen Theragnostics** — HIGH · ✓verified
  Full-service radiopharmaceutical CDMO manufacturing in-scope RDC (I-131-labeled single-domain antibody radioconjugate CAM-H2); C2 passes; fragment listing is the antibody targeting component of the radioconjugate, not a standalone fragment play; all N* disqualifiers absent.
- **Exelixis** — HIGH · ✓verified
  Exelixis explicitly identifies bispecific antibodies and ADCs as core drug discovery modalities with named clinical-stage candidates; both C1 modalities confirmed, no disqualifying N* criteria apply.
- **FUJIFILM Biotechnologies** — HIGH · ✓verified
  Full-service CDMO with verified bispecific and ADC manufacturing capability corroborated by both the modality field and strategic notes on ApolloX platform; Fc-fusion and fragment services also present but do not disqualify given co-occurrence of in-scope modalities.
- **FUJIFILM Diosynth Biotechnologies** — HIGH · ✓verified
  Full-service CDMO with documented manufacturing capability for both multispecific antibodies and ADCs; Fc-fusion co-occurrence does not trigger N1 as in-scope modalities are present.
- **Gallus BioPharmaceuticals** — MED · ✓verified
  Gallus BioPharmaceuticals (now part of Patheon) is a full-service biologics CDMO that explicitly services bispecific antibodies in drug substance manufacturing, qualifying under C1; Fc-fusion and enzyme work co-occur but do not disqualify given independent bispecific confirmation; confidence is MED because the company has been absorbed into Patheon and the current scope/name may need verification.
- **GBI Bio** — HIGH · ✓verified
  Full-service CDMO with verified ADC bioconjugation, bispecific/multispecific antibody manufacturing, and radioimmunoconjugate services; fill & finish is part of an integrated offering, not the sole service, so F1 does not narrow the verdict.
- **GenScript ProBio** — HIGH · ✓verified
  Full-service biologics CDMO with verified, active bispecific antibody (SMABody platform, clinical-stage projects) and ADC (conjugation services, 100+ payload-linker conjugates) service offerings — both core in-scope modalities confirmed; no disqualifying N* criteria apply.
- **Harbour BioMed** — HIGH · ✓verified
  Harbour BioMed is a developer with proprietary bispecific (HBICE) and multispecific (HCAb PLUS) antibody platforms plus ADC work; C1 passes cleanly with no applicable N-rules.
- **Immunome, Inc.** — HIGH · ✓verified
  Clinical-stage oncology developer with multiple confirmed ADC programs (C1) and a radioligand/RDC program (C2); no disqualifying N* criteria apply.
- **Invenra** — HIGH · ✓verified
  Invenra is a developer with a proprietary bispecific/multispecific antibody discovery platform (B-Body) and active pipeline; all core C1 criteria met with no disqualifying N* flags.
- **J-STAR Research, Inc.** — MED · ✓verified
  J-STAR is a full-service CDMO with stated ADC and AOC manufacturing capabilities; both modalities are in-scope under C1/C2; no disqualifying N* criteria apply; confidence is MED because strategic_notes appear to partially reference Porton (a different CDMO) and J-STAR's own ADC/AOC depth of service warrants verification against its own pipeline/capabilities page.
- **Just - Evotec Biologics** — HIGH · ✓verified
  Full-service CDMO explicitly servicing bispecific/multispecific antibodies and ADCs (end-to-end, gene to IND); both C1 and C2 pass, no disqualifying N* criteria apply.
- **KBI Biopharma** — HIGH · ✓verified
  KBI is a full-service CDMO with verified bispecific antibody manufacturing capability (36 programs, 25 in clinical trials per SUREtechnology Platform page); Fc-fusion listing does not override IN given confirmed bispecific CDMO activity.
- **MacroGenics, Inc.** — HIGH · ✓verified
  MacroGenics is a clinical-stage developer with a pipeline explicitly spanning ADCs, bispecific checkpoint antibodies, and T-cell engagers (BiTEs), satisfying C1 and C2 with no disqualifying N* criteria.
- **Mersana Therapeutics** — HIGH · ✓verified
  Mersana is a clinical-stage ADC developer with two proprietary ADC platforms and named pipeline candidates; C1 is clearly satisfied with no disqualifying N* criteria.
- **NJ Bio, Inc.** — HIGH · ✓verified
  Full-service CRO/CDMO with explicit GMP manufacturing of ADCs and antibody-oligonucleotide conjugates (AOC); both C1 and C2 pass, no N* exclusions apply — strong IN.
- **Pace Life Sciences** — MED · ✓verified
  Full-service CDMO with explicitly confirmed ADC analytical testing and CMC development services; AAV/gene therapy co-listed as parallel service does not trigger N4 disqualification for a CDMO context; MED confidence because depth of ADC manufacturing (vs. testing-only) is not fully detailed.
- **Parabilis Medicines** — MED · unverified · needs-evidence
  The AHC (Antibody-Helicon Conjugate) modality is structurally analogous to C2 conjugate subclass (ADC/AOC); however, 'Helicon' is a novel non-oligonucleotide, non-cytotoxic peptide payload and the antibody backbone role is unconfirmed, so confidence is MED pending structural verification; biotech_modality_types 'ADCs' appears overclaimed relative to self-description but AHC directionally qualifies.
- **Pfanstiehl, Inc.** — HIGH · ✓verified
  Pfanstiehl is a GMP CDMO manufacturing ADC linkers/toxins and excipient solutions for bispecific/trispecific antibody formulations — a genuine reagent/materials customer for the ngAbs play; biotech_modality_types claim is consistent with verified self-description and no N* disqualifiers apply.
- **Piramal Pharma Solutions** — HIGH · ✓verified
  SME note confirms IN with high confidence; independently corroborated by company_focus (ADC conjugation services), strategic_notes (ADCelerate™ full-service ADC program), and biotech_modality_types (ADC); first FDA-approved ADC CDMO per classification_notes — full-service ADC CDMO, not fill-finish-only.
- **SAB BIO** — MED · ✓verified
  SAB-142 is explicitly described as a multi-specific hIgG (C1 pass); no disqualifying N-criteria apply; moderate confidence because 'anti-thymocyte globulin' is traditionally a polyclonal mixture and 'multi-specific' here may reflect polyclonal breadth rather than engineered bispecific/multispecific architecture — pipeline page or mechanism-of-action detail would strengthen or weaken this classification.
- **Seagen** — HIGH · ✓verified
  Seagen (now Pfizer) is a canonical ADC developer with a world-leading ADC platform and bispecific programs; multiple independent sources confirm in-scope modalities with no disqualifying N* signals.
- **Sino Biological, Inc.** — HIGH · ✓verified
  Full-service CRO/CDMO explicitly offering bispecific antibody production (20+ formats, BiTEs) and ADC services — qualifies as a real reagent customer under ngAbs play; fragment and Fc-fusion offerings do not disqualify given co-occurrence with in-scope modalities.
- **SK pharmteco** — HIGH · ✓verified
  Full-service ADC CDMO confirmed by both the modality field and strategic notes citing linker-payload production and bioconjugation collaboration with Lotte Biologics; qualifies as a real reagent/services customer for ngAbs play.
- **SpectronRx** — HIGH · ✓verified
  Full-service radiopharmaceutical CDMO performing monoclonal antibody radiolabeling (RDC/radioconjugate = C2); antibody fragments co-occur with in-scope modality so C3 does not disqualify; no N* rules triggered.
- **Sutro Biopharma, Inc.** — HIGH · ✓verified
  Sutro is a developer with a flagship next-gen ADC platform (including dual-payload ADCs using XpressCF cell-free technology) and multispecific/bispecific antibody programs; strongly qualifies under C1 and C2 with no disqualifying N* criteria.
- **Treeline** — HIGH · ✓verified
  Clinical-stage ADC developer with explicit in-house ADC capability confirmed by both company focus text and modality field; no N* disqualifiers apply.
- **Veranova** — HIGH · ✓verified
  Full-service CDMO with verified ADC linker-payload development and manufacturing services (20+ years, Devens expansion); qualifies as a real reagent/services customer under the ngAbs play; no disqualifying N* criteria apply.
- **Visterra Inc.** — MED · unverified · needs-evidence
  Visterra's own 'Our Approach' language explicitly names multi-specific molecules and payload-conjugates alongside Fc-fusions; N1 does not apply because in-scope modalities co-occur; confidence is MED pending pipeline confirmation that bispecific/ADC programs are active rather than platform-only claims
- **Wheeler Bio, Inc.** — HIGH · ✓verified
  Full-service CDMO explicitly manufacturing bispecific antibodies per both self-description and strategic notes; fusion protein listing triggers N1 consideration but is overridden by co-occurring in-scope bispecific modality; no disqualifying N* rules apply.
- **WuXi AppTec, Laboratory Testing Division** — HIGH · ✓verified
  WuXi AppTec Laboratory Testing Division is a full-service CDMO/CRO providing verified end-to-end ADC and bispecific antibody testing and preclinical services, satisfying C1 as a real reagent/service customer; no N* disqualifiers apply to this division's core scope.

### NARROW — keep, lower priority (13)
- **Althea, CMO** — HIGH · ✓verified
  Althea is a fill-finish/drug product CDMO whose ADC scope is handling highly active materials at the fill-finish stage, not upstream bioconjugation or linker-payload manufacturing; F1 applies → NARROW per rule, not a hard OUT because it does touch ADC drug product.
- **Argonaut Manufacturing Services Inc.** — HIGH · ✓verified
  Argonaut is a fill-finish/packaging CDMO (F1) whose ADC capability is limited to aseptic fill-finish of high-potent drug products including some ADCs; this qualifies as NARROW per F1 rule — relevant if it touches ADC drug product, but not a full-service ADC manufacturing CDMO.
- **BIOVECTRA** — MED · unverified · needs-evidence
  BIOVECTRA lists ADCs in modality types and has HPAPI/chemical synthesis capabilities consistent with ADC drug substance work, but fill-finish is also listed as a standalone service; without confirmation that ADC services extend to conjugation/upstream manufacturing rather than fill-finish only, NARROW is the appropriate verdict pending further evidence.
- **Crystal Pharmatech** — MED · unverified · needs-evidence
  Crystal Pharmatech's core is small-molecule solid-state/formulation CDMO; ADC touchpoints are confined to analytical/bioanalytical services (LC-MS characterization) under Crystal Bio Solutions, with no evidence of conjugation, fill-finish, or drug product manufacturing for ADCs — ADC analytics alone is a thin fit, so NARROW pending evidence of broader ADC manufacturing engagement.
- **Dalton Pharma Services** — MED · unverified · needs-evidence
  Dalton is a small-molecule-centric CDMO that explicitly offers ADC custom conjugation services, qualifying under C1; however, its primary profile is sterile/oral drug product manufacturing (F1-adjacent), and the ADC work appears narrow in scope — NARROW verdict pending confirmation of meaningful ADC bioconjugation capability beyond fill-finish.
- **Exela Pharma Sciences LLC** — MED · unverified · needs-evidence
  Exela is a sterile injectable CDMO with no verified ADC-specific capability in the provided description; the 'ADCs' enrichment tag is an unverified claim that conflicts with the company's own focus language (generic injectables, ophthalmic), so NARROW is assigned under F1 pending evidence of actual ADC drug product manufacturing.
- **ILC Dover** — MED · ✓verified
  ILC Dover is a containment equipment/single-use systems supplier specifically serving ADC manufacturing (soloADC isolator for ADC manufacturing and toxic linker compounding), making it relevant to the ngAbs/ADC play but only as a packaging/containment hardware vendor rather than a full-service drug manufacturer — fits NARROW (F1-adjacent: ADC drug product-touching but not a true drug CDMO).
- **LGM Pharma** — MED · unverified · needs-evidence
  LGM is a CDMO that claims ADC work, but the only detailed ADC case study shows it sourcing a mAb and routing manufacturing to a third party, raising doubt about whether it performs in-scope ADC drug product manufacturing itself rather than acting as a supply-chain intermediary; NARROW pending verification of in-house ADC manufacturing capability.
- **Lifecore Biomedical** — HIGH · unverified · needs-evidence
  Fill/finish CDMO (F1) with fragment handling but no confirmed ADC drug product work; C3 fragment-only disqualifies as developer; NARROW per F1 rule only if ADC fill/finish is confirmed, which it is not — currently at the low end of NARROW with no ADC evidence.
- **LSNE Contract Manufacturing** — HIGH · ✓verified
  LSNE is a fill-finish/lyophilization CDMO whose ADC involvement is confirmed but limited to drug product finishing (F1 criterion); no evidence of upstream ADC bioconjugation services, so NARROW rather than IN per F1 rule.
- **Proteintech Group** — MED · unverified · needs-evidence
  Proteintech is primarily a research antibody catalog supplier with custom antibody CDMO services; bispecific antibody custom development is explicitly listed as a service (C1 pass), but the company's core business appears to be standard research-grade antibodies, making the bispecific CDMO footprint uncertain in depth — NARROW pending confirmation of meaningful GMP bispecific manufacturing activity.
- **Recipharm Advanced Bio** — MED · unverified · needs-evidence
  Recipharm corporate clearly offers ADC services (C1 pass), but Recipharm Advanced Bio's own stated focus is ATMPs/viral vectors/mRNA/plasmid DNA (N4 concern); the ADC capability may belong to a sibling division rather than this entity, making the scope ambiguous — NARROW pending confirmation that ADC services are actually delivered through this division.
- **Simtra BioPharma Solutions** — HIGH · ✓verified
  Simtra is a fill/finish CDMO (F1 applies) that has an ADC-specific alliance with MilliporeSigma, bringing it into narrow ADC drug-product territory; not a full-service ADC CDMO handling conjugation, but ADC drug product fill/finish is a real ngAbs touchpoint — NARROW per F1 rule.

### OUT — exclude (flagged, not dropped) (12)
- **Adverum Biotechnologies** — HIGH · ✓verified
  AAV (N4) -> OUT
- **Akston** — HIGH · ✓verified
  fusion-only (N1) -> OUT
- **BlueRock Therapeutics** — MED · ✓verified
  BlueRock Therapeutics is an iPSC-derived cell therapy developer (Bayer subsidiary); no bispecific, multispecific, ADC, or conjugate modalities identified — core modality is cell therapy, not ngAbs.
- **FogPharma** — HIGH · ✓verified
  biotech_modality_types claims 'ADCs' but company_focus and strategic_notes confirm core modality is Helicon stapled peptides and AHCs (Antibody-Helicon Conjugates), a novel peptide conjugate class — not a true ADC, bispecific, or C2-qualifying conjugate; N-rules do not apply but C1/C2 both fail, so OUT.
- **Hovione** — MED · unverified · needs-evidence
  As a CDMO, Hovione qualifies only if it services in-scope modalities; available evidence shows antibody/fragment manufacturing but no bispecific, ADC, or C2 conjugate services — C3 fragment-only rule applies, yielding OUT pending further evidence.
- **ImmunityBio, Inc.** — HIGH · ✓verified
  biotech_modality_types claims 'immunocytokines' but strategic_notes confirm lead product ANKTIVA is an IL-15 Fc-fusion protein (N1), consistent with known system trap; no bispecific/multispecific/ADC/true conjugate found → OUT
- **Insilico Medicine** — HIGH · ✓verified
  fragment-only (C3) -> OUT
- **Lyell Immunopharma** — HIGH · ✓verified
  CAR (N3) -> OUT
- **MaxCyte, Inc.** — HIGH · ✓verified
  MaxCyte is an electroporation instrument/platform company serving the cell therapy and antibody production markets; the biotech_modality_types field 'bispecific antibodies' is an overclaim — bispecifics appear only as an example use-case in a resource article about CHO transient expression, not as a MaxCyte product or service modality; the company does not develop, manufacture, or CDMO-service ngAbs modalities and is OUT.
- **Polaris Pharmaceuticals Inc.** — HIGH · ✓verified
  CDMO specializing in microbial fermentation biologics (mAbs, peptides, proteins); no bispecific, multispecific, ADC, or other in-scope modality services described anywhere in the evidence.
- **REGENXBIO** — HIGH · ✓verified
  AAV (N4) -> OUT
- **Spyre Therapeutics** — HIGH · ✓verified
  Spyre's entire pipeline comprises half-life extended monoclonal antibodies (mAbs) with no bispecific, multispecific, ADC, or other in-scope modality; mAb-only developer does not qualify for the ngAbs play.

### NEEDS_REVIEW — not verified, do not promote yet (6)
- **Bora Biologics** — LOW · unverified · needs-evidence
  Bora is a drug substance CDMO; the enriched field claims bispecific servicing but the company description only references general biologics/biosimilars with no corroborating evidence of bispecific or ADC manufacturing capability — cannot confirm IN without verification.
- **Kashiv BioSciences LLC** — LOW · unverified · needs-evidence
  Known trap: Kashiv is explicitly called out in system instructions as a case where the enriched 'bispecific' field is an overclaim (mAb-only in practice); strategic_notes capability listing does not confirm an actual bispecific product; cannot assert IN without pipeline evidence of a true bispecific or ADC asset.
- **Kashiv BioSciences LLC** — LOW · unverified · needs-evidence
  Known trap: Kashiv is explicitly cited in classifier guidance as a case where the 'bispecific' field may overclaim over a reality of mAb/biosimilar-only assets; the company description emphasizes biosimilars and mAbs with no concrete bispecific product named, so the bispecific claim cannot be trusted without pipeline verification.
- **Lannett Company, Inc.** — LOW · unverified · needs-evidence
  Core business is oral solid dose generics CDMO with no apparent ngAbs modality; strategic_notes mention a 'next-generation antibodies' collaboration but provide no modality detail (bispecific? mAb? ADC?), insufficient to assert IN — needs evidence on what modality the collaboration covers and Lannett's role in it.
- **PSC Biotech Corporation** — LOW · unverified · needs-evidence
  No modality, pipeline, or role data provided beyond company name; cannot classify without evidence of what PSC Biotech does or manufactures.
- **XtalPi Inc.** — LOW · unverified · needs-evidence
  biotech_modality_types 'ADCs' is an unverified enrichment claim; company description is AI/quantum drug discovery with antibody discovery platform XupremAb noted, but no evidence in provided text that ADC or bispecific work is performed — needs pipeline/services verification before IN verdict


## Gap + enrichment plan (research lane — parked)
- **Absci**: source:self_description; wants:Pipeline page or published programs confirming actual multispecific antibody drug candidates in development (vs. merely offering multispecific design as a platform capability); de novo multispecific programs would solidify IN verdict — Absci's platform explicitly targets multispecific/multi-valency antibody design per strategic notes and modality field, supporting C1; confidence is MED rather than HIGH because the self-description reflects platform capability rather than confirmed clinical-stage multispecific drug candidates, and the biotech_modality_types enrichment field is unverified.
- **Parabilis Medicines**: source:self_description; wants:Confirmation that AHCs use a full antibody backbone (not fragment-only) and that the conjugate format is sufficiently analogous to ADC/AOC to qualify; pipeline page or IND-stage data on AHC structure would settle this — The AHC (Antibody-Helicon Conjugate) modality is structurally analogous to C2 conjugate subclass (ADC/AOC); however, 'Helicon' is a novel non-oligonucleotide, non-cytotoxic peptide payload and the antibody backbone role is unconfirmed, so confidence is MED pending structural verification; biotech_modality_types 'ADCs' appears overclaimed relative to self-description but AHC directionally qualifies.
- **Visterra Inc.**: source:self_description; wants:Pipeline page or clinical trial listings confirming active bispecific/multispecific or ADC/payload-conjugate program (as opposed to these being aspirational platform capabilities only); 'payload-conjugates' language is consistent with ADC but not fully explicit — Visterra's own 'Our Approach' language explicitly names multi-specific molecules and payload-conjugates alongside Fc-fusions; N1 does not apply because in-scope modalities co-occur; confidence is MED pending pipeline confirmation that bispecific/ADC programs are active rather than platform-only claims
- **BIOVECTRA**: source:self_description; wants:Specific ADC service page or case study confirming drug substance (API/conjugation) manufacturing vs. fill-finish-only for ADCs; pipeline or client references showing conjugation/linker-payload synthesis capability. — BIOVECTRA lists ADCs in modality types and has HPAPI/chemical synthesis capabilities consistent with ADC drug substance work, but fill-finish is also listed as a standalone service; without confirmation that ADC services extend to conjugation/upstream manufacturing rather than fill-finish only, NARROW is the appropriate verdict pending further evidence.
- **Crystal Pharmatech**: source:self_description; wants:Evidence of full ADC drug product manufacturing, conjugation, or linker-payload services — versus analytics/characterization only; a dedicated ADC services page or client case study would resolve whether this is a substantive ADC CDMO or analytics-only provider — Crystal Pharmatech's core is small-molecule solid-state/formulation CDMO; ADC touchpoints are confined to analytical/bioanalytical services (LC-MS characterization) under Crystal Bio Solutions, with no evidence of conjugation, fill-finish, or drug product manufacturing for ADCs — ADC analytics alone is a thin fit, so NARROW pending evidence of broader ADC manufacturing engagement.
- **Dalton Pharma Services**: source:self_description; wants:Scope and scale of ADC conjugation services: does Dalton perform linker-payload conjugation and bioconjugation chemistry (full ADC manufacturing), or is it limited to downstream drug product fill-finish for ADC drug products? A dedicated ADC capability page or client case study would resolve this. — Dalton is a small-molecule-centric CDMO that explicitly offers ADC custom conjugation services, qualifying under C1; however, its primary profile is sterile/oral drug product manufacturing (F1-adjacent), and the ADC work appears narrow in scope — NARROW verdict pending confirmation of meaningful ADC bioconjugation capability beyond fill-finish.
- **Exela Pharma Sciences LLC**: source:self_description; wants:Confirmation that Exela specifically manufactures ADC drug product (drug product fill-finish or earlier ADC steps such as conjugation); a services page or client case study explicitly referencing ADC manufacturing would settle this. If only generic sterile injectables with no ADC work, verdict should be OUT. — Exela is a sterile injectable CDMO with no verified ADC-specific capability in the provided description; the 'ADCs' enrichment tag is an unverified claim that conflicts with the company's own focus language (generic injectables, ophthalmic), so NARROW is assigned under F1 pending evidence of actual ADC drug product manufacturing.
- **LGM Pharma**: source:self_description; wants:Clarification on whether LGM directly performs ADC conjugation, formulation, or fill-finish in-house vs. purely acting as an API sourcer/supply-chain broker for ADC clients; service catalog or capabilities page for ADC manufacturing scope — LGM is a CDMO that claims ADC work, but the only detailed ADC case study shows it sourcing a mAb and routing manufacturing to a third party, raising doubt about whether it performs in-scope ADC drug product manufacturing itself rather than acting as a supply-chain intermediary; NARROW pending verification of in-house ADC manufacturing capability.
- **Lifecore Biomedical**: source:self_description; wants:Evidence that Lifecore performs fill/finish specifically for ADC drug products would upgrade to NARROW with ADC relevance; absent that, this is fill/finish only with fragment handling and no in-scope modality touchpoint — Fill/finish CDMO (F1) with fragment handling but no confirmed ADC drug product work; C3 fragment-only disqualifies as developer; NARROW per F1 rule only if ADC fill/finish is confirmed, which it is not — currently at the low end of NARROW with no ADC evidence.
- **Proteintech Group**: wants:Scale and depth of bispecific CDMO activity: is bispecific manufacturing a substantive service line or only offered at research/discovery scale? Any GMP bispecific programs or client case studies would confirm full IN vs. NARROW. — Proteintech is primarily a research antibody catalog supplier with custom antibody CDMO services; bispecific antibody custom development is explicitly listed as a service (C1 pass), but the company's core business appears to be standard research-grade antibodies, making the bispecific CDMO footprint uncertain in depth — NARROW pending confirmation of meaningful GMP bispecific manufacturing activity.
- **Recipharm Advanced Bio**: source:self_description; wants:Clarification on whether ADC/bioconjugate services are offered by this specific Recipharm Advanced Bio division or only by a separate Recipharm division (e.g., Recipharm Specialty Chemicals or another unit). If ADC work is a different organizational entity, this division may be OUT due to N4 (viral vector/ATMP focus only). — Recipharm corporate clearly offers ADC services (C1 pass), but Recipharm Advanced Bio's own stated focus is ATMPs/viral vectors/mRNA/plasmid DNA (N4 concern); the ADC capability may belong to a sibling division rather than this entity, making the scope ambiguous — NARROW pending confirmation that ADC services are actually delivered through this division.
- **Bora Biologics**: source:self_description; wants:Confirmation that Bora Biologics actively manufactures bispecific antibodies or ADCs for clients (e.g., capabilities page, client case studies, technology transfer examples referencing bispecific or ADC drug substance); the enrichment claim of 'bispecific antibodies' is unverified against the website description — Bora is a drug substance CDMO; the enriched field claims bispecific servicing but the company description only references general biologics/biosimilars with no corroborating evidence of bispecific or ADC manufacturing capability — cannot confirm IN without verification.
- **Kashiv BioSciences LLC**: source:self_description; wants:Pipeline page confirming an actual bispecific antibody product or program in development (not merely listed as a capability); known trap flagged — biotech_modality_types 'bispecific' for Kashiv has previously been assessed as overclaim (mAb-only in practice) — Known trap: Kashiv is explicitly called out in system instructions as a case where the enriched 'bispecific' field is an overclaim (mAb-only in practice); strategic_notes capability listing does not confirm an actual bispecific product; cannot assert IN without pipeline evidence of a true bispecific or ADC asset.
- **Kashiv BioSciences LLC**: source:self_description; wants:Pipeline page or clinical-trial registry confirming an actual bispecific antibody product in development or commercialization; known trap — Kashiv is flagged as a case where biotech_modality_types 'bispecific' may overclaim and the actual portfolio may be mAb/biosimilar-only — Known trap: Kashiv is explicitly cited in classifier guidance as a case where the 'bispecific' field may overclaim over a reality of mAb/biosimilar-only assets; the company description emphasizes biosimilars and mAbs with no concrete bispecific product named, so the bispecific claim cannot be trusted without pipeline verification.
- **Lannett Company, Inc.**: source:self_description; wants:Details of the 'next-generation antibodies' collaboration referenced in strategic_notes: which partner, what modalities (bispecific/ADC/other), and whether Lannett is a manufacturing or discovery contributor — pipeline page or press release would resolve this — Core business is oral solid dose generics CDMO with no apparent ngAbs modality; strategic_notes mention a 'next-generation antibodies' collaboration but provide no modality detail (bispecific? mAb? ADC?), insufficient to assert IN — needs evidence on what modality the collaboration covers and Lannett's role in it.
- **PSC Biotech Corporation**: source:self_description; wants:PSC Biotech Corporation's service offerings or pipeline page to determine if they develop, manufacture, or service bispecific/multispecific antibodies, ADCs, AOCs, or other in-scope modalities; their website or public description indicates they may be a CDMO/software/consulting firm but no modality data is present — No modality, pipeline, or role data provided beyond company name; cannot classify without evidence of what PSC Biotech does or manufactures.
- **XtalPi Inc.**: source:self_description; wants:Pipeline or services page confirming whether XupremAb or other XtalPi capabilities explicitly service ADC design, bispecific antibody generation, or other in-scope ngAbs modalities — versus being a standard mAb/small-molecule discovery platform only — biotech_modality_types 'ADCs' is an unverified enrichment claim; company description is AI/quantum drug discovery with antibody discovery platform XupremAb noted, but no evidence in provided text that ADC or bispecific work is performed — needs pipeline/services verification before IN verdict
- **Hovione**: source:self_description; wants:Pipeline or service page confirming ADC, bispecific, or other in-scope modality manufacturing services; current evidence shows only general biologics/fragment work with no in-scope modality. — As a CDMO, Hovione qualifies only if it services in-scope modalities; available evidence shows antibody/fragment manufacturing but no bispecific, ADC, or C2 conjugate services — C3 fragment-only rule applies, yielding OUT pending further evidence.

## Dedup / hierarchy + acquired-routing
- **FUJIFILM Diosynth Biotechnologies** [acquired] → FUJIFILM Biotechnologies — client SME 2026-06-05: FUJIFILM Diosynth -> FUJIFILM
- **LSNE Contract Manufacturing** [acquired] → PCI Pharma Services — client SME gold: LSNE no longer independent -> PCI (domain in use is pci.com; no separate PCI row in batch)
- **Kashiv BioSciences LLC** [exact_dup] → Kashiv BioSciences LLC — exact name duplicate of Kashiv BioSciences LLC (kashivpharma.com)
- **KBI Biopharma** [hierarchy] → SK pharmteco — client SME gold: SK pharmteco is the parent of KBI Biopharma (keep both, do not collapse)

## Execution operations (for the executor, on approval)
1. promote the IN set on-rails via promote_staging_batch (provenance-aware).
2. leave NARROW + OUT in staging, visibly flagged; do not drop.
3. hold NEEDS_REVIEW for the research lane.

## APPROVAL: <go | no-go> — Nick, <date>
