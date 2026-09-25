import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuthorityFromInput,buildSearchPasses,classifyCourtListenerStatus,safeSourceUrl,
  extractDocumentsFromSearchPayload,extractDocketMetadata,confirmPublicCandidate,summarizePublicTrace
} from '../lib/courtlistener.mjs';
import {getRecordedPublicTrace} from '../lib/recorded-public-trace.mjs';

test('authority input canonicalizes pin cite to first page',()=>{
  const a=buildAuthorityFromInput('Andy Warhol Found. v. Goldsmith, 598 U.S. 508, 526 (2023)');
  assert.equal(a.canonicalCitation,'598 U.S. 508');
  assert.equal(a.pin,526);
});

test('search passes use documented keyword query shapes',()=>{
  const a=buildAuthorityFromInput('598 U.S. 508');
  const passes=buildSearchPasses({authority:a,quote:'the same copying may be fair when used for one purpose but not another',caseName:'Andy Warhol Foundation v. Goldsmith'});
  assert.ok(passes.some(p=>p.q==='"598 U.S. 508"'));
  assert.ok(passes.some(p=>p.q.includes(' AND ')));
});

test('type r docket metadata enriches type rd filing document',()=>{
  const r={results:[{id:44,docketNumber:'1:20-cv-1',caseName:'Example v. Example',court_citation_string:'D. Del.',recap_documents:[{id:9,docket_id:44,snippet:'598 U.S. 508'}]}]};
  const meta=extractDocketMetadata(r);
  const docs=extractDocumentsFromSearchPayload(r,'r',meta);
  assert.equal(docs.length,1); assert.equal(docs[0].docketNumber,'1:20-cv-1');
});

test('search hit without deterministic occurrence stays candidate',()=>{
  const incident=buildAuthorityFromInput('598 U.S. 508');
  const result=confirmPublicCandidate({snippet:'This filing discusses copyright fair use generally.'},incident);
  assert.equal(result.classification,'CANDIDATE_UNCONFIRMED');
});

test('deterministic citation in available text becomes confirmed',()=>{
  const incident={...buildAuthorityFromInput('598 U.S. 508'),caseName:'Andy Warhol Foundation v. Goldsmith'};
  const result=confirmPublicCandidate({snippet:'Andy Warhol Foundation v. Goldsmith, 598 U.S. 508, 526 (2023).'},incident);
  assert.equal(result.classification,'CONFIRMED_CITATION_DEPENDENCY');
});

test('semantic resemblance never becomes confirmed',()=>{
  const incident={...buildAuthorityFromInput('598 U.S. 508'),proposition:'a transformative purpose changes the fair use analysis'};
  const result=confirmPublicCandidate({snippet:'A transformative purpose can change how fair use is evaluated.'},incident);
  assert.notEqual(result.classification,'CONFIRMED_CITATION_DEPENDENCY');
  assert.notEqual(result.classification,'CONFIRMED_QUOTE_REUSE');
});

test('source allowlist rejects arbitrary hosts',()=>{
  assert.equal(safeSourceUrl('https://evil.example/file.pdf'),null);
  assert.ok(safeSourceUrl('https://storage.courtlistener.com/recap/a.pdf'));
});

test('HTTP error classes remain source states',()=>{
  assert.equal(classifyCourtListenerStatus(401),'AUTH_ERROR');
  assert.equal(classifyCourtListenerStatus(403),'AUTH_ERROR');
  assert.equal(classifyCourtListenerStatus(429),'RATE_LIMITED');
  assert.equal(classifyCourtListenerStatus(503),'SOURCE_UNAVAILABLE');
});

test('recorded public trace is source backed and independently confirmed',()=>{
  const trace=getRecordedPublicTrace();
  assert.equal(trace.documents.length,3);
  assert.equal(trace.summary.confirmedFilingCount,3);
  assert.equal(trace.summary.uniqueDockets,3);
  for(const d of trace.documents){
    assert.match(d.sourceUrl,/^https:\/\/storage\.courtlistener\.com\/recap\//);
    assert.match(d.contentHash,/^[a-f0-9]{64}$/);
  }
});

test('summary does not mix unconfirmed candidates into confirmed count',()=>{
  const docs=[
    {id:'a',classification:'CONFIRMED_CITATION_DEPENDENCY',docketId:'d1',court:'X',filingDate:'2025-01-01'},
    {id:'b',classification:'CANDIDATE_UNCONFIRMED',docketId:'d2',court:'Y',filingDate:'2025-02-01'}
  ];
  const s=summarizePublicTrace(docs,2,10);
  assert.equal(s.confirmedFilingCount,1);assert.equal(s.candidateUnconfirmedCount,1);assert.equal(s.uniqueDockets,1);
});
