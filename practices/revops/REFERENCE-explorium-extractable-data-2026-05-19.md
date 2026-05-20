# Explorium — data we can extract

**Source:** real payloads from the live system (Solid Biosciences Deep Enrichment Raw; Paul McCormac Raw Provider Payloads). **Date:** 2026-05-19.

## Capability surface (what Explorium endpoints we can call)

From the connected Explorium MCP, the available calls are:

- `match-business` — domain/name → `business_id` (the join key for everything else; FREE, no credits)
- `enrich-business` — given `business_id` → deep firmographic payload (the ~big blob below)
- `fetch-businesses` — filtered search across the Explorium business graph
- `fetch-businesses-events` — temporal signals on a business (funding rounds, hires, M&A, IPO, partnerships, etc.)
- `fetch-businesses-statistics` — aggregate stats over a business filter set
- `match-prospects` / `enrich-prospects` — same shape for people
- `fetch-prospects` / `fetch-prospects-events` / `fetch-prospects-statistics` — same for people
- `autocomplete` — typeahead helper
- `web-search` — Explorium-wrapped web search

## Business-level payload — actual fields (from Solid Biosciences `Deep Enrichment Raw`)

**Total fields in the payload:** 271


### Group: `accession_number`

- `accession_number` (str)  — e.g. `0000950170-25-034644`

### Group: `accuracy`

- `accuracy` (int)  — e.g. `1`

### Group: `acquired_by`

- `acquired_by` (NoneType)

### Group: `affiliate_links`

- `affiliate_links` (bool)  — e.g. `False`

### Group: `bi_and_analytics`

- `bi_and_analytics` (list[6])  — e.g. `Adobe Analytics, Campaign Monitor, Google Analytics…`

### Group: `bounce_rate`

- `bounce_rate` (float)  — e.g. `0.5642`

### Group: `bounced_visits`

- `bounced_visits` (NoneType)

### Group: `business_id`

- `business_id` (str)  — e.g. `b95e2ed664e5130d6c179ff15535f3bf`

### Group: `categories_to_technologies_tree`

- `categories_to_technologies_tree` (dict)
- `categories_to_technologies_tree.Web Master` (dict)
- `categories_to_technologies_tree.Web Master.Other` (list[1])  — e.g. `Google Webmaster`
- `categories_to_technologies_tree.ads` (dict)
- `categories_to_technologies_tree.ads.Other` (list[1])  — e.g. `Adobe Audience Manager`
- `categories_to_technologies_tree.analytics` (dict)
- `categories_to_technologies_tree.analytics.Other` (list[4])  — e.g. `Adobe Dynamic Tag Management, Adobe Marketing Cloud, Omniture SiteCatalyst…`
- `categories_to_technologies_tree.cdn` (dict)
- `categories_to_technologies_tree.cdn.Other` (list[2])  — e.g. `Cloudinary, Cloudflare`
- `categories_to_technologies_tree.cdns` (dict)
- `categories_to_technologies_tree.cdns.Other` (list[2])  — e.g. `Akamai EdgeWorkers, Cloudflare CDN`
- `categories_to_technologies_tree.cms` (dict)
- `categories_to_technologies_tree.cms.Other` (list[3])  — e.g. `Drupal, WordPress, Drupal 10`
- `categories_to_technologies_tree.docinfo` (dict)
- `categories_to_technologies_tree.docinfo.Other` (list[24])  — e.g. `Cascading Style Sheets, Canonical Content Tag, Priority Hints…`
- `categories_to_technologies_tree.feeds` (dict)
- `categories_to_technologies_tree.feeds.Other` (list[3])  — e.g. `Really Simple Discovery, Pingback Support, RSS`
- `categories_to_technologies_tree.framework` (dict)
- `categories_to_technologies_tree.framework.Other` (list[3])  — e.g. `GeneratePress, Adobe Enterprise Cloud, Organization Schema`
- `categories_to_technologies_tree.hosting` (dict)
- `categories_to_technologies_tree.hosting.Other` (list[2])  — e.g. `U.S. Server Location, WP Engine`
- `categories_to_technologies_tree.javascript` (dict)
- `categories_to_technologies_tree.javascript.Other` (list[7])  — e.g. `jQuery 3.7.1, Modernizr, jQuery UI…`
- `categories_to_technologies_tree.language` (dict)
- `categories_to_technologies_tree.language.Other` (list[1])  — e.g. `English HREF LANG`
- `categories_to_technologies_tree.link` (dict)
- `categories_to_technologies_tree.link.Other` (list[5])  — e.g. `Twitter, Careers, X…`
- `categories_to_technologies_tree.mobile` (dict)
- `categories_to_technologies_tree.mobile.Other` (list[3])  — e.g. `Mobile Optimized, Viewport Meta, Apple Mobile Web Clips Icon`
- `categories_to_technologies_tree.mx` (dict)
- `categories_to_technologies_tree.mx.Other` (list[8])  — e.g. `DMARC None, Microsoft Azure DNS, Exclaimer…`
- `categories_to_technologies_tree.ns` (dict)
- `categories_to_technologies_tree.ns.Other` (list[3])  — e.g. `Google DNS, Google Domains, Google Cloud DNS`
- `categories_to_technologies_tree.seo_headers` (dict)
- `categories_to_technologies_tree.seo_headers.Other` (list[2])  — e.g. `SEO_H2, SEO_H1`
- `categories_to_technologies_tree.seo_meta` (dict)
- `categories_to_technologies_tree.seo_meta.Other` (list[1])  — e.g. `SEO_META_DESCRIPTION`
- `categories_to_technologies_tree.seo_title` (dict)
- `categories_to_technologies_tree.seo_title.Other` (list[1])  — e.g. `SEO_TITLE`
- `categories_to_technologies_tree.ssl` (dict)
- `categories_to_technologies_tree.ssl.Other` (list[3])  — e.g. `HSTS, SSL by Default, LetsEncrypt`
- `categories_to_technologies_tree.widgets` (dict)
- `categories_to_technologies_tree.widgets.Other` (list[19])  — e.g. `Dropbox Business, Yoast SEO Premium, Smartsheet…`

### Group: `change_description`

- `change_description` (str)  — e.g. `{"new":"Partner With Us: At Solid, we are driven to advance …`

### Group: `change_implication`

- `change_implication` (str)  — e.g. `The addition of a dedicated 'Partner With Us' section signal…`

### Group: `change_in_customer_service_roles`

- `change_in_customer_service_roles` (NoneType)

### Group: `change_in_design_roles`

- `change_in_design_roles` (NoneType)

### Group: `change_in_education_roles`

- `change_in_education_roles` (NoneType)

### Group: `change_in_engineering_roles`

- `change_in_engineering_roles` (NoneType)

### Group: `change_in_finance_roles`

- `change_in_finance_roles` (NoneType)

### Group: `change_in_health_roles`

- `change_in_health_roles` (NoneType)

### Group: `change_in_hr_roles`

- `change_in_hr_roles` (NoneType)

### Group: `change_in_legal_roles`

- `change_in_legal_roles` (NoneType)

### Group: `change_in_marketing_roles`

- `change_in_marketing_roles` (NoneType)

### Group: `change_in_media_roles`

- `change_in_media_roles` (NoneType)

### Group: `change_in_operations_roles`

- `change_in_operations_roles` (NoneType)

### Group: `change_in_pr_roles`

- `change_in_pr_roles` (NoneType)

### Group: `change_in_real_estate_roles`

- `change_in_real_estate_roles` (NoneType)

### Group: `change_in_roles_divisor`

- `change_in_roles_divisor` (NoneType)

### Group: `change_in_sales_roles`

- `change_in_sales_roles` (NoneType)

### Group: `change_in_trades_roles`

- `change_in_trades_roles` (NoneType)

### Group: `channel`

- `channel` (NoneType)

### Group: `cik`

- `cik` (str)  — e.g. `1707502`

### Group: `collaboration`

- `collaboration` (list[11])  — e.g. `Citrix Workspace Cloud, Cvent, Drupal…`

### Group: `communications`

- `communications` (list[4])  — e.g. `Campaign Monitor, Mimecast Mailbox Continuity, Slack…`

### Group: `company_city`

- `company_city` (str)  — e.g. `cambridge`

### Group: `company_competition`

- `company_competition` (list[1])  — e.g. `Solid faces significant compet`

### Group: `company_country_code`

- `company_country_code` (str)  — e.g. `us`

### Group: `company_customer_adoption`

- `company_customer_adoption` (list[1])  — e.g. `Solid’s commercial success dep`

### Group: `company_data_security_breach`

- `company_data_security_breach` (list[1])  — e.g. `Solid is subject to stringent `

### Group: `company_data_security_privacy`

- `company_data_security_privacy` (list[1])  — e.g. `Solid must comply with evolvin`

### Group: `company_focus`

- `company_focus` (list[3])  — e.g. `Advance gene therapy candidate, Build an innovation platform f, Patient-centric approach, prio`

### Group: `company_market_saturation`

- `company_market_saturation` (list[1])  — e.g. `Solid Biosciences operates in `

### Group: `company_marketing_sales`

- `company_marketing_sales` (list[3])  — e.g. `No commercial products yet; fo, Building relationships with pa, Preparing for future commercia`

### Group: `company_name`

- `company_name` (str)  — e.g. `solid biosciences`

### Group: `company_partnerships`

- `company_partnerships` (list[4])  — e.g. `Collaborations with contract r, Strategic licensing agreements, Engagement with regulatory age…`

### Group: `company_product_development`

- `company_product_development` (list[5])  — e.g. `SGT-003 (Duchenne): Advanced t, SGT-212 (FA): IND cleared by F, SGT-501 (CPVT): Completed IND-…`

### Group: `company_region`

- `company_region` (str)  — e.g. `us-ma`

### Group: `company_score`

- `company_score` (NoneType)

### Group: `company_street`

- `company_street` (str)  — e.g. `141 portland street`

### Group: `company_url`

- `company_url` (str)  — e.g. `https://www.solidbio.com`

### Group: `company_value_proposition`

- `company_value_proposition` (list[3])  — e.g. `Develop transformative, one-ti, Leverage proprietary capsid an, Accelerate development timelin`

### Group: `company_vertical`

- `company_vertical` (str)  — e.g. `Science`

### Group: `company_website`

- `company_website` (str)  — e.g. `solidbio.com`

### Group: `company_zip_code`

- `company_zip_code` (str)  — e.g. `us-02139`

### Group: `competitive_differentiation`

- `competitive_differentiation` (list[8])  — e.g. `Proprietary gene therapy candi, Novel AAV capsid libraries (e., Proprietary microdystrophin co…`

### Group: `computer_networks`

- `computer_networks` (list[1])  — e.g. `Google Cloud DNS`

### Group: `created_at`

- `created_at` (str)  — e.g. `2026-02-18T00:00:00`

### Group: `current_advisors`

- `current_advisors` (list[8])

### Group: `current_advisors[0]`

- `current_advisors[0].advisor job type` (str)  — e.g. `board_member`
- `current_advisors[0].advisor name` (str)  — e.g. `Martin Freed`

### Group: `customer_management`

- `customer_management` (list[6])  — e.g. `Adobe Marketing Cloud, Campaign Monitor, Freshdesk…`

### Group: `date`

- `date` (str)  — e.g. `2025-05-28T18:41:32.892778`

### Group: `date_stamp`

- `date_stamp` (str)  — e.g. `20260510`

### Group: `days_since_posted`

- `days_since_posted` (int)  — e.g. `85`

### Group: `db_indexed`

- `db_indexed` (bool)  — e.g. `True`

### Group: `desktop_share`

- `desktop_share` (int)  — e.g. `1`

### Group: `device_type`

- `device_type` (str)  — e.g. `all`

### Group: `devops_and_development`

- `devops_and_development` (list[12])  — e.g. `Adobe, Adobe Business Catalyst, Akamai…`

### Group: `direct`

- `direct` (int)  — e.g. `3013`

### Group: `display_ad`

- `display_ad` (int)  — e.g. `0`

### Group: `display_name`

- `display_name` (NoneType)

### Group: `domain`

- `domain` (str)  — e.g. `solidbio.com`

### Group: `earliest_record`

- `earliest_record` (str)  — e.g. `2014-12-17T23:00:00`

### Group: `ecommerce`

- `ecommerce` (bool)  — e.g. `False`

### Group: `established`

- `established` (bool)  — e.g. `True`

### Group: `experience_negative`

- `experience_negative` (NoneType)

### Group: `experience_neutral`

- `experience_neutral` (NoneType)

### Group: `experience_positive`

- `experience_positive` (NoneType)

### Group: `filed_at`

- `filed_at` (str)  — e.g. `2025-03-06T00:00:00`

### Group: `finance_and_accounting`

- `finance_and_accounting` (list[10])  — e.g. `ADP HR, ADP Streamline, ADP Workforce Now…`

### Group: `first_funding_round_date`

- `first_funding_round_date` (str)  — e.g. `2014-01-31T00:00:00`

### Group: `first_funding_round_type`

- `first_funding_round_type` (NoneType)

### Group: `first_funding_round_value_usd`

- `first_funding_round_value_usd` (NoneType)

### Group: `form_description`

- `form_description` (str)  — e.g. `10-K`

### Group: `form_type`

- `form_type` (str)  — e.g. `10-K`

### Group: `full_nested_tech_stack`

- `full_nested_tech_stack` (list[19])

### Group: `full_nested_tech_stack[0]`

- `full_nested_tech_stack[0].category` (str)  — e.g. `Customer Management`
- `full_nested_tech_stack[0].techs` (list[6])  — e.g. `Adobe Marketing Cloud, Campaign Monitor, Freshdesk…`

### Group: `full_tech_stack`

- `full_tech_stack` (list[89])  — e.g. `ADP HR, ADP Streamline, ADP Workforce Now…`

### Group: `funding_rounds_info`

- `funding_rounds_info` (list[10])

### Group: `funding_rounds_info[0]`

- `funding_rounds_info[0].Announcement date` (str)  — e.g. `2025-02-18`
- `funding_rounds_info[0].Money raised currency` (str)  — e.g. `USD`
- `funding_rounds_info[0].Money raised value` (int)  — e.g. `200000000`
- `funding_rounds_info[0].Money raised value ($)` (int)  — e.g. `200000000`

### Group: `health_tech`

- `health_tech` (NoneType)

### Group: `hr`

- `hr` (list[9])  — e.g. `ADP Workforce Now, Adp, Culture Amp…`

### Group: `intent_topics`

- `intent_topics` (str)  — e.g. `[{"topic":"technology: windows operating system","composite_…`

### Group: `investors`

- `investors` (list[9])  — e.g. `Bain Capital Life Sciences, Venrock Healthcare Capital Par, Vestal Point Capital…`

### Group: `ipo_date`

- `ipo_date` (str)  — e.g. `2018-01-26T00:00:00`

### Group: `ipo_size_usd`

- `ipo_size_usd` (str)  — e.g. `125000000.0`

### Group: `is_ipo`

- `is_ipo` (bool)  — e.g. `True`

### Group: `it_management`

- `it_management` (list[2])  — e.g. `NetSuite, New Relic`

### Group: `it_security`

- `it_security` (list[7])  — e.g. `Campaign Monitor, Cloudflare, Diligent…`

### Group: `key_competitors`

- `key_competitors` (list[11])  — e.g. `Sarepta Therapeutics (ELEVIDYS, Genethon, REGENXBIO Inc.…`

### Group: `keywords_indicator`

- `keywords_indicator` (str)  — e.g. `True`

### Group: `known_funding_total_value`

- `known_funding_total_value` (int)  — e.g. `810300000`

### Group: `last_funding_round_date`

- `last_funding_round_date` (str)  — e.g. `2025-02-18T00:00:00`

### Group: `last_funding_round_type`

- `last_funding_round_type` (str)  — e.g. `post-ipo equity`

### Group: `last_funding_round_value_usd`

- `last_funding_round_value_usd` (str)  — e.g. `200000000.0`

### Group: `latest_funding_increase_in_percents`

- `latest_funding_increase_in_percents` (str)  — e.g. `83.4862`

### Group: `latest_update`

- `latest_update` (NoneType)

### Group: `level_of_intent`

- `level_of_intent` (NoneType)

### Group: `link_to_filing_details`

- `link_to_filing_details` (str)  — e.g. `https://www.sec.gov/Archives/edgar/data/1707502/000095017025…`

### Group: `link_to_html`

- `link_to_html` (str)  — e.g. `https://www.sec.gov/Archives/edgar/data/1707502/0000950170-2…`

### Group: `live_techs`

- `live_techs` (bool)  — e.g. `False`

### Group: `lookalike_business_id`

- `lookalike_business_id` (str)  — e.g. `ac115c8a960d4cfc626caf0ee773c206`

### Group: `lookalike_business_name`

- `lookalike_business_name` (str)  — e.g. `gemma biotherapeutics`

### Group: `lookalike_country_location`

- `lookalike_country_location` (str)  — e.g. `us`

### Group: `lookalike_description`

- `lookalike_description` (str)  — e.g. `GEMMABio, a new therapeutics company, will serve as the rese…`

### Group: `lookalike_naics_description`

- `lookalike_naics_description` (str)  — e.g. `Research and Development in Biotechnology (except Nanobiotec…`

### Group: `lookalike_number_of_employees_range`

- `lookalike_number_of_employees_range` (str)  — e.g. `51-200`

### Group: `lookalike_revenue_range`

- `lookalike_revenue_range` (str)  — e.g. `25M-75M`

### Group: `lookalike_website`

- `lookalike_website` (str)  — e.g. `https://gemmabiotx.com`

### Group: `mail`

- `mail` (int)  — e.g. `0`

### Group: `marketing`

- `marketing` (list[16])  — e.g. `AddThis, Adobe Business Catalyst, Adobe Marketing Cloud…`

### Group: `mobile_bounce_rate`

- `mobile_bounce_rate` (int)  — e.g. `0`

### Group: `mobile_hits`

- `mobile_hits` (int)  — e.g. `0`

### Group: `mobile_pages_per_visit`

- `mobile_pages_per_visit` (int)  — e.g. `0`

### Group: `mobile_share`

- `mobile_share` (int)  — e.g. `0`

### Group: `mobile_users`

- `mobile_users` (int)  — e.g. `0`

### Group: `mobile_visits`

- `mobile_visits` (int)  — e.g. `0`

### Group: `money_spend_on_website_technologies`

- `money_spend_on_website_technologies` (int)  — e.g. `0`

### Group: `month_period`

- `month_period` (str)  — e.g. `2026-04`

### Group: `num_of_news`

- `num_of_news` (NoneType)

### Group: `number_of_advisors`

- `number_of_advisors` (int)  — e.g. `14`

### Group: `number_of_comments`

- `number_of_comments` (NoneType)

### Group: `number_of_funding_rounds`

- `number_of_funding_rounds` (int)  — e.g. `10`

### Group: `number_of_investors_for_first_funding_round`

- `number_of_investors_for_first_funding_round` (NoneType)

### Group: `number_of_investors_for_last_funding_round`

- `number_of_investors_for_last_funding_round` (int)  — e.g. `8`

### Group: `number_of_likes`

- `number_of_likes` (int)  — e.g. `50`

### Group: `number_of_pages_on_sitemap`

- `number_of_pages_on_sitemap` (int)  — e.g. `0`

### Group: `number_of_premium_technologies`

- `number_of_premium_technologies` (int)  — e.g. `111`

### Group: `number_of_social_networks`

- `number_of_social_networks` (int)  — e.g. `2`

### Group: `operations_management`

- `operations_management` (NoneType)

### Group: `operations_software`

- `operations_software` (NoneType)

### Group: `organization_tree`

- `organization_tree` (list[2])

### Group: `organization_tree[0]`

- `organization_tree[0].companies` (list[1])
- `organization_tree[0].companies[0].id` (str)  — e.g. `b95e2ed664e5130d6c179ff15535f3bf`
- `organization_tree[0].companies[0].name` (str)  — e.g. `solid biosciences`
- `organization_tree[0].companies[0].parent_id` (NoneType)
- `organization_tree[0].companies[0].parent_name` (NoneType)
- `organization_tree[0].level` (int)  — e.g. `0`

### Group: `pages_per_visit`

- `pages_per_visit` (int)  — e.g. `2`

### Group: `paid`

- `paid` (int)  — e.g. `0`

### Group: `parent_company_id`

- `parent_company_id` (NoneType)

### Group: `parent_company_name`

- `parent_company_name` (NoneType)

### Group: `parked`

- `parked` (bool)  — e.g. `False`

### Group: `payment_options`

- `payment_options` (bool)  — e.g. `False`

### Group: `payment_technologies_in_use`

- `payment_technologies_in_use` (NoneType)

### Group: `perc_customer_service_roles`

- `perc_customer_service_roles` (NoneType)

### Group: `perc_design_roles`

- `perc_design_roles` (NoneType)

### Group: `perc_education_roles`

- `perc_education_roles` (NoneType)

### Group: `perc_engineering_roles`

- `perc_engineering_roles` (NoneType)

### Group: `perc_finance_roles`

- `perc_finance_roles` (int)  — e.g. `6`

### Group: `perc_health_roles`

- `perc_health_roles` (int)  — e.g. `7`

### Group: `perc_hr_roles`

- `perc_hr_roles` (int)  — e.g. `2`

### Group: `perc_legal_roles`

- `perc_legal_roles` (int)  — e.g. `1`

### Group: `perc_marketing_roles`

- `perc_marketing_roles` (NoneType)

### Group: `perc_media_roles`

- `perc_media_roles` (NoneType)

### Group: `perc_operations_roles`

- `perc_operations_roles` (int)  — e.g. `10`

### Group: `perc_pr_roles`

- `perc_pr_roles` (NoneType)

### Group: `perc_real_estate_roles`

- `perc_real_estate_roles` (NoneType)

### Group: `perc_sales_roles`

- `perc_sales_roles` (int)  — e.g. `1`

### Group: `perc_trades_roles`

- `perc_trades_roles` (NoneType)

### Group: `platform_and_storage`

- `platform_and_storage` (list[7])  — e.g. `Amazon Web Services (AWS), Amazon s3, Azure Blob Storage…`

### Group: `post_text`

- `post_text` (str)  — e.g. `Solid Biosciences is proud to sponsor Jett Foundation in rec…`

### Group: `post_url`

- `post_url` (str)  — e.g. `https://www.linkedin.com/feed/update/urn:li:activity:7429928…`

### Group: `premium_techs`

- `premium_techs` (int)  — e.g. `0`

### Group: `product_and_design`

- `product_and_design` (list[1])  — e.g. `WordPress Themes`

### Group: `product_count`

- `product_count` (int)  — e.g. `0`

### Group: `productivity_and_operations`

- `productivity_and_operations` (list[1])  — e.g. `Microsoft Office`

### Group: `profiles_found_per_quarter`

- `profiles_found_per_quarter` (int)  — e.g. `138`

### Group: `prog_langs_and_frameworks`

- `prog_langs_and_frameworks` (list[15])  — e.g. `ASP.NET, ECMAScript, GraphPad Prism…`

### Group: `q_rank`

- `q_rank` (int)  — e.g. `-1`

### Group: `quarters`

- `quarters` (str)  — e.g. `2026-04-01T00:00:00`

### Group: `rank`

- `rank` (int)  — e.g. `2400510`

### Group: `ratings_all_reviews_count`

- `ratings_all_reviews_count` (int)  — e.g. `37`

### Group: `ratings_business_outlook`

- `ratings_business_outlook` (float)  — e.g. `0.6800000071525574`

### Group: `ratings_career_opportunities`

- `ratings_career_opportunities` (int)  — e.g. `4`

### Group: `ratings_ceo_approval`

- `ratings_ceo_approval` (NoneType)

### Group: `ratings_ceo_approval_count`

- `ratings_ceo_approval_count` (NoneType)

### Group: `ratings_compensation_benefits`

- `ratings_compensation_benefits` (float)  — e.g. `4.599999904632568`

### Group: `ratings_culture_values`

- `ratings_culture_values` (NoneType)

### Group: `ratings_diversity_inclusion`

- `ratings_diversity_inclusion` (float)  — e.g. `4.599999904632568`

### Group: `ratings_overall`

- `ratings_overall` (int)  — e.g. `4`

### Group: `ratings_recommend_to_friend`

- `ratings_recommend_to_friend` (float)  — e.g. `0.9200000166893005`

### Group: `ratings_senior_management`

- `ratings_senior_management` (float)  — e.g. `3.799999952316284`

### Group: `ratings_work_life_balance`

- `ratings_work_life_balance` (float)  — e.g. `4.5`

### Group: `referral`

- `referral` (int)  — e.g. `1451`

### Group: `sales`

- `sales` (list[1])  — e.g. `NetSuite`

### Group: `search`

- `search` (int)  — e.g. `1831`

### Group: `search_organic`

- `search_organic` (int)  — e.g. `1831`

### Group: `shopify_apps_in_use`

- `shopify_apps_in_use` (NoneType)

### Group: `similarity_score`

- `similarity_score` (str)  — e.g. `High`

### Group: `social_paid`

- `social_paid` (int)  — e.g. `0`

### Group: `spend`

- `spend` (int)  — e.g. `0`

### Group: `status`

- `status` (str)  — e.g. `ok`

### Group: `subsidiaries`

- `subsidiaries` (list[2])

### Group: `subsidiaries[0]`

- `subsidiaries[0].id` (str)  — e.g. `e2225b5b172c91fd7ae18d8e9cee66e1`
- `subsidiaries[0].name` (str)  — e.g. `aavantibio`

### Group: `target`

- `target` (str)  — e.g. `solidbio.com`

### Group: `target_market`

- `target_market` (list[3])  — e.g. `Patients with rare neuromuscul, Healthcare providers and speci, Regulatory agencies (FDA, EMA)`

### Group: `technological_disruption`

- `technological_disruption` (list[1])  — e.g. `Solid’s gene transfer candidat`

### Group: `technologies_categories`

- `technologies_categories` (str)  — e.g. `Web_Master, ads, analytics, cdn, cdns, cms, docinfo, feeds, …`

### Group: `technologies_sub_categories`

- `technologies_sub_categories` (NoneType)

### Group: `technologies_used_by_company_website`

- `technologies_used_by_company_website` (str)  — e.g. `1Password, Adobe_Audience_Manager, Adobe_Dynamic_Tag_Managem…`

### Group: `testing_and_qa`

- `testing_and_qa` (list[1])  — e.g. `Veeva Vault QMS`

### Group: `text_results`

- `text_results` (list[10])

### Group: `text_results[0]`

- `text_results[0].position` (str)  — e.g. `1`
- `text_results[0].snippet` (str)  — e.g. `We are focused on advancing genetic medicines for rare neuro…`
- `text_results[0].url` (str)  — e.g. `https://www.solidbio.com/`

### Group: `ticker`

- `ticker` (str)  — e.g. `xnas:sldb`

### Group: `time_on_site`

- `time_on_site` (int)  — e.g. `190`

### Group: `topic_count`

- `topic_count` (NoneType)

### Group: `total_reviews_count`

- `total_reviews_count` (int)  — e.g. `37`

### Group: `ultimate_parent_id`

- `ultimate_parent_id` (str)  — e.g. `b95e2ed664e5130d6c179ff15535f3bf`

### Group: `ultimate_parent_name`

- `ultimate_parent_name` (str)  — e.g. `solid biosciences`

### Group: `umbrella`

- `umbrella` (int)  — e.g. `0`

### Group: `unknown_channel`

- `unknown_channel` (int)  — e.g. `0`

### Group: `url`

- `url` (str)  — e.g. `https://www.solidbio.com`

### Group: `users`

- `users` (int)  — e.g. `4516`

### Group: `visits`

- `visits` (int)  — e.g. `6595`
---

## Prospect-level payload — actual fields (Paul McCormac, Explorium portion)

The contact enrichment combines **four providers** in one `Raw Provider Payloads` blob: `explorium`, `apollo`, `linkedin`, `hunter`. The Explorium portion contains three sub-sections, ~50 fields total per person:

### `explorium.fetched` (the structured-search hit)
prospect_id · professional_email_hashed · first_name · last_name · full_name · country_name · region_name · city · linkedin · experience (array of past titles) · skills (array) · interests · company_name · company_website · company_linkedin · job_department · job_department_array · job_department_main · job_seniority_level · job_level_array · job_level_main · job_title · business_id · linkedin_url_array

### `explorium.profile` (the deep enrichment)
full_name · first_name · last_name · country_name · region_name · city · linkedin · **experience** (array of objects: company, title, dates, role, summary) · skills · interests · age_group · **education** (array of objects: school, dates, majors) · gender · company_name · company_website · company_linkedin · job_department · job_department_array · job_department_main · job_seniority_level · job_level_array · job_level_main · job_title · linkedin_url_array

### `explorium.contacts` (contact information)
emails (array of {address, type=current_professional|personal}) · professions_email · professional_email_status · phone_numbers (array) · mobile_phone

### Other providers in the same record (not Explorium, but in the same blob the workflow stores)
- **apollo**: ~80 fields incl. employment_history, email_status, organization details (revenue, employees, technologies, industries, keywords, headcount growth), intent
- **linkedin** (Apify harvest): currentPosition (with start/end dates), full experience array, education, skills, connections, follower count, headline
- **hunter**: email finder result + verification status

---

## Important: what Explorium does NOT give us

The Companies-table fields that were repeatedly flagged as empty (`Clinical Stage`, `Pipeline Indication`, `Therapeutic Modality`, `Delivery Vehicle`, `Playbook Fit Level`, `Research Focus`, `Development Stage`, `V2 Company Type`, `AAV Segment`) are **not** in the Explorium business payload. Explorium is a generic firmographic + intent + technographic provider — it does not classify pharma assets by clinical stage, modality, or delivery vehicle. Those fields, if populated at all, must come from:
- **ClinicalTrials.gov / L1** (clinical phase, trial-derived indication)
- **A play-specific classifier / L2** (modality, delivery vehicle, AAV segment — derived from CT.gov interventions + rules)
- **A scoring workflow** (Playbook Fit Level — computed, not extracted)
- **Manual input** (Pipeline Indication, Research Focus — if used at all)

That is why no amount of Explorium enrichment will fill those columns. They are a separate source-of-truth class.
