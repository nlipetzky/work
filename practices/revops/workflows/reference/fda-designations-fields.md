# FDA Designations APIs — Full Field Reference

Source: openFDA (api.fda.gov) + Orphan Drug Designation Database + Drugs@FDA + FDA scrape-only listings
Total leaf fields: **172**

Field paths are dot-paths into the response JSON. For openFDA endpoints, every field below sits under `results[]`. Array markers `[]` indicate the field is itself a list.

## openFDA drug/drugsfda endpoint

Most relevant endpoint for designation tracking. Approval/submission history with regulatory action codes lives under `submissions[]`. Orphan/Fast Track/Breakthrough/Priority Review flags are typically encoded in `submissions[].review_priority` and `submissions[].submission_class_code` / `submission_class_code_description`.

### Top-level
- `application_number` ... NDA/ANDA/BLA number (or CFR citation for OTC Monograph). Null for unapproved drugs.
- `sponsor_name` ... Company that submitted the application to FDA.

### products[]
- `products[].product_number` ... Product number assigned to each drug product within an application; multiple strengths = multiple product numbers.
- `products[].brand_name` ... Brand or trade name of the drug product.
- `products[].dosage_form` ... Drug dosage form (e.g., tablet, solution for injection).
- `products[].route` ... Route of administration.
- `products[].marketing_status` ... Prescription / Discontinued / None (Tentative Approval) / Over-the-counter.
- `products[].reference_drug` ... Whether the product is a reference drug.
- `products[].reference_standard` ... Whether the product is a reference standard.
- `products[].te_code` ... Therapeutic equivalence code.
- `products[].active_ingredients[].name` ... Active ingredient name.
- `products[].active_ingredients[].strength` ... Active ingredient strength.

### submissions[]
- `submissions[].submission_type` ... Type of individual submission (used with submission_number).
- `submissions[].submission_number` ... Unique identifier for the submission under an application.
- `submissions[].submission_status` ... Current status of the submission (e.g., AP, TA).
- `submissions[].submission_status_date` ... Date the status was applied.
- `submissions[].submission_class_code` ... Submission Classification Code (formerly Chemistry Classification Code).
- `submissions[].submission_class_code_description` ... Full description of the classification code (this is where labels like "Orphan", "Type 1 - New Molecular Entity" surface).
- `submissions[].review_priority` ... Review priority (e.g., PRIORITY, STANDARD). Priority Review designation lives here.
- `submissions[].submission_public_notes` ... Publicly available notes regarding the submission.
- `submissions[].submission_property_type[].code` ... Code indicating the submission property type.
- `submissions[].application_docs[].id` ... ID of the applications document.
- `submissions[].application_docs[].date` ... Publication date of the applications document.
- `submissions[].application_docs[].title` ... Title of the applications document.
- `submissions[].application_docs[].type` ... Type of the applications document.
- `submissions[].application_docs[].url` ... URL to access the applications document (Approval Letters, Labels, Reviews — designation language often appears in linked review documents).

### openfda (drugsfda)
- `openfda.application_number[]` ... NDA/ANDA/BLA number.
- `openfda.brand_name[]` ... Brand/trade name.
- `openfda.generic_name[]` ... Generic name(s).
- `openfda.manufacturer_name[]` ... Manufacturer/labeler name.
- `openfda.product_ndc[]` ... Labeler+product NDC segments.
- `openfda.package_ndc[]` ... Full NDC including package size.
- `openfda.substance_name[]` ... Active ingredients list.
- `openfda.route[]` ... Route of administration.
- `openfda.rxcui[]` ... RxNorm Concept Unique Identifier.
- `openfda.unii[]` ... Unique Ingredient Identifier.
- `openfda.spl_id[]` ... SPL document ID (versioned).
- `openfda.spl_set_id[]` ... SPL set ID (stable across versions).
- `openfda.nui[]` ... NDF-RT unique identifier.
- `openfda.pharm_class_epc[]` ... Established pharmacologic class [EPC].
- `openfda.pharm_class_moa[]` ... Mechanism of action [MoA].
- `openfda.pharm_class_pe[]` ... Physiologic effect [PE].
- `openfda.pharm_class_cs[]` ... Chemical structure classification.

## openFDA drug/ndc endpoint

### Top-level
- `product_id` ... Concatenation of NDC product code and SPL documentID.
- `product_ndc` ... Labeler manufacturer code + product code segments.
- `spl_id` ... Versioned SPL document ID.
- `product_type` ... Type of drug product.
- `finished` ... Whether the product is finished.
- `brand_name` ... Brand/trade name.
- `brand_name_base` ... Brand name excluding suffix.
- `brand_name_suffix` ... Suffix appended to brand (e.g., XR, PM).
- `generic_name` ... Generic name(s).
- `dosage_form` ... Dosage form.
- `route` ... Route of administration.
- `marketing_start_date` ... Start of marketing (date).
- `marketing_end_date` ... End of marketing (date).
- `marketing_category` ... NDA / ANDA / BLA / OTC Monograph / Unapproved Drug.
- `application_number` ... NDA/ANDA/BLA number for products with corresponding Marketing Category.
- `pharm_class` ... Pharmacologic class.
- `dea_schedule` ... DEA controlled substance schedule.
- `listing_expiration_date` ... Listing expiration date.

### active_ingredients[]
- `active_ingredients[].name` ... Active ingredient name.
- `active_ingredients[].strength` ... Active ingredient strength.

### packaging[]
- `packaging[].package_ndc` ... Full NDC including package size.
- `packaging[].description` ... Package description.
- `packaging[].marketing_start_date` / `.marketing_end_date` ... Per-package marketing window.
- `packaging[].sample` ... Whether the package is a sample.

### openfda (ndc)
- `openfda.manufacturer_name[]` ... Manufacturer name.
- `openfda.is_original_packager[]` ... Whether the drug has been repackaged.
- `openfda.nui[]` / `.rxcui[]` / `.unii[]` / `.spl_id[]` / `.spl_set_id[]` ... Cross-reference identifiers (same semantics as drugsfda.openfda).
- `openfda.pharm_class_epc[]` / `.pharm_class_moa[]` / `.pharm_class_pe[]` / `.pharm_class_cs[]` ... Pharmacologic class facets.
- `openfda.upc[]` ... Universal product code, where present.

## openFDA drug/label endpoint

Structured Product Labeling. Sections relevant to designations: `boxed_warning`, `indications_and_usage`, `clinical_studies`, `clinical_pharmacology`. Each text-section field has a paired `_table` field with the same semantics — listed together with slash continuation.

### Identity / metadata
- `id` ... SPL document ID.
- `effective_time` ... SPL effective time (date).
- `set_id` ... SPL set ID (stable across versions).
- `version` ... Label version number.

### Prescription label text sections (each also has a `_table` sibling)
- `boxed_warning[]` / `.boxed_warning_table[]` ... Boxed warning text.
- `indications_and_usage[]` / `.indications_and_usage_table[]` ... Approved indications (designation-relevant disease context).
- `dosage_and_administration[]` / `.dosage_and_administration_table[]` ... Dosing.
- `dosage_forms_and_strengths[]` / `.dosage_forms_and_strengths_table[]` ... Form/strength.
- `contraindications[]` / `.contraindications_table[]` ... Contraindications.
- `warnings[]` / `.warnings_table[]` ... Warnings.
- `warnings_and_cautions[]` / `.warnings_and_cautions_table[]` ... Warnings & cautions.
- `precautions[]` / `.precautions_table[]` ... Precautions.
- `general_precautions[]` / `.general_precautions_table[]` ... General precautions.
- `adverse_reactions[]` / `.adverse_reactions_table[]` ... Adverse reactions.
- `drug_interactions[]` / `.drug_interactions_table[]` ... Drug interactions.
- `drug_and_or_laboratory_test_interactions[]` / `.drug_and_or_laboratory_test_interactions_table[]` ... Drug/lab interactions.
- `pregnancy[]` / `.pregnancy_table[]` ... Pregnancy info.
- `pregnancy_or_breast_feeding[]` / `.pregnancy_or_breast_feeding_table[]` ... Pregnancy/breastfeeding.
- `nursing_mothers[]` / `.nursing_mothers_table[]` ... Nursing mothers.
- `pediatric_use[]` / `.pediatric_use_table[]` ... Pediatric use (relevant to Rare Pediatric Disease designation).
- `geriatric_use[]` / `.geriatric_use_table[]` ... Geriatric use.
- `use_in_specific_populations[]` / `.use_in_specific_populations_table[]` ... Specific populations.
- `overdosage[]` / `.overdosage_table[]` ... Overdosage.
- `description[]` / `.description_table[]` ... Drug description.
- `clinical_pharmacology[]` / `.clinical_pharmacology_table[]` ... Clinical pharmacology.
- `mechanism_of_action[]` / `.mechanism_of_action_table[]` ... MoA.
- `pharmacodynamics[]` / `.pharmacodynamics_table[]` ... PD.
- `pharmacokinetics[]` / `.pharmacokinetics_table[]` ... PK.
- `microbiology[]` / `.microbiology_table[]` ... Microbiology.
- `nonclinical_toxicology[]` / `.nonclinical_toxicology_table[]` ... Nonclinical tox.
- `carcinogenesis_and_mutagenesis_and_impairment_of_fertility[]` / `.carcinogenesis_and_mutagenesis_and_impairment_of_fertility_table[]` ... Carc/mut/fertility.
- `animal_pharmacology_and_or_toxicology[]` / `.animal_pharmacology_and_or_toxicology_table[]` ... Animal pharm/tox.
- `clinical_studies[]` / `.clinical_studies_table[]` ... Clinical studies (where Accelerated Approval surrogate endpoint language often appears).
- `references[]` / `.references_table[]` ... References.
- `how_supplied[]` / `.how_supplied_table[]` ... How supplied.
- `storage_and_handling[]` / `.storage_and_handling_table[]` ... Storage & handling.
- `patient_medication_information[]` / `.patient_medication_information_table[]` ... Patient med info.
- `information_for_patients[]` / `.information_for_patients_table[]` ... Patient info.
- `spl_patient_package_insert[]` / `.spl_patient_package_insert_table[]` ... SPL patient package insert.
- `spl_medguide[]` / `.spl_medguide_table[]` ... Medication guide.
- `instructions_for_use[]` / `.instructions_for_use_table[]` ... Instructions for use.
- `laboratory_tests[]` / `.laboratory_tests_table[]` ... Laboratory tests.
- `recent_major_changes[]` / `.recent_major_changes_table[]` ... Recent major changes.
- `information_for_owners_or_caregivers[]` / `.information_for_owners_or_caregivers_table[]` ... Caregiver info.
- `health_care_provider_letter[]` / `.health_care_provider_letter_table[]` ... Dear HCP letter.

### Controlled substance / abuse
- `controlled_substance[]` / `.controlled_substance_table[]` ... CSA scheduling.
- `abuse[]` / `.abuse_table[]` ... Abuse info.
- `dependence[]` / `.dependence_table[]` ... Dependence.
- `drug_abuse_and_dependence[]` / `.drug_abuse_and_dependence_table[]` ... Combined.

### OTC label sections
- `active_ingredient[]` / `.active_ingredient_table[]` ... OTC active ingredient.
- `inactive_ingredient[]` / `.inactive_ingredient_table[]` ... Inactive ingredients.
- `purpose[]` / `.purpose_table[]` ... Stated purpose.
- `keep_out_of_reach_of_children[]` / `.keep_out_of_reach_of_children_table[]` ... KOORC.
- `do_not_use[]` / `.do_not_use_table[]` ... Do-not-use conditions.
- `ask_doctor[]` / `.ask_doctor_table[]` ... Ask-doctor conditions.
- `ask_doctor_or_pharmacist[]` / `.ask_doctor_or_pharmacist_table[]` ... Ask-doctor-or-pharm.
- `stop_use[]` / `.stop_use_table[]` ... Stop-use conditions.
- `when_using[]` / `.when_using_table[]` ... When-using cautions.
- `questions[]` / `.questions_table[]` ... Questions/contact.
- `package_label_principal_display_panel[]` / `.package_label_principal_display_panel_table[]` ... Display panel text.

### openfda (label)
- `openfda.application_number[]` / `.brand_name[]` / `.generic_name[]` / `.manufacturer_name[]` / `.product_ndc[]` / `.package_ndc[]` / `.product_type[]` / `.route[]` / `.substance_name[]` / `.rxcui[]` / `.unii[]` / `.spl_id[]` / `.spl_set_id[]` / `.nui[]` / `.pharm_class_epc[]` / `.pharm_class_moa[]` / `.pharm_class_pe[]` / `.pharm_class_cs[]` ... Same cross-reference identifiers as drugsfda.openfda. Filter by `openfda.application_number` to bridge label to drugsfda submission history.

## openFDA drug/event endpoint (FAERS)

Adverse event reports. Not directly a designation source, but useful when correlating adverse-event signal to a designated indication.

### Report metadata
- `safetyreportid` ... FAERS report ID.
- `safetyreportversion` ... Report version.
- `receiptdate` / `receiptdateformat` ... Receipt date + format code.
- `receivedate` / `receivedateformat` ... Initial receive date + format.
- `transmissiondate` / `transmissiondateformat` ... Transmission date + format.
- `reporttype` ... Type of report.
- `serious` ... Whether the report is serious.
- `seriousnessdeath` / `seriousnesslifethreatening` / `seriousnesshospitalization` / `seriousnessdisabling` / `seriousnesscongenitalanomali` / `seriousnessother` ... Seriousness flags.
- `authoritynumb` ... Regulatory authority case number.
- `companynumb` ... Company-assigned report identifier.
- `duplicate` ... Whether earlier versions were submitted.
- `fulfillexpeditecriteria` ... Expedited (15-day) report flag.
- `occurcountry` ... Country where event occurred.
- `primarysourcecountry` ... Country of primary source.

### primarysource
- `primarysource.qualification` ... Reporter qualification.
- `primarysource.reportercountry` ... Reporter country.
- `primarysource.literaturereference` ... Literature reference, when available.

### sender / receiver / reportduplicate
- `sender.sendertype` / `sender.senderorganization` ... Sender info.
- `receiver.receivertype` / `receiver.receiverorganization` ... Receiver info.
- `reportduplicate.duplicatenumb` / `reportduplicate.duplicatesource` ... Duplicate report identifiers.

### patient
- `patient.patientonsetage` / `patient.patientonsetageunit` ... Patient age at onset and unit code.
- `patient.patientsex` ... Patient sex code.
- `patient.patientweight` ... Patient weight in kg.
- `patient.patientdeath.patientdeathdate` / `.patientdeathdateformat` ... Death date and format.
- `patient.summary.narrativeincludeclinical` ... Case narrative (Case Event Date populated, narrative excluded).

### patient.drug[]
- `patient.drug[].medicinalproduct` ... Drug name (brand or generic).
- `patient.drug[].drugcharacterization` ... Suspect/concomitant/interacting code.
- `patient.drug[].drugauthorizationnumb` ... Authorization (e.g., NDA) number.
- `patient.drug[].drugadministrationroute` ... Route of administration code.
- `patient.drug[].drugindication` ... Indication for use.
- `patient.drug[].drugbatchnumb` ... Batch/lot number.
- `patient.drug[].drugdosagetext` ... Free-text dosage.
- `patient.drug[].drugdosageform` ... Dosage form.
- `patient.drug[].drugstartdate` / `.drugstartdateformat` ... Start of use.
- `patient.drug[].drugenddate` / `.drugenddateformat` ... End of use.
- `patient.drug[].drugtreatmentduration` / `.drugtreatmentdurationunit` ... Treatment duration.
- `patient.drug[].drugstructuredosagenumb` / `.drugstructuredosageunit` ... Structured dosage amount/unit.
- `patient.drug[].drugintervaldosagedefinition` / `.drugintervaldosageunitnumb` ... Dosing interval.
- `patient.drug[].drugrecurreadministration` ... Whether rechallenge re-administered.
- `patient.drug[].drugadditional` ... Dechallenge outcome.
- `patient.drug[].actiondrug` ... Action taken with the drug.
- `patient.drug[].activesubstance.activesubstancename` ... Active substance name.
- `patient.drug[].openfda.*` ... Full openfda block per drug (application_number, brand_name, generic_name, manufacturer_name, product_ndc, package_ndc, product_type, route, substance_name, rxcui, unii, spl_id, spl_set_id, nui, pharm_class_epc/moa/pe/cs) — same semantics as drugsfda.openfda, scoped to the reported drug.

### patient.reaction[]
- `patient.reaction[].reactionmeddrapt` ... MedDRA preferred term for the reaction.
- `patient.reaction[].reactionmeddraversionpt` ... MedDRA version.
- `patient.reaction[].reactionoutcome` ... Outcome code (1 Recovered ... 6 Unknown).

## Orphan Drug Designation Database (scrape-only)

Source: `https://www.accessdata.fda.gov/scripts/opdlisting/oopd/` — searchable HTML interface, no JSON API. Each row in the search results table corresponds to one designation event.

- `designation_date` ... Date FDA granted orphan designation. (scrape-only)
- `generic_name` ... Generic/established name of the designated product. (scrape-only)
- `trade_name` ... Trade name if assigned at designation; often empty for early-stage. (scrape-only)
- `sponsor` ... Company holding the designation. (scrape-only)
- `designation_status` ... Designated / Withdrawn. (scrape-only)
- `marketing_approval_status` ... Approved for Orphan Indication / Not Yet Approved. (scrape-only)
- `orphan_designation` ... Free-text disease/condition the orphan designation covers. (scrape-only)
- `approved_indication` ... Approved indication text where marketing approval has occurred. (scrape-only)
- `fda_orphan_designation_request_number` ... FDA-assigned request/designation number (sometimes shown on detail page). (scrape-only)

## CDER Drugs@FDA approval database (scrape-only)

Source: `https://www.accessdata.fda.gov/scripts/cder/daf/` — same underlying data as openFDA `drugsfda` but exposes additional human-readable fields per approval action. Use openFDA where possible; scrape only for fields not exposed via the API.

- `application_number` ... Application number (links to detail page). (scrape-only)
- `application_type` ... NDA / ANDA / BLA. (scrape-only)
- `sponsor_applicant` ... Sponsor name on the application. (scrape-only)
- `product_name` ... Drug product name. (scrape-only)
- `active_ingredient` ... Active ingredient. (scrape-only)
- `dosage_form_route` ... Combined dosage form + route string. (scrape-only)
- `strength` ... Product strength. (scrape-only)
- `marketing_status` ... Prescription / OTC / Discontinued / Tentative Approval. (scrape-only)
- `te_code` ... Therapeutic equivalence code. (scrape-only)
- `rld` ... Reference Listed Drug flag. (scrape-only)
- `rs` ... Reference Standard flag. (scrape-only)
- `approval_date` ... Date of approval action. (scrape-only)
- `submission_type` ... Original / Supplement type. (scrape-only)
- `submission_number` ... Submission number under the application. (scrape-only)
- `submission_classification` ... Classification code (Type 1 NME, Type 4, etc.). (scrape-only)
- `review_priority` ... Priority / Standard. (scrape-only)
- `orphan_designation_flag` ... Whether the application/submission carries an orphan designation. (scrape-only — derived from submission detail page)
- `fast_track_flag` ... Whether the submission was Fast Track. (scrape-only — derived from review documents)
- `breakthrough_therapy_flag` ... Whether the submission was Breakthrough Therapy. (scrape-only — derived from review documents)
- `accelerated_approval_flag` ... Whether approval was via Accelerated Approval pathway. (scrape-only — derived from approval letter)
- `rmat_designation_flag` ... Whether the product carries RMAT designation (CBER cell/gene therapies). (scrape-only — derived from CBER press releases / review documents)
- `approval_letter_url` ... URL to PDF approval letter. (scrape-only)
- `label_url` ... URL to current label PDF. (scrape-only)
- `review_documents_url` ... URL to review packages (where designation language is most reliably stated). (scrape-only)

## Rare Pediatric Disease Priority Review Voucher list (scrape-only)

Source: `https://www.fda.gov/industry/medical-products-rare-pediatric-diseases-receiving-rare-pediatric-disease-priority-review-voucher` — static HTML table updated by FDA.

- `sponsor` ... Company that received the voucher. (scrape-only)
- `drug_name` ... Product receiving the voucher. (scrape-only)
- `indication` ... Rare pediatric disease indication. (scrape-only)
- `approval_date` ... Date of approval that triggered voucher issuance. (scrape-only)
- `application_number` ... NDA/BLA number. (scrape-only)
- `voucher_issued_date` ... Date voucher was issued (often same as approval). (scrape-only)
- `voucher_transferred` ... Whether the voucher has been transferred/sold. (scrape-only)
- `voucher_transferred_to` ... Recipient if transferred. (scrape-only)
- `voucher_redeemed` ... Whether the voucher has been redeemed. (scrape-only)
- `voucher_redeemed_for` ... Application the voucher was redeemed against. (scrape-only)

## Breakthrough Therapy / Fast Track / RMAT designation sources (no clean API)

There is no FDA endpoint that lists Breakthrough Therapy, Fast Track, or RMAT designations in structured form. They surface as:

- `drugsfda.submissions[].review_priority` and `submission_class_code_description` may carry these flags for the application/submission row, but coverage is partial.
- `drugsfda.submissions[].application_docs[].url` ... linked review documents and approval letters contain the authoritative designation language.
- FDA press releases (`https://www.fda.gov/news-events/press-announcements`) ... announcement-driven; unstructured. (scrape-only)
- CDER and CBER quarterly designation reports ... PDF only. (scrape-only)
- `https://www.fda.gov/regulatory-information/search-fda-guidance-documents` ... background only.

Track these via document scraping against `application_docs[].url` and quarterly PDFs; no enumerable schema beyond the openFDA fields already listed.

## What our workflows currently use
- (none yet — fda-designations-capture ticket in flight)
