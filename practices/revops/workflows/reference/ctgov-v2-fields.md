# ClinicalTrials.gov API v2 — Full Field Reference

Source: `https://clinicaltrials.gov/api/v2/studies/metadata` (fetched 2026-05-19)
Total leaf fields: **342**

Field paths are dot-paths into the study JSON, suitable for the `fields=` query parameter.

## Top-level sections

- `protocolSection` ... what the sponsor registered (study design)
- `resultsSection` ... results after the trial completes
- `annotationSection` ... unposted events + FDAAA violations
- `documentSection` ... uploaded protocol / SAP / ICF docs
- `derivedSection` ... MeSH browse terms + submission tracking
- `hasResults` ... boolean

---

## protocolSection (the operationally useful section)

### identificationModule
- `nctId` ... NCT primary ID
- `nctIdAliases[]` ... obsolete/duplicate NCTs
- `orgStudyIdInfo.id` / `.type` / `.link` ... sponsor's internal protocol ID
- `secondaryIdInfos[].id` / `.type` / `.domain` / `.link` ... cross-registry IDs (EudraCT, IND, etc.)
- `briefTitle`, `officialTitle`, `acronym`
- `organization.fullName`, `organization.class` ... submitting org

### statusModule
- `statusVerifiedDate` ... last sponsor-verified date
- `overallStatus` ... RECRUITING / ACTIVE_NOT_RECRUITING / COMPLETED / TERMINATED / WITHDRAWN / SUSPENDED / NOT_YET_RECRUITING / ENROLLING_BY_INVITATION / UNKNOWN
- `lastKnownStatus`
- `whyStopped` ... freeform reason for termination
- `delayedPosting` (bool)
- `expandedAccessInfo.hasExpandedAccess` / `.nctId` / `.statusForNctId`
- Dates (all `PartialDate` or `NormalizedDate`, with `type` = ACTUAL / ESTIMATED):
  - `startDateStruct.date` / `.type`
  - `primaryCompletionDateStruct.date` / `.type`
  - `completionDateStruct.date` / `.type`
  - `studyFirstSubmitDate`, `studyFirstSubmitQcDate`, `studyFirstPostDateStruct.date`
  - `resultsFirstSubmitDate`, `resultsFirstSubmitQcDate`, `resultsFirstPostDateStruct.date`, `resultsWaived`
  - `dispFirstSubmitDate`, `dispFirstSubmitQcDate`, `dispFirstPostDateStruct.date`
  - `lastUpdateSubmitDate`, `lastUpdatePostDateStruct.date` / `.type`

### sponsorCollaboratorsModule
- `responsibleParty.type` / `.investigatorFullName` / `.investigatorTitle` / `.investigatorAffiliation` / `.oldNameTitle` / `.oldOrganization`
- `leadSponsor.name` / `.class` ... class = INDUSTRY / NIH / FED / OTHER_GOV / NETWORK / AMBIG / INDIV / OTHER / UNKNOWN
- `collaborators[].name` / `.class`

### oversightModule
- `oversightHasDmc` (bool) ... has Data Monitoring Committee
- `isFdaRegulatedDrug`, `isFdaRegulatedDevice`, `isUnapprovedDevice`, `isPpsd`, `isUsExport`, `fdaaa801Violation`

### descriptionModule
- `briefSummary` (markup)
- `detailedDescription` (markup)

### conditionsModule
- `conditions[]` ... disease/condition strings
- `keywords[]`

### designModule
- `studyType` ... INTERVENTIONAL / OBSERVATIONAL / EXPANDED_ACCESS
- `phases[]` ... NA / EARLY_PHASE1 / PHASE1 / PHASE2 / PHASE3 / PHASE4
- `nPtrsToThisExpAccNctId`
- `expandedAccessTypes.individual` / `.intermediate` / `.treatment`
- `patientRegistry` (bool)
- `targetDuration`
- `designInfo.allocation` ... RANDOMIZED / NON_RANDOMIZED / NA
- `designInfo.interventionModel` ... SINGLE_GROUP / PARALLEL / CROSSOVER / FACTORIAL / SEQUENTIAL
- `designInfo.interventionModelDescription`
- `designInfo.primaryPurpose` ... TREATMENT / PREVENTION / DIAGNOSTIC / SUPPORTIVE_CARE / SCREENING / HEALTH_SERVICES_RESEARCH / BASIC_SCIENCE / DEVICE_FEASIBILITY / ECT / OTHER
- `designInfo.observationalModel`, `.timePerspective`
- `designInfo.maskingInfo.masking` / `.maskingDescription` / `.whoMasked[]`
- `bioSpec.retention` / `.description`
- `enrollmentInfo.count` (integer), `enrollmentInfo.type` (ACTUAL/ESTIMATED)

### armsInterventionsModule
- `armGroups[].label` / `.type` (EXPERIMENTAL / ACTIVE_COMPARATOR / PLACEBO_COMPARATOR / SHAM_COMPARATOR / NO_INTERVENTION / OTHER / etc.) / `.description` / `.interventionNames[]`
- `interventions[].type` ... DRUG / DEVICE / BIOLOGICAL / PROCEDURE / RADIATION / BEHAVIORAL / GENETIC / DIETARY_SUPPLEMENT / COMBINATION_PRODUCT / DIAGNOSTIC_TEST / OTHER
- `interventions[].name` / `.description` / `.armGroupLabels[]` / `.otherNames[]`

### outcomesModule
- `primaryOutcomes[].measure` / `.description` / `.timeFrame`
- `secondaryOutcomes[].measure` / `.description` / `.timeFrame`
- `otherOutcomes[].measure` / `.description` / `.timeFrame`

### eligibilityModule
- `eligibilityCriteria` (markup) ... full inclusion/exclusion text
- `healthyVolunteers` (bool)
- `sex` (ALL / FEMALE / MALE)
- `genderBased`, `genderDescription`
- `minimumAge`, `maximumAge`
- `stdAges[]` ... CHILD / ADULT / OLDER_ADULT
- `studyPopulation` (markup, observational)
- `samplingMethod`

### contactsLocationsModule
- `centralContacts[].name` / `.role` / `.phone` / `.phoneExt` / `.email`
- `overallOfficials[].name` / `.affiliation` / `.role`
- `locations[].facility` / `.status` / `.city` / `.state` / `.zip` / `.country` / `.geoPoint`
- `locations[].contacts[].name` / `.role` / `.phone` / `.phoneExt` / `.email`

### referencesModule
- `references[].pmid` / `.type` / `.citation`
- `references[].retractions[].pmid` / `.source`
- `seeAlsoLinks[].label` / `.url`
- `availIpds[].id` / `.type` / `.url` / `.comment`

### ipdSharingStatementModule
- `ipdSharing` ... YES / NO / UNDECIDED
- `description`, `infoTypes[]`, `timeFrame`, `accessCriteria`, `url`

---

## resultsSection (only present after results posted)

### participantFlowModule
- `preAssignmentDetails`, `recruitmentDetails`, `typeUnitsAnalyzed`
- `groups[].id` / `.title` / `.description`
- `periods[].title`
- `periods[].milestones[].type` / `.comment`
- `periods[].milestones[].achievements[].groupId` / `.comment` / `.numSubjects` / `.numUnits`
- `periods[].dropWithdraws[].type` / `.comment`
- `periods[].dropWithdraws[].reasons[].groupId` / `.comment` / `.numSubjects`

### baselineCharacteristicsModule
- `populationDescription`, `typeUnitsAnalyzed`
- `groups[]` (id/title/description)
- `denoms[].units` + `denoms[].counts[].groupId` / `.value`
- `measures[].title` / `.description` / `.populationDescription` / `.paramType` / `.dispersionType` / `.unitOfMeasure` / `.calculatePct` / `.denomUnitsSelected`
- `measures[].denoms[]`, `measures[].classes[].title` + `.denoms[]` + `.categories[].title` + `.categories[].measurements[].groupId` / `.value` / `.spread` / `.lowerLimit` / `.upperLimit` / `.comment`

### outcomeMeasuresModule
- `outcomeMeasures[]` ... type, title, description, populationDescription, reportingStatus, anticipatedPostingDate, paramType, dispersionType, unitOfMeasure, calculatePct, timeFrame, typeUnitsAnalyzed, denomUnitsSelected
- `outcomeMeasures[].groups[]`, `.denoms[]`
- `outcomeMeasures[].classes[].categories[].measurements[]` ... groupId, value, spread, lowerLimit, upperLimit, comment
- `outcomeMeasures[].analyses[]` ... full stats: paramType, paramValue, dispersionType, dispersionValue, statisticalMethod, statisticalComment, pValue, pValueComment, ciNumSides, ciPctValue, ciLowerLimit, ciUpperLimit, ciLowerLimitComment, ciUpperLimitComment, estimateComment, testedNonInferiority, nonInferiorityType, nonInferiorityComment, otherAnalysisDescription, groupDescription, groupIds[]

### adverseEventsModule
- `frequencyThreshold`, `timeFrame`, `description`, `allCauseMortalityComment`
- `eventGroups[].id` / `.title` / `.description` / `.deathsNumAffected` / `.deathsNumAtRisk` / `.seriousNumAffected` / `.seriousNumAtRisk` / `.otherNumAffected` / `.otherNumAtRisk`
- `seriousEvents[].term` / `.organSystem` / `.sourceVocabulary` / `.assessmentType` / `.notes` / `.stats[].groupId` / `.stats[].numEvents` / `.stats[].numAffected` / `.stats[].numAtRisk`
- `otherEvents[]` ... same shape as seriousEvents

### moreInfoModule
- `limitationsAndCaveats.description`
- `certainAgreement.piSponsorEmployee` / `.restrictionType` / `.restrictiveAgreement` / `.otherDetails`
- `pointOfContact.title` / `.organization` / `.email` / `.phone` / `.phoneExt`

---

## annotationSection
- `unpostedAnnotation.unpostedResponsibleParty`
- `unpostedAnnotation.unpostedEvents[].type` / `.date` / `.dateUnknown`
- `violationAnnotation.violationEvents[].type` / `.description` / `.creationDate` / `.issuedDate` / `.releaseDate` / `.postedDate`

## documentSection
- `largeDocumentModule.noSap`
- `largeDocumentModule.largeDocs[].typeAbbrev` / `.hasProtocol` / `.hasSap` / `.hasIcf` / `.label` / `.date` / `.uploadDate` / `.filename` / `.size`

## derivedSection
- `miscInfoModule.versionHolder`
- `miscInfoModule.removedCountries[]`
- `miscInfoModule.submissionTracking.estimatedResultsFirstSubmitDate`
- `miscInfoModule.submissionTracking.firstMcpInfo.postDateStruct.date` / `.type`
- `miscInfoModule.submissionTracking.submissionInfos[].releaseDate` / `.unreleaseDate` / `.unreleaseDateUnknown` / `.resetDate` / `.mcpReleaseN`
- `conditionBrowseModule.meshes[].id` / `.term` ... MeSH-mapped condition codes
- `conditionBrowseModule.ancestors[].id` / `.term`
- `conditionBrowseModule.browseLeaves[].id` / `.name` / `.asFound` / `.relevance`
- `conditionBrowseModule.browseBranches[].abbrev` / `.name`
- `interventionBrowseModule.meshes[].id` / `.term` ... MeSH-mapped intervention codes
- `interventionBrowseModule.ancestors[].id` / `.term`
- `interventionBrowseModule.browseLeaves[].id` / `.name` / `.asFound` / `.relevance`
- `interventionBrowseModule.browseBranches[].abbrev` / `.name`

## Top-level flag
- `hasResults` ... boolean

---

## What our L1 workflow currently uses

10 of 342:
- `protocolSection.identificationModule.nctId`
- `protocolSection.identificationModule.briefTitle`
- `protocolSection.sponsorCollaboratorsModule.leadSponsor`
- `protocolSection.sponsorCollaboratorsModule.collaborators`
- `protocolSection.designModule.phases`
- `protocolSection.statusModule.overallStatus`
- `protocolSection.conditionsModule.conditions`
- `protocolSection.armsInterventionsModule.interventions`
- `protocolSection.statusModule.startDateStruct`
- `protocolSection.statusModule.lastUpdatePostDateStruct`

## High-value fields we could add (cheap wins)

| Field | Why |
|---|---|
| `protocolSection.designModule.enrollmentInfo.count` + `.type` | trial size signal; informs commercial scale |
| `protocolSection.statusModule.primaryCompletionDateStruct.date` | when readout expected = buying-cycle timing |
| `protocolSection.statusModule.completionDateStruct.date` | full trial wrap; long-term mfg demand |
| `protocolSection.statusModule.whyStopped` | distinguishes terminated-for-futility vs. business reasons |
| `protocolSection.designModule.designInfo.primaryPurpose` | confirms TREATMENT vs. BASIC_SCIENCE (filters non-commercial) |
| `protocolSection.armsInterventionsModule.interventions.type` | confirms BIOLOGICAL/GENETIC (rules out small-molecule false-positives in AAV searches) |
| `protocolSection.contactsLocationsModule.locations.country` | US/EU/ROW geo segmentation |
| `protocolSection.contactsLocationsModule.locations.facility` | site list = manufacturing/clinical-network signal |
| `protocolSection.identificationModule.secondaryIdInfos` | IND numbers = FDA-stage signal |
| `protocolSection.referencesModule.references[].pmid` | publication trail for warm-outreach hooks |
| `protocolSection.sponsorCollaboratorsModule.responsibleParty.investigatorFullName` + `.investigatorAffiliation` | named contact / academic-collab signal |
| `derivedSection.interventionBrowseModule.meshes[].term` | MeSH-normalized intervention vocabulary (better dedup/classification than freeform `interventions[].name`) |
| `derivedSection.conditionBrowseModule.meshes[].term` | MeSH-normalized indication |
| `protocolSection.descriptionModule.briefSummary` | LLM-classifiable text for "is this really AAV gene therapy or AAV-as-tool?" |
| `hasResults` | filters out completed-with-readout cohort for case-study targeting |
