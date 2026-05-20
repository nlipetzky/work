import { workflow, node, trigger, ifElse, splitInBatches, nextBatch } from '@n8n/workflow-sdk';

// ─── Triggers ────────────────────────────────────────────────────────────────

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Trigger', position: [0, 300] },
  output: [{}]
});

const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Monthly Schedule',
    parameters: {
      rule: {
        interval: [{ field: 'cronExpression', expression: '0 6 1 * *' }]
      }
    },
    position: [0, 500]
  },
  output: [{}]
});

// ─── SplitInBatches ───────────────────────────────────────────────────────────

const coSib = splitInBatches({
  version: 3,
  config: {
    name: 'Co Split Companies',
    parameters: { batchSize: 1 },
    position: [600, 100]
  }
});

const ctSib = splitInBatches({
  version: 3,
  config: {
    name: 'Ct Split Contacts',
    parameters: { batchSize: 1 },
    position: [600, 500]
  }
});

// ─── Company Branch ───────────────────────────────────────────────────────────

// Airtable v2.2 with __rl:true is the format that deploys parameters correctly.
// v3 results in empty parameters on deploy (confirmed via live GET).
const coListCompanies = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Co List Companies',
    parameters: {
      operation: 'search',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblnj3YlOI3thjrXp' },
      filterByFormula: "NOT({Company Name} = '')",
      options: {}
    },
    position: [300, 100]
  },
  output: [{ id: 'recExample', fields: { 'Company Name': 'Voyager Therapeutics' } }]
});

// Plain template literal — no String.raw. Backslashes not needed here (no regex).
const coBuildQuery = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Co Build Company Query',
    parameters: {
      jsCode: `// Rate limit: 400ms to stay under NCBI 3 req/sec limit
await new Promise(r => setTimeout(r, 400));

const raw = $input.first().json;
const fields = raw.fields || raw;
const companyName = (fields['Company Name'] || '').trim();
const ultimateParent = (fields['Ultimate Parent'] || '').trim();
const recordId = raw.id;

if (!companyName) {
  return [{ json: { skip: true, record_id: recordId, company_name: '', search_term: '' } }];
}

const terms = ['"' + companyName + '"[Affiliation]'];
if (ultimateParent && ultimateParent.toLowerCase() !== companyName.toLowerCase()) {
  terms.push('"' + ultimateParent + '"[Affiliation]');
}

return [{
  json: {
    record_id: recordId,
    company_name: companyName,
    search_term: terms.join(' OR '),
    skip: false
  }
}];`
    },
    position: [900, 100]
  },
  output: [{ record_id: 'recExample', company_name: 'Voyager Therapeutics', search_term: '"Voyager Therapeutics"[Affiliation]' }]
});

const coPubmedSearch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Co PubMed Search',
    parameters: {
      url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
      method: 'GET',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'db', value: 'pubmed' },
          { name: 'term', value: '={{ $json.search_term }}' },
          { name: 'retmode', value: 'json' },
          { name: 'retmax', value: '100' },
          { name: 'sort', value: 'pub date' }
        ]
      },
      options: {}
    },
    position: [1200, 100]
  },
  output: [{ esearchresult: { count: '5', idlist: ['38000001', '38000002'] } }]
});

const coHasPublications = ifElse({
  version: 2.2,
  config: {
    name: 'Co Has Publications?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          id: 'co-count-check',
          leftValue: '={{ parseInt($json.esearchresult.count) }}',
          rightValue: 0,
          operator: { type: 'number', operation: 'gt' }
        }],
        combinator: 'and'
      },
      options: {}
    },
    position: [1500, 100]
  }
});

const coFetchXML = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Co Fetch Publication XML',
    parameters: {
      url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
      method: 'GET',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'db', value: 'pubmed' },
          { name: 'id', value: "={{ $json.esearchresult.idlist.join(',') }}" },
          { name: 'retmode', value: 'xml' },
          { name: 'rettype', value: 'abstract' }
        ]
      },
      options: {
        response: { response: { responseFormat: 'text' } }
      }
    },
    position: [1800, 100]
  },
  output: [{ body: '<PubmedArticleSet></PubmedArticleSet>' }]
});

// Backslash doubling rules for plain template literals:
//   \s \S \d \w \b in regex  →  \\s \\S \\d \\w \\b  (unrecognized escapes; backslash dropped otherwise)
//   \/  in regex literals    →  \\/                   (needed to avoid prematurely ending the regex)
//   \n  in string literals   →  \\n                   (actual newline char breaks single-quoted string syntax)
const coParseEvents = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Co Parse & Build Events',
    parameters: {
      jsCode: `const xmlText = $input.first().json.body || '';
const queryNode = $('Co Build Company Query').item.json;
const recordId = queryNode.record_id;
const companyName = queryNode.company_name;

function parseArticles(xml) {
  const articles = [];
  const articleRe = /<PubmedArticle>([\\s\\S]*?)<\\/PubmedArticle>/g;
  let m;
  while ((m = articleRe.exec(xml)) !== null) {
    const a = m[1];
    const pmidM = a.match(/<PMID[^>]*>(\\d+)<\\/PMID>/);
    const pmid = pmidM ? pmidM[1] : '';
    if (!pmid) continue;

    const titleM = a.match(/<ArticleTitle>([\\s\\S]*?)<\\/ArticleTitle>/);
    const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';

    const abstractParts = [];
    const abstractRe = /<AbstractText[^>]*>([\\s\\S]*?)<\\/AbstractText>/g;
    let am;
    while ((am = abstractRe.exec(a)) !== null) {
      abstractParts.push(am[1].replace(/<[^>]+>/g, '').trim());
    }
    const detail = abstractParts.join('\\n').substring(0, 8000);

    const authorNames = [];
    const authorRe = /<Author[^>]*>([\\s\\S]*?)<\\/Author>/g;
    let authM;
    while ((authM = authorRe.exec(a)) !== null) {
      const aXml = authM[1];
      const lnM = aXml.match(/<LastName>(.*?)<\\/LastName>/);
      const fnM = aXml.match(/<ForeName>(.*?)<\\/ForeName>/);
      const iM = aXml.match(/<Initials>(.*?)<\\/Initials>/);
      if (lnM) {
        const fn = fnM ? fnM[1] : (iM ? iM[1] : '');
        authorNames.push(fn ? lnM[1] + ', ' + fn : lnM[1]);
      }
    }

    let pubDate = '';
    const yearM = a.match(/<PubDate>[\\s\\S]*?<Year>(\\d{4})<\\/Year>/);
    if (yearM) {
      const year = yearM[1];
      const monthM = a.match(/<PubDate>[\\s\\S]*?<Month>(\\w+)<\\/Month>/);
      const dayM = a.match(/<PubDate>[\\s\\S]*?<Day>(\\d+)<\\/Day>/);
      const monthMap = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
      let monthNum = '01';
      if (monthM) {
        const mn = monthM[1];
        monthNum = monthMap[mn] || (mn.length <= 2 ? mn.padStart(2, '0') : '01');
      }
      const day = dayM ? dayM[1].padStart(2, '0') : '01';
      pubDate = year + '-' + monthNum + '-' + day;
    } else {
      const medM = a.match(/<MedlineDate>(\\d{4})[\\s\\S]*?<\\/MedlineDate>/);
      if (medM) pubDate = medM[1] + '-01-01';
    }

    const meshTerms = [];
    const meshRe = /<DescriptorName[^>]*>(.*?)<\\/DescriptorName>/g;
    let meshM;
    while ((meshM = meshRe.exec(a)) !== null) {
      meshTerms.push(meshM[1].replace(/<[^>]+>/g, '').trim());
    }

    const rawPayload = m[0].substring(0, 95000);
    const today = new Date().toISOString().split('T')[0];

    articles.push({
      event_id: companyName + ' — publication — ' + pmid,
      pmid,
      title,
      detail,
      authors: authorNames.join('\\n'),
      pub_date: pubDate,
      mesh_terms: meshTerms.join('\\n'),
      raw_payload: rawPayload,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/' + pmid + '/',
      record_id: recordId,
      detected_at: today
    });
  }
  return articles;
}

const articles = parseArticles(xmlText);
if (articles.length === 0) return [];
return articles.map(a => ({ json: a }));`
    },
    position: [2100, 100]
  },
  output: [{ event_id: 'Voyager Therapeutics — publication — 38000001', pmid: '38000001' }]
});

// Write via Airtable REST API directly — HTTP Request is more reliable than Airtable node v3.
const coWriteEvents = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Co Write Company Events',
    parameters: {
      method: 'POST',
      url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblnzX2b2kqNGzW6r',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify({ records: [{ fields: { "Event ID": $json.event_id, "Event Type": "publication", "Event Date": $json.pub_date, "Provider": "pubmed", "Company": [$json.record_id], "Title": $json.title, "Names": $json.authors, "Categories / Tags": $json.mesh_terms, "Detail": $json.detail, "Source URL": $json.source_url, "External ID": $json.pmid, "Raw Reference": "pubmed:" + $json.pmid, "Vitality": "active", "Confidence": "high", "Detected At": $json.detected_at, "Is Latest": true, "Raw Payload": $json.raw_payload } }], typecast: true }) }}',
      options: {
        batching: { batch: { batchSize: 1, batchInterval: 200 } },
        response: { response: { neverError: true } }
      }
    },
    position: [2400, 100]
  },
  output: [{ records: [{ id: 'recNew' }] }]
});

// ─── Contact Branch ───────────────────────────────────────────────────────────

const ctListContacts = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Ct List Contacts',
    parameters: {
      operation: 'search',
      base: { __rl: true, mode: 'id', value: 'appYBYH3aOHhTODAw' },
      table: { __rl: true, mode: 'id', value: 'tblWJksRL1yKSUgrm' },
      filterByFormula: "NOT({Last Name} = '')",
      options: {}
    },
    position: [300, 500]
  },
  output: [{ id: 'recContact', fields: { 'Last Name': 'Acland', 'First Name': 'Steven', 'Company Name': 'Voyager Therapeutics' } }]
});

const ctBuildQuery = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Ct Build Author Query',
    parameters: {
      jsCode: `// Rate limit: 400ms
await new Promise(r => setTimeout(r, 400));

const raw = $input.first().json;
const fields = raw.fields || raw;
const lastName = (fields['Last Name'] || '').trim();
const firstName = (fields['First Name'] || '').trim();
const companyName = (fields['Company Name'] || '').trim();
const linkedIn = (fields['LinkedIn URL'] || '').trim();
const recordId = raw.id;

if (!lastName) {
  return [{ json: { skip: true, record_id: recordId } }];
}

const firstInitial = firstName ? firstName[0] : '';
const authorTerm = firstInitial
  ? lastName + ' ' + firstInitial + '[Author]'
  : lastName + '[Author]';

return [{
  json: {
    record_id: recordId,
    last_name: lastName,
    first_name: firstName,
    company_name: companyName,
    linkedin_url: linkedIn,
    search_term: authorTerm,
    skip: false
  }
}];`
    },
    position: [900, 500]
  },
  output: [{ record_id: 'recContact', last_name: 'Acland', search_term: 'Acland S[Author]' }]
});

const ctPubmedSearch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Ct PubMed Author Search',
    parameters: {
      url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
      method: 'GET',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'db', value: 'pubmed' },
          { name: 'term', value: '={{ $json.search_term }}' },
          { name: 'retmode', value: 'json' },
          { name: 'retmax', value: '50' },
          { name: 'sort', value: 'pub date' }
        ]
      },
      options: {}
    },
    position: [1200, 500]
  },
  output: [{ esearchresult: { count: '3', idlist: ['37000001'] } }]
});

const ctHasPublications = ifElse({
  version: 2.2,
  config: {
    name: 'Ct Has Author Publications?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          id: 'ct-count-check',
          leftValue: '={{ parseInt($json.esearchresult.count) }}',
          rightValue: 0,
          operator: { type: 'number', operation: 'gt' }
        }],
        combinator: 'and'
      },
      options: {}
    },
    position: [1500, 500]
  }
});

const ctFetchXML = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Ct Fetch Author XML',
    parameters: {
      url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
      method: 'GET',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'db', value: 'pubmed' },
          { name: 'id', value: "={{ $json.esearchresult.idlist.join(',') }}" },
          { name: 'retmode', value: 'xml' },
          { name: 'rettype', value: 'abstract' }
        ]
      },
      options: {
        response: { response: { responseFormat: 'text' } }
      }
    },
    position: [1800, 500]
  },
  output: [{ body: '<PubmedArticleSet></PubmedArticleSet>' }]
});

const ctParseDisambiguate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Ct Parse & Disambiguate',
    parameters: {
      jsCode: `const xmlText = $input.first().json.body || '';
const contactNode = $('Ct Build Author Query').item.json;
const recordId = contactNode.record_id;
const lastName = contactNode.last_name || '';
const firstName = contactNode.first_name || '';
const companyName = (contactNode.company_name || '').toLowerCase();

const companyCore = companyName
  .replace(/\\b(inc|llc|ltd|corp|therapeutics|biosciences|bio|pharma|pharmaceuticals|sciences|health|medical|gene therapy|genomics|company|co)\\b/gi, '')
  .replace(/\\s+/g, ' ')
  .trim();

function parseArticles(xml) {
  const articles = [];
  const articleRe = /<PubmedArticle>([\\s\\S]*?)<\\/PubmedArticle>/g;
  let m;
  while ((m = articleRe.exec(xml)) !== null) {
    const a = m[1];
    const pmidM = a.match(/<PMID[^>]*>(\\d+)<\\/PMID>/);
    const pmid = pmidM ? pmidM[1] : '';
    if (!pmid) continue;

    const titleM = a.match(/<ArticleTitle>([\\s\\S]*?)<\\/ArticleTitle>/);
    const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';

    const abstractParts = [];
    const abstractRe = /<AbstractText[^>]*>([\\s\\S]*?)<\\/AbstractText>/g;
    let am;
    while ((am = abstractRe.exec(a)) !== null) {
      abstractParts.push(am[1].replace(/<[^>]+>/g, '').trim());
    }
    const detail = abstractParts.join('\\n').substring(0, 8000);

    const authorNames = [];
    const affiliations = [];
    const authorRe = /<Author[^>]*>([\\s\\S]*?)<\\/Author>/g;
    let authM;
    while ((authM = authorRe.exec(a)) !== null) {
      const aXml = authM[1];
      const lnM = aXml.match(/<LastName>(.*?)<\\/LastName>/);
      const fnM = aXml.match(/<ForeName>(.*?)<\\/ForeName>/);
      const iM = aXml.match(/<Initials>(.*?)<\\/Initials>/);
      if (lnM) {
        const fn = fnM ? fnM[1] : (iM ? iM[1] : '');
        authorNames.push(fn ? lnM[1] + ', ' + fn : lnM[1]);
      }
      const affRe = /<Affiliation>([\\s\\S]*?)<\\/Affiliation>/g;
      let affM;
      while ((affM = affRe.exec(aXml)) !== null) {
        affiliations.push(affM[1].replace(/<[^>]+>/g, '').trim());
      }
    }

    const affiliationText = affiliations.join(' ').toLowerCase();
    let confidence = 'low';
    let signalState = 'needs_dq_review';

    if (companyCore && companyCore.length > 2) {
      if (affiliationText.includes(companyCore) || affiliationText.includes(companyName)) {
        confidence = 'high';
        signalState = '';
      }
    }

    let pubDate = '';
    const yearM = a.match(/<PubDate>[\\s\\S]*?<Year>(\\d{4})<\\/Year>/);
    if (yearM) {
      const year = yearM[1];
      const monthM = a.match(/<PubDate>[\\s\\S]*?<Month>(\\w+)<\\/Month>/);
      const dayM = a.match(/<PubDate>[\\s\\S]*?<Day>(\\d+)<\\/Day>/);
      const monthMap = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
      let monthNum = '01';
      if (monthM) {
        const mn = monthM[1];
        monthNum = monthMap[mn] || (mn.length <= 2 ? mn.padStart(2, '0') : '01');
      }
      const day = dayM ? dayM[1].padStart(2, '0') : '01';
      pubDate = year + '-' + monthNum + '-' + day;
    } else {
      const medM = a.match(/<MedlineDate>(\\d{4})[\\s\\S]*?<\\/MedlineDate>/);
      if (medM) pubDate = medM[1] + '-01-01';
    }

    const meshTerms = [];
    const meshRe = /<DescriptorName[^>]*>(.*?)<\\/DescriptorName>/g;
    let meshM;
    while ((meshM = meshRe.exec(a)) !== null) {
      meshTerms.push(meshM[1].replace(/<[^>]+>/g, '').trim());
    }

    const rawPayload = m[0].substring(0, 95000);
    const today = new Date().toISOString().split('T')[0];
    const fullName = firstName ? lastName + ', ' + firstName : lastName;

    articles.push({
      event_id: fullName + ' — publication — ' + pmid,
      pmid,
      title,
      detail,
      authors: authorNames.join('\\n'),
      pub_date: pubDate,
      mesh_terms: meshTerms.join('\\n'),
      raw_payload: rawPayload,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/' + pmid + '/',
      record_id: recordId,
      confidence,
      signal_state: signalState,
      detected_at: today
    });
  }
  return articles;
}

const articles = parseArticles(xmlText);
if (articles.length === 0) return [];
return articles.map(a => ({ json: a }));`
    },
    position: [2100, 500]
  },
  output: [{ event_id: 'Acland, Steven — publication — 37000001', confidence: 'high' }]
});

const ctWriteEvents = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Ct Write Contact Events',
    parameters: {
      method: 'POST',
      url: 'https://api.airtable.com/v0/appYBYH3aOHhTODAw/tblDYItHaNcT2gnwi',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify({ records: [{ fields: { "Event ID": $json.event_id, "Event Type": "publication", "Event Date": $json.pub_date, "Provider": "pubmed", "Contact": [$json.record_id], "Title": $json.title, "Names": $json.authors, "Categories / Tags": $json.mesh_terms, "Detail": $json.detail, "Source URL": $json.source_url, "External ID": $json.pmid, "Raw Reference": "pubmed:" + $json.pmid, "Vitality": "active", "Confidence": $json.confidence, "Signal State (raw)": $json.signal_state, "Detected At": $json.detected_at, "Is Latest": true, "Raw Payload": $json.raw_payload } }], typecast: true }) }}',
      options: {
        batching: { batch: { batchSize: 1, batchInterval: 200 } },
        response: { response: { neverError: true } }
      }
    },
    position: [2400, 500]
  },
  output: [{ records: [{ id: 'recNew' }] }]
});

// ─── Workflow Composition ─────────────────────────────────────────────────────

export default workflow('pubmed-capture', 'PubMed Publication Capture')
  .add(manualTrigger)
  .to(coListCompanies)
  .to(coSib
    .onEachBatch(
      coBuildQuery
        .to(coPubmedSearch)
        .to(coHasPublications
          .onTrue(coFetchXML.to(coParseEvents).to(coWriteEvents).to(nextBatch(coSib)))
          .onFalse(nextBatch(coSib))
        )
    )
  )
  .add(manualTrigger)
  .to(ctListContacts)
  .to(ctSib
    .onEachBatch(
      ctBuildQuery
        .to(ctPubmedSearch)
        .to(ctHasPublications
          .onTrue(ctFetchXML.to(ctParseDisambiguate).to(ctWriteEvents).to(nextBatch(ctSib)))
          .onFalse(nextBatch(ctSib))
        )
    )
  )
  .add(scheduleTrigger)
  .to(coListCompanies)
  .add(scheduleTrigger)
  .to(ctListContacts);
