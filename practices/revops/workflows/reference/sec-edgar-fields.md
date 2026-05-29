# SEC EDGAR API — Full Field Reference

Source: https://www.sec.gov/edgar/sec-api-documentation (data.sec.gov + EDGAR full-text search)
Total leaf fields: **128**

Field paths are dot-paths into the response JSON. All `data.sec.gov` and `efts.sec.gov` endpoints require a descriptive `User-Agent` header (e.g. `Name email@domain`); default UAs return HTTP 403.

## submissions endpoint
`GET https://data.sec.gov/submissions/CIK{10-digit-CIK}.json` — filer profile plus the most recent ~1000 filings inline, with overflow paginated into `filings.files[]`.

### identity
- `cik` ... 10-digit CIK as string, zero-padded
- `entityType` ... e.g. `operating`, `investment-trust`
- `sic` / `.sicDescription` ... 4-digit SIC code and its label
- `name` ... current legal entity name
- `tickers[]` ... array of active ticker symbols
- `exchanges[]` ... array of exchanges (e.g. `Nasdaq`, `NYSE`); index-aligned with `tickers[]`
- `ein` ... employer ID number (string)
- `lei` ... Legal Entity Identifier (may be null)
- `description` ... short text description (often empty)
- `category` ... filer category (e.g. `Large accelerated filer`)
- `fiscalYearEnd` ... 4-digit `MMDD`
- `stateOfIncorporation` / `.stateOfIncorporationDescription` ... US state code or country + label
- `phone` ... primary phone
- `flags` ... internal SEC flags string (usually empty)
- `ownerOrg` ... internal SEC owning office
- `insiderTransactionForOwnerExists` / `.insiderTransactionForIssuerExists` ... 0/1 flags for Form 3/4/5 presence

### web presence
- `website` ... primary corporate URL
- `investorWebsite` ... IR site URL (often empty)

### former names
- `formerNames[].name` / `.from` / `.to` ... prior legal names with effective date ranges (ISO timestamps)

### addresses
- `addresses.mailing.street1` / `.street2` / `.city` / `.stateOrCountry` / `.zipCode` / `.stateOrCountryDescription` / `.isForeignLocation` / `.foreignStateTerritory` / `.country` / `.countryCode` ... mailing address fields
- `addresses.business.street1` / `.street2` / `.city` / `.stateOrCountry` / `.zipCode` / `.stateOrCountryDescription` / `.isForeignLocation` / `.foreignStateTerritory` / `.country` / `.countryCode` ... business address fields

### filings.recent (column-oriented arrays, all index-aligned)
- `filings.recent.accessionNumber[]` ... `XXXXXXXXXX-XX-XXXXXX` filing accession
- `filings.recent.filingDate[]` ... ISO date filed with SEC
- `filings.recent.reportDate[]` ... period-of-report date (may be empty)
- `filings.recent.acceptanceDateTime[]` ... ISO datetime SEC accepted the submission
- `filings.recent.act[]` ... securities act number (e.g. `33`, `34`)
- `filings.recent.form[]` ... form type (e.g. `10-K`, `8-K`, `4`)
- `filings.recent.fileNumber[]` ... SEC file number assigned to the registrant
- `filings.recent.filmNumber[]` ... microfiche film number
- `filings.recent.items[]` ... 8-K item numbers (comma-delimited string, empty for non-8-K)
- `filings.recent.core_type[]` ... internal filing core type
- `filings.recent.size[]` ... submission size in bytes
- `filings.recent.isXBRL[]` ... 0/1 flag
- `filings.recent.isInlineXBRL[]` ... 0/1 flag
- `filings.recent.isXBRLNumeric[]` ... 0/1 flag (older docs label this `isXBRLInstance`)
- `filings.recent.primaryDocument[]` ... primary document filename (combine with accession to build URL)
- `filings.recent.primaryDocDescription[]` ... human label for primary doc

### filings.files (overflow pages for filers with long history)
- `filings.files[].name` ... JSON filename to fetch from `https://data.sec.gov/submissions/{name}`
- `filings.files[].filingCount` ... number of filings in that overflow page
- `filings.files[].filingFrom` / `.filingTo` ... ISO date range covered

## companyfacts endpoint
`GET https://data.sec.gov/api/xbrl/companyfacts/CIK{10-digit-CIK}.json` — all XBRL facts the filer has reported, grouped by taxonomy then concept.

### envelope
- `cik` ... integer CIK (not zero-padded here)
- `entityName` ... filer legal name
- `facts.dei.<concept>` ... DEI taxonomy concepts (typically 2-3 per filer: `EntityCommonStockSharesOutstanding`, `EntityPublicFloat`)
- `facts.us-gaap.<concept>` ... us-gaap taxonomy concepts (us-gaap concepts vary per company, ~150-300 common concepts per filer; full taxonomy is ~17k tags)

### per-concept structure (same for dei and us-gaap)
- `facts.<taxonomy>.<concept>.label` ... human-readable label
- `facts.<taxonomy>.<concept>.description` ... full XBRL definition
- `facts.<taxonomy>.<concept>.units.<unit>[]` ... array of fact observations; `<unit>` is e.g. `USD`, `shares`, `USD/shares`, `pure`

### per-observation fields (inside units array)
- `facts.<taxonomy>.<concept>.units.<unit>[].val` ... numeric value
- `facts.<taxonomy>.<concept>.units.<unit>[].end` ... period end ISO date
- `facts.<taxonomy>.<concept>.units.<unit>[].start` ... period start ISO date (duration concepts only)
- `facts.<taxonomy>.<concept>.units.<unit>[].accn` ... source filing accession number
- `facts.<taxonomy>.<concept>.units.<unit>[].fy` ... fiscal year (integer)
- `facts.<taxonomy>.<concept>.units.<unit>[].fp` ... fiscal period (`FY`, `Q1`, `Q2`, `Q3`, `Q4`)
- `facts.<taxonomy>.<concept>.units.<unit>[].form` ... source form type (`10-K`, `10-Q`, `10-K/A`, etc.)
- `facts.<taxonomy>.<concept>.units.<unit>[].filed` ... ISO date the source filing was filed
- `facts.<taxonomy>.<concept>.units.<unit>[].frame` ... CY frame label (e.g. `CY2023Q4I` for instants, `CY2023Q4` for durations); present only when SEC assigned the fact to a comparable frame

## companyconcept endpoint
`GET https://data.sec.gov/api/xbrl/companyconcept/CIK{CIK}/{taxonomy}/{concept}.json` — single-concept history for one filer.

### top-level
- `cik` ... integer CIK
- `taxonomy` ... `us-gaap` or `dei`
- `tag` ... concept name (e.g. `AccountsPayableCurrent`)
- `label` ... human-readable label
- `description` ... full XBRL definition
- `entityName` ... filer legal name
- `units.<unit>[]` ... array of observations (same per-observation fields as companyfacts: `end`, `start`, `val`, `accn`, `fy`, `fp`, `form`, `filed`, `frame`)

## frames endpoint (not requested but related)
`GET https://data.sec.gov/api/xbrl/frames/{taxonomy}/{concept}/{unit}/CY{year}Q{n}{I?}.json` — cross-sectional snapshot. Returned envelope: `taxonomy`, `tag`, `ccp`, `uom`, `label`, `description`, `pts`, `data[].accn` / `.cik` / `.entityName` / `.loc` / `.end` / `.val`. Not enumerated above; included here for cross-reference.

## company_tickers endpoint
`GET https://www.sec.gov/files/company_tickers.json` — full mapping of public-company tickers to CIKs. Object keyed by row index (string).

### per row
- `{rowKey}.cik_str` ... integer CIK (unpadded)
- `{rowKey}.ticker` ... ticker symbol
- `{rowKey}.title` ... company name (uppercase)

Related: `company_tickers_exchange.json` (adds `exchange` per row) and `company_tickers_mf.json` (mutual-fund series/class mapping) — same access pattern.

## EDGAR full-text search
`GET https://efts.sec.gov/LATEST/search-index?q={query}&forms={form}&dateRange=custom&startdt=YYYY-MM-DD&enddt=YYYY-MM-DD&ciks={cik}&locationCode={state}` — Elasticsearch-backed full-text search across filings since 2001. Returns Elasticsearch response shape.

### envelope
- `took` ... query time in ms
- `timed_out` ... bool
- `_shards.total` / `.successful` / `.skipped` / `.failed` ... shard counters
- `query` ... echoed query DSL (rarely useful in workflows)

### hits envelope
- `hits.total.value` ... hit count (capped at 10000; use `relation: "gte"` to detect cap)
- `hits.total.relation` ... `eq` or `gte`
- `hits.max_score` ... top relevance score

### per hit
- `hits.hits[]._index` ... always `edgar_file`
- `hits.hits[]._id` ... `{accession}:{filename}` composite ID
- `hits.hits[]._score` ... relevance score

### per hit _source (the filing metadata)
- `hits.hits[]._source.ciks[]` ... array of CIKs associated with the file (co-filers possible)
- `hits.hits[]._source.display_names[]` ... formatted display strings (`Name (TICKER) (CIK 0000XXXXXXX)`); index-aligned with `ciks[]`
- `hits.hits[]._source.adsh` ... accession number with dashes
- `hits.hits[]._source.form` ... exact form type (e.g. `10-K/A`)
- `hits.hits[]._source.root_forms[]` ... array of root form types (e.g. `["10-K"]`)
- `hits.hits[]._source.file_type` ... file-level type (e.g. `10-K`, `EX-99`)
- `hits.hits[]._source.file_description` ... filer-supplied description of the document
- `hits.hits[]._source.file_date` ... ISO filing date
- `hits.hits[]._source.period_ending` ... ISO period-of-report
- `hits.hits[]._source.file_num[]` ... SEC file numbers
- `hits.hits[]._source.film_num[]` ... microfiche numbers
- `hits.hits[]._source.sequence` ... document sequence within the submission
- `hits.hits[]._source.xsl` ... XSL stylesheet reference (often null)
- `hits.hits[]._source.items[]` ... 8-K item codes
- `hits.hits[]._source.biz_states[]` ... business-address state codes
- `hits.hits[]._source.biz_locations[]` ... `City, ST` strings
- `hits.hits[]._source.inc_states[]` ... state-of-incorporation codes
- `hits.hits[]._source.sics[]` ... SIC codes for the filer(s)

### aggregations (facet buckets returned alongside hits)
- `aggregations.entity_filter.buckets[].key` / `.doc_count` ... top filer display strings + counts
- `aggregations.sic_filter.buckets[].key` / `.doc_count` ... top SIC codes + counts
- `aggregations.biz_states_filter.buckets[].key` / `.doc_count` ... top business states + counts
- `aggregations.form_filter.buckets[].key` / `.doc_count` ... top form types + counts
- `aggregations.<filter>.doc_count_error_upper_bound` / `.sum_other_doc_count` ... per-aggregation precision counters

## What our workflows currently use
- (none yet — sec-edgar-capture ticket in flight)
