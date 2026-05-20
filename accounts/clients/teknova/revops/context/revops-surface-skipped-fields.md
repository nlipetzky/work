# RevOps Surface — Skipped Supabase Fields

Fields intentionally excluded from Airtable RevOps_surface. All are in Supabase but not needed for enrichment review.

## Companies — Skipped

| Column | Reason |
|---|---|
| `engine_account_id`, `account_id` | Internal system IDs, not for review |
| `airtable_id` | Internal sync key |
| `field_provenance` | jsonb — internal provenance tracking |
| `recipes_applied` | jsonb — which enrichment recipes ran |
| `secondary_modalities` | jsonb array — too complex for flat display |
| `exa_company_research` | Raw AI research text — too large |
| `company_research` | Raw AI research text — too large |
| `sf_sync_queued_at`, `sf_sync_action`, `sf_last_synced` | Internal sync metadata |
| `snapshot_url` | Internal |
| `classification_attempts`, `classification_notes` | Internal classifier metadata |
| `canonical_company_id` | Internal dedup pointer |
| `v2_modality_confidence`, `v2_classified_at`, `v2_classifier_version`, `v2_needs_manual_review` | Internal classifier metadata |
| `pipeline_pulse_score`, `pipeline_pulse_signals`, `pipeline_pulse_updated_at` | Internal scoring pipeline |
| `modality_source`, `modality_justification` | Internal sourcing provenance |
| `subsidiary_flag`, `subsidiary_parent` | Edge case, rarely populated |
| `clinical_stage_ordinal`, `clinical_stage_nct_id`, `clinical_stage_source`, `clinical_stage_verified_at` | Clinical stage detailed metadata |
| `employee_count_source`, `employee_count_verified_at` | Internal |
| `former_names` | jsonb |
| `domain_aliases` | jsonb |
| `nacis`, `naics_code` | Industry codes, not used in review |
| `decision` | jsonb internal scoring decision |
| `fit_score_signals` | ARRAY — complex |
| `fit_score_updated_at`, `brief_generated_at` | Timestamp metadata |
| `program_type` | Unclear / rarely populated |
| `company_stage_category` | Redundant with clinical_stage |
| `funded_last_12_months` | Covered by funding_event and funding_stage |
| `territory`, `territory_classification` | Internal segmentation |
| `known_unknown_status` | Internal |
| `delivery_vector` | Internal ARRAY |
| `size_bucket` | Redundant with employee_count |
| `ticker`, `public_identifier` | Rarely used |
| `specialties`, `specialities` | Duplicate / jsonb |
| `employees_on_linkedin` | Redundant with employee_count |
| `data_freshness_status` | Internal |
| `segments_text` | Internal segmentation |
| `provenance_flags_summary`, `field_source_log` | Internal audit fields |
| `email_domain` | Internal |
| `linkedin_domain_mismatch` | Internal check |
| `tam_note` | Internal |
| `total_funding_amount`, `last_funding_value`, `last_funding_date` | Skipped for now; add if needed |
| `confidence_score` | Unclear provenance |
| `playbook_fit_rationale` | Long text; use playbook_fit_level instead |
| `playbook_fit_playbook`, `playbook_fit_scored_at` | Skipped; fit_level + fit_score sufficient |
| `created_at`, `updated_at` | Use last_enriched_at instead |
| `sf_opp_count` | Use sf_has_open_opp / sf_has_closed_won instead |

## Contacts — Skipped

| Column | Reason |
|---|---|
| `engine_account_id`, `account_id` | Internal system IDs |
| `airtable_id` | Internal sync key |
| `field_provenance` | jsonb internal |
| `recipes_applied` | jsonb internal |
| `sourcing_run_id` | Internal |
| `canonical_contact_id` | Internal dedup |
| `title_normalized` | Internal |
| `source` | Internal sourcing tag |
| `name_resolution_flag` | Internal |
| `enrichment_failed_check` | Internal |
| `modality_rationale`, `modality_confidence`, `modality_assignment_source`, `modality_justification` | Internal classifier |
| `first_exported_at`, `export_count` | Internal export tracking |
| `left_company_date`, `bounce_removed_at` | Edge case timestamps |
| `sf_sync_queued_at` | Internal sync |
| `linkedin_skills`, `linkedin_publications`, `linkedin_languages` | ARRAY — complex |
| `fit_score_dimensions` | jsonb |
| `current_employer_match`, `email_domain_match` | Internal checks |
| `enrichment_run_count`, `last_recipe_id`, `last_recipe_name` | Internal |
| `linkedin_about`, `linkedin_full_text` | Large text, not for review |
| `linkedin_raw_profile`, `linkedin_experience`, `linkedin_education`, `linkedin_certifications`, `linkedin_courses`, `linkedin_volunteer`, `linkedin_projects`, `linkedin_received_recommendations`, `linkedin_patents`, `linkedin_honors_awards`, `linkedin_featured` | Raw LinkedIn scrape data — too large |
| `linkedin_connections`, `linkedin_follower_count`, `linkedin_scrapped_at`, `linkedin_registered_at`, `linkedin_top_skills`, `linkedin_open_to_work`, `linkedin_hiring`, `linkedin_verified`, `linkedin_premium`, `linkedin_influencer`, `linkedin_location`, `linkedin_photo_url`, `linkedin_profile_id`, `linkedin_public_identifier` | LinkedIn metadata — not for review |
| `exa_people_search` | Raw AI research text |
| `hard_bounce_count` | Covered by hard_bounced |
| `company_description`, `company_location`, `company_linkedin_url` | Covered at company level |
| `us_territory_classification` | Internal |
| `decision` | jsonb internal |
| `lead_score` | Redundant with fit_score/contact_score |
| `email_verified_at` | Timestamp; email_verified_status covers the status |
| `sf_lead_id` | Use sf_contact_id + sf_entity_type to distinguish |
| `signal_score_updated_at`, `fit_score_updated_at` | Timestamp metadata |
| `created_at`, `updated_at` | Use last_enriched_at |
| `previous_title` | Edge case |
| `tenure_months` | Use tenure_years |
| `role_segment` | Redundant with function_classification / seniority |
| `linkedin_skills_top_skills` | Duplicate of linkedin_top_skills |
