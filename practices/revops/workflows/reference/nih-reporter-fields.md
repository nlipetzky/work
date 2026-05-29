# NIH RePORTER API — Full Field Reference

Source: https://api.reporter.nih.gov/
Data dictionary: https://api.reporter.nih.gov/documents/Data%20Elements%20for%20RePORTER%20Project%20API_V2.pdf
Total leaf fields: **104** (Projects v2: 101 leaves across `results[]` + 3 leaves in `meta`; Publications v2: 3 leaves across `results[]`)

Field paths are dot-paths into the response JSON. `[]` marks array elements. Sibling-leaf shorthand: `parent.a` / `.b` / `.c` means three leaves under the same parent sharing the description.

## projects search response — POST /v2/projects/search

Envelope: `{ meta: {...}, results: [ {...project} ] }`. The `results[]` paths below are written relative to a single project object.

### meta
- `meta.search_id` ... opaque ID for re-using the search via the RePORTER UI (`reporter.nih.gov/search/<search_id>/projects`).
- `meta.total` ... total matching projects across all pages.
- `meta.offset` / `.limit` / `.sort_field` / `.sort_order` / `.sorted_by_relevance` ... echoed paging/sort params.
- `meta.properties.URL` ... canonical RePORTER UI URL for this search.

### results[] — identifiers
- `results[].appl_id` ... unique application ID for this project record (integer).
- `results[].subproject_id` ... sub-project ID for multi-project awards (P-series); null for non-sub-projects.
- `results[].project_num` ... full project / application number (e.g. `5F32DK132864-02`).
- `results[].core_project_num` ... core project number that groups all years/sub-projects (e.g. `F32DK132864`).
- `results[].project_serial_num` ... serial portion of the project number.
- `results[].project_detail_url` ... canonical URL to the RePORTER project detail page.

### results[].project_num_split — parsed components of project_num
- `results[].project_num_split.appl_type_code` ... application type digit (e.g. `5` = noncompeting continuation).
- `results[].project_num_split.activity_code` ... 3-char activity code (R01, F32, etc.).
- `results[].project_num_split.ic_code` ... 2-char IC code.
- `results[].project_num_split.serial_num` ... numeric serial within IC.
- `results[].project_num_split.support_year` ... current support year (2-char).
- `results[].project_num_split.full_support_year` ... full support year including suffix.
- `results[].project_num_split.suffix_code` ... amendment / supplement suffix (e.g. `A1`, `S1`).

### results[] — core attributes
- `results[].project_title` ... project title.
- `results[].abstract_text` ... project abstract (long text).
- `results[].phr_text` ... public health relevance statement.
- `results[].terms` ... pre-defined project terms wrapped in `<...>` delimiters (legacy thesaurus).
- `results[].pref_terms` ... preferred terms list (newer, semicolon-delimited).
- `results[].activity_code` ... duplicate of `project_num_split.activity_code` at top level.
- `results[].award_type` ... application type at top level (mirrors `appl_type_code`).
- `results[].funding_mechanism` ... funding mechanism name (e.g. `Training - Individual`).
- `results[].mechanism_code_dc` ... funding mechanism code (e.g. `TR`, `RP`).
- `results[].cfda_code` ... Catalog of Federal Domestic Assistance code.
- `results[].opportunity_number` ... funding opportunity announcement number (e.g. `PA-21-048`).
- `results[].agency_code` ... funding agency code (`NIH`, `AHRQ`, `CDC`, etc.).
- `results[].arra_funded` ... ARRA indicator (`Y` / `N` / null).

### results[] — dates & lifecycle
- `results[].fiscal_year` ... fiscal year of the funding record (integer).
- `results[].award_notice_date` ... date the Notice of Award was issued.
- `results[].budget_start` / `.budget_end` ... budget period start/end for this fiscal year.
- `results[].project_start_date` / `.project_end_date` ... overall project start/end across all years.
- `results[].date_added` ... date this record was added to RePORTER.
- `results[].is_active` ... boolean: project currently active.
- `results[].is_new` ... boolean: newly added since last data refresh.
- `results[].covid_response[]` ... array of COVID-19 response category strings (e.g. `Reg-CV`, `C3`, `C4`, `C5`, `C6`).

### results[] — funding amounts
- `results[].award_amount` ... total award amount for this fiscal year (integer dollars).
- `results[].direct_cost_amt` ... direct cost portion.
- `results[].indirect_cost_amt` ... indirect cost (F&A) portion.

### results[].agency_ic_admin — administering IC (one IC per project)
- `results[].agency_ic_admin.code` ... 2-char IC code.
- `results[].agency_ic_admin.abbreviation` ... IC abbreviation (e.g. `NIDDK`).
- `results[].agency_ic_admin.name` ... full IC name.
- `results[].agency_ic_admin.admin_org_id` ... internal admin org ID.
- `results[].agency_ic_admin.admin_funding_url` ... URL to IC funding page (often empty).

### results[].agency_ic_fundings[] — per-IC funding contributions (multi-IC awards)
- `results[].agency_ic_fundings[].fy` ... fiscal year of the IC contribution.
- `results[].agency_ic_fundings[].code` ... contributing IC 2-char code.
- `results[].agency_ic_fundings[].abbreviation` ... contributing IC abbreviation.
- `results[].agency_ic_fundings[].name` ... contributing IC full name.
- `results[].agency_ic_fundings[].total_cost` ... total cost contributed by this IC (float).
- `results[].agency_ic_fundings[].direct_cost_ic` ... direct cost contributed.
- `results[].agency_ic_fundings[].indirect_cost_ic` ... indirect cost contributed.

### results[].organization — funded organization
- `results[].organization.org_name` ... organization name.
- `results[].organization.org_city` ... city (current).
- `results[].organization.org_state` ... 2-letter state code.
- `results[].organization.org_state_name` ... full state name (often null).
- `results[].organization.org_country` ... country name.
- `results[].organization.city` / `.country` ... legacy duplicate fields (typically null in v2).
- `results[].organization.org_zipcode` ... ZIP / postal code.
- `results[].organization.org_fips` ... FIPS country code (e.g. `US`).
- `results[].organization.fips_country_code` ... legacy FIPS field (typically null).
- `results[].organization.dept_type` ... department type (e.g. `BIOCHEMISTRY`).
- `results[].organization.org_duns[]` ... array of historical DUNS numbers for the org.
- `results[].organization.primary_duns` ... primary DUNS.
- `results[].organization.org_ueis[]` ... array of UEIs (Unique Entity Identifiers, SAM.gov).
- `results[].organization.primary_uei` ... primary UEI.
- `results[].organization.org_ipf_code` ... NIH Institution Profile (IPF) number.
- `results[].organization.external_org_id` ... external org ID (integer; often equals IPF).

### results[].organization_type
- `results[].organization_type.name` ... institution type name (e.g. `Independent Hospitals`, `Schools of Medicine`).
- `results[].organization_type.code` ... institution type code.
- `results[].organization_type.is_other` ... boolean: true if `Other` bucket.

### results[] — geography
- `results[].cong_dist` ... congressional district (e.g. `MA-07`).
- `results[].geo_lat_lon.lat` / `.lon` ... organization coordinates.

### results[].principal_investigators[] — one or more PIs per project
- `results[].principal_investigators[].profile_id` ... NIH PI profile ID (integer).
- `results[].principal_investigators[].first_name` / `.middle_name` / `.last_name` / `.full_name` ... PI name parts and full name.
- `results[].principal_investigators[].title` ... PI title (e.g. `PROFESSOR`, `RESEARCH FELLOW`).
- `results[].principal_investigators[].is_contact_pi` ... boolean: contact PI flag for multi-PI awards.
- `results[].contact_pi_name` ... top-level convenience: contact PI name formatted `LAST, FIRST`.

### results[].program_officers[] — assigned NIH program officers
- `results[].program_officers[].first_name` / `.middle_name` / `.last_name` / `.full_name` ... PO name parts and full name.

### results[].full_study_section — study section / review group
- `results[].full_study_section.srg_code` ... Scientific Review Group code.
- `results[].full_study_section.srg_flex` ... SRG flex code.
- `results[].full_study_section.sra_designator_code` ... Scientific Review Administrator designator code.
- `results[].full_study_section.sra_flex_code` ... SRA flex code.
- `results[].full_study_section.group_code` ... study section group code.
- `results[].full_study_section.name` ... full study section name (e.g. `ZDK1-GRB-2(J1)L`).

### results[] — NIH spending categories / RCDC
- `results[].spending_categories[]` ... array of RCDC spending category numeric IDs (see Appendix I of data dictionary).
- `results[].spending_categories_desc` ... pipe-or-semicolon-delimited descriptions for the IDs above.

## publications search response — POST /v2/publications/search

Envelope: `{ meta: {...}, results: [ {...publication} ] }`. Meta has the same shape as projects (`search_id`, `total`, `offset`, `limit`, `sort_field`, `sort_order`, `sorted_by_relevance`, `properties`).

### results[]
- `results[].pmid` ... PubMed ID.
- `results[].applid` ... latest associated NIH application ID.
- `results[].coreproject` ... linked core project number.

## What our workflows currently use
- (none yet — nih-reporter-capture ticket in flight)
