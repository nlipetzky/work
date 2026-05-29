# PubMed (NCBI E-utilities) — Full Field Reference

Source: https://www.ncbi.nlm.nih.gov/books/NBK25501/ (E-utilities)
DTD: https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_240101.dtd
Element descriptions: https://wayback.archive-it.org/org-350/20240220194809/https://www.nlm.nih.gov/bsd/licensee/elements_descriptions.html
Total leaf fields: **243**

Field paths are dot-paths into the response JSON (esummary v2.0 returns JSON; esearch returns JSON or XML; efetch returns XML — XML element paths are written with dots, with `[]` marking repeating elements and `@attr` marking attributes).

## esearch (esearch.fcgi)

### eSearchResult (XML) / JSON `esearchresult` mirror
- `eSearchResult.Count` ... total number of UIDs matching the query
- `eSearchResult.RetMax` ... number of UIDs in this response chunk
- `eSearchResult.RetStart` ... offset of first UID in this response
- `eSearchResult.QueryKey` ... history-server query key (when `usehistory=y`)
- `eSearchResult.WebEnv` ... history-server web environment token
- `eSearchResult.IdList.Id[]` ... PMID for each match
- `eSearchResult.TranslationSet.Translation[].From` ... user term before translation
- `eSearchResult.TranslationSet.Translation[].To` ... translated term sent to Entrez
- `eSearchResult.TranslationStack.TermSet.Term` ... resolved search term
- `eSearchResult.TranslationStack.TermSet.Field` ... Entrez field tag (e.g. MeSH, TIAB)
- `eSearchResult.TranslationStack.TermSet.Count` ... hit count for that term
- `eSearchResult.TranslationStack.TermSet.Explode` ... `Y`/`N` MeSH explosion flag
- `eSearchResult.TranslationStack.OP` ... boolean operator (AND, OR, NOT, RANGE, GROUP)
- `eSearchResult.QueryTranslation` ... final query string sent to Entrez
- `eSearchResult.ErrorList.PhraseNotFound[]` ... unmatched phrases
- `eSearchResult.ErrorList.FieldNotFound[]` ... invalid field tags
- `eSearchResult.WarningList.PhraseIgnored[]` ... ignored phrases
- `eSearchResult.WarningList.QuotedPhraseNotFound[]` ... quoted phrases not found
- `eSearchResult.WarningList.OutputMessage[]` ... non-fatal output messages
- `eSearchResult.ERROR` ... fatal error string (top level)

## esummary (esummary.fcgi, `version=2.0`, `retmode=json`)

### Envelope
- `header.type` ... always `"esummary"`
- `header.version` ... payload version (e.g. `"0.3"`)
- `result.uids[]` ... ordered list of UIDs in response
- `result.<uid>` ... per-record object keyed by PMID (see below)
- `error` ... top-level error message (when request fails)

### Per-record (`result.<uid>`)
- `uid` ... PMID as string
- `pubdate` ... display publication date
- `epubdate` ... electronic publication date
- `source` ... journal abbreviation (NLM TA)
- `lastauthor` ... last-author display name
- `title` ... article title
- `sorttitle` ... lowercase normalized title used for sort
- `volume` ... journal volume
- `issue` ... journal issue
- `pages` ... pagination string
- `lang[]` ... ISO language codes
- `nlmuniqueid` ... NLM journal unique ID
- `issn` ... print ISSN
- `essn` ... electronic ISSN
- `pubtype[]` ... publication-type display strings
- `recordstatus` ... e.g. `"PubMed - indexed for MEDLINE"`
- `pubstatus` ... numeric publication-status code
- `pmcrefcount` ... count of PMC citing references
- `fulljournalname` ... full journal title
- `elocationid` ... electronic location ID (e.g. `doi: ...`)
- `doctype` ... `citation` / `chapter` / `book`
- `srcdate` ... source date (books)
- `reportnumber` ... report number (books / govt docs)
- `availablefromurl` ... external availability URL
- `locationlabel` ... book section label
- `docdate` ... document date (books)
- `bookname` ... book name
- `booktitle` ... book title
- `medium` ... medium descriptor
- `edition` ... edition
- `publisherlocation` ... publisher city
- `publishername` ... publisher name
- `chapter` ... chapter identifier
- `sortpubdate` ... ISO-ish sortable pubdate
- `sortfirstauthor` ... first-author display name for sort
- `vernaculartitle` ... title in original (non-English) script
- `authors[].name` ... author display name
- `authors[].authtype` ... `Author` / `Editor` / `CollectiveName`
- `authors[].clusterid` ... internal author-cluster ID
- `articleids[].idtype` ... id label (`pubmed`, `pmc`, `pmcid`, `doi`, `pii`, `mid`, ...)
- `articleids[].idtypen` ... numeric id-type code
- `articleids[].value` ... id value
- `history[].pubstatus` ... lifecycle status (`received`, `accepted`, `revised`, `epublish`, `ppublish`, `aheadofprint`, `pubmed`, `medline`, `entrez`, `pmc-release`, ...)
- `history[].date` ... `YYYY/MM/DD HH:MM` timestamp
- `references[].refsource` ... cited reference source string
- `references[].reftype` ... reference type
- `references[].pmid` ... cited PMID
- `references[].note` ... reference note
- `attributes[]` ... flags such as `"Has Abstract"`, `"PubMed Central"`
- `srccontriblist[]` ... source contributors (books)
- `doccontriblist[]` ... document contributors (books)

## efetch (efetch.fcgi, `db=pubmed`, `retmode=xml`)

Root: `PubmedArticleSet`. Repeats `PubmedArticle[]` (or `PubmedBookArticle[]`). Each article is `MedlineCitation` + optional `PubmedData`. Paths below are written from `PubmedArticleSet.PubmedArticle` for brevity (omit that prefix in your parser if you iterate the list).

### MedlineCitation (attributes + identity)
- `MedlineCitation.@Owner` ... record owner (`NLM`, `NASA`, `PIP`, `KIE`, `HSR`, `HMD`, `NOTNLM`)
- `MedlineCitation.@Status` ... `Completed` / `In-Process` / `PubMed-not-MEDLINE` / `In-Data-Review` / `Publisher` / `MEDLINE` / `OLDMEDLINE`
- `MedlineCitation.@VersionID` ... citation version
- `MedlineCitation.@VersionDate` ... version timestamp
- `MedlineCitation.@IndexingMethod` ... `Curated` / `Automated` etc.
- `MedlineCitation.PMID` ... PubMed ID
- `MedlineCitation.PMID.@Version` ... PMID version
- `MedlineCitation.DateCompleted.Year` / `.Month` / `.Day` ... MEDLINE completion date
- `MedlineCitation.DateRevised.Year` / `.Month` / `.Day` ... last revision date
- `MedlineCitation.NumberOfReferences` ... reference count (legacy)
- `MedlineCitation.CoiStatement` ... conflict-of-interest statement
- `MedlineCitation.CitationSubset[]` ... subset code (`IM`, `AIM`, `OM`, etc.)
- `MedlineCitation.SpaceFlightMission[]` ... mission identifier
- `MedlineCitation.GeneralNote[]` ... free-text note
- `MedlineCitation.GeneralNote[].@Owner` ... note owner

### MedlineCitation.Article (the article body)
- `Article.@PubModel` ... `Print` / `Print-Electronic` / `Electronic` / `Electronic-Print` / `Electronic-eCollection`
- `Article.ArticleTitle` ... article title (may contain MathML / formatting)
- `Article.VernacularTitle` ... non-English original title
- `Article.Abstract.AbstractText[]` ... abstract paragraph
- `Article.Abstract.AbstractText[].@Label` ... structured-abstract label
- `Article.Abstract.AbstractText[].@NlmCategory` ... `BACKGROUND` / `OBJECTIVE` / `METHODS` / `RESULTS` / `CONCLUSIONS` / `UNASSIGNED`
- `Article.Abstract.CopyrightInformation` ... copyright statement
- `Article.Language[]` ... ISO 639 language code
- `Article.Pagination.StartPage` ... starting page
- `Article.Pagination.EndPage` ... ending page
- `Article.Pagination.MedlinePgn` ... legacy pagination string
- `Article.ELocationID[]` ... DOI/PII as electronic locator
- `Article.ELocationID[].@EIdType` ... `doi` / `pii`
- `Article.ELocationID[].@ValidYN` ... validity flag
- `Article.ArticleDate[].Year` / `.Month` / `.Day` ... article date
- `Article.ArticleDate[].@DateType` ... fixed `Electronic`

### Article.Journal
- `Article.Journal.ISSN` ... ISSN value
- `Article.Journal.ISSN.@IssnType` ... `Electronic` / `Print`
- `Article.Journal.Title` ... full journal title
- `Article.Journal.ISOAbbreviation` ... ISO 4 abbreviation
- `Article.Journal.JournalIssue.@CitedMedium` ... `Internet` / `Print`
- `Article.Journal.JournalIssue.Volume` ... volume
- `Article.Journal.JournalIssue.Issue` ... issue
- `Article.Journal.JournalIssue.PubDate.Year` ... publication year
- `Article.Journal.JournalIssue.PubDate.Month` ... publication month
- `Article.Journal.JournalIssue.PubDate.Day` ... publication day
- `Article.Journal.JournalIssue.PubDate.Season` ... season (alt to Month/Day)
- `Article.Journal.JournalIssue.PubDate.MedlineDate` ... freeform date string

### Article.AuthorList
- `Article.AuthorList.@CompleteYN` ... `Y`/`N` completeness flag
- `Article.AuthorList.@Type` ... `authors` / `editors`
- `Article.AuthorList.Author[].@ValidYN` ... validity flag
- `Article.AuthorList.Author[].@EqualContrib` ... equal-contributor flag
- `Article.AuthorList.Author[].LastName` ... surname
- `Article.AuthorList.Author[].ForeName` ... given names
- `Article.AuthorList.Author[].Initials` ... initials
- `Article.AuthorList.Author[].Suffix` ... name suffix
- `Article.AuthorList.Author[].CollectiveName` ... group/consortium name (alt to personal name)
- `Article.AuthorList.Author[].CollectiveName.@Investigators` ... IDREF to InvestigatorList
- `Article.AuthorList.Author[].Identifier[]` ... external author ID value (e.g. ORCID)
- `Article.AuthorList.Author[].Identifier[].@Source` ... ID source (`ORCID`, `ISNI`, ...)
- `Article.AuthorList.Author[].AffiliationInfo[].Affiliation` ... affiliation string
- `Article.AuthorList.Author[].AffiliationInfo[].Identifier[]` ... affiliation ID value
- `Article.AuthorList.Author[].AffiliationInfo[].Identifier[].@Source` ... affiliation ID source

### Article.DataBankList (linked sequence/data accessions)
- `Article.DataBankList.@CompleteYN` ... completeness flag
- `Article.DataBankList.DataBank[].DataBankName` ... databank name (GenBank, ClinicalTrials.gov, ...)
- `Article.DataBankList.DataBank[].AccessionNumberList.AccessionNumber[]` ... accession ID

### Article.GrantList
- `Article.GrantList.@CompleteYN` ... completeness flag
- `Article.GrantList.Grant[].GrantID` ... grant identifier
- `Article.GrantList.Grant[].Acronym` ... funding institute acronym
- `Article.GrantList.Grant[].Agency` ... funding agency name
- `Article.GrantList.Grant[].Country` ... agency country

### Article.PublicationTypeList
- `Article.PublicationTypeList.PublicationType[]` ... publication-type label
- `Article.PublicationTypeList.PublicationType[].@UI` ... MeSH UI for type

### MedlineJournalInfo
- `MedlineJournalInfo.Country` ... journal country
- `MedlineJournalInfo.MedlineTA` ... NLM title abbreviation
- `MedlineJournalInfo.NlmUniqueID` ... NLM journal ID
- `MedlineJournalInfo.ISSNLinking` ... linking ISSN

### ChemicalList
- `ChemicalList.Chemical[].RegistryNumber` ... CAS / EC number (or `0`)
- `ChemicalList.Chemical[].NameOfSubstance` ... substance name
- `ChemicalList.Chemical[].NameOfSubstance.@UI` ... MeSH UI

### SupplMeshList (supplementary concepts)
- `SupplMeshList.SupplMeshName[]` ... supplementary concept name
- `SupplMeshList.SupplMeshName[].@Type` ... `Disease` / `Protocol` / `Organism` / `Anatomy` / `Population`
- `SupplMeshList.SupplMeshName[].@UI` ... MeSH UI

### MeshHeadingList
- `MeshHeadingList.MeshHeading[].DescriptorName` ... primary MeSH descriptor
- `MeshHeadingList.MeshHeading[].DescriptorName.@UI` ... descriptor UI
- `MeshHeadingList.MeshHeading[].DescriptorName.@MajorTopicYN` ... major-topic flag
- `MeshHeadingList.MeshHeading[].DescriptorName.@Type` ... `Geographic` (optional)
- `MeshHeadingList.MeshHeading[].QualifierName[]` ... subheading
- `MeshHeadingList.MeshHeading[].QualifierName[].@UI` ... qualifier UI
- `MeshHeadingList.MeshHeading[].QualifierName[].@MajorTopicYN` ... major-topic flag

### KeywordList (author / NLM keywords)
- `KeywordList[].@Owner` ... `NLM` / `NLM-AUTO` / `NASA` / `PIP` / `KIE` / `NOTNLM` / `HHS`
- `KeywordList[].Keyword[]` ... keyword text
- `KeywordList[].Keyword[].@MajorTopicYN` ... major-topic flag

### CommentsCorrectionsList (cross-citations)
- `CommentsCorrectionsList.CommentsCorrections[].@RefType` ... relationship type (`CommentOn`, `ErratumIn`, `RetractionIn`, `UpdateOf`, `Cites`, etc.)
- `CommentsCorrectionsList.CommentsCorrections[].RefSource` ... source citation string
- `CommentsCorrectionsList.CommentsCorrections[].PMID` ... linked PMID
- `CommentsCorrectionsList.CommentsCorrections[].PMID.@Version` ... PMID version
- `CommentsCorrectionsList.CommentsCorrections[].Note` ... note text

### GeneSymbolList
- `GeneSymbolList.GeneSymbol[]` ... gene symbol

### PersonalNameSubjectList (subject persons)
- `PersonalNameSubjectList.PersonalNameSubject[].LastName` ... surname
- `PersonalNameSubjectList.PersonalNameSubject[].ForeName` ... given names
- `PersonalNameSubjectList.PersonalNameSubject[].Initials` ... initials
- `PersonalNameSubjectList.PersonalNameSubject[].Suffix` ... suffix

### InvestigatorList (group-authored study investigators)
- `InvestigatorList[].@ID` ... XML ID for linking to CollectiveName
- `InvestigatorList[].Investigator[].@ValidYN` ... validity flag
- `InvestigatorList[].Investigator[].LastName` ... surname
- `InvestigatorList[].Investigator[].ForeName` ... given names
- `InvestigatorList[].Investigator[].Initials` ... initials
- `InvestigatorList[].Investigator[].Suffix` ... suffix
- `InvestigatorList[].Investigator[].Identifier[]` ... investigator ID value
- `InvestigatorList[].Investigator[].Identifier[].@Source` ... ID source
- `InvestigatorList[].Investigator[].AffiliationInfo[].Affiliation` ... affiliation text
- `InvestigatorList[].Investigator[].AffiliationInfo[].Identifier[]` ... affiliation ID
- `InvestigatorList[].Investigator[].AffiliationInfo[].Identifier[].@Source` ... affiliation ID source

### OtherID / OtherAbstract
- `OtherID[]` ... external identifier value
- `OtherID[].@Source` ... source (`NASA`, `KIE`, `PIP`, `POP`, `ARPL`, `CPC`, `IND`, `CPFH`, `CLML`, `NRCBL`, `NLM`, `QCIM`)
- `OtherAbstract[].@Type` ... `AAMC` / `AIDS` / `KIE` / `PIP` / `NASA` / `Publisher` / `plain-language-summary`
- `OtherAbstract[].@Language` ... language code (default `eng`)
- `OtherAbstract[].AbstractText[]` ... abstract paragraph
- `OtherAbstract[].AbstractText[].@Label` ... structured label
- `OtherAbstract[].AbstractText[].@NlmCategory` ... structured category
- `OtherAbstract[].CopyrightInformation` ... copyright text

### PubmedData (publication lifecycle + IDs + references)
- `PubmedData.PublicationStatus` ... `ppublish` / `epublish` / `aheadofprint` / `retracted` / etc.
- `PubmedData.History.PubMedPubDate[].@PubStatus` ... `received` / `accepted` / `revised` / `epublish` / `ppublish` / `aheadofprint` / `retracted` / `ecollection` / `pmc` / `pmcr` / `pubmed` / `pubmedr` / `premedline` / `medline` / `medliner` / `entrez` / `pmc-release`
- `PubmedData.History.PubMedPubDate[].Year` ... year
- `PubmedData.History.PubMedPubDate[].Month` ... month
- `PubmedData.History.PubMedPubDate[].Day` ... day
- `PubmedData.History.PubMedPubDate[].Hour` ... hour
- `PubmedData.History.PubMedPubDate[].Minute` ... minute
- `PubmedData.History.PubMedPubDate[].Second` ... second
- `PubmedData.ArticleIdList.ArticleId[]` ... article identifier value
- `PubmedData.ArticleIdList.ArticleId[].@IdType` ... `doi` / `pii` / `pmcpid` / `pmpid` / `pmc` / `mid` / `sici` / `pubmed` / `medline` / `pmcid` / `pmcbook` / `bookaccession`
- `PubmedData.ObjectList.Object[].@Type` ... object type (e.g. `clinicaltrial`, `grant`)
- `PubmedData.ObjectList.Object[].Param[]` ... parameter value
- `PubmedData.ObjectList.Object[].Param[].@Name` ... parameter name (e.g. `id`, `source`)
- `PubmedData.ReferenceList[].Title` ... section title for refs
- `PubmedData.ReferenceList[].Reference[].Citation` ... formatted citation text
- `PubmedData.ReferenceList[].Reference[].ArticleIdList.ArticleId[]` ... reference identifier value
- `PubmedData.ReferenceList[].Reference[].ArticleIdList.ArticleId[].@IdType` ... reference ID type
- `PubmedData.ReferenceList[].ReferenceList[]` ... nested reference list (sub-sections)

### PubmedBookArticle (book-mode efetch)
- `PubmedBookArticle.BookDocument.PMID` ... book PMID
- `PubmedBookArticle.BookDocument.PMID.@Version` ... PMID version
- `PubmedBookArticle.BookDocument.ArticleIdList.ArticleId[]` ... book article ID
- `PubmedBookArticle.BookDocument.ArticleIdList.ArticleId[].@IdType` ... ID type
- `PubmedBookArticle.BookDocument.Book.Publisher.PublisherName` ... publisher name
- `PubmedBookArticle.BookDocument.Book.Publisher.PublisherLocation` ... publisher location
- `PubmedBookArticle.BookDocument.Book.BookTitle` ... book title
- `PubmedBookArticle.BookDocument.Book.PubDate.Year` / `.Month` / `.Day` / `.Season` / `.MedlineDate` ... pub date parts
- `PubmedBookArticle.BookDocument.Book.BeginningDate.Year` / `.Month` / `.Day` / `.Season` ... start date
- `PubmedBookArticle.BookDocument.Book.EndingDate.Year` / `.Month` / `.Day` / `.Season` ... end date
- `PubmedBookArticle.BookDocument.Book.Volume` ... volume
- `PubmedBookArticle.BookDocument.Book.VolumeTitle` ... volume title
- `PubmedBookArticle.BookDocument.Book.Edition` ... edition
- `PubmedBookArticle.BookDocument.Book.CollectionTitle` ... collection title
- `PubmedBookArticle.BookDocument.Book.Isbn[]` ... ISBN
- `PubmedBookArticle.BookDocument.Book.ELocationID[]` ... e-location id
- `PubmedBookArticle.BookDocument.Book.Medium` ... medium descriptor
- `PubmedBookArticle.BookDocument.Book.ReportNumber` ... report number
- `PubmedBookArticle.BookDocument.LocationLabel[]` ... section label
- `PubmedBookArticle.BookDocument.LocationLabel[].@Type` ... `part` / `chapter` / `section` / `appendix` / `figure` / `table` / `box`
- `PubmedBookArticle.BookDocument.ArticleTitle` ... article/chapter title
- `PubmedBookArticle.BookDocument.VernacularTitle` ... vernacular title
- `PubmedBookArticle.BookDocument.Pagination.StartPage` / `.EndPage` / `.MedlinePgn` ... pagination
- `PubmedBookArticle.BookDocument.Language[]` ... language
- `PubmedBookArticle.BookDocument.PublicationType[]` ... publication type
- `PubmedBookArticle.BookDocument.PublicationType[].@UI` ... pub-type UI
- `PubmedBookArticle.BookDocument.Abstract.AbstractText[]` ... abstract paragraph
- `PubmedBookArticle.BookDocument.Sections.Section[].SectionTitle` ... section title
- `PubmedBookArticle.BookDocument.Sections.Section[].LocationLabel` ... section label
- `PubmedBookArticle.BookDocument.Sections.Section[].Section[]` ... nested sub-section (recursive)
- `PubmedBookArticle.BookDocument.ContributionDate.Year` / `.Month` / `.Day` / `.Season` ... contribution date
- `PubmedBookArticle.BookDocument.DateRevised.Year` / `.Month` / `.Day` ... revised date
- `PubmedBookArticle.BookDocument.ItemList[].@ListType` ... list type label
- `PubmedBookArticle.BookDocument.ItemList[].Item[]` ... item text
- `PubmedBookArticle.PubmedBookData.PublicationStatus` ... publication status
- `PubmedBookArticle.PubmedBookData.History.PubMedPubDate[]` (same shape as PubmedData.History)
- `PubmedBookArticle.PubmedBookData.ArticleIdList.ArticleId[]` ... book article IDs
- `PubmedBookArticle.PubmedBookData.ObjectList.Object[]` (same shape as PubmedData.ObjectList)

### Set-level wrappers
- `PubmedArticleSet.DeleteCitation.PMID[]` ... PMIDs withdrawn in this batch
- `BookDocumentSet.DeleteDocument.PMID[]` ... book PMIDs withdrawn

## elink (elink.fcgi)

### eLinkResult
- `eLinkResult.LinkSet[].DbFrom` ... source database
- `eLinkResult.LinkSet[].IdList.Id[]` ... source UIDs
- `eLinkResult.LinkSet[].LinkSetDb[].DbTo` ... target database
- `eLinkResult.LinkSet[].LinkSetDb[].LinkName` ... link relationship name (e.g. `pubmed_pubmed`, `pubmed_pmc`)
- `eLinkResult.LinkSet[].LinkSetDb[].Link[].Id` ... target UID
- `eLinkResult.LinkSet[].LinkSetDb[].Link[].Score` ... similarity score (for `_pubmed` neighbors)
- `eLinkResult.LinkSet[].LinkSetDbHistory[].DbTo` ... target db (history variant)
- `eLinkResult.LinkSet[].LinkSetDbHistory[].LinkName` ... link name
- `eLinkResult.LinkSet[].LinkSetDbHistory[].QueryKey` ... history query key
- `eLinkResult.LinkSet[].WebEnv` ... web environment (when `cmd=neighbor_history`)
- `eLinkResult.LinkSet[].IdUrlList.IdUrlSet[].Id` ... source UID
- `eLinkResult.LinkSet[].IdUrlList.IdUrlSet[].ObjUrl[].Url` ... external URL
- `eLinkResult.LinkSet[].IdUrlList.IdUrlSet[].ObjUrl[].IconUrl` ... provider icon
- `eLinkResult.LinkSet[].IdUrlList.IdUrlSet[].ObjUrl[].SubjectType[]` ... subject categories
- `eLinkResult.LinkSet[].IdUrlList.IdUrlSet[].ObjUrl[].Category[]` ... link categories
- `eLinkResult.LinkSet[].IdUrlList.IdUrlSet[].ObjUrl[].Attribute[]` ... link attributes (e.g. `free resource`)
- `eLinkResult.LinkSet[].IdUrlList.IdUrlSet[].ObjUrl[].Provider.Name` ... provider name
- `eLinkResult.LinkSet[].IdUrlList.IdUrlSet[].ObjUrl[].Provider.NameAbbr` ... provider abbreviation
- `eLinkResult.LinkSet[].IdUrlList.IdUrlSet[].ObjUrl[].Provider.Id` ... provider ID
- `eLinkResult.LinkSet[].IdUrlList.IdUrlSet[].ObjUrl[].Provider.Url` ... provider URL
- `eLinkResult.LinkSet[].IdCheckList.Id[]` ... id presence-check result (`cmd=ncheck`/`lcheck`)
- `eLinkResult.LinkSet[].IdCheckList.Id[].@HasNeighbor` ... `Y`/`N`
- `eLinkResult.LinkSet[].IdCheckList.Id[].@HasLinkOut` ... `Y`/`N`
- `eLinkResult.LinkSet[].ERROR` ... per-linkset error string

## What our workflows currently use
- `PMID`

(No PubMed workflow exists yet — pubmed-capture ticket in flight.)
