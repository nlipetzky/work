import { workflow, node, trigger, newCredential } from '@n8n/workflow-sdk';

// ============================================================
// Companies Relationship Classifier
//
// Replaces the prior binary dedup workflow.
// Per SPEC-relationship-classifier-2026-06-02.md.
//
// Triggered by Airtable automation on Companies record-create
// (webhook fires with ?recordId=rec...). Classifies the new
// record against existing rows into one of five verdicts:
//   exact_duplicate / related_entity / distinct / incomplete / unreviewed
//
// Writes verdict + confidence + canonical link + notes back
// onto the new record. NEVER deletes. NEVER writes to
// Lifecycle State (that's owned by state-reconciliation).
//
// v1 open-question decisions:
//   Q1 auto-merge: NO. Flag only. Operator reviews high-confidence exact_duplicates.
//   Q2 related_entity auto-writes: Parent Company written only when canonical's name
//      is contained in this record's name. Subsidiary Status NOT auto-written
//      (operator confirms).
//   Q3 Lifecycle State: classifier never writes to it. Only the five Relationship_*
//      fields.
//   Q4 backfill: handled separately, not in this workflow.
//   Q5 distinct vs incomplete: distinct when Domain OR LinkedIn OR Name has data
//      and no match found. Incomplete only when ALL three are empty.
//
// IMPORTANT: Webhook node preserved verbatim from live workflow state.
// Do not modify any field on it via this file. If a webhook config
// change is genuinely needed, surface as a manual ask.
// ============================================================

const webhookTrigger = trigger({
    type: 'n8n-nodes-base.webhook',
    version: 2.1,
    config: {
        name: 'Webhook',
        parameters: { path: '2f3d804d-aafd-41ac-85fa-27d3856a173f', options: {} },
        position: [-480, 288],
        webhookId: '2f3d804d-aafd-41ac-85fa-27d3856a173f',
    },
    output: [{ headers: {}, params: {}, query: { recordId: 'recExampleRecordId' }, body: {} }],
});

const getNewRecord = node({
    type: 'n8n-nodes-base.airtable',
    version: 2.2,
    config: {
        name: 'Get New Record',
        parameters: {
            operation: 'get',
            base: { __rl: true, value: 'appYBYH3aOHhTODAw', mode: 'list', cachedResultName: 'RevOps Surface' },
            table: { __rl: true, value: 'tblnj3YlOI3thjrXp', mode: 'list', cachedResultName: 'Companies' },
            id: '={{ $json.query.recordId }}',
        },
        credentials: { airtableTokenApi: newCredential('Airtable RevOps Surface') },
        position: [-272, 288],
    },
});

const buildContext = node({
    type: 'n8n-nodes-base.code',
    version: 2,
    config: {
        name: 'Build Context',
        parameters: {
            jsCode: `// Build normalized identifiers + filter formula in one place.
const rec = $input.first().json;
const f = rec.fields || {};

function normDomain(v) {
    return (v || '').toString().toLowerCase()
        .replace(/^https?:\\/\\//, '')
        .replace(/^www\\./, '')
        .replace(/\\/$/, '')
        .trim();
}
function normLinkedIn(v) {
    return (v || '').toString().toLowerCase()
        .replace(/\\/$/, '')
        .trim();
}
function rawNameLower(v) {
    return (v || '').toString().toLowerCase().trim();
}

const newRecordId = rec.id;
const normalizedDomain = normDomain(f.Domain);
const normalizedLinkedIn = normLinkedIn(f['Company LinkedIn URL']);
const rawName = rawNameLower(f['Company Name']);
const originalName = (f['Company Name'] || '').toString();
const ultimateParent = (f['Ultimate Parent'] || f.explorium_ultimate_parent_name || '').toString().toLowerCase().trim();

// Escape any double-quotes in the values for use inside the Airtable formula string literal.
function esc(s) { return s.replace(/"/g, '\\\\"'); }

// Combined OR filter: match on normalized Domain, LinkedIn URL, or Company Name.
// Self-exclusion via RECORD_ID().
// LEN(...) > 0 guards prevent empty-vs-empty matches.
const clauses = [];
if (normalizedDomain) {
    clauses.push(\`AND(LEN("\${esc(normalizedDomain)}") > 0, {Domain Normalized} = "\${esc(normalizedDomain)}")\`);
}
if (normalizedLinkedIn) {
    clauses.push(\`AND(LEN("\${esc(normalizedLinkedIn)}") > 0, LOWER({Company LinkedIn URL}) = "\${esc(normalizedLinkedIn)}")\`);
}
if (rawName) {
    clauses.push(\`AND(LEN("\${esc(rawName)}") > 0, LOWER(TRIM({Company Name})) = "\${esc(rawName)}")\`);
}

let filterFormula;
if (clauses.length === 0) {
    // No identifiers at all -> short-circuit the search by returning a filter that matches nothing.
    filterFormula = 'FALSE()';
} else {
    filterFormula = \`AND(RECORD_ID() != "\${esc(newRecordId)}", OR(\${clauses.join(', ')}))\`;
}

return [{
    json: {
        newRecordId,
        normalizedDomain,
        normalizedLinkedIn,
        rawName,
        originalName,
        ultimateParent,
        filterFormula,
        hasAnyIdentifier: clauses.length > 0,
    },
}];
`,
        },
        position: [-64, 288],
    },
});

const searchCandidates = node({
    type: 'n8n-nodes-base.airtable',
    version: 2.2,
    config: {
        name: 'Search Candidates',
        parameters: {
            operation: 'search',
            base: { __rl: true, value: 'appYBYH3aOHhTODAw', mode: 'list', cachedResultName: 'RevOps Surface' },
            table: { __rl: true, value: 'tblnj3YlOI3thjrXp', mode: 'list', cachedResultName: 'Companies' },
            filterByFormula: '={{ $json.filterFormula }}',
            options: {},
            alwaysOutputData: true,
        },
        credentials: { airtableTokenApi: newCredential('Airtable RevOps Surface') },
        position: [144, 288],
    },
});

const classify = node({
    type: 'n8n-nodes-base.code',
    version: 2,
    config: {
        name: 'Classify',
        parameters: {
            jsCode: `// Classify the new record against returned candidates.
// Verdict taxonomy: exact_duplicate, related_entity, distinct, incomplete.
//
// Scoring per candidate (highest-priority verdict wins):
//   domain + name match -> exact_duplicate (high if also LinkedIn match, else medium)
//   LinkedIn + name match -> exact_duplicate (high)
//   LinkedIn alone -> exact_duplicate (medium; LinkedIn is per-legal-entity)
//   Name alone (no domain on new record) -> exact_duplicate (medium)
//   Domain alone (different name) -> related_entity (high if Ultimate Parent matches, else medium)
//   Ultimate Parent match alone -> related_entity (medium)
//
// Final selection: highest verdict priority, then highest confidence,
// then oldest createdTime as canonical.

const ctx = $('Build Context').first().json;
const candidates = $input.all().map(i => i.json).filter(c => c && c.id);

const VERDICT_PRIORITY = { exact_duplicate: 3, related_entity: 2, distinct: 1, incomplete: 0 };
const CONF_PRIORITY = { high: 3, medium: 2, low: 1 };

function scoreCandidate(cand) {
    const cf = cand.fields || {};
    const cDom = (cf['Domain Normalized'] || '').toString().toLowerCase().trim();
    const cLI = (cf['Company LinkedIn URL'] || '').toString().toLowerCase().replace(/\\/$/, '').trim();
    const cName = (cf['Company Name'] || '').toString().toLowerCase().trim();
    const cUP = (cf['Ultimate Parent'] || cf.explorium_ultimate_parent_name || '').toString().toLowerCase().trim();

    const domainMatch = !!(ctx.normalizedDomain && cDom && ctx.normalizedDomain === cDom);
    const linkedinMatch = !!(ctx.normalizedLinkedIn && cLI && ctx.normalizedLinkedIn === cLI);
    const nameMatch = !!(ctx.rawName && cName && ctx.rawName === cName);
    const upMatch = !!(ctx.ultimateParent && cUP && ctx.ultimateParent === cUP);

    let verdict, confidence;
    if (domainMatch && nameMatch) {
        verdict = 'exact_duplicate';
        confidence = linkedinMatch ? 'high' : 'medium';
    } else if (linkedinMatch && nameMatch) {
        verdict = 'exact_duplicate';
        confidence = 'high';
    } else if (linkedinMatch) {
        verdict = 'exact_duplicate';
        confidence = 'medium';
    } else if (nameMatch && !ctx.normalizedDomain) {
        // Same name on a new record with no domain - likely a stub matching an enriched record.
        verdict = 'exact_duplicate';
        confidence = 'medium';
    } else if (domainMatch && !nameMatch) {
        verdict = 'related_entity';
        confidence = upMatch ? 'high' : 'medium';
    } else if (upMatch) {
        verdict = 'related_entity';
        confidence = 'medium';
    } else if (nameMatch) {
        // Same name + same domain would have hit the first branch.
        // Here: same name, different domain -> still likely the same entity.
        verdict = 'exact_duplicate';
        confidence = 'medium';
    } else {
        verdict = 'distinct';
        confidence = 'low';
    }

    return {
        id: cand.id,
        createdTime: cand.createdTime,
        name: cf['Company Name'] || '',
        domain: cf.Domain || '',
        domainNormalized: cDom,
        linkedinUrl: cf['Company LinkedIn URL'] || '',
        signals: { domainMatch, linkedinMatch, nameMatch, upMatch },
        verdict,
        confidence,
    };
}

let finalVerdict, finalConfidence, canonicalId = null, canonicalName = null, parentCompanyToSet = null, notes;
const detectedAt = new Date().toISOString();

if (candidates.length === 0) {
    if (ctx.hasAnyIdentifier) {
        finalVerdict = 'distinct';
        finalConfidence = 'high';
        notes = \`No matching records found.
Signals checked: domain="\${ctx.normalizedDomain}", linkedin="\${ctx.normalizedLinkedIn}", name="\${ctx.rawName}".\`;
    } else {
        finalVerdict = 'incomplete';
        finalConfidence = 'high';
        notes = 'Record has no Domain, LinkedIn URL, or Company Name. Cannot classify until enriched.';
    }
} else {
    const scored = candidates.map(scoreCandidate);
    scored.sort((a, b) => {
        const v = VERDICT_PRIORITY[b.verdict] - VERDICT_PRIORITY[a.verdict];
        if (v !== 0) return v;
        const c = CONF_PRIORITY[b.confidence] - CONF_PRIORITY[a.confidence];
        if (c !== 0) return c;
        return new Date(a.createdTime) - new Date(b.createdTime);
    });

    const best = scored[0];
    finalVerdict = best.verdict;
    finalConfidence = best.confidence;
    canonicalId = best.id;
    canonicalName = best.name;

    // related_entity + canonical's name contained in this record's name -> suggest Parent Company.
    if (finalVerdict === 'related_entity' && canonicalName && ctx.rawName) {
        const cnLower = canonicalName.toLowerCase().trim();
        if (cnLower && ctx.rawName.includes(cnLower) && cnLower !== ctx.rawName) {
            parentCompanyToSet = canonicalName;
        }
    }

    const lines = [
        \`Verdict: \${finalVerdict} (\${finalConfidence})\`,
        \`Canonical: \${canonicalName || '(no name)'} (\${canonicalId}, created \${best.createdTime})\`,
        \`Signals on canonical: domain=\${best.signals.domainMatch}, linkedin=\${best.signals.linkedinMatch}, name=\${best.signals.nameMatch}, ultimateParent=\${best.signals.upMatch}\`,
        \`New record identifiers: domain="\${ctx.normalizedDomain}", linkedin="\${ctx.normalizedLinkedIn}", name="\${ctx.rawName}"\`,
        \`Total candidates returned by filter: \${candidates.length}\`,
    ];
    if (parentCompanyToSet) {
        lines.push(\`Suggested Parent Company: \${parentCompanyToSet}\`);
    }
    notes = lines.join('\\n');
}

return [{
    json: {
        newRecordId: ctx.newRecordId,
        verdict: finalVerdict,
        confidence: finalConfidence,
        canonicalId,
        canonicalName,
        parentCompanyToSet,
        notes,
        detectedAt,
    },
}];
`,
        },
        position: [352, 288],
    },
});

const updateNewRecord = node({
    type: 'n8n-nodes-base.airtable',
    version: 2.2,
    config: {
        name: 'Update New Record',
        parameters: {
            operation: 'update',
            base: { __rl: true, value: 'appYBYH3aOHhTODAw', mode: 'list', cachedResultName: 'RevOps Surface' },
            table: { __rl: true, value: 'tblnj3YlOI3thjrXp', mode: 'list', cachedResultName: 'Companies' },
            columns: {
                mappingMode: 'defineBelow',
                matchingColumns: ['id'],
                value: {
                    id: '={{ $json.newRecordId }}',
                    'Relationship Verdict': '={{ $json.verdict }}',
                    'Relationship Confidence': '={{ $json.confidence }}',
                    'Relationship Notes': '={{ $json.notes }}',
                    'Relationship Detected At': '={{ $json.detectedAt }}',
                    'Canonical Record': '={{ $json.canonicalId ? [$json.canonicalId] : [] }}',
                    'Parent Company': '={{ $json.parentCompanyToSet || "" }}',
                },
            },
            options: { typecast: true },
        },
        credentials: { airtableTokenApi: newCredential('Airtable RevOps Surface') },
        position: [560, 288],
    },
});

export default workflow('NOZ4tx25dHCdu1N6', 'Company Dedup')
    .add(webhookTrigger)
    .to(getNewRecord)
    .to(buildContext)
    .to(searchCandidates)
    .to(classify)
    .to(updateNewRecord);
