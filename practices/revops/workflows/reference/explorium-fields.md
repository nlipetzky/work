# Explorium API — Full Field Reference

Source: https://api.explorium.ai/v1/  (docs: https://developers.explorium.ai/)
Total leaf fields: **493**

Field paths are dot-paths into the response JSON.
Array nodes are marked `[]`. Slash continuations (`a / .b / .c`) expand to sibling leaves.
Every endpoint also returns a standard `response_context` envelope.

## businesses endpoint

### match_businesses (POST /businesses/match) — input echoes + ID
- `response_context.correlation_id` ... Unique request correlation ID
- `response_context.request_status` ... success | failure
- `response_context.time_took_in_seconds` ... Server-side latency
- `matched_businesses[].business_id` ... Explorium 32-char unique entity ID for the matched company
- `matched_businesses[].name` ... Echo of input company name
- `matched_businesses[].domain` ... Echo of input domain

### fetch_businesses (POST /businesses) — filtered company list
- `response_context.correlation_id` ... Request correlation ID
- `response_context.request_status` ... success | failure
- `response_context.time_took_in_seconds` ... Server-side latency
- `total_results` ... Total businesses matching the filter set
- `total_pages` ... Total pages available for the result set
- `page` ... Current page number
- `data[].business_id` ... Explorium 32-char unique entity ID
- `data[].name` ... Company name
- `data[].domain` ... Company primary domain
- `data[].country_name` ... HQ country
- `data[].region_name` ... HQ region/state
- `data[].city_name` ... HQ city
- `data[].linkedin` ... Company LinkedIn URL
- `data[].company_size` ... Employee count band
- `data[].company_revenue` ... Revenue band
- `data[].naics_description` ... NAICS classification description
- `data[].sic_code_description` ... SIC classification description

### fetch_businesses_statistics (POST /businesses/stats) — aggregations
- `response_context.correlation_id` ... Correlation ID
- `response_context.request_status` ... Status
- `response_context.time_took_in_seconds` ... Latency
- `data.total_results` ... Total businesses in the cohort
- `data.stats[].field` ... Aggregated field name (e.g. country_code, company_size)
- `data.stats[].values[].value` ... Bucket label
- `data.stats[].values[].count` ... Businesses in that bucket

### autocomplete_businesses (POST /businesses/autocomplete) — facet suggestions
- `response_context.correlation_id` ... Correlation ID
- `response_context.request_status` ... Status
- `response_context.time_took_in_seconds` ... Latency
- `data[].value` ... Suggested value (e.g. "biotechnology")
- `data[].count` ... Number of businesses with this value

### fetch_businesses_events (POST /businesses/events) — event feed
- `response_context.correlation_id` ... Correlation ID
- `response_context.request_status` ... Status
- `response_context.time_took_in_seconds` ... Latency
- `output_events[].event_id` ... Unique event ID
- `output_events[].event_name` ... Event type (e.g. new_funding_round, ipo_announcement)
- `output_events[].event_time` ... ISO timestamp of the event
- `output_events[].business_id` ... Explorium business ID the event belongs to
- `output_events[].data.event_name` ... Event type (redundant)
- `output_events[].data.investment_date / .investment_amount / .investment_target / .investment_type / .link` ... Shape for new_investment events; per-event-type payload varies (see "Event types" section)

## business enrichments (data[].data fields)

### firmographics (POST /businesses/firmographics)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.business_id` ... Explorium's 32 character unique entity ID associated with a company's specific site, branch, or HQ.
- `data[].data.linkedin_profile` ... Company's LinkedIn® profile page
- `data[].data.website` ... Company's main website URL
- `data[].data.name` ... Name of the company
- `data[].data.business_logo` ... Link to the company's logo.
- `data[].data.business_description` ... An overview or summary of the business' mission statement, offered services and general industry.
- `data[].data.sic_code` ... Company's Standard Industrial Classification four-digit code.
- `data[].data.sic_code_description` ... Description of the Company's Standard Industrial Classification four-digit code.
- `data[].data.linkedin_industry_category` ... Industry category classification the business was assigned by LinkedIn®.
- `data[].data.naics_description` ... Description of the 2017 NAICS industry code.
- `data[].data.naics` ... 2017 North American Industry Classification System code that classifies the particular organization or business.
- `data[].data.yearly_revenue_range` ... Assigned revenue range category, generated at all company sites. All company sites includes the company's headquarters and all company branches. Company revenue is measured per fiscal year. Search 'Firmographics: Year...
- `data[].data.number_of_employees_range` ... Value displayed is the range of the company's number of employees falls. The number of employees is the sum of employees from all company sites, including the headquarters and all of the company branches. Search 'Firm...
- `data[].data.country_name` ... The country where the company's headquarters are located.
- `data[].data.region_name` ... State or region where the company's headquarters are located. Region equivalent in the UK is county or shire.
- `data[].data.city_name` ... The city where the company's headquarters are located.
- `data[].data.street` ... The company's street name and number
- `data[].data.LocationsDistribution` ... JSON containing the country's alpha-2 code, and correlating number of locations the entity has per country.
- `data[].data.zip_code` ... Company's postal code or Zipcode
- `data[].data.ticker` ... A stock symbol associated with the company, that is compiled of an arrangement of characters representing publicly-traded securities on an exchange. The symbol is used to place trade orders.

### technographics (POST /businesses/technographics)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.full_tech_stack` ... Full list of technologies used by the company in all categories.
- `data[].data.full_nested_tech_stack` ... Full nested list of technologies used by the company.
- `data[].data.testing_and_qa` ... List of testing and QA technologies used by the company.
- `data[].data.sales` ... List of sales technologies used by the company.
- `data[].data.prog_langs_and_frameworks` ... List of programming, languages, and frameworks technologies used by the company.
- `data[].data.productivity_and_operations` ... List of productivity and operations technologies used by the company.
- `data[].data.product_and_design` ... List of product and design technologies used by the company.
- `data[].data.platform_and_storage` ... List of platform and storage technologies used by the company.
- `data[].data.operations_software` ... List of operations software technologies used by the company.
- `data[].data.operations_management` ... List of operations management technologies used by the company.
- `data[].data.marketing` ... List of marketing technologies used by the company.
- `data[].data.it_security` ... List of IT security technologies used by the company.
- `data[].data.it_management` ... List of IT management technologies used by the company.
- `data[].data.hr` ... List of HR technologies used by the company.
- `data[].data.health_tech` ... List of health tech technologies used by the company.
- `data[].data.finance_and_accounting` ... List of finance and accounting technologies used by the company.
- `data[].data.ecommerce` ... List of ecommerce technologies used by the company.
- `data[].data.devops_and_development` ... List of devops and development technologies used by the company.
- `data[].data.customer_management` ... List of customer management technologies used by the company.
- `data[].data.computer_networks` ... List of computer networks technologies used by the company.
- `data[].data.communications` ... List of communications technologies used by the company.
- `data[].data.collaboration` ... List of collaboration technologies used by the company.
- `data[].data.bi_and_analytics` ... List of business, intelligence, and analytics technologies used by the company.

### company_social_media (POST /businesses/company_social_media)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.post_text` ... Text content of the LinkedIn® post published by company profile.
- `data[].data.days_since_posted` ... Number of days since the post was published by the company.
- `data[].data.post_url` ... URL to the LinkedIn® post published by individual.
- `data[].data.number_of_comments` ... Number of comments on the company's post by time of collection.
- `data[].data.number_of_likes` ... Number of likes the company's post received by time of collection.
- `data[].data.created_at` ... Timestamp of when the company's post was published.

### company_ratings (POST /businesses/company_ratings_by_employees)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.company_country` ... The country where the company's headquarters are located.
- `data[].data.company_name` ... The name of the company.
- `data[].data.company_region` ... The state region where the company's headquarters are located.
- `data[].data.company_street` ... The street name and number where the company's headquarters are located.
- `data[].data.company_url` ... The URL of the website associated with the company.
- `data[].data.company_zip_code` ... The postal code where the company's headquarters are located.
- `data[].data.experience_negative` ... Percentage out of interviewees who published reviews that reported having a negative sentiment following a job interview.
- `data[].data.experience_neutral` ... Percentage out of interviewees who published reviews that reported having a neutral sentiment following a job interview.
- `data[].data.experience_positive` ... Percentage out of interviewees who published reviews that reported having a positive sentiment following a job interview.
- `data[].data.ratings_all_reviews_count` ... Overall number of company ratings published by current and former employees.
- `data[].data.ratings_business_outlook` ... The percentage out of current and former employees who published reviews that believe the company will succeed in the near future.
- `data[].data.ratings_ceo_approval` ... The percent of current and former employees that published reviews who approved of the company's CEO.
- `data[].data.ratings_ceo_approval_count` ... Number of CEO approval ratings collected.
- `data[].data.ratings_recommend_to_friend` ... The chance that a current or former employee will recommend a friend to work in said company.
- `data[].data.total_reviews_count` ... Total number of company reviews published by current and former employees.

### keyword_search (POST /businesses/keyword_search_on_websites)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.text_results` ... JSON-formatted list of search results, indicating the location of the queried keywords within the snippet. Each result includes a snippet of text containing the keywords, the corresponding URL, and a numeric ranking o...
- `data[].data.keywords_indicator` ... True if the URL contains the queried keywords.
- `data[].data.url` ... Website associated with Explorium's entity ID queried for the input keywords.

### financial_metrics (POST /businesses/financial_metrics)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.asset_turnover` ... The company's quarterly ratio between the total sales or revenue, and the average company assets. Numbers are displayed in the currency of the country where the company is legally registered.
- `data[].data.cagr` ... The company’s revenue compound annual growth rate. It is calculated by dividing the yearly fiscal revenue by the previous fiscal year revenue and subtracting by 1. Both figures appear on the company’s annual reports. ...
- `data[].data.cogs` ... Cost of goods sold (COGS) refers to the direct costs of producing the goods sold by a company. This amount includes the cost of the materials and labor directly used to create the good. Cost of goods sold is also refe...
- `data[].data.earnings_surprises` ... The company’s earning surprise occurs when a company reports figures that are drastically different from the stock market estimates, and is calculated per quarter. This feature will display both the estimated earning ...
- `data[].data.ebitda` ... The company’s reported earnings before interest, taxes, depreciation, and amortization. Calculations are based on the currency of the country where the company is legally registered.
- `data[].data.enterprise_value_over_ebdita` ... Enterprise multiple, also known as the EV-to-EBITDA multiple, is a ratio used to determine the value of a company. It is computed by dividing enterprise value by EBITDA. The enterprise multiple takes into account a co...
- `data[].data.leadership` ... Key executives are the people at the top of a company who make critical decisions that affect the company. We keep track of who they are, what their titles are, and how much money they make.
- `data[].data.peer_companies` ... A list of companies that are in the same industry or sector as the company.
- `data[].data.price_earnings_ratio` ... The price-to-earnings ratio (P/E ratio) is the ratio for valuing a company that measures its current share price relative to its earnings per share (EPS). The price-to-earnings ratio is also sometimes known as the pri...
- `data[].data.revenue_yearly` ... Company’s yearly revenue. This feature is calculated only per fiscal year, so it will not take into account the date that was specified in the input query. The calculations are based on the currency of the country whe...
- `data[].data.roa` ... The company’s quarterly Return On Assets. It is calculated by dividing the company’s net income by the company’s total assets. The net income is reported in the company’s cash flow statement, and the company’s total a...
- `data[].data.roc` ... Company’s quarterly Return On Capital is calculated in the following way: (net_income - dividends_paid) / (total_debt - total_equity). Both the dividends paid and net income figures were reported in the company’s cash...
- `data[].data.sg_and_a` ... Quarterly Selling General & Administrative expenses is based on the company’s quarterly income report. Numbers are displayed in the currency of the country where the company is legally registered.
- `data[].data.tsr_1y` ... Total shareholder return (TSR) is a measure of financial performance, indicating the total amount an investor reaps from an investment—specifically, equities or shares of stock. Total shareholder return factors in cap...
- `data[].data.tsr_3y` ... Total shareholder return (TSR) is a measure of financial performance, indicating the total amount an investor reaps from an investment—specifically, equities or shares of stock. Total shareholder return factors in cap...
- `data[].data.tsr_5y` ... Indication of the total amount an investor reaps from an investment—specifically, equities or shares of stock. Total shareholder return factors in capital gains and dividends when measuring the total return generated ...
- `data[].data.working_capital` ... Working capital, also known as net working capital (NWC), is the difference between a company’s current assets - such as cash, accounts receivable/customers’ unpaid bills, and inventories of raw materials and finished...
- `data[].data.`cash_and_cash_equivalents`` ... Cash and highly liquid near-cash assets, which may be negative if overdrawn or short-term liabilities exceed liquidity.

### funding_and_acquisitions (POST /businesses/funding_and_acquisitions)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.domain` ... Company's domain
- `data[].data.company_name` ... Company name
- `data[].data.investors` ... List of all company's investors from all funding rounds.
- `data[].data.number_of_advisors` ... Number of the company''s listed advisors. If the advisor''s data is unavailable, returned value is 'null'.
- `data[].data.num_of_news` ... Selected company's number of listed news appearances, articles, or events.
- `data[].data.current_advisors` ... List of advisors to the company. Includes the advisor name and job title. If the advisor's data is unavailable, returned value is 'null'.
- `data[].data.ipo_size_usd` ... Amount of money raised in the IPO. If the company didn't go public or the data is unavailable, returned value is 'null'.
- `data[].data.ipo_date` ... Date the selected company's IPO was announced, formatted YYYY-MM-DD. If the company didn't go public or the data is unavailable, returned value is 'null'.
- `data[].data.is_ipo` ... True if the company has gone public.
- `data[].data.number_of_investors_for_first_funding_round` ... Number of investors involved in the company's first funding round. If the company didn't have a funding round, or the data is unavailable, returned value is 'null'.
- `data[].data.first_funding_round_value_usd` ... Amount of money raised in first funding round, displayed in US dollars (e.g. how many US dollars were raised by the selected company in a funding round). If the company didn't have founding round, or the data is unava...
- `data[].data.first_funding_round_type` ... Type of capital raised during the selected company's first funding round. E.g seed, venture, angel, round A, and more. If the company didn't have a funding round, or the data is unavailable, returned value is 'null'.
- `data[].data.first_funding_round_date` ... Date the selected company's first funding round was announced, formatted YYYY-MM-DD. If the company didn't have a funding round, or the data is unavailable, returned value is 'null'.
- `data[].data.number_of_funding_rounds` ... Number of funding rounds listed for the company.
- `data[].data.acquired_by` ... Additional information regarding the company's acquisition by another party, including: name of other party, price of acquisition in US dollars, and date of acquisition formatted YYYY-MM-DD. If acquisitions were not m...
- `data[].data.latest_funding_increase_in_percents` ... Percent change in funding round size between the most recent funding round and the one that preceded it. Calculation: 100 * (( previous funding round size - last funding round size) / last funding round size)
- `data[].data.last_funding_round_date` ... Date the selected company''s last funding round was announced, formatted YYYY-MM-DD. If the company didn''t have a funding round, or the data is unavailable, returned value is 'null'.
- `data[].data.last_funding_round_value_usd` ... Amount of money raised in the selected company's most recent funding round, displayed in US dollars. If the company didn't have a funding round, or the data is unavailable, returned value is 'null'.
- `data[].data.last_funding_round_type` ... Type of capital raised during the selected company's most recent funding round. E.g seed, venture, angel, round A, and more. If the company didn't have a funding round, or the data is unavailable, returned value is 'n...
- `data[].data.number_of_investors_for_last_funding_round` ... Number of investors involved in the company's last funding round. If the company didn't have a funding round, or the data is unavailable, returned value is 'null'.
- `data[].data.funding_rounds_info` ... List of all of the company's funding round events, including: announcement date formatted YYYY-MM-DD, names of lead investors, currency of the money raised, value of the money raised, and value of the money raised in ...
- `data[].data.known_funding_total_value` ... Total amount of money raised in all of the company's funding rounds. Calculated using all available data, displayed in US dollars.

### business_challenges (POST /businesses/business_challenges)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.technological_disruption` ... Text describing the company's technological disruption and innovation. Insights extracted from publicly published reports.
- `data[].data.link_to_html` ... URL linking to the main HTML document of the company's specific 10-K filing, containing financial statements, management analysis, and other key information submitted to the SEC.
- `data[].data.link_to_filing_details` ... URL linking to the index page of the company's specific 10-K filing, which lists the main filing document, exhibits, and supplemental files submitted to the SEC.
- `data[].data.form_type` ... Type of form that was filed by the company. In most cases the form type is 10-K.
- `data[].data.accession_number` ... Unique identifier for the file submitted by the company to the SEC, including the company’s CIK, the fiscal year of the filing, and the sequential number of the filing within that year.
- `data[].data.company_data_security_breach` ... Text describing the company's data security breaches. Insights extracted from publicly published reports.
- `data[].data.company_market_saturation` ... Text describing the company's market saturation. Insights extracted from publicly published reports.
- `data[].data.form_description` ... Summary of the filing, including the type of form submitted, the statutory authority requiring its submission, and details on whether specific disclosures are included or excluded. The filing is prepared and submitted...
- `data[].data.company_name` ... Name of the company.
- `data[].data.cik` ... Unique numeric identifier assigned by the SEC distinguishing a company in the EDGAR filing system. Typically consists of up to 10 digits and may include leading zeros. Used for retrieving financial filings and complia...
- `data[].data.filed_at` ... Date and time the filing was submitted, formatted YYYY-MM-DDTHH:MM:SS±HH:MM.
- `data[].data.company_data_security_privacy` ... Text describing the company's data security and privacy approach. Insights extracted from publicly published reports.
- `data[].data.company_competition` ... Text describing the company's competitive landscape. Insights extracted from publicly published reports.
- `data[].data.company_customer_adoption` ... Text describing the company's customer adoption. Insights extracted from publicly published reports.
- `data[].data.ticker` ... Stock symbol associated with the company, that is compiled of an arrangement of characters representing publicly-traded securities on an exchange. The symbol is used to place trade orders.

### business_intent_topics_bombora (POST /businesses/business_intent_topics)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.level_of_intent` ... Indicates how actively a company engaged with selected topics during the past week.<br /><br />**Calculation:** Number of topics with a composite score above 25% **divided by** the total number of input topics.<br /><...
- `data[].data.topic_count` ... Shows the number of topics with a composite score above 60, relative to all topics evaluated (e.g., 5/5). When no input topics are provided, all topics are returned.
- `data[].data.intent_topics` ... Contains an array of objects summarizing the company’s active interest in specific Bombora topics over a given week. Each object includes the topic name, category, composite score, and date.
- `data[].data.company_website` ... The company’s primary website or domain URL.
- `data[].data.company_name` ... The official or recognized name of the company.
- `data[].data.date_stamp` ... The date of the most recent Bombora data file (weekly), in format YYYYMMDD

### business_website_traffic (POST /businesses/business_website_traffic)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.accuracy` ... Data accuracy, with values of 1, 2, or 3. 3 is the most accurate.
- `data[].data.bounced_visits` ... The number of single-page sessions.
- `data[].data.bounce_rate` ... The percentage of single-page sessions.
- `data[].data.channel` ... The channel type, which can be direct, referral, search, social, mail, or display_ad.
- `data[].data.desktop_share` ... The proportion of total traffic that comes from desktops.
- `data[].data.device_type` ... The type of device used by the user, such as desktop or mobile.
- `data[].data.direct` ... Traffic from users typing in the URL or using bookmarks.
- `data[].data.display_ad` ... Traffic from banner or display advertising.
- `data[].data.mail` ... Traffic from email campaigns.
- `data[].data.mobile_bounce_rate` ... The bounce rate specific to users on mobile devices.
- `data[].data.mobile_hits` ... The number of pageviews from mobile devices.
- `data[].data.mobile_pages_per_visit` ... The number of pages viewed per session from mobile devices.
- `data[].data.mobile_share` ... The proportion of total traffic that comes from mobile devices.
- `data[].data.mobile_users` ... The number of unique users on mobile devices.
- `data[].data.mobile_visits` ... The total number of sessions from mobile devices.
- `data[].data.pages_per_visit` ... The number of pages viewed per session.
- `data[].data.paid` ... Traffic from all paid sources, including ads.
- `data[].data.referral` ... Referral traffic.
- `data[].data.rank` ... The ranking of the target based on traffic volume, where 1 is the highest traffic.
- `data[].data.search` ... Total search engine traffic (organic and paid).
- `data[].data.search_organic` ... Traffic from unpaid search results.
- `data[].data.search_paid` ... Traffic from paid search ads.
- `data[].data.social` ... Traffic from all social media sources.
- `data[].data.social_organic` ... Unpaid traffic from social platforms.
- `data[].data.social_paid` ... Paid traffic from social media advertising.
- `data[].data.target` ... The domain being analyzed, such as example.com.
- `data[].data.time_on_site` ... The average time spent on the site per session.
- `data[].data.unknown_channel` ... Traffic for which the source could not be determined.
- `data[].data.users` ... The total number of users.
- `data[].data.visits` ... The total number of sessions.
- `data[].data.month_period` ... Reference month for cumulative data (default: previous month)

### company_hierarchy (POST /businesses/company_hierarchy)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.input_company_id` ... The original business_id provided as input
- `data[].data.input_company_name` ... The name of the input company
- `data[].data.parent_company_id` ... Business ID of the immediate parent company
- `data[].data.parent_company` ... The name of the immediate parent company
- `data[].data.ultimate_parent_id` ... Business ID of the top-most company in the tree (level_0)
- `data[].data.ultimate_parent_name` ... The name of the top-most company in the tree (level_0)
- `data[].data.subsidiaries` ... List of direct subsidiaries
- `data[].data.org_tree_json` ... A JSON structure representing the full organizational tree from top to bottom

### competitive_landscape (POST /businesses/competitive_landscape)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.cik` ... Unique numeric identifier assigned by the SEC distinguishing a company in the EDGAR filing system. Typically consists of up to 10 digits and may include leading zeros. Used for retrieving financial filings and complia...
- `data[].data.link_to_filing_details` ... URL linking to the index page of the company's specific 10-K filing, which lists the main filing document, exhibits, and supplemental files submitted to the SEC.
- `data[].data.form_description` ... Summary of the filing, including the type of form submitted, the statutory authority requiring its submission, and details on whether specific disclosures are included or excluded. The filing is prepared and submitted...
- `data[].data.competitive_differentiation` ... Text describing the company's unique value and differentiators from competitors.
- `data[].data.filed_at` ... Date and time the filing was submitted, formatted YYYY-MM-DDTHH:MM:SS±HH:MM.
- `data[].data.company_name` ... Name of the company.
- `data[].data.link_to_html` ... URL linking to the main HTML document of the company's specific 10-K filing, containing financial statements, management analysis, and other key information submitted to the SEC.
- `data[].data.key_competitors` ... List of the company's competitors.
- `data[].data.accession_number` ... Unique identifier for the file submitted by the company to the SEC, including the company’s CIK, the fiscal year of the filing, and the sequential number of the filing within that year.
- `data[].data.form_type` ... Type of form that was filed by the company. In most cases the form type is 10-K.
- `data[].data.ticker` ... Stock symbol associated with the company, that is compiled of an arrangement of characters representing publicly-traded securities on an exchange. The symbol is used to place trade orders.

### lookalike_companies (POST /businesses/lookalike_companies)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.comparable_business_id` ... The Explorium ID of the requested company.
- `data[].data.lookalike_business_id` ... The Explorium ID of the lookalike company.
- `data[].data.lookalike_business_name` ... Name of the lookalike company.
- `data[].data.lookalike_website` ... Website URL of the lookalike.
- `data[].data.lookalike_description` ... Description of the lookalike company.
- `data[].data.lookalike_number_of_employees_range` ... Employee range for the lookalike.
- `data[].data.lookalike_revenue_range` ... Revenue range for the lookalike.
- `data[].data.lookalike_naics_description` ... NAICS (North American Industry Classification System) description for the lookalike.
- `data[].data.lookalike_country_location` ... The country of operation for the lookalike.
- `data[].data.similarity_score` ... Similarity score of the lookalike to the requested company. Medium (0.95–0.975), High (0.975+)

### strategic_insights (POST /businesses/strategic_insights)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.form_description` ... Summary of the filing, including the type of form submitted, the statutory authority requiring its submission, and details on whether specific disclosures are included or excluded. The filing is prepared and submitted...
- `data[].data.link_to_html` ... URL linking to the main HTML document of the company's specific 10-K filing, containing financial statements, management analysis, and other key information submitted to the SEC.
- `data[].data.accession_number` ... Unique identifier for the file submitted by the company to the SEC, including the company’s CIK, the fiscal year of the filing, and the sequential number of the filing within that year.
- `data[].data.form_type` ... Type of form that was filed by the company. In most cases the form type is 10-K.
- `data[].data.target_market` ... Text describing the company's target market strategy. Insights extracted from publicly published reports.
- `data[].data.company_value_proposition` ... Text describing the company's core product or service value proposition strategy. Insights extracted from publicly published reports.
- `data[].data.company_focus` ... Text describing the company's main focus areas and business strategy. Insights extracted from publicly published reports.
- `data[].data.cik` ... Unique numeric identifier assigned by the SEC distinguishing a company in the EDGAR filing system. Typically consists of up to 10 digits and may include leading zeros. Used for retrieving financial filings and complia...
- `data[].data.company_name` ... Name of the company.
- `data[].data.filed_at` ... Date and time the filing was submitted, formatted YYYY-MM-DDTHH:MM:SS±HH:MM.
- `data[].data.link_to_filing_details` ... URL linking to the index page of the company's specific 10-K filing, which lists the main filing document, exhibits, and supplemental files submitted to the SEC.
- `data[].data.company_partnerships` ... Text describing the company's partnership strategy. Insights extracted from publicly published reports.
- `data[].data.company_product_development` ... Text describing the company's product development focus and strategy. Insights extracted from publicly published reports.
- `data[].data.company_marketing_sales` ... Text describing the company's marketing and sales strategy. Insights extracted from publicly published reports.
- `data[].data.ticker` ... Stock symbol associated with the company, that is compiled of an arrangement of characters representing publicly-traded securities on an exchange. The symbol is used to place trade orders.

### webstack (POST /businesses/webstack)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.product_count` ... SKU Product Count is the number of unique products that an eCommerce website lists and sells.
- `data[].data.q_rank` ... Transco Page Traffic Rank between 1 and 1,000,000. The Tranco score combines the Alexa Internet Top 1 Million, Cisco Umbrella Popularity List, Majestic Million, Quantcast Top Sites creating an accurate representation ...
- `data[].data.umbrella` ... Umbrella Global Router Traffic Rank between 1 and 1,000,000. Umbrella is based on net sum DNS queries across the globe.
- `data[].data.number_of_pages_on_sitemap` ... Number of pages listed on the website's indexable sitemap. A sitemap is a file providing information about the pages, videos, other files, and the relationships between them.
- `data[].data.shopify_apps_in_use` ... List of Shopify apps detected on the website. Shopify apps are used to answer a variety of business needs.
- `data[].data.latest_update` ... Website's most recent date of index by the webstack collector, formatted YYYY-MM-DDTHH:mm:ss.SSSZ.
- `data[].data.live_techs` ... True if any live technologies that are currently active were detected on the website.
- `data[].data.db_indexed` ... True if the website is recorded in the databse. If false, the website may be suspect.
- `data[].data.affiliate_links` ... True if any affiliate program advertising systems were detected on the website.
- `data[].data.established` ... True if the website was established for at least 1 year prior to the webstack being indexed.
- `data[].data.technologies_sub_categories` ... Mapping of each technology detected on the website, to its assigned sub-category.
- `data[].data.parked` ... True if the site is using any parked domains, parked domain technology providers, or mentions parked domains. Parked domains are domain names that are not connected to a service provider or website.
- `data[].data.number_of_social_networks` ... Number of social network profiles listed on the website that are associated with the company.
- `data[].data.twitter_link` ... Link to the Twitter profile associated with the company. The link is listed on the company's registered domain.
- `data[].data.earliest_record` ... Website's earliest date of index by the webstack collector, formatted YYYY-MM-DDTHH:mm:ss.SSSZ.
- `data[].data.technologies_categories` ... List of the technology categories detected on the website.
- `data[].data.payment_technologies_in_use` ... List of the detected currencies, technologies, and digital wallets that can be used for online payment on the website.
- `data[].data.contact_phone_number` ... Phone number listed under the 'contact us' section of the company's website.
- `data[].data.premium_techs` ... Number of premium technologies detected on the website. Premium technologies are the technologies or tools in the webstack that cost money.
- `data[].data.number_of_premium_technologies` ... Number of technologies detected on the company's website. Technologies are tools used to build the website.
- `data[].data.money_spend_on_website_technologies` ... Estimated monthly financial investment in the technologies used on the company's website, displayed in USD. Calculation: sum of the average price point for each technology used on the website.
- `data[].data.ecommerce` ... True if an eCommerce technology was detected on the website. Inluding links to a shopping cart or other 'buy' options.
- `data[].data.spend` ... Estimation of average monthly USD spent across the entire domain on all aspects.
- `data[].data.technologies_used_by_company_website` ... List of the technologies detected on the website.
- `data[].data.payment_options` ... True if the website provides online payment options on the website, or mentions a payment provider by name.
- `data[].data.categories_to_technologies_tree` ... Mapping of each technology detected on the website to its assigned category.
- `data[].data.company_vertical` ... The name of the industry associated with the company and mentioned on the website.

### workforce_trends (POST /businesses/workforce_trends)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.change_in_real_estate_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in real estate related positions in the quarter prior to the selected quarter, compared to the selected quarter. Cal...
- `data[].data.perc_design_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a design related position. This calculation is relevant to the selected timeframe. Designer roles include product designers, web designe...
- `data[].data.profiles_found_per_quarter` ... Number of detected profiles containing information on the employee
- `data[].data.perc_sales_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a sales related position. This calculation is relevant to the selected quarter.
- `data[].data.perc_hr_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a human resources related position. This calculation refers to the selected quarter. Health related positions include sanitarians, nurse...
- `data[].data.perc_operations_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed an operations position. This calculation is relevant to the selected quarter.
- `data[].data.perc_pr_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a PR position. This calculation is relevant to the selected quarter.
- `data[].data.perc_health_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a health related position. This calculation refers to the selected quarter. Health related positions include sanitarians, nurses, and do...
- `data[].data.perc_trades_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a professional trades position. This calculation is relevant to the selected quarter. Professional trades roles include plumbers, constr...
- `data[].data.perc_engineering_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed an engineering related position. This calculation refers to the selected quarter. Engineering roles include data, devops, electrical, me...
- `data[].data.perc_finance_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a finance related position. This calculation refers to the selected quarter.
- `data[].data.perc_customer_service_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a customer service position. This calculation is relevant to the selected timeframe.
- `data[].data.perc_legal_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a legal related position. This calculation refers to the selected quarter.
- `data[].data.perc_media_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a marketing position. This calculation is relevant to the selected quarter.
- `data[].data.perc_marketing_roles` ... Percentage out of employee profiles that disclose the employee’s role who listed a marketing position. This calculation is relevant to the selected quarter.
- `data[].data.perc_education_roles` ... The percentage out of employee profiles that disclose the employee’s role who listed an education related position. Education roles include teachers, researchers, professors, and education administrators. This calcula...
- `data[].data.change_in_design_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in design roles in the quarter prior to the selected quarter compared to the selected quarter. Calculation: (% Selec...
- `data[].data.change_in_education_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in education related roles in the quarter prior to the selected quarter, compared to the selected quarter. Calculati...
- `data[].data.change_in_pr_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in public relations related positions in the quarter prior to the selected quarter, compared to the selected quarter...
- `data[].data.change_in_trades_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in trades related positions in the quarter prior to the selected quarter, compared to the selected quarter. Calculat...
- `data[].data.change_in_customer_service_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in customer service roles in the quarter prior to the selected quarter, compared to the selected quarter. Calculatio...
- `data[].data.change_in_health_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in health roles in the quarter prior to the selected quarter, compared to the selected quarter. Calculation: (% Sele...
- `data[].data.change_in_operations_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in operations related positions in the quarter prior to the selected quarter, compared to the selected quarter. Calc...
- `data[].data.change_in_sales_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in sales related positions in the quarter prior to the selected quarter, compared to the selected quarter. Calculati...
- `data[].data.change_in_legal_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in legal realted roles in the quarter prior to the selected quarter, compared to the selected quarter. Calculation: ...
- `data[].data.change_in_roles_divisor` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employee profiles that contain information about the employee’s role or position at the company in the quarter prior to the selected q...
- `data[].data.change_in_finance_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in finance roles in the quarter prior to the selected quarter, compared to the selected quarter. Calculation: (% Sel...
- `data[].data.change_in_media_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in media related roles in the quarter prior to the selected quarter, compared to the selected quarter. Calculation: ...
- `data[].data.change_in_hr_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in human resources roles in the quarter prior to the selected quarter, compared to the selected quarter. Calculation...
- `data[].data.change_in_marketing_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in marketing related roles in the quarter prior to the selected quarter, compared to the selected quarter. Calculati...
- `data[].data.change_in_engineering_roles` ... QoQ stands for quarter over quarter and is the rate of change in the percentage of employees working in engineering related positions in the quarter prior to the selected quarter, compared to the selected quarter. Cal...
- `data[].data.quarters` ... Cutoff date of the data's quarterly period, e.g. 01/01/2001.

### company_website_content_changes (POST /businesses/website_changes)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].entity_id` ... Explorium business_id this row enriches
- `data[].data.url` ... URL from which the changes were derived
- `data[].data.change_description` ... Text describing the content modification on the website as compared to the previous version.
- `data[].data.change_implication` ... Text indicating the strategic significance of the content change on the website
- `data[].data.date` ... Date the content change on the website occurred.

## prospects endpoint

### match_prospects (POST /prospects/match) — ID resolution
- `response_context.correlation_id` ... Correlation ID
- `response_context.request_status` ... Status
- `response_context.time_took_in_seconds` ... Latency
- `matched_prospects[].prospect_id` ... Explorium 40-char SHA-1-style prospect ID
- `matched_prospects[].full_name / .first_name / .last_name` ... Echo of matched identity
- `matched_prospects[].email` ... Echo of input email if used as fetcher
- `matched_prospects[].linkedin` ... Echo of LinkedIn URL if used as fetcher

### fetch_prospects (POST /prospects) — filtered prospect list
- `response_context.correlation_id` ... Correlation ID
- `response_context.request_status` ... Status
- `response_context.time_took_in_seconds` ... Latency
- `total_results` ... Total prospects matching filters
- `total_pages` ... Total pages
- `page` ... Current page
- `data[].prospect_id` ... Explorium prospect ID
- `data[].professional_email_hashed` ... SHA-256 of professional email (deliverability check without exposing PII)
- `data[].first_name` ... First name
- `data[].last_name` ... Last name
- `data[].full_name` ... Display name
- `data[].country_name` ... Country (lowercased)
- `data[].region_name` ... State/region (lowercased)
- `data[].city_name` ... City (lowercased)
- `data[].linkedin` ... Prospect LinkedIn URL
- `data[].job_title` ... Current job title (raw)
- `data[].job_department` ... Free-text department string
- `data[].job_department_main` ... Normalized department bucket
- `data[].job_level` ... Free-text seniority/level
- `data[].job_seniority_level` ... Normalized seniority bucket
- `data[].job_level_main` ... Top-level seniority bucket (e.g. "vp", "cxo")
- `data[].company_name` ... Current company display name
- `data[].company_id` ... Explorium business_id of current employer
- `data[].business_id` ... Same as company_id (alias)
- `data[].company_website` ... Employer website
- `data[].company_linkedin` ... Employer LinkedIn URL
- `data[].company_country_code` ... Employer HQ country code
- `data[].company_size` ... Employer size band
- `data[].company_revenue` ... Employer revenue band
- `data[].company_industry` ... Employer industry
- `data[].company_naics` ... Employer NAICS code

### prospects_stats (POST /prospects/stats) — aggregations
- `response_context.correlation_id` ... Correlation ID
- `response_context.request_status` ... Status
- `response_context.time_took_in_seconds` ... Latency
- `data.total_results` ... Total prospects in cohort
- `data.stats[].field` ... Aggregated field name (e.g. country_code, seniority_level)
- `data.stats[].values[].value` ... Bucket label
- `data.stats[].values[].count` ... Prospects in that bucket

### autocomplete_prospects (POST /prospects/autocomplete) — facet suggestions
- `response_context.correlation_id` ... Correlation ID
- `response_context.request_status` ... Status
- `response_context.time_took_in_seconds` ... Latency
- `data[].value` ... Suggested value (e.g. "vice president")
- `data[].count` ... Number of prospects with this value

### fetch_prospects_events (POST /prospects/events) — event feed
- `response_context.correlation_id` ... Correlation ID
- `response_context.request_status` ... Status
- `response_context.time_took_in_seconds` ... Latency
- `output_events[].event_id` ... Unique event ID
- `output_events[].event_name` ... Event type (prospect_changed_company, prospect_changed_role, prospect_workplace_anniversary)
- `output_events[].event_time` ... ISO timestamp
- `output_events[].prospect_id` ... Explorium prospect ID
- `output_events[].data.event_name` ... Redundant event name
- `output_events[].data.current_company_name / .current_company_id / .current_job_title` ... Post-change snapshot (changed_company / changed_role events)
- `output_events[].data.previous_company_name / .previous_company_id / .previous_job_title` ... Pre-change snapshot

## prospect enrichments (data[].data fields)

### contacts_information (POST /prospects/contacts_information)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].prospect_id` ... Explorium prospect_id this row enriches
- `data[].data.professional_email_status` ... Recommended validity status for the listed 'Professional email' address. Returns one of the following possible values: 'valid' emails are determined as safe to email, 'invalid' emails are addresses we recommend to era...
- `data[].data.emails` ... List of all email addresses associated with the individual labeled as a professional or personal email address.
- `data[].data.professions_email` ... Current professional email address associated with the individual
- `data[].data.mobile_phone` ... Individual's direct dial mobile phone number.
- `data[].data.phone_numbers` ... List of all phone numbers associated with the individual.

### individual_social_media (POST /prospects/individual_social_media)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].prospect_id` ... Explorium prospect_id this row enriches
- `data[].data.created_at` ... Timestamp of when the individual's post was published.
- `data[].data.number_of_likes` ... Number of likes the individual's post received by time of collection.
- `data[].data.post_url` ... URL to the LinkedIn® post published by individual.
- `data[].data.number_of_comments` ... Number of comments on the individual's post by time of collection.
- `data[].data.days_since_posted` ... Number of days since the post was published by the individual.
- `data[].data.post_text` ... Text content of the LinkedIn® post published by individual.

### professional_profile (POST /prospects/profiles)
- `response_context.correlation_id / .request_status / .time_took_in_seconds` ... Standard response envelope
- `data[].prospect_id` ... Explorium prospect_id this row enriches
- `data[].data.gender` ... Gender reported by the individual on their profile. If gender is not reported on profile, returned value is 'null'.
- `data[].data.city` ... Individual's city of residence reported on profile.
- `data[].data.country_name` ... Individual's country of residence reported on profile.
- `data[].data.region_name` ... Individual's state or region of residence reported on profile.
- `data[].data.company_website` ... URL to the company website belonging to the individual's workplace.
- `data[].data.company_linkedin` ... URL to the company LinkedIn® page belonging to the individual's workplace.
- `data[].data.linkedin` ... URN of the individual's LinkedIn® profile.
- `data[].data.linkedin_url_array` ... A list of LinkedIn® profile URLs associated with the prospect. Each entry may include a standard public URL and/or a URN-based URL.
- `data[].data.age_group` ... Individual's estimated age group.
- `data[].data.experience` ... List of work experience background entries on the individual's profile. May include: company name, company website, job title, seniority level, role, start date, end date, and more. Includes current work experience ac...
- `data[].data.education` ... List of educational background entries on the individual's profile. May include: institutions name, institutions website, degree category, major, start date, end date, and more. Includes current educational activities...
- `data[].data.interests` ... List of all interests reported by the individual on their profile.
- `data[].data.skills` ... List of all skills reported by the individual on their profile.
- `data[].data.job_title` ... Individual's current job title listed on their professional profile.
- `data[].data.job_department` ... Individual's job department, derived from their current job title.
- `data[].data.job_department_array` ... All detected normalized job departments for the individual. Examples: retail, engineering, customer success, administration, education, security, healthcare, public service, partnerships, creative, strategy, real esta...
- `data[].data.job_department_main` ... Primary normalized job department selected from the detected departments (e.g., “engineering”). Examples of possible values: retail, engineering, customer success, administration, education, security, healthcare, publ...
- `data[].data.job_seniority_level` ... Individual's top seniority level, derived from their current job title.
- `data[].data.job_level_array` ... All detected normalized job levels for the individual. Examples: manager, president, senior manager, owner, advisor, freelancer, junior, director, c-suite, board member, senior non-managerial, non-managerial, partner,...
- `data[].data.job_level_main` ... Primary normalized job level selected from the detected levels (e.g., “senior non-managerial”). Examples of possible values: manager, president, senior manager, owner, advisor, freelancer, junior, director, c-suite, b...
- `data[].data.company_name` ... Name of the company the individual listed as their workplace.
- `data[].data.full_name` ... First and last names associated with the individual, appended with a space.

## What our workflows currently use

### Workflow `Z6RROKx5omdfvhtn` — Companies Enrichment (Explorium -> Airtable)
Endpoints called: `match_businesses` + `firmographics` (bulk enrich).
Fields explicitly read by Code nodes:
- `matched_businesses[0].business_id`
- `enriched_data[0].data.domain`
- `enriched_data[0].data.website`
- `enriched_data[0].data.naics`
- `enriched_data[0].data.naics_description`
- `enriched_data[0].data.country`  (Explorium HQ country)
In addition, every key under `matched_businesses[0]` and `enriched_data[0].data` is folded into `explorium_<key>` columns (Map Archive / Map Reroute / Map Archive No AAV nodes), so the full firmographics payload is persisted to Airtable regardless of which keys the gate code reads.

### Workflow `bYZ0sAzyUvU60wMZ` — RevOps Contact Sourcing + ICP Gate
Endpoints called: `fetch_prospects` + `prospects/profiles/bulk_enrich` + `prospects/contacts_information/bulk_enrich`.
Fields explicitly read by Normalize Prospects / Prepare Contacts Upsert:
- `data[].prospect_id`
- `data[].full_name` / `.first_name` / `.last_name`
- `data[].job_title`
- `data[].job_level_main`
- `data[].job_seniority_level`
- `data[].job_department_main`
- `data[].job_department`
- `data[].country_name`
- `data[].region_name`
- `data[].company_name`
- `data[].linkedin`
From `profiles/bulk_enrich` -> `data[].data` (aliased `prof`):
- `prof.full_name`
- `prof.linkedin`
- `prof.country_name`
- `prof.region_name`
- `prof.experience[0].start_date`
- `prof.experience[0].company.name`
From `contacts_information/bulk_enrich` -> `data[].data` (aliased `cont`):
- `cont.emails[].address`
- `cont.emails[].type`  (selects type==="professional")
- `cont.mobile_phone`
- `cont.phone_numbers[].phone_number`
Whole subtrees are also folded as `explorium_fetched_<key>`, `explorium_profile_<key>`, `explorium_contacts_<key>` on the upsert.
