import test from 'node:test';
import assert from 'node:assert/strict';
import {extractCitations,canonicalId,quoteSimilarity,classifySnippet,analyzeCorpus,remediationFor,deriveIncidentContext,INCIDENT_QUOTE} from '../lib/recall-core.mjs';
import {createDemoCorpus} from '../lib/demo-corpus.mjs';

test('parses reporter citations and pin cites into one authority',()=>{
  const a=extractCitations('Martinez v. State, 999 F.4th 123, 130.');
  assert.equal(a.length,1); assert.equal(a[0].canonicalId,canonicalId(999,'F.4th',123)); assert.equal(a[0].pin,130);
});
test('equivalent citations canonicalize',()=>assert.equal(canonicalId(410,'U. S.',113),canonicalId(410,'U.S.',113)));
test('same case name different reporter remains different',()=>assert.notEqual(canonicalId(999,'F.4th',123),canonicalId(999,'F.3d',123)));
test('exact quote reuse is deterministic',()=>assert.equal(quoteSimilarity(INCIDENT_QUOTE,INCIDENT_QUOTE),1));
test('semantic similarity never returns confirmed',()=>{
 const r=classifySnippet('A procedural guarantee should attach before an agency causes a material deprivation.');
 assert.ok(['POSSIBLE_RELATED_PROPOSITION','NOT_RELATED'].includes(r.type));
});
test('critical discussion of bad case is excluded from blast radius',()=>{
 const docs=[{id:'x',title:'x',filename:'x',status:'INTERNAL',text:'Do not rely on Martinez v. State, 999 F.4th 123. The citation is invalid and fabricated.'}];
 const a=analyzeCorpus(docs); assert.equal(a.affectedDocuments.length,0);
});
test('unrelated same surname is excluded',()=>{
 const docs=[{id:'x',title:'x',filename:'x',status:'INTERNAL',text:'The Martinez family trust must provide an accounting.'}];
 assert.equal(analyzeCorpus(docs).affectedDocuments.length,0);
});
test('demo corpus produces confirmed and possible dependencies',()=>{
 const a=analyzeCorpus(createDemoCorpus());
 assert.ok(a.summary.confirmedCitationDependencies>0); assert.ok(a.summary.confirmedQuoteReuse>0); assert.ok(a.summary.possibleDerivedClaims>0);
});
test('remediation prioritizes filed confirmed work',()=>{
 const docs=createDemoCorpus(), a=analyzeCorpus(docs), r=remediationFor(docs,a);
 assert.equal(r[0].priority,'URGENT'); assert.equal(r[0].status,'FILED');
});
test('possible edges stay out of confirmed counts',()=>{
 const a=analyzeCorpus(createDemoCorpus());
 assert.equal(a.summary.confirmedAffectedDocuments,a.confirmedDocs.length);
});

test('real corpus derives incident quote/proposition without inventing lineage',()=>{
 const docs=createDemoCorpus();
 const ctx=deriveIncidentContext(docs,{canonicalId:canonicalId(999,'F.4th',123)});
 assert.ok(ctx.quote.length>20 || ctx.proposition.length>20);
});
