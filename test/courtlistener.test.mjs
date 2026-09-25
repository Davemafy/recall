import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuthorityFromInput,buildSearchPasses,classifyCourtListenerStatus,safeSourceUrl,
  extractDocumentsFromSearchPayload,extractDocketMetadata,confirmPublicCandidate,summarizePublicTrace,
  searchCourtListenerPages,hydratePublicDocument
} from '../lib/courtlistener.mjs';
import {getRecordedPublicTrace} from '../lib/recorded-public-trace.mjs';

test('authority input canonicalizes pin cite to first page',()=>{
  const a=buildAuthorityFromInput('Andy Warhol Found. v. Goldsmith, 598 U.S. 508, 526 (2023)');
  assert.equal(a.canonicalCitation,'598 U.S. 508');
  assert.equal(a.pin,526);
});

test('search passes use documented phrase and AND operators',()=>{
  const a=buildAuthorityFromInput('598 U.S. 508');
  const passes=buildSearchPasses({authority:a,quote:'the same copying may be fair when used for one purpose but not another',caseName:'Andy Warhol Foundation v. Goldsmith'});
  assert.ok(passes.some(p=>p.q==='"598 U.S. 508"'));
  assert.ok(passes.some(p=>p.q.includes(' AND ')));
  assert.ok(passes.some(p=>p.label==='exact-quote'));
});

test('type r metadata does not masquerade as a filing candidate',()=>{
  const r={results:[{id:44,docketNumber:'1:20-cv-1',caseName:'Example v. Example',court_citation_string:'D. Del.',recap_documents:[{id:9,docket_id:44,snippet:'598 U.S. 508'}]}]};
  const meta=extractDocketMetadata(r);
  assert.equal(extractDocumentsFromSearchPayload(r,'r',meta).length,1); // nested recap_documents are actual filings
  const d={results:[{id:10,docket_id:44,document_number:'8',snippet:'598 U.S. 508'}]};
  const [doc]=extractDocumentsFromSearchPayload(d,'rd',meta);
  assert.equal(doc.docketNumber,'1:20-cv-1');
  assert.equal(doc.caseName,'Example v. Example');
});

test('search hit without deterministic occurrence stays candidate',()=>{
  const incident=buildAuthorityFromInput('598 U.S. 508');
  const result=confirmPublicCandidate({snippet:'This filing discusses copyright fair use generally.'},incident);
  assert.equal(result.classification,'CANDIDATE_UNCONFIRMED');
});

test('deterministic citation in full filing text becomes confirmed',()=>{
  const incident={...buildAuthorityFromInput('598 U.S. 508'),caseName:'Andy Warhol Foundation v. Goldsmith'};
  const result=confirmPublicCandidate({fullText:'Andy Warhol Foundation v. Goldsmith, 598 U.S. 508, 526 (2023).',snippet:'irrelevant search snippet'},incident);
  assert.equal(result.classification,'CONFIRMED_CITATION_DEPENDENCY');
});

test('semantic resemblance never becomes confirmed',()=>{
  const incident={...buildAuthorityFromInput('598 U.S. 508'),proposition:'a transformative purpose changes the fair use analysis'};
  const result=confirmPublicCandidate({fullText:'A transformative purpose can change how fair use is evaluated.'},incident);
  assert.notEqual(result.classification,'CONFIRMED_CITATION_DEPENDENCY');
  assert.notEqual(result.classification,'CONFIRMED_QUOTE_REUSE');
});

test('source allowlist rejects arbitrary hosts',()=>{
  assert.equal(safeSourceUrl('https://evil.example/file.pdf'),null);
  assert.ok(safeSourceUrl('https://storage.courtlistener.com/recap/a.pdf'));
  assert.ok(safeSourceUrl('/docket/123/example/'));
});

test('HTTP error classes remain source states',()=>{
  assert.equal(classifyCourtListenerStatus(401),'AUTH_ERROR');
  assert.equal(classifyCourtListenerStatus(403),'AUTH_ERROR');
  assert.equal(classifyCourtListenerStatus(429),'RATE_LIMITED');
  assert.equal(classifyCourtListenerStatus(503),'SOURCE_UNAVAILABLE');
});

test('pagination follows CourtListener next links and respects result bound',async()=>{
  const original=global.fetch;
  let calls=0;
  global.fetch=async()=>{
    calls++;
    if(calls===1) return new Response(JSON.stringify({count:3,next:'https://www.courtlistener.com/api/rest/v4/search/?cursor=abc',results:[{id:1,docket_id:10,snippet:'one'},{id:2,docket_id:10,snippet:'two'}]}),{status:200});
    return new Response(JSON.stringify({count:3,next:null,results:[{id:3,docket_id:11,snippet:'three'}]}),{status:200});
  };
  try{
    const result=await searchCourtListenerPages('"598 U.S. 508"','token','rd',3);
    assert.equal(result.results.length,3);
    assert.equal(calls,2);
  }finally{global.fetch=original}
});

test('RECAP detail text and docket metadata hydrate a candidate before confirmation',async()=>{
  const original=global.fetch;
  global.fetch=async(url)=>{
    const value=String(url);
    if(value.includes('/recap-documents/99/')) return new Response(JSON.stringify({id:99,description:'Opinion',document_number:'7',plain_text:'Full filing text cites 598 U.S. 508, 528.',filepath_local:'recap/example.pdf',is_available:true,ocr_status:0}),{status:200});
    if(value.includes('/dockets/44/')) return new Response(JSON.stringify({id:44,docket_number:'1:20-cv-613',case_name:'Example v. Example',court:'https://www.courtlistener.com/api/rest/v4/courts/ded/',absolute_url:'/docket/44/example/'}),{status:200});
    throw new Error('unexpected fetch '+value);
  };
  try{
    const doc=await hydratePublicDocument({id:'99',courtListenerId:99,docketId:44,snippet:'search hit'},'token');
    assert.match(doc.fullText,/598 U\.S\. 508/);
    assert.equal(doc.docketNumber,'1:20-cv-613');
    assert.match(doc.documentUrl,/storage\.courtlistener\.com\/recap\/example\.pdf/);
  }finally{global.fetch=original}
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
